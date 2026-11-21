# SmartOP Production Progress

Updated: 2026-11-21 (Asia/Bangkok)

## Branch / baseline

- Branch: `feature/production-erp-foundation`
- Latest existing commit inspected: `07a6dff2ec021ea1c98da9819c88b6394b6f9f13`
- This update implements the P3 database foundation only; it does not complete P0 or the P3 application workflow. Commit SHA is reported in the task response after commit.

## Completed

- Inspected current module/schema/API/auth/session/authorization/audit and deployment configuration.
- Compared remote HEAD with local baseline during the preceding review.
- Sampled the company workbooks and recorded a P3 mapping without copying source records into Git.
- Created `SMARTOP_PROJECT_ARCHITECTURE.md`, `SMARTOP_PRODUCTION_ROADMAP.md` and the P3 workbook mapping.
- Separated verified source findings, proposed design, business decisions and release acceptance gates.
- Added 19 P3 models and 3 enums; schema now has 102 models. Added nullable organization linkage/status/version to GoodsReceipt and retained all original scalar fields in the 83 existing models.
- Created `20261121000000_p3_inventory_foundation`: additive tables/indexes/FKs, 17 CHECK constraints and 4 append-only ledger/operation triggers.
- Added read-only database inspection and an isolated test runner (`db:inspect`, `test:db:p3`).
- Applied all 11 migrations to a newly created test database; separately tested P3 SQL upgrade of the original schema with synthetic legacy rows.
- Added 14 real-database integration tests for legacy preservation, scoped FKs, Decimal precision, version conflict, SoD, quantities, source/sign validation, uniqueness, transaction rollback and immutable ledger.
- Regenerated complete data dictionary and added `SMARTOP_P3_DATABASE_RUNBOOK.md` with scope, compatibility and deployment limitations.

## Validation evidence / limitations

| Check | Result |
| --- | --- |
| Prisma validate / generate | PASS |
| Migration deploy + status, new isolated test DB | PASS: all 11 migrations applied and up to date |
| Populated original-schema upgrade with P3 SQL | PASS: old stock/user/receipt rows preserved |
| Migration status, configured legacy local DB | FAIL / needs baseline: original 10 migrations pending; no migration history table; existing data untouched |
| Typecheck | PASS |
| Unit tests | PASS: 125 tests; DB suite skipped by default and run separately |
| Isolated DB integration tests | PASS: 14 tests |
| Static navigation check | PASS: 115 checked routes, 169 page files; not an HTTP/browser test |
| Build | PASS with NODE_ENV=production and isolated chain DB, 138 static pages generated. Initial development-environment attempt failed /404 prerender; existing 3 map hook warnings remain |
| Playwright runtime smoke | NOT_RUN: no production browser suite configured for this database-only slice |
| Source compatibility checks | PASS: all original scalar fields unchanged; only 3 new GoodsReceipt scalar columns; 19 new models; no destructive statements in P3 migration |
| Production DB/provider/restore/UAT | NOT_VERIFIED |

No migration applied to the existing .env database or production. No source workbook import, schema reset, DROP, or deployment. Created isolated loopback test databases are retained; exact names and logs are in ignored `tmp/p3-validation/report.json`. Real DB tests ran on MariaDB 10.4.32, not Linux MySQL 8 staging. No new runtime dependencies.

## High-priority findings

- Inventory pages use existing models but do not provide a complete requisition/warehouse/valuation workflow.
- Enterprise server pages sampled rely on coarse middleware rather than explicit data-scope checks.
- AuthorizationService has legacy role fallback and broad organization/superadmin behavior requiring controlled migration and negative tests.
- API session helper checks DB state, but edge middleware alone does not validate revoked DB sessions for server page queries.
- Audit chaining needs canonical persisted-field and concurrent-order verification before integrity assurance.
- Compose has an AUTH_SECRET fallback; application startup is not gated on migration-job success.
- Redis configuration and EventOutbox tables do not prove a functioning worker; searched code primarily reads outbox status.
- Existing Invoice/Receipt schema ties a receipt to one invoice; multi-invoice allocation needs additive migration.
- Accounting Journal/GL models not present in the inspected schema.
- Configured local DB has 73 tables, lacks 10 baseline tables and 20 columns relative to the original schema, and has no migration history; reviewed legacy reconciliation/baseline is required before deploy.

## Remaining / next steps

1. Reconcile the original standard if supplied later; the new architecture/design is not the missing original. Current database-first work follows the user's authorization to proceed with the proposed plan.
2. Restore an authorized legacy backup to a separate clone, inspect complete drift, reconcile and verify baseline; do not blindly apply old migrations or mark them all applied.
3. Confirm SKU/UOM, aliases, currency/valuation/tax, opening stock and approval authority with business owners.
4. Implement scoped posting services (WAC, cache/ledger/audit atomicity, cumulative limits, document transitions), then API and Thai UI. No new write endpoints are exposed yet.
5. Run Linux MySQL staging migration, concurrency/security/E2E, reconciliation, restore and UAT before production.

P0–P8 are not certified complete. P3 storage foundation: implemented and tested on isolated MariaDB. Production readiness: NOT_READY. Authentication unchanged; procurement, invoice/AR and accounting implementations remain outside this slice.

## Rollback notes

Existing environments were not migrated. On test/staging, additive tables can remain if rolling back to the previous application; do not drop ledger data. Future new write paths require controlled cutover and reconciliation before rollback. MySQL-family DDL is not transactional; partial failure requires inspection and reviewed forward repair. See P3 runbook for triggers and baseline restrictions.
