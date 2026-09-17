import { NextResponse } from "next/server";
import { workflowEngine } from "@/server/automation/workflow/workflow-engine.service";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { approvedBy = "System Admin", changeReason = "Published by Authorized Officer" } = body;

    const result = await workflowEngine.publishWorkflow(params.id, approvedBy, changeReason);

    if (!result.success) {
      return NextResponse.json({ success: false, errors: result.errors }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Workflow successfully published and active." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
