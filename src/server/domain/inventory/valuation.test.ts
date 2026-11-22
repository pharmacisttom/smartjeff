import { describe, expect, it } from 'vitest';
import { adjustment, issue, quantityInput, receiptValue, receive, returnValue } from './valuation';

describe('Inventory valuation, six decimal places', () => {
  it('accepts exact input and rejects floats, exponent notation and excess precision', () => {
    expect(quantityInput('0.000001').toFixed(6)).toBe('0.000001');
    for (const value of ['1e3', '1.0000001', '-1', '0', 'NaN', '1000000000000']) expect(() => quantityInput(value)).toThrow();
    expect(() => quantityInput(1 as unknown as string)).toThrow();
  });
  it('calculates weighted average across differently priced receipts', () => {
    const balance = receive('10', '100', '5', receiptValue('5', '16'));
    const result = issue(balance.quantity, balance.value, '4');
    expect(result.outgoingValue.toFixed(6)).toBe('48.000000');
    expect(result.quantity.toFixed(6)).toBe('11.000000');
    expect(result.value.toFixed(6)).toBe('132.000000');
  });
  it('drains exact remaining value on the last issue', () => {
    const first = issue('3', '1', '1');
    const second = issue(first.quantity, first.value, '1');
    const last = issue(second.quantity, second.value, '1');
    expect(first.outgoingValue.plus(second.outgoingValue).plus(last.outgoingValue).toFixed(6)).toBe('1.000000');
    expect(last.value.toFixed(6)).toBe('0.000000');
  });
  it('rejects insufficient stock and invalid zero-stock valuation', () => {
    expect(() => issue('1', '10', '1.000001')).toThrow('INSUFFICIENT_STOCK');
    expect(() => receive('0', '1', '1', '1')).toThrow('ZERO_STOCK_WITH_VALUE');
  });
  it('supports free stock and does not turn zero cost into missing cost', () => {
    expect(receiptValue('2', '0').isZero()).toBe(true);
    expect(issue('2', '0', '1').outgoingValue.isZero()).toBe(true);
  });
  it('keeps large products exact and rejects storage overflow', () => {
    expect(receiptValue('999999.999999', '999999.999999').toFixed(6)).toBe('999999999998.000000');
    expect(() => receiptValue('999999999999', '999999999999')).toThrow('VALUE_OUT_OF_RANGE');
  });
  it('returns original issue value and drains return rounding residual', () => {
    const first = returnValue('3', '1', '0', '0', '1');
    const second = returnValue('3', '1', '1', first, '2');
    expect(first.plus(second).toFixed(6)).toBe('1.000000');
    expect(() => returnValue('3', '1', '2', '0.666667', '2')).toThrow('RETURN_EXCEEDS_ISSUED');
  });
  it('rejects count adjustments that would leave negative stock or residual value', () => {
    expect(() => adjustment('1', '10', '-2', '-20')).toThrow();
    expect(() => adjustment('1', '10', '-1', '-9')).toThrow('ZERO_STOCK_WITH_VALUE');
  });
});
