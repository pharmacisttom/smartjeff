import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { getSessionFromRequest } from "@/lib/auth-jwt";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อนดาวน์โหลด" }, { status: 401 });
    }

    const templatePath = path.join(process.cwd(), "public", "templates", "employee_import_template.xlsx");

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ message: "ไม่พบไฟล์แม่แบบในระบบ" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(templatePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="employee_import_template.xlsx"',
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์แม่แบบ", error: error.message },
      { status: 500 }
    );
  }
}
