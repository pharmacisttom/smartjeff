import { NextRequest, NextResponse } from "next/server";
import { QHSERiskIntelligenceService } from "@/server/services/qhse/qhse-risk-intelligence.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;

    const [metrics, predictiveAlerts, repeatFindings] = await Promise.all([
      QHSERiskIntelligenceService.getExecutiveMetrics(siteId),
      QHSERiskIntelligenceService.getPredictiveAlerts(),
      QHSERiskIntelligenceService.detectRepeatFindings(),
    ]);

    return NextResponse.json({
      metrics,
      predictiveAlerts,
      repeatFindings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
