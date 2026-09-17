import { NextResponse } from "next/server";
import { AssetService } from "@/server/services/inventory/asset.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const assignment = await AssetService.assignTool(body);
    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
