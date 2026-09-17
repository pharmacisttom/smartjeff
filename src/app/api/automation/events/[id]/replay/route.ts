import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { eventBus } from "@/server/automation/events/event-bus.service";
import { EventEnvelopeSchema } from "@/server/automation/events/event-envelope";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { mode = "DRY_RUN", adminConfirmed = false } = body;

    const event = await prisma.businessEvent.findFirst({
      where: {
        OR: [{ id: params.id }, { eventId: params.id }],
      },
    });

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    // Safety guardrail for irreversible financial events
    const dangerousFinancialEvents = ["PAYMENT_COMPLETED", "PAYROLL_APPROVED", "INVOICE_ISSUED"];
    if (dangerousFinancialEvents.includes(event.eventType) && mode === "ACTUAL" && !adminConfirmed) {
      return NextResponse.json(
        {
          success: false,
          error: `Safety Guardrail: Replaying financial finalization event "${event.eventType}" requires explicit adminConfirmed flag.`,
        },
        { status: 403 }
      );
    }

    const envelope = EventEnvelopeSchema.parse({
      eventId: `replay_${Date.now()}_${event.eventId}`,
      eventType: event.eventType,
      eventVersion: event.eventVersion,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      occurredAt: new Date().toISOString(),
      actorId: event.actorId,
      correlationId: `replay_${event.correlationId}`,
      causationId: event.eventId,
      payload: JSON.parse(event.payloadJson),
      metadata: event.metadataJson ? JSON.parse(event.metadataJson) : null,
    });

    if (mode === "DRY_RUN") {
      return NextResponse.json({
        success: true,
        mode: "DRY_RUN",
        message: "Dry run completed safely. No consumers executed.",
        simulatedEnvelope: envelope,
      });
    }

    // Actual replay
    await eventBus.publish(envelope);

    return NextResponse.json({
      success: true,
      mode: "ACTUAL",
      message: `Event ${event.eventType} replayed successfully.`,
      replayedEventId: envelope.eventId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
