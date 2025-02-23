import { z } from "zod";

// ----- Categories -----
export const CategoryTypeSchema = z.enum(["INCOME", "EXPENSE"]);
export type CategoryType = z.infer<typeof CategoryTypeSchema>;

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: CategoryTypeSchema,
  color: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CreateCategorySchema = CategorySchema.omit({ id: true });
export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CategorySchema.omit({ id: true }).partial();
export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;

export const DeleteCategorySchema = z.object({
  id: z.string(),
});
export type DeleteCategoryDTO = z.infer<typeof DeleteCategorySchema>;

// ----- Accounts -----
export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT"]),
  color: z.string(),
});
export type Account = z.infer<typeof AccountSchema>;

export const CreateAccountSchema = AccountSchema.omit({ id: true });
export type CreateAccountDTO = z.infer<typeof CreateAccountSchema>;

export const UpdateAccountSchema = AccountSchema.omit({ id: true }).partial();
export type UpdateAccountDTO = z.infer<typeof UpdateAccountSchema>;

export const DeleteAccountSchema = z.object({
  id: z.string(),
});
export type DeleteAccountDTO = z.infer<typeof DeleteAccountSchema>;

// ----- Transactions -----
export const TransactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  name: z.string(),
  details: z.string().optional(),
  date: z.string(), // ISO date string
  type: TransactionTypeSchema,
  amount: z.number(),
  categoryId: z.string(),
  accountId: z.string(),
  paymentMethod: z.string(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const CreateTransactionSchema = TransactionSchema.omit({ id: true });
export type CreateTransactionDTO = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = TransactionSchema.omit({
  id: true,
}).partial();
export type UpdateTransactionDTO = z.infer<typeof UpdateTransactionSchema>;

export const DeleteTransactionSchema = z.object({
  id: z.string(),
});
export type DeleteTransactionDTO = z.infer<typeof DeleteTransactionSchema>;

// ----- Subscriptions -----
export const SubscriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  dueDay: z.number(),
  categoryId: z.string(),
  accountId: z.string(),
  startDate: z.string(), // ISO date string
  endDate: z.string().optional(), // ISO date string
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

// ----- User -----
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;
