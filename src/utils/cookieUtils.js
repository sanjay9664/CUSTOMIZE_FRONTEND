/**
 * Cookie Utilities for SCADA Authentication & Session Management
 */
import { AUTH_ENDPOINTS } from './apiConfig.js';

export const setCookie = (name, value, days = 7) => {
  if (typeof document === 'undefined') return;
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const isSecure = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secureFlag}`;
  } catch (e) {
    console.warn('Failed to set cookie:', e);
  }
};

export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.split('; ').find(row => row.startsWith(`${encodeURIComponent(name)}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  } catch (e) {
    return null;
  }
};

export const eraseCookie = (name) => {
  if (typeof document === 'undefined') return;
  try {
    const isSecure = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    const secureFlag = isSecure ? '; Secure' : '';
    const paths = ['/', '/api', '/api/v1', '/api/v1/auth'];
    paths.forEach((p) => {
      document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${p}; SameSite=Lax${secureFlag}`;
      document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${p}`;
    });
  } catch (e) {
    console.warn('Failed to erase cookie:', e);
  }
};

export const sanitizeClientCookies = () => {
  if (typeof document === 'undefined') return;
  try {
    const isSecure = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    const secureVariants = isSecure ? ['; Secure', ''] : [''];
    const sameSiteVariants = ['; SameSite=Lax', '; SameSite=Strict', '; SameSite=None', ''];
    const paths = ['/', '/api', '/api/v1', '/api/v1/auth', '/auth', ''];
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
    const domains = ['', host ? `; domain=${host}` : ''];
    const tokenNames = ['refresh_token', 'refreshToken'];

    tokenNames.forEach((name) => {
      paths.forEach((p) => {
        domains.forEach((d) => {
          sameSiteVariants.forEach((s) => {
            secureVariants.forEach((sec) => {
              const pathPart = p ? `; path=${p}` : '';
              document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${pathPart}${d}${s}${sec}`;
            });
          });
        });
      });
    });
  } catch (e) {
    console.warn('Failed to sanitize client cookies:', e);
  }
};

// Neutralize any legacy or rogue client-accessible refresh token cookies immediately on module evaluation
if (typeof document !== 'undefined') {
  sanitizeClientCookies();
}

let inMemoryAccessToken = null;

export const setMemoryToken = (token) => {
  inMemoryAccessToken = token;
};

export const getMemoryToken = () => inMemoryAccessToken;

const safeStorageGet = (key) => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

const safeStorageSet = (key, val) => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, val);
  } catch {}
};

const safeStorageRemove = (key) => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {}
};

export const getAuthToken = () => {
  return (
    safeStorageGet('token') ||
    safeStorageGet('accessToken') ||
    safeStorageGet('access_token') ||
    inMemoryAccessToken ||
    getCookie('access_token') ||
    getCookie('token') ||
    safeStorageGet('sochiot_token') ||
    safeStorageGet('auth_token') ||
    null
  );
};

export const getRefreshToken = () => {
  // Only read from local storage; the backend HttpOnly cookie cannot and should not be read via document.cookie
  const raw = (
    safeStorageGet('refreshToken') ||
    safeStorageGet('refresh_token') ||
    null
  );
  if (!raw || typeof raw !== 'string') return null;
  return raw.trim();
};

export const getSochiotAccessToken = () => {
  return safeStorageGet('Sochiot-accesstoken');
};

export const setSochiotAccessToken = (token) => {
  if (token) {
    safeStorageSet('Sochiot-accesstoken', token);
  } else {
    safeStorageRemove('Sochiot-accesstoken');
  }
};

export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const isTokenExpiringSoon = (token = getAuthToken(), thresholdSeconds = 120) => {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  const currentTime = Math.floor(Date.now() / 1000);
  return (payload.exp - currentTime) < thresholdSeconds;
};

export const getUserRole = () => {
  return getCookie('userRole') || safeStorageGet('userRole') || null;
};

export const getUserData = () => {
  try {
    const raw = getCookie('userData') || safeStorageGet('userData');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setAuthCookies = ({ token, userRole, userData }) => {
  if (token) {
    setCookie('access_token', token, 7);
    setCookie('token', token, 7);
  }
  // IMPORTANT SECURITY & ROTATION FIX:
  // Do NOT set refresh_token in document.cookie.
  // The backend manages refresh_token as an HttpOnly, Secure cookie with Path=/api/v1/auth.
  // Erase any legacy client-accessible refresh_token cookie across all paths to prevent shadowing.
  sanitizeClientCookies();

  if (userRole) {
    setCookie('userRole', userRole, 7);
  }
  if (userData) {
    setCookie('userData', typeof userData === 'string' ? userData : JSON.stringify(userData), 7);
  }
  setCookie('isAuthenticated', 'true', 7);
};

export const setAuthSession = ({ token, refreshToken, userRole, userData }) => {
  if (token) {
    setMemoryToken(token);
    safeStorageSet('token', token);
    safeStorageSet('accessToken', token);
    safeStorageSet('access_token', token);
  }
  setAuthCookies({ token, userRole, userData });

  // Keep non-sensitive metadata in storage for sync/reactivity across tabs
  if (userRole) safeStorageSet('userRole', userRole);
  if (userData) safeStorageSet('userData', typeof userData === 'string' ? userData : JSON.stringify(userData));
  
  // Store refreshToken in storage whenever provided (supports both JWT from login and rotated opaque hex tokens)
  if (refreshToken && typeof refreshToken === 'string' && refreshToken.trim()) {
    safeStorageSet('refresh_token', refreshToken.trim());
    safeStorageSet('refreshToken', refreshToken.trim());
  } else if (refreshToken === null) {
    safeStorageRemove('refresh_token');
    safeStorageRemove('refreshToken');
  }
  safeStorageSet('isAuthenticated', 'true');
};

export const clearAuthCookies = () => {
  eraseCookie('access_token');
  eraseCookie('token');
  eraseCookie('userRole');
  eraseCookie('userData');
  eraseCookie('isAuthenticated');
  sanitizeClientCookies();
};

const PRESERVED_STORAGE_KEYS = new Set(['app_theme', 'remember_me', 'remembered_identifier']);

let isRevokingSession = false;

export const clearAuthSession = () => {
  const currentToken = getAuthToken();
  const currentRefreshToken = getRefreshToken();
  setMemoryToken(null);
  clearAuthCookies();

  // Allowlist-based storage purge: removes all auth, operational, tenant, and device keys
  // while preserving safe UI preferences (app_theme, remember_me, remembered_identifier)
  try {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !PRESERVED_STORAGE_KEYS.has(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => {
        try { localStorage.removeItem(k); } catch (e) {}
      });
    }
  } catch (e) {
    console.warn('Failed to clear localStorage on auth session reset:', e);
  }

  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  } catch (e) {
    console.warn('Failed to clear sessionStorage on auth session reset:', e);
  }

  // Clear in-memory service singletons & caches
  try {
    import('../services/sochiotLocationService.js').then((m) => {
      if (m?.clearSochiotCache) m.clearSochiotCache();
    }).catch(() => {});
  } catch (e) {}

  // Graceful server-side session revocation with keepalive
  if ((currentToken || currentRefreshToken) && !isRevokingSession) {
    isRevokingSession = true;
    try {
      const nativeFetch = (typeof window !== 'undefined' && window._nativeFetch) ? window._nativeFetch : fetch;
      nativeFetch(AUTH_ENDPOINTS.logout, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
        },
        credentials: 'include'
      })
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            isRevokingSession = false;
          }, 1500);
        });
    } catch (e) {
      isRevokingSession = false;
    }
  }
};

