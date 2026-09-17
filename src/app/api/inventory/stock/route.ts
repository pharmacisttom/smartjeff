import { NextResponse } from "next/server";
import { StockMovementService } from "@/server/services/inventory/stock-movement.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const summary = searchParams.get("summary");

    if (summary === "true") {
      const data = await StockMovementService.getInventorySummary();
      return NextResponse.json({ success: true, data });
    }

    const balances = await StockMovementService.getStockBalances(warehouseId);
    return NextResponse.json({ success: true, data: balances });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
