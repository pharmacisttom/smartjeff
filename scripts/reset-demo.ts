import { PrismaClient } from "@prisma/client";
import { assertDemoTarget } from "../prisma/demo-guard";

const prisma = new PrismaClient();
async function main() {
  assertDemoTarget(process.env);
  await prisma.$transaction([
    prisma.userSession.deleteMany({ where: { user: { email: { endsWith: "@demo.smartop.local" } } } }),
    prisma.attendance.deleteMany({ where: { id: { startsWith: "demo-attendance-" } } }),
    prisma.leave.deleteMany({ where: { id: { startsWith: "demo-leave-" } } }),
    prisma.auditLog.deleteMany({ where: { id: { startsWith: "demo-" } } }),
  ]);
  console.log("Demo transactions reset. Run npm run demo:seed and npm run demo:reset-passwords to restore presentation state.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Demo reset failed"); process.exitCode = 1; }).finally(() => prisma.$disconnect());
