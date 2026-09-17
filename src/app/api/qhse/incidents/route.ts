import { NextRequest, NextResponse } from "next/server";
import { IncidentService } from "@/server/services/qhse/incident.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const incidentType = searchParams.get("incidentType") || undefined;
    const severity = searchParams.get("severity") || undefined;
    const status = searchParams.get("status") || undefined;
    const isNearMissOnly = searchParams.get("isNearMissOnly") === "true";
    const take = parseInt(searchParams.get("take") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const result = await IncidentService.getIncidents({
      siteId,
      projectId,
      incidentType,
      severity,
      status,
      isNearMissOnly,
      take,
      skip,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.reportedBy || !body.location || !body.description) {
      return NextResponse.json({ error: "reportedBy, location, and description are required" }, { status: 400 });
    }

    const incident = await IncidentService.createIncident({
      siteId: body.siteId,
      projectId: body.projectId,
      workOrderId: body.workOrderId,
      reportedBy: body.reportedBy,
      incidentType: body.incidentType,
      severity: body.severity,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
      location: body.location,
      description: body.description,
      immediateAction: body.immediateAction,
      assignedTo: body.assignedTo,
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
