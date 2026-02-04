/**
 * BUS-Tickets - Payment Hook
 * Copyright (c) 2024-2026 IT Enterprise
 *
 * Enhanced payment hook with:
 * - Deep linking support
 * - Payment status polling
 * - Provider-specific handling (PayPal, Monobank, Stripe, etc.)
 * - Offline queue support
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Linking, Platform, AppState, AppStateStatus } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useApi } from '../contexts/ApiContext';
import { useConfig } from '../contexts/ConfigContext';
import type { PaymentConfig } from '@/types';

export type PaymentStatus =
  | 'idle'
  | 'initiating'
  | 'processing'
  | 'awaiting_confirmation'
  | 'success'
  | 'error'
  | 'cancelled'
  | 'refunded';

interface PaymentResult {
  transactionId: number;
  reference: string;
  status: string;
  paymentUrl?: string;
  amount: number;
  currency: string;
  provider?: string;
  confirmedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  // PayPal specific
  formData?: Record<string, string>;
  method?: 'GET' | 'POST';
  // Bank transfer specific
  bankDetails?: {
    accountNumber: string;
    bankCode: string;
    iban: string;
    swift: string;
    variableSymbol: string;
    amount: number;
    currency: string;
  };
}

interface UsePaymentOptions {
  pollInterval?: number;
  maxPollAttempts?: number;
  onSuccess?: (transaction: PaymentResult) => void;
  onError?: (error: string) => void;
  onCancelled?: () => void;
}

interface UsePaymentReturn {
  status: PaymentStatus;
  error: string | null;
  transaction: PaymentResult | null;
  availableProviders: PaymentConfig[];
  isPolling: boolean;
  initiatePayment: (
    reservationIds: number[],
    providerId: number,
    returnUrl?: string
  ) => Promise<PaymentResult>;
  checkPaymentStatus: (transactionId: number) => Promise<PaymentResult>;
  openPaymentPage: (paymentUrl: string) => Promise<WebBrowser.WebBrowserResult>;
  startPolling: (transactionId: number) => void;
  stopPolling: () => void;
  reset: () => void;
}

// Deep link scheme for the app
const APP_SCHEME = 'bus-tickets';

export function usePayment(options: UsePaymentOptions = {}): UsePaymentReturn {
  const {
    pollInterval = 3000,
    maxPollAttempts = 60, // 3 minutes max
    onSuccess,
    onError,
    onCancelled,
  } = options;

  const api = useApi();
  const { config } = useConfig();

  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<PaymentResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);

  // Get available payment providers from config
  const availableProviders = config.paymentProviders.filter((p) => p.enabled);

  // Handle deep links for payment return
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;

      if (url.includes('payment/success') || url.includes('payment/return')) {
        // Extract transaction reference from URL
        const params = new URLSearchParams(url.split('?')[1]);
        const ref = params.get('ref') || params.get('reference');
        const sessionId = params.get('session_id');
        const token = params.get('token'); // PayPal

        if (transaction?.transactionId) {
          // Check final status
          const result = await checkPaymentStatus(transaction.transactionId);
          if (result.status === 'done') {
            setStatus('success');
            onSuccess?.(result);
          }
        }
      } else if (url.includes('payment/cancelled') || url.includes('cancelled=true')) {
        setStatus('cancelled');
        onCancelled?.();
      } else if (url.includes('payment/error')) {
        setStatus('error');
        setError('Payment failed');
        onError?.('Payment failed');
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [transaction?.transactionId]);

  // Handle app state changes (for polling when returning from browser)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        status === 'processing' &&
        transaction?.transactionId
      ) {
        // App came to foreground, check payment status
        checkPaymentStatus(transaction.transactionId);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [status, transaction?.transactionId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const initiatePayment = useCallback(
    async (
      reservationIds: number[],
      providerId: number,
      returnUrl?: string
    ): Promise<PaymentResult> => {
      setStatus('initiating');
      setError(null);
      pollAttemptsRef.current = 0;

      try {
        // Build return URL with deep link support
        const baseReturnUrl = returnUrl || `${config.backend.url}/payment/return`;
        const mobileReturnUrl = `${APP_SCHEME}://payment/return`;

        const response = await fetch(`${config.backend.url}/api/v1/payments/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reservationIds,
            providerId,
            returnUrl: Platform.OS === 'web' ? baseReturnUrl : mobileReturnUrl,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Payment initiation failed');
        }

        const result: PaymentResult = {
          transactionId: data.data.transactionId,
          reference: data.data.reference,
          status: data.data.status,
          paymentUrl: data.data.paymentUrl,
          amount: data.data.amount,
          currency: data.data.currency,
          provider: data.data.provider,
          formData: data.data.formData,
          method: data.data.method,
          bankDetails: data.data.bankDetails,
        };

        setTransaction(result);
        setStatus('processing');

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment failed';
        setError(message);
        setStatus('error');
        onError?.(message);
        throw err;
      }
    },
    [config.backend.url, onError]
  );

  const checkPaymentStatus = useCallback(
    async (transactionId: number): Promise<PaymentResult> => {
      try {
        const response = await fetch(
          `${config.backend.url}/api/v1/payments/${transactionId}/status`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to check payment status');
        }

        const result: PaymentResult = {
          transactionId: data.data.transactionId,
          reference: data.data.reference,
          status: data.data.status,
          amount: data.data.amount,
          currency: data.data.currency,
          confirmedAt: data.data.confirmedAt,
          errorCode: data.data.errorCode,
          errorMessage: data.data.errorMessage,
        };

        setTransaction(result);

        // Update status based on payment state
        switch (result.status) {
          case 'done':
            setStatus('success');
            stopPolling();
            onSuccess?.(result);
            break;
          case 'error':
            setStatus('error');
            setError(result.errorMessage || 'Payment failed');
            stopPolling();
            onError?.(result.errorMessage || 'Payment failed');
            break;
          case 'cancel':
            setStatus('cancelled');
            stopPolling();
            onCancelled?.();
            break;
          case 'refunded':
            setStatus('refunded');
            stopPolling();
            break;
          case 'authorized':
            setStatus('awaiting_confirmation');
            break;
          case 'pending':
          case 'draft':
            // Keep processing status
            break;
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Status check failed';
        // Don't set error state for polling failures, just log
        console.warn('Payment status check failed:', message);
        throw err;
      }
    },
    [config.backend.url, onSuccess, onError, onCancelled]
  );

  const openPaymentPage = useCallback(
    async (paymentUrl: string): Promise<WebBrowser.WebBrowserResult> => {
      try {
        // Use expo-web-browser for in-app browser (better UX)
        const result = await WebBrowser.openBrowserAsync(paymentUrl, {
          dismissButtonStyle: 'close',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: config.theme?.primaryColor || '#007AFF',
          toolbarColor: config.theme?.backgroundColor || '#FFFFFF',
          // Enable deep link handling
          showTitle: true,
          enableBarCollapsing: true,
        });

        // Check if user closed the browser
        if (result.type === 'cancel') {
          setStatus('cancelled');
          onCancelled?.();
        }

        // When browser closes, check payment status
        if (transaction?.transactionId) {
          setTimeout(() => {
            checkPaymentStatus(transaction.transactionId);
          }, 1000);
        }

        return result;
      } catch (err) {
        // Fallback to system browser
        const canOpen = await Linking.canOpenURL(paymentUrl);
        if (canOpen) {
          await Linking.openURL(paymentUrl);
          return { type: 'opened' } as WebBrowser.WebBrowserResult;
        } else {
          throw new Error('Cannot open payment page');
        }
      }
    },
    [config.theme, transaction?.transactionId, checkPaymentStatus, onCancelled]
  );

  const startPolling = useCallback(
    (transactionId: number) => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      setIsPolling(true);
      pollAttemptsRef.current = 0;

      pollIntervalRef.current = setInterval(async () => {
        pollAttemptsRef.current += 1;

        if (pollAttemptsRef.current >= maxPollAttempts) {
          stopPolling();
          setStatus('error');
          setError('Payment timeout - please check your payment status manually');
          onError?.('Payment timeout');
          return;
        }

        try {
          const result = await checkPaymentStatus(transactionId);

          // Stop polling if we have a final status
          if (['done', 'error', 'cancel', 'refunded'].includes(result.status)) {
            stopPolling();
          }
        } catch (err) {
          // Continue polling on error, unless max attempts reached
          console.warn('Polling error:', err);
        }
      }, pollInterval);
    },
    [pollInterval, maxPollAttempts, checkPaymentStatus, onError]
  );

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setError(null);
    setTransaction(null);
    pollAttemptsRef.current = 0;
  }, [stopPolling]);

  return {
    status,
    error,
    transaction,
    availableProviders,
    isPolling,
    initiatePayment,
    checkPaymentStatus,
    openPaymentPage,
    startPolling,
    stopPolling,
    reset,
  };
}

/**
 * Helper hook for specific payment provider
 */
export function usePaymentProvider(providerCode: string) {
  const { availableProviders } = usePayment();

  const provider = availableProviders.find(
    (p) => p.provider === providerCode || p.id === providerCode
  );

  return {
    provider,
    isAvailable: !!provider?.enabled,
    supportsApplePay: provider?.supportsApplePay || false,
    supportsGooglePay: provider?.supportsGooglePay || false,
  };
}
