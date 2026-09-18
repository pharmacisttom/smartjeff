import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";
import { AuthorizationService } from "@/server/services/authorization.service";
import { EmployeeSerializer } from "@/lib/serializers/employee.serializer";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      authzVersion: true,
      employeeId: true,
      employee: {
        include: { site: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // Check authzVersion invalidation: if token version is older than DB version
  if (session.authzVersion && session.authzVersion < user.authzVersion) {
    return NextResponse.json(
      { error: "SESSION_STALE", message: "สิทธิ์การใช้งานมีการเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่" },
      { status: 401 }
    );
  }

  const authzContext = await AuthorizationService.getUserContext(user.id);
  const permissionsList = authzContext ? Array.from(authzContext.permissions) : [];
  const rolesList = authzContext?.roles || [];
  const primaryRole = rolesList[0]?.nameTh || user.role || "ผู้ใช้งาน";

  let serializedEmployee = null;
  if (user.employee) {
    serializedEmployee = EmployeeSerializer.serialize(user.employee, authzContext, user.employeeId);
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.displayName || user.email,
      role: user.role,
      primaryRole,
      roles: rolesList,
      permissions: permissionsList,
      isSuperAdmin: Boolean(authzContext?.isSuperAdmin),
      isSecurityAdmin: Boolean(authzContext?.isSecurityAdmin),
      isPlatformAdmin: Boolean(authzContext?.isPlatformAdmin),
    },
    employee: serializedEmployee
      ? {
          id: serializedEmployee.id,
          code: serializedEmployee.code,
          name: serializedEmployee.fullName,
          position: serializedEmployee.position,
        }
      : null,
    site: user.employee?.site || null,
  });
}
