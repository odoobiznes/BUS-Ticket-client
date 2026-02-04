/**
 * BUS-Tickets - Config Context
 * Copyright (c) 2024-2026 IT Enterprise
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppConfig, BackendConfig, OAuthProviderConfig, PaymentConfig } from '@/types';
import {
  DEFAULT_API_URL,
  DEFAULT_INSTANCE_NAME,
  API_VERSION,
  API_TIMEOUT,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  THEME_COLORS,
} from '@/config/environment';

/**
 * Ensure URL uses HTTPS (required for web to avoid mixed content issues)
 */
function ensureHttps(url: string | undefined): string {
  if (!url) return '';
  // On web, always use HTTPS to avoid mixed content issues
  if (Platform.OS === 'web' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

// Default backend configuration - uses environment.ts values
const DEFAULT_BACKEND: BackendConfig = {
  id: 'default',
  name: `${DEFAULT_INSTANCE_NAME} Backend`,
  type: 'odoo',
  url: DEFAULT_API_URL,
  apiUrl: DEFAULT_API_URL,
  apiVersion: API_VERSION,
  timeout: API_TIMEOUT,
  isActive: true,
  features: {
    booking: true,
    payments: true,
    userAccounts: true,
    multiLanguage: true,
    pushNotifications: true,
    offlineMode: true,
    seatSelection: true,
    qrTickets: true,
  },
};

const DEFAULT_OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    id: 'google',
    name: 'Google',
    provider: 'google',
    enabled: true,
    clientId: '', // Set in Odoo
  },
  {
    id: 'facebook',
    name: 'Facebook',
    provider: 'facebook',
    enabled: true,
    clientId: '', // Set in Odoo
  },
  {
    id: 'apple',
    name: 'Apple',
    provider: 'apple',
    enabled: true,
    clientId: '', // Set in Odoo
  },
];

const DEFAULT_PAYMENT_PROVIDERS: PaymentConfig[] = [
  {
    id: 'monobank',
    name: 'Monobank',
    provider: 'monobank',
    enabled: true,
    type: 'card',
    currencies: ['UAH'],
    testMode: false,
  },
  {
    id: 'liqpay',
    name: 'LiqPay',
    provider: 'liqpay',
    enabled: true,
    type: 'card',
    currencies: ['UAH', 'USD', 'EUR'],
    testMode: false,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    provider: 'paypal',
    enabled: true,
    type: 'wallet',
    currencies: ['USD', 'EUR', 'CZK'],
    testMode: false,
  },
  {
    id: 'cash',
    name: 'Cash on Board',
    provider: 'cash',
    enabled: true,
    type: 'cash',
    currencies: ['UAH', 'CZK', 'EUR'],
    testMode: false,
  },
];

const DEFAULT_CONFIG: AppConfig = {
  instanceId: 'default',
  instanceName: DEFAULT_INSTANCE_NAME,
  backend: DEFAULT_BACKEND,
  authProviders: DEFAULT_OAUTH_PROVIDERS,
  emailConfig: {
    enabled: true,
    provider: 'smtp',
    magicLink: true,
    otp: true,
    requireVerification: true,
  },
  paymentProviders: DEFAULT_PAYMENT_PROVIDERS,
  defaultLanguage: DEFAULT_LANGUAGE,
  supportedLanguages: [...SUPPORTED_LANGUAGES],
  defaultCurrency: DEFAULT_CURRENCY,
  supportedCurrencies: [...SUPPORTED_CURRENCIES],
  localization: {
    defaultLanguage: DEFAULT_LANGUAGE,
    supportedLanguages: [...SUPPORTED_LANGUAGES],
    defaultCurrency: DEFAULT_CURRENCY,
    supportedCurrencies: [...SUPPORTED_CURRENCIES],
  },
  theme: {
    primaryColor: THEME_COLORS.primary,
    secondaryColor: THEME_COLORS.secondary,
    mode: 'system',
  },
  legal: {
    companyName: 'IT Enterprise',
    privacyPolicyUrl: `${DEFAULT_API_URL}/privacy`,
    termsOfServiceUrl: `${DEFAULT_API_URL}/terms`,
    termsUrl: `${DEFAULT_API_URL}/terms`,
    gdprCompliant: true,
    cookieConsentRequired: true,
  },
  analytics: {},
  features: {
    enableRegistration: true,
    enableGuestCheckout: true,
    enableSeatSelection: true,
    enablePushNotifications: true,
    enableOfflineMode: true,
    enableBiometricAuth: true,
    enableDarkMode: true,
    maintenanceMode: false,
    offlineMode: true,
  },
};

