/**
 * BUS-Tickets - Formatting Utilities
 * Copyright (c) 2024-2026 IT Enterprise
 */

import type { Ticket } from '@/types';

export interface Price {
  amount: number;
  currency: string;
}

// Currency formatters
const currencyFormatters: Record<string, Intl.NumberFormat> = {
  UAH: new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }),
  EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
  CZK: new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  PLN: new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }),
};

/**
 * Format price with currency
 */
export function formatPrice(price: Price): string {
  const formatter = currencyFormatters[price.currency];
  if (formatter) {
    return formatter.format(price.amount);
  }
  return `${price.amount} ${price.currency}`;
}

/**
 * Format time from date string (HH:MM)
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format short date (e.g., "Feb 10, 2026")
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format duration in minutes to human readable (e.g., "12h 30m")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Get color for ticket status
 */
export function getTicketStatusColor(status: Ticket['status']): string {
  const colors: Record<Ticket['status'], string> = {
    reserved: '#f59e0b', // amber
    paid: '#10b981', // green
    checked_in: '#3b82f6', // blue
    used: '#6b7280', // gray
    cancelled: '#ef4444', // red
    refunded: '#8b5cf6', // purple
  };
  return colors[status] || '#6b7280';
}

/**
 * Get label for ticket status
 */
export function getTicketStatusLabel(status: Ticket['status']): string {
  const labels: Record<Ticket['status'], string> = {
    reserved: 'Reserved',
    paid: 'Paid',
    checked_in: 'Checked In',
    used: 'Used',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[status] || status;
}

/**
 * Check if ticket is active (can be used)
 */
export function isTicketActive(ticket: Ticket): boolean {
  if (['cancelled', 'refunded', 'used'].includes(ticket.status)) {
    return false;
  }
  const departureTime = new Date(ticket.trip.departureTime);
  const now = new Date();
  // Active if departure is in the future (with 2 hour buffer after departure)
  return departureTime.getTime() > now.getTime() - 2 * 60 * 60 * 1000;
}

/**
 * Check if ticket can be cancelled
 */
export function canCancelTicket(ticket: Ticket): boolean {
  if (['cancelled', 'refunded', 'used', 'checked_in'].includes(ticket.status)) {
    return false;
  }
  const departureTime = new Date(ticket.trip.departureTime);
  const now = new Date();
  // Can cancel if more than 24 hours before departure
  return departureTime.getTime() - now.getTime() > 24 * 60 * 60 * 1000;
}
