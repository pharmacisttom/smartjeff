/** Creates NEW, uniquely named loopback test databases. Never alters the .env database. */
import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const output = path.resolve('tmp/p3-validation');
mkdirSync(output, { recursive: true });
const baseUrl = new URL(process.env.DATABASE_URL || '');
if (!['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname)) {
  throw new Error('Only loopback database servers are allowed by this test runner.');
}
const stamp = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const prismaCli = path.resolve('node_modules/prisma/build/index.js');
const baseline = path.join(output, 'baseline.prisma');
const baselineSql = path.join(output, 'baseline.sql');

function run(args: string[], databaseUrl: string, logName: string) {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: 'utf8', timeout: 120_000,
  });
  const sanitize = (value: string) => {
    const safe = value.replaceAll(databaseUrl, '[DATABASE_URL]');
    return baseUrl.password ? safe.replaceAll(baseUrl.password, '[REDACTED]') : safe;
  };
  writeFileSync(path.join(output, logName), sanitize(`${result.stdout || ''}\n${result.stderr || ''}`));
  return result.status === 0 && !result.error;
}

async function main() {
  // Baseline from Git, not introspection or a data dump.
  const previous = spawnSync('git', ['show', '07a6dff2ec021ea1c98da9819c88b6394b6f9f13:prisma/schema.prisma'], { encoding: 'utf8' });
  if (previous.status !== 0) throw new Error('Cannot load the reviewed baseline schema.');
  writeFileSync(baseline, previous.stdout);
  if (!run(['migrate', 'diff', '--from-empty', '--to-schema-datamodel', baseline, '--script', '--output', baselineSql], baseUrl.toString(), 'baseline-generation.log')) {
    throw new Error('Could not generate baseline DDL.');
  }
  const admin = new PrismaClient();
  const urls: Record<string, string> = {};
  const names: Record<string, string> = {};
  try {
    for (const kind of ['chain', 'upgrade']) {
      const name = `smartop_p3_test_${kind}_${stamp}`;
      if (!/^smartop_p3_test_[a-z0-9_]+$/.test(name)) throw new Error('Invalid test database name.');
      // No IF NOT EXISTS: refuse to reuse or overwrite any existing database.
      await admin.$executeRawUnsafe(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      const url = new URL(baseUrl);
      url.pathname = `/${name}`;
      urls[kind] = url.toString();
      names[kind] = name;
    }
  } finally { await admin.$disconnect(); }

  const chainPassed = run(['migrate', 'deploy', '--schema', 'prisma/schema.prisma'], urls.chain, 'migration-chain.log');
  const chainStatusPassed = chainPassed && run(['migrate', 'status', '--schema', 'prisma/schema.prisma'], urls.chain, 'migration-status.log');
  const baselinePassed = run(['db', 'execute', '--file', baselineSql, '--schema', 'prisma/schema.prisma'], urls.upgrade, 'baseline-apply.log');
  const fixture = path.join(output, 'legacy-fixture.sql');
  writeFileSync(fixture, `
    INSERT INTO Organization (id, code, name, updatedAt) VALUES ('p3-legacy-org', 'P3_TEST_ORG', 'Synthetic test organization', NOW());
    INSERT INTO User (id, email, updatedAt) VALUES ('p3-legacy-user', 'p3-legacy@example.invalid', NOW());
    INSERT INTO Site (id, code, name) VALUES ('p3-legacy-site', 'P3_TEST_SITE', 'Synthetic test site');
    INSERT INTO Supplier (id, code, name, updatedAt) VALUES ('p3-legacy-supplier', 'P3_TEST_SUPPLIER', 'Synthetic supplier', NOW());
    INSERT INTO PurchaseOrder (id, refNo, supplierId, totalAmount, updatedAt) VALUES ('p3-legacy-po', 'P3_TEST_PO', 'p3-legacy-supplier', 100, NOW());
    INSERT INTO GoodsReceipt (id, poId, refNo) VALUES ('p3-legacy-receipt', 'p3-legacy-po', 'P3_TEST_GR');
    INSERT INTO InventoryItem (id, code, name, unit, unitCost, stockBalance, updatedAt) VALUES ('p3-legacy-item', 'P3_TEST_OLD_SKU', 'Synthetic legacy material', 'PCS', 10.25, 5, NOW());
    INSERT INTO StockMovement (id, itemId, type, quantity, balanceAfter) VALUES ('p3-legacy-movement', 'p3-legacy-item', 'IN', 5, 5);
  `);
  const fixturePassed = baselinePassed && run(['db', 'execute', '--file', fixture, '--schema', 'prisma/schema.prisma'], urls.upgrade, 'legacy-fixture.log');
  const upgradePassed = fixturePassed &&
    run(['db', 'execute', '--file', 'prisma/migrations/20261121000000_p3_inventory_foundation/migration.sql', '--schema', 'prisma/schema.prisma'], urls.upgrade, 'p3-upgrade.log') &&
    run(['db', 'execute', '--file', 'prisma/migrations/20261122000000_inventory_posting_payloads/migration.sql', '--schema', 'prisma/schema.prisma'], urls.upgrade, 'p3-payload-upgrade.log');
  let integrationPassed = false;
  if (upgradePassed) {
    const tests = spawnSync(process.execPath, [path.resolve('node_modules/vitest/vitest.mjs'), 'run', 'tests/integration/p3-database.test.ts', 'tests/integration/inventory-posting.test.ts'], {
      env: { ...process.env, P3_TEST_DATABASE_URL: urls.upgrade }, encoding: 'utf8', timeout: 120_000,
    });
    writeFileSync(path.join(output, 'integration.log'), `${tests.stdout || ''}\n${tests.stderr || ''}`.replaceAll(urls.upgrade, '[DATABASE_URL]'));
    integrationPassed = tests.status === 0 && !tests.error;
  }
  const report = { testDatabases: names, chainPassed, chainStatusPassed, baselinePassed, fixturePassed, upgradePassed, integrationPassed,
    existingDatabaseModified: false, note: 'Test databases retained for inspection; no DROP/reset executed. Logs in ignored tmp/p3-validation.' };
  writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!chainPassed || !chainStatusPassed || !upgradePassed || !integrationPassed) process.exitCode = 1;
}
main().catch(() => { console.error('Isolated P3 database verification failed; connection details suppressed.'); process.exitCode = 1; });
