/**
 * Centralized API & Environment Configuration
 * Environment variables (import.meta.env) are the single source of truth.
 */

const RAW_BACKEND = import.meta.env.VITE_BACKEND_API_URL || '/api';
const BACKEND_BASE = RAW_BACKEND.replace(/\/+$/, '');

/**
 * Resolves full API endpoint URL using .env as the single source of truth
 */
export const getApiUrl = (endpoint = '') => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If BACKEND_BASE ends with /v1 and endpoint starts with /v1, avoid duplication
  if (BACKEND_BASE.endsWith('/v1') && cleanEndpoint.startsWith('/v1')) {
    return `${BACKEND_BASE}${cleanEndpoint.replace(/^\/v1/, '')}`;
  }

  return `${BACKEND_BASE}${cleanEndpoint}`;
};

export const AUTH_ENDPOINTS = {
  login: getApiUrl('/auth/login'),
  refresh: getApiUrl('/auth/refresh'),
  logout: getApiUrl('/auth/logout'),
  oauth: getApiUrl('/auth/oauth'),
  me: getApiUrl('/user/me')
};

export const EXTERNAL_URLS = {
  authEngine: import.meta.env.VITE_EXTERNAL_API_URL || '/sochiot-auth',
  configEngine: import.meta.env.VITE_CONFIG_API_URL || '/sochiot-config',
  ruleEngine: import.meta.env.VITE_RULE_ENGINE_API || '/sochiot-triggers'
};

export default {
  getApiUrl,
  AUTH_ENDPOINTS,
  EXTERNAL_URLS
};
