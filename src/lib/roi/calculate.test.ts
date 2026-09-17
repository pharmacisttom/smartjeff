import { describe, it, expect } from 'vitest';
import { calculateROI, DEFAULT_BASELINE, DEFAULT_CURRENT } from './calculate';

describe('ROI Calculation Engine', () => {
  it('should calculate positive net benefit and ROI percentage correctly', () => {
    const result = calculateROI(DEFAULT_BASELINE, DEFAULT_CURRENT, 8000, 0, 0);

    expect(result.savings.total).toBeGreaterThan(0);
    expect(result.netBenefit).toBe(result.savings.total - result.costs.total);
    expect(result.roiPercent).toBeGreaterThan(0);
    expect(result.paybackMonths).toBeLessThan(12);
  });

  it('should handle zero subscription cost gracefully', () => {
    const result = calculateROI(DEFAULT_BASELINE, DEFAULT_CURRENT, 0, 0, 0);
    expect(result.costs.total).toBe(0);
    expect(result.netBenefit).toBe(result.savings.total);
  });
});
