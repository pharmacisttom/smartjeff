import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNTS_CONFIG } from "../src/config/demo-accounts";

describe("provision-demo-users specifications", () => {
  it("contains exactly 6 demo account specifications", () => {
    expect(DEMO_ACCOUNTS_CONFIG).toHaveLength(6);
  });

  it("contains standard demo accounts and role mappings", () => {
    const emails = DEMO_ACCOUNTS_CONFIG.map((s) => s.email);
    expect(emails).toContain("admin@j2k.com");
    expect(emails).toContain("executive@j2k.com");
    expect(emails).toContain("hr@j2k.com");
    expect(emails).toContain("coordinator@j2k.com");
    expect(emails).toContain("supervisor@j2k.com");
    expect(emails).toContain("employee@j2k.com");
  });

  it("maps each key to correct expected email and role code", () => {
    const specsMap = new Map(DEMO_ACCOUNTS_CONFIG.map((s) => [s.key, s]));

    expect(specsMap.get("ADMIN")?.email).toBe("admin@j2k.com");
    expect(specsMap.get("ADMIN")?.roleCode).toBe("SUPER_ADMIN");
    expect(specsMap.get("ADMIN")?.alternateEmails).toContain("pharmacisttom@gmail.com");

    expect(specsMap.get("EXECUTIVE")?.email).toBe("executive@j2k.com");
    expect(specsMap.get("EXECUTIVE")?.roleCode).toBe("EXECUTIVE");

    expect(specsMap.get("HR")?.email).toBe("hr@j2k.com");
    expect(specsMap.get("HR")?.roleCode).toBe("HR_MANAGER");

    expect(specsMap.get("COORDINATOR")?.email).toBe("coordinator@j2k.com");
    expect(specsMap.get("COORDINATOR")?.roleCode).toBe("PROJECT_MANAGER");

    expect(specsMap.get("SUPERVISOR")?.email).toBe("supervisor@j2k.com");
    expect(specsMap.get("SUPERVISOR")?.roleCode).toBe("SUPERVISOR");

    expect(specsMap.get("EMPLOYEE")?.email).toBe("employee@j2k.com");
    expect(specsMap.get("EMPLOYEE")?.roleCode).toBe("EMPLOYEE");
  });
});
