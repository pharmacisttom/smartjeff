import { describe, it, expect } from "vitest";
import { assertDemoTarget } from "./demo-guard";

describe("demo seed target guard", () => {
  const env: NodeJS.ProcessEnv = { NODE_ENV: "development", DEMO_SEED_ALLOWED: "true", DATABASE_URL: "mysql://localhost/smartjeff_demo" };
  it("allows an explicitly enabled demo database", () => expect(() => assertDemoTarget(env)).not.toThrow());
  it("blocks production even with the opt-in", () => expect(() => assertDemoTarget({ ...env, NODE_ENV: "production" })).toThrow());
  it("blocks normal databases and missing opt-in", () => {
    expect(() => assertDemoTarget({ ...env, DATABASE_URL: "mysql://localhost/smartjeff" })).toThrow();
    expect(() => assertDemoTarget({ ...env, DEMO_SEED_ALLOWED: "false" })).toThrow();
  });
});
