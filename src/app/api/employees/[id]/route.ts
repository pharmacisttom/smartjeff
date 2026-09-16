import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        site: true,
        attendances: { take: 10, orderBy: { timestamp: "desc" } },
        leaves: { take: 10, orderBy: { createdAt: "desc" } },
        payslips: { take: 12, orderBy: { period: "desc" } },
      },
    });

    if (!employee) {
      return NextResponse.json({ message: "ไม่พบข้อมูลพนักงาน" }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      code,
      prefix,
      firstName,
      lastName,
      position,
      siteId,
      gender,
      idCardNo,
      phone,
      bankAccount,
      bankName,
      salaryType,
      baseSalary,
      dailyRate,
      isActive,
    } = body;

    const updated = await prisma.employee.update({
      where: { id: params.id },
      data: {
        code,
        prefix,
        firstName,
        lastName,
        position,
        siteId,
        gender,
        idCardNo,
        phone,
        bankAccount,
        bankName,
        salaryType,
        baseSalary: baseSalary !== undefined ? parseFloat(baseSalary) : undefined,
        dailyRate: dailyRate !== undefined ? parseFloat(dailyRate) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: { site: true },
    });

    return NextResponse.json({ employee: updated, message: "อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.employee.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "ลบข้อมูลพนักงานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
