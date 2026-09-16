import { NextResponse } from "next/server";
import { LeaveService } from "@/server/services/leave.service";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (!body.status || !["APPROVED", "REJECTED"].includes(body.status)) {
      return NextResponse.json({ message: "สถานะการอนุมัติไม่ถูกต้อง" }, { status: 400 });
    }

    const updated = await LeaveService.updateStatus(params.id, body.status, body.approvedBy);
    return NextResponse.json({
      leave: updated,
      message: body.status === "APPROVED" ? "อนุมัติใบลาเรียบร้อยแล้ว" : "ปฏิเสธใบลาเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
