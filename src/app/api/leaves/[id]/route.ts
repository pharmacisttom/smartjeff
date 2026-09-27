import { requireRole } from "@/lib/auth-jwt";
import { NextRequest, NextResponse } from "next/server";
import { LeaveService } from "@/server/services/leave.service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: routeId } = await params;
  const auth = await requireRole(req, ["ADMIN", "SUPERADMIN", "HR"]);
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    if (!body.status || !["APPROVED", "REJECTED"].includes(body.status)) {
      return NextResponse.json({ message: "สถานะการอนุมัติไม่ถูกต้อง" }, { status: 400 });
    }

    const updated = await LeaveService.updateStatus(routeId, body.status, auth.session.sub);
    return NextResponse.json({
      leave: updated,
      message: body.status === "APPROVED" ? "อนุมัติใบลาเรียบร้อยแล้ว" : "ปฏิเสธใบลาเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
