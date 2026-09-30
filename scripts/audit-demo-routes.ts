import { existsSync } from "fs";
import { join } from "path";
import { DEMO_ACCOUNTS_CONFIG } from "../src/config/demo-accounts";
import { NAVIGATION_REGISTRY } from "../src/config/navigation";

export interface RouteAuditResult {
  route: string;
  source: string;
  status: "VALID" | "MISSING" | "DUPLICATE" | "ROLE_MISMATCH";
  filePath?: string;
}

export function resolveRouteFilePath(appDir: string, route: string): string | null {
  if (route === "/") {
    const p = join(appDir, "page.tsx");
    if (existsSync(p)) return p;
  }

  const cleanRoute = route.replace(/^\//, "");
  const directPath = join(appDir, cleanRoute, "page.tsx");
  if (existsSync(directPath)) return directPath;

  // Check route groups like (admin), (employee), (auth)
  const routeGroups = ["(admin)", "(employee)", "(auth)", "(marketing)", "(superadmin)"];
  for (const group of routeGroups) {
    const groupPath = join(appDir, group, cleanRoute, "page.tsx");
    if (existsSync(groupPath)) return groupPath;
  }

  return null;
}

export function auditDemoRoutes(): RouteAuditResult[] {
  const appDir = join(process.cwd(), "src", "app");
  const results: RouteAuditResult[] = [];
  const seenRoutes = new Set<string>();

  // 1. Audit Demo Accounts Landing and Core Routes
  for (const acc of DEMO_ACCOUNTS_CONFIG) {
    const routesToTest = [acc.landingRoute, ...acc.coreMenus];
    for (const route of routesToTest) {
      const key = `${acc.key}:${route}`;
      if (seenRoutes.has(key)) continue;
      seenRoutes.add(key);

      const filePath = resolveRouteFilePath(appDir, route);
      results.push({
        route,
        source: `DemoAccount:${acc.key}`,
        status: filePath ? "VALID" : "MISSING",
        filePath: filePath || undefined,
      });
    }
  }

  // 2. Audit Navigation Registry
  for (const group of NAVIGATION_REGISTRY) {
    for (const item of group.items) {
      if (item.href) {
        const filePath = resolveRouteFilePath(appDir, item.href);
        results.push({
          route: item.href,
          source: `NavRegistry:${group.id}`,
          status: filePath ? "VALID" : "MISSING",
          filePath: filePath || undefined,
        });
      }
      if (item.children) {
        for (const child of item.children) {
          const filePath = resolveRouteFilePath(appDir, child.href);
          results.push({
            route: child.href,
            source: `NavRegistry:${group.id}:${item.id}`,
            status: filePath ? "VALID" : "MISSING",
            filePath: filePath || undefined,
          });
        }
      }
    }
  }

  return results;
}

function main() {
  const audit = auditDemoRoutes();
  const missing = audit.filter((r) => r.status === "MISSING");
  console.log("\n==================================================");
  console.log("DEMO ROUTE AUDIT RESULTS");
  console.log("==================================================");
  console.log(`Total routes audited: ${audit.length}`);
  console.log(`Valid routes: ${audit.length - missing.length}`);
  console.log(`Missing routes (404 risk): ${missing.length}`);

  if (missing.length > 0) {
    console.error("\n❌ Missing routes detected:");
    console.table(missing);
    process.exitCode = 1;
  } else {
    console.log("\n✅ All demo routes validated successfully. Zero 404 risk!");
  }
}

if (require.main === module) {
  main();
}
