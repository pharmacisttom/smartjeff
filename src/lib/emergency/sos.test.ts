import { describe, it, expect } from 'vitest';
import { triggerSOSAlert, acknowledgeAlert, resolveAlert } from './sos';

describe('SOS Emergency Engine', () => {
  it('should create critical alert payload with fan-out notification channels', () => {
    const alert = triggerSOSAlert('EMP-001', 'สมชาย สายซิ่ง', 12.68, 101.28, 'SOS', 'เกิดอุบัติเหตุในโรงงาน');

    expect(alert.status).toBe('ACTIVE');
    expect(alert.severity).toBe('CRITICAL');
    expect(alert.notifiedVia).toContain('LINE');
    expect(alert.notifiedVia).toContain('SMS');
  });

  it('should transition status from ACTIVE -> ACKNOWLEDGED -> RESOLVED', () => {
    let alert = triggerSOSAlert('EMP-001', 'สมชาย สายซิ่ง', 12.68, 101.28);
    expect(alert.status).toBe('ACTIVE');

    alert = acknowledgeAlert(alert, 'Admin Visarut');
    expect(alert.status).toBe('ACKNOWLEDGED');

    alert = resolveAlert(alert, 'ช่วยเหลือเรียบร้อย พานำส่ง รพ. ปลวกแดง');
    expect(alert.status).toBe('RESOLVED');
  });
});
