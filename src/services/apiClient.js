/**
 * Unified API Client for BMS Platform
 * Handles authentication, cookies, JSON parsing, and response normalization
 */
import { getAuthToken, clearAuthSession } from '../utils/cookieUtils';
import { performTokenRefresh } from './authRefreshService';
import { getApiUrl } from '../utils/apiConfig';

export const getAuthHeaders = () => {
  const token = getAuthToken() || '';

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const normalizeList = (raw, key) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (raw.data && Array.isArray(raw.data[key])) return raw.data[key];
  if (Array.isArray(raw[key])) return raw[key];
  return [];
};

let refreshPromise = null;

async function executeRequest(endpoint, options = {}, isRetry = false) {
  const url = getApiUrl(endpoint);
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };

  const res = await fetch(url, { ...options, headers });

  // Reactive 401 Interceptor: Catch token expiration, perform single refresh, and retry queued requests
  if (res.status === 401 && !isRetry) {
    if (endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh')) {
      return res;
    }

    if (!refreshPromise) {
      refreshPromise = performTokenRefresh(true).finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      const retryHeaders = {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newToken}`
      };
      return fetch(url, { ...options, headers: retryHeaders });
    } else {
      clearAuthSession();
      if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  return res;
}

export const apiClient = {
  async get(endpoint, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'GET',
      headers: customHeaders
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || err.error?.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  },

  async post(endpoint, data = {}, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'POST',
      headers: customHeaders,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || err.error?.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  },

  async patch(endpoint, data = {}, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'PATCH',
      headers: customHeaders,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || err.error?.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  },

  async delete(endpoint, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'DELETE',
      headers: customHeaders
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || err.error?.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  }
};

export default apiClient;
