import { NextResponse } from "next/server";
import { StockMovementService } from "@/server/services/inventory/stock-movement.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const itemId = searchParams.get("itemId") || undefined;
    const movementType = searchParams.get("movementType") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const movements = await StockMovementService.getStockMovements({
      warehouseId,
      itemId,
      movementType,
      projectId,
      limit,
    });
    return NextResponse.json({ success: true, data: movements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
