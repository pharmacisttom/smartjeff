import { describe, it, expect } from 'vitest';
import { predictTenantChurn } from './churn-prediction';

describe('Churn Prediction Engine', () => {
  it('should flag CRITICAL risk level for inactive tenant with failed charges', () => {
    const res = predictTenantChurn({
      tenantId: 'TNT-HIGH-RISK',
      daysSinceLastLogin: 20,
      unresolvedTickets: 3,
      failedCharges: 1,
      featureAdoptionRate: 0.2,
    });

    expect(res.score).toBeGreaterThanOrEqual(70);
    expect(res.riskLevel).toBe('CRITICAL');
    expect(res.recommendation).toContain('CSM');
  });

  it('should return LOW risk for active healthy tenant', () => {
    const res = predictTenantChurn({
      tenantId: 'TNT-HEALTHY',
      daysSinceLastLogin: 1,
      unresolvedTickets: 0,
      failedCharges: 0,
      featureAdoptionRate: 0.85,
    });

    expect(res.score).toBe(0);
    expect(res.riskLevel).toBe('LOW');
  });
});
