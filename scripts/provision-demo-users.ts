import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { requireDemoPassword } from "./demo-config";
import { DEMO_ACCOUNTS } from "../src/config/demo-accounts";

export interface VerificationRecord {
  email: string;
  roleCode: string;
  scopeType: string;
  scopeId: string | null;
  userState: "CREATED" | "REUSED";
  assignmentState: "CREATED" | "REUSED" | "RECONCILED";
  status: string;
  isActive: boolean;
  isLocked: boolean;
}

export async function provisionDemoUsers(prisma: PrismaClient): Promise<VerificationRecord[]> {
  const isDemoAllowed = process.env.DEMO_MODE === "true" || process.env.DEMO_SEED_ALLOWED === "true";
  if (!isDemoAllowed) {
    throw new Error("DEMO_MODE or DEMO_SEED_ALLOWED must be set to 'true'");
  }

  const password = requireDemoPassword();
  const passwordHash = await hashPassword(password);

  // Safely query existing demo site / project if present
  const firstSite = await prisma.site.findFirst({ select: { id: true } });
  const firstProject = await prisma.project.findFirst({ select: { id: true } });

  const verificationRecords: VerificationRecord[] = [];

  await prisma.$transaction(
    async (tx) => {
      for (const account of DEMO_ACCOUNTS) {
        // 1. MUST lookup existing Master Role strictly. NEVER create or upsert Role master.
        let targetRoleCode = account.roleCode;
        let roleRecord = await tx.role.findUnique({ where: { code: targetRoleCode } });

        if (!roleRecord && account.fallbackRoleCode) {
          roleRecord = await tx.role.findUnique({ where: { code: account.fallbackRoleCode } });
          if (roleRecord) {
            targetRoleCode = account.fallbackRoleCode;
          }
        }

        if (!roleRecord) {
          throw new Error(
            `Required master role code '${account.roleCode}' does not exist in role table. Provisioning aborted.`
          );
        }

        // 2. Find or Create Demo User
        let user = await tx.user.findUnique({ where: { email: account.email } });
        let userState: "CREATED" | "REUSED" = "REUSED";

        if (user) {
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              passwordHash,
              role: targetRoleCode,
              displayName: user.displayName || account.titleTh,
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
          userState = "CREATED";
          user = await tx.user.create({
            data: {
              email: account.email,
              displayName: account.titleTh,
              passwordHash,
              role: targetRoleCode,
              isActive: true,
              isLocked: false,
              authMethod: "LOCAL",
            },
          });
        }

        // 3. Determine safe scope from actual schema / DB records
        let scopeType: string = account.scopeType;
        let scopeId: string | null = null;

        if (account.scopeType === "PROJECT") {
          if (firstProject) {
            scopeId = firstProject.id;
          } else {
            scopeType = "GLOBAL";
          }
        } else if (account.scopeType === "SITE") {
          if (firstSite) {
            scopeId = firstSite.id;
          } else {
            scopeType = "GLOBAL";
          }
        } else if (account.scopeType === "OWN") {
          scopeId = user.employeeId || null;
        }

        // 4. Reconcile UserRoleAssignment for Demo User cleanly
        const existingAssignments = await tx.userRoleAssignment.findMany({
          where: { userId: user.id, status: "ACTIVE" },
        });

        const exactAssignment = existingAssignments.find((a) => a.roleId === roleRecord!.id);
        let assignmentState: "CREATED" | "REUSED" | "RECONCILED" = "REUSED";
        let activeAssignment = exactAssignment;

        if (!exactAssignment) {
          // If demo user has old/incorrect active assignment, deactivate it safely for demo user
          if (existingAssignments.length > 0) {
            await tx.userRoleAssignment.updateMany({
              where: { userId: user.id, status: "ACTIVE" },
              data: { status: "REVOKED", reason: "Reconciled to canonical demo role" },
            });
            assignmentState = "RECONCILED";
          } else {
            assignmentState = "CREATED";
          }

          activeAssignment = await tx.userRoleAssignment.create({
            data: {
              userId: user.id,
              roleId: roleRecord.id,
              scopeType,
              scopeId,
              status: "ACTIVE",
              reason: "Canonical demo user provisioning",
            },
          });
        } else if (exactAssignment.scopeType !== scopeType || exactAssignment.scopeId !== scopeId) {
          activeAssignment = await tx.userRoleAssignment.update({
            where: { id: exactAssignment.id },
            data: { scopeType, scopeId, status: "ACTIVE" },
          });
          assignmentState = "RECONCILED";
        }

        // 5. Deactivate active sessions for demo user
        await tx.mfaRecoveryCode.deleteMany({ where: { userId: user.id } });
        await tx.userSession.updateMany({
          where: { userId: user.id, status: "ACTIVE" },
          data: { status: "REVOKED" },
        });

        verificationRecords.push({
          email: user.email,
          roleCode: targetRoleCode,
          scopeType: activeAssignment!.scopeType,
          scopeId: activeAssignment!.scopeId,
          userState,
          assignmentState,
          status: activeAssignment!.status,
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
    console.log("CANONICAL DEMO USERS PROVISIONED SUCCESSFULLY");
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
