import { Prisma } from '@prisma/client';

// Local arithmetic context: do not change Decimal precision for other modules.
const Decimal = Prisma.Decimal.clone({ precision: 48, rounding: Prisma.Decimal.ROUND_HALF_UP });
export type Value = Prisma.Decimal | string;
const dec = (value: Value) => new Decimal(value.toString());
const fixed = (value: Prisma.Decimal) => new Prisma.Decimal(value.toFixed(6));

export class InventoryError extends Error {
  constructor(public readonly code: string) { super(code); }
}
export function assertInventory(condition: unknown, code: string): asserts condition {
  if (!condition) throw new InventoryError(code);
}

export function quantityInput(value: string, allowZero = false): Prisma.Decimal {
  assertInventory(typeof value === 'string' && /^(0|[1-9]\d{0,11})(\.\d{1,6})?$/.test(value), 'INVALID_DECIMAL');
  const result = new Prisma.Decimal(value);
  assertInventory(allowZero ? result.gte(0) : result.gt(0), 'INVALID_QUANTITY');
  return result;
}

function checked(quantity: Prisma.Decimal, value: Prisma.Decimal) {
  assertInventory(quantity.gte(0) && quantity.lt('1000000000000'), 'QUANTITY_OUT_OF_RANGE');
  assertInventory(value.gte(0) && value.lt('1000000000000000000'), 'VALUE_OUT_OF_RANGE');
  assertInventory(!quantity.isZero() || value.isZero(), 'ZERO_STOCK_WITH_VALUE');
  return { quantity: fixed(quantity), value: fixed(value) };
}

export function receiptValue(quantity: Value, unitCost: Value): Prisma.Decimal {
  const q = dec(quantity), cost = dec(unitCost);
  assertInventory(q.gt(0) && cost.gte(0), 'INVALID_RECEIPT_VALUE');
  return checked(q, dec(fixed(q.mul(cost)))).value;
}

export function receive(oldQuantity: Value, oldValue: Value, quantity: Value, value: Value) {
  const old = checked(dec(oldQuantity), dec(oldValue));
  const q = dec(quantity), v = dec(value);
  assertInventory(q.gt(0) && v.gte(0), 'INVALID_RECEIPT_VALUE');
  return checked(dec(old.quantity).plus(q), dec(old.value).plus(v));
}

export function issue(oldQuantity: Value, oldValue: Value, quantity: Value) {
  const old = checked(dec(oldQuantity), dec(oldValue));
  const q = dec(quantity);
  assertInventory(q.gt(0) && q.lte(old.quantity), 'INSUFFICIENT_STOCK');
  // The last issue drains the exact residual value instead of leaving rounding dust.
  const outgoingValue = q.eq(old.quantity) ? old.value : fixed(dec(old.value).mul(q).div(old.quantity));
  const next = checked(dec(old.quantity).minus(q), dec(old.value).minus(outgoingValue));
  return { ...next, outgoingValue, unitCost: fixed(dec(old.value).div(old.quantity)) };
}

export function returnValue(originalQuantity: Value, originalValue: Value, returnedQuantity: Value, returnedValue: Value, quantity: Value) {
  const totalQ = dec(originalQuantity), totalV = dec(originalValue);
  const priorQ = dec(returnedQuantity), priorV = dec(returnedValue), q = dec(quantity);
  assertInventory(totalQ.gt(0) && totalV.gte(0) && priorQ.gte(0) && priorV.gte(0) && priorV.lte(totalV), 'INVALID_RETURN');
  assertInventory(q.gt(0) && priorQ.plus(q).lte(totalQ), 'RETURN_EXCEEDS_ISSUED');
  const value = priorQ.plus(q).eq(totalQ) ? fixed(totalV.minus(priorV)) : fixed(totalV.mul(q).div(totalQ));
  assertInventory(value.lte(totalV.minus(priorV)), 'INVALID_RETURN');
  return value;
}

export function adjustment(oldQuantity: Value, oldValue: Value, quantityDelta: Value, valueDelta: Value) {
  const old = checked(dec(oldQuantity), dec(oldValue));
  return checked(dec(old.quantity).plus(dec(quantityDelta)), dec(old.value).plus(dec(valueDelta)));
}
