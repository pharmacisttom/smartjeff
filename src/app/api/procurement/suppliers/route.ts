import { NextResponse } from "next/server";
import { SupplierService } from "@/server/services/procurement/supplier.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const metrics = searchParams.get("metrics");

    if (metrics === "true") {
      const data = await SupplierService.getSupplierDeliveryMetrics();
      return NextResponse.json({ success: true, data });
    }

    const suppliers = await SupplierService.getSuppliers({ status, search });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supplier = await SupplierService.createSupplier(body);
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
