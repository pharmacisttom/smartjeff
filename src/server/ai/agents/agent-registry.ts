import { prisma } from "@/lib/prisma";
import { RiskLevel } from "../risk/agent-risk.service";
import { AgentPlan } from "../planning/agent-planner.service";
import { AIUserContext } from "../security/ai-authorization.service";

export interface SpecializedAgent {
  code: string;
  name: string;
  domain: string;
  description: string;
  allowedTools: string[];
  maxRiskLevel: RiskLevel;
  status: "ACTIVE" | "DISABLED";
  systemPrompt: string;
  processIntent: (
    userGoal: string,
    user: AIUserContext,
    contextParams?: Record<string, any>
  ) => Promise<{
    plan: AgentPlan;
    proposedAction?: {
      actionType: string;
      resourceType: string;
      inputPayload: Record<string, any>;
      previewData: {
        title: string;
        summary: string;
        affectedRecords?: Array<{ type: string; id: string; name?: string }>;
        changeSet?: Array<{ field: string; oldValue: any; newValue: any }>;
        conflicts?: string[];
      };
      permissionRequired: string;
    };
    explanation: string;
  }>;
}

export class SpecializedAgentRegistry {
  private static agents: Map<string, SpecializedAgent> = new Map();

  public static register(agent: SpecializedAgent) {
    this.agents.set(agent.code, agent);
  }

  public static getAgent(code: string): SpecializedAgent | undefined {
    return this.agents.get(code);
  }

  public static listAgents(): SpecializedAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Syncs agents to DB AgentDefinition table.
   */
  public static async syncDatabaseDefinitions() {
    for (const agent of this.agents.values()) {
      await prisma.agentDefinition.upsert({
        where: { code: agent.code },
        update: {
          name: agent.name,
          domain: agent.domain,
          description: agent.description,
          allowedToolsJson: JSON.stringify(agent.allowedTools),
          maxRiskLevel: agent.maxRiskLevel,
          status: agent.status,
        },
        create: {
          code: agent.code,
          name: agent.name,
          domain: agent.domain,
          description: agent.description,
          allowedToolsJson: JSON.stringify(agent.allowedTools),
          maxRiskLevel: agent.maxRiskLevel,
          status: agent.status,
        },
      });
    }
  }
}
