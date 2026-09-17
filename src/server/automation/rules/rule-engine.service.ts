import { prisma } from "@/lib/prisma";

export type ConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "IN"
  | "NOT_IN"
  | "CONTAINS";

export interface SingleCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface RuleConditionGroup {
  logicalOperator: "AND" | "OR";
  conditions: SingleCondition[];
}

export interface RuleAction {
  type: string;
  params: Record<string, any>;
}

export interface RuleSimulationResult {
  ruleCode: string;
  ruleName: string;
  matched: boolean;
  evaluatedConditions: Array<{
    field: string;
    actualValue: any;
    operator: ConditionOperator;
    expectedValue: any;
    passed: boolean;
  }>;
  triggeredActions: RuleAction[];
}

export class RuleEngineService {
  /**
   * Deterministically evaluates a single condition safely
   */
  public evaluateSingleCondition(
    condition: SingleCondition,
    data: Record<string, any>
  ): { passed: boolean; actualValue: any } {
    const keys = condition.field.split(".");
    let actualValue: any = data;
    for (const k of keys) {
      if (actualValue == null) break;
      actualValue = actualValue[k];
    }

    const expected = condition.value;
    let passed = false;

    switch (condition.operator) {
      case "EQUALS":
        passed = String(actualValue) === String(expected);
        break;
      case "NOT_EQUALS":
        passed = String(actualValue) !== String(expected);
        break;
      case "GREATER_THAN":
        passed = Number(actualValue) > Number(expected);
        break;
      case "GREATER_THAN_OR_EQUAL":
        passed = Number(actualValue) >= Number(expected);
        break;
      case "LESS_THAN":
        passed = Number(actualValue) < Number(expected);
        break;
      case "LESS_THAN_OR_EQUAL":
        passed = Number(actualValue) <= Number(expected);
        break;
      case "IN":
        passed = Array.isArray(expected) && expected.includes(actualValue);
        break;
      case "NOT_IN":
        passed = Array.isArray(expected) && !expected.includes(actualValue);
        break;
      case "CONTAINS":
        if (typeof actualValue === "string") {
          passed = actualValue.includes(String(expected));
        } else if (Array.isArray(actualValue)) {
          passed = actualValue.includes(expected);
        }
        break;
    }

    return { passed, actualValue };
  }

  /**
   * Evaluates condition group with logical AND / OR
   */
  public evaluateConditionGroup(
    group: RuleConditionGroup,
    data: Record<string, any>
  ): {
    matched: boolean;
    details: Array<{
      field: string;
      actualValue: any;
      operator: ConditionOperator;
      expectedValue: any;
      passed: boolean;
    }>;
  } {
    const details: any[] = [];
    const results = group.conditions.map((cond) => {
      const { passed, actualValue } = this.evaluateSingleCondition(cond, data);
      details.push({
        field: cond.field,
        actualValue,
        operator: cond.operator,
        expectedValue: cond.value,
        passed,
      });
      return passed;
    });

    const matched =
      group.logicalOperator === "OR"
        ? results.some(Boolean)
        : results.every(Boolean);

    return { matched, details };
  }

  /**
   * Simulates a rule with sample input data
   */
  public async simulateRule(
    ruleCodeOrId: string,
    sampleData: Record<string, any>
  ): Promise<RuleSimulationResult> {
    const rule = await prisma.ruleDefinition.findFirst({
      where: {
        OR: [{ code: ruleCodeOrId }, { id: ruleCodeOrId }],
      },
    });

    if (!rule) {
      throw new Error(`Rule ${ruleCodeOrId} not found`);
    }

    const conditionGroup: RuleConditionGroup = JSON.parse(rule.conditionsJson);
    const actions: RuleAction[] = JSON.parse(rule.actionsJson);

    const { matched, details } = this.evaluateConditionGroup(conditionGroup, sampleData);

    return {
      ruleCode: rule.code,
      ruleName: rule.name,
      matched,
      evaluatedConditions: details,
      triggeredActions: matched ? actions : [],
    };
  }

  /**
   * Evaluates all active rules in a domain sorted by priority
   */
  public async evaluateDomainRules(
    domain: string,
    contextData: Record<string, any>
  ): Promise<Array<{ rule: any; actions: RuleAction[] }>> {
    const now = new Date();
    const rules = await prisma.ruleDefinition.findMany({
      where: {
        domain,
        enabled: true,
        OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }],
        AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] }],
      },
      orderBy: { priority: "asc" },
    });

    const triggeredRules: Array<{ rule: any; actions: RuleAction[] }> = [];

    for (const rule of rules) {
      try {
        const conditionGroup: RuleConditionGroup = JSON.parse(rule.conditionsJson);
        const { matched } = this.evaluateConditionGroup(conditionGroup, contextData);

        if (matched) {
          const actions: RuleAction[] = JSON.parse(rule.actionsJson);
          triggeredRules.push({ rule, actions });
        }
      } catch (err) {
        console.error(`[RuleEngine] Error evaluating rule ${rule.code}:`, err);
      }
    }

    return triggeredRules;
  }
}

export const ruleEngine = new RuleEngineService();
