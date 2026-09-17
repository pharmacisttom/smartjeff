import { NextRequest, NextResponse } from "next/server";
import { QuotationService } from "@/server/services/crm/quotation.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quotation = await QuotationService.getQuotationById(params.id);
    if (!quotation) return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: quotation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
