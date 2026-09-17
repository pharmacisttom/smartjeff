import { NextRequest, NextResponse } from "next/server";
import { businessContinuityService } from "@/server/platform/continuity/business-continuity.service";

export async function GET() {
  const status = await businessContinuityService.getMaintenanceStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await businessContinuityService.setMaintenanceMode({
      mode: body.mode,
      reason: body.reason,
      bypassRoles: body.bypassRoles,
      scheduledEndAt: body.scheduledEndAt ? new Date(body.scheduledEndAt) : undefined,
      createdBy: body.createdBy || "SRE Lead",
    });
    return NextResponse.json({ success: true, maintenance: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
