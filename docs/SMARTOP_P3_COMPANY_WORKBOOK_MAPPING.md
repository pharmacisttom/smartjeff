# P3 company workbook mapping

Reviewed: 2026-11-21. Scope: Warehouse / Materials only.

## Evidence and limits

Read-only structural inspection of the supplied employee workbook (12 sheets) and material requisition workbook (38 sheets). Inspected the requisition form, price update, monthly summary, AAM example, site CODE and working-time sheets. This is a sampled mapping, not a completed import or reconciliation. Source files remain outside the repository. No employee records are reproduced here.

The implementation plan supplied by the user remains applicable. `SMARTOP_SYSTEM_STANDARD.md` is still unavailable; the user's requirement to read it before coding remains unresolved. This document does not replace that standard or declare production readiness.

## Source to target mapping

| Source | Observed structure | Production representation |
| --- | --- | --- |
| Employee workbook, CODE!A2:D18 | Site abbreviation, code, company name, location | Explicit site alias mapping to existing Site and Client; do not create sites automatically from sheet names |
| FORM ใบเบิก!A3:I8 | Site, month/year, requisition date, requester, approver and category blocks | MaterialRequisition header, lines, workflow history and server-side approval |
| FORM ใบเบิก!B9:D18 and G9:I18 | Description, text item code, quantity | Material plus requisition lines; preserve leading zeros |
| FORM PRICE UPDATE . 2026, sampled rows 9–18 | Base price, tax amount and tax-inclusive price; variants on following rows can have blank codes | Reviewed SKU mapping and effective-dated MaterialPriceHistory; never fill down codes into unique SKU without reviewing variants |
| AAM!A7:Z18 | Equipment, cleaning chemicals and other materials; separate quantity/price blocks | Three initial MaterialCategory records, normalized transaction lines |
| AAM!D9:H9 | Base price, tax, inclusive price, quantity and line total | Separate base price, tax rate, inclusive price and historical line amount using Decimal |
| SUMMARY 10.2026!B2:F18 | Site totals by equipment, chemicals, other and overall amount | Period/site/category consumption report, reconciled to source totals |

## Observed business rules

- Sample formulas use tax at 7%: E9 = D9 × 7%, F9 = D9 + E9, H9 = G9 × F9. Preserve this source calculation for historical comparison; production tax policy must be configurable.
- Monthly summary formulas reference totals from individual site sheets. A sheet is a source partition, not a separate database table.
- Sample variants under codes such as 002 and 003 have different descriptions and prices, with subsequent code cells blank. Require distinct approved SKU identities for genuinely different items.
- Site abbreviations differ in spacing and spelling between source sections. Resolve through a previewed alias map, not fuzzy matching during import.
- The form contains requester and approver fields. Enforce creator != final approver on the server.
- Historical requisition quantities and tax-inclusive expense totals do not establish current warehouse stock or weighted average cost. Opening balances require separately verified quantity and valuation evidence.
- Blank quantities must remain distinguishable from explicit zero until validation. Blank prices must not silently become valid zero prices.

## Existing implementation gaps

- Current InventoryItem contains a single stockBalance and unitCost; StockMovement uses Float quantities. No explicit warehouse/location balance model was found in the inspected schema.
- Existing requisitions page reads issue movements; it is not an approval workflow.
- GoodsReceipt and GoodsReceiptItem already exist and connect to purchasing. Extend compatibly; do not introduce a conflicting second receipt model.
- Existing authentication must remain intact. Inventory endpoints and server-rendered data access require permission plus resource scope checks.

## P3 implementation acceptance

1. Material categories, unique SKU, units, effective-dated prices, warehouse and locations.
2. Transactional immutable stock ledger with warehouse/material balances, Decimal quantities and costs, concurrency protection and idempotency.
3. Weighted average receipt valuation; issues at current weighted average; explicit return valuation and atomic paired transfers.
4. Requisition lifecycle: DRAFT → SUBMITTED → REVIEW → APPROVED → PARTIALLY_ISSUED → ISSUED → RECEIVED, with controlled rejection/cancellation. Issuance cannot exceed approved or available quantities.
5. Audited stock adjustments with separate creator/approver and explicit reason; site/project cost allocation.
6. Thai UI with permission-aware actions, search, filters, pagination and loading/empty/error states.
7. Controlled import: parse → validate → preview → error report → confirm → transactional import → audit. Preserve source sheet/row lineage and prevent duplicate import.
8. Reconcile sampled historical site/category expense totals separately from production inventory valuation. Do not equate historical VAT-inclusive expense with inventory carrying cost without an approved policy.
9. Migration review and validation on a non-production database; tests for ledger reconciliation, concurrent issue, duplicate requests, transfer atomicity, approval separation and cross-site denial. Run required repository quality gates and report failures explicitly.

## Current execution status

The mapping task originally made no database changes. Subsequent authorized database-first work added a 19-model P3 storage migration and isolated database tests; see `SMARTOP_P3_DATABASE_RUNBOOK.md` and `SMARTOP_PRODUCTION_PROGRESS.md` for current execution evidence. No source workbook import or production write has occurred. Business valuation/SKU decisions and application workflows remain outstanding.
