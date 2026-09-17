import { prisma } from "@/lib/prisma";
import { WorkforcePlanningService } from "@/server/services/workforce-planning.service";
import { ExecutiveOperationsService } from "@/server/services/executive-operations.service";

export interface ScenarioSimulationInput {
  siteId: string;
  deficitDelta?: number; // e.g. 5 workers missing
  surplusDelta?: number; // e.g. 2 workers added
  additionalOtHours?: number;
  date?: string;
}

export interface ScenarioSimulationResult {
  site: {
    id: string;
    code: string;
    name: string;
  };
  simulationDate: string;
  baseline: {
    target: number;
    minimum: number;
    working: number;
    deficit: number;
    status: string;
  };
  projected: {
    working: number;
    deficit: number;
    status: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    supervisorPresent: boolean;
  };
  impact: {
    workforceGap: number;
    projectedOtHours: number;
    estimatedCostImpactBaht: number;
    impactDescription: string;
  };
  recommendedActions: string[];
}

export class OperationsScenarioService {
  /**
   * Run read-only operational simulation (NEVER mutates production database)
   */
  static async runScenario(input: ScenarioSimulationInput): Promise<ScenarioSimulationResult> {
    const { siteId, deficitDelta = 0, surplusDelta = 0, additionalOtHours = 0, date } = input;

    // Find site
    const site = await prisma.site.findFirst({
      where: {
        OR: [{ id: siteId }, { code: siteId }, { name: { contains: siteId } }],
      },
      include: {
        config: true,
        workforceRequirements: true,
      },
    });

    if (!site) {
      throw new Error(`ไม่พบ Site ID หรือชื่อ "${siteId}" ในระบบ`);
    }

    // Get current plan/status
    const targetDate = date || new Date(Date.now() + 86400000).toISOString().split("T")[0]; // default tomorrow
    const plan = await WorkforcePlanningService.getPlanningOverview({ dateStr: targetDate });
    const sitePlan = plan.sites.find((s) => s.id === site.id);

    const baselineTarget = sitePlan?.target || site.minimumWorkforce || 10;
    const baselineMinimum = sitePlan?.minimum || site.minimumWorkforce || 8;
    const baselineWorking = sitePlan?.working || sitePlan?.assigned || baselineTarget;
    const baselineDeficit = Math.max(0, baselineTarget - baselineWorking);

    // Apply simulation deltas
    const netWorkerChange = surplusDelta - deficitDelta;
    const projectedWorking = Math.max(0, baselineWorking + netWorkerChange);
    const projectedDeficit = Math.max(0, baselineTarget - projectedWorking);

    // Determine projected status & risk
    let projectedStatus = "OPTIMAL";
    let projectedRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

    if (projectedWorking < baselineMinimum) {
      projectedStatus = "CRITICAL_SHORTAGE";
      projectedRiskLevel = "CRITICAL";
    } else if (projectedWorking < baselineTarget) {
      projectedStatus = "UNDERSTAFFED";
      projectedRiskLevel = "HIGH";
    } else if (projectedWorking > baselineTarget * 1.25) {
      projectedStatus = "OVERSTAFFED";
      projectedRiskLevel = "MEDIUM";
    }

    // Overtime and Cost Calculation
    const otRate = site.config?.otRate || 75; // Baht/hr
    const projectedOtHours = Math.max(0, additionalOtHours + projectedDeficit * 2); // Assume deficit induces 2 hrs OT per missing person
    const estimatedCostImpact = projectedOtHours * otRate;

    // Recommended Actions
    const recommendedActions: string[] = [];
    if (projectedDeficit > 0) {
      recommendedActions.push(
        `ตรวจสอบ Site ใกล้เคียงเพื่อขอยืมกำลังคนชั่วคราวจำนวน ${projectedDeficit} คน`
      );
      recommendedActions.push(
        `พิจารณาเปิดกะทำงานแบบ Overtime เสริมช่วงพีค ${projectedOtHours} ชั่วโมง`
      );
    }
    if (site.requiresSupervisor) {
      recommendedActions.push("ตรวจสอบการมีอยู่ของ Supervisor ในกะทำงานเพื่อความปลอดภัย");
    }
    if (projectedRiskLevel === "CRITICAL") {
      recommendedActions.push("รายงานฝ่ายปฏิบัติการระดับสูง (Ops Director) เพื่ออนุมัติแผนฉุกเฉิน");
    }

    const impactDesc =
      projectedDeficit > 0
        ? `หากขาดพนักงานเพิ่ม ${deficitDelta} คน อัตรากำลังพลจะลดลงเหลือ ${projectedWorking}/${baselineTarget} คน (ขาด ${projectedDeficit} คน) ส่งผลให้มีความเสี่ยงระดับ ${projectedRiskLevel}`
        : `อัตรากำลังพลหลังปรับเปลี่ยนอยู่ที่ ${projectedWorking}/${baselineTarget} คน สถานะอยู่ในเกณฑ์ ${projectedStatus}`;

    return {
      site: {
        id: site.id,
        code: site.code,
        name: site.name,
      },
      simulationDate: targetDate,
      baseline: {
        target: baselineTarget,
        minimum: baselineMinimum,
        working: baselineWorking,
        deficit: baselineDeficit,
        status: sitePlan?.status || "OPTIMAL",
      },
      projected: {
        working: projectedWorking,
        deficit: projectedDeficit,
        status: projectedStatus,
        riskLevel: projectedRiskLevel,
        supervisorPresent: sitePlan?.supervisorPresent ?? true,
      },
      impact: {
        workforceGap: projectedWorking - baselineTarget,
        projectedOtHours,
        estimatedCostImpactBaht: Math.round(estimatedCostImpact),
        impactDescription: impactDesc,
      },
      recommendedActions,
    };
  }
}
