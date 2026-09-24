import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Generating employee import template...");

  // Fetch sites for reference sheet
  const sites = await prisma.site.findMany({
    select: { code: true, name: true, estateName: true },
    orderBy: { code: "asc" },
  });

  // Sheet 1: Template data headers and sample rows
  const headers = [
    "รหัสพนักงาน*",
    "คำนำหน้า",
    "ชื่อ*",
    "นามสกุล*",
    "สัญชาติ*",
    "เบอร์โทรศัพท์*",
    "เลขบัตรประชาชน/พาสปอร์ต*",
    "วันเกิด (ปปปป-ดด-วว)",
    "วันที่เริ่มงาน (ปปปป-ดด-วว)",
    "เพศ",
    "รหัสไซต์งาน*",
    "ตำแหน่งงาน*",
    "ประเภทค่าจ้าง",
    "เงินเดือนพื้นฐาน (บาท)",
    "ค่าแรงรายวัน (บาท)",
    "สิทธิการรักษา",
    "โรงพยาบาล",
    "ธนาคาร",
    "เลขที่บัญชี",
    "วุฒิการศึกษา",
    "ภูมิลำเนา",
  ];

  const sampleRows = [
    [
      "120189",
      "นาง",
      "พัดมา",
      "เชื้อวังคำ",
      "ไทย",
      "098-451-3766",
      "3490400109281",
      "1971-01-29",
      "2023-05-01",
      "หญิง",
      "AAM",
      "แม่บ้าน",
      "รายเดือน",
      12000,
      400,
      "ปกส.",
      "รพ.ระยอง",
      "ไทยพาณิชย์",
      "4361656289",
      "ม.3",
      "ระยอง",
    ],
    [
      "210993",
      "นาย",
      "กิมเอิน",
      "อีท",
      "กัมพูชา",
      "061-983-3706",
      "22971009777",
      "1990-06-02",
      "2023-06-15",
      "ชาย",
      "AAM",
      "พนักงานทำความสะอาด",
      "รายวัน",
      0,
      420,
      "ชำระเงินเอง",
      "รพ.ชลบุรี",
      "กสิกรไทย",
      "0528491023",
      "ประถม",
      "เสียมราฐ",
    ],
    [
      "310973",
      "นาย",
      "นาย",
      "มิน",
      "พม่า",
      "065-982-3210",
      "6682190002302",
      "1995-11-20",
      "2024-01-10",
      "ชาย",
      "BAT",
      "พนักงานทั่วไป",
      "รายวัน",
      0,
      400,
      "ปกส.",
      "รพ.ระยอง",
      "กรุงเทพ",
      "1234567890",
      "ม.6",
      "ย่างกุ้ง",
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const ws1 = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws1["!cols"] = [
    { wch: 16 }, // รหัสพนักงาน*
    { wch: 10 }, // คำนำหน้า
    { wch: 18 }, // ชื่อ*
    { wch: 20 }, // นามสกุล*
    { wch: 12 }, // สัญชาติ*
    { wch: 18 }, // เบอร์โทรศัพท์*
    { wch: 26 }, // เลขบัตร/พาสปอร์ต*
    { wch: 20 }, // วันเกิด
    { wch: 20 }, // วันที่เริ่มงาน
    { wch: 10 }, // เพศ
    { wch: 16 }, // รหัสไซต์งาน*
    { wch: 20 }, // ตำแหน่งงาน*
    { wch: 14 }, // ประเภทค่าจ้าง
    { wch: 20 }, // เงินเดือนพื้นฐาน
    { wch: 18 }, // ค่าแรงรายวัน
    { wch: 16 }, // สิทธิรักษา
    { wch: 22 }, // โรงพยาบาล
    { wch: 16 }, // ธนาคาร
    { wch: 18 }, // เลขที่บัญชี
    { wch: 14 }, // วุฒิการศึกษา
    { wch: 18 }, // ภูมิลำเนา
  ];

  // Sheet 2: Guide & Reference Data
  const guideHeaders = ["หมวดหมู่ / หัวข้อ", "ค่าที่ระบบยอมรับ", "คำอธิบาย / ตัวอย่าง"];
  const guideData = [
    guideHeaders,
    ["ช่องที่มีเครื่องหมายดอกจัน (*)", "จำเป็นต้องกรอก", "ต้องระบุข้อมูล ห้ามเว้นว่าง มิฉะนั้นระบบจะข้ามแถวนั้น"],
    ["สัญชาติ*", "ไทย, กัมพูชา, พม่า", "ระบุ 'ไทย' สำหรับคนไทย, 'กัมพูชา' หรือ 'พม่า' สำหรับแรงงานต่างด้าว"],
    ["เบอร์โทรศัพท์*", "ตัวเลข 9-10 หลัก", "ตัวอย่าง: 098-451-3766 หรือ 0984513766 (สำคัญมาก สำหรับการติดต่อและแสดงผล)"],
    ["เลขบัตรประชาชน/พาสปอร์ต*", "ตัวเลข 13 หลัก (คนไทย) หรือเลขพาสปอร์ต/บัตรต่างด้าว", "คนไทยระบุเลข 13 หลัก ต่างด้าวระบุเลขประจำตัวหนังสือเดินทางหรือบัตรสีชมพู"],
    ["วันเกิด และ วันเริ่มงาน", "YYYY-MM-DD หรือ วว/ดด/ปปปป", "ตัวอย่าง: 1990-01-29 หรือ 29/01/2533 ระบบจะคำนวณอายุให้อัตโนมัติ"],
    ["เพศ", "ชาย, หญิง หรือ MALE, FEMALE", "หากเว้นว่างจะกำหนดเป็น 'ชาย' โดยอัตโนมัติ"],
    ["ประเภทค่าจ้าง", "รายเดือน หรือ รายวัน (MONTHLY / DAILY)", "หากเลือกรายเดือนให้กรอกเงินเดือนพื้นฐาน หากเลือกรายวันให้กรอกค่าแรงรายวัน"],
    ["รหัสไซต์งาน*", "ดูรหัสไซต์งานที่อนุญาตด้านล่าง", "ต้องตรงกับรหัสไซต์งานที่มีอยู่ในระบบ เช่น AAM, BAT, J2K-HQ ฯลฯ"],
    ["", "", ""],
    ["=== ตารางรหัสไซต์งานในระบบ (Site Codes Reference) ===", "", ""],
    ["รหัสไซต์งาน (Site Code)", "ชื่อไซต์งาน / บริษัทลูกค้า", "นิคมอุตสาหกรรม / ที่ตั้ง"],
  ];

  sites.forEach((site) => {
    guideData.push([site.code, site.name, site.estateName || "-"]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(guideData);
  ws2["!cols"] = [{ wch: 28 }, { wch: 45 }, { wch: 40 }];

  // Build Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, "รายชื่อพนักงาน");
  XLSX.utils.book_append_sheet(wb, ws2, "คำแนะนำและรหัสไซต์งาน");

  // Output paths
  const publicDir = path.join(process.cwd(), "public", "templates");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, "employee_import_template.xlsx");
  XLSX.writeFile(wb, outputPath);

  console.log(`✅ Template successfully generated at: ${outputPath}`);
}

main()
  .catch((e) => {
    console.error("Error generating template:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
