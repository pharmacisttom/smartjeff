import { PrismaClient } from "@prisma/client";
import { assertDemoTarget } from "../prisma/demo-guard";
import { hashPassword } from "../src/lib/password";
import { DEMO_ACCOUNTS, requireDemoPassword } from "./demo-config";

const prisma = new PrismaClient();
const siteIds = ["demo-site-a", "demo-site-b", "demo-site-c"];
const demoPermissions: Record<string, string[]> = {
  ADMIN: ["dashboard.read", "employee.read", "employee.create", "employee.update", "attendance.read", "attendance.approve", "leave.read", "leave.approve", "payroll.read", "payroll.prepare", "payroll.approve", "project.read", "asset.read", "analytics.read", "security.read", "security.role.manage", "security.user.manage", "security.audit.read"],
  EXECUTIVE: ["dashboard.read", "employee.read", "attendance.read", "payroll.read", "project.read", "analytics.read"],
  HR: ["dashboard.read", "employee.read", "employee.create", "employee.update", "employee.code.read", "attendance.read", "attendance.approve", "leave.read", "leave.approve", "payroll.read", "payroll.prepare"],
  COORDINATOR: ["dashboard.read", "employee.read", "attendance.read", "project.read", "asset.read"],
  SITE_SUPERVISOR: ["employee.read", "attendance.read", "attendance.approve", "leave.read", "leave.approve", "project.read", "asset.read"],
  EMPLOYEE: ["attendance.read", "attendance.submit", "leave.read", "leave.submit"],
};

