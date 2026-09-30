export const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  EMPLOYEE: "/check-in",
  SUPERVISOR: "/operations",
  SITE_SUPERVISOR: "/operations",
  SITE_MANAGER: "/operations",
  OPERATIONS: "/operations",
  EXECUTIVE: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  SUPERADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
  HR: "/admin/dashboard",
  HR_MANAGER: "/admin/dashboard",
  FINANCE: "/admin/dashboard",
  COORDINATOR: "/admin/dashboard",
  PROJECT_MANAGER: "/admin/dashboard",
};

export function getDefaultRouteForRole(role?: string): string {
  if (!role) return "/login";
  return ROLE_DEFAULT_ROUTES[role.toUpperCase()] || "/admin/dashboard";
}
