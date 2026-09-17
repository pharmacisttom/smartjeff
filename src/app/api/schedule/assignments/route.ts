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
    if (!body.employeeId || !body.siteId || !body.shiftId || !body.workDate) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: employeeId, siteId, shiftId, workDate" },
        { status: 400 }
      );
    }

    const result = await SchedulingService.createAssignment(
      {
        employeeId: body.employeeId,
        siteId: body.siteId,
        shiftId: body.shiftId,
        workDate: new Date(body.workDate),
        role: body.role,
        notes: body.notes,
      },
      user.email || user.id
    );

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, conflicts: error.conflicts || [] },
      { status: 400 }
    );
  }
}
