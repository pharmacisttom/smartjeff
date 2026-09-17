import { NextRequest, NextResponse } from "next/server";
import { incidentManagementService } from "@/server/platform/incident/incident-management.service";

export async function GET() {
  const incidents = await incidentManagementService.getIncidents();
  return NextResponse.json({ incidents });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incident = await incidentManagementService.createIncident(body);
    return NextResponse.json({ success: true, incident });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
