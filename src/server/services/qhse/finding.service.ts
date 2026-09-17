import { prisma } from "@/lib/prisma";

export interface CreateFindingInput {
  title: string;
  description: string;
  source?: string; // INCIDENT | INSPECTION | AUDIT | CLIENT_COMPLAINT | QUALITY_CHECK | SUPPLIER | OTHER
  sourceId?: string;
  incidentId?: string;
  inspectionId?: string;
  classification?: string; // OBSERVATION | MINOR | MAJOR | CRITICAL
  siteId?: string;
  projectId?: string;
  ownerId: string;
  dueDate: Date;
  priority?: string; // LOW | MEDIUM | HIGH | URGENT
}

export interface CreateNCRInput {
  findingId?: string;
  requirement: string;
  actualCondition: string;
  evidence?: string;
  impact?: string;
  source?: string; // INTERNAL | CLIENT | AUDITOR | SUPPLIER
  ownerId: string;
}

export class FindingService {
  /**
   * Generates sequential finding number e.g. FND-2026-0001
   */
  static async generateFindingNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.finding.count();
    return `FND-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Generates sequential NCR reference number e.g. NCR-2026-0001
   */
  static async generateNCRNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.nonConformance.count();
    return `NCR-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Creates a new Finding
   */
  static async createFinding(input: CreateFindingInput) {
    const findingNo = await this.generateFindingNo();
    const classification = input.classification || "MINOR";
    const priority = input.priority || (classification === "CRITICAL" ? "URGENT" : "MEDIUM");

    const finding = await prisma.finding.create({
      data: {
        findingNo,
        title: input.title,
        description: input.description,
        source: input.source || "INSPECTION",
        sourceId: input.sourceId,
        incidentId: input.incidentId,
        inspectionId: input.inspectionId,
        classification,
        siteId: input.siteId,
        projectId: input.projectId,
        ownerId: input.ownerId,
        dueDate: input.dueDate,
        priority,
        status: "OPEN",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "FINDING_CREATED",
        entity: "Finding",
        entityId: finding.id,
        metadata: JSON.stringify({
          findingNo: finding.findingNo,
          classification: finding.classification,
          source: finding.source,
          ownerId: finding.ownerId,
        }),
      },
    });

    return finding;
  }

  /**
   * Creates Non-Conformance Report (NCR)
   */
  static async createNonConformance(input: CreateNCRInput) {
    const referenceNo = await this.generateNCRNo();

    const ncr = await prisma.nonConformance.create({
      data: {
        referenceNo,
        findingId: input.findingId,
        requirement: input.requirement,
        actualCondition: input.actualCondition,
        evidence: input.evidence,
        impact: input.impact,
        source: input.source || "INTERNAL",
        ownerId: input.ownerId,
        status: "OPEN",
      },
    });

    return ncr;
  }

  /**
   * Updates finding status along lifecycle:
   * OPEN -> ASSIGNED -> ACTION_IN_PROGRESS -> AWAITING_VERIFICATION -> VERIFIED -> CLOSED
   */
  static async updateStatus(
    id: string,
    status: string,
    performedBy: string,
    verifiedBy?: string
  ) {
    const current = await prisma.finding.findUnique({ where: { id } });
    if (!current) throw new Error("Finding not found");

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "VERIFIED" || status === "CLOSED") {
      updateData.verifiedBy = verifiedBy || performedBy;
      updateData.verifiedAt = new Date();
    }
    if (status === "CLOSED") {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.finding.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        action: "FINDING_STATUS_UPDATED",
        entity: "Finding",
        entityId: id,
        metadata: JSON.stringify({ from: current.status, to: status, performedBy }),
      },
    });

    return updated;
  }

  /**
   * Retrieves findings with filtering
   */
  static async getFindings(params: {
    siteId?: string;
    projectId?: string;
    classification?: string;
    status?: string;
    source?: string;
    ownerId?: string;
    take?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (params.siteId) where.siteId = params.siteId;
    if (params.projectId) where.projectId = params.projectId;
    if (params.classification) where.classification = params.classification;
    if (params.status) where.status = params.status;
    if (params.source) where.source = params.source;
    if (params.ownerId) where.ownerId = params.ownerId;

    const [items, total] = await Promise.all([
      prisma.finding.findMany({
        where,
        include: {
          ncr: true,
          rca: true,
          capas: true,
        },
        orderBy: { createdAt: "desc" },
        take: params.take || 50,
        skip: params.skip || 0,
      }),
      prisma.finding.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Summary metrics for findings & NCRs
   */
  static async getFindingSummary(siteId?: string) {
    const where = siteId ? { siteId } : {};

    const [total, open, critical, major, overdue] = await Promise.all([
      prisma.finding.count({ where }),
      prisma.finding.count({
        where: { ...where, status: { not: "CLOSED" } },
      }),
      prisma.finding.count({
        where: { ...where, classification: "CRITICAL", status: { not: "CLOSED" } },
      }),
      prisma.finding.count({
        where: { ...where, classification: "MAJOR", status: { not: "CLOSED" } },
      }),
      prisma.finding.count({
        where: {
          ...where,
          status: { not: "CLOSED" },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return { total, open, critical, major, overdue };
  }
}
