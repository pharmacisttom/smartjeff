import { prisma } from "@/lib/prisma";

export interface CreateOpportunityDto {
  clientId: string;
  leadId?: string;
  name: string;
  description?: string;
  ownerId: string;
  estimatedContractValue?: number;
  expectedStartDate?: Date;
  expectedCloseDate?: Date;
  stage?: string;
  source?: string;
  probability?: number;
}

export class OpportunityService {
  static async getOpportunities(filter?: {
    clientId?: string;
    leadId?: string;
    stage?: string;
    status?: string;
    ownerId?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filter?.clientId) where.clientId = filter.clientId;
    if (filter?.leadId) where.leadId = filter.leadId;
    if (filter?.stage) where.stage = filter.stage;
    if (filter?.status) where.status = filter.status;
    if (filter?.ownerId) where.ownerId = filter.ownerId;
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search } },
        { opportunityNo: { contains: filter.search } },
        { client: { name: { contains: filter.search } } },
      ];
    }

    return prisma.opportunity.findMany({
      where,
      include: {
        client: { select: { id: true, code: true, name: true } },
        lead: { select: { id: true, leadNo: true, companyName: true, contactName: true } },
        estimates: {
          select: { id: true, estimateNo: true, version: true, status: true, totalEstimatedCost: true, finalPrice: true },
          orderBy: { version: "desc" },
        },
        quotations: {
          select: { id: true, quotationNo: true, version: true, status: true, total: true },
          orderBy: { version: "desc" },
        },
        _count: {
          select: { requirements: true, surveys: true, estimates: true, quotations: true, activities: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getOpportunityById(id: string) {
    return prisma.opportunity.findUnique({
      where: { id },
      include: {
        client: true,
        lead: true,
        requirements: { orderBy: { priority: "asc" } },
        surveys: { orderBy: { surveyDate: "desc" } },
        estimates: {
          include: { lines: true, assumptions: true },
          orderBy: { version: "desc" },
        },
        quotations: {
          include: { items: true },
          orderBy: { version: "desc" },
        },
        activities: { orderBy: { scheduledAt: "desc" } },
        negotiations: { orderBy: { date: "desc" } },
        tenders: { include: { checklist: true } },
        handovers: true,
      },
    });
  }

  static async createOpportunity(data: CreateOpportunityDto) {
    const count = await prisma.opportunity.count();
    const opportunityNo = `OPP-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    return prisma.opportunity.create({
      data: {
        opportunityNo,
        clientId: data.clientId,
        leadId: data.leadId,
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        estimatedContractValue: data.estimatedContractValue || 0,
        expectedStartDate: data.expectedStartDate ? new Date(data.expectedStartDate) : undefined,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
        stage: data.stage || "DISCOVERY",
        source: data.source || "OTHER",
        probability: data.probability ?? 20,
        status: "OPEN",
      },
    });
  }

  static async updateOpportunity(id: string, data: Partial<CreateOpportunityDto>) {
    return prisma.opportunity.update({
      where: { id },
      data: {
        ...data,
        expectedStartDate: data.expectedStartDate ? new Date(data.expectedStartDate) : undefined,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
      },
    });
  }

  /**
   * Stage Progression with Validation Rules
   */
  static async updateStage(id: string, newStage: string, performedBy?: string) {
    const opp = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        requirements: true,
        estimates: true,
        quotations: true,
      },
    });

    if (!opp) throw new Error("Opportunity not found");

    // Stage Validation Checks
    if (newStage === "ESTIMATION" && opp.requirements.length === 0) {
      throw new Error("Validation Failed: Stage 'ESTIMATION' requires at least one requirement.");
    }

    if (newStage === "PROPOSAL") {
      const hasApprovedEstimate = opp.estimates.some((e) => e.status === "APPROVED");
      if (!hasApprovedEstimate) {
        throw new Error("Validation Failed: Stage 'PROPOSAL' requires an APPROVED cost estimate.");
      }
    }

    if (newStage === "AWAITING_DECISION") {
      const hasSentQuotation = opp.quotations.some((q) => q.status === "SENT" || q.status === "ACCEPTED");
      if (!hasSentQuotation) {
        throw new Error("Validation Failed: Stage 'AWAITING_DECISION' requires at least one SENT quotation.");
      }
    }

    if (newStage === "WON" && !opp.acceptedQuotationId && opp.status !== "WON") {
      const acceptedQuo = opp.quotations.find((q) => q.status === "ACCEPTED" || q.status === "SENT");
      if (!acceptedQuo) {
        throw new Error("Validation Failed: Cannot mark as WON without an accepted or sent quotation.");
      }
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data: {
        stage: newStage,
        status: newStage === "WON" ? "WON" : newStage === "LOST" ? "LOST" : opp.status,
      },
    });

    // Record activity audit
    await prisma.cRMActivity.create({
      data: {
        opportunityId: id,
        type: "NOTE",
        subject: `Stage Changed to ${newStage}`,
        description: `Stage transitioned from ${opp.stage} to ${newStage}`,
        scheduledAt: new Date(),
        completedAt: new Date(),
        ownerId: performedBy || opp.ownerId,
        status: "COMPLETED",
      },
    });

    return updated;
  }

  static async markWon(
    id: string,
    data: { acceptedQuotationId?: string; finalValue: number; notes?: string; performedBy?: string }
  ) {
    const opp = await prisma.opportunity.update({
      where: { id },
      data: {
        stage: "WON",
        status: "WON",
        wonDate: new Date(),
        acceptedQuotationId: data.acceptedQuotationId,
        finalValue: data.finalValue,
      },
    });

    if (data.acceptedQuotationId) {
      await prisma.salesQuotation.update({
        where: { id: data.acceptedQuotationId },
        data: { status: "ACCEPTED" },
      });
    }

    await prisma.cRMActivity.create({
      data: {
        opportunityId: id,
        type: "NOTE",
        subject: "Opportunity WON",
        description: `Deal closed won. Final Value: ${data.finalValue.toLocaleString()} THB. ${data.notes || ""}`,
        scheduledAt: new Date(),
        completedAt: new Date(),
        ownerId: data.performedBy || opp.ownerId,
        status: "COMPLETED",
      },
    });

    return opp;
  }

  static async markLost(
    id: string,
    data: { lostReason: string; competitor?: string; notes?: string; performedBy?: string }
  ) {
    return prisma.opportunity.update({
      where: { id },
      data: {
        stage: "LOST",
        status: "LOST",
        lostReason: data.lostReason,
        competitor: data.competitor,
        lostNotes: data.notes,
      },
    });
  }

  static async getPipelineSummary() {
    const opportunities = await prisma.opportunity.findMany({
      include: {
        client: { select: { id: true, name: true } },
        quotations: { select: { id: true, status: true, total: true } },
        estimates: { select: { id: true, status: true, totalEstimatedCost: true } },
      },
    });

    const stages = [
      "DISCOVERY",
      "QUALIFICATION",
      "SITE_SURVEY",
      "ESTIMATION",
      "PROPOSAL",
      "NEGOTIATION",
      "AWAITING_DECISION",
      "WON",
      "LOST",
    ];

    const pipelineByStage: Record<string, { count: number; totalValue: number; items: any[] }> = {};
    for (const stage of stages) {
      pipelineByStage[stage] = { count: 0, totalValue: 0, items: [] };
    }

    let openOpportunities = 0;
    let totalPipelineValue = 0;
    let wonThisMonth = 0;
    let wonValueThisMonth = 0;
    let lostThisMonth = 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    for (const opp of opportunities) {
      if (pipelineByStage[opp.stage]) {
        pipelineByStage[opp.stage].count += 1;
        pipelineByStage[opp.stage].totalValue += opp.estimatedContractValue || 0;
        pipelineByStage[opp.stage].items.push(opp);
      }

      if (opp.status === "OPEN") {
        openOpportunities += 1;
        totalPipelineValue += opp.estimatedContractValue || 0;
      } else if (opp.status === "WON" && opp.wonDate && new Date(opp.wonDate) >= startOfMonth) {
        wonThisMonth += 1;
        wonValueThisMonth += opp.finalValue || opp.estimatedContractValue || 0;
      } else if (opp.status === "LOST" && new Date(opp.updatedAt) >= startOfMonth) {
        lostThisMonth += 1;
      }
    }

    const quotationPending = await prisma.salesQuotation.count({
      where: { status: { in: ["DRAFT", "UNDER_REVIEW"] } },
    });

    return {
      openOpportunities,
      totalPipelineValue,
      quotationPending,
      wonThisMonth,
      wonValueThisMonth,
      lostThisMonth,
      pipelineByStage,
    };
  }
}
