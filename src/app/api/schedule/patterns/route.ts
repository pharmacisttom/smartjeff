import { NextResponse } from "next/server";
import { ShiftPatternService } from "@/server/services/shift-pattern.service";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const patterns = await ShiftPatternService.getPatterns();
    return NextResponse.json({ success: true, patterns });
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
    if (!body.code || !body.name || !body.cycleDays || !Array.isArray(body.items)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: code, name, cycleDays, items" },
        { status: 400 }
      );
    }

    const pattern = await ShiftPatternService.createPattern(body);
    return NextResponse.json({ success: true, pattern }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
