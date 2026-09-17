import { NextResponse } from "next/server";
import { WorkforcePlanningService } from "@/server/services/workforce-planning.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" } },
        { status: 401 }
      );
    }

    if (!ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์อนุมัติแผน Workforce Planning" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const status = body.status as "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING";

    if (!status || !["APPROVED", "REJECTED", "CANCELLED", "PENDING"].includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "สถานะไม่ถูกต้อง (ต้องเป็น APPROVED, REJECTED, หรือ CANCELLED)" } },
        { status: 400 }
      );
    }

    const plan = await WorkforcePlanningService.updatePlanStatus(
      params.id,
      status,
      user.email || user.id
    );

    return NextResponse.json({
      success: true,
      plan,
      message: status === "APPROVED" ? "อนุมัติแผนจัดสรรกำลังคนเรียบร้อยแล้ว" : "ปรับปรุงสถานะแผนเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("Approve Plan Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_PLAN_FAILED", message: error.message || "เกิดข้อผิดพลาดในการปรับปรุงสถานะแผน" } },
      { status: 500 }
    );
  }
}
