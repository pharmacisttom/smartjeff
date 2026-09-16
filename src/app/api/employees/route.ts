import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const search = searchParams.get("search");

    const where: any = {};
    if (siteId) where.siteId = siteId;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        site: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json(
      { message: "Failed to fetch employees", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
    } = body;

    if (!code || !firstName || !lastName || !position || !siteId) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (รหัส, ชื่อ, นามสกุล, ตำแหน่ง, ไซต์งาน)" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        code,
        prefix: prefix || null,
        firstName,
        lastName,
        position,
        siteId,
        gender: gender || "MALE",
        idCardNo: idCardNo || null,
        phone: phone || null,
        bankAccount: bankAccount || null,
        bankName: bankName || null,
        salaryType: salaryType || "MONTHLY",
        baseSalary: baseSalary ? parseFloat(baseSalary) : 12000,
        dailyRate: dailyRate ? parseFloat(dailyRate) : 400,
      },
      include: {
        site: true,
      },
    });

    return NextResponse.json({ employee, message: "สร้างข้อมูลพนักงานเรียบร้อยแล้ว" });
  } catch (error: any) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json(
      { message: "ไม่สามารถเพิ่มพนักงานได้", error: error.message },
      { status: 500 }
    );
  }
}
