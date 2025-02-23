import axios from "axios";
import {
  Account,
  Category,
  CreateAccountDTO,
  CreateCategoryDTO,
  CreateTransactionDTO,
  Subscription,
  Transaction,
  UpdateAccountDTO,
  UpdateCategoryDTO,
  UpdateTransactionDTO,
  User,
  UserSchema,
} from "../../types/finance";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

// Transactions API
export const transactionsApi = {
  getAll: async (): Promise<Transaction[]> => {
    const data = await api.get<Transaction[]>("/transactions");
    return data.data;
  },

  getByDateRange: async (
    _startDate: string,
    _endDate: string
  ): Promise<Transaction[]> => {
    return [];
  },

  create: async (transaction: CreateTransactionDTO): Promise<Transaction> => {
    const data = await api.post<Transaction>("/transactions", transaction);
    return data.data;
  },

  update: async (
    id: string,
    transaction: UpdateTransactionDTO
  ): Promise<Transaction> => {
    const data = await api.put<Transaction>(`/transactions/${id}`, transaction);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const data = await api.get<Category[]>("/categories");
    return data.data;
  },

  create: async (category: CreateCategoryDTO): Promise<Category> => {
    const data = await api.post<Category>("/categories", category);
    return data.data;
  },

  update: async (
    id: string,
    category: UpdateCategoryDTO
  ): Promise<Category> => {
    const data = await api.put<Category>(`/categories/${id}`, category);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

// Accounts API
export const accountsApi = {
  getAll: async (): Promise<Account[]> => {
    const data = await api.get<Account[]>("/accounts");
    return data.data;
  },

  create: async (account: CreateAccountDTO): Promise<Account> => {
    const data = await api.post<Account>("/accounts", account);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  },

  update: async (id: string, account: UpdateAccountDTO): Promise<Account> => {
    const data = await api.put<Account>(`/accounts/${id}`, account);
    return data.data;
  },
};

// Subscriptions API
export const subscriptionsApi = {
  getAll: async (): Promise<Subscription[]> => {
    const data = await api.get<Subscription[]>("/subscriptions");
    return data.data;
  },

  create: async (
    subscription: Omit<Subscription, "id">
  ): Promise<Subscription> => {
    const data = await api.post<Subscription>("/subscriptions", subscription);
    return data.data;
  },

  update: async (
    id: string,
    subscription: Partial<Subscription>
  ): Promise<Subscription> => {
    const data = await api.put<Subscription>(
      `/subscriptions/${id}`,
      subscription
    );
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/subscriptions/${id}`);
  },
};

// User API
export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await api.get<User>("/me");
    UserSchema.parse(response.data);
    return response.data;
  },
};
