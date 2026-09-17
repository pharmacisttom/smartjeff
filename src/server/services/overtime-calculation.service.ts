import { prisma } from "@/lib/prisma";

export type OvertimeType = "PRE_SHIFT_OT" | "POST_SHIFT_OT" | "DAY_OFF_OT" | "HOLIDAY_OT";

export interface OvertimeCalculationResult {
  employeeId: string;
  workDate: string;
  type: OvertimeType;
  plannedOtMinutes: number;
  actualOtMinutes: number;
  approvedOtMinutes: number;
  isApproved: boolean;
  notes: string;
}

export interface SiteOtForecast {
  siteId: string;
  siteCode: string;
  siteName: string;
  scheduledShifts: number;
  scheduledHours: number;
  workforceDeficit: number;
  projectedOtHours: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  notes: string;
}

export class OvertimeCalculationService {
  /**
   * Calculate OT breakdown for a shift and actual attendance
   */
  static calculateShiftOvertime(params: {
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    actualCheckIn: Date | null;
    actualCheckOut: Date | null;
    isDayOff?: boolean;
    isHoliday?: boolean;
    approvedOtHours?: number; // Pre-approved OT
  }): {
    preShiftMinutes: number;
    postShiftMinutes: number;
    totalActualOtMinutes: number;
    approvedOtMinutes: number;
    payableOtMinutes: number;
    type: OvertimeType;
  } {
    let preShiftMinutes = 0;
    let postShiftMinutes = 0;
    let type: OvertimeType = "POST_SHIFT_OT";

    if (params.isHoliday) {
      type = "HOLIDAY_OT";
    } else if (params.isDayOff) {
      type = "DAY_OFF_OT";
    }

    if (params.isDayOff || params.isHoliday) {
      if (params.actualCheckIn && params.actualCheckOut) {
        const gross = Math.floor((params.actualCheckOut.getTime() - params.actualCheckIn.getTime()) / 60000);
        postShiftMinutes = Math.max(0, gross - 60); // Deduct 1h break
      }
    } else if (params.scheduledStart && params.scheduledEnd && params.actualCheckIn && params.actualCheckOut) {
      // Pre-shift OT: check-in earlier than scheduled start by at least 30 min
      const preDiff = Math.floor((params.scheduledStart.getTime() - params.actualCheckIn.getTime()) / 60000);
      if (preDiff >= 30) {
        preShiftMinutes = preDiff;
      }

      // Post-shift OT: check-out later than scheduled end by at least 30 min
      const postDiff = Math.floor((params.actualCheckOut.getTime() - params.scheduledEnd.getTime()) / 60000);
      if (postDiff >= 30) {
        postShiftMinutes = postDiff;
      }
    }

    const totalActualOtMinutes = preShiftMinutes + postShiftMinutes;
    const approvedOtMinutes = (params.approvedOtHours || 0) * 60;

    // Strict Rule: Payable OT cannot exceed approved OT without manager authorization
    const payableOtMinutes = approvedOtMinutes > 0
      ? Math.min(totalActualOtMinutes, approvedOtMinutes)
      : 0;

    return {
      preShiftMinutes,
      postShiftMinutes,
      totalActualOtMinutes,
      approvedOtMinutes,
      payableOtMinutes,
      type,
    };
  }

  /**
   * Forecast OT across all sites for a given week or date range
   */
  static async getOtForecast(params: {
    startDate: Date;
    endDate: Date;
    siteId?: string;
  }) {
    const start = new Date(params.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(params.endDate);
    end.setUTCHours(23, 59, 59, 999);

    const [sites, assignments, requirements] = await Promise.all([
      prisma.site.findMany({
        where: params.siteId ? { id: params.siteId } : {},
      }),
      prisma.shiftAssignment.findMany({
        where: {
          workDate: { gte: start, lte: end },
          ...(params.siteId ? { siteId: params.siteId } : {}),
          status: { notIn: ["CANCELLED"] },
        },
        include: { shift: true },
      }),
      prisma.siteWorkforceRequirement.findMany({
        where: {
          siteId: params.siteId ? params.siteId : undefined,
          isActive: true,
        },
      }),
    ]);

    const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const siteForecasts: SiteOtForecast[] = [];

    let totalProjectedOtHours = 0;

    for (const site of sites) {
      const siteAssignments = assignments.filter((a) => a.siteId === site.id);
      const siteReq = requirements.find((r) => r.siteId === site.id);

      const targetPerDay = siteReq?.target ?? site.targetWorkforce ?? 2;
      const totalRequiredAssignments = targetPerDay * daysCount;
      const scheduledCount = siteAssignments.length;
      const deficit = Math.max(0, totalRequiredAssignments - scheduledCount);

      // Scheduled overtime: any shift planned duration > 8h
      const scheduledOtHours = siteAssignments.reduce((acc, a) => {
        const hrs = (a.plannedEnd.getTime() - a.plannedStart.getTime()) / 3600000;
        return hrs > 8 ? acc + (hrs - 8) : acc;
      }, 0);

      // Deficit-induced overtime: each missing worker typically requires 4-8 hours OT from remaining crew
      const deficitOtHours = deficit * 4;
      const projectedOtHours = Math.round((scheduledOtHours + deficitOtHours) * 10) / 10;
      totalProjectedOtHours += projectedOtHours;

      let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
      if (projectedOtHours > 100 || deficit > 5) {
        riskLevel = "HIGH";
      } else if (projectedOtHours > 40 || deficit > 2) {
        riskLevel = "MEDIUM";
      }

      siteForecasts.push({
        siteId: site.id,
        siteCode: site.code,
        siteName: site.name,
        scheduledShifts: scheduledCount,
        scheduledHours: Math.round(
          siteAssignments.reduce(
            (acc, a) => acc + (a.plannedEnd.getTime() - a.plannedStart.getTime()) / 3600000,
            0
          )
        ),
        workforceDeficit: deficit,
        projectedOtHours,
        riskLevel,
        notes:
          deficit > 0
            ? `กำลังคนขาดแคลน ${deficit} ตำแหน่ง อาจจำเป็นต้องเพิ่มชั่วโมง OT เพื่อครอบคลุมงาน`
            : "อัตรากำลังเพียงพอตามเป้าหมาย",
      });
    }

    return {
      success: true,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      totalProjectedOtHours: Math.round(totalProjectedOtHours * 10) / 10,
      highRiskSitesCount: siteForecasts.filter((s) => s.riskLevel === "HIGH").length,
      sites: siteForecasts,
    };
  }
}
