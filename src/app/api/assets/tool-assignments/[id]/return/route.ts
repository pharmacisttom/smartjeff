import { NextResponse } from "next/server";
import { AssetService } from "@/server/services/inventory/asset.service";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const result = await AssetService.returnTool(params.id, body.receivedCondition || "GOOD");
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
