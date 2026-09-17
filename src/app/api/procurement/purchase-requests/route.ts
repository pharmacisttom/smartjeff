import { NextResponse } from "next/server";
import { PurchaseRequestService } from "@/server/services/procurement/purchase-request.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const projectId = searchParams.get("projectId") || undefined;
    const requesterId = searchParams.get("requesterId") || undefined;

    const prs = await PurchaseRequestService.getPRs({ status, projectId, requesterId });
    return NextResponse.json({ success: true, data: prs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pr = await PurchaseRequestService.createPR(body);
    return NextResponse.json({ success: true, data: pr }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
