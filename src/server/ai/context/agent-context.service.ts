import { AIUserContext } from "../security/ai-authorization.service";

export interface AgentContextSnapshot {
  userId: string;
  role: string;
  siteScope: string[];
  currentDate: string;
  resourceContext?: {
    type?: string;
    id?: string;
    metadata?: Record<string, any>;
  };
  allowedDomains: string[];
}

export class AgentContextService {
  /**
   * Builds a safe, token-minimized context snapshot for AI agents.
   */
  public static buildContext(
    user: AIUserContext,
    resourceContext?: { type?: string; id?: string; metadata?: Record<string, any> }
  ): AgentContextSnapshot {
    const role = (user.role || "EMPLOYEE").toUpperCase();
    const siteScope = user.siteScope || [];

    // Filter metadata to remove any raw sensitive financial or credential data
    let sanitizedMetadata: Record<string, any> | undefined = undefined;
    if (resourceContext?.metadata) {
      sanitizedMetadata = {};
      for (const [key, val] of Object.entries(resourceContext.metadata)) {
        if (/password|token|secret|salary|bankAccount|idCard/i.test(key)) {
          sanitizedMetadata[key] = "[PROTECTED_FIELD]";
        } else {
          sanitizedMetadata[key] = val;
        }
      }
    }

    // Role-based domain permissions
    const allowedDomains = this.getDomainsForRole(role);

    return {
      userId: user.userId || "anonymous",
      role,
      siteScope,
      currentDate: new Date().toISOString().split("T")[0],
      resourceContext: resourceContext
        ? {
            type: resourceContext.type,
            id: resourceContext.id,
            metadata: sanitizedMetadata,
          }
        : undefined,
      allowedDomains,
    };
  }

  private static getDomainsForRole(role: string): string[] {
    if (role === "ADMIN" || role === "EXECUTIVE") {
      return ["WORKFORCE", "PROCUREMENT", "FLEET", "PROJECT", "CRM", "QHSE", "FINANCE", "PLATFORM"];
    }
    if (role === "HR" || role === "SITE_MANAGER") {
      return ["WORKFORCE", "PROJECT", "QHSE"];
    }
    if (role === "FINANCE_MANAGER" || role === "TREASURY") {
      return ["FINANCE", "PROCUREMENT"];
    }
    if (role === "SAFETY_OFFICER") {
      return ["QHSE"];
    }
    return ["WORKFORCE"];
  }
}
