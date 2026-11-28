# SmartOP Production Progress

Updated: 2026-11-22 (Asia/Bangkok)

## Branch / baseline

- Branch: `feature/production-erp-foundation`
- Latest existing commit inspected: `2d19540878ed6ff947ae87ac97e24c481c078467`
- Latest requested scope: integrated ERP/accounting/tax-remittance design plus company-wide gap scan. Current changes are design/audit documents and a read-only workbook scanner; no new accounting/tax application implementation or database changes. New commit SHA is reported in the task response after commit.

## Latest design / company scan (2026-11-22)

- Created integrated ERP blueprint, tax filing design, integration data model, 44-ticket/epic delivery backlog, official tax source register and 48-area company system gap audit with complete gap-to-ticket mapping.
- Incorporated configurable VAT registration/effective dates in company master, with branches tied to legal-entity registration and immutable historical document snapshots.
- Covered goods/service procurement, customer orders, PO/work contracts, inspections/acceptance, stock, vendor/customer billing, AP/AR, payments/bank, GL, tax forms/evidence and adjacent payroll/SSO/DBD workflows.
- Structurally scanned all 50 sheets in the two supplied workbooks: employee workbook 12 sheets / 1,082 formulas / external-link parts; materials workbook 38 sheets / 9,511 formulas. No cached error tokens found; no recalculation or raw business rows exported.
- Price-master scan flagged 12 priced descriptions lacking codes as review candidates, not confirmed new SKUs. Source ranges differ from older report versions.
- Confirmed a production payroll blocker: attendance query not date-bounded to period, hard-coded OT 20 hours and tax 1%. These were documented, not silently connected to statutory filing.
- Rechecked backup script presence vs hard-coded verified UI; restored operational backup evidence remains unverified.
- Current task verification: workbook read-only/privacy checks, source references, document links/fences, 44-ticket/48-gap traceability and git diff. Application tests/build/migrations were NOT_RUN for these documentation/scanner changes; results in the next section belong to the prior implementation slice.

## Previously completed implementation (evidence at prior commit)

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
- Resolved in A0 on 2026-11-24: Compose now requires AUTH_SECRET and gates application startup on migration-job success and schema validation.
- Redis configuration and EventOutbox tables do not prove a functioning worker; searched code primarily reads outbox status.
- Existing Invoice/Receipt schema ties a receipt to one invoice; multi-invoice allocation needs additive migration.
- Accounting Journal/GL models not present in the inspected schema.
- Configured local DB has 73 tables, lacks 10 baseline tables and 20 columns relative to the original schema, and has no migration history; reviewed legacy reconciliation/baseline is required before deploy.

## Remaining / next steps

### Deployment destination and Linux validation 2026-11-28

User confirmed `https://smartop.tomvisolution.tech/` as the deployment destination; existing Nginx configuration already names this host. Server access details are still required. The public fetch tool could not access the URL; this does not establish whether the site is down. No deployment or production database changes performed.

Added `.github/workflows/release-validation.yml` to run quality gates, fresh migration chain, populated upgrade, integration tests and build on Linux/MySQL 8 using disposable CI databases. This workflow has not yet been verified by a completed GitHub Actions run; its presence is not a passing Linux certification. It contains only synthetic CI credentials and cannot deploy production.

### A0 release integrity 2026-11-24

Implemented a read-only database release gate (`npm run db:preflight`, with optional `--history-only`), migration-history/checksum/prefix checks, and a post-migration Prisma schema comparison that fails closed. PM2 and Docker release paths now gate startup on these checks. Docker requires an explicit AUTH_SECRET and waits for the migration job to succeed. Authentication logic is unchanged.

The first real schema comparison exposed historical migration-chain drift: PasswordHistory was missing, mapped RBAC constraint names differed, and a deprecated password storage column was not represented. Added `20261124000000_release_schema_alignment`, preserved original constraint names in the schema, and retained the deprecated column as an ignored Prisma field. No DROP/data reset was added. Case-sensitive Linux table renaming remains to be validated on Linux/MySQL 8.

Fresh evidence: Prisma validate/generate, typecheck, lint (3 pre-existing map-hook warnings), 149 ordinary tests, 41 isolated MariaDB tests, full migration chain/status, baseline upgrade with synthetic data including the new migration, navigation 115/115, production build against an isolated DB, and Bash deployment syntax passed. Docker execution is NOT_VERIFIED (CLI unavailable). The configured local DB was offline; a separate workspace MariaDB instance on loopback port 3308 was used. Existing .env database and production were not modified. The runner retains its uniquely named databases and deliberately added schema-drift probe.

See `SMARTOP_A0_DATABASE_RELEASE_GATE.md`. This completes the release-gate implementation slice, not ERP-001 business-data reconciliation, restore certification, all A0 tasks, or overall production readiness. No go-live/deployment occurred.

### Company approval package 2026-11-23

Thai edition: `SMARTOP_COMPANY_APPROVAL_PLAN_TH.md`, generated with `python scripts/build-approval-document.py --thai`, translates the business narrative, diagram, 44 ticket titles and acceptance criteria, 48 audit areas, responsibilities and approval form. The Thai Word/PDF were rendered with Microsoft Word and visually reviewed across all 24 pages. Coverage checks confirmed 44 ticket IDs, 48 gap IDs and 11 unchanged source links. Product names and reference IDs remain traceable. This update changes documents only.

Prepared `SMARTOP_COMPANY_APPROVAL_PLAN.md` and the reproducible `scripts/build-approval-document.py` for the Thai company approval proposal. The package includes scope, current implementation limits, architecture, migration controls, delivery stages, responsibilities, UAT, cutover, all 44 delivery tickets, all 48 audit areas, and approval signatures. Word/PDF deliverables are generated under ignored `output/` and rendered through Microsoft Word for layout review.

This is a proposal for company review, not company approval or production certification. Pricing, staffing, calendar dates, actual tax/bank provider access and data-owner sign-off remain to be established. No application code, production data, migrations or deployment were changed for this document package. Previous test results remain historical evidence at the recorded code baseline.

1. Reconcile the original standard if supplied later; the new architecture/design is not the missing original. Current database-first work follows the user's authorization to proceed with the proposed plan.
2. Restore an authorized legacy backup to a separate clone, inspect complete drift, reconcile and verify baseline; do not blindly apply old migrations or mark them all applied.
3. Confirm SKU/UOM, aliases, currency/valuation/tax, opening stock and approval authority with business owners.
4. Implement scoped document creation/review/approval, immutable-posted guards, acknowledgement, validated API and Thai UI. Posting services exist; no new write endpoints are exposed yet.
5. Run Linux MySQL staging migration, concurrency/security/E2E, reconciliation, restore and UAT before production.

P0–P8 are not certified complete. P3 storage and internal posting services are implemented and tested on isolated MariaDB. Production readiness: NOT_READY. Authentication unchanged; procurement, invoice/AR and accounting implementations remain outside this slice. Outbox persistence is tested; worker delivery is not implemented by this work.

## Rollback notes

Existing environments were not migrated. On test/staging, additive tables can remain if rolling back to the previous application; do not drop ledger data. Future new write paths require controlled cutover and reconciliation before rollback. MySQL-family DDL is not transactional; partial failure requires inspection and reviewed forward repair. See P3 runbook for triggers and baseline restrictions.
