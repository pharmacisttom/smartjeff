import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { platformLogger } from "../logging/structured-logger";

export class ErrorMonitorService {
  /**
   * Generates a stable fingerprint from an error stack trace or message.
   * Strips dynamic line numbers or memory addresses for deduplication.
   */
  public generateFingerprint(errorType: string, message: string, stack?: string): string {
    const normalized = (stack || message)
      .replace(/:\d+:\d+/g, ":LINE:COL")
      .replace(/at\s+async\s+/g, "at ")
      .replace(/0x[a-fA-F0-9]+/g, "0xADDR")
      .slice(0, 500);

    return crypto.createHash("sha256").update(`${errorType}:${normalized}`).digest("hex");
  }

  /**
   * Records or increments an application error.
   */
  public async captureError(params: {
    service?: string;
    route?: string;
    errorType?: string;
    message: string;
    error?: Error;
    metadata?: Record<string, any>;
  }) {
    const service = params.service || "WEB";
    const errorType = params.errorType || (params.error ? params.error.name : "ApplicationError");
    const message = params.message || (params.error ? params.error.message : "Unknown error");
    const stackTrace = params.error?.stack;
    const fingerprint = this.generateFingerprint(errorType, message, stackTrace);

    try {
      const existing = await prisma.applicationError.findFirst({
        where: { stackFingerprint: fingerprint, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      });

      if (existing) {
        return await prisma.applicationError.update({
          where: { id: existing.id },
          data: {
            count: { increment: 1 },
            lastOccurredAt: new Date(),
            metadataJson: params.metadata ? JSON.stringify(params.metadata) : existing.metadataJson,
          },
        });
      }

      const created = await prisma.applicationError.create({
        data: {
          service,
          route: params.route,
          errorType,
          message,
          stackFingerprint: fingerprint,
          stackTrace,
          metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
          count: 1,
          status: "OPEN",
        },
      });

      platformLogger.error(`Captured new application error [${fingerprint.slice(0, 8)}]: ${message}`, errorType, params.error);
      return created;
    } catch (e: any) {
      platformLogger.warn(`Failed to persist application error to DB: ${e.message}`);
      return null;
    }
  }

  public async getErrors(status?: string, limit = 50) {
    return prisma.applicationError.findMany({
      where: status ? { status } : undefined,
      orderBy: { lastOccurredAt: "desc" },
      take: limit,
    });
  }

  public async updateStatus(id: string, status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "IGNORED") {
    return prisma.applicationError.update({
      where: { id },
      data: { status },
    });
  }
}

export const errorMonitorService = new ErrorMonitorService();
