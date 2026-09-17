import { NextResponse } from "next/server";
import { getAuthUserForAI } from "@/server/ai/security/ai-auth-helper";
import { OperationsIntelligenceService } from "@/server/services/operations-intelligence.service";
import { AIBriefService } from "@/server/ai/services/ai-brief.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [live, dailyBrief, alerts] = await Promise.all([
      OperationsIntelligenceService.getLiveOperations(user.siteScope),
      AIBriefService.generateDailyBrief(),
      OperationsIntelligenceService.getOperationsAlerts(undefined, "ACTIVE", undefined, user.siteScope),
    ]);

    return NextResponse.json({
      success: true,
      liveSummary: live.summary,
      dailyBrief: dailyBrief.briefText,
      activeAlertsCount: alerts.totalAlerts,
      dataFreshness: live.dataFreshness,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
