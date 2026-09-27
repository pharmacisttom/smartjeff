import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";
import { AuthorizationService } from "@/server/services/authorization.service";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    const user = await prisma.user.findUnique({ where: { id: session.sub }, select: {
      id: true, email: true, displayName: true, role: true,
      employee: { select: { id: true, code: true, firstName: true, lastName: true, position: true,
        site: { select: { id: true, code: true, name: true } } } },
    } });
    const context = await AuthorizationService.getUserContext(session.sub);
    if (!user || !context) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.displayName || user.email,
      role: user.role, primaryRole: context.roles[0]?.nameTh || user.role, roles: context.roles,
      permissions: Array.from(context.permissions), isSuperAdmin: context.isSuperAdmin,
      isSecurityAdmin: context.isSecurityAdmin, isPlatformAdmin: context.isPlatformAdmin,
    }, employee: user.employee ? { id: user.employee.id, code: user.employee.code,
      name: `${user.employee.firstName} ${user.employee.lastName}`, position: user.employee.position } : null,
      site: user.employee?.site || null }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "AUTH_UNAVAILABLE" }, { status: 503 }); }
}
