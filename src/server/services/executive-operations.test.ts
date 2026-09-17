import { describe, it, expect } from "vitest";
import { ExecutiveOperationsService } from "./executive-operations.service";

describe("ExecutiveOperationsService - Phase 7 Tests", () => {
  describe("Workforce Status Engine", () => {
    const mockEmployee = { id: "emp-1", position: "แม่บ้าน" };
    const mockSite = { workStart: 7 }; // 07:00 AM

    it("should return LEAVE if employee has approved leave covering today", () => {
      const result = ExecutiveOperationsService.calculateWorkforceStatus(
        mockEmployee,
        [],
        true, // hasApprovedLeaveToday
        mockSite
      );
      expect(result.status).toBe("LEAVE");
      expect(result.isLate).toBe(false);
    });

    it("should return NOT_CHECKED_IN if no attendances and no leave", () => {
      const result = ExecutiveOperationsService.calculateWorkforceStatus(
        mockEmployee,
        [],
        false,
        mockSite
      );
      expect(result.status).toBe("NOT_CHECKED_IN");
      expect(result.isLate).toBe(false);
    });

    it("should return WORKING if latest attendance is CHECK_IN", () => {
      // 07:10 AM Bangkok time = 00:10 UTC
      const checkInTime = new Date("2026-09-17T00:10:00.000Z");
      const attendances = [
        {
          id: "att-1",
          type: "CHECK_IN",
          timestamp: checkInTime,
          lat: 12.684,
          lng: 101.147,
          distance: 20,
          accuracy: 10,
          isWithinGeofence: true,
        },
      ];

      const result = ExecutiveOperationsService.calculateWorkforceStatus(
        mockEmployee,
        attendances,
        false,
        mockSite
      );
      expect(result.status).toBe("WORKING");
      expect(result.firstCheckIn).toEqual(checkInTime);
      expect(result.isLate).toBe(false);
    });

    it("should flag isLate: true if check-in is after workStart + tolerance", () => {
      // 07:45 AM Bangkok time = 00:45 UTC (> 07:15 tolerance)
      const lateCheckInTime = new Date("2026-09-17T00:45:00.000Z");
      const attendances = [
        {
          id: "att-1",
          type: "CHECK_IN",
          timestamp: lateCheckInTime,
          lat: 12.684,
          lng: 101.147,
          distance: 20,
          accuracy: 10,
          isWithinGeofence: true,
        },
      ];

      const result = ExecutiveOperationsService.calculateWorkforceStatus(
        mockEmployee,
        attendances,
        false,
        mockSite
      );
      expect(result.status).toBe("WORKING");
      expect(result.isLate).toBe(true);
    });

    it("should return FINISHED if latest attendance is CHECK_OUT", () => {
      const attendances = [
        {
          id: "att-1",
          type: "CHECK_IN",
          timestamp: new Date("2026-09-17T00:10:00.000Z"),
          lat: 12.684,
          lng: 101.147,
          distance: 20,
          isWithinGeofence: true,
        },
        {
          id: "att-2",
          type: "CHECK_OUT",
          timestamp: new Date("2026-09-17T09:05:00.000Z"),
          lat: 12.684,
          lng: 101.147,
          distance: 20,
          isWithinGeofence: true,
        },
      ];

      const result = ExecutiveOperationsService.calculateWorkforceStatus(
        mockEmployee,
        attendances,
        false,
        mockSite
      );
      expect(result.status).toBe("FINISHED");
    });

    it("should return OT if latest attendance is OT_IN", () => {
      const attendances = [
        {
          id: "att-1",
          type: "CHECK_IN",
          timestamp: new Date("2026-09-17T00:10:00.000Z"),
          lat: 12.684,
          lng: 101.147,
          distance: 20,
          isWithinGeofence: true,
        },
        {
          id: "att-2",
          type: "CHECK_OUT",
          timestamp: new Date("2026-09-17T09:00:00.000Z"),
          lat: 12.684,
          lng: 101.147,
          distance: 20,
          isWithinGeofence: true,
        },
        {
          id: "att-3",
          type: "OT_IN",
          timestamp: new Date("2026-09-17T09:15:00.000Z"),
          lat: 12.684,
          lng: 101.147,
          distance: 20,
          isWithinGeofence: true,
        },
      ];

      const result = ExecutiveOperationsService.calculateWorkforceStatus(
        mockEmployee,
        attendances,
        false,
        mockSite
      );
      expect(result.status).toBe("OT");
    });
  });

  describe("Site Status Engine", () => {
    it("should return ACTIVE when working >= minWorkforce", () => {
      const status = ExecutiveOperationsService.calculateSiteStatus(
        10, // working
        12, // assigned
        5,  // minWorkforce
        0,  // ot
        false // hasCriticalAlert
      );
      expect(status).toBe("ACTIVE");
    });

    it("should return EMPTY when working === 0 and assigned > 0", () => {
      const status = ExecutiveOperationsService.calculateSiteStatus(
        0,
        12,
        5,
        0,
        false
      );
      expect(status).toBe("EMPTY");
    });

    it("should return LOW_STAFF when working < minWorkforce and working > 0", () => {
      const status = ExecutiveOperationsService.calculateSiteStatus(
        3,  // working < 5
        12,
        5,
        0,
        false
      );
      expect(status).toBe("LOW_STAFF");
    });

    it("should return OT_ACTIVE when ot > 0 and no critical alert", () => {
      const status = ExecutiveOperationsService.calculateSiteStatus(
        10,
        12,
        5,
        3, // ot > 0
        false
      );
      expect(status).toBe("OT_ACTIVE");
    });

    it("should return ALERT when hasCriticalAlert is true", () => {
      const status = ExecutiveOperationsService.calculateSiteStatus(
        10,
        12,
        5,
        3,
        true // critical alert present
      );
      expect(status).toBe("ALERT");
    });
  });

  describe("Workforce Utilization", () => {
    it("should calculate correct percentage", () => {
      expect(ExecutiveOperationsService.calculateUtilization(24, 32)).toBe(75);
      expect(ExecutiveOperationsService.calculateUtilization(10, 10)).toBe(100);
      expect(ExecutiveOperationsService.calculateUtilization(0, 10)).toBe(0);
    });

    it("should prevent division by zero", () => {
      expect(ExecutiveOperationsService.calculateUtilization(0, 0)).toBe(0);
      expect(ExecutiveOperationsService.calculateUtilization(5, 0)).toBe(0);
      expect(ExecutiveOperationsService.calculateUtilization(0, -5)).toBe(0);
    });
  });

  describe("Supervisor Detection", () => {
    it("should accurately identify supervisor positions", () => {
      expect(ExecutiveOperationsService.isSupervisorPosition("หัวหน้างาน")).toBe(true);
      expect(ExecutiveOperationsService.isSupervisorPosition("หัวหน้าแม่บ้าน")).toBe(true);
      expect(ExecutiveOperationsService.isSupervisorPosition("Site Supervisor")).toBe(true);
      expect(ExecutiveOperationsService.isSupervisorPosition("General Manager")).toBe(true);
      expect(ExecutiveOperationsService.isSupervisorPosition("แม่บ้าน")).toBe(false);
      expect(ExecutiveOperationsService.isSupervisorPosition("คนสวน")).toBe(false);
      expect(ExecutiveOperationsService.isSupervisorPosition("พ่อบ้าน")).toBe(false);
      expect(ExecutiveOperationsService.isSupervisorPosition(null)).toBe(false);
    });
  });

  describe("API Authorization & RBAC Checks", () => {
    it("should deny EMPLOYEE / USER role from accessing operations.live.read", async () => {
      const { hasPermission } = await import("@/lib/rbac/check");
      expect(hasPermission({ roleCode: "EMPLOYEE" }, "operations.live.read")).toBe(false);
      expect(hasPermission({ roleCode: "USER" }, "operations.live.read")).toBe(false);
    });

    it("should allow ADMIN, EXECUTIVE, SUPERADMIN, and HR to access operations.live.read", async () => {
      const { hasPermission } = await import("@/lib/rbac/check");
      expect(hasPermission({ roleCode: "ADMIN" }, "operations.live.read")).toBe(true);
      expect(hasPermission({ roleCode: "EXECUTIVE" }, "operations.live.read")).toBe(true);
      expect(hasPermission({ roleCode: "SUPERADMIN" }, "operations.live.read")).toBe(true);
      expect(hasPermission({ roleCode: "HR" }, "operations.live.read")).toBe(true);
      expect(hasPermission({ roleCode: "SITE_MANAGER" }, "operations.live.read")).toBe(true);
    });
  });
});
