# P3 — Transactional inventory posting services

Updated: 2026-11-22 · Branch: `feature/production-erp-foundation`

## Delivered scope

`src/server/services/inventory-posting.service.ts` adds five internal server use cases:

| Method | Required permission | Source / behavior |
| --- | --- | --- |
| postReceipt | inventory.receive | Approved scoped GoodsReceipt + approved PO; receive accepted base-unit quantities once |
| issueRequisition | inventory.issue | Approved/partially issued requisition; partial issue from authorized location at weighted average cost |
| postAdjustment | inventory.adjust | Separately approved physical count/value adjustment, with exact expected balance version |
| postTransfer | inventory.transfer | Approved transfer; paired outbound/inbound movements commit atomically with identical value |
| returnIssue | inventory.return | Reference an original ISSUE/PROJECT_CONSUMPTION; return original issue value, limited by prior returns |

This is an internal service slice, not a full warehouse UI release. No new public routes, navigation items, approval/create/edit endpoints or imports are enabled. Existing authentication and the legacy inventory pages remain unchanged. Approved source documents are preconditions: subsequent document-workflow services must protect their creation, review, approval and immutability. Receipt posting does not update the legacy POItem Float receivedQty; new-receipt totals derive from the ledger until procurement cutover.

## Security boundary

Callers supply a server-derived InventoryContext: userId, signed-session sessionId/authzVersion and organizationId resolved from the authorized resource. Future handlers must obtain these from the verified session/resource, not trust client-supplied actor/approver fields. This service independently rechecks the stored UserSession and current User, including revoke, expiry, disabled/locked/deleted accounts, password-change/expiry, MFA strength and authzVersion.

Permissions are evaluated through active UserRoleAssignment → active Role → active Permission. No User.role, legacy permissions blob, implicit ADMIN or special role-code bypass is used. GLOBAL grants require the actual permission; ORGANIZATION must match the exact organization ID. SITE grants must match every required site and hold the permission on that same assignment. Unbound central warehouses require ORGANIZATION/GLOBAL access; unsupported TEAM/PROJECT/etc scopes fail closed in this slice until a verified ownership mapping is available.

Receiving checks warehouse-site scope; issuing checks requisition site and issuing warehouse site; transfer checks both warehouse sites; return checks original requisition/issue site and both storage sites. Typed source queries restrict organizationId. Cross-organization PO receipt conflicts are rejected: legacy POs lack organization ownership, so their receipts additionally serialize on the PO row and cannot post into conflicting organizations.

The permission catalog adds five codes. Existing SUPER_ADMIN/BREAK_GLASS_ADMIN all-permission templates include them if the reviewed seed is explicitly run; ordinary role templates are not expanded. No seed or actual role assignment was applied to the configured database. `inventory.manage` alone does not authorize the new posting methods.

## Transaction / retry / reconciliation

1. Validate identifiers, requestKey and decimal-string input.
2. Start an interactive ReadCommitted transaction; lock the active Organization row FOR UPDATE.
3. Check the active DB session and current scoped permission, including on idempotent replay.
4. Bind request hash to actor, organization, source operation and normalized quantities. Existing key + same request returns original committed movements; a different request gives IDEMPOTENCY_CONFLICT.
5. Validate document state and approval separation; load active material/UOM/warehouse/location and stock cache.
6. Verify the stock cache matches its latest ledger snapshot/version. A nonzero unbacked balance or mismatched snapshot gives BALANCE_RECONCILIATION_REQUIRED.
7. Update stock conditionally by version and insert immutable movements, document state, safe audit and EventOutbox row in the same transaction.
8. Roll back everything if any write fails. Retry deadlock/write-conflict cases at most twice, with all permission/session checks repeated.

The coarse organization lock intentionally prioritizes correctness in the initial deployment. It limits throughput for unrelated warehouses in one organization; load-test before release and refine lock granularity only with equivalent concurrency tests. A receipt also locks its PO and rereads its current quantity/approval state to protect totals across legacy organization boundaries.

