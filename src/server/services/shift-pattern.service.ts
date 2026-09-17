import { prisma } from "@/lib/prisma";
import { ShiftService } from "./shift.service";
import { ShiftConflictService } from "./shift-conflict.service";

export interface CreateShiftPatternInput {
  code: string;
  name: string;
  description?: string;
  cycleDays: number;
  items: Array<{
    dayNumber: number;
    shiftId?: string | null;
    isDayOff: boolean;
  }>;
}

export class ShiftPatternService {
  /**
   * Seed standard rotating patterns if empty
   */
  static async ensureDefaultPatterns() {
    const count = await prisma.shiftPattern.count();
    if (count > 0) return;

    await ShiftService.ensureDefaultShifts();
    const morning = await prisma.shift.findUnique({ where: { code: "MORNING" } });
    const evening = await prisma.shift.findUnique({ where: { code: "EVENING" } });
    const night = await prisma.shift.findUnique({ where: { code: "NIGHT" } });

    if (!morning || !evening || !night) return;

    // Pattern 1: 4 On / 2 Off (Morning)
    await prisma.shiftPattern.create({
      data: {
        code: "4ON_2OFF_MORN",
        name: "กะเช้า 4 วัน พัก 2 วัน (4 On / 2 Off)",
        cycleDays: 6,
        items: {
          create: [
            { dayNumber: 1, shiftId: morning.id, isDayOff: false },
            { dayNumber: 2, shiftId: morning.id, isDayOff: false },
            { dayNumber: 3, shiftId: morning.id, isDayOff: false },
            { dayNumber: 4, shiftId: morning.id, isDayOff: false },
            { dayNumber: 5, shiftId: null, isDayOff: true },
            { dayNumber: 6, shiftId: null, isDayOff: true },
          ],
        },
      },
    });

    // Pattern 2: Rotating 2-2-2-1 (2 Morning, 2 Evening, 2 Night, 1 Off)
    await prisma.shiftPattern.create({
      data: {
        code: "ROTATING_2221",
        name: "กะหมุนเวียน 7 วัน (เช้า 2 - บ่าย 2 - ดึก 2 - หยุด 1)",
        cycleDays: 7,
        items: {
          create: [
            { dayNumber: 1, shiftId: morning.id, isDayOff: false },
            { dayNumber: 2, shiftId: morning.id, isDayOff: false },
            { dayNumber: 3, shiftId: evening.id, isDayOff: false },
            { dayNumber: 4, shiftId: evening.id, isDayOff: false },
            { dayNumber: 5, shiftId: night.id, isDayOff: false },
            { dayNumber: 6, shiftId: night.id, isDayOff: false },
            { dayNumber: 7, shiftId: null, isDayOff: true },
          ],
        },
      },
    });
  }

  /**
   * Get all shift patterns
   */
  static async getPatterns() {
    await this.ensureDefaultPatterns();
    return prisma.shiftPattern.findMany({
      where: { isActive: true },
      include: {
        items: {
          include: { shift: true },
          orderBy: { dayNumber: "asc" },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  /**
   * Create a new shift pattern
   */
  static async createPattern(input: CreateShiftPatternInput) {
    return prisma.shiftPattern.create({
      data: {
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        description: input.description,
        cycleDays: input.cycleDays,
        items: {
          create: input.items.map((i) => ({
            dayNumber: i.dayNumber,
            shiftId: i.isDayOff ? null : i.shiftId,
            isDayOff: i.isDayOff,
          })),
        },
      },
      include: {
        items: { include: { shift: true } },
      },
    });
  }

  /**
   * Apply a rotating pattern to an employee over a date range
   */
  static async applyPatternToEmployee(params: {
    employeeId: string;
    patternId: string;
    siteId: string;
    startDate: Date;
    endDate: Date;
    assignedBy: string;
  }) {
    const pattern = await prisma.shiftPattern.findUnique({
      where: { id: params.patternId },
      include: { items: { include: { shift: true } } },
    });
    if (!pattern) throw new Error("Pattern not found");

    const start = new Date(params.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(params.endDate);
    end.setUTCHours(23, 59, 59, 999);

    const createdAssignments = [];
    const skippedDays = [];

    const dateCursor = new Date(start);
    const msPerDay = 86400000;

    while (dateCursor <= end) {
      const curDate = new Date(dateCursor);
      // Calculate day in cycle (1 to cycleDays)
      const daysSinceStart = Math.floor((curDate.getTime() - start.getTime()) / msPerDay);
      const dayNumber = (daysSinceStart % pattern.cycleDays) + 1;

      const item = pattern.items.find((i) => i.dayNumber === dayNumber);
      if (item && !item.isDayOff && item.shift) {
        const { plannedStart, plannedEnd } = ShiftService.getShiftDateTimeRange(
          curDate,
          item.shift.startTime,
          item.shift.endTime,
          item.shift.isOvernight
        );

        const validation = await ShiftConflictService.validateAssignment({
          employeeId: params.employeeId,
          siteId: params.siteId,
          shiftId: item.shift.id,
          workDate: curDate,
          plannedStart,
          plannedEnd,
        });

        if (validation.isValid) {
          const asmt = await prisma.shiftAssignment.create({
            data: {
              employeeId: params.employeeId,
              siteId: params.siteId,
              shiftId: item.shift.id,
              workDate: curDate,
              plannedStart,
              plannedEnd,
              status: "PLANNED",
              assignedBy: params.assignedBy,
              notes: `Pattern: ${pattern.name} (Day ${dayNumber})`,
            },
          });
          createdAssignments.push(asmt);
        } else {
          skippedDays.push({
            date: curDate.toISOString().split("T")[0],
            reason: validation.conflicts.map((c) => c.message).join(", "),
          });
        }
      }

      dateCursor.setUTCDate(dateCursor.getUTCDate() + 1);
    }

    // Record EmployeeShiftPattern record
    await prisma.employeeShiftPattern.create({
      data: {
        employeeId: params.employeeId,
        patternId: params.patternId,
        startDate: start,
        endDate: end,
      },
    });

    return {
      success: true,
      createdCount: createdAssignments.length,
      skippedCount: skippedDays.length,
      skippedDays,
    };
  }
}
