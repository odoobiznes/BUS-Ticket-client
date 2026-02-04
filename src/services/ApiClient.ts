/**
 * BUS-Tickets - API Client
 * Copyright (c) 2024-2026 IT Enterprise
 */

import type { AuthTokens, Trip, Ticket, User } from '@/types';

interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  onTokenRefresh?: (tokens: AuthTokens) => Promise<void>;
  onAuthError?: () => Promise<void>;
}

export class BusTicketsApiClient {
  private config: ApiClientConfig;
  private tokens: AuthTokens | null = null;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  setTokens(tokens: AuthTokens): void {
    this.tokens = tokens;
  }

  clearTokens(): void {
    this.tokens = null;
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken ?? null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${this.tokens.accessToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout ?? 30000
    );

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        if (this.config.onAuthError) {
          await this.config.onAuthError();
        }
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthTokens> {
    const response = await this.request<{ data: AuthTokens }>(
      '/api/v1/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    this.tokens = response.data;
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<User> {
    const response = await this.request<{ data: User }>(
      '/api/v1/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async logout(): Promise<void> {
    await this.request('/api/v1/auth/logout', { method: 'POST' });
    this.clearTokens();
  }

  async refreshToken(): Promise<AuthTokens> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<{ data: AuthTokens }>(
      '/api/v1/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      }
    );

    this.tokens = response.data;

    if (this.config.onTokenRefresh) {
      await this.config.onTokenRefresh(response.data);
    }

    return response.data;
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ data: User }>('/api/v1/auth/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.request<{ data: User }>('/api/v1/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Trip endpoints
  async searchTrips(params: {
    originId: number;
    destinationId: number;
    date: string;
    passengers?: number;
  }): Promise<Trip[]> {
    const searchParams = new URLSearchParams({
      origin_id: params.originId.toString(),
      destination_id: params.destinationId.toString(),
      date: params.date,
      passengers: (params.passengers ?? 1).toString(),
    });

    const response = await this.request<{ data: Trip[] }>(
      `/api/v1/trips?${searchParams}`
    );
    return response.data;
  }

  async getTripById(tripId: number): Promise<Trip> {
    const response = await this.request<{ data: Trip }>(
      `/api/v1/trips/${tripId}`
    );
    return response.data;
  }

  // Ticket endpoints
  async getMyTickets(): Promise<Ticket[]> {
    const response = await this.request<{ data: Ticket[] }>(
      '/api/v1/tickets/my'
    );
    return response.data;
  }

  async getTicketById(ticketId: number): Promise<Ticket> {
    const response = await this.request<{ data: Ticket }>(
      `/api/v1/tickets/${ticketId}`
    );
    return response.data;
  }

  async bookTicket(data: {
    tripId: number;
    passengers: Array<{
      name: string;
      email: string;
      phone?: string;
      seat?: number;
    }>;
  }): Promise<Ticket[]> {
    const response = await this.request<{ data: Ticket[] }>(
      '/api/v1/tickets/book',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data;
  }

  async cancelTicket(ticketId: number): Promise<void> {
    await this.request(`/api/v1/tickets/${ticketId}/cancel`, {
      method: 'POST',
    });
  }

  // Station endpoints
  async searchStations(query: string): Promise<Array<{ id: number; name: string; city: string }>> {
    const response = await this.request<{ data: Array<{ id: number; name: string; city: string }> }>(
      `/api/v1/stations/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  async getPopularStations(): Promise<Array<{ id: number; name: string; city: string }>> {
    const response = await this.request<{ data: Array<{ id: number; name: string; city: string }> }>(
      '/api/v1/stations/popular'
    );
    return response.data;
  }
}

export function createApiClient(config: ApiClientConfig): BusTicketsApiClient {
  return new BusTicketsApiClient(config);
}
