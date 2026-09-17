import { describe, it, expect } from 'vitest';
import { provisionTenant } from './provision';

describe('Tenant Provisioning Engine', () => {
  it('should provision new tenant with 14-day trial and valid license', () => {
    const result = provisionTenant({
      companyName: 'บริษัท สยาม ออโต้แมค จำกัด',
      industry: 'Manufacturing',
      size: '51-200',
      adminName: 'วิศรุต สุวรรณ',
      email: 'admin@siamautomac.co.th',
      phone: '0812345678',
      planCode: 'PROFESSIONAL',
    });

    expect(result.tenantId).toContain('TNT-');
    expect(result.status).toBe('TRIAL');
    expect(result.licenseKey).toMatch(/^SMTO-/);
  });
});
