import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import PromptManager from "../prompts";
import {
  AIProvider,
  AITransactionRequest,
  AITransactionResponse,
} from "../types";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateTransactions(
    request: AITransactionRequest
  ): Promise<AITransactionResponse> {
    const messages = PromptManager.generateTransactions(request);
    const model = this.client.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: messages.find((message) => message.role === "system")
        ?.content,
    });

    const result = await model.generateContent({
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            transactions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: {
                    type: SchemaType.STRING,
                  },
                  amount: {
                    type: SchemaType.NUMBER,
                  },
                  type: {
                    type: SchemaType.STRING,
                    enum: ["INCOME", "EXPENSE"],
                  },
                  categoryId: {
                    type: SchemaType.STRING,
                  },
                  accountId: {
                    type: SchemaType.STRING,
                  },
                  paymentMethod: {
                    type: SchemaType.STRING,
                    enum: [
                      "CREDIT_CARD",
                      "DEBIT_CARD",
                      "CASH",
                      "BANK_TRANSFER",
                      "DIGITAL_WALLET",
                    ],
                  },
                  details: {
                    type: SchemaType.STRING,
                  },
                  date: {
                    type: SchemaType.STRING,
                  },
                },
                required: [
                  "name",
                  "amount",
                  "type",
                  "categoryId",
                  "accountId",
                  "paymentMethod",
                  "date",
                ],
              },
            },
            accounts: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: {
                    type: SchemaType.STRING,
                  },
                  balance: {
                    type: SchemaType.NUMBER,
                  },
                  color: {
                    type: SchemaType.STRING,
                    description: "Hexadecimal color code",
                  },
                },
                required: ["name", "balance", "color"],
              },
            },
            categories: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  name: {
                    type: SchemaType.STRING,
                  },
                  type: {
                    type: SchemaType.STRING,
                    enum: ["INCOME", "EXPENSE"],
                  },
                  color: {
                    type: SchemaType.STRING,
                    description: "Hexadecimal color code",
                  },
                },
                required: ["name", "type", "color"],
              },
            },
          },
          required: ["transactions", "accounts", "categories"],
        },
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                messages.find((message) => message.role === "user")?.content ??
                "",
            },
          ],
        },
      ],
    });

    try {
      return JSON.parse(result.response.text());
    } catch (error) {
      throw new Error("Failed to parse Gemini response");
    }
  }
}
