import { NextResponse } from "next/server";
import { GoodsReceiptService } from "@/server/services/inventory/goods-receipt.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const receipts = await GoodsReceiptService.getGoodsReceipts(warehouseId);
    return NextResponse.json({ success: true, data: receipts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gr = await GoodsReceiptService.recordGoodsReceipt(body);
    return NextResponse.json({ success: true, data: gr }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
