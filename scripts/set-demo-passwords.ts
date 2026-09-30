import { PrismaClient } from "@prisma/client";
import { provisionDemoUsers } from "./provision-demo-users";
import { DEMO_ACCOUNTS } from "../src/config/demo-accounts";

async function main() {
  if (process.env.DEMO_MODE !== "true") {
    throw new Error("DEMO_MODE must be set to 'true'");
  }

  const prisma = new PrismaClient();
  try {
    const results = await provisionDemoUsers(prisma);
    console.log("\n==================================================");
    console.log("DEMO PASSWORDS UPDATED SUCCESSFULLY");
    console.log("==================================================");
    console.table(
      results.map((r) => ({
        email: r.email,
        roleCode: r.roleCode,
        scopeType: r.scopeType,
        userState: r.userState,
        assignmentState: r.assignmentState,
        status: r.status,
        isActive: r.isActive,
        isLocked: r.isLocked,
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setting demo passwords failed.";
    const safeMessage = message.replace(/password/gi, "[redacted]");
    console.error(`[ERROR] Demo password update failed: ${safeMessage}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
