import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { webhookService } from "@/server/automation/webhooks/webhook.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      orderBy: { createdAt: "desc" },
    });

    const deliveries = await prisma.webhookDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, endpoints, deliveries });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, url, eventTypes } = body;

    if (!name || !url) {
      return NextResponse.json({ success: false, error: "name and url are required" }, { status: 400 });
    }

    // SSRF validation
    const safety = webhookService.isUrlSafe(url);
    if (!safety.safe) {
      return NextResponse.json({ success: false, error: `SSRF Blocked: ${safety.reason}` }, { status: 400 });
    }

    const secret = crypto.randomBytes(24).toString("hex");

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        name,
        url,
        eventTypesJson: JSON.stringify(eventTypes || ["*"]),
        secretHash: secret,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, endpoint, secret });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
