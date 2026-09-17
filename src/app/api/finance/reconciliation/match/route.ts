import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { BankReconciliationService } from "@/server/services/finance/bank-reconciliation.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    const userId = user?.id || "admin-id";
    const body = await req.json();

    const {
      bankTransactionId,
      targetType,
      targetId,
      matchedAmount,
      matchMethod,
      matchScore,
      matchExplanation,
    } = body;

    if (!bankTransactionId || !targetId || !matchedAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required match fields" },
        { status: 400 }
      );
    }

    const match = await BankReconciliationService.confirmMatch({
      bankTransactionId,
      targetType: targetType || "CASH_TRANSACTION",
      targetId,
      matchedAmount: parseFloat(matchedAmount),
      matchMethod: matchMethod || "MANUAL",
      matchScore: matchScore !== undefined ? parseFloat(matchScore) : 100,
      matchExplanation,
      confirmedBy: userId,
    });

    return NextResponse.json({ success: true, match });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm match" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser(req);
    const userId = user?.id || "admin-id";
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");
    const reason = searchParams.get("reason") || "Manual unmatch by user";

    if (!matchId) {
      return NextResponse.json({ success: false, error: "matchId is required" }, { status: 400 });
    }

    const result = await BankReconciliationService.unmatch(matchId, reason, userId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to unmatch" },
      { status: 500 }
    );
  }
}
