import { describe, it, expect } from "vitest";
import {
  formatThaiPhone,
  formatThaiIdCard,
  isValidThaiIdCard,
  formatThaiYear,
  formatBaht,
} from "./utils";

describe("Utils tests", () => {
  it("formats Thai phone number correctly", () => {
    expect(formatThaiPhone("0812345678")).toBe("081-234-5678");
    expect(formatThaiPhone("")).toBe("-");
  });

  it("formats Thai ID card number correctly", () => {
    expect(formatThaiIdCard("1209900123456")).toBe("1-2099-00123-45-6");
  });

  it("validates Thai ID checksum", () => {
    // Standard test invalid and valid Thai IDs
    expect(isValidThaiIdCard("1209900123450")).toBe(false);
    expect(isValidThaiIdCard("1101400940343")).toBe(true);
  });

  it("converts Gregorian Year to Thai Buddhist Era", () => {
    const d = new Date("2026-09-16");
    expect(formatThaiYear(d)).toBe(2569);
  });

  it("formats Currency in Thai Baht", () => {
    expect(formatBaht(12000)).toBe("฿12,000.00");
    expect(formatBaht("400")).toBe("฿400.00");
  });
});
