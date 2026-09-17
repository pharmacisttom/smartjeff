import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-jwt";
import { haversineDistance, isWithinGeofence } from "@/lib/geo";

const TYPES = new Set(["CHECK_IN", "CHECK_OUT", "OT_IN", "OT_OUT"]);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if ("error" in auth) return auth.error;
    const user = await prisma.user.findUnique({ where: { id: auth.session.sub }, select: { employeeId: true } });
    if (!user?.employeeId) return NextResponse.json({ error: "EMPLOYEE_PROFILE_REQUIRED" }, { status: 403 });
    const formData = await req.formData();
    const localId = String(formData.get("localId") || "");
    const type = String(formData.get("type") || "");
    const lat = Number(formData.get("lat"));
    const lng = Number(formData.get("lng"));
    const accuracy = Number(formData.get("accuracy"));
    const photoHash = String(formData.get("photoHash") || "");
    const photoFile = formData.get("photo");
    if (!localId || !TYPES.has(type) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "INVALID_ATTENDANCE_PAYLOAD" }, { status: 400 });
    }
    const existing = await prisma.attendance.findFirst({
      where: { OR: [{ localId }, ...(photoHash ? [{ photoHash }] : [])] },
    });
    if (existing) return NextResponse.json({ attendance: existing, duplicate: true });
    const employee = await prisma.employee.findUnique({ where: { id: user.employeeId }, include: { site: true } });
    if (!employee?.isActive) return NextResponse.json({ error: "EMPLOYEE_NOT_ACTIVE" }, { status: 403 });
    if (employee.site.lat == null || employee.site.lng == null) {
      return NextResponse.json({ error: "SITE_GEOFENCE_NOT_CONFIGURED" }, { status: 409 });
    }
    const distance = haversineDistance(lat, lng, employee.site.lat, employee.site.lng);
    const within = isWithinGeofence(distance, employee.site.radius);
    let photoUrl: string | null = null;
    if (photoFile instanceof File) {
      if (!photoFile.type.startsWith("image/") || photoFile.size > MAX_PHOTO_BYTES) {
        return NextResponse.json({ error: "INVALID_PHOTO" }, { status: 400 });
      }
      const uploadRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads", "attendance");
      await mkdir(uploadRoot, { recursive: true });
      const filename = `${localId}.webp`;
      await writeFile(path.join(uploadRoot, filename), Buffer.from(await photoFile.arrayBuffer()), { flag: "wx" });
      photoUrl = `/uploads/attendance/${filename}`;
    }
    const timestampValue = Number(formData.get("timestamp"));
    const timestamp = Number.isFinite(timestampValue) ? new Date(timestampValue) : new Date();
    const attendance = await prisma.attendance.create({ data: {
      employeeId: employee.id, localId, type, timestamp, lat, lng, distance,
      accuracy: Number.isFinite(accuracy) ? accuracy : null, isWithinGeofence: within,
      photoUrl, photoHash: photoHash || null,
      deviceInfo: String(formData.get("deviceInfo") || "PWA"),
      note: String(formData.get("note") || "") || null, isApproved: within, approvalStatus: within ? "APPROVED" : "PENDING",
    } });
    return NextResponse.json({ attendance, distance, isWithinGeofence: within, synced: true }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      return NextResponse.json({ error: "DUPLICATE_UPLOAD" }, { status: 409 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "ATTENDANCE_SYNC_FAILED" }, { status: 500 });
  }
}
