import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { AuditService } from "@/server/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.session.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.userId;

    if (targetUserId) {
      await AuthorizationService.invalidateUserSessions(targetUserId);
      await AuditService.log({
        userId: session.sub,
        action: "ALL_USER_SESSIONS_REVOKED",
        entity: "UserSession",
        entityId: targetUserId,
        metadata: { targetUserId },
        req,
      });
      return NextResponse.json({ message: "ยกเลิกทุก Session ของผู้ใช้เรียบร้อยแล้ว" });
    }

    // Revoke all non-current sessions across the system
    await prisma.userSession.updateMany({
      where: {
        status: "ACTIVE",
        sessionId: { not: session.sessionId || "" },
      },
      data: { status: "REVOKED" },
    });

    // Increment authzVersion for all users except current
    await prisma.user.updateMany({
      where: { id: { not: session.sub } },
      data: { authzVersion: { increment: 1 } },
    });

    await AuditService.log({
      userId: session.sub,
      action: "GLOBAL_SESSIONS_REVOKED",
      entity: "UserSession",
      metadata: { initiatedBy: session.sub },
      req,
    });

    return NextResponse.json({ message: "ยกเลิกทุก Session ในระบบสำเร็จ (ยกเว้น Session ปัจจุบันของผู้ดูแล)" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
