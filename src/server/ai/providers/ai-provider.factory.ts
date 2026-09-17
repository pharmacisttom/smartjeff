import { AIProvider } from "./ai-provider.interface";
import { LocalDeterministicProvider } from "./local-deterministic.provider";
import { OpenAIProvider } from "./openai.provider";

export class AIProviderFactory {
  private static instance: AIProvider | null = null;

  static getProvider(): AIProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = (process.env.AI_PROVIDER || "local").toLowerCase();

    if (providerType === "openai" || process.env.AI_API_KEY || process.env.OPENAI_API_KEY) {
      this.instance = new OpenAIProvider();
    } else {
      this.instance = new LocalDeterministicProvider();
    }

    return this.instance;
  }

  static isAiEnabled(): boolean {
    return process.env.AI_ENABLED !== "false" && process.env.AI_ENABLED !== "0";
  }
}
