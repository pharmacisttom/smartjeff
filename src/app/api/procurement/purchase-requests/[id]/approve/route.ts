import { NextResponse } from "next/server";
import { PurchaseRequestService } from "@/server/services/procurement/purchase-request.service";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const pr = await PurchaseRequestService.approvePR(
      params.id,
      body.approvedBy || "ADMIN",
      body.status || "APPROVED"
    );
    return NextResponse.json({ success: true, data: pr });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
