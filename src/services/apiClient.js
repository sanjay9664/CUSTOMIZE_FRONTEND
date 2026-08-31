/**
 * Unified API Client for BMS Platform
 * Handles authentication, cookies, JSON parsing, and response normalization
 */
import { getCookie } from '../utils/cookieUtils';

const API_BASE_URL = '/api';

export const getAuthHeaders = () => {
  const token = getCookie('access_token') ||
    getCookie('token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('sochiot_token') ||
    localStorage.getItem('auth_token') || '';

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

export const apiClient = {
  async get(endpoint, customHeaders = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { ...getAuthHeaders(), ...customHeaders }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || err.error?.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  },

  async post(endpoint, data = {}, customHeaders = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), ...customHeaders },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || err.error?.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  },

  async patch(endpoint, data = {}, customHeaders = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), ...customHeaders },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || err.error?.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  },

  async delete(endpoint, customHeaders = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders(), ...customHeaders }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || err.error?.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  }
};

export default apiClient;
