/**
 * BUS-Tickets - Network Context
 * Copyright (c) 2024-2026 IT Enterprise
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

// Only import native modules on non-web platforms
const isWeb = Platform.OS === 'web';
let Network: typeof import('expo-network') | null = null;
let syncService: typeof import('../services/SyncService').syncService | null = null;
let database: typeof import('../db/database').database | null = null;

if (!isWeb) {
  Network = require('expo-network');
  syncService = require('../services/SyncService').syncService;
  database = require('../db/database').database;
}

// Default sync state for web
type SyncState = {
  status: 'idle' | 'syncing' | 'success' | 'error' | 'offline';
  lastSyncTime: number | null;
  pendingActions: number;
  error: string | null;
};

interface NetworkContextType {
  isOnline: boolean;
  isInitialized: boolean;
  syncState: SyncState;
  sync: () => Promise<boolean>;
  forceSync: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
  apiUrl: string;
}

const defaultSyncState: SyncState = {
  status: 'idle',
  lastSyncTime: null,
  pendingActions: 0,
  error: null,
};

export function NetworkProvider({ children, apiUrl }: NetworkProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(
    isWeb ? defaultSyncState : (syncService?.getState() || defaultSyncState)
  );

  useEffect(() => {
    initialize();

    // Skip native-only setup on web
    if (isWeb) {
      // Use navigator.onLine for web
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      if (typeof window !== 'undefined') {
        setIsOnline(navigator.onLine);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
      return;
    }

    // Native: Subscribe to sync state changes
    const unsubscribe = syncService?.subscribe((state: SyncState) => {
      setSyncState(state);
      setIsOnline(syncService?.isNetworkOnline() ?? true);
    });

    // Check network periodically
    const interval = setInterval(checkNetwork, 10000);

    return () => {
      unsubscribe?.();
      clearInterval(interval);
      syncService?.stopNetworkMonitoring();
    };
  }, [apiUrl]);

  const initialize = async () => {
    // On web, skip database/sync initialization
    if (isWeb) {
      setIsInitialized(true);
      return;
    }

    try {
      // Initialize database (native only)
      await database?.initialize();

      // Initialize sync service (native only)
      await syncService?.initialize(apiUrl);

      // Check initial network state
      await checkNetwork();

      setIsInitialized(true);

      // Initial sync if online
      if (syncService?.isNetworkOnline()) {
        syncService.sync();
      }
    } catch (error) {
      console.error('Error initializing network provider:', error);
      setIsInitialized(true); // Continue anyway
    }
  };

  const checkNetwork = async () => {
    if (isWeb) {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      return;
    }

    try {
      const state = await Network?.getNetworkStateAsync();
      const online = state?.isConnected === true && state?.isInternetReachable === true;
      setIsOnline(online);
    } catch (error) {
      console.error('Error checking network:', error);
    }
  };

  const sync = async (): Promise<boolean> => {
    if (isWeb) return true; // No-op on web
    return syncService?.sync() ?? true;
  };

  const forceSync = async (): Promise<boolean> => {
    if (isWeb) return true; // No-op on web
    return syncService?.sync({ forceSync: true }) ?? true;
  };

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isInitialized,
        syncState,
        sync,
        forceSync,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
