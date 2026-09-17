import { prisma } from "@/lib/prisma";

export interface CreateRequirementInput {
  code: string;
  title: string;
  description?: string;
  category?: string; // LEGAL | CLIENT | CONTRACT | INTERNAL_POLICY | SAFETY | QUALITY | ENVIRONMENT | LICENSE | CERTIFICATION
  scope?: string; // ORGANIZATION | PROJECT | SITE | EMPLOYEE | VEHICLE | ASSET | SUPPLIER
  siteId?: string;
  projectId?: string;
  ownerId: string;
  effectiveFrom?: Date;
  expiryDate?: Date;
  reviewFrequency?: string;
  status?: string;
  evidenceSummary?: string;
}

export interface CreateGapInput {
  requirementId: string;
  entityType: string; // PROJECT | SITE | EMPLOYEE | VEHICLE | ASSET | SUPPLIER
  entityId: string;
  gapDescription: string;
  severity?: string; // LOW | MEDIUM | HIGH | CRITICAL
  ownerId: string;
  dueDate: Date;
}

export class ComplianceService {
  /**
   * Registers a compliance requirement
   */
  static async createRequirement(input: CreateRequirementInput) {
    const requirement = await prisma.complianceRequirement.create({
      data: {
        code: input.code,
        title: input.title,
        description: input.description,
        category: input.category || "LEGAL",
        scope: input.scope || "ORGANIZATION",
        siteId: input.siteId,
        projectId: input.projectId,
        ownerId: input.ownerId,
        effectiveFrom: input.effectiveFrom || new Date(),
        expiryDate: input.expiryDate,
        reviewFrequency: input.reviewFrequency || "ANNUAL",
        status: input.status || "COMPLIANT",
        evidenceSummary: input.evidenceSummary,
      },
    });

    return requirement;
  }

  /**
   * Raises a compliance gap against an entity
   */
  static async createGap(input: CreateGapInput) {
    const gap = await prisma.complianceGap.create({
      data: {
        requirementId: input.requirementId,
        entityType: input.entityType,
        entityId: input.entityId,
        gapDescription: input.gapDescription,
        severity: input.severity || "MEDIUM",
        ownerId: input.ownerId,
        dueDate: input.dueDate,
        status: "OPEN",
      },
    });

    // Mark requirement as PARTIAL or NON_COMPLIANT if open gaps exist
    await prisma.complianceRequirement.update({
      where: { id: input.requirementId },
      data: { status: input.severity === "CRITICAL" ? "NON_COMPLIANT" : "PARTIAL" },
    });

    return gap;
  }

  /**
   * Resolves compliance gap
   */
  static async resolveGap(id: string, performedBy: string) {
    const gap = await prisma.complianceGap.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });

    // Check remaining open gaps for requirement
    const remainingOpenGaps = await prisma.complianceGap.count({
      where: { requirementId: gap.requirementId, status: { not: "RESOLVED" } },
    });

    if (remainingOpenGaps === 0) {
      await prisma.complianceRequirement.update({
        where: { id: gap.requirementId },
        data: { status: "COMPLIANT" },
      });
    }

    return gap;
  }

  /**
   * Retrieves compliance requirements
   */
  static async getRequirements(params: {
    category?: string;
    scope?: string;
    status?: string;
    siteId?: string;
    projectId?: string;
    take?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (params.category) where.category = params.category;
    if (params.scope) where.scope = params.scope;
    if (params.status) where.status = params.status;
    if (params.siteId) where.siteId = params.siteId;
    if (params.projectId) where.projectId = params.projectId;

    const [items, total] = await Promise.all([
      prisma.complianceRequirement.findMany({
        where,
        include: { gaps: true },
        orderBy: { code: "asc" },
        take: params.take || 50,
        skip: params.skip || 0,
      }),
      prisma.complianceRequirement.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Retrieves open compliance gaps
   */
  static async getGaps(params: {
    entityType?: string;
    severity?: string;
    status?: string;
  }) {
    const where: any = {};
    if (params.entityType) where.entityType = params.entityType;
    if (params.severity) where.severity = params.severity;
    if (params.status) where.status = params.status;

    return prisma.complianceGap.findMany({
      where,
      include: { requirement: true },
      orderBy: { dueDate: "asc" },
    });
  }

  /**
   * Compliance summary KPI
   */
  static async getComplianceSummary() {
    const now = new Date();
    const expiringSoon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [total, compliant, partial, nonCompliant, expiring, openGaps] = await Promise.all([
      prisma.complianceRequirement.count(),
      prisma.complianceRequirement.count({ where: { status: "COMPLIANT" } }),
      prisma.complianceRequirement.count({ where: { status: "PARTIAL" } }),
      prisma.complianceRequirement.count({ where: { status: "NON_COMPLIANT" } }),
      prisma.complianceRequirement.count({
        where: {
          expiryDate: { gte: now, lte: expiringSoon },
        },
      }),
      prisma.complianceGap.count({
        where: { status: { not: "RESOLVED" } },
      }),
    ]);

    return {
      total,
      compliant,
      partial,
      nonCompliant,
      expiring,
      openGaps,
    };
  }
}
