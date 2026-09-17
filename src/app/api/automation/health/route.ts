import { NextResponse } from "next/server";
import { automationHealth } from "@/server/automation/health/automation-health.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await automationHealth.getHealth();
    return NextResponse.json({ success: true, health });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
