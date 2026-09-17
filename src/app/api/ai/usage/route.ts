import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserForAI } from "@/server/ai/security/ai-auth-helper";
import { AIProviderFactory } from "@/server/ai/providers/ai-provider.factory";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "EXECUTIVE")) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin or Executive required" }, { status: 403 });
    }

    const provider = AIProviderFactory.getProvider();
    const health = await provider.healthCheck();

    // Query Audit Logs
    const totalRequests = await prisma.aIAuditLog.count();
    const successfulRequests = await prisma.aIAuditLog.count({
      where: { responseStatus: "SUCCESS" },
    });
    const injectionAttempts = await prisma.aIAuditLog.count({
      where: { responseStatus: "INJECTION_ATTEMPT" },
    });

    const recentLogs = await prisma.aIAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const avgLatency =
      recentLogs.length > 0
        ? Math.round(
            recentLogs.reduce((sum, log) => sum + (log.latencyMs || 0), 0) / recentLogs.length
          )
        : 0;

    // Feedback summary
    const positiveFeedback = await prisma.aIFeedback.count({ where: { rating: 1 } });
    const negativeFeedback = await prisma.aIFeedback.count({ where: { rating: -1 } });

    return NextResponse.json({
      success: true,
      providerHealth: health,
      metrics: {
        totalRequests,
        successfulRequests,
        injectionAttempts,
        avgLatencyMs: avgLatency,
        positiveFeedback,
        negativeFeedback,
      },
      recentLogs: recentLogs.map((l) => ({
        id: l.id,
        userId: l.userId,
        category: l.questionCategory,
        toolsUsed: l.toolsUsed ? JSON.parse(l.toolsUsed) : [],
        status: l.responseStatus,
        latencyMs: l.latencyMs,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
