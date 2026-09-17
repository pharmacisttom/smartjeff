import { NextRequest, NextResponse } from "next/server";
import { RiskManagementService } from "@/server/services/qhse/risk-management.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const scope = searchParams.get("scope") || undefined;
    const siteId = searchParams.get("siteId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const level = searchParams.get("level") || undefined;
    const status = searchParams.get("status") || undefined;
    const isHeatmapOnly = searchParams.get("heatmap") === "true";

    if (isHeatmapOnly) {
      const heatmap = await RiskManagementService.getHeatmapData(scope, siteId, projectId);
      return NextResponse.json(heatmap);
    }

    const take = parseInt(searchParams.get("take") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const result = await RiskManagementService.getRisks({
      category,
      scope,
      siteId,
      projectId,
      level,
      status,
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

    if (body.action === "ADD_CONTROL") {
      if (!body.riskId || !body.description || !body.ownerId) {
        return NextResponse.json({ error: "riskId, description, and ownerId are required" }, { status: 400 });
      }
      const control = await RiskManagementService.addControl({
        riskId: body.riskId,
        description: body.description,
        controlType: body.controlType,
        ownerId: body.ownerId,
        status: body.status,
        evidence: body.evidence,
      });
      return NextResponse.json(control, { status: 201 });
    }

    if (body.action === "ACCEPT_RISK") {
      if (!body.riskId || !body.acceptedBy || !body.userRole) {
        return NextResponse.json({ error: "riskId, acceptedBy, and userRole are required" }, { status: 400 });
      }
      const accepted = await RiskManagementService.acceptRisk(
        body.riskId,
        body.acceptedBy,
        body.userRole,
        body.justification || "Risk accepted per formal review"
      );
      return NextResponse.json(accepted);
    }

    if (!body.title || !body.description || !body.ownerId || !body.likelihood || !body.impact) {
      return NextResponse.json({ error: "title, description, ownerId, likelihood, and impact are required" }, { status: 400 });
    }

    const risk = await RiskManagementService.createRisk({
      title: body.title,
      description: body.description,
      category: body.category,
      scope: body.scope,
      siteId: body.siteId,
      projectId: body.projectId,
      likelihood: parseInt(body.likelihood, 10),
      impact: parseInt(body.impact, 10),
      treatment: body.treatment,
      residualLikelihood: body.residualLikelihood ? parseInt(body.residualLikelihood, 10) : undefined,
      residualImpact: body.residualImpact ? parseInt(body.residualImpact, 10) : undefined,
      reviewFrequency: body.reviewFrequency,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
      ownerId: body.ownerId,
    });

    return NextResponse.json(risk, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
