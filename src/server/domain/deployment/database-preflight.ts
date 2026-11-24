/** Pure release gate. Evidence is read-only; this never repairs a database. */
import { createHash } from 'node:crypto';

export type MigrationFile = { name: string; checksum: string; compatibleChecksums?: string[] };
export function migrationChecksums(sql: string) {
  const lf = sql.replace(/\r\n/g, '\n');
  return [...new Set([sql, lf, lf.replace(/\n/g, '\r\n')]
    .map(content => createHash('sha256').update(content).digest('hex')))];
}
export type MigrationRecord = {
  name: string; checksum: string; finished: boolean; rolledBack: boolean;
};
export type DatabaseEvidence = {
  tableCount: number;
  hasHistory: boolean;
  files: MigrationFile[];
  history: MigrationRecord[];
  schemaDiff: 'MATCH' | 'DRIFT' | 'ERROR' | 'NOT_CHECKED';
};

export function evaluateDatabase(evidence: DatabaseEvidence, historyOnly = false) {
  const blockers: string[] = [];
  const files = new Map(evidence.files.map(file => [file.name, [file.checksum, ...(file.compatibleChecksums || [])]]));
  const live = evidence.history.filter(row => !row.rolledBack);
  const applied = new Set(live.filter(row => row.finished).map(row => row.name));
  if (!files.size) blockers.push('MIGRATION_FILES_MISSING');
  if ((!evidence.hasHistory || !applied.size) && evidence.tableCount > 0) blockers.push('LEGACY_BASELINE_REQUIRED');
  if (live.some(row => !row.finished)) blockers.push('FAILED_OR_RUNNING_MIGRATION');
  if (live.some(row => !files.has(row.name))) blockers.push('UNKNOWN_MIGRATION');
  if (live.some(row => files.has(row.name) && !files.get(row.name)!.includes(row.checksum))) blockers.push('MIGRATION_CHECKSUM_MISMATCH');
  if (applied.size !== live.filter(row => row.finished).length) blockers.push('DUPLICATE_APPLIED_MIGRATION');
  // Applied migrations must be a prefix of the release, not a selection of newer files.
  let gap = false;
  for (const file of evidence.files) {
    if (!applied.has(file.name)) gap = true;
    else if (gap) { blockers.push('MIGRATION_ORDER_MISMATCH'); break; }
  }
  const pending = evidence.files.filter(file => !applied.has(file.name)).map(file => file.name);
  if (!historyOnly) {
    if (!evidence.hasHistory) blockers.push('MIGRATION_HISTORY_MISSING');
    if (pending.length) blockers.push('PENDING_MIGRATIONS');
    if (evidence.schemaDiff === 'DRIFT') blockers.push('SCHEMA_DRIFT');
    else if (evidence.schemaDiff !== 'MATCH') blockers.push('SCHEMA_COMPARISON_UNAVAILABLE');
  }
  return {
    mode: historyOnly ? 'BEFORE_MIGRATION' : 'AFTER_MIGRATION',
    status: blockers.length ? 'BLOCKED' : 'PASS',
    blockers: [...new Set(blockers)], pending,
    appliedCount: applied.size, schemaDiff: evidence.schemaDiff,
    // Before-migration PASS is only a history gate, never a schema/production certification.
    schemaVerified: !historyOnly && evidence.schemaDiff === 'MATCH',
  };
}
