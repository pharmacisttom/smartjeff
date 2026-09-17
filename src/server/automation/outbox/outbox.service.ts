import { prisma } from "@/lib/prisma";
import { EventEnvelope, EventEnvelopeSchema } from "../events/event-envelope";
import { eventBus } from "../events/event-bus.service";

export class OutboxService {
  /**
   * Writes the event to the Event Store (BusinessEvent) and Transactional Outbox (OutboxEvent)
   * in the exact same database transaction.
   */
  public async writeToOutbox(
    event: EventEnvelope,
    txClient?: any
  ): Promise<{ businessEventId: string; outboxEventId: string }> {
    const client = txClient || prisma;

    const payloadJson = JSON.stringify(event.payload);
    const metadataJson = event.metadata ? JSON.stringify(event.metadata) : null;

    const operation = async (tx: any) => {
      // 1. Insert to Event Store
      const businessEvent = await tx.businessEvent.create({
        data: {
          eventId: event.eventId,
          eventType: event.eventType,
          eventVersion: event.eventVersion,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          occurredAt: new Date(event.occurredAt),
          actorId: event.actorId,
          correlationId: event.correlationId,
          causationId: event.causationId,
          tenantId: event.tenantId,
          payloadJson,
          metadataJson,
        },
      });

      // 2. Insert to Transactional Outbox
      const outbox = await tx.outboxEvent.create({
        data: {
          eventId: event.eventId,
          eventType: event.eventType,
          payloadJson: JSON.stringify(event), // stores full envelope for worker
          status: "PENDING",
          retryCount: 0,
          maxRetries: 5,
        },
      });

      return { businessEventId: businessEvent.id, outboxEventId: outbox.id };
    };

    if (txClient) {
      return operation(txClient);
    } else {
      return prisma.$transaction(operation);
    }
  }

  /**
   * Worker method to process pending outbox events and dispatch them to the Event Bus.
   */
  public async processOutbox(batchSize: number = 50): Promise<{
    processed: number;
    failed: number;
    deadLettered: number;
  }> {
    const now = new Date();

    const pendingEvents = await prisma.outboxEvent.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          {
            status: "FAILED",
            retryCount: { lt: 5 },
            OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
          },
        ],
      },
      take: batchSize,
      orderBy: { createdAt: "asc" },
    });

    let processed = 0;
    let failed = 0;
    let deadLettered = 0;

    for (const item of pendingEvents) {
      // Mark as PROCESSING
      await prisma.outboxEvent.update({
        where: { id: item.id },
        data: { status: "PROCESSING" },
      });

      try {
        const envelopeRaw = JSON.parse(item.payloadJson);
        const eventEnvelope = EventEnvelopeSchema.parse(envelopeRaw);

        // Publish to Event Bus
        await eventBus.publish(eventEnvelope);

        // Mark as PROCESSED in outbox and update processedAt in BusinessEvent
        await prisma.outboxEvent.update({
          where: { id: item.id },
          data: {
            status: "PROCESSED",
            processedAt: new Date(),
          },
        });

        await prisma.businessEvent.updateMany({
          where: { eventId: item.eventId },
          data: { processedAt: new Date() },
        });

        processed++;
      } catch (err: any) {
        failed++;
        const nextRetryCount = item.retryCount + 1;
        const errorMessage = err?.message || String(err);

        if (nextRetryCount >= item.maxRetries) {
          // Send to Dead Letter Queue
          deadLettered++;
          await prisma.outboxEvent.update({
            where: { id: item.id },
            data: {
              status: "FAILED",
              retryCount: nextRetryCount,
              lastError: `Max retries exceeded: ${errorMessage}`,
            },
          });

          await prisma.deadLetterJob.create({
            data: {
              queueName: "smartjeff:outbox",
              jobName: item.eventType,
              eventId: item.eventId,
              payloadJson: item.payloadJson,
              reason: "MAX_RETRY",
              errorMessage,
              stackTrace: err?.stack || null,
              retryCount: nextRetryCount,
              status: "OPEN",
            },
          });
        } else {
          // Exponential backoff: 2^retryCount * 1000 ms
          const delayMs = Math.pow(2, nextRetryCount) * 1000;
          const nextRetryAt = new Date(Date.now() + delayMs);

          await prisma.outboxEvent.update({
            where: { id: item.id },
            data: {
              status: "FAILED",
              retryCount: nextRetryCount,
              lastError: errorMessage,
              nextRetryAt,
            },
          });
        }
      }
    }

    return { processed, failed, deadLettered };
  }
}

export const outboxService = new OutboxService();
