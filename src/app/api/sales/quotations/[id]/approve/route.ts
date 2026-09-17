import { NextRequest, NextResponse } from "next/server";
import { QuotationService } from "@/server/services/crm/quotation.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.approvedBy) {
      return NextResponse.json({ success: false, error: "approvedBy is required" }, { status: 400 });
    }

    const approved = await QuotationService.approveQuotation(params.id, body.approvedBy);
    return NextResponse.json({ success: true, data: approved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
