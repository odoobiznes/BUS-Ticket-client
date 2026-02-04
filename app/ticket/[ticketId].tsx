/**
 * BUS-Tickets - Ticket Details Screen
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Ticket } from '@/types';
import {
  formatPrice,
  formatTime,
  formatShortDate,
  formatDuration,
  getTicketStatusColor,
  getTicketStatusLabel,
  isTicketActive,
  canCancelTicket,
} from '@/utils/formatting';

// Mock ticket data
const MOCK_TICKET: Ticket = {
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
};

export default function TicketDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ticketId: string }>();
  const { colors } = useTheme();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(true);

  useEffect(() => {
    loadTicket();
  }, [params.ticketId]);

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      setTicket(MOCK_TICKET);
    } catch (error) {
      console.error('Error loading ticket:', error);
      Alert.alert('Error', 'Could not load ticket details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTicket = () => {
    Alert.alert(
      'Cancel Ticket',
      'Are you sure you want to cancel this ticket? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement cancellation
            Alert.alert('Success', 'Ticket has been cancelled');
            router.back();
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!ticket) return;

    try {
      await Share.share({
        message: `My bus ticket ${ticket.ticketNumber}\n${ticket.trip.route.origin.city} → ${ticket.trip.route.destination.city}\n${formatShortDate(ticket.trip.departureTime)} at ${formatTime(ticket.trip.departureTime)}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const styles = createStyles(colors);

  if (isLoading || !ticket) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading ticket...</Text>
      </View>
    );
  }

  const isActive = isTicketActive(ticket);
  const canCancel = canCancelTicket(ticket);
  const statusColor = getTicketStatusColor(ticket.status);
  const statusLabel = getTicketStatusLabel(ticket.status);
  const duration =
    (new Date(ticket.trip.arrivalTime).getTime() -
      new Date(ticket.trip.departureTime).getTime()) /
    1000 /
    60;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Ticket Card */}
      <View style={styles.ticketCard}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Ticket Number */}
        <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={styles.routeDot} />
            <View>
              <Text style={styles.timeText}>
                {formatTime(ticket.trip.departureTime)}
              </Text>
              <Text style={styles.cityText}>{ticket.trip.route.origin.city}</Text>
            </View>
          </View>

          <View style={styles.routeLine}>
            <View style={styles.dottedLine} />
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, styles.routeDotDestination]} />
            <View>
              <Text style={styles.timeText}>
                {formatTime(ticket.trip.arrivalTime)}
              </Text>
              <Text style={styles.cityText}>
                {ticket.trip.route.destination.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider with date */}
        <View style={styles.dateDivider}>
          <View style={styles.dateDividerLine} />
          <View style={styles.dateBadge}>
            <Ionicons name="calendar" size={14} color={colors.primary} />
            <Text style={styles.dateText}>
              {formatShortDate(ticket.trip.departureTime)}
            </Text>
          </View>
          <View style={styles.dateDividerLine} />
        </View>

        {/* QR Code */}
        {isActive && showQR && (
          <TouchableOpacity
            style={styles.qrContainer}
            onPress={() => setShowQR(!showQR)}
          >
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={100} color={colors.text} />
              <Text style={styles.qrText}>{ticket.ticketNumber}</Text>
            </View>
            <Text style={styles.qrHint}>
              Show this QR code to the driver when boarding
            </Text>
          </TouchableOpacity>
        )}

        {/* Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Passenger</Text>
              <Text style={styles.detailValue}>{ticket.passenger.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="grid-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Seat</Text>
              <Text style={styles.detailValue}>{ticket.seat || 'Auto'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="bus-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Bus</Text>
              <Text style={styles.detailValue}>
                {ticket.trip.bus.name} ({ticket.trip.bus.plateNumber})
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={[styles.detailValue, styles.priceValue]}>
                {formatPrice(ticket.price)}
              </Text>
            </View>
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.amenitiesSection}>
          <Text style={styles.amenitiesTitle}>Amenities</Text>
          <View style={styles.amenitiesList}>
            {ticket.trip.bus.amenities.map((amenity) => (
              <View key={amenity} style={styles.amenityBadge}>
                <Ionicons
                  name={
                    amenity === 'wifi'
                      ? 'wifi'
                      : amenity === 'ac'
                      ? 'snow'
                      : amenity === 'usb'
                      ? 'flash'
                      : amenity === 'toilet'
                      ? 'water'
                      : 'ellipse'
                  }
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.amenityText}>
                  {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="download-outline" size={24} color={colors.primary} />
          <Text style={styles.actionButtonText}>Download PDF</Text>
        </TouchableOpacity>

        {canCancel && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelTicket}
          >
            <Ionicons name="close-circle-outline" size={24} color={colors.error} />
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contact Support */}
      <TouchableOpacity style={styles.supportButton}>
        <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.supportButtonText}>Need help? Contact Support</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    content: {
      padding: 16,
    },
    ticketCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      overflow: 'hidden',
    },
    statusContainer: {
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    ticketNumber: {
      fontSize: 14,
      fontFamily: 'monospace',
      color: colors.textSecondary,
      marginBottom: 20,
    },
    routeContainer: {
      marginBottom: 20,
    },
    routePoint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    routeDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    routeDotDestination: {
      backgroundColor: colors.success,
    },
    timeText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    cityText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    routeLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 5,
      paddingVertical: 8,
    },
    dottedLine: {
      width: 2,
      height: 40,
      backgroundColor: colors.border,
      marginRight: 12,
    },
    durationText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    dateDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dateDividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
      borderStyle: 'dashed',
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.background,
      borderRadius: 20,
      marginHorizontal: 8,
    },
    dateText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    qrContainer: {
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#fff',
      borderRadius: 12,
      marginBottom: 20,
    },
    qrPlaceholder: {
      alignItems: 'center',
    },
    qrText: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: '#000',
      marginTop: 8,
    },
    qrHint: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
      marginTop: 12,
    },
    detailsSection: {
      gap: 16,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    priceValue: {
      color: colors.primary,
      fontWeight: '700',
    },
    amenitiesSection: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    amenitiesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    amenitiesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    amenityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    amenityText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: colors.error,
    },
    cancelButtonText: {
      color: colors.error,
    },
    supportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      marginTop: 16,
    },
    supportButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
