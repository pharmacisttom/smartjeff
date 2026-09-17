import { prisma } from "@/lib/prisma";
import { ExecutiveOperationsService } from "@/server/services/executive-operations.service";

export type StaffingStatus = "CRITICAL_SHORTAGE" | "UNDERSTAFFED" | "OPTIMAL" | "OVERSTAFFED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type CandidateAvailability = "AVAILABLE" | "LIMITED" | "NOT_RECOMMENDED";

export interface PositionGap {
  position: string;
  required: number;
  working: number;
  gap: number; // working - required (negative means shortage)
  status: "SHORTAGE" | "OPTIMAL" | "SURPLUS";
}

export interface NearbySurplusSite {
  siteId: string;
  siteCode: string;
  siteName: string;
  distanceKm: number;
  surplus: number;
  working: number;
  target: number;
  lat: number;
  lng: number;
}

export interface WorkforceCandidate {
  employeeId: string;
  code: string;
  name: string;
  position: string;
  currentSiteId: string;
  currentSiteName: string;
  currentSiteCode: string;
  targetSiteId: string;
  distanceKm: number;
  hoursWorkedToday: number;
  hoursWorkedThisWeek: number;
  consecutiveDays: number;
  currentSiteSurplus: number;
  matchingSkills: string[];
  availability: CandidateAvailability;
  reasons: string[];
  fatigueWarnings: string[];
  isEligible: boolean;
}

export interface SiteStaffingSummary {
  id: string;
  code: string;
  name: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  radius: number;
  minimum: number;
  target: number;
  maximum: number | null;
  assigned: number;
  working: number;
  leave: number;
  absent: number;
  ot: number;
  finished: number;
  gap: number; // working - target
  deficit: number; // Math.max(0, target - working)
  surplus: number; // Math.max(0, working - target)
  status: StaffingStatus;
  riskLevel: RiskLevel;
  riskReasons: string[];
  supervisorPresent: boolean;
  requiresSupervisor: boolean;
  positionGaps: PositionGap[];
  nearbySurplusSites: NearbySurplusSite[];
}

export interface SimulationResult {
  sourceSite: {
    id: string;
    code: string;
    name: string;
    before: { working: number; target: number; gap: number; status: StaffingStatus };
    after: { working: number; target: number; gap: number; status: StaffingStatus };
    isSafe: boolean; // false if drops below minimum
  };
  targetSite: {
    id: string;
    code: string;
    name: string;
    before: { working: number; target: number; gap: number; status: StaffingStatus };
    after: { working: number; target: number; gap: number; status: StaffingStatus };
    improved: boolean;
  };
  reallocatedCount: number;
  employees: Array<{ id: string; name: string; position: string }>;
  summaryMessage: string;
}

export class WorkforcePlanningService {
  /**
   * 1. Haversine Formula: Calculate geodesic distance between two coordinates in kilometers
   */
  static calculateDistanceBetweenSites(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    if (lat1 === lat2 && lng1 === lng2) return 0;
    const toRad = (val: number) => (val * Math.PI) / 180;
    const R = 6371; // Earth radius in KM
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10;
  }

  /**
   * 2. Workforce Gap Engine
   * gap = working - target:
   * negative -> shortage (e.g. 14 - 20 = -6)
   * positive -> surplus (e.g. 19 - 15 = +4)
   */
  static calculateWorkforceGap(
    target: number,
    working: number,
    minimum: number
  ): {
    target: number;
    working: number;
    gap: number;
    deficit: number;
    surplus: number;
    status: StaffingStatus;
  } {
    const gap = working - target;
    const deficit = Math.max(0, target - working);
    const surplus = Math.max(0, working - target);

    let status: StaffingStatus = "OPTIMAL";
    if (working < minimum) {
      status = "CRITICAL_SHORTAGE";
    } else if (working < target) {
      status = "UNDERSTAFFED";
    } else if (working > target) {
      status = "OVERSTAFFED";
    }

    return { target, working, gap, deficit, surplus, status };
  }

