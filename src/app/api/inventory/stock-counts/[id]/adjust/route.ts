import { NextResponse } from "next/server";
import { StockCountService } from "@/server/services/inventory/stock-count.service";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const result = await StockCountService.applyAdjustment(params.id, body.approvedBy || "ADMIN");
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
