import { PrismaClient } from "@prisma/client";

export async function seedDemoShowcase(prisma: PrismaClient) {
  if (process.env.DEMO_MODE !== "true") {
    throw new Error("DEMO_MODE must be set to 'true'");
  }

  console.log("🚀 Starting Relational Demo Showcase Seeding...");

  // 1. Client
  const client = await prisma.client.upsert({
    where: { code: "DEMO-CLIENT-01" },
    update: { name: "บริษัท ไทยอุตสาหกรรม การผลิต จำกัด (มหาชน)", isActive: true },
    create: {
      code: "DEMO-CLIENT-01",
      name: "บริษัท ไทยอุตสาหกรรม การผลิต จำกัด (มหาชน)",
      nameTh: "บริษัท ไทยอุตสาหกรรม การผลิต จำกัด (มหาชน)",
      contactName: "คุณสมชาย รักไทย",
      contactEmail: "contact@thai-industry-demo.co.th",
      contactPhone: "02-999-8888",
      industry: "Manufacturing & Industrial Estate",
      isActive: true,
    },
  });

  // 2. Site
  const site = await prisma.site.upsert({
    where: { code: "DEMO-SITE-AMATA" },
    update: { name: "ไซต์งาน นิคมอุตสาหกรรมอมตะซิตี้ ชลบุรี", clientId: client.id, status: "ACTIVE" },
    create: {
      code: "DEMO-SITE-AMATA",
      name: "ไซต์งาน นิคมอุตสาหกรรมอมตะซิตี้ ชลบุรี",
      shortName: "อมตะซิตี้",
      clientId: client.id,
      location: "700/123 หมู่ 1 ต.คลองตำหรุ อ.เมืองชลบุรี จ.ชลบุรี 20000",
      estateName: "Amata City Chonburi",
      contactName: "หัวหน้าผู้ควบคุมไซต์อมตะ",
      contactEmail: "site-amata@j2k.com",
      contactPhone: "038-100-200",
      lat: 13.4354,
      lng: 101.0021,
      radius: 300,
      workStart: 8,
      workEnd: 17,
      status: "ACTIVE",
    },
  });

  // 3. Project
  const project = await prisma.project.upsert({
    where: { code: "DEMO-PROJ-AMATA-2026" },
    update: { name: "โครงการบริการดูแลความสะอาดและบริหารกำลังคนนิคมอมตะ 2026", clientId: client.id, status: "ACTIVE" },
    create: {
      code: "DEMO-PROJ-AMATA-2026",
      name: "โครงการบริการดูแลความสะอาดและบริหารกำลังคนนิคมอมตะ 2026",
      nameTh: "โครงการบริการดูแลความสะอาดและบริหารกำลังคนนิคมอมตะ 2026",
      clientId: client.id,
      status: "ACTIVE",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      budgetAmount: 12000000,
      revenueAmount: 15000000,
      margin: 3000000,
    },
  });

  // 4. Department
  const dept = await prisma.department.upsert({
    where: { code: "DEMO-DEPT-OPERATIONS" },
    update: { name: "ฝ่ายปฏิบัติงานและบริการพื้นที่ (Field Operations)" },
    create: {
      code: "DEMO-DEPT-OPERATIONS",
      name: "ฝ่ายปฏิบัติงานและบริการพื้นที่ (Field Operations)",
      nameTh: "ฝ่ายปฏิบัติงานและบริการพื้นที่",
      isActive: true,
    },
  });

  // 5. Employees
  const emp1 = await prisma.employee.upsert({
    where: { code: "EMP-DEMO-001" },
    update: { firstName: "สมศักดิ์", lastName: "มั่งคั่ง", siteId: site.id, departmentId: dept.id },
    create: {
      code: "EMP-DEMO-001",
      prefix: "นาย",
      firstName: "สมศักดิ์",
      lastName: "มั่งคั่ง",
      position: "หัวหน้างานปฏิบัติการ",
      siteId: site.id,
      departmentId: dept.id,
      salaryType: "MONTHLY",
      baseSalary: 25000,
      dailyRate: 833.33,
      employmentStatus: "ACTIVE",
      gender: "MALE",
      phone: "089-111-2222",
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { code: "EMP-DEMO-002" },
    update: { firstName: "กัญญา", lastName: "สว่างจิต", siteId: site.id, departmentId: dept.id },
    create: {
      code: "EMP-DEMO-002",
      prefix: "นางสาว",
      firstName: "กัญญา",
      lastName: "สว่างจิต",
      position: "เจ้าหน้าที่ปฏิบัติงานประจำไซต์",
      siteId: site.id,
      departmentId: dept.id,
      salaryType: "DAILY",
      baseSalary: 13500,
      dailyRate: 450,
      employmentStatus: "ACTIVE",
      gender: "FEMALE",
      phone: "089-333-4444",
    },
  });

  // Link Demo User `employee@j2k.com` to `emp2` if user exists
  const demoEmpUser = await prisma.user.findUnique({ where: { email: "employee@j2k.com" } });
  if (demoEmpUser && !demoEmpUser.employeeId) {
    await prisma.user.update({
      where: { id: demoEmpUser.id },
      data: { employeeId: emp2.id },
    });
  }

  // 6. Attendance Sample
  await prisma.attendance.upsert({
    where: { localId: "DEMO-ATT-001" },
    update: { approvalStatus: "APPROVED", isApproved: true },
    create: {
      localId: "DEMO-ATT-001",
      employeeId: emp1.id,
      type: "CHECK_IN",
      timestamp: new Date(),
      lat: 13.4355,
      lng: 101.0022,
      distance: 15.5,
      isWithinGeofence: true,
      approvalStatus: "APPROVED",
      isApproved: true,
      note: "ลงเวลาเข้างานปกติในพื้นที่ Geofence",
    },
  });

  // 7. Shift Template
  const shiftTemplate = await prisma.shiftTemplate.upsert({
    where: { code: "DEMO-SHIFT-DAY" },
    update: { name: "กะเช้า 08:00 - 17:00 น.", siteId: site.id },
    create: {
      code: "DEMO-SHIFT-DAY",
      name: "กะเช้า 08:00 - 17:00 น.",
      siteId: site.id,
      startTime: "08:00",
      endTime: "17:00",
      breakMinutes: 60,
      isActive: true,
    },
  });

  // 8. Payroll Run & Payslip
  const payrollRun = await prisma.payrollRun.upsert({
    where: { period_siteId: { period: "2026-09", siteId: site.id } },
    update: { status: "APPROVED", totalAmount: 38500 },
    create: {
      period: "2026-09",
      siteId: site.id,
      status: "APPROVED",
      totalAmount: 38500,
      approvedAt: new Date(),
    },
  });

  await prisma.payslip.upsert({
    where: { employeeId_period: { employeeId: emp1.id, period: "2026-09" } },
    update: { netPay: 23800 },
    create: {
      employeeId: emp1.id,
      payrollRunId: payrollRun.id,
      period: "2026-09",
      baseSalary: 25000,
      dailyRate: 833.33,
      workedDays: 26,
      otHours: 10,
      otAmount: 1800,
      travelAllow: 1000,
      diligence: 1000,
      grossIncome: 28800,
      tax: 500,
      socialSec: 750,
      totalDeduct: 1250,
      netPay: 27550,
    },
  });

  console.log("✅ Relational Demo Showcase Seeding Completed Successfully.");
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedDemoShowcase(prisma);
  } catch (error) {
    console.error("❌ Demo showcase seed failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
