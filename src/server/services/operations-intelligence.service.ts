import { prisma } from "@/lib/prisma";
import { ExecutiveOperationsService } from "@/server/services/executive-operations.service";
import { WorkforcePlanningService } from "@/server/services/workforce-planning.service";

export interface EvidenceMetricItem {
  metric: string;
  sourceModule: string;
  period: string;
  value: string | number | boolean | Record<string, any>;
  freshness: string;
  siteId?: string;
  siteName?: string;
}

export class OperationsIntelligenceService {
  /**
   * 1. Get Live Operations with Site Scope filtering
   */
  static async getLiveOperations(siteScope?: string[] | null) {
    const raw = await ExecutiveOperationsService.getLiveOperations();
    const isGlobal = !siteScope || siteScope.length === 0;

    const filteredSites = isGlobal
      ? raw.sites
      : raw.sites.filter((s) => siteScope.includes(s.id));

    const totalWorking = filteredSites.reduce((sum, s) => sum + s.working, 0);
    const totalLate = filteredSites.reduce((sum, s) => sum + s.late, 0);
    const totalLeave = filteredSites.reduce((sum, s) => sum + s.leave, 0);
    const totalAbsent = filteredSites.reduce((sum, s) => sum + s.absent, 0);
    const totalOT = filteredSites.reduce((sum, s) => sum + s.ot, 0);
    const alertSites = filteredSites.filter((s) => s.status === "ALERT" || s.flags.alert).length;
    const emptySites = filteredSites.filter((s) => s.status === "EMPTY" || s.working === 0).length;

    const filteredAlerts = isGlobal
      ? raw.alerts
      : raw.alerts.filter((a) => siteScope.includes(a.siteId));

    return {
      date: raw.date,
      dataFreshness: raw.updatedAt,
      summary: {
        totalSites: filteredSites.length,
        activeSites: filteredSites.filter((s) => s.working > 0).length,
        alertSites,
        emptySites,
        totalEmployeesWorking: totalWorking,
        lateEmployees: totalLate,
        leaveEmployees: totalLeave,
        absentEmployees: totalAbsent,
        otEmployees: totalOT,
      },
      sites: filteredSites.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        working: s.working,
        minimumWorkforce: s.minimumWorkforce,
        assigned: s.assignedEmployees,
        status: s.status,
        supervisorPresent: s.supervisorPresent,
        late: s.late,
        ot: s.ot,
      })),
      alerts: filteredAlerts.slice(0, 10),
    };
  }

  /**
   * 2. Get Site Status (aggregated or specific)
   */
  static async getSiteStatus(siteId?: string, siteScope?: string[] | null) {
    const live = await this.getLiveOperations(siteScope);
    if (siteId) {
      const target = live.sites.find((s) => s.id === siteId || s.code === siteId);
      if (!target) {
        throw new Error(`ไม่พบข้อมูล Site ID: ${siteId} หรือไม่อยู่ในขอบเขตสิทธิ์ของคุณ`);
      }
      return {
        dataFreshness: live.dataFreshness,
        site: target,
      };
    }
    return live;
  }

  /**
   * 3. Get Site Detail with Roster (sanitized, no PII)
   */
  static async getSiteDetail(siteId: string, dateInput?: string) {
    const detail = await ExecutiveOperationsService.getSiteLiveDetail(siteId, { dateStr: dateInput });
    const live = await ExecutiveOperationsService.getLiveOperations({ dateStr: dateInput });
    const siteSummary = live.sites.find((s) => s.id === siteId || s.code === siteId);

    return {
      site: {
        id: detail.site.id,
        code: detail.site.code,
        name: detail.site.name,
        status: siteSummary?.status || "ACTIVE",
        working: detail.metrics.working,
        minimumWorkforce: detail.site.minimumWorkforce,
        assignedEmployees: detail.metrics.assigned,
        late: detail.metrics.late,
        leave: detail.metrics.leave,
        absent: detail.metrics.absent,
        ot: detail.metrics.ot,
        supervisorPresent: siteSummary?.supervisorPresent ?? true,
      },
      alerts: live.alerts.filter((a) => a.siteId === siteId),
      rosterSummary: {
        totalRoster: detail.employees.length,
        workingCount: detail.employees.filter((r) => r.status === "WORKING").length,
        lateCount: detail.employees.filter((r) => r.isLate).length,
      },
      dataFreshness: new Date().toISOString(),
    };
  }

  /**
   * 4. Get Workforce Forecast & Deficit
   */
  static async getWorkforceForecast(dateInput?: string, siteId?: string, siteScope?: string[] | null) {
    const plan = await WorkforcePlanningService.getPlanningOverview({ dateStr: dateInput });
    const isGlobal = !siteScope || siteScope.length === 0;

    let sites = plan.sites;
    if (!isGlobal) {
      sites = sites.filter((s) => siteScope.includes(s.id));
    }
    if (siteId) {
      sites = sites.filter((s) => s.id === siteId || s.code === siteId);
    }

    const deficitSites = sites.filter((s) => s.deficit > 0);
    const surplusSites = sites.filter((s) => s.surplus > 0);

    return {
      date: plan.date,
      dataFreshness: new Date().toISOString(),
      totalSites: sites.length,
      sitesWithDeficit: deficitSites.length,
      sitesWithSurplus: surplusSites.length,
      criticalSites: sites.filter((s) => s.riskLevel === "CRITICAL" || s.riskLevel === "HIGH"),
      sites: sites.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        target: s.target,
        working: s.working,
        deficit: s.deficit,
        surplus: s.surplus,
        status: s.status,
        riskLevel: s.riskLevel,
        riskReasons: s.riskReasons,
        supervisorPresent: s.supervisorPresent,
      })),
    };
  }

  /**
   * 5. Get Attendance Summary
   */
  static async getAttendanceSummary(dateInput?: string, siteId?: string, siteScope?: string[] | null) {
    const { startOfDay, endOfDay, dateStr } = ExecutiveOperationsService.getBangkokDayRange(dateInput);

    const siteWhere: any = {};
    if (siteId) {
      siteWhere.id = siteId;
    } else if (siteScope && siteScope.length > 0) {
      siteWhere.id = { in: siteScope };
    }

    const sites = await prisma.site.findMany({
      where: siteWhere,
      select: { id: true, name: true, code: true },
    });

    const siteIds = sites.map((s) => s.id);

    const attendances = await prisma.attendance.findMany({
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay },
        employee: { siteId: { in: siteIds } },
      },
      select: {
        id: true,
        type: true,
        timestamp: true,
        distance: true,
        isWithinGeofence: true,
        employee: {
          select: { id: true, siteId: true },
        },
      },
    });

    const checkIns = attendances.filter((a) => a.type === "CHECK_IN");
    const checkOuts = attendances.filter((a) => a.type === "CHECK_OUT");
    const geofenceViolations = attendances.filter((a) => !a.isWithinGeofence);

    return {
      date: dateStr,
      dataFreshness: new Date().toISOString(),
      totalAttendances: attendances.length,
      checkInsCount: checkIns.length,
      checkOutsCount: checkOuts.length,
      geofenceViolationsCount: geofenceViolations.length,
      sitesCoverage: sites.length,
    };
  }

  /**
   * 6. Get Attendance Exceptions
   */
  static async getAttendanceExceptions(dateInput?: string, siteId?: string, siteScope?: string[] | null) {
    const { startOfDay, endOfDay, dateStr } = ExecutiveOperationsService.getBangkokDayRange(dateInput);

    const siteWhere: any = {};
    if (siteId) siteWhere.id = siteId;
    else if (siteScope && siteScope.length > 0) siteWhere.id = { in: siteScope };

    const attendances = await prisma.attendance.findMany({
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay },
        isWithinGeofence: false,
        employee: { site: siteWhere },
      },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            position: true,
            site: { select: { id: true, name: true, code: true } },
          },
        },
      },
      take: 50,
      orderBy: { timestamp: "desc" },
    });

    return {
      date: dateStr,
      dataFreshness: new Date().toISOString(),
      totalExceptions: attendances.length,
      exceptions: attendances.map((a) => ({
        id: a.id,
        type: a.type,
        timestamp: a.timestamp.toISOString(),
        siteName: a.employee.site.name,
        siteCode: a.employee.site.code,
        distanceMeters: Math.round(a.distance),
        issue: "ลงเวลานอก Geofence",
        position: a.employee.position,
      })),
    };
  }

  /**
   * 7. Get Overtime (OT) Summary
   */
  static async getOTSummary(periodInput?: string, siteId?: string, siteScope?: string[] | null) {
    const period = periodInput || new Date().toISOString().slice(0, 7); // e.g. "2026-09"
    const siteWhere: any = {};
    if (siteId) siteWhere.id = siteId;
    else if (siteScope && siteScope.length > 0) siteWhere.id = { in: siteScope };

    const payslips = await prisma.payslip.findMany({
      where: {
        period,
        employee: { site: siteWhere },
      },
      select: {
        otHours: true,
        otAmount: true,
        employee: {
          select: {
            siteId: true,
            site: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const totalOtHours = payslips.reduce((sum, p) => sum + (p.otHours || 0), 0);
    const totalOtAmount = payslips.reduce((sum, p) => sum + (p.otAmount || 0), 0);

    // Group by site
    const bySite: Record<string, { siteName: string; siteCode: string; otHours: number; otAmount: number }> = {};
    for (const p of payslips) {
      const sId = p.employee.siteId;
      if (!bySite[sId]) {
        bySite[sId] = {
          siteName: p.employee.site.name,
          siteCode: p.employee.site.code,
          otHours: 0,
          otAmount: 0,
        };
      }
      bySite[sId].otHours += p.otHours || 0;
      bySite[sId].otAmount += p.otAmount || 0;
    }

    const siteBreakdown = Object.entries(bySite)
      .map(([siteId, data]) => ({
        siteId,
        ...data,
      }))
      .sort((a, b) => b.otHours - a.otHours);

    return {
      period,
      dataFreshness: new Date().toISOString(),
      totalOtHours: Math.round(totalOtHours * 10) / 10,
      totalOtAmount: Math.round(totalOtAmount),
      topOtSites: siteBreakdown.slice(0, 5),
    };
  }

  /**
   * 8. Get Labor Cost Summary (aggregate only, no personal salary leakage)
   */
  static async getLaborCostSummary(periodInput?: string, siteId?: string, siteScope?: string[] | null) {
    const period = periodInput || new Date().toISOString().slice(0, 7);
    const siteWhere: any = {};
    if (siteId) siteWhere.id = siteId;
    else if (siteScope && siteScope.length > 0) siteWhere.id = { in: siteScope };

    const payslips = await prisma.payslip.findMany({
      where: {
        period,
        employee: { site: siteWhere },
      },
      select: {
        netPay: true,
        otAmount: true,
        baseSalary: true,
        employee: {
          select: {
            siteId: true,
            site: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const totalCost = payslips.reduce((sum, p) => sum + (p.netPay || 0), 0);
    const baseCost = payslips.reduce((sum, p) => sum + (p.baseSalary || 0), 0);
    const otCost = payslips.reduce((sum, p) => sum + (p.otAmount || 0), 0);

    return {
      period,
      dataFreshness: new Date().toISOString(),
      totalHeadcount: payslips.length,
      totalLaborCost: Math.round(totalCost),
      baseSalaryTotal: Math.round(baseCost),
      otTotal: Math.round(otCost),
      otPercentage: totalCost > 0 ? Math.round((otCost / totalCost) * 1000) / 10 : 0,
    };
  }

  /**
   * 9. Get Site Risk Analysis
   */
  static async getSiteRisk(siteId?: string, siteScope?: string[] | null) {
    const plan = await WorkforcePlanningService.getPlanningOverview({});
    let sites = plan.sites;
    if (siteId) {
      sites = sites.filter((s) => s.id === siteId || s.code === siteId);
    } else if (siteScope && siteScope.length > 0) {
      sites = sites.filter((s) => siteScope.includes(s.id));
    }

    const highRiskSites = sites.filter((s) => s.riskLevel === "CRITICAL" || s.riskLevel === "HIGH");

    return {
      date: plan.date,
      dataFreshness: new Date().toISOString(),
      totalSitesEvaluated: sites.length,
      highRiskSitesCount: highRiskSites.length,
      sites: sites.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        riskLevel: s.riskLevel,
        riskReasons: s.riskReasons,
        target: s.target,
        working: s.working,
        deficit: s.deficit,
        supervisorPresent: s.supervisorPresent,
      })),
    };
  }

  /**
   * 10. Get Operations Alerts (from DB or live computation)
   */
  static async getOperationsAlerts(
    severity?: string,
    status?: string,
    siteId?: string,
    siteScope?: string[] | null
  ) {
    const where: any = {};
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (siteId) where.siteId = siteId;
    else if (siteScope && siteScope.length > 0) where.siteId = { in: siteScope };

    // Query persisted operational alerts
    const dbAlerts = await prisma.operationalAlert.findMany({
      where,
      include: { site: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (dbAlerts.length > 0) {
      return {
        dataFreshness: new Date().toISOString(),
        totalAlerts: dbAlerts.length,
        alerts: dbAlerts.map((a) => ({
          id: a.id,
          siteId: a.siteId,
          siteName: a.site?.name || "Global",
          siteCode: a.site?.code || "-",
          type: a.alertType,
          severity: a.severity,
          title: a.title,
          message: a.message,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
        })),
      };
    }

    // Fallback to live alerts from ExecutiveOperationsService
    const live = await ExecutiveOperationsService.getLiveOperations();
    const liveAlerts = (live.alerts || []).filter((a) => {
      if (siteId && a.siteId !== siteId) return false;
      if (siteScope && siteScope.length > 0 && !siteScope.includes(a.siteId)) return false;
      if (severity && a.severity !== severity) return false;
      return true;
    });

    return {
      dataFreshness: live.updatedAt,
      totalAlerts: liveAlerts.length,
      alerts: liveAlerts.map((a) => ({
        id: a.id,
        siteId: a.siteId,
        siteName: a.siteName,
        siteCode: a.siteCode,
        type: a.type,
        severity: a.severity,
        title: a.message,
        message: a.message,
        status: "ACTIVE",
        createdAt: a.timestamp,
      })),
    };
  }

  /**
   * 11. Executive Daily Brief
   */
  static async getExecutiveDailyBrief(dateInput?: string) {
    const live = await ExecutiveOperationsService.getLiveOperations({ dateStr: dateInput });
    const plan = await WorkforcePlanningService.getPlanningOverview({ dateStr: dateInput });

    const deficitSites = plan.sites.filter((s) => s.deficit > 0);
    const criticalSites = plan.sites.filter((s) => s.riskLevel === "CRITICAL" || s.riskLevel === "HIGH");

    return {
      date: live.date,
      dataFreshness: live.updatedAt,
      totalSites: live.summary.totalSites,
      activeSites: live.summary.activeSites,
      emptySites: live.summary.emptySites,
      alertSitesCount: live.summary.alertSites,
      totalWorkingEmployees: live.summary.working,
      totalDeficitAcrossSites: deficitSites.reduce((sum, s) => sum + s.deficit, 0),
      criticalSites: criticalSites.map((s) => ({
        id: s.id,
        name: s.name,
        deficit: s.deficit,
        reasons: s.riskReasons,
      })),
      keyAlertsCount: (live.alerts || []).length,
    };
  }

  /**
   * 12. Compare Two Sites
   */
  static async compareSites(siteIdA: string, siteIdB: string, period?: string) {
    const live = await ExecutiveOperationsService.getLiveOperations();
    const siteA = live.sites.find((s) => s.id === siteIdA || s.code === siteIdA);
    const siteB = live.sites.find((s) => s.id === siteIdB || s.code === siteIdB);

    if (!siteA || !siteB) {
      throw new Error(`ไม่พบข้อมูลหนึ่งใน Site ที่ต้องการเปรียบเทียบ (${siteIdA}, ${siteIdB})`);
    }

    return {
      dataFreshness: live.updatedAt,
      period: period || live.date,
      siteA: {
        id: siteA.id,
        code: siteA.code,
        name: siteA.name,
        working: siteA.working,
        minimumWorkforce: siteA.minimumWorkforce,
        assigned: siteA.assignedEmployees,
        status: siteA.status,
        supervisorPresent: siteA.supervisorPresent,
        late: siteA.late,
        ot: siteA.ot,
      },
      siteB: {
        id: siteB.id,
        code: siteB.code,
        name: siteB.name,
        working: siteB.working,
        minimumWorkforce: siteB.minimumWorkforce,
        assigned: siteB.assignedEmployees,
        status: siteB.status,
        supervisorPresent: siteB.supervisorPresent,
        late: siteB.late,
        ot: siteB.ot,
      },
      differences: {
        workingDiff: siteA.working - siteB.working,
        otDiff: siteA.ot - siteB.ot,
        lateDiff: siteA.late - siteB.late,
      },
    };
  }
}
