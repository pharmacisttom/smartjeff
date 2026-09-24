import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function excelSerialToDate(serial: any): Date | null {
  if (!serial || isNaN(Number(serial))) return null;
  const num = Number(serial);
  // Excel epoch: 1899-12-30
  const utcDays = Math.floor(num - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  return isNaN(dateInfo.getTime()) ? null : dateInfo;
}

function parseDecimalHours(val: any, defaultHours: number): number {
  if (val === undefined || val === null || val === "") return defaultHours;
  const num = parseFloat(String(val).trim());
  if (isNaN(num)) return defaultHours;
  return num;
}

async function main() {
  console.log("🌱 Starting SMARTO database seed from jeffy1.xlsx...");

  // Reset database tables in dependency order
  await prisma.auditLog.deleteMany({});
  const masterHash = await bcrypt.hash("Smartjeff2026", 10);
  await prisma.chatMessage.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.payslip.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.payrollConfig.deleteMany({});
  await prisma.site.deleteMany({});

  const excelPath = path.join(__dirname, "../jeffy1.xlsx");
  const workbook = XLSX.readFile(excelPath);

  // 1. Process CODE sheet for factory estates and locations
  const codeSheet = workbook.Sheets["CODE"];
  const codeRows: any[][] = XLSX.utils.sheet_to_json(codeSheet, { header: 1 });
  const siteLocationMap = new Map<string, { name: string; estate: string }>();

  for (let i = 2; i < codeRows.length; i++) {
    const row = codeRows[i];
    if (!row || !row[0]) continue;
    const shortCode = String(row[0]).trim().toUpperCase();
    const fullName = row[2] ? String(row[2]).trim() : "";
    const estate = row[3] ? String(row[3]).trim() : "";
    siteLocationMap.set(shortCode, { name: fullName, estate });
  }

  // 2. Process "เวลา -เข้าออกงาน" for shift hours
  const workSheet = workbook.Sheets["เวลา -เข้าออกงาน"];
  const workRows: any[][] = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
  const workHoursMap = new Map<string, { workStart: number; workEnd: number; otStart: number; otEnd: number }>();

  for (let i = 1; i < workRows.length; i++) {
    const r = workRows[i];
    if (!r || !r[2]) continue;
    const siteCode = String(r[2]).trim().toUpperCase();
    const workStart = parseDecimalHours(r[4], 7);
    const workEnd = parseDecimalHours(r[5], 16);
    const otStart = parseDecimalHours(r[6], 16);
    const otEnd = parseDecimalHours(r[7], 17);

    // Save if not already set (or prioritize main shift)
    if (!workHoursMap.has(siteCode)) {
      workHoursMap.set(siteCode, { workStart, workEnd, otStart, otEnd });
    }
  }

  // 3. Process Customer Sheet
  const customerSheet = workbook.Sheets["Customer"];
  const customerRows: any[][] = XLSX.utils.sheet_to_json(customerSheet, { header: 1 });
  const siteMap = new Map<string, string>(); // shortCode -> Site.id

  // Create default fallback site
  const defaultSite = await prisma.site.upsert({
    where: { code: "AAM" },
    update: {},
    create: {
      code: "AAM",
      name: "บริษัท อเมริกัน แอ็คเซิล แอนด์ แมนูแฟคเจอริ่ง (ประเทศไทย) จำกัด",
      location: "นิคมอุตสาหกรรมเหมราช ระยอง",
      estateName: "นิคมอุตสาหกรรมเหมราช",
      contactName: "คุณแวว",
      contactEmail: "Widchayaporn.Thakham@aam.com",
      contactPhone: "089-2453192",
      lat: 12.6841,
      lng: 101.1476,
      radius: 200,
      workStart: 7,
      workEnd: 16,
      otStart: 16,
      otEnd: 17,
    },
  });
  siteMap.set("AAM", defaultSite.id);

  // HQ site
  const hqSite = await prisma.site.upsert({
    where: { code: "J2K-HQ" },
    update: {},
    create: {
      code: "J2K-HQ",
      name: "สำนักงานใหญ่ บริษัท เจทูเค เฮ้าส์คีพปิ้ง เซอร์วิส จำกัด",
      location: "235 หมู่ที่ 4 ตำบลปลวกแดง อำเภอปลวกแดง จังหวัดระยอง 21140",
      estateName: "ปลวกแดง ระยอง",
      contactName: "นายปณิธาน ลานทองกุล",
      contactEmail: "admin@j2k.co.th",
      contactPhone: "097-253-9456",
      lat: 12.9734,
      lng: 101.2155,
      radius: 300,
      workStart: 8,
      workEnd: 17,
      otStart: 17,
      otEnd: 19,
    },
  });
  siteMap.set("J2K-OFFICER", hqSite.id);
  siteMap.set("J2K-HQ", hqSite.id);

  for (let i = 1; i < customerRows.length; i++) {
    const row = customerRows[i];
    if (!row || !row[2]) continue;

    const shortCode = String(row[2]).trim().toUpperCase();
    const fullName = row[3] ? String(row[3]).trim() : shortCode;
    const contact = row[4] ? String(row[4]).trim() : null;
    const email = row[5] ? String(row[5]).trim() : null;
    const phone = row[6] ? String(row[6]).trim() : null;

    const codeInfo = siteLocationMap.get(shortCode);
    const workInfo = workHoursMap.get(shortCode) || { workStart: 7, workEnd: 16, otStart: 16, otEnd: 17 };
    const estate = codeInfo?.estate || "นิคมอุตสาหกรรมในจังหวัดระยอง/ชลบุรี";

    const site = await prisma.site.upsert({
      where: { code: shortCode },
      update: {
        name: fullName,
        contactName: contact,
        contactEmail: email,
        contactPhone: phone,
        estateName: estate,
        location: estate,
        workStart: workInfo.workStart,
        workEnd: workInfo.workEnd,
        otStart: workInfo.otStart,
        otEnd: workInfo.otEnd,
      },
      create: {
        code: shortCode,
        name: fullName,
        location: estate,
        estateName: estate,
        contactName: contact,
        contactEmail: email,
        contactPhone: phone,
        lat: 12.6841 + (Math.random() * 0.15 - 0.075),
        lng: 101.1476 + (Math.random() * 0.15 - 0.075),
        radius: 200,
        workStart: workInfo.workStart,
        workEnd: workInfo.workEnd,
        otStart: workInfo.otStart,
        otEnd: workInfo.otEnd,
      },
    });

    siteMap.set(shortCode, site.id);
  }

  console.log(`✅ Upserted ${siteMap.size} Customer & Branch Sites.`);

  // 4. Parse "เงินเดือน " Sheet for detailed payroll items
  const salarySheet = workbook.Sheets["เงินเดือน "];
  const salaryRows: any[][] = XLSX.utils.sheet_to_json(salarySheet, { header: 1 });
  const salaryMap = new Map<string, any>();

  for (let i = 3; i < salaryRows.length; i++) {
    const r = salaryRows[i];
    if (!r || !r[1]) continue;
    const empCode = String(r[1]).trim();

    const monthly = typeof r[5] === "number" ? r[5] : (parseFloat(String(r[5]).replace(/,/g, "")) || 0);
    const daily = typeof r[6] === "number" ? r[6] : (parseFloat(String(r[6]).replace(/,/g, "")) || 0);
    const ot1Rate = typeof r[7] === "number" ? r[7] : 50;
    const ot15Rate = typeof r[8] === "number" ? r[8] : 75;
    const ot2Rate = typeof r[9] === "number" ? r[9] : 100;
    const ot3Rate = typeof r[10] === "number" ? r[10] : 150;
    const travelAllow = typeof r[11] === "number" ? r[11] : (parseFloat(String(r[11]).replace(/,/g, "")) || 0);
    const mealAllow = typeof r[12] === "number" ? r[12] : 0;
    const otMealAllow = typeof r[13] === "number" ? r[13] : 0;
    
    // Heat allow: could be "วันทำงานx25" or number
    let heatAllow = 0;
    if (typeof r[14] === "number") heatAllow = r[14];
    else if (String(r[14]).includes("25")) heatAllow = 25 * 26;

    const dishwash = typeof r[15] === "number" ? r[15] : 0;
    const skillAllow = typeof r[16] === "number" ? r[16] : 0;
    const phoneAllow = typeof r[20] === "number" ? r[20] : 0;
    const positionAllow = typeof r[21] === "number" ? r[21] : 0;
    const houseAllow = typeof r[22] === "number" ? r[22] : 0;
    const coordAllow = typeof r[23] === "number" ? r[23] : 0;

    let diligence = 1000;
    if (typeof r[28] === "number") diligence = r[28];
    else if (String(r[28]).includes("1,200") || String(r[28]).includes("1200")) diligence = 1200;
    else if (String(r[28]).includes("1,000") || String(r[28]).includes("1000")) diligence = 1000;

    const socialSec = typeof r[29] === "number" ? r[29] : 600;
    const welfareDeduct = typeof r[31] === "number" ? r[31] : 30;

    salaryMap.set(empCode, {
      baseSalary: monthly > 0 ? monthly : 12000,
      dailyRate: daily > 0 ? daily : 400,
      salaryType: monthly > 0 ? "MONTHLY" : "DAILY",
      ot1Rate,
      ot15Rate,
      ot2Rate,
      ot3Rate,
      travelAllow,
      mealAllow,
      otMealAllow,
      heatAllow,
      dishwash,
      skillAllow,
      phoneAllow,
      positionAllow,
      houseAllow,
      coordAllow,
      diligence,
      socialSec,
      welfareDeduct,
    });
  }

  // 5. Parse Staff Permissions from "Staff_info"
  const staffSheet = workbook.Sheets["Staff_info"];
  const staffRows: any[][] = XLSX.utils.sheet_to_json(staffSheet, { header: 1 });
  const staffRoleMap = new Map<string, { role: string; permissions: string }>();

  for (let i = 1; i < staffRows.length; i++) {
    const sr = staffRows[i];
    if (!sr || !sr[1]) continue;
    const name = String(sr[1]).trim().replace(/\s+/g, " ");
    const perms = sr.slice(2).filter(Boolean).map(String).join(",");

    let role = "EMPLOYEE";
    if (perms.includes("ดูได้ทั้งหมด")) {
      role = "ADMIN";
    } else if (perms.includes("เงินเดือน")) {
      role = "HR";
    } else if (perms.includes("เอกสารส่งตัว")) {
      role = "HR";
    } else if (perms.includes("โอที") && perms.includes("Attendance")) {
      role = "SUPERVISOR";
    }

    staffRoleMap.set(name, { role, permissions: perms });
  }

  // 6. Parse Employees from "ประวัติพนักงาน J2K"
  const empSheet = workbook.Sheets["ประวัติพนักงาน J2K"];
  const empRows: any[][] = XLSX.utils.sheet_to_json(empSheet, { header: 1 });

  let createdEmpCount = 0;
  const processedCodes = new Set<string>();

  for (let i = 3; i < empRows.length; i++) {
    const row = empRows[i];
    if (!row || !row[1] || !row[2]) continue;

    const rawCode = String(row[1]).trim();
    if (processedCodes.has(rawCode)) continue;
    processedCodes.add(rawCode);

    const rawName = String(row[2]).trim();
    const position = row[3] ? String(row[3]).trim() : "พนักงานทำความสะอาด";
    const rawSiteCode = row[4] ? String(row[4]).trim().toUpperCase() : "AAM";
    const startDate = excelSerialToDate(row[5]);
    const birthDate = excelSerialToDate(row[6]);
    const genderStr = row[8] ? String(row[8]).trim() : "หญิง";
    const nationality = row[9] ? String(row[9]).trim() : "ไทย";
    const idCardNo = row[10] ? String(row[10]).trim() : null;
    const phone = row[11] ? String(row[11]).trim() : null;
    const bankAccount = row[12] ? String(row[12]).trim() : null;
    const bankName = row[13] ? String(row[13]).trim() : null;
    const hospital = row[14] ? String(row[14]).trim() : null;

    // Split prefix and name
    let prefix = "นางสาว";
    let fullName = rawName;
    if (rawName.startsWith("นาย")) {
      prefix = "นาย";
      fullName = rawName.substring(3).trim();
    } else if (rawName.startsWith("นางสาว")) {
      prefix = "นางสาว";
      fullName = rawName.substring(6).trim();
    } else if (rawName.startsWith("น.ส.")) {
      prefix = "นางสาว";
      fullName = rawName.substring(4).trim();
    } else if (rawName.startsWith("นาง")) {
      prefix = "นาง";
      fullName = rawName.substring(3).trim();
    }

    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(" ") || "";

    const targetSiteId = siteMap.get(rawSiteCode) || siteMap.get("AAM") || defaultSite.id;
    const sal = salaryMap.get(rawCode) || {
      baseSalary: 12000,
      dailyRate: 400,
      salaryType: "MONTHLY",
      ot15Rate: 75,
      travelAllow: 1000,
      diligence: 1000,
      socialSec: 600,
      welfareDeduct: 30,
    };

    const employee = await prisma.employee.upsert({
      where: { code: rawCode },
      update: {
        prefix,
        firstName,
        lastName,
        position,
        siteId: targetSiteId,
        startDate,
        birthDate,
        gender: genderStr.includes("ชาย") ? "MALE" : "FEMALE",
        nationality,
        idCardNo,
        phone,
        bankAccount,
        bankName,
        hospital,
        salaryType: sal.salaryType || "MONTHLY",
        baseSalary: sal.baseSalary,
        dailyRate: sal.dailyRate,
      },
      create: {
        code: rawCode,
        prefix,
        firstName,
        lastName,
        position,
        siteId: targetSiteId,
        startDate,
        birthDate,
        gender: genderStr.includes("ชาย") ? "MALE" : "FEMALE",
        nationality,
        idCardNo,
        phone,
        bankAccount,
        bankName,
        hospital,
        salaryType: sal.salaryType || "MONTHLY",
        baseSalary: sal.baseSalary,
        dailyRate: sal.dailyRate,
      },
    });

    createdEmpCount++;

    // Check staff permissions match
    const normalizedName = `${prefix} ${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
    const staffMatch = Array.from(staffRoleMap.entries()).find(([name]) => {
      const cleanStaff = name.replace(/\s+/g, "");
      const cleanEmp = `${prefix}${firstName}${lastName}`.replace(/\s+/g, "");
      return cleanEmp.includes(cleanStaff) || cleanStaff.includes(cleanEmp);
    });

    const userRole = staffMatch ? staffMatch[1].role : "EMPLOYEE";
    const userPerms = staffMatch ? staffMatch[1].permissions : "SELF";

    await prisma.user.upsert({
      where: { email: `${rawCode}@j2k.co.th` },
      update: {
        password: "Smartjeff2026",
        passwordHash: masterHash,
        role: userRole,
        permissions: userPerms,
        assignedSiteCode: rawSiteCode,
        employeeId: employee.id,
      },
      create: {
        email: `${rawCode}@j2k.co.th`,
        password: "Smartjeff2026",
        passwordHash: masterHash,
        role: userRole,
        permissions: userPerms,
        assignedSiteCode: rawSiteCode,
        employeeId: employee.id,
      },
    });

    // Attendance Log (Cycle 2026-09)
    await prisma.attendance.upsert({
      where: { localId: `att-seed-${rawCode}` },
      update: {},
      create: {
        employeeId: employee.id,
        localId: `att-seed-${rawCode}`,
        type: "CHECK_IN",
        timestamp: new Date("2026-09-21T06:55:00.000Z"),
        lat: 12.6841,
        lng: 101.1476,
        distance: 25,
        isWithinGeofence: true,
        isApproved: true,
        approvedBy: "หัวหน้างาน",
      },
    });

    // Official Payslip for 2026-09 matching J2K Housekeeping Slip structure
    const ot15Hours = 20;
    const ot15Amount = Math.round(ot15Hours * (sal.ot15Rate || 75));
    const grossIncome =
      sal.baseSalary +
      ot15Amount +
      (sal.travelAllow || 0) +
      (sal.diligence || 0) +
      (sal.positionAllow || 0) +
      (sal.phoneAllow || 0) +
      (sal.heatAllow || 0);

    const taxAmount = Math.round(sal.baseSalary * 0.01);
    const socSecAmount = sal.socialSec || Math.min(Math.round(sal.baseSalary * 0.05), 750);
    const welfareAmount = sal.welfareDeduct || 30;
    const totalDeduct = socSecAmount + taxAmount + welfareAmount;
    const netPay = grossIncome - totalDeduct;

    await prisma.payslip.upsert({
      where: {
        employeeId_period: {
          employeeId: employee.id,
          period: "2026-09",
        },
      },
      update: {
        baseSalary: sal.baseSalary,
        dailyRate: sal.dailyRate,
        otHours: ot15Hours,
        otAmount: ot15Amount,
        ot15Hours,
        ot15Amount,
        travelAllow: sal.travelAllow || 0,
        diligence: sal.diligence || 0,
        positionAllow: sal.positionAllow || 0,
        phoneAllow: sal.phoneAllow || 0,
        heatAllow: sal.heatAllow || 0,
        grossIncome,
        tax: taxAmount,
        socialSec: socSecAmount,
        welfareDeduct: welfareAmount,
        totalDeduct,
        netPay,
      },
      create: {
        employeeId: employee.id,
        period: "2026-09",
        baseSalary: sal.baseSalary,
        dailyRate: sal.dailyRate,
        otHours: ot15Hours,
        otAmount: ot15Amount,
        ot15Hours,
        ot15Amount,
        travelAllow: sal.travelAllow || 0,
        diligence: sal.diligence || 0,
        positionAllow: sal.positionAllow || 0,
        phoneAllow: sal.phoneAllow || 0,
        heatAllow: sal.heatAllow || 0,
        otherIncome: 0,
        grossIncome,
        tax: taxAmount,
        socialSec: socSecAmount,
        welfareDeduct: welfareAmount,
        otherDeduct: 0,
        totalDeduct,
        netPay,
      },
    });
  }

  // 7. Seed Admin, Executive, HR, Coordinator, and Supervisor Users
  const staffToSeed = [
    {
      email: "admin@j2k.co.th",
      displayName: "นายปณิธาน ลานทองกุล (ผู้บริหารสูงสุด)",
      role: "ADMIN",
      permissions: "ALL",
    },
    {
      email: "panithan@j2k.co.th",
      displayName: "นายปณิธาน ลานทองกุล",
      role: "ADMIN",
      permissions: "ALL",
    },
    {
      email: "121095@j2k.co.th",
      displayName: "น.ส.ยุพดี วะโร (Finance & Accounting)",
      role: "HR",
      permissions: "เวลาเข้า-ออก,เงินเดือน,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    },
    {
      email: "120001@j2k.co.th",
      displayName: "นางเนตรนภา อินทร์ผลเล็ก (ผู้จัดการทั่วไป)",
      role: "HR",
      permissions: "เวลาเข้า-ออก,เงินเดือน,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    },
    {
      email: "120886@j2k.co.th",
      displayName: "นางสาวอรอุมา วิเวช (ฝ่ายประสานงาน)",
      role: "COORDINATOR",
      permissions: "เวลาเข้า-ออก,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    },
    {
      email: "chuleeporn@j2k.co.th",
      displayName: "นางสาวชุลีพร แซ่เอี๊ยว (ฝ่ายประสานงาน)",
      role: "COORDINATOR",
      permissions: "เวลาเข้า-ออก,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    },
    {
      email: "120150@j2k.co.th",
      displayName: "นางสาวสริญญา ชะนิดนอก (หัวหน้าแม่บ้าน AAM)",
      role: "SUPERVISOR",
      permissions: "โอที,Attendance,เวลาทำงาน",
      assignedSiteCode: "AAM",
    },
    {
      email: "120116@j2k.co.th",
      displayName: "นางจิราภา ชินบุตร (หัวหน้างาน BW)",
      role: "SUPERVISOR",
      permissions: "โอที,Attendance,เวลาทำงาน",
      assignedSiteCode: "BW",
    },
  ];

  for (const s of staffToSeed) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {
        role: s.role,
        permissions: s.permissions,
        displayName: s.displayName,
        password: "Smartjeff2026",
        passwordHash: masterHash,
        assignedSiteCode: s.assignedSiteCode || null,
      },
      create: {
        email: s.email,
        password: "Smartjeff2026",
        passwordHash: masterHash,
        displayName: s.displayName,
        role: s.role,
        permissions: s.permissions,
        assignedSiteCode: s.assignedSiteCode || null,
      },
    });
  }

  console.log(`✅ Successfully seeded ${createdEmpCount} Employees from jeffy1.xlsx into SQLite!`);
  console.log("🎉 All J2K customer sites, staff permission tiers, and payslips initialized!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
