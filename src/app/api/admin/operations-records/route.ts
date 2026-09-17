import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-jwt";

const ROLES = ["SUPERADMIN", "ADMIN", "HR", "OPERATIONS"];
export async function GET(req: NextRequest) {
  const auth = requireRole(req, ROLES); if ("error" in auth) return auth.error;
  const type = req.nextUrl.searchParams.get("type");
  if (type === "training") return NextResponse.json({ records: await prisma.trainingCourse.findMany({ where: { isActive: true }, include: { enrollments: true }, orderBy: { title: "asc" } }) });
  if (type === "compliance") return NextResponse.json({ records: await prisma.complianceRecord.findMany({ orderBy: [{ status: "asc" }, { dueDate: "asc" }] }) });
  if (type === "alerts") return NextResponse.json({ records: await prisma.systemAlert.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 100 }) });
  if (type === "birthdays") { const employees = await prisma.employee.findMany({ where: { isActive: true, birthDate: { not: null } }, select: { id: true, firstName: true, lastName: true, birthDate: true, site: { select: { name: true } } } }); return NextResponse.json({ records: employees }); }
  return NextResponse.json({ error: "UNSUPPORTED_RECORD_TYPE" }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const auth = requireRole(req, ROLES); if ("error" in auth) return auth.error;
  const body = await req.json();
  if (body.type !== "alert" || !body.id || !body.resolution) return NextResponse.json({ error: "INVALID_RESOLUTION" }, { status: 400 });
  const record = await prisma.systemAlert.update({ where: { id: body.id }, data: { status: "RESOLVED", resolution: body.resolution, resolvedById: auth.session.sub, resolvedAt: new Date() } });
  return NextResponse.json({ record });
}
