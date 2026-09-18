import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PermDef {
  code: string;
  module: string;
  action: string;
  description: string;
  sensitivity?: "NORMAL" | "SENSITIVE" | "CRITICAL";
}

const PERMISSIONS: PermDef[] = [
  // Dashboard
  { code: "dashboard.read", module: "Dashboard", action: "VIEW", description: "ดูภาพรวมแดชบอร์ดผู้บริหาร" },
  { code: "dashboard.export", module: "Dashboard", action: "EXPORT", description: "ส่งออกรายงานสรุปแดชบอร์ด" },

  // Employee
  { code: "employee.read", module: "Employee", action: "VIEW", description: "ดูรายชื่อและข้อมูลพนักงานพื้นฐาน" },
  { code: "employee.create", module: "Employee", action: "CREATE", description: "เพิ่มข้อมูลพนักงานใหม่" },
  { code: "employee.update", module: "Employee", action: "EDIT", description: "แก้ไขข้อมูลพนักงาน" },
  { code: "employee.delete", module: "Employee", action: "DELETE", description: "ลบหรือระงับข้อมูลพนักงาน", sensitivity: "CRITICAL" },
  { code: "employee.code.read", module: "Employee", action: "VIEW", description: "ดูรหัสพนักงาน (Employee Code Unmasked)", sensitivity: "SENSITIVE" },
  { code: "employee.phone.read", module: "Employee", action: "VIEW", description: "ดูเบอร์โทรศัพท์พนักงาน", sensitivity: "SENSITIVE" },
  { code: "employee.salary.read", module: "Employee", action: "VIEW", description: "ดูอัตราค่าแรงและเงินเดือนพนักงาน", sensitivity: "CRITICAL" },
  { code: "employee.bank.read", module: "Employee", action: "VIEW", description: "ดูเลขที่บัญชีธนาคารพนักงาน", sensitivity: "CRITICAL" },

  // Attendance
  { code: "attendance.read", module: "Attendance", action: "VIEW", description: "ดูประวัติและข้อมูลการลงเวลาทำงาน" },
  { code: "attendance.submit", module: "Attendance", action: "SUBMIT", description: "บันทึกเวลาเข้า-ออกงาน (Check-in/Check-out)" },
  { code: "attendance.review", module: "Attendance", action: "REVIEW", description: "ตรวจสอบรายการลงเวลานอก Geofence" },
  { code: "attendance.approve", module: "Attendance", action: "APPROVE", description: "อนุมัติเวลาปฏิบัติงาน" },
  { code: "attendance.export", module: "Attendance", action: "EXPORT", description: "ส่งออกรายงานสรุปเวลาทำงาน" },

  // Leave & OT
  { code: "leave.read", module: "Leave", action: "VIEW", description: "ดูรายการขอลาหยุดงาน" },
  { code: "leave.submit", module: "Leave", action: "SUBMIT", description: "ยื่นคำขอลาหยุดงาน" },
  { code: "leave.approve", module: "Leave", action: "APPROVE", description: "อนุมัติคำขอลาหยุดงาน" },
  { code: "ot.read", module: "OT", action: "VIEW", description: "ดูรายการขอทำล่วงเวลา (OT)" },
  { code: "ot.submit", module: "OT", action: "SUBMIT", description: "ยื่นขอทำงานล่วงเวลา (OT)" },
  { code: "ot.approve", module: "OT", action: "APPROVE", description: "อนุมัติทำงานล่วงเวลา (OT)" },

  // Payroll
  { code: "payroll.read", module: "Payroll", action: "VIEW", description: "ดูรายงานการจ่ายเงินเดือน", sensitivity: "CRITICAL" },
  { code: "payroll.prepare", module: "Payroll", action: "CREATE", description: "ประมวลผลคำนวณเงินเดือนรอบประจำงวด", sensitivity: "CRITICAL" },
  { code: "payroll.review", module: "Payroll", action: "REVIEW", description: "ตรวจสอบความถูกต้องของรอบการจ่ายเงินเดือน", sensitivity: "CRITICAL" },
  { code: "payroll.approve", module: "Payroll", action: "APPROVE", description: "อนุมัติรอบการจ่ายเงินเดือนขั้นสุดท้าย", sensitivity: "CRITICAL" },
  { code: "payroll.export", module: "Payroll", action: "EXPORT", description: "ส่งออกไฟล์ Text ธนาคารและ ภ.ง.ด.1", sensitivity: "CRITICAL" },

  // Project & Contract
  { code: "project.read", module: "Project", action: "VIEW", description: "ดูข้อมูลโครงการและไซต์งาน" },
  { code: "project.create", module: "Project", action: "CREATE", description: "สร้างโครงการใหม่" },
  { code: "project.update", module: "Project", action: "EDIT", description: "แก้ไขรายละเอียดโครงการ" },
  { code: "project.manage", module: "Project", action: "CONFIGURE", description: "บริหารจัดการงบประมาณและทรัพยากรโครงการ" },
  { code: "project.margin.read", module: "Project", action: "VIEW", description: "ดูอัตรากำไรขั้นต้นของโครงการ (Margin)", sensitivity: "SENSITIVE" },
  { code: "contract.read", module: "Contract", action: "VIEW", description: "ดูสัญญาจ้างเหมาบริการและสัญญาว่าจ้าง" },
  { code: "contract.approve", module: "Contract", action: "APPROVE", description: "อนุมัติสัญญาว่าจ้าง", sensitivity: "SENSITIVE" },

  // CRM
  { code: "crm.read", module: "CRM", action: "VIEW", description: "ดูข้อมูลลูกค้าและโอกาสทางการขาย" },
  { code: "crm.manage", module: "CRM", action: "EDIT", description: "จัดการข้อมูลลูกค้าและใบเสนอราคา" },
  { code: "crm.quotation.approve", module: "CRM", action: "APPROVE", description: "อนุมัติใบเสนอราคา", sensitivity: "SENSITIVE" },

  // Fleet & Logistics
  { code: "fleet.read", module: "Fleet", action: "VIEW", description: "ดูข้อมูลยานพาหนะและทริปเดินทาง" },
  { code: "fleet.manage", module: "Fleet", action: "EDIT", description: "จ่ายงานยานพาหนะและบันทึกการซ่อมบำรุง" },

  // Inventory & Warehouse
  { code: "inventory.read", module: "Inventory", action: "VIEW", description: "ดูยอดสต็อกและอุปกรณ์ทำความสะอาด" },
  { code: "inventory.manage", module: "Inventory", action: "EDIT", description: "เบิกจ่าย-รับเข้า และตรวจนับสินค้าคงคลัง" },

  // Procurement
  { code: "procurement.read", module: "Procurement", action: "VIEW", description: "ดูใบขอซื้อและใบสั่งซื้อ (PR/PO)" },
  { code: "procurement.pr.create", module: "Procurement", action: "CREATE", description: "สร้างใบขอซื้อสินค้า (PR)" },
  { code: "procurement.po.approve", module: "Procurement", action: "APPROVE", description: "อนุมัติใบสั่งซื้อสินค้า (PO)", sensitivity: "SENSITIVE" },

  // Asset
  { code: "asset.read", module: "Asset", action: "VIEW", description: "ดูทะเบียนสินทรัพย์และเครื่องจักร" },
  { code: "asset.manage", module: "Asset", action: "EDIT", description: "จัดการทะเบียนสินทรัพย์และตรวจซ่อม" },

  // QHSE
  { code: "qhse.read", module: "QHSE", action: "VIEW", description: "ดูรายงานความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม" },
  { code: "qhse.manage", module: "QHSE", action: "EDIT", description: "บันทึกอุบัติการณ์ ตรวจความปลอดภัย และ CAPA" },

  // Finance & Treasury
  { code: "finance.read", module: "Finance", action: "VIEW", description: "ดูรายงานการเงินและบัญชีลูกหนี้/เจ้าหนี้", sensitivity: "SENSITIVE" },
  { code: "finance.payment.create", module: "Finance", action: "CREATE", description: "สร้างรายการเตรียมจ่ายเงิน", sensitivity: "SENSITIVE" },
  { code: "finance.payment.approve", module: "Finance", action: "APPROVE", description: "อนุมัติการจ่ายเงิน (Payment Voucher)", sensitivity: "CRITICAL" },
  { code: "treasury.read", module: "Treasury", action: "VIEW", description: "ดูกระแสเงินสดและสมุดเงินสดย่อย", sensitivity: "SENSITIVE" },

  // Analytics & Automation & AI
  { code: "analytics.read", module: "Analytics", action: "VIEW", description: "ดูรายงานวิเคราะห์ขั้นสูงและ Business Intelligence" },
  { code: "automation.read", module: "Automation", action: "VIEW", description: "ดูระบบแจ้งเตือนและ Workflow อัตโนมัติ" },
  { code: "ai.read", module: "AI", action: "VIEW", description: "ใช้งาน SmartJeff AI Copilot Assistant" },

  // Security
  { code: "security.read", module: "Security", action: "VIEW", description: "ดูภาพรวมความปลอดภัยและ Audit Logs", sensitivity: "SENSITIVE" },
  { code: "security.role.manage", module: "Security", action: "CONFIGURE", description: "จัดการบทบาทและสิทธิ์ผู้ใช้งาน (Role Manager)", sensitivity: "CRITICAL" },
  { code: "security.user.manage", module: "Security", action: "CONFIGURE", description: "จัดการบัญชีผู้ใช้และมอบหมายสิทธิ์", sensitivity: "CRITICAL" },
  { code: "security.session.manage", module: "Security", action: "CONFIGURE", description: "จัดการ Session และสั่งบังคับออกจากระบบ", sensitivity: "CRITICAL" },
  { code: "security.audit.read", module: "Security", action: "VIEW", description: "ดูรายงาน Audit Trail เชิงลึก", sensitivity: "SENSITIVE" },
  { code: "security.access.request", module: "Security", action: "SUBMIT", description: "ยื่นคำขอสิทธิ์การเข้าถึงระบบชั่วคราว" },

  // Platform
  { code: "platform.read", module: "Platform", action: "VIEW", description: "ดูสถานะเซิร์ฟเวอร์และระบบหลังบ้าน" },
  { code: "platform.health.read", module: "Platform", action: "VIEW", description: "ตรวจเช็ก System Health และ Database Connections" },
  { code: "platform.backup.manage", module: "Platform", action: "CONFIGURE", description: "จัดการ Backup และ Disaster Recovery", sensitivity: "CRITICAL" },
  { code: "platform.config.manage", module: "Platform", action: "CONFIGURE", description: "ตั้งค่าระบบระดับโครงสร้างพื้นฐาน", sensitivity: "CRITICAL" },
];

