/**
 * BUS-Tickets - Bus Operators/Providers Context
 * Manages multiple data sources for different bus companies
 * Copyright (c) 2024-2026 IT Enterprise
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Bus operator/provider interface
export interface BusProvider {
  id: string;
  name: string;
  displayName: string;
  apiUrl: string;
  logoUrl?: string;
  primaryColor?: string;
  enabled: boolean;
  isDefault: boolean;
  // API credentials (optional for some providers)
  apiKey?: string;
  // Provider metadata
  country?: string;
  supportEmail?: string;
  supportPhone?: string;
  website?: string;
  // Feature flags
  supportsOnlinePayment: boolean;
  supportsSeatSelection: boolean;
  supportsRefunds: boolean;
  // Connection status
  isConnected: boolean;
  lastSyncAt?: string;
  errorMessage?: string;
}

// Trip with provider info
export interface TripWithProvider {
  id: number | string;
  providerId: string;
  providerName: string;
  providerLogo?: string;
  providerColor?: string;
  // Trip details
  route: {
    id?: number;
    name?: string;
    origin: { id: number; name: string; city?: string };
    destination: { id: number; name: string; city?: string };
  };
  departure: string;
  arrival: string;
  duration: number;
  price: {
    amount: number;
    currency: string;
  };
  availableSeats: number;
  bus?: {
    id?: number;
    name?: string;
    plateNumber?: string;
    capacity?: number;
    amenities?: string[];
  };
  busInfo?: {
    type: string;
    amenities: string[];
  };
}

interface ProvidersContextType {
  providers: BusProvider[];
  activeProviders: BusProvider[];
  isLoading: boolean;

  // Provider management
  addProvider: (provider: Omit<BusProvider, 'id' | 'isConnected'>) => Promise<void>;
  updateProvider: (id: string, updates: Partial<BusProvider>) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  toggleProvider: (id: string, enabled: boolean) => Promise<void>;
  setDefaultProvider: (id: string) => Promise<void>;

  // Connection
  testConnection: (provider: BusProvider) => Promise<boolean>;
  syncProvider: (id: string) => Promise<void>;
  syncAllProviders: () => Promise<void>;

  // Search across providers
  searchTrips: (params: SearchParams) => Promise<TripWithProvider[]>;

  // Get provider by ID
  getProvider: (id: string) => BusProvider | undefined;
}

interface SearchParams {
  originId: number;
  destinationId: number;
  date: string;
  passengers: number;
}

const ProvidersContext = createContext<ProvidersContextType | undefined>(undefined);

const PROVIDERS_STORAGE_KEY = '@bus_tickets_providers';

// Ensure HTTPS for web platform
function ensureHttps(url: string): string {
  if (!url) return url;
  if (Platform.OS === 'web' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

// Default providers (can be customized per installation)
const defaultProviders: BusProvider[] = [
  {
    id: 'symchera',
    name: 'symchera',
    displayName: 'SymcheraBus',
    apiUrl: 'https://symcherabus.eu/odoo',
    logoUrl: 'https://symcherabus.eu/odoo/web/image/website/1/logo',
    primaryColor: '#e94560',
    enabled: true,
    isDefault: true,
    country: 'CZ/UA',
    supportsOnlinePayment: true,
    supportsSeatSelection: true,
    supportsRefunds: true,
    isConnected: false,
  },
];

export function ProvidersProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<BusProvider[]>(defaultProviders);
  const [isLoading, setIsLoading] = useState(true);

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROVIDERS_STORAGE_KEY);
      if (stored) {
        const parsedProviders = JSON.parse(stored) as BusProvider[];
        // Merge with defaults to ensure all fields exist
        const mergedProviders = parsedProviders.map(p => ({
          ...defaultProviders.find(dp => dp.id === p.id) || {},
          ...p,
        }));
        setProviders(mergedProviders);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProviders = async (newProviders: BusProvider[]) => {
    try {
      await AsyncStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(newProviders));
      setProviders(newProviders);
    } catch (error) {
      console.error('Error saving providers:', error);
      throw error;
    }
  };

  const addProvider = useCallback(async (providerData: Omit<BusProvider, 'id' | 'isConnected'>) => {
    const id = `provider_${Date.now()}`;
    const newProvider: BusProvider = {
      ...providerData,
      id,
      isConnected: false,
    };

    const updated = [...providers, newProvider];
    await saveProviders(updated);
  }, [providers]);

  const updateProvider = useCallback(async (id: string, updates: Partial<BusProvider>) => {
    const updated = providers.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    await saveProviders(updated);
  }, [providers]);

  const removeProvider = useCallback(async (id: string) => {
    const updated = providers.filter(p => p.id !== id);
    await saveProviders(updated);
  }, [providers]);

  const toggleProvider = useCallback(async (id: string, enabled: boolean) => {
    await updateProvider(id, { enabled });
  }, [updateProvider]);

  const setDefaultProvider = useCallback(async (id: string) => {
    const updated = providers.map(p => ({
      ...p,
      isDefault: p.id === id,
    }));
    await saveProviders(updated);
  }, [providers]);

  const testConnection = useCallback(async (provider: BusProvider): Promise<boolean> => {
    try {
      const url = ensureHttps(`${provider.apiUrl}/api/v1/config`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(provider.apiKey ? { 'X-API-Key': provider.apiKey } : {}),
        },
      });

      if (response.ok) {
        await updateProvider(provider.id, {
          isConnected: true,
          lastSyncAt: new Date().toISOString(),
          errorMessage: undefined,
        });
        return true;
      } else {
        await updateProvider(provider.id, {
          isConnected: false,
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
        });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      await updateProvider(provider.id, {
        isConnected: false,
        errorMessage: message,
      });
      return false;
    }
  }, [updateProvider]);

  const syncProvider = useCallback(async (id: string) => {
    const provider = providers.find(p => p.id === id);
    if (provider) {
      await testConnection(provider);
    }
  }, [providers, testConnection]);

  const syncAllProviders = useCallback(async () => {
    const activeProviders = providers.filter(p => p.enabled);
    await Promise.all(activeProviders.map(p => testConnection(p)));
  }, [providers, testConnection]);

  const searchTrips = useCallback(async (params: SearchParams): Promise<TripWithProvider[]> => {
    const activeProviders = providers.filter(p => p.enabled);
    const allTrips: TripWithProvider[] = [];

    // Search all active providers in parallel
    const results = await Promise.allSettled(
      activeProviders.map(async (provider) => {
        try {
          const url = ensureHttps(
            `${provider.apiUrl}/api/v1/trips/search?` +
            `origin_id=${params.originId}&` +
            `destination_id=${params.destinationId}&` +
            `date=${params.date}&` +
            `passengers=${params.passengers}`
          );

          const response = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              ...(provider.apiKey ? { 'X-API-Key': provider.apiKey } : {}),
            },
          });

          if (!response.ok) {
            console.warn(`Provider ${provider.name} returned ${response.status}`);
            return [];
          }

          const data = await response.json();

          if (data.success && data.data?.trips) {
            return data.data.trips.map((trip: any) => ({
              ...trip,
              providerId: provider.id,
              providerName: provider.displayName,
              providerLogo: provider.logoUrl,
              providerColor: provider.primaryColor,
            }));
          }

          return [];
        } catch (error) {
          console.error(`Error searching provider ${provider.name}:`, error);
          return [];
        }
      })
    );

    // Collect all successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allTrips.push(...result.value);
      }
    });

    // Sort by departure time
    allTrips.sort((a, b) =>
      new Date(a.departure).getTime() - new Date(b.departure).getTime()
    );

    return allTrips;
  }, [providers]);

  const getProvider = useCallback((id: string): BusProvider | undefined => {
    return providers.find(p => p.id === id);
  }, [providers]);

  const activeProviders = providers.filter(p => p.enabled);

  return (
    <ProvidersContext.Provider
      value={{
        providers,
        activeProviders,
        isLoading,
        addProvider,
        updateProvider,
        removeProvider,
        toggleProvider,
        setDefaultProvider,
        testConnection,
        syncProvider,
        syncAllProviders,
        searchTrips,
        getProvider,
      }}
    >
      {children}
    </ProvidersContext.Provider>
  );
}

export function useProviders() {
  const context = useContext(ProvidersContext);
  if (context === undefined) {
    throw new Error('useProviders must be used within a ProvidersProvider');
  }
  return context;
}
