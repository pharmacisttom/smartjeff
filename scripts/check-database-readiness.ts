/** SELECT and Prisma migrate diff only. No deploy/resolve/reset/db-push or SQL execution. */
import { PrismaClient } from '@prisma/client';
import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { evaluateDatabase, migrationChecksums, type MigrationRecord } from '../src/server/domain/deployment/database-preflight';

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--history-only')) throw new Error('INVALID_ARGUMENT');
  const historyOnly = args.includes('--history-only');
  const directory = path.resolve('prisma/migrations');
  const files = readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isDirectory())
    .map(entry => {
      const compatibleChecksums = migrationChecksums(readFileSync(path.join(directory, entry.name, 'migration.sql'), 'utf8'));
      return { name: entry.name, checksum: compatibleChecksums[0], compatibleChecksums };
    })
    .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const db = new PrismaClient({ log: [] });
  try {
    const tables = await db.$queryRaw<{ name: string }[]>`
      SELECT TABLE_NAME AS name FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`;
    const hasHistory = tables.some(table => table.name.toLowerCase() === '_prisma_migrations');
    const records = hasHistory ? await db.$queryRaw<{
      migration_name: string; checksum: string; finished_at: Date | null; rolled_back_at: Date | null;
    }[]>`SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at` : [];
    const history: MigrationRecord[] = records.map(row => ({
      name: row.migration_name, checksum: row.checksum,
      finished: row.finished_at !== null, rolledBack: row.rolled_back_at !== null,
    }));
    let schemaDiff: 'MATCH' | 'DRIFT' | 'ERROR' | 'NOT_CHECKED' = 'NOT_CHECKED';
    if (!historyOnly) {
      const diff = spawnSync(process.execPath, [path.resolve('node_modules/prisma/build/index.js'),
        'migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma',
        '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'], {
        env: process.env, encoding: 'utf8', timeout: 120_000, maxBuffer: 16 * 1024 * 1024,
      });
      // Never emit raw engine output: it can contain connection strings or data defaults.
      schemaDiff = !diff.error && diff.status === 0 ? 'MATCH'
        : !diff.error && diff.status === 2 ? 'DRIFT' : 'ERROR';
    }
    const result = evaluateDatabase({ tableCount: tables.filter(t => t.name.toLowerCase() !== '_prisma_migrations').length,
      hasHistory, files, history, schemaDiff }, historyOnly);
    console.log(JSON.stringify({ ...result, readOnly: true,
      checkedAt: new Date().toISOString(),
      limitations: ['Prisma does not compare triggers, routines, grants or business data.',
        'Before-migration mode checks history only; pending changes still require backup and reviewed migration rehearsal.',
        'This report does not certify restore, payroll, tax, UAT or production readiness.'],
    }, null, 2));
    if (result.status !== 'PASS') process.exitCode = 1;
  } finally { await db.$disconnect(); }
}

main().catch(() => {
  console.error(JSON.stringify({ status: 'BLOCKED', blockers: ['DATABASE_PREFLIGHT_FAILED'], readOnly: true }));
  process.exitCode = 1;
});
