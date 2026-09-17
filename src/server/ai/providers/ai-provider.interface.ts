export interface AIMessageContext {
  role: string;
  userId?: string;
  siteScope?: string[];
  permissions?: string[];
}

export interface AIGenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  toolsUsed?: string[];
  evidenceData?: any;
}

export interface AIGenerateResult {
  text: string;
  tokensUsed: number;
  latencyMs: number;
  provider: string;
  model: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface AIProviderHealth {
  status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
  provider: string;
  message?: string;
}

export interface AIProvider {
  name: string;
  generate(prompt: string, options?: AIGenerateOptions): Promise<AIGenerateResult>;
  healthCheck(): Promise<AIProviderHealth>;
}