interface RoleDef {
  code: string;
  nameTh: string;
  nameEn: string;
  description: string;
  level: number;
  departmentType?: string;
  isSystem: boolean;
  permissions: string[];
}

const ROLES: RoleDef[] = [
  {
    code: "SUPER_ADMIN",
    nameTh: "ผู้ดูแลระบบสูงสุด",
    nameEn: "Super Administrator",
    description: "มีสิทธิ์สูงสุดทุกฟังก์ชันในระบบ SmartJeff (ใช้ในกรณีฉุกเฉินหรือบำรุงรักษาระบบ)",
    level: 10,
    departmentType: "IT",
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.code),
  },
  {
    code: "SECURITY_ADMIN",
    nameTh: "ผู้ดูแลความปลอดภัย",
    nameEn: "Security Administrator",
    description: "ควบคุมจัดการบทบาท สิทธิ์ บัญชีผู้ใช้ Session และ Audit Logs (ไม่มีสิทธิ์ดูเงินเดือนหรือข้อมูลการเงินส่วนบุคคล)",
    level: 9,
    departmentType: "SECURITY",
    isSystem: true,
    permissions: [
      "dashboard.read",
      "employee.read",
      "security.read",
      "security.role.manage",
      "security.user.manage",
      "security.session.manage",
      "security.audit.read",
      "security.access.request",
      "platform.read",
      "platform.health.read",
    ],
  },
  {
    code: "PLATFORM_ADMIN",
    nameTh: "ผู้ดูแลระบบโครงสร้างพื้นฐาน",
    nameEn: "Platform Administrator",
    description: "ดูแล Server, ฐานข้อมูล, Backup, และ Health Check (ไม่มีสิทธิ์ดูข้อมูลเงินเดือนหรือพนักงาน)",
    level: 9,
    departmentType: "IT",
    isSystem: true,
    permissions: [
      "platform.read",
      "platform.health.read",
      "platform.backup.manage",
      "platform.config.manage",
      "automation.read",
      "security.audit.read",
    ],
  },
  {
    code: "BREAK_GLASS_ADMIN",
    nameTh: "ผู้ดูแลระบบฉุกเฉิน",
    nameEn: "Emergency Break Glass Administrator",
    description: "บัญชีสำรองกรณีฉุกเฉินสูงสุด พร้อมระบบบันทึก Audit เข้มงวด",
    level: 10,
    departmentType: "SECURITY",
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.code),
  },
  {
    code: "EXECUTIVE",
    nameTh: "ผู้บริหารระดับสูง",
    nameEn: "Executive / Management",
    description: "ดูภาพรวมทั้งองค์กร แดชบอร์ด รายงานการเงิน อัตรากำไร และอนุมัติรายการสำคัญ",
    level: 8,
    departmentType: "MANAGEMENT",
    isSystem: false,
    permissions: [
      "dashboard.read",
      "dashboard.export",
      "employee.read",
      "attendance.read",
      "payroll.read",
      "payroll.approve",
      "project.read",
      "project.margin.read",
      "contract.read",
      "crm.read",
      "finance.read",
      "finance.payment.approve",
      "treasury.read",
      "analytics.read",
      "analytics.export",
      "ai.read",
      "qhse.read",
    ],
  },
  {
    code: "HR_MANAGER",
    nameTh: "หัวหน้าฝ่ายทรัพยากรบุคคล",
    nameEn: "HR Manager",
    description: "บริหารงานบุคคล อนุมัติเวลา คำนวณและอนุมัติเงินเดือน จัดการพนักงาน",
    level: 7,
    departmentType: "HR",
    isSystem: false,
    permissions: [
      "dashboard.read",
      "employee.read",
      "employee.create",
      "employee.update",
      "employee.code.read",
      "employee.phone.read",
      "employee.salary.read",
      "employee.bank.read",
      "attendance.read",
      "attendance.review",
      "attendance.approve",
      "attendance.export",
      "leave.read",
      "leave.approve",
      "ot.read",
      "ot.approve",
      "payroll.read",
      "payroll.prepare",
      "payroll.review",
      "payroll.approve",
      "payroll.export",
      "ai.read",
    ],
  },
  {
    code: "HR_OFFICER",
    nameTh: "เจ้าหน้าที่บุคคล",
    nameEn: "HR Officer",
    description: "ดูแลประวัติพนักงาน ตรวจสอบการลงเวลา เตรียมข้อมูลเงินเดือน (ไม่มีสิทธิ์ Final Approve เงินเดือน)",
    level: 4,
    departmentType: "HR",
    isSystem: false,
    permissions: [
      "dashboard.read",
      "employee.read",
      "employee.create",
      "employee.update",
      "employee.code.read",
      "employee.phone.read",
      "attendance.read",
      "attendance.review",
      "leave.read",
      "leave.submit",
      "ot.read",
      "ot.submit",
      "payroll.read",
      "payroll.prepare",
      "ai.read",
    ],
  },
  {
    code: "PROJECT_MANAGER",
    nameTh: "ผู้จัดการโครงการ",
    nameEn: "Project Manager",
    description: "บริหารจัดการโครงการ ไซต์งาน จัดการกำลังคน ตรวจสอบงบประมาณโครงการ",
    level: 6,
    departmentType: "OPERATIONS",
    isSystem: false,
    permissions: [
      "dashboard.read",
      "project.read",
      "project.update",
      "project.manage",
      "contract.read",
      "employee.read",
      "attendance.read",
      "attendance.approve",
      "leave.approve",
      "ot.approve",
      "procurement.read",
      "procurement.pr.create",
      "inventory.read",
      "qhse.read",
    ],
  },
  {
    code: "SITE_MANAGER",
    nameTh: "ผู้จัดการไซต์งาน",
    nameEn: "Site Manager",
    description: "ดูแลการปฏิบัติงานในไซต์ อนุมัติเวลาปฏิบัติงานประจำไซต์ เบิกจ่ายอุปกรณ์",
    level: 5,
    departmentType: "OPERATIONS",
    isSystem: false,
    permissions: [
      "dashboard.read",
      "project.read",
      "employee.read",
      "attendance.read",
      "attendance.review",
      "attendance.approve",
      "leave.approve",
      "ot.approve",
      "inventory.read",
      "inventory.manage",
      "procurement.pr.create",
      "qhse.read",
    ],
  },
  {
    code: "SUPERVISOR",
    nameTh: "หัวหน้างาน",
    nameEn: "Supervisor / Team Lead",
    description: "กำกับดูแลทีมงาน ตรวจสอบเวลาปฏิบัติงานหน้าร้าน/หน้าไซต์ ยื่นและตรวจคำขอลา",
    level: 3,
    departmentType: "OPERATIONS",
    isSystem: false,
    permissions: [
      "employee.read",
      "attendance.read",
      "attendance.review",
      "leave.read",
      "leave.approve",
      "ot.read",
      "ot.approve",
      "inventory.read",
      "qhse.read",
    ],
  },
  {
    code: "FINANCE_OFFICER",
    nameTh: "เจ้าหน้าที่การเงินและบัญชี",
    nameEn: "Finance & Accounting Officer",
    description: "จัดการใบแจ้งหนี้ ใบเสร็จ รายการเตรียมจ่ายเงิน (ไม่มีสิทธิ์ Final Approve จ่ายเงิน)",
    level: 4,
    departmentType: "FINANCE",
    isSystem: false,
    permissions: [
      "dashboard.read",
      "finance.read",
      "finance.payment.create",
      "treasury.read",
      "procurement.read",
      "payroll.read",
      "payroll.export",
    ],
  },
  {
    code: "EMPLOYEE",
    nameTh: "พนักงานทั่วไป",
    nameEn: "Standard Employee",
    description: "พนักงานระดับปฏิบัติการ ลงเวลาทำงาน ขอลา ขอ OT และดูสลิปเงินเดือนตนเอง",
    level: 1,
    departmentType: "OPERATIONS",
    isSystem: true,
    permissions: [
      "attendance.submit",
      "attendance.read",
      "leave.submit",
      "leave.read",
      "ot.submit",
      "ot.read",
      "ai.read",
    ],
  },
];

