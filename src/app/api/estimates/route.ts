import { NextRequest, NextResponse } from "next/server";
import { EstimationService } from "@/server/services/crm/estimation.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get("opportunityId");
    if (!opportunityId) {
      return NextResponse.json({ success: false, error: "opportunityId is required" }, { status: 400 });
    }

    const estimates = await EstimationService.getEstimates(opportunityId);
    return NextResponse.json({ success: true, data: estimates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.opportunityId || !body.createdBy) {
      return NextResponse.json(
        { success: false, error: "opportunityId and createdBy are required" },
        { status: 400 }
      );
    }

    const estimate = await EstimationService.createEstimate(body);
    return NextResponse.json({ success: true, data: estimate }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