interface ConfigContextType {
  config: AppConfig;
  isLoading: boolean;
  error: string | null;
  loadConfig: () => Promise<void>;
  loadConfigFromUrl: (url: string) => Promise<void>;
  updateBackend: (backend: BackendConfig) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const CONFIG_STORAGE_KEY = '@bus_tickets_config';

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First try to load from storage
      const storedConfig = await AsyncStorage.getItem(CONFIG_STORAGE_KEY);

      if (storedConfig) {
        const parsed = JSON.parse(storedConfig) as AppConfig;
        // Ensure HTTPS URLs to avoid mixed content issues
        if (parsed.backend) {
          parsed.backend.url = ensureHttps(parsed.backend.url);
          parsed.backend.apiUrl = ensureHttps(parsed.backend.apiUrl);
        }
        setConfig(parsed);

        // Try to refresh from backend
        const apiUrl = ensureHttps(parsed.backend.apiUrl || parsed.backend.url);
        await fetchConfigFromBackend(apiUrl);
      } else {
        // No stored config, try to fetch from default backend
        const apiUrl = DEFAULT_BACKEND.apiUrl || DEFAULT_BACKEND.url;
        await fetchConfigFromBackend(apiUrl);
      }
    } catch (err) {
      console.error('Error loading config:', err);
      setError('Failed to load configuration');
      // Use default config
      setConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfigFromBackend = async (apiUrl: string) => {
    try {
      const secureUrl = ensureHttps(apiUrl);
      const response = await fetch(`${secureUrl}/api/v1/config`);

      if (response.ok) {
        const data = await response.json();
        // API returns data in data.data, not data.config
        const configData = data.data || data.config;
        if (data.success && configData) {
          const newConfig = { ...DEFAULT_CONFIG, ...configData };
          // Ensure backend URLs are HTTPS
          if (newConfig.backend) {
            newConfig.backend.url = ensureHttps(newConfig.backend.url);
            newConfig.backend.apiUrl = ensureHttps(newConfig.backend.apiUrl);
          }
          setConfig(newConfig);
          await AsyncStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
        }
      }
    } catch (err) {
      console.log('Could not fetch config from backend:', err);
      // Continue with stored/default config
    }
  };

  const loadConfigFromUrl = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const secureUrl = ensureHttps(url);
      const response = await fetch(`${secureUrl}/api/v1/config`);

      if (!response.ok) {
        throw new Error('Failed to load config from URL');
      }

      const data = await response.json();

      if (data.success && data.config) {
        const newConfig: AppConfig = {
          ...DEFAULT_CONFIG,
          ...data.config,
          backend: {
            ...DEFAULT_BACKEND,
            url: secureUrl,
            apiUrl: secureUrl,
          },
        };

        setConfig(newConfig);
        await AsyncStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      } else {
        throw new Error('Invalid config response');
      }
    } catch (err) {
      console.error('Error loading config from URL:', err);
      setError('Failed to connect to backend');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBackend = async (backend: BackendConfig) => {
    // Ensure HTTPS URLs
    const secureBackend = {
      ...backend,
      url: ensureHttps(backend.url),
      apiUrl: ensureHttps(backend.apiUrl),
    };
    const newConfig = { ...config, backend: secureBackend };
    setConfig(newConfig);
    await AsyncStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
  };

  const resetToDefault = async () => {
    setConfig(DEFAULT_CONFIG);
    await AsyncStorage.removeItem(CONFIG_STORAGE_KEY);
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        isLoading,
        error,
        loadConfig,
        loadConfigFromUrl,
        updateBackend,
        resetToDefault,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
