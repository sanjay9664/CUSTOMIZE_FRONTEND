/**
 * Automatic Token Refresh Service
 * Refreshes access tokens silently before expiration and handles concurrent request deduplication
 */
import { getCookie, getAuthToken, setAuthSession, getUserRole, getUserData } from '../utils/cookieUtils';
import { AUTH_ENDPOINTS } from '../utils/apiConfig';

// The BMS access token is valid for 15 minutes. Refreshing at 12 minutes
// leaves a safe buffer for slow networks and browser timer throttling.
const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

let refreshTimer = null;
let activeRefreshPromise = null;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown

export const performTokenRefresh = async (force = false) => {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  const now = Date.now();
  if (!force && now - lastRefreshTime < REFRESH_COOLDOWN_MS) {
    return getAuthToken();
  }
  lastRefreshTime = now;

  activeRefreshPromise = (async () => {
    const currentRefreshToken = getCookie('refresh_token') || localStorage.getItem('refresh_token');
    const currentAccessToken = getAuthToken();

    if (!currentRefreshToken && !currentAccessToken) {
      return null;
    }

    try {
      console.log('[AuthRefresh] Performing silent token refresh...');
      const response = await fetch(AUTH_ENDPOINTS.refresh, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {})
        },
        body: JSON.stringify({
          refreshToken: currentRefreshToken
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const payload = resData?.data || resData;
        const newAccessToken = payload?.accessToken || payload?.token;
        const newRefreshToken = payload?.refreshToken || currentRefreshToken;

        const userRole = getUserRole() || 'USER';
        const userData = getUserData() || {};

        setAuthSession({
          token: newAccessToken || currentAccessToken,
          refreshToken: newRefreshToken,
          userRole,
          userData
        });

        console.log(`[AuthRefresh] Silent token refresh succeeded at ${new Date().toLocaleTimeString()}`);
        return newAccessToken || currentAccessToken;
      }
    } catch (err) {
      console.warn('[AuthRefresh] Network error during token refresh:', err);
    }

    return currentAccessToken || null;
  })().finally(() => {
    activeRefreshPromise = null;
  });

  return activeRefreshPromise;
};

export const startAutoTokenRefresh = () => {
  stopAutoTokenRefresh();
  
  // A refresh rotates the refresh token too, extending an active session
  // without waiting for a protected API request to fail with 401.
  refreshTimer = setInterval(() => {
    performTokenRefresh();
  }, REFRESH_INTERVAL_MS);

  // Trigger initial check immediately
  performTokenRefresh();

  console.log('[AuthRefresh] Auto token refresh scheduler activated (Every 12 minutes).');
};

export const stopAutoTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    console.log('[AuthRefresh] Auto token refresh scheduler stopped.');
  }
};
