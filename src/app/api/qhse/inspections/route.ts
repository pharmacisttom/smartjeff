import { NextRequest, NextResponse } from "next/server";
import { InspectionService } from "@/server/services/qhse/inspection.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const templateId = searchParams.get("templateId") || undefined;
    const result = searchParams.get("result") || undefined;
    const isTemplatesOnly = searchParams.get("templates") === "true";
    const category = searchParams.get("category") || undefined;

    if (isTemplatesOnly) {
      const templates = await InspectionService.getTemplates(category);
      return NextResponse.json({ templates });
    }

    const take = parseInt(searchParams.get("take") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const data = await InspectionService.getInspections({
      siteId,
      projectId,
      templateId,
      result,
      take,
      skip,
    });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if creating a template vs submitting an inspection
    if (body.action === "CREATE_TEMPLATE") {
      if (!body.name || !Array.isArray(body.items)) {
        return NextResponse.json({ error: "name and items array are required for template" }, { status: 400 });
      }
      const template = await InspectionService.createTemplate({
        name: body.name,
        category: body.category,
        frequency: body.frequency,
        createdBy: body.createdBy || "SYSTEM",
        items: body.items,
      });
      return NextResponse.json(template, { status: 201 });
    }

    // Otherwise submit inspection
    if (!body.templateId || !body.inspectorId || !Array.isArray(body.items)) {
      return NextResponse.json({ error: "templateId, inspectorId, and items array are required" }, { status: 400 });
    }

    const inspection = await InspectionService.submitInspection({
      templateId: body.templateId,
      siteId: body.siteId,
      projectId: body.projectId,
      assetId: body.assetId,
      vehicleId: body.vehicleId,
      supplierId: body.supplierId,
      inspectorId: body.inspectorId,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
      notes: body.notes,
      signatureUrl: body.signatureUrl,
      items: body.items,
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
