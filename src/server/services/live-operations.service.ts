import { prisma } from "@/lib/prisma";

export class LiveOperationsService {
  static async getSnapshot() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const sites = await prisma.site.findMany({
      orderBy: { name: "asc" },
      include: {
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            gender: true,
            position: true,
            attendances: { where: { timestamp: { gte: start, lt: end } }, orderBy: { timestamp: "desc" }, take: 1 },
            leaves: { where: { status: "APPROVED", startDate: { lte: end }, endDate: { gte: start } }, take: 1 },
            shiftAssignments: {
              where: { date: { gte: start, lt: end }, isPublished: true },
              include: { shiftTemplate: true },
              take: 1,
            },
          },
        },
      },
    });

    let working = 0,
      late = 0,
      leave = 0,
      ot = 0,
      alerts = 0,
      planned = 0;
    let maleCount = 0,
      femaleCount = 0,
      otherCount = 0,
      unspecifiedCount = 0;

    const siteResults = sites.map((site) => {
      const employees = site.employees.map((employee) => {
        const event = employee.attendances[0] || null;
        const onLeave = employee.leaves.length > 0;
        const shiftAssignment = employee.shiftAssignments[0] || null;
        const isPlanned = shiftAssignment != null;
        if (isPlanned) planned += 1;

        const checkedIn = event?.type === "CHECK_IN" || event?.type === "OT_IN";
        const isOt = event?.type === "OT_IN";
        const lateThreshold = new Date(start);
        lateThreshold.setHours(Math.floor(site.workStart), Math.round((site.workStart % 1) * 60), 0, 0);
        const isLate = event?.type === "CHECK_IN" && event.timestamp > lateThreshold;

        if (onLeave) leave += 1;
        if (checkedIn) working += 1;
        if (isLate) late += 1;
        if (isOt) ot += 1;
        if (event && !event.isWithinGeofence) alerts += 1;

        // Gender accounting directly from MySQL Employee.gender
        const rawGender = (employee.gender || "UNSPECIFIED").toUpperCase();
        let gender: "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED" = "UNSPECIFIED";
        if (["MALE", "ชาย"].includes(rawGender)) {
          gender = "MALE";
          maleCount++;
        } else if (["FEMALE", "หญิง"].includes(rawGender)) {
          gender = "FEMALE";
          femaleCount++;
        } else if (["OTHER", "อื่น ๆ", "อื่นๆ"].includes(rawGender)) {
          gender = "OTHER";
          otherCount++;
        } else {
          gender = "UNSPECIFIED";
          unspecifiedCount++;
        }

        const shiftName = shiftAssignment?.shiftTemplate
          ? `${shiftAssignment.shiftTemplate.name} (${shiftAssignment.shiftTemplate.startTime} - ${shiftAssignment.shiftTemplate.endTime})`
          : `ปกติ (${site.workStart}:00 - ${site.workEnd}:00)`;

        return {
          id: employee.id,
          code: employee.code,
          name: `${employee.firstName} ${employee.lastName}`.trim(),
          gender,
          position: employee.position || "พนักงานปฏิบัติการ",
          siteName: site.name,
          shiftName,
          status: onLeave
            ? "LEAVE"
            : isOt
            ? "OT_ACTIVE"
            : isLate
            ? "LATE"
            : checkedIn
            ? "WORKING"
            : "NOT_CHECKED_IN",
          latestEvent: event
            ? {
                id: event.id,
                type: event.type,
                timestamp: event.timestamp.toISOString(),
                lat: event.lat,
                lng: event.lng,
                withinGeofence: event.isWithinGeofence,
              }
            : null,
        };
      });

      const siteWorking = employees.filter((item) => ["WORKING", "LATE", "OT_ACTIVE"].includes(item.status)).length;
      const siteLate = employees.filter((item) => item.status === "LATE").length;
      const siteLeave = employees.filter((item) => item.status === "LEAVE").length;
      const required = site.employees.length;
      const status =
        site.lat == null || site.lng == null
          ? "NO_COORDINATES"
          : siteWorking === 0
          ? "EMPTY"
          : siteWorking < required
          ? "LOW_STAFF"
          : "NORMAL";

      return {
        id: site.id,
        code: site.code,
        name: site.name,
        lat: site.lat,
        lng: site.lng,
        radius: site.radius,
        status,
        required,
        planned: site.employees.filter((employee) => employee.shiftAssignments.length > 0).length,
        working: siteWorking,
        late: siteLate,
        leave: siteLeave,
        notCheckedIn: employees.filter((item) => item.status === "NOT_CHECKED_IN").length,
        ot: employees.filter((item) => item.status === "OT_ACTIVE").length,
        alerts: employees.filter((item) => item.latestEvent && !item.latestEvent.withinGeofence).length,
        employees,
      };
    });

    const totalEmployees = sites.reduce((sum, site) => sum + site.employees.length, 0);

    return {
      summary: {
        activeSites: sites.length,
        totalEmployees,
        working,
        late,
        leave,
        notCheckedIn: Math.max(0, totalEmployees - working - leave),
        ot,
        alerts,
        planned,
        genderBreakdown: {
          male: maleCount,
          female: femaleCount,
          other: otherCount,
          unspecified: unspecifiedCount,
        },
      },
      sites: siteResults,
      generatedAt: now.toISOString(),
    };
  }
}
