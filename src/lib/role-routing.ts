export const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  EMPLOYEE: "/check-in",
  SUPERVISOR: "/operations",
  OPERATIONS: "/operations",
  EXECUTIVE: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  SUPERADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
  HR: "/admin/dashboard",
  FINANCE: "/admin/dashboard",
  COORDINATOR: "/admin/dashboard",
};

export function getDefaultRouteForRole(role?: string): string {
  if (!role) return "/login";
  return ROLE_DEFAULT_ROUTES[role.toUpperCase()] || "/admin/dashboard";
}
