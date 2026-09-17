import { NextResponse } from "next/server";
import { ruleEngine } from "@/server/automation/rules/rule-engine.service";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sampleData = {} } = body;

    const result = await ruleEngine.simulateRule(params.id, sampleData);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
