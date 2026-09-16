import { prisma } from "@/lib/prisma";

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
   * Log user action with IP address and metadata
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
    const metaStr = options.metadata ? JSON.stringify(options.metadata) : null;

    return prisma.auditLog.create({
      data: {
        userId: options.userId || null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        metadata: metaStr,
        ipAddress,
      },
    });
  }

  /**
   * Get audit log history for admin review
   */
  static async getLogs(limit = 20) {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return logs.map((l) => ({
      ...l,
      metadataObj: l.metadata ? JSON.parse(l.metadata) : null,
    }));
  }
}
