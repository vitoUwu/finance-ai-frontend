import {
  Box,
  Card,
  Page,
  Text,
  Popover,
  ActionList,
  Modal,
} from "@shopify/polaris";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
} from "date-fns";
import { useMemo, useState, useCallback } from "react";
import { useFinanceStore } from "../lib/store/finance-store";
import { Transaction } from "../types/finance";

interface DayTransactions {
  income: number;
  expenses: number;
  count: number;
  transactions: Transaction[];
}

export function CalendarPage() {
  const { transactions, deleteTransaction } = useFinanceStore();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Generate calendar days
  const days = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthStart, monthEnd]);

  // Group transactions by day
  const transactionsByDay = useMemo(() => {
    const dayMap = new Map<string, DayTransactions>();

    // Initialize all days
    days.forEach((day) => {
      dayMap.set(format(day, "yyyy-MM-dd"), {
        income: 0,
        expenses: 0,
        count: 0,
        transactions: [],
      });
    });

    // Add transactions to respective days
    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const day = format(transactionDate, "yyyy-MM-dd");
      const currentDay = dayMap.get(day);

      if (currentDay && isSameMonth(transactionDate, today)) {
        if (transaction.type === "INCOME") {
          currentDay.income += transaction.amount;
        } else {
          currentDay.expenses += transaction.amount;
        }
        currentDay.count += 1;
        currentDay.transactions.push(transaction);
        dayMap.set(day, currentDay);
      }
    });

    return dayMap;
  }, [transactions, days, today]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, transaction: Transaction) => {
      event.preventDefault();
      console.log(event);
      setContextMenuPosition({ left: event.clientX, top: event.clientY });
      setSelectedTransaction(transaction);
    },
    []
  );

  const handleDelete = useCallback(async () => {
    if (selectedTransaction) {
      try {
        await deleteTransaction(selectedTransaction.id);
        setSelectedTransaction(null);
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error("Failed to delete transaction:", error);
      }
    }
  }, [selectedTransaction, deleteTransaction]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuPosition(null);
    setSelectedTransaction(null);
  }, []);

  return (
    <Page title={format(today, "MMMM yyyy")}>
      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "1px",
            background: "var(--p-border-subdued)",
          }}
        >
          {/* Week day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Box key={day} padding="300" background="bg-surface">
              <Text variant="headingSm" as="p" alignment="center">
                {day}
              </Text>
            </Box>
          ))}

          {/* Calendar days */}
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayData = transactionsByDay.get(dayKey);
            const isCurrentDay = isToday(day);

            return (
              <Box
                key={dayKey}
                padding="300"
                background={isCurrentDay ? "bg-surface-selected" : "bg-surface"}
              >
                <div style={{ minHeight: "80px" }}>
                  <Text
                    variant="bodySm"
                    as="p"
                    tone={isCurrentDay ? "success" : undefined}
                  >
                    {format(day, "d")}
                  </Text>

                  {dayData && dayData.count > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        {dayData.transactions.map((transaction) => (
                          <Card
                            key={transaction.id}
                            padding="200"
                            roundedAbove="xs"
                          >
                            <button
                              key={transaction.id}
                              onClick={(e) => e.preventDefault()}
                              onContextMenu={(e) =>
                                handleContextMenu(e, transaction)
                              }
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                width: "100%",
                                textAlign: "left",
                                cursor: "context-menu",
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <Text variant="bodySm" as="span" tone="subdued">
                                {transaction.name}{" "}
                              </Text>
                              <Text
                                variant="bodySm"
                                as="span"
                                tone={
                                  transaction.type === "EXPENSE"
                                    ? "critical"
                                    : "success"
                                }
                              >
                                ${transaction.amount.toFixed(2)}
                              </Text>
                            </button>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Box>
            );
          })}
        </div>
      </Card>

      {contextMenuPosition && selectedTransaction && (
        <div
          style={{
            position: "fixed",
            left: `${contextMenuPosition.left}px`,
            top: `${contextMenuPosition.top}px`,
            zIndex: 999,
          }}
        >
          <Popover
            active
            onClose={handleCloseContextMenu}
            activator={<div style={{ display: "none" }} />}
          >
            <ActionList
              actionRole="menuitem"
              items={[
                {
                  content: "Delete Transaction",
                  destructive: true,
                  onAction: () => {
                    setIsDeleteModalOpen(true);
                    setContextMenuPosition(null);
                  },
                },
              ]}
            />
          </Popover>
        </div>
      )}

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
