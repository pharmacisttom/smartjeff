import { prisma } from "@/lib/prisma";

export interface CreateRiskInput {
  title: string;
  description: string;
  category?: string; // ENTERPRISE | PROJECT | SITE | PROCESS | SAFETY | QUALITY | FINANCIAL | SUPPLIER | FLEET | ASSET | IT | COMPLIANCE
  scope?: string; // ENTERPRISE | PROJECT | SITE
  siteId?: string;
  projectId?: string;
  likelihood: number; // 1-5
  impact: number; // 1-5
  treatment?: string; // AVOID | REDUCE | TRANSFER | ACCEPT
  residualLikelihood?: number; // 1-5
  residualImpact?: number; // 1-5
  reviewFrequency?: string; // MONTHLY | QUARTERLY | ANNUAL | CUSTOM
  reviewDate?: Date;
  ownerId: string;
}

export interface AddControlInput {
  riskId: string;
  description: string;
  controlType?: string; // PREVENTIVE | DETECTIVE | CORRECTIVE
  ownerId: string;
  status?: string; // IMPLEMENTED | PLANNED | INEFFECTIVE
  evidence?: string;
}

export class RiskManagementService {
  /**
   * Deterministic 5x5 matrix score & level calculator
   */
  static calculateRiskLevel(likelihood: number, impact: number): { score: number; level: string } {
    const l = Math.min(5, Math.max(1, Math.round(likelihood)));
    const i = Math.min(5, Math.max(1, Math.round(impact)));
    const score = l * i;

    let level = "LOW";
    if (score >= 16) {
      level = "CRITICAL";
    } else if (score >= 10) {
      level = "HIGH";
    } else if (score >= 5) {
      level = "MODERATE";
    }

    return { score, level };
  }

