import { NextResponse } from "next/server";
import { integrationCredentialService } from "@/server/automation/integrations/integration-credential.service";
import { createEventEnvelope } from "@/server/automation/events/event-envelope";
import { outboxService } from "@/server/automation/outbox/outbox.service";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    const clientId = req.headers.get("X-Client-Id");
    const clientSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.headers.get("X-Client-Secret");

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Missing client credentials (X-Client-Id and Bearer token / X-Client-Secret)" },
        { status: 401 }
      );
    }

    const verification = await integrationCredentialService.verifyCredential(
      clientId,
      clientSecret,
      "write:integration-events",
      {
        endpoint: `/api/integrations/incoming/${params.key}`,
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      }
    );

    if (!verification.valid) {
      return NextResponse.json({ success: false, error: verification.reason }, { status: 403 });
    }

    const body = await req.json();

    const envelope = createEventEnvelope({
      eventType: "EXTERNAL_WEBHOOK_RECEIVED",
      domain: "SYSTEM",
      aggregateType: "INTEGRATION",
      aggregateId: params.key,
      payload: {
        endpointKey: params.key,
        clientId,
        receivedData: body,
      },
      correlationId: `ext_${Date.now()}_${params.key}`,
    });

    await outboxService.writeToOutbox(envelope);

    await integrationCredentialService.logAudit({
      credentialId: verification.credential.id,
      endpoint: `/api/integrations/incoming/${params.key}`,
      action: "EXTERNAL_WEBHOOK_ACCEPTED",
      status: "SUCCESS",
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      responseCode: 200,
    });

    return NextResponse.json({
      success: true,
      message: "Event accepted and queued for processing.",
      eventId: envelope.eventId,
      correlationId: envelope.correlationId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
