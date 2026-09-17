import { z } from "zod";

export const EventDomainSchema = z.enum([
  "WORKFORCE",
  "ATTENDANCE",
  "SCHEDULE",
  "PAYROLL",
  "PROJECT",
  "CRM",
  "PROCUREMENT",
  "INVENTORY",
  "FLEET",
  "QHSE",
  "FINANCE",
  "TREASURY",
  "ANALYTICS",
  "PORTAL",
  "SYSTEM",
]);

export type EventDomain = z.infer<typeof EventDomainSchema>;

export const EventEnvelopeSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  eventVersion: z.number().int().positive().default(1),
  domain: EventDomainSchema.default("SYSTEM"),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  occurredAt: z.string().datetime().or(z.string()),
  actorId: z.string().optional().nullable(),
  correlationId: z.string().min(1),
  causationId: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(),
  payload: z.record(z.any()),
  metadata: z.record(z.any()).optional().nullable(),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

export interface CreateEventInput {
  eventType: string;
  domain?: EventDomain;
  eventVersion?: number;
  aggregateType: string;
  aggregateId: string;
  actorId?: string | null;
  correlationId?: string;
  causationId?: string | null;
  tenantId?: string | null;
  payload: Record<string, any>;
  metadata?: Record<string, any> | null;
}

export function createEventEnvelope(input: CreateEventInput): EventEnvelope {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const correlationId = input.correlationId || eventId;
  const occurredAt = new Date().toISOString();

  const rawEvent = {
    eventId,
    eventType: input.eventType,
    eventVersion: input.eventVersion || 1,
    domain: input.domain || "SYSTEM",
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    occurredAt,
    actorId: input.actorId || null,
    correlationId,
    causationId: input.causationId || null,
    tenantId: input.tenantId || null,
    payload: input.payload,
    metadata: input.metadata || null,
  };

  return EventEnvelopeSchema.parse(rawEvent);
}
