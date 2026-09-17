import { NextRequest, NextResponse } from "next/server";
import { AIActionProposalService } from "@/server/ai/proposals/ai-action-proposal.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const approverUserId = body.userId || "usr_manager";
    const approved = await AIActionProposalService.approveProposal(params.id, approverUserId);
    return NextResponse.json({ success: true, proposal: approved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
