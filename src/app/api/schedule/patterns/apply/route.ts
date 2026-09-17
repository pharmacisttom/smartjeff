import { NextResponse } from "next/server";
import { ShiftPatternService } from "@/server/services/shift-pattern.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || !ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.employeeId || !body.patternId || !body.siteId || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: employeeId, patternId, siteId, startDate, endDate" },
        { status: 400 }
      );
    }

    const result = await ShiftPatternService.applyPatternToEmployee({
      employeeId: body.employeeId,
      patternId: body.patternId,
      siteId: body.siteId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      assignedBy: user.email || user.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
