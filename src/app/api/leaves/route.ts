import { NextResponse } from "next/server";
import { LeaveService } from "@/server/services/leave.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const leaves = await LeaveService.getAll({ employeeId, status });
    return NextResponse.json({ leaves });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.employeeId || !body.type || !body.startDate || !body.endDate) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลการลาให้ครบถ้วน" }, { status: 400 });
    }

    const leave = await LeaveService.create({
      employeeId: body.employeeId,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      reason: body.reason,
    });

    return NextResponse.json({ leave, message: "ยื่นใบขอลา/ทำ OT เรียบร้อยแล้ว (รอการอนุมัติ)" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
