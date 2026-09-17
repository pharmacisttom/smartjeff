import { NextRequest, NextResponse } from "next/server";
import { LeadService } from "@/server/services/crm/lead.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await LeadService.getLeadById(params.id);
    if (!lead) return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const lead = await LeadService.updateLead(params.id, body);
    return NextResponse.json({ success: true, data: lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
