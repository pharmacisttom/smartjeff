import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-jwt";

export async function GET(req: NextRequest) {
  const auth = requireSession(req);
  if ("error" in auth) return auth.error;
  const user = await prisma.user.findUnique({ where: { id: auth.session.sub }, select: { employeeId: true } });
  if (!user?.employeeId) return NextResponse.json({ error: "EMPLOYEE_PROFILE_REQUIRED" }, { status: 403 });
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize")) || 30));
  const search = req.nextUrl.searchParams.get("search")?.trim();
  const where = {
    employeeId: user.employeeId,
    ...(search ? { employee: { site: { name: { contains: search } } } } : {}),
  };
  const [records, total] = await prisma.$transaction([
    prisma.attendance.findMany({ where, include: { employee: { select: { site: { select: { name: true } } } } }, orderBy: { timestamp: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.attendance.count({ where }),
  ]);
  return NextResponse.json({ records: records.map((record) => ({
    id: record.id, type: record.type, timestamp: record.timestamp, siteName: record.employee.site.name,
    isWithinGeofence: record.isWithinGeofence, isApproved: record.isApproved, distance: record.distance,
  })), page, pageSize, total });
}
