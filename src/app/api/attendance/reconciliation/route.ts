import { NextResponse } from "next/server";
import { AttendanceReconciliationService } from "@/server/services/attendance-reconciliation.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || !ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const siteId = searchParams.get("siteId") || undefined;

    const workDate = dateParam ? new Date(dateParam) : new Date();

    const reconciliation = await AttendanceReconciliationService.reconcileDate(workDate, siteId);
    return NextResponse.json(reconciliation);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
