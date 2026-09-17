import { prisma } from "@/lib/prisma";

export interface CreateCourseInput {
  code: string;
  name: string;
  description?: string;
  category?: string; // SAFETY | TECHNICAL | QUALITY | COMPLIANCE | LEADERSHIP
  validityMonths?: number;
  mandatory?: boolean;
}

export interface ScheduleSessionInput {
  courseId: string;
  date: Date;
  trainer: string;
  location: string;
  capacity?: number;
}

export interface RecordAttendanceInput {
  sessionId: string;
  employeeId: string;
  status: string; // REGISTERED | ATTENDED | PASSED | FAILED | ABSENT
  score?: number;
  certificateUrl?: string;
}

export interface RegisterCertificationInput {
  employeeId: string;
  certificateNumber: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  attachmentUrl?: string;
  verifiedBy?: string;
}

export class TrainingCertificationService {
  static async createCourse(input: CreateCourseInput) {
    return prisma.trainingCourse.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        category: input.category || "SAFETY",
        validityMonths: input.validityMonths || 12,
        mandatory: Boolean(input.mandatory),
      },
    });
  }

  static async scheduleSession(input: ScheduleSessionInput) {
    const count = await prisma.trainingSession.count();
    const sessionNo = `TRN-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    return prisma.trainingSession.create({
      data: {
        sessionNo,
        courseId: input.courseId,
        date: input.date,
        trainer: input.trainer,
        location: input.location,
        capacity: input.capacity || 20,
        status: "SCHEDULED",
      },
    });
  }

  static async recordAttendance(input: RecordAttendanceInput) {
    return prisma.trainingAttendance.upsert({
      where: {
        sessionId_employeeId: {
          sessionId: input.sessionId,
          employeeId: input.employeeId,
        },
      },
      create: {
        sessionId: input.sessionId,
        employeeId: input.employeeId,
        status: input.status,
        score: input.score,
        certificateUrl: input.certificateUrl,
      },
      update: {
        status: input.status,
        score: input.score,
        certificateUrl: input.certificateUrl,
      },
    });
  }

  static async registerCertification(input: RegisterCertificationInput) {
    const isExpired = input.expiryDate && input.expiryDate < new Date();

    return prisma.employeeCertification.create({
      data: {
        employeeId: input.employeeId,
        certificateNumber: input.certificateNumber,
        name: input.name,
        issuer: input.issuer,
        issueDate: input.issueDate,
        expiryDate: input.expiryDate,
        attachmentUrl: input.attachmentUrl,
        verificationStatus: isExpired ? "EXPIRED" : "VALID",
        verifiedBy: input.verifiedBy,
        verifiedAt: input.verifiedBy ? new Date() : null,
      },
    });
  }

  /**
   * Retrieves employee certifications with configurable expiry alerts (90, 60, 30, 7 days, expired)
   */
  static async getExpiringCertifications(daysThreshold: number = 30) {
    const now = new Date();
    const thresholdDate = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000);

    const certifications = await prisma.employeeCertification.findMany({
      where: {
        expiryDate: { lte: thresholdDate },
      },
      orderBy: { expiryDate: "asc" },
    });

    return certifications.map((c) => {
      const isExpired = c.expiryDate ? c.expiryDate < now : false;
      const daysRemaining = c.expiryDate
        ? Math.ceil((c.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let alertLevel = "SAFE";
      if (isExpired) alertLevel = "EXPIRED";
      else if (daysRemaining <= 7) alertLevel = "CRITICAL_7_DAYS";
      else if (daysRemaining <= 30) alertLevel = "WARNING_30_DAYS";
      else if (daysRemaining <= 60) alertLevel = "NOTICE_60_DAYS";
      else if (daysRemaining <= 90) alertLevel = "REMINDER_90_DAYS";

      return {
        ...c,
        isExpired,
        daysRemaining,
        alertLevel,
      };
    });
  }

  /**
   * Workforce Planning Integration Guardrail:
   * Validates whether an employee possesses active mandatory certifications/training courses
   */
  static async validateWorkforceQualification(
    employeeId: string,
    mandatoryCourseCodes: string[] = []
  ): Promise<{ qualified: boolean; missingCourses: string[]; expiredCertificates: string[] }> {
    const now = new Date();

    // Check certificates
    const certs = await prisma.employeeCertification.findMany({
      where: { employeeId },
    });

    const expiredCertificates = certs
      .filter((c) => c.expiryDate && c.expiryDate < now)
      .map((c) => c.name);

    // Check mandatory training courses
    const attendances = await prisma.trainingAttendance.findMany({
      where: {
        employeeId,
        status: "PASSED",
      },
      include: {
        session: {
          include: { course: true },
        },
      },
    });

    const passedCourseCodes = new Set(attendances.map((a) => a.session.course.code));
    const missingCourses = mandatoryCourseCodes.filter((code) => !passedCourseCodes.has(code));

    const qualified = missingCourses.length === 0 && expiredCertificates.length === 0;

    return {
      qualified,
      missingCourses,
      expiredCertificates,
    };
  }

  /**
   * Training & Certification Summary KPI
   */
  static async getTrainingSummary() {
    const expiringSoon = await this.getExpiringCertifications(30);
    const expired = expiringSoon.filter((c) => c.isExpired);

    const [totalCourses, totalSessions, totalCertifications] = await Promise.all([
      prisma.trainingCourse.count(),
      prisma.trainingSession.count(),
      prisma.employeeCertification.count(),
    ]);

    return {
      totalCourses,
      totalSessions,
      totalCertifications,
      expiringCount: expiringSoon.length - expired.length,
      expiredCount: expired.length,
    };
  }
}
