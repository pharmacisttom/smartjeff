import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";
import { PasswordPolicyService } from "@/server/services/password-policy.service";

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
      employeeId: true,
      passwordExpiresAt: true,
      mustChangePassword: true,
      authMethod: true,
      employee: {
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
          gender: true,
          position: true,
          site: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  const passwordStatus = PasswordPolicyService.checkPasswordStatus(user);
  const daysUntilExpiry = PasswordPolicyService.daysUntilExpiry(user);

  const name = user.displayName || (user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name,
      role: user.role,
      passwordStatus,
      daysUntilExpiry,
      authMethod: user.authMethod,
    },
    employee: user.employee
      ? {
          id: user.employee.id,
          code: user.employee.code,
          name: `${user.employee.firstName} ${user.employee.lastName}`,
          gender: user.employee.gender,
          position: user.employee.position,
        }
      : null,
    site: user.employee?.site || null,
  });
}
