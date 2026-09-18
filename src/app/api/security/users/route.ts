import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { EmployeeSerializer } from "@/lib/serializers/employee.serializer";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.user.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { displayName: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        type: true,
        isActive: true,
        isLocked: true,
        mfaEnabled: true,
        lastLoginAt: true,
        authzVersion: true,
        createdAt: true,
        employeeId: true,
        employee: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            position: true,
            site: { select: { id: true, name: true, code: true } },
          },
        },
        roleAssignments: {
          where: { status: "ACTIVE" },
          include: {
            role: {
              select: { id: true, code: true, nameTh: true, level: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const viewerContext = await AuthorizationService.getUserContext(session.sub);
    const hasCodePerm = viewerContext?.permissions.has("employee.code.read");

    const serializedUsers = users.map((u) => {
      let employeeInfo = null;
      if (u.employee) {
        employeeInfo = {
          id: u.employee.id,
          code: hasCodePerm ? u.employee.code : EmployeeSerializer.maskCode(u.employee.code),
          isCodeMasked: !hasCodePerm,
          fullName: `${u.employee.firstName} ${u.employee.lastName}`,
          position: u.employee.position,
          site: u.employee.site,
        };
      }

      return {
        id: u.id,
        email: u.email,
        displayName: u.displayName || u.email,
        type: u.type,
        isActive: u.isActive,
        isLocked: u.isLocked,
        mfaEnabled: u.mfaEnabled,
        lastLoginAt: u.lastLoginAt,
        authzVersion: u.authzVersion,
        createdAt: u.createdAt,
        roles: u.roleAssignments.map((a) => ({
          assignmentId: a.id,
          roleId: a.role.id,
          code: a.role.code,
          nameTh: a.role.nameTh,
          level: a.role.level,
          scopeType: a.scopeType,
          scopeId: a.scopeId,
          startAt: a.startAt,
          endAt: a.endAt,
        })),
        employee: employeeInfo,
      };
    });

    return NextResponse.json({ users: serializedUsers, hasCodePermission: Boolean(hasCodePerm) });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
