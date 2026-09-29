import { describe, expect, it } from "vitest";

import { PERMISSIONS, ROLES } from "./seed-roles";
import {
  BACKUP_TABLE,
  CREATE_PERMISSION_TABLE_SQL,
  assertDemoDatabase,
  assertDemoMode,
  buildDesiredMappings,
  findMissingCodes,
} from "./reconcile-rbac-demo";

describe("DEMO RBAC recovery safety", () => {
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

  it("declares only the reviewed Permission table and required indexes", () => {
    expect(CREATE_PERMISSION_TABLE_SQL).toContain("CREATE TABLE IF NOT EXISTS `Permission`");
    expect(CREATE_PERMISSION_TABLE_SQL).toContain("`Permission_code_key`");
    expect(CREATE_PERMISSION_TABLE_SQL).toContain("`Permission_code_idx`");
    expect(CREATE_PERMISSION_TABLE_SQL).toContain("`Permission_module_idx`");
    expect(BACKUP_TABLE).toBe("rolepermission_backup_20260928");
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
});
