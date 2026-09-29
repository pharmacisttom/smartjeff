import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { PERMISSIONS, ROLES } from "./seed-roles";
import {
  BACKUP_TABLE,
  assertDemoDatabase,
  assertDemoMode,
  buildDesiredMappings,
  findMissingCodes,
  parseRecoveryMode,
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

  it("detects missing business keys before destructive work", () => {
    expect(findMissingCodes(["A", "B", "A"], ["A"])).toEqual(["B"]);
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
