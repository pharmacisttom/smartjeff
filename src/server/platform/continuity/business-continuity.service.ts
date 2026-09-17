import { prisma } from "@/lib/prisma";
import { platformLogger } from "../logging/structured-logger";

export type MaintenanceMode = "NORMAL" | "MAINTENANCE" | "READ_ONLY" | "DEGRADED";

export interface MaintenanceStatus {
  mode: MaintenanceMode;
  reason?: string | null;
  active: boolean;
  scheduledEndAt?: string | null;
  bypassRoles: string[];
}

export class BusinessContinuityService {
  /**
   * Retrieves active maintenance mode status.
   */
  public async getMaintenanceStatus(): Promise<MaintenanceStatus> {
    try {
      const activeRecord = await prisma.systemMaintenance.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });

      if (!activeRecord) {
        return {
          mode: "NORMAL",
          active: false,
          bypassRoles: ["ADMIN", "PLATFORM_ADMIN", "SRE"],
        };
      }

      let bypassRoles: string[] = ["ADMIN", "PLATFORM_ADMIN", "SRE"];
      if (activeRecord.bypassRolesJson) {
        try {
          bypassRoles = JSON.parse(activeRecord.bypassRolesJson);
        } catch {
          // Default
        }
      }

      return {
        mode: activeRecord.mode as MaintenanceMode,
        reason: activeRecord.reason,
        active: activeRecord.active,
        scheduledEndAt: activeRecord.scheduledEndAt?.toISOString(),
        bypassRoles,
      };
    } catch (e: any) {
      return {
        mode: "NORMAL",
        active: false,
        bypassRoles: ["ADMIN", "PLATFORM_ADMIN", "SRE"],
      };
    }
  }

  /**
   * Updates platform maintenance mode.
   */
  public async setMaintenanceMode(params: {
    mode: MaintenanceMode;
    reason?: string;
    bypassRoles?: string[];
    scheduledEndAt?: Date;
    createdBy?: string;
  }) {
    // Deactivate previous active records
    await prisma.systemMaintenance.updateMany({
      where: { active: true },
      data: { active: false },
    });

    if (params.mode === "NORMAL") {
      platformLogger.info(`System returned to NORMAL operational state by ${params.createdBy || "Admin"}`);
      return { mode: "NORMAL", active: false };
    }

    const record = await prisma.systemMaintenance.create({
      data: {
        mode: params.mode,
        reason: params.reason,
        bypassRolesJson: JSON.stringify(params.bypassRoles || ["ADMIN", "PLATFORM_ADMIN", "SRE"]),
        scheduledEndAt: params.scheduledEndAt,
        active: true,
        createdBy: params.createdBy,
      },
    });

    platformLogger.warn(`Maintenance mode set to ${params.mode}. Reason: ${params.reason || "None specified"}`);
    return record;
  }

  /**
   * Checks if an HTTP method mutation is permissible under current mode and user role.
   */
  public async isMutationPermitted(httpMethod: string, userRole?: string): Promise<{ permitted: boolean; reason?: string }> {
    const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(httpMethod.toUpperCase());
    if (isSafeMethod) return { permitted: true };

    const status = await this.getMaintenanceStatus();
    if (status.mode === "NORMAL") return { permitted: true };

    // Check role bypass
    if (userRole && status.bypassRoles.includes(userRole)) {
      return { permitted: true };
    }

    if (status.mode === "READ_ONLY") {
      return {
        permitted: false,
        reason: "Platform is currently in READ-ONLY mode for maintenance or database synchronization. Data modifications are temporarily blocked.",
      };
    }

    if (status.mode === "MAINTENANCE") {
      return {
        permitted: false,
        reason: "Platform is under scheduled maintenance. Please wait until maintenance completes.",
      };
    }

    return { permitted: true };
  }
}

export const businessContinuityService = new BusinessContinuityService();
