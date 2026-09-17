import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const assignment = await prisma.shiftAssignment.findUnique({
      where: { id: params.id },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    if (user.employeeId && assignment.employeeId !== user.employeeId && user.role === "EMPLOYEE") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.shiftAssignment.update({
      where: { id: params.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
      include: { shift: true, site: true },
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
