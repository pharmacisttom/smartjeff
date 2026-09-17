import { NextResponse } from "next/server";
import { deadLetterService } from "@/server/automation/dead-letter/dead-letter.service";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await deadLetterService.retryJob(params.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
