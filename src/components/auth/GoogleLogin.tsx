import { Button } from "@shopify/polaris";
import { LogoGoogleIcon } from "@shopify/polaris-icons";

export function GoogleLogin() {
  return (
    <Button
      onClick={() =>
        (window.location.href =
          import.meta.env.VITE_BACKEND_URL + "/auth/google")
      }
      icon={LogoGoogleIcon}
      variant="primary"
    >
      Sign in with Google
    </Button>
  );
}
