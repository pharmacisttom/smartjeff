import { NextRequest, NextResponse } from "next/server";
import { requireSession, setAuthCookie } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";
import { PasswordPolicyService } from "@/server/services/password-policy.service";
import { AuditService } from "@/server/services/audit.service";
import argon2 from "argon2";

export async function POST(req: NextRequest) {
  const auth = requireSession(req);
  if ("error" in auth) return auth.error;

  try {
    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION", message: "กรุณากรอกข้อมูลให้ครบถ้วน" } },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: { code: "MISMATCH", message: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน" } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.session.sub },
      include: { employee: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "ไม่พบบัญชีผู้ใช้" } },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CURRENT", message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" } },
        { status: 400 }
      );
    }

    // Validate strength
    const strength = PasswordPolicyService.validatePassword(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { success: false, error: { code: "WEAK_PASSWORD", message: strength.errors.join("\n") } },
        { status: 400 }
      );
    }

    // Check history reuse (last 5 passwords)
    const canReuse = await PasswordPolicyService.canReuse(user.id, newPassword);
    if (!canReuse) {
      return NextResponse.json(
        { success: false, error: { code: "REUSE_BLOCKED", message: "ห้ามใช้นโยบายรหัสผ่านเดิมซ้ำกับ 5 ครั้งล่าสุด" } },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await argon2.hash(newPassword);
    const now = new Date();
    const expiresAt = PasswordPolicyService.setNewExpiry();

    // Update user in DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordChangedAt: now,
        passwordExpiresAt: expiresAt,
        mustChangePassword: false,
      },
    });

    // Save to PasswordHistory
    await PasswordPolicyService.recordPasswordHistory(user.id, newHash);

    // Audit log
    await AuditService.log({
      userId: user.id,
      action: "PASSWORD_CHANGED",
      entity: "User",
      entityId: user.id,
      metadata: { changedAt: now.toISOString(), expiresAt: expiresAt.toISOString() },
      req,
    });

    const response = NextResponse.json({
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว",
      redirectTo: ["ADMIN", "SUPERADMIN", "HR", "FINANCE", "EXECUTIVE", "OPERATIONS", "SUPERVISOR"].includes(user.role)
        ? "/admin/dashboard"
        : "/check-in",
    });

    // Re-issue cookie with VALID passwordStatus
    return setAuthCookie(response, {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: user.role === "EMPLOYEE" ? "EMPLOYEE" : "INTERNAL",
      name: user.displayName || user.employee?.firstName,
      siteId: user.employee?.siteId,
      employeeCode: user.employee?.code,
      passwordStatus: "VALID",
      daysUntilExpiry: 90,
    });
  } catch (error: unknown) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" } },
      { status: 500 }
    );
  }
}
