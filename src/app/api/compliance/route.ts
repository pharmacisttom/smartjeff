import { NextRequest, NextResponse } from "next/server";
import { ComplianceService } from "@/server/services/qhse/compliance.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const scope = searchParams.get("scope") || undefined;
    const status = searchParams.get("status") || undefined;
    const siteId = searchParams.get("siteId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const isGapsOnly = searchParams.get("gaps") === "true";

    if (isGapsOnly) {
      const gaps = await ComplianceService.getGaps({
        entityType: searchParams.get("entityType") || undefined,
        severity: searchParams.get("severity") || undefined,
        status: searchParams.get("gapStatus") || undefined,
      });
      return NextResponse.json({ gaps });
    }

    const take = parseInt(searchParams.get("take") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const result = await ComplianceService.getRequirements({
      category,
      scope,
      status,
      siteId,
      projectId,
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

    if (body.action === "CREATE_GAP") {
      if (!body.requirementId || !body.entityType || !body.entityId || !body.gapDescription || !body.ownerId || !body.dueDate) {
        return NextResponse.json({ error: "Missing required fields for gap" }, { status: 400 });
      }
      const gap = await ComplianceService.createGap({
        requirementId: body.requirementId,
        entityType: body.entityType,
        entityId: body.entityId,
        gapDescription: body.gapDescription,
        severity: body.severity,
        ownerId: body.ownerId,
        dueDate: new Date(body.dueDate),
      });
      return NextResponse.json(gap, { status: 201 });
    }

    if (body.action === "RESOLVE_GAP") {
      if (!body.gapId || !body.performedBy) {
        return NextResponse.json({ error: "gapId and performedBy are required" }, { status: 400 });
      }
      const resolved = await ComplianceService.resolveGap(body.gapId, body.performedBy);
      return NextResponse.json(resolved);
    }

    if (!body.code || !body.title || !body.ownerId) {
      return NextResponse.json({ error: "code, title, and ownerId are required" }, { status: 400 });
    }

    const reqRecord = await ComplianceService.createRequirement({
      code: body.code,
      title: body.title,
      description: body.description,
      category: body.category,
      scope: body.scope,
      siteId: body.siteId,
      projectId: body.projectId,
      ownerId: body.ownerId,
      effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : undefined,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      reviewFrequency: body.reviewFrequency,
      status: body.status,
      evidenceSummary: body.evidenceSummary,
    });

    return NextResponse.json(reqRecord, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
