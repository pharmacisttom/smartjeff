import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-jwt";
import { LiveOperationsService } from "@/server/services/live-operations.service";

const ROLES = ["SUPERADMIN", "ADMIN", "HR", "EXECUTIVE", "OPERATIONS", "SUPERVISOR"];

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ROLES);
  if ("error" in auth) return auth.error;
  try {
    return NextResponse.json(await LiveOperationsService.getSnapshot(), { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "LIVE_OPERATIONS_FAILED" }, { status: 500 });
  }
}
