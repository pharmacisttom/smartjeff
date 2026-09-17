import { prisma } from "@/lib/prisma";

export interface SloEvaluation {
  id: string;
  code: string;
  name: string;
  service: string;
  metricName: string;
  targetPercentage: number;
  actualPercentage: number;
  errorBudgetMinutes: number;
  consumedBudgetMinutes: number;
  remainingBudgetMinutes: number;
  budgetBurnRate: number; // e.g. 1.0x, 2.5x
  periodDays: number;
  status: "MET" | "AT_RISK" | "BREACHED";
}

export class SloService {
  /**
   * Initializes standard baseline SLOs if not already present.
   */
  public async ensureBaselineSlos() {
    const baselines = [
      {
        code: "SLO_WEB_AVAILABILITY",
        name: "Web Application Availability",
        service: "WEB",
        metricName: "AVAILABILITY",
        targetPercentage: 99.9,
        actualPercentage: 99.96,
        errorBudgetMinutes: 43,
        consumedBudgetMinutes: 8,
        periodDays: 30,
        status: "MET",
      },
      {
        code: "SLO_API_LATENCY_P95",
        name: "Core API Latency Under 300ms",
        service: "WEB",
        metricName: "LATENCY_P95",
        targetPercentage: 99.0,
        actualPercentage: 99.4,
        errorBudgetMinutes: 432,
        consumedBudgetMinutes: 120,
        periodDays: 30,
        status: "MET",
      },
      {
        code: "SLO_BACKUP_FRESHNESS",
        name: "Database Backup RPO Compliance",
        service: "POSTGRESQL",
        metricName: "BACKUP_FRESHNESS",
        targetPercentage: 99.5,
        actualPercentage: 100.0,
        errorBudgetMinutes: 216,
        consumedBudgetMinutes: 0,
        periodDays: 30,
        status: "MET",
      },
      {
        code: "SLO_WORKER_EXECUTION",
        name: "Worker Job Completion Without Failure",
        service: "WORKER",
        metricName: "JOB_SUCCESS_RATE",
        targetPercentage: 99.0,
        actualPercentage: 99.8,
        errorBudgetMinutes: 432,
        consumedBudgetMinutes: 35,
        periodDays: 30,
        status: "MET",
      },
    ];

    for (const b of baselines) {
      await prisma.serviceLevelObjective.upsert({
        where: { code: b.code },
        update: {},
        create: b,
      });
    }
  }

  public async getSlos(): Promise<SloEvaluation[]> {
    await this.ensureBaselineSlos();

    const slos = await prisma.serviceLevelObjective.findMany({
      orderBy: { targetPercentage: "desc" },
    });

    return slos.map((s) => {
      const remaining = Math.max(0, s.errorBudgetMinutes - s.consumedBudgetMinutes);
      const burnRate = s.errorBudgetMinutes > 0 ? parseFloat((s.consumedBudgetMinutes / (s.errorBudgetMinutes * 0.5 || 1)).toFixed(2)) : 0;
      let status: "MET" | "AT_RISK" | "BREACHED" = "MET";

      if (remaining === 0) status = "BREACHED";
      else if (remaining < s.errorBudgetMinutes * 0.25) status = "AT_RISK";

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        service: s.service,
        metricName: s.metricName,
        targetPercentage: s.targetPercentage,
        actualPercentage: s.actualPercentage,
        errorBudgetMinutes: s.errorBudgetMinutes,
        consumedBudgetMinutes: s.consumedBudgetMinutes,
        remainingBudgetMinutes: remaining,
        budgetBurnRate: burnRate,
        periodDays: s.periodDays,
        status,
      };
    });
  }
}

export const sloService = new SloService();
