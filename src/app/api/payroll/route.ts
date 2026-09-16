import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch payslips by period or employeeId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || new Date().toISOString().substring(0, 7); // e.g. "2026-09"
    const employeeId = searchParams.get("employeeId");

    const where: any = { period };
    if (employeeId) where.employeeId = employeeId;

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        employee: {
          include: { site: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payslips, period });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST: Batch process / calculate payroll for a given period
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { period, siteId } = body; // period e.g. "2026-09"

    if (!period) {
      return NextResponse.json({ message: "กรุณาระบุงวดคำนวณเงินเดือน (เช่น 2026-09)" }, { status: 400 });
    }

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
      
      // Calculate Tax (Estimated withholding ~1%)
      const taxNum = Math.round(baseSalaryNum * 0.01);
      
      // Diligence Allowance (Default 1,000 THB)
      const diligenceNum = 1000;
      
      // Travel Allowance
      const travelAllowNum = 500;
      
      // Default estimated OT hours
      const otHoursNum = 10;
      const hourlyRate = baseSalaryNum / (26 * 8);
      const otAmountNum = Math.round(otHoursNum * hourlyRate * 1.5);
      
      const netPayNum = baseSalaryNum + otAmountNum + diligenceNum + travelAllowNum - taxNum - socialSecNum;

      // Upsert payslip
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

    return NextResponse.json({
      message: `ประมวลผลเงินเดือนงวด ${period} สำเร็จเรียบร้อย (${generatedPayslips.length} รายการ)`,
      payslips: generatedPayslips,
    });
  } catch (error: any) {
    console.error("POST /api/payroll error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
