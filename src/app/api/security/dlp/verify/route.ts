import { requireRole } from "@/lib/auth-jwt";
import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["ADMIN", "SUPERADMIN"]);
  if ("error" in auth) return auth.error;
  try {
    const report = await AuditService.verifyIntegrity(100);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
