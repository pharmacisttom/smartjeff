import { prisma } from "@/lib/prisma";
import { getApprovedAction, ActionType } from "./workflow-action-registry";
import { EventEnvelope } from "../events/event-envelope";

export interface WorkflowCondition {
  field: string;
  operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "GREATER_THAN_OR_EQUAL" | "LESS_THAN_OR_EQUAL" | "CONTAINS" | "IN";
  value: any;
}

export interface WorkflowStepConfig {
  id: string;
  name: string;
  stepType: "ACTION" | "CONDITION" | "APPROVAL" | "NOTIFICATION" | "DELAY" | "WEBHOOK" | "CREATE_TASK" | "UPDATE_RECORD" | "END";
  actionType?: ActionType;
  condition?: WorkflowCondition;
  config?: Record<string, any>;
  nextStepId?: string;
  onTrueStepId?: string;
  onFalseStepId?: string;
}

export interface WorkflowDefinitionData {
  startStepId: string;
  steps: WorkflowStepConfig[];
}

export class WorkflowEngineService {
  /**
   * Safely evaluates a condition against context without eval()
   */
  public evaluateCondition(condition: WorkflowCondition, context: Record<string, any>): boolean {
    const keys = condition.field.split(".");
    let targetVal: any = context;
    for (const k of keys) {
      if (targetVal == null) break;
      targetVal = targetVal[k];
    }

    const val = condition.value;

    switch (condition.operator) {
      case "EQUALS":
        return String(targetVal) === String(val);
      case "NOT_EQUALS":
        return String(targetVal) !== String(val);
      case "GREATER_THAN":
        return Number(targetVal) > Number(val);
      case "GREATER_THAN_OR_EQUAL":
        return Number(targetVal) >= Number(val);
      case "LESS_THAN":
        return Number(targetVal) < Number(val);
      case "LESS_THAN_OR_EQUAL":
        return Number(targetVal) <= Number(val);
      case "CONTAINS":
        if (typeof targetVal === "string") {
          return targetVal.includes(String(val));
        }
        if (Array.isArray(targetVal)) {
          return targetVal.includes(val);
        }
        return false;
      case "IN":
        return Array.isArray(val) && val.includes(targetVal);
      default:
        return false;
    }
  }

  /**
   * Validates workflow definition structure before publishing
   */
  public validateDefinition(definition: WorkflowDefinitionData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!definition.startStepId) {
      errors.push("startStepId is required.");
    }
    if (!definition.steps || !Array.isArray(definition.steps) || definition.steps.length === 0) {
      errors.push("Workflow must contain at least one step.");
      return { valid: false, errors };
    }

    const stepMap = new Map<string, WorkflowStepConfig>();
    for (const step of definition.steps) {
      if (!step.id) {
        errors.push("Every step must have an id.");
      }
      stepMap.set(step.id, step);

      if (step.stepType === "ACTION") {
        if (!step.actionType || !getApprovedAction(step.actionType)) {
          errors.push(`Step ${step.id} has invalid or unapproved actionType: ${step.actionType}`);
        }
      }
    }

