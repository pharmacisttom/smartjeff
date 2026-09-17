import { NextResponse } from "next/server";
import { EmployeeService } from "@/server/services/employee.service";
import { isThaiNationality, normalizeDigits, validateIdentity } from "@/lib/employee/validation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const search = searchParams.get("search");

    const employees = await EmployeeService.getAll({ siteId, search });
    return NextResponse.json({ employees });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch employees", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.code || !body.firstName || !body.lastName || !body.position || !body.siteId) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const nationality = String(body.nationality || "ไทย").trim();
    const idCardNo = (isThaiNationality(nationality) ? normalizeDigits(body.idCardNo) : String(body.idCardNo || "").trim()) || null;
    const identityError = validateIdentity(nationality, idCardNo);
    if (identityError) return NextResponse.json({ message: identityError }, { status: 400 });

    const employee = await EmployeeService.create({
      code: body.code,
      prefix: body.prefix,
      firstName: body.firstName,
      lastName: body.lastName,
      position: body.position,
      siteId: body.siteId,
      gender: body.gender,
      nationality,
      idCardNo,
      phone: body.phone,
      bankAccount: body.bankAccount,
      bankName: body.bankName,
      salaryType: body.salaryType,
      baseSalary: body.baseSalary ? parseFloat(body.baseSalary) : undefined,
      dailyRate: body.dailyRate ? parseFloat(body.dailyRate) : undefined,
    });

    return NextResponse.json({ employee, message: "สร้างข้อมูลพนักงานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json(
      { message: "ไม่สามารถเพิ่มพนักงานได้", error: error.message },
      { status: 500 }
    );
  }
}
