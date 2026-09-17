import { NextResponse } from "next/server";
import { EmployeeService } from "@/server/services/employee.service";
import { isThaiNationality, normalizeDigits, validateIdentity } from "@/lib/employee/validation";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await EmployeeService.getById(params.id);
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
    const nationality = String(body.nationality || "ไทย").trim();
    const idCardNo = (isThaiNationality(nationality) ? normalizeDigits(body.idCardNo) : String(body.idCardNo || "").trim()) || null;
    const identityError = validateIdentity(nationality, idCardNo);
    if (identityError) return NextResponse.json({ message: identityError }, { status: 400 });
    body.nationality = nationality;
    body.idCardNo = idCardNo;
    const updated = await EmployeeService.update(params.id, body);
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
    await EmployeeService.delete(params.id);
    return NextResponse.json({ message: "ลบข้อมูลพนักงานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
