import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";
import { setAuthCookie } from "@/lib/auth-jwt";
import { getDefaultRouteForRole } from "@/lib/role-routing";
import bcrypt from "bcryptjs";

const loginSchema = z.object({
  identifier: z.string().min(1, "กรุณากรอกชื่อผู้ใช้หรืออีเมล"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  humanToken: z.string().optional(),
});

async function verifyBotToken(token: string | undefined, clientIp: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const isDev = process.env.NODE_ENV !== "production";

  // Development Fallback Verification
  if (isDev && (!secretKey || secretKey.trim() === "")) {
    return true;
  }

  if (!token) {
    return false;
  }

  if (isDev && token === "dev-human-token-ok") {
    return true;
  }

  if (!secretKey) {
    return true;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    formData.append("remoteip", clientIp);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return isDev;
  }
}

export async function POST(req: Request) {
  try {
    let rawBody: any;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "รูปแบบข้อมูล JSON ไม่ถูกต้อง" } },
        { status: 400 }
      );
    }

    // Support both 'identifier' and 'username' keys
    const body = {
      identifier: rawBody.identifier || rawBody.username || "",
      password: rawBody.password || "",
      humanToken: rawBody.humanToken || rawBody.turnstileToken || rawBody.captchaToken || "",
    };

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION", message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" } },
        { status: 400 }
      );
    }

    const { identifier, password, humanToken } = parseResult.data;
    const clientIp = AuditService.getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "Unknown";

    // 1. Human / Bot Verification
    const isHumanValid = await verifyBotToken(humanToken, clientIp);
    if (!isHumanValid) {
      return NextResponse.json(
        { success: false, error: { code: "BOT_VERIFICATION_FAILED", message: "กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ" } },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const rawIdentifier = identifier.trim();

    // 2. User Lookup in MySQL Database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { email: rawIdentifier },
          { employee: { code: rawIdentifier } },
          { employee: { phone: rawIdentifier } },
        ],
      },
      include: { employee: { include: { site: true } } },
    });

    // 3. Account State Checks
    if (user) {
      if (user.isActive === false) {
        await AuditService.log({
          userId: user.id,
          action: "LOGIN_FAILED",
          entity: "User",
          entityId: user.id,
          metadata: { reason: "ACCOUNT_DISABLED", identifier, ip: clientIp },
          req,
        });
        return NextResponse.json(
          { success: false, error: { code: "ACCOUNT_DISABLED", message: "บัญชีนี้ไม่สามารถเข้าใช้งานได้ กรุณาติดต่อผู้ดูแลระบบ" } },
          { status: 403 }
        );
      }

      if (user.isLocked === true) {
        await AuditService.log({
          userId: user.id,
          action: "LOGIN_FAILED",
          entity: "User",
          entityId: user.id,
          metadata: { reason: "ACCOUNT_LOCKED", identifier, ip: clientIp },
          req,
        });
        return NextResponse.json(
          { success: false, error: { code: "ACCOUNT_LOCKED", message: "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" } },
          { status: 403 }
        );
      }
    }

    // 4. Password Hash Verification
    if (user && user.passwordHash) {
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (validPassword) {
        // Record Successful Login Event
        await AuditService.log({
          userId: user.id,
          action: "LOGIN_SUCCESS",
          entity: "User",
          entityId: user.id,
          metadata: { role: user.role, email: user.email, userAgent, ip: clientIp },
          req,
        });

        // Determine Role-Based Redirect Route
        const redirectTo = getDefaultRouteForRole(user.role);
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Record UserSession in database for central session management
        try {
          await prisma.userSession.create({
            data: {
              sessionId,
              userId: user.id,
              ipAddress: clientIp,
              userAgent,
              status: "ACTIVE",
              authStrength: "PASSWORD",
              authzVersion: user.authzVersion || 1,
              expiresAt,
            },
          });
        } catch (sessionErr) {
          console.error("Failed to record user session:", sessionErr);
        }

        const response = NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.displayName || user.email,
            role: user.role,
          },
          redirectTo,
        });

        return setAuthCookie(response, {
          sub: user.id,
          sessionId,
          email: user.email,
          role: user.role,
          type: user.role === "EMPLOYEE" ? "EMPLOYEE" : "INTERNAL",
          name: user.displayName || user.email,
          authStrength: "PASSWORD",
          authzVersion: user.authzVersion || 1,
        });
      }
    }

    // Record Failed Login Event
    await AuditService.log({
      userId: user?.id || null,
      action: "LOGIN_FAILED",
      entity: "User",
      metadata: { reason: "INVALID_CREDENTIALS", identifier, ip: clientIp },
      req,
    });

    // Generic credentials error (no user enumeration)
    return NextResponse.json(
      { success: false, error: { code: "INVALID_CREDENTIALS", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" } },
      { status: 401 }
    );
  } catch (error: unknown) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" } },
      { status: 500 }
    );
  }
}
