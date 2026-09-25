import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo monthly schedule & cross-site relief data...");

  // Get active sites
  const sites = await prisma.site.findMany({
    where: { employees: { some: {} } },
    include: {
      employees: { where: { isActive: true }, take: 8 },
    },
  });

  const aamSite = sites.find((s) => s.code === "AAM");
  const jathSite = sites.find((s) => s.code === "JATH");
  const batSite = sites.find((s) => s.code === "BAT");

  // Plan for current month (September 2026) and 3 months ahead (October, November, December 2026)
  const months = [
    { year: 2026, month: 8 }, // Sep (0-indexed 8)
    { year: 2026, month: 9 }, // Oct
    { year: 2026, month: 10 }, // Nov
    { year: 2026, month: 11 }, // Dec
  ];

  let totalCreated = 0;

  for (const m of months) {
    const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();

    for (const site of sites) {
      for (const emp of site.employees) {
        for (let day = 1; day <= daysInMonth; day++) {
          const curDate = new Date(Date.UTC(m.year, m.month, day, 0, 0, 0, 0));

          const dayOfWeek = curDate.getUTCDay(); // 0 = Sun
          const isSunday = dayOfWeek === 0;

          // Some occasional OT, leaves
          let shiftType = "DAY";
          let workHours = 8;
          let otHours = 0;

          if (isSunday) {
            shiftType = "OFF";
            workHours = 0;
          } else if ((day % 5 === 0) && dayOfWeek !== 6) {
            // Overtime day
            shiftType = "OT";
            workHours = 8;
            otHours = 1.5;
          } else if (day === 12 && emp.code === "120189") {
            // Sick leave example
            shiftType = "LEAVE";
            workHours = 0;
          }

          await prisma.shiftAssignment.upsert({
            where: {
              employeeId_date: {
                employeeId: emp.id,
                date: curDate,
              },
            },
            update: {
              shiftType,
              workHours,
              otHours,
              siteId: site.id,
              homeSiteId: site.id,
              isPublished: true,
            },
            create: {
              employeeId: emp.id,
              date: curDate,
              shiftType,
              workHours,
              otHours,
              siteId: site.id,
              homeSiteId: site.id,
              isPublished: true,
            },
          });
          totalCreated++;
        }
      }
    }

    // Add a Cross-Site Relief Worker scenario!
    // Example: On day 12 and 13 of the month, an AAM employee was on leave,
    // so an employee from JATH was borrowed to reinforce AAM!
    if (aamSite && jathSite && jathSite.employees[0]) {
      const reliefEmp = jathSite.employees[0];
      const reliefDate1 = new Date(Date.UTC(m.year, m.month, 12, 0, 0, 0, 0));
      const reliefDate2 = new Date(Date.UTC(m.year, m.month, 13, 0, 0, 0, 0));

      await prisma.shiftAssignment.upsert({
        where: {
          employeeId_date: {
            employeeId: reliefEmp.id,
            date: reliefDate1,
          },
        },
        update: {
          shiftType: "RELIEF",
          siteId: aamSite.id,
          homeSiteId: jathSite.id,
          isRelief: true,
          workHours: 8,
          otHours: 1.5,
          note: `[ยืมตัวเสริมกำลังคน] ทดแทนพนักงานลาป่วย (จากโรงงาน ${jathSite.code})`,
          isPublished: true,
        },
        create: {
          employeeId: reliefEmp.id,
          date: reliefDate1,
          shiftType: "RELIEF",
          siteId: aamSite.id,
          homeSiteId: jathSite.id,
          isRelief: true,
          workHours: 8,
          otHours: 1.5,
          note: `[ยืมตัวเสริมกำลังคน] ทดแทนพนักงานลาป่วย (จากโรงงาน ${jathSite.code})`,
          isPublished: true,
        },
      });

      await prisma.shiftAssignment.upsert({
        where: {
          employeeId_date: {
            employeeId: reliefEmp.id,
            date: reliefDate2,
          },
        },
        update: {
          shiftType: "RELIEF",
          siteId: aamSite.id,
          homeSiteId: jathSite.id,
          isRelief: true,
          workHours: 8,
          otHours: 0,
          note: `[ยืมตัวเสริมกำลังคน] เสริมทีมทำความสะอาดประจำรอบ (จากโรงงาน ${jathSite.code})`,
          isPublished: true,
        },
        create: {
          employeeId: reliefEmp.id,
          date: reliefDate2,
          shiftType: "RELIEF",
          siteId: aamSite.id,
          homeSiteId: jathSite.id,
          isRelief: true,
          workHours: 8,
          otHours: 0,
          note: `[ยืมตัวเสริมกำลังคน] เสริมทีมทำความสะอาดประจำรอบ (จากโรงงาน ${jathSite.code})`,
          isPublished: true,
        },
      });
    }
  }

  console.log(`✅ Finished seeding ${totalCreated} shift assignments across 4 months (Sep - Dec 2026)!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
