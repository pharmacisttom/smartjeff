import { NextRequest, NextResponse } from "next/server";
import { EmployeeService } from "@/server/services/employee.service";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { EmployeeSerializer } from "@/lib/serializers/employee.serializer";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // Authorization check
    const authResult = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "employee.read",
    });

    if (!authResult.allowed) {
      return NextResponse.json({ message: authResult.reason }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const search = searchParams.get("search");

    const employees = await EmployeeService.getAll({ siteId, search });
    const viewerContext = await AuthorizationService.getUserContext(session.sub);
    const viewerUser = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { employeeId: true },
    });

    // Apply Field-Level Security Masking
    const serialized = EmployeeSerializer.serializeMany(
      employees,
      viewerContext,
      viewerUser?.employeeId
    );

    return NextResponse.json({ employees: serialized });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch employees", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const authResult = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "employee.create",
    });

    if (!authResult.allowed) {
      return NextResponse.json({ message: authResult.reason }, { status: 403 });
    }

    const body = await req.json();
    if (!body.code || !body.firstName || !body.lastName || !body.position || !body.siteId) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const employee = await EmployeeService.create({
      code: body.code,
      prefix: body.prefix,
      firstName: body.firstName,
      lastName: body.lastName,
      position: body.position,
      siteId: body.siteId,
      gender: body.gender,
      idCardNo: body.idCardNo,
      phone: body.phone,
      bankAccount: body.bankAccount,
      bankName: body.bankName,
      salaryType: body.salaryType,
      baseSalary: body.baseSalary ? parseFloat(body.baseSalary) : undefined,
      dailyRate: body.dailyRate ? parseFloat(body.dailyRate) : undefined,
    });

    const viewerContext = await AuthorizationService.getUserContext(session.sub);
    const serialized = EmployeeSerializer.serialize(employee, viewerContext);

    return NextResponse.json({ employee: serialized, message: "สร้างข้อมูลพนักงานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json(
      { message: "ไม่สามารถเพิ่มพนักงานได้", error: error.message },
      { status: 500 }
    );
  }
}
