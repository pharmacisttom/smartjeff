import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNTS } from "../src/config/demo-accounts";

describe("provision-demo-users specifications", () => {
  it("contains exactly 6 demo account specifications", () => {
    expect(DEMO_ACCOUNTS).toHaveLength(6);
  });

  it("contains standard demo accounts and role mappings", () => {
    const emails = DEMO_ACCOUNTS.map((s) => s.email);
    expect(emails).toContain("admin@j2k.com");
    expect(emails).toContain("executive@j2k.com");
    expect(emails).toContain("hr@j2k.com");
    expect(emails).toContain("coordinator@j2k.com");
    expect(emails).toContain("supervisor@j2k.com");
    expect(emails).toContain("employee@j2k.com");
    expect(emails).not.toContain("pharmacisttom@gmail.com");
  });

  it("maps each key to correct expected email and role code", () => {
    const specsMap = new Map(DEMO_ACCOUNTS.map((s) => [s.key, s]));

    expect(specsMap.get("admin")?.email).toBe("admin@j2k.com");
    expect(specsMap.get("admin")?.roleCode).toBe("SUPER_ADMIN");

    expect(specsMap.get("executive")?.email).toBe("executive@j2k.com");
    expect(specsMap.get("executive")?.roleCode).toBe("EXECUTIVE");

    expect(specsMap.get("hr")?.email).toBe("hr@j2k.com");
    expect(specsMap.get("hr")?.roleCode).toBe("HR_MANAGER");

    expect(specsMap.get("coordinator")?.email).toBe("coordinator@j2k.com");
    expect(specsMap.get("coordinator")?.roleCode).toBe("PROJECT_MANAGER");

    expect(specsMap.get("supervisor")?.email).toBe("supervisor@j2k.com");
    expect(specsMap.get("supervisor")?.roleCode).toBe("SUPERVISOR");

    expect(specsMap.get("employee")?.email).toBe("employee@j2k.com");
    expect(specsMap.get("employee")?.roleCode).toBe("EMPLOYEE");
  });
});