  /**
   * 3. Position / Role Gap Engine
   */
  static calculatePositionGaps(
    requirements: Array<{ position: string | null; target: number; minimum?: number }>,
    employees: Array<{ position: string }>
  ): PositionGap[] {
    const workingByPos: Record<string, number> = {};
    for (const emp of employees) {
      const pos = emp.position || "พนักงานทั่วไป";
      workingByPos[pos] = (workingByPos[pos] || 0) + 1;
    }

    const posMap: Record<string, { required: number; working: number }> = {};

    // Register requirements
    for (const req of requirements) {
      if (!req.position) continue;
      posMap[req.position] = {
        required: req.target,
        working: workingByPos[req.position] || 0,
      };
    }

    // Include working positions not in requirements
    for (const [pos, count] of Object.entries(workingByPos)) {
      if (!posMap[pos]) {
        posMap[pos] = { required: 0, working: count };
      }
    }

    return Object.entries(posMap).map(([position, counts]) => {
      const gap = counts.working - counts.required;
      let status: "SHORTAGE" | "OPTIMAL" | "SURPLUS" = "OPTIMAL";
      if (gap < 0) status = "SHORTAGE";
      else if (gap > 0) status = "SURPLUS";

      return {
        position,
        required: counts.required,
        working: counts.working,
        gap,
        status,
      };
    });
  }

  /**
   * 4. Fatigue Guard Engine
   * Evaluates employee hours, overtime, and consecutive shifts
   */
  static evaluateFatigueGuard(
    attendancesToday: any[],
    attendancesThisWeek: any[]
  ): {
    hoursWorkedToday: number;
    hoursWorkedThisWeek: number;
    consecutiveDays: number;
    otHoursToday: number;
    availability: CandidateAvailability;
    reasons: string[];
  } {
    let hoursWorkedToday = 0;
    let otHoursToday = 0;

    // Calculate today's working hours
    const checkIns = attendancesToday.filter((a) => a.type === "CHECK_IN");
    const checkOuts = attendancesToday.filter((a) => a.type === "CHECK_OUT");
    const otIns = attendancesToday.filter((a) => a.type === "OT_IN");
    const otOuts = attendancesToday.filter((a) => a.type === "OT_OUT");

    if (checkIns.length > 0) {
      const inTime = new Date(checkIns[0].timestamp).getTime();
      const outTime =
        checkOuts.length > 0
          ? new Date(checkOuts[checkOuts.length - 1].timestamp).getTime()
          : Date.now();
      hoursWorkedToday = Math.max(0, (outTime - inTime) / (1000 * 60 * 60));
    }

    if (otIns.length > 0) {
      const inTime = new Date(otIns[0].timestamp).getTime();
      const outTime =
        otOuts.length > 0
          ? new Date(otOuts[otOuts.length - 1].timestamp).getTime()
          : Date.now();
      otHoursToday = Math.max(0, (outTime - inTime) / (1000 * 60 * 60));
    }

    // Calculate week hours and consecutive days
    const uniqueDays = new Set<string>();
    for (const att of attendancesThisWeek) {
      const dateStr = new Date(att.timestamp).toISOString().split("T")[0];
      uniqueDays.add(dateStr);
    }
    // Estimate 8h per working day recorded in past week
    const hoursWorkedThisWeek = uniqueDays.size * 8 + otHoursToday;
    const consecutiveDays = uniqueDays.size;

    hoursWorkedToday = Math.round(hoursWorkedToday * 10) / 10;
    otHoursToday = Math.round(otHoursToday * 10) / 10;

    const reasons: string[] = [];
    let availability: CandidateAvailability = "AVAILABLE";

    if (hoursWorkedToday >= 9.0 || otHoursToday >= 2.5) {
      availability = "NOT_RECOMMENDED";
      reasons.push(`ชั่วโมงทำงานวันนี้สูง (${hoursWorkedToday} ชม., OT ${otHoursToday} ชม.)`);
    } else if (consecutiveDays >= 6) {
      availability = "NOT_RECOMMENDED";
      reasons.push(`ทำงานติดต่อกัน ${consecutiveDays} วัน (อาจเกิดความเหนื่อยล้าสะสม)`);
    } else if (hoursWorkedToday >= 6.5 || hoursWorkedThisWeek >= 44) {
      availability = "LIMITED";
      reasons.push(`ชั่วโมงสะสมใกล้เกณฑ์จำกัด (วันนี้ ${hoursWorkedToday} ชม., สัปดาห์นี้ ${hoursWorkedThisWeek} ชม.)`);
    } else {
      reasons.push(`ความพร้อมปฏิบัติงานปกติ (วันนี้ทำไปแล้ว ${hoursWorkedToday} ชม.)`);
    }

    return {
      hoursWorkedToday,
      hoursWorkedThisWeek,
      consecutiveDays,
      otHoursToday,
      availability,
      reasons,
    };
  }

