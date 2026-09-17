import { NextRequest, NextResponse } from "next/server";
import { AIGovernanceService } from "@/server/ai/governance/ai-governance.service";

export async function GET() {
  const policies = await AIGovernanceService.listPolicies();
  return NextResponse.json({ policies });
}
