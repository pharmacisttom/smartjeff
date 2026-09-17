import { prisma } from "@/lib/prisma";
import { sendTelegramBotMessage } from "@/lib/notification/telegram";
import { sendEmailDigest } from "@/lib/notification/email";

export type NotificationChannel = "IN_APP" | "EMAIL" | "WEB_PUSH" | "TELEGRAM" | "LINE";
export type NotificationPriority = "NORMAL" | "IMPORTANT" | "CRITICAL";

export interface DispatchNotificationParams {
  templateCode?: string;
  channel: NotificationChannel;
  priority?: NotificationPriority;
  recipientId?: string;
  recipientEmail?: string;
  recipientTelegramChatId?: string;
  variables?: Record<string, any>;
  rawSubject?: string;
  rawMessage?: string;
}

export class NotificationOrchestratorService {
  private recentDeduplicationKeys: Map<string, number> = new Map();
  private readonly deduplicationWindowMs = 60000; // 1 minute window

  /**
   * Interpolates template string with variables
   */
  public interpolate(template: string, vars: Record<string, any> = {}): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      return vars[key] != null ? String(vars[key]) : "";
    });
  }

  /**
   * Dispatches a notification across specified channel with deduplication and failure isolation
   */
  public async dispatch(params: DispatchNotificationParams): Promise<{
    success: boolean;
    channel: string;
    delivered: boolean;
    deduplicated?: boolean;
    error?: string;
  }> {
    const priority = params.priority || "NORMAL";

    // 1. Resolve content
    let subject = params.rawSubject || "";
    let message = params.rawMessage || "";

    if (params.templateCode) {
      const tpl = await prisma.notificationTemplate.findUnique({
        where: { code: params.templateCode },
      });
      if (tpl && tpl.active) {
        subject = tpl.subjectTemplate ? this.interpolate(tpl.subjectTemplate, params.variables) : subject;
        message = this.interpolate(tpl.bodyTemplateTh, params.variables);
      }
    }

    // 2. Deduplication check (skip if CRITICAL)
    if (priority !== "CRITICAL") {
      const dedupeKey = `${params.channel}:${params.recipientId || params.recipientEmail || "ALL"}:${subject}:${message.substring(0, 30)}`;
      const lastSent = this.recentDeduplicationKeys.get(dedupeKey);
      const now = Date.now();

      if (lastSent && now - lastSent < this.deduplicationWindowMs) {
        return { success: true, channel: params.channel, delivered: false, deduplicated: true };
      }
      this.recentDeduplicationKeys.set(dedupeKey, now);
    }

    // 3. Multi-channel dispatch with Failure Isolation
    try {
      if (params.channel === "TELEGRAM" && params.recipientTelegramChatId) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          await sendTelegramBotMessage(botToken, params.recipientTelegramChatId, `<b>${subject}</b>\n${message}`);
        }
      } else if (params.channel === "EMAIL" && params.recipientEmail) {
        await sendEmailDigest([params.recipientEmail], subject || "SmartJeff Notification", `<p>${message}</p>`);
      } else if (params.channel === "LINE") {
        // LINE notify provider placeholder
        console.log(`[NotificationOrchestrator] Dispatched to LINE: ${message}`);
      } else {
        // Default: IN_APP operational alert
        await prisma.operationalAlert.create({
          data: {
            alertType: "AUTOMATION_NOTIFICATION",
            title: subject || "การแจ้งเตือนจากระบบ",
            message,
            severity: priority === "CRITICAL" ? "CRITICAL" : "MEDIUM",
            status: "ACTIVE",
          },
        });
      }

      return { success: true, channel: params.channel, delivered: true };
    } catch (err: any) {
      console.error(`[NotificationOrchestrator] Error sending via ${params.channel}:`, err?.message);
      return { success: false, channel: params.channel, delivered: false, error: err?.message || String(err) };
    }
  }
}

export const notificationOrchestrator = new NotificationOrchestratorService();
