import { NextResponse } from "next/server";
import { WarehouseService } from "@/server/services/inventory/warehouse.service";

export async function GET() {
  try {
    const warehouses = await WarehouseService.getWarehouses();
    return NextResponse.json({ success: true, data: warehouses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const warehouse = await WarehouseService.createWarehouse(body);
    return NextResponse.json({ success: true, data: warehouse }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
