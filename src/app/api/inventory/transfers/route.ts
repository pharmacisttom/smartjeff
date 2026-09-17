import { NextResponse } from "next/server";
import { StockTransferService } from "@/server/services/inventory/stock-transfer.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const transfers = await StockTransferService.getTransfers(warehouseId);
    return NextResponse.json({ success: true, data: transfers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "receive") {
      const transfer = await StockTransferService.receiveTransfer(body.transferId, body.receivedBy);
      return NextResponse.json({ success: true, data: transfer });
    }

    const transfer = await StockTransferService.initiateTransfer(body);
    return NextResponse.json({ success: true, data: transfer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
