import { afterEach, describe, expect, it } from "vitest";
import { DEMO_LANGUAGES, DEMO_ROLE_OPTIONS, isDemoEnvironment, readiness, validateDemoPassword } from "./demo-accounts";

describe("demo account security policy", () => {
  const originalDemo = process.env.DEMO_MODE;
  const originalApp = process.env.APP_ENV;
  afterEach(() => { process.env.DEMO_MODE = originalDemo; process.env.APP_ENV = originalApp; });

  it.each(["Short1!", "alllowercase1!", "ALLUPPERCASE1!", "NoNumber!!", "NoSpecial123"])("rejects weak password %s", (value) => expect(validateDemoPassword(value)).toBe(false));
  it.each(["StrongDemo1!", "Another#Password2"])("accepts strong password", (value) => expect(validateDemoPassword(value)).toBe(true));
  it("defines exactly six operational demo roles", () => expect(Object.keys(DEMO_ROLE_OPTIONS)).toHaveLength(6));
  it("limits administrator to SUPER_ADMIN", () => expect(DEMO_ROLE_OPTIONS.ADMIN).toEqual(["SUPER_ADMIN"]));
  it("supports Thai, Khmer and Myanmar", () => expect(DEMO_LANGUAGES).toEqual(["th", "km", "my"]));
  it.each(["DEMO", "UAT"])("allows bulk operations in %s", (environment) => { process.env.DEMO_MODE = "false"; process.env.APP_ENV = environment; expect(isDemoEnvironment()).toBe(true); });
  it("allows explicit demo mode", () => { process.env.DEMO_MODE = "true"; process.env.APP_ENV = "PRODUCTION"; expect(isDemoEnvironment()).toBe(true); });
  it("blocks bulk operations in production", () => { process.env.DEMO_MODE = "false"; process.env.APP_ENV = "PRODUCTION"; expect(isDemoEnvironment()).toBe(false); });
  it("is ready only when core checks pass", () => expect(readiness({ exists: true, active: true, locked: false, roleValid: true, passwordReady: true, enabled: true, mfa: false, pinActive: false })).toBe("READY"));
  it("warns when MFA remains enabled", () => expect(readiness({ exists: true, active: true, locked: false, roleValid: true, passwordReady: true, enabled: true, mfa: true, pinActive: false })).toBe("WARNING"));
  it("warns when an activation PIN is active", () => expect(readiness({ exists: true, active: true, locked: false, roleValid: true, passwordReady: true, enabled: true, mfa: false, pinActive: true })).toBe("WARNING"));
  it.each([
    { exists: false }, { active: false }, { locked: true }, { roleValid: false }, { passwordReady: false }, { enabled: false },
  ])("marks failed core check as not ready: $exists/$active/$locked/$roleValid", (override) => expect(readiness({ exists: true, active: true, locked: false, roleValid: true, passwordReady: true, enabled: true, mfa: false, pinActive: false, ...override })).toBe("NOT_READY"));
});
