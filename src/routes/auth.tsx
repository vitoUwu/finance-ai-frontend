import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthLayout } from "../components/layout/AuthLayout";

export const Route = createFileRoute("/auth")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: AuthLayout,
});
