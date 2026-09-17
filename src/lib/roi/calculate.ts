export interface BaselineMetrics {
  avgOTHours: number;        // OT hrs/person/month
  avgTravelKm: number;       // km/person/day
  hrHoursPerMonth: number;   // manual HR hours/month
  errorRate: number;         // errors per 100 transactions
  absenceRate: number;       // % absence
  otRate: number;            // THB/hr
  travelRate: number;        // THB/km
  hrHourlyRate: number;      // THB/hr
  avgErrorCost: number;      // THB/error
  dailyCost: number;         // THB/day
  headcount: number;
}

export interface CurrentMetrics {
  avgOTHours: number;
  avgTravelKm: number;
  hrHours: number;
  errorRate: number;
  absenceRate: number;
  headcount: number;
}

export interface ROICalculationResult {
  savings: {
    ot: number;
    travel: number;
    hrTime: number;
    errorReduction: number;
    absenceReduction: number;
    total: number;
  };
  costs: {
    subscription: number;
    setup: number;
    training: number;
    total: number;
  };
  netBenefit: number;
  roiPercent: number;
  paybackMonths: number;
  breakEvenMonthsStr: string;
}

export function calculateROI(
  baseline: BaselineMetrics,
  current: CurrentMetrics,
  subscriptionCost: number = 8000,
  setupCost: number = 0,
  trainingCost: number = 0
): ROICalculationResult {
  const headcount = current.headcount || baseline.headcount;

  const otSaved = Math.max(0, (baseline.avgOTHours - current.avgOTHours) * baseline.otRate * headcount);
  const travelSaved = Math.max(0, (baseline.avgTravelKm - current.avgTravelKm) * baseline.travelRate * headcount * 22);
  const hrTimeSaved = Math.max(0, (baseline.hrHoursPerMonth - current.hrHours) * baseline.hrHourlyRate);
  const errorSaved = Math.max(0, (baseline.errorRate - current.errorRate) * baseline.avgErrorCost * (headcount / 10));
  const absenceSaved = Math.max(0, (baseline.absenceRate - current.absenceRate) * 0.01 * baseline.dailyCost * headcount * 22);

  const totalSavings = otSaved + travelSaved + hrTimeSaved + errorSaved + absenceSaved;
  const totalCosts = subscriptionCost + setupCost + trainingCost;

  const netBenefit = totalSavings - totalCosts;
  const roiPercent = totalCosts > 0 ? (netBenefit / totalCosts) * 100 : 0;
  const paybackMonths = totalSavings > 0 ? totalCosts / totalSavings : 0;

  return {
    savings: {
      ot: Math.round(otSaved),
      travel: Math.round(travelSaved),
      hrTime: Math.round(hrTimeSaved),
      errorReduction: Math.round(errorSaved),
      absenceReduction: Math.round(absenceSaved),
      total: Math.round(totalSavings),
    },
    costs: {
      subscription: subscriptionCost,
      setup: setupCost,
      training: trainingCost,
      total: totalCosts,
    },
    netBenefit: Math.round(netBenefit),
    roiPercent: Number(roiPercent.toFixed(1)),
    paybackMonths: Number(paybackMonths.toFixed(1)),
    breakEvenMonthsStr: paybackMonths <= 0 ? 'คืนทุนทันที' : `${paybackMonths.toFixed(1)} เดือน`,
  };
}

export const DEFAULT_BASELINE: BaselineMetrics = {
  avgOTHours: 28,
  avgTravelKm: 45,
  hrHoursPerMonth: 60,
  errorRate: 4.5,
  absenceRate: 5.2,
  otRate: 150,
  travelRate: 8,
  hrHourlyRate: 250,
  avgErrorCost: 1200,
  dailyCost: 500,
  headcount: 40,
};

export const DEFAULT_CURRENT: CurrentMetrics = {
  avgOTHours: 12,
  avgTravelKm: 28,
  hrHours: 15,
  errorRate: 0.8,
  absenceRate: 1.8,
  headcount: 40,
};
