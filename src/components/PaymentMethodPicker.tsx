/**
 * BUS-Tickets - Payment Method Picker Component
 * Copyright (c) 2024-2026 IT Enterprise
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import type { PaymentConfig } from '@/types';

interface PaymentMethodPickerProps {
  providers: PaymentConfig[];
  selectedId?: string | number;
  onSelect: (provider: PaymentConfig) => void;
  disabled?: boolean;
  showWalletBadges?: boolean;
}

// Payment provider icons/logos
const PROVIDER_ICONS: Record<string, string> = {
  monobank: 'card',
  liqpay: 'card-outline',
  stripe: 'card',
  stripe_apple_pay: 'logo-apple',
  stripe_google_pay: 'logo-google',
  paypal: 'logo-paypal',
  gopay: 'wallet',
  fondy: 'card',
  cash: 'cash-outline',
  bank_transfer: 'business-outline',
};

const PROVIDER_COLORS: Record<string, string> = {
  monobank: '#000000',
  liqpay: '#7AB72B',
  stripe: '#635BFF',
  stripe_apple_pay: '#000000',
  stripe_google_pay: '#4285F4',
  paypal: '#003087',
  gopay: '#2E7D32',
  fondy: '#FF6B00',
  cash: '#28a745',
  bank_transfer: '#0D47A1',
};

export function PaymentMethodPicker({
  providers,
  selectedId,
  onSelect,
  disabled = false,
  showWalletBadges = true,
}: PaymentMethodPickerProps) {
  const { colors, isDark } = useTheme();

  // Filter providers based on platform for wallet support
  const filteredProviders = providers.filter((p) => {
    // Always show non-wallet providers
    if (!p.supportsApplePay && !p.supportsGooglePay) return true;

    // Show Apple Pay only on iOS
    if (p.provider === 'stripe_apple_pay' && Platform.OS !== 'ios') return false;

    // Show Google Pay only on Android
    if (p.provider === 'stripe_google_pay' && Platform.OS !== 'android') return false;

    return true;
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filteredProviders.map((provider) => {
        const isSelected = String(selectedId) === String(provider.id);
        const providerCode = provider.provider || String(provider.id);
        const providerColor = PROVIDER_COLORS[providerCode] || colors.primary;

        return (
          <TouchableOpacity
            key={provider.id}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
                borderColor: isSelected ? providerColor : isDark ? '#444' : '#e0e0e0',
                borderWidth: isSelected ? 2 : 1,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
            onPress={() => onSelect(provider)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: providerColor + '20' },
              ]}
            >
              <Ionicons
                name={PROVIDER_ICONS[providerCode] as any || 'card'}
                size={28}
                color={providerColor}
              />
            </View>
            <Text
              style={[
                styles.providerName,
                { color: colors.text },
              ]}
              numberOfLines={1}
            >
              {provider.name}
            </Text>

            {/* Wallet support badges */}
            {showWalletBadges && (provider.supportsApplePay || provider.supportsGooglePay) && (
              <View style={styles.walletBadges}>
                {provider.supportsApplePay && Platform.OS === 'ios' && (
                  <View style={[styles.walletBadge, { backgroundColor: '#000' }]}>
                    <Ionicons name="logo-apple" size={10} color="#fff" />
                  </View>
                )}
                {provider.supportsGooglePay && Platform.OS === 'android' && (
                  <View style={[styles.walletBadge, { backgroundColor: '#4285F4' }]}>
                    <Ionicons name="logo-google" size={10} color="#fff" />
                  </View>
                )}
              </View>
            )}

            {provider.testMode && (
              <View style={styles.testBadge}>
                <Text style={styles.testBadgeText}>TEST</Text>
              </View>
            )}
            {isSelected && (
              <View style={[styles.checkmark, { backgroundColor: providerColor }]}>
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

interface PaymentSummaryProps {
  amount: number;
  currency: string;
  ticketCount: number;
  onPay: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PaymentSummary({
  amount,
  currency,
  ticketCount,
  onPay,
  loading = false,
  disabled = false,
}: PaymentSummaryProps) {
  const { colors } = useTheme();

  const formatAmount = (value: number, curr: string) => {
    const formatter = new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
    });
    return formatter.format(value);
  };

  return (
    <View style={[styles.summaryContainer, { backgroundColor: colors.card }]}>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
        </Text>
        <Text style={[styles.summaryAmount, { color: colors.text }]}>
          {formatAmount(amount, currency)}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.payButton,
          { backgroundColor: colors.primary },
          disabled && styles.payButtonDisabled,
        ]}
        onPress={onPay}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <Text style={styles.payButtonText}>Processing...</Text>
        ) : (
          <>
            <Ionicons name="lock-closed" size={18} color="#ffffff" />
            <Text style={styles.payButtonText}>Pay {formatAmount(amount, currency)}</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={styles.secureRow}>
        <Ionicons name="shield-checkmark" size={14} color={colors.textSecondary} />
        <Text style={[styles.secureText, { color: colors.textSecondary }]}>
          Secure payment
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  card: {
    width: 100,
    height: 100,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  providerName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  testBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff9800',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  walletBadges: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  walletBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContainer: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  secureText: {
    fontSize: 12,
  },
});
