import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { Employee, Tokens } from '@/lib/api';

interface AuthState {
  user: Employee | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,

      initialize: () => {
        const state = get();
        // Check if user and tokens exist in persisted state
        if (state.user && state.tokens) {
          set({ isAuthenticated: true });
          // Restore access_token to localStorage for axios interceptor
          localStorage.setItem('access_token', state.tokens.access);
          localStorage.setItem('refresh_token', state.tokens.refresh);
        }
        set({ isLoading: false });
      },

      login: async (email: string, password: string) => {
        const response = await api.login({ email, password });

        set({
          user: response.data.employee,
          tokens: response.data.tokens,
          isAuthenticated: true,
        });

        // Store tokens in localStorage for axios interceptor
        localStorage.setItem('access_token', response.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        });

        // Remove tokens from localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
      }),
    }
  )
);
