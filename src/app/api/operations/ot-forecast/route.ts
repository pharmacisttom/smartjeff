import { NextResponse } from "next/server";
import { OvertimeCalculationService } from "@/server/services/overtime-calculation.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || !ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const siteId = searchParams.get("siteId") || undefined;

    const startDate = startDateParam ? new Date(startDateParam) : new Date();
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(startDate.getTime() + 6 * 86400000);

    const forecast = await OvertimeCalculationService.getOtForecast({
      startDate,
      endDate,
      siteId,
    });

    return NextResponse.json(forecast);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
