import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { assertDemoTarget } from "./demo-guard";

async function main() {
  assertDemoTarget(process.env);
  const accounts = [
    { key: "ADMIN", role: "ADMIN" },
    { key: "MANAGER", role: "SUPERVISOR" },
    { key: "USER", role: "EMPLOYEE" },
  ].map(({ key, role }, index) => {
    const email = process.env[`DEMO_${key}_EMAIL`]?.trim().toLowerCase();
    const password = process.env[`DEMO_${key}_PASSWORD`];
    if (!email || !/^[^@\s]+@example\.(local|test)$/.test(email) || !password || password.length < 12) {
      throw new Error(`DEMO_${key}_EMAIL must use example.local/test and its password must have at least 12 characters`);
    }
    return { email, password, role, id: `demo-user-${index + 1}`, employeeId: `demo-employee-${index + 1}` };
  });
  if (new Set(accounts.map(a => a.email)).size !== accounts.length) throw new Error("Demo emails must be distinct");
  const hashes = await Promise.all(accounts.map(a => hashPassword(a.password)));
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(async tx => {
      if (await tx.user.count({ where: { id: { notIn: accounts.map(a => a.id) } } }) ||
          await tx.employee.count({ where: { id: { notIn: accounts.map(a => a.employeeId) } } }) ||
          await tx.site.count({ where: { id: { not: "demo-site-a" } } })) {
        throw new Error("Target contains non-demo records; refusing to seed");
      }
      await tx.site.upsert({ where: { id: "demo-site-a" }, update: {}, create: {
        id: "demo-site-a", code: "DEMO-A", name: "Demo Site A", location: "Synthetic location", lat: 0, lng: 0,
      } });
      for (const [index, account] of accounts.entries()) {
        await tx.employee.upsert({ where: { id: account.employeeId }, update: {}, create: {
          id: account.employeeId, code: `DEMO-${index + 1}`, firstName: "Demo", lastName: `User ${index + 1}`,
          position: "Demo employee", siteId: "demo-site-a", baseSalary: 15000, dailyRate: 500,
        } });
        await tx.user.upsert({ where: { id: account.id }, update: {}, create: {
          id: account.id, email: account.email, passwordHash: hashes[index], role: account.role,
          displayName: `Demo User ${index + 1}`, employeeId: account.employeeId,
        } });
      }
      await tx.payrollConfig.upsert({ where: { id: "demo-payroll-config" }, update: {}, create: {
        id: "demo-payroll-config", siteId: "demo-site-a",
      } });
      await tx.attendance.upsert({ where: { id: "demo-attendance-1" }, update: {}, create: {
        id: "demo-attendance-1", employeeId: accounts[2].employeeId, type: "IN",
        timestamp: new Date("2026-09-01T00:00:00Z"), lat: 0, lng: 0, distance: 0, isWithinGeofence: true,
      } });
      await tx.leave.upsert({ where: { id: "demo-leave-1" }, update: {}, create: {
        id: "demo-leave-1", employeeId: accounts[2].employeeId, type: "PERSONAL",
        startDate: new Date("2026-09-02T00:00:00Z"), endDate: new Date("2026-09-02T00:00:00Z"), reason: "Synthetic demo leave",
      } });
      await tx.payslip.upsert({ where: { id: "demo-payslip-1" }, update: {}, create: {
        id: "demo-payslip-1", employeeId: accounts[2].employeeId, period: "2026-09", baseSalary: 15000, netPay: 15000,
      } });
    });
    console.log("Synthetic demo created; existing demo records and passwords were preserved.");
  } finally { await prisma.$disconnect(); }
}

main().catch(() => { console.error("Demo seed failed. Check guards, credentials and database configuration."); process.exitCode = 1; });
