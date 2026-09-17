import { prisma } from "@/lib/prisma";

export interface CreateTenderDto {
  clientId: string;
  opportunityId?: string;
  title: string;
  referenceNo?: string;
  publishDate?: Date;
  submissionDeadline: Date;
  clarificationDeadline?: Date;
  estimatedValue?: number;
  submissionMethod?: string;
  ownerId: string;
}

export class TenderService {
  static async getTenders(filter?: { status?: string; clientId?: string; ownerId?: string }) {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.clientId) where.clientId = filter.clientId;
    if (filter?.ownerId) where.ownerId = filter.ownerId;

    return prisma.tender.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, code: true } },
        opportunity: { select: { id: true, opportunityNo: true, name: true, stage: true } },
        checklist: true,
      },
      orderBy: { submissionDeadline: "asc" },
    });
  }

  static async getTenderById(id: string) {
    return prisma.tender.findUnique({
      where: { id },
      include: {
        client: true,
        opportunity: { include: { estimates: true, quotations: true } },
        checklist: true,
      },
    });
  }

  static async createTender(data: CreateTenderDto) {
    const count = await prisma.tender.count();
    const tenderNo = `TND-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const tender = await prisma.tender.create({
      data: {
        tenderNo,
        clientId: data.clientId,
        opportunityId: data.opportunityId,
        title: data.title,
        referenceNo: data.referenceNo,
        publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
        submissionDeadline: new Date(data.submissionDeadline),
        clarificationDeadline: data.clarificationDeadline ? new Date(data.clarificationDeadline) : undefined,
        estimatedValue: data.estimatedValue,
        submissionMethod: data.submissionMethod || "ONLINE",
        status: "IDENTIFIED",
        ownerId: data.ownerId,
      },
    });

    // Seed standard tender checklists
    const defaultChecklist = [
      { category: "TECHNICAL", item: "Technical Proposal & Work Methodology", mandatory: true },
      { category: "COMMERCIAL", item: "Commercial Proposal & Price Schedule", mandatory: true },
      { category: "COMPANY_DOCS", item: "Company Registration & Tax Certificate", mandatory: true },
      { category: "INSURANCE", item: "Public Liability & Workers Compensation Insurance", mandatory: true },
      { category: "CERTIFICATE", item: "Staff Professional Certifications / Licenses", mandatory: false },
      { category: "PRICING", item: "Itemized BOQ & Detailed Cost Breakdown", mandatory: true },
      { category: "BID_BOND", item: "Bank Guarantee / Bid Bond", mandatory: false },
    ];

    for (const item of defaultChecklist) {
      await prisma.tenderChecklist.create({
        data: {
          tenderId: tender.id,
          category: item.category,
          item: item.item,
          mandatory: item.mandatory,
          status: "PENDING",
        },
      });
    }

    return tender;
  }

  static async updateTender(id: string, data: Partial<CreateTenderDto> & { status?: string }) {
    return prisma.tender.update({
      where: { id },
      data: {
        ...data,
        submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : undefined,
      },
    });
  }

  /**
   * Human-Controlled Go / No-Go Decision
   */
  static async recordGoNoGo(
    id: string,
    data: {
      decision: "GO" | "NO_GO";
      reason: string;
      reviewedBy: string;
    }
  ) {
    return prisma.tender.update({
      where: { id },
      data: {
        goNoGoDecision: data.decision,
        goNoGoReason: data.reason,
        goNoGoReviewedBy: data.reviewedBy,
        goNoGoReviewedAt: new Date(),
        status: data.decision === "GO" ? "PREPARING" : "NO_GO",
      },
    });
  }

  static async updateChecklistItem(id: string, status: string, notes?: string, attachmentUrl?: string) {
    return prisma.tenderChecklist.update({
      where: { id },
      data: { status, notes, attachmentUrl },
    });
  }

  static async submitTender(
    id: string,
    data: { submittedBy: string; submissionReference?: string }
  ) {
    return prisma.tender.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        submittedBy: data.submittedBy,
        submissionReference: data.submissionReference,
      },
    });
  }

  /**
   * Deadlines Closing Soon (14d, 7d, 3d, 1d)
   */
  static async getTenderDeadlines(daysThreshold = 14) {
    const now = new Date();
    const maxDate = new Date();
    maxDate.setDate(now.getDate() + daysThreshold);

    const upcoming = await prisma.tender.findMany({
      where: {
        status: { in: ["IDENTIFIED", "REVIEWING", "GO", "PREPARING"] },
        submissionDeadline: { gte: now, lte: maxDate },
      },
      include: { client: { select: { name: true } } },
      orderBy: { submissionDeadline: "asc" },
    });

    return upcoming.map((t) => {
      const diffTime = new Date(t.submissionDeadline).getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...t,
        daysRemaining: diffDays,
        urgency: diffDays <= 1 ? "CRITICAL" : diffDays <= 3 ? "HIGH" : diffDays <= 7 ? "MEDIUM" : "LOW",
      };
    });
  }
}
