import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting SMARTO database seed from jeffsallary.xlsx...");

  // Reset database tables
  await prisma.user.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.payslip.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.site.deleteMany({});

  const excelPath = path.join(__dirname, "../jeffsallary.xlsx");
  const workbook = XLSX.readFile(excelPath);

  // 1. Seed Customer Sites & Work Hours
  const customerSheet = workbook.Sheets["Customer"];
  const customerRows: any[] = XLSX.utils.sheet_to_json(customerSheet);

  const workSheet = workbook.Sheets["เวลา -เข้าออกงาน"];
  const workRows: any[] = XLSX.utils.sheet_to_json(workSheet);
  const workHoursMap = new Map<string, any>();

  for (const w of workRows) {
    const code = w.__EMPTY_1 || w.siteCode;
    if (code) {
      workHoursMap.set(String(code).trim().toUpperCase(), {
        workStart: w["เวลาเข้าทำงาน"] ? parseFloat(w["เวลาเข้าทำงาน"]) : 7,
        workEnd: w["เวลาออกทำงาน"] ? parseFloat(w["เวลาออกทำงาน"]) : 16,
        otStart: w["เวลาเข้าโอที"] ? parseFloat(w["เวลาเข้าโอที"]) : 16,
        otEnd: w["เวลาออกโอที"] ? parseFloat(w["เวลาออกโอที"]) : 17,
      });
    }
  }

  const siteMap = new Map<string, string>(); // Code -> ID

  // Default AAM site
  const defaultSite = await prisma.site.upsert({
    where: { code: "AAM" },
    update: {},
    create: {
      code: "AAM",
      name: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด",
      location: "นิคมอุตสาหกรรมมาบตาพุด ระยอง",
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

  for (const c of customerRows) {
    const siteCode = c["ตัวย่อโรงงาน"] || (c.CODE ? String(c.CODE) : null);
    const siteName = c["ชื่อเต็มโรงงาน"] || siteCode;
    if (!siteCode || !siteName) continue;

    const cleanCode = String(siteCode).trim().toUpperCase();
    const workInfo = workHoursMap.get(cleanCode) || { workStart: 7, workEnd: 16, otStart: 16, otEnd: 17 };

    const site = await prisma.site.upsert({
      where: { code: cleanCode },
      update: {
        name: String(siteName).trim(),
      },
      create: {
        code: cleanCode,
        name: String(siteName).trim(),
        location: "จังหวัดระยอง / ชลบุรี",
        lat: 12.6841 + (Math.random() * 0.1 - 0.05),
        lng: 101.1476 + (Math.random() * 0.1 - 0.05),
        radius: 200,
        workStart: workInfo.workStart,
        workEnd: workInfo.workEnd,
        otStart: workInfo.otStart,
        otEnd: workInfo.otEnd,
      },
    });

    siteMap.set(cleanCode, site.id);
  }

  console.log(`✅ Upserted ${siteMap.size} Customer Sites from Excel.`);

  // 2. Parse Employees from "ประวัติพนักงาน J2K"
  const empSheet = workbook.Sheets["ประวัติพนักงาน J2K"];
  const empRows: any[][] = XLSX.utils.sheet_to_json(empSheet, { header: 1 });

  // Read Salary sheet for base salary & daily rate
  const salarySheet = workbook.Sheets["เงินเดือน "];
  const salaryRows: any[][] = XLSX.utils.sheet_to_json(salarySheet, { header: 1 });
  const salaryMap = new Map<string, { baseSalary: number; dailyRate: number }>();

  for (let i = 3; i < salaryRows.length; i++) {
    const r = salaryRows[i];
    if (!r || !r[1]) continue;
    const code = String(r[1]).trim();
    const monthly = r[4] ? parseFloat(r[4]) : 0;
    const daily = r[5] ? parseFloat(r[5]) : 0;
    salaryMap.set(code, {
      baseSalary: monthly > 0 ? monthly : 12000,
      dailyRate: daily > 0 ? daily : 400,
    });
  }

  let createdEmpCount = 0;
  const processedCodes = new Set<string>();
  const processedIdCards = new Set<string>();

  for (let i = 3; i < empRows.length; i++) {
    const row = empRows[i];
    if (!row || !row[1] || !row[2]) continue;

    const rawCode = String(row[1]).trim();
    if (processedCodes.has(rawCode)) continue;
    processedCodes.add(rawCode);

    const rawName = String(row[2]).trim();
    const position = row[3] ? String(row[3]).trim() : "พนักงานทำความสะอาด";
    const rawSiteCode = row[4] ? String(row[4]).trim().toUpperCase() : "AAM";
    const genderStr = row[8] ? String(row[8]).trim() : "หญิง";
    const nationality = row[9] ? String(row[9]).trim() : "ไทย";
    
    let idCardNo = row[10] ? String(row[10]).trim() : null;
    if (idCardNo) {
      if (processedIdCards.has(idCardNo)) {
        idCardNo = null;
      } else {
        processedIdCards.add(idCardNo);
      }
    }
    const phone = row[11] ? String(row[11]).trim() : null;
    const bankAccount = row[12] ? String(row[12]).trim() : null;
    const bankName = row[13] ? String(row[13]).trim() : null;
    const hospital = row[15] ? String(row[15]).trim() : null;

    // Split Name into prefix, firstName, lastName
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

    const targetSiteId = siteMap.get(rawSiteCode) || defaultSite.id;
    const salInfo = salaryMap.get(rawCode) || { baseSalary: 12000, dailyRate: 400 };

    const employee = await prisma.employee.upsert({
      where: { code: rawCode },
      update: {
        firstName,
        lastName,
        position,
        siteId: targetSiteId,
        phone,
        bankAccount,
        bankName,
        hospital,
        baseSalary: salInfo.baseSalary,
        dailyRate: salInfo.dailyRate,
      },
      create: {
        code: rawCode,
        prefix,
        firstName,
        lastName,
        position,
        siteId: targetSiteId,
        gender: genderStr.includes("ชาย") ? "MALE" : "FEMALE",
        nationality,
        idCardNo,
        phone,
        bankAccount,
        bankName,
        hospital,
        salaryType: salInfo.baseSalary > 0 ? "MONTHLY" : "DAILY",
        baseSalary: salInfo.baseSalary,
        dailyRate: salInfo.dailyRate,
      },
    });

    createdEmpCount++;

    // 3. Generate initial Attendance logs & Payslips for 2026-09
    await prisma.attendance.upsert({
      where: { localId: `seed-att-${rawCode}` },
      update: {},
      create: {
        employeeId: employee.id,
        localId: `seed-att-${rawCode}`,
        type: "CHECK_IN",
        timestamp: new Date("2026-09-16T07:45:00.000Z"),
        lat: 12.6841,
        lng: 101.1476,
        distance: 45,
        isWithinGeofence: true,
        isApproved: true,
      },
    });

    // Seed Payslip for 2026-09
    const baseSal = salInfo.baseSalary;
    const socialSec = Math.min(Math.round(baseSal * 0.05), 750);
    const tax = Math.round(baseSal * 0.01);
    const otAmount = 1500;
    const diligence = 1000;
    const netPay = baseSal + otAmount + diligence - socialSec - tax;

    await prisma.payslip.upsert({
      where: {
        employeeId_period: {
          employeeId: employee.id,
          period: "2026-09",
        },
      },
      update: {
        baseSalary: baseSal,
        otAmount,
        diligence,
        socialSec,
        tax,
        netPay,
      },
      create: {
        employeeId: employee.id,
        period: "2026-09",
        baseSalary: baseSal,
        otHours: 10,
        otAmount,
        travelAllow: 500,
        diligence,
        otherIncome: 0,
        socialSec,
        tax,
        otherDeduct: 0,
        netPay,
      },
    });
  }

  console.log(`✅ Successfully seeded ${createdEmpCount} Employees, Users, Attendance Logs & Payslips from jeffsallary.xlsx!`);
  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
