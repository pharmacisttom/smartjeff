import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";

import { PERMISSIONS, ROLES } from "./seed-roles";

export const EXPECTED_DATABASE = "smartop_demo";
export const BACKUP_TABLE = "rolepermission_backup_20260929";
export const EXPECTED_LEGACY_ROLE_PERMISSION_COUNT = 246;
export type RecoveryMode = "dry-run" | "apply";

type CountRow = { count: bigint | number };
type DatabaseRow = { databaseName: string | null };
type NameRow = { name: string };
type DuplicateRow = { count: bigint | number };
type DesiredMapping = { roleId: string; permissionId: string };
type RolePermissionTransaction = {
  rolePermission: {
    deleteMany(): Promise<{ count: number }>;
    createMany(args: { data: DesiredMapping[]; skipDuplicates: boolean }): Promise<{ count: number }>;
    count(): Promise<number>;
  };
  $queryRaw<T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
};

export type RecoveryReport = {
  currentPermissionCount: number;
  currentRoleCount: number;
  currentBackupRolePermissionCount: number;
  currentRolePermissionCount: number;
  currentOrphanRoleCount: number;
  currentOrphanPermissionCount: number;
  permissionMasterCount: number;
  permissionsToCreate: number;
  desiredRolePermissionCount: number;
  plannedMissingRolesCount: number;
  plannedMissingPermissionsCount: number;
  expectedPostApplyOrphanRoleCount: number;
  expectedPostApplyOrphanPermissionCount: number;
};

export type PlannedState = Pick<
  RecoveryReport,
  | "permissionMasterCount"
  | "permissionsToCreate"
  | "desiredRolePermissionCount"
  | "plannedMissingRolesCount"
  | "plannedMissingPermissionsCount"
  | "expectedPostApplyOrphanRoleCount"
  | "expectedPostApplyOrphanPermissionCount"
>;

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

export function parseRecoveryMode(args: readonly string[]): RecoveryMode {
  const modes = args.filter((arg) => arg === "--dry-run" || arg === "--apply");
  const unknown = args.filter((arg) => arg.startsWith("--") && arg !== "--dry-run" && arg !== "--apply");
  if (unknown.length > 0 || modes.length > 1) {
    throw new Error("Use exactly one of --dry-run or --apply");
  }
  return modes[0] === "--apply" ? "apply" : "dry-run";
}

export function findMissingCodes(required: readonly string[], found: readonly string[]): string[] {
  const foundSet = new Set(found);
  return [...new Set(required)].filter((code) => !foundSet.has(code)).sort();
}

export function calculatePlannedState(
  databaseRoleCodes: readonly string[],
  databasePermissionCodes: readonly string[],
): PlannedState {
  const masterPermissionCodes = PERMISSIONS.map(({ code }) => code);
  const referencedPermissionCodes = [...new Set(ROLES.flatMap(({ permissions }) => permissions))];
  const plannedMissingRoles = findMissingCodes(ROLES.map(({ code }) => code), databaseRoleCodes);
  const plannedMissingPermissions = findMissingCodes(referencedPermissionCodes, masterPermissionCodes);

  return {
    permissionMasterCount: PERMISSIONS.length,
    permissionsToCreate: findMissingCodes(masterPermissionCodes, databasePermissionCodes).length,
    desiredRolePermissionCount: ROLES.reduce((total, role) => total + role.permissions.length, 0),
    plannedMissingRolesCount: plannedMissingRoles.length,
    plannedMissingPermissionsCount: plannedMissingPermissions.length,
    expectedPostApplyOrphanRoleCount: plannedMissingRoles.length === 0 ? 0 : plannedMissingRoles.length,
    expectedPostApplyOrphanPermissionCount:
      plannedMissingPermissions.length === 0 ? 0 : plannedMissingPermissions.length,
  };
}

