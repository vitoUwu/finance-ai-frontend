import { AIProvider } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";

export type AIProviderType = "openai" | "gemini";

export class AIProviderFactory {
  private static instance: AIProviderFactory;
  private providers: Map<AIProviderType, AIProvider>;

  private constructor() {
    this.providers = new Map();
  }

  public static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory();
    }
    return AIProviderFactory.instance;
  }

  public registerProvider(type: AIProviderType, apiKey: string): void {
    switch (type) {
      case "openai":
        this.providers.set(type, new OpenAIProvider(apiKey));
        break;
      case "gemini":
        this.providers.set(type, new GeminiProvider(apiKey));
        break;
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }

  public getProvider(type: AIProviderType): AIProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Provider ${type} not registered`);
    }
    return provider;
  }
}
