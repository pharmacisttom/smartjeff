import { NextResponse } from "next/server";
import { deadLetterService } from "@/server/automation/dead-letter/dead-letter.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const queueName = searchParams.get("queueName") || undefined;

    const jobs = await deadLetterService.listJobs({ status, queueName });
    return NextResponse.json({ success: true, jobs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
