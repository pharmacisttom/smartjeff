import { NextResponse } from "next/server";
import { PayrollService } from "@/server/services/payroll.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || new Date().toISOString().substring(0, 7);
    const employeeId = searchParams.get("employeeId");

    const payslips = await PayrollService.getPayslips(period, employeeId);
    return NextResponse.json({ payslips, period });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.period) {
      return NextResponse.json({ message: "กรุณาระบุงวดคำนวณเงินเดือน" }, { status: 400 });
    }

    const payslips = await PayrollService.calculatePeriodPayroll(body.period, body.siteId);
    return NextResponse.json({
      message: `ประมวลผลเงินเดือนงวด ${body.period} สำเร็จเรียบร้อย (${payslips.length} รายการ)`,
      payslips,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
