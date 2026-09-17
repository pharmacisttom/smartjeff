import { describe, expect, it } from "vitest";
import { PasswordPolicyService } from "./password-policy.service";

describe("PasswordPolicyService", () => {
  it("should enforce minimum 12 characters and complexity rules", () => {
    const weak = PasswordPolicyService.validatePassword("short");
    expect(weak.valid).toBe(false);
    expect(weak.errors.length).toBeGreaterThan(0);

    const validPass = PasswordPolicyService.validatePassword("SmartJeff2026!Secured");
    expect(validPass.valid).toBe(true);
    expect(validPass.errors.length).toBe(0);
  });

  it("should evaluate expired passwords correctly for LOCAL users", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const isExp = PasswordPolicyService.isExpired({
      passwordExpiresAt: pastDate,
      authMethod: "LOCAL",
    });
    expect(isExp).toBe(true);
  });

  it("should NOT expire passwords for external SSO users", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const isExp = PasswordPolicyService.isExpired({
      passwordExpiresAt: pastDate,
      authMethod: "SSO",
    });
    expect(isExp).toBe(false);
  });

  it("should calculate status correctly", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const statusExpired = PasswordPolicyService.checkPasswordStatus({
      passwordExpiresAt: pastDate,
      authMethod: "LOCAL",
    });
    expect(statusExpired).toBe("EXPIRED");

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5); // 5 days left

    const statusExpiring = PasswordPolicyService.checkPasswordStatus({
      passwordExpiresAt: futureDate,
      authMethod: "LOCAL",
    });
    expect(statusExpiring).toBe("EXPIRING");
  });
});
