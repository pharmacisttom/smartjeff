import { NextResponse } from "next/server";
import { TreasuryPositionService } from "@/server/services/finance/treasury-position.service";
import { LiquidityRiskService } from "@/server/services/finance/liquidity-risk.service";
import { FinanceExecutiveBriefService } from "@/server/services/finance/finance-executive-brief.service";
import { ensureFinanceBaselineData } from "@/server/finance/seed-finance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureFinanceBaselineData();
    const position = await TreasuryPositionService.getTreasuryPosition();
    const liquidity = await LiquidityRiskService.evaluateLiquidityRisks();
    const brief = await FinanceExecutiveBriefService.generateDailyBrief();

    return NextResponse.json({
      success: true,
      position,
      liquidity,
      brief,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch treasury position" },
      { status: 500 }
    );
  }
}
