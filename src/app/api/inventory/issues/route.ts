import { NextResponse } from "next/server";
import { MaterialIssueService } from "@/server/services/inventory/material-issue.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const siteId = searchParams.get("siteId") || undefined;

    const issues = await MaterialIssueService.getIssues({ projectId, warehouseId, siteId });
    return NextResponse.json({ success: true, data: issues });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "return") {
      const result = await MaterialIssueService.returnMaterial(body);
      return NextResponse.json({ success: true, data: result });
    }

    const issue = await MaterialIssueService.issueMaterial(body);
    return NextResponse.json({ success: true, data: issue }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
