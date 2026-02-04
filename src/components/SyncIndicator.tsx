/**
 * BUS-Tickets - Sync Indicator Component
 * Copyright (c) 2024-2026 IT Enterprise
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../contexts/NetworkContext';
import { useTheme } from '../contexts/ThemeContext';

export function SyncIndicator() {
  const { isOnline, syncState } = useNetwork();
  const { colors } = useTheme();

  const getStatusIcon = () => {
    if (!isOnline) {
      return <Ionicons name="cloud-offline" size={16} color={colors.error} />;
    }

    switch (syncState.status) {
      case 'syncing':
        return <ActivityIndicator size="small" color={colors.primary} />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={16} color={colors.success} />;
      case 'error':
        return <Ionicons name="alert-circle" size={16} color={colors.error} />;
      default:
        return <Ionicons name="cloud-done" size={16} color={colors.textSecondary} />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';

    switch (syncState.status) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Sync failed';
      default:
        return syncState.pendingActions > 0
          ? `${syncState.pendingActions} pending`
          : 'Up to date';
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {getStatusIcon()}
      <Text style={styles.text}>{getStatusText()}</Text>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.card,
      borderRadius: 12,
    },
    text: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
