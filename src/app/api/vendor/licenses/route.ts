import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-jwt";

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ["SUPERADMIN"]);
  if ("error" in auth) return auth.error;
  const [organizations, employees] = await prisma.$transaction([
    prisma.organization.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.employee.count({ where: { isActive: true } }),
  ]);
  return NextResponse.json({ success: true, stats: { totalTenants: organizations.length, activeTenants: organizations.length, totalEmployeesManaged: employees }, tenants: organizations });
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, ["SUPERADMIN"]);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ success: false, error: "PERSISTENT_LICENSE_PROVIDER_NOT_CONFIGURED" }, { status: 503 });
}
