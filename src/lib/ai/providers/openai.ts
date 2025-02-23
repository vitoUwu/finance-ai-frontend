import OpenAI from "openai";
import {
  AIProvider,
  AITransactionRequest,
  AITransactionResponse,
} from "../types";
import PromptManager from "../prompts";
import { ChatCompletionMessage } from "openai/resources/index.mjs";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async generateTransactions(
    request: AITransactionRequest
  ): Promise<AITransactionResponse> {
    const messages = PromptManager.generateTransactions(request);
    const completion = await this.client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages.map((m) => ({
        role: m.role as ChatCompletionMessage["role"],
        content: m.content,
      })),
      temperature: 1,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(content);
  }
}
