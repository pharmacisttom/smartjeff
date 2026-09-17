import { prisma } from "@/lib/prisma";
import { TreasuryForecastService } from "./treasury-forecast.service";

export interface ScenarioParams {
  name?: string;
  clientCollectionDelayDays?: number; // e.g. 15 or 30
  supplierPaymentAdvanceDays?: number; // e.g. 7 or 14
  overtimeIncreasePct?: number; // e.g. 20
  fuelPriceIncreasePct?: number; // e.g. 10
  projectDelayWeeks?: number; // e.g. 2
}

export interface ScenarioComparisonResult {
  scenarioName: string;
  baseline: {
    minimumCash: number;
    endingCash: number;
    hasShortfall: boolean;
    shortfallWeek?: number;
    fundingGap: number;
  };
  simulated: {
    minimumCash: number;
    endingCash: number;
    hasShortfall: boolean;
    shortfallWeek?: number;
    fundingGap: number;
  };
  impactSummary: string;
  weeklyComparison: {
    weekNumber: number;
    baselineClosingCash: number;
    simulatedClosingCash: number;
    variance: number;
  }[];
}

export class TreasuryScenarioService {
  /**
   * Run pure in-memory financial scenario simulation (zero database side-effects)
   */
  static async simulateScenario(params: ScenarioParams): Promise<ScenarioComparisonResult> {
    const { currentCash, forecastWeeks } = await TreasuryForecastService.get13WeekForecast();

    const baselineWeekly = forecastWeeks.map((w) => ({
      weekNumber: w.weekNumber,
      closingCash: w.closingCash,
    }));

    const baselineMin = Math.min(...baselineWeekly.map((w) => w.closingCash));
    const baselineEnd = baselineWeekly[baselineWeekly.length - 1]?.closingCash || 0;
    const baselineShortfallWeek = baselineWeekly.find((w) => w.closingCash < 0)?.weekNumber;
    const baselineFundingGap = baselineMin < 0 ? Math.abs(baselineMin) : 0;

    // Simulate variations
    let rollingSimCash = currentCash;
    let simMinCash = currentCash;
    let simShortfallWeek: number | undefined;

    const weeklyComparison = [];

    // Delay factor for collection
    const delayWeeks = Math.floor((params.clientCollectionDelayDays || 0) / 7);
    const otMult = 1 + (params.overtimeIncreasePct || 0) / 100;
    const fuelMult = 1 + (params.fuelPriceIncreasePct || 0) / 100;

    for (let w = 1; w <= 13; w++) {
      const baseWeek = forecastWeeks[w - 1];

      // Shift collections if client delay configured
      let simCollection = baseWeek.expectedInflows.customerCollections;
      if (delayWeeks > 0) {
        if (w <= delayWeeks) {
          simCollection = baseWeek.expectedInflows.customerCollections * 0.2; // 80% delayed
        } else {
          simCollection = baseWeek.expectedInflows.customerCollections * 1.3; // Catch-up later
        }
      }

      // Adjust OT inside payroll / expenses
      const simPayroll = baseWeek.expectedOutflows.payroll * (otMult > 1 ? 1 + (otMult - 1) * 0.4 : 1);
      const simFleet = baseWeek.expectedOutflows.fleet * fuelMult;

      const simTotalInflow = simCollection;
      const simTotalOutflow =
        baseWeek.expectedOutflows.supplierPayments +
        simPayroll +
        baseWeek.expectedOutflows.expenses +
        simFleet +
        baseWeek.expectedOutflows.procurement +
        baseWeek.expectedOutflows.otherCommitments;

      const simNet = Math.round((simTotalInflow - simTotalOutflow) * 100) / 100;
      rollingSimCash = Math.round((rollingSimCash + simNet) * 100) / 100;

      if (rollingSimCash < simMinCash) {
        simMinCash = rollingSimCash;
      }
      if (rollingSimCash < 0 && !simShortfallWeek) {
        simShortfallWeek = w;
      }

      weeklyComparison.push({
        weekNumber: w,
        baselineClosingCash: baseWeek.closingCash,
        simulatedClosingCash: rollingSimCash,
        variance: Math.round((rollingSimCash - baseWeek.closingCash) * 100) / 100,
      });
    }

    const simFundingGap = simMinCash < 0 ? Math.abs(simMinCash) : 0;
    const simEndingCash = rollingSimCash;

    let impactSummary = `สถานการณ์จำลอง: "${params.name}" `;
    if (simShortfallWeek) {
      impactSummary += `อาจทำให้สภาพคล่องติดลบในสัปดาห์ที่ ${simShortfallWeek} โดยมี Funding Gap สูงสุด ฿${simFundingGap.toLocaleString()} บาท`;
    } else if (simMinCash < baselineMin) {
      impactSummary += `ทำให้เงินสดต่ำสุดลดลงเหลือ ฿${simMinCash.toLocaleString()} (ลดลง ฿${(baselineMin - simMinCash).toLocaleString()} จากแผนเดิม) แต่ยังไม่ติดลบ`;
    } else {
      impactSummary += `สถานะสภาพคล่องยังคงทรงตัวใกล้เคียงกับแผนฐาน (Baseline)`;
    }

    return {
      scenarioName: params.name || "What-If Simulation",
      baseline: {
        minimumCash: baselineMin,
        endingCash: baselineEnd,
        hasShortfall: baselineMin < 0,
        shortfallWeek: baselineShortfallWeek,
        fundingGap: baselineFundingGap,
      },
      simulated: {
        minimumCash: simMinCash,
        endingCash: simEndingCash,
        hasShortfall: simMinCash < 0,
        shortfallWeek: simShortfallWeek,
        fundingGap: simFundingGap,
      },
      impactSummary,
      weeklyComparison,
    };
  }
}
