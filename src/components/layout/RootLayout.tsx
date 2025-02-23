import {
  Frame,
  Icon,
  Navigation,
  Text,
  useBreakpoints,
} from "@shopify/polaris";
import {
  CalendarIcon,
  CollectionIcon,
  DataPresentationIcon,
  ExitIcon,
  HomeIcon,
  OrderIcon,
  WalletIcon,
} from "@shopify/polaris-icons";
import { Outlet, useRouter } from "@tanstack/react-router";
import { useAuthStore } from "../../lib/store/auth-store";
import { VoiceTransactionButton } from "../transactions/VoiceTransactionButton";

export function RootLayout() {
  const { logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const currentPath = router.state.location.pathname;
  const { smDown } = useBreakpoints();

  const navigationItems = [
    {
      label: "Home",
      icon: HomeIcon,
      url: "/",
      selected: currentPath === "/",
    },
    {
      label: "Calendar",
      icon: CalendarIcon,
      url: "/calendar",
      selected: currentPath === "/calendar",
    },
    {
      label: "Transactions",
      icon: OrderIcon,
      url: "/transactions",
      selected: currentPath === "/transactions",
    },
    {
      label: "Reports",
      icon: DataPresentationIcon,
      url: "/reports",
      selected: currentPath === "/reports",
    },
    {
      label: "Accounts",
      icon: WalletIcon,
      url: "/accounts",
      selected: currentPath === "/accounts",
    },
    {
      label: "Categories",
      icon: CollectionIcon,
      url: "/categories",
      selected: currentPath === "/categories",
    },
  ];

  const mobileNavigationItems = [
    navigationItems[0],
    navigationItems[1],
    null, // Voice button placeholder
    navigationItems[2],
    {
      label: "More",
      icon: CollectionIcon,
      url: "/more",
      selected: ["/reports", "/accounts", "/categories"].includes(currentPath),
    },
  ];

  const navigationMarkup = smDown ? null : (
    <Navigation location={currentPath}>
      <Navigation.Section items={navigationItems} />
      <Navigation.Section
        items={[
          {
            label: "Logout",
            icon: ExitIcon,
            onClick: logout,
          },
        ]}
      />
    </Navigation>
  );

  return (
    <Frame navigation={navigationMarkup}>
      <div style={{ paddingBottom: smDown ? "60px" : 0 }}>
        <Outlet />
      </div>
      {!smDown && isAuthenticated && <VoiceTransactionButton />}
      {smDown && (
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "var(--p-color-bg-surface)",
            borderTop: "1px solid var(--p-border-subdued)",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            height: "56px",
            zIndex: 500,
          }}
        >
          {mobileNavigationItems.map((item) => {
            if (item === null) {
              if (!isAuthenticated) {
                return null;
              }

              return (
                <div
                  key="voice-button"
                  style={{
                    marginTop: "-28px",
                    position: "relative",
                    width: "64px",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <VoiceTransactionButton isMobile />
                </div>
              );
            }

            return (
              <button
                key={item.url}
                onClick={() => router.navigate({ to: item.url })}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  padding: "var(--p-space-1)",
                  cursor: "pointer",
                  width: "64px",
                  height: "100%",
                  gap: "2px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: item.selected
                      ? "var(--p-action-primary)"
                      : "var(--p-text-subdued)",
                    width: "20px",
                    height: "20px",
                  }}
                >
                  <Icon source={item.icon} />
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    lineHeight: "1",
                  }}
                >
                  <Text
                    as="span"
                    variant="bodySm"
                    tone={item.selected ? "success" : "subdued"}
                  >
                    {item.label}
                  </Text>
                </div>
              </button>
            );
          })}
        </nav>
      )}
    </Frame>
  );
}