    if (definition.startStepId && !stepMap.has(definition.startStepId)) {
      errors.push(`startStepId "${definition.startStepId}" does not exist in steps.`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Publishes workflow definition, migrating status to ACTIVE
   */
  public async publishWorkflow(
    id: string,
    approvedBy: string,
    changeReason?: string
  ): Promise<{ success: boolean; errors?: string[] }> {
    const wf = await prisma.workflowDefinition.findUnique({ where: { id } });
    if (!wf) {
      return { success: false, errors: ["Workflow definition not found"] };
    }

    let def: WorkflowDefinitionData;
    try {
      def = JSON.parse(wf.definitionJson);
    } catch {
      return { success: false, errors: ["Invalid JSON in definitionJson"] };
    }

    const validation = this.validateDefinition(def);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    await prisma.workflowDefinition.update({
      where: { id },
      data: {
        status: "ACTIVE",
        approvedBy,
        approvedAt: new Date(),
        changeReason: changeReason || "Published via Workflow Engine",
      },
    });

    return { success: true };
  }

  /**
   * Triggers active workflows subscribed to an event
   */
  public async triggerEventWorkflows(event: EventEnvelope): Promise<string[]> {
    const activeWorkflows = await prisma.workflowDefinition.findMany({
      where: {
        triggerEvent: event.eventType,
        status: "ACTIVE",
      },
    });

    const instanceIds: string[] = [];
    for (const def of activeWorkflows) {
      const instanceId = await this.executeWorkflow(def.id, event.payload, {
        correlationId: event.correlationId,
        businessEntityType: event.aggregateType,
        businessEntityId: event.aggregateId,
        triggerEvent: event.eventType,
      });
      if (instanceId) {
        instanceIds.push(instanceId);
      }
    }

    return instanceIds;
  }

  /**
   * Executes a workflow definition instance
   */
  public async executeWorkflow(
    definitionId: string,
    inputPayload: Record<string, any>,
    options: {
      correlationId?: string;
      businessEntityType?: string;
      businessEntityId?: string;
      triggerEvent?: string;
      dryRun?: boolean;
    } = {}
  ): Promise<string> {
    const wfDef = await prisma.workflowDefinition.findUnique({ where: { id: definitionId } });
    if (!wfDef) {
      throw new Error(`Workflow definition ${definitionId} not found`);
    }

    const defData: WorkflowDefinitionData = JSON.parse(wfDef.definitionJson);
    const stepMap = new Map<string, WorkflowStepConfig>(defData.steps.map((s) => [s.id, s]));

    const instanceNumber = `WFI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const context: Record<string, any> = { ...inputPayload, ...options };

    if (options.dryRun) {
      // Dry Run execution simulation
      return `DRY_RUN_COMPLETED_${instanceNumber}`;
    }

    const instance = await prisma.workflowInstance.create({
      data: {
        instanceNumber,
        workflowDefinitionId: wfDef.id,
        version: wfDef.version,
        businessEntityType: options.businessEntityType || null,
        businessEntityId: options.businessEntityId || null,
        status: "RUNNING",
        contextJson: JSON.stringify(context),
        correlationId: options.correlationId || null,
        startedAt: new Date(),
      },
    });

    let currentStepId: string | undefined = defData.startStepId;
    let stepCount = 0;
    const maxSteps = 50; // loop protection

    try {
      while (currentStepId && stepCount < maxSteps) {
        stepCount++;
        const step = stepMap.get(currentStepId);
        if (!step || step.stepType === "END") {
          break;
        }

        const stepStartTime = Date.now();
        let stepStatus = "SUCCESS";
        let stepError: string | undefined;
        let stepOutput: Record<string, any> = {};

        if (step.stepType === "CONDITION") {
          const matched = step.condition ? this.evaluateCondition(step.condition, context) : false;
          stepOutput = { matched };
          currentStepId = matched ? step.onTrueStepId : step.onFalseStepId;
        } else if (step.stepType === "ACTION" && step.actionType) {
          const action = getApprovedAction(step.actionType);
          if (action) {
            const res = await action.execute({
              workflowInstanceId: instance.id,
              correlationId: options.correlationId,
              triggerEvent: options.triggerEvent,
              payload: context,
              stepConfig: step.config || {},
            });
            if (res.success) {
              stepOutput = res.output || {};
              Object.assign(context, stepOutput);
            } else {
              stepStatus = "FAILED";
              stepError = res.error || "Action execution failed";
            }
          }
          currentStepId = step.nextStepId;
        } else {
          currentStepId = step.nextStepId;
        }

        const durationMs = Date.now() - stepStartTime;

        // Record execution step
        await prisma.workflowExecution.create({
          data: {
            workflowInstanceId: instance.id,
            stepId: step.id,
            stepType: step.stepType,
            status: stepStatus,
            inputJson: JSON.stringify(step.config || {}),
            outputJson: JSON.stringify(stepOutput),
            error: stepError || null,
            durationMs,
            completedAt: new Date(),
          },
        });

        if (stepStatus === "FAILED") {
          await prisma.workflowInstance.update({
            where: { id: instance.id },
            data: {
              status: "FAILED",
              error: stepError,
              completedAt: new Date(),
              contextJson: JSON.stringify(context),
            },
          });
          return instance.id;
        }
      }

      await prisma.workflowInstance.update({
        where: { id: instance.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          contextJson: JSON.stringify(context),
        },
      });

      return instance.id;
    } catch (err: any) {
      await prisma.workflowInstance.update({
        where: { id: instance.id },
        data: {
          status: "FAILED",
          error: err?.message || String(err),
          completedAt: new Date(),
        },
      });
      return instance.id;
    }
  }

  /**
   * Dry-run simulation for testing workflows before activation
   */
  public async simulateWorkflow(
    definition: WorkflowDefinitionData,
    samplePayload: Record<string, any>
  ): Promise<{
    success: boolean;
    executedSteps: Array<{
      stepId: string;
      name: string;
      stepType: string;
      matched?: boolean;
      actionType?: string;
    }>;
  }> {
    const executedSteps: any[] = [];
    const stepMap = new Map<string, WorkflowStepConfig>(definition.steps.map((s) => [s.id, s]));

    let currentStepId: string | undefined = definition.startStepId;
    let stepCount = 0;
    const context = { ...samplePayload };

    while (currentStepId && stepCount < 50) {
      stepCount++;
      const step = stepMap.get(currentStepId);
      if (!step || step.stepType === "END") {
        executedSteps.push({ stepId: step?.id || "END", name: step?.name || "End", stepType: "END" });
        break;
      }

      if (step.stepType === "CONDITION") {
        const matched = step.condition ? this.evaluateCondition(step.condition, context) : false;
        executedSteps.push({
          stepId: step.id,
          name: step.name,
          stepType: step.stepType,
          matched,
        });
        currentStepId = matched ? step.onTrueStepId : step.onFalseStepId;
      } else {
        executedSteps.push({
          stepId: step.id,
          name: step.name,
          stepType: step.stepType,
          actionType: step.actionType,
        });
        currentStepId = step.nextStepId;
      }
    }

    return { success: true, executedSteps };
  }
}

export const workflowEngine = new WorkflowEngineService();
