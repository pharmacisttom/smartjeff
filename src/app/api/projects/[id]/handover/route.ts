import { NextRequest, NextResponse } from "next/server";
import { ProjectHandoverService } from "@/server/services/crm/project-handover.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const handover = await ProjectHandoverService.getHandoverByProject(params.id);
    return NextResponse.json({ success: true, data: handover });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const handover = await ProjectHandoverService.updateHandoverChecklist(body.handoverId || params.id, body);
    return NextResponse.json({ success: true, data: handover });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.acceptedBy) {
      return NextResponse.json({ success: false, error: "acceptedBy is required" }, { status: 400 });
    }

    const handover = await ProjectHandoverService.acceptHandoverByOperations(
      body.handoverId || params.id,
      body.acceptedBy,
      body.notes
    );
    return NextResponse.json({ success: true, data: handover });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
