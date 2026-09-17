export interface PlanDefinition {
  code: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxEmployees: number | null; // null = unlimited
  maxSites: number | null;
  maxAdmins: number | null;
  storageGb: number;
  features: {
    attendance: boolean;
    checkin: boolean;
    payslip: boolean;
    ai_chat: boolean;
    live_map: boolean;
    reports: boolean;
    api_access: boolean;
    white_label: boolean;
    sso: boolean;
  };
  supportLevel: string;
}

export const PLANS: Record<string, PlanDefinition> = {
  FREE: {
    code: 'FREE',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    maxEmployees: 5,
    maxSites: 1,
    maxAdmins: 1,
    storageGb: 1,
    features: {
      attendance: true,
      checkin: true,
      payslip: true,
      ai_chat: false,
      live_map: false,
      reports: false,
      api_access: false,
      white_label: false,
      sso: false,
    },
    supportLevel: 'Community Support',
  },
  STARTER: {
    code: 'STARTER',
    name: 'Starter',
    priceMonthly: 1500,
    priceYearly: 14400, // 20% off
    maxEmployees: 20,
    maxSites: 3,
    maxAdmins: 3,
    storageGb: 10,
    features: {
      attendance: true,
      checkin: true,
      payslip: true,
      ai_chat: false,
      live_map: true,
      reports: true,
      api_access: false,
      white_label: false,
      sso: false,
    },
    supportLevel: 'Email 24h',
  },
  PROFESSIONAL: {
    code: 'PROFESSIONAL',
    name: 'Professional',
    priceMonthly: 3500,
    priceYearly: 33600,
    maxEmployees: 50,
    maxSites: 10,
    maxAdmins: 5,
    storageGb: 50,
    features: {
      attendance: true,
      checkin: true,
      payslip: true,
      ai_chat: true,
      live_map: true,
      reports: true,
      api_access: true,
      white_label: false,
      sso: false,
    },
    supportLevel: 'Priority 4h',
  },
  BUSINESS: {
    code: 'BUSINESS',
    name: 'Business',
    priceMonthly: 8000,
    priceYearly: 76800,
    maxEmployees: 200,
    maxSites: null,
    maxAdmins: 20,
    storageGb: 200,
    features: {
      attendance: true,
      checkin: true,
      payslip: true,
      ai_chat: true,
      live_map: true,
      reports: true,
      api_access: true,
      white_label: true,
      sso: true,
    },
    supportLevel: 'Dedicated 2h',
  },
};
