import { NextResponse } from "next/server";
import { webhookService } from "@/server/automation/webhooks/webhook.service";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await webhookService.sendTestPing(params.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
