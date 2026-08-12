import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeStore {
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  applyTheme: () => void;
}

const getStoredThemeMode = (): ThemeMode => {
  const saved = localStorage.getItem('warbisa_theme_mode');
  if (saved === 'light' || saved === 'dark' || saved === 'auto') {
    return saved;
  }
  return 'auto'; // Default auto
};

const calculateEffectiveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';

  // Mode Auto: Calculate current hour based on Warung's configured TimeZone (Default Asia/Jakarta)
  try {
    const user = useAuthStore.getState().user;
    const timeZone = user?.timeZone || 'Asia/Jakarta';

    const now = new Date();
    const timeString = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    }).format(now);

    const currentHour = parseInt(timeString, 10);
    // If time is >= 18 (6 PM) or < 6 (6 AM), automatically switch to dark mode
    if (currentHour >= 18 || currentHour < 6) {
      return 'dark';
    }
  } catch {
    const localHour = new Date().getHours();
    if (localHour >= 18 || localHour < 6) {
      return 'dark';
    }
  }

  return 'light';
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  themeMode: getStoredThemeMode(),
  effectiveTheme: 'light',

  setThemeMode: (mode: ThemeMode) => {
    localStorage.setItem('warbisa_theme_mode', mode);
    set({ themeMode: mode });
    get().applyTheme();
  },

  applyTheme: () => {
    const mode = get().themeMode;
    const effective = calculateEffectiveTheme(mode);

    if (effective === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    set({ effectiveTheme: effective });
  },
}));
