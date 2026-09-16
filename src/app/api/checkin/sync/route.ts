import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance, isWithinGeofence } from "@/lib/geo";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const localId = formData.get("localId") as string;
    const employeeId = formData.get("employeeId") as string;
    const type = formData.get("type") as string;
    const timestampStr = formData.get("timestamp") as string;
    const latStr = formData.get("lat") as string;
    const lngStr = formData.get("lng") as string;
    const accuracyStr = formData.get("accuracy") as string;
    const photoHash = formData.get("photoHash") as string;
    const deviceInfo = formData.get("deviceInfo") as string;
    const note = formData.get("note") as string;
    const photoFile = formData.get("photo") as File | null;

    if (!employeeId || !type || !latStr || !lngStr) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // 1. Idempotency Check
    if (localId) {
      const existing = await prisma.attendance.findFirst({
        where: { localId },
      });
      if (existing) {
        return NextResponse.json({ attendance: existing, duplicate: true });
      }
    }

    if (photoHash) {
      const existingHash = await prisma.attendance.findFirst({
        where: { photoHash },
      });
      if (existingHash) {
        return NextResponse.json({ attendance: existingHash, duplicate: true });
      }
    }

    // 2. Find Employee & Site
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { site: true },
    });

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    let distance = 0;
    let within = true;

    if (employee && employee.site && employee.site.lat && employee.site.lng) {
      distance = haversineDistance(lat, lng, employee.site.lat, employee.site.lng);
      within = isWithinGeofence(distance, employee.site.radius);
    }

    const timestamp = timestampStr ? new Date(parseInt(timestampStr, 10)) : new Date();

    // Placeholder photo URL (in production, uploaded to MinIO / R2)
    const photoUrl = photoFile ? `/uploads/checkin_${localId || Date.now()}.webp` : null;

    // 3. Create Attendance
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee ? employee.id : employeeId,
        localId: localId || undefined,
        type: type as any,
        timestamp,
        lat,
        lng,
        distance,
        accuracy: accuracyStr ? parseFloat(accuracyStr) : null,
        isWithinGeofence: within,
        photoUrl,
        photoHash: photoHash || null,
        deviceInfo: deviceInfo || "Offline Sync PWA",
        note: note || null,
        isApproved: within,
      },
    });

    return NextResponse.json({
      attendance,
      distance,
      isWithinGeofence: within,
      synced: true,
    });
  } catch (e: any) {
    console.error("Checkin Sync API Error:", e);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการซิงค์ข้อมูล", error: e.message }, { status: 500 });
  }
}
