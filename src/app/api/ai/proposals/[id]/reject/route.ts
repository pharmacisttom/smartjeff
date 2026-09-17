import { NextRequest, NextResponse } from "next/server";
import { AIActionProposalService } from "@/server/ai/proposals/ai-action-proposal.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Rejected by supervisor";
    const rejected = await AIActionProposalService.rejectProposal(params.id, reason);
    return NextResponse.json({ success: true, proposal: rejected });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
