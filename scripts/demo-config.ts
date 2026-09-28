export const DEMO_ACCOUNTS = [
  ["ADMIN", "admin@demo.smartop.local", "Demo Administrator"],
  ["EXECUTIVE", "executive@demo.smartop.local", "Demo Executive"],
  ["HR", "hr@demo.smartop.local", "Demo HR Payroll"],
  ["COORDINATOR", "coordinator@demo.smartop.local", "Demo Coordinator"],
  ["SITE_SUPERVISOR", "supervisor@demo.smartop.local", "Demo Site Supervisor"],
  ["EMPLOYEE", "employee@demo.smartop.local", "Demo Employee"],
] as const;

export function requireDemoPassword(): string {
  const password = process.env.DEMO_DEFAULT_PASSWORD;
  if (!password || password === "CHANGE_ME" || password.length < 12) {
    throw new Error("Set DEMO_DEFAULT_PASSWORD to a non-placeholder value of at least 12 characters");
  }
  return password;
}
