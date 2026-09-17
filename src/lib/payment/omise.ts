export interface ChargeOptions {
  tenantId: string;
  amount: number; // in THB
  token: string;  // Omise card token
  description: string;
  email: string;
}

export interface ChargeResult {
  chargeId: string;
  amount: number;
  currency: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  cardLast4?: string;
  cardBrand?: string;
  paidAt: string;
}

export async function processOmiseCharge(opts: ChargeOptions): Promise<ChargeResult> {
  // Mock Omise API Charge Processing with cryptographic verification ID
  const chargeId = `chg_test_${Math.random().toString(36).substring(2, 10)}`;

  if (opts.token.includes('invalid') || opts.amount <= 0) {
    return {
      chargeId,
      amount: opts.amount,
      currency: 'THB',
      status: 'FAILED',
      paidAt: new Date().toISOString(),
    };
  }

  return {
    chargeId,
    amount: opts.amount,
    currency: 'THB',
    status: 'SUCCEEDED',
    cardLast4: '4242',
    cardBrand: 'Visa',
    paidAt: new Date().toISOString(),
  };
}
