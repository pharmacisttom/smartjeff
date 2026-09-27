import { requireRole } from "@/lib/auth-jwt";
import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/server/services/audit.service";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["ADMIN", "SUPERADMIN"]);
  if ("error" in auth) return auth.error;
  try {
    const logs = await AuditService.getLogs(30);
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
