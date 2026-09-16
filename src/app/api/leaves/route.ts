import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== "ALL") where.status = status;

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          include: { site: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leaves });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, type, startDate, endDate, reason } = body;

    if (!employeeId || !type || !startDate || !endDate) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลการลาให้ครบถ้วน" }, { status: 400 });
    }

    const leave = await prisma.leave.create({
      data: {
        employeeId,
        type, // SICK, PERSONAL, VACATION, OT
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || null,
        status: "PENDING",
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json({ leave, message: "ยื่นใบขอลา/ทำ OT เรียบร้อยแล้ว (รอการอนุมัติ)" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
