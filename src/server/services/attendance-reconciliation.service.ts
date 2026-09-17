import { prisma } from "@/lib/prisma";

export type AttendanceReconciledStatus =
  | "ON_TIME"
  | "LATE"
  | "EARLY_LEAVE"
  | "ABSENT"
  | "INCOMPLETE"
  | "OVERTIME"
  | "REST_DAY";

export interface ReconciledRecord {
  assignmentId?: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  siteId: string;
  siteName: string;
  shiftId?: string;
  shiftName?: string;
  workDate: string; // YYYY-MM-DD
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualCheckIn: string | null;
  actualCheckOut: string | null;
  payableWorkStart: string | null;
  payableWorkEnd: string | null;
  status: AttendanceReconciledStatus;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  payableWorkingMinutes: number;
  actualWorkingMinutes: number;
  notes: string[];
}

export class AttendanceReconciliationService {
  /**
   * Reconcile single employee planned shift vs actual attendances for a day
   */
  static reconcileSingle(
    employee: { id: string; code: string; firstName: string; lastName: string },
    site: { id: string; name: string },
    workDate: Date,
    assignment: {
      id: string;
      plannedStart: Date;
      plannedEnd: Date;
      shift: {
        id: string;
        name: string;
        lateToleranceMinutes: number;
        earlyCheckInMinutes: number;
        allowedEarlyLeaveMinutes: number;
        breakMinutes: number;
      };
    } | null,
    attendances: Array<{
      id: string;
      type: string; // CHECK_IN | CHECK_OUT | OT_IN | OT_OUT
      timestamp: Date;
    }>,
    currentTime: Date = new Date()
  ): ReconciledRecord {
    const workDateStr = workDate.toISOString().split("T")[0];
    const notes: string[] = [];

    // Sort attendances chronologically
    const sorted = [...attendances].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const checkIns = sorted.filter((a) => a.type === "CHECK_IN");
    const checkOuts = sorted.filter((a) => a.type === "CHECK_OUT");

    const firstCheckIn = checkIns[0]?.timestamp || null;
    const lastCheckOut = checkOuts[checkOuts.length - 1]?.timestamp || null;

    let scheduledStartIso: string | null = null;
    let scheduledEndIso: string | null = null;
    let lateMinutes = 0;
    let earlyLeaveMinutes = 0;
    let payableStart: Date | null = null;
    let payableEnd: Date | null = null;
    let status: AttendanceReconciledStatus = "ON_TIME";

    if (!assignment) {
      // Unscheduled attendance
      if (firstCheckIn) {
        status = "OVERTIME";
        notes.push("ลงเวลาทำงานโดยไม่มีการวางแผนกะล่วงหน้า (Unscheduled Shift)");
        payableStart = firstCheckIn;
        payableEnd = lastCheckOut;
      } else {
        status = "REST_DAY";
      }
    } else {
      scheduledStartIso = assignment.plannedStart.toISOString();
      scheduledEndIso = assignment.plannedEnd.toISOString();

      const shiftStartMs = assignment.plannedStart.getTime();
      const shiftEndMs = assignment.plannedEnd.getTime();
      const toleranceMs = (assignment.shift.lateToleranceMinutes || 10) * 60 * 1000;
      const earlyLeaveToleranceMs = (assignment.shift.allowedEarlyLeaveMinutes || 0) * 60 * 1000;

      if (!firstCheckIn) {
        // Did not check in yet
        if (currentTime.getTime() > shiftEndMs) {
          status = "ABSENT";
          notes.push("ไม่พบการลงเวลาเข้างานหลังหมดเวลากะ (Absent)");
        } else if (currentTime.getTime() > shiftStartMs + toleranceMs) {
          status = "LATE";
          notes.push("ยังไม่ลงเวลาเข้างาน (เกินเวลาเริ่มกะ)");
        } else {
          status = "ON_TIME";
          notes.push("รอกำหนดเวลาเข้างาน");
        }
      } else {
        const checkInMs = firstCheckIn.getTime();

        // 1. Late Calculation
        if (checkInMs > shiftStartMs + toleranceMs) {
          lateMinutes = Math.max(0, Math.floor((checkInMs - shiftStartMs) / 60000));
          status = "LATE";
          notes.push(`เข้างานสาย ${lateMinutes} นาที (ค่าเผื่อ ${assignment.shift.lateToleranceMinutes} นาที)`);
          payableStart = firstCheckIn;
        } else {
          // Early check-in or On time
          // If checked in early, payable start is capped at scheduledStart to avoid automatic unapproved OT
          if (checkInMs < shiftStartMs) {
            const earlyMins = Math.floor((shiftStartMs - checkInMs) / 60000);
            notes.push(`สแกนเข้างานก่อนเวลา ${earlyMins} นาที (เริ่มคิดชั่วโมงงานตามเวลากะ)`);
            payableStart = assignment.plannedStart;
          } else {
            payableStart = assignment.plannedStart;
          }
        }

        // 2. Check out & Incomplete calculation
        if (!lastCheckOut) {
          if (currentTime.getTime() > shiftEndMs) {
            status = "INCOMPLETE";
            notes.push("สแกนเข้างานแต่ยังไม่สแกนออก (Incomplete - Missing Checkout)");
          }
        } else {
          const checkOutMs = lastCheckOut.getTime();

          // Early Leave Calculation
          if (checkOutMs < shiftEndMs - earlyLeaveToleranceMs) {
            earlyLeaveMinutes = Math.max(0, Math.floor((shiftEndMs - checkOutMs) / 60000));
            if (status !== "LATE") {
              status = "EARLY_LEAVE";
            }
            notes.push(`ออกก่อนเวลากะ ${earlyLeaveMinutes} นาที`);
            payableEnd = lastCheckOut;
          } else {
            payableEnd = assignment.plannedEnd;
            if (checkOutMs > shiftEndMs + 30 * 60000) {
              notes.push("มีการสแกนออกหลังเวลากะ (อาจมี OT รออนุมัติ)");
            }
          }
        }
      }
    }

    // Working minutes calculation
    let actualWorkingMinutes = 0;
    if (firstCheckIn && lastCheckOut) {
      actualWorkingMinutes = Math.max(0, Math.floor((lastCheckOut.getTime() - firstCheckIn.getTime()) / 60000));
    }

    let payableWorkingMinutes = 0;
    if (payableStart && payableEnd && payableEnd > payableStart) {
      const grossMinutes = Math.floor((payableEnd.getTime() - payableStart.getTime()) / 60000);
      const breakMin = assignment?.shift?.breakMinutes || 60;
      payableWorkingMinutes = Math.max(0, grossMinutes - breakMin);
    }

    return {
      assignmentId: assignment?.id,
      employeeId: employee.id,
      employeeCode: employee.code,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      siteId: site.id,
      siteName: site.name,
      shiftId: assignment?.shift?.id,
      shiftName: assignment?.shift?.name,
      workDate: workDateStr,
      scheduledStart: scheduledStartIso,
      scheduledEnd: scheduledEndIso,
      actualCheckIn: firstCheckIn ? firstCheckIn.toISOString() : null,
      actualCheckOut: lastCheckOut ? lastCheckOut.toISOString() : null,
      payableWorkStart: payableStart ? payableStart.toISOString() : null,
      payableWorkEnd: payableEnd ? payableEnd.toISOString() : null,
      status,
      lateMinutes,
      earlyLeaveMinutes,
      payableWorkingMinutes,
      actualWorkingMinutes,
      notes,
    };
  }

