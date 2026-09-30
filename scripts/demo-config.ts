import { DEMO_ACCOUNTS_CONFIG } from "../src/config/demo-accounts";

export { DEMO_ACCOUNTS_CONFIG };

export const DEMO_ACCOUNTS = DEMO_ACCOUNTS_CONFIG.map((acc) => [
  acc.key,
  acc.email,
  acc.titleTh,
] as const);

export function validateDemoPassword(password: string | undefined): string {
  const valid =
    Boolean(password) &&
    password !== "CHANGE_ME" &&
    password!.length >= 12 &&
    /[A-Z]/.test(password!) &&
    /[a-z]/.test(password!) &&
    /[0-9]/.test(password!) &&
    /[^A-Za-z0-9]/.test(password!);
  if (!valid)
    throw new Error(
      "Demo password policy error: password must be at least 12 chars with upper, lower, digit and special char."
    );
  return password!;
}

export function requireDemoPassword(): string {
  const pwd = process.env.DEMO_PASSWORD || process.env.DEMO_DEFAULT_PASSWORD;
  return validateDemoPassword(pwd);
}
