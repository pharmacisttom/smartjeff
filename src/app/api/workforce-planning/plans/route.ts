import { NextResponse } from "next/server";
import { WorkforcePlanningService } from "@/server/services/workforce-planning.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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
        { success: false, error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึงระบบ Workforce Planning" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const plans = await WorkforcePlanningService.getPlans({ status, limit });
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    console.error("Get Plans Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_PLANS_FAILED", message: error.message || "เกิดข้อผิดพลาดในการดึงรายการแผน" } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
        { success: false, error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์สร้างแผน Workforce Planning" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { planDate, sourceSiteId, targetSiteId, reason, employeeIds } = body;

    if (!planDate || !sourceSiteId || !targetSiteId || !reason || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "ข้อมูลสำหรับสร้างแผนไม่ครบถ้วน" } },
        { status: 400 }
      );
    }

    const plan = await WorkforcePlanningService.createPlanDraft({
      planDate,
      sourceSiteId,
      targetSiteId,
      reason,
      employeeIds,
      createdBy: user.email || user.id,
    });

    return NextResponse.json({ success: true, plan, message: "สร้างแผนร่างจัดสรรกำลังคนเรียบร้อยแล้ว (DRAFT)" });
  } catch (error: any) {
    console.error("Create Plan Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "CREATE_PLAN_FAILED", message: error.message || "เกิดข้อผิดพลาดในการสร้างแผน" } },
      { status: 500 }
    );
  }
}
