import { Box, Card, Page, Tabs, Text } from "@shopify/polaris";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFinanceStore } from "../lib/store/finance-store";

export function ReportsPage() {
  const { transactions, categories } = useFinanceStore();
  const [selectedTab, setSelectedTab] = useState(0);

  // Prepare monthly data
  const monthlyData = useMemo(() => {
    const today = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(today, i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      return {
        month: format(month, "MMM yyyy"),
        monthKey: format(month, "yyyy-MM"),
        start: monthStart,
        end: monthEnd,
        income: 0,
        expenses: 0,
      };
    }).reverse();

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const monthData = last6Months.find(
        (m) => transactionDate >= m.start && transactionDate <= m.end
      );

      if (monthData) {
        if (transaction.type === "INCOME") {
          monthData.income += transaction.amount;
        } else {
          monthData.expenses += transaction.amount;
        }
      }
    });

    return last6Months.map(({ month, income, expenses }) => ({
      month,
      income,
      expenses,
    }));
  }, [transactions]);

  // Prepare category data
  const categoryData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const categoryTotals = new Map<string, number>();

    transactions
      .filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          t.type === "EXPENSE" &&
          transactionDate >= monthStart &&
          transactionDate <= monthEnd
        );
      })
      .forEach((transaction) => {
        const category = categories.find(
          (c) => c.id === transaction.categoryId
        );
        if (category) {
          categoryTotals.set(
            category.name,
            (categoryTotals.get(category.name) || 0) + transaction.amount
          );
        }
      });

    return Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        color: categories.find((c) => c.name === name)?.color || "#000000",
      }));
  }, [transactions, categories]);

  const tabs = [
    {
      id: "monthly",
      content: "Monthly Overview",
      panelID: "monthly-content",
    },
    {
      id: "categories",
      content: "Category Breakdown",
      panelID: "categories-content",
    },
  ];

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelectedTab(selectedTabIndex),
    []
  );

  return (
    <Page title="Financial Reports">
      <Card>
        <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />

        <Box padding="400">
          {selectedTab === 0 ? (
            <>
              <Text variant="headingMd" as="h2">
                Monthly Income vs Expenses
              </Text>
              <Box paddingBlockStart="400">
                {monthlyData.length > 0 ? (
                  <div style={{ height: "400px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => [
                            `$${value.toFixed(2)}`,
                            "Amount",
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="income"
                          name="Income"
                          fill="#00C49F"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          name="Expenses"
                          fill="#FF8042"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Text as="p" tone="subdued" alignment="center">
                    No data available for the selected period
                  </Text>
                )}
              </Box>
            </>
          ) : (
            <>
              <Text variant="headingMd" as="h2">
                Expenses by Category (This Month)
              </Text>
              <Box paddingBlockStart="400">
                {categoryData.length > 0 ? (
                  <div style={{ height: "400px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={150}
                          label={({ name, value }) =>
                            `${name}: $${value.toFixed(2)}`
                          }
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [
                            `$${value.toFixed(2)}`,
                            "Amount",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Text as="p" tone="subdued" alignment="center">
                    No expenses recorded this month
                  </Text>
                )}
              </Box>
            </>
          )}
        </Box>
      </Card>
    </Page>
  );
}
