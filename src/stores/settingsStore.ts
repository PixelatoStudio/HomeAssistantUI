import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  accentColor: string;
  showBackgroundImage: boolean;
  customBackgroundUrl: string;

  setTheme: (theme: 'light' | 'dark') => void;
  setAccentColor: (color: string) => void;
  setShowBackgroundImage: (show: boolean) => void;
  setCustomBackgroundUrl: (url: string) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  theme: 'dark' as const,
  accentColor: '82 39% 45%', // Olive green
  showBackgroundImage: true,
  customBackgroundUrl: '',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      setAccentColor: (color) => {
        set({ accentColor: color });
        // Apply accent color to document
        document.documentElement.style.setProperty('--accent', color);
      },

      setShowBackgroundImage: (show) => {
        set({ showBackgroundImage: show });
      },

      setCustomBackgroundUrl: (url) => {
        set({ customBackgroundUrl: url });
      },

      resetSettings: () => {
        set(defaultSettings);
        // Reset theme
        if (defaultSettings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        // Reset accent color
        document.documentElement.style.setProperty('--accent', defaultSettings.accentColor);
      },
    }),
    {
      name: 'app-settings-storage',
    }
  )
);

// Initialize settings on load
if (typeof window !== 'undefined') {
  const store = useSettingsStore.getState();

  // Apply theme
  if (store.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Apply accent color
  document.documentElement.style.setProperty('--accent', store.accentColor);
}