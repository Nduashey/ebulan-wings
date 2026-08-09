// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'passenger' | 'driver' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: 'passenger' | 'driver';
}

// Booking Types
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Ride {
  id: string;
  passengerId: string;
  driverId?: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  fare: number;
  distance: number;
  duration: number;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface BookingState {
  currentRide: Ride | null;
  rides: Ride[];
  isLoading: boolean;
  error: string | null;
}

// Driver Types
export interface Driver extends User {
  vehicleNumber: string;
  vehicleModel: string;
  licenseNumber: string;
  rating: number;
  totalRides: number;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: Location;
}

export interface DriverState {
  driver: Driver | null;
  availableRides: Ride[];
  currentRide: Ride | null;
  earnings: DriverEarnings;
  isLoading: boolean;
  error: string | null;
}

export interface DriverEarnings {
  today: number;
  week: number;
  month: number;
  total: number;
}

// Payment Types
export interface Payment {
  id: string;
  rideId: string;
  amount: number;
  method: 'cash' | 'card' | 'wallet';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: string;
}

export interface PaymentState {
  payments: Payment[];
  currentPayment: Payment | null;
  isLoading: boolean;
  error: string | null;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'ride_request' | 'ride_accepted' | 'ride_completed' | 'payment' | 'general';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
