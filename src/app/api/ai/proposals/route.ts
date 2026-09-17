import { NextResponse } from "next/server";
import { AIActionProposalService } from "@/server/ai/proposals/ai-action-proposal.service";

export async function GET() {
  const proposals = await AIActionProposalService.listProposals();
  return NextResponse.json({ proposals });
}
