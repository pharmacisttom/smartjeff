import { prisma } from "@/lib/prisma";
import { AIUserContext } from "../security/ai-authorization.service";
import { SpecializedAgentRegistry } from "../agents/agent-registry";
import { AgentContextService } from "../context/agent-context.service";
import { AgentPlannerService, AgentPlan } from "../planning/agent-planner.service";
import { AgentToolAuthorizationService } from "../security/agent-tool-authorization.service";
import { AIActionProposalService } from "../proposals/ai-action-proposal.service";
import { AIGovernanceService } from "../governance/ai-governance.service";
import { platformLogger } from "@/server/platform/logging/structured-logger";

// Pre-import all specialized agents to ensure registration
import "../agents/workforce.agent";
import "../agents/procurement.agent";
import "../agents/fleet.agent";
import "../agents/project.agent";
import "../agents/crm.agent";
import "../agents/qhse.agent";
import "../agents/finance.agent";
import "../agents/platform.agent";

export interface AgentRuntimeRequest {
  userGoal: string;
  agentCode?: string;
  conversationId?: string;
  resourceContext?: {
    type?: string;
    id?: string;
    metadata?: Record<string, any>;
  };
}

export interface AgentRuntimeResponse {
  success: boolean;
  agentCode: string;
  plan: AgentPlan;
  proposal?: any;
  explanation: string;
  error?: string;
}

export class AgentRuntimeService {
  /**
   * Main runtime entry point for constrained agentic operations.
   */
  public static async executeAgent(
    request: AgentRuntimeRequest,
    user: AIUserContext
  ): Promise<AgentRuntimeResponse> {
    const startTime = Date.now();
    const { userGoal, conversationId, resourceContext } = request;

    // 1. Check Global Actions Kill-Switch
    if (!AIGovernanceService.areActionsEnabled()) {
      return {
        success: false,
        agentCode: request.agentCode || "ROUTER",
        plan: AgentPlannerService.createPlan({
          userGoal,
          agentCode: "ROUTER",
          domain: "GENERAL",
          suggestedSteps: [],
        }),
        explanation: "AI Agent Actions are temporarily disabled by the system administrator (Kill Switch Active).",
        error: "AI_ACTIONS_DISABLED",
      };
    }

    // 2. Select Agent based on requested code or domain keywords
    const agentCode = this.resolveAgentCode(userGoal, request.agentCode);
    const agent = SpecializedAgentRegistry.getAgent(agentCode);

    if (!agent) {
      throw new Error(`Specialized Agent "${agentCode}" not found in registry`);
    }

    if (agent.status !== "ACTIVE") {
      throw new Error(`Agent "${agent.name}" is currently disabled by system policy`);
    }

    // 3. Build Safe Minimized Context
    const context = AgentContextService.buildContext(user, resourceContext);

    // 4. Execute Specialized Agent Intent Processing
    try {
      const result = await agent.processIntent(userGoal, user, resourceContext?.metadata);

      // Validate Plan against allowed tools and risk constraints
      const planValidation = AgentPlannerService.validatePlan(
        result.plan,
        agent.allowedTools,
        agent.maxRiskLevel
      );

      if (!planValidation.valid) {
        await AIGovernanceService.recordSecurityEvent({
          eventType: "UNSAFE_PROPOSAL",
          userId: user.userId,
          agentCode: agent.code,
          details: planValidation.reason || "Plan validation failed",
        });
        throw new Error(`Plan validation rejected: ${planValidation.reason}`);
      }

      // 5. If agent produced a proposed action, create structured proposal record
      let proposalRecord: any = null;
      if (result.proposedAction) {
        proposalRecord = await AIActionProposalService.createProposal({
          conversationId,
          userId: user.userId || "system-user",
          agentCode: agent.code,
          actionType: result.proposedAction.actionType,
          resourceType: result.proposedAction.resourceType,
          inputPayload: result.proposedAction.inputPayload,
          previewData: result.proposedAction.previewData,
          permissionRequired: result.proposedAction.permissionRequired,
        });
      }

      // 6. Record Agent Decision Log
      const executionMs = Date.now() - startTime;
      await prisma.agentDecisionLog.create({
        data: {
          agentCode: agent.code,
          conversationId,
          userId: user.userId,
          userGoal,
          planJson: JSON.stringify(result.plan),
          toolsUsedJson: JSON.stringify(result.plan.steps.map((s) => s.toolName)),
          proposalId: proposalRecord?.id || null,
          riskLevel: result.plan.overallRisk,
          confirmationMode: result.plan.confirmationMode,
          outcome: "SUCCESS",
          executionMs,
        },
      });

      return {
        success: true,
        agentCode: agent.code,
        plan: result.plan,
        proposal: proposalRecord,
        explanation: result.explanation,
      };
    } catch (err: any) {
      const executionMs = Date.now() - startTime;
      platformLogger.warn(`Agent runtime error for ${agent.code}: ${err.message}`);

      return {
        success: false,
        agentCode: agent.code,
        plan: AgentPlannerService.createPlan({
          userGoal,
          agentCode: agent.code,
          domain: agent.domain,
          suggestedSteps: [],
        }),
        explanation: `ไม่สามารถดำเนินการได้: ${err.message}`,
        error: err.message,
      };
    }
  }

  /**
   * Resolves appropriate agent code based on explicit code or user text.
   */
  private static resolveAgentCode(goal: string, explicitCode?: string): string {
    if (explicitCode && SpecializedAgentRegistry.getAgent(explicitCode)) {
      return explicitCode;
    }

    const lower = goal.toLowerCase();
    if (/ตารางกะ|เวร|พนักงาน|กำลังพล|คนทำงาน|ขาดแคลนคน|shift|schedule|workforce/i.test(lower)) {
      return "WORKFORCE_AGENT";
    }
    if (/ขอซื้อ|ซื้อของ|วัสดุ|จัดซื้อ|pr|stock|inventory|shortage/i.test(lower)) {
      return "PROCUREMENT_AGENT";
    }
    if (/รถ|จัดรถ|ขนส่ง|คนขับ|route|trip|fleet/i.test(lower)) {
      return "FLEET_AGENT";
    }
    if (/โครงการ|work order|งานติดตั้ง|milestone|site plan|project/i.test(lower)) {
      return "PROJECT_AGENT";
    }
    if (/ลูกค้า|ขาย|เสนอราคา|lead|crm|follow-up|pipeline/i.test(lower)) {
      return "CRM_AGENT";
    }
    if (/ความปลอดภัย|capa|อุบัติการณ์|incident|safety|qhse/i.test(lower)) {
      return "QHSE_AGENT";
    }
    if (/หนี้|ตามหนี้|collection|invoice|cash|การเงิน|finance/i.test(lower)) {
      return "FINANCE_AGENT";
    }
    if (/ระบบ|health|backup|restore|dr|vps|server|sre/i.test(lower)) {
      return "PLATFORM_AGENT";
    }

    return "WORKFORCE_AGENT"; // Default fallback agent
  }
}
