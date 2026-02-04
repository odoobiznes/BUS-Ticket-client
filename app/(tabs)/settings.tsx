/**
 * BUS-Tickets - Settings Screen
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { useLocale } from '@/contexts/LocaleContext';
import { SyncIndicator } from '@/components/SyncIndicator';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme, setTheme, themeMode } = useTheme();
  const { config, loadConfigFromUrl, resetToDefault } = useConfig();
  const { isOnline, syncState, forceSync } = useNetwork();
  const { locale, setLocale, t, availableLanguages, getLanguageName, getLanguageFlag } = useLocale();

  const [showBackendInput, setShowBackendInput] = useState(false);
  const [backendUrl, setBackendUrl] = useState(config.backend.apiUrl);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectBackend = async () => {
    if (!backendUrl) {
      Alert.alert('Error', 'Please enter a backend URL');
      return;
    }

    setIsConnecting(true);
    try {
      await loadConfigFromUrl(backendUrl);
      Alert.alert('Success', 'Connected to backend successfully');
      setShowBackendInput(false);
    } catch (error) {
      Alert.alert('Error', 'Could not connect to backend. Please check the URL.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleResetConfig = () => {
    Alert.alert(
      'Reset Configuration',
      'This will reset all settings to default. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetToDefault();
            setBackendUrl(config.backend.apiUrl);
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Theme Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.appearance}</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Ionicons name="moon-outline" size={24} color={colors.text} />
            <Text style={styles.settingText}>{t.settings.darkMode}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.themeOptions}>
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeOption,
                  themeMode === mode && styles.themeOptionActive,
                ]}
                onPress={() => setTheme(mode)}
              >
                <Text
                  style={[
                    styles.themeOptionText,
                    themeMode === mode && styles.themeOptionTextActive,
                  ]}
                >
                  {t.settings[mode]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Notifications & Sync */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.notifications}</Text>

        <View style={styles.settingCard}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/settings/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>{t.settings.notifications}</Text>
              <Text style={styles.settingValue}>{t.settings.notificationsDesc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <Ionicons
              name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
              size={24}
              color={isOnline ? colors.success : colors.error}
            />
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>{t.settings.syncStatus}</Text>
              <Text style={styles.settingValue}>
                {!isOnline
                  ? t.settings.offline
                  : syncState.pendingActions > 0
                  ? `${syncState.pendingActions} ${t.settings.pending}`
                  : t.settings.synced}
              </Text>
            </View>
            <SyncIndicator />
          </View>

          {isOnline && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.actionButton} onPress={forceSync}>
                <Ionicons name="refresh-outline" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>{t.settings.forceSync}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Backend Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.backend}</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Ionicons name="server-outline" size={24} color={colors.text} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>{t.settings.currentBackend}</Text>
              <Text style={styles.settingValue} numberOfLines={1}>
                {config.backend.apiUrl}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowBackendInput(!showBackendInput)}
          >
            <Ionicons name="link-outline" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>{t.settings.changeBackend}</Text>
          </TouchableOpacity>

          {showBackendInput && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="https://your-odoo-server.com"
                placeholderTextColor={colors.textSecondary}
                value={backendUrl}
                onChangeText={setBackendUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]}
                onPress={handleConnectBackend}
                disabled={isConnecting}
              >
                <Text style={styles.connectButtonText}>
                  {isConnecting ? t.settings.connecting : t.settings.connect}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/settings/providers' as any)}
          >
            <Ionicons name="bus-outline" size={24} color={colors.text} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Bus Operators</Text>
              <Text style={styles.settingValue}>Manage multiple bus company connections</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.language}</Text>

        <View style={styles.settingCard}>
          {availableLanguages.map((lang, index) => (
            <View key={lang}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => setLocale(lang)}
              >
                <Text style={styles.languageFlag}>{getLanguageFlag(lang)}</Text>
                <Text style={[
                  styles.languageText,
                  locale === lang && styles.languageTextActive
                ]}>
                  {getLanguageName(lang)}
                </Text>
                {locale === lang && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.legal}</Text>

        <View style={styles.settingCard}>
          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => Linking.openURL(config.legal.privacyPolicyUrl)}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.text} />
            <Text style={styles.legalText}>{t.settings.privacyPolicy}</Text>
            <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.legalItem}
            onPress={() => Linking.openURL(config.legal.termsUrl || config.legal.termsOfServiceUrl)}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.text} />
            <Text style={styles.legalText}>{t.settings.termsOfService}</Text>
            <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.about}</Text>

        <View style={styles.settingCard}>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>{t.settings.appName}</Text>
            <Text style={styles.aboutValue}>{config.instanceName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>{t.settings.version}</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>{t.settings.developer}</Text>
            <Text style={styles.aboutValue}>IT Enterprise</Text>
          </View>
        </View>
      </View>

      {/* Reset */}
      <TouchableOpacity style={styles.resetButton} onPress={handleResetConfig}>
        <Ionicons name="refresh-outline" size={20} color={colors.error} />
        <Text style={styles.resetButtonText}>{t.settings.resetSettings}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2024-2026 IT Enterprise{'\n'}
          support@it-enterprise.cz
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
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    settingCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingInfo: {
      flex: 1,
      marginLeft: 12,
    },
    settingText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    settingValue: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    themeOption: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    themeOptionActive: {
      backgroundColor: colors.primary,
    },
    themeOptionText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    themeOptionTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButtonText: {
      fontSize: 16,
      color: colors.primary,
    },
    inputContainer: {
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    connectButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    connectButtonDisabled: {
      opacity: 0.6,
    },
    connectButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 12,
    },
    languageFlag: {
      fontSize: 24,
    },
    languageText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    languageTextActive: {
      fontWeight: '600',
      color: colors.primary,
    },
    legalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    legalText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    aboutItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    aboutLabel: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    aboutValue: {
      fontSize: 16,
      color: colors.text,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    resetButtonText: {
      fontSize: 16,
      color: colors.error,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
