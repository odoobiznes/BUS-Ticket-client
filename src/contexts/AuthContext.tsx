/**
 * BUS-Tickets - Auth Context
 * Copyright (c) 2024-2026 IT Enterprise
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from './ApiContext';
import type { User, AuthTokens } from '@/types';

// Dynamic import for native-only modules
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
if (Platform.OS !== 'web') {
  LocalAuthentication = require('expo-local-authentication');
}

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook' | 'apple', idToken: string) => Promise<void>;
  signInWithOTP: (phone: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestOTP: (email?: string, phone?: string) => Promise<void>;
  checkBiometric: () => Promise<boolean>;
  authenticateWithBiometric: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'bus_tickets_auth_tokens';
const USER_KEY = 'bus_tickets_user';

// Platform-safe storage functions
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null; // Server-side rendering
    }
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
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
      return;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedTokens = await storage.getItem(TOKEN_KEY);
      const storedUser = await storage.getItem(USER_KEY);

      if (storedTokens && storedUser) {
        const parsedTokens: StoredAuth = JSON.parse(storedTokens);
        const parsedUser: User = JSON.parse(storedUser);

        // Check if token is expired
        if (parsedTokens.expiresAt > Date.now()) {
          // Set tokens in API client
          api.setTokens({
            accessToken: parsedTokens.accessToken,
            refreshToken: parsedTokens.refreshToken,
            expiresIn: Math.floor((parsedTokens.expiresAt - Date.now()) / 1000),
            tokenType: 'Bearer',
          });
          setUser(parsedUser);

          // Refresh user data in background
          refreshUserFromApi().catch(console.error);
        } else {
          // Token expired, try to refresh
          try {
            api.setTokens({
              accessToken: parsedTokens.accessToken,
              refreshToken: parsedTokens.refreshToken,
              expiresIn: 0,
              tokenType: 'Bearer',
            });
            await refreshUserFromApi();
          } catch (error) {
            await clearAuth();
          }
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserFromApi = async () => {
    const userData = await api.getCurrentUser();
    setUser(userData);
    await storage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const saveAuth = async (newUser: User, tokens: AuthTokens) => {
    const storedAuth: StoredAuth = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    };
    await storage.setItem(TOKEN_KEY, JSON.stringify(storedAuth));
    await storage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const clearAuth = async () => {
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(USER_KEY);
    api.clearTokens();
    setUser(null);
  };

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login({
        provider: 'email',
        email,
        password,
      });

      await saveAuth(response.user, response.tokens);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const signUp = useCallback(async (data: { email: string; password: string; name: string; phone?: string }) => {
    setIsLoading(true);
    try {
      const response = await api.register(data);
      await saveAuth(response.user, response.tokens);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'facebook' | 'apple', idToken: string) => {
    setIsLoading(true);
    try {
      const response = await api.login({
        provider,
        idToken,
      });

      await saveAuth(response.user, response.tokens);
    } catch (error) {
      console.error('OAuth error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const signInWithOTP = useCallback(async (phone: string, code: string) => {
    setIsLoading(true);
    try {
      const response = await api.login({
        provider: 'phone',
        phone,
        otp: code,
      });

      await saveAuth(response.user, response.tokens);
    } catch (error) {
      console.error('OTP error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const requestOTP = useCallback(async (email?: string, phone?: string) => {
    try {
      await api.requestOtp(email, phone);
    } catch (error) {
      console.error('OTP request error:', error);
      throw error;
    }
  }, [api]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearAuth();
      setIsLoading(false);
    }
  }, [api]);

  const refreshUser = useCallback(async () => {
    if (user) {
      await refreshUserFromApi();
    }
  }, [user, api]);

  const checkBiometric = async (): Promise<boolean> => {
    // Biometric not available on web
    if (Platform.OS === 'web' || !LocalAuthentication) {
      return false;
    }
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    // Biometric not available on web
    if (Platform.OS === 'web' || !LocalAuthentication) {
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access BUS-Tickets',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signInWithOAuth,
        signInWithOTP,
        signOut,
        requestOTP,
        checkBiometric,
        authenticateWithBiometric,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
