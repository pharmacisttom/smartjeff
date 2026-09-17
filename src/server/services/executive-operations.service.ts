import { prisma } from "@/lib/prisma";

export type WorkforceStatus = "WORKING" | "OT" | "FINISHED" | "NOT_CHECKED_IN" | "LEAVE";
export type SiteStatusType = "ACTIVE" | "LOW_STAFF" | "EMPTY" | "OT_ACTIVE" | "ALERT";
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface OperationAlert {
  id: string;
  type: "SITE_EMPTY" | "LOW_STAFF" | "NO_SUPERVISOR" | "OUTSIDE_GEOFENCE" | "HIGH_GPS_INACCURACY" | "LATE_START" | "HIGH_OT";
  severity: AlertSeverity;
  siteId: string;
  siteName: string;
  siteCode: string;
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface SiteSummaryData {
  id: string;
  code: string;
  name: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  radius: number;
  workStart: number;
  workEnd: number;
  otStart: number | null;
  otEnd: number | null;
  minimumWorkforce: number;
  requiresSupervisor: boolean;
  assignedEmployees: number;
  working: number;
  late: number;
  leave: number;
  absent: number;
  ot: number;
  finished: number;
  utilization: number;
  status: SiteStatusType;
  flags: {
    active: boolean;
    lowStaff: boolean;
    otActive: boolean;
    alert: boolean;
  };
  lastCheckIn: string | null;
  hasCoordinates: boolean;
  supervisorPresent: boolean;
}

export interface LiveOperationsResponse {
  success: true;
  updatedAt: string;
  date: string;
  summary: {
    totalSites: number;
    activeSites: number;
    emptySites: number;
    alertSites: number;
    totalEmployees: number;
    working: number;
    late: number;
    leave: number;
    absent: number;
    ot: number;
  };
  sites: SiteSummaryData[];
  alerts: OperationAlert[];
  unmappedSitesCount: number;
}

export interface SanitizedEmployeeRoster {
  employeeId: string;
  code: string;
  name: string;
  position: string;
  status: WorkforceStatus;
  isLate: boolean;
  checkIn: string | null;
  checkOut: string | null;
  distance: number | null;
  accuracy: number | null;
  withinGeofence: boolean | null;
}

export class ExecutiveOperationsService {
  /**
   * Helper to parse Bangkok Day Range (00:00:00.000 to 23:59:59.999 in UTC)
   */
  static getBangkokDayRange(dateInput?: string | Date): {
    startOfDay: Date;
    endOfDay: Date;
    dateStr: string;
    currentBangkokHour: number;
  } {
    let dateStr: string;
    if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      dateStr = dateInput;
    } else {
      const d = dateInput instanceof Date ? dateInput : new Date();
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      dateStr = formatter.format(d);
    }

    // Convert dateStr (YYYY-MM-DD in Asia/Bangkok +07:00) into UTC Date bounds
    const startOfDay = new Date(`${dateStr}T00:00:00.000+07:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);

    // Get current Bangkok local hour (float, e.g. 16.5 = 16:30)
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });
    const parts = timeFormatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const currentBangkokHour = hour + minute / 60;

    return { startOfDay, endOfDay, dateStr, currentBangkokHour };
  }

  /**
   * Convert Date object to decimal Bangkok hour (e.g., 08:30 => 8.5)
   */
  static getBangkokHourDecimal(date: Date): number {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    return h + m / 60;
  }

  /**
   * Format Date to Asia/Bangkok ISO string
   */
  static toBangkokISO(date: Date = new Date()): string {
    const tzOffset = "+07:00";
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = new Date(date.getTime() + 7 * 3600 * 1000);
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const min = pad(d.getUTCMinutes());
    const s = pad(d.getUTCSeconds());
    return `${y}-${m}-${day}T${h}:${min}:${s}${tzOffset}`;
  }

  /**
   * Calculate single employee status based on day's attendances and approved leaves
   */
  static calculateWorkforceStatus(
    employee: { id: string; position?: string },
    attendancesToday: Array<{
      id: string;
      type: string;
      timestamp: Date;
      lat: number;
      lng: number;
      distance: number;
      accuracy?: number | null;
      isWithinGeofence: boolean;
    }>,
    hasApprovedLeaveToday: boolean,
    site?: { workStart?: number }
  ): {
    status: WorkforceStatus;
    isLate: boolean;
    firstCheckIn: Date | null;
    lastCheckIn: Date | null;
    checkOutTime: Date | null;
    latestAttendance: any | null;
  } {
    if (hasApprovedLeaveToday) {
      return {
        status: "LEAVE",
        isLate: false,
        firstCheckIn: null,
        lastCheckIn: null,
        checkOutTime: null,
        latestAttendance: null,
      };
    }

    if (!attendancesToday || attendancesToday.length === 0) {
      return {
        status: "NOT_CHECKED_IN",
        isLate: false,
        firstCheckIn: null,
        lastCheckIn: null,
        checkOutTime: null,
        latestAttendance: null,
      };
    }

    // Sort chronologically ascending
    const sorted = [...attendancesToday].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstCheckInRecord = sorted.find((a) => a.type === "CHECK_IN");
    const firstCheckIn = firstCheckInRecord ? new Date(firstCheckInRecord.timestamp) : null;

    let isLate = false;
    if (firstCheckIn && site?.workStart !== undefined) {
      const checkInHour = this.getBangkokHourDecimal(firstCheckIn);
      const tolerance = 0.25; // 15 minutes tolerance
      if (checkInHour > site.workStart + tolerance) {
        isLate = true;
      }
    }

    const latestAttendance = sorted[sorted.length - 1];
    const latestType = latestAttendance.type;

    let checkOutTime: Date | null = null;
    const checkOutRecord = [...sorted].reverse().find((a) => a.type === "CHECK_OUT" || a.type === "OT_OUT");
    if (checkOutRecord) {
      checkOutTime = new Date(checkOutRecord.timestamp);
    }

    let status: WorkforceStatus = "WORKING";
    if (latestType === "OT_IN") {
      status = "OT";
    } else if (latestType === "CHECK_OUT" || latestType === "OT_OUT") {
      status = "FINISHED";
    } else if (latestType === "CHECK_IN") {
      status = "WORKING";
    }

    return {
      status,
      isLate,
      firstCheckIn,
      lastCheckIn: latestAttendance ? new Date(latestAttendance.timestamp) : null,
      checkOutTime,
      latestAttendance,
    };
  }

  /**
   * Utilization calculation with division by zero prevention
   */
  static calculateUtilization(workingCount: number, assignedCount: number): number {
    if (!assignedCount || assignedCount <= 0) return 0;
    const pct = Math.round((workingCount / assignedCount) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  /**
   * Calculate site status type based on metrics
   */
  static calculateSiteStatus(
    workingCount: number,
    assignedCount: number,
    minWorkforce: number,
    otCount: number,
    hasCriticalAlert: boolean
  ): SiteStatusType {
    if (hasCriticalAlert) return "ALERT";
    if (otCount > 0) return "OT_ACTIVE";
    if (workingCount === 0 && assignedCount > 0) return "EMPTY";
    if (workingCount < minWorkforce && assignedCount > 0) return "LOW_STAFF";
    return "ACTIVE";
  }

  /**
   * Check if position represents a supervisor
   */
  static isSupervisorPosition(position?: string | null): boolean {
    if (!position) return false;
    const lower = position.toLowerCase();
    return (
      lower.includes("หัวหน้า") ||
      lower.includes("supervisor") ||
      lower.includes("ผู้จัดการ") ||
      lower.includes("lead") ||
      lower.includes("manager")
    );
  }

  /**
   * Main Aggregate Query: Get Live Operations Data
   */
  static async getLiveOperations(options?: { dateStr?: string }): Promise<LiveOperationsResponse> {
    const { startOfDay, endOfDay, dateStr, currentBangkokHour } = this.getBangkokDayRange(options?.dateStr);

    // 1. Fetch all sites with active employees in a single query
    const sites = await prisma.site.findMany({
      include: {
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            position: true,
            siteId: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    // 2. Fetch all attendances for the target day in a single query
    const attendances = await prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    // Group attendances by employeeId
    const attendancesByEmpId = new Map<string, typeof attendances>();
    for (const att of attendances) {
      const list = attendancesByEmpId.get(att.employeeId) || [];
      list.push(att);
      attendancesByEmpId.set(att.employeeId, list);
    }

    // 3. Fetch all approved leaves overlapping the target day
    const leaves = await prisma.leave.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
      select: { employeeId: true },
    });
    const approvedLeaveEmpIds = new Set(leaves.map((l) => l.employeeId));

    // 4. Process Sites and Employees
    let totalEmployeesCount = 0;
    let totalWorkingCount = 0;
    let totalLateCount = 0;
    let totalLeaveCount = 0;
    let totalAbsentCount = 0;
    let totalOtCount = 0;
    let activeSitesCount = 0;
    let emptySitesCount = 0;
    let alertSitesCount = 0;
    let unmappedSitesCount = 0;

    const alerts: OperationAlert[] = [];
    const processedSites: SiteSummaryData[] = [];

    for (const site of sites) {
      const minWorkforce = site.minimumWorkforce ?? 1;
      const assignedCount = site.employees.length;
      totalEmployeesCount += assignedCount;

      let siteWorking = 0;
      let siteLate = 0;
      let siteLeave = 0;
      let siteAbsent = 0;
      let siteOt = 0;
      let siteFinished = 0;
      let latestCheckInDate: Date | null = null;
      let supervisorPresent = false;
      const siteAttendances: typeof attendances = [];

      for (const emp of site.employees) {
        const empAtts = attendancesByEmpId.get(emp.id) || [];
        siteAttendances.push(...empAtts);
        const hasLeave = approvedLeaveEmpIds.has(emp.id);

        const statusResult = this.calculateWorkforceStatus(emp, empAtts, hasLeave, site);

        if (statusResult.status === "WORKING") {
          siteWorking++;
          totalWorkingCount++;
        } else if (statusResult.status === "OT") {
          siteOt++;
          totalOtCount++;
          siteWorking++;
          totalWorkingCount++;
        } else if (statusResult.status === "LEAVE") {
          siteLeave++;
          totalLeaveCount++;
        } else if (statusResult.status === "FINISHED") {
          siteFinished++;
        } else if (statusResult.status === "NOT_CHECKED_IN") {
          siteAbsent++;
          totalAbsentCount++;
        }

        if (statusResult.isLate) {
          siteLate++;
          totalLateCount++;
        }

        if (statusResult.lastCheckIn) {
          if (!latestCheckInDate || statusResult.lastCheckIn > latestCheckInDate) {
            latestCheckInDate = statusResult.lastCheckIn;
          }
        }

        if (this.isSupervisorPosition(emp.position)) {
          if (statusResult.status === "WORKING" || statusResult.status === "OT") {
            supervisorPresent = true;
          }
        }
      }

      // Check Site Alerts
      const siteAlertList: OperationAlert[] = [];

      // Alert 1: SITE_EMPTY
      if (assignedCount > 0 && siteWorking === 0) {
        const isPastStart = currentBangkokHour > (site.workStart + 0.5);
        siteAlertList.push({
          id: `alert-empty-${site.id}`,
          type: "SITE_EMPTY",
          severity: isPastStart ? "CRITICAL" : "WARNING",
          siteId: site.id,
          siteName: site.name,
          siteCode: site.code,
          message: `ไซต์ ${site.name} ไม่มีพนักงานเข้างาน (จากจำนวนประจำ ${assignedCount} คน)`,
          timestamp: this.toBangkokISO(),
        });
      }

      // Alert 2: LOW_STAFF
      if (siteWorking > 0 && siteWorking < minWorkforce) {
        siteAlertList.push({
          id: `alert-lowstaff-${site.id}`,
          type: "LOW_STAFF",
          severity: "WARNING",
          siteId: site.id,
          siteName: site.name,
          siteCode: site.code,
          message: `ไซต์ ${site.name} มีพนักงานทำงานเพียง ${siteWorking} คน (เกณฑ์ขั้นต่ำ ${minWorkforce} คน)`,
          timestamp: this.toBangkokISO(),
        });
      }

      // Alert 3: NO_SUPERVISOR
      if (site.requiresSupervisor && assignedCount > 0 && siteWorking > 0 && !supervisorPresent) {
        siteAlertList.push({
          id: `alert-nosuper-${site.id}`,
          type: "NO_SUPERVISOR",
          severity: "WARNING",
          siteId: site.id,
          siteName: site.name,
          siteCode: site.code,
          message: `ไซต์ ${site.name} ไม่มีหัวหน้างาน/Supervisor ลงเวลาทำงาน`,
          timestamp: this.toBangkokISO(),
        });
      }

      // Alert 4: OUTSIDE_GEOFENCE
      const outsideGeofenceLogs = siteAttendances.filter((a) => a.isWithinGeofence === false);
      if (outsideGeofenceLogs.length > 0) {
        siteAlertList.push({
          id: `alert-geofence-${site.id}`,
          type: "OUTSIDE_GEOFENCE",
          severity: outsideGeofenceLogs.length >= 3 ? "CRITICAL" : "WARNING",
          siteId: site.id,
          siteName: site.name,
          siteCode: site.code,
          message: `ไซต์ ${site.name} พบการลงเวลานอกรัศมี Geofence ${outsideGeofenceLogs.length} รายการ`,
          timestamp: this.toBangkokISO(),
          details: { count: outsideGeofenceLogs.length },
        });
      }

      // Alert 5: HIGH_GPS_INACCURACY
      const inaccurateLogs = siteAttendances.filter((a) => (a.accuracy || 0) > 100);
      if (inaccurateLogs.length > 0) {
        siteAlertList.push({
          id: `alert-accuracy-${site.id}`,
          type: "HIGH_GPS_INACCURACY",
          severity: "INFO",
          siteId: site.id,
          siteName: site.name,
          siteCode: site.code,
          message: `ไซต์ ${site.name} พบความคลาดเคลื่อน GPS สูง (>100m) จำนวน ${inaccurateLogs.length} รายการ`,
          timestamp: this.toBangkokISO(),
        });
      }

      // Alert 6: HIGH_OT
      if (siteOt > 0 && assignedCount > 0 && siteOt >= Math.max(2, assignedCount * 0.5)) {
        siteAlertList.push({
          id: `alert-ot-${site.id}`,
          type: "HIGH_OT",
          severity: "INFO",
          siteId: site.id,
          siteName: site.name,
          siteCode: site.code,
          message: `ไซต์ ${site.name} มีพนักงานทำ OT สูงเป็นพิเศษ (${siteOt} คน จาก ${assignedCount} คน)`,
          timestamp: this.toBangkokISO(),
        });
      }

      alerts.push(...siteAlertList);

      const hasCriticalAlert = siteAlertList.some((a) => a.severity === "CRITICAL" || a.severity === "WARNING");
      const hasAnyAlert = siteAlertList.length > 0;
      if (hasAnyAlert) alertSitesCount++;

      if (siteWorking > 0) {
        activeSitesCount++;
      } else if (assignedCount > 0) {
        emptySitesCount++;
      }

      const hasCoordinates = typeof site.lat === "number" && typeof site.lng === "number";
      if (!hasCoordinates) unmappedSitesCount++;

      const utilization = this.calculateUtilization(siteWorking, assignedCount);
      const status = this.calculateSiteStatus(siteWorking, assignedCount, minWorkforce, siteOt, hasCriticalAlert);

      processedSites.push({
        id: site.id,
        code: site.code,
        name: site.name,
        location: site.location,
        lat: site.lat,
        lng: site.lng,
        radius: site.radius,
        workStart: site.workStart,
        workEnd: site.workEnd,
        otStart: site.otStart,
        otEnd: site.otEnd,
        minimumWorkforce: minWorkforce,
        requiresSupervisor: site.requiresSupervisor,
        assignedEmployees: assignedCount,
        working: siteWorking,
        late: siteLate,
        leave: siteLeave,
        absent: siteAbsent,
        ot: siteOt,
        finished: siteFinished,
        utilization,
        status,
        flags: {
          active: siteWorking > 0,
          lowStaff: siteWorking > 0 && siteWorking < minWorkforce,
          otActive: siteOt > 0,
          alert: hasAnyAlert,
        },
        lastCheckIn: latestCheckInDate ? this.toBangkokISO(latestCheckInDate) : null,
        hasCoordinates,
        supervisorPresent,
      });
    }

    return {
      success: true,
      updatedAt: this.toBangkokISO(),
      date: dateStr,
      summary: {
        totalSites: sites.length,
        activeSites: activeSitesCount,
        emptySites: emptySitesCount,
        alertSites: alertSitesCount,
        totalEmployees: totalEmployeesCount,
        working: totalWorkingCount,
        late: totalLateCount,
        leave: totalLeaveCount,
        absent: totalAbsentCount,
        ot: totalOtCount,
      },
      sites: processedSites,
      alerts,
      unmappedSitesCount,
    };
  }

  /**
   * Detailed Site View: Roster and Recent Activities for Drawer
   */
  static async getSiteLiveDetail(siteId: string, options?: { dateStr?: string }) {
    const { startOfDay, endOfDay } = this.getBangkokDayRange(options?.dateStr);

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            position: true,
          },
          orderBy: { code: "asc" },
        },
      },
    });

    if (!site) {
      throw new Error("ไม่พบข้อมูลไซต์งาน");
    }

    // Fetch attendances for this site's employees today
    const employeeIds = site.employees.map((e) => e.id);
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: { in: employeeIds },
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, code: true },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    const attendancesByEmpId = new Map<string, typeof attendances>();
    for (const att of attendances) {
      const list = attendancesByEmpId.get(att.employeeId) || [];
      list.push(att);
      attendancesByEmpId.set(att.employeeId, list);
    }

    // Fetch leaves
    const leaves = await prisma.leave.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: "APPROVED",
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
      select: { employeeId: true },
    });
    const approvedLeaveEmpIds = new Set(leaves.map((l) => l.employeeId));

    // Build sanitized employee roster
    const roster: SanitizedEmployeeRoster[] = [];
    let working = 0;
    let late = 0;
    let leave = 0;
    let absent = 0;
    let ot = 0;
    let finished = 0;

    for (const emp of site.employees) {
      const empAtts = attendancesByEmpId.get(emp.id) || [];
      const hasLeave = approvedLeaveEmpIds.has(emp.id);

      const res = this.calculateWorkforceStatus(emp, empAtts, hasLeave, site);

      if (res.status === "WORKING") working++;
      else if (res.status === "OT") {
        ot++;
        working++;
      } else if (res.status === "LEAVE") leave++;
      else if (res.status === "FINISHED") finished++;
      else if (res.status === "NOT_CHECKED_IN") absent++;

      if (res.isLate) late++;

      const latest = res.latestAttendance;

      roster.push({
        employeeId: emp.id,
        code: emp.code,
        name: `${emp.firstName} ${emp.lastName}`,
        position: emp.position,
        status: res.status,
        isLate: res.isLate,
        checkIn: res.firstCheckIn ? this.toBangkokISO(res.firstCheckIn) : null,
        checkOut: res.checkOutTime ? this.toBangkokISO(res.checkOutTime) : null,
        distance: latest ? Math.round(latest.distance) : null,
        accuracy: latest ? Math.round(latest.accuracy || 0) : null,
        withinGeofence: latest ? latest.isWithinGeofence : null,
      });
    }

    // Recent activity list
    const recentActivities = attendances.slice(0, 15).map((att) => ({
      id: att.id,
      time: this.toBangkokISO(new Date(att.timestamp)),
      type: att.type,
      employeeName: `${att.employee.firstName} ${att.employee.lastName}`,
      employeeCode: att.employee.code,
      withinGeofence: att.isWithinGeofence,
      distance: Math.round(att.distance),
      accuracy: Math.round(att.accuracy || 0),
    }));

    const assignedCount = site.employees.length;
    const utilization = this.calculateUtilization(working, assignedCount);

    return {
      site: {
        id: site.id,
        code: site.code,
        name: site.name,
        location: site.location,
        lat: site.lat,
        lng: site.lng,
        radius: site.radius,
        workStart: site.workStart,
        workEnd: site.workEnd,
        otStart: site.otStart,
        otEnd: site.otEnd,
        minimumWorkforce: site.minimumWorkforce ?? 1,
        requiresSupervisor: site.requiresSupervisor,
      },
      metrics: {
        assigned: assignedCount,
        working,
        late,
        leave,
        absent,
        ot,
        finished,
        utilization,
      },
      employees: roster,
      recentActivities,
    };
  }
}
