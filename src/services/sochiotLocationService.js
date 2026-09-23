/**
 * Sochiot Location & Entity API Service
 * Interacts with the Sochiot IoT platform using the Access-Token obtained from
 * the backend auth/Access-token endpoint.
 * 
 * Inspired by ismartaccess-frontend-v2 architecture:
 * - Centralized endpoints from apiEndpoints.js
 * - In-flight promise deduplication & memory caching
 * - Standardized error handling via parseApiError
 */
import { getApiUrl, EXTERNAL_URLS } from '../utils/apiConfig';
import { getAuthToken, isTokenExpiringSoon } from '../utils/cookieUtils';
import { AUTH_ENDPOINTS, CONFIG_ENDPOINTS } from '../constants/apiEndpoints';
import { parseApiError } from '../utils/errorHandler';
import apiClient from './apiClient';

const SOCHIOT_TOKEN_KEY = 'Sochiot-accesstoken';

// In-memory singletons for request deduplication and caching
let inMemoryToken = null;
let cachedUserHierarchy = null;
let pendingTokenPromise = null;
let pendingHierarchyPromise = null;
const entityHierarchyCache = new Map();
const pendingEntityPromises = new Map();
const deviceDetailsCache = new Map();
const pendingDevicePromises = new Map();

/**
 * Sanitizes a token by stripping quotes and Bearer prefix.
 */
export const cleanToken = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const unquoted = trimmed.replace(/^["']|["']$/g, '');
  const stripped = unquoted.replace(/^Bearer\s+/i, '').trim();
  return stripped || null;
};

/**
 * Retrieves the stored Sochiot access token from memory or localStorage.
 * Checks for token validity / upcoming expiry (< 60s) before returning.
 */
export const getStoredSochiotToken = () => {
  let token = inMemoryToken;
  if (!token && typeof localStorage !== 'undefined') {
    token = localStorage.getItem(SOCHIOT_TOKEN_KEY);
  }
  const cleaned = cleanToken(token);
  if (cleaned) {
    if (!isTokenExpiringSoon(cleaned, 60)) {
      inMemoryToken = cleaned;
      return cleaned;
    }
    // Expired or expiring within 60s -> purge
    inMemoryToken = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SOCHIOT_TOKEN_KEY);
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
  deviceDetailsCache.clear();
  pendingDevicePromises.clear();
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SOCHIOT_TOKEN_KEY);
  }
};

/**
 * Fetches and stores the Sochiot Access-token from http://localhost:3001/api/v1/auth/Access-token.
 * Uses apiClient.get to ensure BMS authentication headers and credentials flow correctly.
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
      const res = await apiClient.get('/auth/Access-token');
      const rawToken = res?.data?.token || res?.token || (typeof res?.data === 'string' ? res.data : null);
      const token = cleanToken(rawToken);
      if (token) {
        inMemoryToken = token;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(SOCHIOT_TOKEN_KEY, token);
        }
        try {
          const { store } = await import('../store/store.js');
          const { setSochiotAccessToken } = await import('../store/authSlice.js');
          if (store?.dispatch && setSochiotAccessToken) {
            store.dispatch(setSochiotAccessToken(token));
          }
        } catch (e) {}
        return token;
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
export const getSochiotHeaders = async () => {
  let token = getStoredSochiotToken();
  if (!token) {
    token = await fetchSochiotAccessToken();
  }
  const cleanTok = cleanToken(token);
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(cleanTok ? { 'Authorization': `Bearer ${cleanTok}` } : {})
  };
};

/**
 * Executes a fetch to external Sochiot platform API.
 * Automatically injects the clean Sochiot Bearer token.
 * If Sochiot responds with 401 Unauthorized or 400 Malformed Token, automatically
 * flushes the token cache, fetches a new Sochiot access token, and retries the request once.
 */
