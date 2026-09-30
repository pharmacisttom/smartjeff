import { describe, expect, it } from "vitest";
import { DEMO_EMPLOYEE_SPECS } from "./seed-demo-employees";

describe("seed-demo-employees specifications", () => {
  it("contains 5 demo employee specifications", () => {
    expect(DEMO_EMPLOYEE_SPECS).toHaveLength(5);
  });

  it("maps correct employee codes to demo user emails", () => {
    const specMap = new Map(DEMO_EMPLOYEE_SPECS.map((s) => [s.email, s]));

    expect(specMap.get("employee@j2k.com")?.code).toBe("EMP-DEMO-001");
    expect(specMap.get("supervisor@j2k.com")?.code).toBe("EMP-DEMO-002");
    expect(specMap.get("coordinator@j2k.com")?.code).toBe("EMP-DEMO-003");
    expect(specMap.get("hr@j2k.com")?.code).toBe("EMP-DEMO-004");
    expect(specMap.get("executive@j2k.com")?.code).toBe("EMP-DEMO-005");
  });
});
