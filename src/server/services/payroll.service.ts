import { prisma } from "@/lib/prisma";

export class PayrollService {
  static async getPayslips(period: string, employeeId?: string | null) {
    const where: any = { period };
    if (employeeId) where.employeeId = employeeId;

    return prisma.payslip.findMany({
      where,
      include: {
        employee: {
          include: { site: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async calculatePeriodPayroll(period: string, siteId?: string | null) {
    const whereEmp: any = { isActive: true };
    if (siteId && siteId !== "all") whereEmp.siteId = siteId;

    const employees = await prisma.employee.findMany({
      where: whereEmp,
      include: {
        site: {
          include: { config: true },
        },
        attendances: {
          where: {
            isApproved: true,
          },
        },
      },
    });

    const generatedPayslips = [];

    for (const emp of employees) {
      const baseSalaryNum = Number(emp.baseSalary || 12000);
      const isDaily = emp.salaryType === "DAILY";
      const dailyRateNum = Number(emp.dailyRate || 400);

      // Count attendances
      const checkIns = emp.attendances.filter((a) => a.type === "CHECK_IN");
      const workedDays = isDaily ? (checkIns.length > 0 ? checkIns.length : 26) : 26;
      const dailyAmount = isDaily ? workedDays * dailyRateNum : 0;
      const effectiveBase = isDaily ? dailyAmount : baseSalaryNum;

      // Overtime calculation
      // Standard: OT 1.5 is standard weekday overtime
      const otHours = 20; // 20 hours average for cycle
      const hourlyRate = isDaily ? dailyRateNum / 8 : baseSalaryNum / (26 * 8);
      const ot15Hours = otHours;
      const ot15Amount = Math.round(ot15Hours * hourlyRate * 1.5);
      const otAmount = ot15Amount;

      // Allowances based on J2K company rules
      // Diligence: 1000 or 1200 (for ABPR sites)
      const isAbpr = emp.site?.code?.includes("ABPR");
      const diligence = isAbpr ? 1200 : 1000;

      // Travel allowance: 1000 default (minus 35 per day absent)
      const travelAllow = 1000;

      // Position allowance for supervisors/leaders
      let positionAllow = 0;
      let phoneAllow = 0;
      if (emp.position.includes("หัวหน้า") || emp.position.includes("Mgr") || emp.position.includes("ASST")) {
        positionAllow = 1000;
        phoneAllow = 500;
      }

      // Heat allowance for specific site cleaners (25 THB/day)
      const heatAllow = isAbpr ? 25 * 26 : 0;

      // Gross Income
      const grossIncome =
        effectiveBase +
        otAmount +
        travelAllow +
        diligence +
        positionAllow +
        phoneAllow +
        heatAllow;

      // Deductions
      // Social Security 5% (capped at 750 THB)
      const socialSec = Math.min(Math.round(effectiveBase * 0.05), 750);

      // Withholding Tax (~1%)
      const tax = Math.round(effectiveBase * 0.01);

      // Welfare Fund (หักเงินสงเคราะห์ 30 บาท)
      const welfareDeduct = 30;

      const totalDeduct = socialSec + tax + welfareDeduct;
      const netPay = grossIncome - totalDeduct;

      const itemizedJson = JSON.stringify({
        baseSalary: effectiveBase,
        dailyRate: dailyRateNum,
        workedDays,
        dailyAmount,
        ot15Hours,
        ot15Amount,
        travelAllow,
        diligence,
        positionAllow,
        phoneAllow,
        heatAllow,
        grossIncome,
        socialSec,
        tax,
        welfareDeduct,
        totalDeduct,
        netPay,
      });

      const payslip = await prisma.payslip.upsert({
        where: {
          employeeId_period: {
            employeeId: emp.id,
            period,
          },
        },
        update: {
          baseSalary: effectiveBase,
          dailyRate: dailyRateNum,
          workedDays,
          dailyAmount,
          otHours,
          otAmount,
          ot15Hours,
          ot15Amount,
          travelAllow,
          diligence,
          positionAllow,
          phoneAllow,
          heatAllow,
          grossIncome,
          tax,
          socialSec,
          welfareDeduct,
          totalDeduct,
          netPay,
          itemizedJson,
        },
        create: {
          employeeId: emp.id,
          period,
          baseSalary: effectiveBase,
          dailyRate: dailyRateNum,
          workedDays,
          dailyAmount,
          otHours,
          otAmount,
          ot15Hours,
          ot15Amount,
          travelAllow,
          diligence,
          positionAllow,
          phoneAllow,
          heatAllow,
          grossIncome,
          tax,
          socialSec,
          welfareDeduct,
          otherIncome: 0,
          otherDeduct: 0,
          totalDeduct,
          netPay,
          itemizedJson,
        },
        include: {
          employee: { include: { site: true } },
        },
      });

      generatedPayslips.push(payslip);
    }

    return generatedPayslips;
  }
}
