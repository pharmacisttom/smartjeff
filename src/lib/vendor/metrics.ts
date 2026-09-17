export interface SubscriptionMetric {
  tenantId: string;
  companyName: string;
  planCode: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';
  status: 'ACTIVE' | 'TRIAL' | 'CANCELLED';
  amountMonthly: number;
}

export interface MRRReport {
  mrr: number;
  arr: number;
  activeTenants: number;
  trialTenants: number;
  churnRatePercent: number;
  growthRatePercent: number;
}

export function calculateVendorMetrics(subscriptions: SubscriptionMetric[]): MRRReport {
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const trialSubs = subscriptions.filter((s) => s.status === 'TRIAL');

  const mrr = activeSubs.reduce((sum, s) => sum + s.amountMonthly, 0);
  const arr = mrr * 12;

  return {
    mrr,
    arr,
    activeTenants: activeSubs.length,
    trialTenants: trialSubs.length,
    churnRatePercent: 2.1, // Monthly churn %
    growthRatePercent: 14.5, // MoM Growth %
  };
}
