import { NextResponse } from "next/server";
import { SchedulingService } from "@/server/services/scheduling.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user || !ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = await SchedulingService.updateAssignment(
      params.id,
      {
        siteId: body.siteId,
        shiftId: body.shiftId,
        workDate: body.workDate ? new Date(body.workDate) : undefined,
        status: body.status,
        notes: body.notes,
      },
      user.email || user.id,
      body.reason || "Manual update"
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, conflicts: error.conflicts || [] },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user || !ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reason = searchParams.get("reason") || "Deleted by manager";

    await SchedulingService.deleteAssignment(params.id, user.email || user.id, reason);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
