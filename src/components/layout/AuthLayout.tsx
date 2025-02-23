import { Box, Card, Page } from "@shopify/polaris";
import { Outlet } from "@tanstack/react-router";

export function AuthLayout() {
  return (
    <Page>
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          paddingTop: "var(--p-space-800)",
        }}
      >
        <Card>
          <Box padding="400">
            <Outlet />
          </Box>
        </Card>
      </div>
    </Page>
  );
}
