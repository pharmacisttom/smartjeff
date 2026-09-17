import { NextRequest, NextResponse } from "next/server";
import { TenderService } from "@/server/services/crm/tender.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.decision || !body.reason || !body.reviewedBy) {
      return NextResponse.json(
        { success: false, error: "decision, reason and reviewedBy are required" },
        { status: 400 }
      );
    }

    const tender = await TenderService.recordGoNoGo(params.id, body);
    return NextResponse.json({ success: true, data: tender });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
