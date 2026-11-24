import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const url = process.env.A0_TEST_DATABASE_URL;
if (url) {
  const target = new URL(url);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) ||
      !/^\/smartop_p3_test_chain_[a-z0-9_]+$/.test(target.pathname)) {
    throw new Error('Preflight integration tests require a new isolated loopback chain database.');
  }
}
const db = new PrismaClient({ datasources: { db: { url: url || 'mysql://unused@127.0.0.1/unused' } }, log: [] });
function check(historyOnly = false, databaseUrl = url!) {
  const run = spawnSync(process.execPath, ['--import', 'tsx', path.resolve('scripts/check-database-readiness.ts'),
    ...(historyOnly ? ['--history-only'] : [])], {
    env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: 'utf8', timeout: 120_000,
  });
  if (run.error) throw run.error;
  return { code: run.status, report: JSON.parse(run.stdout || run.stderr) };
}

describe.skipIf(!url)('read-only release gate on isolated MariaDB', () => {
  afterAll(async () => { await db.$disconnect(); });
  it('accepts real migrated history and exact schema without changing either', async () => {
    const before = await db.$queryRaw`SELECT id, checksum, finished_at FROM _prisma_migrations ORDER BY id`;
    const first = check(true);
    expect(first.code).toBe(0);
    expect(first.report.schemaVerified).toBe(false);
    const result = check();
    expect(result.code).toBe(0);
    expect(result.report).toMatchObject({ status: 'PASS', readOnly: true, schemaDiff: 'MATCH', schemaVerified: true });
    expect(await db.$queryRaw`SELECT id, checksum, finished_at FROM _prisma_migrations ORDER BY id`).toEqual(before);
  }, 120_000);
  it('blocks real schema drift instead of applying the suggested repair', async () => {
    // This new empty probe exists only in this disposable chain database.
    await db.$executeRawUnsafe('CREATE TABLE A0PreflightDriftProbe (id INT PRIMARY KEY)');
    const result = check();
    expect(result.code).toBe(1);
    expect(result.report.blockers).toContain('SCHEMA_DRIFT');
    expect(await db.$queryRaw`SELECT COUNT(*) AS count FROM A0PreflightDriftProbe`).toHaveLength(1);
    // Retain the probe to prove no repair/drop happened and permit manual inspection.
  }, 120_000);
  it('fails closed without leaking connection details', () => {
    const result = check(false, 'mysql://synthetic-user:synthetic-private-password@127.0.0.1:1/unused?connect_timeout=1');
    expect(result.code).toBe(1);
    expect(result.report).toEqual({ status: 'BLOCKED', blockers: ['DATABASE_PREFLIGHT_FAILED'], readOnly: true });
  }, 120_000);
});
