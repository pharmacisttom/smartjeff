import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetSiteId = searchParams.get("targetSiteId") || "";
    const dateStr = searchParams.get("date") || "";

    if (!targetSiteId || !dateStr) {
      return NextResponse.json({ message: "ต้องระบุ targetSiteId และ date" }, { status: 400 });
    }

    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

    // Find all active employees belonging to OTHER sites
    const otherEmployees = await prisma.employee.findMany({
      where: {
        siteId: { not: targetSiteId },
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        prefix: true,
        firstName: true,
        lastName: true,
        position: true,
        phone: true,
        nationality: true,
        siteId: true,
        site: { select: { id: true, code: true, name: true, estateName: true } },
      },
      orderBy: [{ siteId: "asc" }, { code: "asc" }],
    });

    // Check existing shift assignments on that date for these employees
    const empIds = otherEmployees.map((e) => e.id);
    const existingShifts = await prisma.shiftAssignment.findMany({
      where: {
        employeeId: { in: empIds },
        date,
      },
    });

    const shiftMap = new Map<string, any>();
    existingShifts.forEach((s) => shiftMap.set(s.employeeId, s));

    // Format available employees
    const availableWorkers = otherEmployees.map((emp) => {
      const existing = shiftMap.get(emp.id);
      const isWorkingElsewhere = existing && existing.shiftType !== "OFF";
      const isOff = existing && existing.shiftType === "OFF";

      return {
        id: emp.id,
        code: emp.code,
        fullName: `${emp.prefix ? emp.prefix + " " : ""}${emp.firstName} ${emp.lastName}`,
        position: emp.position,
        phone: emp.phone,
        nationality: emp.nationality,
        homeSiteId: emp.siteId,
        homeSiteCode: emp.site?.code || "-",
        homeSiteName: emp.site?.name || "-",
        estateName: emp.site?.estateName || "-",
        statusOnDate: isWorkingElsewhere ? `ปฏิบัติงานอยู่ที่ ${emp.site?.code || "ไซต์เดิม"}` : isOff ? "วันหยุด (พร้อมเป็นกำลังเสริม)" : "ยังไม่ได้จัดกะ (พร้อมยืมตัว)",
        isRecommended: !isWorkingElsewhere,
      };
    });

    // Sort: Recommended (OFF / Unassigned) first
    availableWorkers.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return a.homeSiteCode.localeCompare(b.homeSiteCode);
    });

    return NextResponse.json({
      workers: availableWorkers,
      totalCount: availableWorkers.length,
      availableCount: availableWorkers.filter((w) => w.isRecommended).length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการค้นหาพนักงานสำรอง", error: error.message },
      { status: 500 }
    );
  }
}
