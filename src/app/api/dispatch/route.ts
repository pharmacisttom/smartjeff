import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const siteId = searchParams.get("siteId");

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { site: true },
      orderBy: { code: "asc" },
    });

    const sites = await prisma.site.findMany({
      orderBy: { code: "asc" },
    });

    let selectedEmployee = null;
    if (employeeId) {
      selectedEmployee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { site: true },
      });
    } else if (employees.length > 0) {
      selectedEmployee = employees[0];
    }

    return NextResponse.json({
      employees,
      sites,
      selectedEmployee,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
