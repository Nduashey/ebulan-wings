import api from './api';
import { User, LoginCredentials, RegisterData, ApiResponse } from '../types';

export const login = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
  return response.data;
};

export const register = async (data: RegisterData): Promise<{ user: User; token: string }> => {
  const response = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
  localStorage.removeItem('token');
};

export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await api.put<ApiResponse<User>>('/auth/profile', data);
  return response.data;
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  await api.post('/auth/change-password', { oldPassword, newPassword });
};
