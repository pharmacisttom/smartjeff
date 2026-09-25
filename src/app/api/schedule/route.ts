import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";

// Helper to calculate days in month and week boundaries
function getMonthMeta(year: number, monthIndex: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days: { day: number; dateStr: string; dayOfWeek: number; weekNumber: number }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, monthIndex, d);
    const dayOfWeek = curDate.getDay(); // 0 = Sun, 1 = Mon ...
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    // Simple week grouping: W1 (1-7), W2 (8-14), W3 (15-21), W4 (22-28), W5 (29-end)
    let weekNumber = 1;
    if (d <= 7) weekNumber = 1;
    else if (d <= 14) weekNumber = 2;
    else if (d <= 21) weekNumber = 3;
    else if (d <= 28) weekNumber = 4;
    else weekNumber = 5;

    days.push({ day: d, dateStr, dayOfWeek, weekNumber });
  }

  return { daysInMonth, days };
}

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month") || ""; // "YYYY-MM"
    const siteIdParam = searchParams.get("siteId") || "";

    // Determine year and month
    const now = new Date();
    let year = now.getFullYear();
    let monthIndex = now.getMonth(); // 0-indexed

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      year = y;
      monthIndex = m - 1;
    }

    const currentMonthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const { daysInMonth, days } = getMonthMeta(year, monthIndex);

    const startDate = new Date(Date.UTC(year, monthIndex, 1));
    const endDate = new Date(Date.UTC(year, monthIndex, daysInMonth, 23, 59, 59, 999));

    // Fetch all sites for filter dropdown
    const allSites = await prisma.site.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        estateName: true,
        workStart: true,
        workEnd: true,
        otStart: true,
        otEnd: true,
        _count: { select: { employees: true } },
      },
      orderBy: { code: "asc" },
    });

    // Default site if none provided: first site with employees or first site
    const activeSiteId = siteIdParam || (allSites.find((s) => s._count.employees > 0)?.id || allSites[0]?.id || "");
    const activeSite = allSites.find((s) => s.id === activeSiteId) || null;

    // Fetch primary employees of this site
    const siteEmployees = await prisma.employee.findMany({
      where: {
        siteId: activeSiteId,
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
        salaryType: true,
        siteId: true,
        site: { select: { id: true, code: true, name: true } },
      },
      orderBy: { code: "asc" },
    });

    // Fetch shift assignments in this month
    const allMonthShifts = await prisma.shiftAssignment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
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
            site: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    // Filter shifts for this site (either primary employees or relief workers at this site)
    const shifts = allMonthShifts.filter((s: any) => {
      const isHome = s.employee?.siteId === activeSiteId;
      const isAssignedHere = s.siteId === activeSiteId;
      return isHome || isAssignedHere;
    });

    // Collect all unique employees involved (site employees + relief workers)
    const employeeMap = new Map<string, any>();
    siteEmployees.forEach((emp) => {
      employeeMap.set(emp.id, {
        ...emp,
        fullName: `${emp.prefix ? emp.prefix + " " : ""}${emp.firstName} ${emp.lastName}`,
        isHomeSite: true,
        shifts: {},
        w1Hours: 0,
        w2Hours: 0,
        w3Hours: 0,
        w4Hours: 0,
        w5Hours: 0,
        totalHours: 0,
        otHours: 0,
        workingDays: 0,
      });
    });

    // Add relief workers from other sites if any
    shifts.forEach((s) => {
      if (!employeeMap.has(s.employeeId)) {
        const emp = s.employee;
        employeeMap.set(s.employeeId, {
          id: emp.id,
          code: emp.code,
          prefix: emp.prefix,
          firstName: emp.firstName,
          lastName: emp.lastName,
          fullName: `${emp.prefix ? emp.prefix + " " : ""}${emp.firstName} ${emp.lastName} (ยืมตัวจาก ${emp.site?.code || "ไซต์อื่น"})`,
          position: emp.position,
          phone: emp.phone,
          nationality: emp.nationality,
          siteId: emp.siteId,
          site: emp.site,
          isHomeSite: false,
          shifts: {},
          w1Hours: 0,
          w2Hours: 0,
          w3Hours: 0,
          w4Hours: 0,
          w5Hours: 0,
          totalHours: 0,
          otHours: 0,
          workingDays: 0,
        });
      }
    });

    // Map shifts onto employees and calculate weekly hours
    shifts.forEach((s) => {
      const empData = employeeMap.get(s.employeeId);
      if (!empData) return;

      const d = new Date(s.date);
      const dayNum = d.getUTCDate();

      const workH = s.workHours || 8;
      const otH = s.otHours || 0;
      const totalH = workH + otH;

      const shiftInfo = {
        id: s.id,
        date: s.date,
        dayNum,
        shiftType: s.shiftType || "DAY",
        workHours: workH,
        otHours: otH,
        totalHours: totalH,
        isRelief: s.isRelief || (s.siteId ? s.siteId !== empData.siteId : false),
        assignedSiteId: s.siteId || empData.siteId,
        assignedSiteName: allSites.find((st) => st.id === (s.siteId || empData.siteId))?.name || activeSite?.name || "",
        homeSiteName: empData.site?.name || "",
        note: s.note,
      };

      empData.shifts[dayNum] = shiftInfo;

      if (s.shiftType !== "OFF" && s.shiftType !== "LEAVE") {
        empData.workingDays += 1;
        empData.totalHours += totalH;
        empData.otHours += otH;

        if (dayNum <= 7) empData.w1Hours += totalH;
        else if (dayNum <= 14) empData.w2Hours += totalH;
        else if (dayNum <= 21) empData.w3Hours += totalH;
        else if (dayNum <= 28) empData.w4Hours += totalH;
        else empData.w5Hours += totalH;
      }
    });

    const employees = Array.from(employeeMap.values()).sort((a, b) => {
      // Primary employees first, then relief workers
      if (a.isHomeSite && !b.isHomeSite) return -1;
      if (!a.isHomeSite && b.isHomeSite) return 1;
      return a.code.localeCompare(b.code);
    });

    // Calculate factory daily staffing stats for calendar
    const dailyStats: Record<number, { scheduledCount: number; reliefCount: number; offCount: number; leaveCount: number; staffNames: string[]; reliefStaff: { name: string; homeSite: string }[] }> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      dailyStats[d] = {
        scheduledCount: 0,
        reliefCount: 0,
        offCount: 0,
        leaveCount: 0,
        staffNames: [],
        reliefStaff: [],
      };
    }

    employees.forEach((emp) => {
      for (let d = 1; d <= daysInMonth; d++) {
        const sh = emp.shifts[d];
        if (sh) {
          if (sh.shiftType === "OFF") {
            dailyStats[d].offCount += 1;
          } else if (sh.shiftType === "LEAVE") {
            dailyStats[d].leaveCount += 1;
          } else {
            dailyStats[d].scheduledCount += 1;
            dailyStats[d].staffNames.push(emp.firstName);
            if (sh.isRelief) {
              dailyStats[d].reliefCount += 1;
              dailyStats[d].reliefStaff.push({
                name: `${emp.firstName} ${emp.lastName}`,
                homeSite: emp.site?.code || "ไซต์อื่น",
              });
            }
          }
        }
      }
    });

    // Site summary metrics
    const totalScheduledHours = employees.reduce((sum, e) => sum + e.totalHours, 0);
    const totalOtHours = employees.reduce((sum, e) => sum + e.otHours, 0);
    const totalWorkingDays = employees.reduce((sum, e) => sum + e.workingDays, 0);

    return NextResponse.json({
      month: currentMonthKey,
      year,
      monthIndex,
      monthNameTh: new Date(year, monthIndex, 1).toLocaleDateString("th-TH", { month: "long", year: "numeric" }),
      daysInMonth,
      days,
      activeSite,
      sites: allSites,
      employees,
      dailyStats,
      summary: {
        totalStaff: employees.length,
        homeStaffCount: siteEmployees.length,
        reliefStaffCount: employees.length - siteEmployees.length,
        totalScheduledHours,
        totalOtHours,
        totalWorkingDays,
        averageWeeklyHours: employees.length > 0 ? (totalScheduledHours / employees.length / 4.3).toFixed(1) : "0",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลตารางกะ", error: error.message },
      { status: 500 }
    );
  }
}
