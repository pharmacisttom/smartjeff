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
      return NextResponse.json({ message: "คุณไม่มีสิทธิ์จัดสรรพนักงานข้ามไซต์" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, targetSiteId, dateStr, shiftType, workHours, otHours, reason } = body;

    if (!employeeId || !targetSiteId || !dateStr) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน (ต้องระบุพนักงาน, ไซต์เป้าหมาย และวันที่)" }, { status: 400 });
    }

    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { site: true },
    });

    if (!employee) {
      return NextResponse.json({ message: "ไม่พบข้อมูลพนักงานที่เลือก" }, { status: 404 });
    }

    const targetSite = await prisma.site.findUnique({
      where: { id: targetSiteId },
    });

    if (!targetSite) {
      return NextResponse.json({ message: "ไม่พบข้อมูลโรงงานเป้าหมาย" }, { status: 404 });
    }

    const noteText = reason ? `[ยืมตัวเสริมกำลังคน] ${reason} (จาก: ${employee.site?.name || "ไซต์เดิม"})` : `[ยืมตัวเสริมกำลังคนจาก: ${employee.site?.name || "ไซต์เดิม"}]`;

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
        homeSiteId: employee.siteId,
        isRelief: true,
        workHours: workHours !== undefined ? parseFloat(workHours) : 8,
        otHours: otHours !== undefined ? parseFloat(otHours) : 0,
        note: noteText,
        isPublished: true,
      },
      create: {
        employeeId,
        date,
        shiftType: shiftType || "DAY",
        siteId: targetSiteId,
        homeSiteId: employee.siteId,
        isRelief: true,
        workHours: workHours !== undefined ? parseFloat(workHours) : 8,
        otHours: otHours !== undefined ? parseFloat(otHours) : 0,
        note: noteText,
        isPublished: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `เสริมกำลังคนสำเร็จ! ส่งคุณ ${employee.firstName} ${employee.lastName} ไปช่วยปฏิบัติงานที่ ${targetSite.name}`,
      assignment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเสริมกำลังคน", error: error.message },
      { status: 500 }
    );
  }
}
