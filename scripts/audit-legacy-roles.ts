import { PrismaClient } from "@prisma/client";

export interface AccidentalRoleReport {
  roleCode: string;
  roleId: string;
  userRoleAssignmentCount: number;
  rolePermissionCount: number;
  approvalAuthorityCount: number;
}

export async function auditAccidentalRoles(prisma: PrismaClient): Promise<AccidentalRoleReport[]> {
  const canonicalRoleCodes = new Set([
    "SUPER_ADMIN",
    "SECURITY_ADMIN",
    "PLATFORM_ADMIN",
    "BREAK_GLASS_ADMIN",
    "EXECUTIVE",
    "HR_MANAGER",
    "HR_OFFICER",
    "PROJECT_MANAGER",
    "SITE_MANAGER",
    "SUPERVISOR",
    "FINANCE_OFFICER",
    "EMPLOYEE",
  ]);

  const allRoles = await prisma.role.findMany();
  const accidentalRoles: AccidentalRoleReport[] = [];

  for (const role of allRoles) {
    if (!canonicalRoleCodes.has(role.code)) {
      const userAssignmentCount = await prisma.userRoleAssignment.count({
        where: { roleId: role.id },
      });
      const rolePermissionCount = await prisma.rolePermission.count({
        where: { roleId: role.id },
      });
      const approvalAuthorityCount = await prisma.approvalAuthority.count({
        where: { roleId: role.id },
      });

      accidentalRoles.push({
        roleCode: role.code,
        roleId: role.id,
        userRoleAssignmentCount: userAssignmentCount,
        rolePermissionCount,
        approvalAuthorityCount,
      });
    }
  }

  return accidentalRoles;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const report = await auditAccidentalRoles(prisma);
    console.log("\n==================================================");
    console.log("ACCIDENTAL / NON-CANONICAL ROLES AUDIT REPORT");
    console.log("==================================================");
    if (report.length === 0) {
      console.log("✅ No accidental or non-canonical roles found in database.");
    } else {
      console.warn("⚠️ Non-canonical roles detected in database:");
      console.table(report);
      console.log("\nCleanup Plan Proposal:");
      console.log("1. Ensure all active UserRoleAssignments are migrated to canonical roles.");
      console.log("2. Safely remove orphan RolePermission entries for non-canonical roles.");
      console.log("3. Safely delete non-canonical role master records.");
    }
  } catch (err) {
    console.error("Error auditing legacy roles:", err);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
