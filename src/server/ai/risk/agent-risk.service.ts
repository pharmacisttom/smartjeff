export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Reversibility = "REVERSIBLE" | "PARTIALLY_REVERSIBLE" | "IRREVERSIBLE";

export interface RiskEvaluation {
  riskLevel: RiskLevel;
  reversibility: Reversibility;
  score: number; // 0 to 100
  factors: string[];
  isCriticalBlocked: boolean; // If true, strictly forbidden from autonomous or user-confirmed AI execution
}

export class AgentRiskService {
  /**
   * Evaluates the risk of an action based on deterministic rules and parameters.
   */
  public static evaluateRisk(params: {
    actionType: string;
    domain: string;
    recordCount?: number;
    amount?: number;
    isDestructive?: boolean;
    involvesSensitiveData?: boolean;
  }): RiskEvaluation {
    const { actionType, domain, recordCount = 1, amount = 0, isDestructive = false, involvesSensitiveData = false } = params;
    const factors: string[] = [];
    let score = 10; // Baseline low risk

    // 1. Identify inherently CRITICAL actions (Never allowed to AI execution)
    const CRITICAL_ACTION_PATTERNS = [
      /PAYMENT_APPROVE/i,
      /PAYROLL_APPROVE/i,
      /WIRE_TRANSFER/i,
      /GRANT_ADMIN/i,
      /DISABLE_MFA/i,
      /DELETE_FINANCIAL/i,
      /RESTORE_PRODUCTION/i,
      /DROP_TABLE/i,
      /CLOSE_CRITICAL_CAPA/i,
      /SECURITY_PRIVILEGE_ESCALATION/i,
    ];

    if (CRITICAL_ACTION_PATTERNS.some((p) => p.test(actionType))) {
      return {
        riskLevel: "CRITICAL",
        reversibility: "IRREVERSIBLE",
        score: 100,
        factors: ["Action belongs to inherently CRITICAL enterprise tier (strictly reserved for human authority)"],
        isCriticalBlocked: true,
      };
    }

    // 2. Destructive flag
    if (isDestructive) {
      score += 40;
      factors.push("Action involves destructive data removal or state replacement");
    }

    // 3. Monetary value threshold
    if (amount > 500000) {
      score += 45;
      factors.push(`High monetary impact: ฿${amount.toLocaleString()} exceeds ฿500,000 threshold`);
    } else if (amount > 50000) {
      score += 25;
      factors.push(`Monetary impact: ฿${amount.toLocaleString()} exceeds ฿50,000 threshold`);
    }

    // 4. Bulk factor
    if (recordCount > 100) {
      score += 35;
      factors.push(`Bulk operation affecting ${recordCount} records`);
    } else if (recordCount > 10) {
      score += 15;
      factors.push(`Batch operation affecting ${recordCount} records`);
    }

    // 5. Sensitive data
    if (involvesSensitiveData) {
      score += 20;
      factors.push("Action involves employee confidential data or financial ledger items");
    }

    // 6. Action Type Specific Rules
    if (actionType.startsWith("CREATE_DRAFT") || actionType.startsWith("SIMULATE") || actionType.startsWith("PREPARE")) {
      score = Math.min(score, 30); // Drafts are inherently safe
      factors.push("Draft/Simulation action: zero direct mutation to active production objects");
    } else if (actionType.startsWith("PUBLISH_") || actionType.startsWith("SUBMIT_")) {
      score += 30;
      factors.push("Publish/Submit state change triggers active downstream notifications or workflows");
    }

    // Determine Final Level
    let riskLevel: RiskLevel = "LOW";
    let reversibility: Reversibility = "REVERSIBLE";

    if (score >= 80) {
      riskLevel = "HIGH";
      reversibility = isDestructive ? "IRREVERSIBLE" : "PARTIALLY_REVERSIBLE";
    } else if (score >= 40) {
      riskLevel = "MEDIUM";
      reversibility = "PARTIALLY_REVERSIBLE";
    } else {
      riskLevel = "LOW";
      reversibility = "REVERSIBLE";
    }

    return {
      riskLevel,
      reversibility,
      score: Math.min(score, 100),
      factors,
      isCriticalBlocked: false,
    };
  }
}
