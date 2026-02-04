/**
 * BUS-Tickets - Ticket Repository
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { database } from './database';
import type { Ticket, Trip, Currency } from '@/types';

export interface CachedTicket {
  id: number;
  ticket_number: string;
  trip_id: number;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  seat: number | null;
  price_amount: number;
  price_currency: string;
  status: string;
  qr_code: string | null;
  purchased_at: string;
  checked_in_at: string | null;
  synced_at: number;
}

export interface CachedTrip {
  id: number;
  route_id: number;
  route_name: string;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  departure_time: string;
  arrival_time: string;
  bus_name: string;
  bus_plate: string;
  bus_capacity: number;
  bus_amenities: string;
  available_seats: number;
  total_seats: number;
  price_amount: number;
  price_currency: string;
  status: string;
  synced_at: number;
}

class TicketRepository {
  /**
   * Save trip to local database
   */
  async saveTrip(trip: Trip): Promise<void> {
    const db = await database.getDb();

    await db.runAsync(
      `INSERT OR REPLACE INTO trips (
        id, route_id, route_name, origin_city, origin_country,
        destination_city, destination_country, departure_time, arrival_time,
        bus_name, bus_plate, bus_capacity, bus_amenities,
        available_seats, total_seats, price_amount, price_currency,
        status, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trip.id,
        trip.route.id,
        trip.route.name,
        trip.route.origin.city,
        trip.route.origin.country,
        trip.route.destination.city,
        trip.route.destination.country,
        trip.departureTime,
        trip.arrivalTime,
        trip.bus.name,
        trip.bus.plateNumber,
        trip.bus.capacity,
        JSON.stringify(trip.bus.amenities),
        trip.availableSeats,
        trip.totalSeats,
        trip.price.amount,
        trip.price.currency,
        trip.status,
        Date.now(),
      ]
    );
  }

  /**
   * Save multiple trips
   */
  async saveTrips(trips: Trip[]): Promise<void> {
    for (const trip of trips) {
      await this.saveTrip(trip);
    }
  }

  /**
   * Get trip by ID
   */
  async getTrip(id: number): Promise<Trip | null> {
    const db = await database.getDb();
    const row = await db.getFirstAsync<CachedTrip>(
      'SELECT * FROM trips WHERE id = ?',
      [id]
    );

    if (!row) return null;
    return this.mapCachedTripToTrip(row);
  }

  /**
   * Get trips by route
   */
  async getTripsByRoute(
    originCity: string,
    destinationCity: string,
    date?: string
  ): Promise<Trip[]> {
    const db = await database.getDb();

    let query = `
      SELECT * FROM trips
      WHERE origin_city LIKE ? AND destination_city LIKE ?
    `;
    const params: (string | number)[] = [`%${originCity}%`, `%${destinationCity}%`];

    if (date) {
      query += ' AND DATE(departure_time) = DATE(?)';
      params.push(date);
    }

    query += ' ORDER BY departure_time ASC';

    const rows = await db.getAllAsync<CachedTrip>(query, params);
    return rows.map(this.mapCachedTripToTrip);
  }

  /**
   * Save ticket to local database
   */
  async saveTicket(ticket: Ticket): Promise<void> {
    const db = await database.getDb();

    // First save the trip
    await this.saveTrip(ticket.trip);

    // Then save the ticket
    await db.runAsync(
      `INSERT OR REPLACE INTO tickets (
        id, ticket_number, trip_id, passenger_name, passenger_email,
        passenger_phone, seat, price_amount, price_currency, status,
        qr_code, purchased_at, checked_in_at, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket.id,
        ticket.ticketNumber,
        ticket.trip.id,
        ticket.passenger.name,
        ticket.passenger.email,
        ticket.passenger.phone || null,
        ticket.seat || null,
        ticket.price.amount,
        ticket.price.currency,
        ticket.status,
        ticket.qrCode || null,
        ticket.purchasedAt,
        ticket.checkedInAt || null,
        Date.now(),
      ]
    );
  }

  /**
   * Save multiple tickets
   */
  async saveTickets(tickets: Ticket[]): Promise<void> {
    for (const ticket of tickets) {
      await this.saveTicket(ticket);
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicket(id: number): Promise<Ticket | null> {
    const db = await database.getDb();
    const row = await db.getFirstAsync<CachedTicket>(
      'SELECT * FROM tickets WHERE id = ?',
      [id]
    );

    if (!row) return null;

    const trip = await this.getTrip(row.trip_id);
    if (!trip) return null;

    return this.mapCachedTicketToTicket(row, trip);
  }

  /**
   * Get ticket by ticket number
   */
  async getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
    const db = await database.getDb();
    const row = await db.getFirstAsync<CachedTicket>(
      'SELECT * FROM tickets WHERE ticket_number = ?',
      [ticketNumber]
    );

    if (!row) return null;

    const trip = await this.getTrip(row.trip_id);
    if (!trip) return null;

    return this.mapCachedTicketToTicket(row, trip);
  }

  /**
   * Get all user tickets
   */
  async getAllTickets(): Promise<Ticket[]> {
    const db = await database.getDb();
    const rows = await db.getAllAsync<CachedTicket>(
      'SELECT * FROM tickets ORDER BY purchased_at DESC'
    );

    const tickets: Ticket[] = [];
    for (const row of rows) {
      const trip = await this.getTrip(row.trip_id);
      if (trip) {
        tickets.push(this.mapCachedTicketToTicket(row, trip));
      }
    }

    return tickets;
  }

  /**
   * Get upcoming tickets
   */
  async getUpcomingTickets(): Promise<Ticket[]> {
    const db = await database.getDb();
    const now = new Date().toISOString();

    const rows = await db.getAllAsync<CachedTicket & { departure_time: string }>(
      `SELECT t.*, tr.departure_time
       FROM tickets t
       JOIN trips tr ON t.trip_id = tr.id
       WHERE tr.departure_time > ?
       AND t.status IN ('reserved', 'paid', 'checked_in')
       ORDER BY tr.departure_time ASC`,
      [now]
    );

    const tickets: Ticket[] = [];
    for (const row of rows) {
      const trip = await this.getTrip(row.trip_id);
      if (trip) {
        tickets.push(this.mapCachedTicketToTicket(row, trip));
      }
    }

    return tickets;
  }

  /**
   * Update ticket status locally
   */
  async updateTicketStatus(id: number, status: string): Promise<void> {
    const db = await database.getDb();
    await db.runAsync(
      'UPDATE tickets SET status = ?, synced_at = ? WHERE id = ?',
      [status, Date.now(), id]
    );
  }

  /**
   * Delete old tickets (older than 90 days)
   */
  async cleanupOldTickets(): Promise<number> {
    const db = await database.getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await db.runAsync(
      `DELETE FROM tickets WHERE id IN (
        SELECT t.id FROM tickets t
        JOIN trips tr ON t.trip_id = tr.id
        WHERE tr.departure_time < ?
      )`,
      [cutoffDate.toISOString()]
    );

    return result.changes;
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(): Promise<number | null> {
    const db = await database.getDb();
    const result = await db.getFirstAsync<{ max_synced: number }>(
      'SELECT MAX(synced_at) as max_synced FROM tickets'
    );
    return result?.max_synced || null;
  }

  /**
   * Convert cached trip row to Trip object
   */
  private mapCachedTripToTrip(row: CachedTrip): Trip {
    return {
      id: row.id,
      route: {
        id: row.route_id,
        name: row.route_name,
        origin: {
          id: 0,
          name: row.origin_city,
          city: row.origin_city,
          country: row.origin_country,
        },
        destination: {
          id: 0,
          name: row.destination_city,
          city: row.destination_city,
          country: row.destination_country,
        },
      },
      departureTime: row.departure_time,
      arrivalTime: row.arrival_time,
      bus: {
        id: 0,
        name: row.bus_name,
        plateNumber: row.bus_plate,
        capacity: row.bus_capacity,
        amenities: JSON.parse(row.bus_amenities || '[]'),
      },
      availableSeats: row.available_seats,
      totalSeats: row.total_seats,
      price: {
        amount: row.price_amount,
        currency: row.price_currency as Currency,
      },
      status: row.status as Trip['status'],
    };
  }

  /**
   * Convert cached ticket row to Ticket object
   */
  private mapCachedTicketToTicket(row: CachedTicket, trip: Trip): Ticket {
    return {
      id: row.id,
      ticketNumber: row.ticket_number,
      trip,
      passenger: {
        name: row.passenger_name,
        email: row.passenger_email,
        phone: row.passenger_phone,
      },
      seat: row.seat || undefined,
      price: {
        amount: row.price_amount,
        currency: row.price_currency as Currency,
      },
      status: row.status as Ticket['status'],
      qrCode: row.qr_code ?? '',
      purchasedAt: row.purchased_at,
      checkedInAt: row.checked_in_at || undefined,
    };
  }
}

export const ticketRepository = new TicketRepository();
