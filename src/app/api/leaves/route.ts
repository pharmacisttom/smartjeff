import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-jwt";
import { LeaveService } from "@/server/services/leave.service";

const MANAGEMENT_ROLES = new Set(["SUPERADMIN", "ADMIN", "HR"]);

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if ("error" in auth) return auth.error;
    const requestedEmployee = req.nextUrl.searchParams.get("employeeId");
    const employeeId = MANAGEMENT_ROLES.has(auth.session.role)
      ? requestedEmployee
      : null;
    if (!MANAGEMENT_ROLES.has(auth.session.role)) {
      const sessionEmployeeId = req.headers.get("x-session-employee-id");
      const ownId = sessionEmployeeId || await resolveEmployeeId(auth.session.sub);
      if (!ownId) return NextResponse.json({ error: "EMPLOYEE_PROFILE_REQUIRED" }, { status: 403 });
      const leaves = await LeaveService.getAll({ employeeId: ownId, status: req.nextUrl.searchParams.get("status") });
      return NextResponse.json({ leaves });
    }
    const leaves = await LeaveService.getAll({ employeeId, status: req.nextUrl.searchParams.get("status") });
    return NextResponse.json({ leaves });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load leave requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if ("error" in auth) return auth.error;
    const employeeId = await resolveEmployeeId(auth.session.sub);
    if (!employeeId) return NextResponse.json({ error: "EMPLOYEE_PROFILE_REQUIRED" }, { status: 403 });
    const body = await req.json();
    if (!body.type || !body.startDate || !body.endDate) {
      return NextResponse.json({ message: "type, startDate and endDate are required" }, { status: 400 });
    }
    const leave = await LeaveService.create({ employeeId, type: body.type, startDate: body.startDate, endDate: body.endDate, reason: body.reason });
    return NextResponse.json({ leave, message: "Leave request submitted for approval" }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to submit leave request" }, { status: 500 });
  }
}

async function resolveEmployeeId(userId: string): Promise<string | null> {
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}
