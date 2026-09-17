import { NextResponse } from "next/server";
import { PurchaseOrderService } from "@/server/services/procurement/purchase-order.service";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const po = await PurchaseOrderService.approvePO(params.id, body.approvedBy || "ADMIN");
    return NextResponse.json({ success: true, data: po });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
