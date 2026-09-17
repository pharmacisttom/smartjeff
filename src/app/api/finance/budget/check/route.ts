import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { BudgetControlService } from "@/server/services/finance/budget-control.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    const userId = user?.id || "admin-id";
    const body = await req.json();

    const { budgetLineId, category, department, projectId, amount, transactionReference } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid amount is required" },
        { status: 400 }
      );
    }

    const checkResult = await BudgetControlService.checkBudget({
      budgetLineId,
      category,
      department,
      projectId,
      amount: parseFloat(amount),
      transactionReference: transactionReference || "CHECK-REQ",
      requestedBy: userId,
    });

    return NextResponse.json({ success: true, result: checkResult });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check budget" },
      { status: 500 }
    );
  }
}
