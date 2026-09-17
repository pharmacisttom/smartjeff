import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-jwt";
import { AttendanceService } from "@/server/services/attendance.service";

const ROLES = ["SUPERADMIN", "ADMIN", "HR", "OPERATIONS"];
export async function GET(req: NextRequest) {
  const auth = requireRole(req, ROLES); if ("error" in auth) return auth.error;
  try { const attendances = await AttendanceService.getAttendanceLogs({ siteId: req.nextUrl.searchParams.get("siteId"), status: req.nextUrl.searchParams.get("status"), dateStr: req.nextUrl.searchParams.get("date") }); return NextResponse.json({ attendances }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "ATTENDANCE_QUERY_FAILED" }, { status: 500 }); }
}
export async function PUT(req: NextRequest) {
  const auth = requireRole(req, ROLES); if ("error" in auth) return auth.error;
  try { const body = await req.json(); if (!Array.isArray(body.ids) || !body.ids.length || !["APPROVE", "REJECT"].includes(body.action)) return NextResponse.json({ error: "INVALID_APPROVAL_REQUEST" }, { status: 400 });
    await AttendanceService.approveOrReject(body.ids, body.action, auth.session.sub); return NextResponse.json({ success: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "ATTENDANCE_UPDATE_FAILED" }, { status: 500 }); }
}
