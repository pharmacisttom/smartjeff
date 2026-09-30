import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";

const feedbackSchema = z.object({
  module: z.string().trim().min(1).max(100),
  feature: z.string().trim().max(100).optional(),
  feedbackType: z.string().trim().min(1).max(50),
  detail: z.string().trim().min(1).max(2000),
  customerName: z.string().trim().max(100).optional(),
  organization: z.string().trim().max(100).optional(),
  contact: z.string().trim().max(100).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "VALIDATION_FAILED" }, { status: 400 });
    }

    const data = parsed.data;

    // Record as AuditLog so it persists reliably without breaking DB schema
    await AuditService.log({
      action: "DEMO_FEEDBACK_CREATED",
      entity: "DemoFeedback",
      metadata: {
        module: data.module,
        feature: data.feature,
        feedbackType: data.feedbackType,
        detail: data.detail,
        customerName: data.customerName,
        organization: data.organization,
        contact: data.contact,
        status: "NEW",
        submittedAt: new Date().toISOString(),
      },
      req,
    });

    return NextResponse.json({ success: true, message: "Feedback recorded successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { entity: "DemoFeedback" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const items = logs.map((log) => {
      let meta: any = {};
      try {
        meta = JSON.parse(log.metadata || "{}");
      } catch {}

      return {
        id: log.id,
        module: meta.module || "General",
        feature: meta.feature || "-",
        feedbackType: meta.feedbackType || "Suggestion",
        detail: meta.detail || "-",
        customerName: meta.customerName || "Anonymous",
        organization: meta.organization || "-",
        contact: meta.contact || "-",
        status: meta.status || "NEW",
        createdAt: log.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json({ success: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
