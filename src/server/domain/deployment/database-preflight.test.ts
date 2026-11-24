import { describe, it, expect } from 'vitest';
import { evaluateDatabase, migrationChecksums, type DatabaseEvidence } from './database-preflight';

const evidence = (): DatabaseEvidence => ({ tableCount: 1, hasHistory: true,
  files: [{ name: '001', checksum: 'a' }, { name: '002', checksum: 'b' }],
  history: [{ name: '001', checksum: 'a', finished: true, rolledBack: false },
    { name: '002', checksum: 'b', finished: true, rolledBack: false }], schemaDiff: 'MATCH' });

describe('database release preflight', () => {
  it('accepts equivalent LF/CRLF migrations but not a changed SQL statement', () => {
    const hashes = migrationChecksums('SELECT 1;\r\n');
    expect(hashes).toEqual(expect.arrayContaining(migrationChecksums('SELECT 1;\n')));
    expect(hashes).not.toContain(migrationChecksums('SELECT 2;\n')[0]);
    const input = evidence(); input.files[0].compatibleChecksums = ['windows-hash']; input.history[0].checksum = 'windows-hash';
    expect(evaluateDatabase(input).status).toBe('PASS');
  });
  it('blocks an existing database with an empty history table', () => {
    expect(evaluateDatabase({ ...evidence(), history: [] }, true).blockers).toContain('LEGACY_BASELINE_REQUIRED');
  });
  it('permits a fully applied release with matching schema', () => {
    expect(evaluateDatabase(evidence())).toMatchObject({ status: 'PASS', schemaVerified: true });
  });
  it('blocks a legacy database with no history even before migration', () => {
    expect(evaluateDatabase({ ...evidence(), hasHistory: false, history: [] }, true).blockers)
      .toContain('LEGACY_BASELINE_REQUIRED');
  });
  it('allows a fresh empty database to bootstrap but never certifies its schema', () => {
    const input = { ...evidence(), tableCount: 0, hasHistory: false, history: [], schemaDiff: 'NOT_CHECKED' as const };
    expect(evaluateDatabase(input, true)).toMatchObject({ status: 'PASS', schemaVerified: false });
    expect(evaluateDatabase(input).status).toBe('BLOCKED');
  });
  it('permits pending files at the history gate only', () => {
    const input = evidence(); input.history.pop();
    expect(evaluateDatabase(input, true)).toMatchObject({ status: 'PASS', pending: ['002'], schemaVerified: false });
    expect(evaluateDatabase(input).blockers).toContain('PENDING_MIGRATIONS');
  });
  it.each(['DRIFT', 'ERROR', 'NOT_CHECKED'] as const)('fails closed for schema evidence %s', schemaDiff => {
    expect(evaluateDatabase({ ...evidence(), schemaDiff }).status).toBe('BLOCKED');
  });
  it('detects changed historical migration contents', () => {
    const input = evidence(); input.history[0].checksum = 'changed';
    expect(evaluateDatabase(input, true).blockers).toContain('MIGRATION_CHECKSUM_MISMATCH');
  });
  it('detects a failed/running migration without exposing database logs', () => {
    const input = evidence(); input.history[1].finished = false;
    expect(evaluateDatabase(input, true).blockers).toContain('FAILED_OR_RUNNING_MIGRATION');
  });
  it('ignores explicitly rolled back attempts when a later retry succeeded', () => {
    const input = evidence(); input.history.unshift({ name: '001', checksum: 'old', finished: false, rolledBack: true });
    expect(evaluateDatabase(input).status).toBe('PASS');
  });
  it('detects applied files that are absent from this release', () => {
    const input = evidence(); input.history.push({ name: '003', checksum: 'c', finished: true, rolledBack: false });
    expect(evaluateDatabase(input, true).blockers).toContain('UNKNOWN_MIGRATION');
  });
  it('detects a missing earlier migration', () => {
    const input = evidence(); input.history.shift();
    expect(evaluateDatabase(input, true).blockers).toContain('MIGRATION_ORDER_MISMATCH');
  });
  it('rejects duplicate successful history and missing migration files', () => {
    const input = evidence(); input.history.push(input.history[0]);
    expect(evaluateDatabase(input).blockers).toContain('DUPLICATE_APPLIED_MIGRATION');
    expect(evaluateDatabase({ ...input, files: [] }, true).blockers).toContain('MIGRATION_FILES_MISSING');
  });
});
