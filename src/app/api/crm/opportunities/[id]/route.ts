import { NextRequest, NextResponse } from "next/server";
import { OpportunityService } from "@/server/services/crm/opportunity.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const opp = await OpportunityService.getOpportunityById(params.id);
    if (!opp) return NextResponse.json({ success: false, error: "Opportunity not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: opp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const opp = await OpportunityService.updateOpportunity(params.id, body);
    return NextResponse.json({ success: true, data: opp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
