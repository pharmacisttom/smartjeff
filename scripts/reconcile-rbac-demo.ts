import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";

import { PERMISSIONS, ROLES } from "./seed-roles";

export const EXPECTED_DATABASE = "smartop_demo";
export const BACKUP_TABLE = "rolepermission_backup_20260928";

export const CREATE_PERMISSION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS \`Permission\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`code\` VARCHAR(191) NOT NULL,
  \`module\` VARCHAR(191) NOT NULL,
  \`action\` VARCHAR(191) NOT NULL,
  \`description\` TEXT NULL,
  \`sensitivity\` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
  \`isActive\` BOOLEAN NOT NULL DEFAULT true,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX \`Permission_code_key\`(\`code\`),
  INDEX \`Permission_code_idx\`(\`code\`),
  INDEX \`Permission_module_idx\`(\`module\`),
  PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`;

type CountRow = { count: bigint | number };
type DatabaseRow = { databaseName: string | null };
type NameRow = { name: string };
type DuplicateRow = { count: bigint | number };

export type RecoveryReport = {
  permissionMasterCount: number;
  roleCount: number;
  backupRolePermissionCount: number;
  oldRolePermissionCount: number;
  newRolePermissionCount: number;
  missingRolesCount: number;
  missingPermissionsCount: number;
  orphanRolesCount: number;
  orphanPermissionsCount: number;
};

export function assertDemoMode(demoMode: string | undefined): void {
  if (demoMode !== "true") {
    throw new Error("DEMO_MODE must be exactly true");
  }
}

export function assertDemoDatabase(databaseName: string | null): void {
  if (databaseName !== EXPECTED_DATABASE) {
    throw new Error(`Database must be exactly ${EXPECTED_DATABASE}`);
  }
}

export function findMissingCodes(required: readonly string[], found: readonly string[]): string[] {
  const foundSet = new Set(found);
  return [...new Set(required)].filter((code) => !foundSet.has(code)).sort();
}

export function buildDesiredMappings(
  roles: ReadonlyArray<{ id: string; code: string }>,
  permissions: ReadonlyArray<{ id: string; code: string }>,
): Array<{ roleId: string; permissionId: string }> {
  const roleIds = new Map(roles.map((role) => [role.code, role.id]));
  const permissionIds = new Map(permissions.map((permission) => [permission.code, permission.id]));

  return ROLES.flatMap((role) =>
    role.permissions.map((permissionCode) => {
      const roleId = roleIds.get(role.code);
      const permissionId = permissionIds.get(permissionCode);
      if (!roleId || !permissionId) {
        throw new Error("Cannot build mappings while required RBAC master data is missing");
      }
      return { roleId, permissionId };
    }),
  );
}

async function readCount(prisma: PrismaClient, table: "rolepermission" | typeof BACKUP_TABLE): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*) AS count FROM \`${table}\``);
  return Number(rows[0]?.count ?? 0);
}

async function ensureVerifiedBackup(prisma: PrismaClient, currentCount: number): Promise<number> {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS \`${BACKUP_TABLE}\` LIKE \`rolepermission\``);
  const existingBackupCount = await readCount(prisma, BACKUP_TABLE);

  if (existingBackupCount === 0 && currentCount > 0) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO \`${BACKUP_TABLE}\` SELECT * FROM \`rolepermission\``,
    );
  }

  const backupCount = await readCount(prisma, BACKUP_TABLE);
  if (backupCount !== currentCount) {
    throw new Error("RolePermission backup count does not match the current table");
  }
  return backupCount;
}

async function ensurePermissionTable(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(CREATE_PERMISSION_TABLE_SQL);

  const columns = await prisma.$queryRaw<NameRow[]>`
    SELECT COLUMN_NAME AS name
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND BINARY TABLE_NAME = ${"Permission"}
    ORDER BY ORDINAL_POSITION
  `;
  const expectedColumns = [
    "id",
    "code",
    "module",
    "action",
    "description",
    "sensitivity",
    "isActive",
    "createdAt",
  ];
  if (columns.map(({ name }) => name).join("|") !== expectedColumns.join("|")) {
    throw new Error("Permission table columns do not match prisma/schema.prisma");
  }

  const indexes = await prisma.$queryRaw<NameRow[]>`
    SELECT DISTINCT INDEX_NAME AS name
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND BINARY TABLE_NAME = ${"Permission"}
  `;
  const indexNames = new Set(indexes.map(({ name }) => name));
  for (const requiredIndex of ["PRIMARY", "Permission_code_key", "Permission_code_idx", "Permission_module_idx"]) {
    if (!indexNames.has(requiredIndex)) {
      throw new Error("Permission table indexes do not match prisma/schema.prisma");
    }
  }
}

