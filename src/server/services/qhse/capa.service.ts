import { prisma } from "@/lib/prisma";

export interface CreateCAPAInput {
  findingId?: string;
  sourceType?: string; // FINDING | INCIDENT | AUDIT | RISK | COMPLAINT | OTHER
  sourceId?: string;
  title: string;
  description: string;
  actionType?: string; // CORRECTIVE | PREVENTIVE | IMMEDIATE | SYSTEMIC
  ownerId: string;
  dueDate: Date;
  priority?: string; // LOW | MEDIUM | HIGH | URGENT
  verificationMethod?: string;
}

export class CAPAService {
  static async generateCAPANo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.correctivePreventiveAction.count();
    return `CAPA-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Creates a Corrective / Preventive Action
   */
  static async createCAPA(input: CreateCAPAInput) {
    const capaNo = await this.generateCAPANo();

    const capa = await prisma.correctivePreventiveAction.create({
      data: {
        capaNo,
        findingId: input.findingId,
        sourceType: input.sourceType || "FINDING",
        sourceId: input.sourceId,
        title: input.title,
        description: input.description,
        actionType: input.actionType || "CORRECTIVE",
        ownerId: input.ownerId,
        dueDate: input.dueDate,
        priority: input.priority || "MEDIUM",
        status: "ASSIGNED",
        verificationMethod: input.verificationMethod,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CAPA_CREATED",
        entity: "CorrectivePreventiveAction",
        entityId: capa.id,
        metadata: JSON.stringify({
          capaNo: capa.capaNo,
          actionType: capa.actionType,
          ownerId: capa.ownerId,
          dueDate: capa.dueDate,
        }),
      },
    });

    return capa;
  }

  /**
   * Updates execution progress or uploads action evidence
   */
  static async updateProgress(id: string, evidenceJson: string, status: string = "IN_PROGRESS") {
    const capa = await prisma.correctivePreventiveAction.update({
      where: { id },
      data: {
        evidence: evidenceJson,
        status,
        updatedAt: new Date(),
      },
    });
    return capa;
  }

  /**
   * Verifies CAPA with Separation of Duties (owner cannot verify own work)
   */
  static async verifyCAPA(
    id: string,
    verifiedBy: string,
    notes: string,
    enforceSeparationOfDuties: boolean = true
  ) {
    const capa = await prisma.correctivePreventiveAction.findUnique({ where: { id } });
    if (!capa) throw new Error("CAPA not found");

    if (enforceSeparationOfDuties && capa.ownerId === verifiedBy) {
      throw new Error("Separation of Duties violation: CAPA owner cannot verify their own corrective action.");
    }

    // Schedule 60-day effectiveness review automatically
    const effectivenessReviewDue = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const updated = await prisma.correctivePreventiveAction.update({
      where: { id },
      data: {
        status: "VERIFIED",
        verifiedBy,
        verifiedAt: new Date(),
        verificationNotes: notes,
        effectivenessReviewDue,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CAPA_VERIFIED",
        entity: "CorrectivePreventiveAction",
        entityId: id,
        metadata: JSON.stringify({
          capaNo: capa.capaNo,
          verifiedBy,
          effectivenessReviewDue,
        }),
      },
    });

    return updated;
  }

  /**
   * Closes CAPA
   */
  static async closeCAPA(id: string, performedBy: string) {
    const capa = await prisma.correctivePreventiveAction.findUnique({ where: { id } });
    if (!capa) throw new Error("CAPA not found");

    const updated = await prisma.correctivePreventiveAction.update({
      where: { id },
      data: {
        status: "CLOSED",
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CAPA_CLOSED",
        entity: "CorrectivePreventiveAction",
        entityId: id,
        metadata: JSON.stringify({ capaNo: capa.capaNo, performedBy }),
      },
    });

    return updated;
  }

  /**
   * Records 30/60/90-day effectiveness review result
   */
  static async recordEffectivenessReview(
    id: string,
    reviewedBy: string,
    status: "EFFECTIVE" | "PARTIALLY_EFFECTIVE" | "NOT_EFFECTIVE" | "REOPENED",
    notes: string
  ) {
    const capa = await prisma.correctivePreventiveAction.findUnique({ where: { id } });
    if (!capa) throw new Error("CAPA not found");

    const updateData: any = {
      effectivenessStatus: status,
      effectivenessReviewedBy: reviewedBy,
      effectivenessReviewedAt: new Date(),
      effectivenessNotes: notes,
      updatedAt: new Date(),
    };

    // If not effective or reopened, return to IN_PROGRESS
    if (status === "NOT_EFFECTIVE" || status === "REOPENED") {
      updateData.status = "IN_PROGRESS";
    }

    const updated = await prisma.correctivePreventiveAction.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        action: "CAPA_EFFECTIVENESS_REVIEWED",
        entity: "CorrectivePreventiveAction",
        entityId: id,
        metadata: JSON.stringify({
          capaNo: capa.capaNo,
          effectivenessStatus: status,
          reviewedBy,
        }),
      },
    });

    return updated;
  }

  /**
   * Overdue and status tracking
   */
  static async getCAPAs(params: {
    status?: string;
    ownerId?: string;
    actionType?: string;
    priority?: string;
    isOverdueOnly?: boolean;
    take?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (params.ownerId) where.ownerId = params.ownerId;
    if (params.actionType) where.actionType = params.actionType;
    if (params.priority) where.priority = params.priority;

    if (params.isOverdueOnly) {
      where.status = { notIn: ["CLOSED", "VERIFIED"] };
      where.dueDate = { lt: new Date() };
    } else if (params.status) {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      prisma.correctivePreventiveAction.findMany({
        where,
        include: { finding: true },
        orderBy: { dueDate: "asc" },
        take: params.take || 50,
        skip: params.skip || 0,
      }),
      prisma.correctivePreventiveAction.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Summary KPI for CAPAs
   */
  static async getCAPASummary() {
    const now = new Date();
    const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [total, open, verified, closed, overdue, dueSoon] = await Promise.all([
      prisma.correctivePreventiveAction.count(),
      prisma.correctivePreventiveAction.count({
        where: { status: { in: ["DRAFT", "ASSIGNED", "IN_PROGRESS", "AWAITING_VERIFICATION"] } },
      }),
      prisma.correctivePreventiveAction.count({
        where: { status: "VERIFIED" },
      }),
      prisma.correctivePreventiveAction.count({
        where: { status: "CLOSED" },
      }),
      prisma.correctivePreventiveAction.count({
        where: {
          status: { notIn: ["CLOSED", "VERIFIED"] },
          dueDate: { lt: now },
        },
      }),
      prisma.correctivePreventiveAction.count({
        where: {
          status: { notIn: ["CLOSED", "VERIFIED"] },
          dueDate: { gte: now, lte: soon },
        },
      }),
    ]);

    return {
      total,
      open,
      verified,
      closed,
      overdue,
      dueSoon,
    };
  }
}
