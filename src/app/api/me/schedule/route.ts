import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Find employee ID
    let employeeId = user.employeeId;
    if (!employeeId) {
      const firstEmp = await prisma.employee.findFirst({ where: { isActive: true } });
      employeeId = firstEmp?.id;
    }

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "Employee record not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(now.getTime() - 86400000);
    const endDate = endDateParam ? new Date(endDateParam) : new Date(now.getTime() + 14 * 86400000);

    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        employeeId,
        workDate: { gte: startDate, lte: endDate },
        status: { notIn: ["CANCELLED"] },
      },
      include: {
        shift: true,
        site: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
            lat: true,
            lng: true,
          },
        },
      },
      orderBy: [{ workDate: "asc" }, { plannedStart: "asc" }],
    });

    // Find next upcoming shift
    const nextShift = assignments.find((a) => a.plannedEnd.getTime() > now.getTime()) || null;

    return NextResponse.json({
      success: true,
      employeeId,
      nextShift,
      assignments,
      totalUpcoming: assignments.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
