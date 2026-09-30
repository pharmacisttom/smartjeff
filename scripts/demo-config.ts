export const DEMO_ACCOUNTS = [
  ["ADMIN", "pharmacisttom@gmail.com", "Demo Administrator"],
  ["EXECUTIVE", "executive@j2k.com", "Demo Executive"],
  ["HR", "hr@j2k.com", "Demo HR Payroll"],
  ["COORDINATOR", "coordinator@j2k.com", "Demo Coordinator"],
  ["SITE_SUPERVISOR", "supervisor@j2k.com", "Demo Site Supervisor"],
  ["EMPLOYEE", "employee@j2k.com", "Demo Employee"],
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
