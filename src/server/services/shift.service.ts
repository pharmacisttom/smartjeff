import { prisma } from "@/lib/prisma";

export interface CreateShiftInput {
  code: string;
  name: string;
  startTime: string; // "HH:MM" e.g. "07:00"
  endTime: string;   // "HH:MM" e.g. "16:00"
  breakMinutes?: number;
  isOvernight?: boolean;
  lateToleranceMinutes?: number;
  earlyCheckInMinutes?: number;
  allowedEarlyLeaveMinutes?: number;
  color?: string;
  isActive?: boolean;
}

export interface UpdateShiftInput extends Partial<CreateShiftInput> {}

export class ShiftService {
  /**
   * Parse "HH:MM" string to minutes from midnight
   */
  static parseTimeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Format minutes from midnight to "HH:MM"
   */
  static formatMinutesToTime(minutes: number): string {
    const norm = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  /**
   * Calculate duration of a shift in minutes (taking overnight and break into account)
   */
  static calculateShiftDurationMinutes(startTime: string, endTime: string, breakMinutes: number = 60, isOvernight?: boolean): number {
    const startMin = this.parseTimeToMinutes(startTime);
    let endMin = this.parseTimeToMinutes(endTime);

    const overnight = isOvernight !== undefined ? isOvernight : endMin <= startMin;
    if (overnight) {
      endMin += 1440; // Add 24 hours
    }

    const totalMinutes = endMin - startMin;
    const workingMinutes = Math.max(0, totalMinutes - (breakMinutes || 0));
    return workingMinutes;
  }

  /**
   * Build accurate Date range for a shift on a specific workDate (Asia/Bangkok)
   */
  static getShiftDateTimeRange(workDate: Date, startTime: string, endTime: string, isOvernight: boolean = false): { plannedStart: Date; plannedEnd: Date } {
    // Format date in YYYY-MM-DD
    const tzOffsetMs = 7 * 3600 * 1000;
    const bkkDate = new Date(workDate.getTime() + tzOffsetMs);
    const y = bkkDate.getUTCFullYear();
    const m = String(bkkDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(bkkDate.getUTCDate()).padStart(2, "0");

    const [startH, startM] = startTime.split(":").map((v) => parseInt(v, 10));
    const [endH, endM] = endTime.split(":").map((v) => parseInt(v, 10));

    // Asia/Bangkok is UTC+7 -> UTC is Bangkok - 7 hours
    const plannedStart = new Date(Date.UTC(y, parseInt(m, 10) - 1, parseInt(d, 10), startH - 7, startM, 0, 0));

    let endDay = parseInt(d, 10);
    if (isOvernight || (endH * 60 + endM <= startH * 60 + startM)) {
      endDay += 1;
    }

    const plannedEnd = new Date(Date.UTC(y, parseInt(m, 10) - 1, endDay, endH - 7, endM, 0, 0));

    return { plannedStart, plannedEnd };
  }

  /**
   * Seed default master shifts if empty
   */
  static async ensureDefaultShifts() {
    const count = await prisma.shift.count();
    if (count > 0) return;

    const defaultShifts: CreateShiftInput[] = [
      {
        code: "MORNING",
        name: "กะเช้า (Morning)",
        startTime: "07:00",
        endTime: "16:00",
        breakMinutes: 60,
        isOvernight: false,
        lateToleranceMinutes: 10,
        earlyCheckInMinutes: 30,
        color: "#3B82F6", // Blue
      },
      {
        code: "EVENING",
        name: "กะบ่าย (Evening)",
        startTime: "15:00",
        endTime: "00:00",
        breakMinutes: 60,
        isOvernight: false,
        lateToleranceMinutes: 10,
        earlyCheckInMinutes: 30,
        color: "#F59E0B", // Amber
      },
      {
        code: "NIGHT",
        name: "กะดึก (Night)",
        startTime: "23:00",
        endTime: "08:00",
        breakMinutes: 60,
        isOvernight: true,
        lateToleranceMinutes: 10,
        earlyCheckInMinutes: 30,
        color: "#8B5CF6", // Purple
      },
      {
        code: "OFFICE",
        name: "กะสำนักงาน (Office)",
        startTime: "08:00",
        endTime: "17:00",
        breakMinutes: 60,
        isOvernight: false,
        lateToleranceMinutes: 15,
        earlyCheckInMinutes: 30,
        color: "#10B981", // Emerald
      },
      {
        code: "FLEXIBLE",
        name: "กะยืดหยุ่น (Flexible)",
        startTime: "09:00",
        endTime: "18:00",
        breakMinutes: 60,
        isOvernight: false,
        lateToleranceMinutes: 30,
        earlyCheckInMinutes: 60,
        color: "#6B7280", // Gray
      },
    ];

    for (const s of defaultShifts) {
      await prisma.shift.upsert({
        where: { code: s.code },
        update: {},
        create: {
          code: s.code,
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          breakMinutes: s.breakMinutes ?? 60,
          isOvernight: s.isOvernight ?? false,
          lateToleranceMinutes: s.lateToleranceMinutes ?? 10,
          earlyCheckInMinutes: s.earlyCheckInMinutes ?? 30,
          allowedEarlyLeaveMinutes: s.allowedEarlyLeaveMinutes ?? 0,
          color: s.color ?? "#3B82F6",
          isActive: true,
        },
      });
    }
  }

  /**
   * Get all active shifts
   */
  static async getShifts(includeInactive: boolean = false) {
    await this.ensureDefaultShifts();
    return prisma.shift.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { startTime: "asc" },
    });
  }

