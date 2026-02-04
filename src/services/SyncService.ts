/**
 * BUS-Tickets - Sync Service
 * Copyright (c) 2024-2026 IT Enterprise
 */

import * as Network from 'expo-network';
import { database } from '../db/database';
import { ticketRepository } from '../db/TicketRepository';
import { offlineQueue, QueuedAction, ActionPayload } from '../db/OfflineQueue';
import type { Ticket, Trip } from '@/types';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: number | null;
  pendingActions: number;
  error: string | null;
}

export interface SyncOptions {
  forceSync?: boolean;
  syncTickets?: boolean;
  syncTrips?: boolean;
  processQueue?: boolean;
}

type SyncListener = (state: SyncState) => void;

class SyncService {
  private static instance: SyncService;
  private apiUrl: string = '';
  private authToken: string | null = null;
  private state: SyncState = {
    status: 'idle',
    lastSyncTime: null,
    pendingActions: 0,
    error: null,
  };
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isOnline: boolean = true;

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialize sync service
   */
  async initialize(apiUrl: string): Promise<void> {
    this.apiUrl = apiUrl;

    // Initialize database
    await database.initialize();

    // Check initial network state
    await this.checkNetworkStatus();

    // Start network monitoring
    this.startNetworkMonitoring();

    // Get pending action count
    this.state.pendingActions = await offlineQueue.getPendingCount();

    // Get last sync time
    this.state.lastSyncTime = await ticketRepository.getLastSyncTime();

    this.notifyListeners();
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Check if online
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Check network status
   */
  private async checkNetworkStatus(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      this.isOnline = networkState.isConnected === true && networkState.isInternetReachable === true;

      if (!this.isOnline) {
        this.updateState({ status: 'offline' });
      }

      return this.isOnline;
    } catch (error) {
      console.error('Error checking network status:', error);
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Start network monitoring
   */
  private startNetworkMonitoring(): void {
    // Check every 30 seconds
    this.syncInterval = setInterval(async () => {
      const wasOnline = this.isOnline;
      await this.checkNetworkStatus();

      // If we came back online, trigger sync
      if (!wasOnline && this.isOnline) {
        console.log('Network restored, starting sync...');
        this.sync({ processQueue: true });
      }
    }, 30000);
  }

  /**
   * Stop network monitoring
   */
  stopNetworkMonitoring(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform full sync
   */
  async sync(options: SyncOptions = {}): Promise<boolean> {
    const {
      forceSync = false,
      syncTickets = true,
      syncTrips = true,
      processQueue = true,
    } = options;

    // Check network
    if (!await this.checkNetworkStatus()) {
      this.updateState({ status: 'offline', error: 'No network connection' });
      return false;
    }

    // Check if already syncing
    if (this.state.status === 'syncing' && !forceSync) {
      console.log('Sync already in progress');
      return false;
    }

    this.updateState({ status: 'syncing', error: null });

    try {
      // Process offline queue first
      if (processQueue) {
        await this.processOfflineQueue();
      }

      // Sync tickets
      if (syncTickets && this.authToken) {
        await this.syncTickets();
      }

      // Sync trips (popular routes)
      if (syncTrips) {
        await this.syncPopularTrips();
      }

      // Update state
      const pendingActions = await offlineQueue.getPendingCount();
      this.updateState({
        status: 'success',
        lastSyncTime: Date.now(),
        pendingActions,
      });

      // Store last sync time
      await database.setMetadata('last_sync', String(Date.now()));

      console.log('Sync completed successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      this.updateState({ status: 'error', error: errorMessage });
      console.error('Sync error:', error);
      return false;
    }
  }

  /**
   * Sync user tickets from server
   */
  private async syncTickets(): Promise<void> {
    if (!this.authToken) return;

    try {
      const response = await fetch(`${this.apiUrl}/api/v1/tickets`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();

      if (data.tickets && Array.isArray(data.tickets)) {
        await ticketRepository.saveTickets(data.tickets);
        console.log(`Synced ${data.tickets.length} tickets`);
      }
    } catch (error) {
      console.error('Error syncing tickets:', error);
      throw error;
    }
  }

  /**
   * Sync popular trips for offline search
   */
  private async syncPopularTrips(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/trips/popular`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Non-critical, just log
        console.log('Could not fetch popular trips');
        return;
      }

      const data = await response.json();

      if (data.trips && Array.isArray(data.trips)) {
        await ticketRepository.saveTrips(data.trips);
        console.log(`Cached ${data.trips.length} popular trips`);
      }
    } catch (error) {
      // Non-critical error
      console.log('Error caching popular trips:', error);
    }
  }

  /**
   * Process offline action queue
   */
  private async processOfflineQueue(): Promise<void> {
    const pendingActions = await offlineQueue.getPendingActions();

    if (pendingActions.length === 0) {
      console.log('No pending offline actions');
      return;
    }

    console.log(`Processing ${pendingActions.length} offline actions`);

    for (const action of pendingActions) {
      try {
        await this.processAction(action);
        await offlineQueue.complete(action.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await offlineQueue.fail(action.id, errorMessage);
      }
    }

    // Update pending count
    this.state.pendingActions = await offlineQueue.getPendingCount();
  }

  /**
   * Process single offline action
   */
  private async processAction(action: QueuedAction): Promise<void> {
    const payload: ActionPayload = JSON.parse(action.payload);

    console.log(`Processing action: ${action.action_type}`);

    switch (action.action_type) {
      case 'CREATE_BOOKING':
        await this.processCreateBooking(payload);
        break;

      case 'CANCEL_TICKET':
        await this.processCancelTicket(action.entity_id!, payload);
        break;

      case 'UPDATE_PROFILE':
        await this.processUpdateProfile(payload);
        break;

      case 'CHECK_IN':
        await this.processCheckIn(action.entity_id!);
        break;

      default:
        console.warn(`Unknown action type: ${action.action_type}`);
    }
  }

  /**
   * Process create booking action
   */
  private async processCreateBooking(payload: ActionPayload): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/v1/bookings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create booking');
    }

    // Save the new ticket locally
    const data = await response.json();
    if (data.ticket) {
      await ticketRepository.saveTicket(data.ticket);
    }
  }

  /**
   * Process cancel ticket action
   */
  private async processCancelTicket(
    ticketId: number,
    payload: ActionPayload
  ): Promise<void> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/tickets/${ticketId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel ticket');
    }

    // Update local ticket status
    await ticketRepository.updateTicketStatus(ticketId, 'cancelled');
  }

  /**
   * Process profile update action
   */
  private async processUpdateProfile(payload: ActionPayload): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/v1/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  /**
   * Process check-in action
   */
  private async processCheckIn(ticketId: number): Promise<void> {
    const response = await fetch(
      `${this.apiUrl}/api/v1/tickets/${ticketId}/check-in`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check in');
    }

    // Update local ticket status
    await ticketRepository.updateTicketStatus(ticketId, 'checked_in');
  }

  /**
   * Queue action for offline execution
   */
  async queueAction(
    actionType: QueuedAction['action_type'],
    entityType: QueuedAction['entity_type'],
    entityId: number | null,
    payload: ActionPayload
  ): Promise<number> {
    const actionId = await offlineQueue.enqueue(
      actionType,
      entityType,
      entityId,
      payload
    );

    this.state.pendingActions = await offlineQueue.getPendingCount();
    this.notifyListeners();

    // Try to process immediately if online
    if (this.isOnline) {
      this.sync({ processQueue: true, syncTickets: false, syncTrips: false });
    }

    return actionId;
  }

  /**
   * Get tickets (from cache if offline)
   */
  async getTickets(): Promise<Ticket[]> {
    if (this.isOnline && this.authToken) {
      try {
        await this.syncTickets();
      } catch (error) {
        console.log('Using cached tickets due to sync error');
      }
    }

    return ticketRepository.getAllTickets();
  }

  /**
   * Get ticket by ID
   */
  async getTicket(id: number): Promise<Ticket | null> {
    return ticketRepository.getTicket(id);
  }

  /**
   * Search trips (from cache if offline)
   */
  async searchTrips(
    origin: string,
    destination: string,
    date?: string
  ): Promise<Trip[]> {
    // Try online first
    if (this.isOnline) {
      try {
        const params = new URLSearchParams({
          origin,
          destination,
          ...(date && { date }),
        });

        const response = await fetch(
          `${this.apiUrl}/api/v1/trips/search?${params}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.trips) {
            // Cache results
            await ticketRepository.saveTrips(data.trips);
            return data.trips;
          }
        }
      } catch (error) {
        console.log('Using cached trips due to search error');
      }
    }

    // Fall back to cache
    return ticketRepository.getTripsByRoute(origin, destination, date);
  }

  /**
   * Update state and notify listeners
   */
  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Cleanup old data
   */
  async cleanup(): Promise<void> {
    const deletedTickets = await ticketRepository.cleanupOldTickets();
    console.log(`Cleaned up ${deletedTickets} old tickets`);
  }
}

export const syncService = SyncService.getInstance();
