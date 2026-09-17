import { NextResponse } from "next/server";
import { WorkforcePlanningService } from "@/server/services/workforce-planning.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

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
        { success: false, error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึงระบบ Workforce Planning" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetSiteId, sourceSiteId, employeeIds, dateStr } = body;

    if (!targetSiteId || !sourceSiteId || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "ข้อมูลสำหรับจำลองไม่ครบถ้วน (ต้องระบุ targetSiteId, sourceSiteId และ employeeIds)" } },
        { status: 400 }
      );
    }

    const result = await WorkforcePlanningService.simulateWorkforceAllocation({
      targetSiteId,
      sourceSiteId,
      employeeIds,
      dateStr,
    });

    return NextResponse.json({ success: true, simulation: result });
  } catch (error: any) {
    console.error("Simulation Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SIMULATION_FAILED", message: error.message || "เกิดข้อผิดพลาดในการจำลองการจัดสรรกำลังคน" } },
      { status: 500 }
    );
  }
}
