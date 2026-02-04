/**
 * BUS-Tickets - Trips Hook
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useCallback } from 'react';
import { useApi } from '../contexts/ApiContext';
import type { Trip, TripSearchParams, TripSearchResult } from '@/types';

interface UseTripsReturn {
  trips: Trip[];
  isLoading: boolean;
  error: string | null;
  searchTrips: (params: TripSearchParams) => Promise<TripSearchResult>;
  getTripDetails: (tripId: number) => Promise<Trip>;
  getPopularTrips: () => Promise<Trip[]>;
  clearTrips: () => void;
}

export function useTrips(): UseTripsReturn {
  const api = useApi();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTrips = useCallback(async (params: TripSearchParams): Promise<TripSearchResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.searchTrips(params);
      setTrips(result.outbound);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search trips';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const getTripDetails = useCallback(async (tripId: number): Promise<Trip> => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.getTripDetails(tripId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get trip details';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const getPopularTrips = useCallback(async (): Promise<Trip[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const popular = await api.getPopularTrips();
      setTrips(popular);
      return popular;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get popular trips';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const clearTrips = useCallback(() => {
    setTrips([]);
    setError(null);
  }, []);

  return {
    trips,
    isLoading,
    error,
    searchTrips,
    getTripDetails,
    getPopularTrips,
    clearTrips,
  };
}
