/**
 * Unified API Client for BMS Platform
 * Manages HTTP requests, authentication, token refresh, and standardized ApiError handling.
 */
import { getAuthToken, clearAuthSession } from '../utils/cookieUtils';
import { performTokenRefresh } from './authRefreshService';
import { getApiUrl } from '../utils/apiConfig';

export class ApiError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export const getAuthHeaders = () => {
  const token = getAuthToken() || '';
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const normalizeList = (raw, key) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (key && Array.isArray(raw[key])) return raw[key];
  if (raw.data && key && Array.isArray(raw.data[key])) return raw.data[key];
  if (Array.isArray(raw.companies)) return raw.companies;
  if (Array.isArray(raw.tenants)) return raw.tenants;
  if (Array.isArray(raw.zones)) return raw.zones;
  if (Array.isArray(raw.areas)) return raw.areas;
  if (Array.isArray(raw.sites)) return raw.sites;
  if (Array.isArray(raw.buildings)) return raw.buildings;
  if (Array.isArray(raw.assets)) return raw.assets;
  if (Array.isArray(raw.devices)) return raw.devices;
  return [];
};

let refreshPromise = null;

async function executeRequest(endpoint, options = {}, isRetry = false) {
  const url = getApiUrl(endpoint);
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };

  const config = {
    ...options,
    headers,
    credentials: 'include'
  };

  let res;
  try {
    res = await fetch(url, config);
  } catch (err) {
    throw new ApiError('Network error or backend service unreachable', 0, 'NETWORK_ERROR');
  }

  // Reactive 401 Interceptor: perform single refresh and retry queued requests once
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
        ...headers,
        'Authorization': `Bearer ${newToken}`
      };
      try {
        return await fetch(url, { ...config, headers: retryHeaders });
      } catch (retryErr) {
        throw new ApiError('Network error during retry after token refresh', 0, 'NETWORK_ERROR');
      }
    } else {
      clearAuthSession();
      if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  return res;
}

async function handleResponse(res) {
  let responseData = null;
  const contentType = res.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    try {
      responseData = await res.json();
    } catch (e) {
      responseData = null;
    }
  } else {
    responseData = await res.text().catch(() => null);
  }

  if (!res.ok) {
    let message = `HTTP ${res.status} Error`;
    let code = `HTTP_${res.status}`;

    if (responseData && typeof responseData === 'object') {
      if (responseData.error && typeof responseData.error === 'object') {
        message = responseData.error.message || message;
        code = responseData.error.code || code;
      } else if (typeof responseData.error === 'string') {
        message = responseData.error;
      } else if (responseData.message) {
        message = responseData.message;
      }
    }

    throw new ApiError(message, res.status, code, responseData);
  }

  return responseData;
}

export const apiClient = {
  async get(endpoint, params = {}, customHeaders = {}) {
    let url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const queryStr = new URLSearchParams(params).toString();
      url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryStr}`;
    }

    const res = await executeRequest(url, {
      method: 'GET',
      headers: customHeaders
    });
    return handleResponse(res);
  },

  async post(endpoint, data = {}, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'POST',
      headers: customHeaders,
      body: typeof data === 'string' ? data : JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async put(endpoint, data = {}, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'PUT',
      headers: customHeaders,
      body: typeof data === 'string' ? data : JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async patch(endpoint, data = {}, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'PATCH',
      headers: customHeaders,
      body: typeof data === 'string' ? data : JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async delete(endpoint, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'DELETE',
      headers: customHeaders
    });
    return handleResponse(res);
  }
};

export default apiClient;
