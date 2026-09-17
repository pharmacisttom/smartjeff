import { describe, it, expect } from 'vitest';
import { calculateVendorMetrics } from './metrics';

describe('Vendor Metrics Engine', () => {
  it('should calculate MRR and ARR correctly from active subscriptions', () => {
    const subs = [
      { tenantId: '1', companyName: 'Co A', planCode: 'STARTER' as const, status: 'ACTIVE' as const, amountMonthly: 1500 },
      { tenantId: '2', companyName: 'Co B', planCode: 'PROFESSIONAL' as const, status: 'ACTIVE' as const, amountMonthly: 3500 },
      { tenantId: '3', companyName: 'Co C', planCode: 'BUSINESS' as const, status: 'TRIAL' as const, amountMonthly: 8000 },
    ];

    const report = calculateVendorMetrics(subs);
    expect(report.mrr).toBe(5000);
    expect(report.arr).toBe(60000);
    expect(report.activeTenants).toBe(2);
    expect(report.trialTenants).toBe(1);
  });
});