export async function reconcileRbacDemo(prisma: PrismaClient): Promise<RecoveryReport> {
  assertDemoMode(process.env.DEMO_MODE);

  const databaseRows = await prisma.$queryRaw<DatabaseRow[]>`SELECT DATABASE() AS databaseName`;
  assertDemoDatabase(databaseRows[0]?.databaseName ?? null);

  const lockRows = await prisma.$queryRaw<CountRow[]>`SELECT GET_LOCK('smartop_demo_reconcile_rbac', 0) AS count`;
  if (Number(lockRows[0]?.count ?? 0) !== 1) {
    throw new Error("Another RBAC recovery process is already running");
  }

  try {
    const oldRolePermissionCount = await readCount(prisma, "rolepermission");
    const backupRolePermissionCount = await ensureVerifiedBackup(prisma, oldRolePermissionCount);
    await ensurePermissionTable(prisma);

    for (const permission of PERMISSIONS) {
      await prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          module: permission.module,
          action: permission.action,
          description: permission.description,
          sensitivity: permission.sensitivity ?? "NORMAL",
          isActive: true,
        },
        create: {
          code: permission.code,
          module: permission.module,
          action: permission.action,
          description: permission.description,
          sensitivity: permission.sensitivity ?? "NORMAL",
          isActive: true,
        },
      });
    }

    for (const role of ROLES) {
      await prisma.role.upsert({
        where: { code: role.code },
        update: {
          nameTh: role.nameTh,
          nameEn: role.nameEn,
          description: role.description,
          level: role.level,
          departmentType: role.departmentType,
          isSystem: role.isSystem,
          isActive: true,
        },
        create: {
          code: role.code,
          nameTh: role.nameTh,
          nameEn: role.nameEn,
          description: role.description,
          level: role.level,
          departmentType: role.departmentType,
          isSystem: role.isSystem,
          isActive: true,
        },
      });
    }

    const roles = await prisma.role.findMany({ select: { id: true, code: true } });
    const permissions = await prisma.permission.findMany({ select: { id: true, code: true } });
    const requiredRoleCodes = ROLES.map(({ code }) => code);
    const requiredPermissionCodes = [...new Set(ROLES.flatMap(({ permissions: codes }) => codes))];
    const missingRoles = findMissingCodes(requiredRoleCodes, roles.map(({ code }) => code));
    const missingPermissions = findMissingCodes(requiredPermissionCodes, permissions.map(({ code }) => code));

    if (missingRoles.length > 0 || missingPermissions.length > 0) {
      throw new Error("Required Role or Permission master data is missing");
    }

    const desiredMappings = buildDesiredMappings(roles, permissions);
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany();
      await tx.rolePermission.createMany({ data: desiredMappings, skipDuplicates: true });

      const count = await tx.rolePermission.count();
      const duplicates = await tx.$queryRaw<DuplicateRow[]>`
        SELECT COUNT(*) AS count
        FROM (
          SELECT roleId, permissionId
          FROM rolepermission
          GROUP BY roleId, permissionId
          HAVING COUNT(*) > 1
        ) AS duplicate_mappings
      `;
      const orphanRoles = await tx.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count
        FROM rolepermission rp
        LEFT JOIN role r ON r.id = rp.roleId
        WHERE r.id IS NULL
      `;
      const orphanPermissions = await tx.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count
        FROM rolepermission rp
        LEFT JOIN Permission p ON p.id = rp.permissionId
        WHERE p.id IS NULL
      `;

      if (
        count !== desiredMappings.length ||
        Number(duplicates[0]?.count ?? 0) !== 0 ||
        Number(orphanRoles[0]?.count ?? 0) !== 0 ||
        Number(orphanPermissions[0]?.count ?? 0) !== 0
      ) {
        throw new Error("Post-rebuild RolePermission verification failed");
      }
    });

    const newRolePermissionCount = await prisma.rolePermission.count();
    const orphanRoles = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count FROM rolepermission rp LEFT JOIN role r ON r.id = rp.roleId WHERE r.id IS NULL
    `;
    const orphanPermissions = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count FROM rolepermission rp LEFT JOIN Permission p ON p.id = rp.permissionId WHERE p.id IS NULL
    `;

    return {
      permissionMasterCount: await prisma.permission.count(),
      roleCount: await prisma.role.count(),
      backupRolePermissionCount,
      oldRolePermissionCount,
      newRolePermissionCount,
      missingRolesCount: missingRoles.length,
      missingPermissionsCount: missingPermissions.length,
      orphanRolesCount: Number(orphanRoles[0]?.count ?? 0),
      orphanPermissionsCount: Number(orphanPermissions[0]?.count ?? 0),
    };
  } finally {
    await prisma.$queryRaw`SELECT RELEASE_LOCK('smartop_demo_reconcile_rbac')`;
  }
}

function printReport(report: RecoveryReport): void {
  console.log(`Permission master count: ${report.permissionMasterCount}`);
  console.log(`Role count: ${report.roleCount}`);
  console.log(`Backup RolePermission count: ${report.backupRolePermissionCount}`);
  console.log(`Old RolePermission count: ${report.oldRolePermissionCount}`);
  console.log(`New RolePermission count: ${report.newRolePermissionCount}`);
  console.log(`Missing roles count: ${report.missingRolesCount}`);
  console.log(`Missing permissions count: ${report.missingPermissionsCount}`);
  console.log(`Orphan roles count: ${report.orphanRolesCount}`);
  console.log(`Orphan permissions count: ${report.orphanPermissionsCount}`);
}

async function main(): Promise<void> {
  assertDemoMode(process.env.DEMO_MODE);
  const prisma = new PrismaClient();
  try {
    printReport(await reconcileRbacDemo(prisma));
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    console.error("RBAC recovery aborted");
    process.exitCode = 1;
  });
}
