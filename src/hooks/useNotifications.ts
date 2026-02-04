/**
 * BUS-Tickets - Notification Hook
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { notificationService, NotificationSettings } from '../services/NotificationService';

interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  scheduleReminder: (
    ticketId: number,
    tripId: number,
    origin: string,
    destination: string,
    departureTime: Date
  ) => Promise<string | null>;
  cancelReminder: (notificationId: string) => Promise<void>;
  clearBadge: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(
    notificationService.getSettings()
  );

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Initialize notification service
    const init = async () => {
      await notificationService.initialize();
      const token = notificationService.getPushToken();
      setExpoPushToken(token);
      setSettings(notificationService.getSettings());
    };

    init();

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
        console.log('Notification received:', notification);
      }
    );

    // Listen for notification responses (user tapped on notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  /**
   * Handle notification tap
   */
  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    const data = response.notification.request.content.data;
    console.log('Notification tapped:', data);

    // Navigate based on notification type
    switch (data.type) {
      case 'trip_reminder':
      case 'booking_confirmation':
        if (data.ticketId) {
          router.push({
            pathname: '/ticket/[ticketId]',
            params: { ticketId: String(data.ticketId) },
          });
        }
        break;

      case 'trip_update':
        if (data.tripId) {
          router.push({
            pathname: '/booking/[tripId]',
            params: { tripId: String(data.tripId) },
          });
        }
        break;

      case 'promotion':
        router.push('/');
        break;

      default:
        // Navigate to tickets by default
        router.push('/(tabs)/tickets');
    }

    // Clear badge
    notificationService.clearBadge();
  };

  /**
   * Update notification settings
   */
  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      await notificationService.updateSettings(newSettings);
      setSettings(notificationService.getSettings());
    },
    []
  );

  /**
   * Schedule trip reminder
   */
  const scheduleReminder = useCallback(
    async (
      ticketId: number,
      tripId: number,
      origin: string,
      destination: string,
      departureTime: Date
    ): Promise<string | null> => {
      return notificationService.scheduleTripReminder(
        ticketId,
        tripId,
        origin,
        destination,
        departureTime
      );
    },
    []
  );

  /**
   * Cancel scheduled reminder
   */
  const cancelReminder = useCallback(async (notificationId: string) => {
    await notificationService.cancelNotification(notificationId);
  }, []);

  /**
   * Clear badge count
   */
  const clearBadge = useCallback(async () => {
    await notificationService.clearBadge();
  }, []);

  return {
    expoPushToken,
    notification,
    settings,
    updateSettings,
    scheduleReminder,
    cancelReminder,
    clearBadge,
  };
}
