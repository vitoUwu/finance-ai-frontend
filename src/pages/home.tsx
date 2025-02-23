import {
  Box,
  Button,
  Card,
  DataTable,
  Layout,
  Page,
  ProgressBar,
  Text,
} from "@shopify/polaris";
import { endOfMonth, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { TransactionModal } from "../components/transactions/TransactionModal";
import { useFinanceStore } from "../lib/store/finance-store";

export function HomePage() {
  const { transactions, accounts, categories } = useFinanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate total balance across all accounts
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }, [accounts]);

  // Calculate monthly income and expenses
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return transactions.reduce(
      (acc, transaction) => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= monthStart && transactionDate <= monthEnd) {
          if (transaction.type === "INCOME") {
            acc.income += transaction.amount;
          } else {
            acc.expenses += transaction.amount;
          }
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );
  }, [transactions]);

  // Calculate spending by category
  const categorySpending = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const spending = new Map<string, number>();

    transactions
      .filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          t.type === "EXPENSE" &&
          transactionDate >= monthStart &&
          transactionDate <= monthEnd
        );
      })
      .forEach((t) => {
        const category = categories.find((c) => c.id === t.categoryId);
        if (category) {
          spending.set(
            category.name,
            (spending.get(category.name) || 0) + t.amount
          );
        }
      });

    return Array.from(spending.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [transactions, categories]);

  // Calculate budget progress
  const budgetProgress = useMemo(() => {
    const monthlyBudget = 5000; // This would come from user settings later
    const currentSpending = monthlyStats.expenses;
    const progress = (currentSpending / monthlyBudget) * 100;
    return {
      progress: Math.min(progress, 100),
      amount: currentSpending,
      budget: monthlyBudget,
    };
  }, [monthlyStats.expenses]);

  return (
    <Page title="Dashboard">
      <Layout>
        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <Button onClick={() => setIsModalOpen(true)} variant="primary">
                Add New Transaction
              </Button>
            </Box>
          </Card>
        </Layout.Section>

        {/* Summary Cards */}
        <Layout.Section variant="oneHalf">
          <Card>
            <Box padding="400">
              <Text variant="headingMd" as="h2">
                Total Balance
              </Text>
              <Text variant="headingXl" as="p">
                ${totalBalance.toFixed(2)}
              </Text>
            </Box>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <Box padding="400">
              <Text variant="headingMd" as="h2">
                Monthly Overview
              </Text>
              <Box paddingBlockStart="400">
                <Text as="p" tone="success">
                  Income: ${monthlyStats.income.toFixed(2)}
                </Text>
                <Text as="p" tone="critical">
                  Expenses: ${monthlyStats.expenses.toFixed(2)}
                </Text>
                <Text
                  as="p"
                  tone={
                    monthlyStats.income - monthlyStats.expenses >= 0
                      ? "success"
                      : "critical"
                  }
                >
                  Net: $
                  {(monthlyStats.income - monthlyStats.expenses).toFixed(2)}
                </Text>
              </Box>
            </Box>
          </Card>
        </Layout.Section>

        {/* Budget Progress */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <Text variant="headingMd" as="h2">
                Monthly Budget
              </Text>
              <Box paddingBlockStart="400">
                <ProgressBar
                  progress={budgetProgress.progress}
                  size="medium"
                  tone={budgetProgress.progress > 90 ? "critical" : "success"}
                />
                <Box paddingBlockStart="200">
                  <Text
                    as="p"
                    tone={budgetProgress.progress > 90 ? "critical" : undefined}
                  >
                    ${budgetProgress.amount.toFixed(2)} of $
                    {budgetProgress.budget.toFixed(2)} (
                    {budgetProgress.progress.toFixed(1)}%)
                  </Text>
                </Box>
              </Box>
            </Box>
          </Card>
        </Layout.Section>

        {/* Top Spending Categories */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <Text variant="headingMd" as="h2">
                Top Spending Categories
              </Text>
              <Box paddingBlockStart="400">
                {categorySpending.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "numeric"]}
                    headings={["Category", "Amount"]}
                    rows={categorySpending.map(([category, amount]) => [
                      category,
                      <Text key={category} as="span" tone="critical">
                        ${amount.toFixed(2)}
                      </Text>,
                    ])}
                  />
                ) : (
                  <Text as="p" tone="subdued">
                    No expenses recorded this month
                  </Text>
                )}
              </Box>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>

      <TransactionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Page>
  );
}
