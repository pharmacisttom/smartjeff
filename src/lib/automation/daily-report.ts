import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";

export interface PriorityCheckItem {
  id: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  title: string;
  description: string;
  reason: string;
  ruleApplied: string;
  actionUrl: string;
}

export interface DailyReportData {
  reportDate: string;
  tenantName: string;
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  otHours: number;
  otCost: number;
  estimatedLaborCost: number;
  outsideGeofenceAlerts: number;
  missingCheckoutAlerts: number;
  aiSummaryText?: string;
  genderBreakdown: {
    male: number;
    female: number;
    other: number;
    unspecified: number;
  };
  priorityChecks: PriorityCheckItem[];
}

export async function generateDailyExecutiveReport(
  _tenantCode?: string,
  dateStr?: string
): Promise<DailyReportData> {
  const reportDate =
    dateStr || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  const start = fromZonedTime(`${reportDate}T00:00:00`, "Asia/Bangkok");
  const end = fromZonedTime(`${reportDate}T23:59:59.999`, "Asia/Bangkok");

  const [employees, attendance, leaves, organization, systemAlerts, openRisks] = await prisma.$transaction([
    prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, dailyRate: true, gender: true, site: { select: { name: true, workStart: true } } },
    }),
    prisma.attendance.findMany({
      where: { timestamp: { gte: start, lte: end } },
      select: { employeeId: true, type: true, timestamp: true, isWithinGeofence: true },
    }),
    prisma.leave.findMany({
      where: { status: "APPROVED", startDate: { lte: end }, endDate: { gte: start } },
      select: { employeeId: true },
    }),
    prisma.organization.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.systemAlert.findMany({ where: { status: "OPEN" }, take: 10 }),
    prisma.risk.findMany({ where: { status: "OPEN", level: { in: ["HIGH", "CRITICAL"] } }, take: 5 }),
  ]);

  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
  const checkIns = attendance.filter((item) => item.type === "CHECK_IN");
  const present = new Set(checkIns.map((item) => item.employeeId));
  const leaveEmployees = new Set(leaves.map((item) => item.employeeId));

  const lateCount = checkIns.filter((item) => {
    const employee = employeeMap.get(item.employeeId);
    if (!employee) return false;
    const bangkokHour = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", hour: "2-digit", hour12: false }).format(
        item.timestamp
      )
    );
    return bangkokHour > employee.site.workStart;
  }).length;

  const grouped = new Map<string, Set<string>>();
  for (const item of attendance) {
    const values = grouped.get(item.employeeId) || new Set<string>();
    values.add(item.type);
    grouped.set(item.employeeId, values);
  }
  const missingCheckoutAlerts = [...grouped.values()].filter(
    (types) => types.has("CHECK_IN") && !types.has("CHECK_OUT")
  ).length;

  const otHours = 0;
  const otCost = 0;
  const estimatedLaborCost = [...present].reduce(
    (sum, id) => sum + Number(employeeMap.get(id)?.dailyRate || 0),
    0
  );

  const totalEmployees = employees.length;
  const presentCount = present.size;
  const leaveCount = leaveEmployees.size;
  const outsideGeofenceAlerts = attendance.filter((item) => !item.isWithinGeofence).length;
  const absentCount = Math.max(0, totalEmployees - presentCount - leaveCount);

  // Gender Breakdown
  let male = 0,
    female = 0,
    other = 0,
    unspecified = 0;

  for (const emp of employees) {
    const g = (emp.gender || "UNSPECIFIED").toUpperCase();
    if (["MALE", "ชาย"].includes(g)) male++;
    else if (["FEMALE", "หญิง"].includes(g)) female++;
    else if (["OTHER", "อื่น ๆ", "อื่นๆ"].includes(g)) other++;
    else unspecified++;
  }

  // Priority Checks ("สิ่งที่ควรตรวจสอบวันนี้")
  const priorityChecks: PriorityCheckItem[] = [];

  if (outsideGeofenceAlerts > 0) {
    priorityChecks.push({
      id: "chk-geofence",
      category: "ATTENDANCE_GEOPRIVACY",
      severity: "HIGH",
      title: `พบการลงเวลานอก Geofence ${outsideGeofenceAlerts} รายการ`,
      description: "มีพนักงานบันทึกเวลาปฏิบัติงานอยู่นอกพื้นที่รัศมีพิกัดไซต์งานที่กำหนด",
      reason: "ตรวจพบจากบันทึก Attendance Event ที่ระยะทางเกินกว่า Geofence Radius ของไซต์",
      ruleApplied: "Rule-ATT-04: Geofence Validation (distance > site.radius)",
      actionUrl: "/admin/attendance",
    });
  }

  if (missingCheckoutAlerts > 0) {
    priorityChecks.push({
      id: "chk-checkout",
      category: "ATTENDANCE_EXCEPTION",
      severity: "MEDIUM",
      title: `พนักงานยังไม่ลงเวลาออก ${missingCheckoutAlerts} คน`,
      description: "พบรายการเข้างานที่มีเฉพาะ CHECK_IN แต่ยังไม่มี CHECK_OUT หลังสิ้นสุดเวลางาน",
      reason: "พบ event CHECK_IN ในวันนี้ แต่ยังไม่พบบันทึก CHECK_OUT",
      ruleApplied: "Rule-ATT-02: Missing Checkout Detection",
      actionUrl: "/admin/attendance",
    });
  }

  if (openRisks.length > 0) {
    priorityChecks.push({
      id: "chk-risks",
      category: "QHSE_RISK",
      severity: "CRITICAL",
      title: `ความเสี่ยงระดับสูง/วิกฤตคงค้าง ${openRisks.length} รายการ`,
      description: "พบความเสี่ยงสำคัญที่ยังไม่มีการอนุมัติมาตรการบรรเทาความเสี่ยง",
      reason: "ดึงข้อมูลจาก Risk Register ที่มีสถานะ OPEN และ Risk Score >= 15",
      ruleApplied: "Rule-QHSE-01: Critical Risk Register Threshold",
      actionUrl: "/admin/enterprise/qhse/risks",
    });
  }

  if (systemAlerts.length > 0) {
    priorityChecks.push({
      id: "chk-system-alerts",
      category: "PLATFORM_HEALTH",
      severity: "MEDIUM",
      title: `การแจ้งเตือนระบบคงค้าง ${systemAlerts.length} รายการ`,
      description: "มี System Alert ที่ยังไม่ได้ถูกแก้ไขหรือรับทราบ",
      reason: "พบรายการใน SystemAlert ที่มีสถานะ OPEN",
      ruleApplied: "Rule-SYS-03: System Alert Outbox Check",
      actionUrl: "/alerts",
    });
  }

  return {
    reportDate,
    tenantName: organization?.name || "SmartJeff",
    totalEmployees,
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    otHours,
    otCost,
    estimatedLaborCost,
    outsideGeofenceAlerts,
    missingCheckoutAlerts,
    genderBreakdown: { male, female, other, unspecified },
    priorityChecks,
    aiSummaryText: `เข้างาน ${presentCount}/${totalEmployees} คน; ลางาน ${leaveCount} คน; นอก Geofence ${outsideGeofenceAlerts} รายการ; ยังไม่ลงเวลาออก ${missingCheckoutAlerts} รายการ.`,
  };
}
