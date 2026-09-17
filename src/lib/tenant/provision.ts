import { generateLicenseKey } from '../license/key-generator';

export interface SignupInput {
  companyName: string;
  industry: string;
  size: string;
  adminName: string;
  email: string;
  phone: string;
  planCode: string;
}

export interface ProvisionResult {
  tenantId: string;
  tenantCode: string;
  companyName: string;
  status: 'TRIAL' | 'ACTIVE';
  trialEndsAt: string;
  licenseKey: string;
  adminEmail: string;
}

export function provisionTenant(input: SignupInput): ProvisionResult {
  const tenantCode = input.companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'SMTO';
  const tenantId = `TNT-${Date.now()}`;
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // Issue SMARTO License
  const licenseKey = generateLicenseKey({
    planCode: input.planCode.slice(0, 4),
    year: new Date().getFullYear(),
  });

  return {
    tenantId,
    tenantCode,
    companyName: input.companyName,
    status: 'TRIAL',
    trialEndsAt,
    licenseKey,
    adminEmail: input.email,
  };
}
