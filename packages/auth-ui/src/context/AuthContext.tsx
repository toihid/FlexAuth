import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthUser, AuthSession } from '@flexauth/shared-types';
import { AuthState, AuthUIConfig } from '../types';
import { useAuthApi } from '../hooks/useAuthApi';

interface AuthContextValue extends AuthState {
  login: (identifier: string, identifierType: 'email' | 'username' | 'mobile', password: string) => Promise<void>;
  register: (data: { email?: string; username?: string; mobile?: string; displayName: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  config: AuthUIConfig;
  children: React.ReactNode;
}

const TOKEN_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';

/**
 * Authentication state provider.
 * Manages login/logout state and token storage.
 */
export function AuthProvider({ config, children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
  });

  const api = useAuthApi(config.apiBaseUrl);

  // Check for existing session on mount
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      // Validate token by fetching user profile
      fetch(`${config.apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setState({
              isLoading: false,
              isAuthenticated: true,
              user: data.data,
              error: null,
            });
          } else {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(REFRESH_KEY);
            setState({ isLoading: false, isAuthenticated: false, user: null, error: null });
          }
        })
        .catch(() => {
          setState({ isLoading: false, isAuthenticated: false, user: null, error: null });
        });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [config.apiBaseUrl]);

  const handleSession = useCallback(
    (session: AuthSession) => {
      sessionStorage.setItem(TOKEN_KEY, session.tokens.accessToken);
      sessionStorage.setItem(REFRESH_KEY, session.tokens.refreshToken);
      setState({
        isLoading: false,
        isAuthenticated: true,
        user: session.user,
        error: null,
      });
      config.onSuccess?.(session);
    },
    [config]
  );

  const login = useCallback(
    async (identifier: string, identifierType: 'email' | 'username' | 'mobile', password: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const session = await api.login({ identifier, identifierType, password });
        handleSession(session);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setState((s) => ({ ...s, isLoading: false, error: message }));
        config.onError?.(err instanceof Error ? err : new Error(message));
      }
    },
    [api, handleSession, config]
  );

  const register = useCallback(
    async (data: { email?: string; username?: string; mobile?: string; displayName: string; password: string }) => {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const session = await api.register(data);
        handleSession(session);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        setState((s) => ({ ...s, isLoading: false, error: message }));
        config.onError?.(err instanceof Error ? err : new Error(message));
      }
    },
    [api, handleSession, config]
  );

  const logout = useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // Logout even if API call fails
      }
    }
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    setState({ isLoading: false, isAuthenticated: false, user: null, error: null });
  }, [api]);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
