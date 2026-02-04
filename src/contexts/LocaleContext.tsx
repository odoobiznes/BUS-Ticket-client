/**
 * BUS-Tickets - Locale Context
 * Copyright (c) 2024-2026 IT Enterprise
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import {
  translations,
  Translations,
  SupportedLanguage,
  languageNames,
  languageFlags,
} from '@/i18n/translations';

interface LocaleContextType {
  locale: SupportedLanguage;
  t: Translations;
  setLocale: (locale: SupportedLanguage) => void;
  availableLanguages: SupportedLanguage[];
  getLanguageName: (locale: SupportedLanguage) => string;
  getLanguageFlag: (locale: SupportedLanguage) => string;
  formatDate: (date: Date, format?: 'short' | 'long' | 'full') => string;
  formatTime: (date: Date) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatNumber: (num: number) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = '@bus_tickets_locale';
const AVAILABLE_LANGUAGES: SupportedLanguage[] = ['cs', 'en', 'uk'];

// Get device locale and map to supported language
function getDeviceLocale(): SupportedLanguage {
  const deviceLocale = Localization.locale;
  const languageCode = deviceLocale.split('-')[0].toLowerCase();

  if (languageCode === 'cs' || languageCode === 'sk') return 'cs';
  if (languageCode === 'uk' || languageCode === 'ru') return 'uk';
  return 'en';
}

// Date format options per locale
const dateLocaleMap: Record<SupportedLanguage, string> = {
  cs: 'cs-CZ',
  en: 'en-GB',
  uk: 'uk-UA',
};

// Currency symbols
const currencySymbols: Record<string, string> = {
  CZK: 'Kč',
  UAH: '₴',
  EUR: '€',
  USD: '$',
  GBP: '£',
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLanguage>('cs');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocale();
  }, []);

  const loadLocale = async () => {
    try {
      const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      if (savedLocale && AVAILABLE_LANGUAGES.includes(savedLocale as SupportedLanguage)) {
        setLocaleState(savedLocale as SupportedLanguage);
      } else {
        // Use device locale as default
        const deviceLocale = getDeviceLocale();
        setLocaleState(deviceLocale);
      }
    } catch (error) {
      console.error('Error loading locale:', error);
      setLocaleState(getDeviceLocale());
    } finally {
      setIsLoading(false);
    }
  };

  const setLocale = useCallback(async (newLocale: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      setLocaleState(newLocale);
    } catch (error) {
      console.error('Error saving locale:', error);
    }
  }, []);

  const getLanguageName = useCallback((lang: SupportedLanguage): string => {
    return languageNames[lang] || lang;
  }, []);

  const getLanguageFlag = useCallback((lang: SupportedLanguage): string => {
    return languageFlags[lang] || '';
  }, []);

  const formatDate = useCallback((date: Date, format: 'short' | 'long' | 'full' = 'short'): string => {
    const localeString = dateLocaleMap[locale];

    const optionsMap: Record<'short' | 'long' | 'full', Intl.DateTimeFormatOptions> = {
      short: { day: 'numeric', month: 'numeric', year: 'numeric' },
      long: { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    };

    return date.toLocaleDateString(localeString, optionsMap[format]);
  }, [locale]);

  const formatTime = useCallback((date: Date): string => {
    const localeString = dateLocaleMap[locale];
    return date.toLocaleTimeString(localeString, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [locale]);

  const formatCurrency = useCallback((amount: number, currency: string = 'CZK'): string => {
    const symbol = currencySymbols[currency] || currency;
    const formatted = amount.toLocaleString(dateLocaleMap[locale], {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    // CZK and UAH typically have symbol after the number
    if (currency === 'CZK' || currency === 'UAH') {
      return `${formatted} ${symbol}`;
    }
    return `${symbol}${formatted}`;
  }, [locale]);

  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString(dateLocaleMap[locale]);
  }, [locale]);

  if (isLoading) {
    return null;
  }

  const t = translations[locale];

  return (
    <LocaleContext.Provider
      value={{
        locale,
        t,
        setLocale,
        availableLanguages: AVAILABLE_LANGUAGES,
        getLanguageName,
        getLanguageFlag,
        formatDate,
        formatTime,
        formatCurrency,
        formatNumber,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Hook for translations only (shorter syntax)
export function useTranslations() {
  const { t } = useLocale();
  return t;
}
