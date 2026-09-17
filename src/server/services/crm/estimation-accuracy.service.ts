import { prisma } from "@/lib/prisma";

export interface CategoryVariance {
  category: string;
  estimatedCost: number;
  actualCost: number;
  varianceAmount: number; // actual - estimated
  variancePercent: number; // (actual - estimated) / estimated * 100
  status: "FAVORABLE" | "ON_TARGET" | "UNFAVORABLE";
}

export class EstimationAccuracyService {
  /**
   * Compare estimated costs vs actual costs for a Project
   */
  static async getProjectEstimateVsActual(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        costs: true,
      },
    });

    if (!project) throw new Error("Project not found");

    // Fetch source estimate
    let estimate = null;
    if (project.sourceEstimateId) {
      estimate = await prisma.opportunityEstimate.findUnique({
        where: { id: project.sourceEstimateId },
        include: { lines: true },
      });
    } else if (project.sourceOpportunityId) {
      estimate = await prisma.opportunityEstimate.findFirst({
        where: { opportunityId: project.sourceOpportunityId, status: "APPROVED" },
        include: { lines: true },
      });
    }

    // Aggregate estimated costs by category
    const estimatedByCategory: Record<string, number> = {
      LABOR: 0,
      OT: 0,
      FLEET: 0,
      MATERIAL: 0,
      OTHER: 0,
    };

    if (estimate) {
      for (const line of estimate.lines) {
        if (line.category === "WORKFORCE" || line.category === "ALLOWANCE") {
          estimatedByCategory.LABOR += line.totalCost;
        } else if (line.category === "OT") {
          estimatedByCategory.OT += line.totalCost;
        } else if (line.category === "FLEET" || line.category === "FUEL" || line.category === "TRAVEL") {
          estimatedByCategory.FLEET += line.totalCost;
        } else if (line.category === "MATERIAL") {
          estimatedByCategory.MATERIAL += line.totalCost;
        } else {
          estimatedByCategory.OTHER += line.totalCost;
        }
      }
    }

    // Aggregate actual costs by category from ProjectCostEntry
    const actualByCategory: Record<string, number> = {
      LABOR: 0,
      OT: 0,
      FLEET: 0,
      MATERIAL: 0,
      OTHER: 0,
    };

    for (const cost of project.costs) {
      if (cost.costType === "LABOR") {
        actualByCategory.LABOR += cost.amount;
      } else if (cost.costType === "OT") {
        actualByCategory.OT += cost.amount;
      } else if (cost.costType === "FLEET" || cost.costType === "FUEL") {
        actualByCategory.FLEET += cost.amount;
      } else if (cost.costType === "MATERIAL") {
        actualByCategory.MATERIAL += cost.amount;
      } else {
        actualByCategory.OTHER += cost.amount;
      }
    }

    const categories = ["LABOR", "OT", "FLEET", "MATERIAL", "OTHER"];
    const breakdown: CategoryVariance[] = [];

    let totalEstimated = 0;
    let totalActual = 0;

    for (const cat of categories) {
      const est = estimatedByCategory[cat] || 0;
      const act = actualByCategory[cat] || 0;
      const varianceAmount = act - est;
      const variancePercent = est > 0 ? parseFloat(((varianceAmount / est) * 100).toFixed(2)) : act > 0 ? 100 : 0;

      let status: "FAVORABLE" | "ON_TARGET" | "UNFAVORABLE" = "ON_TARGET";
      if (varianceAmount > 0) status = "UNFAVORABLE"; // cost overrun
      else if (varianceAmount < 0) status = "FAVORABLE"; // cost savings

      totalEstimated += est;
      totalActual += act;

      breakdown.push({
        category: cat,
        estimatedCost: est,
        actualCost: act,
        varianceAmount,
        variancePercent,
        status,
      });
    }

    const totalVarianceAmount = totalActual - totalEstimated;
    const totalVariancePercent =
      totalEstimated > 0 ? parseFloat(((totalVarianceAmount / totalEstimated) * 100).toFixed(2)) : 0;

    return {
      projectId: project.id,
      projectCode: project.projectCode,
      projectName: project.name,
      estimateNo: estimate?.estimateNo || "N/A",
      totalEstimatedCost: totalEstimated,
      totalActualCost: totalActual,
      totalVarianceAmount,
      totalVariancePercent,
      overallStatus:
        totalVarianceAmount > 0 ? "UNFAVORABLE" : totalVarianceAmount < 0 ? "FAVORABLE" : "ON_TARGET",
      breakdown,
    };
  }
}
