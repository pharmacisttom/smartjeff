import { AIProvider, AIGenerateOptions, AIGenerateResult, AIProviderHealth } from "./ai-provider.interface";
import { LocalDeterministicProvider } from "./local-deterministic.provider";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private fallbackProvider: LocalDeterministicProvider;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
    this.model = process.env.AI_MODEL || "gpt-4o-mini";
    this.baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
    this.fallbackProvider = new LocalDeterministicProvider();
  }

  async generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult> {
    if (!this.apiKey) {
      // Graceful fallback to deterministic provider
      return this.fallbackProvider.generate(prompt, options);
    }

    const startTime = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                options?.systemPrompt ||
                "คุณคือ SmartJeff AI Operations Copilot ตอบคำถามผู้บริหารด้วยภาษาไทยอย่างกระชับและอ้างอิงจากข้อมูลหลักฐานเท่านั้น",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 1000,
        }),
      });

      if (!response.ok) {
        console.warn(`[OpenAIProvider] API request returned status ${response.status}. Falling back to deterministic engine.`);
        return this.fallbackProvider.generate(prompt, options);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const tokensUsed = data.usage?.total_tokens || Math.ceil(text.length / 4);
      const latencyMs = Date.now() - startTime;

      return {
        text,
        tokensUsed,
        latencyMs,
        provider: this.name,
        model: this.model,
        confidence: "HIGH",
      };
    } catch (err) {
      console.warn(`[OpenAIProvider] Error calling OpenAI API:`, err);
      // Fallback gracefully
      return this.fallbackProvider.generate(prompt, options);
    }
  }

  async healthCheck(): Promise<AIProviderHealth> {
    if (!this.apiKey) {
      return {
        status: "DEGRADED",
        provider: this.name,
        message: "No API key configured. Local fallback engine active.",
      };
    }
    return {
      status: "HEALTHY",
      provider: this.name,
      message: `OpenAI provider configured with model ${this.model}`,
    };
  }
}
