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

interface CategoryFormData {
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
}

interface CategoryFormErrors {
  name?: string;
  type?: string;
  color?: string;
}

const CATEGORY_COLORS = [
  { label: "Red", value: "#FF8042" },
  { label: "Green", value: "#00C49F" },
  { label: "Yellow", value: "#FFBB28" },
  { label: "Blue", value: "#0088FE" },
  { label: "Purple", value: "#8884D8" },
  { label: "Teal", value: "#82CA9D" },
];

export function CategoriesPage() {
  const { categories, transactions, addCategory, deleteCategory } =
    useFinanceStore();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    type: "EXPENSE",
    color: CATEGORY_COLORS[0].value,
  });
  const [formErrors, setFormErrors] = useState<CategoryFormErrors>({});

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    return categories.map((category) => {
      const categoryTransactions = transactions.filter(
        (t) => t.categoryId === category.id
      );

      const monthlyTransactions = categoryTransactions.reduce(
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
        category,
        transactions: categoryTransactions,
        monthlyStats: monthlyTransactions,
      };
    });
  }, [categories, transactions]);

  const handleCreateCategory = useCallback(async () => {
    const errors: CategoryFormErrors = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.type) errors.type = "Please select a category type";
    if (!formData.color) errors.color = "Please select a color";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await addCategory({
        name: formData.name,
        type: formData.type,
        color: formData.color,
      });
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        type: "EXPENSE",
        color: CATEGORY_COLORS[0].value,
      });
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  }, [formData, addCategory]);

  const handleDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory({ id: categoryToDelete });
      setCategoryToDelete(null);
      setIsDeleteModalOpen(false);
      if (selectedCategory === categoryToDelete) {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      // Show error message to user
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  }, [categoryToDelete, deleteCategory, selectedCategory]);

  const tabs = [
    {
      id: "list",
      content: "Categories List",
      panelID: "categories-list-content",
    },
    {
      id: "transactions",
      content: "Category Transactions",
      panelID: "category-transactions-content",
    },
    {
      id: "analytics",
      content: "Monthly Analytics",
      panelID: "category-analytics-content",
    },
  ];

  const categoryRows = categories.map((category) => [
    <div
      key={category.id}
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
          backgroundColor: category.color,
        }}
      />
      <Text as="span">{category.name}</Text>
    </div>,
    category.type,
    <ButtonGroup key={`${category.id}-actions`}>
      <Button onClick={() => setSelectedCategory(category.id)}>
        View Details
      </Button>
      <Button
        tone="critical"
        onClick={() => {
          setCategoryToDelete(category.id);
          setIsDeleteModalOpen(true);
        }}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  const selectedCategoryStats = selectedCategory
    ? categoryStats.find((stats) => stats.category.id === selectedCategory)
    : null;

  const transactionRows =
    selectedCategoryStats?.transactions.map((transaction) => [
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

  const monthlyRows = selectedCategoryStats
    ? Object.entries(selectedCategoryStats.monthlyStats)
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
      title="Categories Management"
      primaryAction={
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          Add Category
        </Button>
      }
    >
      <Card>
        <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
        <Box padding="400">
          {selectedTab === 0 && (
            <DataTable
              columnContentTypes={["text", "text", "text"]}
              headings={["Name", "Type", "Actions"]}
              rows={categoryRows}
            />
          )}

          {selectedTab === 1 && selectedCategory && (
            <>
              <Box paddingBlockEnd="400">
                <Select
                  label="Select Category"
                  options={categories.map((category) => ({
                    label: category.name,
                    value: category.id,
                  }))}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </Box>
              <DataTable
                columnContentTypes={["text", "text", "numeric"]}
                headings={["Date", "Description", "Amount"]}
                rows={transactionRows}
              />
            </>
          )}

          {selectedTab === 2 && selectedCategory && (
            <>
              <Box paddingBlockEnd="400">
                <Select
                  label="Select Category"
                  options={categories.map((category) => ({
                    label: category.name,
                    value: category.id,
                  }))}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
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
        title="Create New Category"
        primaryAction={{
          content: "Create Category",
          onAction: handleCreateCategory,
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
              label="Category Name"
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
              label="Category Type"
              options={[
                { label: "Income", value: "INCOME" },
                { label: "Expense", value: "EXPENSE" },
              ]}
              value={formData.type}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  type: value as CategoryFormData["type"],
                }))
              }
              error={formErrors.type}
            />
          </Box>

          <Box paddingBlockEnd="400">
            <Select
              label="Category Color"
              options={CATEGORY_COLORS}
              value={formData.color}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, color: value }))
              }
              error={formErrors.color}
            />
          </Box>
        </Modal.Section>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Category"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleDeleteCategory,
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
            Are you sure you want to delete this category? This action cannot be
            undone.
            {categoryToDelete && (
              <Text as="p" tone="caution">
                Note: You cannot delete a category that has transactions.
              </Text>
            )}
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
