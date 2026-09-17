export const PERMISSIONS = {
  // ========== EMPLOYEE ==========
  "employee.read": { category: "employee", level: 4, label: "ดูประวัติตัวเอง" },
  "employee.read.team": { category: "employee", level: 3, label: "ดูข้อมูลพนักงานในทีม" },
  "employee.read.all": { category: "employee", level: 2, label: "ดูข้อมูลพนักงานทั้งหมด" },
  "employee.create": { category: "employee", level: 2, label: "เพิ่มพนักงานใหม่" },
  "employee.update": { category: "employee", level: 2, label: "แก้ไขข้อมูลพนักงาน" },
  "employee.delete": { category: "employee", level: 1, label: "ลบพนักงานออกจากระบบ" },

  // ========== ATTENDANCE ==========
  "attendance.checkin": { category: "attendance", level: 4, label: "ลงเวลาเข้า/ออกงาน" },
  "attendance.read.self": { category: "attendance", level: 4, label: "ดูประวัติลงเวลาตัวเอง" },
  "attendance.read.team": { category: "attendance", level: 3, label: "ดูประวัติลงเวลาทีม" },
  "attendance.read.all": { category: "attendance", level: 2, label: "ดูประวัติลงเวลาทั้งหมด" },
  "attendance.approve": { category: "attendance", level: 3, label: "อนุมัติเวลานอกพื้นที่ Geofence" },
  "attendance.edit": { category: "attendance", level: 2, label: "แก้ไขประวัติเวลาย้อนหลัง" },
  "attendance.override": { category: "attendance", level: 1, label: "ข้ามการตรวจสอบ Geofence ทุกไซต์" },

  // ========== LEAVE / OT ==========
  "leave.request": { category: "leave", level: 4, label: "ยื่นใบลาและขอ OT" },
  "leave.approve.team": { category: "leave", level: 3, label: "อนุมัติการลา/OT ของทีม" },
  "leave.approve.all": { category: "leave", level: 2, label: "อนุมัติการลา/OT ทั้งบริษัท" },
  "leave.config": { category: "leave", level: 2, label: "ตั้งค่าประเภทการลาและวันหยุด" },

  // ========== PAYROLL ==========
  "payroll.read.self": { category: "payroll", level: 4, label: "ดูสลิปเงินเดือนตัวเอง" },
  "payroll.read.all": { category: "payroll", level: 2, label: "ดูสลิปเงินเดือนพนักงานทุกคน" },
  "payroll.calculate": { category: "payroll", level: 2, label: "คำนวณเงินเดือนประจำงวด" },
  "payroll.approve": { category: "payroll", level: 2, label: "อนุมัติจ่ายเงินเดือน" },
  "payroll.export": { category: "payroll", level: 2, label: "ส่งออกไฟล์โอนเงินธนาคาร" },
  "payroll.config": { category: "payroll", level: 2, label: "ตั้งค่าอัตรา OT และประกันสังคม" },

  // ========== SITE ==========
  "site.read": { category: "site", level: 4, label: "ดูไซต์งาน" },
  "site.create": { category: "site", level: 2, label: "สร้างไซต์งานใหม่" },
  "site.update": { category: "site", level: 2, label: "แก้ไขไซต์งาน" },
  "site.delete": { category: "site", level: 1, label: "ลบไซต์งาน" },
  "site.config.geofence": { category: "site", level: 2, label: "ตั้งค่ารัศมีพิกัด Geofence" },

  // ========== NOTIFICATION ==========
  "notification.read": { category: "notification", level: 3, label: "ดูการแจ้งเตือน" },
  "notification.config": { category: "notification", level: 2, label: "ตั้งค่าช่องทาง LINE/Telegram/Email" },
  "notification.test": { category: "notification", level: 2, label: "ทดสอบส่งการแจ้งเตือน" },
  "notification.send": { category: "notification", level: 2, label: "ส่งข้อความประกาศถึงพนักงาน" },

  // ========== REPORT ==========
  "report.daily": { category: "report", level: 3, label: "ดูรายงานสรุปประจำวัน" },
  "report.weekly": { category: "report", level: 2, label: "ดูรายงานประจำสัปดาห์" },
  "report.monthly": { category: "report", level: 2, label: "ดูรายงานประจำเดือน" },
  "report.export": { category: "report", level: 2, label: "ส่งออกรายงาน Excel/PDF" },
  "report.executive": { category: "report", level: 2, label: "ดูรายงานภาพรวมผู้บริหาร" },

  // ========== USER MANAGEMENT ==========
  "user.read.self": { category: "user", level: 4, label: "ดูโปรไฟล์ตัวเอง" },
  "user.read.team": { category: "user", level: 3, label: "ดูบัญชีผู้ใช้ในทีม" },
  "user.read.all": { category: "user", level: 2, label: "ดูบัญชีผู้ใช้ทั้งหมด" },
  "user.create": { category: "user", level: 2, label: "สร้างบัญชีผู้ใช้" },
  "user.update": { category: "user", level: 2, label: "แก้ไขข้อมูลผู้ใช้" },
  "user.delete": { category: "user", level: 1, label: "ลบบัญชีผู้ใช้" },
  "user.role.assign": { category: "user", level: 2, label: "กำหนดบทบาทสิทธิ์ใช้งาน" },
  "user.role.assign.superadmin": { category: "user", level: 1, label: "แต่งตั้ง Superadmin" },

  // ========== API KEYS ==========
  "apikey.read.own": { category: "apikey", level: 2, label: "ดู API Keys ของบริษัท" },
  "apikey.read.all": { category: "apikey", level: 1, label: "ดู API Keys ทั้งระบบ" },
  "apikey.create": { category: "apikey", level: 2, label: "สร้าง API Key ใหม่" },
  "apikey.create.system": { category: "apikey", level: 1, label: "สร้าง System API Key" },
  "apikey.revoke": { category: "apikey", level: 2, label: "ยกเลิก API Key" },

  // ========== OPERATIONS & LIVE COMMAND CENTER ==========
  "operations.live.read": { category: "operations", level: 2, label: "ดูหน้าบัญชาการปฏิบัติการสด (Live Command Center)" },

  // ========== SYSTEM & LICENSE ==========
  "system.audit.read": { category: "system", level: 1, label: "ดู Audit Logs ทั้งระบบ" },
  "system.health": { category: "system", level: 1, label: "ดูสถานะเซิร์ฟเวอร์ System Health" },
  "system.license": { category: "system", level: 1, label: "จัดการ License และสัญญา" },
} as const;

