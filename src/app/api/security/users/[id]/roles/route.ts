import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { RoleConflictService } from "@/server/services/role-conflict.service";
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
      permission: "security.user.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) return NextResponse.json({ message: "ไม่พบผู้ใช้ที่ระบุ" }, { status: 404 });

    const body = await req.json();
    const { roleId, scopeType, scopeId, startAt, endAt, reason, forceConfirm } = body;

    if (!roleId) {
      return NextResponse.json({ message: "กรุณาระบุ Role ที่ต้องการมอบหมาย" }, { status: 400 });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return NextResponse.json({ message: "ไม่พบบทบาทที่ระบุ" }, { status: 404 });

    // Check Separation of Duties (SoD) conflicts
    const conflicts = await RoleConflictService.checkRoleAssignmentConflicts(params.id, roleId);
    const hasBlock = conflicts.some((c) => c.severity === "BLOCK");

    if (hasBlock) {
      return NextResponse.json(
        {
          message: "ไม่สามารถมอบหมายบทบาทนี้ได้เนื่องจากขัดต่อหลัก Separation of Duties (SoD)",
          conflicts,
        },
        { status: 409 }
      );
    }

    if (conflicts.length > 0 && !forceConfirm) {
      return NextResponse.json(
        {
          message: "พบข้อขัดแย้งของบทบาท (SoD Warning) กรุณายืนยันการมอบหมายสิทธิ์",
          requiresConfirmation: true,
          conflicts,
        },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = await prisma.userRoleAssignment.create({
      data: {
        userId: targetUser.id,
        roleId: role.id,
        scopeType: scopeType || "GLOBAL",
        scopeId: scopeId || null,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        assignedBy: session.sub,
        reason: reason || "Admin Assignment",
        status: "ACTIVE",
      },
      include: { role: true },
    });

    // Invalidate user sessions to enforce new role
    await AuthorizationService.invalidateUserSessions(targetUser.id);

    await AuditService.log({
      userId: session.sub,
      action: "USER_ROLE_ASSIGNED",
      entity: "UserRoleAssignment",
      entityId: assignment.id,
      metadata: {
        targetUserId: targetUser.id,
        roleCode: role.code,
        scopeType,
        scopeId,
        reason,
      },
      req,
    });

    return NextResponse.json({
      assignment,
      message: `มอบหมายบทบาท ${role.nameTh} ให้แก่ผู้ใช้เรียบร้อยแล้ว`,
      conflicts,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.user.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ message: "กรุณาระบุ assignmentId" }, { status: 400 });
    }

    const assignment = await prisma.userRoleAssignment.findUnique({
      where: { id: assignmentId },
      include: { role: true },
    });

    if (!assignment || assignment.userId !== params.id) {
      return NextResponse.json({ message: "ไม่พบข้อมูลการมอบหมายสิทธิ์" }, { status: 404 });
    }

    await prisma.userRoleAssignment.update({
      where: { id: assignmentId },
      data: { status: "REVOKED" },
    });

    // Invalidate sessions
    await AuthorizationService.invalidateUserSessions(params.id);

    await AuditService.log({
      userId: session.sub,
      action: "USER_ROLE_REVOKED",
      entity: "UserRoleAssignment",
      entityId: assignmentId,
      metadata: { targetUserId: params.id, roleCode: assignment.role.code },
      req,
    });

    return NextResponse.json({ message: `เพิกถอนบทบาท ${assignment.role.nameTh} เรียบร้อยแล้ว` });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
