import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../../types/finance";
import { userApi } from "../api/finance";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authenticate: () => Promise<boolean>;

  logout: () => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      authenticate: async () => {
        try {
          const authToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1];

          if (get().user && authToken) {
            return true;
          }

          const user = await userApi.getMe();

          set({ user, isAuthenticated: true });

          return !!authToken;
        } catch (error) {
          set({
            isAuthenticated: false,
            error: "Failed to authenticate",
            user: null,
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setError: (error) => set({ error }),
    }),
    {
      name: "finance-ai-auth", // unique name for localStorage key
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }), // only persist these fields
    }
  )
);
