import { outboxService } from "@/server/automation/outbox/outbox.service";
import { automationScheduler } from "@/server/automation/scheduler/automation-scheduler.service";

let isRunning = false;

export async function startWorkerLoop(pollIntervalMs: number = 3000) {
  isRunning = true;
  console.log(`[SmartJeff Worker] Started enterprise automation worker loop (poll: ${pollIntervalMs}ms)`);

  const loop = async () => {
    if (!isRunning) return;

    try {
      // 1. Process Transactional Outbox
      const outboxRes = await outboxService.processOutbox(50);
      if (outboxRes.processed > 0 || outboxRes.failed > 0) {
        console.log(
          `[SmartJeff Worker] Outbox processed: ${outboxRes.processed}, failed: ${outboxRes.failed}, DLQ: ${outboxRes.deadLettered}`
        );
      }

      // 2. Run Due Schedules with Distributed Lock
      await automationScheduler.runDueSchedules();
    } catch (err: any) {
      console.error("[SmartJeff Worker] Error in worker loop:", err?.message || err);
    }

    if (isRunning) {
      setTimeout(loop, pollIntervalMs);
    }
  };

  loop();
}

export function stopWorkerLoop() {
  console.log("[SmartJeff Worker] Stopping worker loop gracefully...");
  isRunning = false;
}
