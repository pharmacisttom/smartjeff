import { describe, expect, it } from "vitest";
import { isThaiNationality, isValidThaiId, normalizeDigits, validateIdentity } from "./validation";

describe("employee identity validation", () => {
  it("normalizes formatted identity numbers", () => {
    expect(normalizeDigits("1-2345-67890-12-1")).toBe("1234567890121");
  });

  it("recognizes Thai nationality aliases", () => {
    expect(isThaiNationality("ไทย")).toBe(true);
    expect(isThaiNationality("Thai")).toBe(true);
    expect(isThaiNationality("กัมพูชา")).toBe(false);
  });

  it("validates the Thai ID checksum", () => {
    expect(isValidThaiId("3 4904 00109 28 1")).toBe(true);
    expect(isValidThaiId("3 4904 00109 28 2")).toBe(false);
  });

  it("requires an ID only for Thai employees", () => {
    expect(validateIdentity("ไทย", "")).toContain("13 หลัก");
    expect(validateIdentity("กัมพูชา", "")).toBeNull();
  });
});
