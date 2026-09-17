import { NextRequest, NextResponse } from "next/server";
import { AgentRuntimeService } from "@/server/ai/runtime/agent-runtime.service";
import { AIUserContext } from "@/server/ai/security/ai-authorization.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user: AIUserContext = {
      userId: body.userId || "usr_executive",
      role: body.role || "EXECUTIVE",
      siteScope: body.siteScope || [],
    };

    const response = await AgentRuntimeService.executeAgent(
      {
        userGoal: body.userGoal || body.message,
        agentCode: body.agentCode,
        conversationId: body.conversationId,
        resourceContext: body.resourceContext,
      },
      user
    );

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
