import { NextResponse } from "next/server";
import { ShiftSwapService } from "@/server/services/shift-swap.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action; // ACCEPT | REJECT | APPROVE

    if (action === "ACCEPT" || (action === "REJECT" && body.isPeer)) {
      const result = await ShiftSwapService.respondToSwap(
        params.id,
        user.employeeId || body.employeeId,
        action
      );
      return NextResponse.json({ success: true, swap: result });
    }

    if (action === "APPROVE" || action === "REJECT") {
      if (!ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
        return NextResponse.json(
          { success: false, error: "Requires Supervisor or HR authorization to approve swap" },
          { status: 403 }
        );
      }

      const result = await ShiftSwapService.approveSwap(
        params.id,
        user.email || user.id,
        action
      );
      return NextResponse.json({ success: true, swap: result });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
