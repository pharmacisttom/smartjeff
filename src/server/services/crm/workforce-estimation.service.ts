export interface WorkforceRoleInput {
  role: string; // e.g. "Security Worker", "Supervisor", "Technician", "Driver", "General Worker"
  headcount: number;
  workdays: number;
  dailyRate: number;
  otHoursPerDay?: number;
  otHourlyRate?: number; // default dailyRate / 8 * 1.5
  shiftAllowancePerDay?: number;
  notes?: string;
}

export interface WorkforceEstimateResult {
  role: string;
  headcount: number;
  workdays: number;
  baseLaborCost: number;
  otCost: number;
  allowanceCost: number;
  totalLaborCost: number;
  lineItems: Array<{
    category: "WORKFORCE" | "OT" | "ALLOWANCE";
    description: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    sourceType: string;
    notes?: string;
  }>;
}

export class WorkforceEstimationService {
  /**
   * คำนวณต้นทุนแรงงานแบบแยกแจงรายละเอียด (Base Labor, OT, Shift Allowance)
   */
  static calculateRoleCost(input: WorkforceRoleInput): WorkforceEstimateResult {
    const headcount = Math.max(0, input.headcount);
    const workdays = Math.max(0, input.workdays);
    const dailyRate = Math.max(0, input.dailyRate);

    // 1. Base Labor Cost = Headcount * Workdays * Daily Rate
    const totalManDays = headcount * workdays;
    const baseLaborCost = totalManDays * dailyRate;

    // 2. Expected OT Cost = Headcount * Workdays * OT Hours * OT Hourly Rate
    const otHoursPerDay = Math.max(0, input.otHoursPerDay || 0);
    const defaultOtRate = (dailyRate / 8) * 1.5;
    const otHourlyRate = input.otHourlyRate !== undefined ? input.otHourlyRate : defaultOtRate;
    const totalOtHours = totalManDays * otHoursPerDay;
    const otCost = Math.round(totalOtHours * otHourlyRate);

    // 3. Shift Allowance Cost
    const allowancePerDay = Math.max(0, input.shiftAllowancePerDay || 0);
    const allowanceCost = totalManDays * allowancePerDay;

    const totalLaborCost = baseLaborCost + otCost + allowanceCost;

    const lineItems: WorkforceEstimateResult["lineItems"] = [
      {
        category: "WORKFORCE",
        description: `Base Labor: ${input.role} (${headcount} persons x ${workdays} days)`,
        quantity: totalManDays,
        unit: "man-day",
        unitCost: dailyRate,
        totalCost: baseLaborCost,
        sourceType: "WORKFORCE_FORMULA",
        notes: input.notes,
      },
    ];

    if (otCost > 0) {
      lineItems.push({
        category: "OT",
        description: `Expected Overtime: ${input.role} (${headcount} persons x ${workdays} days x ${otHoursPerDay} hrs)`,
        quantity: totalOtHours,
        unit: "hour",
        unitCost: otHourlyRate,
        totalCost: otCost,
        sourceType: "WORKFORCE_FORMULA",
        notes: `OT Rate: ${otHourlyRate.toFixed(2)} THB/hr`,
      });
    }

    if (allowanceCost > 0) {
      lineItems.push({
        category: "ALLOWANCE",
        description: `Shift Allowance: ${input.role} (${headcount} persons x ${workdays} days)`,
        quantity: totalManDays,
        unit: "man-day",
        unitCost: allowancePerDay,
        totalCost: allowanceCost,
        sourceType: "WORKFORCE_FORMULA",
      });
    }

    return {
      role: input.role,
      headcount,
      workdays,
      baseLaborCost,
      otCost,
      allowanceCost,
      totalLaborCost,
      lineItems,
    };
  }

  static calculateWorkforceEstimate(roles: WorkforceRoleInput[]) {
    let totalBaseLabor = 0;
    let totalOT = 0;
    let totalAllowance = 0;
    const allLineItems: WorkforceEstimateResult["lineItems"] = [];

    for (const role of roles) {
      const result = this.calculateRoleCost(role);
      totalBaseLabor += result.baseLaborCost;
      totalOT += result.otCost;
      totalAllowance += result.allowanceCost;
      allLineItems.push(...result.lineItems);
    }

    return {
      totalBaseLabor,
      totalOT,
      totalAllowance,
      totalDirectLaborCost: totalBaseLabor + totalOT + totalAllowance,
      lineItems: allLineItems,
    };
  }
}
