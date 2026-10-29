/**
 * Unified API Client for BMS Platform
 * Manages HTTP requests, authentication, token refresh, and standardized ApiError handling.
 */
import { getAuthToken } from '../utils/cookieUtils.js';
import { getApiUrl } from '../utils/apiConfig.js';
import { performTokenRefresh } from './authRefreshService.js';

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
  const token = (typeof localStorage !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : null) || getAuthToken() || '';
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

export const normalizePaginatedResponse = (raw, key = 'assets') => {
  const items = normalizeList(raw, key);
  const total = raw?.total ?? raw?.meta?.total ?? raw?.pagination?.total ?? raw?.count ?? items.length;
  const page = raw?.page ?? raw?.meta?.page ?? raw?.pagination?.page ?? 1;
  const limit = raw?.limit ?? raw?.meta?.limit ?? raw?.pagination?.limit ?? raw?.meta?.pageSize ?? items.length;
  const totalPages = raw?.totalPages ?? raw?.meta?.totalPages ?? raw?.pagination?.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 1);

  return { items, total, page, limit, totalPages };
};

// In-flight GET request deduplication map: Map<cacheKey, Promise<any>>
const inFlightRequests = new Map();

// In-memory response cache: Map<cacheKey, { data: any, expiresAt: number }>
const responseCache = new Map();

// Helper to determine cache TTL in milliseconds
const getEffectiveTtl = (url, customTtl) => {
  if (typeof customTtl === 'number') return customTtl;
  // Snapshots cache for 15s (prevents rapid re-fetching when toggling views/intervals)
  if (url.includes('/telemetry/snapshots')) return 15000;
  // Metadata catalogs (sites, devices, rules, settings) cache for 60s
  if (url.includes('/sites') || url.includes('/devices') || url.includes('/rules')) return 60000;
  // Generic GET requests default to 5s
  return 5000;
};

// Safe deep clone to prevent callers mutating cache entries in-place
const cloneData = (data) => {
  if (data === null || data === undefined || typeof data !== 'object') return data;
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(data);
    }
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    return data;
  }
};

// Invalidate cache entries matching a path or regex
export const invalidateCache = (pattern) => {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  const needle = String(pattern).toLowerCase();
  for (const key of responseCache.keys()) {
    if (key.toLowerCase().includes(needle)) {
      responseCache.delete(key);
    }
  }
};

async function executeRequest(endpoint, options = {}) {
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
    if (err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError('Network error or backend service unreachable', 0, 'NETWORK_ERROR');
  }

  // Auto-refresh token and retry request once on 401 for non-auth endpoints
  if (
    res.status === 401 &&
    !options._isRetry &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/refresh') &&
    !endpoint.includes('/auth/logout')
  ) {
    try {
      const newToken = await performTokenRefresh(true);
      if (newToken) {
        const retryHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`
        };
        const retryRes = await fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: 'include'
        });
        return retryRes;
      }
    } catch (refreshErr) {
      console.warn('[apiClient] Auto-refresh on 401 failed:', refreshErr);
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

    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bms_auth_unauthorized', { detail: { status: 401, message } }));
    }

    throw new ApiError(message, res.status, code, responseData);
  }

  return responseData;
}

export const apiClient = {
  async get(endpoint, params = {}, options = {}) {
    let url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const sortedKeys = Object.keys(params).sort();
      const searchParams = new URLSearchParams();
      for (const k of sortedKeys) {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          searchParams.append(k, params[k]);
        }
      }
      const queryStr = searchParams.toString();
      if (queryStr) {
        url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryStr}`;
      }
    }

    // Support both get(url, params, headers) and get(url, params, { headers, signal, skipCache, ttlMs })
    const isOptionsObj = options && typeof options === 'object' && !Array.isArray(options);
    const hasConfigKeys = isOptionsObj && (
      'headers' in options || 
      'signal' in options || 
      'skipCache' in options || 
      'forceRefresh' in options || 
      'ttlMs' in options
    );
    const resolvedHeaders = hasConfigKeys ? (options.headers || {}) : (options || {});
    const signal = isOptionsObj ? options.signal : undefined;
    const skipCache = Boolean(isOptionsObj && (options.skipCache || options.forceRefresh));
    const customTtl = isOptionsObj ? options.ttlMs : undefined;

    if (signal?.aborted) {
      const abortErr = new Error('The user aborted a request.');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    const cacheKey = url;
    const now = Date.now();

    // 1. Return from Memory Cache if still fresh
    if (!skipCache && responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey);
      if (cached.expiresAt > now) {
        return cloneData(cached.data);
      }
      responseCache.delete(cacheKey);
    }

    // 2. Return In-Flight Deduplication Promise if request is already pending
    if (!skipCache && inFlightRequests.has(cacheKey)) {
      const existingPromise = inFlightRequests.get(cacheKey);
      if (signal) {
        if (signal.aborted) {
          const abortErr = new Error('The user aborted a request.');
          abortErr.name = 'AbortError';
          throw abortErr;
        }
        return new Promise((resolve, reject) => {
          const onAbort = () => {
            signal.removeEventListener('abort', onAbort);
            const err = new Error('The user aborted a request.');
            err.name = 'AbortError';
            reject(err);
          };
          signal.addEventListener('abort', onAbort);
          existingPromise.then(
            res => {
              signal.removeEventListener('abort', onAbort);
              resolve(cloneData(res));
            },
            err => {
              signal.removeEventListener('abort', onAbort);
              reject(err);
            }
          );
        });
      }
      return existingPromise.then(res => cloneData(res));
    }

    // 3. Fire actual HTTP request and share promise
    const requestPromise = (async () => {
      const res = await executeRequest(url, {
        method: 'GET',
        headers: resolvedHeaders,
        signal
      });
      const data = await handleResponse(res);

      if (!skipCache && data !== null && data !== undefined) {
        const ttl = getEffectiveTtl(url, customTtl);
        if (ttl > 0) {
          responseCache.set(cacheKey, {
            data,
            expiresAt: Date.now() + ttl
          });
        }
      }
      return data;
    })();

    if (!skipCache) {
      inFlightRequests.set(cacheKey, requestPromise);
      requestPromise.finally(() => {
        inFlightRequests.delete(cacheKey);
      });
    }

    const result = await requestPromise;
    return cloneData(result);
  },

  async post(endpoint, data = {}, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'POST',
      headers: customHeaders,
      body: typeof data === 'string' ? data : JSON.stringify(data)
    });
    const result = await handleResponse(res);
    invalidateCache(endpoint);
    return result;
  },

  async put(endpoint, data = {}, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'PUT',
      headers: customHeaders,
      body: typeof data === 'string' ? data : JSON.stringify(data)
    });
    const result = await handleResponse(res);
    invalidateCache(endpoint);
    return result;
  },

  async patch(endpoint, data = {}, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'PATCH',
      headers: customHeaders,
      body: typeof data === 'string' ? data : JSON.stringify(data)
    });
    const result = await handleResponse(res);
    invalidateCache(endpoint);
    return result;
  },

  async delete(endpoint, customHeaders = {}) {
    const res = await executeRequest(endpoint, {
      method: 'DELETE',
      headers: customHeaders
    });
    const result = await handleResponse(res);
    invalidateCache(endpoint);
    return result;
  },

  clearCache: (pattern) => invalidateCache(pattern),
  invalidate: (pattern) => invalidateCache(pattern)
};

export default apiClient;
