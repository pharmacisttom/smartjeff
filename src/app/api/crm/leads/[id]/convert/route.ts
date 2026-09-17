import { NextRequest, NextResponse } from "next/server";
import { LeadService } from "@/server/services/crm/lead.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await LeadService.convertLeadToClient(params.id, body.performedBy);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
