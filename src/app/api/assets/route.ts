import { NextResponse } from "next/server";
import { AssetService } from "@/server/services/inventory/asset.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const siteId = searchParams.get("siteId") || undefined;
    const search = searchParams.get("search") || undefined;

    const assets = await AssetService.getAssets({ category, status, siteId, search });
    return NextResponse.json({ success: true, data: assets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const asset = await AssetService.createAsset(body);
    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
