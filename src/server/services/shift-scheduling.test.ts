import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShiftService } from "./shift.service";
import { ShiftConflictService } from "./shift-conflict.service";
import { AttendanceReconciliationService } from "./attendance-reconciliation.service";
import { OvertimeCalculationService } from "./overtime-calculation.service";
import { prisma } from "@/lib/prisma";

// Mock prisma for isolated deterministic tests
vi.mock("@/lib/prisma", () => ({
  prisma: {
    shift: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    shiftAssignment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    shiftPattern: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    shiftSwapRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    schedulePeriod: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    leave: {
      findFirst: vi.fn(),
    },
    employeeSkill: {
      findFirst: vi.fn(),
    },
    shiftAuditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => cb(prisma)),
  },
}));

describe("SmartJeff Phase 9 — Shift & Scheduling Intelligence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.shiftAssignment.findMany as any).mockResolvedValue([]);
    (prisma.leave.findFirst as any).mockResolvedValue(null);
    (prisma.schedulePeriod.findFirst as any).mockResolvedValue(null);
    (prisma.employeeSkill.findFirst as any).mockResolvedValue(null);
  });

  describe("1. Shift Service & Overnight Shift Math", () => {
    it("should parse time string to minutes correctly", () => {
      expect(ShiftService.parseTimeToMinutes("07:00")).toBe(420);
      expect(ShiftService.parseTimeToMinutes("23:30")).toBe(1410);
      expect(ShiftService.parseTimeToMinutes("00:00")).toBe(0);
    });

    it("should calculate daytime shift duration deducting break", () => {
      // 07:00 to 16:00 (9 hours = 540 min), break 60 min -> 480 min (8 hours)
      const duration = ShiftService.calculateShiftDurationMinutes("07:00", "16:00", 60, false);
      expect(duration).toBe(480);
    });

    it("should calculate overnight shift duration correctly (23:00 to 08:00)", () => {
      // 23:00 to 08:00 next day (9 hours = 540 min), break 60 min -> 480 min (8 hours)
      const duration = ShiftService.calculateShiftDurationMinutes("23:00", "08:00", 60, true);
      expect(duration).toBe(480);
    });

    it("should build accurate Date range for overnight shift crossing midnight", () => {
      const workDate = new Date("2026-09-18T00:00:00Z");
      const { plannedStart, plannedEnd } = ShiftService.getShiftDateTimeRange(
        workDate,
        "23:00",
        "08:00",
        true
      );

      // Start is 23:00 Bangkok time (16:00 UTC)
      // End is 08:00 next day Bangkok time (01:00 UTC on 2026-09-19)
      const diffHours = (plannedEnd.getTime() - plannedStart.getTime()) / 3600000;
      expect(diffHours).toBe(9);
      expect(plannedEnd.getTime()).toBeGreaterThan(plannedStart.getTime());
    });
  });

  describe("2. Shift Conflict Service", () => {
    it("should detect ON_LEAVE conflict when employee has approved leave", async () => {
      (prisma.schedulePeriod.findFirst as any).mockResolvedValue(null);
      (prisma.leave.findFirst as any).mockResolvedValue({
        id: "leave-1",
        type: "VACATION",
        reason: "พักร้อนประจำปี",
      });

      const res = await ShiftConflictService.validateAssignment({
        employeeId: "emp-1",
        siteId: "site-1",
        shiftId: "shift-1",
        workDate: new Date("2026-09-18T00:00:00Z"),
        plannedStart: new Date("2026-09-18T07:00:00Z"),
        plannedEnd: new Date("2026-09-18T16:00:00Z"),
      });

      expect(res.isValid).toBe(false);
      expect(res.hasErrors).toBe(true);
      expect(res.conflicts.some((c) => c.type === "ON_LEAVE")).toBe(true);
    });

    it("should detect SHIFT_OVERLAP / DOUBLE_ASSIGNMENT when times overlap", async () => {
      (prisma.schedulePeriod.findFirst as any).mockResolvedValue(null);
      (prisma.leave.findFirst as any).mockResolvedValue(null);

      // Existing assignment: 08:00 to 17:00 at site-2
      (prisma.shiftAssignment.findMany as any).mockResolvedValue([
        {
          id: "asmt-existing",
          siteId: "site-2",
          shiftId: "shift-office",
          plannedStart: new Date("2026-09-18T08:00:00Z"),
          plannedEnd: new Date("2026-09-18T17:00:00Z"),
          site: { name: "Site B", code: "B" },
          shift: { name: "Office", code: "OFFICE" },
          workDate: new Date("2026-09-18T00:00:00Z"),
        },
      ]);

      // New assignment: 07:00 to 16:00 at site-1
      const res = await ShiftConflictService.validateAssignment({
        employeeId: "emp-1",
        siteId: "site-1",
        shiftId: "shift-morning",
        workDate: new Date("2026-09-18T00:00:00Z"),
        plannedStart: new Date("2026-09-18T07:00:00Z"),
        plannedEnd: new Date("2026-09-18T16:00:00Z"),
      });

      expect(res.isValid).toBe(false);
      expect(res.hasErrors).toBe(true);
      expect(res.conflicts.some((c) => c.type === "DOUBLE_ASSIGNMENT" || c.type === "SHIFT_OVERLAP")).toBe(true);
    });

    it("should detect INSUFFICIENT_REST when rest period between shifts is < 8 hours", async () => {
      (prisma.schedulePeriod.findFirst as any).mockResolvedValue(null);
      (prisma.leave.findFirst as any).mockResolvedValue(null);

      // Previous shift ended at 00:00 (Midnight)
      (prisma.shiftAssignment.findMany as any).mockResolvedValue([
        {
          id: "asmt-night",
          siteId: "site-1",
          shiftId: "shift-evening",
          plannedStart: new Date("2026-09-18T15:00:00Z"),
          plannedEnd: new Date("2026-09-19T00:00:00Z"),
          site: { name: "Site A", code: "A" },
          shift: { name: "Evening", code: "EVENING" },
          workDate: new Date("2026-09-18T00:00:00Z"),
        },
      ]);

      // Next shift starts at 05:00 (only 5 hours rest!)
      const res = await ShiftConflictService.validateAssignment({
        employeeId: "emp-1",
        siteId: "site-1",
        shiftId: "shift-early",
        workDate: new Date("2026-09-19T00:00:00Z"),
        plannedStart: new Date("2026-09-19T05:00:00Z"),
        plannedEnd: new Date("2026-09-19T14:00:00Z"),
        minimumRestHours: 8,
      });

      expect(res.isValid).toBe(false);
      expect(res.hasErrors).toBe(true);
      expect(res.conflicts.some((c) => c.type === "INSUFFICIENT_REST")).toBe(true);
    });

    it("should prevent assignment when SCHEDULE_LOCKED", async () => {
      (prisma.schedulePeriod.findFirst as any).mockResolvedValue({
        id: "period-1",
        status: "LOCKED",
        lockedBy: "HR Manager",
      });

      const res = await ShiftConflictService.validateAssignment({
        employeeId: "emp-1",
        siteId: "site-1",
        shiftId: "shift-1",
        workDate: new Date("2026-09-18T00:00:00Z"),
        plannedStart: new Date("2026-09-18T07:00:00Z"),
        plannedEnd: new Date("2026-09-18T16:00:00Z"),
      });

      expect(res.isValid).toBe(false);
      expect(res.conflicts.some((c) => c.type === "SCHEDULE_LOCKED")).toBe(true);
    });
  });

  describe("3. Attendance Reconciliation Service", () => {
    const mockEmployee = { id: "emp-1", code: "EMP01", firstName: "สมชาย", lastName: "สายชล" };
    const mockSite = { id: "site-1", name: "Site A" };
    const mockAssignment = {
      id: "asmt-1",
      plannedStart: new Date("2026-09-18T07:00:00Z"),
      plannedEnd: new Date("2026-09-18T16:00:00Z"),
      shift: {
        id: "shift-1",
        name: "กะเช้า",
        lateToleranceMinutes: 10,
        earlyCheckInMinutes: 30,
        allowedEarlyLeaveMinutes: 0,
        breakMinutes: 60,
      },
    };

    it("should identify ON_TIME when checked in within tolerance", () => {
      const attendances = [
        { id: "att-1", type: "CHECK_IN", timestamp: new Date("2026-09-18T07:05:00Z") },
        { id: "att-2", type: "CHECK_OUT", timestamp: new Date("2026-09-18T16:00:00Z") },
      ];

      const res = AttendanceReconciliationService.reconcileSingle(
        mockEmployee,
        mockSite,
        new Date("2026-09-18"),
        mockAssignment,
        attendances
      );

      expect(res.status).toBe("ON_TIME");
      expect(res.lateMinutes).toBe(0);
      expect(res.payableWorkingMinutes).toBe(480); // 9h - 1h break = 8h (480 min)
    });

    it("should identify LATE and calculate late minutes when beyond tolerance", () => {
      // Shift starts at 07:00, tolerance 10 min. Check-in at 07:25 (25 min late)
      const attendances = [
        { id: "att-1", type: "CHECK_IN", timestamp: new Date("2026-09-18T07:25:00Z") },
        { id: "att-2", type: "CHECK_OUT", timestamp: new Date("2026-09-18T16:00:00Z") },
      ];

      const res = AttendanceReconciliationService.reconcileSingle(
        mockEmployee,
        mockSite,
        new Date("2026-09-18"),
        mockAssignment,
        attendances
      );

      expect(res.status).toBe("LATE");
      expect(res.lateMinutes).toBe(25);
    });

    it("should cap early check-in so working hours start at scheduled time", () => {
      // Check in at 06:30 (30 min early)
      const attendances = [
        { id: "att-1", type: "CHECK_IN", timestamp: new Date("2026-09-18T06:30:00Z") },
        { id: "att-2", type: "CHECK_OUT", timestamp: new Date("2026-09-18T16:00:00Z") },
      ];

      const res = AttendanceReconciliationService.reconcileSingle(
        mockEmployee,
        mockSite,
        new Date("2026-09-18"),
        mockAssignment,
        attendances
      );

      expect(res.status).toBe("ON_TIME");
      // Payable start is capped at scheduledStart (07:00)
      expect(res.payableWorkStart).toBe(mockAssignment.plannedStart.toISOString());
      expect(res.payableWorkingMinutes).toBe(480);
    });

    it("should identify EARLY_LEAVE when checked out early", () => {
      // Checkout at 15:30 (30 min early leave)
      const attendances = [
        { id: "att-1", type: "CHECK_IN", timestamp: new Date("2026-09-18T07:00:00Z") },
        { id: "att-2", type: "CHECK_OUT", timestamp: new Date("2026-09-18T15:30:00Z") },
      ];

      const res = AttendanceReconciliationService.reconcileSingle(
        mockEmployee,
        mockSite,
        new Date("2026-09-18"),
        mockAssignment,
        attendances
      );

      expect(res.status).toBe("EARLY_LEAVE");
      expect(res.earlyLeaveMinutes).toBe(30);
    });

    it("should identify ABSENT when shift has ended with zero check-ins", () => {
      const currentTime = new Date("2026-09-18T18:00:00Z"); // past 16:00
      const res = AttendanceReconciliationService.reconcileSingle(
        mockEmployee,
        mockSite,
        new Date("2026-09-18"),
        mockAssignment,
        [],
        currentTime
      );

      expect(res.status).toBe("ABSENT");
    });

    it("should identify INCOMPLETE when checked in but past end time without checkout", () => {
      const currentTime = new Date("2026-09-18T17:00:00Z"); // past 16:00
      const attendances = [
        { id: "att-1", type: "CHECK_IN", timestamp: new Date("2026-09-18T07:00:00Z") },
      ];

      const res = AttendanceReconciliationService.reconcileSingle(
        mockEmployee,
        mockSite,
        new Date("2026-09-18"),
        mockAssignment,
        attendances,
        currentTime
      );

      expect(res.status).toBe("INCOMPLETE");
      expect(res.actualCheckOut).toBeNull();
    });
  });

  describe("4. Overtime Calculation & Forecast", () => {
    it("should calculate post-shift OT and restrict payable OT to approved OT", () => {
      const scheduledStart = new Date("2026-09-18T07:00:00Z");
      const scheduledEnd = new Date("2026-09-18T16:00:00Z");
      const actualCheckIn = new Date("2026-09-18T07:00:00Z");
      const actualCheckOut = new Date("2026-09-18T18:00:00Z"); // 2 hours OT

      // Without approval -> payable is 0
      const unapproved = OvertimeCalculationService.calculateShiftOvertime({
        scheduledStart,
        scheduledEnd,
        actualCheckIn,
        actualCheckOut,
        approvedOtHours: 0,
      });
      expect(unapproved.postShiftMinutes).toBe(120);
      expect(unapproved.payableOtMinutes).toBe(0);

      // With 1.5 hours approved -> payable is capped at 90 min
      const approved = OvertimeCalculationService.calculateShiftOvertime({
        scheduledStart,
        scheduledEnd,
        actualCheckIn,
        actualCheckOut,
        approvedOtHours: 1.5,
      });
      expect(approved.payableOtMinutes).toBe(90);
    });

    it("should identify DAY_OFF_OT when worked on day off", () => {
      const res = OvertimeCalculationService.calculateShiftOvertime({
        scheduledStart: null,
        scheduledEnd: null,
        actualCheckIn: new Date("2026-09-18T08:00:00Z"),
        actualCheckOut: new Date("2026-09-18T17:00:00Z"), // 9h - 1h break = 8h (480 min)
        isDayOff: true,
        approvedOtHours: 8,
      });

      expect(res.type).toBe("DAY_OFF_OT");
      expect(res.postShiftMinutes).toBe(480);
      expect(res.payableOtMinutes).toBe(480);
    });
  });
});
