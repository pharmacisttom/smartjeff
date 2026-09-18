import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { AuditService } from "@/server/services/audit.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.session.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const targetSession = await prisma.userSession.findFirst({
      where: { OR: [{ id: params.id }, { sessionId: params.id }] },
    });

    if (!targetSession) {
      return NextResponse.json({ message: "ไม่พบ Session ที่ระบุ" }, { status: 404 });
    }

    await prisma.userSession.update({
      where: { id: targetSession.id },
      data: { status: "REVOKED" },
    });

    // Invalidate user authzVersion
    await AuthorizationService.invalidateUserSessions(targetSession.userId);

    await AuditService.log({
      userId: session.sub,
      action: "SESSION_REVOKED",
      entity: "UserSession",
      entityId: targetSession.id,
      metadata: { targetUserId: targetSession.userId, sessionId: targetSession.sessionId },
      req,
    });

    return NextResponse.json({ message: "ยกเลิก Session เรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
