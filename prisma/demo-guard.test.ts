import { describe, it, expect } from "vitest";
import { assertDemoTarget } from "./demo-guard";

describe("demo seed target guard", () => {
  const env: NodeJS.ProcessEnv = { NODE_ENV: "production", DEMO_MODE: "true", DEMO_SEED_ALLOWED: "true", DATABASE_URL: "mysql://localhost/smartop_demo" };
  it("allows an explicitly enabled demo database", () => expect(() => assertDemoTarget(env)).not.toThrow());
  it("blocks when demo mode is disabled", () => expect(() => assertDemoTarget({ ...env, DEMO_MODE: "false" })).toThrow());
  it("blocks normal databases and missing opt-in", () => {
    expect(() => assertDemoTarget({ ...env, DATABASE_URL: "mysql://localhost/smartjeff" })).toThrow();
    expect(() => assertDemoTarget({ ...env, DEMO_SEED_ALLOWED: "false" })).toThrow();
  });
});
