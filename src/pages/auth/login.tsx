import { Box, Text } from "@shopify/polaris";
import { GoogleLogin } from "../../components/auth/GoogleLogin";

export function LoginPage() {
  return (
    <Box>
      <Box paddingBlockEnd="400">
        <Text as="h1" variant="headingLg" alignment="center">
          Welcome to FinanceAI
        </Text>
      </Box>
      <Box paddingBlockEnd="400">
        <Text as="p" variant="bodyMd" alignment="center" tone="subdued">
          Sign in with your Google account to continue
        </Text>
      </Box>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <GoogleLogin />
      </div>
    </Box>
  );
}
