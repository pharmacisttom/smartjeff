import { prisma } from "@/lib/prisma";

export interface ConflictCheckParams {
  employeeId: string;
  siteId: string;
  shiftId: string;
  workDate: Date;
  plannedStart: Date;
  plannedEnd: Date;
  excludeAssignmentId?: string;
  requiredSkillCode?: string;
  minimumRestHours?: number; // default 8
  maxDailyHours?: number;    // default 12
  maxWeeklyHours?: number;   // default 48
  maxConsecutiveDays?: number; // default 6
}

export interface ShiftConflictItem {
  type:
    | "SHIFT_OVERLAP"
    | "DOUBLE_ASSIGNMENT"
    | "ON_LEAVE"
    | "INSUFFICIENT_REST"
    | "EXCESSIVE_HOURS"
    | "SITE_CONFLICT"
    | "SKILL_MISMATCH"
    | "EXPIRED_CERTIFICATION"
    | "SCHEDULE_LOCKED";
  severity: "ERROR" | "WARNING";
  message: string;
  details?: Record<string, any>;
}

export interface ConflictValidationResult {
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  conflicts: ShiftConflictItem[];
}

export class ShiftConflictService {
  /**
   * Validate shift assignment against all enterprise constraints
   */
  static async validateAssignment(params: ConflictCheckParams): Promise<ConflictValidationResult> {
    const conflicts: ShiftConflictItem[] = [];
    const minRestHours = params.minimumRestHours ?? 8;
    const maxDailyHours = params.maxDailyHours ?? 12;
    const maxWeeklyHours = params.maxWeeklyHours ?? 48;
    const maxConsecutive = params.maxConsecutiveDays ?? 6;

    // Normalize workDate start and end of day in UTC
    const dateStart = new Date(params.workDate);
    dateStart.setUTCHours(0, 0, 0, 0);
    const dateEnd = new Date(params.workDate);
    dateEnd.setUTCHours(23, 59, 59, 999);

    // 1. Check SCHEDULE_LOCKED
    const lockedPeriod = await prisma.schedulePeriod.findFirst({
      where: {
        siteId: params.siteId,
        startDate: { lte: dateEnd },
        endDate: { gte: dateStart },
        status: "LOCKED",
      },
    });

    if (lockedPeriod) {
      conflicts.push({
        type: "SCHEDULE_LOCKED",
        severity: "ERROR",
        message: `ตารางงานของไซต์นี้ถูกล็อค (Locked) โดยผู้บริหารแล้ว ไม่สามารถแก้ไขได้`,
        details: { lockedBy: lockedPeriod.lockedBy, lockReason: lockedPeriod.lockReason },
      });
    }

    // 2. Check ON_LEAVE
    const overlappingLeave = await prisma.leave.findFirst({
      where: {
        employeeId: params.employeeId,
        status: "APPROVED",
        startDate: { lte: dateEnd },
        endDate: { gte: dateStart },
      },
    });

    if (overlappingLeave) {
      conflicts.push({
        type: "ON_LEAVE",
        severity: "ERROR",
        message: `พนักงานอยู่ในช่วงการลาที่ได้รับอนุมัติ (${overlappingLeave.type})`,
        details: { leaveType: overlappingLeave.type, reason: overlappingLeave.reason },
      });
    }

    // 3. Fetch nearby assignments for overlap & rest period checking (range: -2 days to +2 days)
    const windowStart = new Date(dateStart.getTime() - 2 * 86400 * 1000);
    const windowEnd = new Date(dateEnd.getTime() + 2 * 86400 * 1000);

    const nearbyAssignments = await prisma.shiftAssignment.findMany({
      where: {
        employeeId: params.employeeId,
        status: { notIn: ["CANCELLED"] },
        ...(params.excludeAssignmentId ? { id: { not: params.excludeAssignmentId } } : {}),
        workDate: { gte: windowStart, lte: windowEnd },
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        shift: { select: { id: true, name: true, code: true } },
      },
      orderBy: { plannedStart: "asc" },
    });

    const currentStartMs = params.plannedStart.getTime();
    const currentEndMs = params.plannedEnd.getTime();

    for (const a of nearbyAssignments) {
      const aStartMs = a.plannedStart.getTime();
      const aEndMs = a.plannedEnd.getTime();

      // 3.1 SHIFT_OVERLAP / DOUBLE_ASSIGNMENT
      // Two intervals [S1, E1] and [S2, E2] overlap if S1 < E2 and S2 < E1
      if (currentStartMs < aEndMs && aStartMs < currentEndMs) {
        const isDiffSite = a.siteId !== params.siteId;
        conflicts.push({
          type: isDiffSite ? "DOUBLE_ASSIGNMENT" : "SHIFT_OVERLAP",
          severity: "ERROR",
          message: isDiffSite
            ? `พนักงานถูกมอบหมายงานที่ไซต์ ${a.site.name} (${a.shift.name}) ในเวลาเดียวกันแล้ว`
            : `เวลากะทับซ้อนกับกะเดิม (${a.shift.name})`,
          details: {
            conflictingAssignmentId: a.id,
            siteName: a.site.name,
            shiftName: a.shift.name,
            plannedStart: a.plannedStart,
            plannedEnd: a.plannedEnd,
          },
        });
      }

      // 3.2 INSUFFICIENT_REST
      // Preceding shift: a ends before current starts
      if (aEndMs <= currentStartMs) {
        const restHours = (currentStartMs - aEndMs) / (3600 * 1000);
        if (restHours < minRestHours) {
          conflicts.push({
            type: "INSUFFICIENT_REST",
            severity: "ERROR",
            message: `เวลาพักผ่อนก่อนเริ่มกะไม่เพียงพอ (${restHours.toFixed(1)} ชม. น้อยกว่าเกณฑ์ขั้นต่ำ ${minRestHours} ชม.) จากกะ ${a.shift.name}`,
            details: { restHours, minRequired: minRestHours, prevShiftEnd: a.plannedEnd },
          });
        }
      }

      // Succeeding shift: current ends before a starts
      if (currentEndMs <= aStartMs) {
        const restHours = (aStartMs - currentEndMs) / (3600 * 1000);
        if (restHours < minRestHours) {
          conflicts.push({
            type: "INSUFFICIENT_REST",
            severity: "ERROR",
            message: `เวลาพักผ่อนหลังเลิกกะไม่เพียงพอ (${restHours.toFixed(1)} ชม. น้อยกว่าเกณฑ์ขั้นต่ำ ${minRestHours} ชม.) ก่อนเริ่มกะถัดไป ${a.shift.name}`,
            details: { restHours, minRequired: minRestHours, nextShiftStart: a.plannedStart },
          });
        }
      }
    }

    // 4. EXCESSIVE_HOURS (Weekly & Daily check)
    // Daily hours on workDate
    const currentShiftDurationHours = (currentEndMs - currentStartMs) / (3600 * 1000);
    const sameDayAssignments = nearbyAssignments.filter((a) => {
      const aDate = new Date(a.workDate);
      return (
        aDate.getUTCFullYear() === params.workDate.getUTCFullYear() &&
        aDate.getUTCMonth() === params.workDate.getUTCMonth() &&
        aDate.getUTCDate() === params.workDate.getUTCDate()
      );
    });

    const totalDailyHours =
      sameDayAssignments.reduce((sum, a) => sum + (a.plannedEnd.getTime() - a.plannedStart.getTime()) / 3600000, 0) +
      currentShiftDurationHours;

    if (totalDailyHours > maxDailyHours) {
      conflicts.push({
        type: "EXCESSIVE_HOURS",
        severity: "WARNING",
        message: `ชั่วโมงทำงานรวมในวันนี้ (${totalDailyHours.toFixed(1)} ชม.) เกินเกณฑ์สูงสุด (${maxDailyHours} ชม.)`,
        details: { totalDailyHours, maxDailyHours },
      });
    }

    // Weekly hours (Monday to Sunday containing workDate)
    const dayOfWeek = params.workDate.getUTCDay(); // 0 is Sun, 1 is Mon
    const diffToMon = (dayOfWeek + 6) % 7;
    const weekStart = new Date(dateStart.getTime() - diffToMon * 86400 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400 * 1000 - 1);

    const weekAssignments = await prisma.shiftAssignment.findMany({
      where: {
        employeeId: params.employeeId,
        status: { notIn: ["CANCELLED"] },
        ...(params.excludeAssignmentId ? { id: { not: params.excludeAssignmentId } } : {}),
        workDate: { gte: weekStart, lte: weekEnd },
      },
    });

    const totalWeeklyHours =
      weekAssignments.reduce((sum, a) => sum + (a.plannedEnd.getTime() - a.plannedStart.getTime()) / 3600000, 0) +
      currentShiftDurationHours;

    if (totalWeeklyHours > maxWeeklyHours) {
      conflicts.push({
        type: "EXCESSIVE_HOURS",
        severity: "WARNING",
        message: `ชั่วโมงทำงานรวมในสัปดาห์นี้ (${totalWeeklyHours.toFixed(1)} ชม.) เกินเกณฑ์สูงสุด (${maxWeeklyHours} ชม.)`,
        details: { totalWeeklyHours, maxWeeklyHours },
      });
    }

    // Consecutive Days Check (look back 7 days)
    const past7DaysStart = new Date(dateStart.getTime() - 7 * 86400 * 1000);
    const pastAssignments = await prisma.shiftAssignment.findMany({
      where: {
        employeeId: params.employeeId,
        status: { notIn: ["CANCELLED"] },
        ...(params.excludeAssignmentId ? { id: { not: params.excludeAssignmentId } } : {}),
        workDate: { gte: past7DaysStart, lt: dateStart },
      },
      orderBy: { workDate: "desc" },
    });

    // Count consecutive days leading up to today
    let consecutiveDays = 0;
    let checkDay = new Date(dateStart.getTime() - 86400 * 1000);
    while (consecutiveDays < 14) {
      const checkDayStr = checkDay.toISOString().split("T")[0];
      const hasWork = pastAssignments.some((a) => a.workDate.toISOString().split("T")[0] === checkDayStr);
      if (hasWork) {
        consecutiveDays++;
        checkDay = new Date(checkDay.getTime() - 86400 * 1000);
      } else {
        break;
      }
    }

    if (consecutiveDays + 1 > maxConsecutive) {
      conflicts.push({
        type: "EXCESSIVE_HOURS",
        severity: "WARNING",
        message: `พนักงานทำงานติดต่อกันเกินเกณฑ์ (${consecutiveDays + 1} วัน เกินกำหนด ${maxConsecutive} วัน)`,
        details: { consecutiveDays: consecutiveDays + 1, maxConsecutive },
      });
    }

    // 5. SKILL_MISMATCH / EXPIRED_CERTIFICATION (if requiredSkillCode provided)
    if (params.requiredSkillCode) {
      const empSkill = await prisma.employeeSkill.findFirst({
        where: {
          employeeId: params.employeeId,
          skill: { code: params.requiredSkillCode },
        },
        include: { skill: true },
      });

      if (!empSkill) {
        conflicts.push({
          type: "SKILL_MISMATCH",
          severity: "WARNING",
          message: `พนักงานไม่มีทักษะ ${params.requiredSkillCode} ตามที่กะต้องการ`,
          details: { requiredSkillCode: params.requiredSkillCode },
        });
      } else if (empSkill.expiresAt && empSkill.expiresAt < new Date()) {
        conflicts.push({
          type: "EXPIRED_CERTIFICATION",
          severity: "ERROR",
          message: `ใบรับรองทักษะ ${empSkill.skill.name} หมดอายุแล้วเมื่อ ${empSkill.expiresAt.toISOString().split("T")[0]}`,
          details: { skillCode: empSkill.skill.code, expiresAt: empSkill.expiresAt },
        });
      }
    }

    const hasErrors = conflicts.some((c) => c.severity === "ERROR");
    const hasWarnings = conflicts.some((c) => c.severity === "WARNING");

    return {
      isValid: !hasErrors,
      hasErrors,
      hasWarnings,
      conflicts,
    };
  }
}
