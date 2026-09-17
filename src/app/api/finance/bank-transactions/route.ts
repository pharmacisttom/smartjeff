import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helper";
import { BankReconciliationService } from "@/server/services/finance/bank-reconciliation.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("financialAccountId");
    const statementId = searchParams.get("statementId");
    const status = searchParams.get("status");
    const direction = searchParams.get("direction");

    const transactions = await prisma.bankTransaction.findMany({
      where: {
        ...(accountId ? { financialAccountId: accountId } : {}),
        ...(statementId ? { statementId } : {}),
        ...(status ? { status } : {}),
        ...(direction ? { direction } : {}),
      },
      orderBy: { transactionDate: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch bank transactions" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser(req);
    const userId = user?.id || "admin-id";
    const body = await req.json();

    const { bankTransactionId, action, reason, category, notes } = body;
    if (!bankTransactionId) {
      return NextResponse.json(
        { success: false, error: "bankTransactionId is required" },
        { status: 400 }
      );
    }

    if (action === "EXCLUDE") {
      const result = await BankReconciliationService.excludeTransaction(
        bankTransactionId,
        reason,
        userId
      );
      return NextResponse.json({ success: true, result });
    }

    if (action === "CATEGORIZE") {
      const result = await BankReconciliationService.categorizeUnmatched(
        bankTransactionId,
        category,
        userId
      );
      return NextResponse.json({ success: true, result });
    }

    if (action === "CREATE_ADJUSTMENT") {
      const result = await BankReconciliationService.createAdjustmentForFeeOrInterest(
        bankTransactionId,
        userId,
        notes
      );
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update bank transaction" },
      { status: 500 }
    );
  }
}
