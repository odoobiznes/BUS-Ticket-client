/**
 * BUS-Tickets - Search Screen (Home)
 * Copyright (c) 2024-2026 IT Enterprise
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useLocale } from '@/contexts/LocaleContext';

interface Location {
  id: number;
  name: string;
  country?: string;
  countryName?: string;
}

interface PopularRoute {
  from: string;
  to: string;
  fromId: number;
  toId: number;
  price: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { config } = useConfig();
  const { t, formatDate, formatCurrency, locale } = useLocale();

  // Locations state
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  // Search form state
  const [originId, setOriginId] = useState<number | null>(null);
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [passengers, setPassengers] = useState(1);

  // Modal state
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Popular routes
  const [popularRoutes, setPopularRoutes] = useState<PopularRoute[]>([]);

  // Load locations on mount
  useEffect(() => {
    loadLocations();
    loadPopularRoutes();
  }, [config.backend.url]);

  const loadLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const response = await fetch(`${config.backend.url}/api/v1/locations`);
      const data = await response.json();
      if (data.success && data.data) {
        setLocations(data.data);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const loadPopularRoutes = async () => {
    try {
      const response = await fetch(`${config.backend.url}/api/v1/trips/popular`);
      const data = await response.json();
      if (data.success && data.data?.trips) {
        // Extract unique routes from popular trips
        const routeMap = new Map<string, PopularRoute>();
        data.data.trips.forEach((trip: any) => {
          const key = `${trip.route?.origin?.id}-${trip.route?.destination?.id}`;
          if (!routeMap.has(key) && trip.route?.origin && trip.route?.destination) {
            routeMap.set(key, {
              from: trip.route.origin.name,
              to: trip.route.destination.name,
              fromId: trip.route.origin.id,
              toId: trip.route.destination.id,
              price: `${trip.price?.amount || 0} ${trip.price?.currency || 'CZK'}`,
            });
          }
        });
        setPopularRoutes(Array.from(routeMap.values()).slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading popular routes:', error);
    }
  };

  const handleSelectOrigin = (location: Location) => {
    setOriginId(location.id);
    setOrigin(location.name);
    setShowOriginPicker(false);
    // Reset destination if same as origin
    if (destinationId === location.id) {
      setDestinationId(null);
      setDestination('');
    }
  };

  const handleSelectDestination = (location: Location) => {
    setDestinationId(location.id);
    setDestination(location.name);
    setShowDestinationPicker(false);
  };

  const handleSwapCities = () => {
    const tempId = originId;
    const tempName = origin;
    setOriginId(destinationId);
    setOrigin(destination);
    setDestinationId(tempId);
    setDestination(tempName);
  };

  const handleSearch = () => {
    if (!origin || !destination) {
      return;
    }

    router.push({
      pathname: '/search/results',
      params: {
        origin,
        destination,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        passengers: passengers.toString(),
      },
    });
  };

  const handleSelectPopularRoute = (route: PopularRoute) => {
    setOriginId(route.fromId);
    setOrigin(route.from);
    setDestinationId(route.toId);
    setDestination(route.to);
  };

  // Date formatting with locale
  const formatDateLocal = (d: Date) => {
    return formatDate(d, 'long');
  };

  // Generate date options for next 60 days
  const dateOptions = Array.from({ length: 60 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Available destinations (exclude origin)
  const availableDestinations = locations.filter((loc) => loc.id !== originId);

  const styles = createStyles(colors);

  // Location Picker Modal
  const LocationPickerModal = ({
    visible,
    onClose,
    onSelect,
    title,
    data,
    selectedId,
  }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (loc: Location) => void;
    title: string;
    data: Location[];
    selectedId: number | null;
  }) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {isLoadingLocations ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.locationItem,
                    selectedId === item.id && styles.locationItemSelected,
                  ]}
                  onPress={() => onSelect(item)}
                >
                  <Ionicons
                    name="location"
                    size={20}
                    color={selectedId === item.id ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.locationText,
                      selectedId === item.id && styles.locationTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedId === item.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  // Date Picker Modal
  const DatePickerModal = () => (
    <Modal visible={showDatePicker} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.search.selectDate}</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={dateOptions}
            keyExtractor={(item) => item.toISOString()}
            renderItem={({ item }) => {
              const isSelected = item.toDateString() === date.toDateString();
              const isToday = item.toDateString() === new Date().toDateString();
              return (
                <TouchableOpacity
                  style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                  onPress={() => {
                    setDate(item);
                    setShowDatePicker(false);
                  }}
                >
                  <View>
                    <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
                      {formatDateLocal(item)}
                    </Text>
                    {isToday && <Text style={styles.todayBadge}>{t.common.today}</Text>}
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.search.title}</Text>
        <Text style={styles.subtitle}>{t.search.subtitle}</Text>
      </View>

      {/* Search Card */}
      <View style={styles.searchCard}>
        {/* Origin */}
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowOriginPicker(true)}
        >
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={[styles.inputText, !origin && styles.placeholderText]}>
            {origin || t.search.originPlaceholder}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Swap Button */}
        <TouchableOpacity
          style={styles.swapButton}
          onPress={handleSwapCities}
          disabled={!origin && !destination}
        >
          <Ionicons name="swap-vertical" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Destination */}
        <TouchableOpacity
          style={[styles.inputContainer, !originId && styles.inputDisabled]}
          onPress={() => originId && setShowDestinationPicker(true)}
          disabled={!originId}
        >
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <Text style={[styles.inputText, !destination && styles.placeholderText]}>
            {destination || (originId ? t.search.destinationPlaceholder : t.search.selectOriginFirst)}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Date */}
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={styles.inputText}>{formatDateLocal(date)}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Passengers */}
        <View style={styles.inputContainer}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={styles.inputText}>{t.search.passengers}</Text>
          <View style={styles.passengerControls}>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={() => setPassengers(Math.max(1, passengers - 1))}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.passengerCount}>{passengers}</Text>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={() => setPassengers(Math.min(9, passengers + 1))}
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchButton, (!origin || !destination) && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={!origin || !destination}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.searchButtonText}>{t.search.searchButton}</Text>
        </TouchableOpacity>
      </View>

      {/* Popular Routes */}
      {popularRoutes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.search.popularRoutes}</Text>
          {popularRoutes.map((route, index) => (
            <TouchableOpacity
              key={index}
              style={styles.routeCard}
              onPress={() => handleSelectPopularRoute(route)}
            >
              <View style={styles.routeInfo}>
                <Text style={styles.routeText}>
                  {route.from} → {route.to}
                </Text>
              </View>
              <Text style={styles.routePrice}>{t.search.priceFrom} {route.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Modals */}
      <LocationPickerModal
        visible={showOriginPicker}
        onClose={() => setShowOriginPicker(false)}
        onSelect={handleSelectOrigin}
        title={t.search.whereFrom}
        data={locations}
        selectedId={originId}
      />

      <LocationPickerModal
        visible={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelect={handleSelectDestination}
        title={t.search.whereTo}
        data={availableDestinations}
        selectedId={destinationId}
      />

      <DatePickerModal />
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
      paddingBottom: 32,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
    },
    searchCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    inputDisabled: {
      opacity: 0.5,
    },
    inputText: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: colors.text,
    },
    placeholderText: {
      color: colors.textSecondary,
    },
    swapButton: {
      position: 'absolute',
      right: 16,
      top: 52,
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 8,
      zIndex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    divider: {
      height: 16,
    },
    passengerControls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    passengerButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    passengerCount: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginHorizontal: 16,
      minWidth: 24,
      textAlign: 'center',
    },
    searchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
    },
    searchButtonDisabled: {
      backgroundColor: colors.textSecondary,
      opacity: 0.6,
    },
    searchButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
    },
    section: {
      marginTop: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    routeCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    routeInfo: {
      flex: 1,
    },
    routeText: {
      fontSize: 16,
      color: colors.text,
    },
    routePrice: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    locationItemSelected: {
      backgroundColor: colors.primary + '10',
    },
    locationText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    locationTextSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
    dateItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dateItemSelected: {
      backgroundColor: colors.primary + '10',
    },
    dateText: {
      fontSize: 16,
      color: colors.text,
    },
    dateTextSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
    todayBadge: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },
  });
