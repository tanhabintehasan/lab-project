/**
 * Auth React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, APIResponse } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

interface LoginPhoneData {
  phone: string;
  code: string;
}

interface SendOTPData {
  phone: string;
  type: 'login' | 'reset' | 'verify';
}

interface VerifyOTPData {
  phone: string;
  code: string;
  type: 'login' | 'reset' | 'verify';
}

interface ResetPasswordData {
  phone: string;
  code: string;
  newPassword: string;
}

/**
 * Get current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: async () => {
      const response = await apiClient.get<APIResponse<User>>('/api/auth/me');
      return response.data;
    },
    retry: false, // Don't retry on 401
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Send OTP
 */
export function useSendOTP() {
  return useMutation({
    mutationFn: async (data: SendOTPData) => {
      return apiClient.post<APIResponse>('/api/auth/send-otp', data);
    }
  });
}

/**
 * Verify OTP
 */
export function useVerifyOTP() {
  return useMutation({
    mutationFn: async (data: VerifyOTPData) => {
      return apiClient.post<APIResponse>('/api/auth/verify-otp', data);
    }
  });
}

/**
 * Login with phone + OTP
 */
export function useLoginPhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginPhoneData) => {
      return apiClient.post<APIResponse<{ user: User; token: string }>>(
        '/api/auth/login-phone',
        data
      );
    },
    onSuccess: () => {
      // Invalidate and refetch user
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });
}

/**
 * Reset password with OTP
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      return apiClient.post<APIResponse>('/api/auth/reset-password-otp', data);
    }
  });
}

/**
 * Logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiClient.post<APIResponse>('/api/auth/logout');
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    }
  });
}
