import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rules = await prisma.ruleDefinition.findMany({
      orderBy: { priority: "asc" },
    });
    return NextResponse.json({ success: true, rules });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, domain, ruleType, description, conditions, actions, priority, enabled } = body;

    if (!code || !name || !domain) {
      return NextResponse.json({ success: false, error: "code, name, and domain are required" }, { status: 400 });
    }

    const rule = await prisma.ruleDefinition.create({
      data: {
        code,
        name,
        domain,
        ruleType: ruleType || "THRESHOLD",
        description: description || null,
        conditionsJson: typeof conditions === "string" ? conditions : JSON.stringify(conditions || { logicalOperator: "AND", conditions: [] }),
        actionsJson: typeof actions === "string" ? actions : JSON.stringify(actions || []),
        priority: priority != null ? Number(priority) : 100,
        enabled: enabled ?? true,
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
