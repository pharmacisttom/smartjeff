import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance, isWithinGeofence } from "@/lib/geo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, type, lat, lng, accuracy, photoUrl, photoHash, localId, note, deviceInfo } = body;

    if (!employeeId || !type || lat === undefined || lng === undefined) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // Find Employee & Site
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { site: true },
    });

    if (!employee) {
      return NextResponse.json({ message: "ไม่พบข้อมูลพนักงาน" }, { status: 404 });
    }

    // Geofence Distance Calculation
    let distance = 0;
    let within = true;

    if (employee.site && employee.site.lat && employee.site.lng) {
      distance = haversineDistance(lat, lng, employee.site.lat, employee.site.lng);
      within = isWithinGeofence(distance, employee.site.radius);
    }

    // Check Idempotency via localId or photoHash
    if (localId) {
      const existing = await prisma.attendance.findFirst({
        where: { localId },
      });
      if (existing) {
        return NextResponse.json({ attendance: existing, distance, isWithinGeofence: existing.isWithinGeofence, duplicate: true });
      }
    }

    // Create Attendance Record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        localId: localId || undefined,
        type,
        timestamp: new Date(),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        distance,
        accuracy: accuracy ? parseFloat(accuracy) : null,
        isWithinGeofence: within,
        photoUrl: photoUrl || null,
        photoHash: photoHash || null,
        deviceInfo: deviceInfo || "Web Mobile PWA",
        note: note || null,
        isApproved: within, // Auto-approve if within geofence
      },
    });

    return NextResponse.json({
      attendance,
      distance,
      isWithinGeofence: within,
      message: within ? "ลงเวลาสำเร็จ" : "ลงเวลานอกพื้นที่ geofence (รออนุมัติ)",
    });
  } catch (e: any) {
    console.error("Check-in API error:", e);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์", error: e.message }, { status: 500 });
  }
}
