export const DEMO_ACCOUNTS = [
  ["ADMIN", "admin@demo.smartop.local", "Demo Administrator"],
  ["EXECUTIVE", "executive@demo.smartop.local", "Demo Executive"],
  ["HR", "hr@demo.smartop.local", "Demo HR Payroll"],
  ["COORDINATOR", "coordinator@demo.smartop.local", "Demo Coordinator"],
  ["SITE_SUPERVISOR", "supervisor@demo.smartop.local", "Demo Site Supervisor"],
  ["EMPLOYEE", "employee@demo.smartop.local", "Demo Employee"],
] as const;

export function validateDemoPassword(password: string | undefined): string {
  const valid = Boolean(password)
    && password !== "CHANGE_ME"
    && password!.length >= 12
    && /[A-Z]/.test(password!)
    && /[a-z]/.test(password!)
    && /[0-9]/.test(password!)
    && /[^A-Za-z0-9]/.test(password!);
  if (!valid) throw new Error("DEMO_DEFAULT_PASSWORD does not meet the demo password policy.");
  return password!;
}

export function requireDemoPassword(): string {
  return validateDemoPassword(process.env.DEMO_DEFAULT_PASSWORD);
}
