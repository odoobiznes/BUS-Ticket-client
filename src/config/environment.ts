/**
 * BUS-Tickets - Environment Configuration
 * Copyright (c) 2024-2026 IT Enterprise
 *
 * This file contains default configuration values.
 * These can be overridden at runtime via the Settings screen.
 *
 * To configure for your environment:
 * 1. Edit the DEFAULT_API_URL to point to your backend
 * 2. Or use the Settings screen in the app to change the API URL
 * 3. Or set EXPO_PUBLIC_API_URL environment variable when building
 */

import Constants from 'expo-constants';

// Environment variables from Expo
const expoPublicApiUrl = Constants.expoConfig?.extra?.apiUrl;
const expoPusblicInstanceName = Constants.expoConfig?.extra?.instanceName;

/**
 * Default API URL
 * Priority:
 * 1. EXPO_PUBLIC_API_URL from environment (build-time)
 * 2. Value set in app.json extra config
 * 3. Hardcoded fallback
 *
 * This can be changed at runtime via Settings screen
 */
export const DEFAULT_API_URL: string =
  expoPublicApiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://symcherabus.eu';

/**
 * Default instance name
 */
export const DEFAULT_INSTANCE_NAME: string =
  expoPusblicInstanceName ||
  process.env.EXPO_PUBLIC_INSTANCE_NAME ||
  'BUS-Tickets';

/**
 * API version
 */
export const API_VERSION = 'v1';

/**
 * API timeout in milliseconds
 */
export const API_TIMEOUT = 30000;

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = ['uk', 'cs', 'en'] as const;

/**
 * Default language
 */
export const DEFAULT_LANGUAGE = 'uk';

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = ['UAH', 'CZK', 'EUR', 'USD'] as const;

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = 'UAH';

/**
 * Theme colors
 */
export const THEME_COLORS = {
  primary: '#e94560',
  secondary: '#0f3460',
} as const;
