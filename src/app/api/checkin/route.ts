import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-jwt";
import { haversineDistance, isWithinGeofence } from "@/lib/geo";

const TYPES = new Set(["CHECK_IN", "CHECK_OUT", "OT_IN", "OT_OUT"]);

export async function POST(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if ("error" in auth) return auth.error;
    const user = await prisma.user.findUnique({ where: { id: auth.session.sub }, select: { employeeId: true } });
    if (!user?.employeeId) return NextResponse.json({ error: "EMPLOYEE_PROFILE_REQUIRED" }, { status: 403 });
    const body = await req.json();
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!TYPES.has(body.type) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "INVALID_ATTENDANCE_PAYLOAD" }, { status: 400 });
    }
    const employee = await prisma.employee.findUnique({ where: { id: user.employeeId }, include: { site: true } });
    if (!employee?.isActive) return NextResponse.json({ error: "EMPLOYEE_NOT_ACTIVE" }, { status: 403 });
    if (employee.site.lat == null || employee.site.lng == null) {
      return NextResponse.json({ error: "SITE_GEOFENCE_NOT_CONFIGURED" }, { status: 409 });
    }
    if (body.localId) {
      const existing = await prisma.attendance.findUnique({ where: { localId: String(body.localId) } });
      if (existing) return NextResponse.json({ attendance: existing, duplicate: true });
    }
    const distance = haversineDistance(lat, lng, employee.site.lat, employee.site.lng);
    const within = isWithinGeofence(distance, employee.site.radius);
    const attendance = await prisma.attendance.create({ data: {
      employeeId: employee.id, localId: body.localId || undefined, type: body.type,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(), lat, lng, distance,
      accuracy: Number.isFinite(Number(body.accuracy)) ? Number(body.accuracy) : null,
      isWithinGeofence: within, photoUrl: body.photoUrl || null, photoHash: body.photoHash || null,
      deviceInfo: body.deviceInfo || "Web PWA", note: body.note || null, isApproved: within, approvalStatus: within ? "APPROVED" : "PENDING",
    } });
    return NextResponse.json({ attendance, distance, isWithinGeofence: within }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CHECKIN_FAILED" }, { status: 500 });
  }
}
