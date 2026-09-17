import { NextRequest, NextResponse } from "next/server";
import { TenderService } from "@/server/services/crm/tender.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = {
      status: searchParams.get("status") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
    };

    const tenders = await TenderService.getTenders(filter);
    return NextResponse.json({ success: true, data: tenders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.clientId || !body.title || !body.submissionDeadline || !body.ownerId) {
      return NextResponse.json(
        { success: false, error: "clientId, title, submissionDeadline and ownerId are required" },
        { status: 400 }
      );
    }

    const tender = await TenderService.createTender(body);
    return NextResponse.json({ success: true, data: tender }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
