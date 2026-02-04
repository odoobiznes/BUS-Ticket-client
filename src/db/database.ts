/**
 * BUS-Tickets - Database (AsyncStorage fallback)
 * SQLite disabled in this build - using AsyncStorage
 * Copyright (c) 2024-2026 IT Enterprise
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class Database {
  private static instance: Database;
  private initialized = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    console.log('Database initialized (AsyncStorage mode)');
    this.initialized = true;
  }

  async getMetadata(key: string): Promise<string | null> {
    return AsyncStorage.getItem(`@db_meta_${key}`);
  }

  async setMetadata(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(`@db_meta_${key}`, value);
  }

  async close(): Promise<void> {
    // No-op for AsyncStorage
  }
}

export const database = Database.getInstance();
