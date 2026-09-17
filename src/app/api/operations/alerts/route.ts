import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserForAI } from "@/server/ai/security/ai-auth-helper";
import { OperationsIntelligenceService } from "@/server/services/operations-intelligence.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity") || undefined;
    const status = searchParams.get("status") || undefined;
    const siteId = searchParams.get("siteId") || undefined;

    const data = await OperationsIntelligenceService.getOperationsAlerts(
      severity,
      status,
      siteId,
      user.siteScope
    );

    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "EXECUTIVE" && user.role !== "HR")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { siteId, alertType, severity, title, message, metrics } = body;

    const alert = await prisma.operationalAlert.create({
      data: {
        siteId: siteId || null,
        alertType: alertType || "WORKFORCE_DEFICIT",
        severity: severity || "MEDIUM",
        title: title || "แจ้งเตือนปฏิบัติการ",
        message: message || "",
        status: "ACTIVE",
        metrics: metrics ? JSON.stringify(metrics) : null,
      },
    });

    return NextResponse.json({ success: true, alert });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action } = body; // action: ACKNOWLEDGE | RESOLVE

    if (!id || !action) {
      return NextResponse.json({ success: false, error: "id and action are required" }, { status: 400 });
    }

    const updateData: any = {};
    if (action === "ACKNOWLEDGE") {
      updateData.status = "ACKNOWLEDGED";
      updateData.acknowledgedBy = user.userId;
      updateData.acknowledgedAt = new Date();
    } else if (action === "RESOLVE") {
      updateData.status = "RESOLVED";
      updateData.resolvedBy = user.userId;
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.operationalAlert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
