/**
 * Automatic Token Refresh Service
 * Refreshes access tokens silently before expiration and handles concurrent request deduplication.
 * Compliant with OpenAPI 3.0.3 specification (/auth/refresh).
 */
import {
  getAuthToken,
  getRefreshToken,
  setAuthSession,
  clearAuthSession,
  getUserRole,
  getUserData,
  isTokenExpiringSoon
} from '../utils/cookieUtils';
import { AUTH_ENDPOINTS } from '../utils/apiConfig';

// Access tokens expire in 15 minutes (900s). Refresh every 10 minutes proactively.
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const REFRESH_COOLDOWN_MS = 30 * 1000; // 30s cooldown to prevent flood

let refreshTimer = null;
let activeRefreshPromise = null;
let lastRefreshTime = 0;
let isListenersAttached = false;

export const performTokenRefresh = async (force = false) => {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  const now = Date.now();
  const currentAccessToken = getAuthToken();

  // If not forced and token is not expiring within 3 minutes and cooldown applies, return existing token
  if (!force && !isTokenExpiringSoon(currentAccessToken, 180) && (now - lastRefreshTime < REFRESH_COOLDOWN_MS)) {
    return currentAccessToken;
  }
  lastRefreshTime = now;

  activeRefreshPromise = (async () => {
    const currentRefreshToken = getRefreshToken();

    if (!currentRefreshToken && !currentAccessToken) {
      return null;
    }

    try {
      console.log('[AuthRefresh] Regenerating access token...');
      const response = await fetch(AUTH_ENDPOINTS.refresh, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Allows browser to transmit and receive HttpOnly refresh cookies
        body: JSON.stringify(currentRefreshToken ? { refreshToken: currentRefreshToken } : {})
      });

      if (response.ok) {
        const resData = await response.json();
        const payload = resData?.data || resData;
        const newAccessToken = payload?.accessToken || payload?.token;
        const newRefreshToken = payload?.refreshToken || currentRefreshToken;

        if (newAccessToken) {
          const userRole = getUserRole() || 'USER';
          const userData = getUserData() || {};

          setAuthSession({
            token: newAccessToken,
            refreshToken: newRefreshToken,
            userRole,
            userData
          });

          console.log(`[AuthRefresh] Token successfully renewed at ${new Date().toLocaleTimeString()}`);
          return newAccessToken;
        }
      } else if (response.status === 401 || response.status === 403) {
        // Refresh token is expired or revoked
        console.warn('[AuthRefresh] Refresh token expired or revoked. Logging out...');
        clearAuthSession();
        if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return null;
      }
    } catch (err) {
      console.warn('[AuthRefresh] Network error during token refresh:', err);
    }

    return null;
  })().finally(() => {
    activeRefreshPromise = null;
  });

  return activeRefreshPromise;
};

const handleVisibilityOrFocus = () => {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
  const currentToken = getAuthToken();
  if (currentToken && isTokenExpiringSoon(currentToken, 180)) {
    console.log('[AuthRefresh] Tab active / visible with expiring token, refreshing now...');
    performTokenRefresh(true);
  }
};

export const startAutoTokenRefresh = () => {
  stopAutoTokenRefresh();

  // Schedule periodic proactive refresh every 10 minutes
  refreshTimer = setInterval(() => {
    performTokenRefresh(true);
  }, REFRESH_INTERVAL_MS);

  // Attach tab focus & visibility change listeners
  if (typeof window !== 'undefined' && !isListenersAttached) {
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    isListenersAttached = true;
  }

  // If token is already expiring soon on start, refresh immediately
  const token = getAuthToken();
  if (token && isTokenExpiringSoon(token, 180)) {
    performTokenRefresh(true);
  }

  console.log('[AuthRefresh] Auto token refresh scheduler activated (Every 10 min + on tab focus).');
};

export const stopAutoTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    console.log('[AuthRefresh] Auto token refresh scheduler stopped.');
  }
  if (typeof window !== 'undefined' && isListenersAttached) {
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    isListenersAttached = false;
  }
};
