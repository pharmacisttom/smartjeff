import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { PERMISSIONS, ROLES } from "./seed-roles";
import {
  BACKUP_TABLE,
  assertDemoDatabase,
  assertDemoMode,
  buildDesiredMappings,
  calculatePlannedState,
  decideBackupAction,
  findMissingCodes,
  inspectRbacDemo,
  parseRecoveryMode,
  replaceRolePermissionMappings,
  sanitizeErrorMessage,
} from "./reconcile-rbac-demo";

describe("DEMO RBAC recovery safety", () => {
  const phase1Sql = readFileSync(new URL("./recovery/sync-schema-phase1.sql", import.meta.url), "utf8");
  const phase2Sql = readFileSync(new URL("./recovery/sync-schema-phase2.sql", import.meta.url), "utf8");

  it("requires the explicit DEMO_MODE guard", () => {
    expect(() => assertDemoMode(undefined)).toThrow();
    expect(() => assertDemoMode("false")).toThrow();
    expect(() => assertDemoMode("TRUE")).toThrow();
    expect(() => assertDemoMode("true")).not.toThrow();
  });

  it("allows only the smartop_demo database", () => {
    expect(() => assertDemoDatabase(null)).toThrow();
    expect(() => assertDemoDatabase("smartop")).toThrow();
    expect(() => assertDemoDatabase("smartop_demo")).not.toThrow();
  });

  it("uses the shared Permission and Role master", () => {
    expect(PERMISSIONS).toHaveLength(65);
    expect(new Set(PERMISSIONS.map(({ code }) => code)).size).toBe(PERMISSIONS.length);
    expect(new Set(ROLES.map(({ code }) => code)).size).toBe(ROLES.length);
    const permissionCodes = new Set(PERMISSIONS.map(({ code }) => code));
    expect(ROLES.flatMap(({ permissions }) => permissions).every((code) => permissionCodes.has(code))).toBe(true);
  });

  it("defaults to dry-run and requires an explicit apply mode", () => {
    expect(parseRecoveryMode([])).toBe("dry-run");
    expect(parseRecoveryMode(["--dry-run"])).toBe("dry-run");
    expect(parseRecoveryMode(["--apply"])).toBe("apply");
    expect(() => parseRecoveryMode(["--apply", "--dry-run"])).toThrow();
    expect(() => parseRecoveryMode(["--unknown"])).toThrow();
    expect(BACKUP_TABLE).toBe("rolepermission_backup_20260929");
  });

  it("redacts database URLs from CLI errors", () => {
    expect(sanitizeErrorMessage(new Error("failed mysql://user:secret@db/smartop_demo"))).toBe(
      "failed [database-url-redacted]",
    );
  });

  it("detects missing business keys before destructive work", () => {
    expect(findMissingCodes(["A", "B", "A"], ["A"])).toEqual(["B"]);
  });

  it("treats empty database permissions as planned inserts, not missing master codes", () => {
    const plan = calculatePlannedState(ROLES.map(({ code }) => code), []);
    expect(plan.permissionMasterCount).toBe(65);
    expect(plan.permissionsToCreate).toBe(65);
    expect(plan.desiredRolePermissionCount).toBe(249);
    expect(plan.plannedMissingRolesCount).toBe(0);
    expect(plan.plannedMissingPermissionsCount).toBe(0);
    expect(plan.expectedPostApplyOrphanPermissionCount).toBe(0);
  });

  it("reuses the immutable 246-row backup during resume", () => {
    expect(decideBackupAction(246, 246)).toBe("reuse");
    expect(decideBackupAction(246, 249)).toBe("reuse");
    expect(decideBackupAction(0, 246)).toBe("initialize");
    expect(() => decideBackupAction(245, 246)).toThrow();
    expect(() => decideBackupAction(0, 249)).toThrow();
  });

  it("replaces a resumed 246-row orphan set with 249 verified mappings", async () => {
    const roles = ROLES.map(({ code }, index) => ({ code, id: `role-${index}` }));
    const permissions = PERMISSIONS.map(({ code }, index) => ({ code, id: `permission-${index}` }));
    const desired = buildDesiredMappings(roles, permissions);
    let mappings = Array.from({ length: 246 }, (_, index) => ({
      roleId: roles[index % roles.length].id,
      permissionId: `legacy-orphan-${index}`,
    }));
    const roleIds = new Set(roles.map(({ id }) => id));
    const permissionIds = new Set(permissions.map(({ id }) => id));

    const tx = {
      rolePermission: {
        deleteMany: async () => {
          const count = mappings.length;
          mappings = [];
          return { count };
        },
        createMany: async ({ data }: { data: typeof desired }) => {
          mappings = [...data];
          return { count: data.length };
        },
        count: async () => mappings.length,
      },
      $queryRaw: async (strings: TemplateStringsArray) => {
        const sql = strings.join("?");
        if (sql.includes("duplicate_mappings")) {
          const keys = mappings.map(({ roleId, permissionId }) => `${roleId}:${permissionId}`);
          return [{ count: keys.length - new Set(keys).size }];
        }
        if (sql.includes("LEFT JOIN role")) {
          return [{ count: mappings.filter(({ roleId }) => !roleIds.has(roleId)).length }];
        }
        if (sql.includes("LEFT JOIN Permission")) {
          return [{ count: mappings.filter(({ permissionId }) => !permissionIds.has(permissionId)).length }];
        }
        throw new Error(`Unexpected verification query: ${sql}`);
      },
    } as never;

    expect(desired).toHaveLength(249);
    await replaceRolePermissionMappings(tx, desired);
    expect(mappings).toHaveLength(249);
    expect(mappings.filter(({ permissionId }) => !permissionIds.has(permissionId))).toHaveLength(0);
  });

  it("inspects the pre-reconciliation database without invoking mutation methods", async () => {
    const queryRaw = async (strings: TemplateStringsArray) => {
      const sql = strings.join("?");
      if (sql.includes("SELECT DATABASE()")) return [{ databaseName: "smartop_demo" }];
      if (sql.includes("information_schema.TABLES") && sql.includes("Permission")) return [{ count: 1 }];
      if (sql.includes("information_schema.TABLES")) return [{ count: 0 }];
      if (sql.includes("LEFT JOIN role")) return [{ count: 0 }];
      if (sql.includes("LEFT JOIN Permission")) return [{ count: 246 }];
      throw new Error(`Unexpected read query: ${sql}`);
    };
    const prisma = {
      $queryRaw: queryRaw,
      $queryRawUnsafe: async () => [{ count: 246 }],
      role: { findMany: async () => ROLES.map(({ code }) => ({ code })) },
      permission: { findMany: async () => [] },
    } as never;

    const report = await inspectRbacDemo(prisma);
    expect(report.currentPermissionCount).toBe(0);
    expect(report.currentRolePermissionCount).toBe(246);
    expect(report.currentOrphanPermissionCount).toBe(246);
    expect(report.permissionsToCreate).toBe(65);
    expect(report.plannedMissingPermissionsCount).toBe(0);
    expect(report.desiredRolePermissionCount).toBe(249);
  });

  it("builds mappings from Role.code and Permission.code", () => {
    const roles = ROLES.map(({ code }, index) => ({ code, id: `role-${index}` }));
    const permissionCodes = [...new Set(ROLES.flatMap(({ permissions }) => permissions))];
    const permissions = permissionCodes.map((code, index) => ({ code, id: `permission-${index}` }));
    const mappings = buildDesiredMappings(roles, permissions);

    expect(mappings).toHaveLength(ROLES.reduce((sum, role) => sum + role.permissions.length, 0));
    expect(new Set(mappings.map(({ roleId, permissionId }) => `${roleId}:${permissionId}`)).size).toBe(
      mappings.length,
    );
  });

  it("refuses to build mappings when a required permission is absent", () => {
    const roles = ROLES.map(({ code }, index) => ({ code, id: `role-${index}` }));
    expect(() => buildDesiredMappings(roles, [])).toThrow();
  });

  it("keeps both recovery phases free of destructive SQL", () => {
    const forbidden = /DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM\s+`?(?:User|role|PasswordHistory)`?/i;
    expect(phase1Sql).not.toMatch(forbidden);
    expect(phase2Sql).not.toMatch(forbidden);
    expect(`${phase1Sql}\n${phase2Sql}`).not.toContain("passwordHash");
  });

  it("keeps future-migration ownership out of sync_schema recovery", () => {
    const futureOwned = [
      "PayrollPeriod",
      "PayrollComponent",
      "PayrollPolicy",
      "SitePayrollPolicy",
      "ImportJob",
      "ClientContact",
      "EmployeeDeployment",
      "payrollPeriodId",
      "activationPin",
      "ShiftTemplate",
      "Employee",
    ];
    for (const name of futureOwned) {
      expect(`${phase1Sql}\n${phase2Sql}`).not.toContain(name);
    }
  });

  it("delays RolePermission foreign keys until guarded phase 2", () => {
    expect(phase1Sql).not.toContain("rolepermission_permissionId_fkey");
    expect(phase2Sql).toContain("@smartop_orphan_count");
    expect(phase2Sql).toContain("rolepermission_roleId_fkey");
    expect(phase2Sql).toContain("rolepermission_permissionId_fkey");
  });
});
