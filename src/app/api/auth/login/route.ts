import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";
import { setAuthCookie } from "@/lib/auth-jwt";
import { getDefaultRouteForRole } from "@/lib/role-routing";
import { verifyPassword } from "@/lib/password";
import { verifyMfaCode } from "@/lib/mfa/verify";
import { consumeLoginAttempt } from "@/lib/login-rate-limit";

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(191),
  password: z.string().min(1).max(1024),
  mfaCode: z.string().max(128).optional(),
  humanToken: z.string().max(4096).optional(),
});
const fail = (code: string, status: number, message = "ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูล") =>
  NextResponse.json({ success: false, error: { code, message } }, { status });

export async function POST(req: Request) {
  try {
    const clientIp = AuditService.getClientIp(req);
    if (!consumeLoginAttempt(clientIp)) return fail("RATE_LIMITED", 429);
    const parsed = loginSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return fail("VALIDATION", 400);
    const { identifier, password, mfaCode, humanToken } = parsed.data;
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (secret) {
      if (!humanToken) return fail("BOT_VERIFICATION_FAILED", 400);
      const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST", body: new URLSearchParams({ secret, response: humanToken, remoteip: clientIp }),
        signal: AbortSignal.timeout(5000),
      });
      const result = await verification.json();
      if (!verification.ok || result.success !== true) return fail("BOT_VERIFICATION_FAILED", 400);
    }
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier.toLowerCase() }, { employee: { code: identifier } }] },
      include: { employee: { include: { site: true } } },
    });
    if (!user || !user.isActive || user.isLocked || user.deletedAt ||
        !(await verifyPassword(user.passwordHash, password))) return fail("INVALID_CREDENTIALS", 401);
    if (user.passwordExpiresAt && user.passwordExpiresAt <= new Date() || user.mustChangePassword) {
      return fail("PASSWORD_RESET_REQUIRED", 403, "กรุณาติดต่อผู้ดูแลระบบเพื่อเปลี่ยนรหัสผ่าน");
    }
    if (user.mfaEnabled && (!mfaCode || !(await verifyMfaCode(user.id, user.mfaSecret, mfaCode)))) {
      return fail("MFA_REQUIRED", 401, "กรุณากรอกรหัสยืนยัน MFA ที่ถูกต้อง");
    }
    const sessionId = crypto.randomUUID();
    const authStrength = user.mfaEnabled ? "MFA" : "PASSWORD";
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastLoginIp: clientIp } }),
      prisma.userSession.create({ data: {
        sessionId, userId: user.id, ipAddress: clientIp, userAgent: req.headers.get("user-agent")?.slice(0, 191),
        status: "ACTIVE", authStrength, authzVersion: user.authzVersion,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      } }),
    ]);
    await AuditService.log({ userId: user.id, action: "LOGIN_SUCCESS", entity: "User", entityId: user.id, req });
    const name = user.displayName || user.email;
    return setAuthCookie(NextResponse.json({ success: true,
      user: { id: user.id, email: user.email, name, role: user.role }, redirectTo: getDefaultRouteForRole(user.role),
    }), { sub: user.id, sessionId, email: user.email, role: user.role,
      type: user.role === "EMPLOYEE" ? "EMPLOYEE" : "INTERNAL", name, authStrength, authzVersion: user.authzVersion });
  } catch {
    return fail("AUTH_UNAVAILABLE", 503, "ระบบยืนยันตัวตนไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง");
  }
}
