/**
 * Sochiot Location & Entity API Service
 * Interacts with the Sochiot IoT platform using the Access-Token obtained from
 * http://localhost:3001/api/v1/auth/Access-token.
 * 
 * Inspired by ismartaccess-frontend-v2 architecture:
 * - Centralized endpoints from apiEndpoints.js
 * - In-flight promise deduplication & memory caching
 * - Standardized error handling via parseApiError
 */
import { getApiUrl, EXTERNAL_URLS } from '../utils/apiConfig';
import { getAuthToken } from '../utils/cookieUtils';
import { AUTH_ENDPOINTS, CONFIG_ENDPOINTS } from '../constants/apiEndpoints';
import { parseApiError } from '../utils/errorHandler';

const SOCHIOT_TOKEN_KEY = 'Sochiot-accesstoken';

// In-memory singletons for request deduplication and caching
let inMemoryToken = null;
let cachedUserHierarchy = null;
let pendingTokenPromise = null;
let pendingHierarchyPromise = null;
const entityHierarchyCache = new Map();
const pendingEntityPromises = new Map();

/**
 * Retrieves the stored Sochiot access token from memory or localStorage.
 */
export const getStoredSochiotToken = () => {
  if (inMemoryToken) return inMemoryToken;
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(SOCHIOT_TOKEN_KEY);
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  }
  return null;
};

/**
 * Clears cached Sochiot credentials and hierarchy data.
 */
export const clearSochiotCache = () => {
  inMemoryToken = null;
  cachedUserHierarchy = null;
  pendingTokenPromise = null;
  pendingHierarchyPromise = null;
  entityHierarchyCache.clear();
  pendingEntityPromises.clear();
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SOCHIOT_TOKEN_KEY);
  }
};

/**
 * Fetches and stores the Sochiot Access-token from http://localhost:3001/api/v1/auth/Access-token.
 * Deduplicates in-flight calls so multiple callers await the same promise.
 */
export const fetchSochiotAccessToken = async (forceRefresh = false) => {
  if (!forceRefresh) {
    const existing = getStoredSochiotToken();
    if (existing) return existing;
  }

  // Deduplicate ongoing network requests
  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = (async () => {
    try {
      const bmsToken = getAuthToken();
      const headers = {
        'Accept': 'application/json',
        ...(bmsToken ? { 'Authorization': `Bearer ${bmsToken}` } : {})
      };

      let res = null;
      try {
        res = await fetch(getApiUrl(AUTH_ENDPOINTS.SOCHIOT_ACCESS_TOKEN), { headers });
      } catch (e) {
        res = await fetch(`http://localhost:3001${AUTH_ENDPOINTS.SOCHIOT_ACCESS_TOKEN}`, { headers });
      }

      if (res && res.ok) {
        const json = await res.json();
        const token = json?.data?.token || json?.token || (typeof json?.data === 'string' ? json.data : null);
        if (token) {
          inMemoryToken = token;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(SOCHIOT_TOKEN_KEY, token);
          }
          return token;
        }
      }
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to obtain Sochiot platform access token');
      console.warn('[SochiotLocationService] Access token notice:', parsed.message);
    } finally {
      pendingTokenPromise = null;
    }
    return getStoredSochiotToken();
  })();

  return pendingTokenPromise;
};

/**
 * Returns authorization headers for Sochiot platform calls.
 */
const getSochiotHeaders = async () => {
  let token = getStoredSochiotToken();
  if (!token) {
    token = await fetchSochiotAccessToken();
  }
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Calls GET /auth-engine/user/me
 * Returns: { userZoneLocationVO, preferredZoneNodeType, preferredZoneNodeId, ... }
 * Caches result in memory and deduplicates simultaneous requests across components.
 */
export const fetchUserLocationHierarchy = async (forceRefresh = false) => {
  if (!forceRefresh && cachedUserHierarchy) {
    return cachedUserHierarchy;
  }

  if (pendingHierarchyPromise) {
    return pendingHierarchyPromise;
  }

  pendingHierarchyPromise = (async () => {
    try {
      const headers = await getSochiotHeaders();
      const base = EXTERNAL_URLS.authEngine ? EXTERNAL_URLS.authEngine.replace(/\/+$/, '') : 'https://app.sochiot.com/api/auth-engine';
      const url = `${base}/user/me`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const payload = data?.data || data;
        cachedUserHierarchy = payload;
        return payload;
      }
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to fetch user location hierarchy from Sochiot');
      console.warn('[SochiotLocationService] fetchUserLocationHierarchy notice:', parsed.message);
    } finally {
      pendingHierarchyPromise = null;
    }
    return cachedUserHierarchy;
  })();

  return pendingHierarchyPromise;
};

/**
 * Calls GET /config-engine/entity/{NODE_TYPE}/{NODE_ID}
 * e.g. /config-engine/entity/ZONE/30 or /config-engine/entity/ROOT/0
 * Returns: { locationVOS: [ { id, name, gatewayVOList: [...], orphanDeviceVOList: [...] } ] }
 */
export const fetchEntityHierarchy = async (nodeType = 'ROOT', nodeId = 0, forceRefresh = false) => {
  const cleanNodeType = !nodeId || nodeId === 0 || nodeId === '0' ? 'ROOT' : (nodeType || 'ROOT').toUpperCase();
  const cleanNodeId = !nodeId ? 0 : nodeId;
  const cacheKey = `${cleanNodeType}_${cleanNodeId}`;

  if (!forceRefresh && entityHierarchyCache.has(cacheKey)) {
    return entityHierarchyCache.get(cacheKey);
  }

  if (pendingEntityPromises.has(cacheKey)) {
    return pendingEntityPromises.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const headers = await getSochiotHeaders();
      const base = EXTERNAL_URLS.configEngine ? EXTERNAL_URLS.configEngine.replace(/\/+$/, '') : 'https://app.sochiot.com/api/config-engine';
      const endpoint = CONFIG_ENDPOINTS.ENTITY_HIERARCHY(cleanNodeType, cleanNodeId);
      const url = `${base}${endpoint.replace('/config-engine', '')}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const payload = data?.data || data;
        entityHierarchyCache.set(cacheKey, payload);
        return payload;
      }
    } catch (err) {
      const parsed = parseApiError(err, `Failed to fetch entity hierarchy for ${nodeType}/${nodeId}`);
      console.warn('[SochiotLocationService] fetchEntityHierarchy notice:', parsed.message);
    } finally {
      pendingEntityPromises.delete(cacheKey);
    }
    return entityHierarchyCache.get(cacheKey) || null;
  })();

  pendingEntityPromises.set(cacheKey, promise);
  return promise;
};

export default {
  fetchSochiotAccessToken,
  getStoredSochiotToken,
  fetchUserLocationHierarchy,
  fetchEntityHierarchy,
  clearSochiotCache
};
