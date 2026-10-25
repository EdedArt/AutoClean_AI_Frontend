import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import {
  ColorPalette,
  darkPalette,
  darkPhaseColors,
  lightPalette,
  lightPhaseColors,
  PhaseColorMap,
  radius,
  shadows,
  spacing,
  ThemeMode,
  typography,
} from './tokens';

const THEME_STORAGE_KEY = 'autoclean.theme';

export interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorPalette;
  phaseColors: PhaseColorMap;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  isThemeReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    async function loadSavedTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setModeState(saved);
        } else {
          setModeState('light');
        }
      } catch {
        setModeState('light');
      } finally {
        setIsThemeReady(true);
      }
    }
    loadSavedTheme();
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const isDark = mode === 'dark';
  const colors = isDark ? darkPalette : lightPalette;
  const phaseColors = isDark ? darkPhaseColors : lightPhaseColors;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        colors,
        phaseColors,
        spacing,
        radius,
        typography,
        shadows,
        toggleTheme,
        setMode,
        isThemeReady,
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
