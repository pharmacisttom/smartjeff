import { PrismaClient } from "@prisma/client";
import { seedDemoShowcase } from "./seed-demo-showcase";
import { AuditService } from "../src/server/services/audit.service";

export async function resetDemoShowcase(prisma: PrismaClient) {
  if (process.env.DEMO_MODE !== "true") {
    throw new Error("DEMO_MODE must be set to 'true'");
  }

  console.log("🧹 Resetting Demo Showcase Data...");

  await prisma.$transaction(async (tx) => {
    // Safely delete demo attendance and payslips
    await tx.attendance.deleteMany({ where: { localId: { startsWith: "DEMO-" } } });
    await tx.payslip.deleteMany({ where: { period: "2026-09", employee: { code: { startsWith: "EMP-DEMO-" } } } });
    await tx.payrollRun.deleteMany({ where: { period: "2026-09" } });
    await tx.shiftTemplate.deleteMany({ where: { code: { startsWith: "DEMO-" } } });
    await tx.employee.deleteMany({ where: { code: { startsWith: "EMP-DEMO-" } } });
    await tx.department.deleteMany({ where: { code: { startsWith: "DEMO-" } } });
    await tx.project.deleteMany({ where: { code: { startsWith: "DEMO-" } } });
    await tx.site.deleteMany({ where: { code: { startsWith: "DEMO-" } } });
    await tx.client.deleteMany({ where: { code: { startsWith: "DEMO-" } } });
  });

  await AuditService.log({
    action: "DEMO_RESET",
    entity: "DemoShowcase",
    metadata: { resetAt: new Date().toISOString() },
  });

  console.log("✅ Demo records reset successfully. Re-seeding demo dataset...");
  await seedDemoShowcase(prisma);
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await resetDemoShowcase(prisma);
  } catch (error) {
    console.error("❌ Reset demo showcase failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
