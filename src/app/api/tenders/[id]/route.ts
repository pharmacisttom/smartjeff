import { NextRequest, NextResponse } from "next/server";
import { TenderService } from "@/server/services/crm/tender.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tender = await TenderService.getTenderById(params.id);
    if (!tender) return NextResponse.json({ success: false, error: "Tender not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: tender });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const tender = await TenderService.updateTender(params.id, body);
    return NextResponse.json({ success: true, data: tender });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
