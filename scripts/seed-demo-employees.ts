import { PrismaClient } from "@prisma/client";

export interface EmployeeSeedSpec {
  email: string;
  code: string;
  prefix: string;
  firstName: string;
  lastName: string;
  position: string;
  departmentCode: string;
  departmentName: string;
  salaryType: "MONTHLY" | "DAILY";
  baseSalary: number;
  dailyRate: number;
  gender: "MALE" | "FEMALE";
}

export const DEMO_EMPLOYEE_SPECS: EmployeeSeedSpec[] = [
  {
    email: "employee@j2k.com",
    code: "EMP-DEMO-001",
    prefix: "นางสาว",
    firstName: "สมหญิง",
    lastName: "ใจดี",
    position: "พนักงานปฏิบัติการหน้าไซต์",
    departmentCode: "DEMO-DEPT-OPS",
    departmentName: "ฝ่ายปฏิบัติงานหน้าไซต์ (Field Operations)",
    salaryType: "DAILY",
    baseSalary: 13500,
    dailyRate: 450,
    gender: "FEMALE",
  },
  {
    email: "supervisor@j2k.com",
    code: "EMP-DEMO-002",
    prefix: "นาย",
    firstName: "สมศักดิ์",
    lastName: "มั่งคั่ง",
    position: "หัวหน้าไซต์งาน",
    departmentCode: "DEMO-DEPT-OPS",
    departmentName: "ฝ่ายปฏิบัติงานหน้าไซต์ (Field Operations)",
    salaryType: "MONTHLY",
    baseSalary: 25000,
    dailyRate: 833.33,
    gender: "MALE",
  },
  {
    email: "coordinator@j2k.com",
    code: "EMP-DEMO-003",
    prefix: "นาย",
    firstName: "วิชัย",
    lastName: "ก้าวหน้า",
    position: "ผู้ประสานงานโครงการ",
    departmentCode: "DEMO-DEPT-OPS",
    departmentName: "ฝ่ายปฏิบัติงานหน้าไซต์ (Field Operations)",
    salaryType: "MONTHLY",
    baseSalary: 35000,
    dailyRate: 1166.67,
    gender: "MALE",
  },
  {
    email: "hr@j2k.com",
    code: "EMP-DEMO-004",
    prefix: "นางสาว",
    firstName: "ศิริพร",
    lastName: "งามยิ่ง",
    position: "หัวหน้าฝ่าย HR & Payroll",
    departmentCode: "DEMO-DEPT-HR",
    departmentName: "ฝ่ายทรัพยากรบุคคลและเงินเดือน (HR & Payroll)",
    salaryType: "MONTHLY",
    baseSalary: 45000,
    dailyRate: 1500,
    gender: "FEMALE",
  },
  {
    email: "executive@j2k.com",
    code: "EMP-DEMO-005",
    prefix: "ดร.",
    firstName: "ประเสริฐ",
    lastName: "วิสัยทัศน์",
    position: "ผู้บริหารระดับสูง",
    departmentCode: "DEMO-DEPT-EXEC",
    departmentName: "ฝ่ายบริหารระดับสูง (Executive Management)",
    salaryType: "MONTHLY",
    baseSalary: 95000,
    dailyRate: 3166.67,
    gender: "MALE",
  },
];

export interface EmployeeVerificationReport {
  email: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  site: string;
  project: string;
  employmentStatus: string;
  role: string;
}

export async function seedDemoEmployees(prisma: PrismaClient): Promise<EmployeeVerificationReport[]> {
  const isDemoAllowed = process.env.DEMO_MODE === "true" || process.env.DEMO_SEED_ALLOWED === "true";
  if (!isDemoAllowed) {
    throw new Error("DEMO_MODE or DEMO_SEED_ALLOWED must be set to 'true'");
  }

  // 1. Ensure a Demo Client & Site exist
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
      lat: 13.4354,
      lng: 101.0021,
      radius: 300,
      workStart: 8,
      workEnd: 17,
      status: "ACTIVE",
    },
  });

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

  const reports: EmployeeVerificationReport[] = [];

  await prisma.$transaction(async (tx) => {
    for (const spec of DEMO_EMPLOYEE_SPECS) {
      // Create or update Department
      const dept = await tx.department.upsert({
        where: { code: spec.departmentCode },
        update: { name: spec.departmentName, isActive: true },
        create: {
          code: spec.departmentCode,
          name: spec.departmentName,
          nameTh: spec.departmentName,
          isActive: true,
        },
      });

      // Upsert Employee Master
      const employee = await tx.employee.upsert({
        where: { code: spec.code },
        update: {
          prefix: spec.prefix,
          firstName: spec.firstName,
          lastName: spec.lastName,
          position: spec.position,
          siteId: site.id,
          departmentId: dept.id,
          salaryType: spec.salaryType,
          baseSalary: spec.baseSalary,
          dailyRate: spec.dailyRate,
          gender: spec.gender,
          employmentStatus: "ACTIVE",
          isActive: true,
        },
        create: {
          code: spec.code,
          prefix: spec.prefix,
          firstName: spec.firstName,
          lastName: spec.lastName,
          position: spec.position,
          siteId: site.id,
          departmentId: dept.id,
          salaryType: spec.salaryType,
          baseSalary: spec.baseSalary,
          dailyRate: spec.dailyRate,
          gender: spec.gender,
          employmentStatus: "ACTIVE",
          isActive: true,
        },
      });

      // Ensure EmployeeDeployment exists
      await tx.employeeDeployment.upsert({
        where: {
          employeeId_siteId_effectiveDate: {
            employeeId: employee.id,
            siteId: site.id,
            effectiveDate: new Date("2026-01-01"),
          },
        },
        update: { position: spec.position, status: "APPROVED" },
        create: {
          employeeId: employee.id,
          siteId: site.id,
          effectiveDate: new Date("2026-01-01"),
          position: spec.position,
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });

      // Find and Link corresponding User account
      const user = await tx.user.findUnique({ where: { email: spec.email } });
      let roleName = "UNASSIGNED";

      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: { employeeId: employee.id },
        });
        roleName = user.role;
      }

      reports.push({
        email: spec.email,
        employeeCode: employee.code,
        employeeName: `${employee.prefix || ""} ${employee.firstName} ${employee.lastName}`.trim(),
        department: dept.name,
        site: site.name,
        project: project.name,
        employmentStatus: employee.employmentStatus,
        role: roleName,
      });
    }
  });

  return reports;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const reports = await seedDemoEmployees(prisma);
    console.log("\n==================================================");
    console.log("DEMO EMPLOYEES SEEDED AND LINKED SUCCESSFULLY");
    console.log("==================================================");
    console.table(reports);
  } catch (error) {
    console.error("❌ Seeding demo employees failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
