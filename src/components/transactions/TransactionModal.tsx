import {
  Box,
  DatePicker,
  Modal,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import { useFinanceStore } from "../../lib/store/finance-store";
import { TransactionType } from "../../types/finance";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
}

export function TransactionModal({ open, onClose }: TransactionModalProps) {
  const { categories, accounts, addTransaction } = useFinanceStore();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [details, setDetails] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    amount?: string;
    categoryId?: string;
    accountId?: string;
    paymentMethod?: string;
  }>({});
  const [{ month, year }, setDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [selectedDate, setSelectedDate] = useState(new Date());

  const validateTransaction = useCallback(() => {
    const errors: {
      name?: string;
      amount?: string;
      categoryId?: string;
      accountId?: string;
      paymentMethod?: string;
    } = {};

    if (!name) errors.name = "Name is required";
    if (!amount) errors.amount = "Amount is required";
    if (!categoryId) errors.categoryId = "Category is required";
    if (!accountId) errors.accountId = "Account is required";
    if (!paymentMethod) errors.paymentMethod = "Payment method is required";

    return { hasErrors: Object.keys(errors).length > 0, errors };
  }, [name, amount, categoryId, accountId, paymentMethod]);

  const handleSubmit = useCallback(async () => {
    const { hasErrors, errors } = validateTransaction();
    if (hasErrors) {
      setErrors(errors);
      return;
    }

    try {
      await addTransaction({
        name,
        amount: parseFloat(amount),
        type: type || "EXPENSE",
        categoryId,
        accountId,
        details,
        paymentMethod,
        date: selectedDate.toISOString(),
      });
      handleCancel();
    } catch (error) {
      // TODO: Show error message
      console.error("Failed to create transaction:", error);
    }
  }, [
    name,
    amount,
    type,
    categoryId,
    accountId,
    details,
    paymentMethod,
    selectedDate,
    addTransaction,
  ]);

  const handleCancel = useCallback(() => {
    setName("");
    setAmount("");
    setType(null);
    setCategoryId("");
    setAccountId("");
    setDetails("");
    setPaymentMethod("");
    setDate({
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    });
    setSelectedDate(new Date());
    onClose();
  }, [onClose]);

  const handleMonthChange = useCallback(
    (month: number, year: number) => setDate({ month, year }),
    []
  );

  const paymentMethods = [
    { label: "Credit Card", value: "CREDIT_CARD" },
    { label: "Debit Card", value: "DEBIT_CARD" },
    { label: "Cash", value: "CASH" },
    { label: "Bank Transfer", value: "BANK_TRANSFER" },
    { label: "Digital Wallet", value: "DIGITAL_WALLET" },
  ];

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="New Transaction"
      primaryAction={{
        content: "Create",
        onAction: handleSubmit,
        disabled:
          !name || !amount || !categoryId || !accountId || !paymentMethod,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: handleCancel,
        },
      ]}
    >
      <Modal.Section>
        <Box paddingBlockEnd="400">
          <TextField
            label="Transaction Name"
            value={name}
            onChange={setName}
            autoComplete="off"
            error={errors.name}
          />
        </Box>

        <Box paddingBlockEnd="400">
          <Select
            label="Type"
            options={[
              { label: "Select Type", value: "", disabled: true },
              { label: "Expense", value: "EXPENSE" },
              { label: "Income", value: "INCOME" },
            ]}
            value={type || ""}
            onChange={(value) => setType(value as TransactionType)}
          />
        </Box>

        <Box paddingBlockEnd="400">
          <TextField
            label="Amount"
            value={amount}
            onChange={setAmount}
            type="number"
            prefix="$"
            autoComplete="off"
            error={errors.amount}
          />
        </Box>

        <Box paddingBlockEnd="400">
          <Select
            label="Category"
            options={[
              {
                label: "Select Category",
                value: "",
                disabled: true,
              },
              ...categories.map((category) => ({
                label: category.name,
                value: category.id,
              })),
            ]}
            value={categoryId}
            onChange={setCategoryId}
            error={errors.categoryId}
          />
        </Box>

        <Box paddingBlockEnd="400">
          <Select
            label="Account"
            options={[
              {
                label: "Select Account",
                value: "",
                disabled: true,
              },
              ...accounts.map((account) => ({
                label: account.name,
                value: account.id,
              })),
            ]}
            value={accountId}
            onChange={setAccountId}
            error={errors.accountId}
          />
        </Box>

        <Box paddingBlockEnd="400">
          <Select
            label="Payment Method"
            options={[
              {
                label: "Select Payment Method",
                value: "",
                disabled: true,
              },
              ...paymentMethods,
            ]}
            value={paymentMethod}
            onChange={setPaymentMethod}
            error={errors.paymentMethod}
          />
        </Box>

        <Box paddingBlockEnd="400">
          <Text as="p" variant="bodyMd">
            Date
          </Text>
          <DatePicker
            month={month}
            year={year}
            selected={selectedDate}
            onMonthChange={handleMonthChange}
            onChange={(dates) => {
              const date = Array.isArray(dates) ? dates[0] : dates;
              if (date) {
                setSelectedDate(date);
              }
            }}
          />
        </Box>

        <Box paddingBlockEnd="400">
          <TextField
            label="Details (Optional)"
            value={details}
            onChange={setDetails}
            multiline={3}
            autoComplete="off"
          />
        </Box>
      </Modal.Section>
    </Modal>
  );
}
