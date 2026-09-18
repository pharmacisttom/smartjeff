import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { AuditService } from "@/server/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.role.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { userAssignments: { where: { status: "ACTIVE" } } },
        },
        authorities: true,
      },
      orderBy: [{ level: "desc" }, { nameTh: "asc" }],
    });

    return NextResponse.json({ roles });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.role.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const body = await req.json();
    const { code, nameTh, nameEn, description, level, departmentType, permissionIds, reason } = body;

    if (!code || !nameTh || !nameEn) {
      return NextResponse.json({ message: "กรุณาระบุรหัสและชื่อบทบาทให้ครบถ้วน" }, { status: 400 });
    }

    const existing = await prisma.role.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return NextResponse.json({ message: "รหัสบทบาทนี้มีอยู่ในระบบแล้ว" }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        code: code.trim().toUpperCase(),
        nameTh: nameTh.trim(),
        nameEn: nameEn.trim(),
        description: description || null,
        level: level ? parseInt(level, 10) : 1,
        departmentType: departmentType || null,
        isSystem: false,
        isActive: true,
        permissions: {
          create: Array.isArray(permissionIds)
            ? permissionIds.map((pId: string) => ({ permissionId: pId }))
            : [],
        },
      },
      include: { permissions: { include: { permission: true } } },
    });

    await AuditService.log({
      userId: session.sub,
      action: "ROLE_CREATED",
      entity: "Role",
      entityId: role.id,
      metadata: { code: role.code, nameTh: role.nameTh, reason, permissionsCount: permissionIds?.length || 0 },
      req,
    });

    return NextResponse.json({ role, message: "สร้างบทบาทใหม่สำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
