import { prisma } from "@/lib/prisma";
import { EventEnvelope } from "./event-envelope";

export type EventHandler = (event: EventEnvelope) => Promise<void>;

export interface SubscriptionRecord {
  eventType: string;
  consumerName: string;
  handler: EventHandler;
}

export class EventBusService {
  private static instance: EventBusService;
  private subscriptions: Map<string, SubscriptionRecord[]> = new Map();
  private isRedisEnabled: boolean = false;

  private constructor() {
    this.isRedisEnabled = Boolean(process.env.REDIS_URL && process.env.AUTOMATION_ENABLED === "true");
  }

  public static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService();
    }
    return EventBusService.instance;
  }

  public subscribe(
    eventType: string,
    consumerName: string,
    handler: EventHandler
  ): () => void {
    const list = this.subscriptions.get(eventType) || [];
    const record: SubscriptionRecord = { eventType, consumerName, handler };
    list.push(record);
    this.subscriptions.set(eventType, list);

    // Return unsubscribe callback
    return () => {
      const current = this.subscriptions.get(eventType) || [];
      this.subscriptions.set(
        eventType,
        current.filter((r) => r !== record)
      );
    };
  }

  public async publish(event: EventEnvelope): Promise<void> {
    const handlers = this.subscriptions.get(event.eventType) || [];
    const wildcardHandlers = this.subscriptions.get("*") || [];
    const allHandlers = [...handlers, ...wildcardHandlers];

    for (const sub of allHandlers) {
      // Idempotency check: ProcessedEvent tracking
      try {
        const alreadyProcessed = await prisma.processedEvent.findUnique({
          where: {
            consumerName_eventId: {
              consumerName: sub.consumerName,
              eventId: event.eventId,
            },
          },
        });

        if (alreadyProcessed) {
          continue; // Skip duplicate processing safely
        }

        // Execute handler with failure isolation
        await sub.handler(event);

        // Mark as processed
        await prisma.processedEvent.create({
          data: {
            consumerName: sub.consumerName,
            eventId: event.eventId,
          },
        });
      } catch (err: any) {
        console.error(
          `[EventBus] Consumer "${sub.consumerName}" failed for event "${event.eventId}":`,
          err?.message || err
        );
      }
    }
  }

  public async publishBatch(events: EventEnvelope[]): Promise<void> {
    for (const evt of events) {
      await this.publish(evt);
    }
  }

  public async healthCheck(): Promise<{
    ok: boolean;
    provider: string;
    subscriptionCount: number;
    registeredEventTypes: string[];
  }> {
    return {
      ok: true,
      provider: this.isRedisEnabled ? "Redis" : "In-Memory Event Bus",
      subscriptionCount: Array.from(this.subscriptions.values()).reduce(
        (sum, list) => sum + list.length,
        0
      ),
      registeredEventTypes: Array.from(this.subscriptions.keys()),
    };
  }

  // Clear subscriptions for test teardown
  public _resetForTesting(): void {
    this.subscriptions.clear();
  }
}

export const eventBus = EventBusService.getInstance();
