import { NextRequest, NextResponse } from "next/server";
import { EstimationAccuracyService } from "@/server/services/crm/estimation-accuracy.service";

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const accuracy = await EstimationAccuracyService.getProjectEstimateVsActual(params.projectId);
    return NextResponse.json({ success: true, data: accuracy });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
