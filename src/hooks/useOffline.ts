/**
 * BUS-Tickets - Offline Mode Hook
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncState, SyncOptions } from '../services/SyncService';
import { ticketRepository } from '../db/TicketRepository';
import { offlineQueue, ActionType, EntityType, ActionPayload } from '../db/OfflineQueue';
import type { Ticket, Trip } from '@/types';

interface UseOfflineReturn {
  // Sync state
  syncState: SyncState;
  isOnline: boolean;
  isSyncing: boolean;
  pendingActions: number;
  lastSyncTime: Date | null;

  // Sync operations
  sync: (options?: SyncOptions) => Promise<boolean>;
  forceSync: () => Promise<boolean>;

  // Data operations (with offline support)
  getTickets: () => Promise<Ticket[]>;
  getTicket: (id: number) => Promise<Ticket | null>;
  getUpcomingTickets: () => Promise<Ticket[]>;
  searchTrips: (origin: string, destination: string, date?: string) => Promise<Trip[]>;

  // Offline actions
  queueBooking: (tripId: number, passengers: number, seats: number[], passenger: any) => Promise<number>;
  queueCancelTicket: (ticketId: number, reason?: string) => Promise<number>;
  queueCheckIn: (ticketId: number) => Promise<number>;

  // Queue management
  getPendingActions: () => Promise<any[]>;
  retryFailedAction: (actionId: number) => Promise<void>;
  clearFailedActions: () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [syncState, setSyncState] = useState<SyncState>(syncService.getState());

  useEffect(() => {
    // Subscribe to sync state changes
    const unsubscribe = syncService.subscribe((state) => {
      setSyncState(state);
    });

    return unsubscribe;
  }, []);

  /**
   * Perform sync
   */
  const sync = useCallback(async (options?: SyncOptions): Promise<boolean> => {
    return syncService.sync(options);
  }, []);

  /**
   * Force full sync
   */
  const forceSync = useCallback(async (): Promise<boolean> => {
    return syncService.sync({
      forceSync: true,
      syncTickets: true,
      syncTrips: true,
      processQueue: true,
    });
  }, []);

  /**
   * Get all tickets (with offline support)
   */
  const getTickets = useCallback(async (): Promise<Ticket[]> => {
    return syncService.getTickets();
  }, []);

  /**
   * Get single ticket
   */
  const getTicket = useCallback(async (id: number): Promise<Ticket | null> => {
    return syncService.getTicket(id);
  }, []);

  /**
   * Get upcoming tickets
   */
  const getUpcomingTickets = useCallback(async (): Promise<Ticket[]> => {
    return ticketRepository.getUpcomingTickets();
  }, []);

  /**
   * Search trips (with offline cache)
   */
  const searchTrips = useCallback(
    async (origin: string, destination: string, date?: string): Promise<Trip[]> => {
      return syncService.searchTrips(origin, destination, date);
    },
    []
  );

  /**
   * Queue booking for offline execution
   */
  const queueBooking = useCallback(
    async (
      tripId: number,
      passengers: number,
      seats: number[],
      passenger: any
    ): Promise<number> => {
      return syncService.queueAction('CREATE_BOOKING', 'booking', null, {
        trip_id: tripId,
        passengers,
        seats,
        passenger,
      });
    },
    []
  );

  /**
   * Queue ticket cancellation
   */
  const queueCancelTicket = useCallback(
    async (ticketId: number, reason?: string): Promise<number> => {
      // Update local status immediately
      await ticketRepository.updateTicketStatus(ticketId, 'cancelled');

      return syncService.queueAction('CANCEL_TICKET', 'ticket', ticketId, {
        reason,
      });
    },
    []
  );

  /**
   * Queue check-in
   */
  const queueCheckIn = useCallback(async (ticketId: number): Promise<number> => {
    // Update local status immediately
    await ticketRepository.updateTicketStatus(ticketId, 'checked_in');

    return syncService.queueAction('CHECK_IN', 'ticket', ticketId, {});
  }, []);

  /**
   * Get pending actions from queue
   */
  const getPendingActions = useCallback(async () => {
    return offlineQueue.getPendingActions();
  }, []);

  /**
   * Retry a failed action
   */
  const retryFailedAction = useCallback(async (actionId: number): Promise<void> => {
    await offlineQueue.retry(actionId);
    // Trigger sync to process
    syncService.sync({ processQueue: true, syncTickets: false, syncTrips: false });
  }, []);

  /**
   * Clear all failed actions
   */
  const clearFailedActions = useCallback(async (): Promise<void> => {
    await offlineQueue.clearCompleted();
  }, []);

  return {
    // State
    syncState,
    isOnline: syncService.isNetworkOnline(),
    isSyncing: syncState.status === 'syncing',
    pendingActions: syncState.pendingActions,
    lastSyncTime: syncState.lastSyncTime ? new Date(syncState.lastSyncTime) : null,

    // Sync operations
    sync,
    forceSync,

    // Data operations
    getTickets,
    getTicket,
    getUpcomingTickets,
    searchTrips,

    // Offline actions
    queueBooking,
    queueCancelTicket,
    queueCheckIn,

    // Queue management
    getPendingActions,
    retryFailedAction,
    clearFailedActions,
  };
}
