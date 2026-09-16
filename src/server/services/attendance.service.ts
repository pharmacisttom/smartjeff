import { prisma } from "@/lib/prisma";
import { haversineDistance, isWithinGeofence } from "@/lib/geo";

export class AttendanceService {
  static async recordAttendance(data: {
    employeeId: string;
    type: any;
    lat: number;
    lng: number;
    accuracy?: number | null;
    photoUrl?: string | null;
    photoHash?: string | null;
    localId?: string | null;
    note?: string | null;
    deviceInfo?: string | null;
  }) {
    // Find Employee & Site
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { site: true },
    });

    if (!employee) {
      throw new Error("ไม่พบข้อมูลพนักงาน");
    }

    // Geofence Distance Calculation
    let distance = 0;
    let within = true;

    if (employee.site && employee.site.lat && employee.site.lng) {
      distance = haversineDistance(data.lat, data.lng, employee.site.lat, employee.site.lng);
      within = isWithinGeofence(distance, employee.site.radius);
    }

    // Check Idempotency via localId
    if (data.localId) {
      const existing = await prisma.attendance.findFirst({
        where: { localId: data.localId },
      });
      if (existing) {
        return { attendance: existing, distance, isWithinGeofence: existing.isWithinGeofence, duplicate: true };
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: data.employeeId,
        localId: data.localId || undefined,
        type: data.type,
        timestamp: new Date(),
        lat: data.lat,
        lng: data.lng,
        distance,
        accuracy: data.accuracy || null,
        isWithinGeofence: within,
        photoUrl: data.photoUrl || null,
        photoHash: data.photoHash || null,
        deviceInfo: data.deviceInfo || "Web Mobile PWA",
        note: data.note || null,
        isApproved: within,
      },
    });

    return { attendance, distance, isWithinGeofence: within, duplicate: false };
  }

  static async getAttendanceLogs(options?: { siteId?: string | null; status?: string | null; dateStr?: string | null }) {
    const where: any = {};
    if (options?.siteId && options.siteId !== "all") {
      where.employee = { siteId: options.siteId };
    }
    if (options?.status === "pending") {
      where.isApproved = false;
    } else if (options?.status === "approved") {
      where.isApproved = true;
    }

    if (options?.dateStr) {
      const start = new Date(options.dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(options.dateStr);
      end.setHours(23, 59, 59, 999);
      where.timestamp = { gte: start, lte: end };
    }

    return prisma.attendance.findMany({
      where,
      include: {
        employee: { include: { site: true } },
      },
      orderBy: { timestamp: "desc" },
    });
  }

  static async approveOrReject(ids: string[], action: "APPROVE" | "REJECT", approvedBy?: string) {
    const isApproved = action === "APPROVE";
    return prisma.attendance.updateMany({
      where: { id: { in: ids } },
      data: {
        isApproved,
        approvedBy: approvedBy || "HR Admin",
        approvedAt: new Date(),
      },
    });
  }
}
