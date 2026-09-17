import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true, email: true, displayName: true, role: true, employeeId: true,
      employee: { select: { id: true, code: true, firstName: true, lastName: true, site: true } },
    },
  });
  if (!user?.employee || !user.employeeId) {
    return NextResponse.json({ user, employee: null, site: null });
  }
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.displayName, role: user.role },
    employee: {
      id: user.employee.id,
      code: user.employee.code,
      name: `${user.employee.firstName} ${user.employee.lastName}`,
    },
    site: user.employee.site,
  });
}
