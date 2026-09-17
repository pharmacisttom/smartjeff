import { prisma } from "@/lib/prisma";
import { eventBus } from "../events/event-bus.service";

export interface AutomationHealthOverview {
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  timestamp: string;
  provider: string;
  metrics: {
    eventsToday: number;
    outboxPending: number;
    outboxFailed: number;
    dlqOpenCount: number;
    activeWorkflows: number;
    activeRules: number;
    activeWebhooks: number;
    activeSchedules: number;
  };
}

export class AutomationHealthService {
  public async getHealth(): Promise<AutomationHealthOverview> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      eventsToday,
      outboxPending,
      outboxFailed,
      dlqOpenCount,
      activeWorkflows,
      activeRules,
      activeWebhooks,
      activeSchedules,
    ] = await Promise.all([
      prisma.businessEvent.count({ where: { occurredAt: { gte: today } } }),
      prisma.outboxEvent.count({ where: { status: "PENDING" } }),
      prisma.outboxEvent.count({ where: { status: "FAILED" } }),
      prisma.deadLetterJob.count({ where: { status: "OPEN" } }),
      prisma.workflowDefinition.count({ where: { status: "ACTIVE" } }),
      prisma.ruleDefinition.count({ where: { enabled: true } }),
      prisma.webhookEndpoint.count({ where: { status: "ACTIVE" } }),
      prisma.automationSchedule.count({ where: { active: true } }),
    ]);

    const busHealth = await eventBus.healthCheck();

    let status: "HEALTHY" | "DEGRADED" | "CRITICAL" = "HEALTHY";
    if (dlqOpenCount > 10 || outboxFailed > 20) {
      status = "CRITICAL";
    } else if (dlqOpenCount > 0 || outboxPending > 50) {
      status = "DEGRADED";
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      provider: busHealth.provider,
      metrics: {
        eventsToday,
        outboxPending,
        outboxFailed,
        dlqOpenCount,
        activeWorkflows,
        activeRules,
        activeWebhooks,
        activeSchedules,
      },
    };
  }
}

export const automationHealth = new AutomationHealthService();
