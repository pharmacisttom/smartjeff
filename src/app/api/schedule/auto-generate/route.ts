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
    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: startDate, endDate" },
        { status: 400 }
      );
    }

    const result = await SchedulingService.autoGenerateSchedule({
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      siteId: body.siteId,
      mode: body.mode || "BALANCED",
      performedBy: user.email || user.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
