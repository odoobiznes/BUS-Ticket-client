/**
 * BUS-Tickets - Booking Screen
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useProviders } from '@/contexts/ProvidersContext';
import { usePayment, PaymentStatus } from '@/hooks/usePayment';
import type { Trip, Passenger, PaymentConfig } from '@/types';

// Helper functions (avoid import issues)
const formatPrice = (price: { amount: number; currency: string }) => {
  return `${price.amount} ${price.currency}`;
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
};

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

type BookingStep = 'seats' | 'passenger' | 'payment';

// Helper functions for payment providers
const getProviderIcon = (provider: string): string => {
  const icons: Record<string, string> = {
    monobank: 'card',
    liqpay: 'card-outline',
    stripe: 'card',
    paypal: 'logo-paypal',
    gopay: 'wallet',
    fondy: 'card',
    cash: 'cash-outline',
    bank_transfer: 'business-outline',
  };
  return icons[provider] || 'card';
};

const getProviderColor = (provider: string): string => {
  const colors: Record<string, string> = {
    monobank: '#000000',
    liqpay: '#7AB72B',
    stripe: '#635BFF',
    paypal: '#003087',
    gopay: '#2E7D32',
    fondy: '#FF6B00',
    cash: '#28a745',
    bank_transfer: '#0D47A1',
  };
  return colors[provider] || '#007AFF';
};

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId: string; passengers: string; providerId?: string }>();
  const { colors } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { config } = useConfig();
  const { t, formatCurrency, formatDate, locale } = useLocale();
  const { getProvider, activeProviders } = useProviders();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<BookingStep>('seats');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passenger, setPassenger] = useState<Passenger>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [selectedProvider, setSelectedProvider] = useState<PaymentConfig | null>(null);
  const [reservationIds, setReservationIds] = useState<number[]>([]);

  // Payment hook with callbacks
  const {
    status: paymentStatus,
    error: paymentError,
    transaction,
    availableProviders,
    isPolling,
    initiatePayment,
    openPaymentPage,
    startPolling,
    reset: resetPayment,
  } = usePayment({
    onSuccess: (result) => {
      Alert.alert(t.payment.success, t.booking.successMessage, [
        {
          text: t.tickets.title,
          onPress: () => router.replace('/tickets'),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert(t.payment.failed, error || t.errors.paymentFailed);
    },
    onCancelled: () => {
      Alert.alert(t.payment.cancelled, t.payment.cancelled);
    },
  });

  const isProcessing = paymentStatus === 'initiating' || paymentStatus === 'processing';

  const passengerCount = parseInt(params.passengers || '1', 10);

  useEffect(() => {
    loadTrip();
  }, [params.tripId]);

  const loadTrip = async () => {
    setIsLoading(true);
    try {
      const apiUrl = config.backend.url;
      const response = await fetch(`${apiUrl}/api/v1/trip/${params.tripId}`);
      const data = await response.json();

      if (data.success && data.data) {
        const t = data.data;
        const loadedTrip: Trip = {
          id: t.id,
          route: {
            id: t.route?.id || 0,
            name: t.route?.name || '',
            origin: {
              id: t.route?.origin?.id || 0,
              name: t.route?.origin?.name || '',
              city: t.route?.origin?.city || t.route?.origin?.name || '',
              country: 'CZ',
            },
            destination: {
              id: t.route?.destination?.id || 0,
              name: t.route?.destination?.name || '',
              city: t.route?.destination?.city || t.route?.destination?.name || '',
              country: 'UA',
            },
          },
          departureTime: t.departureTime || t.tripDate,
          arrivalTime: t.arrivalTime || t.tripDate,
          bus: {
            id: t.bus?.id || 0,
            name: t.bus?.name || 'Bus',
            plateNumber: t.bus?.plateNumber || '',
            capacity: t.bus?.capacity || t.totalSeats || 50,
            amenities: ['wifi', 'ac'],
          },
          availableSeats: t.availableSeats || 0,
          totalSeats: t.totalSeats || t.bus?.capacity || 50,
          price: {
            amount: t.price?.amount || 0,
            currency: t.price?.currency || 'CZK',
          },
          status: t.status || 'scheduled',
        };
        setTrip(loadedTrip);
      } else {
        throw new Error('Trip not found');
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      Alert.alert('Error', 'Could not load trip details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatSelect = (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else if (selectedSeats.length < passengerCount) {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const handleContinue = () => {
    if (step === 'seats') {
      if (selectedSeats.length !== passengerCount) {
        Alert.alert(t.booking.selectSeat, `${t.booking.selectSeat}: ${passengerCount}`);
        return;
      }
      setStep('passenger');
    } else if (step === 'passenger') {
      if (!passenger.name || !passenger.email || !passenger.phone) {
        Alert.alert(t.booking.passengerDetails, t.errors.invalidInput);
        return;
      }
      setStep('payment');
    }
  };

  const handlePayment = async () => {
    if (!selectedProvider) {
      Alert.alert(t.payment.selectMethod, t.payment.selectMethod);
      return;
    }

    try {
      // First create reservation via API
      const reservations = await createReservations();
      if (!reservations || reservations.length === 0) {
        throw new Error(t.errors.bookingFailed);
      }

      setReservationIds(reservations);

      // Initiate payment with selected provider
      const result = await initiatePayment(
        reservations,
        selectedProvider.id as number,
      );

      // Handle different payment flows based on provider
      if (result.paymentUrl) {
        // For PayPal, Monobank, Stripe - open payment page
        await openPaymentPage(result.paymentUrl);

        // Start polling for status updates
        startPolling(result.transactionId);
      } else if (result.bankDetails) {
        // Bank transfer - show bank details
        Alert.alert(
          t.payment.card,
          `IBAN: ${result.bankDetails.iban}\n` +
          `SWIFT: ${result.bankDetails.swift}\n` +
          `VS: ${result.bankDetails.variableSymbol}\n` +
          `${t.common.total}: ${result.bankDetails.amount} ${result.bankDetails.currency}`,
          [{ text: 'OK' }]
        );
      } else if (selectedProvider.provider === 'cash') {
        // Cash payment - just confirm booking
        Alert.alert(t.payment.confirmCash, t.payment.cashNote, [
          {
            text: t.tickets.title,
            onPress: () => router.replace('/tickets'),
          },
        ]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t.errors.paymentFailed;
      Alert.alert(t.common.error, message);
    }
  };

  const createReservations = async (): Promise<number[]> => {
    try {
      const response = await fetch(`${config.backend.url}/api/v1/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: parseInt(params.tripId!, 10),
          passengers: passengerCount,
          seats: selectedSeats,
          passenger: {
            name: passenger.name,
            email: passenger.email,
            phone: passenger.phone,
          },
          paymentMethod: selectedProvider?.provider || 'cash',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Rezervace selhala');
      }

      // Return array of reservation IDs
      return data.data?.reservationId ? [data.data.reservationId] : [];
    } catch (error) {
      console.error('Create reservations error:', error);
      throw error;
    }
  };

  const styles = createStyles(colors);

  if (isLoading || !trip) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading trip...</Text>
      </View>
    );
  }

  const duration =
    (new Date(trip.arrivalTime).getTime() - new Date(trip.departureTime).getTime()) /
    1000 /
    60;
  const totalPrice = trip.price.amount * passengerCount;

  // Generate seat grid
  const seatRows = Math.ceil(trip.totalSeats / 4);
  const occupiedSeats = [3, 7, 12, 15, 22, 28, 33, 41]; // Mock occupied seats

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Trip Summary */}
        <View style={styles.tripSummary}>
          <View style={styles.routeRow}>
            <Text style={styles.cityText}>{trip.route.origin.city}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.primary} />
            <Text style={styles.cityText}>{trip.route.destination.city}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>
              {formatShortDate(trip.departureTime)} • {formatTime(trip.departureTime)} •{' '}
              {formatDuration(duration)}
            </Text>
          </View>
        </View>

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {(['seats', 'passenger', 'payment'] as BookingStep[]).map((s, index) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  (step === s || index < ['seats', 'passenger', 'payment'].indexOf(step)) &&
                    styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    (step === s || index < ['seats', 'passenger', 'payment'].indexOf(step)) &&
                      styles.stepNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text style={styles.stepLabel}>
                {s === 'seats' ? 'Seats' : s === 'passenger' ? 'Details' : 'Payment'}
              </Text>
            </View>
          ))}
        </View>

        {/* Step Content */}
        {step === 'seats' && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Select Your Seats</Text>
            <Text style={styles.sectionSubtitle}>
              Select {passengerCount} seat(s) • {selectedSeats.length} selected
            </Text>

            {/* Seat legend */}
            <View style={styles.seatLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.seatSmall, styles.seatAvailable]} />
                <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.seatSmall, styles.seatSelected]} />
                <Text style={styles.legendText}>Selected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.seatSmall, styles.seatOccupied]} />
                <Text style={styles.legendText}>Occupied</Text>
              </View>
            </View>

            {/* Seat grid */}
            <View style={styles.busLayout}>
              <View style={styles.driverArea}>
                <Ionicons name="car" size={24} color={colors.textSecondary} />
              </View>

              <View style={styles.seatsContainer}>
                {Array.from({ length: seatRows }, (_, rowIndex) => (
                  <View key={rowIndex} style={styles.seatRow}>
                    {Array.from({ length: 4 }, (_, colIndex) => {
                      const seatNumber = rowIndex * 4 + colIndex + 1;
                      if (seatNumber > trip.totalSeats) return null;

                      const isOccupied = occupiedSeats.includes(seatNumber);
                      const isSelected = selectedSeats.includes(seatNumber);

                      return (
                        <TouchableOpacity
                          key={seatNumber}
                          style={[
                            styles.seat,
                            isOccupied && styles.seatOccupied,
                            isSelected && styles.seatSelected,
                            colIndex === 1 && styles.seatAisle,
                          ]}
                          onPress={() => !isOccupied && handleSeatSelect(seatNumber)}
                          disabled={isOccupied}
                        >
                          <Text
                            style={[
                              styles.seatText,
                              isOccupied && styles.seatTextOccupied,
                              isSelected && styles.seatTextSelected,
                            ]}
                          >
                            {seatNumber}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {step === 'passenger' && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Passenger Details</Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor={colors.textSecondary}
                value={passenger.name}
                onChangeText={(text) => setPassenger({ ...passenger, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                placeholderTextColor={colors.textSecondary}
                value={passenger.email}
                onChangeText={(text) => setPassenger({ ...passenger, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                value={passenger.phone}
                onChangeText={(text) => setPassenger({ ...passenger, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.selectedSeatsInfo}>
              <Text style={styles.selectedSeatsLabel}>Selected seats:</Text>
              <Text style={styles.selectedSeatsValue}>
                {selectedSeats.sort((a, b) => a - b).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {step === 'payment' && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Vyberte platební metodu</Text>

            {/* Payment status indicator */}
            {isProcessing && (
              <View style={styles.paymentStatusBar}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.paymentStatusText}>
                  {paymentStatus === 'initiating'
                    ? 'Zahajuji platbu...'
                    : isPolling
                    ? 'Čekám na potvrzení platby...'
                    : 'Zpracovávám...'}
                </Text>
              </View>
            )}

            {paymentError && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={20} color="#dc3545" />
                <Text style={styles.errorText}>{paymentError}</Text>
              </View>
            )}

            {availableProviders.map((provider) => {
              const isSelected = selectedProvider?.id === provider.id;
              const providerIcon = getProviderIcon(provider.provider);

              return (
                <TouchableOpacity
                  key={provider.id}
                  style={[
                    styles.paymentOption,
                    isSelected && styles.paymentOptionSelected,
                    isProcessing && styles.paymentOptionDisabled,
                  ]}
                  onPress={() => setSelectedProvider(provider)}
                  disabled={isProcessing}
                >
                  <View style={styles.paymentInfo}>
                    <View style={[styles.providerIconBg, { backgroundColor: getProviderColor(provider.provider) + '20' }]}>
                      <Ionicons
                        name={providerIcon as any}
                        size={24}
                        color={getProviderColor(provider.provider)}
                      />
                    </View>
                    <View style={styles.paymentDetails}>
                      <Text
                        style={[
                          styles.paymentName,
                          isSelected && styles.paymentNameSelected,
                        ]}
                      >
                        {provider.name}
                      </Text>
                      {provider.testMode && (
                        <View style={styles.testModeBadge}>
                          <Text style={styles.testModeText}>TEST</Text>
                        </View>
                      )}
                      {(provider.supportsApplePay || provider.supportsGooglePay) && (
                        <View style={styles.walletBadges}>
                          {provider.supportsApplePay && (
                            <Text style={styles.walletBadge}>Apple Pay</Text>
                          )}
                          {provider.supportsGooglePay && (
                            <Text style={styles.walletBadge}>Google Pay</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Order summary */}
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Route</Text>
                <Text style={styles.summaryValue}>
                  {trip.route.origin.city} → {trip.route.destination.city}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>
                  {formatShortDate(trip.departureTime)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Seats</Text>
                <Text style={styles.summaryValue}>
                  {selectedSeats.sort((a, b) => a - b).join(', ')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Passenger</Text>
                <Text style={styles.summaryValue}>{passenger.name}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatPrice({ amount: totalPrice, currency: trip.price.currency })}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>
            {formatPrice({ amount: totalPrice, currency: trip.price.currency })}
          </Text>
        </View>

        {step === 'payment' ? (
          <TouchableOpacity
            style={[
              styles.continueButton,
              (isProcessing || !selectedProvider) && styles.buttonDisabled,
            ]}
            onPress={handlePayment}
            disabled={isProcessing || !selectedProvider}
          >
            {isProcessing ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.continueButtonText}>
                  {paymentStatus === 'initiating' ? 'Zahajuji...' : 'Zpracovávám...'}
                </Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.continueButtonText}>Zaplatit</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingBottom: 100,
    },
    tripSummary: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cityText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    detailsRow: {
      marginTop: 8,
    },
    detailText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 32,
      marginBottom: 24,
    },
    stepItem: {
      alignItems: 'center',
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    stepCircleActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    stepNumberActive: {
      color: '#fff',
    },
    stepLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    stepContent: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    seatLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 24,
      marginBottom: 16,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    seatSmall: {
      width: 16,
      height: 16,
      borderRadius: 4,
    },
    seatAvailable: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    seatSelected: {
      backgroundColor: colors.primary,
    },
    seatOccupied: {
      backgroundColor: colors.textSecondary,
    },
    legendText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    busLayout: {
      alignItems: 'center',
    },
    driverArea: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    seatsContainer: {
      gap: 8,
    },
    seatRow: {
      flexDirection: 'row',
      gap: 8,
    },
    seat: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    seatAisle: {
      marginRight: 16,
    },
    seatText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
    },
    seatTextOccupied: {
      color: '#fff',
    },
    seatTextSelected: {
      color: '#fff',
    },
    formGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedSeatsInfo: {
      flexDirection: 'row',
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    selectedSeatsLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    selectedSeatsValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    paymentStatusBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: colors.primary + '15',
      borderRadius: 8,
      marginBottom: 16,
    },
    paymentStatusText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      backgroundColor: '#dc354520',
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 14,
      color: '#dc3545',
      flex: 1,
    },
    paymentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    paymentOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '08',
    },
    paymentOptionDisabled: {
      opacity: 0.5,
    },
    paymentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    providerIconBg: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paymentDetails: {
      flex: 1,
    },
    paymentName: {
      fontSize: 16,
      color: colors.text,
    },
    paymentNameSelected: {
      fontWeight: '600',
    },
    testModeBadge: {
      backgroundColor: '#ff9800',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    testModeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    walletBadges: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    walletBadge: {
      fontSize: 11,
      color: colors.textSecondary,
      backgroundColor: colors.border,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    orderSummary: {
      marginTop: 16,
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      color: colors.text,
    },
    summaryTotal: {
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    priceContainer: {},
    priceLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    priceValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
    },
    continueButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 8,
      minWidth: 140,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    continueButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });
