/**
 * BUS-Tickets - Search Results Screen
 * Shows trips from all connected providers with operator info
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useProviders, TripWithProvider } from '@/contexts/ProvidersContext';
import type { Trip } from '@/types';

// Ensure HTTPS for web
function ensureHttps(url: string): string {
  if (!url) return url;
  if (Platform.OS === 'web' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    origin: string;
    destination: string;
    originId?: string;
    destinationId?: string;
    date: string;
    passengers: string;
  }>();
  const { colors } = useTheme();
  const { config } = useConfig();
  const { t, formatTime: formatTimeLocale, formatCurrency, locale } = useLocale();
  const { providers, activeProviders } = useProviders();

  const [trips, setTrips] = useState<TripWithProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrips();
  }, [params.origin, params.destination, params.date]);

  const loadTrips = async () => {
    setIsLoading(true);
    const allTrips: TripWithProvider[] = [];

    try {
      // Search all active providers in parallel
      const searchPromises = activeProviders.map(async (provider) => {
        try {
          const apiUrl = ensureHttps(provider.apiUrl);
          const searchParams = new URLSearchParams();

          if (params.origin) searchParams.append('origin', params.origin);
          if (params.destination) searchParams.append('destination', params.destination);
          if (params.date) searchParams.append('date', params.date);
          if (params.passengers) searchParams.append('passengers', params.passengers);

          const fullUrl = `${apiUrl}/api/v1/trips/search?${searchParams.toString()}`;
          console.log(`Searching ${provider.displayName}:`, fullUrl);

          const response = await fetch(fullUrl, {
            headers: {
              'Content-Type': 'application/json',
              ...(provider.apiKey ? { 'X-API-Key': provider.apiKey } : {}),
            },
          });
          const data = await response.json();

          if (data.success && data.data?.trips) {
            return data.data.trips.map((t: any) => ({
              id: t.id,
              providerId: provider.id,
              providerName: provider.displayName,
              providerLogo: provider.logoUrl,
              providerColor: provider.primaryColor || '#e94560',
              route: {
                id: t.route?.id || 0,
                name: t.route?.name || '',
                origin: {
                  id: t.route?.origin?.id || 0,
                  name: t.route?.origin?.name || '',
                  city: t.route?.origin?.city || t.route?.origin?.name || '',
                },
                destination: {
                  id: t.route?.destination?.id || 0,
                  name: t.route?.destination?.name || '',
                  city: t.route?.destination?.city || t.route?.destination?.name || '',
                },
              },
              departure: t.departureTime || t.tripDate,
              arrival: t.arrivalTime || t.tripDate,
              duration: getDurationMinutes(
                t.departureTime || t.tripDate,
                t.arrivalTime || t.tripDate
              ),
              bus: {
                id: t.bus?.id || 0,
                name: t.bus?.name || 'Bus',
                plateNumber: t.bus?.plateNumber || '',
                capacity: t.bus?.capacity || t.totalSeats || 50,
                amenities: t.bus?.amenities || ['wifi', 'ac'],
              },
              availableSeats: t.availableSeats || 0,
              price: {
                amount: t.price?.amount || 0,
                currency: t.price?.currency || 'CZK',
              },
            }));
          }
          return [];
        } catch (error) {
          console.error(`Error searching ${provider.displayName}:`, error);
          return [];
        }
      });

      const results = await Promise.all(searchPromises);
      results.forEach((providerTrips) => {
        allTrips.push(...providerTrips);
      });

      // Sort by departure time
      allTrips.sort(
        (a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime()
      );

      setTrips(allTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const getDurationMinutes = (departure: string, arrival: string): number => {
    return Math.round(
      (new Date(arrival).getTime() - new Date(departure).getTime()) / 1000 / 60
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}${t.datetime.hours} ${mins}${t.datetime.minutes}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(locale === 'cs' ? 'cs-CZ' : locale === 'uk' ? 'uk-UA' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAmenityIcon = (amenity: string): string => {
    const icons: Record<string, string> = {
      wifi: 'wifi',
      ac: 'snow',
      usb: 'flash',
      toilet: 'water',
      sleeper: 'bed',
    };
    return icons[amenity] || 'ellipse';
  };

  const styles = createStyles(colors);

  const renderTrip = ({ item: trip }: { item: TripWithProvider }) => {
    const seatsLow = trip.availableSeats <= 5;

    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() =>
          router.push({
            pathname: '/booking/[tripId]',
            params: {
              tripId: trip.id.toString(),
              passengers: params.passengers || '1',
              providerId: trip.providerId,
            },
          })
        }
      >
        {/* Provider badge */}
        <View style={[styles.providerBadge, { backgroundColor: trip.providerColor + '20' }]}>
          {trip.providerLogo ? (
            <Image
              source={{ uri: trip.providerLogo }}
              style={styles.providerLogoSmall}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[styles.providerLogoPlaceholder, { backgroundColor: trip.providerColor }]}
            >
              <Text style={styles.providerLogoText}>
                {trip.providerName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={[styles.providerNameText, { color: trip.providerColor }]}>
            {trip.providerName}
          </Text>
        </View>

        {/* Time and route */}
        <View style={styles.tripMain}>
          <View style={styles.timeColumn}>
            <Text style={styles.timeText}>{formatTime(trip.departure)}</Text>
            <Text style={styles.cityText}>{trip.route.origin.city || trip.route.origin.name}</Text>
          </View>

          <View style={styles.durationColumn}>
            <View style={styles.durationLine}>
              <View style={[styles.dot, { backgroundColor: trip.providerColor }]} />
              <View style={styles.line} />
              <View style={[styles.dot, { backgroundColor: trip.providerColor }]} />
            </View>
            <Text style={styles.durationText}>{formatDuration(trip.duration)}</Text>
          </View>

          <View style={[styles.timeColumn, styles.timeColumnRight]}>
            <Text style={styles.timeText}>{formatTime(trip.arrival)}</Text>
            <Text style={styles.cityText}>
              {trip.route.destination.city || trip.route.destination.name}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.tripDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="bus-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{trip.bus?.name || 'Bus'}</Text>
          </View>

          {/* Amenities */}
          {trip.bus?.amenities && (
            <View style={styles.amenitiesRow}>
              {trip.bus.amenities.slice(0, 4).map((amenity, index) => (
                <View key={`${amenity}-${index}`} style={styles.amenityBadge}>
                  <Ionicons
                    name={getAmenityIcon(amenity) as any}
                    size={12}
                    color={colors.textSecondary}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.tripFooter}>
          <View>
            <Text style={[styles.seatsText, seatsLow && styles.seatsTextLow]}>
              {trip.availableSeats} {t.results.seatsAvailable}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, { color: trip.providerColor }]}>
              {formatCurrency(trip.price.amount, trip.price.currency)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={trip.providerColor} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header info */}
      <View style={styles.headerInfo}>
        <Text style={styles.routeText}>
          {params.origin || t.common.from} → {params.destination || t.common.to}
        </Text>
        <Text style={styles.dateText}>
          {params.date
            ? new Date(params.date).toLocaleDateString(
                locale === 'cs' ? 'cs-CZ' : locale === 'uk' ? 'uk-UA' : 'en-GB',
                { weekday: 'short', month: 'short', day: 'numeric' }
              )
            : t.search.selectDate}{' '}
          • {params.passengers || 1} {t.search.passengers.toLowerCase()}
        </Text>
        {activeProviders.length > 1 && (
          <Text style={styles.providersInfo}>
            {t.common.search} across {activeProviders.length} operators
          </Text>
        )}
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bus-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>{t.results.noTrips}</Text>
          <Text style={styles.emptyText}>{t.results.tryDifferentCriteria}</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTrip}
          keyExtractor={(item) => `${item.providerId}-${item.id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerInfo: {
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    routeText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    dateText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    providersInfo: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 4,
      fontWeight: '500',
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
    listContent: {
      padding: 16,
    },
    tripCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    },
    providerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
      marginBottom: 12,
      gap: 6,
    },
    providerLogoSmall: {
      width: 20,
      height: 20,
      borderRadius: 4,
    },
    providerLogoPlaceholder: {
      width: 20,
      height: 20,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    providerLogoText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    providerNameText: {
      fontSize: 12,
      fontWeight: '600',
    },
    tripMain: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeColumn: {
      flex: 1,
    },
    timeColumnRight: {
      alignItems: 'flex-end',
    },
    timeText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    cityText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    durationColumn: {
      flex: 1,
      alignItems: 'center',
    },
    durationLine: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    line: {
      flex: 1,
      height: 2,
      backgroundColor: colors.border,
    },
    durationText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    tripDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    amenitiesRow: {
      flexDirection: 'row',
      gap: 6,
    },
    amenityBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tripFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    seatsText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    seatsTextLow: {
      color: colors.error,
      fontWeight: '600',
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    priceText: {
      fontSize: 20,
      fontWeight: '700',
    },
  });
