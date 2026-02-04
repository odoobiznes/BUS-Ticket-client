/**
 * BUS-Tickets - API Context
 * Copyright (c) 2024-2026 IT Enterprise
 *
 * Provides a shared API client instance across the app
 */

import React, { createContext, useContext, useMemo, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusTicketsApiClient, createApiClient } from '@bus-tickets/api-client';
import type { AuthTokens } from '@/types';
import { useConfig } from './ConfigContext';

interface ApiContextType {
  api: BusTicketsApiClient;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

const TOKEN_KEY = 'bus_tickets_auth_tokens';

// Platform-safe storage functions
const storage = {
  async getItem(key: string): Promise<string | null> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return null; // Server-side rendering
    }

    if (Platform.OS === 'web') {
      // Use localStorage on web
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    // Use AsyncStorage on native (SecureStore would require native modules)
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') {
      return; // Server-side rendering
    }

    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore storage errors
      }
      return;
    }

    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Ignore storage errors
    }
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') {
      return; // Server-side rendering
    }

    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage errors
      }
      return;
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  },
};

export function ApiProvider({ children }: { children: ReactNode }) {
  const { config } = useConfig();

  const api = useMemo(() => {
    const client = createApiClient({
      baseUrl: config.backend.apiUrl || config.backend.url,
      timeout: config.backend.timeout ?? 30000,
      onTokenRefresh: async (tokens: AuthTokens) => {
        // Save refreshed tokens
        await storage.setItem(
          TOKEN_KEY,
          JSON.stringify({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: Date.now() + tokens.expiresIn * 1000,
          })
        );
      },
      onAuthError: async () => {
        // Clear tokens on auth error
        await storage.removeItem(TOKEN_KEY);
      },
    });

    return client;
  }, [config.backend.apiUrl, config.backend.url, config.backend.timeout]);

  // Load stored tokens on mount (client-side only)
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const storedTokens = await storage.getItem(TOKEN_KEY);
        if (storedTokens) {
          const parsed = JSON.parse(storedTokens);
          if (parsed.expiresAt > Date.now()) {
            api.setTokens({
              accessToken: parsed.accessToken,
              refreshToken: parsed.refreshToken,
              expiresIn: Math.floor((parsed.expiresAt - Date.now()) / 1000),
              tokenType: 'Bearer',
            });
          }
        }
      } catch (error) {
        console.warn('Failed to load stored tokens:', error);
      }
    };

    loadTokens();
  }, [api]);

  return (
    <ApiContext.Provider value={{ api }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context.api;
}
