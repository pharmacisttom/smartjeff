import { describe, it, expect } from 'vitest';
import { processOmiseCharge } from './omise';

describe('Omise Payment Engine', () => {
  it('should process successful card charge', async () => {
    const res = await processOmiseCharge({
      tenantId: 'TNT-001',
      amount: 3500,
      token: 'tokn_test_4242',
      description: 'SMARTO Professional Plan',
      email: 'finance@company.com',
    });

    expect(res.status).toBe('SUCCEEDED');
    expect(res.amount).toBe(3500);
    expect(res.cardLast4).toBe('4242');
  });

  it('should reject invalid token', async () => {
    const res = await processOmiseCharge({
      tenantId: 'TNT-001',
      amount: 3500,
      token: 'tokn_invalid',
      description: 'SMARTO Professional Plan',
      email: 'finance@company.com',
    });

    expect(res.status).toBe('FAILED');
  });
});
