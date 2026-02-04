/**
 * BUS-Tickets - Theme Context
 * Copyright (c) 2024-2026 IT Enterprise
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

const lightColors: ThemeColors = {
  primary: '#e94560',
  primaryDark: '#d63850',
  secondary: '#0f3460',
  background: '#f8f9fa',
  card: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6c757d',
  border: '#e9ecef',
  error: '#dc3545',
  success: '#28a745',
  warning: '#ffc107',
};

const darkColors: ThemeColors = {
  primary: '#e94560',
  primaryDark: '#d63850',
  secondary: '#16213e',
  background: '#1a1a2e',
  card: '#16213e',
  text: '#ffffff',
  textSecondary: '#adb5bd',
  border: '#2d3748',
  error: '#f56565',
  success: '#48bb78',
  warning: '#ed8936',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@bus_tickets_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeMode(savedTheme as 'light' | 'dark' | 'system');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTheme = async (mode: 'light' | 'dark' | 'system') => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const isDark = themeMode === 'system'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
    saveTheme(newMode);
  };

  const setTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    saveTheme(mode);
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setTheme, themeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