async function main() {
  console.log("🚀 Starting Central IAM & Role Management Seeding...");

  // 1. Seed Permissions
  console.log(`📦 Seeding ${PERMISSIONS.length} Permissions...`);
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {
        module: p.module,
        action: p.action,
        description: p.description,
        sensitivity: p.sensitivity || "NORMAL",
        isActive: true,
      },
      create: {
        code: p.code,
        module: p.module,
        action: p.action,
        description: p.description,
        sensitivity: p.sensitivity || "NORMAL",
        isActive: true,
      },
    });
  }
  console.log("✅ All Permissions Seeded successfully.");

  // Fetch all permissions from DB to get IDs
  const allDbPerms = await prisma.permission.findMany();
  const permMap = new Map(allDbPerms.map((p) => [p.code, p.id]));

  // 2. Seed Roles and RolePermissions
  console.log(`🛡️ Seeding ${ROLES.length} Roles and mappings...`);
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: {
        nameTh: r.nameTh,
        nameEn: r.nameEn,
        description: r.description,
        level: r.level,
        departmentType: r.departmentType,
        isSystem: r.isSystem,
        isActive: true,
      },
      create: {
        code: r.code,
        nameTh: r.nameTh,
        nameEn: r.nameEn,
        description: r.description,
        level: r.level,
        departmentType: r.departmentType,
        isSystem: r.isSystem,
        isActive: true,
      },
    });

    // Sync RolePermissions
    for (const permCode of r.permissions) {
      const permId = permMap.get(permCode);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
    }
  }
  console.log("✅ All Roles & RolePermissions seeded.");

  // 3. Seed Default Approval Authorities
  console.log("⚖️ Seeding Default Approval Authorities...");
  const execRole = await prisma.role.findUnique({ where: { code: "EXECUTIVE" } });
  const hrMgrRole = await prisma.role.findUnique({ where: { code: "HR_MANAGER" } });
  const pmRole = await prisma.role.findUnique({ where: { code: "PROJECT_MANAGER" } });

  if (execRole) {
    await prisma.approvalAuthority.createMany({
      data: [
        { roleId: execRole.id, module: "Finance", action: "Payment", level: "FINAL_APPROVE", minAmount: 0, maxAmount: 10000000 },
        { roleId: execRole.id, module: "Payroll", action: "Run", level: "FINAL_APPROVE", minAmount: 0, maxAmount: 10000000 },
      ],
      skipDuplicates: true,
    });
  }

  if (hrMgrRole) {
    await prisma.approvalAuthority.createMany({
      data: [
        { roleId: hrMgrRole.id, module: "Payroll", action: "Run", level: "REVIEW", minAmount: 0, maxAmount: 1000000 },
        { roleId: hrMgrRole.id, module: "Attendance", action: "Approval", level: "APPROVE", minAmount: 0, maxAmount: null },
      ],
      skipDuplicates: true,
    });
  }

  if (pmRole) {
    await prisma.approvalAuthority.createMany({
      data: [
        { roleId: pmRole.id, module: "Procurement", action: "PO", level: "APPROVE", minAmount: 0, maxAmount: 100000 },
      ],
      skipDuplicates: true,
    });
  }
  console.log("✅ Default Approval Authorities seeded.");

  // 4. Migrate Existing Users to UserRoleAssignments
  console.log("👥 Migrating Existing Users to UserRoleAssignments...");
  const adminRole = await prisma.role.findUnique({ where: { code: "SUPER_ADMIN" } });
  const secAdminRole = await prisma.role.findUnique({ where: { code: "SECURITY_ADMIN" } });
  const empRole = await prisma.role.findUnique({ where: { code: "EMPLOYEE" } });

  // 4.1 Admin User
  const adminUser = await prisma.user.findFirst({
    where: { OR: [{ email: "admin" }, { role: "ADMIN" }, { role: "SUPER_ADMIN" }] },
  });
  if (adminUser && adminRole && secAdminRole) {
    await prisma.userRoleAssignment.upsert({
      where: { id: `seed-admin-super` },
      update: { status: "ACTIVE", roleId: adminRole.id },
      create: {
        id: `seed-admin-super`,
        userId: adminUser.id,
        roleId: adminRole.id,
        scopeType: "GLOBAL",
        assignedBy: "SYSTEM",
        reason: "Initial Super Admin Setup",
        status: "ACTIVE",
      },
    });

    await prisma.userRoleAssignment.upsert({
      where: { id: `seed-admin-security` },
      update: { status: "ACTIVE", roleId: secAdminRole.id },
      create: {
        id: `seed-admin-security`,
        userId: adminUser.id,
        roleId: secAdminRole.id,
        scopeType: "GLOBAL",
        assignedBy: "SYSTEM",
        reason: "Initial Security Admin Setup",
        status: "ACTIVE",
      },
    });
    console.log(`✅ Admin user migrated to SUPER_ADMIN & SECURITY_ADMIN.`);
  }

  // 4.2 Star User
  const starUser = await prisma.user.findFirst({
    where: { OR: [{ email: "star" }, { role: "EMPLOYEE" }] },
  });
  if (starUser && empRole) {
    await prisma.userRoleAssignment.upsert({
      where: { id: `seed-star-emp` },
      update: { status: "ACTIVE", roleId: empRole.id },
      create: {
        id: `seed-star-emp`,
        userId: starUser.id,
        roleId: empRole.id,
        scopeType: "OWN",
        scopeId: starUser.employeeId,
        assignedBy: "SYSTEM",
        reason: "Initial Employee Setup",
        status: "ACTIVE",
      },
    });
    console.log(`✅ Star user migrated to EMPLOYEE with scope OWN.`);
  }

  console.log("🎉 Central IAM & Role Management Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding roles:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
