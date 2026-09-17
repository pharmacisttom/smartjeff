import { prisma } from "@/lib/prisma";

export class DeadLetterService {
  /**
   * Retrieves paginated DLQ jobs with optional status filter
   */
  public async listJobs(filter: { status?: string; queueName?: string; limit?: number } = {}) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.queueName) where.queueName = filter.queueName;

    return prisma.deadLetterJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filter.limit || 50,
    });
  }

  /**
   * Retries a dead letter job by re-inserting into outbox or resetting error state
   */
  public async retryJob(id: string): Promise<{ success: boolean; message: string }> {
    const job = await prisma.deadLetterJob.findUnique({ where: { id } });
    if (!job) {
      throw new Error("Dead letter job not found");
    }

    if (job.eventId) {
      // Re-enable in Outbox
      await prisma.outboxEvent.updateMany({
        where: { eventId: job.eventId },
        data: {
          status: "PENDING",
          retryCount: 0,
          nextRetryAt: null,
          lastError: "Manually retried from DLQ",
        },
      });
    }

    await prisma.deadLetterJob.update({
      where: { id },
      data: {
        status: "RETRIED",
        retryCount: job.retryCount + 1,
      },
    });

    return { success: true, message: `Job ${job.jobName} queued for retry.` };
  }

  /**
   * Dismisses a dead letter job with mandatory reason and auditor tracking
   */
  public async dismissJob(
    id: string,
    dismissedBy: string,
    reason: string
  ): Promise<{ success: boolean }> {
    if (!reason || reason.trim().length < 5) {
      throw new Error("A valid reason of at least 5 characters is required to dismiss a dead letter job.");
    }

    await prisma.deadLetterJob.update({
      where: { id },
      data: {
        status: "DISMISSED",
        dismissedBy,
        dismissedReason: reason,
        dismissedAt: new Date(),
      },
    });

    return { success: true };
  }
}

export const deadLetterService = new DeadLetterService();
