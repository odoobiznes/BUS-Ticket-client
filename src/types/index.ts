/**
 * BUS-Tickets Mobile - Type Definitions
 * Copyright (c) 2024-2026 IT Enterprise
 */

// ============================================
// USER & AUTH TYPES
// ============================================

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  language: Language;
  isLoggedIn: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type Language = 'uk_UA' | 'cs_CZ' | 'en_US';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export type AuthProvider = 'email' | 'phone' | 'google' | 'facebook' | 'apple';

export interface LoginRequest {
  provider: AuthProvider;
  email?: string;
  phone?: string;
  password?: string;
  otp?: string;
  idToken?: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// ============================================
// TRIP & ROUTE TYPES
// ============================================

export interface Location {
  id: number;
  name: string;
  city?: string;
  country?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Route {
  id: number;
  name: string;
  origin: Location;
  destination: Location;
  distance?: number;
  duration?: number;
  stops?: Location[];
}

export interface Trip {
  id: number;
  route: Route;
  departureTime: string;
  arrivalTime: string;
  bus?: Bus;
  availableSeats: number;
  totalSeats: number;
  price: Price;
  status: TripStatus;
}

export type TripStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';

export interface Bus {
  id: number;
  name: string;
  plateNumber: string;
  capacity: number;
  amenities: BusAmenity[];
  seatLayout?: SeatLayout;
}

export type BusAmenity = 'wifi' | 'ac' | 'toilet' | 'usb' | 'tv' | 'snacks' | 'sleeper' | 'power' | 'recliner';

export interface SeatLayout {
  rows: number;
  seatsPerRow: number;
  unavailableSeats: number[];
  reservedSeats: number[];
}

// ============================================
// TICKET TYPES
// ============================================

export interface Ticket {
  id: number;
  ticketNumber: string;
  trip: Trip;
  passenger: PassengerInfo;
  seat?: number;
  price: Price;
  status: TicketStatus;
  qrCode: string;
  purchasedAt: string;
  checkedInAt?: string;
}

export type TicketStatus = 'reserved' | 'paid' | 'checked_in' | 'used' | 'cancelled' | 'refunded';

export interface PassengerInfo {
  name: string;
  email: string;
  phone: string;
  documentType?: 'passport' | 'id_card';
  documentNumber?: string;
}

export interface Passenger {
  name: string;
  email: string;
  phone: string;
}

// ============================================
// PRICE & PAYMENT TYPES
// ============================================

export interface Price {
  amount: number;
  currency: Currency;
  originalAmount?: number;
  discount?: Discount;
}

export type Currency = 'UAH' | 'CZK' | 'EUR' | 'USD';

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  code?: string;
  description?: string;
}

export type PaymentMethod = 'monobank' | 'stripe' | 'paypal' | 'liqpay' | 'cash';

export interface PaymentRequest {
  ticketId: number;
  method: PaymentMethod;
  returnUrl: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: PaymentStatus;
  redirectUrl?: string;
}

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

// ============================================
// CONFIG TYPES
// ============================================

export interface AppConfig {
  version: string;
  backend: BackendConfig;
  features: FeatureFlags;
  oauth?: OAuthProviderConfig[];
  payment?: PaymentConfig;
  branding?: BrandingConfig;
  // Additional app config fields
  instanceName?: string;
  authProviders?: OAuthProviderConfig[];
  legal?: {
    termsUrl?: string;
    privacyUrl?: string;
  };
}

export interface BackendConfig {
  id: string;
  name: string;
  type: 'odoo' | 'custom';
  url: string;
  apiUrl?: string;
  apiVersion?: string;
  timeout?: number;
  isActive: boolean;
  features?: FeatureFlags;
}

export interface FeatureFlags {
  booking?: boolean;
  payments?: boolean;
  userAccounts?: boolean;
  multiLanguage?: boolean;
  pushNotifications?: boolean;
  offlineMode?: boolean;
  seatSelection?: boolean;
  qrTickets?: boolean;
}

export interface OAuthProviderConfig {
  id: string;
  name: string;
  provider: 'google' | 'facebook' | 'apple';
  enabled: boolean;
  clientId?: string;
  redirectUri?: string;
}

export interface PaymentConfig {
  id?: string;
  name?: string;
  enabled: boolean;
  provider?: PaymentMethod;
  providers: PaymentProviderConfig[];
  defaultCurrency: Currency;
  testMode?: boolean;
  supportsApplePay?: boolean;
  supportsGooglePay?: boolean;
}

export interface PaymentProviderConfig {
  id: string;
  name: string;
  type: PaymentMethod;
  enabled: boolean;
  testMode?: boolean;
}

export interface BrandingConfig {
  appName: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  favicon?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export interface ApiMeta {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
}
