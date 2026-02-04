/**
 * BUS-Tickets - SQLite Database
 * Copyright (c) 2024-2026 IT Enterprise
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'bus_tickets.db';
const DB_VERSION = 1;

class Database {
  private static instance: Database;
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Get database instance
   */
  async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
    }
    return this.db;
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const db = await this.getDb();

    // Create tables
    await db.execAsync(`
      -- User table for offline access
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT,
        name TEXT,
        phone TEXT,
        avatar TEXT,
        synced_at INTEGER
      );

      -- Cached trips
      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY,
        route_id INTEGER,
        route_name TEXT,
        origin_city TEXT,
        origin_country TEXT,
        destination_city TEXT,
        destination_country TEXT,
        departure_time TEXT,
        arrival_time TEXT,
        bus_name TEXT,
        bus_plate TEXT,
        bus_capacity INTEGER,
        bus_amenities TEXT,
        available_seats INTEGER,
        total_seats INTEGER,
        price_amount REAL,
        price_currency TEXT,
        status TEXT,
        synced_at INTEGER
      );

      -- User tickets (most important for offline)
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY,
        ticket_number TEXT UNIQUE,
        trip_id INTEGER,
        passenger_name TEXT,
        passenger_email TEXT,
        passenger_phone TEXT,
        seat INTEGER,
        price_amount REAL,
        price_currency TEXT,
        status TEXT,
        qr_code TEXT,
        purchased_at TEXT,
        checked_in_at TEXT,
        synced_at INTEGER,
        FOREIGN KEY (trip_id) REFERENCES trips(id)
      );

      -- Search history
      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        origin TEXT,
        destination TEXT,
        search_date TEXT,
        passengers INTEGER,
        created_at INTEGER
      );

      -- Offline actions queue
      CREATE TABLE IF NOT EXISTS offline_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_type TEXT,
        entity_type TEXT,
        entity_id INTEGER,
        payload TEXT,
        created_at INTEGER,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT
      );

      -- Cached routes for autocomplete
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY,
        name TEXT,
        origin_city TEXT,
        destination_city TEXT,
        synced_at INTEGER
      );

      -- App metadata
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_trip ON tickets(trip_id);
      CREATE INDEX IF NOT EXISTS idx_trips_departure ON trips(departure_time);
      CREATE INDEX IF NOT EXISTS idx_offline_queue_created ON offline_queue(created_at);
    `);

    // Store database version
    await this.setMetadata('db_version', String(DB_VERSION));

    this.initialized = true;
    console.log('Database initialized');
  }

  /**
   * Get metadata value
   */
  async getMetadata(key: string): Promise<string | null> {
    const db = await this.getDb();
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM metadata WHERE key = ?',
      [key]
    );
    return result?.value || null;
  }

  /**
   * Set metadata value
   */
  async setMetadata(key: string, value: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
      [key, value]
    );
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
    }
  }
}

export const database = Database.getInstance();
