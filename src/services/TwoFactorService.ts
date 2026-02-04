/**
 * BUS-Tickets - Two-Factor Authentication Service
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TwoFactorMethod = 'totp' | 'sms' | 'email';

interface TwoFactorConfig {
  enabled: boolean;
  method: TwoFactorMethod;
  phone?: string;
  email?: string;
}

interface TwoFactorSetupResult {
  success: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  error?: string;
}

interface TwoFactorVerifyResult {
  success: boolean;
  error?: string;
}

const TWO_FACTOR_KEY = '@bus_tickets_2fa';

class TwoFactorService {
  private apiUrl: string = '';

  /**
   * Configure the API URL
   */
  setApiUrl(url: string) {
    this.apiUrl = url;
  }

  /**
   * Ensure HTTPS for web
   */
  private ensureHttps(url: string): string {
    if (!url) return url;
    if (Platform.OS === 'web' && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  }

  /**
   * Check if 2FA is enabled for the current user
   */
  async isEnabled(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(TWO_FACTOR_KEY);
      if (stored) {
        const config: TwoFactorConfig = JSON.parse(stored);
        return config.enabled;
      }
      return false;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }

  /**
   * Get 2FA configuration
   */
  async getConfig(): Promise<TwoFactorConfig | null> {
    try {
      const stored = await AsyncStorage.getItem(TWO_FACTOR_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting 2FA config:', error);
      return null;
    }
  }

  /**
   * Save 2FA configuration locally
   */
  async saveConfig(config: TwoFactorConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(TWO_FACTOR_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving 2FA config:', error);
    }
  }

  /**
   * Enable 2FA with TOTP (authenticator app)
   */
  async setupTOTP(accessToken: string): Promise<TwoFactorSetupResult> {
    try {
      const url = this.ensureHttps(`${this.apiUrl}/api/v1/auth/2fa/setup`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ method: 'totp' }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          secret: data.data.secret,
          qrCodeUrl: data.data.qrCodeUrl,
          backupCodes: data.data.backupCodes,
        };
      }

      return {
        success: false,
        error: data.error || 'Failed to setup 2FA',
      };
    } catch (error) {
      console.error('Error setting up TOTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Enable 2FA with SMS
   */
  async setupSMS(accessToken: string, phone: string): Promise<TwoFactorSetupResult> {
    try {
      const url = this.ensureHttps(`${this.apiUrl}/api/v1/auth/2fa/setup`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ method: 'sms', phone }),
      });

      const data = await response.json();

      if (data.success) {
        await this.saveConfig({
          enabled: true,
          method: 'sms',
          phone,
        });
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Failed to setup SMS 2FA',
      };
    } catch (error) {
      console.error('Error setting up SMS 2FA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Enable 2FA with email
   */
  async setupEmail(accessToken: string, email: string): Promise<TwoFactorSetupResult> {
    try {
      const url = this.ensureHttps(`${this.apiUrl}/api/v1/auth/2fa/setup`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ method: 'email', email }),
      });

      const data = await response.json();

      if (data.success) {
        await this.saveConfig({
          enabled: true,
          method: 'email',
          email,
        });
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Failed to setup email 2FA',
      };
    } catch (error) {
      console.error('Error setting up email 2FA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Confirm TOTP setup with verification code
   */
  async confirmTOTP(accessToken: string, code: string): Promise<TwoFactorVerifyResult> {
    try {
      const url = this.ensureHttps(`${this.apiUrl}/api/v1/auth/2fa/confirm`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        await this.saveConfig({
          enabled: true,
          method: 'totp',
        });
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Invalid verification code',
      };
    } catch (error) {
      console.error('Error confirming TOTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Verify 2FA code during login
   */
  async verifyCode(
    tempToken: string,
    code: string,
    method: TwoFactorMethod = 'totp'
  ): Promise<TwoFactorVerifyResult & { accessToken?: string; refreshToken?: string }> {
    try {
      const url = this.ensureHttps(`${this.apiUrl}/api/v1/auth/2fa/verify`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempToken,
          code,
          method,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        };
      }

      return {
        success: false,
        error: data.error || 'Invalid verification code',
      };
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Request new 2FA code (for SMS/email methods)
   */
  async requestCode(tempToken: string): Promise<TwoFactorVerifyResult> {
    try {
      const url = this.ensureHttps(`${this.apiUrl}/api/v1/auth/2fa/request-code`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tempToken }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Failed to send code',
      };
    } catch (error) {
      console.error('Error requesting 2FA code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Disable 2FA
   */
  async disable(accessToken: string, code: string): Promise<TwoFactorVerifyResult> {
    try {
      const url = this.ensureHttps(`${this.apiUrl}/api/v1/auth/2fa/disable`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.removeItem(TWO_FACTOR_KEY);
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Failed to disable 2FA',
      };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Use backup code
   */
  async useBackupCode(tempToken: string, backupCode: string): Promise<TwoFactorVerifyResult & { accessToken?: string; refreshToken?: string }> {
    try {
      const url = this.ensureHttps(`${this.apiUrl}/api/v1/auth/2fa/backup`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempToken,
          backupCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        };
      }

      return {
        success: false,
        error: data.error || 'Invalid backup code',
      };
    } catch (error) {
      console.error('Error using backup code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

export const twoFactorService = new TwoFactorService();
