import crypto from 'crypto';

export interface WebhookPayload {
  event: 'employee.created' | 'attendance.check-in' | 'attendance.check-out' | 'emergency.alert' | 'invoice.paid';
  tenantId: string;
  data: Record<string, any>;
  timestamp: string;
}

export function generateWebhookSignature(payloadStr: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
}

export async function deliverWebhookPayload(
  targetUrl: string,
  secret: string,
  payload: WebhookPayload
): Promise<{ success: boolean; status: number; signature: string }> {
  const payloadStr = JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadStr, secret);

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smarto-Signature': signature,
        'X-Smarto-Event': payload.event,
      },
      body: payloadStr,
    });

    return {
      success: res.ok,
      status: res.status,
      signature,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      signature,
    };
  }
}
