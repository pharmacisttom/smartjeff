import { PERMISSIONS, PermissionCode, DEFAULT_ROLE_PERMISSIONS } from "./permissions";

export interface RBACUser {
  roleCode: "SUPERADMIN" | "ADMIN" | "SUPERVISOR" | "USER" | string;
  permissions?: string[];
}

export function hasPermission(
  user: RBACUser | null | undefined,
  required: PermissionCode | PermissionCode[],
  mode: "any" | "all" = "any"
): boolean {
  if (!user) return false;

  // SUPERADMIN always bypasses permission checks
  if (user.roleCode === "SUPERADMIN") return true;

  const requiredArray = Array.isArray(required) ? required : [required];
  
  // Use explicit permissions if present, otherwise fallback to default role permissions
  const effectivePerms = user.permissions && user.permissions.length > 0
    ? user.permissions
    : (DEFAULT_ROLE_PERMISSIONS[user.roleCode] || []);

  if (mode === "any") {
    return requiredArray.some((perm) => effectivePerms.includes(perm as PermissionCode));
  }
  return requiredArray.every((perm) => effectivePerms.includes(perm as PermissionCode));
}

export function getUserPermissions(roleCode: string): PermissionCode[] {
  return DEFAULT_ROLE_PERMISSIONS[roleCode] || DEFAULT_ROLE_PERMISSIONS.USER;
}
