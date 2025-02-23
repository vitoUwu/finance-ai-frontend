import { create, StateCreator } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import {
  Account,
  Category,
  CreateAccountDTO,
  CreateCategoryDTO,
  CreateTransactionDTO,
  DeleteAccountDTO,
  DeleteCategoryDTO,
  DeleteTransactionDTO,
  Transaction,
  UpdateAccountDTO,
  UpdateCategoryDTO,
  UpdateTransactionDTO,
} from "../../types/finance";
import { accountsApi, categoriesApi, transactionsApi } from "../api/finance";

interface FinanceState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];

  fetchAccounts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchTransactions: () => Promise<void>;

  getAccountById: (id: string) => Account | undefined;
  addAccount: (data: CreateAccountDTO) => Promise<void>;
  updateAccount: (id: string, data: UpdateAccountDTO) => Promise<void>;
  deleteAccount: (data: DeleteAccountDTO) => Promise<void>;

  getCategoryById: (id: string) => Category | undefined;
  addCategory: (data: CreateCategoryDTO) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryDTO) => Promise<void>;
  deleteCategory: (data: DeleteCategoryDTO) => Promise<void>;

  getTransactionById: (id: string) => Transaction | undefined;
  addTransaction: (data: CreateTransactionDTO) => Promise<void>;
  updateTransaction: (id: string, data: UpdateTransactionDTO) => Promise<void>;
  deleteTransaction: (data: DeleteTransactionDTO) => Promise<void>;
}

type PersistedState = Pick<
  FinanceState,
  "accounts" | "categories" | "transactions"
>;

const initialState: PersistedState = {
  accounts: [],
  categories: [],
  transactions: [],
};

type FinanceStorePersist = (
  config: StateCreator<FinanceState>,
  options: PersistOptions<FinanceState>
) => StateCreator<FinanceState>;

export const useFinanceStore = create<FinanceState>()(
  (persist as FinanceStorePersist)(
    (
      set: (fn: (state: FinanceState) => Partial<FinanceState>) => void,
      get: () => FinanceState
    ) => ({
      ...initialState,

      fetchAccounts: async () => {
        const accounts = await accountsApi.getAll();
        set(() => ({
          accounts,
        }));
      },

      fetchCategories: async () => {
        const categories = await categoriesApi.getAll();
        set(() => ({
          categories,
        }));
      },

      fetchTransactions: async () => {
        const transactions = await transactionsApi.getAll();
        set(() => ({
          transactions,
        }));
      },

      getAccountById: (id: string) =>
        get().accounts.find((account: Account) => account.id === id),

      addAccount: async (data: CreateAccountDTO) => {
        const newAccount = await accountsApi.create(data);

        set((state: FinanceState) => ({
          accounts: [...state.accounts, newAccount],
        }));
      },

      updateAccount: async (id: string, data: UpdateAccountDTO) => {
        const account = get().getAccountById(id);
        if (!account) throw new Error("Account not found");

        const updatedAccount = await accountsApi.update(id, data);

        set((state: FinanceState) => ({
          accounts: state.accounts.map((account: Account) =>
            account.id === id ? updatedAccount : account
          ),
        }));
      },

      deleteAccount: async ({ id }: DeleteAccountDTO) => {
        const account = get().getAccountById(id);
        if (!account) throw new Error("Account not found");

        const hasTransactions = get().transactions.some(
          (t: Transaction) => t.accountId === id
        );
        if (hasTransactions) {
          throw new Error("Cannot delete account with transactions");
        }

        await accountsApi.delete(id);

        set((state: FinanceState) => ({
          accounts: state.accounts.filter((a: Account) => a.id !== id),
        }));
      },

      getCategoryById: (id: string) =>
        get().categories.find((category: Category) => category.id === id),

      addCategory: async (data: CreateCategoryDTO) => {
        const newCategory = await categoriesApi.create(data);

        set((state: FinanceState) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: async (id: string, data: UpdateCategoryDTO) => {
        const category = get().getCategoryById(id);
        if (!category) throw new Error("Category not found");

        const updatedCategory = await categoriesApi.update(id, data);

        set((state: FinanceState) => ({
          categories: state.categories.map((c: Category) =>
            c.id === id ? updatedCategory : c
          ),
        }));
      },

      deleteCategory: async ({ id }: DeleteCategoryDTO) => {
        const category = get().getCategoryById(id);
        if (!category) throw new Error("Category not found");

        const hasTransactions = get().transactions.some(
          (t: Transaction) => t.categoryId === id
        );
        if (hasTransactions) {
          throw new Error("Cannot delete category with transactions");
        }

        await categoriesApi.delete(id);

        set((state: FinanceState) => ({
          categories: state.categories.filter((c: Category) => c.id !== id),
        }));
      },

      getTransactionById: (id: string) =>
        get().transactions.find(
          (transaction: Transaction) => transaction.id === id
        ),

      addTransaction: async (data: CreateTransactionDTO) => {
        // Update account balance
        console.log("addTransaction", data);
        const account = get().getAccountById(data.accountId);
        if (!account) throw new Error("Account not found");

        const newTransaction = await transactionsApi.create(data);

        set((state: FinanceState) => ({
          transactions: [...state.transactions, newTransaction],
        }));
      },

      updateTransaction: async (id: string, data: UpdateTransactionDTO) => {
        const transaction = get().getTransactionById(id);
        if (!transaction) throw new Error("Transaction not found");

        const updatedTransaction = await transactionsApi.update(id, data);

        // If amount or type changed, update account balance
        if (data.amount !== undefined || data.type !== undefined) {
          const account = get().accounts.find(
            (a: Account) => a.id === transaction.accountId
          );
          if (!account) throw new Error("Account not found");

          set((state: FinanceState) => ({
            transactions: state.transactions.map((t: Transaction) =>
              t.id === id ? updatedTransaction : t
            ),
          }));
        } else {
          set((state: FinanceState) => ({
            transactions: state.transactions.map((t: Transaction) =>
              t.id === id ? updatedTransaction : t
            ),
          }));
        }
      },

      deleteTransaction: async ({ id }: DeleteTransactionDTO) => {
        const transaction = get().getTransactionById(id);
        if (!transaction) throw new Error("Transaction not found");

        // Update account balance
        const account = get().getAccountById(transaction.accountId);
        if (!account) throw new Error("Account not found");

        await transactionsApi.delete(id);

        set((state: FinanceState) => ({
          transactions: state.transactions.filter(
            (t: Transaction) => t.id !== id
          ),
        }));
      },
    }),
    {
      name: "finance-store",
      version: 1,
      merge: (persistedState: unknown, currentState: FinanceState) => {
        return {
          ...currentState,
          ...(persistedState as PersistedState),
        };
      },
    }
  )
);

useFinanceStore.getState().fetchAccounts();
useFinanceStore.getState().fetchCategories();
useFinanceStore.getState().fetchTransactions();
