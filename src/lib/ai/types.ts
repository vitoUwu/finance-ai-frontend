import { Account, Category, Transaction } from "../../types/finance";

export interface AITransactionRequest {
  voiceInput: string;
  language: string;
  date: string;
  context: {
    categories: Array<{
      id: string;
      name: string;
      type: "INCOME" | "EXPENSE";
      color: string;
    }>;
    accounts: Array<{
      id: string;
      name: string;
      type: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "INVESTMENT";
    }>;
  };
}

export interface AITransactionResponse {
  transactions: Array<Omit<Transaction, "id">>;
  accounts: Array<Omit<Account, "id">>;
  categories: Array<Omit<Category, "id">>;
}

export interface AIProvider {
  generateTransactions(
    request: AITransactionRequest
  ): Promise<AITransactionResponse>;
}
