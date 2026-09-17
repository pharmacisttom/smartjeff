import { NextResponse } from "next/server";
import { AssetService } from "@/server/services/inventory/asset.service";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const inspection = await AssetService.inspectAsset({
      assetId: params.id,
      inspectorId: body.inspectorId || "ADMIN",
      result: body.result || "PASS",
      checklistJson: body.checklistJson ? JSON.stringify(body.checklistJson) : undefined,
      notes: body.notes,
      photoUrl: body.photoUrl,
    });
    return NextResponse.json({ success: true, data: inspection }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
