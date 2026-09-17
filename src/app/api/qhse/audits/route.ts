import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/server/services/qhse/audit.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;
    const siteId = searchParams.get("siteId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;

    const audits = await AuditService.getAudits({
      type,
      status,
      siteId,
      projectId,
    });

    return NextResponse.json({ audits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "CREATE_PROGRAM") {
      if (!body.year || !body.title) {
        return NextResponse.json({ error: "year and title are required" }, { status: 400 });
      }
      const program = await AuditService.createProgram({
        year: parseInt(body.year, 10),
        title: body.title,
        description: body.description,
      });
      return NextResponse.json(program, { status: 201 });
    }

    if (body.action === "RECORD_CHECKLIST") {
      if (!body.auditId || !Array.isArray(body.items)) {
        return NextResponse.json({ error: "auditId and items array are required" }, { status: 400 });
      }
      const results = await AuditService.recordChecklistResults(body.auditId, body.items);
      return NextResponse.json(results, { status: 201 });
    }

    if (!body.scope || !body.leadAuditorId || !body.scheduledDate) {
      return NextResponse.json({ error: "scope, leadAuditorId, and scheduledDate are required" }, { status: 400 });
    }

    const audit = await AuditService.scheduleAudit({
      programId: body.programId,
      type: body.type,
      scope: body.scope,
      leadAuditorId: body.leadAuditorId,
      siteId: body.siteId,
      projectId: body.projectId,
      supplierId: body.supplierId,
      scheduledDate: new Date(body.scheduledDate),
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
