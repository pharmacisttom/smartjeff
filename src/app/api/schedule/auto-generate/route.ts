import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const authResult = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "employee.update",
    });

    if (!authResult.allowed) {
      return NextResponse.json({ message: "คุณไม่มีสิทธิ์สร้างตารางกะอัตโนมัติ" }, { status: 403 });
    }

    const body = await req.json();
    const { siteId, month, includeSaturdayWork = true, includeOt = false, overwrite = false } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ message: "ต้องระบุเดือนในรูปแบบ YYYY-MM" }, { status: 400 });
    }

    const [year, m] = month.split("-").map(Number);
    const monthIndex = m - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Find employees to schedule
    const whereClause: any = { isActive: true };
    if (siteId && siteId !== "ALL") {
      whereClause.siteId = siteId;
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      select: { id: true, siteId: true, firstName: true },
    });

    if (employees.length === 0) {
      return NextResponse.json({ message: "ไม่พบพนักงานในไซต์งานที่เลือก" }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const emp of employees) {
      for (let day = 1; day <= daysInMonth; day++) {
        const curDate = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0));

        const dayOfWeek = curDate.getUTCDay(); // 0 = Sun, 6 = Sat
        const isSunday = dayOfWeek === 0;
        const isSaturday = dayOfWeek === 6;

        let shiftType = "DAY";
        let workHours = 8;
        let otHours = includeOt ? 1.5 : 0;

        if (isSunday) {
          shiftType = "OFF";
          workHours = 0;
          otHours = 0;
        } else if (isSaturday && !includeSaturdayWork) {
          shiftType = "OFF";
          workHours = 0;
          otHours = 0;
        }

        const existing = await prisma.shiftAssignment.findUnique({
          where: {
            employeeId_date: {
              employeeId: emp.id,
              date: curDate,
            },
          },
        });

        if (existing) {
          if (!overwrite) {
            skippedCount++;
            continue;
          }

          // If overwrite is true, don't overwrite if it was a relief worker assignment or leave
          if (existing.shiftType === "LEAVE" || existing.isRelief) {
            skippedCount++;
            continue;
          }

          await prisma.shiftAssignment.update({
            where: { id: existing.id },
            data: {
              shiftType,
              workHours,
              otHours,
              siteId: emp.siteId,
              isPublished: true,
            },
          });
          updatedCount++;
        } else {
          await prisma.shiftAssignment.create({
            data: {
              employeeId: emp.id,
              date: curDate,
              shiftType,
              workHours,
              otHours,
              siteId: emp.siteId,
              homeSiteId: emp.siteId,
              isPublished: true,
            },
          });
          createdCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `สร้างตารางกะอัตโนมัติสำเร็จ: สร้างใหม่ ${createdCount} รายการ, ปรับปรุง ${updatedCount} รายการ, ข้าม ${skippedCount} รายการ`,
      stats: { createdCount, updatedCount, skippedCount, totalStaff: employees.length },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการสร้างตารางกะ", error: error.message },
      { status: 500 }
    );
  }
}
