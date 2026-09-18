import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, getSessionFromRequest } from "@/lib/auth-jwt";
import { AuditService } from "@/server/services/audit.service";

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (session?.sub) {
    if (session.sessionId) {
      try {
        const { prisma } = await import("@/lib/prisma");
        await prisma.userSession.updateMany({
          where: { sessionId: session.sessionId },
          data: { status: "REVOKED" },
        });
      } catch (err) {
        console.error("Failed to revoke session on logout:", err);
      }
    }

    await AuditService.log({
      userId: session.sub,
      action: "LOGOUT",
      entity: "User",
      entityId: session.sub,
      metadata: { role: session.role },
      req,
    });
  }

  const response = NextResponse.json({ success: true, message: "ออกจากระบบเรียบร้อยแล้ว", redirectTo: "/login" });
  return clearAuthCookie(response);
}
