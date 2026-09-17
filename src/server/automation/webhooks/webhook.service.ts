import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { EventEnvelope } from "../events/event-envelope";

export class WebhookService {
  /**
   * SSRF Protection: strictly checks if the target URL is safe for outbound requests
   */
  public isUrlSafe(targetUrl: string): { safe: boolean; reason?: string } {
    try {
      const parsed = new URL(targetUrl);

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { safe: false, reason: "Only HTTP and HTTPS protocols are allowed." };
      }

      const hostname = parsed.hostname.toLowerCase();

      // Block local and loopback hosts
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname === "::1" ||
        hostname === "[::1]" ||
        hostname === "169.254.169.254" // Cloud metadata endpoint
      ) {
        return { safe: false, reason: "Loopback and internal metadata addresses are forbidden (SSRF protection)." };
      }

      // Check private IPv4 ranges (10.x, 192.168.x, 172.16-31.x)
      const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
      if (ipMatch) {
        const octet1 = parseInt(ipMatch[1], 10);
        const octet2 = parseInt(ipMatch[2], 10);

        if (octet1 === 10) {
          return { safe: false, reason: "Private 10.0.0.0/8 network is blocked." };
        }
        if (octet1 === 192 && octet2 === 168) {
          return { safe: false, reason: "Private 192.168.0.0/16 network is blocked." };
        }
        if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
          return { safe: false, reason: "Private 172.16.0.0/12 network is blocked." };
        }
        if (octet1 === 127) {
          return { safe: false, reason: "Loopback range is blocked." };
        }
      }

      return { safe: true };
    } catch {
      return { safe: false, reason: "Malformed target URL." };
    }
  }

  /**
   * Generates HMAC-SHA256 signature for webhook payload
   */
  public generateHmacSignature(payloadStr: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payloadStr).digest("hex");
  }

  /**
   * Dispatches an event to an endpoint with HMAC signature and delivery logging
   */
  public async deliverEvent(endpointId: string, event: EventEnvelope): Promise<any> {
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint || endpoint.status !== "ACTIVE") {
      return { success: false, reason: "Endpoint inactive or not found" };
    }

    const safety = this.isUrlSafe(endpoint.url);
    if (!safety.safe) {
      throw new Error(`SSRF Blocked: ${safety.reason}`);
    }

    const payloadStr = JSON.stringify(event);
    const signature = this.generateHmacSignature(payloadStr, endpoint.secretHash);

    const startTime = Date.now();
    let statusCode: number | null = null;
    let responseSnippet: string | null = null;
    let status = "SUCCESS";

    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SmartJeff-Signature": signature,
          "X-SmartJeff-Event": event.eventType,
          "X-SmartJeff-Delivery": event.eventId,
        },
        body: payloadStr,
        signal: AbortSignal.timeout(endpoint.timeoutMs || 10000),
      });

      statusCode = res.status;
      const text = await res.text();
      responseSnippet = text.substring(0, 500);

      if (!res.ok) {
        status = "FAILED";
      }
    } catch (err: any) {
      status = "FAILED";
      responseSnippet = err?.message || String(err);
    }

    const durationMs = Date.now() - startTime;

    // Record delivery attempt
    return prisma.webhookDelivery.create({
      data: {
        endpointId: endpoint.id,
        eventId: event.eventId,
        statusCode,
        attempt: 1,
        durationMs,
        responseSnippet,
        status,
        deliveredAt: new Date(),
      },
    });
  }

  /**
   * Sends a safe test synthetic event to verify endpoint connectivity
   */
  public async sendTestPing(endpointId: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const endpoint = await prisma.webhookEndpoint.findUnique({ where: { id: endpointId } });
    if (!endpoint) throw new Error("Endpoint not found");

    const safety = this.isUrlSafe(endpoint.url);
    if (!safety.safe) {
      throw new Error(`SSRF Validation Failed: ${safety.reason}`);
    }

    const testPayload = {
      eventId: `test_${Date.now()}`,
      eventType: "TEST_PING",
      eventVersion: 1,
      occurredAt: new Date().toISOString(),
      payload: { message: "Ping from SmartJeff Enterprise Automation Platform" },
    };

    const payloadStr = JSON.stringify(testPayload);
    const signature = this.generateHmacSignature(payloadStr, endpoint.secretHash);

    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SmartJeff-Signature": signature,
          "X-SmartJeff-Event": "TEST_PING",
        },
        body: payloadStr,
        signal: AbortSignal.timeout(5000),
      });

      return { success: res.ok, statusCode: res.status };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }
}

export const webhookService = new WebhookService();
