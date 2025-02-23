import {
  Box,
  Button,
  ButtonGroup,
  Card,
  DataTable,
  Modal,
  Page,
  Select,
  Tabs,
  Text,
  TextField,
} from "@shopify/polaris";
import { format } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { useFinanceStore } from "../lib/store/finance-store";

interface AccountFormData {
  name: string;
  type: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "INVESTMENT";
  color: string;
}

interface AccountFormErrors {
  name?: string;
  type?: string;
  initialBalance?: string;
  color?: string;
}

const ACCOUNT_COLORS = [
  { label: "Blue", value: "#0088FE" },
  { label: "Green", value: "#00C49F" },
  { label: "Purple", value: "#8884D8" },
  { label: "Orange", value: "#FF8042" },
  { label: "Yellow", value: "#FFBB28" },
  { label: "Teal", value: "#82CA9D" },
];

export function AccountsPage() {
  const { accounts, transactions, addAccount, deleteAccount } =
    useFinanceStore();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    name: "",
    type: "CHECKING",
    color: ACCOUNT_COLORS[0].value,
  });
  const [formErrors, setFormErrors] = useState<AccountFormErrors>({});

  // Calculate account statistics
  const accountStats = useMemo(() => {
    return accounts.map((account) => {
      const accountTransactions = transactions.filter(
        (t) => t.accountId === account.id
      );

      const monthlyTransactions = accountTransactions.reduce(
        (acc, transaction) => {
          const month = format(new Date(transaction.date), "yyyy-MM");
          if (!acc[month]) {
            acc[month] = {
              income: 0,
              expenses: 0,
              count: 0,
            };
          }

          if (transaction.type === "INCOME") {
            acc[month].income += transaction.amount;
          } else {
            acc[month].expenses += transaction.amount;
          }
          acc[month].count += 1;

          return acc;
        },
        {} as Record<
          string,
          { income: number; expenses: number; count: number }
        >
      );

      return {
        account,
        transactions: accountTransactions,
        monthlyStats: monthlyTransactions,
      };
    });
  }, [accounts, transactions]);

  const handleCreateAccount = useCallback(async () => {
    const errors: AccountFormErrors = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.type) errors.type = "Please select an account type";
    if (!formData.color) errors.color = "Please select a color";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await addAccount({
        name: formData.name,
        type: formData.type,
        color: formData.color,
      });
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        type: "CHECKING",
        color: ACCOUNT_COLORS[0].value,
      });
    } catch (error) {
      console.error("Failed to create account:", error);
    }
  }, [formData, addAccount]);

  const handleDeleteAccount = useCallback(async () => {
    if (!accountToDelete) return;

    try {
      await deleteAccount({ id: accountToDelete });
      setAccountToDelete(null);
      setIsDeleteModalOpen(false);
      if (selectedAccount === accountToDelete) {
        setSelectedAccount(null);
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      // Show error message to user
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }, [accountToDelete, deleteAccount, selectedAccount]);

  const tabs = [
    {
      id: "list",
      content: "Accounts List",
      panelID: "accounts-list-content",
    },
    {
      id: "transactions",
      content: "Account Transactions",
      panelID: "account-transactions-content",
    },
    {
      id: "analytics",
      content: "Monthly Analytics",
      panelID: "account-analytics-content",
    },
  ];

  const accountRows = accounts.map((account) => [
    <div
      key={account.id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "4px",
          backgroundColor: account.color,
        }}
      />
      <Text as="span">{account.name}</Text>
    </div>,
    account.type,
    <ButtonGroup key={`${account.id}-actions`}>
      <Button onClick={() => setSelectedAccount(account.id)}>
        View Details
      </Button>
      <Button
        tone="critical"
        onClick={() => {
          setAccountToDelete(account.id);
          setIsDeleteModalOpen(true);
        }}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  const selectedAccountStats = selectedAccount
    ? accountStats.find((stats) => stats.account.id === selectedAccount)
    : null;

  const transactionRows =
    selectedAccountStats?.transactions.map((transaction) => [
      format(new Date(transaction.date), "MMM dd, yyyy"),
      transaction.name,
      transaction.type === "INCOME" ? (
        <Text key={transaction.id} as="span" tone="success">
          +${transaction.amount.toFixed(2)}
        </Text>
      ) : (
        <Text key={transaction.id} as="span" tone="critical">
          -${transaction.amount.toFixed(2)}
        </Text>
      ),
    ]) || [];

  const monthlyRows = selectedAccountStats
    ? Object.entries(selectedAccountStats.monthlyStats)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, stats]) => [
          format(new Date(month), "MMMM yyyy"),
          <Text key={`${month}-income`} as="span" tone="success">
            ${stats.income.toFixed(2)}
          </Text>,
          <Text key={`${month}-expenses`} as="span" tone="critical">
            ${stats.expenses.toFixed(2)}
          </Text>,
          stats.count,
          <Text
            key={`${month}-net`}
            as="span"
            tone={stats.income - stats.expenses >= 0 ? "success" : "critical"}
          >
            ${(stats.income - stats.expenses).toFixed(2)}
          </Text>,
        ])
    : [];

  return (
    <Page
      title="Accounts Management"
      primaryAction={
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          Add Account
        </Button>
      }
    >
      <Card>
        <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
        <Box padding="400">
          {selectedTab === 0 && (
            <DataTable
              columnContentTypes={["text", "text", "numeric", "text"]}
              headings={["Name", "Type", "Balance", "Actions"]}
              rows={accountRows}
            />
          )}

          {selectedTab === 1 && selectedAccount && (
            <>
              <Box paddingBlockEnd="400">
                <Select
                  label="Select Account"
                  options={accounts.map((account) => ({
                    label: `${account.name} (${account.type})`,
                    value: account.id,
                  }))}
                  value={selectedAccount}
                  onChange={setSelectedAccount}
                />
              </Box>
              <DataTable
                columnContentTypes={["text", "text", "numeric"]}
                headings={["Date", "Description", "Amount"]}
                rows={transactionRows}
              />
            </>
          )}

          {selectedTab === 2 && selectedAccount && (
            <>
              <Box paddingBlockEnd="400">
                <Select
                  label="Select Account"
                  options={accounts.map((account) => ({
                    label: `${account.name} (${account.type})`,
                    value: account.id,
                  }))}
                  value={selectedAccount}
                  onChange={setSelectedAccount}
                />
              </Box>
              <DataTable
                columnContentTypes={[
                  "text",
                  "numeric",
                  "numeric",
                  "numeric",
                  "numeric",
                ]}
                headings={[
                  "Month",
                  "Income",
                  "Expenses",
                  "Transactions",
                  "Net",
                ]}
                rows={monthlyRows}
              />
            </>
          )}
        </Box>
      </Card>

      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Account"
        primaryAction={{
          content: "Create Account",
          onAction: handleCreateAccount,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsCreateModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Box paddingBlockEnd="400">
            <TextField
              label="Account Name"
              value={formData.name}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, name: value }))
              }
              error={formErrors.name}
              autoComplete="off"
            />
          </Box>

          <Box paddingBlockEnd="400">
            <Select
              label="Account Type"
              options={[
                { label: "Checking", value: "CHECKING" },
                { label: "Savings", value: "SAVINGS" },
                { label: "Credit Card", value: "CREDIT_CARD" },
                { label: "Investment", value: "INVESTMENT" },
              ]}
              value={formData.type}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  type: value as AccountFormData["type"],
                }))
              }
              error={formErrors.type}
            />
          </Box>

          <Box paddingBlockEnd="400">
            <Select
              label="Account Color"
              options={ACCOUNT_COLORS}
              value={formData.color}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, color: value }))
              }
              error={formErrors.color}
            />
            <div
              style={{
                marginTop: "var(--p-space-200)",
                display: "flex",
                gap: "var(--p-space-200)",
              }}
            >
              {ACCOUNT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, color: color.value }))
                  }
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "4px",
                    backgroundColor: color.value,
                    border:
                      formData.color === color.value
                        ? "2px solid var(--p-action-primary)"
                        : "2px solid var(--p-border-subdued)",
                    cursor: "pointer",
                  }}
                  type="button"
                  aria-label={`Select ${color.label}`}
                />
              ))}
            </div>
          </Box>
        </Modal.Section>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleDeleteAccount,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsDeleteModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete this account? This action cannot be
            undone.
            {accountToDelete && (
              <Text as="p" tone="caution">
                Note: You cannot delete an account that has transactions.
              </Text>
            )}
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
