import { NextResponse } from "next/server";
import { RFQService } from "@/server/services/procurement/rfq.service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const comparison = await RFQService.compareQuotations(params.id);
    return NextResponse.json({ success: true, data: comparison });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
