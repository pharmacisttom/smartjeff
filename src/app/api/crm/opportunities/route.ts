import { NextRequest, NextResponse } from "next/server";
import { OpportunityService } from "@/server/services/crm/opportunity.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = {
      clientId: searchParams.get("clientId") || undefined,
      leadId: searchParams.get("leadId") || undefined,
      stage: searchParams.get("stage") || undefined,
      status: searchParams.get("status") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const opps = await OpportunityService.getOpportunities(filter);
    return NextResponse.json({ success: true, data: opps });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.clientId || !body.name || !body.ownerId) {
      return NextResponse.json(
        { success: false, error: "clientId, name and ownerId are required" },
        { status: 400 }
      );
    }

    const opp = await OpportunityService.createOpportunity(body);
    return NextResponse.json({ success: true, data: opp }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
