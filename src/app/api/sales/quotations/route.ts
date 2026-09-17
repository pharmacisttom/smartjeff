import { NextRequest, NextResponse } from "next/server";
import { QuotationService } from "@/server/services/crm/quotation.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = {
      opportunityId: searchParams.get("opportunityId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const quotations = await QuotationService.getQuotations(filter);
    return NextResponse.json({ success: true, data: quotations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.opportunityId || !body.clientId || !body.createdBy) {
      return NextResponse.json(
        { success: false, error: "opportunityId, clientId and createdBy are required" },
        { status: 400 }
      );
    }

    const quotation = await QuotationService.createQuotation(body);
    return NextResponse.json({ success: true, data: quotation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
