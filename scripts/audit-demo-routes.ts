import fs from 'fs';
import path from 'path';
import { NAVIGATION_REGISTRY } from '../src/config/navigation';

const APP_DIR = path.resolve(__dirname, '../src/app');
const SRC_DIR = path.resolve(__dirname, '../src');

export interface RouteEntry {
  rawPath: string;
  urlPath: string;
  sourceFile: string;
  isGroup: boolean;
  groupName?: string;
  isDynamic: boolean;
  routeType: 'PAGE' | 'API';
}

export interface LinkMatch {
  link: string;
  foundInFile: string;
  line: number;
  type: 'NAVIGATION_CONFIG' | 'JSX_LINK' | 'ROUTER_PUSH' | 'REDIRECT' | 'HARDCODED_HREF';
  status: 'VALID' | 'MISSING_ROUTE' | 'WRONG_PATH' | 'DUPLICATE_ROUTE' | 'PLACEHOLDER';
}

// 1. Scan src/app for all pages and API routes
export function scanAppRoutes(dir: string = APP_DIR, routes: RouteEntry[] = []): RouteEntry[] {
  if (!fs.existsSync(dir)) return routes;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanAppRoutes(fullPath, routes);
    } else if (/^(page|route)\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const isPage = entry.name.startsWith('page');
      let relative = path.relative(APP_DIR, fullPath).replace(/\\/g, '/');

      // Detect route group
      const groupMatch = relative.match(/\(([^)]+)\)/);
      const isGroup = !!groupMatch;
      const groupName = groupMatch ? groupMatch[1] : undefined;

      // Calculate URL path
      let urlPath = '/' + relative.replace(/\/(page|route)\.(tsx|ts|jsx|js)$/, '').replace(/^(page|route)\.(tsx|ts|jsx|js)$/, '');
      // Strip route groups e.g. /(admin) -> ''
      urlPath = urlPath.replace(/\/\([^)]+\)/g, '');
      if (!urlPath) urlPath = '/';

      const isDynamic = urlPath.includes('[');

      routes.push({
        rawPath: relative,
        urlPath,
        sourceFile: fullPath,
        isGroup,
        groupName,
        isDynamic,
        routeType: isPage ? 'PAGE' : 'API',
      });
    }
  }

  return routes;
}

// Match URL path against defined route set
export function matchUrlToRoutes(targetUrl: string, availableRoutes: Set<string>): boolean {
  if (!targetUrl || targetUrl === '#' || targetUrl.startsWith('javascript:')) return false;

  // Clean query string or hash
  const cleanUrl = targetUrl.split('?')[0].split('#')[0];
  const normalized = cleanUrl === '/' ? '/' : cleanUrl.replace(/\/$/, '');

  if (availableRoutes.has(normalized)) return true;

  // Match dynamic routes e.g. /admin/employees/123 -> /admin/employees/[id]
  for (const route of Array.from(availableRoutes)) {
    if (route.includes('[')) {
      const pattern = '^' + route.replace(/\[\.\.\.[^\]]+\]/g, '.*').replace(/\[[^\]]+\]/g, '[^/]+') + '$';
      const regex = new RegExp(pattern);
      if (regex.test(normalized)) {
        return true;
      }
    }
  }

  return false;
}

// 2. Scan code files for links & hrefs
function scanCodeForLinks(srcDir: string = SRC_DIR): LinkMatch[] {
  const links: LinkMatch[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.next') {
          walk(fullPath);
        }
      } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((lineText, idx) => {
          const lineNum = idx + 1;
          const relativeFile = path.relative(SRC_DIR, fullPath).replace(/\\/g, '/');

          // Match href="..." or href='...'
          const hrefRegex = /href=["']([^"']+)["']/g;
          let match;
          while ((match = hrefRegex.exec(lineText)) !== null) {
            const hrefVal = match[1];
            if (!hrefVal.startsWith('http') && !hrefVal.startsWith('mailto:') && !hrefVal.startsWith('tel:')) {
              links.push({
                link: hrefVal,
                foundInFile: relativeFile,
                line: lineNum,
                type: 'HARDCODED_HREF',
                status: hrefVal === '#' || hrefVal.startsWith('javascript:') ? 'PLACEHOLDER' : 'VALID',
              });
            }
          }

          // Match router.push(...) or router.replace(...)
          const pushRegex = /router\.(push|replace)\(["']([^"']+)["']\)/g;
          while ((match = pushRegex.exec(lineText)) !== null) {
            links.push({
              link: match[2],
              foundInFile: relativeFile,
              line: lineNum,
              type: 'ROUTER_PUSH',
              status: match[2] === '#' ? 'PLACEHOLDER' : 'VALID',
            });
          }
        });
      }
    }
  }

  walk(srcDir);
  return links;
}

