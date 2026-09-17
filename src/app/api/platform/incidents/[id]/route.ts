import { NextRequest, NextResponse } from "next/server";
import { incidentManagementService } from "@/server/platform/incident/incident-management.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await incidentManagementService.updateIncidentStatus(params.id, body);
    return NextResponse.json({ success: true, incident: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
