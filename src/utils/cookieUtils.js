/**
 * Cookie Utilities for SCADA Authentication & Session Management
 */

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

export const clearAuthCookies = () => {
  eraseCookie('access_token');
  eraseCookie('token');
  eraseCookie('refresh_token');
  eraseCookie('userRole');
  eraseCookie('userData');
  eraseCookie('isAuthenticated');
};
