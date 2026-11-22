# P3 Database Foundation — Scope, validation and deployment notes

Date: 2026-11-21 · Branch: `feature/production-erp-foundation`

## What this slice implements

Database-first foundation only: 19 additive models and 3 enums, taking Prisma from 83 to 102 models. Authentication handlers, session behavior, existing inventory writes and UI are unchanged. No import, stock backfill or production deployment is enabled.

| Area | New models |
| --- | --- |
| Masters | MaterialCategory, UnitOfMeasure, Material, MaterialLegacyMapping, MaterialUnitConversion, MaterialPriceHistory |
| Storage / ledger | Warehouse, WarehouseLocation, InventoryBalance, InventoryOperation, InventoryMovement |
| Requisitions | MaterialRequisition, MaterialRequisitionLine, MaterialAcknowledgement |
| Purchasing bridge | GoodsReceiptLine (GoodsReceipt and GoodsReceiptItem remain) |
| Transfers / counts | StockTransfer, StockTransferLine, StockAdjustment, StockAdjustmentLine |

Migration: `prisma/migrations/20261121000000_p3_inventory_foundation/migration.sql`.

Only GoodsReceipt receives new scalar columns: nullable organizationId, inventoryStatus default DRAFT, inventoryVersion default 0. Existing receipt rows do not require immediate organization mapping. Other legacy model additions are inverse relations/composite indexes. Existing money/quantity fields are not renamed, converted or deleted.

## Storage contracts

- Material.code is globally unique and remains text, including leading zeros. Variants have explicit reviewed mappings rather than automatic fill-down from Excel.
- Composite foreign keys bind new material/category, material/location/operation/source lines to the same organization. Transfer and adjustment lines must also use locations from the document's warehouse.
- Organization-to-Site/Project/User membership is not established by these FK checks: existing masters lack a universal organization relation. Server authorization must validate ownership and assignment before any new write endpoint is enabled.
- Quantity/unitCost use Decimal(18,6); carrying/movement value uses Decimal(24,6) to accommodate extended quantity × price. Amounts outside configured bounds must be rejected in service validation.
- Monetary storage in this slice assumes a single valuation currency per organization. There is no FX engine. Do not mix foreign-currency receipt costs into balances without an approved conversion policy.
- Unique operation requestKey and requestHash support retry conflict detection. Services must compare payload hash/actor and return the original result; a unique index alone is not an idempotency implementation.
- Unique material/location/balanceVersion supports ordered writes. Services must lock/conditionally update balance, insert all movements, audit and outbox in one transaction. Do not independently edit InventoryBalance; database checks alone cannot enforce ledger/cache reconciliation.
- Requisition quantities are in the line's declared unit; conversionFactor snapshots base-unit conversion. Ledger and acknowledgement quantities are in the material base unit. Posting services must perform the conversion and rounding consistently.
- Partial issues are represented by separate InventoryOperations and movements linked to the requisition line. MaterialAcknowledgement references an issue movement; receiving must not decrement stock again.
- Source references are typed FKs for receipt, requisition, adjustment, transfer and return. Generic operation sourceType/sourceId additionally needs service validation.
- Adjustment opening stock is explicit through isOpening/reason/approval. Historical expense summaries are not automatically treated as opening stock.

## Database enforcement beyond Prisma

The migration includes 17 CHECK constraints and 4 append-only triggers, which Prisma schema alone does not express. Do not regenerate the migration and silently discard them.

- Nonnegative stock/value, valid unit precision, positive conversions, valid price periods and nonnegative price/tax rate bounds.
- Requested ≥ approved ≥ issued ≥ received quantities and positive requested quantities.
- Requisition/adjustment/transfer creator and approver separation; approved states need approval evidence, posted transfer/adjustment needs postedAt.
- Movement sign/source checks and valid after-balances.
- InventoryMovement and InventoryOperation reject UPDATE/DELETE. Corrections must use approved new movements.

Runtime services still must enforce transition order, immutable posted documents/lines, effective-date overlap, cumulative receipt/return/acknowledgement limits, receipt line's PO ownership, transfer line's movement direction/location, actor permissions and stock availability. No endpoint exposing these tables was added in this slice. Database constraints are defense in depth, not a complete workflow.

