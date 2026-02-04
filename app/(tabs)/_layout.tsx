/**
 * BUS-Tickets - Tab Navigation Layout
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/contexts/LocaleContext';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useLocale();

  const getTabBarIcon = (name: IconName, focused: boolean) => ({
    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
      <Ionicons
        name={focused ? name : (`${name}-outline` as IconName)}
        size={size}
        color={color}
      />
    ),
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.home,
          ...getTabBarIcon('search', false),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: t.nav.tickets,
          ...getTabBarIcon('ticket', false),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.nav.profile,
          ...getTabBarIcon('person', false),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.nav.settings,
          ...getTabBarIcon('settings', false),
        }}
      />
    </Tabs>
  );
}
