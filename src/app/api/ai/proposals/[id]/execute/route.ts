import { NextRequest, NextResponse } from "next/server";
import { AIActionExecutionService } from "@/server/ai/execution/ai-action-execution.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const executorUserId = body.userId || "usr_manager";
    const idempotencyKey = body.idempotencyKey;

    const outcome = await AIActionExecutionService.executeApprovedProposal(
      params.id,
      executorUserId,
      idempotencyKey
    );

    return NextResponse.json({ success: outcome.success, outcome });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
