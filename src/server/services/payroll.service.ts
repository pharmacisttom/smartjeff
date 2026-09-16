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
      include: { site: true },
    });

    const generatedPayslips = [];

    for (const emp of employees) {
      const baseSalaryNum = Number(emp.baseSalary || 12000);
      
      // Calculate Social Security (5% max 750 THB)
      const socialSecNum = Math.min(Math.round(baseSalaryNum * 0.05), 750);
      
      // Calculate Tax (~1%)
      const taxNum = Math.round(baseSalaryNum * 0.01);
      
      // Allowances
      const diligenceNum = 1000;
      const travelAllowNum = 500;
      
      // OT Calculation
      const otHoursNum = 10;
      const hourlyRate = baseSalaryNum / (26 * 8);
      const otAmountNum = Math.round(otHoursNum * hourlyRate * 1.5);
      
      const netPayNum = baseSalaryNum + otAmountNum + diligenceNum + travelAllowNum - taxNum - socialSecNum;

      const payslip = await prisma.payslip.upsert({
        where: {
          employeeId_period: {
            employeeId: emp.id,
            period,
          },
        },
        update: {
          baseSalary: baseSalaryNum,
          otHours: otHoursNum,
          otAmount: otAmountNum,
          diligence: diligenceNum,
          travelAllow: travelAllowNum,
          tax: taxNum,
          socialSec: socialSecNum,
          netPay: netPayNum,
        },
        create: {
          employeeId: emp.id,
          period,
          baseSalary: baseSalaryNum,
          otHours: otHoursNum,
          otAmount: otAmountNum,
          diligence: diligenceNum,
          travelAllow: travelAllowNum,
          otherIncome: 0,
          tax: taxNum,
          socialSec: socialSecNum,
          otherDeduct: 0,
          netPay: netPayNum,
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
