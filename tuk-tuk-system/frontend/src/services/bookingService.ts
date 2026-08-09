import api from './api';
import { Ride, ApiResponse } from '../types';

export const createBooking = async (bookingData: any): Promise<Ride> => {
  const response = await api.post<ApiResponse<Ride>>('/bookings', bookingData);
  return response.data;
};

export const getRideById = async (rideId: string): Promise<Ride> => {
  const response = await api.get<ApiResponse<Ride>>(`/bookings/${rideId}`);
  return response.data;
};

export const getRideHistory = async (): Promise<Ride[]> => {
  const response = await api.get<ApiResponse<Ride[]>>('/bookings/history');
  return response.data;
};

export const cancelRide = async (rideId: string): Promise<Ride> => {
  const response = await api.post<ApiResponse<Ride>>(`/bookings/${rideId}/cancel`);
  return response.data;
};

export const rateRide = async (rideId: string, rating: number, review?: string): Promise<void> => {
  await api.post(`/bookings/${rideId}/rate`, { rating, review });
};

export const scanQRCode = async (qrCode: string): Promise<any> => {
  const response = await api.post<ApiResponse<any>>('/bookings/scan', { qrCode });
  return response.data;
};
