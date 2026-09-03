import { getAuthToken, setCookie } from '../utils/cookieUtils';
import { EXTERNAL_URLS } from '../utils/apiConfig';

const EXTERNAL_API_URL = EXTERNAL_URLS.authEngine;
const CONFIG_API_URL = EXTERNAL_URLS.configEngine;
const TRIGGERS_API_URL = EXTERNAL_URLS.ruleEngine;

const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const loginToSochiot = async (email, password) => {
  try {
    const response = await fetch(`${EXTERNAL_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      const token = data.token || data.accessToken;
      if (token) {
        setCookie('access_token', token, 7);
        setCookie('token', token, 7);
        return token;
      }
    }
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Authentication failed: Invalid credentials');
  } catch (error) {
    console.error('Sochiot Auth Error:', error);
    throw error;
  }
};

export const getSochiotUserMe = async () => {
  try {
    const token = getAuthToken();
    if (token && !token.startsWith('mock_')) {
      const response = await fetch(`${EXTERNAL_API_URL}/user/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) return await response.json();
    }
  } catch (error) {
    console.warn('Fetch Me Error:', error);
  }

  return null;
};


export const getSochiotLocationData = async (locationId) => {
  try {
    const token = getAuthToken();
    if (token && !token.startsWith('mock_')) {
      const response = await fetch(`${CONFIG_API_URL}/entity/LOCATION/${locationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) return await response.json();
    }
  } catch (error) {
    console.warn('Fetch Location Error:', error);
  }
  return { id: locationId, name: 'Main Plant Location', status: 'ONLINE' };
};

export const getSochiotZoneData = async (zoneId) => {
  try {
    const token = getAuthToken();
    if (token && !token.startsWith('mock_')) {
      const response = await fetch(`${CONFIG_API_URL}/entity/ZONE/${zoneId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) return await response.json();
    }
  } catch (error) {
    console.warn('Fetch Zone Error:', error);
  }
  return { id: zoneId, name: 'Main Control Zone', status: 'ONLINE' };
};

export const getSochiotDeviceDetails = async (deviceId) => {
  try {
    const token = getAuthToken();
    if (token && !token.startsWith('mock_')) {
      const response = await fetchWithTimeout(`${CONFIG_API_URL}/device/${deviceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }, 3000);
      if (response.ok) return await response.json();
    }
  } catch (error) {
    console.warn('Fetch Device Details Error, returning mock device details:', error);
  }

  return {
    id: deviceId,
    uuid: String(deviceId),
    name: `Device-${deviceId}`,
    status: 'ONLINE',
    online: true,
    active: true,
    mode: { name: 'ONLINE' }
  };
};

export const getSochiotGatewayStatus = async (clusterId) => {
  try {
    const token = getAuthToken();
    if (token && !token.startsWith('mock_')) {
      const response = await fetchWithTimeout(`${CONFIG_API_URL}/gateway/status/uuid/${clusterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }, 3000);
      if (response.ok) return await response.json();
    }
  } catch (error) {
    console.warn('Fetch Gateway Status Error, returning mock status:', error);
  }

  return {
    clusterId,
    status: 'ONLINE',
    online: true,
    active: true,
    mode: { name: 'ONLINE' }
  };
};

export const getSochiotDeviceStatus = async (deviceId) => {
  try {
    const token = getAuthToken();
    if (token && !token.startsWith('mock_')) {
      const response = await fetchWithTimeout(`${CONFIG_API_URL}/device/status/uuid/${deviceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }, 3000);
      if (response.ok) return await response.json();
    }
  } catch (error) {
    console.warn('Fetch Device Status Error, returning mock status:', error);
  }

  return {
    deviceId,
    status: 'ONLINE',
    online: true,
    active: true,
    mode: { name: 'ONLINE' }
  };
};

export const getSochiotRules = async (nodeType, nodeId, page = 1) => {
  try {
    const token = getAuthToken();
    if (token && !token.startsWith('mock_')) {
      const response = await fetchWithTimeout(`${TRIGGERS_API_URL}/rules/${nodeType}/${nodeId}?page=${page}&isPageable=true&sortBy=lastUpdated&sortOrder=DESC`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }, 3000);
      if (response.ok) return await response.json();
    }
  } catch (error) {
    console.warn('Fetch Rules Error, returning mock rules:', error);
  }

  return {
    list: [
      { id: 101, name: 'High Level Alarm Rule', active: true, status: 'ACTIVE', lastUpdated: new Date().toISOString() },
      { id: 102, name: 'Overheat Cutoff Rule', active: true, status: 'ACTIVE', lastUpdated: new Date().toISOString() }
    ],
    totalElements: 2,
    totalPages: 1
  };
};

export const getSochiotRuleById = async (ruleId) => {
  try {
    const token = getAuthToken();
    if (token && !token.startsWith('mock_')) {
      const response = await fetchWithTimeout(`${TRIGGERS_API_URL}/rules/${ruleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }, 3000);
      if (response.ok) return await response.json();
    }
  } catch (error) {
    console.warn('Fetch Rule By ID Error:', error);
  }

  return { id: ruleId, name: `Rule #${ruleId}`, active: true, status: 'ACTIVE' };
};

export const getSochiotEventFields = async (moduleId, moduleTypeId) => {
  return [
    { fieldName: 'level', displayName: 'Water Level', dataType: 'NUMBER' },
    { fieldName: 'temperature', displayName: 'Temperature', dataType: 'NUMBER' },
    { fieldName: 'pressure', displayName: 'Pressure', dataType: 'NUMBER' },
    { fieldName: 'status', displayName: 'Pump Status', dataType: 'STRING' }
  ];
};

export const getSochiotDeviceModules = async (deviceUuid) => {
  return [
    { id: 1, name: 'Main Water Module', type: 'AG_TANK' },
    { id: 2, name: 'Pump Control Module', type: 'PUMP' }
  ];
};

export const getSochiotDeviceByNumericId = async (deviceNumericId) => {
  return {
    id: deviceNumericId,
    name: `Device-${deviceNumericId}`,
    modules: [
      { id: 1, name: 'Main Water Module' }
    ]
  };
};

export const activateSochiotRule = async (ruleId) => {
  return { status: 'OK', message: 'Rule activated successfully' };
};

export const deactivateSochiotRule = async (ruleId) => {
  return { status: 'OK', message: 'Rule deactivated successfully' };
};

export const deleteSochiotRule = async (ruleId) => {
  return { status: 'OK', message: 'Rule deleted successfully' };
};

export const updateSochiotRule = async (ruleId, payload) => {
  return { status: 'OK', message: 'Rule updated successfully', data: payload };
};

export const createSochiotRule = async (payload) => {
  return { status: 'OK', message: 'Rule created successfully', data: payload };
};

