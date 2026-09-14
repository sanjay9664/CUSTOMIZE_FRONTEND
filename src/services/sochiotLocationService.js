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
const deviceDetailsCache = new Map();
const pendingDevicePromises = new Map();

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
  deviceDetailsCache.clear();
  pendingDevicePromises.clear();
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
      const headers = await getSochiotHeaders();
      const base = EXTERNAL_URLS.configEngine ? EXTERNAL_URLS.configEngine.replace(/\/+$/, '') : 'https://app.sochiot.com/api/config-engine';
      const endpoint = CONFIG_ENDPOINTS.DEVICE_DETAILS ? CONFIG_ENDPOINTS.DEVICE_DETAILS(cleanDeviceId) : `/config-engine/device/${cleanDeviceId}`;
      const url = `${base}${endpoint.replace('/config-engine', '')}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const payload = data?.data || data;
        deviceDetailsCache.set(cacheKey, payload);
        return payload;
      }
    } catch (err) {
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
  extractDeviceModulesAndFields,
  clearSochiotCache
};