export type PermissionCode = keyof typeof PERMISSIONS;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  SUPERADMIN: Object.keys(PERMISSIONS) as PermissionCode[],

  ADMIN: [
    "employee.read.all", "employee.create", "employee.update",
    "attendance.read.all", "attendance.approve", "attendance.edit",
    "leave.approve.all", "leave.config",
    "payroll.read.all", "payroll.calculate", "payroll.approve", "payroll.export", "payroll.config",
    "site.read", "site.create", "site.update", "site.config.geofence",
    "notification.read", "notification.config", "notification.test", "notification.send",
    "report.daily", "report.weekly", "report.monthly", "report.export", "report.executive",
    "user.read.all", "user.create", "user.update", "user.role.assign",
    "apikey.read.own", "apikey.create", "apikey.revoke",
    "operations.live.read",
  ],

  EXECUTIVE: [
    "employee.read.all",
    "attendance.read.all",
    "site.read",
    "report.daily", "report.weekly", "report.monthly", "report.export", "report.executive",
    "operations.live.read",
  ],

  HR: [
    "employee.read.all", "employee.create", "employee.update",
    "attendance.read.all", "attendance.approve", "attendance.edit",
    "leave.approve.all", "leave.config",
    "payroll.read.all", "payroll.calculate", "payroll.approve", "payroll.export", "payroll.config",
    "site.read",
    "report.daily", "report.weekly", "report.monthly", "report.export", "report.executive",
    "operations.live.read",
  ],

  SITE_MANAGER: [
    "employee.read.team", "employee.read.all",
    "attendance.read.team", "attendance.read.all", "attendance.approve",
    "leave.approve.team",
    "site.read", "site.update",
    "report.daily", "report.weekly",
    "operations.live.read",
  ],

  SUPERVISOR: [
    "employee.read.team", "employee.read.all",
    "attendance.read.team", "attendance.read.all", "attendance.approve",
    "leave.approve.team",
    "site.read",
    "report.daily", "report.weekly",
    "user.read.team",
    "notification.read",
  ],

  USER: [
    "employee.read",
    "attendance.checkin", "attendance.read.self",
    "leave.request",
    "payroll.read.self",
    "user.read.self",
    "report.daily",
  ],
};
