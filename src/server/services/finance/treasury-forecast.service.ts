import { prisma } from "@/lib/prisma";

export interface ForecastWeek {
  weekNumber: number; // 1 to 13
  startDate: string;
  endDate: string;
  openingCash: number;
  expectedInflows: {
    customerCollections: number;
    otherInflows: number;
    total: number;
  };
  expectedOutflows: {
    supplierPayments: number;
    payroll: number;
    expenses: number;
    fleet: number;
    procurement: number;
    otherCommitments: number;
    total: number;
  };
  netCashFlow: number;
  closingCash: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export class TreasuryForecastService {
  /**
   * Generates a 13-week rolling cash flow forecast
   */
  static async get13WeekForecast(): Promise<{
    currentCash: number;
    minimumProjectedCash: number;
    forecastWeeks: ForecastWeek[];
  }> {
    const accounts = await prisma.financialAccount.findMany({
      where: { status: "ACTIVE" },
    });
    const currentCash = accounts.reduce((s, a) => s + a.ledgerBalance, 0);

    const now = new Date();
    let rollingCash = currentCash;
    let minCash = currentCash;

    const forecastWeeks: ForecastWeek[] = [];

    for (let w = 1; w <= 13; w++) {
      const weekStart = new Date(now.getTime() + (w - 1) * 7 * 86400000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);

      // Baseline projection with realistic operational decay and mid-month payroll spikes
      const isPayrollWeek = w === 2 || w === 6 || w === 10;
      const payrollCost = isPayrollWeek ? 350000 : 0;
      const customerCollections = Math.round((420000 - (w > 8 ? (w - 8) * 15000 : 0)) * 100) / 100;
      const supplierPayments = Math.round(180000 * 100) / 100;
      const expenses = 45000;
      const fleet = 30000;
      const procurement = 65000;
      const otherCommitments = 15000;

      const totalInflow = customerCollections;
      const totalOutflow = supplierPayments + payrollCost + expenses + fleet + procurement + otherCommitments;
      const net = Math.round((totalInflow - totalOutflow) * 100) / 100;
      const closing = Math.round((rollingCash + net) * 100) / 100;

      if (closing < minCash) {
        minCash = closing;
      }

      // Confidence level: W1-W4 HIGH, W5-W8 MEDIUM, W9-W13 LOW
      let confidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
      if (w > 8) confidence = "LOW";
      else if (w > 4) confidence = "MEDIUM";

      forecastWeeks.push({
        weekNumber: w,
        startDate: weekStart.toISOString().split("T")[0],
        endDate: weekEnd.toISOString().split("T")[0],
        openingCash: Math.round(rollingCash * 100) / 100,
        expectedInflows: {
          customerCollections,
          otherInflows: 0,
          total: totalInflow,
        },
        expectedOutflows: {
          supplierPayments,
          payroll: payrollCost,
          expenses,
          fleet,
          procurement,
          otherCommitments,
          total: totalOutflow,
        },
        netCashFlow: net,
        closingCash: closing,
        confidence,
      });

      rollingCash = closing;
    }

    return {
      currentCash: Math.round(currentCash * 100) / 100,
      minimumProjectedCash: Math.round(minCash * 100) / 100,
      forecastWeeks,
    };
  }

  /**
   * Get 30-day daily cash projection
   */
  static async get30DayForecast() {
    const accounts = await prisma.financialAccount.findMany({ where: { status: "ACTIVE" } });
    const currentCash = accounts.reduce((s, a) => s + a.ledgerBalance, 0);

    const now = new Date();
    let rolling = currentCash;
    const dailyPoints = [];

    for (let d = 0; d < 30; d++) {
      const targetDate = new Date(now.getTime() + d * 86400000);
      const dayStr = targetDate.toISOString().split("T")[0];

      // Estimate modest daily inflow/outflow
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
      const dayInflow = isWeekend ? 0 : 55000;
      const dayOutflow = isWeekend ? 5000 : 42000;
      rolling = rolling + dayInflow - dayOutflow;

      dailyPoints.push({
        date: dayStr,
        inflow: dayInflow,
        outflow: dayOutflow,
        closingCash: Math.round(rolling * 100) / 100,
      });
    }

    return {
      currentCash: Math.round(currentCash * 100) / 100,
      dailyPoints,
    };
  }

  /**
   * Payment & Collection Calendar Events
   */
  static async getTreasuryCalendar(monthYear: string) {
    // Return structured calendar events for the selected month
    return [
      {
        id: "ev-1",
        date: `${monthYear}-05`,
        type: "SUPPLIER_PAYMENT",
        title: "Vendor Batch: Safety Equipment & PPE",
        amount: 85000,
        direction: "OUTFLOW",
        status: "APPROVED",
        confidence: "HIGH",
      },
      {
        id: "ev-2",
        date: `${monthYear}-10`,
        type: "COLLECTION",
        title: "Client Payment: Site Bangna Phase 3",
        amount: 320000,
        direction: "INFLOW",
        status: "CONFIRMED",
        confidence: "HIGH",
      },
      {
        id: "ev-3",
        date: `${monthYear}-15`,
        type: "EXPENSE",
        title: "Fleet Fuel & Maintenance Pool",
        amount: 42000,
        direction: "OUTFLOW",
        status: "SCHEDULED",
        confidence: "MEDIUM",
      },
      {
        id: "ev-4",
        date: `${monthYear}-25`,
        type: "PAYROLL",
        title: "Monthly Staff & Guard Payroll Run",
        amount: 380000,
        direction: "OUTFLOW",
        status: "SCHEDULED",
        confidence: "HIGH",
      },
      {
        id: "ev-5",
        date: `${monthYear}-28`,
        type: "COLLECTION",
        title: "Client Payment: Chonburi Logistics Hub",
        amount: 275000,
        direction: "INFLOW",
        status: "PROMISE_TO_PAY",
        confidence: "MEDIUM",
      },
    ];
  }
}
