import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { type AppTheme, type ThemeMode, themeForMode } from '@/constants/theme';

const STORAGE_KEY = '@dtm/theme-mode';

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function readStoredMode(): Promise<ThemeMode | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Module natif indisponible (build iOS à refaire, web, etc.)
  }
  return null;
}

function persistMode(mode: ThemeMode) {
  AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    readStoredMode().then((stored) => {
      if (stored) setModeState(stored);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    persistMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      theme: themeForMode(mode),
      mode,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
