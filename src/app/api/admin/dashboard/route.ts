import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { generateDailyExecutiveReport } from "@/lib/automation/daily-report";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  // Central Authorization Check
  const auth = await AuthorizationService.authorize({
    userId: session.sub,
    permission: "dashboard.read",
  });
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.reason }, { status: 403 });
  }

  const executiveData = await generateDailyExecutiveReport();

  // Compute Security Governance Metrics for Dashboard
  const [totalUsers, mfaUsers, totalRoles, activeSessions, pendingReviews] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true, mfaEnabled: true } }),
    prisma.role.count({ where: { isActive: true } }),
    prisma.userSession.count({ where: { status: "ACTIVE" } }),
    prisma.accessRequest.count({ where: { status: "PENDING" } }),
  ]);

  const mfaCoveragePercent = totalUsers > 0 ? Math.round((mfaUsers / totalUsers) * 100) : 0;

  return NextResponse.json({
    ...executiveData,
    security: {
      totalUsers,
      totalRoles,
      activeSessions,
      mfaCoveragePercent,
      pendingReviews,
    },
  });
}