  /**
   * Get shift by ID or Code
   */
  static async getShiftByIdOrCode(idOrCode: string) {
    return prisma.shift.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
    });
  }

  /**
   * Create a new shift master
   */
  static async createShift(input: CreateShiftInput) {
    const isOvernight = input.isOvernight ?? (this.parseTimeToMinutes(input.endTime) <= this.parseTimeToMinutes(input.startTime));

    return prisma.shift.create({
      data: {
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        startTime: input.startTime,
        endTime: input.endTime,
        breakMinutes: input.breakMinutes ?? 60,
        isOvernight,
        lateToleranceMinutes: input.lateToleranceMinutes ?? 10,
        earlyCheckInMinutes: input.earlyCheckInMinutes ?? 30,
        allowedEarlyLeaveMinutes: input.allowedEarlyLeaveMinutes ?? 0,
        color: input.color ?? "#3B82F6",
        isActive: input.isActive ?? true,
      },
    });
  }

  /**
   * Update shift
   */
  static async updateShift(id: string, input: UpdateShiftInput) {
    const existing = await prisma.shift.findUnique({ where: { id } });
    if (!existing) throw new Error(`Shift not found: ${id}`);

    const startTime = input.startTime ?? existing.startTime;
    const endTime = input.endTime ?? existing.endTime;
    const isOvernight = input.isOvernight !== undefined
      ? input.isOvernight
      : (this.parseTimeToMinutes(endTime) <= this.parseTimeToMinutes(startTime));

    return prisma.shift.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.code ? { code: input.code.toUpperCase().trim() } : {}),
        ...(input.startTime ? { startTime: input.startTime } : {}),
        ...(input.endTime ? { endTime: input.endTime } : {}),
        isOvernight,
        ...(input.breakMinutes !== undefined ? { breakMinutes: input.breakMinutes } : {}),
        ...(input.lateToleranceMinutes !== undefined ? { lateToleranceMinutes: input.lateToleranceMinutes } : {}),
        ...(input.earlyCheckInMinutes !== undefined ? { earlyCheckInMinutes: input.earlyCheckInMinutes } : {}),
        ...(input.allowedEarlyLeaveMinutes !== undefined ? { allowedEarlyLeaveMinutes: input.allowedEarlyLeaveMinutes } : {}),
        ...(input.color ? { color: input.color } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  }

  /**
   * Delete shift
   */
  static async deleteShift(id: string) {
    return prisma.shift.delete({ where: { id } });
  }
}