  static async generateRiskNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.riskRegister.count();
    return `RSK-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Registers a new risk with inherent and residual scores
   */
  static async createRisk(input: CreateRiskInput) {
    const riskNo = await this.generateRiskNo();
    const inherent = this.calculateRiskLevel(input.likelihood, input.impact);

    const resL = input.residualLikelihood || Math.max(1, input.likelihood - 1);
    const resI = input.residualImpact || Math.max(1, input.impact - 1);
    const residual = this.calculateRiskLevel(resL, resI);

    const risk = await prisma.riskRegister.create({
      data: {
        riskNo,
        title: input.title,
        description: input.description,
        category: input.category || "OPERATIONS",
        scope: input.scope || (input.projectId ? "PROJECT" : input.siteId ? "SITE" : "ENTERPRISE"),
        siteId: input.siteId,
        projectId: input.projectId,
        likelihood: input.likelihood,
        impact: input.impact,
        inherentScore: inherent.score,
        inherentLevel: inherent.level,
        treatment: input.treatment || "REDUCE",
        residualLikelihood: resL,
        residualImpact: resI,
        residualScore: residual.score,
        residualLevel: residual.level,
        reviewFrequency: input.reviewFrequency || "QUARTERLY",
        reviewDate: input.reviewDate,
        ownerId: input.ownerId,
        status: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "RISK_REGISTERED",
        entity: "RiskRegister",
        entityId: risk.id,
        metadata: JSON.stringify({
          riskNo: risk.riskNo,
          inherentScore: inherent.score,
          inherentLevel: inherent.level,
          residualScore: residual.score,
          residualLevel: residual.level,
        }),
      },
    });

    return risk;
  }

  /**
   * Adds an operational control to mitigate risk
   */
  static async addControl(input: AddControlInput) {
    const control = await prisma.riskControl.create({
      data: {
        riskId: input.riskId,
        description: input.description,
        controlType: input.controlType || "PREVENTIVE",
        ownerId: input.ownerId,
        status: input.status || "IMPLEMENTED",
        evidence: input.evidence,
      },
    });

    return control;
  }

  /**
   * Accepts risk (High/Critical risk requires authorized role)
   */
  static async acceptRisk(
    riskId: string,
    acceptedBy: string,
    userRole: string,
    justification: string
  ) {
    const risk = await prisma.riskRegister.findUnique({ where: { id: riskId } });
    if (!risk) throw new Error("Risk not found");

    if (risk.inherentLevel === "HIGH" || risk.inherentLevel === "CRITICAL") {
      const authorizedRoles = ["ADMIN", "EXECUTIVE", "QHSE_MANAGER"];
      if (!authorizedRoles.includes(userRole)) {
        throw new Error(
          `Unauthorized: Accepting ${risk.inherentLevel} risk requires Executive or QHSE Manager authorization.`
        );
      }
    }

    const updated = await prisma.riskRegister.update({
      where: { id: riskId },
      data: {
        treatment: "ACCEPT",
        acceptedBy,
        acceptedAt: new Date(),
        status: "ACCEPTED",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "RISK_ACCEPTED",
        entity: "RiskRegister",
        entityId: riskId,
        metadata: JSON.stringify({
          riskNo: risk.riskNo,
          acceptedBy,
          userRole,
          justification,
        }),
      },
    });

    return updated;
  }

  /**
   * Generates a 5x5 Heatmap matrix data structure
   */
  static async getHeatmapData(scope?: string, siteId?: string, projectId?: string) {
    const where: any = { status: { in: ["ACTIVE", "ACCEPTED"] } };
    if (scope) where.scope = scope;
    if (siteId) where.siteId = siteId;
    if (projectId) where.projectId = projectId;

    const risks = await prisma.riskRegister.findMany({ where });

    // 5x5 grid for residual risk: grid[likelihood-1][impact-1]
    const residualGrid: Array<Array<{ count: number; risks: any[] }>> = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => ({ count: 0, risks: [] }))
    );

    const inherentGrid: Array<Array<{ count: number; risks: any[] }>> = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => ({ count: 0, risks: [] }))
    );

    for (const r of risks) {
      const resL = Math.min(5, Math.max(1, r.residualLikelihood)) - 1;
      const resI = Math.min(5, Math.max(1, r.residualImpact)) - 1;
      residualGrid[resL][resI].count += 1;
      residualGrid[resL][resI].risks.push({ id: r.id, riskNo: r.riskNo, title: r.title, level: r.residualLevel });

      const inhL = Math.min(5, Math.max(1, r.likelihood)) - 1;
      const inhI = Math.min(5, Math.max(1, r.impact)) - 1;
      inherentGrid[inhL][inhI].count += 1;
      inherentGrid[inhL][inhI].risks.push({ id: r.id, riskNo: r.riskNo, title: r.title, level: r.inherentLevel });
    }

    return { residualGrid, inherentGrid, totalRisks: risks.length };
  }

  /**
   * Retrieves risks with filters
   */
  static async getRisks(params: {
    category?: string;
    scope?: string;
    siteId?: string;
    projectId?: string;
    level?: string;
    status?: string;
    take?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (params.category) where.category = params.category;
    if (params.scope) where.scope = params.scope;
    if (params.siteId) where.siteId = params.siteId;
    if (params.projectId) where.projectId = params.projectId;
    if (params.status) where.status = params.status;
    if (params.level) {
      where.OR = [{ inherentLevel: params.level }, { residualLevel: params.level }];
    }

    const [items, total] = await Promise.all([
      prisma.riskRegister.findMany({
        where,
        include: { controls: true },
        orderBy: { inherentScore: "desc" },
        take: params.take || 50,
        skip: params.skip || 0,
      }),
      prisma.riskRegister.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Risk summary KPI
   */
  static async getRiskSummary(siteId?: string, projectId?: string) {
    const where: any = { status: "ACTIVE" };
    if (siteId) where.siteId = siteId;
    if (projectId) where.projectId = projectId;

    const [total, critical, high, moderate, low] = await Promise.all([
      prisma.riskRegister.count({ where }),
      prisma.riskRegister.count({ where: { ...where, residualLevel: "CRITICAL" } }),
      prisma.riskRegister.count({ where: { ...where, residualLevel: "HIGH" } }),
      prisma.riskRegister.count({ where: { ...where, residualLevel: "MODERATE" } }),
      prisma.riskRegister.count({ where: { ...where, residualLevel: "LOW" } }),
    ]);

    return { total, critical, high, moderate, low };
  }
}
