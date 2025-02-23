import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import { Register, RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "./lib/store/auth-store";

export function App({ router }: { router: Register["router"] }) {
  const { authenticate: _isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // router.invalidate();
    _isAuthenticated().then(() => {
      router.invalidate();
    });
  }, [_isAuthenticated]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AppProvider i18n={enTranslations}>
        <RouterProvider
          router={router}
          context={{
            auth: {
              isAuthenticated: !!user,
              isLoading: false,
            },
          }}
        />
      </AppProvider>
    </GoogleOAuthProvider>
  );
}
