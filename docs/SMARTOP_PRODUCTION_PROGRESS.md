# SmartOP Production Progress

Updated: 2026-11-22 (Asia/Bangkok)

## Branch / baseline

- Branch: `feature/production-erp-foundation`
- Latest existing commit inspected: `436e909bc9e3dfadc28dfca549346d701766a0d2`
- This update adds internal P3 posting services to the database foundation; it does not complete P0 or the P3 application UI/workflow. New commit SHA is reported in the task response after commit.

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
- Added receipt, issue, transfer, original-cost return and approved-count posting services, with session revalidation and exact normalized scoped permissions.
- Added local Decimal valuation context, WAC, last-issue/last-return residual handling, UOM conversion, idempotent replay and bounded conflict retry.
- Organization/PO locking and balance-version guards protect simultaneous writes; ledger, balance, document state, safe business audit and outbox commit atomically. Cache/last-ledger mismatch fails closed.
- Added five permission catalog codes without expanding ordinary role templates; catalog/recovery tests updated to 71 permissions / 260 privileged-template mappings. No real roles were seeded or reassigned.
- Added `20261122000000_inventory_posting_payloads` to widen AuditLog.metadata and EventOutbox.payload to TEXT; no old values are deleted. Schema still has 102 models.
- Added 8 valuation tests and 24 service integration cases in addition to the 14 database-foundation cases. Added posting-service contract/runbook.

## Validation evidence / limitations

| Check | Result |
| --- | --- |
| Prisma validate / generate | PASS |
| Migration deploy + status, new isolated test DB | PASS: all 12 migrations applied and up to date |
| Populated original-schema upgrade with both P3 migrations | PASS: old stock/user/receipt rows preserved |
| Migration status, configured legacy local DB | FAIL / needs baseline: all 12 migrations pending (10 original + 2 P3); no migration history table; existing data untouched |
| Typecheck | PASS |
| Unit/catalog tests | PASS: 134 tests; 38 DB cases skipped by default and run separately |
| Isolated DB integration tests | PASS: 38 tests (14 foundation + 24 service) |
| Static navigation check | PASS: 115 checked routes, 169 page files; not an HTTP/browser test |
| Build | PASS: NODE_ENV=production, isolated chain DB, 138 static pages; 3 pre-existing map hook warnings remain |
| Playwright runtime smoke | NOT_RUN: no new public write routes/UI in this internal-service slice |
| Source compatibility | Previous P3 foundation preserved old fields; current migration only widens 2 existing string columns to TEXT. No removed columns or authentication behavior changes |
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
4. Implement scoped document creation/review/approval, immutable-posted guards, acknowledgement, validated API and Thai UI. Posting services exist; no new write endpoints are exposed yet.
5. Run Linux MySQL staging migration, concurrency/security/E2E, reconciliation, restore and UAT before production.

P0–P8 are not certified complete. P3 storage and internal posting services are implemented and tested on isolated MariaDB. Production readiness: NOT_READY. Authentication unchanged; procurement, invoice/AR and accounting implementations remain outside this slice. Outbox persistence is tested; worker delivery is not implemented by this work.

## Rollback notes

Existing environments were not migrated. On test/staging, additive tables can remain if rolling back to the previous application; do not drop ledger data. Future new write paths require controlled cutover and reconciliation before rollback. MySQL-family DDL is not transactional; partial failure requires inspection and reviewed forward repair. See P3 runbook for triggers and baseline restrictions.
