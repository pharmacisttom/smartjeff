export const DEMO_ROLE_OPTIONS = {
  ADMIN: ["SUPER_ADMIN"],
  EXECUTIVE: ["EXECUTIVE"],
  HR_PAYROLL: ["HR_MANAGER"],
  COORDINATOR: ["PROJECT_MANAGER"],
  SITE_SUPERVISOR: ["SITE_MANAGER", "SUPERVISOR"],
  EMPLOYEE: ["EMPLOYEE"],
} as const;

export const DEMO_LANGUAGES = ["th", "km", "my"] as const;
export type DemoRole = keyof typeof DEMO_ROLE_OPTIONS;

export function isDemoEnvironment() {
  return process.env.DEMO_MODE === "true" || ["DEMO", "UAT"].includes(process.env.APP_ENV || "");
}

export function validateDemoPassword(value: string) {
  return value.length >= 10 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export function readiness(input: { exists: boolean; active: boolean; locked: boolean; roleValid: boolean; passwordReady: boolean; enabled: boolean; mfa: boolean; pinActive: boolean }) {
  if (!input.exists || !input.active || input.locked || !input.roleValid || !input.passwordReady || !input.enabled) return "NOT_READY" as const;
  if (input.mfa || input.pinActive) return "WARNING" as const;
  return "READY" as const;
}