export function decideBackupAction(existingBackupCount: number, currentCount: number): "reuse" | "initialize" {
  if (existingBackupCount === EXPECTED_LEGACY_ROLE_PERMISSION_COUNT) {
    return "reuse";
  }
  if (existingBackupCount !== 0) {
    throw new Error("Existing RolePermission backup is not the reviewed 246-row snapshot");
  }
  if (currentCount !== EXPECTED_LEGACY_ROLE_PERMISSION_COUNT) {
    throw new Error("Cannot initialize backup because the source is not the reviewed 246-row legacy set");
  }
  return "initialize";
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
  const action = decideBackupAction(existingBackupCount, currentCount);

  if (action === "reuse") {
    return existingBackupCount;
  }

  if (currentCount > 0) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO \`${BACKUP_TABLE}\` SELECT * FROM \`rolepermission\``,
    );
  }

  const backupCount = await readCount(prisma, BACKUP_TABLE);
  if (backupCount !== EXPECTED_LEGACY_ROLE_PERMISSION_COUNT) {
    throw new Error("RolePermission backup is not the reviewed 246-row snapshot");
  }
  return backupCount;
}

export async function replaceRolePermissionMappings(
  tx: RolePermissionTransaction,
  desiredMappings: DesiredMapping[],
): Promise<void> {
  await tx.rolePermission.deleteMany();
  await tx.rolePermission.createMany({ data: desiredMappings, skipDuplicates: false });

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
}

async function verifyPermissionTable(prisma: PrismaClient): Promise<void> {
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
    await verifyPermissionTable(prisma);

    const currentPermissions = await prisma.permission.findMany({ select: { code: true } });
    const currentPermissionCount = currentPermissions.length;
    const oldRolePermissionCount = await readCount(prisma, "rolepermission");
    const currentOrphanRoles = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count FROM rolepermission rp LEFT JOIN role r ON r.id = rp.roleId WHERE r.id IS NULL
    `;
    const currentOrphanPermissions = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count
      FROM rolepermission rp LEFT JOIN Permission p ON p.id = rp.permissionId
      WHERE p.id IS NULL
    `;
    const backupRolePermissionCount = await ensureVerifiedBackup(prisma, oldRolePermissionCount);

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

    const permissions = await prisma.permission.findMany({ select: { id: true, code: true } });
    const roles = await prisma.role.findMany({ select: { id: true, code: true } });
    const planned = calculatePlannedState(
      roles.map(({ code }) => code),
      currentPermissions.map(({ code }) => code),
    );
    const requiredRoleCodes = ROLES.map(({ code }) => code);
    const requiredPermissionCodes = [...new Set(ROLES.flatMap(({ permissions: codes }) => codes))];
    const missingRoles = findMissingCodes(requiredRoleCodes, roles.map(({ code }) => code));
    const missingMasterPermissions = findMissingCodes(requiredPermissionCodes, PERMISSIONS.map(({ code }) => code));
    const missingDatabasePermissions = findMissingCodes(requiredPermissionCodes, permissions.map(({ code }) => code));

    if (missingRoles.length > 0 || missingMasterPermissions.length > 0 || missingDatabasePermissions.length > 0) {
      throw new Error("Required Role or Permission master data is missing");
    }

    const desiredMappings = buildDesiredMappings(roles, permissions);
    await prisma.$transaction(
      async (tx) => {
        await replaceRolePermissionMappings(tx, desiredMappings);
      },
      { maxWait: 10_000, timeout: 60_000 },
    );

    const newRolePermissionCount = await prisma.rolePermission.count();
    const orphanRoles = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count FROM rolepermission rp LEFT JOIN role r ON r.id = rp.roleId WHERE r.id IS NULL
    `;
    const orphanPermissions = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count FROM rolepermission rp LEFT JOIN Permission p ON p.id = rp.permissionId WHERE p.id IS NULL
    `;

    return {
      currentPermissionCount,
      currentRoleCount: roles.length,
      currentBackupRolePermissionCount: backupRolePermissionCount,
      currentRolePermissionCount: oldRolePermissionCount,
      currentOrphanRoleCount: Number(currentOrphanRoles[0]?.count ?? 0),
      currentOrphanPermissionCount: Number(currentOrphanPermissions[0]?.count ?? 0),
      permissionMasterCount: planned.permissionMasterCount,
      permissionsToCreate: planned.permissionsToCreate,
      desiredRolePermissionCount: newRolePermissionCount,
      plannedMissingRolesCount: missingRoles.length,
      plannedMissingPermissionsCount: missingMasterPermissions.length,
      expectedPostApplyOrphanRoleCount: Number(orphanRoles[0]?.count ?? 0),
      expectedPostApplyOrphanPermissionCount: Number(orphanPermissions[0]?.count ?? 0),
    };
  } finally {
    await prisma.$queryRaw`SELECT RELEASE_LOCK('smartop_demo_reconcile_rbac')`;
  }
}

