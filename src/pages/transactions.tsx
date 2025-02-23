import {
  Box,
  Button,
  ButtonGroup,
  Card,
  ChoiceList,
  DataTable,
  Modal,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { format } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { TransactionModal } from "../components/transactions/TransactionModal";
import { useFinanceStore } from "../lib/store/finance-store";
import { Transaction, TransactionType } from "../types/finance";

export function TransactionsPage() {
  const { transactions, categories, accounts, deleteTransaction } =
    useFinanceStore();
  const [selectedType, setSelectedType] = useState<TransactionType | "ALL">(
    "ALL"
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => {
        const matchesType =
          selectedType === "ALL" || transaction.type === selectedType;
        const matchesCategory =
          !selectedCategory || transaction.categoryId === selectedCategory;
        const matchesAccount =
          !selectedAccount || transaction.accountId === selectedAccount;
        const matchesSearch =
          !searchQuery ||
          transaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          transaction.details
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        return (
          matchesType && matchesCategory && matchesAccount && matchesSearch
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    selectedType,
    selectedCategory,
    selectedAccount,
    searchQuery,
  ]);

  // Handle deletion
  const handleDelete = useCallback(async () => {
    if (selectedTransaction) {
      try {
        await deleteTransaction({ id: selectedTransaction.id });
        setSelectedTransaction(null);
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error("Failed to delete transaction:", error);
      }
    }
  }, [selectedTransaction, deleteTransaction]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "INCOME") {
          acc.income += transaction.amount;
        } else {
          acc.expenses += transaction.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );
  }, [filteredTransactions]);

  // Prepare table rows
  const rows = useMemo(() => {
    return filteredTransactions.map((transaction) => {
      const category = categories.find((c) => c.id === transaction.categoryId);
      const account = accounts.find((a) => a.id === transaction.accountId);

      return [
        format(new Date(transaction.date), "MMM dd, yyyy"),
        <button
          key={`${transaction.id}-name`}
          onClick={() => {
            setSelectedTransaction(transaction);
            setIsDeleteModalOpen(true);
          }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            color: "inherit",
            textAlign: "left",
            width: "100%",
          }}
        >
          {transaction.name}
        </button>,
        <div
          key={`${transaction.id}-category`}
          style={{ color: category?.color }}
        >
          {category?.name || "Unknown"}
        </div>,
        account?.name || "Unknown",
        transaction.type === "INCOME" ? (
          <Text key={`${transaction.id}-amount`} as="span" tone="success">
            +${transaction.amount.toFixed(2)}
          </Text>
        ) : (
          <Text key={`${transaction.id}-amount`} as="span" tone="critical">
            -${transaction.amount.toFixed(2)}
          </Text>
        ),
      ];
    });
  }, [filteredTransactions, categories, accounts]);

  return (
    <Page
      title="Transactions"
      primaryAction={
        <Button variant="primary" onClick={() => setIsModalOpen("create")}>
          Add Transaction
        </Button>
      }
    >
      <Card>
        <Box padding="400">
          <TextField
            label="Search transactions"
            labelHidden
            value={searchQuery}
            onChange={setSearchQuery}
            clearButton
            onClearButtonClick={() => setSearchQuery("")}
            placeholder="Search transactions"
            autoComplete="off"
          />

          <Box paddingBlockStart="400">
            <Text variant="headingSm" as="h3">
              Type
            </Text>
            <ButtonGroup>
              <Button
                pressed={selectedType === "ALL"}
                onClick={() => setSelectedType("ALL")}
              >
                All
              </Button>
              <Button
                pressed={selectedType === "INCOME"}
                onClick={() => setSelectedType("INCOME")}
              >
                Income
              </Button>
              <Button
                pressed={selectedType === "EXPENSE"}
                onClick={() => setSelectedType("EXPENSE")}
              >
                Expense
              </Button>
            </ButtonGroup>
          </Box>

          <Box paddingBlockStart="400">
            <Text variant="headingSm" as="h3">
              Category
            </Text>
            <ChoiceList
              title="Category"
              titleHidden
              choices={[
                { label: "All categories", value: "" },
                ...categories
                  .filter(
                    (category) =>
                      selectedType === "ALL" || category.type === selectedType
                  )
                  .map((category) => ({
                    label: category.name,
                    value: category.id,
                  })),
              ]}
              selected={[selectedCategory]}
              onChange={([value]) => setSelectedCategory(value || "")}
            />
          </Box>

          <Box paddingBlockStart="400">
            <Text variant="headingSm" as="h3">
              Account
            </Text>
            <ChoiceList
              title="Account"
              titleHidden
              choices={[
                { label: "All accounts", value: "" },
                ...accounts.map((account) => ({
                  label: `${account.name}`,
                  value: account.id,
                })),
              ]}
              selected={[selectedAccount]}
              onChange={([value]) => setSelectedAccount(value || "")}
            />
          </Box>
        </Box>

        <Box padding="400">
          <ButtonGroup>
            <Text as="p" variant="headingSm" tone="success">
              Total Income: ${totals.income.toFixed(2)}
            </Text>
            <Text as="p" variant="headingSm" tone="critical">
              Total Expenses: ${totals.expenses.toFixed(2)}
            </Text>
            <Text
              as="p"
              variant="headingSm"
              tone={
                totals.income - totals.expenses >= 0 ? "success" : "critical"
              }
            >
              Net: ${(totals.income - totals.expenses).toFixed(2)}
            </Text>
          </ButtonGroup>
        </Box>

        <Box padding="400">
          {rows.length > 0 ? (
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "text"]}
              headings={["Date", "Name", "Category", "Account", "Amount"]}
              rows={rows}
              hideScrollIndicator
              increasedTableDensity
            />
          ) : (
            <Text as="p" tone="subdued" alignment="center">
              No transactions found
            </Text>
          )}
        </Box>
      </Card>

      <TransactionModal
        open={isModalOpen === "create"}
        onClose={() => setIsModalOpen("")}
      />

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Transaction"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleDelete,
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
            Are you sure you want to delete "{selectedTransaction?.name}"? This
            action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
