import { prisma } from "@/lib/prisma";
import { AuditService } from "../audit.service";

export interface CreateBudgetPlanInput {
  name: string;
  fiscalYear: number;
  currency?: string;
  createdBy: string;
  notes?: string;
  lines: {
    costCenterId?: string;
    projectId?: string;
    siteId?: string;
    department?: string;
    category: "LABOR" | "OT" | "MATERIAL" | "FLEET" | "FUEL" | "MAINTENANCE" | "TRAVEL" | "PROCUREMENT" | "CAPEX" | "OTHER";
    period: string; // e.g. "2026-01" or "2026-ANNUAL"
    allocatedAmount: number;
    notes?: string;
  }[];
}

export class BudgetPlanningService {
  /**
   * Create a new organization budget plan
   */
  static async createBudgetPlan(input: CreateBudgetPlanInput) {
    const planCount = await prisma.budgetPlan.count();
    const planNo = `BGT-${input.fiscalYear}-${String(planCount + 1).padStart(4, "0")}`;

    const totalBudget = input.lines.reduce((s, l) => s + l.allocatedAmount, 0);

    const plan = await prisma.budgetPlan.create({
      data: {
        planNo,
        name: input.name,
        fiscalYear: input.fiscalYear,
        version: 1,
        status: "DRAFT",
        currency: input.currency || "THB",
        totalBudget,
        createdBy: input.createdBy,
        notes: input.notes,
      },
    });

    for (const line of input.lines) {
      await prisma.budgetLine.create({
        data: {
          budgetPlanId: plan.id,
          costCenterId: line.costCenterId,
          projectId: line.projectId,
          siteId: line.siteId,
          department: line.department,
          category: line.category,
          period: line.period,
          allocatedAmount: line.allocatedAmount,
          consumedAmount: 0,
          committedAmount: 0,
          forecastAmount: line.allocatedAmount,
          availableAmount: line.allocatedAmount,
          notes: line.notes,
        },
      });
    }

    await AuditService.log({
      userId: input.createdBy,
      action: "BUDGET_PLAN_CREATED",
      entity: "BudgetPlan",
      entityId: plan.id,
      metadata: { planNo, totalBudget, lineCount: input.lines.length },
    });

    return plan;
  }

  /**
   * Submit budget plan for review
   */
  static async submitPlan(planId: string, userId: string) {
    const plan = await prisma.budgetPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error("Budget plan not found");

    if (plan.status !== "DRAFT") {
      throw new Error(`Cannot submit budget plan with status ${plan.status}`);
    }

    const updated = await prisma.budgetPlan.update({
      where: { id: planId },
      data: { status: "SUBMITTED" },
    });

    await AuditService.log({
      userId,
      action: "BUDGET_PLAN_SUBMITTED",
      entity: "BudgetPlan",
      entityId: planId,
    });

    return updated;
  }

  /**
   * Approve budget plan (Sets to ACTIVE)
   */
  static async approvePlan(planId: string, approvedBy: string) {
    const plan = await prisma.budgetPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error("Budget plan not found");

    const updated = await prisma.budgetPlan.update({
      where: { id: planId },
      data: {
        status: "ACTIVE",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    await AuditService.log({
      userId: approvedBy,
      action: "BUDGET_PLAN_APPROVED",
      entity: "BudgetPlan",
      entityId: planId,
    });

    return updated;
  }

  /**
   * Create a revision (New version) without mutating original approved plan
   */
  static async createRevision(
    planId: string,
    reasonCategory: "SCOPE_CHANGE" | "CONTRACT_CHANGE" | "OPERATIONAL_CHANGE" | "MANAGEMENT_DECISION" | "OTHER",
    notes: string,
    requestedBy: string
  ) {
    const currentPlan = await prisma.budgetPlan.findUnique({ where: { id: planId } });
    if (!currentPlan) throw new Error("Budget plan not found");

    const newVersion = currentPlan.version + 1;
    const revCount = await prisma.budgetRevision.count();
    const revisionNo = `REV-${currentPlan.fiscalYear}-${String(revCount + 1).padStart(4, "0")}`;

    const revision = await prisma.budgetRevision.create({
      data: {
        revisionNo,
        budgetPlanId: planId,
        fromVersion: currentPlan.version,
        toVersion: newVersion,
        reasonCategory,
        notes,
        requestedBy,
      },
    });

    await prisma.budgetPlan.update({
      where: { id: planId },
      data: {
        version: newVersion,
        status: "REVISED",
      },
    });

    await AuditService.log({
      userId: requestedBy,
      action: "BUDGET_PLAN_REVISED",
      entity: "BudgetPlan",
      entityId: planId,
      metadata: { revisionNo, fromVersion: currentPlan.version, toVersion: newVersion },
    });

    return revision;
  }

  /**
   * List budget plans with lines and summary metrics
   */
  static async getBudgetPlans(fiscalYear?: number) {
    const where = fiscalYear ? { fiscalYear } : {};
    const plans = await prisma.budgetPlan.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const result = [];
    for (const p of plans) {
      const lines = await prisma.budgetLine.findMany({
        where: { budgetPlanId: p.id },
      });

      const totalAllocated = lines.reduce((s, l) => s + l.allocatedAmount, 0);
      const totalConsumed = lines.reduce((s, l) => s + l.consumedAmount, 0);
      const totalCommitted = lines.reduce((s, l) => s + l.committedAmount, 0);
      const totalAvailable = lines.reduce((s, l) => s + l.availableAmount, 0);
      const totalForecast = lines.reduce((s, l) => s + l.forecastAmount, 0);

      result.push({
        ...p,
        totalAllocated: Math.round(totalAllocated * 100) / 100,
        totalConsumed: Math.round(totalConsumed * 100) / 100,
        totalCommitted: Math.round(totalCommitted * 100) / 100,
        totalAvailable: Math.round(totalAvailable * 100) / 100,
        totalForecast: Math.round(totalForecast * 100) / 100,
        burnRatePercentage:
          totalAllocated > 0
            ? Math.round(((totalConsumed + totalCommitted) / totalAllocated) * 100)
            : 0,
        linesCount: lines.length,
      });
    }

    return result;
  }

  /**
   * Get detail of a specific budget plan including lines and transfers
   */
  static async getBudgetPlanDetail(planId: string) {
    const plan = await prisma.budgetPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error("Budget plan not found");

    const lines = await prisma.budgetLine.findMany({
      where: { budgetPlanId: planId },
      orderBy: [{ category: "asc" }, { period: "asc" }],
    });

    const revisions = await prisma.budgetRevision.findMany({
      where: { budgetPlanId: planId },
      orderBy: { createdAt: "desc" },
    });

    return {
      plan,
      lines,
      revisions,
    };
  }
}