export async function inspectRbacDemo(prisma: PrismaClient): Promise<RecoveryReport> {
  const databaseRows = await prisma.$queryRaw<DatabaseRow[]>`SELECT DATABASE() AS databaseName`;
  assertDemoDatabase(databaseRows[0]?.databaseName ?? null);

  const oldRolePermissionCount = await readCount(prisma, "rolepermission");
  const roles = await prisma.role.findMany({ select: { code: true } });
  const permissionTable = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND BINARY TABLE_NAME = ${"Permission"}
  `;
  const permissions = Number(permissionTable[0]?.count ?? 0) === 1
    ? await prisma.permission.findMany({ select: { code: true } })
    : [];
  const backupTable = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND BINARY TABLE_NAME = ${BACKUP_TABLE}
  `;
  const backupRolePermissionCount = Number(backupTable[0]?.count ?? 0) === 1
    ? await readCount(prisma, BACKUP_TABLE)
    : 0;
  const orphanRoles = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*) AS count FROM rolepermission rp LEFT JOIN role r ON r.id = rp.roleId WHERE r.id IS NULL
  `;
  const orphanPermissions = Number(permissionTable[0]?.count ?? 0) === 1
    ? await prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count
        FROM rolepermission rp LEFT JOIN Permission p ON p.id = rp.permissionId
        WHERE p.id IS NULL
      `
    : [{ count: oldRolePermissionCount }];
  const planned = calculatePlannedState(
    roles.map(({ code }) => code),
    permissions.map(({ code }) => code),
  );

  return {
    currentPermissionCount: permissions.length,
    currentRoleCount: roles.length,
    currentBackupRolePermissionCount: backupRolePermissionCount,
    currentRolePermissionCount: oldRolePermissionCount,
    currentOrphanRoleCount: Number(orphanRoles[0]?.count ?? 0),
    currentOrphanPermissionCount: Number(orphanPermissions[0]?.count ?? 0),
    ...planned,
  };
}

function printReport(report: RecoveryReport): void {
  console.log("CURRENT DATABASE:");
  console.log(`Current permission count: ${report.currentPermissionCount}`);
  console.log(`Current role count: ${report.currentRoleCount}`);
  console.log(`Current backup RolePermission count: ${report.currentBackupRolePermissionCount}`);
  console.log(`Old RolePermission count: ${report.currentRolePermissionCount}`);
  console.log(`Current orphan role count: ${report.currentOrphanRoleCount}`);
  console.log(`Current orphan permission count: ${report.currentOrphanPermissionCount}`);
  console.log("PLANNED STATE:");
  console.log(`Permission master count: ${report.permissionMasterCount}`);
  console.log(`Permissions to create: ${report.permissionsToCreate}`);
  console.log(`Desired RolePermission count: ${report.desiredRolePermissionCount}`);
  console.log(`Missing Role codes: ${report.plannedMissingRolesCount}`);
  console.log(`Missing Permission codes referenced by Roles: ${report.plannedMissingPermissionsCount}`);
  console.log(`Expected post-apply orphan role count: ${report.expectedPostApplyOrphanRoleCount}`);
  console.log(`Expected post-apply orphan permission count: ${report.expectedPostApplyOrphanPermissionCount}`);
}

export function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown recovery error";
  return message
    .replace(/(?:mysql|mariadb):\/\/[^\s]+/gi, "[database-url-redacted]")
    .replace(/password\s*[=:]\s*[^\s,;]+/gi, "password=[redacted]")
    .slice(0, 500);
}

async function main(): Promise<void> {
  const mode = parseRecoveryMode(process.argv.slice(2));
  if (mode === "apply") {
    assertDemoMode(process.env.DEMO_MODE);
  }
  const prisma = new PrismaClient();
  try {
    printReport(mode === "apply" ? await reconcileRbacDemo(prisma) : await inspectRbacDemo(prisma));
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(`RBAC recovery aborted: ${sanitizeErrorMessage(error)}`);
    process.exitCode = 1;
  });
}
