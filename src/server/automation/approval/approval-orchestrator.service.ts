import { prisma } from "@/lib/prisma";

export interface ApprovalTierRule {
  tier: number;
  minAmount?: number;
  maxAmount?: number;
  requiredRole: string;
  slaHours?: number;
}

export interface SoDRule {
  type: "CANNOT_APPROVE_OWN_REQUEST" | "CREATOR_CANNOT_PAY" | "OWNER_CANNOT_VERIFY";
  enabled: boolean;
}

export class ApprovalOrchestratorService {
  /**
   * Creates an approval request and determines the initial tier based on amount & threshold rules
   */
  public async createApprovalRequest(params: {
    approvalDefinitionCode: string;
    entityType: string;
    entityId: string;
    requesterId: string;
    amount?: number;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const def = await prisma.approvalWorkflowDefinition.findUnique({
      where: { code: params.approvalDefinitionCode },
    });

    if (!def || !def.active) {
      throw new Error(`Approval definition ${params.approvalDefinitionCode} is not active or found`);
    }

    const requestNumber = `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const dueAt = new Date(Date.now() + def.slaHours * 60 * 60 * 1000);

    return prisma.approvalRequest.create({
      data: {
        requestNumber,
        approvalDefinitionId: def.id,
        entityType: params.entityType,
        entityId: params.entityId,
        requesterId: params.requesterId,
        currentTier: 1,
        status: "PENDING",
        amount: params.amount || null,
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
        dueAt,
      },
    });
  }

  /**
   * Submits an approval decision with Separation of Duties (SoD) enforcement and delegation check
   */
  public async submitDecision(params: {
    approvalRequestId: string;
    approverId: string;
    approverRole: string;
    decision: "APPROVED" | "REJECTED" | "RETURNED" | "CANCELLED";
    comments?: string;
  }): Promise<{
    success: boolean;
    requestStatus: string;
    currentTier: number;
    message?: string;
  }> {
    const req = await prisma.approvalRequest.findUnique({
      where: { id: params.approvalRequestId },
    });

    if (!req) {
      throw new Error(`Approval request ${params.approvalRequestId} not found`);
    }

    if (req.status !== "PENDING") {
      throw new Error(`Approval request is already in status: ${req.status}`);
    }

    const def = await prisma.approvalWorkflowDefinition.findUnique({
      where: { id: req.approvalDefinitionId },
    });

    if (!def) {
      throw new Error(`Approval definition not found`);
    }

    // 1. Separation of Duties enforcement: Requester cannot approve their own request
    if (params.decision === "APPROVED" && req.requesterId === params.approverId) {
      throw new Error("Separation of Duties violation: Requester cannot approve their own request.");
    }

    // 2. Delegation check: Did someone delegate their approval to this user?
    const now = new Date();
    const delegation = await prisma.approvalDelegation.findFirst({
      where: {
        toUserId: params.approverId,
        active: true,
        startAt: { lte: now },
        endAt: { gte: now },
        OR: [{ scope: "ALL" }, { scope: req.entityType }],
      },
    });

    // Record the decision
    await prisma.approvalDecision.create({
      data: {
        approvalRequestId: req.id,
        tier: req.currentTier,
        approverId: params.approverId,
        delegatedFromId: delegation ? delegation.fromUserId : null,
        decision: params.decision,
        comments: params.comments || null,
      },
    });

    if (params.decision === "REJECTED" || params.decision === "RETURNED" || params.decision === "CANCELLED") {
      await prisma.approvalRequest.update({
        where: { id: req.id },
        data: {
          status: params.decision,
          completedAt: new Date(),
        },
      });
      return { success: true, requestStatus: params.decision, currentTier: req.currentTier };
    }

    // If APPROVED, check if there are subsequent tiers required based on amount thresholds
    const tiers: ApprovalTierRule[] = JSON.parse(def.thresholdRulesJson || "[]");
    const nextTierRule = tiers.find((t) => t.tier === req.currentTier + 1);

    const amount = req.amount || 0;
    const requiresNextTier = nextTierRule && (!nextTierRule.minAmount || amount >= nextTierRule.minAmount);

    if (requiresNextTier) {
      const nextDueAt = new Date(Date.now() + (nextTierRule.slaHours || def.slaHours) * 3600000);
      await prisma.approvalRequest.update({
        where: { id: req.id },
        data: {
          currentTier: req.currentTier + 1,
          dueAt: nextDueAt,
        },
      });
      return {
        success: true,
        requestStatus: "PENDING",
        currentTier: req.currentTier + 1,
        message: `Advanced to Tier ${req.currentTier + 1} for ${nextTierRule.requiredRole}`,
      };
    } else {
      await prisma.approvalRequest.update({
        where: { id: req.id },
        data: {
          status: "APPROVED",
          completedAt: new Date(),
        },
      });
      return {
        success: true,
        requestStatus: "APPROVED",
        currentTier: req.currentTier,
        message: "Final approval completed",
      };
    }
  }

  /**
   * Scans overdue approval requests and flags/notifies for SLA escalation
   */
  public async checkSlaAndEscalations(): Promise<{ escalatedCount: number }> {
    const now = new Date();
    const overdueRequests = await prisma.approvalRequest.findMany({
      where: {
        status: "PENDING",
        dueAt: { lt: now },
      },
    });

    return { escalatedCount: overdueRequests.length };
  }
}

export const approvalOrchestrator = new ApprovalOrchestratorService();