async function main() {
  assertDemoTarget(process.env);
  const passwordHash = await hashPassword(requireDemoPassword());
  await prisma.organization.upsert({ where: { code: "SMARTOP-DEMO" }, update: { name: "SmartOP Demo Company" }, create: { id: "demo-org", code: "SMARTOP-DEMO", name: "SmartOP Demo Company", nameTh: "บริษัทสาธิต SmartOP" } });
  for (const [index, name] of ["Executive", "Human Resources", "Payroll", "Operations", "Site Management"].entries()) {
    await prisma.department.upsert({ where: { code: `DEMO-DEPT-${index + 1}` }, update: { name }, create: { id: `demo-dept-${index + 1}`, code: `DEMO-DEPT-${index + 1}`, name } });
  }
  for (const [index, id] of siteIds.entries()) {
    await prisma.site.upsert({ where: { id }, update: { name: `Demo Site ${String.fromCharCode(65 + index)}` }, create: { id, code: `DEMO-${String.fromCharCode(65 + index)}`, name: `Demo Site ${String.fromCharCode(65 + index)}`, location: "Synthetic demo location", lat: 0, lng: 0 } });
  }
  for (let i = 1; i <= 30; i++) {
    const id = `demo-employee-${String(i).padStart(3, "0")}`;
    const code = i === 1 ? "EMP-DEMO-001" : `EMP-DEMO-${String(i).padStart(3, "0")}`;
    await prisma.employee.upsert({ where: { id }, update: {}, create: { id, code, firstName: "Demo Employee", lastName: String(i).padStart(3, "0"), position: i <= 3 ? "Demo Supervisor" : "Demo Operations Staff", siteId: siteIds[(i - 1) % 3], nationality: "Synthetic", baseSalary: 15000 + i * 100, dailyRate: 500 } });
    await prisma.attendance.upsert({ where: { id: `demo-attendance-${i}` }, update: {}, create: { id: `demo-attendance-${i}`, employeeId: id, type: "IN", timestamp: new Date(Date.now() - (i % 3) * 3600000), lat: 0, lng: 0, distance: 0, isWithinGeofence: true, approvalStatus: "APPROVED" } });
    await prisma.payslip.upsert({ where: { id: `demo-payslip-${i}` }, update: {}, create: { id: `demo-payslip-${i}`, employeeId: id, period: "2026-09", baseSalary: 15000 + i * 100, netPay: 14500 + i * 100 } });
  }
  for (let i = 1; i <= 3; i++) await prisma.leave.upsert({ where: { id: `demo-leave-${i}` }, update: {}, create: { id: `demo-leave-${i}`, employeeId: `demo-employee-${String(i + 3).padStart(3, "0")}`, type: "PERSONAL", startDate: new Date(), endDate: new Date(), reason: "Synthetic demo leave", status: "APPROVED" } });
  for (const [index, [role, email, displayName]] of DEMO_ACCOUNTS.entries()) {
    const employeeId = role === "EMPLOYEE" ? "demo-employee-001" : undefined;
    const user = await prisma.user.upsert({ where: { email }, update: { displayName, role, passwordHash, isActive: true, isLocked: false }, create: { id: `demo-user-${index + 1}`, email, displayName, role, passwordHash, employeeId } });
    const dbRole = await prisma.role.upsert({ where: { code: role }, update: { nameEn: role, nameTh: role, isActive: true }, create: { id: `demo-role-${role.toLowerCase()}`, code: role, nameEn: role, nameTh: role, level: role === "ADMIN" ? 10 : 2, isSystem: true } });
    for (const code of demoPermissions[role] || []) {
      const [module, ...actionParts] = code.split(".");
      const permission = await prisma.permission.upsert({ where: { code }, update: { isActive: true }, create: { code, module, action: actionParts.join(".").toUpperCase(), description: "Demo role permission" } });
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: dbRole.id, permissionId: permission.id } }, update: {}, create: { roleId: dbRole.id, permissionId: permission.id } });
    }
    await prisma.userRoleAssignment.upsert({ where: { id: `demo-role-assignment-${index + 1}` }, update: { status: "ACTIVE", roleId: dbRole.id }, create: { id: `demo-role-assignment-${index + 1}`, userId: user.id, roleId: dbRole.id, scopeType: role === "EMPLOYEE" ? "OWN" : "GLOBAL", status: "ACTIVE", reason: "Synthetic demo role" } });
    await prisma.notification.upsert({ where: { id: `demo-notification-${index + 1}` }, update: {}, create: { id: `demo-notification-${index + 1}`, userId: user.id, title: "Demo notification", body: "Synthetic data for presentation", actionUrl: "/" } });
  }
  await prisma.payrollRun.upsert({ where: { id: "demo-payroll-run" }, update: {}, create: { id: "demo-payroll-run", period: "2026-09", siteId: "demo-site-a", status: "APPROVED", totalAmount: 480000, notes: "Synthetic demo payroll" } });
  const client = await prisma.client.upsert({ where: { code: "DEMO-CLIENT" }, update: {}, create: { id: "demo-client", code: "DEMO-CLIENT", name: "Synthetic Demo Client", contactName: "Demo Contact", contactEmail: "contact@demo.smartop.local" } });
  const project = await prisma.project.upsert({ where: { code: "DEMO-PROJECT" }, update: {}, create: { id: "demo-project", code: "DEMO-PROJECT", name: "SmartOP Demo Project", clientId: client.id, status: "ACTIVE", budgetAmount: 1000000, revenueAmount: 1250000 } });
  for (let i = 1; i <= 4; i++) await prisma.workOrder.upsert({ where: { id: `demo-work-order-${i}` }, update: {}, create: { id: `demo-work-order-${i}`, refNo: `DEMO-WO-${i}`, title: `Demo Work Order ${i}`, projectId: project.id, status: i === 1 ? "OPEN" : "IN_PROGRESS", priority: "MEDIUM" } });
  await prisma.asset.upsert({ where: { code: "DEMO-ASSET-001" }, update: {}, create: { id: "demo-asset", code: "DEMO-ASSET-001", name: "Demo Cleaning Machine", category: "EQUIPMENT", status: "ACTIVE" } });
  for (let i = 1; i <= 5; i++) await prisma.trainingCourse.upsert({ where: { id: `demo-training-${i}` }, update: {}, create: { id: `demo-training-${i}`, title: `Demo Training ${i}`, description: "Synthetic training course", hours: 2 } });
  await prisma.auditLog.upsert({ where: { id: "demo-audit-ready" }, update: {}, create: { id: "demo-audit-ready", action: "DEMO_DATA_READY", entity: "Demo", entityId: "smartop-demo", metadata: JSON.stringify({ synthetic: true }) } });
  console.log("Synthetic demo data ready: 6 accounts, 30 employees, 3 sites");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Demo seed failed"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
