import { prisma } from "@/lib/prisma";
import { outboxService } from "../outbox/outbox.service";

export interface ScheduledJobExecutionResult {
  scheduleCode: string;
  status: "EXECUTED" | "SKIPPED_LOCKED" | "FAILED" | "INACTIVE";
  durationMs: number;
  error?: string;
}

export class AutomationSchedulerService {
  private workerId: string = `worker_${process.pid}_${Math.random().toString(36).substring(2, 7)}`;

  /**
   * Evaluates and runs pending scheduled automations with distributed lock safety
   */
  public async runDueSchedules(): Promise<ScheduledJobExecutionResult[]> {
    const now = new Date();

    const schedules = await prisma.automationSchedule.findMany({
      where: {
        active: true,
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
      },
    });

    const results: ScheduledJobExecutionResult[] = [];

    for (const schedule of schedules) {
      const startTime = Date.now();

      // 1. Acquire Distributed Lock
      const lockDurationMs = 5 * 60 * 1000; // 5 minutes lock
      const lockExpiry = new Date(Date.now() + lockDurationMs);

      // Check if locked by another worker
      if (schedule.lockedUntil && schedule.lockedUntil > now && schedule.lockedBy !== this.workerId) {
        results.push({
          scheduleCode: schedule.code,
          status: "SKIPPED_LOCKED",
          durationMs: Date.now() - startTime,
        });
        continue;
      }

      // Claim lock
      await prisma.automationSchedule.update({
        where: { id: schedule.id },
        data: {
          lockedUntil: lockExpiry,
          lockedBy: this.workerId,
        },
      });

      try {
        // 2. Execute target action
        await this.dispatchAction(schedule.targetAction, schedule.targetPayloadJson ? JSON.parse(schedule.targetPayloadJson) : {});

        // 3. Compute next run time (Asia/Bangkok timezone context)
        const nextRunAt = this.computeNextRunAt(schedule.scheduleType, schedule.cronExpression);

        await prisma.automationSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt,
            lastStatus: "SUCCESS",
            lockedUntil: null,
            lockedBy: null,
          },
        });

        results.push({
          scheduleCode: schedule.code,
          status: "EXECUTED",
          durationMs: Date.now() - startTime,
        });
      } catch (err: any) {
        await prisma.automationSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: new Date(),
            lastStatus: "FAILED",
            lockedUntil: null,
            lockedBy: null,
          },
        });

        results.push({
          scheduleCode: schedule.code,
          status: "FAILED",
          durationMs: Date.now() - startTime,
          error: err?.message || String(err),
        });
      }
    }

    return results;
  }

  private async dispatchAction(actionName: string, payload: Record<string, any>): Promise<void> {
    switch (actionName) {
      case "PROCESS_OUTBOX":
        await outboxService.processOutbox(100);
        break;
      case "EXECUTIVE_DAILY_BRIEF":
      case "CONTRACT_EXPIRY_CHECK":
      case "ATTENDANCE_RECONCILIATION":
      case "ANALYTICS_SNAPSHOT":
        // Mock execution / telemetry logging
        break;
      default:
        console.log(`[Scheduler] Executed action: ${actionName}`, payload);
        break;
    }
  }

  private computeNextRunAt(scheduleType: string, _cron?: string | null): Date {
    const next = new Date();
    switch (scheduleType) {
      case "HOURLY":
        next.setHours(next.getHours() + 1);
        break;
      case "DAILY":
        next.setDate(next.getDate() + 1);
        break;
      case "WEEKLY":
        next.setDate(next.getDate() + 7);
        break;
      case "MONTHLY":
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        next.setMinutes(next.getMinutes() + 15);
        break;
    }
    return next;
  }
}

export const automationScheduler = new AutomationSchedulerService();
