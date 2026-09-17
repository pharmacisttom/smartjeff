export interface LaborLawRules {
  maxDailyHours: number;
  maxWeeklyHours: number;
  maxOTPerWeek: number;
  minBreakAfter5h: number; // minutes
  minRestDaysPerWeek: number;
  minAnnualLeave: number; // days
  minSickLeave: number;   // days
  minWage: Record<string, number>;
  otRates: {
    workday: number;
    holiday: number;
    holidayOT: number;
  };
  socialSecurityRate: number;
  socialSecurityMax: number;
}

export const LABOR_LAWS_TH: LaborLawRules = {
  maxDailyHours: 8,
  maxWeeklyHours: 48,
  maxOTPerWeek: 36,
  minBreakAfter5h: 60,
  minRestDaysPerWeek: 1,
  minAnnualLeave: 6,
  minSickLeave: 30,
  minWage: {
    RAYONG: 363,
    BANGKOK: 363,
    CHONBURI: 361,
    DEFAULT: 350,
  },
  otRates: {
    workday: 1.5,
    holiday: 2.0,
    holidayOT: 3.0,
  },
  socialSecurityRate: 0.05,
  socialSecurityMax: 750,
};

export interface Violation {
  rule: 'MAX_DAILY_HOURS' | 'MAX_WEEKLY_OT' | 'MIN_WAGE' | 'REST_DAY_MISSING' | 'SOCIAL_SECURITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  employeeId: string;
  employeeName?: string;
  details: Record<string, any>;
  message: string;
}

export interface ComplianceCheckResult {
  score: number; // 0 - 100
  status: 'OK' | 'WARNING' | 'VIOLATION' | 'CRITICAL';
  violations: Violation[];
  recommendations: string[];
}

export function auditLaborCompliance(
  attendances: Array<{
    employeeId: string;
    employeeName: string;
    date: string;
    hoursWorked: number;
    otHours: number;
    dailyWage: number;
    province?: string;
  }>
): ComplianceCheckResult {
  const violations: Violation[] = [];
  const empOtMap: Record<string, { name: string; totalOt: number }> = {};

  for (const item of attendances) {
    // 1. Check Max Daily Hours
    if (item.hoursWorked > LABOR_LAWS_TH.maxDailyHours) {
      violations.push({
        rule: 'MAX_DAILY_HOURS',
        severity: item.hoursWorked > 12 ? 'CRITICAL' : 'HIGH',
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        details: { date: item.date, hours: item.hoursWorked, max: LABOR_LAWS_TH.maxDailyHours },
        message: `พนักงาน ${item.employeeName} ทำงาน ${item.hoursWorked} ชม. เกินขีดจำกัดกฎหมาย (${LABOR_LAWS_TH.maxDailyHours} ชม.) วันที่ ${item.date}`,
      });
    }

    // 2. Check Min Wage
    const requiredMin = LABOR_LAWS_TH.minWage[item.province || 'DEFAULT'] || LABOR_LAWS_TH.minWage.DEFAULT;
    if (item.dailyWage < requiredMin) {
      violations.push({
        rule: 'MIN_WAGE',
        severity: 'CRITICAL',
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        details: { wage: item.dailyWage, requiredMin, province: item.province },
        message: `ค่าจ้างของ ${item.employeeName} (฿${item.dailyWage}) ต่ำกว่าอัตราค่าจ้างขั้นต่ำจังหวัด (${requiredMin} บาท)`,
      });
    }

    // Accumulate OT per employee
    if (!empOtMap[item.employeeId]) {
      empOtMap[item.employeeId] = { name: item.employeeName, totalOt: 0 };
    }
    empOtMap[item.employeeId].totalOt += item.otHours;
  }

  // 3. Check Weekly OT Limit
  for (const empId in empOtMap) {
    const { name, totalOt } = empOtMap[empId];
    if (totalOt > LABOR_LAWS_TH.maxOTPerWeek) {
      violations.push({
        rule: 'MAX_WEEKLY_OT',
        severity: 'CRITICAL',
        employeeId: empId,
        employeeName: name,
        details: { otHours: totalOt, max: LABOR_LAWS_TH.maxOTPerWeek },
        message: `พนักงาน ${name} มี OT รวม ${totalOt} ชม./สัปดาห์ เกินกำหนดกฎหมายคุ้มครองแรงงาน (${LABOR_LAWS_TH.maxOTPerWeek} ชม.)`,
      });
    }
  }

  // Calculate overall compliance score
  const severityPenalty = { LOW: 5, MEDIUM: 10, HIGH: 20, CRITICAL: 35 };
  const totalPenalty = violations.reduce((sum, v) => sum + severityPenalty[v.severity], 0);
  const score = Math.max(0, 100 - totalPenalty);

  const hasCriticalViolation = violations.some((v) => v.severity === 'CRITICAL');
  const status = hasCriticalViolation || score < 50 ? 'CRITICAL' : score >= 90 ? 'OK' : score >= 70 ? 'WARNING' : 'VIOLATION';

  const recommendations: string[] = [];
  if (violations.some((v) => v.rule === 'MAX_DAILY_HOURS')) {
    recommendations.push('ปรับปรุงกะการทำงาน (Shift rotation) เพื่อป้องกันการทำงานเกิน 8 ชั่วโมงต่อวัน');
  }
  if (violations.some((v) => v.rule === 'MAX_WEEKLY_OT')) {
    recommendations.push('จำกัดโควตา OT ไม่เกิน 36 ชั่วโมงต่อสัปดาห์ตาม พ.ร.บ. คุ้มครองแรงงาน');
  }
  if (violations.some((v) => v.rule === 'MIN_WAGE')) {
    recommendations.push('ปรับอัตราค่าจ้างให้สอดคล้องกับประกาศค่าจ้างขั้นต่ำประจำจังหวัด');
  }
  if (recommendations.length === 0) {
    recommendations.push('ปฏิบัติตามกฎหมายแรงงานถูกต้อง 100% ไม่มีข้อละเมิด');
  }

  return { score, status, violations, recommendations };
}

// Government Document Generator Stub
export interface GovDocSpec {
  docType: 'SSO_1_10' | 'PND_1' | 'PND_1A' | 'CR_7' | 'WHT_50_TWI';
  period: string; // e.g. "2026-09"
  companyName: string;
  taxId: string;
  itemsCount: number;
  totalAmount: number;
}

export function generateGovDocData(spec: GovDocSpec) {
  return {
    ...spec,
    generatedAt: new Date().toISOString(),
    status: 'READY_FOR_FILING',
    downloadUrl: `/api/compliance/gov-docs/download?type=${spec.docType}&period=${spec.period}`,
  };
}
