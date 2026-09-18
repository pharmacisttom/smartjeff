import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.role.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const permission = searchParams.get("permission");

    if (!userId || !permission) {
      return NextResponse.json({ message: "กรุณาระบุ userId และ permission" }, { status: 400 });
    }

    const explanation = await AuthorizationService.explainAccess(userId, permission);
    return NextResponse.json(explanation);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
