import { NextResponse } from "next/server";
import { ShiftService } from "@/server/services/shift.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const shifts = await ShiftService.getShifts();
    return NextResponse.json({ success: true, shifts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || !ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.code || !body.name || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: code, name, startTime, endTime" },
        { status: 400 }
      );
    }

    const shift = await ShiftService.createShift(body);
    return NextResponse.json({ success: true, shift }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
