import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helper";
import { BudgetControlService } from "@/server/services/finance/budget-control.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const transfers = await prisma.budgetTransfer.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, transfers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch budget transfers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    const userId = user?.id || "admin-id";
    const body = await req.json();

    const { action, transferId, fromBudgetLineId, toBudgetLineId, amount, reason } = body;

    if (action === "APPROVE") {
      if (!transferId) {
        return NextResponse.json(
          { success: false, error: "transferId is required" },
          { status: 400 }
        );
      }
      const applied = await BudgetControlService.approveTransfer(transferId, userId);
      return NextResponse.json({ success: true, transfer: applied });
    }

    // Default: Request transfer
    if (!fromBudgetLineId || !toBudgetLineId || !amount || !reason) {
      return NextResponse.json(
        { success: false, error: "fromBudgetLineId, toBudgetLineId, amount, and reason are required" },
        { status: 400 }
      );
    }

    const transfer = await BudgetControlService.requestTransfer({
      fromBudgetLineId,
      toBudgetLineId,
      amount: parseFloat(amount),
      reason,
      requestedBy: userId,
    });

    return NextResponse.json({ success: true, transfer });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process budget transfer" },
      { status: 500 }
    );
  }
}
