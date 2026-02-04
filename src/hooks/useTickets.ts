/**
 * BUS-Tickets - Tickets Hook
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useCallback, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';
import type { Ticket } from '@/types';

interface UseTicketsReturn {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  loadTickets: () => Promise<void>;
  getTicketDetails: (ticketId: number) => Promise<Ticket>;
  cancelTicket: (ticketId: number) => Promise<Ticket>;
  checkInTicket: (ticketId: number, location?: { latitude: number; longitude: number }) => Promise<Ticket>;
  createBooking: (data: {
    tripId: number;
    passengers: Array<{
      name: string;
      email: string;
      phone: string;
      seat_number?: number;
    }>;
    payment_method: string;
  }) => Promise<{
    booking_id: number;
    tickets: Ticket[];
    payment_url?: string;
  }>;
}

export function useTickets(): UseTicketsReturn {
  const api = useApi();
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    if (!isAuthenticated) {
      setTickets([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const userTickets = await api.getUserTickets();
      setTickets(userTickets);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tickets';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [api, isAuthenticated]);

  // Auto-load tickets when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadTickets();
    }
  }, [isAuthenticated]);

  const getTicketDetails = useCallback(async (ticketId: number): Promise<Ticket> => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.getTicketDetails(ticketId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get ticket details';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const cancelTicket = useCallback(async (ticketId: number): Promise<Ticket> => {
    setIsLoading(true);
    setError(null);
    try {
      const cancelledTicket = await api.cancelTicket(ticketId);
      // Update local state
      setTickets(prev => prev.map(t => t.id === ticketId ? cancelledTicket : t));
      return cancelledTicket;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel ticket';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const checkInTicket = useCallback(async (
    ticketId: number,
    location?: { latitude: number; longitude: number }
  ): Promise<Ticket> => {
    setIsLoading(true);
    setError(null);
    try {
      const checkedInTicket = await api.checkInTicket(ticketId, location);
      // Update local state
      setTickets(prev => prev.map(t => t.id === ticketId ? checkedInTicket : t));
      return checkedInTicket;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check in';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const createBooking = useCallback(async (data: {
    tripId: number;
    passengers: Array<{
      name: string;
      email: string;
      phone: string;
      seat_number?: number;
    }>;
    payment_method: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.createBooking(data);
      // Add new tickets to state
      setTickets(prev => [...result.tickets, ...prev]);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  return {
    tickets,
    isLoading,
    error,
    loadTickets,
    getTicketDetails,
    cancelTicket,
    checkInTicket,
    createBooking,
  };
}
