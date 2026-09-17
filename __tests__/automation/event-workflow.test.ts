import { describe, it, expect, beforeEach } from "vitest";
import { createEventEnvelope } from "@/server/automation/events/event-envelope";
import { ENTERPRISE_EVENT_REGISTRY, getEventDefinition } from "@/server/automation/events/event-registry";
import { eventBus } from "@/server/automation/events/event-bus.service";
import { outboxService } from "@/server/automation/outbox/outbox.service";
import { workflowEngine } from "@/server/automation/workflow/workflow-engine.service";
import { ruleEngine } from "@/server/automation/rules/rule-engine.service";
import { approvalOrchestrator } from "@/server/automation/approval/approval-orchestrator.service";
import { automationScheduler } from "@/server/automation/scheduler/automation-scheduler.service";
import { notificationOrchestrator } from "@/server/automation/notifications/notification-orchestrator.service";
import { webhookService } from "@/server/automation/webhooks/webhook.service";
import { integrationCredentialService } from "@/server/automation/integrations/integration-credential.service";
import { deadLetterService } from "@/server/automation/dead-letter/dead-letter.service";
import { automationHealth } from "@/server/automation/health/automation-health.service";
import { prisma } from "@/lib/prisma";

describe("Phase 23: Enterprise Automation, Event-Driven Platform & Workflow Orchestrator Tests", () => {
  beforeEach(() => {
    eventBus._resetForTesting();
  });

  // 1. Event Envelope & Registry
  describe("1. Event Envelope & Event Registry", () => {
    it("should create a valid standardized event envelope with correlationId", () => {
      const event = createEventEnvelope({
        eventType: "ATTENDANCE_CHECKED_IN",
        domain: "ATTENDANCE",
        aggregateType: "ATTENDANCE",
        aggregateId: "att_101",
        payload: { employeeId: "emp_1", siteId: "site_A" },
      });

      expect(event.eventId).toBeDefined();
      expect(event.eventType).toBe("ATTENDANCE_CHECKED_IN");
      expect(event.domain).toBe("ATTENDANCE");
      expect(event.eventVersion).toBe(1);
      expect(event.correlationId).toBe(event.eventId);
    });

    it("should retrieve event definition from enterprise event catalog", () => {
      const def = getEventDefinition("INCIDENT_REPORTED");
      expect(def).toBeDefined();
      expect(def?.domain).toBe("QHSE");
      expect(def?.samplePayload).toHaveProperty("severity");
    });
  });

  // 2. Transactional Outbox Pattern
  describe("2. Transactional Outbox Pattern", () => {
    it("should write event to both Event Store and Outbox in atomic transaction", async () => {
      const event = createEventEnvelope({
        eventType: "PO_APPROVED",
        domain: "PROCUREMENT",
        aggregateType: "PO",
        aggregateId: `po_test_${Date.now()}`,
        payload: { amount: 55000, supplier: "Test Supplier" },
      });

      const { businessEventId, outboxEventId } = await outboxService.writeToOutbox(event);
      expect(businessEventId).toBeDefined();
      expect(outboxEventId).toBeDefined();

      const outbox = await prisma.outboxEvent.findUnique({ where: { id: outboxEventId } });
      expect(outbox?.status).toBe("PENDING");
      expect(outbox?.eventId).toBe(event.eventId);

      const store = await prisma.businessEvent.findUnique({ where: { id: businessEventId } });
      expect(store?.eventType).toBe("PO_APPROVED");
    });

    it("should process pending outbox events and mark as PROCESSED", async () => {
      const event = createEventEnvelope({
        eventType: "STOCK_LOW_ALERT",
        domain: "INVENTORY",
        aggregateType: "ITEM",
        aggregateId: `item_${Date.now()}`,
        payload: { currentQty: 2, reorderPoint: 10 },
      });

      await outboxService.writeToOutbox(event);
      const result = await outboxService.processOutbox(10);
      expect(result.processed).toBeGreaterThanOrEqual(1);

      const outbox = await prisma.outboxEvent.findUnique({ where: { eventId: event.eventId } });
      expect(outbox?.status).toBe("PROCESSED");
      expect(outbox?.processedAt).toBeDefined();
    });
  });

  // 3. Event Bus & Idempotent Consumer
  describe("3. Event Bus & Idempotent Consumer", () => {
    it("should execute consumer on publish and prevent duplicate runs for the same event", async () => {
      let callCount = 0;
      const consumerName = `test_consumer_${Date.now()}`;

      eventBus.subscribe("ATTENDANCE_CHECKED_IN", consumerName, async (_evt) => {
        callCount++;
      });

      const event = createEventEnvelope({
        eventType: "ATTENDANCE_CHECKED_IN",
        domain: "ATTENDANCE",
        aggregateType: "ATTENDANCE",
        aggregateId: "att_dup_test",
        payload: { employeeId: "emp_1" },
      });

      // 1st delivery
      await eventBus.publish(event);
      expect(callCount).toBe(1);

      // 2nd duplicate delivery
      await eventBus.publish(event);
      expect(callCount).toBe(1); // Idempotency guard prevents 2nd call!
    });
  });

  // 4. Workflow Engine & Safe Condition Evaluation (NO eval)
  describe("4. Workflow Engine & Action Registry", () => {
    it("should evaluate conditions safely without eval()", () => {
      const cond = {
        field: "deficit",
        operator: "GREATER_THAN" as const,
        value: 3,
      };

      expect(workflowEngine.evaluateCondition(cond, { deficit: 5 })).toBe(true);
      expect(workflowEngine.evaluateCondition(cond, { deficit: 2 })).toBe(false);

      const strCond = {
        field: "severity",
        operator: "EQUALS" as const,
        value: "CRITICAL",
      };
      expect(workflowEngine.evaluateCondition(strCond, { severity: "CRITICAL" })).toBe(true);
      expect(workflowEngine.evaluateCondition(strCond, { severity: "LOW" })).toBe(false);
    });

    it("should execute a workflow instance from start to finish", async () => {
      const wfDef = await prisma.workflowDefinition.create({
        data: {
          code: `WF_UNIT_${Date.now()}`,
          name: "Test Unit Workflow",
          domain: "WORKFORCE",
          triggerType: "EVENT",
          status: "ACTIVE",
          definitionJson: JSON.stringify({
            startStepId: "step_check",
            steps: [
              {
                id: "step_check",
                name: "Check Severity",
                stepType: "CONDITION",
                condition: { field: "gap", operator: "GREATER_THAN", value: 0 },
                onTrueStepId: "step_alert",
                onFalseStepId: "step_end",
              },
              {
                id: "step_alert",
                name: "Create Operations Alert",
                stepType: "ACTION",
                actionType: "CREATE_ALERT",
                config: { title: "Workforce Shortage", severity: "HIGH" },
                nextStepId: "step_end",
              },
              {
                id: "step_end",
                name: "End",
                stepType: "END",
              },
            ],
          }),
        },
      });

      const instanceId = await workflowEngine.executeWorkflow(wfDef.id, { gap: 4 });
      expect(instanceId).toBeDefined();

      const instance = await prisma.workflowInstance.findUnique({ where: { id: instanceId } });
      expect(instance?.status).toBe("COMPLETED");

      const executions = await prisma.workflowExecution.findMany({
        where: { workflowInstanceId: instanceId },
      });
      expect(executions.length).toBe(2); // step_check + step_alert
    });
  });

  // 5. Deterministic Rule Engine
  describe("5. Deterministic Rule Engine", () => {
    it("should evaluate single condition accurately", () => {
      const cond = { field: "amount", operator: "GREATER_THAN_OR_EQUAL" as const, value: 50000 };
      const res = ruleEngine.evaluateSingleCondition(cond, { amount: 75000 });
      expect(res.passed).toBe(true);
      expect(res.actualValue).toBe(75000);
    });

    it("should simulate a rule with sample input data", async () => {
      const rule = await prisma.ruleDefinition.create({
        data: {
          code: `RULE_SIM_${Date.now()}`,
          name: "Test Reorder Rule",
          domain: "INVENTORY",
          conditionsJson: JSON.stringify({
            logicalOperator: "AND",
            conditions: [{ field: "stock", operator: "LESS_THAN", value: 10 }],
          }),
          actionsJson: JSON.stringify([{ type: "SUGGEST_REORDER", params: { suggestedQty: 20 } }]),
        },
      });

      const matchedRes = await ruleEngine.simulateRule(rule.id, { stock: 5 });
      expect(matchedRes.matched).toBe(true);
      expect(matchedRes.triggeredActions.length).toBe(1);

      const unmatchedRes = await ruleEngine.simulateRule(rule.id, { stock: 15 });
      expect(unmatchedRes.matched).toBe(false);
      expect(unmatchedRes.triggeredActions.length).toBe(0);
    });
  });

  // 6. Shared Multi-Tier Approval Orchestrator
  describe("6. Shared Approval Orchestrator", () => {
    it("should advance approval tiers based on amount thresholds", async () => {
      const def = await prisma.approvalWorkflowDefinition.create({
        data: {
          code: `APPR_PO_${Date.now()}`,
          name: "PO Approval Flow",
          domain: "PROCUREMENT",
          entityType: "PO",
          thresholdRulesJson: JSON.stringify([
            { tier: 1, maxAmount: 50000, requiredRole: "MANAGER" },
            { tier: 2, minAmount: 50000, requiredRole: "FINANCE" },
          ]),
        },
      });

      // Create request with amount = 75,000 (qualifies for Tier 2)
      const req = await approvalOrchestrator.createApprovalRequest({
        approvalDefinitionCode: def.code,
        entityType: "PO",
        entityId: "po_123",
        requesterId: "emp_requester_1",
        amount: 75000,
      });

      expect(req.status).toBe("PENDING");
      expect(req.currentTier).toBe(1);

      // Separation of Duties check: Requester cannot approve their own request
      await expect(
        approvalOrchestrator.submitDecision({
          approvalRequestId: req.id,
          approverId: "emp_requester_1",
          approverRole: "MANAGER",
          decision: "APPROVED",
        })
      ).rejects.toThrow("Separation of Duties");

      // Tier 1 approval by manager
      const tier1Res = await approvalOrchestrator.submitDecision({
        approvalRequestId: req.id,
        approverId: "mgr_user_2",
        approverRole: "MANAGER",
        decision: "APPROVED",
      });
      expect(tier1Res.currentTier).toBe(2);
      expect(tier1Res.requestStatus).toBe("PENDING");

      // Tier 2 approval by finance (final)
      const tier2Res = await approvalOrchestrator.submitDecision({
        approvalRequestId: req.id,
        approverId: "fin_user_3",
        approverRole: "FINANCE",
        decision: "APPROVED",
      });
      expect(tier2Res.requestStatus).toBe("APPROVED");
    });
  });

  // 7. Automation Scheduler & Distributed Lock
  describe("7. Automation Scheduler with Distributed Lock", () => {
    it("should acquire lock and run due schedules", async () => {
      const schedule = await prisma.automationSchedule.create({
        data: {
          code: `SCHED_TEST_${Date.now()}`,
          name: "Test Scheduled Outbox Run",
          scheduleType: "HOURLY",
          targetAction: "PROCESS_OUTBOX",
          active: true,
          nextRunAt: new Date(Date.now() - 1000), // due
        },
      });

      const results = await automationScheduler.runDueSchedules();
      const thisRes = results.find((r) => r.scheduleCode === schedule.code);
      expect(thisRes).toBeDefined();
      expect(thisRes?.status).toBe("EXECUTED");

      const updated = await prisma.automationSchedule.findUnique({ where: { id: schedule.id } });
      expect(updated?.lastStatus).toBe("SUCCESS");
      expect(updated?.nextRunAt).toBeDefined();
    });
  });

  // 8. Notification Orchestrator
  describe("8. Notification Orchestrator", () => {
    it("should interpolate template variables and isolate external failure", async () => {
      const interpolated = notificationOrchestrator.interpolate(
        "เรียนคุณ {{employeeName}} คุณได้ลงเวลาที่ไซต์ {{siteName}} เรียบร้อยแล้ว",
        { employeeName: "สมชาย", siteName: "แจ้งวัฒนะ" }
      );
      expect(interpolated).toBe("เรียนคุณ สมชาย คุณได้ลงเวลาที่ไซต์ แจ้งวัฒนะ เรียบร้อยแล้ว");

      // Failure isolation: dispatching with missing external token should return gracefully without throwing
      const res = await notificationOrchestrator.dispatch({
        channel: "TELEGRAM",
        rawSubject: "Test Alert",
        rawMessage: "Test Message",
      });
      expect(res.success).toBe(true);
    });
  });

  // 9. Webhook Platform & SSRF Protection
  describe("9. Webhook Platform & SSRF Protection", () => {
    it("should block loopback, cloud metadata, and private IP ranges", () => {
      expect(webhookService.isUrlSafe("http://localhost:3000/webhook").safe).toBe(false);
      expect(webhookService.isUrlSafe("http://127.0.0.1/hook").safe).toBe(false);
      expect(webhookService.isUrlSafe("http://169.254.169.254/latest/meta-data/").safe).toBe(false);
      expect(webhookService.isUrlSafe("http://10.0.1.5/webhook").safe).toBe(false);
      expect(webhookService.isUrlSafe("http://192.168.1.100/webhook").safe).toBe(false);
      expect(webhookService.isUrlSafe("http://172.16.5.10/webhook").safe).toBe(false);
      expect(webhookService.isUrlSafe("https://api.external-partner.com/webhook").safe).toBe(true);
    });

    it("should generate deterministic HMAC SHA-256 signatures", () => {
      const payload = JSON.stringify({ event: "TEST" });
      const secret = "my_webhook_secret_key";
      const sig1 = webhookService.generateHmacSignature(payload, secret);
      const sig2 = webhookService.generateHmacSignature(payload, secret);
      expect(sig1).toBe(sig2);
      expect(sig1.length).toBe(64); // SHA-256 hex length
    });
  });

  // 10. Scoped Integration Credentials
  describe("10. Scoped Integration Credentials", () => {
    it("should verify scoped credentials and enforce permission boundaries", async () => {
      const { clientId, clientSecret, credentialId } = await integrationCredentialService.createCredential({
        name: "n8n Test Client",
        scopes: ["read:projects", "write:integration-events"],
      });

      // Valid check with granted scope
      const validRes = await integrationCredentialService.verifyCredential(
        clientId,
        clientSecret,
        "write:integration-events"
      );
      expect(validRes.valid).toBe(true);

      // Denied check with ungranted scope
      const invalidRes = await integrationCredentialService.verifyCredential(
        clientId,
        clientSecret,
        "admin:all"
      );
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.reason).toContain("not granted");
    });
  });

  // 11. Dead Letter Queue
  describe("11. Dead Letter Queue Service", () => {
    it("should retry and dismiss jobs with mandatory reason requirement", async () => {
      const job = await prisma.deadLetterJob.create({
        data: {
          queueName: "smartjeff:events",
          jobName: "TEST_FAILED_JOB",
          payloadJson: JSON.stringify({ data: 123 }),
          reason: "MAX_RETRY",
          errorMessage: "Failed to connect",
          status: "OPEN",
        },
      });

      // Dismiss without adequate reason should fail
      await expect(
        deadLetterService.dismissJob(job.id, "Auditor", "no")
      ).rejects.toThrow("valid reason of at least 5 characters");

      // Dismiss with valid reason
      const dismissRes = await deadLetterService.dismissJob(
        job.id,
        "Auditor",
        "Resolved at external endpoint"
      );
      expect(dismissRes.success).toBe(true);

      const dismissed = await prisma.deadLetterJob.findUnique({ where: { id: job.id } });
      expect(dismissed?.status).toBe("DISMISSED");
      expect(dismissed?.dismissedReason).toBe("Resolved at external endpoint");
    });
  });

  // 12. Automation Health
  describe("12. Automation Health & Telemetry", () => {
    it("should aggregate platform health and metrics", async () => {
      const health = await automationHealth.getHealth();
      expect(health.status).toBeDefined();
      expect(health.metrics).toHaveProperty("eventsToday");
      expect(health.metrics).toHaveProperty("outboxPending");
      expect(health.metrics).toHaveProperty("activeWorkflows");
    });
  });
});