  /**
   * 5. Site Workforce Risk Evaluator
   */
  static calculateSiteRisk(
    site: { minimumWorkforce: number | null; requiresSupervisor: boolean },
    staffing: {
      working: number;
      target: number;
      minimum: number;
      otCount: number;
      supervisorPresent: boolean;
      positionGaps: PositionGap[];
    }
  ): { riskLevel: RiskLevel; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Critical shortage: below minimum
    if (staffing.working < staffing.minimum) {
      score += 5;
      const deficit = staffing.minimum - staffing.working;
      reasons.push(`ต่ำกว่าเกณฑ์ขั้นต่ำ (Minimum Workforce) ขาดอีก ${deficit} คน`);
    } else if (staffing.working < staffing.target) {
      score += 1;
      const deficit = staffing.target - staffing.working;
      reasons.push(`ต่ำกว่าเป้าหมายกำลังคน (Target) ขาดอีก ${deficit} คน`);
    }

    // Supervisor missing
    if (site.requiresSupervisor && !staffing.supervisorPresent) {
      score += 3;
      reasons.push("ไม่มี Supervisor ลงเวลาปฏิบัติงานตามข้อกำหนด");
    }

    // High OT risk
    if (staffing.working > 0 && staffing.otCount / staffing.working >= 0.3) {
      score += 2;
      const pct = Math.round((staffing.otCount / staffing.working) * 100);
      reasons.push(`สัดส่วนพนักงานทำ OT สูงถึง ${pct}% ของกำลังพล`);
    }

    // Position gap check (e.g. key technical role missing)
    const supervisorGap = staffing.positionGaps.find(
      (p) => p.position.toLowerCase().includes("supervisor") || p.position.toLowerCase().includes("หัวหน้า")
    );
    if (supervisorGap && supervisorGap.gap < 0 && !reasons.some((r) => r.includes("Supervisor"))) {
      score += 2;
      reasons.push(`ขาดตำแหน่งหัวหน้างาน (${supervisorGap.gap})`);
    }

    let riskLevel: RiskLevel = "LOW";
    if (score >= 5) {
      riskLevel = "CRITICAL";
    } else if (score >= 3) {
      riskLevel = "HIGH";
    } else if (score >= 1) {
      riskLevel = "MEDIUM";
    }

    if (reasons.length === 0) {
      reasons.push("กำลังคนเพียงพอตามเป้าหมายและไม่มีปัจจัยเสี่ยง");
    }

    return { riskLevel, reasons };
  }

