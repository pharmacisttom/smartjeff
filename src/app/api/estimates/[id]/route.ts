import { NextRequest, NextResponse } from "next/server";
import { EstimationService } from "@/server/services/crm/estimation.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const estimate = await EstimationService.getEstimateById(params.id);
    if (!estimate) return NextResponse.json({ success: false, error: "Estimate not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: estimate });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
