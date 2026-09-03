/**
 * Cookie Utilities for SCADA Authentication & Session Management
 */
import { AUTH_ENDPOINTS } from './apiConfig';

export const setCookie = (name, value, days = 7) => {
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
  try {
    const match = document.cookie.split('; ').find(row => row.startsWith(`${encodeURIComponent(name)}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  } catch (e) {
    return null;
  }
};

export const eraseCookie = (name) => {
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

export const getAuthToken = () => {
  return (
    inMemoryAccessToken ||
    getCookie('access_token') ||
    getCookie('token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('sochiot_token') ||
    null
  );
};

export const getUserRole = () => {
  return getCookie('userRole') || localStorage.getItem('userRole') || null;
};

export const getUserData = () => {
  try {
    const raw = getCookie('userData') || localStorage.getItem('userData');
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

  // Keep non-sensitive metadata in localStorage for sync/reactivity across tabs
  if (userRole) localStorage.setItem('userRole', userRole);
  if (userData) localStorage.setItem('userData', typeof userData === 'string' ? userData : JSON.stringify(userData));
  localStorage.setItem('isAuthenticated', 'true');

  // Remove redundant raw JWT tokens from localStorage to minimize XSS attack surface
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('sochiot_token');
  localStorage.removeItem('auth_token');
};

export const clearAuthCookies = () => {
  eraseCookie('access_token');
  eraseCookie('token');
  eraseCookie('refresh_token');
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
      }
    }).catch(() => {});
  } catch (e) {}

  try {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('sochiot_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('remembered_password');
    localStorage.removeItem('impersonator_backup_user');
    localStorage.removeItem('impersonator_backup_role');
    sessionStorage.clear();
  } catch (e) {
    console.warn('Failed to clear storage on auth session reset:', e);
  }
};

