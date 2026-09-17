import { NextRequest, NextResponse } from "next/server";
import { TrainingCertificationService } from "@/server/services/qhse/training-certification.service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const expiringDays = searchParams.get("expiringDays");

    if (expiringDays) {
      const expiring = await TrainingCertificationService.getExpiringCertifications(parseInt(expiringDays, 10));
      return NextResponse.json({ expiring });
    }

    const courses = await prisma.trainingCourse.findMany({
      include: {
        sessions: {
          include: { attendances: true },
        },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ courses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "CREATE_COURSE") {
      if (!body.code || !body.name) {
        return NextResponse.json({ error: "code and name are required" }, { status: 400 });
      }
      const course = await TrainingCertificationService.createCourse({
        code: body.code,
        name: body.name,
        description: body.description,
        category: body.category,
        validityMonths: body.validityMonths ? parseInt(body.validityMonths, 10) : undefined,
        mandatory: body.mandatory,
      });
      return NextResponse.json(course, { status: 201 });
    }

    if (body.action === "SCHEDULE_SESSION") {
      if (!body.courseId || !body.date || !body.trainer || !body.location) {
        return NextResponse.json({ error: "courseId, date, trainer, and location are required" }, { status: 400 });
      }
      const session = await TrainingCertificationService.scheduleSession({
        courseId: body.courseId,
        date: new Date(body.date),
        trainer: body.trainer,
        location: body.location,
        capacity: body.capacity ? parseInt(body.capacity, 10) : undefined,
      });
      return NextResponse.json(session, { status: 201 });
    }

    if (body.action === "RECORD_ATTENDANCE") {
      if (!body.sessionId || !body.employeeId || !body.status) {
        return NextResponse.json({ error: "sessionId, employeeId, and status are required" }, { status: 400 });
      }
      const attendance = await TrainingCertificationService.recordAttendance({
        sessionId: body.sessionId,
        employeeId: body.employeeId,
        status: body.status,
        score: body.score ? parseFloat(body.score) : undefined,
        certificateUrl: body.certificateUrl,
      });
      return NextResponse.json(attendance, { status: 201 });
    }

    if (body.action === "REGISTER_CERTIFICATE") {
      if (!body.employeeId || !body.certificateNumber || !body.name || !body.issuer || !body.issueDate) {
        return NextResponse.json({ error: "Missing required certificate fields" }, { status: 400 });
      }
      const cert = await TrainingCertificationService.registerCertification({
        employeeId: body.employeeId,
        certificateNumber: body.certificateNumber,
        name: body.name,
        issuer: body.issuer,
        issueDate: new Date(body.issueDate),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
        attachmentUrl: body.attachmentUrl,
        verifiedBy: body.verifiedBy,
      });
      return NextResponse.json(cert, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
