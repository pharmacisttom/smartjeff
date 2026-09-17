import { describe, it, expect } from 'vitest';
import { generateWebhookSignature } from './deliver';

describe('Webhook Engine', () => {
  it('should generate deterministic HMAC-SHA256 signature', () => {
    const payloadStr = JSON.stringify({ event: 'attendance.check-in', tenantId: 'TNT-001' });
    const secret = 'whsec_test_secret_12345';

    const sig1 = generateWebhookSignature(payloadStr, secret);
    const sig2 = generateWebhookSignature(payloadStr, secret);

    expect(sig1).toBe(sig2);
    expect(sig1).toHaveLength(64); // hex sha256
  });
});
