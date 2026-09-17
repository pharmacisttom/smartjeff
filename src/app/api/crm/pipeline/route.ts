import { NextRequest, NextResponse } from "next/server";
import { OpportunityService } from "@/server/services/crm/opportunity.service";

export async function GET(req: NextRequest) {
  try {
    const summary = await OpportunityService.getPipelineSummary();
    return NextResponse.json({ success: true, data: summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
