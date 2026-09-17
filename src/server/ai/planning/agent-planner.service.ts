import { z } from "zod";
import { RiskLevel, AgentRiskService } from "../risk/agent-risk.service";
import { AIConfirmationPolicyService, ConfirmationMode } from "../policy/ai-confirmation-policy.service";

export const PlanStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  description: z.string().min(1),
  toolName: z.string().min(1),
  inputParameters: z.record(z.any()).default({}),
  dependencies: z.array(z.number()).default([]),
});

export const AgentPlanSchema = z.object({
  goal: z.string().min(1),
  agentCode: z.string().min(1),
  domain: z.string().min(1),
  steps: z.array(PlanStepSchema).max(8), // Loop protection: max 8 steps
  overallRisk: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  confirmationMode: z.enum(["NONE", "CONFIRM", "APPROVAL_WORKFLOW", "FORBIDDEN"]),
  expectedOutput: z.string().min(1),
});

export type AgentPlan = z.infer<typeof AgentPlanSchema>;

export class AgentPlannerService {
  /**
   * Translates a user request and intent into a structured execution plan.
   */
  public static createPlan(params: {
    userGoal: string;
    agentCode: string;
    domain: string;
    proposedActionType?: string;
    suggestedSteps: Array<{
      description: string;
      toolName: string;
      inputParameters?: Record<string, any>;
    }>;
  }): AgentPlan {
    const actionType = params.proposedActionType || "GENERAL_QUERY";
    const riskEval = AgentRiskService.evaluateRisk({
      actionType,
      domain: params.domain,
    });

    const confirmationMode = AIConfirmationPolicyService.getConfirmationMode(riskEval.riskLevel, actionType);

    const steps = params.suggestedSteps.slice(0, 8).map((step, idx) => ({
      stepNumber: idx + 1,
      description: step.description,
      toolName: step.toolName,
      inputParameters: step.inputParameters || {},
      dependencies: idx > 0 ? [idx] : [],
    }));

    return {
      goal: params.userGoal,
      agentCode: params.agentCode,
      domain: params.domain,
      steps,
      overallRisk: riskEval.riskLevel,
      confirmationMode,
      expectedOutput: `Executed ${steps.length} steps to achieve goal: ${params.userGoal}`,
    };
  }

  /**
   * Validates that all steps in a plan comply with allowed tools and risk constraints.
   */
  public static validatePlan(plan: AgentPlan, allowedTools: string[], maxAllowedRisk: RiskLevel): {
    valid: boolean;
    reason?: string;
  } {
    // 1. Check for Forbidden Critical Risk
    if (plan.overallRisk === "CRITICAL" || plan.confirmationMode === "FORBIDDEN") {
      return {
        valid: false,
        reason: "Plan includes CRITICAL risk action which is strictly forbidden from AI autonomous execution.",
      };
    }

    // 2. Check risk ceiling
    const RISK_RANK: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    if (RISK_RANK[plan.overallRisk] > RISK_RANK[maxAllowedRisk]) {
      return {
        valid: false,
        reason: `Plan risk level (${plan.overallRisk}) exceeds agent maximum allowed risk ceiling (${maxAllowedRisk}).`,
      };
    }

    // 3. Check allowed tools
    for (const step of plan.steps) {
      if (!allowedTools.includes(step.toolName)) {
        return {
          valid: false,
          reason: `Tool "${step.toolName}" is not in the allowed tools list for agent ${plan.agentCode}.`,
        };
      }
    }

    return { valid: true };
  }
}
