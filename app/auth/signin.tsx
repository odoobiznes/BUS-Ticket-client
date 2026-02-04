/**
 * BUS-Tickets - Sign In Screen
 * Supports Email, Phone OTP, and OAuth (Google, Facebook, Apple)
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useLocale } from '@/contexts/LocaleContext';
import { oAuthService, OAuthProvider } from '@/services/OAuthService';

type AuthMethod = 'email' | 'phone' | 'magic';

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signIn, signInWithOAuth, signInWithOTP, requestOTP, isLoading } = useAuth();
  const { config } = useConfig();
  const { t } = useLocale();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  // Configure OAuth providers from app config
  useEffect(() => {
    if (config.authProviders) {
      oAuthService.configureFromAppConfig(config.authProviders);
    }
  }, [config.authProviders]);

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t.common.error, t.auth.invalidCredentials);
      return;
    }

    try {
      await signIn(email, password);
      router.back();
    } catch (error) {
      Alert.alert(t.common.error, t.auth.invalidCredentials);
    }
  };

  const handleRequestOTP = async () => {
    if (!phone) {
      Alert.alert(t.common.error, t.auth.invalidCredentials);
      return;
    }

    try {
      await requestOTP(undefined, phone);
      setShowOtpInput(true);
    } catch (error) {
      Alert.alert(t.common.error, t.auth.networkError);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      Alert.alert(t.common.error, t.auth.enterCode);
      return;
    }

    try {
      await signInWithOTP(phone, otpCode);
      router.back();
    } catch (error) {
      Alert.alert(t.common.error, t.auth.invalidCredentials);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      Alert.alert(t.common.error, t.auth.invalidCredentials);
      return;
    }

    try {
      await requestOTP(email);
      setMagicLinkSent(true);
    } catch (error) {
      Alert.alert(t.common.error, t.auth.networkError);
    }
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    try {
      const result = await oAuthService.signIn(provider);

      if (result.success && (result.idToken || result.accessToken)) {
        // Send to backend for verification
        await signInWithOAuth(provider, result.idToken || result.accessToken!);
        router.back();
      } else {
        if (result.error !== 'User cancelled authentication') {
          Alert.alert(t.common.error, result.error || t.auth.networkError);
        }
      }
    } catch (error) {
      console.error('OAuth error:', error);
      Alert.alert(t.common.error, t.auth.networkError);
    } finally {
      setOauthLoading(null);
    }
  };

  const styles = createStyles(colors);

  const enabledOAuthProviders = (config.authProviders || []).filter((p) => p.enabled);

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'logo-google';
      case 'facebook':
        return 'logo-facebook';
      case 'apple':
        return 'logo-apple';
      default:
        return 'log-in-outline';
    }
  };

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return '#4285F4';
      case 'facebook':
        return '#1877F2';
      case 'apple':
        return colors.text;
      default:
        return colors.primary;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.auth.signInTitle}</Text>
          <Text style={styles.subtitle}>{config.instanceName || 'BUS-Tickets'}</Text>
        </View>

        {/* OAuth Buttons */}
        {enabledOAuthProviders.length > 0 && (
          <View style={styles.oauthSection}>
            {enabledOAuthProviders.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.oauthButton,
                  oauthLoading === provider.id && styles.oauthButtonLoading,
                ]}
                onPress={() => handleOAuthSignIn(provider.id as OAuthProvider)}
                disabled={!!oauthLoading}
              >
                {oauthLoading === provider.id ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Ionicons
                      name={getProviderIcon(provider.id) as any}
                      size={24}
                      color={getProviderColor(provider.id)}
                    />
                    <Text style={styles.oauthButtonText}>
                      {t.auth.orContinueWith} {provider.name}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Divider */}
        {enabledOAuthProviders.length > 0 && (
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t.auth.orContinueWith.split(' ')[0]}</Text>
            <View style={styles.divider} />
          </View>
        )}

        {/* Auth Method Tabs */}
        <View style={styles.authMethodTabs}>
          <TouchableOpacity
            style={[styles.authMethodTab, authMethod === 'email' && styles.authMethodTabActive]}
            onPress={() => setAuthMethod('email')}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={authMethod === 'email' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.authMethodTabText,
                authMethod === 'email' && styles.authMethodTabTextActive,
              ]}
            >
              {t.auth.email}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authMethodTab, authMethod === 'phone' && styles.authMethodTabActive]}
            onPress={() => setAuthMethod('phone')}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={20}
              color={authMethod === 'phone' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.authMethodTabText,
                authMethod === 'phone' && styles.authMethodTabTextActive,
              ]}
            >
              OTP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authMethodTab, authMethod === 'magic' && styles.authMethodTabActive]}
            onPress={() => setAuthMethod('magic')}
          >
            <Ionicons
              name="link-outline"
              size={20}
              color={authMethod === 'magic' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.authMethodTabText,
                authMethod === 'magic' && styles.authMethodTabTextActive,
              ]}
            >
              Link
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email Form */}
        {authMethod === 'email' && (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder={t.auth.email}
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder={t.auth.password}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{t.auth.forgotPassword}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
              onPress={handleEmailSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.signInButtonText}>{t.auth.signInButton}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Phone OTP Form */}
        {authMethod === 'phone' && (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="+380... / +420..."
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {showOtpInput && (
              <View style={styles.inputContainer}>
                <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder={t.auth.enterCode}
                  placeholderTextColor={colors.textSecondary}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
              onPress={showOtpInput ? handleVerifyOTP : handleRequestOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.signInButtonText}>
                  {showOtpInput ? t.auth.verifyButton : t.auth.sendMagicLink.replace('link', 'OTP')}
                </Text>
              )}
            </TouchableOpacity>

            {showOtpInput && (
              <TouchableOpacity style={styles.resendButton} onPress={handleRequestOTP}>
                <Text style={styles.resendButtonText}>{t.auth.resendCode}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Magic Link Form */}
        {authMethod === 'magic' && (
          <View style={styles.form}>
            {!magicLinkSent ? (
              <>
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                  <Text style={styles.infoText}>{t.auth.checkEmail}</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder={t.auth.email}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
                  onPress={handleMagicLink}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.signInButtonText}>{t.auth.sendMagicLink}</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                <Text style={styles.successTitle}>{t.auth.magicLinkSent}</Text>
                <Text style={styles.successText}>{t.auth.checkEmail}</Text>
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => setMagicLinkSent(false)}
                >
                  <Text style={styles.resendButtonText}>{t.auth.resendCode}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t.auth.noAccount}{' '}
            <Text style={styles.footerLink}>{t.auth.signUpButton}</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 24,
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 8,
    },
    oauthSection: {
      gap: 12,
    },
    oauthButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    oauthButtonLoading: {
      opacity: 0.7,
    },
    oauthButtonText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginHorizontal: 16,
    },
    authMethodTabs: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 4,
      marginBottom: 24,
    },
    authMethodTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 8,
    },
    authMethodTabActive: {
      backgroundColor: colors.background,
    },
    authMethodTabText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    authMethodTabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    form: {
      gap: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
    },
    forgotPasswordText: {
      fontSize: 14,
      color: colors.primary,
    },
    signInButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    signInButtonDisabled: {
      opacity: 0.6,
    },
    signInButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
    },
    resendButton: {
      alignItems: 'center',
      padding: 12,
    },
    resendButtonText: {
      fontSize: 14,
      color: colors.primary,
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.primary + '15',
      borderRadius: 12,
      padding: 16,
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    successBox: {
      alignItems: 'center',
      padding: 32,
    },
    successTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    successText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    footer: {
      marginTop: 32,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    footerLink: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
