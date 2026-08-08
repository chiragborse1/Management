import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@shared/types/api';

/**
 * In-memory access token store.
 *
 * The access token is kept in JS memory only (never localStorage) and the
 * refresh token lives exclusively in an HttpOnly cookie, so nothing sensitive
 * is exposed to XSS. The refresh flow re-populates this store transparently.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

/** Registered by AuthContext so the interceptor can clear auth state on expiry. */
let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Bare instance for the refresh call — it must never run through the 401
// interceptor (that would cause an infinite refresh loop).
const refreshClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/**
 * Single-flight refresh: concurrent 401s share one in-flight refresh request.
 * Resolves with the new access token, or null when the refresh failed.
 */
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = refreshClient
    .post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      // The server's refreshTokenSchema requires a non-empty body field, but
      // the controller reads the real token from the HttpOnly cookie first —
      // this dummy value only satisfies the validator.
      refreshToken: 'cookie',
    })
    .then((response) => {
      const token = response.data?.data?.accessToken ?? null;
      setAccessToken(token);
      return token;
    })
    .catch(() => {
      clearAccessToken();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    // Never refresh for auth endpoints themselves (failed login, session
    // restore, logout) — those must surface their 401 to the caller.
    const isAuthEndpoint = original?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      }
      // Refresh failed — the session is gone. Clear state and bounce to login.
      clearAccessToken();
      sessionExpiredHandler?.();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** Unwraps the { success, data } envelope so callers get `data` directly. */
export function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}
