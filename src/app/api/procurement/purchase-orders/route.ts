import { NextResponse } from "next/server";
import { PurchaseOrderService } from "@/server/services/procurement/purchase-order.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const supplierId = searchParams.get("supplierId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;

    const pos = await PurchaseOrderService.getPOs({ status, supplierId, projectId });
    return NextResponse.json({ success: true, data: pos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "revise") {
      const revised = await PurchaseOrderService.revisePO(
        body.poId,
        body.revisionReason,
        body
      );
      return NextResponse.json({ success: true, data: revised });
    }

    const po = await PurchaseOrderService.createPO(body);
    return NextResponse.json({ success: true, data: po }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
