import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, getSessionFromRequest } from "@/lib/auth-jwt";
import { AuditService } from "@/server/services/audit.service";

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (session) {
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

export async function GET(req: NextRequest) {
  return POST(req);
}
