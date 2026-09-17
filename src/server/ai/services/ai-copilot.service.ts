import { prisma } from "@/lib/prisma";
import { AIAuthorizationService, AIUserContext } from "../security/ai-authorization.service";
import { AIOperationsToolRegistry } from "../tools/tool-registry";
import { AIIntentService } from "./ai-intent.service";
import { AIGroundingService, GroundingEvidenceItem } from "./ai-grounding.service";
import { AIProviderFactory } from "../providers/ai-provider.factory";
import {
  SYSTEM_OPERATIONS_COPILOT_PROMPT,
  buildCopilotPrompt,
  PROMPT_VERSION,
} from "../prompts/system-prompts";

export interface AICopilotRequest {
  message: string;
  conversationId?: string;
  context?: {
    currentSiteId?: string;
    defaultDate?: string;
    metric?: string;
  };
}

export interface AICopilotResponse {
  success: boolean;
  conversationId: string;
  messageId: string;
  answer: string;
  evidence: GroundingEvidenceItem[];
  toolsUsed: string[];
  generatedAt: string;
  dataFreshness: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  error?: string;
}

export class AICopilotService {
  /**
   * Main entry point for AI Operations Copilot
   */
  static async askCopilot(
    request: AICopilotRequest,
    userContext: AIUserContext,
    ipAddress?: string
  ): Promise<AICopilotResponse> {
    const startTime = Date.now();
    const { message, conversationId, context } = request;

    // 1. Feature Toggle Check
    if (!AIProviderFactory.isAiEnabled()) {
      return {
        success: false,
        conversationId: conversationId || "disabled",
        messageId: "disabled",
        answer: "ระบบ AI Operations Copilot ถูกปิดใช้งานชั่วคราวตามการตั้งค่าระบบ (AI_ENABLED=false)",
        evidence: [],
        toolsUsed: [],
        generatedAt: new Date().toISOString(),
        dataFreshness: new Date().toISOString(),
        confidence: "LOW",
        error: "AI_DISABLED",
      };
    }

    // 2. Security Check: Prompt Injection Protection
    const injectionCheck = AIAuthorizationService.detectPromptInjection(message);
    if (injectionCheck.isMalicious) {
      // Audit malicious attempt
      await prisma.aIAuditLog.create({
        data: {
          userId: userContext.userId,
          questionCategory: "SECURITY_ALERT",
          toolsUsed: JSON.stringify([]),
          dataScope: JSON.stringify({ role: userContext.role }),
          responseStatus: "INJECTION_ATTEMPT",
          latencyMs: Date.now() - startTime,
          ipAddress,
        },
      });

      return {
        success: false,
        conversationId: conversationId || "security-block",
        messageId: "security-block",
        answer: "ขออภัยครับ คำสั่งของท่านไม่สามารถประมวลผลได้เนื่องจากมีคำสั่งหรือรูปแบบที่ไม่เป็นไปตามนโยบายความปลอดภัยของระบบ",
        evidence: [],
        toolsUsed: [],
        generatedAt: new Date().toISOString(),
        dataFreshness: new Date().toISOString(),
        confidence: "LOW",
        error: "PROMPT_INJECTION_DETECTED",
      };
    }

    // 3. Resolve Conversation (or create new)
    let convId = conversationId;
    let history: Array<{ role: string; content: string }> = [];

    if (convId) {
      const existingConv = await prisma.aIConversation.findUnique({
        where: { id: convId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 6,
          },
        },
      });
      if (existingConv) {
        history = existingConv.messages.map((m) => ({ role: m.role, content: m.content }));
      } else {
        convId = undefined;
      }
    }

    if (!convId) {
      const newConv = await prisma.aIConversation.create({
        data: {
          userId: userContext.userId || "anonymous",
          title: message.slice(0, 50),
          context: context ? JSON.stringify(context) : null,
        },
      });
      convId = newConv.id;
    }

    // 4. Intent Routing
    const resolved = AIIntentService.resolveIntent(message, context);
    const toolsUsed: string[] = [];
    const toolResults: Record<string, any> = {};

    // 5. Execute Approved Tools
    for (const t of resolved.tools) {
      try {
        const result = await AIOperationsToolRegistry.executeTool(t.toolName, t.input, userContext);
        toolsUsed.push(t.toolName);
        toolResults[t.toolName] = result;
      } catch (err: any) {
        console.warn(`[AICopilotService] Tool ${t.toolName} execution error:`, err.message);
        // Do not crash, continue with other tools if available
      }
    }

    // 6. Grounding: Extract Evidence Items
    const evidenceItems = AIGroundingService.extractEvidenceItems(toolResults);

    // 7. LLM Prompt Construction & Generation
    const prompt = buildCopilotPrompt({
      question: message,
      userRole: userContext.role,
      userSiteScope: userContext.siteScope,
      toolsUsed,
      evidenceData: toolResults,
      conversationHistory: history,
    });

    const provider = AIProviderFactory.getProvider();
    const genResult = await provider.generate(prompt, {
      systemPrompt: SYSTEM_OPERATIONS_COPILOT_PROMPT,
      evidenceData: toolResults,
      toolsUsed,
    });

    const latencyMs = Date.now() - startTime;
    const finalAnswer = AIAuthorizationService.maskSensitiveText(genResult.text);

    // 8. Save User & Assistant Messages to Database
    await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: "user",
        content: message,
      },
    });

    const assistantMsg = await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: finalAnswer,
        toolCalls: JSON.stringify(toolsUsed),
        evidence: JSON.stringify(evidenceItems),
        tokens: genResult.tokensUsed,
        latencyMs,
        confidence: genResult.confidence,
      },
    });

    // 9. Record AIAuditLog
    await prisma.aIAuditLog.create({
      data: {
        userId: userContext.userId,
        questionCategory: resolved.intent,
        toolsUsed: JSON.stringify(toolsUsed),
        dataScope: JSON.stringify({
          role: userContext.role,
          siteScope: userContext.siteScope,
          requestedSite: context?.currentSiteId,
        }),
        responseStatus: "SUCCESS",
        latencyMs,
        tokenEstimate: genResult.tokensUsed,
        ipAddress,
      },
    });

    // Find newest freshness timestamp
    const latestFreshness =
      evidenceItems.length > 0 ? evidenceItems[0].freshness : new Date().toISOString();

    return {
      success: true,
      conversationId: convId,
      messageId: assistantMsg.id,
      answer: finalAnswer,
      evidence: evidenceItems,
      toolsUsed,
      generatedAt: new Date().toISOString(),
      dataFreshness: latestFreshness,
      confidence: genResult.confidence,
    };
  }
}
