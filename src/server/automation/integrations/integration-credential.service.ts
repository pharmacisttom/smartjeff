import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export class IntegrationCredentialService {
  /**
   * Generates a new scoped integration credential (e.g., for n8n or external system)
   */
  public async createCredential(params: {
    name: string;
    scopes: string[];
    expiresInDays?: number;
    rateLimitPerMin?: number;
  }): Promise<{
    credentialId: string;
    clientId: string;
    clientSecret: string; // only returned once upon creation
  }> {
    const clientId = `sjf_client_${crypto.randomBytes(8).toString("hex")}`;
    const rawSecret = `sjf_sec_${crypto.randomBytes(24).toString("hex")}`;
    const secretHash = crypto.createHash("sha256").update(rawSecret).digest("hex");

    const expiresAt = params.expiresInDays
      ? new Date(Date.now() + params.expiresInDays * 86400000)
      : null;

    const cred = await prisma.integrationCredential.create({
      data: {
        name: params.name,
        clientId,
        secretHash,
        scopesJson: JSON.stringify(params.scopes),
        expiresAt,
        rateLimitPerMin: params.rateLimitPerMin || 120,
        status: "ACTIVE",
      },
    });

    return {
      credentialId: cred.id,
      clientId,
      clientSecret: rawSecret,
    };
  }

  /**
   * Verifies client credential and requested scope
   */
  public async verifyCredential(
    clientId: string,
    rawSecret: string,
    requiredScope?: string,
    context?: { ip?: string; userAgent?: string; endpoint?: string }
  ): Promise<{ valid: boolean; reason?: string; credential?: any }> {
    const cred = await prisma.integrationCredential.findUnique({
      where: { clientId },
    });

    if (!cred || cred.status !== "ACTIVE") {
      await this.logAudit({
        credentialId: cred?.id,
        endpoint: context?.endpoint || "INCOMING",
        action: "AUTH_FAILED",
        status: "FORBIDDEN",
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        responseCode: 403,
      });
      return { valid: false, reason: "Invalid or inactive client credential" };
    }

    if (cred.expiresAt && cred.expiresAt < new Date()) {
      return { valid: false, reason: "Credential expired" };
    }

    const inputHash = crypto.createHash("sha256").update(rawSecret).digest("hex");
    if (inputHash !== cred.secretHash) {
      await this.logAudit({
        credentialId: cred.id,
        endpoint: context?.endpoint || "INCOMING",
        action: "SECRET_MISMATCH",
        status: "FORBIDDEN",
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        responseCode: 403,
      });
      return { valid: false, reason: "Secret mismatch" };
    }

    // Check scope
    if (requiredScope) {
      const scopes: string[] = JSON.parse(cred.scopesJson || "[]");
      if (!scopes.includes(requiredScope) && !scopes.includes("*")) {
        await this.logAudit({
          credentialId: cred.id,
          endpoint: context?.endpoint || "INCOMING",
          action: "INSUFFICIENT_SCOPE",
          status: "FORBIDDEN",
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
          responseCode: 403,
        });
        return { valid: false, reason: `Required scope ${requiredScope} not granted` };
      }
    }

    // Update lastUsedAt
    await prisma.integrationCredential.update({
      where: { id: cred.id },
      data: { lastUsedAt: new Date() },
    });

    return { valid: true, credential: cred };
  }

  public async logAudit(data: {
    credentialId?: string | null;
    endpoint: string;
    method?: string;
    action: string;
    status: string;
    ipAddress?: string;
    userAgent?: string;
    responseCode: number;
  }): Promise<void> {
    try {
      await prisma.integrationAuditLog.create({
        data: {
          credentialId: data.credentialId || null,
          endpoint: data.endpoint,
          method: data.method || "POST",
          action: data.action,
          status: data.status,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          responseCode: data.responseCode,
        },
      });
    } catch (e) {
      console.error("[IntegrationAuditLog] Failed to record log:", e);
    }
  }
}

export const integrationCredentialService = new IntegrationCredentialService();
