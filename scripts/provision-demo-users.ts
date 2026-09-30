import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { requireDemoPassword } from "./demo-config";
import { DEMO_ACCOUNTS_CONFIG, DemoAccountConfig } from "../src/config/demo-accounts";

export interface VerificationRecord {
  email: string;
  roleCode: string;
  scopeType: string;
  scopeId: string | null;
  status: string;
  isActive: boolean;
  isLocked: boolean;
}

export async function provisionDemoUsers(prisma: PrismaClient): Promise<VerificationRecord[]> {
  if (process.env.DEMO_MODE !== "true") {
    throw new Error("DEMO_MODE must be set to 'true'");
  }

  const password = requireDemoPassword();
  const passwordHash = await hashPassword(password);

  // Safely find demo site / project if existing in DB
  const firstSite = await prisma.site.findFirst({ select: { id: true } });
  const firstProject = await prisma.project.findFirst({ select: { id: true } });

  const verificationRecords: VerificationRecord[] = [];

  // Build full list including alternate emails for Admin (e.g. pharmacisttom@gmail.com)
  const targets: { spec: DemoAccountConfig; email: string }[] = [];
  for (const spec of DEMO_ACCOUNTS_CONFIG) {
    targets.push({ spec, email: spec.email });
    if (spec.alternateEmails) {
      for (const altEmail of spec.alternateEmails) {
        targets.push({ spec, email: altEmail });
      }
    }
  }

  await prisma.$transaction(
    async (tx) => {
      for (const { spec, email } of targets) {
        // 1. Resolve target Role code
        let targetRoleCode = spec.roleCode;
        let roleRecord = await tx.role.findUnique({ where: { code: targetRoleCode } });

        if (!roleRecord && spec.fallbackRoleCode) {
          roleRecord = await tx.role.findUnique({ where: { code: spec.fallbackRoleCode } });
          if (roleRecord) {
            targetRoleCode = spec.fallbackRoleCode;
          }
        }

        // If role doesn't exist yet in master data, upsert it safely
        if (!roleRecord) {
          roleRecord = await tx.role.upsert({
            where: { code: targetRoleCode },
            update: { isActive: true },
            create: {
              code: targetRoleCode,
              nameEn: spec.key,
              nameTh: spec.titleTh,
              level: spec.key === "ADMIN" ? 10 : 2,
              isSystem: true,
            },
          });
        }

        // 2. Find or Create User
        let user = await tx.user.findUnique({ where: { email } });

        if (user) {
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              passwordHash,
              role: targetRoleCode,
              displayName: user.displayName || spec.titleTh,
              isActive: true,
              isLocked: false,
              lockedAt: null,
              activationPinAttempts: 0,
              mfaEnabled: false,
              mfaSecret: null,
              activationPinHash: null,
              activationPinExpiresAt: null,
              activationPinUsedAt: null,
              mustChangePassword: false,
              passwordChangedAt: new Date(),
              authzVersion: { increment: 1 },
            },
          });
        } else {
          user = await tx.user.create({
            data: {
              email,
              displayName: spec.titleTh,
              passwordHash,
              role: targetRoleCode,
              isActive: true,
              isLocked: false,
              authMethod: "LOCAL",
            },
          });
        }

        // 3. Determine safe scope
        let scopeType: string = spec.scopeType;
        let scopeId: string | null = null;

        if (spec.scopeType === "PROJECT") {
          if (firstProject) {
            scopeId = firstProject.id;
          } else {
            scopeType = "GLOBAL";
          }
        } else if (spec.scopeType === "SITE") {
          if (firstSite) {
            scopeId = firstSite.id;
          } else {
            scopeType = "GLOBAL";
          }
        } else if (spec.scopeType === "OWN") {
          scopeId = user.employeeId || null;
        }

        // 4. Ensure ACTIVE UserRoleAssignment exists
        const existingAssignment = await tx.userRoleAssignment.findFirst({
          where: {
            userId: user.id,
            roleId: roleRecord.id,
            status: "ACTIVE",
          },
        });

        let activeAssignment = existingAssignment;
        if (!activeAssignment) {
          activeAssignment = await tx.userRoleAssignment.create({
            data: {
              userId: user.id,
              roleId: roleRecord.id,
              scopeType,
              scopeId,
              status: "ACTIVE",
              reason: "Demo user provisioning",
            },
          });
        } else if (activeAssignment.scopeType !== scopeType || activeAssignment.scopeId !== scopeId) {
          activeAssignment = await tx.userRoleAssignment.update({
            where: { id: activeAssignment.id },
            data: { scopeType, scopeId, status: "ACTIVE" },
          });
        }

        // 5. Revoke sessions and MFA recovery
        await tx.mfaRecoveryCode.deleteMany({ where: { userId: user.id } });
        await tx.userSession.updateMany({
          where: { userId: user.id, status: "ACTIVE" },
          data: { status: "REVOKED" },
        });

        verificationRecords.push({
          email: user.email,
          roleCode: targetRoleCode,
          scopeType: activeAssignment.scopeType,
          scopeId: activeAssignment.scopeId,
          status: activeAssignment.status,
          isActive: user.isActive,
          isLocked: user.isLocked,
        });
      }
    },
    { maxWait: 10000, timeout: 30000 }
  );

  return verificationRecords;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const results = await provisionDemoUsers(prisma);
    console.log("\n==================================================");
    console.log("DEMO USERS PROVISIONED SUCCESSFULLY");
    console.log("==================================================");
    console.table(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Demo user provisioning failed.";
    const safeMessage = message.replace(/password/gi, "[redacted]");
    console.error(`[ERROR] Provisioning failed: ${safeMessage}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