export const fetchWithSochiotAuth = async (url, options = {}, retryCount = 0) => {
  let token = getStoredSochiotToken();
  if (!token) {
    token = await fetchSochiotAccessToken();
  }

  const cleanTok = cleanToken(token);
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(cleanTok ? { 'Authorization': `Bearer ${cleanTok}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // If 401 Unauthorized or 400 Bad Request with "Malformed Token"
  if ((response.status === 401 || response.status === 400) && retryCount === 0) {
    let isTokenError = response.status === 401;
    if (response.status === 400) {
      try {
        const clone = response.clone();
        const errJson = await clone.json();
        const msg = (errJson?.message || errJson?.error || JSON.stringify(errJson)).toLowerCase();
        if (msg.includes('token') || msg.includes('jwt') || msg.includes('auth')) {
          isTokenError = true;
        }
      } catch (e) {}
    }

    if (isTokenError) {
      console.warn(`[SochiotLocationService] Sochiot token rejected (${response.status}) at ${url}. Refreshing token and retrying...`);
      clearSochiotCache();
      const freshToken = await fetchSochiotAccessToken(true);
      if (freshToken) {
        return fetchWithSochiotAuth(url, options, retryCount + 1);
      }
    }
  }

  return response;
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
      const base = EXTERNAL_URLS.authEngine ? EXTERNAL_URLS.authEngine.replace(/\/+$/, '') : 'https://app.sochiot.com/api/auth-engine';
      const url = `${base}/user/me`;

      const res = await fetchWithSochiotAuth(url);
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
      const base = EXTERNAL_URLS.configEngine ? EXTERNAL_URLS.configEngine.replace(/\/+$/, '') : 'https://app.sochiot.com/api/config-engine';
      const endpoint = CONFIG_ENDPOINTS.ENTITY_HIERARCHY(cleanNodeType, cleanNodeId);
      const url = `${base}${endpoint.replace('/config-engine', '')}`;

      const res = await fetchWithSochiotAuth(url);
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

/**
 * Calls GET /config-engine/device/{deviceId}
 * Returns the full device configuration payload including modules, eventFieldVOS, and moduleFieldMappingVOS.
 */
export const fetchDeviceDetails = async (deviceId, forceRefresh = false) => {
  if (!deviceId) return null;
  const cleanDeviceId = String(deviceId).trim();
  const cacheKey = `DEV_${cleanDeviceId}`;

  if (!forceRefresh && deviceDetailsCache.has(cacheKey)) {
    return deviceDetailsCache.get(cacheKey);
  }

  if (pendingDevicePromises.has(cacheKey)) {
    return pendingDevicePromises.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const base = EXTERNAL_URLS.configEngine ? EXTERNAL_URLS.configEngine.replace(/\/+$/, '') : 'https://app.sochiot.com/api/config-engine';
      const endpoint = CONFIG_ENDPOINTS.DEVICE_DETAILS ? CONFIG_ENDPOINTS.DEVICE_DETAILS(cleanDeviceId) : `/config-engine/device/${cleanDeviceId}`;
      const url = `${base}${endpoint.replace('/config-engine', '')}`;

      const res = await fetchWithSochiotAuth(url);
      if (res.ok) {
        const data = await res.json();
        const payload = data?.data || data;
        deviceDetailsCache.set(cacheKey, payload);
        return payload;
      } else {
        deviceDetailsCache.set(cacheKey, null);
        return null;
      }
    } catch (err) {
      deviceDetailsCache.set(cacheKey, null);
      const parsed = parseApiError(err, `Failed to fetch device details for device ID ${deviceId}`);
      console.warn('[SochiotLocationService] fetchDeviceDetails notice:', parsed.message);
    } finally {
      pendingDevicePromises.delete(cacheKey);
    }
    return deviceDetailsCache.get(cacheKey) || null;
  })();

  pendingDevicePromises.set(cacheKey, promise);
  return promise;
};

/**
 * Calls https://app.sochiot.com/api/config-engine/device/get/byDeviceIds
 * Accepts an array of Sochiot hardware device IDs, fetches their full configuration (including modules and event fields),
 * caches each device in deviceDetailsCache, and returns the list of device configuration objects.
 */
export const fetchDevicesByDeviceIds = async (deviceIds, forceRefresh = false) => {
  if (!Array.isArray(deviceIds) || deviceIds.length === 0) return [];
  const cleanIds = Array.from(new Set(
    deviceIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0 && id !== 101)
  ));
  if (cleanIds.length === 0) return [];

  const cachedList = [];
  const missingIds = [];
  cleanIds.forEach(id => {
    const key = `DEV_${id}`;
    if (!forceRefresh && deviceDetailsCache.has(key) && deviceDetailsCache.get(key)) {
      cachedList.push(deviceDetailsCache.get(key));
    } else {
      missingIds.push(id);
    }
  });

  if (missingIds.length === 0) {
    return cachedList;
  }

  try {
    const base = EXTERNAL_URLS.configEngine ? EXTERNAL_URLS.configEngine.replace(/\/+$/, '') : 'https://app.sochiot.com/api/config-engine';
    const endpoint = CONFIG_ENDPOINTS.DEVICES_BY_IDS || '/config-engine/device/get/byDeviceIds';
    const url = `${base}${endpoint.replace('/config-engine', '')}`;

    let data = null;

    // Primary: POST with payload { "ids": [...] } as per Sochiot API
    try {
      const resPost = await fetchWithSochiotAuth(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: missingIds })
      });
      if (resPost.ok) {
        const json = await resPost.json();
        data = json?.list || json?.data || json;
      } else {
        // Fallback: POST with raw array [...]
        const resArray = await fetchWithSochiotAuth(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(missingIds)
        });
        if (resArray.ok) {
          const json = await resArray.json();
          data = json?.list || json?.data || json;
        }
      }
    } catch (pe) {
      console.warn('[SochiotLocationService] POST byDeviceIds notice:', pe.message);
    }

    const deviceList = Array.isArray(data) ? data : (data?.list || data?.devices || (data ? [data] : []));

    // Cache the devices
    deviceList.forEach(dev => {
      if (dev && dev.id) {
        deviceDetailsCache.set(`DEV_${dev.id}`, dev);
      }
    });

    return [...cachedList, ...deviceList];
  } catch (err) {
    const parsed = parseApiError(err, 'Failed to fetch devices by IDs');
    console.warn('[SochiotLocationService] fetchDevicesByDeviceIds error:', parsed.message);
    return cachedList;
  }
};

/**
 * Normalizes device configuration response from /config-engine/device/{deviceId}
 * Extracts all modules, event fields (eventFieldVOS), and setting fields (moduleFieldMappingVOS)
 * into a clean structure ready for module and event selection UI.
 */
export const extractDeviceModulesAndFields = (raw) => {
  if (!raw) return { device: null, modules: [] };
  const deviceData = raw?.data || raw;

  const device = {
    id: deviceData.id,
    uuid: deviceData.uuid,
    name: deviceData.name,
    hardwareId: deviceData.hardwareId,
    locationId: deviceData.locationId,
    locationName: deviceData.locationName,
    status: deviceData.mode?.name || 'UNKNOWN',
    icon: deviceData.icon,
    version: deviceData.version,
    organizationId: deviceData.organizationId,
    parent: deviceData.parent ? {
      id: deviceData.parent.id,
      name: deviceData.parent.name,
      hardwareId: deviceData.parent.hardwareId,
      gatewayUuid: deviceData.parent.gatewayUuid,
      type: deviceData.parent.gatewayType?.name
    } : null,
    template: deviceData.deviceTemplateVO ? {
      id: deviceData.deviceTemplateVO.id,
      name: deviceData.deviceTemplateVO.name
    } : null
  };

  const rawModules = Array.isArray(deviceData.modules) ? deviceData.modules : [];
  const modules = rawModules.map((m) => {
    const mTemplate = m.moduleTemplateVO || {};
    const mType = mTemplate.moduleTypeVO || {};
    const rawType = mType.displayName || mType.name || mTemplate.moduleSubType || '';
    const cleanType = rawType?.trim();
    const isGeneralOrOther = cleanType && ['general', 'other'].includes(cleanType.toLowerCase());
    const typeLabel = isGeneralOrOther ? '' : cleanType;

    // Extract Event Fields (from instance eventFieldVOS or template eventFieldVOs)
    const rawEvents = m.eventFieldVOS || mTemplate.eventFieldVOs || [];
    const eventFields = rawEvents.map((e) => ({
      id: e.id,
      fieldName: e.fieldName,
      displayName: e.displayName || e.fieldName,
      dataType: e.dataType?.name || e.dataType || 'INTEGER',
      unit: e.unit || null,
      multiplier: e.multiplier ?? 1.0,
      required: !!e.required,
      fieldType: 'EVENT'
    }));

    // Extract Setting Fields (from moduleFieldMappingVOS)
    const rawMappings = Array.isArray(m.moduleFieldMappingVOS) ? m.moduleFieldMappingVOS : [];
    const settingFields = rawMappings.map((s) => {
      const sf = s.settingFieldVO || {};
      return {
        mappingId: s.moduleFieldMappingId,
        id: sf.id,
        fieldName: sf.fieldName,
        displayName: sf.displayName || sf.fieldName,
        currentValue: s.currentValue ?? sf.defaultValue ?? '',
        defaultValue: sf.defaultValue ?? '',
        dataType: sf.dataType?.name || sf.dataType || 'TEXT_SHORT',
        unit: sf.unit || null,
        multiplier: sf.multiplier ?? 1.0,
        supportedValues: Array.isArray(sf.supportedValues) ? sf.supportedValues : [],
        command: !!sf.command,
        fieldType: 'SETTING'
      };
    });

    const allFields = [...eventFields, ...settingFields];
    const rawModuleName = m.name || String(m.moduleNumber || m.id);
    const cleanModuleName = rawModuleName.replace(/\s*\((general|other)\)/gi, '').replace(/\b(general|other)\b/gi, '').trim() || rawModuleName;

    return {
      id: m.id,
      name: cleanModuleName,
      moduleNumber: m.moduleNumber,
      typeName: typeLabel,
      label: typeLabel ? `${cleanModuleName} (${typeLabel})` : cleanModuleName,
      eventFields,
      settingFields,
      allFields
    };
  });

  return { device, modules };
};

export default {
  fetchSochiotAccessToken,
  getStoredSochiotToken,
  fetchUserLocationHierarchy,
  fetchEntityHierarchy,
  fetchDeviceDetails,
  fetchDevicesByDeviceIds,
  extractDeviceModulesAndFields,
  clearSochiotCache
};
