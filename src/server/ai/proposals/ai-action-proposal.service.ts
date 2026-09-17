import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { AgentRiskService, RiskLevel } from "../risk/agent-risk.service";
import { AIConfirmationPolicyService, ConfirmationMode } from "../policy/ai-confirmation-policy.service";
import { AIActionImpactService } from "./ai-action-impact.service";

export interface CreateProposalInput {
  conversationId?: string;
  userId: string;
  agentCode: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  inputPayload: Record<string, any>;
  previewData: {
    title: string;
    summary: string;
    affectedRecords?: Array<{ type: string; id: string; name?: string }>;
    changeSet?: Array<{ field: string; oldValue: any; newValue: any }>;
    conflicts?: string[];
  };
  permissionRequired: string;
  expiresInMinutes?: number;
}

export class AIActionProposalService {
  /**
   * Creates a structured Action Proposal ready for human review and confirmation.
   */
  public static async createProposal(input: CreateProposalInput) {
    const riskEval = AgentRiskService.evaluateRisk({
      actionType: input.actionType,
      domain: input.resourceType,
      recordCount: input.previewData.affectedRecords?.length || 1,
      amount: input.inputPayload.amount || input.inputPayload.estimatedTotalAmount || 0,
    });

    const confirmationMode: ConfirmationMode = AIConfirmationPolicyService.getConfirmationMode(
      riskEval.riskLevel,
      input.actionType
    );

    // Strict Critical Action Rejection
    if (confirmationMode === "FORBIDDEN" || riskEval.isCriticalBlocked) {
      throw new Error(
        `Action "${input.actionType}" is classified as CRITICAL and is strictly forbidden from AI autonomous or proposal execution. Please navigate to the standard enterprise workflow.`
      );
    }

    // Impact Analysis
    const impactReport = AIActionImpactService.analyzeImpact({
      actionType: input.actionType,
      payload: input.inputPayload,
    });

    // Generate Proposal Number & Idempotency Key
    const count = await prisma.aIActionProposal.count();
    const proposalNumber = `PROP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const idempotencyKey = `idemp_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + (input.expiresInMinutes || 30) * 60 * 1000);

    const record = await prisma.aIActionProposal.create({
      data: {
        proposalNumber,
        conversationId: input.conversationId,
        userId: input.userId,
        agentCode: input.agentCode,
        actionType: input.actionType,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        inputJson: JSON.stringify(input.inputPayload),
        previewJson: JSON.stringify({
          ...input.previewData,
          conflicts: [...(input.previewData.conflicts || []), ...impactReport.warnings],
        }),
        impactJson: JSON.stringify(impactReport),
        riskLevel: riskEval.riskLevel,
        confirmationMode,
        permissionRequired: input.permissionRequired,
        status: "READY_FOR_REVIEW",
        idempotencyKey,
        expiresAt,
        source: "AI_ASSISTED",
      },
    });

    return record;
  }

  /**
   * Approves or confirms a proposal by human supervisor.
   */
  public static async approveProposal(proposalId: string, approverUserId: string) {
    const proposal = await prisma.aIActionProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new Error("Proposal not found");

    if (new Date() > new Date(proposal.expiresAt)) {
      await prisma.aIActionProposal.update({
        where: { id: proposalId },
        data: { status: "EXPIRED" },
      });
      throw new Error("Proposal has expired. Please request the AI to generate a refreshed proposal.");
    }

    if (proposal.status !== "READY_FOR_REVIEW") {
      throw new Error(`Proposal is not ready for review (current status: ${proposal.status})`);
    }

    return prisma.aIActionProposal.update({
      where: { id: proposalId },
      data: {
        status: "APPROVED",
        approvedBy: approverUserId,
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Rejects a proposal.
   */
  public static async rejectProposal(proposalId: string, reason: string) {
    return prisma.aIActionProposal.update({
      where: { id: proposalId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
      },
    });
  }

  public static async getProposal(id: string) {
    return prisma.aIActionProposal.findUnique({ where: { id } });
  }

  public static async listProposals(limit = 20) {
    return prisma.aIActionProposal.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
