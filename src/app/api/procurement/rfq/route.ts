import { NextResponse } from "next/server";
import { RFQService } from "@/server/services/procurement/rfq.service";

export async function GET() {
  try {
    const rfqs = await RFQService.getRFQs();
    return NextResponse.json({ success: true, data: rfqs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "submit_quotation") {
      const quotation = await RFQService.submitQuotation(body);
      return NextResponse.json({ success: true, data: quotation }, { status: 201 });
    }

    const rfq = await RFQService.createRFQ(body);
    return NextResponse.json({ success: true, data: rfq }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
