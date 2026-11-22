import { createHash } from 'node:crypto';
import { InventoryMovementType, Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { adjustment, assertInventory, InventoryError, issue, quantityInput, receiptValue, receive, returnValue } from '../domain/inventory/valuation';

type Tx = Prisma.TransactionClient;
export interface InventoryContext {
  userId: string;
  sessionId: string;
  authzVersion: number;
  organizationId: string;
}
interface SourceScope { siteId?: string | null; projectId?: string | null }
export interface InventoryPostingResult {
  operationId: string;
  movements: { id: string; type: InventoryMovementType; materialId: string; locationId: string; quantityDelta: string; valueDelta: string; balanceAfter: string; valueAfter: string }[];
}

function identifier(value: string) {
  assertInventory(typeof value === 'string' && value.length > 0 && value.length <= 191, 'INVALID_IDENTIFIER');
}
function requestKey(value: string) {
  assertInventory(typeof value === 'string' && /^[A-Za-z0-9:_-]{8,128}$/.test(value), 'INVALID_REQUEST_KEY');
}
function activePeriod(start: Date | null, end: Date | null, now: Date) {
  return (!start || start <= now) && (!end || end > now);
}

/** No legacy User.role fallback. A permission must come from the matching scoped assignment. */
async function permission(tx: Tx, ctx: InventoryContext, code: string, sites: (string | null | undefined)[]) {
  const now = new Date();
  const grants = await tx.userRoleAssignment.findMany({
    where: { userId: ctx.userId, status: 'ACTIVE', role: { isActive: true, permissions: { some: { permission: { code, isActive: true } } } } },
    select: { scopeType: true, scopeId: true, startAt: true, endAt: true },
  });
  const current = grants.filter(grant => activePeriod(grant.startAt, grant.endAt, now));
  const all = current.some(grant => grant.scopeType === 'GLOBAL' || grant.scopeType === 'ORGANIZATION' && grant.scopeId === ctx.organizationId);
  assertInventory(all || sites.length > 0 && sites.every(site => site && current.some(grant => grant.scopeType === 'SITE' && grant.scopeId === site)), 'INVENTORY_FORBIDDEN');
}

async function session(tx: Tx, ctx: InventoryContext) {
  const stored = await tx.userSession.findUnique({ where: { sessionId: ctx.sessionId }, include: { user: true } });
  const now = new Date();
  assertInventory(stored && stored.userId === ctx.userId && stored.status === 'ACTIVE' && stored.expiresAt > now, 'SESSION_INVALID');
  const user = stored.user;
  assertInventory(user.isActive && !user.isLocked && !user.deletedAt && !user.mustChangePassword &&
    (!user.passwordExpiresAt || user.passwordExpiresAt > now) && user.authzVersion === ctx.authzVersion &&
    stored.authzVersion === user.authzVersion && (!user.mfaEnabled || stored.authStrength === 'MFA'), 'SESSION_INVALID');
}

async function location(tx: Tx, org: string, id: string) {
  const result = await tx.warehouseLocation.findFirst({ where: { id, organizationId: org, isActive: true, warehouse: { isActive: true } }, include: { warehouse: true } });
  assertInventory(result, 'LOCATION_UNAVAILABLE');
  return result;
}
async function material(tx: Tx, org: string, id: string, qty: Prisma.Decimal) {
  const result = await tx.material.findFirst({ where: { id, organizationId: org, isActive: true, isStockItem: true, baseUnit: { isActive: true } }, include: { baseUnit: true } });
  assertInventory(result, 'MATERIAL_UNAVAILABLE');
  assertInventory(qty.gt(0) && qty.decimalPlaces() <= result.baseUnit.decimalPlaces, 'INVALID_UNIT_PRECISION');
  return result;
}

async function balance(tx: Tx, org: string, materialId: string, locationId: string) {
  const current = await tx.inventoryBalance.upsert({
    where: { materialId_locationId: { materialId, locationId } },
    create: { organizationId: org, materialId, locationId }, update: {},
  });
  if (current.version === 0) {
    assertInventory(current.quantity.isZero() && current.carryingValue.isZero(), 'BALANCE_RECONCILIATION_REQUIRED');
  } else {
    const last = await tx.inventoryMovement.findUnique({ where: { materialId_locationId_balanceVersion: { materialId, locationId, balanceVersion: current.version } } });
    assertInventory(last && last.balanceAfter.eq(current.quantity) && last.valueAfter.eq(current.carryingValue), 'BALANCE_RECONCILIATION_REQUIRED');
  }
  return current;
}

async function movement(tx: Tx, old: Awaited<ReturnType<typeof balance>>, data: {
  operationId: string; lineKey: string; type: InventoryMovementType;
  quantity: Prisma.Decimal; value: Prisma.Decimal; unitCost: Prisma.Decimal;
  next: { quantity: Prisma.Decimal; value: Prisma.Decimal };
  source: { receiptLineId?: string; requisitionLineId?: string; transferLineId?: string; adjustmentLineId?: string; returnOfId?: string };
}) {
  quantityInput(data.unitCost.toFixed(6), true);
  const updated = await tx.inventoryBalance.updateMany({ where: { id: old.id, version: old.version }, data: {
    quantity: data.next.quantity, carryingValue: data.next.value, version: { increment: 1 },
  } });
  assertInventory(updated.count === 1, 'CONCURRENT_STOCK_CHANGED');
  await tx.inventoryMovement.create({ data: {
    organizationId: old.organizationId, materialId: old.materialId, locationId: old.locationId,
    operationId: data.operationId, lineKey: data.lineKey, type: data.type,
    quantityDelta: data.quantity, valueDelta: data.value, unitCostSnapshot: data.unitCost,
    balanceAfter: data.next.quantity, valueAfter: data.next.value, balanceVersion: old.version + 1, ...data.source,
  } });
}

/** All service mutations serialize on their organization row, then commit ledger/balance/audit/outbox together.
 * This intentionally favors correctness over per-organization throughput in the first release.
 * No HTTP write endpoints are enabled by this service alone.
 */
export class InventoryPostingService {
  constructor(private readonly db: PrismaClient = prisma) {}

  private async execute<T extends SourceScope>(ctx: InventoryContext, kind: string, sourceId: string, key: string, payload: unknown,
    prepare: (tx: Tx) => Promise<T>, post: (tx: Tx, operationId: string, prepared: T) => Promise<void>): Promise<InventoryPostingResult> {
    [ctx.userId, ctx.sessionId, ctx.organizationId, sourceId].forEach(identifier);
    requestKey(key);
    assertInventory(Number.isSafeInteger(ctx.authzVersion) && ctx.authzVersion > 0, 'INVALID_SESSION_VERSION');
    const hash = createHash('sha256').update(JSON.stringify({ kind, sourceId, organizationId: ctx.organizationId, actorId: ctx.userId, payload })).digest('hex');
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.db.$transaction(async tx => {
          const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM Organization WHERE id = ${ctx.organizationId} AND isActive = true FOR UPDATE`;
          assertInventory(locked.length === 1, 'ORGANIZATION_UNAVAILABLE');
          await session(tx, ctx);
          const prepared = await prepare(tx); // Reauthorize even an idempotent retry.
          let operation = await tx.inventoryOperation.findUnique({ where: { organizationId_requestKey: { organizationId: ctx.organizationId, requestKey: key } } });
          if (operation) {
            assertInventory(operation.requestHash === hash && operation.actorId === ctx.userId, 'IDEMPOTENCY_CONFLICT');
          } else {
            operation = await tx.inventoryOperation.create({ data: {
              organizationId: ctx.organizationId, requestKey: key, requestHash: hash, sourceType: kind, sourceId,
              actorId: ctx.userId, siteId: prepared.siteId, projectId: prepared.projectId, reason: kind,
            } });
            await post(tx, operation.id, prepared);
            const count = await tx.inventoryMovement.count({ where: { operationId: operation.id } });
            assertInventory(count > 0, 'EMPTY_INVENTORY_OPERATION');
            const metadata = { organizationId: ctx.organizationId, operationId: operation.id, sourceType: kind, sourceId, movementCount: count };
            // Business audit is atomic and deliberately does not claim the legacy DLP hash-chain signature.
            await tx.auditLog.create({ data: { userId: ctx.userId, action: 'INVENTORY_POSTED', entity: 'InventoryOperation', entityId: operation.id, metadata: JSON.stringify(metadata) } });
            await tx.eventOutbox.create({ data: { eventId: operation.id, eventType: 'inventory.posted', correlationId: operation.id, payload: JSON.stringify(metadata) } });
          }
          const rows = await tx.inventoryMovement.findMany({ where: { operationId: operation.id }, orderBy: { lineKey: 'asc' } });
          return { operationId: operation.id, movements: rows.map(row => ({
            id: row.id, type: row.type, materialId: row.materialId, locationId: row.locationId,
            quantityDelta: row.quantityDelta.toFixed(6), valueDelta: row.valueDelta.toFixed(6), balanceAfter: row.balanceAfter.toFixed(6), valueAfter: row.valueAfter.toFixed(6),
          })) };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5000, timeout: 15000 });
      } catch (error) {
        const retry = error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2034' ||
          error.code === 'P2010' && ['1213', '1205'].includes(String(error.meta?.code))) ||
          error instanceof InventoryError && error.code === 'CONCURRENT_STOCK_CHANGED';
        if (!retry || attempt >= 2) throw error;
      }
    }
  }

  async postReceipt(ctx: InventoryContext, receiptId: string, key: string) {
    return this.execute(ctx, 'GoodsReceipt', receiptId, key, {}, async tx => {
      const doc = await tx.goodsReceipt.findFirst({ where: { id: receiptId, organizationId: ctx.organizationId }, include: {
        po: true, materialLines: { orderBy: { lineNo: 'asc' }, take: 101, include: { poLine: true } },
      } });
      assertInventory(doc && doc.materialLines.length > 0 && doc.materialLines.length <= 100, 'RECEIPT_UNAVAILABLE');
      for (const line of doc.materialLines) {
        const loc = await location(tx, ctx.organizationId, line.locationId);
        await permission(tx, ctx, 'inventory.receive', [loc.warehouse.siteId]);
      }
      return { doc, siteId: null, projectId: doc.po.projectId };
    }, async (tx, operationId, { doc }) => {
      // Legacy POs lack an organization FK: also serialize receipt totals on the PO itself.
      await tx.$queryRaw`SELECT id FROM PurchaseOrder WHERE id = ${doc.poId} FOR UPDATE`;
      const po = await tx.purchaseOrder.findUniqueOrThrow({ where: { id: doc.poId } });
      const foreignReceipt = await tx.goodsReceipt.findFirst({ where: { poId: doc.poId, inventoryStatus: 'POSTED', organizationId: { not: ctx.organizationId } }, select: { id: true } });
      assertInventory(!foreignReceipt, 'PO_ORGANIZATION_CONFLICT');
      assertInventory(doc.inventoryStatus === 'APPROVED' && po.status === 'APPROVED' && po.approvedById && po.approvedAt, 'RECEIPT_NOT_APPROVED');
      assertInventory(po.currency === 'THB', 'UNSUPPORTED_VALUATION_CURRENCY');
      for (const line of doc.materialLines) {
        const poLine = await tx.pOItem.findUniqueOrThrow({ where: { id: line.poLineId } });
        assertInventory(poLine.poId === doc.poId && line.currency === 'THB', 'INVALID_RECEIPT_PO_LINE');
        if (poLine.itemId) {
          const mapped = await tx.materialLegacyMapping.findFirst({ where: { legacyItemId: poLine.itemId, materialId: line.materialId }, select: { id: true } });
          assertInventory(mapped, 'RECEIPT_MATERIAL_MAPPING_REQUIRED');
        }
        assertInventory(poLine.receivedQty === 0, 'LEGACY_RECEIPTS_REQUIRE_RECONCILIATION');
        const ordered = quantityInput(String(poLine.quantity));
        if (line.acceptedQty.isZero()) continue;
        const qty = quantityInput(line.acceptedQty.toFixed(6));
        await material(tx, ctx.organizationId, line.materialId, qty);
        const prior = await tx.inventoryMovement.aggregate({ where: { type: 'PURCHASE_RECEIPT', receiptLine: { poLineId: line.poLineId } }, _sum: { quantityDelta: true } });
        assertInventory((prior._sum.quantityDelta || new Prisma.Decimal(0)).plus(qty).lte(ordered), 'RECEIPT_EXCEEDS_ORDER');
        const old = await balance(tx, ctx.organizationId, line.materialId, line.locationId);
        const cost = quantityInput(line.unitCostSnapshot.toFixed(6), true);
        const value = receiptValue(qty, cost);
        await movement(tx, old, { operationId, lineKey: String(line.lineNo), type: 'PURCHASE_RECEIPT', quantity: qty, value, unitCost: cost,
          next: receive(old.quantity, old.carryingValue, qty, value), source: { receiptLineId: line.id } });
      }
      await tx.goodsReceipt.update({ where: { id: doc.id }, data: { inventoryStatus: 'POSTED', inventoryVersion: { increment: 1 } } });
    });
  }

  async issueRequisition(ctx: InventoryContext, requisitionId: string, key: string, input: { lineId: string; locationId: string; quantity: string }[]) {
    assertInventory(Array.isArray(input) && input.length > 0 && input.length <= 100, 'INVALID_ISSUE_LINES');
    const lines = input.map(line => {
      identifier(line.lineId); identifier(line.locationId);
      return { lineId: line.lineId, locationId: line.locationId, quantity: quantityInput(line.quantity).toFixed(6) };
    }).sort((a, b) => a.lineId.localeCompare(b.lineId));
    assertInventory(new Set(lines.map(line => line.lineId)).size === lines.length, 'DUPLICATE_ISSUE_LINE');
    return this.execute(ctx, 'MaterialRequisition', requisitionId, key, lines, async tx => {
      const doc = await tx.materialRequisition.findFirst({ where: { id: requisitionId, organizationId: ctx.organizationId }, include: { lines: { where: { id: { in: lines.map(line => line.lineId) } }, include: { unit: true } } } });
      assertInventory(doc && doc.lines.length === lines.length, 'REQUISITION_UNAVAILABLE');
      await permission(tx, ctx, 'inventory.issue', [doc.siteId]);
      for (const line of lines) {
        const loc = await location(tx, ctx.organizationId, line.locationId);
        await permission(tx, ctx, 'inventory.issue', [loc.warehouse.siteId]);
      }
      return { doc, siteId: doc.siteId, projectId: doc.projectId };
    }, async (tx, operationId, { doc }) => {
      assertInventory(['APPROVED', 'PARTIALLY_ISSUED'].includes(doc.status) && doc.finalApprovedById && doc.finalApprovedById !== doc.requestedById && doc.finalApprovedAt, 'REQUISITION_NOT_APPROVED');
      for (const requested of lines) {
        const line = doc.lines.find(row => row.id === requested.lineId)!;
        const qty = quantityInput(requested.quantity);
        assertInventory(line.unit.isActive && qty.decimalPlaces() <= line.unit.decimalPlaces, 'INVALID_UNIT_PRECISION');
        assertInventory(line.issuedQty.plus(qty).lte(line.approvedQty), 'ISSUE_EXCEEDS_APPROVED');
        const baseQty = quantityInput(receiptValue(qty, line.conversionFactor).toFixed(6));
        const mat = await material(tx, ctx.organizationId, line.materialId, baseQty);
        if (line.unitId === mat.baseUnitId) assertInventory(line.conversionFactor.eq(1), 'INVALID_UNIT_CONVERSION');
        else {
          const conversions = await tx.materialUnitConversion.findMany({ where: { materialId: mat.id, fromUnitId: line.unitId, toUnitId: mat.baseUnitId, effectiveFrom: { lte: doc.requestedDate }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: doc.requestedDate } }] } });
          assertInventory(conversions.length === 1 && conversions[0].factor.eq(line.conversionFactor), 'INVALID_UNIT_CONVERSION');
        }
        const old = await balance(tx, ctx.organizationId, line.materialId, requested.locationId);
        const next = issue(old.quantity, old.carryingValue, baseQty);
        await movement(tx, old, { operationId, lineKey: line.id, type: 'ISSUE', quantity: baseQty.negated(), value: next.outgoingValue.negated(), unitCost: next.unitCost, next, source: { requisitionLineId: line.id } });
        await tx.materialRequisitionLine.update({ where: { id: line.id }, data: { issuedQty: { increment: qty } } });
      }
      const totals = await tx.materialRequisitionLine.findMany({ where: { requisitionId }, select: { approvedQty: true, issuedQty: true } });
      await tx.materialRequisition.update({ where: { id: requisitionId }, data: { status: totals.every(line => line.approvedQty.eq(line.issuedQty)) ? 'ISSUED' : 'PARTIALLY_ISSUED', version: { increment: 1 } } });
    });
  }

  async postAdjustment(ctx: InventoryContext, adjustmentId: string, key: string) {
    return this.execute(ctx, 'StockAdjustment', adjustmentId, key, {}, async tx => {
      const doc = await tx.stockAdjustment.findFirst({ where: { id: adjustmentId, organizationId: ctx.organizationId }, include: { warehouse: true, lines: { orderBy: { lineNo: 'asc' }, take: 101 } } });
      assertInventory(doc && doc.lines.length > 0 && doc.lines.length <= 100, 'ADJUSTMENT_UNAVAILABLE');
      await permission(tx, ctx, 'inventory.adjust', [doc.warehouse.siteId]);
      return { doc, siteId: doc.warehouse.siteId };
    }, async (tx, operationId, { doc }) => {
      assertInventory(doc.status === 'APPROVED' && doc.approvedById && doc.approvedById !== doc.createdById && doc.approvedAt, 'ADJUSTMENT_NOT_APPROVED');
      for (const line of doc.lines) {
        await location(tx, ctx.organizationId, line.locationId);
        // Validate base-unit precision even for value-only adjustments.
        await material(tx, ctx.organizationId, line.materialId, line.countedQty.isZero() ? quantityInput('1') : line.countedQty);
        const old = await balance(tx, ctx.organizationId, line.materialId, line.locationId);
        assertInventory(old.version === line.expectedBalanceVersion && old.quantity.eq(line.expectedQtySnapshot), 'STALE_STOCK_COUNT');
        assertInventory(!doc.isOpening || old.version === 0 && old.quantity.isZero() && old.carryingValue.isZero(), 'OPENING_STOCK_ALREADY_EXISTS');
        const next = adjustment(old.quantity, old.carryingValue, line.quantityDelta, line.valueDelta);
        assertInventory(!line.quantityDelta.isZero() || !line.valueDelta.isZero(), 'EMPTY_ADJUSTMENT');
        const unitCost = line.quantityDelta.isZero() ? next.quantity.isZero() ? new Prisma.Decimal(0) : new Prisma.Decimal(next.value.div(next.quantity).toFixed(6)) : new Prisma.Decimal(line.valueDelta.div(line.quantityDelta).abs().toFixed(6));
        quantityInput(unitCost.toFixed(6), true);
        await movement(tx, old, { operationId, lineKey: String(line.lineNo), type: 'ADJUSTMENT', quantity: line.quantityDelta, value: line.valueDelta, unitCost, next, source: { adjustmentLineId: line.id } });
      }
      await tx.stockAdjustment.update({ where: { id: adjustmentId }, data: { status: 'POSTED', postedAt: new Date(), version: { increment: 1 } } });
    });
  }

  async postTransfer(ctx: InventoryContext, transferId: string, key: string) {
    return this.execute(ctx, 'StockTransfer', transferId, key, {}, async tx => {
      const doc = await tx.stockTransfer.findFirst({ where: { id: transferId, organizationId: ctx.organizationId }, include: { fromWarehouse: true, toWarehouse: true, lines: { orderBy: { lineNo: 'asc' }, take: 101 } } });
      assertInventory(doc && doc.lines.length > 0 && doc.lines.length <= 100, 'TRANSFER_UNAVAILABLE');
      await permission(tx, ctx, 'inventory.transfer', [doc.fromWarehouse.siteId, doc.toWarehouse.siteId]);
      return { doc, siteId: doc.fromWarehouse.siteId };
    }, async (tx, operationId, { doc }) => {
      assertInventory(doc.status === 'APPROVED' && doc.approvedById && doc.approvedById !== doc.createdById && doc.approvedAt, 'TRANSFER_NOT_APPROVED');
      for (const line of doc.lines) {
        await location(tx, ctx.organizationId, line.fromLocationId);
        await location(tx, ctx.organizationId, line.toLocationId);
        const qty = quantityInput(line.quantity.toFixed(6));
        await material(tx, ctx.organizationId, line.materialId, qty);
        const from = await balance(tx, ctx.organizationId, line.materialId, line.fromLocationId);
        const outgoing = issue(from.quantity, from.carryingValue, qty);
        await movement(tx, from, { operationId, lineKey: `${line.lineNo}:out`, type: 'TRANSFER_OUT', quantity: qty.negated(), value: outgoing.outgoingValue.negated(), unitCost: outgoing.unitCost, next: outgoing, source: { transferLineId: line.id } });
        const to = await balance(tx, ctx.organizationId, line.materialId, line.toLocationId);
        await movement(tx, to, { operationId, lineKey: `${line.lineNo}:in`, type: 'TRANSFER_IN', quantity: qty, value: outgoing.outgoingValue, unitCost: outgoing.unitCost, next: receive(to.quantity, to.carryingValue, qty, outgoing.outgoingValue), source: { transferLineId: line.id } });
        await tx.stockTransferLine.update({ where: { id: line.id }, data: { unitCostSnapshot: outgoing.unitCost } });
      }
      await tx.stockTransfer.update({ where: { id: transferId }, data: { status: 'POSTED', postedAt: new Date(), version: { increment: 1 } } });
    });
  }

  async returnIssue(ctx: InventoryContext, issueMovementId: string, destinationLocationId: string, quantity: string, key: string) {
    identifier(destinationLocationId);
    const qty = quantityInput(quantity);
    return this.execute(ctx, 'InventoryReturn', issueMovementId, key, { destinationLocationId, quantity: qty.toFixed(6) }, async tx => {
      const original = await tx.inventoryMovement.findFirst({ where: { id: issueMovementId, organizationId: ctx.organizationId }, include: { operation: true, location: { include: { warehouse: true } } } });
      assertInventory(original && ['ISSUE', 'PROJECT_CONSUMPTION'].includes(original.type), 'INVALID_RETURN_SOURCE');
      const dest = await location(tx, ctx.organizationId, destinationLocationId);
      await permission(tx, ctx, 'inventory.return', [original.operation.siteId, original.location.warehouse.siteId, dest.warehouse.siteId]);
      return { original, siteId: original.operation.siteId, projectId: original.operation.projectId };
    }, async (tx, operationId, { original }) => {
      await material(tx, ctx.organizationId, original.materialId, qty);
      const prior = await tx.inventoryMovement.aggregate({ where: { returnOfId: original.id }, _sum: { quantityDelta: true, valueDelta: true } });
      const value = returnValue(original.quantityDelta.abs(), original.valueDelta.abs(), prior._sum.quantityDelta || '0', prior._sum.valueDelta || '0', qty);
      const old = await balance(tx, ctx.organizationId, original.materialId, destinationLocationId);
      await movement(tx, old, { operationId, lineKey: 'return', type: 'RETURN', quantity: qty, value, unitCost: original.unitCostSnapshot,
        next: receive(old.quantity, old.carryingValue, qty, value), source: { returnOfId: original.id } });
    });
  }
}
