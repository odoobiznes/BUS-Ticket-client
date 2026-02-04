/**
 * BUS-Tickets - Notification Hook (Stub)
 * Push notifications disabled in this build
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useCallback } from 'react';
import { notificationService, NotificationSettings } from '../services/NotificationService';

interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: null;
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
  const [settings, setSettings] = useState<NotificationSettings>(
    notificationService.getSettings()
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      await notificationService.updateSettings(newSettings);
      setSettings(notificationService.getSettings());
    },
    []
  );

  const scheduleReminder = useCallback(
    async (
      ticketId: number,
      tripId: number,
      origin: string,
      destination: string,
      departureTime: Date
    ): Promise<string | null> => {
      return null;
    },
    []
  );

  const cancelReminder = useCallback(async (notificationId: string) => {
    // No-op
  }, []);

  const clearBadge = useCallback(async () => {
    // No-op
  }, []);

  return {
    expoPushToken: null,
    notification: null,
    settings,
    updateSettings,
    scheduleReminder,
    cancelReminder,
    clearBadge,
  };
}
