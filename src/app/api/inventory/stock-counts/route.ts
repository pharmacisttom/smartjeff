import { NextResponse } from "next/server";
import { StockCountService } from "@/server/services/inventory/stock-count.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const counts = await StockCountService.getStockCounts(warehouseId);
    return NextResponse.json({ success: true, data: counts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const count = await StockCountService.createStockCount(body);
    return NextResponse.json({ success: true, data: count }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
