import { NextRequest, NextResponse } from "next/server";
import { OpportunityConversionService } from "@/server/services/crm/opportunity-conversion.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const preview = await OpportunityConversionService.getConversionPreview(params.id);
    return NextResponse.json({ success: true, data: preview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.confirmedBy) {
      return NextResponse.json({ success: false, error: "confirmedBy is required" }, { status: 400 });
    }

    const result = await OpportunityConversionService.convertOpportunityToProject({
      opportunityId: params.id,
      projectManagerId: body.projectManagerId,
      startDate: body.startDate,
      endDate: body.endDate,
      confirmedBy: body.confirmedBy,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
