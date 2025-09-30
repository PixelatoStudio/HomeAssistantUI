import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthCredentials {
  url: string;
  token: string;
}

interface AuthState {
  isAuthenticated: boolean;
  credentials: AuthCredentials | null;
  error: string | null;

  // Actions
  login: (url: string, token: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setCredentials: (credentials: AuthCredentials) => void;
  clearCredentials: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      credentials: null,
      error: null,

      login: async (url: string, token: string) => {
        try {
          set({ error: null });

          // Clean up URL
          const cleanUrl = url.replace(/\/$/, '');

          // Basic validation - try to connect to HA API
          const response = await fetch(`${cleanUrl}/api/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            mode: 'cors',
          });

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('Invalid access token');
            } else if (response.status === 0 || !response.status) {
              throw new Error('Cannot connect to Home Assistant. Check URL and ensure CORS is configured.');
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          }

          const data = await response.json();

          if (data.message === 'API running.') {
            set({
              isAuthenticated: true,
              credentials: { url: cleanUrl, token },
              error: null,
            });
            return true;
          } else {
            throw new Error('Invalid Home Assistant instance');
          }
        } catch (error) {
          let errorMessage = 'Connection failed';

          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            errorMessage = 'CORS error: Cannot connect to Home Assistant. Please check:\n1. URL is correct\n2. Home Assistant is running\n3. CORS is configured in configuration.yaml';
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          set({
            error: errorMessage,
            isAuthenticated: false,
            credentials: null,
          });
          return false;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          credentials: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setCredentials: (credentials: AuthCredentials) => {
        set({
          isAuthenticated: true,
          credentials,
          error: null,
        });
      },

      clearCredentials: () => {
        set({
          isAuthenticated: false,
          credentials: null,
          error: null,
        });
      },
    }),
    {
      name: 'ha-auth-storage',
    }
  )
);