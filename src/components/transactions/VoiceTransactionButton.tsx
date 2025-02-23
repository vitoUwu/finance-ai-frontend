import { Button, Icon, Modal, Spinner, Text } from "@shopify/polaris";
import { MicrophoneIcon } from "@shopify/polaris-icons";
import { useCallback, useState } from "react";
import { useFinanceStore } from "../../lib/store/finance-store";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceTransactionButtonProps {
  isMobile?: boolean;
}

function PreviewTransaction({
  name,
  amount,
  type,
  categoryName,
  accountName,
  paymentMethod,
  details,
  date,
}: {
  name: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryName: string;
  accountName: string;
  paymentMethod: string;
  details?: string;
  date: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <Text as="p" variant="bodyMd">
        Name: {name}
      </Text>
      <Text as="p" variant="bodyMd">
        Amount: ${amount.toFixed(2)}
      </Text>
      <Text as="p" variant="bodyMd">
        Type: {type}
      </Text>
      <Text as="p" variant="bodyMd">
        Category: {categoryName}
      </Text>
      <Text as="p" variant="bodyMd">
        Account: {accountName}
      </Text>
      <Text as="p" variant="bodyMd">
        Payment Method: {paymentMethod}
      </Text>
      {details && (
        <Text as="p" variant="bodyMd">
          Details: {details}
        </Text>
      )}
      <Text as="p" variant="bodyMd">
        Date: {date}
      </Text>
    </div>
  );
}

