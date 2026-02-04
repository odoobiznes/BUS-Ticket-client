/**
 * BUS-Tickets - Notification Service (Stub)
 * Push notifications disabled in this build
 * Copyright (c) 2024-2026 IT Enterprise
 */

export interface NotificationSettings {
  tripReminders: boolean;
  promotions: boolean;
  bookingUpdates: boolean;
  reminderTime: number;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = {
    tripReminders: true,
    promotions: false,
    bookingUpdates: true,
    reminderTime: 60,
  };

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    console.log('Notifications disabled in this build');
  }

  getPushToken(): string | null {
    return null;
  }

  getSettings(): NotificationSettings {
    return this.settings;
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
  }

  async registerTokenWithBackend(apiUrl: string, userId: number): Promise<void> {
    // No-op
  }

  async scheduleTripReminder(
    ticketId: number,
    tripId: number,
    origin: string,
    destination: string,
    departureTime: Date
  ): Promise<string | null> {
    return null;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    // No-op
  }

  async clearBadge(): Promise<void> {
    // No-op
  }
}

export const notificationService = NotificationService.getInstance();
