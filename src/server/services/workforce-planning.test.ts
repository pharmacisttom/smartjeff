import { describe, it, expect } from "vitest";
import { WorkforcePlanningService } from "./workforce-planning.service";

describe("WorkforcePlanningService - Phase 8 Tests", () => {
  describe("1. Haversine Distance Engine", () => {
    it("should return 0 when coordinates are identical", () => {
      const distance = WorkforcePlanningService.calculateDistanceBetweenSites(
        12.6841,
        101.1476,
        12.6841,
        101.1476
      );
      expect(distance).toBe(0);
    });

    it("should calculate correct geodesic distance in km between sites", () => {
      // Map Ta Phut (12.682, 101.173) to Amata City Rayong (12.981, 101.102) ~ 34 km
      const distance = WorkforcePlanningService.calculateDistanceBetweenSites(
        12.682,
        101.173,
        12.981,
        101.102
      );
      expect(distance).toBeGreaterThan(30);
      expect(distance).toBeLessThan(40);
    });
  });

  describe("2. Workforce Gap Engine", () => {
    it("should return CRITICAL_SHORTAGE when working is below minimum workforce", () => {
      // target = 20, minimum = 12, working = 8 -> deficit 12
      const result = WorkforcePlanningService.calculateWorkforceGap(20, 8, 12);
      expect(result.status).toBe("CRITICAL_SHORTAGE");
      expect(result.gap).toBe(-12);
      expect(result.deficit).toBe(12);
      expect(result.surplus).toBe(0);
    });

    it("should return UNDERSTAFFED when working is between minimum and target", () => {
      // target = 20, minimum = 12, working = 14 -> deficit 6
      const result = WorkforcePlanningService.calculateWorkforceGap(20, 14, 12);
      expect(result.status).toBe("UNDERSTAFFED");
      expect(result.gap).toBe(-6);
      expect(result.deficit).toBe(6);
      expect(result.surplus).toBe(0);
    });

    it("should return OPTIMAL when working matches target", () => {
      const result = WorkforcePlanningService.calculateWorkforceGap(20, 20, 12);
      expect(result.status).toBe("OPTIMAL");
      expect(result.gap).toBe(0);
      expect(result.deficit).toBe(0);
      expect(result.surplus).toBe(0);
    });

    it("should return OVERSTAFFED with surplus when working exceeds target", () => {
      // target = 15, minimum = 10, working = 19 -> surplus 4
      const result = WorkforcePlanningService.calculateWorkforceGap(15, 19, 10);
      expect(result.status).toBe("OVERSTAFFED");
      expect(result.gap).toBe(4);
      expect(result.surplus).toBe(4);
      expect(result.deficit).toBe(0);
    });
  });

  describe("3. Position Gap Engine", () => {
    it("should calculate shortages and surpluses per position accurately", () => {
      const requirements = [
        { position: "Supervisor", target: 1, minimum: 1 },
        { position: "Operator", target: 12, minimum: 8 },
        { position: "Driver", target: 2, minimum: 1 },
      ];

      const workingEmployees = [
        // 0 Supervisors
        // 10 Operators (deficit 2)
        ...Array.from({ length: 10 }).map(() => ({ position: "Operator" })),
        // 3 Drivers (surplus 1)
        ...Array.from({ length: 3 }).map(() => ({ position: "Driver" })),
      ];

      const gaps = WorkforcePlanningService.calculatePositionGaps(requirements, workingEmployees);

      const supervisorGap = gaps.find((g) => g.position === "Supervisor");
      expect(supervisorGap?.required).toBe(1);
      expect(supervisorGap?.working).toBe(0);
      expect(supervisorGap?.gap).toBe(-1);
      expect(supervisorGap?.status).toBe("SHORTAGE");

      const operatorGap = gaps.find((g) => g.position === "Operator");
      expect(operatorGap?.required).toBe(12);
      expect(operatorGap?.working).toBe(10);
      expect(operatorGap?.gap).toBe(-2);
      expect(operatorGap?.status).toBe("SHORTAGE");

      const driverGap = gaps.find((g) => g.position === "Driver");
      expect(driverGap?.required).toBe(2);
      expect(driverGap?.working).toBe(3);
      expect(driverGap?.gap).toBe(1);
      expect(driverGap?.status).toBe("SURPLUS");
    });
  });

  describe("4. Fatigue Guard & Workload Engine", () => {
    it("should flag NOT_RECOMMENDED if employee has high working hours today (> 9h)", () => {
      const today = new Date();
      const checkIn = new Date(today.getTime() - 10 * 60 * 60 * 1000); // 10 hours ago
      const checkOut = today;

      const attendancesToday = [
        { type: "CHECK_IN", timestamp: checkIn },
        { type: "CHECK_OUT", timestamp: checkOut },
      ];

      const result = WorkforcePlanningService.evaluateFatigueGuard(attendancesToday, attendancesToday);
      expect(result.availability).toBe("NOT_RECOMMENDED");
      expect(result.hoursWorkedToday).toBeGreaterThanOrEqual(9.5);
      expect(result.reasons.some((r) => r.includes("ชั่วโมงทำงานวันนี้สูง"))).toBe(true);
    });

    it("should flag NOT_RECOMMENDED if consecutive working days >= 6", () => {
      const today = new Date();
      // Generate attendances spanning 6 distinct days
      const weekAttendances = Array.from({ length: 6 }).map((_, i) => ({
        type: "CHECK_IN",
        timestamp: new Date(today.getTime() - i * 24 * 60 * 60 * 1000),
      }));

      const result = WorkforcePlanningService.evaluateFatigueGuard([], weekAttendances);
      expect(result.availability).toBe("NOT_RECOMMENDED");
      expect(result.consecutiveDays).toBe(6);
      expect(result.reasons.some((r) => r.includes("ทำงานติดต่อกัน"))).toBe(true);
    });

    it("should flag LIMITED if hoursWorkedToday is between 6.5 and 9", () => {
      const today = new Date();
      const checkIn = new Date(today.getTime() - 7.5 * 60 * 60 * 1000); // 7.5 hours ago
      const checkOut = today;

      const attendancesToday = [
        { type: "CHECK_IN", timestamp: checkIn },
        { type: "CHECK_OUT", timestamp: checkOut },
      ];

      const result = WorkforcePlanningService.evaluateFatigueGuard(attendancesToday, attendancesToday);
      expect(result.availability).toBe("LIMITED");
      expect(result.reasons.some((r) => r.includes("ใกล้เกณฑ์จำกัด"))).toBe(true);
    });

    it("should flag AVAILABLE if working hours and workload are normal", () => {
      const today = new Date();
      const checkIn = new Date(today.getTime() - 4 * 60 * 60 * 1000); // 4 hours ago
      const checkOut = today;

      const attendancesToday = [
        { type: "CHECK_IN", timestamp: checkIn },
        { type: "CHECK_OUT", timestamp: checkOut },
      ];

      const result = WorkforcePlanningService.evaluateFatigueGuard(attendancesToday, attendancesToday);
      expect(result.availability).toBe("AVAILABLE");
      expect(result.reasons.some((r) => r.includes("ความพร้อมปฏิบัติงานปกติ"))).toBe(true);
    });
  });

  describe("5. Site Workforce Risk Evaluator", () => {
    it("should flag CRITICAL risk if working is below minimum workforce", () => {
      const site = { minimumWorkforce: 10, requiresSupervisor: true };
      const staffing = {
        working: 6, // < 10
        target: 15,
        minimum: 10,
        otCount: 1,
        supervisorPresent: true,
        positionGaps: [],
      };

      const result = WorkforcePlanningService.calculateSiteRisk(site, staffing);
      expect(result.riskLevel).toBe("CRITICAL");
      expect(result.reasons.some((r) => r.includes("Minimum Workforce"))).toBe(true);
    });

    it("should flag HIGH risk if supervisor is required but missing", () => {
      const site = { minimumWorkforce: 5, requiresSupervisor: true };
      const staffing = {
        working: 8,
        target: 10,
        minimum: 5,
        otCount: 0,
        supervisorPresent: false, // missing
        positionGaps: [{ position: "Supervisor", required: 1, working: 0, gap: -1, status: "SHORTAGE" }],
      };

      const result = WorkforcePlanningService.calculateSiteRisk(site, staffing);
      expect(result.riskLevel).toBe("HIGH");
      expect(result.reasons.some((r) => r.includes("Supervisor"))).toBe(true);
    });

    it("should flag LOW risk when site is well-staffed and safe", () => {
      const site = { minimumWorkforce: 5, requiresSupervisor: false };
      const staffing = {
        working: 10,
        target: 10,
        minimum: 5,
        otCount: 0,
        supervisorPresent: true,
        positionGaps: [],
      };

      const result = WorkforcePlanningService.calculateSiteRisk(site, staffing);
      expect(result.riskLevel).toBe("LOW");
      expect(result.reasons.some((r) => r.includes("กำลังคนเพียงพอ"))).toBe(true);
    });
  });
});
