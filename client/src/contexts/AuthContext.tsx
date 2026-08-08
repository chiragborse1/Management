'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '@shared/types';
import type { ApiResponse } from '@shared/types/api';
import {
  apiClient,
  clearAccessToken,
  refreshAccessToken,
  setAccessToken,
  setSessionExpiredHandler,
} from '@/lib/apiClient';

/* eslint-disable react-refresh/only-export-components -- context files legitimately export a hook + provider */

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  studentId?: string;
  hostelId?: string;
  businessName?: string;
}

interface AuthResponseData {
  user: User;
  accessToken: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clear local auth state when the apiClient interceptor detects an expired
  // session (refresh failed) — keeps context in sync with the token store.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearAccessToken();
      setUser(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  // Restore the session from the HttpOnly cookie on mount.
  useEffect(() => {
    let cancelled = false;
    async function restoreSession(): Promise<void> {
      try {
        const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
        if (!cancelled) setUser(response.data.data.user);
      } catch {
        // 401 or network error — nothing to restore.
        clearAccessToken();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe?: boolean) => {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', {
      email,
      password,
      rememberMe,
    });
    const { user: loggedInUser, accessToken } = response.data.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', {
      ...data,
      confirmPassword: data.password, // the server validator requires it
    });
    const { user: registeredUser, accessToken } = response.data.data;
    setAccessToken(accessToken);
    setUser(registeredUser);
    return registeredUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore server errors — always clear local state.
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const token = await refreshAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    setUser(response.data.data.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: user !== null, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
