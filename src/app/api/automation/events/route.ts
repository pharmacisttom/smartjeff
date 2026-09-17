import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEventEnvelope } from "@/server/automation/events/event-envelope";
import { outboxService } from "@/server/automation/outbox/outbox.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get("eventType");
    const correlationId = searchParams.get("correlationId");
    const aggregateId = searchParams.get("aggregateId");
    const limit = Number(searchParams.get("limit") || 50);

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (correlationId) where.correlationId = correlationId;
    if (aggregateId) where.aggregateId = aggregateId;

    const events = await prisma.businessEvent.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const envelope = createEventEnvelope({
      eventType: body.eventType,
      domain: body.domain,
      aggregateType: body.aggregateType || "GENERIC",
      aggregateId: body.aggregateId || `agg_${Date.now()}`,
      payload: body.payload || {},
      actorId: body.actorId || null,
      correlationId: body.correlationId,
      causationId: body.causationId,
    });

    const result = await outboxService.writeToOutbox(envelope);

    return NextResponse.json({ success: true, event: envelope, outbox: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
