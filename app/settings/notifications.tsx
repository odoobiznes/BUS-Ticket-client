/**
 * BUS-Tickets - Notification Settings Screen
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationSettings } from '@/services/NotificationService';

const REMINDER_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 1440, label: '1 day' },
];

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings, expoPushToken } = useNotifications();

  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    await updateSettings({ [key]: value });

    // If disabling all notifications
    if (key === 'enabled' && !value) {
      Alert.alert(
        'Notifications Disabled',
        'You will no longer receive push notifications. You can enable them again anytime.'
      );
    }
  };

  const handleReminderChange = async (minutes: number) => {
    setLocalSettings({ ...localSettings, tripReminderMinutes: minutes });
    await updateSettings({ tripReminderMinutes: minutes });
    setShowReminderPicker(false);
  };

  const styles = createStyles(colors);

  const getReminderLabel = (minutes: number): string => {
    const option = REMINDER_OPTIONS.find((o) => o.value === minutes);
    return option?.label || `${minutes} minutes`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Push Token Info (for debugging) */}
      {__DEV__ && expoPushToken && (
        <View style={styles.debugSection}>
          <Text style={styles.debugLabel}>Push Token:</Text>
          <Text style={styles.debugValue} numberOfLines={2}>
            {expoPushToken}
          </Text>
        </View>
      )}

      {/* Master Toggle */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive notifications about your trips
            </Text>
          </View>
          <Switch
            value={localSettings.enabled}
            onValueChange={(value) => handleToggle('enabled', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Notification Types */}
      {localSettings.enabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>

          <View style={styles.card}>
            {/* Trip Reminders */}
            <View style={styles.settingRow}>
              <Ionicons name="alarm-outline" size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Trip Reminders</Text>
                <Text style={styles.settingDescription}>
                  Get reminded before your trip
                </Text>
              </View>
              <Switch
                value={localSettings.tripReminders}
                onValueChange={(value) => handleToggle('tripReminders', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* Reminder Time */}
            {localSettings.tripReminders && (
              <TouchableOpacity
                style={[styles.settingRow, styles.subSetting]}
                onPress={() => setShowReminderPicker(!showReminderPicker)}
              >
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Reminder Time</Text>
                  <Text style={styles.settingDescription}>
                    {getReminderLabel(localSettings.tripReminderMinutes)} before departure
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}

            {showReminderPicker && (
              <View style={styles.pickerContainer}>
                {REMINDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.pickerOption,
                      localSettings.tripReminderMinutes === option.value &&
                        styles.pickerOptionSelected,
                    ]}
                    onPress={() => handleReminderChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        localSettings.tripReminderMinutes === option.value &&
                          styles.pickerOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {localSettings.tripReminderMinutes === option.value && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.divider} />

            {/* Booking Confirmations */}
            <View style={styles.settingRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Booking Confirmations</Text>
                <Text style={styles.settingDescription}>
                  Notifications when you book a ticket
                </Text>
              </View>
              <Switch
                value={localSettings.bookingConfirmations}
                onValueChange={(value) =>
                  handleToggle('bookingConfirmations', value)
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            {/* Trip Updates */}
            <View style={styles.settingRow}>
              <Ionicons name="bus-outline" size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Trip Updates</Text>
                <Text style={styles.settingDescription}>
                  Delays, cancellations, and changes
                </Text>
              </View>
              <Switch
                value={localSettings.tripUpdates}
                onValueChange={(value) => handleToggle('tripUpdates', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            {/* Promotions */}
            <View style={styles.settingRow}>
              <Ionicons name="pricetag-outline" size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Promotions & Offers</Text>
                <Text style={styles.settingDescription}>
                  Special deals and discounts
                </Text>
              </View>
              <Switch
                value={localSettings.promotions}
                onValueChange={(value) => handleToggle('promotions', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>
      )}

      {/* Sound & Vibration */}
      {localSettings.enabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Vibration</Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Ionicons name="volume-high-outline" size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Sound</Text>
                <Text style={styles.settingDescription}>
                  Play sound for notifications
                </Text>
              </View>
              <Switch
                value={localSettings.sound}
                onValueChange={(value) => handleToggle('sound', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.text} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Vibration</Text>
                <Text style={styles.settingDescription}>
                  Vibrate for notifications
                </Text>
              </View>
              <Switch
                value={localSettings.vibration}
                onValueChange={(value) => handleToggle('vibration', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoSection}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          You can also manage notifications in your device settings.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    debugSection: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    debugLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    debugValue: {
      fontSize: 10,
      fontFamily: 'monospace',
      color: colors.text,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    subSetting: {
      paddingLeft: 44,
      backgroundColor: colors.background,
      marginHorizontal: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    settingInfo: {
      flex: 1,
      marginLeft: 8,
    },
    settingTitle: {
      fontSize: 16,
      color: colors.text,
    },
    settingDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 12,
    },
    pickerContainer: {
      backgroundColor: colors.background,
      marginHorizontal: 8,
      borderRadius: 8,
      marginBottom: 8,
      overflow: 'hidden',
    },
    pickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    pickerOptionSelected: {
      backgroundColor: `${colors.primary}10`,
    },
    pickerOptionText: {
      fontSize: 14,
      color: colors.text,
    },
    pickerOptionTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    infoSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: 16,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
