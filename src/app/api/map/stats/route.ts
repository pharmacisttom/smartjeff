import { NextResponse } from "next/server";
import { getLongdoQuotaStats, LONGDO_CONFIG } from "@/lib/longdo/server";

export async function GET() {
  const stats = getLongdoQuotaStats();

  return NextResponse.json({
    provider: "Longdo Map",
    enabled: LONGDO_CONFIG.isEnabled,
    browserKeyConfigured: Boolean(LONGDO_CONFIG.browserKey),
    serverKeyConfigured: Boolean(LONGDO_CONFIG.serverKey),
    dailyUsageCount: stats.dailyCount,
    warningThresholdPercent: LONGDO_CONFIG.usageWarningThresholdPercent,
    dailyQuotaMax: LONGDO_CONFIG.dailyQuotaMax,
    warningTriggered: stats.dailyCount >= (LONGDO_CONFIG.dailyQuotaMax * LONGDO_CONFIG.usageWarningThresholdPercent) / 100,
    errorsCount: stats.errorCount,
    lastResetDate: stats.lastResetDate,
    endpointStats: stats.endpointStats,
    lastCheckedAt: new Date().toISOString(),
  });
}
