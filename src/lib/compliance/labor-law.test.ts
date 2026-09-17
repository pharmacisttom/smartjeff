import { describe, it, expect } from 'vitest';
import { auditLaborCompliance, generateGovDocData } from './labor-law';

describe('Labor Law Compliance Engine', () => {
  it('should detect max daily hours violation (> 8h)', () => {
    const attendances = [
      {
        employeeId: 'EMP-001',
        employeeName: 'สมชาย สายซิ่ง',
        date: '2026-09-15',
        hoursWorked: 13,
        otHours: 5,
        dailyWage: 500,
        province: 'RAYONG',
      },
    ];

    const result = auditLaborCompliance(attendances);
    expect(result.status).toBe('CRITICAL');
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].rule).toBe('MAX_DAILY_HOURS');
  });

  it('should return 100% OK score for compliant attendance', () => {
    const attendances = [
      {
        employeeId: 'EMP-002',
        employeeName: 'วิภา ตรงเวลา',
        date: '2026-09-15',
        hoursWorked: 8,
        otHours: 2,
        dailyWage: 450,
        province: 'RAYONG',
      },
    ];

    const result = auditLaborCompliance(attendances);
    expect(result.score).toBe(100);
    expect(result.status).toBe('OK');
    expect(result.violations.length).toBe(0);
  });

  it('should generate government filing specs correctly', () => {
    const spec = generateGovDocData({
      docType: 'SSO_1_10',
      period: '2026-09',
      companyName: 'บริษัท สมาร์ทเจฟ จำกัด',
      taxId: '0105567890123',
      itemsCount: 40,
      totalAmount: 30000,
    });

    expect(spec.status).toBe('READY_FOR_FILING');
    expect(spec.downloadUrl).toContain('SSO_1_10');
  });
});
