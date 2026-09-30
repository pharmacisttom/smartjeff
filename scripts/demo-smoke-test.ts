import http from 'http';
import https from 'https';
import { scanAppRoutes, RouteEntry } from './audit-demo-routes';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';

interface SmokeTestResult {
  route: string;
  statusCode: number;
  statusText: string;
  passed: boolean;
}

function fetchUrl(url: string): Promise<{ statusCode: number; statusText: string }> {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'SmartOP-SmokeTester/1.0' } }, (res) => {
      resolve({
        statusCode: res.statusCode || 500,
        statusText: res.statusMessage || '',
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        statusText: err.message,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        statusCode: 408,
        statusText: 'Timeout',
      });
    });
  });
}

async function runSmokeTest() {
  console.log('===========================================================');
  console.log(`SMARTOP DEMO SMOKE TESTER (PHASE 30)`);
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log('===========================================================\n');

  const routes = scanAppRoutes().filter((r) => r.routeType === 'PAGE' && !r.isDynamic);
  const urlSet = Array.from(new Set(routes.map((r) => r.urlPath))).sort();

  console.log(`Testing ${urlSet.length} static page routes against ${BASE_URL}...\n`);

  let passed = 0;
  let failed = 0;
  const results: SmokeTestResult[] = [];

  for (const routePath of urlSet) {
    const fullUrl = `${BASE_URL}${routePath}`;
    const res = await fetchUrl(fullUrl);

    // Status rules:
    // 200 = PASS
    // 3xx = PASS (redirects)
    // 401/403 = PASS (protected route requiring auth)
    // 404 = FAIL
    // 500 = FAIL
    const isPass = res.statusCode >= 200 && res.statusCode < 404;
    if (isPass) {
      passed++;
      console.log(`  [${res.statusCode} OK]  ${routePath}`);
    } else {
      failed++;
      console.error(`  [${res.statusCode} ERR] ${routePath} - ${res.statusText}`);
    }

    results.push({
      route: routePath,
      statusCode: res.statusCode,
      statusText: res.statusText,
      passed: isPass,
    });
  }

  console.log('\n-----------------------------------------------------------');
  console.log(`SMOKE TEST SUMMARY: ${passed} Passed, ${failed} Failed (Total: ${urlSet.length})`);
  console.log('-----------------------------------------------------------');

  if (failed > 0) {
    console.error(`\nFAILED: ${failed} route(s) returned 404, 500 or Connection Refused.`);
  } else {
    console.log('\nSUCCESS: All tested routes passed smoke test!');
  }
}

runSmokeTest().catch(console.error);
