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
      return NextResponse.json({ message: "คุณไม่มีสิทธิ์จัดตารางกะการทำงาน" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, dateStr, shiftType, siteId, workHours, otHours, isRelief, note } = body;

    if (!employeeId || !dateStr) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน (ต้องมี employeeId และ dateStr)" }, { status: 400 });
    }

    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { siteId: true },
    });

    if (!employee) {
      return NextResponse.json({ message: "ไม่พบข้อมูลพนักงาน" }, { status: 404 });
    }

    const targetSiteId = siteId || employee.siteId;
    const reliefFlag = Boolean(isRelief || (siteId && siteId !== employee.siteId));

    // Calculate hours according to shift type
    let wHours = workHours !== undefined ? parseFloat(workHours) : 8;
    let oHours = otHours !== undefined ? parseFloat(otHours) : 0;

    if (shiftType === "OFF" || shiftType === "LEAVE") {
      wHours = 0;
      oHours = 0;
    } else if (shiftType === "OT" && oHours === 0) {
      oHours = 1.5;
    }

    const assignment = await prisma.shiftAssignment.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date,
        },
      },
      update: {
        shiftType: shiftType || "DAY",
        siteId: targetSiteId,
        workHours: wHours,
        otHours: oHours,
        isRelief: reliefFlag,
        homeSiteId: employee.siteId,
        note: note || null,
        isPublished: true,
      },
      create: {
        employeeId,
        date,
        shiftType: shiftType || "DAY",
        siteId: targetSiteId,
        workHours: wHours,
        otHours: oHours,
        isRelief: reliefFlag,
        homeSiteId: employee.siteId,
        note: note || null,
        isPublished: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "บันทึกกะการทำงานเรียบร้อยแล้ว",
      assignment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการบันทึกกะ", error: error.message },
      { status: 500 }
    );
  }
}
