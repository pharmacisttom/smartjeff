import { PrismaClient } from "@prisma/client";
import { assertDemoTarget } from "../prisma/demo-guard";
import { hashPassword } from "../src/lib/password";
import { DEMO_ACCOUNTS, requireDemoPassword } from "./demo-config";

async function main() {
  assertDemoTarget(process.env);
  const hash = await hashPassword(requireDemoPassword());
  const prisma = new PrismaClient();
  try {
    for (const [, email] of DEMO_ACCOUNTS) {
      await prisma.user.update({ where: { email }, data: {
        passwordHash: hash, mfaEnabled: false, mfaSecret: null,
        activationPinHash: null, activationPinExpiresAt: null, activationPinUsedAt: null,
        activationPinAttempts: 0, isLocked: false, lockedAt: null,
      } });
    }
    console.log("Demo password reset completed for 6 accounts");
  } finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Demo password reset failed"); process.exitCode = 1; });
