import fs from 'fs';
import path from 'path';
import { NAVIGATION_REGISTRY } from '../src/config/navigation';
import { ROLE_DEFAULT_ROUTES } from '../src/lib/role-routing';

const APP_DIR = path.resolve(__dirname, '../src/app');

// Recursively find all page files in src/app
function findAppPages(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findAppPages(fullPath, fileList);
    } else if (/^page\.(tsx|jsx|js|ts)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// Normalize file path to App Router URL path (ignoring route groups like (admin))
function fileToRoutePath(filePath: string): string {
  let relative = path.relative(APP_DIR, filePath);
  // Normalize Windows separators
  relative = relative.split(path.sep).join('/');
  // Remove page.tsx
  let route = '/' + relative.replace(/\/page\.(tsx|jsx|js|ts)$/, '');
  if (route === '/page.tsx' || route === '/page.ts' || route === '/page.jsx' || route === '/page.js' || route === '/') {
    return '/';
  }
  // Strip route groups e.g. /(admin)/ -> /
  route = route.replace(/\/\([^)]+\)/g, '');
  if (!route) route = '/';
  return route;
}

function matchRoute(targetRoute: string, availableRoutes: Set<string>): boolean {
  // Direct match
  if (availableRoutes.has(targetRoute)) {
    return true;
  }
  // Clean trailing slash
  const cleanTarget = targetRoute === '/' ? '/' : targetRoute.replace(/\/$/, '');
  if (availableRoutes.has(cleanTarget)) {
    return true;
  }

  // Check dynamic route matching (e.g. /admin/employees/[id])
  for (const route of Array.from(availableRoutes)) {
    if (route.includes('[')) {
      const pattern = route.replace(/\[[^\]]+\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(cleanTarget)) {
        return true;
      }
    }
  }

  return false;
}

async function runCheck() {
  console.log('====================================================');
  console.log('SMARTJEFF NAVIGATION & APP ROUTER 404 VALIDATOR');
  console.log('====================================================\n');

  if (!fs.existsSync(APP_DIR)) {
    console.error(`Error: App directory not found at ${APP_DIR}`);
    process.exit(1);
  }

  const pageFiles = findAppPages(APP_DIR);
  const routeSet = new Set<string>();

  for (const file of pageFiles) {
    const route = fileToRoutePath(file);
    routeSet.add(route);
  }

  console.log(`Discovered ${pageFiles.length} page files (${routeSet.size} distinct URL paths) in App Router.`);

  // Collect all navigation routes to test
  const routesToTest = new Set<string>();

  // 1. Navigation Registry (Main items + Children)
  for (const group of NAVIGATION_REGISTRY) {
    for (const item of group.items) {
      if (item.href) routesToTest.add(item.href);
      if (item.children) {
        for (const child of item.children) {
          if (child.href) routesToTest.add(child.href);
        }
      }
    }
  }

  // 2. Role Routing targets
  for (const [role, route] of Object.entries(ROLE_DEFAULT_ROUTES)) {
    routesToTest.add(route);
  }

  // 3. Core Standard Pages
  const corePages = [
    '/',
    '/login',
    '/check-in',
    '/history',
    '/leave',
    '/payslip',
    '/chat',
    '/access-denied',
    '/admin/dashboard',
    '/admin/vendor',
    '/admin/vendor/dashboard',
    '/admin/operations',
    '/admin/operations/schedule',
    '/admin/operations/work-orders',
  ];
  for (const p of corePages) {
    routesToTest.add(p);
  }

  console.log(`Auditing ${routesToTest.size} total active navigation & application routes...\n`);

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  const sortedRoutes = Array.from(routesToTest).sort();

  for (const route of sortedRoutes) {
    const isMatched = matchRoute(route, routeSet);
    if (isMatched) {
      console.log(`  [200 OK]  ${route}`);
      passed++;
    } else {
      console.error(`  [404 ERR] ${route} -> Page file not found in App Router!`);
      failed++;
      failures.push(route);
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`AUDIT SUMMARY: ${passed} Passed, ${failed} Failed (Total: ${routesToTest.size})`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    console.error(`\nFAILED: Found ${failed} broken navigation route(s):`);
    failures.forEach((f) => console.error(` - ${f}`));
    process.exit(1);
  } else {
    console.log('\nSUCCESS: All navigation routes verified! ZERO 404 errors.');
    process.exit(0);
  }
}

runCheck().catch((err) => {
  console.error('Unexpected error running route checker:', err);
  process.exit(1);
});
