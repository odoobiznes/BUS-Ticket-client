/**
 * BUS-Tickets - Two-Factor Authentication Screen
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/contexts/LocaleContext';
import { twoFactorService, TwoFactorMethod } from '@/services/TwoFactorService';

const CODE_LENGTH = 6;

export default function TwoFactorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tempToken: string;
    method?: TwoFactorMethod;
    email?: string;
    phone?: string;
  }>();
  const { colors } = useTheme();
  const { t } = useLocale();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [showBackupInput, setShowBackupInput] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const method = (params.method as TwoFactorMethod) || 'totp';

  // Countdown timer for resend code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, CODE_LENGTH).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);

      // Focus last filled input or next empty
      const nextIndex = Math.min(index + pastedCode.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();

      // Auto-submit if complete
      if (newCode.every((c) => c !== '')) {
        handleVerify(newCode.join(''));
      }
    } else {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Move to next input
      if (value && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit if complete
      if (newCode.every((c) => c !== '')) {
        handleVerify(newCode.join(''));
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeString?: string) => {
    const verifyCode = codeString || code.join('');

    if (verifyCode.length !== CODE_LENGTH) {
      Alert.alert(t.common.error, t.auth.enterCode);
      return;
    }

    setIsLoading(true);
    try {
      const result = await twoFactorService.verifyCode(
        params.tempToken!,
        verifyCode,
        method
      );

      if (result.success && result.accessToken) {
        // Store tokens and navigate to home
        // This would typically be handled by AuthContext
        router.replace('/');
      } else {
        Alert.alert(t.common.error, result.error || t.auth.invalidCredentials);
        setCode(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert(t.common.error, t.auth.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    try {
      const result = await twoFactorService.requestCode(params.tempToken!);
      if (result.success) {
        setCountdown(60);
        Alert.alert(t.common.success, t.auth.magicLinkSent);
      } else {
        Alert.alert(t.common.error, result.error || t.auth.networkError);
      }
    } catch (error) {
      Alert.alert(t.common.error, t.auth.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCode = async () => {
    if (!backupCode.trim()) {
      Alert.alert(t.common.error, t.auth.enterCode);
      return;
    }

    setIsLoading(true);
    try {
      const result = await twoFactorService.useBackupCode(
        params.tempToken!,
        backupCode.trim()
      );

      if (result.success && result.accessToken) {
        router.replace('/');
      } else {
        Alert.alert(t.common.error, result.error || t.auth.invalidCredentials);
      }
    } catch (error) {
      Alert.alert(t.common.error, t.auth.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(colors);

  const getMethodIcon = () => {
    switch (method) {
      case 'totp':
        return 'keypad';
      case 'sms':
        return 'phone-portrait';
      case 'email':
        return 'mail';
      default:
        return 'shield-checkmark';
    }
  };

  const getMethodDescription = () => {
    switch (method) {
      case 'totp':
        return t.auth.enterCode;
      case 'sms':
        return `${t.auth.enterCode} (${params.phone || 'SMS'})`;
      case 'email':
        return `${t.auth.enterCode} (${params.email || 'Email'})`;
      default:
        return t.auth.enterCode;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name={getMethodIcon() as any} size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t.auth.twoFactor}</Text>
          <Text style={styles.subtitle}>{getMethodDescription()}</Text>
        </View>

        {!showBackupInput ? (
          <>
            {/* Code Input */}
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    digit ? styles.codeInputFilled : undefined,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(index, value)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(index, nativeEvent.key)
                  }
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  selectTextOnFocus
                  editable={!isLoading}
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={() => handleVerify()}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>{t.auth.verifyButton}</Text>
              )}
            </TouchableOpacity>

            {/* Resend Code (for SMS/Email) */}
            {method !== 'totp' && (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={countdown > 0 || isLoading}
              >
                <Text
                  style={[
                    styles.resendButtonText,
                    countdown > 0 && styles.resendButtonTextDisabled,
                  ]}
                >
                  {countdown > 0
                    ? `${t.auth.resendCode} (${countdown}s)`
                    : t.auth.resendCode}
                </Text>
              </TouchableOpacity>
            )}

            {/* Use Backup Code */}
            <TouchableOpacity
              style={styles.backupButton}
              onPress={() => setShowBackupInput(true)}
            >
              <Ionicons name="key-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.backupButtonText}>Use backup code</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Backup Code Input */}
            <View style={styles.backupInputContainer}>
              <Text style={styles.backupLabel}>Enter your backup code:</Text>
              <TextInput
                style={styles.backupInput}
                value={backupCode}
                onChangeText={setBackupCode}
                placeholder="XXXX-XXXX-XXXX"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                editable={!isLoading}
              />
            </View>

            {/* Verify Backup Button */}
            <TouchableOpacity
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={handleBackupCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>{t.auth.verifyButton}</Text>
              )}
            </TouchableOpacity>

            {/* Back to Code Input */}
            <TouchableOpacity
              style={styles.backupButton}
              onPress={() => {
                setShowBackupInput(false);
                setBackupCode('');
              }}
            >
              <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
              <Text style={styles.backupButtonText}>Back to code input</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    codeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 32,
    },
    codeInput: {
      width: 48,
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
    },
    codeInputFilled: {
      borderColor: colors.primary,
    },
    verifyButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    verifyButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
    },
    resendButton: {
      alignItems: 'center',
      padding: 16,
    },
    resendButtonText: {
      fontSize: 14,
      color: colors.primary,
    },
    resendButtonTextDisabled: {
      color: colors.textSecondary,
    },
    backupButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
    },
    backupButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    backupInputContainer: {
      marginBottom: 24,
    },
    backupLabel: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
    },
    backupInput: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 18,
      color: colors.text,
      textAlign: 'center',
      letterSpacing: 2,
    },
    cancelButton: {
      alignItems: 'center',
      padding: 16,
      marginTop: 16,
    },
    cancelButtonText: {
      fontSize: 14,
      color: colors.error,
    },
  });
