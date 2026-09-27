import { NextRequest, NextResponse } from "next/server";
import { requireSession, requireRole } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";
import { PayrollService } from "@/server/services/payroll.service";

export async function GET(req: NextRequest) {
  const auth = await requireSession(req);
  if ("error" in auth) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || new Date().toISOString().substring(0, 7);
    let employeeId = searchParams.get("employeeId");
    if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(period)) return NextResponse.json({ error: "INVALID_PERIOD" }, { status: 400 });
    if (!["ADMIN", "SUPERADMIN", "HR", "FINANCE"].includes(auth.session.role)) {
      const user = await prisma.user.findUnique({ where: { id: auth.session.sub }, select: { employeeId: true } });
      if (!user?.employeeId || employeeId && employeeId !== user.employeeId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      employeeId = user.employeeId;
    }

    const payslips = await PayrollService.getPayslips(period, employeeId);
    return NextResponse.json({ payslips, period });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["ADMIN", "SUPERADMIN", "HR", "FINANCE"]);
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    if (typeof body.period !== "string" || !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(body.period)) {
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