Server behavior for CHECK enforcement and trigger privileges must be verified on the actual staging engine/version. Tests here ran on local MariaDB 10.4.32 with lower_case_table_names=1; Linux MySQL 8 staging remains unverified. Application DB account should lack DDL/trigger management privileges; migration account needs the required DDL/TRIGGER permissions. Parent keys are immutable by application policy; do not change referenced primary keys via cascade.

## Current legacy database finding (read-only)

The .env target is a loopback development connection. Inspection found:

- MariaDB 10.4.32, lower_case_table_names=1; table names must be compared with the server's case behavior.
- 73 existing tables; no `_prisma_migrations` table.
- Relative to the original 83-model source, 10 expected tables and 20 expected columns are absent.
- `prisma migrate status` therefore reports all original 10 migrations pending. This is NOT an empty database.

Do not run the full migration chain against this database: old CREATE TABLE statements may collide with existing tables. No reconciliation, baseline marking or migration was applied to it. Read-only drift SQL was generated in ignored `tmp/p3-validation/local-drift.sql` and was not executed.

Next legacy baseline procedure: back up and restore to a separate authorized clone; inspect types/indexes/FKs/defaults and existing data; review every original migration including data transformations; prepare and test reconciliation scripts; mark only migrations whose effects have been verified. Do not blindly mark all old migrations applied and do not edit checksums of applied migrations. Production database state must be inspected independently, not assumed equal to this local database.

## Repeatable validation commands

```text
npm run db:inspect
npx prisma validate
npx prisma generate
npm run test:db:p3
npm run typecheck
npm run test
npm run check:routes
npm run build
```

`db:inspect` is read-only and prints schema/history metadata, not business records or credentials.

`test:db:p3` requires a configured loopback DATABASE_URL with permission to create test databases. It creates uniquely named `smartop_p3_test_chain_*` and `smartop_p3_test_upgrade_*`; it refuses to reuse an existing name. It never alters the configured database and never drops databases. Test databases are retained for inspection; remove them manually only after verifying exact names and workspace/environment ownership. No seed scripts targeting real data are used.

The runner performs:

1. Full `prisma migrate deploy` of all 11 migrations into an empty test DB, followed by migrate status.
2. Separate upgrade test: generate DDL from the reviewed original schema, create that schema in the second test DB, insert synthetic legacy fixtures, apply just the new P3 migration.
3. Real database Vitest integration tests, including old row preservation, composite FK scope, Decimal precision, SoD, invalid quantities, duplicate operations, append-only triggers and rollback.

Full-chain migration is tested via migrate deploy. The populated upgrade uses db execute against the NEW isolated DB to test the SQL; it does not baseline a real legacy database. `npm test` skips the DB suite unless P3_TEST_DATABASE_URL is set; the explicit runner supplies an isolated URL. Do not report these skipped cases as passed without running the explicit suite.

Build validation uses NODE_ENV=production and the isolated chain database through a child-process environment override, without changing .env. Initial build under the existing development environment failed prerendering /404; rerun with NODE_ENV=production passed and generated all 138 static pages. Existing 3 map hook lint warnings are outside this change. The explicit database suite passes 14 tests; baseline suite passes 125 tests.

## Rollback / release boundary

This slice is not a production release. Reviewed migrations can be applied only after resolving baseline on the intended environment and running staging-engine validation. MySQL-family DDL is not an all-or-nothing transaction: a partial migration failure needs inspection and a reviewed forward repair, not reset.

Before new write endpoints exist, the old application remains compatible with the additive schema. Keep new tables on rollback; do not DROP them. Once a new ledger write path is enabled, the old application must not write legacy balances independently; cutover/reconciliation and audit are required. Posted movements cannot be edited or deleted to undo business events.

Update 2026-11-22: internal posting services and their tests are now implemented; see [posting service contract](SMARTOP_P3_POSTING_SERVICE.md). A second migration widens AuditLog.metadata and EventOutbox.payload to TEXT. Current isolated verification applies 12 migrations and runs 38 DB tests; the counts earlier in this document describe the original foundation slice. Configured legacy DB remains unmigrated. Next: scoped document workflow/approval and acknowledgement, followed by API/UI and staging cutover.
