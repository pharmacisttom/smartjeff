import { prisma } from "@/lib/prisma";

export interface VehicleDispatchRecommendation {
  vehicleId: string;
  plateNo: string;
  type: string;
  score: number;
  reasons: string[];
  maintenanceAlert: boolean;
  insuranceExpiringSoon: boolean;
}

export class FleetIntelligenceService {
  /**
   * Recommends optimal available vehicles for dispatch tasks.
   */
  static async recommendVehiclesForTrip(): Promise<VehicleDispatchRecommendation[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true, status: "AVAILABLE" },
      include: {
        maintenances: { orderBy: { createdAt: "desc" }, take: 1 },
        trips: { where: { status: { in: ["PLANNED", "IN_PROGRESS"] } } },
      },
    });

    const recommendations: VehicleDispatchRecommendation[] = [];
    const now = new Date();

    for (const v of vehicles) {
      const reasons: string[] = [];
      let score = 100;
      let maintenanceAlert = false;
      let insuranceExpiringSoon = false;

      if (v.trips.length > 0) {
        score -= 40;
        reasons.push("มีเที่ยวรถที่กำลังดำเนินการหรือวางแผนไว้แล้ว");
      } else {
        reasons.push("สถานะพร้อมใช้งานทันที (No active trips)");
      }

      if (v.insuranceExp) {
        const diffDays = Math.ceil((new Date(v.insuranceExp).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          insuranceExpiringSoon = true;
          score -= 20;
          reasons.push(`ประกันภัยรถยนต์จะหมดอายุภายใน ${diffDays} วัน`);
        }
      }

      if (v.odometer > 50000) {
        reasons.push("ไมล์สะสมสูง แนะนำตรวจเช็กสภาพก่อนเดินทางไกล");
      }

      recommendations.push({
        vehicleId: v.id,
        plateNo: v.plateNo,
        type: v.type,
        score: Math.max(0, score),
        reasons,
        maintenanceAlert,
        insuranceExpiringSoon,
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }
}
