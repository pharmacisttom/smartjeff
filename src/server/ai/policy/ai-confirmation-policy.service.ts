import { RiskLevel } from "../risk/agent-risk.service";

export type ConfirmationMode = "NONE" | "CONFIRM" | "APPROVAL_WORKFLOW" | "FORBIDDEN";

export interface PolicyRule {
  domain: string;
  actionType: string;
  riskLevel: RiskLevel;
  confirmationMode: ConfirmationMode;
  allowedRoles: string[];
  requiresStepUpMfa?: boolean;
}

export class AIConfirmationPolicyService {
  /**
   * Evaluates confirmation mode required for an action based on its risk and policy.
   */
  public static getConfirmationMode(riskLevel: RiskLevel, actionType: string): ConfirmationMode {
    // 1. CRITICAL actions are always strictly FORBIDDEN to AI execution
    if (riskLevel === "CRITICAL") {
      return "FORBIDDEN";
    }

    // 2. High risk actions require multi-tier Approval Workflow
    if (riskLevel === "HIGH") {
      return "APPROVAL_WORKFLOW";
    }

    // 3. Medium risk actions require direct Human Confirmation
    if (riskLevel === "MEDIUM") {
      return "CONFIRM";
    }

    // 4. Low risk / Draft actions
    if (actionType.startsWith("CREATE_DRAFT_") || actionType.startsWith("PREPARE_")) {
      return "CONFIRM"; // Show preview card before saving draft
    }

    return "NONE";
  }

  /**
   * Checks if an action is allowed for a user role under standard policies.
   */
  public static isActionAllowedForRole(role: string, actionType: string): boolean {
    const normalizedRole = role.toUpperCase();
    if (normalizedRole === "ADMIN") return true;

    // Critical actions forbidden to all AI interactions
    const CRITICAL_KEYWORDS = ["PAYMENT_APPROVE", "PAYROLL_APPROVE", "WIRE_TRANSFER", "GRANT_ADMIN"];
    if (CRITICAL_KEYWORDS.some((k) => actionType.includes(k))) {
      return false;
    }

    return true;
  }
}
