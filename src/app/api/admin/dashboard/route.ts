import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-jwt";
import { generateDailyExecutiveReport } from "@/lib/automation/daily-report";

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ["SUPERADMIN", "ADMIN", "HR", "EXECUTIVE", "OPERATIONS"]);
  if ("error" in auth) return auth.error;
  return NextResponse.json(await generateDailyExecutiveReport());
}
