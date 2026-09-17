import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";

export interface DailyReportData { reportDate: string; tenantName: string; totalEmployees: number; presentCount: number; absentCount: number; lateCount: number; leaveCount: number; otHours: number; otCost: number; estimatedLaborCost: number; outsideGeofenceAlerts: number; missingCheckoutAlerts: number; aiSummaryText?: string }

export async function generateDailyExecutiveReport(_tenantCode?: string, dateStr?: string): Promise<DailyReportData> {
  const reportDate = dateStr || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  const start = fromZonedTime(`${reportDate}T00:00:00`, "Asia/Bangkok");
  const end = fromZonedTime(`${reportDate}T23:59:59.999`, "Asia/Bangkok");
  const [employees, attendance, leaves, organization] = await prisma.$transaction([
    prisma.employee.findMany({ where: { isActive: true }, select: { id: true, dailyRate: true, site: { select: { workStart: true } } } }),
    prisma.attendance.findMany({ where: { timestamp: { gte: start, lte: end } }, select: { employeeId: true, type: true, timestamp: true, isWithinGeofence: true } }),
    prisma.leave.findMany({ where: { status: "APPROVED", startDate: { lte: end }, endDate: { gte: start } }, select: { employeeId: true } }),
    prisma.organization.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
  const checkIns = attendance.filter((item) => item.type === "CHECK_IN");
  const present = new Set(checkIns.map((item) => item.employeeId));
  const leaveEmployees = new Set(leaves.map((item) => item.employeeId));
  const lateCount = checkIns.filter((item) => {
    const employee = employeeMap.get(item.employeeId);
    if (!employee) return false;
    const bangkokHour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", hour: "2-digit", hour12: false }).format(item.timestamp));
    return bangkokHour > employee.site.workStart;
  }).length;
  const grouped = new Map<string, Set<string>>();
  for (const item of attendance) { const values = grouped.get(item.employeeId) || new Set<string>(); values.add(item.type); grouped.set(item.employeeId, values); }
  const missingCheckoutAlerts = [...grouped.values()].filter((types) => types.has("CHECK_IN") && !types.has("CHECK_OUT")).length;
  const otHours = 0;
  const otCost = 0;
  const estimatedLaborCost = [...present].reduce((sum, id) => sum + Number(employeeMap.get(id)?.dailyRate || 0), 0);
  const totalEmployees = employees.length;
  const presentCount = present.size;
  const leaveCount = leaveEmployees.size;
  const outsideGeofenceAlerts = attendance.filter((item) => !item.isWithinGeofence).length;
  const absentCount = Math.max(0, totalEmployees - presentCount - leaveCount);
  return { reportDate, tenantName: organization?.name || "SmartJeff", totalEmployees, presentCount, absentCount, lateCount,
    leaveCount, otHours, otCost, estimatedLaborCost, outsideGeofenceAlerts, missingCheckoutAlerts,
    aiSummaryText: `Attendance ${presentCount}/${totalEmployees}; leave ${leaveCount}; outside geofence ${outsideGeofenceAlerts}; missing checkout ${missingCheckoutAlerts}.` };
}