  /**
   * Reconcile all assignments and attendances across sites for a given date
   */
  static async reconcileDate(workDate: Date, siteId?: string) {
    const startOfDay = new Date(workDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(workDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Fetch assignments, employees, and attendances for the date
    const [assignments, attendances, sites, employees] = await Promise.all([
      prisma.shiftAssignment.findMany({
        where: {
          workDate: { gte: startOfDay, lte: endOfDay },
          ...(siteId ? { siteId } : {}),
          status: { notIn: ["CANCELLED"] },
        },
        include: {
          shift: true,
          employee: true,
          site: true,
        },
      }),
      prisma.Attendance.findMany({
        where: {
          timestamp: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { timestamp: "asc" },
      }),
      prisma.site.findMany({
        where: siteId ? { id: siteId } : {},
      }),
      prisma.employee.findMany({
        where: { isActive: true },
        select: { id: true, code: true, firstName: true, lastName: true, siteId: true },
      }),
    ]);

    const records: ReconciledRecord[] = [];
    const now = new Date();

    // Map by assignment
    const coveredEmployeeIds = new Set<string>();

    for (const a of assignments) {
      coveredEmployeeIds.add(a.employeeId);
      const empAttendances = attendances.filter((att) => att.employeeId === a.employeeId);
      const rec = this.reconcileSingle(a.employee, a.site, workDate, a, empAttendances, now);
      records.push(rec);
    }

    // Unassigned employees who actually attended
    const unassignedWithAttendances = attendances.filter((att) => !coveredEmployeeIds.has(att.employeeId));
    const unassignedEmpIds = Array.from(new Set(unassignedWithAttendances.map((a) => a.employeeId)));

    for (const empId of unassignedEmpIds) {
      const emp = employees.find((e) => e.id === empId);
      if (!emp) continue;
      const site = sites.find((s) => s.id === emp.siteId) || sites[0];
      if (!site) continue;
      const empAttendances = attendances.filter((att) => att.employeeId === empId);
      const rec = this.reconcileSingle(emp, site, workDate, null, empAttendances, now);
      records.push(rec);
    }

    // Summary counters
    const summary = {
      total: records.length,
      onTime: records.filter((r) => r.status === "ON_TIME").length,
      late: records.filter((r) => r.status === "LATE").length,
      earlyLeave: records.filter((r) => r.status === "EARLY_LEAVE").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      incomplete: records.filter((r) => r.status === "INCOMPLETE").length,
      overtime: records.filter((r) => r.status === "OVERTIME").length,
      totalLateMinutes: records.reduce((sum, r) => sum + r.lateMinutes, 0),
      totalPayableHours: Math.round(records.reduce((sum, r) => sum + r.payableWorkingMinutes, 0) / 6) / 10,
    };

    return { success: true, date: workDate.toISOString().split("T")[0], summary, records };
  }
}
