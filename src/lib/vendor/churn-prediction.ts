export interface ChurnFactor {
  name: string;
  weight: number;
}

export interface ChurnPredictionResult {
  tenantId: string;
  score: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: ChurnFactor[];
  recommendation: string;
}

export function predictTenantChurn(input: {
  tenantId: string;
  daysSinceLastLogin: number;
  unresolvedTickets: number;
  failedCharges: number;
  featureAdoptionRate: number; // 0.0 - 1.0
}): ChurnPredictionResult {
  let score = 0;
  const factors: ChurnFactor[] = [];

  if (input.daysSinceLastLogin > 14) {
    score += 35;
    factors.push({ name: 'ผู้บริหารไม่ล็อกอิน > 14 วัน', weight: 35 });
  }

  if (input.unresolvedTickets >= 2) {
    score += 25;
    factors.push({ name: 'มี Support Ticket ค้าง > 2 รายการ', weight: 25 });
  }

  if (input.failedCharges > 0) {
    score += 25;
    factors.push({ name: 'ตัดบัตรไม่ผ่าน (Payment Failed)', weight: 25 });
  }

  if (input.featureAdoptionRate < 0.4) {
    score += 15;
    factors.push({ name: 'ใช้งานฟีเจอร์น้อยกว่า 40%', weight: 15 });
  }

  score = Math.min(100, score);
  const riskLevel = score >= 70 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';

  let recommendation = 'ลูกค้ามีสุขภาพดี การใช้งานปกติ';
  if (riskLevel === 'CRITICAL') {
    recommendation = '⚠️ ให้ทีม Customer Success (CSM) ติดต่อผู้บริหารด่วนเพื่อเสนอช่วยเหลือ';
  } else if (riskLevel === 'HIGH') {
    recommendation = 'ส่งอีเมลแนะนำการใช้งานฟีเจอร์ AI Chat และ Live Operations Map';
  }

  return {
    tenantId: input.tenantId,
    score,
    riskLevel,
    factors,
    recommendation,
  };
}
