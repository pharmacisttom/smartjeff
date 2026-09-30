import { describe, expect, it } from "vitest";
import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { hashPassword } from "../src/lib/password";
import { DEMO_ACCOUNTS, validateDemoPassword } from "./demo-config";

describe("demo account security policy", () => {
  it("defines six unique demo users without plaintext password fields", () => {
    expect(DEMO_ACCOUNTS).toHaveLength(6);
    expect(new Set(DEMO_ACCOUNTS.map(([, email]) => email)).size).toBe(6);
    expect(JSON.stringify(DEMO_ACCOUNTS)).not.toMatch(/password/i);
  });
  it.each([undefined, "CHANGE_ME", "short", "alllowercase12!", "ALLUPPERCASE12!", "NoDigitsHere!", "NoSpecial123A"])("blocks a missing or weak password", (password) => {
    expect(() => validateDemoPassword(password)).toThrow(/demo password policy/i);
  });
  it("accepts a strong password and hashes it with Argon2id", async () => {
    const password = validateDemoPassword(`Aa1!${randomBytes(8).toString("hex")}`);
    const hash = await hashPassword(password);
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await argon2.verify(hash, password)).toBe(true);
    expect(hash).not.toContain(password);
  });
});
