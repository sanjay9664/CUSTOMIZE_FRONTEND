/**
 * Automatic Token Refresh Service
 * Refreshes access tokens 2 minutes before 15-min expiry (every 13 minutes / 780s)
 */
import { getCookie, setAuthCookies, clearAuthCookies } from '../utils/cookieUtils';

const REFRESH_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes (780,000 ms)
let refreshTimer = null;

export const performTokenRefresh = async () => {
  const currentRefreshToken = getCookie('refresh_token') || localStorage.getItem('refresh_token');
  const currentAccessToken = getCookie('access_token') || getCookie('token') || localStorage.getItem('token');

  if (!currentRefreshToken && !currentAccessToken) {
    console.warn('[AuthRefresh] No tokens found to refresh.');
    return false;
  }

  try {
    console.log('[AuthRefresh] Triggering automatic token refresh (2 mins before 15-min expiry)...');
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
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
      const newAccessToken = payload?.accessToken || payload?.token || currentAccessToken;
      const newRefreshToken = payload?.refreshToken || currentRefreshToken;

      // Update LocalStorage
      if (newAccessToken) localStorage.setItem('token', newAccessToken);
      if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);

      // Update Cookies
      const userRole = localStorage.getItem('userRole') || 'ADMIN';
      let userData = {};
      try { userData = JSON.parse(localStorage.getItem('userData') || '{}'); } catch(e) {}

      setAuthCookies({
        token: newAccessToken,
        refreshToken: newRefreshToken,
        userRole,
        userData
      });

      console.log(`[AuthRefresh] Tokens refreshed successfully at ${new Date().toLocaleTimeString()}! Next refresh in 13 minutes.`);
      return true;
    } else {
      console.warn('[AuthRefresh] Refresh token API returned status:', response.status);
    }
  } catch (err) {
    console.warn('[AuthRefresh] Network error during token refresh:', err);
  }
  return false;
};

export const startAutoTokenRefresh = () => {
  stopAutoTokenRefresh();
  
  // Schedule periodic refresh every 13 minutes
  refreshTimer = setInterval(() => {
    performTokenRefresh();
  }, REFRESH_INTERVAL_MS);

  console.log('[AuthRefresh] Auto token refresh scheduler activated (Every 13 minutes).');
};

export const stopAutoTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    console.log('[AuthRefresh] Auto token refresh scheduler stopped.');
  }
};
