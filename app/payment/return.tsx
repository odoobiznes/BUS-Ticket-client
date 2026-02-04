/**
 * BUS-Tickets - Payment Return Screen
 * Copyright (c) 2024-2026 IT Enterprise
 *
 * This screen handles deep link returns from payment providers:
 * - bus-tickets://payment/return?ref=xxx
 * - bus-tickets://payment/success?ref=xxx
 * - bus-tickets://payment/cancelled
 * - bus-tickets://payment/error
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useConfig } from '@/contexts/ConfigContext';

type PaymentResultStatus = 'loading' | 'success' | 'error' | 'cancelled';

export default function PaymentReturnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    ref?: string;
    reference?: string;
    session_id?: string;
    token?: string;
    PayerID?: string;
    cancelled?: string;
    error?: string;
  }>();
  const { colors } = useTheme();
  const { config } = useConfig();

  const [status, setStatus] = useState<PaymentResultStatus>('loading');
  const [message, setMessage] = useState('Ověřuji platbu...');

  useEffect(() => {
    checkPaymentResult();
  }, []);

  const checkPaymentResult = async () => {
    // Check for cancellation
    if (params.cancelled === 'true' || params.error) {
      setStatus(params.error ? 'error' : 'cancelled');
      setMessage(params.error ? 'Platba selhala' : 'Platba byla zrušena');
      redirectAfterDelay();
      return;
    }

    // Get reference from various possible params
    const reference = params.ref || params.reference || params.session_id || params.token;

    if (!reference) {
      setStatus('error');
      setMessage('Chybí reference platby');
      redirectAfterDelay();
      return;
    }

    try {
      // Check payment status via API
      const response = await fetch(
        `${config.backend.url}/api/v1/payments/status?reference=${reference}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data.status === 'done') {
        setStatus('success');
        setMessage('Platba úspěšná!');
      } else if (data.data?.status === 'pending' || data.data?.status === 'processing') {
        setMessage('Čekám na potvrzení platby...');
        // Poll again after delay
        setTimeout(checkPaymentResult, 2000);
        return;
      } else if (data.data?.status === 'cancel') {
        setStatus('cancelled');
        setMessage('Platba byla zrušena');
      } else {
        setStatus('error');
        setMessage(data.data?.errorMessage || 'Platba selhala');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      setStatus('error');
      setMessage('Nepodařilo se ověřit platbu');
    }

    redirectAfterDelay();
  };

  const redirectAfterDelay = () => {
    setTimeout(() => {
      if (status === 'success') {
        router.replace('/tickets');
      } else {
        router.replace('/');
      }
    }, 2500);
  };

  const getStatusIcon = (): { name: string; color: string } => {
    switch (status) {
      case 'success':
        return { name: 'checkmark-circle', color: '#28a745' };
      case 'error':
        return { name: 'close-circle', color: '#dc3545' };
      case 'cancelled':
        return { name: 'alert-circle', color: '#ffc107' };
      default:
        return { name: 'time', color: colors.primary };
    }
  };

  const statusIcon = getStatusIcon();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {status === 'loading' ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Ionicons
            name={statusIcon.name as any}
            size={80}
            color={statusIcon.color}
          />
        )}

        <Text style={[styles.title, { color: colors.text }]}>
          {status === 'loading' && 'Ověřuji platbu'}
          {status === 'success' && 'Platba úspěšná'}
          {status === 'error' && 'Chyba platby'}
          {status === 'cancelled' && 'Platba zrušena'}
        </Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>

        {status !== 'loading' && (
          <Text style={[styles.redirect, { color: colors.textSecondary }]}>
            Přesměrovávám...
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
  redirect: {
    fontSize: 14,
    marginTop: 24,
  },
});
