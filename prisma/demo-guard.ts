export function assertDemoTarget(env: NodeJS.ProcessEnv): void {
  if (env.DEMO_MODE !== "true") throw new Error("Demo account provisioning is disabled.");
  if (env.DEMO_SEED_ALLOWED !== "true") throw new Error("Set DEMO_SEED_ALLOWED=true for an isolated demo database");
  const url = new URL(env.DATABASE_URL || "");
  if (url.protocol !== "mysql:" || !/^\/[a-z0-9_]+_demo$/i.test(url.pathname)) {
    throw new Error("Demo database name must end with _demo");
  }
}
