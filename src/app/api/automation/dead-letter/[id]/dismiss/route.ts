import { NextResponse } from "next/server";
import { deadLetterService } from "@/server/automation/dead-letter/dead-letter.service";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { reason, dismissedBy = "Admin" } = body;

    const result = await deadLetterService.dismissJob(params.id, dismissedBy, reason);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
