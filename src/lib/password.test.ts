import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { hashPassword, verifyPassword } from "./password";

describe("password verification", () => {
  it("creates Argon2id hashes and rejects incorrect passwords", async () => {
    const password = randomBytes(24).toString("hex");
    const hash = await hashPassword(password);
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, password)).toBe(true);
    expect(await verifyPassword(hash, password + "wrong")).toBe(false);
  });
  it("supports existing bcrypt hashes but never plaintext or malformed hashes", async () => {
    const password = randomBytes(24).toString("hex");
    expect(await verifyPassword(await bcrypt.hash(password, 4), password)).toBe(true);
    expect(await verifyPassword(password, password)).toBe(false);
    expect(await verifyPassword(null, password)).toBe(false);
    expect(await verifyPassword("$argon2id$invalid", password)).toBe(false);
  });
});
