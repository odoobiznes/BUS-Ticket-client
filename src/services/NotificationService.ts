/**
 * BUS-Tickets - Push Notification Service
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if we're on web
const isWeb = Platform.OS === 'web';

// Conditionally import native modules
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
let Constants: typeof import('expo-constants').default | null = null;

if (!isWeb) {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants').default;
}

const PUSH_TOKEN_KEY = '@bus_tickets_push_token';
const NOTIFICATION_SETTINGS_KEY = '@bus_tickets_notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  tripReminders: boolean;
  tripReminderMinutes: number; // Minutes before departure
  bookingConfirmations: boolean;
  promotions: boolean;
  tripUpdates: boolean;
  sound: boolean;
  vibration: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  tripReminders: true,
  tripReminderMinutes: 60, // 1 hour before
  bookingConfirmations: true,
  promotions: false,
  tripUpdates: true,
  sound: true,
  vibration: true,
};

export interface NotificationData {
  type: 'trip_reminder' | 'booking_confirmation' | 'trip_update' | 'promotion' | 'general';
  ticketId?: number;
  tripId?: number;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Skip push notifications on web (requires VAPID key setup)
    if (isWeb) {
      await this.loadSettings();
      this.initialized = true;
      return;
    }

    // Configure notification handler (native only)
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: this.settings.sound,
          shouldSetBadge: true,
        }),
      });
    }

    // Load settings
    await this.loadSettings();

    // Request permissions and get push token (native only)
    if (this.settings.enabled && !isWeb) {
      await this.registerForPushNotifications();
    }

    this.initialized = true;
  }

  /**
   * Request permission and register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Skip on web - would require VAPID key
    if (isWeb || !Notifications || !Device || !Constants) {
      console.log('Push notifications not available on web');
      return null;
    }

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.pushToken = tokenData.data;

      // Save token locally
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, this.pushToken);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      console.log('Push token:', this.pushToken);
      return this.pushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    if (!Notifications) return;

    // Trip reminders channel
    await Notifications.setNotificationChannelAsync('trip-reminders', {
      name: 'Trip Reminders',
      description: 'Reminders about upcoming trips',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e94560',
      sound: 'default',
    });

    // Booking confirmations channel
    await Notifications.setNotificationChannelAsync('booking-confirmations', {
      name: 'Booking Confirmations',
      description: 'Notifications about booking status',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    // Trip updates channel
    await Notifications.setNotificationChannelAsync('trip-updates', {
      name: 'Trip Updates',
      description: 'Updates about trip changes or delays',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    // Promotions channel
    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions & Offers',
      description: 'Special offers and discounts',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // General channel
    await Notifications.setNotificationChannelAsync('general', {
      name: 'General',
      description: 'General notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Register token with backend
   */
  async registerTokenWithBackend(apiUrl: string, userId: number): Promise<void> {
    if (!this.pushToken) {
      console.log('No push token to register');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/v1/push-tokens/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.pushToken,
          user_id: userId,
          platform: Platform.OS,
          device_name: Device?.deviceName || 'Unknown',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register push token');
      }

      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Error registering token with backend:', error);
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    notification: NotificationData,
    trigger: unknown
  ): Promise<string> {
    if (isWeb || !Notifications) {
      console.log('Local notifications not available on web');
      return '';
    }

    const channelId = this.getChannelForType(notification.type);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          type: notification.type,
          ticketId: notification.ticketId,
          tripId: notification.tripId,
          ...notification.data,
        },
        sound: this.settings.sound ? 'default' : undefined,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: trigger as Parameters<typeof Notifications.scheduleNotificationAsync>[0]['trigger'],
    });

    return notificationId;
  }

  /**
   * Schedule trip reminder
   */
  async scheduleTripReminder(
    ticketId: number,
    tripId: number,
    origin: string,
    destination: string,
    departureTime: Date
  ): Promise<string | null> {
    if (!this.settings.tripReminders) {
      return null;
    }

    const reminderTime = new Date(departureTime);
    reminderTime.setMinutes(
      reminderTime.getMinutes() - this.settings.tripReminderMinutes
    );

    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      return null;
    }

    return this.scheduleLocalNotification(
      {
        type: 'trip_reminder',
        ticketId,
        tripId,
        title: 'Trip Reminder',
        body: `Your trip from ${origin} to ${destination} departs in ${this.settings.tripReminderMinutes} minutes`,
      },
      {
        date: reminderTime,
      }
    );
  }

  /**
   * Send instant local notification
   */
  async sendLocalNotification(notification: NotificationData): Promise<void> {
    await this.scheduleLocalNotification(notification, null);
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    if (isWeb || !Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    if (isWeb || !Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<unknown[]> {
    if (isWeb || !Notifications) return [];
    return Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    if (isWeb || !Notifications) return 0;
    return Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    if (isWeb || !Notifications) return;
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    if (isWeb || !Notifications) return;
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Get notification settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Update notification settings
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await AsyncStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(this.settings)
    );

    // Re-register if enabling notifications
    if (newSettings.enabled && !this.pushToken) {
      await this.registerForPushNotifications();
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }

      // Load stored token
      const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (storedToken) {
        this.pushToken = storedToken;
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  /**
   * Get Android channel for notification type
   */
  private getChannelForType(type: NotificationData['type']): string {
    switch (type) {
      case 'trip_reminder':
        return 'trip-reminders';
      case 'booking_confirmation':
        return 'booking-confirmations';
      case 'trip_update':
        return 'trip-updates';
      case 'promotion':
        return 'promotions';
      default:
        return 'general';
    }
  }
}

export const notificationService = NotificationService.getInstance();
