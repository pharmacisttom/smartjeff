import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { AuditService } from "@/server/services/audit.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: routeId } = await params;
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.role.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const role = await prisma.role.findUnique({
      where: { id: routeId },
      include: {
        permissions: { include: { permission: true } },
        userAssignments: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: { id: true, email: true, displayName: true, role: true, isActive: true },
            },
          },
        },
        authorities: true,
      },
    });

    if (!role) return NextResponse.json({ message: "ไม่พบบทบาทที่ระบุ" }, { status: 404 });
    return NextResponse.json({ role });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: routeId } = await params;
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.role.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const role = await prisma.role.findUnique({
      where: { id: routeId },
      include: { permissions: { select: { permissionId: true } } },
    });
    if (!role) return NextResponse.json({ message: "ไม่พบบทบาทที่ระบุ" }, { status: 404 });

    const body = await req.json();
    const { nameTh, nameEn, description, level, departmentType, isActive, permissionIds, reason } = body;

    // Update basic role fields
    await prisma.role.update({
      where: { id: routeId },
      data: {
        nameTh: nameTh !== undefined ? nameTh : role.nameTh,
        nameEn: nameEn !== undefined ? nameEn : role.nameEn,
        description: description !== undefined ? description : role.description,
        level: level !== undefined ? parseInt(level, 10) : role.level,
        departmentType: departmentType !== undefined ? departmentType : role.departmentType,
        isActive: isActive !== undefined ? isActive : role.isActive,
      },
    });

    // Update permissions if provided
    let permissionsChanged = false;
    if (Array.isArray(permissionIds)) {
      permissionsChanged = true;
      // Remove current permissions
      await prisma.rolePermission.deleteMany({ where: { roleId: routeId } });
      // Insert new permissions
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((pId: string) => ({
            roleId: routeId,
            permissionId: pId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Invalidate sessions for all users holding this role
    if (permissionsChanged || isActive === false) {
      const assignedUsers = await prisma.userRoleAssignment.findMany({
        where: { roleId: routeId, status: "ACTIVE" },
        select: { userId: true },
      });
      const userIds = Array.from(new Set(assignedUsers.map((u) => u.userId)));

      if (userIds.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { authzVersion: { increment: 1 } },
        });

        await prisma.userSession.updateMany({
          where: { userId: { in: userIds }, status: "ACTIVE" },
          data: { status: "REVOKED" },
        });
      }
    }

    await AuditService.log({
      userId: session.sub,
      action: "ROLE_UPDATED",
      entity: "Role",
      entityId: role.id,
      metadata: { code: role.code, reason, permissionsChanged },
      req,
    });

    const updatedRole = await prisma.role.findUnique({
      where: { id: routeId },
      include: { permissions: { include: { permission: true } } },
    });

    return NextResponse.json({ role: updatedRole, message: "อัปเดตบทบาทและสิทธิ์เรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: routeId } = await params;
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.role.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const role = await prisma.role.findUnique({ where: { id: routeId } });
    if (!role) return NextResponse.json({ message: "ไม่พบบทบาทที่ระบุ" }, { status: 404 });
    if (role.isSystem) {
      return NextResponse.json({ message: "ไม่สามารถลบบทบาทของระบบ (System Role) ได้" }, { status: 400 });
    }

    await prisma.role.delete({ where: { id: routeId } });

    await AuditService.log({
      userId: session.sub,
      action: "ROLE_DELETED",
      entity: "Role",
      entityId: routeId,
      metadata: { code: role.code, nameTh: role.nameTh },
      req,
    });

    return NextResponse.json({ message: "ลบบทบาทเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
