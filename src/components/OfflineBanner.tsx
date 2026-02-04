/**
 * BUS-Tickets - Offline Banner Component
 * Copyright (c) 2024-2026 IT Enterprise
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../contexts/NetworkContext';
import { useTheme } from '../contexts/ThemeContext';

interface OfflineBannerProps {
  onSync?: () => void;
}

export function OfflineBanner({ onSync }: OfflineBannerProps) {
  const { isOnline, syncState, sync } = useNetwork();
  const { colors } = useTheme();

  // Don't show if online and not syncing
  if (isOnline && syncState.status !== 'syncing' && syncState.pendingActions === 0) {
    return null;
  }

  const handleSync = async () => {
    await sync();
    onSync?.();
  };

  const styles = createStyles(colors, isOnline);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons
          name={isOnline ? 'cloud-upload-outline' : 'cloud-offline-outline'}
          size={20}
          color={isOnline ? colors.warning : '#fff'}
        />

        <View style={styles.textContainer}>
          {!isOnline ? (
            <>
              <Text style={styles.title}>You're offline</Text>
              <Text style={styles.subtitle}>
                Changes will sync when connected
              </Text>
            </>
          ) : syncState.status === 'syncing' ? (
            <>
              <Text style={[styles.title, styles.syncingTitle]}>Syncing...</Text>
              <Text style={[styles.subtitle, styles.syncingSubtitle]}>
                Please wait
              </Text>
            </>
          ) : syncState.pendingActions > 0 ? (
            <>
              <Text style={[styles.title, styles.pendingTitle]}>
                {syncState.pendingActions} pending action(s)
              </Text>
              <Text style={[styles.subtitle, styles.pendingSubtitle]}>
                Tap to sync now
              </Text>
            </>
          ) : null}
        </View>

        {isOnline && syncState.status !== 'syncing' && (
          <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {syncState.error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={14} color={colors.error} />
          <Text style={styles.errorText}>{syncState.error}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any, isOnline: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isOnline ? colors.card : '#dc3545',
      borderBottomWidth: 1,
      borderBottomColor: isOnline ? colors.border : 'transparent',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    textContainer: {
      flex: 1,
      marginLeft: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    subtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    syncingTitle: {
      color: colors.text,
    },
    syncingSubtitle: {
      color: colors.textSecondary,
    },
    pendingTitle: {
      color: colors.warning,
    },
    pendingSubtitle: {
      color: colors.textSecondary,
    },
    syncButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 6,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
    },
  });
