import { NextResponse } from "next/server";
import { SchedulingService } from "@/server/services/scheduling.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || !ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.startDate || !body.endDate || !body.action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: startDate, endDate, action" },
        { status: 400 }
      );
    }

    const period = await SchedulingService.updateSchedulePeriodStatus({
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      siteId: body.siteId,
      action: body.action,
      performedBy: user.email || user.id,
      reason: body.reason,
    });

    return NextResponse.json({ success: true, period });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
