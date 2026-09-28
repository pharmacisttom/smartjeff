import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { AuditService } from "@/server/services/audit.service";
import { ACTIVATION_PIN_TTL_HOURS, generateActivationPin, hashActivationPin } from "@/lib/activation-pin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    const auth = await AuthorizationService.authorize({ userId: session.sub, permission: "security.user.manage" });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const { id } = await params;
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, displayName: true, employee: { select: { code: true } } },
    });
    if (!target) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });

    const pin = generateActivationPin();
    const expiresAt = new Date(Date.now() + ACTIVATION_PIN_TTL_HOURS * 60 * 60 * 1000);
    const pinHash = await hashActivationPin(pin);

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          activationPinHash: pinHash,
          activationPinExpiresAt: expiresAt,
          activationPinUsedAt: null,
          activationPinAttempts: 0,
          mfaEnabled: false,
          mfaSecret: null,
          authzVersion: { increment: 1 },
        },
      }),
      prisma.mfaRecoveryCode.deleteMany({ where: { userId: id } }),
      prisma.userSession.updateMany({ where: { userId: id, status: "ACTIVE" }, data: { status: "REVOKED" } }),
    ]);

    await AuditService.log({
      userId: session.sub,
      action: "ACTIVATION_PIN_ISSUED",
      entity: "User",
      entityId: id,
      metadata: { targetUserId: id, expiresAt, mfaDisabled: true },
      req,
    });

    const response = NextResponse.json({
      user: { id: target.id, email: target.email, displayName: target.displayName || target.email, employeeCode: target.employee?.code || null },
      activationPin: pin,
      expiresAt: expiresAt.toISOString(),
      message: "สร้าง PIN สำเร็จ PIN จะแสดงเพียงครั้งเดียว",
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "ไม่สามารถสร้าง PIN ได้" }, { status: 500 });
  }
}
