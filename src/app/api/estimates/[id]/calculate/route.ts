import { NextRequest, NextResponse } from "next/server";
import { EstimationService } from "@/server/services/crm/estimation.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updated = await EstimationService.calculateEstimate(params.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
