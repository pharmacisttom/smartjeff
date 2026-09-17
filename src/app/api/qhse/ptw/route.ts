import { NextRequest, NextResponse } from "next/server";
import { PermitService } from "@/server/services/qhse/permit.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;

    const ptws = await PermitService.getPTWs({
      siteId,
      projectId,
      status,
      type,
    });

    return NextResponse.json({ ptws });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "APPROVE") {
      if (!body.ptwId || !body.approvedBy) {
        return NextResponse.json({ error: "ptwId and approvedBy are required" }, { status: 400 });
      }
      const approved = await PermitService.approvePTW(body.ptwId, body.approvedBy, body.safetyOfficerNotes);
      return NextResponse.json(approved);
    }

    if (body.action === "ACTIVATE") {
      if (!body.ptwId) {
        return NextResponse.json({ error: "ptwId is required" }, { status: 400 });
      }
      const active = await PermitService.activatePTW(body.ptwId);
      return NextResponse.json(active);
    }

    if (body.action === "CLOSE") {
      if (!body.ptwId || !body.closedBy) {
        return NextResponse.json({ error: "ptwId and closedBy are required" }, { status: 400 });
      }
      const closed = await PermitService.closePTW(body.ptwId, body.closedBy);
      return NextResponse.json(closed);
    }

    if (!body.requestedBy || !body.validFrom || !body.validTo || !body.location || !body.hazardSummary || !body.controlsChecklist) {
      return NextResponse.json({ error: "Missing required PTW fields" }, { status: 400 });
    }

    const ptw = await PermitService.requestPTW({
      siteId: body.siteId,
      projectId: body.projectId,
      workOrderId: body.workOrderId,
      type: body.type,
      requestedBy: body.requestedBy,
      validFrom: new Date(body.validFrom),
      validTo: new Date(body.validTo),
      location: body.location,
      hazardSummary: body.hazardSummary,
      controlsChecklist: body.controlsChecklist,
    });

    return NextResponse.json(ptw, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
