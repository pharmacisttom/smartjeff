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
    const targetSiteId = searchParams.get("targetSiteId");
    if (!targetSiteId) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "ต้องระบุ targetSiteId" } },
        { status: 400 }
      );
    }

    const position = searchParams.get("position") || undefined;
    const dateStr = searchParams.get("date") || undefined;
    const maxDistanceKm = searchParams.get("maxDistanceKm")
      ? parseFloat(searchParams.get("maxDistanceKm")!)
      : undefined;

    const result = await WorkforcePlanningService.findWorkforceCandidates({
      targetSiteId,
      position,
      dateStr,
      maxDistanceKm,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Workforce Candidates Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "CANDIDATE_SEARCH_FAILED", message: error.message || "เกิดข้อผิดพลาดในการค้นหาพนักงานที่แนะนำ" } },
      { status: 500 }
    );
  }
}
