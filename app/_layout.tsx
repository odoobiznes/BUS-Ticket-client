/**
 * BUS-Tickets - Root Layout
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ConfigProvider, useConfig } from '@/contexts/ConfigContext';
import { ApiProvider } from '@/contexts/ApiContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';
import { ProvidersProvider } from '@/contexts/ProvidersContext';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/NotificationService';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function NotificationInitializer() {
  const { user } = useAuth();
  const { config } = useConfig();
  const { expoPushToken } = useNotifications();

  useEffect(() => {
    // Register push token with backend when user logs in
    const apiUrl = config.backend.apiUrl || config.backend.url;
    if (user && expoPushToken && apiUrl) {
      notificationService.registerTokenWithBackend(
        apiUrl,
        user.id
      );
    }
  }, [user, expoPushToken, config.backend.apiUrl, config.backend.url]);

  return null;
}

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/signin"
          options={{
            title: 'Sign In',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="auth/two-factor"
          options={{
            title: '2FA Verification',
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="search/results"
          options={{
            title: 'Search Results',
          }}
        />
        <Stack.Screen
          name="booking/[tripId]"
          options={{
            title: 'Book Trip',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="ticket/[ticketId]"
          options={{
            title: 'Ticket Details',
          }}
        />
        <Stack.Screen
          name="settings/notifications"
          options={{
            title: 'Notifications',
          }}
        />
        <Stack.Screen
          name="settings/providers"
          options={{
            title: 'Bus Operators',
          }}
        />
        <Stack.Screen
          name="payment/return"
          options={{
            title: 'Platba',
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
    </View>
  );
}

function AppContent() {
  const { config } = useConfig();
  const apiUrl = config.backend.apiUrl || config.backend.url;

  return (
    <NetworkProvider apiUrl={apiUrl}>
      <NotificationInitializer />
      <RootLayoutNav />
    </NetworkProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
  });

  useEffect(() => {
    // Initialize notifications
    notificationService.initialize();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConfigProvider>
        <LocaleProvider>
          <ProvidersProvider>
            <ApiProvider>
              <AuthProvider>
                <ThemeProvider>
                  <AppContent />
                </ThemeProvider>
              </AuthProvider>
            </ApiProvider>
          </ProvidersProvider>
        </LocaleProvider>
      </ConfigProvider>
    </GestureHandlerRootView>
  );
}
