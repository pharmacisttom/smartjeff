import { prisma } from "@/lib/prisma";
import { DlpService, type LogIntegrityReport } from "./dlp.service";

export class AuditService {
  /**
   * Extract client IP address from request headers
   */
  static getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip");
    if (realIp) {
      return realIp.trim();
    }
    return "127.0.0.1";
  }

  /**
   * Log user action with DLP sanitization, client IP, and cryptographic anti-tamper signature
   */
  static async log(options: {
    userId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: any;
    req?: Request;
  }) {
    const ipAddress = options.req ? this.getClientIp(options.req) : "127.0.0.1";
    
    // 1. DLP Sanitization: Strip passwords, tokens, and mask Thai IDs / Bank accounts
    const sanitizedMetadata = options.metadata ? DlpService.sanitize(options.metadata) : {};

    // 2. Fetch latest log for hash chaining
    let previousHash = "GENESIS_SMARTJEFF_AUDIT_LOG_2026";
    try {
      const lastLog = await prisma.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, metadata: true },
      });

      if (lastLog?.metadata) {
        try {
          const parsed = JSON.parse(lastLog.metadata);
          if (parsed._dlpSignature) {
            previousHash = parsed._dlpSignature;
          }
        } catch {
          // fallback to default previousHash
        }
      }
    } catch {
      // ignore db errors on genesis lookup
    }

    const tempId = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    // 3. Compute cryptographic HMAC-SHA256 signature
    const signature = DlpService.computeLogHash(
      {
        id: tempId,
        userId: options.userId || null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        metadata: JSON.stringify(sanitizedMetadata),
        ipAddress,
        createdAt: now,
      },
      previousHash
    );

    const payloadWithIntegrity = {
      ...sanitizedMetadata,
      _dlpSignature: signature,
      _prevHash: previousHash,
      _dlpProtected: true,
      _signedAt: now.toISOString(),
    };

    return prisma.auditLog.create({
      data: {
        userId: options.userId || null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        metadata: JSON.stringify(payloadWithIntegrity),
        ipAddress,
      },
    });
  }

  /**
   * Get audit log history for admin review
   */
  static async getLogs(limit = 50) {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return logs.map((l) => {
      let parsed = null;
      if (l.metadata) {
        try {
          parsed = JSON.parse(l.metadata);
        } catch {
          parsed = l.metadata;
        }
      }

      return {
        ...l,
        metadataObj: parsed,
        isDlpProtected: parsed?._dlpProtected ?? false,
        signature: parsed?._dlpSignature ?? null,
      };
    });
  }

  /**
   * Verify cryptographic integrity of all or recent audit logs (Anti-Tampering Verification)
   */
  static async verifyIntegrity(limit = 100): Promise<LogIntegrityReport> {
    const rawLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    const chainLogs = rawLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));

    return DlpService.verifyLogChain(chainLogs);
  }
}
