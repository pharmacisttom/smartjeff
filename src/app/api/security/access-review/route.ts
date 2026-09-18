import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.audit.read",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Dormant accounts (no login > 30 days but active)
    const dormantUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { lastLoginAt: { lt: thirtyDaysAgo } },
          { lastLoginAt: null, createdAt: { lt: thirtyDaysAgo } },
        ],
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        lastLoginAt: true,
        createdAt: true,
        roleAssignments: {
          where: { status: "ACTIVE" },
          include: { role: true },
        },
      },
    });

    // 2. Expired temporary roles still marked ACTIVE
    const expiredAssignments = await prisma.userRoleAssignment.findMany({
      where: {
        status: "ACTIVE",
        endAt: { lt: now },
      },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        role: true,
      },
    });

    // Automatically expire them
    if (expiredAssignments.length > 0) {
      await prisma.userRoleAssignment.updateMany({
        where: { id: { in: expiredAssignments.map((a) => a.id) } },
        data: { status: "EXPIRED" },
      });
    }

    // 3. Excessive privileges (users with 2 or more management/admin roles)
    const allActiveAssignments = await prisma.userRoleAssignment.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        role: true,
      },
    });

    const userRolesCount = new Map<string, { user: any; roles: any[] }>();
    for (const a of allActiveAssignments) {
      if (!userRolesCount.has(a.userId)) {
        userRolesCount.set(a.userId, { user: a.user, roles: [] });
      }
      userRolesCount.get(a.userId)!.roles.push(a.role);
    }

    const excessivePrivileges = Array.from(userRolesCount.values())
      .filter((u) => u.roles.filter((r) => r.level >= 7).length >= 2)
      .map((u) => ({
        user: u.user,
        highLevelRoles: u.roles.filter((r) => r.level >= 7).map((r) => r.nameTh),
      }));

    return NextResponse.json({
      summary: {
        dormantCount: dormantUsers.length,
        expiredRolesCount: expiredAssignments.length,
        excessivePrivilegesCount: excessivePrivileges.length,
        reviewedAt: now,
      },
      dormantUsers,
      expiredAssignments,
      excessivePrivileges,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
