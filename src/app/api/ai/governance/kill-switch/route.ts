import { NextRequest, NextResponse } from "next/server";
import { AIGovernanceService } from "@/server/ai/governance/ai-governance.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const active = body.active === true;
    const admin = body.adminName || "Admin";

    const state = AIGovernanceService.setKillSwitch(active, admin);
    return NextResponse.json({ success: true, killSwitchActive: state });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
