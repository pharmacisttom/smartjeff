import { prisma } from "@/lib/prisma";
import { ShiftService } from "./shift.service";
import { ShiftConflictService, ShiftConflictItem } from "./shift-conflict.service";

export interface ScheduleFilterParams {
  startDate: Date;
  endDate: Date;
  siteId?: string;
  employeeId?: string;
  shiftId?: string;
  viewMode?: "day" | "week" | "month" | "site" | "employee";
}

export interface ShiftCoverageItem {
  siteId: string;
  siteName: string;
  siteCode: string;
  shiftId: string;
  shiftName: string;
  shiftCode: string;
  shiftColor: string;
  workDate: string; // YYYY-MM-DD
  required: number;
  scheduled: number;
  gap: number;
  status: "UNDERSTAFFED" | "BALANCED" | "OVERSTAFFED" | "CRITICAL";
  supervisorCoverage: "COVERED" | "MISSING";
  hasSupervisor: boolean;
  assignedEmployees: Array<{
    id: string;
    assignmentId: string;
    employeeId: string;
    name: string;
    code: string;
    position: string;
    isSupervisor: boolean;
    status: string;
    plannedStart: string;
    plannedEnd: string;
  }>;
}

export interface SchedulingOverviewResponse {
  success: true;
  filter: {
    startDate: string;
    endDate: string;
    siteId?: string;
    viewMode: string;
  };
  summary: {
    totalScheduled: number;
    workingToday: number;
    understaffedShifts: number;
    lateToday: number;
    absentToday: number;
    projectedOtHours: number;
    conflictCount: number;
    periodStatus: "DRAFT" | "MANAGER_REVIEW" | "HR_REVIEW" | "APPROVED" | "PUBLISHED" | "LOCKED";
    version: number;
  };
  shifts: Array<{
    id: string;
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    color: string;
    isOvernight: boolean;
  }>;
  sites: Array<{
    id: string;
    code: string;
    name: string;
    lat: number | null;
    lng: number | null;
    targetWorkforce: number;
    minimumWorkforce: number;
    requiresSupervisor: boolean;
  }>;
  coverages: ShiftCoverageItem[];
  unassignedEmployees: Array<{
    id: string;
    code: string;
    name: string;
    position: string;
    siteId: string;
    skills: string[];
    isAvailable: boolean;
    reason?: string;
  }>;
  alerts: ShiftConflictItem[];
}

export class SchedulingService {
  /**
   * Fetch complete schedule matrix, coverages, and summary
   */
  static async getSchedule(params: ScheduleFilterParams): Promise<SchedulingOverviewResponse> {
    await ShiftService.ensureDefaultShifts();

    const start = new Date(params.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(params.endDate);
    end.setUTCHours(23, 59, 59, 999);

    // 1. Fetch Master Data
    const [allShifts, allSites, assignments, periodLock, allEmployees] = await Promise.all([
      prisma.shift.findMany({ where: { isActive: true }, orderBy: { startTime: "asc" } }),
      prisma.site.findMany({
        where: params.siteId ? { id: params.siteId } : {},
        orderBy: { code: "asc" },
      }),
      prisma.shiftAssignment.findMany({
        where: {
          workDate: { gte: start, lte: end },
          ...(params.siteId ? { siteId: params.siteId } : {}),
          ...(params.employeeId ? { employeeId: params.employeeId } : {}),
          ...(params.shiftId ? { shiftId: params.shiftId } : {}),
          status: { notIn: ["CANCELLED"] },
        },
        include: {
          employee: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              position: true,
            },
          },
          shift: true,
          site: true,
        },
        orderBy: [{ workDate: "asc" }, { plannedStart: "asc" }],
      }),
      prisma.schedulePeriod.findFirst({
        where: {
          startDate: { lte: end },
          endDate: { gte: start },
          ...(params.siteId ? { siteId: params.siteId } : {}),
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.employee.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          firstName: true,
          lastName: true,
          position: true,
          siteId: true,
          skills: {
            include: { skill: true },
          },
        },
      }),
    ]);

    // 2. Fetch workforce requirements for sites
    const requirements = await prisma.siteWorkforceRequirement.findMany({
      where: {
        siteId: { in: allSites.map((s) => s.id) },
        isActive: true,
      },
    });

