import { auditDemoRoutes } from "./audit-demo-routes";

export function runDemoSmokeTest() {
  console.log("\n==================================================");
  console.log("RUNNING DEMO ROUTE SMOKE TEST");
  console.log("==================================================");

  const routeResults = auditDemoRoutes();
  let passCount = 0;
  let failCount = 0;

  for (const r of routeResults) {
    if (r.status === "VALID") {
      passCount += 1;
    } else {
      failCount += 1;
      console.error(`❌ [FAIL] Missing route: ${r.route} (Source: ${r.source})`);
    }
  }

  console.log(`\nSmoke Test Summary: ${passCount} PASSED, ${failCount} FAILED.`);
  if (failCount > 0) {
    throw new Error(`Smoke test failed: ${failCount} missing routes detected.`);
  }
}

if (require.main === module) {
  try {
    runDemoSmokeTest();
    console.log("✅ DEMO SMOKE TEST PASSED PERFECTLY!");
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}
