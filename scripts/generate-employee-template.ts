import * as XLSX from "xlsx";
import * as fs from "node:fs";

// Deliberately independent of every database and staff export.
const headers = ["รหัสพนักงาน*", "คำนำหน้า", "ชื่อ*", "นามสกุล*", "สัญชาติ*", "เบอร์โทรศัพท์*",
  "เลขบัตรประชาชน/พาสปอร์ต*", "วันเกิด (ปปปป-ดด-วว)", "วันที่เริ่มงาน (ปปปป-ดด-วว)", "เพศ",
  "รหัสไซต์งาน*", "ตำแหน่งงาน*", "ประเภทค่าจ้าง", "เงินเดือนพื้นฐาน (บาท)", "ค่าแรงรายวัน (บาท)",
  "สิทธิการรักษา", "โรงพยาบาล", "ธนาคาร", "เลขที่บัญชี", "วุฒิการศึกษา", "ภูมิลำเนา"];
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers]), "Employees");
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
  ["Instructions"], ["Blank import template. Supply employee information privately; never commit completed files."],
]), "Instructions");
fs.mkdirSync("public/templates", { recursive: true });
fs.writeFileSync("public/templates/employee_import_template.xlsx", XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
console.log("Blank employee import template generated without personal data.");
