import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { InventoryContext, InventoryPostingService } from '../../src/server/services/inventory-posting.service';

const testUrl = process.env.P3_TEST_DATABASE_URL;
if (testUrl) {
  const url = new URL(testUrl);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !/^\/smartop_p3_test_[a-z0-9_]+$/.test(url.pathname)) throw new Error('Non-isolated database rejected.');
}
const db = testUrl ? new PrismaClient({ datasources: { db: { url: testUrl } } }) : null!;
const svc = new InventoryPostingService(db);
const codes = ['inventory.receive', 'inventory.issue', 'inventory.adjust', 'inventory.transfer', 'inventory.return'];
const uid = () => randomUUID();
let unitId: string;

async function fixture() {
  const org = await db.organization.create({ data: { code: uid(), name: 'Synthetic service test' } });
  const user = await db.user.create({ data: { email: `${uid()}@example.invalid`, role: 'ADMIN' } });
  const approver = await db.user.create({ data: { email: `${uid()}@example.invalid` } });
  const session = await db.userSession.create({ data: { sessionId: uid(), userId: user.id, expiresAt: new Date(Date.now() + 3600000) } });
  const role = await db.role.create({ data: { code: uid(), nameTh: 'ผู้ทดสอบ', nameEn: 'Synthetic role', permissions: { create: codes.map(code => ({ permission: { connect: { code } } })) } } });
  const grant = await db.userRoleAssignment.create({ data: { userId: user.id, roleId: role.id, scopeType: 'ORGANIZATION', scopeId: org.id } });
  const sites = await Promise.all([1, 2].map(() => db.site.create({ data: { code: uid(), name: 'Synthetic site' } })));
  const category = await db.materialCategory.create({ data: { organizationId: org.id, code: 'TOOLS', nameTh: 'ทดสอบ' } });
  const mat = await db.material.create({ data: { organizationId: org.id, code: uid(), nameTh: 'วัสดุทดสอบ', categoryId: category.id, baseUnitId: unitId } });
  const locations = [];
  for (const site of sites) {
    const warehouse = await db.warehouse.create({ data: { organizationId: org.id, code: uid(), nameTh: 'คลังทดสอบ', siteId: site.id } });
    const loc = await db.warehouseLocation.create({ data: { organizationId: org.id, warehouseId: warehouse.id, code: 'A1', nameTh: 'ชั้นทดสอบ' } });
    locations.push(loc);
  }
  const supplier = await db.supplier.create({ data: { code: uid(), name: 'Synthetic supplier' } });
  const ctx: InventoryContext = { userId: user.id, sessionId: session.sessionId, authzVersion: 1, organizationId: org.id };
  return { org, user, approver, session, role, grant, sites, mat, locations, supplier, ctx };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;

async function receipt(f: Fixture, qty: string, cost: string, locationId = f.locations[0].id) {
  const po = await db.purchaseOrder.create({ data: { refNo: uid(), supplierId: f.supplier.id, totalAmount: '0', status: 'APPROVED', approvedById: f.approver.id, approvedAt: new Date() } });
  const poLine = await db.pOItem.create({ data: { poId: po.id, description: 'Synthetic order', quantity: Number(qty), unit: 'PCS', unitPrice: cost, totalPrice: '0' } });
  const doc = await db.goodsReceipt.create({ data: { poId: po.id, refNo: uid(), organizationId: f.org.id, inventoryStatus: 'APPROVED', materialLines: { create: { lineNo: 1, poLineId: poLine.id, materialId: f.mat.id, locationId, acceptedQty: qty, unitCostSnapshot: cost } } } });
  return { doc, po, poLine };
}
async function stock(f: Fixture, qty: string, cost: string, locationId = f.locations[0].id) {
  const source = await receipt(f, qty, cost, locationId);
  return svc.postReceipt(f.ctx, source.doc.id, uid());
}
async function requisition(f: Fixture, qty: string) {
  return db.materialRequisition.create({ data: { organizationId: f.org.id, refNo: uid(), siteId: f.sites[0].id, requestedDate: new Date(), status: 'APPROVED', requestedById: f.user.id, finalApprovedById: f.approver.id, finalApprovedAt: new Date(), lines: { create: { lineNo: 1, materialId: f.mat.id, unitId, requestedQty: qty, approvedQty: qty } } }, include: { lines: true } });
}
async function current(f: Fixture, locationId = f.locations[0].id) {
  return db.inventoryBalance.findUniqueOrThrow({ where: { materialId_locationId: { materialId: f.mat.id, locationId } } });
}
async function adjustmentDoc(f: Fixture, counted: string, expected: string, version: number, valueDelta: string, isOpening = false) {
  return db.stockAdjustment.create({ data: { organizationId: f.org.id, warehouseId: f.locations[0].warehouseId, refNo: uid(), reason: 'Synthetic approved count', isOpening, createdById: f.user.id, approvedById: f.approver.id, approvedAt: new Date(), status: 'APPROVED', lines: { create: { lineNo: 1, materialId: f.mat.id, locationId: f.locations[0].id, countedQty: counted, expectedQtySnapshot: expected, expectedBalanceVersion: version, quantityDelta: new Prisma.Decimal(counted).minus(expected), valueDelta } } } });
}

describe.skipIf(!testUrl)('Inventory posting services on isolated database', () => {
  beforeAll(async () => {
    for (const code of codes) await db.permission.upsert({ where: { code }, create: { code, module: 'Inventory', action: 'POST' }, update: {} });
    unitId = (await db.unitOfMeasure.create({ data: { code: uid(), nameTh: 'หน่วยทดสอบ', decimalPlaces: 6 } })).id;
  });
  afterAll(async () => { await db?.$disconnect(); });

  it('posts differently priced receipts and issues at weighted average, with atomic audit/outbox', async () => {
    const f = await fixture();
    await stock(f, '10', '10'); await stock(f, '5', '16');
    const req = await requisition(f, '4');
    const posted = await svc.issueRequisition(f.ctx, req.id, uid(), [{ lineId: req.lines[0].id, locationId: f.locations[0].id, quantity: '4' }]);
    expect(posted.movements[0].valueDelta).toBe('-48.000000');
    const bal = await current(f);
    expect(bal.quantity.toFixed(6)).toBe('11.000000');
    expect(bal.carryingValue.toFixed(6)).toBe('132.000000');
    const ledger = await db.inventoryMovement.aggregate({ where: { organizationId: f.org.id }, _sum: { quantityDelta: true, valueDelta: true } });
    expect(ledger._sum.quantityDelta?.eq(bal.quantity)).toBe(true);
    expect(ledger._sum.valueDelta?.eq(bal.carryingValue)).toBe(true);
    expect(await db.auditLog.count({ where: { entityId: posted.operationId, action: 'INVENTORY_POSTED' } })).toBe(1);
    const event = await db.eventOutbox.findUniqueOrThrow({ where: { eventId: posted.operationId } });
    expect(event.payload).not.toContain(f.ctx.sessionId);
    expect((await db.materialRequisition.findUniqueOrThrow({ where: { id: req.id } })).status).toBe('ISSUED');
  });

  it('serializes concurrent issues so only available stock can be issued', async () => {
    const f = await fixture(); await stock(f, '10', '10');
    const a = await requisition(f, '7'), b = await requisition(f, '7');
    const outcomes = await Promise.allSettled([a, b].map(req => svc.issueRequisition(f.ctx, req.id, uid(), [{ lineId: req.lines[0].id, locationId: f.locations[0].id, quantity: '7' }])));
    expect(outcomes.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = outcomes.find(r => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason.code).toBe('INSUFFICIENT_STOCK');
    expect((await current(f)).quantity.toFixed(6)).toBe('3.000000');
    expect(await db.inventoryOperation.count({ where: { organizationId: f.org.id } })).toBe(2);
  });

  it('replays concurrent identical requests once and rejects changed payloads', async () => {
    const f = await fixture(); await stock(f, '10', '10'); const req = await requisition(f, '5'); const key = uid();
    const input = [{ lineId: req.lines[0].id, locationId: f.locations[0].id, quantity: '3' }];
    const result = await Promise.all([1, 2, 3].map(() => svc.issueRequisition(f.ctx, req.id, key, input)));
    expect(new Set(result.map(r => r.operationId)).size).toBe(1);
    expect((await current(f)).quantity.toFixed(6)).toBe('7.000000');
    await expect(svc.issueRequisition(f.ctx, req.id, key, [{ ...input[0], quantity: '2' }])).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    expect(await db.auditLog.count({ where: { entityId: result[0].operationId } })).toBe(1);
  });

  it('does not allow legacy ADMIN role without a normalized permission grant', async () => {
    const f = await fixture(); const source = await receipt(f, '1', '10');
    await db.userRoleAssignment.delete({ where: { id: f.grant.id } });
    await expect(svc.postReceipt(f.ctx, source.doc.id, uid())).rejects.toMatchObject({ code: 'INVENTORY_FORBIDDEN' });
    expect(await db.inventoryOperation.count({ where: { organizationId: f.org.id } })).toBe(0);
  });

  it('does not combine permission from another organization with an unrelated site role', async () => {
    const f = await fixture(); const source = await receipt(f, '1', '10');
    await db.userRoleAssignment.update({ where: { id: f.grant.id }, data: { scopeId: 'another-organization' } });
    const emptyRole = await db.role.create({ data: { code: uid(), nameTh: 'ไม่มีสิทธิ์รับ', nameEn: 'No receive permission' } });
    await db.userRoleAssignment.create({ data: { userId: f.user.id, roleId: emptyRole.id, scopeType: 'SITE', scopeId: f.sites[0].id } });
    await expect(svc.postReceipt(f.ctx, source.doc.id, uid())).rejects.toMatchObject({ code: 'INVENTORY_FORBIDDEN' });
  });

  it('requires a matching site grant for both the requisition and issuing warehouse', async () => {
    const f = await fixture(); await stock(f, '5', '10', f.locations[1].id); const req = await requisition(f, '1');
    await db.userRoleAssignment.update({ where: { id: f.grant.id }, data: { scopeType: 'SITE', scopeId: f.sites[0].id } });
    await expect(svc.issueRequisition(f.ctx, req.id, uid(), [{ lineId: req.lines[0].id, locationId: f.locations[1].id, quantity: '1' }])).rejects.toMatchObject({ code: 'INVENTORY_FORBIDDEN' });
    expect((await current(f, f.locations[1].id)).quantity.toFixed(6)).toBe('5.000000');
  });

  it('rejects revoked sessions including retries of an already committed operation', async () => {
    const f = await fixture(); const source = await receipt(f, '1', '10'); const key = uid();
    await svc.postReceipt(f.ctx, source.doc.id, key);
    await db.userSession.update({ where: { id: f.session.id }, data: { status: 'REVOKED' } });
    await expect(svc.postReceipt(f.ctx, source.doc.id, key)).rejects.toMatchObject({ code: 'SESSION_INVALID' });
    expect((await current(f)).quantity.toFixed(6)).toBe('1.000000');
  });

  it('rejects inactive/expired grants and authorization version changes', async () => {
    const f = await fixture(); const source = await receipt(f, '1', '10');
    await db.userRoleAssignment.update({ where: { id: f.grant.id }, data: { endAt: new Date(Date.now() - 1000) } });
    await expect(svc.postReceipt(f.ctx, source.doc.id, uid())).rejects.toMatchObject({ code: 'INVENTORY_FORBIDDEN' });
    await db.userRoleAssignment.update({ where: { id: f.grant.id }, data: { endAt: null, startAt: new Date(Date.now() + 3600000) } });
    await expect(svc.postReceipt(f.ctx, source.doc.id, uid())).rejects.toMatchObject({ code: 'INVENTORY_FORBIDDEN' });
    await db.userRoleAssignment.update({ where: { id: f.grant.id }, data: { startAt: null } });
    await db.role.update({ where: { id: f.role.id }, data: { isActive: false } });
    await expect(svc.postReceipt(f.ctx, source.doc.id, uid())).rejects.toMatchObject({ code: 'INVENTORY_FORBIDDEN' });
    await db.user.update({ where: { id: f.user.id }, data: { authzVersion: 2 } });
    await expect(svc.postReceipt(f.ctx, source.doc.id, uid())).rejects.toMatchObject({ code: 'SESSION_INVALID' });
  });

  it.each([
    { label: 'inactive user', data: { isActive: false } },
    { label: 'locked user', data: { isLocked: true } },
    { label: 'password change required', data: { mustChangePassword: true } },
    { label: 'password expired', data: { passwordExpiresAt: new Date('2020-01-01') } },
    { label: 'MFA strength missing', data: { mfaEnabled: true } },
  ])('rejects $label even when the session token is still active', async ({ data }) => {
    const f = await fixture(); const source = await receipt(f, '1', '10');
    await db.user.update({ where: { id: f.user.id }, data });
    await expect(svc.postReceipt(f.ctx, source.doc.id, uid())).rejects.toMatchObject({ code: 'SESSION_INVALID' });
  });

  it.each(['AuditLog', 'EventOutbox'])('rolls back all writes when %s insertion fails', async store => {
    const f = await fixture(); const source = await receipt(f, '2', '10');
    // Inject one adapter failure while retaining the real DB transaction and preceding SQL writes.
    const failingDb = db.$extends({ query: { $allModels: { async $allOperations({ model, operation, args, query }) {
      if (model === store && operation === 'create') throw new Error(`Synthetic ${store} failure`);
      return query(args);
    } } } });
    const failing = new InventoryPostingService(failingDb as unknown as PrismaClient);
    await expect(failing.postReceipt(f.ctx, source.doc.id, uid())).rejects.toThrow(`Synthetic ${store} failure`);
    expect(await db.inventoryBalance.count({ where: { organizationId: f.org.id } })).toBe(0);
    expect(await db.inventoryMovement.count({ where: { organizationId: f.org.id } })).toBe(0);
    expect(await db.inventoryOperation.count({ where: { organizationId: f.org.id } })).toBe(0);
    expect(await db.auditLog.count({ where: { userId: f.user.id } })).toBe(0);
    expect((await db.goodsReceipt.findUniqueOrThrow({ where: { id: source.doc.id } })).inventoryStatus).toBe('APPROVED');
  });

  it('persists safe audit/outbox metadata for long source identifiers without truncation', async () => {
    const f = await fixture(); const source = await receipt(f, '1', '10');
    const longId = 'source-'.repeat(25);
    await db.goodsReceipt.update({ where: { id: source.doc.id }, data: { id: longId } });
    const posted = await svc.postReceipt(f.ctx, longId, uid());
    const audit = await db.auditLog.findFirstOrThrow({ where: { entityId: posted.operationId } });
    const event = await db.eventOutbox.findUniqueOrThrow({ where: { eventId: posted.operationId } });
    expect(audit.metadata!.length).toBeGreaterThan(191);
    expect(JSON.parse(audit.metadata!).sourceId).toBe(longId);
    expect(JSON.parse(event.payload).sourceId).toBe(longId);
  });

  it('rejects over-issue and rolls back earlier lines of a multi-line issue', async () => {
    const f = await fixture(); await stock(f, '5', '10'); const req = await requisition(f, '2');
    const second = await db.materialRequisitionLine.create({ data: { organizationId: f.org.id, requisitionId: req.id, lineNo: 2, materialId: f.mat.id, unitId, requestedQty: 4, approvedQty: 4 } });
    await expect(svc.issueRequisition(f.ctx, req.id, uid(), [{ lineId: req.lines[0].id, locationId: f.locations[0].id, quantity: '3' }])).rejects.toMatchObject({ code: 'ISSUE_EXCEEDS_APPROVED' });
    await expect(svc.issueRequisition(f.ctx, req.id, uid(), [
      { lineId: req.lines[0].id, locationId: f.locations[0].id, quantity: '2' },
      { lineId: second.id, locationId: f.locations[1].id, quantity: '4' },
    ])).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    expect((await current(f)).quantity.toFixed(6)).toBe('5.000000');
    expect((await db.materialRequisitionLine.findUniqueOrThrow({ where: { id: req.lines[0].id } })).issuedQty.isZero()).toBe(true);
  });

  it('converts approved whole boxes into base units and tracks partial then full issuance', async () => {
    const f = await fixture(); await stock(f, '12', '10');
    const box = await db.unitOfMeasure.create({ data: { code: uid(), nameTh: 'กล่องทดสอบ', decimalPlaces: 0 } });
    await db.materialUnitConversion.create({ data: { materialId: f.mat.id, fromUnitId: box.id, toUnitId: unitId, factor: 6, effectiveFrom: new Date('2020-01-01') } });
    const req = await requisition(f, '2');
    await db.materialRequisitionLine.update({ where: { id: req.lines[0].id }, data: { unitId: box.id, conversionFactor: 6 } });
    const input = { lineId: req.lines[0].id, locationId: f.locations[0].id, quantity: '1' };
    await expect(svc.issueRequisition(f.ctx, req.id, uid(), [{ ...input, quantity: '0.5' }])).rejects.toMatchObject({ code: 'INVALID_UNIT_PRECISION' });
    const first = await svc.issueRequisition(f.ctx, req.id, uid(), [input]);
    expect(first.movements[0].quantityDelta).toBe('-6.000000');
    expect((await db.materialRequisition.findUniqueOrThrow({ where: { id: req.id } })).status).toBe('PARTIALLY_ISSUED');
    await svc.issueRequisition(f.ctx, req.id, uid(), [input]);
    expect((await current(f)).quantity.isZero()).toBe(true);
    expect((await current(f)).carryingValue.isZero()).toBe(true);
    expect((await db.materialRequisition.findUniqueOrThrow({ where: { id: req.id } })).status).toBe('ISSUED');
  });

  it('rejects wrong PO ownership and cumulative receipts exceeding ordered quantity', async () => {
    const f = await fixture(); const a = await receipt(f, '5', '10'); const b = await receipt(f, '2', '10');
    await db.goodsReceiptLine.updateMany({ where: { receiptId: b.doc.id }, data: { poLineId: a.poLine.id } });
    await expect(svc.postReceipt(f.ctx, b.doc.id, uid())).rejects.toMatchObject({ code: 'INVALID_RECEIPT_PO_LINE' });
    await svc.postReceipt(f.ctx, a.doc.id, uid());
    const extra = await db.goodsReceipt.create({ data: { poId: a.po.id, refNo: uid(), organizationId: f.org.id, inventoryStatus: 'APPROVED', materialLines: { create: { lineNo: 1, poLineId: a.poLine.id, materialId: f.mat.id, locationId: f.locations[0].id, acceptedQty: 1, unitCostSnapshot: 10 } } } });
    await expect(svc.postReceipt(f.ctx, extra.id, uid())).rejects.toMatchObject({ code: 'RECEIPT_EXCEEDS_ORDER' });
    expect((await current(f)).quantity.toFixed(6)).toBe('5.000000');
  });

  it('fails closed on a balance edited outside the posting ledger', async () => {
    const f = await fixture(); await stock(f, '5', '10');
    const old = await current(f);
    await db.inventoryBalance.update({ where: { id: old.id }, data: { quantity: 6 } });
    const source = await receipt(f, '1', '10');
    await expect(svc.postReceipt(f.ctx, source.doc.id, uid())).rejects.toMatchObject({ code: 'BALANCE_RECONCILIATION_REQUIRED' });
    expect(await db.inventoryOperation.count({ where: { organizationId: f.org.id } })).toBe(1);
  });

  it('serializes receipts for a legacy PO across organizations and refuses conflicting ownership', async () => {
    const f = await fixture(), g = await fixture(); const source = await receipt(f, '3', '10');
    const foreign = await db.goodsReceipt.create({ data: { poId: source.po.id, refNo: uid(), organizationId: g.org.id, inventoryStatus: 'APPROVED', materialLines: { create: { lineNo: 1, poLineId: source.poLine.id, materialId: g.mat.id, locationId: g.locations[0].id, acceptedQty: 3, unitCostSnapshot: 10 } } } });
    const outcomes = await Promise.allSettled([svc.postReceipt(f.ctx, source.doc.id, uid()), svc.postReceipt(g.ctx, foreign.id, uid())]);
    expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect((outcomes.find(result => result.status === 'rejected') as PromiseRejectedResult).reason.code).toBe('PO_ORGANIZATION_CONFLICT');
  });

  it('transfers quantity and value atomically and cannot post the same document twice', async () => {
    const f = await fixture(); await stock(f, '10', '10'); await stock(f, '2', '20', f.locations[1].id);
    const doc = await db.stockTransfer.create({ data: { organizationId: f.org.id, refNo: uid(), fromWarehouseId: f.locations[0].warehouseId, toWarehouseId: f.locations[1].warehouseId, createdById: f.user.id, approvedById: f.approver.id, approvedAt: new Date(), status: 'APPROVED', reason: 'Synthetic transfer', lines: { create: { lineNo: 1, materialId: f.mat.id, fromLocationId: f.locations[0].id, toLocationId: f.locations[1].id, quantity: 4 } } } });
    const key = uid(); const result = await svc.postTransfer(f.ctx, doc.id, key);
    expect(result.movements).toHaveLength(2);
    expect(result.movements.reduce((sum, row) => sum.plus(row.valueDelta), new Prisma.Decimal(0)).isZero()).toBe(true);
    expect((await current(f)).carryingValue.toFixed(6)).toBe('60.000000');
    expect((await current(f, f.locations[1].id)).carryingValue.toFixed(6)).toBe('80.000000');
    expect((await svc.postTransfer(f.ctx, doc.id, key)).operationId).toBe(result.operationId);
    await expect(svc.postTransfer(f.ctx, doc.id, uid())).rejects.toMatchObject({ code: 'TRANSFER_NOT_APPROVED' });
  });

  it('returns original issue value after average cost changes and prevents over-return', async () => {
    const f = await fixture(); await stock(f, '5', '10'); const req = await requisition(f, '3');
    const issued = await svc.issueRequisition(f.ctx, req.id, uid(), [{ lineId: req.lines[0].id, locationId: f.locations[0].id, quantity: '3' }]);
    await stock(f, '5', '20');
    const returned = await svc.returnIssue(f.ctx, issued.movements[0].id, f.locations[0].id, '2', uid());
    expect(returned.movements[0].valueDelta).toBe('20.000000');
    expect((await current(f)).carryingValue.toFixed(6)).toBe('140.000000');
    await expect(svc.returnIssue(f.ctx, issued.movements[0].id, f.locations[0].id, '2', uid())).rejects.toMatchObject({ code: 'RETURN_EXCEEDS_ISSUED' });
  });

  it('posts approved counts, rejects stale counts, and permits opening stock only once', async () => {
    const f = await fixture(); const opening = await adjustmentDoc(f, '10', '0', 0, '100', true);
    await svc.postAdjustment(f.ctx, opening.id, uid());
    const stale = await adjustmentDoc(f, '8', '10', 0, '-20');
    await expect(svc.postAdjustment(f.ctx, stale.id, uid())).rejects.toMatchObject({ code: 'STALE_STOCK_COUNT' });
    const valid = await adjustmentDoc(f, '8', '10', 1, '-20');
    await svc.postAdjustment(f.ctx, valid.id, uid());
    expect((await current(f)).quantity.toFixed(6)).toBe('8.000000');
    expect((await current(f)).carryingValue.toFixed(6)).toBe('80.000000');
    const duplicate = await adjustmentDoc(f, '10', '8', 2, '20', true);
    await expect(svc.postAdjustment(f.ctx, duplicate.id, uid())).rejects.toMatchObject({ code: 'OPENING_STOCK_ALREADY_EXISTS' });
  });
});