export function VoiceTransactionButton({
  isMobile = false,
}: VoiceTransactionButtonProps) {
  const {
    addTransaction,
    addCategory,
    getCategoryById,
    categories,
    addAccount,
    getAccountById,
    accounts,
  } = useFinanceStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [suggestedResponse, setSuggestedResponse] = useState<{
    transactions: Array<{
      name: string;
      amount: number;
      type: "INCOME" | "EXPENSE";
      categoryId: string;
      accountId: string;
      paymentMethod: string;
      details?: string;
      date: string;
    }>;
    accounts: Array<{
      name: string;
      color: string;
    }>;
    categories: Array<{
      name: string;
      type: "INCOME" | "EXPENSE";
      color: string;
    }>;
  } | null>(null);

  //useEffect(() => {
  //  const factory = AIProviderFactory.getInstance();

  //  // Register providers with API keys
  //  factory.registerProvider("openai", import.meta.env.VITE_OPENAI_API_KEY);
  //  factory.registerProvider("gemini", import.meta.env.VITE_GEMINI_API_KEY);
  //}, []);

  const processVoiceInput = useCallback(
    async (_text: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        alert("AI feature disabled");
        return;

        //const factory = AIProviderFactory.getInstance();
        // Use Gemini by default, fallback to OpenAI if it fails
        //const provider = factory.getProvider("gemini");

        //const response = await provider.generateTransactions({
        //  voiceInput: text,
        //  context: {
        //    categories,
        //    accounts,
        //  },
        //  language: navigator.language,
        //  date: new Date().toISOString(),
        //});

        //setSuggestedResponse(response);
        //setShowModal(true);
      } catch (error) {
        console.error("Error processing voice input:", error);
        setError("Failed to process voice input. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [categories, accounts]
  );

  const startListening = useCallback(() => {
    setIsListening(true);
    setTranscript("");
    setError(null);

    const Recognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript = transcript;
        } else {
          interimTranscript = transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setError("Failed to recognize speech. Please try again.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript) {
        processVoiceInput(finalTranscript);
      } else if (transcript) {
        processVoiceInput(transcript);
      }
    };

    recognition.start();
  }, [processVoiceInput]);

  const handleCreateTransaction = useCallback(async () => {
    if (!suggestedResponse) return;

    try {
      if (suggestedResponse.accounts.length > 0) {
        await Promise.all(
          suggestedResponse.accounts.map(async (account) => {
            addAccount({ ...account, type: "CHECKING", color: account.color });
          })
        );
      }

      if (suggestedResponse.categories.length > 0) {
        await Promise.all(
          suggestedResponse.categories.map(async (category) => {
            addCategory(category);
          })
        );
      }

      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 300);
      });

      if (suggestedResponse.transactions.length > 0) {
        await Promise.all(
          suggestedResponse.transactions.map(async (transaction) => {
            const categoryId = transaction.categoryId.endsWith(":ID")
              ? categories.find(
                  ({ name }) =>
                    name.toLowerCase() ===
                    transaction.categoryId
                      .split(":ID")[0]
                      .replace(/[<>]/g, "")
                      .toLowerCase()
                )?.id
              : transaction.categoryId;
            const accountId = transaction.accountId.endsWith(":ID")
              ? accounts.find(
                  ({ name }) =>
                    name.toLowerCase() ===
                    transaction.accountId
                      .split(":ID")[0]
                      .replace(/[<>]/g, "")
                      .toLowerCase()
                )?.id
              : transaction.accountId;
            await addTransaction({
              ...transaction,
              categoryId: categoryId ?? transaction.categoryId,
              accountId: accountId ?? transaction.accountId,
            });
          })
        );
      }

      setShowModal(false);
      setSuggestedResponse(null);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      setError("Failed to create transaction. Please try again.");
    }
  }, [suggestedResponse, addTransaction, addCategory, addAccount]);

  if (isMobile) {
    return (
      <>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--p-action-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--p-shadow-500)",
          }}
        >
          <button
            onClick={startListening}
            disabled={isListening || isProcessing}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
            }}
          >
            <div style={{ color: "var(--p-text-on-primary)" }}>
              <Icon
                source={MicrophoneIcon}
                tone={isListening ? "success" : undefined}
              />
            </div>
          </button>
        </div>

        {(isListening || isProcessing) && (
          <div
            style={{
              position: "fixed",
              bottom: "calc(56px + var(--p-space-800))",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "var(--p-space-400)",
              background: "var(--p-surface)",
              borderRadius: "var(--p-border-radius-200)",
              boxShadow: "var(--p-shadow-200)",
              maxWidth: "300px",
              zIndex: 600,
            }}
          >
            {isListening && (
              <Text as="p" variant="bodySm">
                {transcript || "Listening..."}
              </Text>
            )}
            {isProcessing && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Spinner size="small" />
                <Text as="p" variant="bodySm">
                  Processing your request...
                </Text>
              </div>
            )}
            {error && (
              <Text as="p" tone="critical" variant="bodySm">
                {error}
              </Text>
            )}
          </div>
        )}

        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Confirm Transaction"
          primaryAction={{
            content: "Create Transaction",
            onAction: handleCreateTransaction,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setShowModal(false),
            },
          ]}
        >
          <Modal.Section>
            {suggestedResponse &&
              suggestedResponse.transactions.map(
                ({ accountId, categoryId, ...transaction }, index) => (
                  <PreviewTransaction
                    key={index}
                    {...{
                      ...transaction,
                      categoryName:
                        (categoryId.endsWith(":ID")
                          ? suggestedResponse.categories.find(
                              ({ name }) =>
                                name.toLowerCase() ===
                                categoryId.split(":ID")[0].toLowerCase()
                            )?.name
                          : getCategoryById(categoryId)?.name) ?? "Unknown",
                      accountName:
                        (accountId.endsWith(":ID")
                          ? suggestedResponse.accounts.find(
                              ({ name }) =>
                                name.toLowerCase() ===
                                accountId.split(":ID")[0].toLowerCase()
                            )?.name
                          : getAccountById(accountId)?.name) ?? "Unknown",
                    }}
                  />
                )
              )}
          </Modal.Section>
        </Modal>
      </>
    );
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "var(--p-space-800)",
          right: "var(--p-space-400)",
          zIndex: 1000,
        }}
      >
        <Button
          icon={<Icon source={MicrophoneIcon} />}
          onClick={startListening}
          disabled={isListening || isProcessing}
          tone={isListening ? "success" : undefined}
          variant="primary"
        >
          {isListening
            ? "Listening..."
            : isProcessing
              ? "Processing..."
              : "Add Transaction"}
        </Button>
      </div>

      {(isListening || isProcessing) && (
        <div
          style={{
            position: "fixed",
            bottom: "var(--p-space-2400)",
            right: "var(--p-space-400)",
            padding: "var(--p-space-400)",
            background: "var(--p-surface)",
            borderRadius: "var(--p-border-radius-200)",
            boxShadow: "var(--p-shadow-200)",
            maxWidth: "300px",
            zIndex: 1000,
          }}
        >
          {isListening && (
            <Text as="p" variant="bodySm">
              {transcript || "Listening..."}
            </Text>
          )}
          {isProcessing && (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Spinner size="small" />
              <Text as="p" variant="bodySm">
                Processing your request...
              </Text>
            </div>
          )}
          {error && (
            <Text as="p" tone="critical" variant="bodySm">
              {error}
            </Text>
          )}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Confirm Transaction"
        primaryAction={{
          content: "Create Transaction",
          onAction: handleCreateTransaction,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowModal(false),
          },
        ]}
      >
        <Modal.Section>
          {suggestedResponse &&
            suggestedResponse.transactions.map(
              ({ accountId, categoryId, ...transaction }, index) => (
                <PreviewTransaction
                  key={index}
                  {...{
                    ...transaction,
                    categoryName:
                      (categoryId.endsWith(":ID")
                        ? suggestedResponse.categories.find(
                            ({ name }) =>
                              name.toLowerCase() ===
                              categoryId.split(":ID")[0].toLowerCase()
                          )?.name
                        : getCategoryById(categoryId)?.name) ?? "Unknown",
                    accountName:
                      (accountId.endsWith(":ID")
                        ? suggestedResponse.accounts.find(
                            ({ name }) =>
                              name.toLowerCase() ===
                              accountId.split(":ID")[0].toLowerCase()
                          )?.name
                        : getAccountById(accountId)?.name) ?? "Unknown",
                  }}
                />
              )
            )}
        </Modal.Section>
      </Modal>
    </>
  );
}
