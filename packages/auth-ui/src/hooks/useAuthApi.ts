import { useCallback } from 'react';
import {
  ApiResponse,
  AuthSession,
  LoginCredentials,
  ProvidersResponse,
} from '@flexauth/shared-types';

/**
 * Hook for making authenticated API calls to the auth backend.
 * Handles request/response formatting and error extraction.
 */
export function useAuthApi(baseUrl: string) {
  const request = useCallback(
    async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      const url = `${baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });

      const data: ApiResponse<T> = await response.json();

      if (!data.success) {
        const error = new Error(data.error?.message || 'Request failed');
        (error as any).code = data.error?.code;
        (error as any).details = data.error?.details;
        throw error;
      }

      return data.data as T;
    },
    [baseUrl]
  );

  const getConfig = useCallback((): Promise<ProvidersResponse> => {
    return request<ProvidersResponse>('/auth/config');
  }, [request]);

  const login = useCallback(
    (credentials: LoginCredentials): Promise<AuthSession> => {
      return request<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    [request]
  );

  const register = useCallback(
    (data: {
      email?: string;
      username?: string;
      mobile?: string;
      displayName: string;
      password: string;
    }): Promise<AuthSession> => {
      return request<AuthSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    [request]
  );

  const refreshToken = useCallback(
    (refreshToken: string) => {
      return request<{ accessToken: string; refreshToken: string; expiresIn: number }>(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }
      );
    },
    [request]
  );

  const logout = useCallback(
    (accessToken: string) => {
      return request<{ message: string }>('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    },
    [request]
  );

  const initBankId = useCallback(() => {
    return request<{ orderRef: string; autoStartToken: string }>('/auth/bankid/init', {
      method: 'POST',
    });
  }, [request]);

  const collectBankId = useCallback(
    (orderRef: string) => {
      return request<{ status: string; orderRef: string }>('/auth/bankid/collect', {
        method: 'POST',
        body: JSON.stringify({ orderRef }),
      });
    },
    [request]
  );

  return {
    getConfig,
    login,
    register,
    refreshToken,
    logout,
    initBankId,
    collectBankId,
  };
}
