import { NextResponse } from "next/server";
import { BankMatchingService } from "@/server/services/finance/bank-matching.service";
import { BankReconciliationService } from "@/server/services/finance/bank-reconciliation.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("financialAccountId");
    const threshold = searchParams.get("threshold")
      ? parseFloat(searchParams.get("threshold")!)
      : 90;

    if (!accountId) {
      // Return reconciliation summary if no account specified
      const summary = await BankReconciliationService.getReconciliationSummary();
      return NextResponse.json({ success: true, summary });
    }

    const suggestions = await BankMatchingService.getSuggestionsForAccount(accountId, threshold);
    const internalTransfers = await BankMatchingService.detectInternalTransfers();

    return NextResponse.json({
      success: true,
      suggestions,
      internalTransfers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
