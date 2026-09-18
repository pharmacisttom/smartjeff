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
      permission: "security.role.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const sourceRole = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: true,
        authorities: true,
      },
    });

    if (!sourceRole) {
      return NextResponse.json({ message: "ไม่พบบทบาทต้นทาง" }, { status: 404 });
    }

    const body = await req.json();
    const { newCode, newNameTh, newNameEn, newDescription, reason } = body;

    if (!newCode || !newNameTh || !newNameEn) {
      return NextResponse.json(
        { message: "กรุณาระบุรหัสและชื่อบทบาทใหม่ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const cleanCode = newCode.trim().toUpperCase();
    const existing = await prisma.role.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return NextResponse.json({ message: "รหัสบทบาทใหม่นี้มีอยู่ในระบบแล้ว" }, { status: 400 });
    }

    // Create cloned role
    const clonedRole = await prisma.role.create({
      data: {
        code: cleanCode,
        nameTh: newNameTh.trim(),
        nameEn: newNameEn.trim(),
        description: newDescription || `คัดลอกจาก ${sourceRole.nameTh} (${sourceRole.code})`,
        level: sourceRole.level,
        departmentType: sourceRole.departmentType,
        isSystem: false,
        isActive: true,
        permissions: {
          create: sourceRole.permissions.map((p) => ({
            permissionId: p.permissionId,
          })),
        },
        authorities: {
          create: sourceRole.authorities.map((a) => ({
            module: a.module,
            action: a.action,
            level: a.level,
            minAmount: a.minAmount,
            maxAmount: a.maxAmount,
            isEnabled: a.isEnabled,
          })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
        authorities: true,
      },
    });

    await AuditService.log({
      userId: session.sub,
      action: "ROLE_CLONED",
      entity: "Role",
      entityId: clonedRole.id,
      metadata: {
        sourceRoleId: sourceRole.id,
        sourceRoleCode: sourceRole.code,
        newCode: clonedRole.code,
        reason,
      },
      req,
    });

    return NextResponse.json({
      role: clonedRole,
      message: `คัดลอกบทบาท ${sourceRole.nameTh} เป็น ${clonedRole.nameTh} เรียบร้อยแล้ว`,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
