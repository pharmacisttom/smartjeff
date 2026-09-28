import { PrismaClient } from "@prisma/client";
import { assertDemoTarget } from "../prisma/demo-guard";
import { hashPassword } from "../src/lib/password";
import { DEMO_ACCOUNTS, requireDemoPassword } from "./demo-config";

async function main() {
  assertDemoTarget(process.env);
  const passwordHash = await hashPassword(requireDemoPassword());
  const prisma = new PrismaClient();
  try {
    const demoEmployee = await prisma.employee.findUnique({ where: { code: "EMP-DEMO-001" }, select: { id: true } });
    for (const [index, [role, email, displayName]] of DEMO_ACCOUNTS.entries()) {
      const roleRecord = await prisma.role.upsert({ where: { code: role }, update: { nameEn: role, nameTh: role, isActive: true }, create: { code: role, nameEn: role, nameTh: role, level: role === "ADMIN" ? 10 : 2, isSystem: true } });
      const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash, role, displayName, isActive: true, isLocked: false, lockedAt: null, authMethod: "LOCAL", mfaEnabled: false, mfaSecret: null, activationPinHash: null, activationPinExpiresAt: null, activationPinUsedAt: null, activationPinAttempts: 0, employeeId: role === "EMPLOYEE" ? demoEmployee?.id : undefined },
        create: { email, passwordHash, role, displayName, isActive: true, isLocked: false, authMethod: "LOCAL", mfaEnabled: false, employeeId: role === "EMPLOYEE" ? demoEmployee?.id : undefined },
      });
      await prisma.mfaRecoveryCode.deleteMany({ where: { userId: user.id } });
      await prisma.userRoleAssignment.upsert({
        where: { id: `demo-role-assignment-${index + 1}` },
        update: { userId: user.id, roleId: roleRecord.id, status: "ACTIVE" },
        create: { id: `demo-role-assignment-${index + 1}`, userId: user.id, roleId: roleRecord.id, scopeType: role === "EMPLOYEE" ? "OWN" : "GLOBAL", status: "ACTIVE", reason: "Synthetic demo role" },
      });
    }
    console.log("Demo accounts provisioned successfully for 6 accounts.");
  } finally { await prisma.$disconnect(); }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Demo account provisioning failed."); process.exitCode = 1; });