async function runAudit() {
  console.log('===========================================================');
  console.log('SMARTOP FULL ROUTE & 404 AUTOMATED AUDIT SCANNER (PHASE 28)');
  console.log('===========================================================\n');

  const routes = scanAppRoutes();
  const pageRoutes = routes.filter((r) => r.routeType === 'PAGE');
  const apiRoutes = routes.filter((r) => r.routeType === 'API');

  const pageUrlSet = new Set(pageRoutes.map((r) => r.urlPath));
  const apiUrlSet = new Set(apiRoutes.map((r) => r.urlPath));

  console.log(`Discovered ${routes.length} total App Router endpoints:`);
  console.log(` - Pages: ${pageRoutes.length} files (${pageUrlSet.size} distinct URL paths)`);
  console.log(` - APIs:  ${apiRoutes.length} files (${apiUrlSet.size} distinct API paths)\n`);

  // Detect route collisions / duplicates e.g. /(admin)/operations vs /admin/operations
  const urlPathCount: Record<string, string[]> = {};
  for (const r of pageRoutes) {
    if (!urlPathCount[r.urlPath]) urlPathCount[r.urlPath] = [];
    urlPathCount[r.urlPath].push(r.rawPath);
  }

  const duplicates = Object.entries(urlPathCount).filter(([_, files]) => files.length > 1);
  if (duplicates.length > 0) {
    console.warn(`[WARNING] Found ${duplicates.length} duplicate URL path collisions:`);
    duplicates.forEach(([urlPath, files]) => {
      console.warn(`   URL: ${urlPath}`);
      files.forEach((f) => console.warn(`     -> ${f}`));
    });
    console.log('');
  }

  // Collect all Navigation Registry Hrefs
  const navHrefs = new Set<string>();
  for (const group of NAVIGATION_REGISTRY) {
    for (const item of group.items) {
      if (item.href) navHrefs.add(item.href);
      if (item.children) {
        for (const child of item.children) {
          if (child.href) navHrefs.add(child.href);
        }
      }
    }
  }

  console.log(`Auditing ${navHrefs.size} Navigation Registry Menu Links...`);
  let navPassed = 0;
  let navFailed = 0;
  const navFailures: string[] = [];

  Array.from(navHrefs)
    .sort()
    .forEach((href) => {
      const isMatched = matchUrlToRoutes(href, pageUrlSet);
      if (isMatched) {
        navPassed++;
      } else {
        navFailed++;
        navFailures.push(href);
        console.error(`  [404 ERR] Navigation Menu Link: ${href}`);
      }
    });

  // Scan codebase links
  const codeLinks = scanCodeForLinks();
  const placeholders = codeLinks.filter((l) => l.status === 'PLACEHOLDER');
  const brokenLinks: LinkMatch[] = [];

  codeLinks.forEach((l) => {
    if (l.status !== 'PLACEHOLDER') {
      const ok = matchUrlToRoutes(l.link, pageUrlSet) || matchUrlToRoutes(l.link, apiUrlSet);
      if (!ok) {
        l.status = 'MISSING_ROUTE';
        brokenLinks.push(l);
      }
    }
  });

  console.log(`\n-----------------------------------------------------------`);
  console.log(`AUDIT REPORT SUMMARY:`);
  console.log(`-----------------------------------------------------------`);
  console.log(`- Total App Router Pages:    ${pageRoutes.length}`);
  console.log(`- Total App Router APIs:     ${apiRoutes.length}`);
  console.log(`- Duplicate Path Collisions: ${duplicates.length}`);
  console.log(`- Navigation Menu Links:     ${navHrefs.size} (${navPassed} Valid, ${navFailed} Broken)`);
  console.log(`- Code Link Hrefs Scanned:   ${codeLinks.length}`);
  console.log(`- Placeholder Links (#/void): ${placeholders.length}`);
  console.log(`- Broken Code Links:         ${brokenLinks.length}`);
  console.log(`-----------------------------------------------------------\n`);

  if (navFailed > 0 || brokenLinks.length > 0 || placeholders.length > 0) {
    if (brokenLinks.length > 0) {
      console.error('Broken Code Hrefs / Push routes:');
      brokenLinks.slice(0, 15).forEach((b) => console.error(`  - ${b.link} in ${b.foundInFile}:${b.line}`));
      if (brokenLinks.length > 15) console.error(`  ... and ${brokenLinks.length - 15} more`);
    }

    if (placeholders.length > 0) {
      console.warn('\nPlaceholder Links (# or javascript:void(0)):');
      placeholders.slice(0, 15).forEach((p) => console.warn(`  - ${p.link} in ${p.foundInFile}:${p.line}`));
    }
  } else {
    console.log('SUCCESS: All navigation menu links and code hrefs resolved! ZERO 404s.');
  }

  // Save audit data for documentation generation
  const reportData = {
    totalPageFiles: pageRoutes.length,
    totalApiFiles: apiRoutes.length,
    duplicateCollisions: duplicates,
    navSummary: { total: navHrefs.size, passed: navPassed, failed: navFailed, failures: navFailures },
    codeLinksCount: codeLinks.length,
    placeholdersCount: placeholders.length,
    brokenLinksCount: brokenLinks.length,
    brokenLinks,
    pageRoutes,
  };

  fs.writeFileSync(path.resolve(__dirname, '../tmp/route-audit-results.json'), JSON.stringify(reportData, null, 2));
  console.log('\nAudit data saved to tmp/route-audit-results.json');
}

runAudit().catch(console.error);
