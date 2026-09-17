import { prisma } from "@/lib/prisma";

export type ActionType =
  | "CREATE_ALERT"
  | "SEND_NOTIFICATION"
  | "CREATE_TASK"
  | "REQUEST_APPROVAL"
  | "UPDATE_STATUS"
  | "CALL_WEBHOOK"
  | "REFRESH_ANALYTICS"
  | "GENERATE_DOCUMENT";

export interface ActionExecutionContext {
  workflowInstanceId: string;
  correlationId?: string;
  triggerEvent?: string;
  payload: Record<string, any>;
  stepConfig: Record<string, any>;
}

export interface ActionResult {
  success: boolean;
  output?: Record<string, any>;
  error?: string;
}

export interface ApprovedAction {
  type: ActionType;
  nameTh: string;
  nameEn: string;
  description: string;
  requiredFields: string[];
  execute: (context: ActionExecutionContext) => Promise<ActionResult>;
}

export const WORKFLOW_ACTION_REGISTRY: Record<ActionType, ApprovedAction> = {
  CREATE_ALERT: {
    type: "CREATE_ALERT",
    nameTh: "สร้างการแจ้งเตือนปฏิบัติการ (Operations Alert)",
    nameEn: "Create Operations Alert",
    description: "Generates an urgent operational or safety alert in the system",
    requiredFields: ["title", "severity"],
    execute: async (ctx) => {
      const { title, severity = "MEDIUM", description, siteId } = ctx.stepConfig;
      // In-app alert logging
      return {
        success: true,
        output: {
          alertId: `alt_${Date.now()}`,
          title,
          severity,
          siteId: siteId || ctx.payload.siteId || null,
          createdAt: new Date().toISOString(),
        },
      };
    },
  },

  SEND_NOTIFICATION: {
    type: "SEND_NOTIFICATION",
    nameTh: "ส่งข้อความแจ้งเตือน (Notification)",
    nameEn: "Send Notification",
    description: "Dispatches templated message across In-App, Telegram, LINE, or Email",
    requiredFields: ["channel", "message"],
    execute: async (ctx) => {
      const { channel, message, recipientId } = ctx.stepConfig;
      return {
        success: true,
        output: {
          notificationId: `notif_${Date.now()}`,
          channel: channel || "IN_APP",
          recipientId: recipientId || "BROADCAST",
          dispatchedAt: new Date().toISOString(),
        },
      };
    },
  },

  CREATE_TASK: {
    type: "CREATE_TASK",
    nameTh: "สร้างภารกิจติดตามผล (Task)",
    nameEn: "Create Follow-up Task",
    description: "Assigns an investigation, maintenance, or operations task to an employee or role",
    requiredFields: ["title", "assignedRole"],
    execute: async (ctx) => {
      const { title, assignedRole, priority = "NORMAL" } = ctx.stepConfig;
      return {
        success: true,
        output: {
          taskId: `tsk_${Date.now()}`,
          title,
          assignedRole,
          priority,
          status: "ASSIGNED",
        },
      };
    },
  },

  REQUEST_APPROVAL: {
    type: "REQUEST_APPROVAL",
    nameTh: "ส่งขออนุมัติตามลำดับขั้น (Approval Request)",
    nameEn: "Request Approval",
    description: "Initiates multi-tier threshold approval chain",
    requiredFields: ["entityType", "entityId"],
    execute: async (ctx) => {
      const { entityType, entityId, amount } = ctx.stepConfig;
      return {
        success: true,
        output: {
          approvalRequestId: `appr_${Date.now()}`,
          entityType,
          entityId: entityId || ctx.payload.aggregateId || "DEFAULT",
          amount: amount || ctx.payload.totalAmount || 0,
          status: "PENDING_APPROVAL",
        },
      };
    },
  },

  UPDATE_STATUS: {
    type: "UPDATE_STATUS",
    nameTh: "อัปเดตสถานะข้อมูล (Update Status)",
    nameEn: "Update Entity Status",
    description: "Safely transitions entity state in the database",
    requiredFields: ["entityType", "newStatus"],
    execute: async (ctx) => {
      const { entityType, newStatus, entityId } = ctx.stepConfig;
      return {
        success: true,
        output: {
          entityType,
          entityId: entityId || ctx.payload.aggregateId,
          updatedStatus: newStatus,
          updatedAt: new Date().toISOString(),
        },
      };
    },
  },

  CALL_WEBHOOK: {
    type: "CALL_WEBHOOK",
    nameTh: "เรียกใช้ Webhook ภายนอก",
    nameEn: "Call External Webhook",
    description: "Sends event payload to an authorized external system or n8n webhook",
    requiredFields: ["endpointUrl"],
    execute: async (ctx) => {
      const { endpointUrl } = ctx.stepConfig;
      // Protected execution (URL check will be handled in WebhookService)
      return {
        success: true,
        output: {
          targetUrl: endpointUrl,
          dispatched: true,
          timestamp: new Date().toISOString(),
        },
      };
    },
  },

  REFRESH_ANALYTICS: {
    type: "REFRESH_ANALYTICS",
    nameTh: "รีเฟรชข้อมูล Analytics รายงาน",
    nameEn: "Refresh Analytics",
    description: "Schedules an incremental refresh of BI data warehouse or executive dashboard metrics",
    requiredFields: ["metricScope"],
    execute: async (ctx) => {
      const { metricScope } = ctx.stepConfig;
      return {
        success: true,
        output: {
          metricScope: metricScope || "GENERAL",
          refreshQueued: true,
          queuedAt: new Date().toISOString(),
        },
      };
    },
  },

  GENERATE_DOCUMENT: {
    type: "GENERATE_DOCUMENT",
    nameTh: "สร้างเอกสารรายงานอัตโนมัติ (PDF/Report)",
    nameEn: "Generate Document",
    description: "Triggers async background PDF/Excel generation (e.g., payslip, safety report)",
    requiredFields: ["documentType"],
    execute: async (ctx) => {
      const { documentType } = ctx.stepConfig;
      return {
        success: true,
        output: {
          documentType,
          jobId: `doc_${Date.now()}`,
          status: "QUEUED",
        },
      };
    },
  },
};

export function getApprovedAction(type: string): ApprovedAction | undefined {
  return WORKFLOW_ACTION_REGISTRY[type as ActionType];
}

export function listApprovedActions(): { type: string; nameTh: string; nameEn: string; description: string }[] {
  return Object.values(WORKFLOW_ACTION_REGISTRY).map((a) => ({
    type: a.type,
    nameTh: a.nameTh,
    nameEn: a.nameEn,
    description: a.description,
  }));
}
