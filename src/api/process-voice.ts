import { TransactionType } from "../types/finance";

interface ProcessVoiceRequest {
  prompt: string;
  context: {
    categories: Array<{
      id: string;
      name: string;
      type: TransactionType;
    }>;
    accounts: Array<{
      id: string;
      name: string;
    }>;
    paymentMethods: string[];
  };
}

interface ProcessVoiceResponse {
  name: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  paymentMethod: string;
  details?: string;
}

const SYSTEM_PROMPT = `You are a financial assistant that helps users create transactions from voice input.
Your task is to extract transaction information from the user's voice input and format it according to the available categories, accounts, and payment methods.

Rules:
1. Always determine if it's an income or expense based on context
2. Match the category to the closest available category
3. Use the first available account if not specified
4. Use CREDIT_CARD as default payment method if not specified
5. Extract the amount, handling various formats (e.g., "twenty dollars" -> 20)
6. Create a clear, concise name for the transaction
7. Add relevant details if available

Available Categories:
{categories}

Available Accounts:
{accounts}

Available Payment Methods:
{paymentMethods}

Respond with a JSON object containing:
{
  "name": "Transaction name",
  "amount": 123.45,
  "type": "INCOME" or "EXPENSE",
  "categoryId": "matching-category-id",
  "accountId": "matching-account-id",
  "paymentMethod": "PAYMENT_METHOD",
  "details": "Additional details (optional)"
}`;

export async function processVoiceInput(
  request: ProcessVoiceRequest
): Promise<ProcessVoiceResponse> {
  const { prompt, context } = request;

  // Format the system prompt with available options
  const formattedSystemPrompt = SYSTEM_PROMPT.replace(
    "{categories}",
    context.categories
      .map((c) => `- ${c.name} (${c.type}, ID: ${c.id})`)
      .join("\n")
  )
    .replace(
      "{accounts}",
      context.accounts.map((a) => `- ${a.name} (ID: ${a.id})`).join("\n")
    )
    .replace("{paymentMethods}", context.paymentMethods.join(", "));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: formattedSystemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to process voice input with OpenAI");
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  return result as ProcessVoiceResponse;
}
