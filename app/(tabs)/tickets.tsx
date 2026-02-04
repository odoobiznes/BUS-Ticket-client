/**
 * BUS-Tickets - My Tickets Screen
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Ticket } from '@/types';
import { formatPrice, formatTime, formatShortDate, getTicketStatusColor } from '@/utils/formatting';

// Mock tickets data
const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    ticketNumber: 'BT-2026-00001',
    trip: {
      id: 1,
      route: {
        id: 1,
        name: 'Uzhorod - Praha',
        origin: { id: 1, name: 'Uzhorod', city: 'Uzhorod', country: 'UA' },
        destination: { id: 2, name: 'Praha', city: 'Praha', country: 'CZ' },
      },
      departureTime: '2026-02-10T06:00:00Z',
      arrivalTime: '2026-02-10T18:00:00Z',
      bus: {
        id: 1,
        name: 'Mercedes Tourismo',
        plateNumber: 'AA1234BB',
        capacity: 50,
        amenities: ['wifi', 'ac', 'usb', 'toilet'],
      },
      availableSeats: 20,
      totalSeats: 50,
      price: { amount: 1200, currency: 'UAH' },
      status: 'scheduled',
    },
    passenger: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+380501234567',
    },
    seat: 15,
    price: { amount: 1200, currency: 'UAH' },
    status: 'paid',
    qrCode: 'BT-2026-00001',
    purchasedAt: '2026-02-03T10:30:00Z',
  },
];

type TicketFilter = 'all' | 'upcoming' | 'past';

export default function TicketsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TicketFilter>('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTickets(MOCK_TICKETS);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const filterTickets = (tickets: Ticket[]): Ticket[] => {
    const now = new Date();

    switch (filter) {
      case 'upcoming':
        return tickets.filter(
          (t) =>
            new Date(t.trip.departureTime) > now &&
            ['reserved', 'paid', 'checked_in'].includes(t.status)
        );
      case 'past':
        return tickets.filter(
          (t) =>
            new Date(t.trip.departureTime) <= now ||
            ['used', 'cancelled', 'refunded'].includes(t.status)
        );
      default:
        return tickets;
    }
  };

  const filteredTickets = filterTickets(tickets);
  const styles = createStyles(colors);

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="ticket-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>Sign in to view your tickets</Text>
        <Text style={styles.emptyText}>
          Your purchased tickets will appear here
        </Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push('/auth/signin')}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading tickets...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'upcoming', 'past'] as TicketFilter[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterTab,
              filter === filterType && styles.filterTabActive,
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterType && styles.filterTabTextActive,
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tickets list */}
      {filteredTickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No tickets found</Text>
          <Text style={styles.emptyText}>
            {filter === 'upcoming'
              ? "You don't have any upcoming trips."
              : filter === 'past'
              ? "You haven't taken any trips yet."
              : "You haven't purchased any tickets yet."}
          </Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.bookButtonText}>Book a Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.ticketsList}>
          {filteredTickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketCard}
              onPress={() =>
                router.push({
                  pathname: '/ticket/[ticketId]',
                  params: { ticketId: ticket.id.toString() },
                })
              }
            >
              {/* Status indicator */}
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getTicketStatusColor(ticket.status) },
                ]}
              />

              <View style={styles.ticketContent}>
                {/* Header */}
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getTicketStatusColor(ticket.status)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getTicketStatusColor(ticket.status) },
                      ]}
                    >
                      {ticket.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Route */}
                <View style={styles.routeContainer}>
                  <Text style={styles.cityText}>
                    {ticket.trip.route.origin.city}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                  <Text style={styles.cityText}>
                    {ticket.trip.route.destination.city}
                  </Text>
                </View>

                {/* Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.detailText}>
                      {formatShortDate(ticket.trip.departureTime)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.detailText}>
                      {formatTime(ticket.trip.departureTime)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.priceText}>
                      {formatPrice(ticket.price)}
                    </Text>
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
    },
    filterTabActive: {
      backgroundColor: colors.primary,
    },
    filterTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    filterTabTextActive: {
      color: '#fff',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    signInButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 24,
    },
    signInButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    bookButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 24,
    },
    bookButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    ticketsList: {
      gap: 12,
    },
    ticketCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
    },
    statusIndicator: {
      width: 4,
      height: '100%',
    },
    ticketContent: {
      flex: 1,
      padding: 16,
    },
    ticketHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    ticketNumber: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
    },
    routeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    cityText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    detailsContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    priceText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });
