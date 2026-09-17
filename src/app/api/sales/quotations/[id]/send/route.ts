import { NextRequest, NextResponse } from "next/server";
import { QuotationService } from "@/server/services/crm/quotation.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const sent = await QuotationService.sendQuotation(params.id, body.sentBy);
    return NextResponse.json({ success: true, data: sent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
