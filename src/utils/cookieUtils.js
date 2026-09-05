/**
 * Cookie Utilities for SCADA Authentication & Session Management
 */
import { AUTH_ENDPOINTS } from './apiConfig';

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
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${secureFlag}`;
  } catch (e) {
    console.warn('Failed to erase cookie:', e);
  }
};

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
    inMemoryAccessToken ||
    getCookie('access_token') ||
    getCookie('token') ||
    safeStorageGet('token') ||
    safeStorageGet('access_token') ||
    safeStorageGet('sochiot_token') ||
    null
  );
};

export const getRefreshToken = () => {
  return (
    getCookie('refresh_token') ||
    getCookie('refreshToken') ||
    safeStorageGet('refresh_token') ||
    safeStorageGet('refreshToken') ||
    null
  );
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

export const setAuthCookies = ({ token, refreshToken, userRole, userData }) => {
  if (token) {
    setCookie('access_token', token, 7);
    setCookie('token', token, 7);
  }
  if (refreshToken) {
    setCookie('refresh_token', refreshToken, 7);
    setCookie('refreshToken', refreshToken, 7);
  }
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
  }
  setAuthCookies({ token, refreshToken, userRole, userData });

  // Keep non-sensitive metadata in storage for sync/reactivity across tabs
  if (userRole) safeStorageSet('userRole', userRole);
  if (userData) safeStorageSet('userData', typeof userData === 'string' ? userData : JSON.stringify(userData));
  if (refreshToken) {
    safeStorageSet('refresh_token', refreshToken);
    safeStorageSet('refreshToken', refreshToken);
  }
  safeStorageSet('isAuthenticated', 'true');

  // Remove redundant raw JWT tokens from localStorage to minimize XSS attack surface
  safeStorageRemove('token');
  safeStorageRemove('access_token');
  safeStorageRemove('sochiot_token');
  safeStorageRemove('auth_token');
};

export const clearAuthCookies = () => {
  eraseCookie('access_token');
  eraseCookie('token');
  eraseCookie('refresh_token');
  eraseCookie('refreshToken');
  eraseCookie('userRole');
  eraseCookie('userData');
  eraseCookie('isAuthenticated');
};

export const clearAuthSession = () => {
  const currentToken = getAuthToken();
  setMemoryToken(null);
  clearAuthCookies();

  // Graceful server-side session revocation (fire-and-forget)
  try {
    fetch(AUTH_ENDPOINTS.logout, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
      },
      credentials: 'include'
    }).catch(() => {});
  } catch (e) {}

  safeStorageRemove('token');
  safeStorageRemove('access_token');
  safeStorageRemove('refresh_token');
  safeStorageRemove('refreshToken');
  safeStorageRemove('sochiot_token');
  safeStorageRemove('auth_token');
  safeStorageRemove('userData');
  safeStorageRemove('userRole');
  safeStorageRemove('isAuthenticated');
  safeStorageRemove('remembered_password');
  safeStorageRemove('impersonator_backup_user');
  safeStorageRemove('impersonator_backup_role');
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  } catch (e) {
    console.warn('Failed to clear sessionStorage on auth session reset:', e);
  }
};

