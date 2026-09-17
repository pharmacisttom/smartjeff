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
    const dateStr = searchParams.get("date") || undefined;
    const mode = (searchParams.get("mode") as "today" | "tomorrow" | "custom") || "today";

    const data = await WorkforcePlanningService.getPlanningOverview({ dateStr, mode });

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Workforce Planning Overview Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "PLANNING_FETCH_FAILED", message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลวางแผนกำลังคน" } },
      { status: 500 }
    );
  }
}
