import { NextRequest, NextResponse } from "next/server";
import { LeadService } from "@/server/services/crm/lead.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = {
      status: searchParams.get("status") || undefined,
      source: searchParams.get("source") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const leads = await LeadService.getLeads(filter);
    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.companyName || !body.contactName) {
      return NextResponse.json(
        { success: false, error: "companyName and contactName are required" },
        { status: 400 }
      );
    }

    const lead = await LeadService.createLead(body);
    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
