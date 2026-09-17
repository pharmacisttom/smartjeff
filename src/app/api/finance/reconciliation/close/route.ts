import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helper";
import { BankReconciliationService } from "@/server/services/finance/bank-reconciliation.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    const userId = user?.id || "admin-id";
    const body = await req.json();

    const { statementId, overrideDiscrepancy } = body;
    if (!statementId) {
      return NextResponse.json(
        { success: false, error: "statementId is required" },
        { status: 400 }
      );
    }

    const locked = await BankReconciliationService.closeReconciliationPeriod(
      statementId,
      userId,
      !!overrideDiscrepancy
    );

    return NextResponse.json({ success: true, locked });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to close reconciliation period" },
      { status: 400 }
    );
  }
}
