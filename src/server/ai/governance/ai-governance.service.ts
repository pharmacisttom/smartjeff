import { prisma } from "@/lib/prisma";
import { platformLogger } from "@/server/platform/logging/structured-logger";

export interface GovernanceMetrics {
  totalProposals: number;
  approvedCount: number;
  rejectedCount: number;
  completedCount: number;
  failedCount: number;
  blockedAttemptsCount: number;
  aiActionsEnabled: boolean;
}

export class AIGovernanceService {
  private static isGlobalKillSwitchActive = false;

  /**
   * Checks if AI write actions are globally enabled.
   */
  public static areActionsEnabled(): boolean {
    if (process.env.AI_ACTIONS_ENABLED === "false" || this.isGlobalKillSwitchActive) {
      return false;
    }
    return true;
  }

  /**
   * Toggles the global kill switch.
   */
  public static setKillSwitch(active: boolean, triggeredBy = "Admin"): boolean {
    this.isGlobalKillSwitchActive = active;
    platformLogger.warn(`AI Actions Global Kill-Switch toggled to ${active ? "ACTIVE (MUTATIONS BLOCKED)" : "INACTIVE (MUTATIONS ALLOWED)"} by ${triggeredBy}`);
    return this.isGlobalKillSwitchActive;
  }

  /**
   * Records a security violation attempt by AI (e.g. prompt injection, unauthorized tool call, critical action request).
   */
  public static async recordSecurityEvent(params: {
    eventType: "UNAUTHORIZED_ACTION_ATTEMPT" | "DATA_SCOPE_VIOLATION" | "UNSAFE_PROPOSAL" | "HALLUCINATED_RESOURCE";
    userId?: string;
    agentCode?: string;
    actionType?: string;
    details: string;
  }) {
    platformLogger.warn(`[AI_SECURITY_EVENT] ${params.eventType} for agent ${params.agentCode || "unknown"}: ${params.details}`);

    // If severe repeat violation, record into platform incident table
    if (params.eventType === "UNAUTHORIZED_ACTION_ATTEMPT") {
      try {
        await prisma.platformIncident.create({
          data: {
            incidentNumber: `AI-SEC-${Date.now()}`,
            title: `AI Security Violation: ${params.eventType}`,
            service: "AI_COPILOT",
            severity: "SEV3",
            type: "SECURITY",
            status: "OPEN",
            commander: "AI Safety Officer",
            impactSummary: params.details,
            rootCause: `Attempted action "${params.actionType}" by user ${params.userId}`,
          },
        });
      } catch {
        // Fallback
      }
    }
  }

  /**
   * Aggregates governance KPI metrics.
   */
  public static async getMetrics(): Promise<GovernanceMetrics> {
    const proposals = await prisma.aIActionProposal.findMany();
    const totalProposals = proposals.length;
    const approvedCount = proposals.filter((p) => p.status === "APPROVED").length;
    const rejectedCount = proposals.filter((p) => p.status === "REJECTED").length;
    const completedCount = proposals.filter((p) => p.status === "COMPLETED").length;
    const failedCount = proposals.filter((p) => p.status === "FAILED").length;

    return {
      totalProposals,
      approvedCount,
      rejectedCount,
      completedCount,
      failedCount,
      blockedAttemptsCount: 0,
      aiActionsEnabled: this.areActionsEnabled(),
    };
  }

  /**
   * Initializes standard baseline AI Action Policies if empty.
   */
  public static async ensureBaselinePolicies() {
    const baselines = [
      { domain: "WORKFORCE", actionType: "CREATE_DRAFT_SCHEDULE", riskLevel: "MEDIUM", confirmationMode: "CONFIRM", allowedRolesJson: JSON.stringify(["ADMIN", "EXECUTIVE", "HR", "SITE_MANAGER"]) },
      { domain: "WORKFORCE", actionType: "PUBLISH_SCHEDULE", riskLevel: "HIGH", confirmationMode: "APPROVAL_WORKFLOW", allowedRolesJson: JSON.stringify(["ADMIN", "EXECUTIVE", "HR"]) },
      { domain: "PROCUREMENT", actionType: "CREATE_DRAFT_PR", riskLevel: "MEDIUM", confirmationMode: "CONFIRM", allowedRolesJson: JSON.stringify(["ADMIN", "EXECUTIVE", "PROCUREMENT_OFFICER", "SITE_MANAGER"]) },
      { domain: "PROCUREMENT", actionType: "SUBMIT_PR", riskLevel: "HIGH", confirmationMode: "APPROVAL_WORKFLOW", allowedRolesJson: JSON.stringify(["ADMIN", "EXECUTIVE", "PROCUREMENT_OFFICER"]) },
      { domain: "FINANCE", actionType: "APPROVE_PAYMENT", riskLevel: "CRITICAL", confirmationMode: "FORBIDDEN", allowedRolesJson: JSON.stringify([]) },
      { domain: "FINANCE", actionType: "APPROVE_PAYROLL", riskLevel: "CRITICAL", confirmationMode: "FORBIDDEN", allowedRolesJson: JSON.stringify([]) },
      { domain: "QHSE", actionType: "CREATE_DRAFT_CAPA", riskLevel: "MEDIUM", confirmationMode: "CONFIRM", allowedRolesJson: JSON.stringify(["ADMIN", "EXECUTIVE", "SAFETY_OFFICER", "QHSE_MANAGER"]) },
      { domain: "FLEET", actionType: "CREATE_DRAFT_TRIP", riskLevel: "LOW", confirmationMode: "CONFIRM", allowedRolesJson: JSON.stringify(["ADMIN", "EXECUTIVE", "FLEET_DISPATCHER"]) },
      { domain: "PROJECT", actionType: "CREATE_DRAFT_WORK_ORDER", riskLevel: "MEDIUM", confirmationMode: "CONFIRM", allowedRolesJson: JSON.stringify(["ADMIN", "EXECUTIVE", "PROJECT_MANAGER"]) },
    ];

    for (const b of baselines) {
      await prisma.aIPolicy.upsert({
        where: { actionType: b.actionType },
        update: {},
        create: b,
      });
    }
  }

  public static async listPolicies() {
    await this.ensureBaselinePolicies();
    return prisma.aIPolicy.findMany({ orderBy: { domain: "asc" } });
  }
}
