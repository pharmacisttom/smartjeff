import { AIUserContext, AIAuthorizationService } from "./ai-authorization.service";
import { RiskLevel } from "../risk/agent-risk.service";

export interface ToolAuthCheckResult {
  allowed: boolean;
  reason?: string;
  auditFlag?: string;
}

export class AgentToolAuthorizationService {
  /**
   * Enforces server-side tool authorization before execution.
   */
  public static authorizeToolCall(params: {
    user: AIUserContext;
    agentCode: string;
    allowedToolsForAgent: string[];
    maxRiskForAgent: RiskLevel;
    toolName: string;
    toolRiskLevel: RiskLevel;
    toolPermission: string;
    targetSiteId?: string;
  }): ToolAuthCheckResult {
    const { user, agentCode, allowedToolsForAgent, maxRiskForAgent, toolName, toolRiskLevel, toolPermission, targetSiteId } = params;

    // 1. Check if tool is allowed for this specific agent
    if (!allowedToolsForAgent.includes(toolName)) {
      return {
        allowed: false,
        reason: `Agent ${agentCode} is not permitted to execute tool "${toolName}".`,
        auditFlag: "UNAUTHORIZED_TOOL_FOR_AGENT",
      };
    }

    // 2. Check risk ceiling
    const RISK_RANK: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    if (RISK_RANK[toolRiskLevel] > RISK_RANK[maxRiskForAgent]) {
      return {
        allowed: false,
        reason: `Tool risk (${toolRiskLevel}) exceeds agent risk limit (${maxRiskForAgent}).`,
        auditFlag: "RISK_CEILING_BREACH",
      };
    }

    // 3. Check user role permission
    const roleCheck = AIAuthorizationService.checkToolPermission(user, toolName);
    if (!roleCheck.allowed) {
      return {
        allowed: false,
        reason: roleCheck.reason || "User role is not authorized for this tool.",
        auditFlag: "USER_ROLE_UNAUTHORIZED",
      };
    }

    // 4. Site Scope Check (Multi-tenant / Site isolation)
    if (targetSiteId && user.siteScope && user.siteScope.length > 0) {
      if (!user.siteScope.includes(targetSiteId)) {
        return {
          allowed: false,
          reason: `Target site "${targetSiteId}" is outside user accessible scope.`,
          auditFlag: "DATA_SCOPE_VIOLATION",
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Sanitizes external content or document text to prevent indirect prompt injection.
   * Encapsulates raw document text as inert DATA blocks.
   */
  public static sanitizeExternalDocumentContent(content: string): string {
    if (!content) return "";

    // Neutralize dangerous phrases that attempt to override system instructions
    const neutralized = content
      .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, "[REDACTED_INSTRUCTION_OVERRIDE]")
      .replace(/you\s+are\s+now\s+in\s+developer\s+mode/gi, "[REDACTED_MODE_SWITCH]")
      .replace(/system\s+prompt\s*:/gi, "data_header:")
      .replace(/call\s+tool\s*:/gi, "text_mention:");

    // Wrap as untrusted data
    return `\n<EXTERNAL_UNTRUSTED_DATA>\n${neutralized}\n</EXTERNAL_UNTRUSTED_DATA>\n`;
  }
}
