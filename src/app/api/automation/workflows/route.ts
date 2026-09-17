import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workflows = await prisma.workflowDefinition.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, workflows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, domain, triggerType, triggerEvent, definitionJson, criticality, description } = body;

    if (!code || !name || !domain) {
      return NextResponse.json({ success: false, error: "code, name, and domain are required" }, { status: 400 });
    }

    const workflow = await prisma.workflowDefinition.create({
      data: {
        code,
        name,
        domain,
        triggerType: triggerType || "EVENT",
        triggerEvent: triggerEvent || null,
        status: "DRAFT",
        criticality: criticality || "MEDIUM",
        description: description || null,
        definitionJson: typeof definitionJson === "string" ? definitionJson : JSON.stringify(definitionJson || { startStepId: "step_1", steps: [] }),
      },
    });

    return NextResponse.json({ success: true, workflow });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
