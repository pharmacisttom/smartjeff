export type EmergencyType = 'SOS' | 'ACCIDENT' | 'MEDICAL' | 'FIRE' | 'SECURITY';
export type EmergencySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_ALARM';

export interface EmergencyAlertPayload {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  type: EmergencyType;
  severity: EmergencySeverity;
  status: AlertStatus;
  lat: number;
  lng: number;
  address?: string;
  message?: string;
  photoUrls?: string[];
  voiceUrl?: string;
  notifiedVia: string[];
  createdAt: string;
}

export interface SafetyCheckInSpec {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  siteId: string;
  scheduledAt: string;
  status: 'PENDING' | 'RESPONDED' | 'OVERDUE' | 'ESCALATED';
}

export function triggerSOSAlert(
  employeeId: string,
  employeeName: string,
  lat: number,
  lng: number,
  type: EmergencyType = 'SOS',
  message?: string
): EmergencyAlertPayload {
  const payload: EmergencyAlertPayload = {
    id: `EMG-${Date.now()}`,
    tenantId: 'TENANT-001',
    employeeId,
    employeeName,
    type,
    severity: 'CRITICAL',
    status: 'ACTIVE',
    lat,
    lng,
    address: 'นิคมอุตสาหกรรมมาบตาพุด จ.ระยอง',
    message: message || 'เกิดเหตุฉุกเฉิน ขอความช่วยเหลือด่วน!',
    notifiedVia: ['LINE', 'SMS', 'EMAIL', 'SLACK', 'PUSH'],
    createdAt: new Date().toISOString(),
  };

  // Log emergency event for fan-out execution
  return payload;
}

export function acknowledgeAlert(alert: EmergencyAlertPayload, adminName: string): EmergencyAlertPayload {
  return {
    ...alert,
    status: 'ACKNOWLEDGED',
  };
}

export function resolveAlert(alert: EmergencyAlertPayload, resolutionNote: string): EmergencyAlertPayload {
  return {
    ...alert,
    status: 'RESOLVED',
  };
}