    // 3. Build coverages per Site x Shift x Date
    const coverages: ShiftCoverageItem[] = [];
    const dateCursor = new Date(start);

    let understaffedCount = 0;
    const supervisorRoles = ["SUPERVISOR", "หัวหน้างาน", "MANAGER", "FOREMAN", "CHIEF"];

    while (dateCursor <= end) {
      const dateStr = dateCursor.toISOString().split("T")[0];

      for (const site of allSites) {
        // Find requirement for site
        const siteReq = requirements.find((r) => r.siteId === site.id);
        const reqTarget = siteReq?.target ?? site.targetWorkforce ?? 2;
        const reqMinimum = siteReq?.minimum ?? site.minimumWorkforce ?? 1;

        for (const shift of allShifts) {
          // Find matching assignments
          const matched = assignments.filter((a) => {
            const aDateStr = a.workDate.toISOString().split("T")[0];
            return a.siteId === site.id && a.shiftId === shift.id && aDateStr === dateStr;
          });

          const scheduled = matched.length;
          // Split requirement roughly across standard operational shifts
          const shiftRequired = shift.code === "MORNING" || shift.code === "OFFICE"
            ? Math.ceil(reqTarget * 0.6)
            : Math.max(1, Math.floor(reqTarget * 0.4));

          const gap = scheduled - shiftRequired;

          const hasSupervisor = matched.some((m) =>
            supervisorRoles.some((r) => m.employee.position.toUpperCase().includes(r))
          );

          let status: "UNDERSTAFFED" | "BALANCED" | "OVERSTAFFED" | "CRITICAL" = "BALANCED";
          if (scheduled < reqMinimum || (site.requiresSupervisor && !hasSupervisor && scheduled > 0)) {
            status = "CRITICAL";
          } else if (gap < 0) {
            status = "UNDERSTAFFED";
          } else if (gap > 0) {
            status = "OVERSTAFFED";
          }

          if (gap < 0) understaffedCount++;

          coverages.push({
            siteId: site.id,
            siteName: site.name,
            siteCode: site.code,
            shiftId: shift.id,
            shiftName: shift.name,
            shiftCode: shift.code,
            shiftColor: shift.color || "#3B82F6",
            workDate: dateStr,
            required: shiftRequired,
            scheduled,
            gap,
            status,
            supervisorCoverage: hasSupervisor ? "COVERED" : "MISSING",
            hasSupervisor,
            assignedEmployees: matched.map((m) => ({
              id: m.employee.id,
              assignmentId: m.id,
              employeeId: m.employee.id,
              name: `${m.employee.firstName} ${m.employee.lastName}`,
              code: m.employee.code,
              position: m.employee.position,
              isSupervisor: supervisorRoles.some((r) => m.employee.position.toUpperCase().includes(r)),
              status: m.status,
              plannedStart: m.plannedStart.toISOString(),
              plannedEnd: m.plannedEnd.toISOString(),
            })),
          });
        }
      }

      dateCursor.setUTCDate(dateCursor.getUTCDate() + 1);
    }

    // 4. Find unassigned employees for the current start date
    const assignedIdsToday = new Set(
      assignments
        .filter((a) => a.workDate.toISOString().split("T")[0] === start.toISOString().split("T")[0])
        .map((a) => a.employeeId)
    );

    const unassignedEmployees = allEmployees
      .filter((e) => !assignedIdsToday.has(e.id))
      .map((e) => ({
        id: e.id,
        code: e.code,
        name: `${e.firstName} ${e.lastName}`,
        position: e.position,
        siteId: e.siteId,
        skills: e.skills.map((s) => s.skill.name),
        isAvailable: true,
      }));

    // 5. Calculate Summary KPIs
    const todayStr = new Date().toISOString().split("T")[0];
    const workingToday = assignments.filter(
      (a) => a.workDate.toISOString().split("T")[0] === todayStr && a.status === "IN_PROGRESS"
    ).length;

    const projectedOtHours = assignments.reduce((acc, a) => {
      const hrs = (a.plannedEnd.getTime() - a.plannedStart.getTime()) / 3600000;
      return hrs > 8 ? acc + (hrs - 8) : acc;
    }, 0);

