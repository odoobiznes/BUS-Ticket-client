/**
 * BUS-Tickets - Profile Screen
 * Copyright (c) 2024-2026 IT Enterprise
 */

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="person-circle-outline" size={80} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>Sign in to your account</Text>
        <Text style={styles.emptyText}>
          Manage your profile, view booking history, and more
        </Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push('/auth/signin')}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Account</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-outline" size={24} color={colors.text} />
          <Text style={styles.menuItemText}>Personal Information</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="card-outline" size={24} color={colors.text} />
          <Text style={styles.menuItemText}>Payment Methods</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <Text style={styles.menuItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
          <Text style={styles.menuItemText}>Privacy & Security</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Support</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color={colors.text} />
          <Text style={styles.menuItemText}>Help Center</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          <Text style={styles.menuItemText}>Contact Support</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={24} color={colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    signInButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 24,
    },
    signInButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 32,
      fontWeight: '600',
      color: '#fff',
    },
    userName: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      marginTop: 12,
    },
    userEmail: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
    },
    menuSection: {
      marginTop: 24,
    },
    menuSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    menuItemText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginTop: 32,
    },
    signOutText: {
      fontSize: 16,
      color: colors.error,
      fontWeight: '600',
      marginLeft: 8,
    },
  });
