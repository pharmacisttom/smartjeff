export interface ImpactDimension {
  level: "NONE" | "LOW" | "MODERATE" | "HIGH";
  summary: string;
  metrics?: Record<string, any>;
}

export interface ActionImpactReport {
  overallImpact: "LOW" | "MODERATE" | "HIGH";
  workforceImpact: ImpactDimension;
  budgetImpact: ImpactDimension;
  scheduleImpact: ImpactDimension;
  complianceImpact: ImpactDimension;
  warnings: string[];
}

export class AIActionImpactService {
  /**
   * Evaluates impact of an action proposal before user approval.
   */
  public static analyzeImpact(params: {
    actionType: string;
    payload: Record<string, any>;
  }): ActionImpactReport {
    const { actionType, payload } = params;
    const warnings: string[] = [];

    let workforceLevel: "NONE" | "LOW" | "MODERATE" | "HIGH" = "NONE";
    let budgetLevel: "NONE" | "LOW" | "MODERATE" | "HIGH" = "NONE";
    let scheduleLevel: "NONE" | "LOW" | "MODERATE" | "HIGH" = "NONE";
    let complianceLevel: "NONE" | "LOW" | "MODERATE" | "HIGH" = "NONE";

    // 1. Workforce & Schedule Impact
    if (actionType.includes("SCHEDULE") || actionType.includes("SHIFT")) {
      const assignedCount = payload.assignments?.length || 1;
      if (assignedCount > 20) {
        workforceLevel = "HIGH";
        scheduleLevel = "HIGH";
        warnings.push(`Mass schedule assignment affecting ${assignedCount} shifts.`);
      } else {
        workforceLevel = "MODERATE";
        scheduleLevel = "LOW";
      }

      if (payload.hasOvertime) {
        complianceLevel = "MODERATE";
        warnings.push("Schedule includes overtime hours requiring labor law threshold checks.");
      }
    }

    // 2. Procurement & Budget Impact
    if (actionType.includes("PR") || actionType.includes("PURCHASE")) {
      const amount = payload.estimatedTotalAmount || payload.amount || 0;
      if (amount > 100000) {
        budgetLevel = "HIGH";
        warnings.push(`High expenditure commitment: ฿${amount.toLocaleString()} will impact monthly site budget.`);
      } else if (amount > 10000) {
        budgetLevel = "MODERATE";
      } else {
        budgetLevel = "LOW";
      }
    }

    // 3. Work Order & Project Impact
    if (actionType.includes("WORK_ORDER") || actionType.includes("PROJECT")) {
      scheduleLevel = "MODERATE";
    }

    // Compute Overall Impact
    let overallImpact: "LOW" | "MODERATE" | "HIGH" = "LOW";
    if (workforceLevel === "HIGH" || budgetLevel === "HIGH" || scheduleLevel === "HIGH") {
      overallImpact = "HIGH";
    } else if (workforceLevel === "MODERATE" || budgetLevel === "MODERATE" || scheduleLevel === "MODERATE") {
      overallImpact = "MODERATE";
    }

    return {
      overallImpact,
      workforceImpact: {
        level: workforceLevel,
        summary: workforceLevel !== "NONE" ? "Workforce allocation adjusted" : "No direct workforce change",
      },
      budgetImpact: {
        level: budgetLevel,
        summary: budgetLevel !== "NONE" ? "Committed financial or material impact detected" : "Zero financial impact",
      },
      scheduleImpact: {
        level: scheduleLevel,
        summary: scheduleLevel !== "NONE" ? "Site operational timeline updated" : "No timeline variation",
      },
      complianceImpact: {
        level: complianceLevel,
        summary: complianceLevel !== "NONE" ? "Compliance policies and rest checks enforced" : "Fully compliant",
      },
      warnings,
    };
  }
}