Business AuditLog uses action INVENTORY_POSTED and records only IDs/type/count. It does not claim the old DLP hash-chain signature. EventOutbox records inventory.posted with the operation ID as its unique eventId. Persistence is tested; event delivery/worker execution is not implemented here.

## Valuation / UOM rules

- Pure valuation functions use a local Decimal arithmetic context with precision 48; no process-wide Decimal settings are changed.
- User quantities must be decimal strings, positive, at most 12 integer and 6 fractional digits; exponent notation, binary floating-point inputs and excess scale are rejected.
- Unit costs allow zero and have the same configured input bounds. Extended stock values use Decimal(24,6); bounds and zero-stock/no-value consistency are checked before persistence.
- Receipt quantity × unit cost is rounded HALF_UP to six places. Issue value is current carryingValue × issued quantity / onHand, rounded to six places. A final full issue drains exact remaining value to prevent residual dust.
- Returns use proportional original issue value; the final full return restores its exact remaining original value. Returns do not reduce gross issuedQty or reopen approval; re-issue requires another approved requisition.
- Transfer value is equal/opposite; receiving location blends it into its own carrying value, without reading current material price history.
- Requisition quantities stay in their declared unit. Issuing uses the approved conversion-factor snapshot and validates it against one effective-dated conversion to the base unit. Decimal precision is checked for requested and base units; conversion products are rounded HALF_UP to six base-unit places.
- Opening adjustment requires a zero, version-0 balance. Ordinary adjustments require exact expected quantity and version, preserve nonnegative balances and cannot leave value at zero stock.
- Valuation currency is THB only. Non-THB source receipts fail; no FX conversion is inferred.

Legacy PO Float quantities are read only as a compatibility boundary and must convert exactly to supported decimal-string precision. A nonzero legacy receivedQty is rejected with LEGACY_RECEIPTS_REQUIRE_RECONCILIATION. A PO line referencing a legacy InventoryItem requires an explicit MaterialLegacyMapping to the received Material. No historical quantity or cost is guessed.

## Schema / validation

Migration `20261122000000_inventory_posting_payloads` widens AuditLog.metadata and EventOutbox.payload to TEXT. Long source identifiers must not truncate audit or cause half-written inventory. Existing values are retained; the earlier app remains compatible. Apply only after the baseline process described in the database runbook.

Verification is recorded in `SMARTOP_PRODUCTION_PROGRESS.md`. The real-DB suite exercises weighted average, simultaneous issues, duplicate/replayed requests, cross-scope denial, session/password/MFA revocation, unit conversion, atomic transfer/return/count, PO limits, metadata length, tampered balances and injected audit/outbox write failure. Query-adapter fault injection retains the real database transaction; no production DDL test hooks are added.

## Error contract for later API handlers

InventoryError.code is a stable domain code, not an HTTP response. Future handlers should explicitly map invalid input to 400/422, invalid session to 401, permission failure to 403, unavailable scoped resource to a non-leaking 404, and idempotency/state/stock conflicts to 409. Unknown Prisma/provider errors must be sanitized; never send connection strings or raw query diagnostics to the browser. A database error is never a success response.

## Remaining work before enabling writes

- Review business valuation/rounding/UOM/approval policies and baseline the intended database on a restored clone.
- Build scoped document creation/submission/review/approval and immutable-posted guards, including authority limits, audit and optimistic versioning.
- Add acknowledgement/receive workflow with cumulative quantities and idempotency; it must not post stock again.
- Add validated API handlers, CSRF/origin checks, scoped reads and Thai UI; keep unfinished routes hidden.
- Implement outbox worker, operational reconciliation reports, Linux MySQL staging tests, restore/load/browser testing and company UAT.
- No production deployment or runtime write cutover is authorized by the presence of these services.
