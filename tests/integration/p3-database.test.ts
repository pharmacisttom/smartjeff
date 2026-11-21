import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const testUrl = process.env.P3_TEST_DATABASE_URL;
if (testUrl) {
  const url = new URL(testUrl);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      !/^\/smartop_p3_test_[a-z0-9_]+$/.test(url.pathname)) {
    throw new Error('Refusing to use a non-isolated P3 test database.');
  }
}
const db = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null!;
const org = 'p3-legacy-org';
const actor = 'p3-legacy-user';
const otherOrg = 'p3-other-org';
const uid = () => randomUUID();
const date = new Date('2026-11-21T00:00:00.000Z');

describe.skipIf(!testUrl)('P3 database foundation (real isolated MySQL-compatible database)', () => {
  beforeAll(async () => {
    await db.organization.create({ data: { id: otherOrg, code: 'P3_OTHER', name: 'Synthetic other org' } });
    await db.user.create({ data: { id: 'p3-approver', email: 'p3-approver@example.invalid' } });
    await db.unitOfMeasure.create({ data: { id: 'p3-uom', code: 'P3_PCS', nameTh: 'ชิ้น' } });
    for (const [id, organizationId] of [['p3-cat', org], ['p3-other-cat', otherOrg]]) {
      await db.materialCategory.create({ data: { id, organizationId, code: 'GENERAL', nameTh: 'วัสดุทดสอบ' } });
    }
    await db.material.create({ data: { id: 'p3-material', organizationId: org, code: '000-P3', nameTh: 'วัสดุจำลอง', categoryId: 'p3-cat', baseUnitId: 'p3-uom' } });
    await db.material.create({ data: { id: 'p3-other-material', organizationId: otherOrg, code: 'OTHER-P3', nameTh: 'วัสดุอีกองค์กร', categoryId: 'p3-other-cat', baseUnitId: 'p3-uom' } });
    for (const [id, organizationId] of [['p3-warehouse', org], ['p3-destination', org], ['p3-other-warehouse', otherOrg]]) {
      await db.warehouse.create({ data: { id, organizationId, code: id, nameTh: 'คลังทดสอบ' } });
      await db.warehouseLocation.create({ data: { id: `${id}-loc`, organizationId, warehouseId: id, code: 'A1', nameTh: 'ช่อง A1' } });
    }
  });
  afterAll(async () => { await db?.$disconnect(); });

  it('preserves legacy stock, movement, user and PO receipt through additive migration', async () => {
    const item = await db.inventoryItem.findUniqueOrThrow({ where: { id: 'p3-legacy-item' } });
    expect(item.stockBalance).toBe(5);
    expect(item.unitCost.toFixed(2)).toBe('10.25');
    expect(await db.stockMovement.count({ where: { id: 'p3-legacy-movement' } })).toBe(1);
    const user = await db.user.findUniqueOrThrow({ where: { id: actor } });
    expect(user.email).toBe('p3-legacy@example.invalid');
    const receipt = await db.goodsReceipt.findUniqueOrThrow({ where: { id: 'p3-legacy-receipt' } });
    expect(receipt.organizationId).toBeNull();
    expect(receipt.inventoryStatus).toBe('DRAFT');
    expect(receipt.poId).toBe('p3-legacy-po');
  });

  it('keeps leading zeros in SKU and rejects duplicate SKU', async () => {
    expect((await db.material.findUniqueOrThrow({ where: { code: '000-P3' } })).code).toBe('000-P3');
    await expect(db.material.create({ data: { organizationId: org, code: '000-P3', nameTh: 'duplicate', categoryId: 'p3-cat', baseUnitId: 'p3-uom' } })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rejects material/category and balance/location cross-organization references', async () => {
    await expect(db.material.create({ data: { organizationId: org, code: uid(), nameTh: 'bad', categoryId: 'p3-other-cat', baseUnitId: 'p3-uom' } })).rejects.toMatchObject({ code: 'P2003' });
    await expect(db.inventoryBalance.create({ data: { organizationId: org, materialId: 'p3-material', locationId: 'p3-other-warehouse-loc' } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('stores exact Decimal quantities and rejects negative balance', async () => {
    const location = await db.warehouseLocation.create({ data: { organizationId: org, warehouseId: 'p3-warehouse', code: uid(), nameTh: 'precision test' } });
    const balance = await db.inventoryBalance.create({ data: { organizationId: org, materialId: 'p3-material', locationId: location.id, quantity: '0.300001', carryingValue: '1234567890123.123456' } });
    expect(balance.quantity.toFixed(6)).toBe('0.300001');
    expect(balance.carryingValue.toFixed(6)).toBe('1234567890123.123456');
    await expect(db.inventoryBalance.update({ where: { id: balance.id }, data: { quantity: '-0.000001' } })).rejects.toThrow();
    expect((await db.inventoryBalance.findUniqueOrThrow({ where: { id: balance.id } })).quantity.toFixed(6)).toBe('0.300001');
  });

  it('uses version conditions to prevent two concurrent writers from winning', async () => {
    const location = await db.warehouseLocation.create({ data: { organizationId: org, warehouseId: 'p3-warehouse', code: uid(), nameTh: 'version test' } });
    const balance = await db.inventoryBalance.create({ data: { organizationId: org, materialId: 'p3-material', locationId: location.id, quantity: 1, carryingValue: 10 } });
    const writes = await Promise.all([1, 2].map(() => db.inventoryBalance.updateMany({ where: { id: balance.id, version: 0 }, data: { version: { increment: 1 } } })));
    expect(writes.reduce((sum, write) => sum + write.count, 0)).toBe(1);
  });

  it('enforces requisition creator != approver and approved status needs approval evidence', async () => {
    const base = { organizationId: org, refNo: uid(), siteId: 'p3-legacy-site', requestedDate: date, requestedById: actor };
    await expect(db.materialRequisition.create({ data: { ...base, finalApprovedById: actor, finalApprovedAt: date, status: 'APPROVED' } })).rejects.toThrow();
    await expect(db.materialRequisition.create({ data: { ...base, status: 'APPROVED' } })).rejects.toThrow();
    const approved = await db.materialRequisition.create({ data: { ...base, finalApprovedById: 'p3-approver', finalApprovedAt: date, status: 'APPROVED' } });
    expect(approved.status).toBe('APPROVED');
  });

  it('rejects over-issue and receiving more than issued', async () => {
    const req = await db.materialRequisition.create({ data: { organizationId: org, refNo: uid(), siteId: 'p3-legacy-site', requestedDate: date, requestedById: actor } });
    const line = { organizationId: org, requisitionId: req.id, lineNo: 1, materialId: 'p3-material', unitId: 'p3-uom', requestedQty: '5', approvedQty: '4' };
    await expect(db.materialRequisitionLine.create({ data: { ...line, issuedQty: '5' } })).rejects.toThrow();
    await expect(db.materialRequisitionLine.create({ data: { ...line, issuedQty: '2', receivedQty: '3' } })).rejects.toThrow();
  });

  it('enforces adjustment SoD and rejects location from another warehouse', async () => {
    const base = { organizationId: org, warehouseId: 'p3-warehouse', refNo: uid(), reason: 'synthetic count', createdById: actor };
    await expect(db.stockAdjustment.create({ data: { ...base, approvedById: actor, approvedAt: date, status: 'APPROVED' } })).rejects.toThrow();
    const adjustment = await db.stockAdjustment.create({ data: base });
    await expect(db.stockAdjustmentLine.create({ data: { organizationId: org, adjustmentId: adjustment.id, warehouseId: 'p3-warehouse', lineNo: 1, materialId: 'p3-material', locationId: 'p3-destination-loc', countedQty: 1, expectedQtySnapshot: 0, expectedBalanceVersion: 0, quantityDelta: 1, valueDelta: 10 } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('enforces transfer warehouse boundaries and distinct source/destination', async () => {
    const base = { organizationId: org, refNo: uid(), fromWarehouseId: 'p3-warehouse', toWarehouseId: 'p3-destination', reason: 'synthetic transfer', createdById: actor };
    await expect(db.stockTransfer.create({ data: { ...base, toWarehouseId: 'p3-warehouse' } })).rejects.toThrow();
    const transfer = await db.stockTransfer.create({ data: base });
    await expect(db.stockTransferLine.create({ data: { organizationId: org, transferId: transfer.id, fromWarehouseId: 'p3-warehouse', toWarehouseId: 'p3-destination', fromLocationId: 'p3-destination-loc', toLocationId: 'p3-warehouse-loc', lineNo: 1, materialId: 'p3-material', quantity: 1 } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('binds receipt lines to a scoped receipt and preserves required PO relation', async () => {
    const po = await db.pOItem.create({ data: { poId: 'p3-legacy-po', description: 'synthetic', quantity: 1, unit: 'PCS', unitPrice: '10', totalPrice: '10' } });
    const receipt = await db.goodsReceipt.create({ data: { poId: 'p3-legacy-po', refNo: uid(), organizationId: org } });
    const line = await db.goodsReceiptLine.create({ data: { organizationId: org, receiptId: receipt.id, lineNo: 1, poLineId: po.id, materialId: 'p3-material', locationId: 'p3-warehouse-loc', acceptedQty: '1', unitCostSnapshot: '10.123456' } });
    expect(line.unitCostSnapshot.toFixed(6)).toBe('10.123456');
    await expect(db.goodsReceiptLine.create({ data: { organizationId: otherOrg, receiptId: receipt.id, lineNo: 2, poLineId: po.id, materialId: 'p3-other-material', locationId: 'p3-other-warehouse-loc', acceptedQty: 1, unitCostSnapshot: 10 } })).rejects.toMatchObject({ code: 'P2003' });
  });

  it('rejects invalid movement signs, missing typed sources and foreign-organization operations', async () => {
    const location = await db.warehouseLocation.create({ data: { organizationId: org, warehouseId: 'p3-warehouse', code: uid(), nameTh: 'receipt movement test' } });
    const po = await db.pOItem.create({ data: { poId: 'p3-legacy-po', description: 'synthetic', quantity: 1, unit: 'PCS', unitPrice: 10, totalPrice: 10 } });
    const receipt = await db.goodsReceipt.create({ data: { poId: 'p3-legacy-po', refNo: uid(), organizationId: org } });
    const line = await db.goodsReceiptLine.create({ data: { organizationId: org, receiptId: receipt.id, lineNo: 1, poLineId: po.id, materialId: 'p3-material', locationId: location.id, acceptedQty: 1, unitCostSnapshot: 10 } });
    const op = { requestKey: uid(), requestHash: 'b'.repeat(64), sourceType: 'GoodsReceipt', sourceId: receipt.id, actorId: actor, reason: 'synthetic receipt' };
    const operation = await db.inventoryOperation.create({ data: { ...op, organizationId: org } });
    const foreign = await db.inventoryOperation.create({ data: { ...op, organizationId: otherOrg, requestKey: uid() } });
    const movement = { organizationId: org, operationId: operation.id, lineKey: '1', materialId: 'p3-material', locationId: location.id, type: 'PURCHASE_RECEIPT' as const, quantityDelta: 1, valueDelta: 10, unitCostSnapshot: 10, balanceAfter: 1, valueAfter: 10, balanceVersion: 1, receiptLineId: line.id };
    await expect(db.inventoryMovement.create({ data: { ...movement, quantityDelta: -1 } })).rejects.toThrow();
    await expect(db.inventoryMovement.create({ data: { ...movement, receiptLineId: null } })).rejects.toThrow();
    await expect(db.inventoryMovement.create({ data: { ...movement, operationId: foreign.id } })).rejects.toMatchObject({ code: 'P2003' });
    const created = await db.inventoryMovement.create({ data: movement });
    expect(created.quantityDelta.toFixed(6)).toBe('1.000000');
  });

  it('retains separate SKU variants mapped to one legacy item', async () => {
    await db.materialLegacyMapping.create({ data: { materialId: 'p3-material', legacyItemId: 'p3-legacy-item', variantKey: 'BLUE-18', reason: 'reviewed synthetic mapping' } });
    await expect(db.materialLegacyMapping.create({ data: { materialId: 'p3-material', legacyItemId: 'p3-legacy-item', variantKey: 'BLUE-18', reason: 'duplicate' } })).rejects.toMatchObject({ code: 'P2002' });
    await db.materialLegacyMapping.create({ data: { materialId: 'p3-material', legacyItemId: 'p3-legacy-item', variantKey: 'WHITE-24', reason: 'another variant' } });
    expect(await db.materialLegacyMapping.count({ where: { legacyItemId: 'p3-legacy-item' } })).toBe(2);
  });

  it('stores effective dated prices and rejects negative or inverted price periods', async () => {
    const base = { materialId: 'p3-material', unitPrice: '10.123456', taxRate: '0.07', effectiveFrom: date };
    const price = await db.materialPriceHistory.create({ data: base });
    expect(price.unitPrice.toFixed(6)).toBe('10.123456');
    await expect(db.materialPriceHistory.create({ data: { ...base, unitPrice: '-1' } })).rejects.toThrow();
    await expect(db.materialPriceHistory.create({ data: { ...base, effectiveTo: new Date('2026-11-20T00:00:00Z') } })).rejects.toThrow();
  });

  it('atomically rolls back operation and movement, prevents duplicates, and makes ledger append-only', async () => {
    const adjustment = await db.stockAdjustment.create({ data: { organizationId: org, warehouseId: 'p3-warehouse', refNo: uid(), reason: 'synthetic opening', isOpening: true, createdById: actor, approvedById: 'p3-approver', approvedAt: date, status: 'APPROVED' } });
    const line = await db.stockAdjustmentLine.create({ data: { organizationId: org, adjustmentId: adjustment.id, warehouseId: 'p3-warehouse', lineNo: 1, materialId: 'p3-material', locationId: 'p3-warehouse-loc', countedQty: 2, expectedQtySnapshot: 0, expectedBalanceVersion: 0, quantityDelta: 2, valueDelta: 20 } });
    const operationData = { organizationId: org, requestKey: uid(), requestHash: 'a'.repeat(64), sourceType: 'StockAdjustment', sourceId: adjustment.id, actorId: actor, reason: 'synthetic opening' };
    const operationId = uid();
    await expect(db.$transaction(async tx => {
      await tx.inventoryOperation.create({ data: { ...operationData, id: operationId } });
      await tx.inventoryMovement.create({ data: { organizationId: org, operationId, lineKey: '1', materialId: 'p3-material', locationId: 'p3-warehouse-loc', type: 'ADJUSTMENT', quantityDelta: 2, valueDelta: 20, unitCostSnapshot: 10, balanceAfter: 2, valueAfter: 20, balanceVersion: 1, adjustmentLineId: line.id } });
      throw new Error('Simulated write failure');
    })).rejects.toThrow('Simulated write failure');
    expect(await db.inventoryOperation.findUnique({ where: { id: operationId } })).toBeNull();
    expect(await db.inventoryMovement.count({ where: { operationId } })).toBe(0);
    const operation = await db.inventoryOperation.create({ data: operationData });
    await expect(db.inventoryOperation.create({ data: operationData })).rejects.toMatchObject({ code: 'P2002' });
    const movementData = { organizationId: org, operationId: operation.id, lineKey: '1', materialId: 'p3-material', locationId: 'p3-warehouse-loc', type: 'ADJUSTMENT' as const, quantityDelta: new Prisma.Decimal(2), valueDelta: new Prisma.Decimal(20), unitCostSnapshot: 10, balanceAfter: 2, valueAfter: 20, balanceVersion: 1, adjustmentLineId: line.id };
    const movement = await db.inventoryMovement.create({ data: movementData });
    await expect(db.inventoryMovement.create({ data: movementData })).rejects.toMatchObject({ code: 'P2002' });
    await expect(db.inventoryMovement.update({ where: { id: movement.id }, data: { quantityDelta: 3 } })).rejects.toThrow();
    await expect(db.inventoryMovement.delete({ where: { id: movement.id } })).rejects.toThrow();
    await expect(db.inventoryOperation.update({ where: { id: operation.id }, data: { reason: 'tampered' } })).rejects.toThrow();
    await expect(db.inventoryOperation.delete({ where: { id: operation.id } })).rejects.toThrow();
    expect((await db.inventoryMovement.findUniqueOrThrow({ where: { id: movement.id } })).quantityDelta.toFixed(6)).toBe('2.000000');
    // Referenced masters cannot be deleted out from under historical records.
    await expect(db.material.delete({ where: { id: 'p3-material' } })).rejects.toMatchObject({ code: 'P2003' });
  });
});
