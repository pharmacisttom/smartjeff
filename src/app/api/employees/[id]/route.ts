import { NextRequest, NextResponse } from "next/server";
import { EmployeeService } from "@/server/services/employee.service";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { EmployeeSerializer } from "@/lib/serializers/employee.serializer";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const employee = await EmployeeService.getById(params.id);
    if (!employee) {
      return NextResponse.json({ message: "ไม่พบข้อมูลพนักงาน" }, { status: 404 });
    }

    const viewerUser = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { employeeId: true },
    });
    const isSelf = viewerUser?.employeeId === employee.id;

    // Must have employee.read permission OR be the employee themselves
    if (!isSelf) {
      const authResult = await AuthorizationService.authorize({
        userId: session.sub,
        permission: "employee.read",
      });
      if (!authResult.allowed) {
        return NextResponse.json({ message: authResult.reason }, { status: 403 });
      }
    }

    const viewerContext = await AuthorizationService.getUserContext(session.sub);
    const serialized = EmployeeSerializer.serialize(employee, viewerContext, viewerUser?.employeeId);

    return NextResponse.json({ employee: serialized });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const authResult = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "employee.update",
    });
    if (!authResult.allowed) {
      return NextResponse.json({ message: authResult.reason }, { status: 403 });
    }

    const body = await req.json();
    const updated = await EmployeeService.update(params.id, body);
    const viewerContext = await AuthorizationService.getUserContext(session.sub);
    const serialized = EmployeeSerializer.serialize(updated, viewerContext);

    return NextResponse.json({ employee: serialized, message: "อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const authResult = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "employee.delete",
    });
    if (!authResult.allowed) {
      return NextResponse.json({ message: authResult.reason }, { status: 403 });
    }

    await EmployeeService.delete(params.id);
    return NextResponse.json({ message: "ลบข้อมูลพนักงานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
