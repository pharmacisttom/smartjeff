import { NextRequest, NextResponse } from "next/server";
import { FindingService } from "@/server/services/qhse/finding.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const classification = searchParams.get("classification") || undefined;
    const status = searchParams.get("status") || undefined;
    const source = searchParams.get("source") || undefined;
    const ownerId = searchParams.get("ownerId") || undefined;
    const take = parseInt(searchParams.get("take") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const result = await FindingService.getFindings({
      siteId,
      projectId,
      classification,
      status,
      source,
      ownerId,
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

    if (body.action === "CREATE_NCR") {
      if (!body.requirement || !body.actualCondition || !body.ownerId) {
        return NextResponse.json({ error: "requirement, actualCondition, and ownerId are required" }, { status: 400 });
      }
      const ncr = await FindingService.createNonConformance({
        findingId: body.findingId,
        requirement: body.requirement,
        actualCondition: body.actualCondition,
        evidence: body.evidence,
        impact: body.impact,
        source: body.source,
        ownerId: body.ownerId,
      });
      return NextResponse.json(ncr, { status: 201 });
    }

    if (!body.title || !body.description || !body.ownerId || !body.dueDate) {
      return NextResponse.json({ error: "title, description, ownerId, and dueDate are required" }, { status: 400 });
    }

    const finding = await FindingService.createFinding({
      title: body.title,
      description: body.description,
      source: body.source,
      sourceId: body.sourceId,
      incidentId: body.incidentId,
      inspectionId: body.inspectionId,
      classification: body.classification,
      siteId: body.siteId,
      projectId: body.projectId,
      ownerId: body.ownerId,
      dueDate: new Date(body.dueDate),
      priority: body.priority,
    });

    return NextResponse.json(finding, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
