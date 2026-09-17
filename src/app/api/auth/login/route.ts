import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";
import { setAuthCookie } from "@/lib/auth-jwt";
import argon2 from "argon2";
import { verifyMfaCode } from "@/lib/mfa/verify";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, otp } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION", message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" } },
        { status: 400 }
      );
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    const clientIp = AuditService.getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "Unknown";

    // Lookup user in DB
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanUser }, { email: username.trim() }],
        isActive: true,
      },
      include: { employee: { include: { site: true } } },
    });

    if (user && user.passwordHash) {
      const valid = await argon2.verify(user.passwordHash, cleanPass);
      if (valid) {
        if (user.mfaEnabled && (!otp || !(await verifyMfaCode(user.id, user.mfaSecret, String(otp))))) {
          return NextResponse.json({ success: false, error: { code: "MFA_REQUIRED", message: "กรุณากรอกรหัสยืนยันหรือ Recovery Code" } }, { status: 401 });
        }
        await AuditService.log({
          userId: user.id,
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
          metadata: { role: user.role, email: user.email, userAgent, ip: clientIp },
          req,
        });

        const redirectTo = ["ADMIN", "SUPER_ADMIN", "HR", "FINANCE", "EXECUTIVE", "OPERATIONS"].includes(user.role)
          ? "/admin/dashboard"
          : "/check-in";

        const response = NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.displayName || user.employee?.firstName || user.email,
            role: user.role,
          },
          redirectTo,
        });

        return setAuthCookie(response, {
          sub: user.id,
          email: user.email,
          role: user.role,
          type: user.role === "EMPLOYEE" ? "EMPLOYEE" : "INTERNAL",
          name: user.displayName || user.employee?.firstName,
          siteId: user.employee?.siteId,
          employeeCode: user.employee?.code,
        });
      }
    }

    // Employee code login (employee uses code + password)
    if (cleanUser.match(/^[a-z]{2,4}\d+$/) || cleanUser.startsWith("emp")) {
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [{ code: username.trim() }, { phone: username.trim() }],
          isActive: true,
        },
        include: { site: true, user: true },
      });

      if (employee?.user?.passwordHash) {
        const valid = await argon2.verify(employee.user.passwordHash, cleanPass);
        if (valid) {
          if (employee.user.mfaEnabled && (!otp || !(await verifyMfaCode(employee.user.id, employee.user.mfaSecret, String(otp))))) {
            return NextResponse.json({ success: false, error: { code: "MFA_REQUIRED", message: "กรุณากรอกรหัสยืนยันหรือ Recovery Code" } }, { status: 401 });
          }
          await AuditService.log({
            userId: employee.id,
            action: "LOGIN",
            entity: "Employee",
            entityId: employee.id,
            metadata: { code: employee.code, userAgent, ip: clientIp },
            req,
          });

          const response = NextResponse.json({
            success: true,
            user: {
              id: employee.id,
              code: employee.code,
              name: `${employee.firstName} ${employee.lastName}`,
              role: "EMPLOYEE",
              site: employee.site?.name,
            },
            redirectTo: "/check-in",
          });

          return setAuthCookie(response, {
            sub: employee.user.id,
            role: "EMPLOYEE",
            type: "EMPLOYEE",
            name: `${employee.firstName} ${employee.lastName}`,
            siteId: employee.siteId,
            employeeCode: employee.code,
          });
        }
      }
    }

    // Invalid credentials
    return NextResponse.json(
      { success: false, error: { code: "INVALID_CREDENTIALS", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" } },
      { status: 401 }
    );
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" } },
      { status: 500 }
    );
  }
}