    return {
      success: true,
      filter: {
        startDate: params.startDate.toISOString().split("T")[0],
        endDate: params.endDate.toISOString().split("T")[0],
        siteId: params.siteId,
        viewMode: params.viewMode || "week",
      },
      summary: {
        totalScheduled: assignments.length,
        workingToday: workingToday || assignments.filter((a) => a.workDate.toISOString().split("T")[0] === todayStr).length,
        understaffedShifts: understaffedCount,
        lateToday: 0,
        absentToday: assignments.filter((a) => a.status === "ABSENT").length,
        projectedOtHours: Math.round(projectedOtHours * 10) / 10,
        conflictCount: 0,
        periodStatus: (periodLock?.status as any) || "DRAFT",
        version: periodLock?.version ?? 1,
      },
      shifts: allShifts.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        color: s.color || "#3B82F6",
        isOvernight: s.isOvernight,
      })),
      sites: allSites.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        targetWorkforce: s.targetWorkforce ?? 1,
        minimumWorkforce: s.minimumWorkforce ?? 1,
        requiresSupervisor: s.requiresSupervisor ?? false,
      })),
      coverages,
      unassignedEmployees,
      alerts: [],
    };
  }

  /**
   * Create a new shift assignment with conflict validation & audit log
   */
  static async createAssignment(
    input: {
      employeeId: string;
      siteId: string;
      shiftId: string;
      workDate: Date;
      role?: string;
      notes?: string;
    },
    assignedBy: string = "ADMIN"
  ) {
    const shift = await prisma.shift.findUnique({ where: { id: input.shiftId } });
    if (!shift) throw new Error(`Shift not found: ${input.shiftId}`);

    const { plannedStart, plannedEnd } = ShiftService.getShiftDateTimeRange(
      input.workDate,
      shift.startTime,
      shift.endTime,
      shift.isOvernight
    );

    // Validate conflicts
    const validation = await ShiftConflictService.validateAssignment({
      employeeId: input.employeeId,
      siteId: input.siteId,
      shiftId: input.shiftId,
      workDate: input.workDate,
      plannedStart,
      plannedEnd,
    });

    if (validation.hasErrors) {
      const errMessages = validation.conflicts
        .filter((c) => c.severity === "ERROR")
        .map((c) => c.message)
        .join("; ");
      const error: any = new Error(`Conflict detected: ${errMessages}`);
      error.conflicts = validation.conflicts;
      throw error;
    }

    const assignment = await prisma.shiftAssignment.create({
      data: {
        employeeId: input.employeeId,
        siteId: input.siteId,
        shiftId: input.shiftId,
        workDate: input.workDate,
        plannedStart,
        plannedEnd,
        role: input.role,
        status: "PLANNED",
        assignedBy,
        notes: input.notes,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, code: true } },
        shift: true,
        site: true,
      },
    });

    // Write audit log
    await prisma.shiftAuditLog.create({
      data: {
        assignmentId: assignment.id,
        action: "CREATE",
        newValue: JSON.stringify({
          employeeId: input.employeeId,
          siteId: input.siteId,
          shiftId: input.shiftId,
          workDate: input.workDate,
        }),
        performedBy: assignedBy,
        reason: "Created shift assignment",
      },
    });

    return { assignment, warnings: validation.conflicts.filter((c) => c.severity === "WARNING") };
  }

  /**
   * Update or Move a shift assignment with conflict check and audit log
   */
  static async updateAssignment(
    id: string,
    input: {
      siteId?: string;
      shiftId?: string;
      workDate?: Date;
      status?: string;
      notes?: string;
    },
    updatedBy: string = "ADMIN",
    reason: string = "Updated shift assignment"
  ) {
    const existing = await prisma.shiftAssignment.findUnique({
      where: { id },
      include: { shift: true },
    });
    if (!existing) throw new Error(`Assignment not found: ${id}`);

    const newSiteId = input.siteId ?? existing.siteId;
    const newShiftId = input.shiftId ?? existing.shiftId;
    const newWorkDate = input.workDate ?? existing.workDate;

    const targetShift = await prisma.shift.findUnique({ where: { id: newShiftId } });
    if (!targetShift) throw new Error(`Shift not found: ${newShiftId}`);

    const { plannedStart, plannedEnd } = ShiftService.getShiftDateTimeRange(
      newWorkDate,
      targetShift.startTime,
      targetShift.endTime,
      targetShift.isOvernight
    );

    const validation = await ShiftConflictService.validateAssignment({
      employeeId: existing.employeeId,
      siteId: newSiteId,
      shiftId: newShiftId,
      workDate: newWorkDate,
      plannedStart,
      plannedEnd,
      excludeAssignmentId: existing.id,
    });

    if (validation.hasErrors) {
      const errMessages = validation.conflicts
        .filter((c) => c.severity === "ERROR")
        .map((c) => c.message)
        .join("; ");
      const error: any = new Error(`Conflict detected: ${errMessages}`);
      error.conflicts = validation.conflicts;
      throw error;
    }

    const updated = await prisma.shiftAssignment.update({
      where: { id },
      data: {
        siteId: newSiteId,
        shiftId: newShiftId,
        workDate: newWorkDate,
        plannedStart,
        plannedEnd,
        ...(input.status ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: {
        employee: true,
        shift: true,
        site: true,
      },
    });

    // Write audit log
    await prisma.shiftAuditLog.create({
      data: {
        assignmentId: id,
        action: "UPDATE",
        oldValue: JSON.stringify({
          siteId: existing.siteId,
          shiftId: existing.shiftId,
          workDate: existing.workDate,
          status: existing.status,
        }),
        newValue: JSON.stringify({
          siteId: newSiteId,
          shiftId: newShiftId,
          workDate: newWorkDate,
          status: input.status ?? existing.status,
        }),
        performedBy: updatedBy,
        reason,
      },
    });

    return { assignment: updated, warnings: validation.conflicts.filter((c) => c.severity === "WARNING") };
  }

  /**
   * Delete or Cancel assignment
   */
  static async deleteAssignment(id: string, deletedBy: string = "ADMIN", reason: string = "Cancelled assignment") {
    const existing = await prisma.shiftAssignment.findUnique({ where: { id } });
    if (!existing) throw new Error(`Assignment not found: ${id}`);

    await prisma.shiftAuditLog.create({
      data: {
        assignmentId: id,
        action: "DELETE",
        oldValue: JSON.stringify(existing),
        performedBy: deletedBy,
        reason,
      },
    });

    return prisma.shiftAssignment.delete({ where: { id } });
  }

  /**
   * Auto generate draft schedule based on selected scenario
   */
  static async autoGenerateSchedule(params: {
    startDate: Date;
    endDate: Date;
    siteId?: string;
    mode: "BALANCED" | "MINIMIZE_OT" | "SKILL_PRIORITY" | "REST_PRIORITY" | "DISTANCE_PRIORITY";
    performedBy: string;
  }) {
    const start = new Date(params.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(params.endDate);
    end.setUTCHours(23, 59, 59, 999);

    const [sites, shifts, employees] = await Promise.all([
      prisma.site.findMany({ where: params.siteId ? { id: params.siteId } : {} }),
      prisma.shift.findMany({ where: { isActive: true }, orderBy: { startTime: "asc" } }),
      prisma.employee.findMany({
        where: { isActive: true },
        include: { skills: { include: { skill: true } } },
      }),
    ]);

    const createdAssignments = [];
    const dateCursor = new Date(start);

    while (dateCursor <= end) {
      const curWorkDate = new Date(dateCursor);

      for (const site of sites) {
        const morningShift = shifts.find((s) => s.code === "MORNING") || shifts[0];
        if (!morningShift) continue;

        // Check current assignments on this site & date
        const existing = await prisma.shiftAssignment.findMany({
          where: {
            siteId: site.id,
            workDate: curWorkDate,
            shiftId: morningShift.id,
            status: { notIn: ["CANCELLED"] },
          },
        });

        const targetCount = site.targetWorkforce || 2;
        const needed = targetCount - existing.length;

        if (needed > 0) {
          // Find candidates
          const assignedEmpIds = (
            await prisma.shiftAssignment.findMany({
              where: { workDate: curWorkDate, status: { notIn: ["CANCELLED"] } },
              select: { employeeId: true },
            })
          ).map((a) => a.employeeId);

          const available = employees.filter((e) => !assignedEmpIds.includes(e.id));

          // Sort candidates according to mode
          if (params.mode === "DISTANCE_PRIORITY") {
            // Prefer employee whose base siteId is the same
            available.sort((a, b) => (a.siteId === site.id ? -1 : 1));
          } else if (params.mode === "SKILL_PRIORITY") {
            // Prefer employees with more skills
            available.sort((a, b) => b.skills.length - a.skills.length);
          }

          const toAssign = available.slice(0, needed);
          for (const emp of toAssign) {
            const { plannedStart, plannedEnd } = ShiftService.getShiftDateTimeRange(
              curWorkDate,
              morningShift.startTime,
              morningShift.endTime,
              morningShift.isOvernight
            );

            const validation = await ShiftConflictService.validateAssignment({
              employeeId: emp.id,
              siteId: site.id,
              shiftId: morningShift.id,
              workDate: curWorkDate,
              plannedStart,
              plannedEnd,
            });

            if (validation.isValid) {
              const asmt = await prisma.shiftAssignment.create({
                data: {
                  employeeId: emp.id,
                  siteId: site.id,
                  shiftId: morningShift.id,
                  workDate: curWorkDate,
                  plannedStart,
                  plannedEnd,
                  status: "DRAFT",
                  assignedBy: params.performedBy,
                  notes: `Auto-generated (${params.mode})`,
                },
              });
              createdAssignments.push(asmt);
            }
          }
        }
      }

      dateCursor.setUTCDate(dateCursor.getUTCDate() + 1);
    }

    return {
      success: true,
      createdCount: createdAssignments.length,
      mode: params.mode,
    };
  }

  /**
   * Schedule Approval & Lock workflow transitions
   */
  static async updateSchedulePeriodStatus(params: {
    startDate: Date;
    endDate: Date;
    siteId?: string;
    action: "REVIEW" | "APPROVE" | "PUBLISH" | "LOCK" | "UNLOCK";
    performedBy: string;
    reason?: string;
  }) {
    const start = new Date(params.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(params.endDate);
    end.setUTCHours(23, 59, 59, 999);

    let period = await prisma.schedulePeriod.findFirst({
      where: {
        startDate: { lte: end },
        endDate: { gte: start },
        ...(params.siteId ? { siteId: params.siteId } : {}),
      },
    });

    let nextStatus = "DRAFT";
    let publishedAt: Date | undefined;
    let lockedAt: Date | undefined;
    let lockedBy: string | undefined;

    switch (params.action) {
      case "REVIEW":
        nextStatus = "MANAGER_REVIEW";
        break;
      case "APPROVE":
        nextStatus = "APPROVED";
        break;
      case "PUBLISH":
        nextStatus = "PUBLISHED";
        publishedAt = new Date();
        break;
      case "LOCK":
        nextStatus = "LOCKED";
        lockedAt = new Date();
        lockedBy = params.performedBy;
        break;
      case "UNLOCK":
        nextStatus = "PUBLISHED";
        break;
    }

    if (!period) {
      period = await prisma.schedulePeriod.create({
        data: {
          siteId: params.siteId,
          startDate: start,
          endDate: end,
          status: nextStatus,
          publishedAt,
          lockedAt,
          lockedBy,
          lockReason: params.reason,
          version: 1,
        },
      });
    } else {
      period = await prisma.schedulePeriod.update({
        where: { id: period.id },
        data: {
          status: nextStatus,
          publishedAt: publishedAt || period.publishedAt,
          lockedAt,
          lockedBy,
          lockReason: params.reason || period.lockReason,
          version: params.action === "PUBLISH" ? period.version + 1 : period.version,
        },
      });
    }

    // If PUBLISH, promote all DRAFT / PLANNED assignments in this period to CONFIRMED
    if (params.action === "PUBLISH") {
      await prisma.shiftAssignment.updateMany({
        where: {
          workDate: { gte: start, lte: end },
          ...(params.siteId ? { siteId: params.siteId } : {}),
          status: "DRAFT",
        },
        data: { status: "PLANNED" },
      });
    }

    return period;
  }
}
