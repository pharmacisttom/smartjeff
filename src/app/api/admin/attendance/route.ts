import { NextResponse } from "next/server";
import { AttendanceService } from "@/server/services/attendance.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");
    const dateStr = searchParams.get("date");

    const attendances = await AttendanceService.getAttendanceLogs({ siteId, status, dateStr });
    return NextResponse.json({ attendances });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { ids, action, approvedBy } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "กรุณาระบุรายการลงเวลาที่ต้องการดำเนินการ" }, { status: 400 });
    }

    if (action === "APPROVE" || action === "REJECT") {
      await AttendanceService.approveOrReject(ids, action, approvedBy);
      return NextResponse.json({
        message: `${action === "APPROVE" ? "อนุมัติ" : "ปฏิเสธ"}การลงเวลาจำนวน ${ids.length} รายการแล้ว`,
      });
    }

    return NextResponse.json({ message: "คำสั่งไม่อยู่ในเงื่อนไข" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
