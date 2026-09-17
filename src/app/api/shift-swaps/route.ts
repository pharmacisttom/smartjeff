import { NextResponse } from "next/server";
import { ShiftSwapService } from "@/server/services/shift-swap.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const isExec = ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase());
    const filterEmployeeId = isExec ? undefined : (user.employeeId || undefined);

    const swaps = await ShiftSwapService.getSwapRequests({
      employeeId: filterEmployeeId,
      status,
    });

    return NextResponse.json({ success: true, swaps });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const requesterId = user.employeeId || body.requesterId;

    if (!requesterId || !body.targetEmployeeId || !body.requesterAssignmentId || !body.targetAssignmentId) {
      return NextResponse.json(
        { success: false, error: "Missing required swap fields" },
        { status: 400 }
      );
    }

    const swap = await ShiftSwapService.createSwapRequest({
      requesterId,
      targetEmployeeId: body.targetEmployeeId,
      requesterAssignmentId: body.requesterAssignmentId,
      targetAssignmentId: body.targetAssignmentId,
      reason: body.reason,
    });

    return NextResponse.json({ success: true, swap }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
