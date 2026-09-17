export interface SLARule {
  firstResponseHours: number;
  resolutionHours: number;
}

export const SLA_RULES: Record<string, SLARule> = {
  FREE: { firstResponseHours: 48, resolutionHours: 96 },
  STARTER: { firstResponseHours: 24, resolutionHours: 72 },
  PROFESSIONAL: { firstResponseHours: 4, resolutionHours: 24 },
  BUSINESS: { firstResponseHours: 2, resolutionHours: 8 },
  ENTERPRISE: { firstResponseHours: 1, resolutionHours: 4 },
};

export function calculateSLADue(createdAt: Date, planCode: string): Date {
  const rule = SLA_RULES[planCode] || SLA_RULES.FREE;
  return new Date(createdAt.getTime() + rule.firstResponseHours * 60 * 60 * 1000);
}
