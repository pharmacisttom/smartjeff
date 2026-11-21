/** Read-only schema/history inspection. Never logs credentials or business rows. */
import { Prisma, PrismaClient } from '@prisma/client';

async function main() {
  const db = new PrismaClient();
  try {
    const version = await db.$queryRaw<{ version: string; lowerCaseTableNames: number }[]>`SELECT VERSION() AS version, @@lower_case_table_names AS lowerCaseTableNames`;
    const normalize = (name: string) => Number(version[0].lowerCaseTableNames) ? name.toLowerCase() : name;
    const columns = await db.$queryRaw<{ tableName: string; columnName: string; columnType: string; nullable: string }[]>`
      SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName,
             COLUMN_TYPE AS columnType, IS_NULLABLE AS nullable
      FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, ORDINAL_POSITION`;
    const actual = new Map<string, Set<string>>();
    for (const row of columns) {
      const table = normalize(row.tableName);
      if (!actual.has(table)) actual.set(table, new Set());
      actual.get(table)!.add(row.columnName.toLowerCase());
    }
    const models = Prisma.dmmf.datamodel.models;
    const missingTables: string[] = [];
    const missingColumns: string[] = [];
    for (const model of models) {
      const table = normalize(model.dbName || model.name);
      if (!actual.has(table)) { missingTables.push(table); continue; }
      for (const field of model.fields.filter(f => f.kind !== 'object')) {
        const column = field.dbName || field.name;
        if (!actual.get(table)!.has(column.toLowerCase())) missingColumns.push(`${table}.${column}`);
      }
    }
    const history = actual.has('_prisma_migrations')
      ? await db.$queryRaw`SELECT migration_name, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations ORDER BY started_at`
      : [];
    console.log(JSON.stringify({
      readOnly: true, serverVersion: version[0].version, lowerCaseTableNames: Number(version[0].lowerCaseTableNames),
      actualTableCount: actual.size, expectedModelCount: models.length,
      missingTables, missingColumns, hasMigrationHistoryTable: actual.has('_prisma_migrations'), history,
      limitation: 'Presence comparison only; type/index/FK/default drift requires separate comparison.',
    }, null, 2));
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Database inspection failed; connection details suppressed.'); process.exitCode = 1; });
