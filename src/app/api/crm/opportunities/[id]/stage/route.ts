import { NextRequest, NextResponse } from "next/server";
import { OpportunityService } from "@/server/services/crm/opportunity.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.stage) {
      return NextResponse.json({ success: false, error: "stage is required" }, { status: 400 });
    }

    const updated = await OpportunityService.updateStage(params.id, body.stage, body.performedBy);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
