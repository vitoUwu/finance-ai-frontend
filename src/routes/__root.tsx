import { createRootRouteWithContext } from "@tanstack/react-router";
import { RootLayout } from "../components/layout/RootLayout";

interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
