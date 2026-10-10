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
  isTokenExpiringSoon,
  sanitizeClientCookies
} from '../utils/cookieUtils.js';
import { AUTH_ENDPOINTS } from '../utils/apiConfig.js';

// Access tokens expire in 15 minutes (900s). Refresh every 10 minutes proactively.
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const REFRESH_COOLDOWN_MS = 30 * 1000; // 30s cooldown to prevent flood
const MIN_DEBOUNCE_MS = 5 * 1000; // 5s absolute debounce to prevent rapid rotation collisions

let refreshTimer = null;
let activeRefreshPromise = null;
let activeRefreshAbortController = null;
let lastRefreshTime = 0;
let isListenersAttached = false;

export const performTokenRefresh = async (force = false) => {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  const now = Date.now();
  const currentAccessToken = getAuthToken();

  // Strict debounce to avoid rapid back-to-back rotations triggering TOKEN_REUSE_DETECTED
  if (currentAccessToken && (now - lastRefreshTime < MIN_DEBOUNCE_MS)) {
    return currentAccessToken;
  }

  // If not forced and token is not expiring within 3 minutes and cooldown applies, return existing token
  if (!force && !isTokenExpiringSoon(currentAccessToken, 180) && (now - lastRefreshTime < REFRESH_COOLDOWN_MS)) {
    return currentAccessToken;
  }

  activeRefreshPromise = (async () => {
    // 1. Sanitize any legacy or rogue client cookies that might shadow the server's HttpOnly cookie
    sanitizeClientCookies();

    const currentRefreshToken = getRefreshToken();

    if (!currentRefreshToken && !currentAccessToken) {
      console.warn('[AuthRefresh] performTokenRefresh called but NO access token and NO refresh token found. Returning null without logout.');
      return null;
    }

    console.info(
      `[AuthRefresh] Attempting token refresh at ${AUTH_ENDPOINTS.refresh}`,
      { hasAccessToken: !!currentAccessToken, hasRefreshToken: !!currentRefreshToken, force }
    );

    try {
      activeRefreshAbortController = new AbortController();

      // Send refreshToken in body as fallback if available in client storage (supports both login JWT & rotated tokens)
      const refreshBody = currentRefreshToken && typeof currentRefreshToken === 'string' && currentRefreshToken.trim()
        ? { refreshToken: currentRefreshToken.trim() }
        : {};

      const fetchFn = (typeof window !== 'undefined' && window._nativeFetch) ? window._nativeFetch : fetch;
      const response = await fetchFn(AUTH_ENDPOINTS.refresh, {
        method: 'POST',
        credentials: 'include',
        signal: activeRefreshAbortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(refreshBody)
      });

      console.info(`[AuthRefresh] Refresh endpoint responded: HTTP ${response.status}`);

      if (response.ok) {
        lastRefreshTime = Date.now();
        const resData = await response.json();
        const payload = resData?.data || resData;
        const newAccessToken = payload?.accessToken || payload?.token;
        // Backend rotates the refresh token and returns the new raw token in payload & Set-Cookie
        const newRefreshToken = payload?.refreshToken || null;

        if (newAccessToken) {
          const userRole = getUserRole() || 'USER';
          const userData = getUserData() || {};

          setAuthSession({
            token: newAccessToken,
            refreshToken: newRefreshToken,
            userRole,
            userData
          });

          console.info('[AuthRefresh] Token refreshed successfully.');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('bms_auth_refreshed', { detail: { token: newAccessToken } }));
          }
          return newAccessToken;
        }
      } else if (response.status === 401 || response.status === 403) {
        // Refresh token is expired or revoked (e.g. TOKEN_REVOKED, TOKEN_NOT_FOUND, or TOKEN_REUSE_DETECTED)
        console.warn(`[AuthRefresh] Refresh failed with HTTP ${response.status}. Purging session.`);
        clearAuthSession();

        try {
          const { store } = await import('../store/store.js');
          const { logout } = await import('../store/authSlice.js');
          if (store?.dispatch && logout) {
            store.dispatch(logout());
          }
        } catch (e) {}

        if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
        return null;
      } else {
        console.warn(`[AuthRefresh] Unexpected HTTP ${response.status} from refresh endpoint. Session NOT cleared.`);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.info('[AuthRefresh] Token refresh aborted due to session termination/logout.');
      } else {
        console.warn('[AuthRefresh] Network error during token refresh:', err);
      }
    } finally {
      activeRefreshAbortController = null;
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
    performTokenRefresh(false);
  }
};

export const startAutoTokenRefresh = () => {
  if (refreshTimer) {
    return;
  }

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
};

export const stopAutoTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (typeof window !== 'undefined' && isListenersAttached) {
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    isListenersAttached = false;
  }
  if (activeRefreshAbortController) {
    try {
      activeRefreshAbortController.abort();
    } catch (e) {}
    activeRefreshAbortController = null;
  }
  activeRefreshPromise = null;
};
