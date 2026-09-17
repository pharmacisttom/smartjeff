import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { BudgetPlanningService } from "@/server/services/finance/budget-planning.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("id");
    const fiscalYear = searchParams.get("fiscalYear")
      ? parseInt(searchParams.get("fiscalYear")!, 10)
      : undefined;

    if (planId) {
      const detail = await BudgetPlanningService.getBudgetPlanDetail(planId);
      return NextResponse.json({ success: true, detail });
    }

    const plans = await BudgetPlanningService.getBudgetPlans(fiscalYear);
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch budget plans" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    const userId = user?.id || "admin-id";
    const body = await req.json();

    const { action } = body;

    if (action === "SUBMIT") {
      const updated = await BudgetPlanningService.submitPlan(body.planId, userId);
      return NextResponse.json({ success: true, plan: updated });
    }

    if (action === "APPROVE") {
      const updated = await BudgetPlanningService.approvePlan(body.planId, userId);
      return NextResponse.json({ success: true, plan: updated });
    }

    if (action === "REVISE") {
      const revision = await BudgetPlanningService.createRevision(
        body.planId,
        body.reasonCategory || "MANAGEMENT_DECISION",
        body.notes || "Budget revision",
        userId
      );
      return NextResponse.json({ success: true, revision });
    }

    // Default: Create plan
    const { name, fiscalYear, lines, notes, currency } = body;
    if (!name || !fiscalYear || !lines || lines.length === 0) {
      return NextResponse.json(
        { success: false, error: "name, fiscalYear, and lines are required" },
        { status: 400 }
      );
    }

    const plan = await BudgetPlanningService.createBudgetPlan({
      name,
      fiscalYear: parseInt(fiscalYear, 10),
      currency,
      notes,
      createdBy: userId,
      lines,
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process budget request" },
      { status: 500 }
    );
  }
}