  /**
   * 6. Overview: Aggregate all sites with gaps, risks, and surplus routes
   */
  static async getPlanningOverview(options: {
    dateStr?: string;
    mode?: "today" | "tomorrow" | "custom";
  }): Promise<{
    date: string;
    mode: "today" | "tomorrow" | "custom";
    isPlanningMode: boolean;
    summary: {
      totalSites: number;
      understaffedSites: number;
      criticalSites: number;
      optimalSites: number;
      overstaffedSites: number;
      totalWorkforceGap: number;
      availableSurplus: number;
      supervisorGaps: number;
      otRiskSites: number;
    };
    sites: SiteStaffingSummary[];
    activePlansCount: number;
  }> {
    const mode = options.mode || "today";
    const isPlanningMode = mode === "tomorrow" || mode === "custom";

    let targetDate: string;
    if (options.dateStr) {
      targetDate = options.dateStr;
    } else if (mode === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split("T")[0];
    } else {
      targetDate = new Date().toISOString().split("T")[0];
    }

    const { startOfDay, endOfDay } = ExecutiveOperationsService.getBangkokDayRange(targetDate);

    // Fetch all sites with requirements and assigned employees
    const sites = await prisma.site.findMany({
      include: {
        employees: {
          where: { isActive: true },
          select: { id: true, code: true, firstName: true, lastName: true, position: true },
        },
        workforceRequirements: {
          where: { isActive: true },
        },
      },
      orderBy: { code: "asc" },
    });

    // Fetch attendances for the date range
    const attendances = await prisma.attendance.findMany({
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { timestamp: "asc" },
    });

    // Fetch approved leaves
    const leaves = await prisma.leave.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
    });

    const leaveEmpIds = new Set(leaves.map((l) => l.employeeId));

    // Group attendances by employee
    const attsByEmp: Record<string, any[]> = {};
    for (const a of attendances) {
      if (!attsByEmp[a.employeeId]) attsByEmp[a.employeeId] = [];
      attsByEmp[a.employeeId].push(a);
    }

    // Process each site
    const processedSites: SiteStaffingSummary[] = [];

    for (const site of sites) {
      const minimum = site.minimumWorkforce ?? 1;
      const target = site.targetWorkforce ?? (site.employees.length > 0 ? site.employees.length : minimum);
      const maximum = site.maximumWorkforce ?? null;
      const assigned = site.employees.length;

      let workingCount = 0;
      let leaveCount = 0;
      let absentCount = 0;
      let otCount = 0;
      let finishedCount = 0;
      let supervisorPresent = false;
      const workingEmployees: Array<{ id: string; name: string; position: string }> = [];

      for (const emp of site.employees) {
        const hasLeave = leaveEmpIds.has(emp.id);
        const empName = `${emp.firstName} ${emp.lastName}`.trim();

        if (isPlanningMode) {
          // Future planning: assigned minus approved leaves
          if (hasLeave) {
            leaveCount++;
          } else {
            workingCount++;
            workingEmployees.push({ id: emp.id, name: empName, position: emp.position });
            if (
              emp.position.toLowerCase().includes("supervisor") ||
              emp.position.toLowerCase().includes("หัวหน้า")
            ) {
              supervisorPresent = true;
            }
          }
        } else {
          // Live today: actual attendance
          const empAtts = attsByEmp[emp.id] || [];
          const wfStatus = ExecutiveOperationsService.calculateWorkforceStatus(
            emp,
            empAtts,
            hasLeave,
            site
          );

          if (wfStatus.status === "WORKING") {
            workingCount++;
            workingEmployees.push({ id: emp.id, name: empName, position: emp.position });
            if (
              emp.position.toLowerCase().includes("supervisor") ||
              emp.position.toLowerCase().includes("หัวหน้า")
            ) {
              supervisorPresent = true;
            }
          } else if (wfStatus.status === "OT") {
            workingCount++;
            otCount++;
            workingEmployees.push({ id: emp.id, name: empName, position: emp.position });
          } else if (wfStatus.status === "FINISHED") {
            finishedCount++;
          } else if (wfStatus.status === "LEAVE") {
            leaveCount++;
          } else {
            absentCount++;
          }
        }
      }

      const gapCalc = WorkforcePlanningService.calculateWorkforceGap(target, workingCount, minimum);
      const positionGaps = WorkforcePlanningService.calculatePositionGaps(
        site.workforceRequirements,
        workingEmployees
      );

      const riskCalc = WorkforcePlanningService.calculateSiteRisk(
        { minimumWorkforce: minimum, requiresSupervisor: site.requiresSupervisor },
        {
          working: workingCount,
          target,
          minimum,
          otCount,
          supervisorPresent,
          positionGaps,
        }
      );

      processedSites.push({
        id: site.id,
        code: site.code,
        name: site.name,
        location: site.location,
        lat: site.lat,
        lng: site.lng,
        radius: site.radius,
        minimum,
        target,
        maximum,
        assigned,
        working: workingCount,
        leave: leaveCount,
        absent: absentCount,
        ot: otCount,
        finished: finishedCount,
        gap: gapCalc.gap,
        deficit: gapCalc.deficit,
        surplus: gapCalc.surplus,
        status: gapCalc.status,
        riskLevel: riskCalc.riskLevel,
        riskReasons: riskCalc.reasons,
        supervisorPresent,
        requiresSupervisor: site.requiresSupervisor,
        positionGaps,
        nearbySurplusSites: [],
      });
    }

    // Calculate nearby surplus sites for understaffed/critical sites
    for (const site of processedSites) {
      if (site.lat && site.lng) {
        const nearby: NearbySurplusSite[] = [];
        for (const other of processedSites) {
          if (other.id !== site.id && other.lat && other.lng && other.surplus > 0) {
            const dist = WorkforcePlanningService.calculateDistanceBetweenSites(
              site.lat,
              site.lng,
              other.lat,
              other.lng
            );
            if (dist <= 60) {
              nearby.push({
                siteId: other.id,
                siteCode: other.code,
                siteName: other.name,
                distanceKm: dist,
                surplus: other.surplus,
                working: other.working,
                target: other.target,
                lat: other.lat,
                lng: other.lng,
              });
            }
          }
        }
        nearby.sort((a, b) => a.distanceKm - b.distanceKm);
        site.nearbySurplusSites = nearby;
      }
    }

    // Summary calculations
    let understaffedCount = 0;
    let criticalCount = 0;
    let optimalCount = 0;
    let overstaffedCount = 0;
    let totalDeficit = 0;
    let totalSurplus = 0;
    let supervisorGaps = 0;
    let otRiskSites = 0;

    for (const s of processedSites) {
      if (s.status === "CRITICAL_SHORTAGE") criticalCount++;
      if (s.status === "UNDERSTAFFED") understaffedCount++;
      if (s.status === "OPTIMAL") optimalCount++;
      if (s.status === "OVERSTAFFED") overstaffedCount++;

      totalDeficit += s.deficit;
      totalSurplus += s.surplus;

      if (s.requiresSupervisor && !s.supervisorPresent) supervisorGaps++;
      if (s.working > 0 && s.ot / s.working >= 0.3) otRiskSites++;
    }

    const activePlansCount = await prisma.workforcePlan.count({
      where: {
        status: { in: ["DRAFT", "PENDING", "APPROVED"] },
      },
    });

    return {
      date: targetDate,
      mode,
      isPlanningMode,
      summary: {
        totalSites: processedSites.length,
        understaffedSites: understaffedCount + criticalCount,
        criticalSites: criticalCount,
        optimalSites: optimalCount,
        overstaffedSites: overstaffedCount,
        totalWorkforceGap: totalDeficit,
        availableSurplus: totalSurplus,
        supervisorGaps,
        otRiskSites,
      },
      sites: processedSites,
      activePlansCount,
    };
  }

  /**
   * 7. Workforce Candidate Engine
   * Find available candidates from nearby surplus sites with Fatigue Guard
   */
  static async findWorkforceCandidates(options: {
    targetSiteId: string;
    position?: string;
    dateStr?: string;
    maxDistanceKm?: number;
  }): Promise<{
    targetSite: { id: string; code: string; name: string; gap: number; deficit: number };
    candidates: WorkforceCandidate[];
  }> {
    const targetSite = await prisma.site.findUnique({
      where: { id: options.targetSiteId },
      include: {
        employees: { where: { isActive: true } },
      },
    });

    if (!targetSite) {
      throw new Error("ไม่พบไซต์งานเป้าหมาย");
    }

    const maxDistance = options.maxDistanceKm || 40;
    const targetDate = options.dateStr || new Date().toISOString().split("T")[0];
    const { startOfDay, endOfDay } = ExecutiveOperationsService.getBangkokDayRange(targetDate);
    const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);

    const overview = await this.getPlanningOverview({ dateStr: targetDate, mode: "today" });
    const targetSummary = overview.sites.find((s) => s.id === options.targetSiteId);
    const deficit = targetSummary ? targetSummary.deficit : 0;

    const candidateSites = overview.sites.filter(
      (s) => s.id !== options.targetSiteId && s.surplus > 0 && s.lat && s.lng
    );

    const candidates: WorkforceCandidate[] = [];

    for (const sourceSite of candidateSites) {
      let distanceKm = 0;
      if (targetSite.lat && targetSite.lng && sourceSite.lat && sourceSite.lng) {
        distanceKm = this.calculateDistanceBetweenSites(
          targetSite.lat,
          targetSite.lng,
          sourceSite.lat,
          sourceSite.lng
        );
      }

      if (distanceKm > maxDistance) continue;

      const employees = await prisma.employee.findMany({
        where: {
          siteId: sourceSite.id,
          isActive: true,
          ...(options.position ? { position: { contains: options.position } } : {}),
        },
        include: {
          skills: {
            include: { skill: true },
          },
        },
      });

      const empIds = employees.map((e) => e.id);
      const leaves = await prisma.leave.findMany({
        where: {
          employeeId: { in: empIds },
          status: "APPROVED",
          startDate: { lte: endOfDay },
          endDate: { gte: startOfDay },
        },
      });
      const leaveEmpIds = new Set(leaves.map((l) => l.employeeId));

      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: { in: empIds },
          timestamp: { gte: weekAgo, lte: endOfDay },
        },
        orderBy: { timestamp: "asc" },
      });

      const attsByEmp: Record<string, any[]> = {};
      for (const a of attendances) {
        if (!attsByEmp[a.employeeId]) attsByEmp[a.employeeId] = [];
        attsByEmp[a.employeeId].push(a);
      }

      for (const emp of employees) {
        if (leaveEmpIds.has(emp.id)) continue;

        const allAtts = attsByEmp[emp.id] || [];
        const todayAtts = allAtts.filter((a) => new Date(a.timestamp) >= startOfDay);

        const isDoingOT = todayAtts.some((a) => a.type === "OT_IN");
        if (isDoingOT) continue;

        const fatigue = this.evaluateFatigueGuard(todayAtts, allAtts);

        const reasons: string[] = [];
        if (options.position && emp.position.toLowerCase().includes(options.position.toLowerCase())) {
          reasons.push(`ตำแหน่งตรงกับความต้องการ (${emp.position})`);
        } else {
          reasons.push(`ตำแหน่ง ${emp.position}`);
        }

        reasons.push(`ไซต์ต้นทาง (${sourceSite.name}) มีกำลังคนเกินความต้องการ ${sourceSite.surplus} คน`);
        reasons.push(`ระยะทางระหว่างไซต์ ${distanceKm} กม. (อยู่ในเกณฑ์ ${maxDistance} กม.)`);
        reasons.push(...fatigue.reasons);

        const isEligible = fatigue.availability !== "NOT_RECOMMENDED";

        candidates.push({
          employeeId: emp.id,
          code: emp.code,
          name: `${emp.prefix || ""}${emp.firstName} ${emp.lastName}`.trim(),
          position: emp.position,
          currentSiteId: sourceSite.id,
          currentSiteName: sourceSite.name,
          currentSiteCode: sourceSite.code,
          targetSiteId: options.targetSiteId,
          distanceKm,
          hoursWorkedToday: fatigue.hoursWorkedToday,
          hoursWorkedThisWeek: fatigue.hoursWorkedThisWeek,
          consecutiveDays: fatigue.consecutiveDays,
          currentSiteSurplus: sourceSite.surplus,
          matchingSkills: emp.skills.map((s) => s.skill.name),
          availability: fatigue.availability,
          reasons,
          fatigueWarnings: fatigue.availability === "NOT_RECOMMENDED" ? fatigue.reasons : [],
          isEligible,
        });
      }
    }

    candidates.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return a.distanceKm - b.distanceKm;
    });

    return {
      targetSite: {
        id: targetSite.id,
        code: targetSite.code,
        name: targetSite.name,
        gap: targetSummary ? targetSummary.gap : 0,
        deficit,
      },
      candidates,
    };
  }

  /**
   * 8. What-if Simulation Engine
   */
  static async simulateWorkforceAllocation(options: {
    targetSiteId: string;
    sourceSiteId: string;
    employeeIds: string[];
    dateStr?: string;
  }): Promise<SimulationResult> {
    const { targetSiteId, sourceSiteId, employeeIds, dateStr } = options;

    const [sourceSite, targetSite, employees] = await Promise.all([
      prisma.site.findUnique({
        where: { id: sourceSiteId },
        include: { employees: { where: { isActive: true } } },
      }),
      prisma.site.findUnique({
        where: { id: targetSiteId },
        include: { employees: { where: { isActive: true } } },
      }),
      prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        select: { id: true, firstName: true, lastName: true, position: true },
      }),
    ]);

    if (!sourceSite || !targetSite) {
      throw new Error("ไม่พบข้อมูลไซต์ต้นทางหรือไซต์ปลายทาง");
    }

    const reallocatedCount = employeeIds.length;
    const overview = await this.getPlanningOverview({ dateStr, mode: "today" });

    const sourceSummary = overview.sites.find((s) => s.id === sourceSiteId);
    const targetSummary = overview.sites.find((s) => s.id === targetSiteId);

    const sourceBeforeWorking = sourceSummary ? sourceSummary.working : sourceSite.employees.length;
    const sourceTarget = sourceSummary ? sourceSummary.target : 1;
    const sourceMin = sourceSite.minimumWorkforce ?? 1;

    const targetBeforeWorking = targetSummary ? targetSummary.working : targetSite.employees.length;
    const targetTarget = targetSummary ? targetSummary.target : 1;
    const targetMin = targetSite.minimumWorkforce ?? 1;

    const sourceAfterWorking = Math.max(0, sourceBeforeWorking - reallocatedCount);
    const targetAfterWorking = targetBeforeWorking + reallocatedCount;

    const sourceBeforeGap = this.calculateWorkforceGap(sourceTarget, sourceBeforeWorking, sourceMin);
    const sourceAfterGap = this.calculateWorkforceGap(sourceTarget, sourceAfterWorking, sourceMin);

    const targetBeforeGap = this.calculateWorkforceGap(targetTarget, targetBeforeWorking, targetMin);
    const targetAfterGap = this.calculateWorkforceGap(targetTarget, targetAfterWorking, targetMin);

    const isSafe = sourceAfterWorking >= sourceMin;
    const improved = targetAfterGap.deficit < targetBeforeGap.deficit;

    let summaryMessage = `จำลองการโยกย้ายพนักงาน ${reallocatedCount} คนจาก ${sourceSite.name} ไปยัง ${targetSite.name}: `;
    if (improved && isSafe) {
      summaryMessage += `ช่วยลดการขาดคนของ ${targetSite.name} จาก ${targetBeforeGap.deficit} คน เหลือ ${targetAfterGap.deficit} คน โดยไซต์ต้นทางยังคงมีคนเพียงพอ`;
    } else if (!isSafe) {
      summaryMessage += `คำเตือน: ทำให้ ${sourceSite.name} มีกำลังพลต่ำกว่าเกณฑ์ขั้นต่ำ (เหลือ ${sourceAfterWorking}/${sourceMin} คน)`;
    } else {
      summaryMessage += `การจำลองเสร็จสิ้น`;
    }

    return {
      sourceSite: {
        id: sourceSite.id,
        code: sourceSite.code,
        name: sourceSite.name,
        before: {
          working: sourceBeforeWorking,
          target: sourceTarget,
          gap: sourceBeforeGap.gap,
          status: sourceBeforeGap.status,
        },
        after: {
          working: sourceAfterWorking,
          target: sourceTarget,
          gap: sourceAfterGap.gap,
          status: sourceAfterGap.status,
        },
        isSafe,
      },
      targetSite: {
        id: targetSite.id,
        code: targetSite.code,
        name: targetSite.name,
        before: {
          working: targetBeforeWorking,
          target: targetTarget,
          gap: targetBeforeGap.gap,
          status: targetBeforeGap.status,
        },
        after: {
          working: targetAfterWorking,
          target: targetTarget,
          gap: targetAfterGap.gap,
          status: targetAfterGap.status,
        },
        improved,
      },
      reallocatedCount,
      employees: employees.map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        position: e.position,
      })),
      summaryMessage,
    };
  }

  /**
   * 9. Create Draft Workforce Plan
   */
  static async createPlanDraft(data: {
    planDate: string;
    sourceSiteId: string;
    targetSiteId: string;
    reason: string;
    employeeIds: string[];
    createdBy?: string;
  }) {
    const dateObj = new Date(`${data.planDate}T00:00:00.000Z`);

    const employees = await prisma.employee.findMany({
      where: { id: { in: data.employeeIds } },
      select: { id: true, position: true },
    });

    return prisma.workforcePlan.create({
      data: {
        planDate: dateObj,
        sourceSiteId: data.sourceSiteId,
        targetSiteId: data.targetSiteId,
        reason: data.reason,
        status: "DRAFT",
        createdBy: data.createdBy || "Executive Planner",
        items: {
          create: employees.map((e) => ({
            employeeId: e.id,
            position: e.position,
            note: "จัดสรรตามระบบ DSS Phase 8",
          })),
        },
      },
      include: {
        sourceSite: true,
        targetSite: true,
        items: { include: { employee: true } },
      },
    });
  }

  /**
   * 10. List Workforce Plans
   */
  static async getPlans(options?: { status?: string; limit?: number }) {
    return prisma.workforcePlan.findMany({
      where: options?.status ? { status: options.status } : undefined,
      include: {
        sourceSite: { select: { id: true, code: true, name: true } },
        targetSite: { select: { id: true, code: true, name: true } },
        items: {
          include: {
            employee: { select: { id: true, code: true, firstName: true, lastName: true, position: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
    });
  }

  /**
   * 11. Approve or Update Plan Status
   */
  static async updatePlanStatus(
    planId: string,
    status: "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING",
    approvedBy?: string
  ) {
    return prisma.workforcePlan.update({
      where: { id: planId },
      data: {
        status,
        ...(status === "APPROVED" ? { approvedBy: approvedBy || "Executive", approvedAt: new Date() } : {}),
      },
      include: {
        sourceSite: true,
        targetSite: true,
        items: true,
      },
    });
  }
}
