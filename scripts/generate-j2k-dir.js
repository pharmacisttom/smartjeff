const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile('jeffy1.xlsx');
const empSheet = wb.Sheets['ประวัติพนักงาน J2K'];
const empRows = XLSX.utils.sheet_to_json(empSheet, { header: 1 });

const employees = [];
const seenCodes = new Set();

for (let i = 3; i < empRows.length; i++) {
  const r = empRows[i];
  if (!r || !r[1] || !r[2]) continue;
  const code = String(r[1]).trim();
  if (seenCodes.has(code)) continue;
  seenCodes.add(code);
  const fullName = String(r[2]).trim().replace(/\s+/g, ' ');
  const position = r[3] ? String(r[3]).trim() : 'พนักงานทำความสะอาด';
  const siteCode = r[4] ? String(r[4]).trim().toUpperCase() : 'AAM';
  const phone = r[11] ? String(r[11]).trim() : '';
  employees.push({ code, name: fullName, position, siteCode, phone });
}

console.log('Extracted employees:', employees.length);

const content = `// J2K Staff Directory & Master Authentication Catalog
// Built from jeffy1.xlsx with complete permission & role mapping

export interface J2KUserRecord {
  id: string;
  email: string;
  code?: string;
  name: string;
  role: "ADMIN" | "HR" | "COORDINATOR" | "SUPERVISOR" | "EMPLOYEE";
  department?: string;
  position?: string;
  siteCode?: string;
  permissions: string;
  redirectTo: string;
}

export const J2K_STAFF_SPECIAL: J2KUserRecord[] = [
  {
    id: "user_admin_001",
    email: "admin@j2k.co.th",
    name: "นายปณิธาน ลานทองกุล (ผู้บริหารสูงสุด)",
    role: "ADMIN",
    department: "EXECUTIVE",
    position: "ประธานเจ้าหน้าที่บริหาร (CEO)",
    permissions: "ALL",
    redirectTo: "/admin/dashboard",
  },
  {
    id: "user_admin_002",
    email: "panithan@j2k.co.th",
    name: "นายปณิธาน ลานทองกุล",
    role: "ADMIN",
    department: "EXECUTIVE",
    position: "ประธานเจ้าหน้าที่บริหาร (CEO)",
    permissions: "ALL",
    redirectTo: "/admin/dashboard",
  },
  {
    id: "user_admin_003",
    email: "assana@j2k.co.th",
    name: "นางอัศนา ธรรมถาวร",
    role: "ADMIN",
    department: "EXECUTIVE",
    position: "ผู้บริหารระดับสูง",
    permissions: "ALL",
    redirectTo: "/admin/dashboard",
  },
  {
    id: "user_hr_121095",
    email: "121095@j2k.co.th",
    code: "121095",
    name: "น.ส.ยุพดี วะโร",
    role: "HR",
    department: "HR/Payroll",
    position: "Finance & Accounting",
    siteCode: "J2K-HQ",
    permissions: "เวลาเข้า-ออก,เงินเดือน,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    redirectTo: "/admin/payroll",
  },
  {
    id: "user_hr_120001",
    email: "120001@j2k.co.th",
    code: "120001",
    name: "นางเนตรนภา อินทร์ผลเล็ก",
    role: "HR",
    department: "HR/Payroll",
    position: "ผู้จัดการทั่วไป (General Manager)",
    siteCode: "J2K-HQ",
    permissions: "เวลาเข้า-ออก,เงินเดือน,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    redirectTo: "/admin/payroll",
  },
  {
    id: "user_coord_120886",
    email: "120886@j2k.co.th",
    code: "120886",
    name: "นางสาวอรอุมา วิเวช",
    role: "COORDINATOR",
    department: "Coordinator",
    position: "ฝ่ายประสานงานไซต์ (Site Coordinator)",
    siteCode: "J2K-HQ",
    permissions: "เวลาเข้า-ออก,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    redirectTo: "/admin/dashboard",
  },
  {
    id: "user_coord_chuleeporn",
    email: "chuleeporn@j2k.co.th",
    code: "chuleeporn",
    name: "นางสาวชุลีพร แซ่เอี๊ยว",
    role: "COORDINATOR",
    department: "Coordinator",
    position: "ฝ่ายประสานงาน (Coordinator)",
    siteCode: "J2K-HQ",
    permissions: "เวลาเข้า-ออก,Attendance,slip,ประวัติ,Customer,โอที,เวลาทำงาน,เอกสารส่งตัว",
    redirectTo: "/admin/dashboard",
  },
  {
    id: "user_sup_120150",
    email: "120150@j2k.co.th",
    code: "120150",
    name: "นางสาวสริญญา ชะนิดนอก",
    role: "SUPERVISOR",
    department: "Operations",
    position: "หัวหน้าแม่บ้านประจำไซต์ AAM",
    siteCode: "AAM",
    permissions: "โอที,Attendance,เวลาทำงาน",
    redirectTo: "/operations",
  },
  {
    id: "user_sup_120116",
    email: "120116@j2k.co.th",
    code: "120116",
    name: "นางจิราภา ชินบุตร",
    role: "SUPERVISOR",
    department: "Operations",
    position: "หัวหน้างานประจำไซต์ BW",
    siteCode: "BW",
    permissions: "โอที,Attendance,เวลาทำงาน",
    redirectTo: "/operations",
  },
];

export const J2K_ALL_EMPLOYEES: { code: string; name: string; position: string; siteCode: string; phone: string }[] = ` + JSON.stringify(employees, null, 2) + `;

export function findJ2KDirectoryUser(identifier: string): J2KUserRecord | null {
  const clean = identifier.trim().toLowerCase();
  const raw = identifier.trim();

  // 1. Direct match on special staff
  for (const s of J2K_STAFF_SPECIAL) {
    if (s.email.toLowerCase() === clean) return s;
    if (s.code && (s.code.toLowerCase() === clean || s.code === raw)) return s;
  }

  // 2. Check if clean matches <empCode>@j2k.co.th or raw is empCode
  let codeMatch = "";
  if (clean.endsWith("@j2k.co.th")) {
    codeMatch = clean.replace("@j2k.co.th", "");
  } else {
    codeMatch = clean;
  }

  const emp = J2K_ALL_EMPLOYEES.find((e) => e.code.toLowerCase() === codeMatch || e.phone === raw);
  if (emp) {
    // Check if employee is in special staff
    const special = J2K_STAFF_SPECIAL.find((s) => s.code === emp.code);
    if (special) return special;

    // Detect if position indicates supervisor
    const isSupervisor =
      emp.position.includes("หัวหน้า") ||
      emp.position.includes("Supervisor") ||
      emp.position.includes("Leader");

    return {
      id: "emp_user_" + emp.code,
      email: emp.code + "@j2k.co.th",
      code: emp.code,
      name: emp.name,
      role: isSupervisor ? "SUPERVISOR" : "EMPLOYEE",
      position: emp.position,
      siteCode: emp.siteCode,
      permissions: isSupervisor ? "โอที,Attendance,เวลาทำงาน" : "check-in,leave,payslip",
      redirectTo: isSupervisor ? "/operations" : "/check-in",
    };
  }

  // 3. Fallback for admin aliases
  if (clean === "admin" || clean === "panithan") {
    return J2K_STAFF_SPECIAL[0];
  }

  return null;
}
`;

fs.writeFileSync(path.join(__dirname, '../src/lib/j2k-directory.ts'), content, 'utf8');
console.log('Successfully written src/lib/j2k-directory.ts');
