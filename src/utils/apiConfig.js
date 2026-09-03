/**
 * Centralized API & Environment Configuration
 * Environment variables (import.meta.env) are the single source of truth.
 */

const RAW_BACKEND = import.meta.env.VITE_BACKEND_API_URL || '/api/v1';
const BACKEND_BASE = RAW_BACKEND.replace(/\/+$/, '');

/**
 * Resolves full API endpoint URL avoiding duplicate /v1 prefixes
 */
export const getApiUrl = (endpoint = '') => {
  if (!endpoint) return BACKEND_BASE;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Avoid duplicate /v1 if BACKEND_BASE ends with /v1
  if (BACKEND_BASE.endsWith('/v1') && cleanEndpoint.startsWith('/v1/')) {
    cleanEndpoint = cleanEndpoint.substring(3);
  } else if (BACKEND_BASE.endsWith('/v1') && cleanEndpoint === '/v1') {
    cleanEndpoint = '';
  }

  // Avoid duplicate /api/v1 if BACKEND_BASE ends with /api/v1
  if (BACKEND_BASE.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1/')) {
    cleanEndpoint = cleanEndpoint.substring(7);
  } else if (BACKEND_BASE.endsWith('/api/v1') && cleanEndpoint === '/api/v1') {
    cleanEndpoint = '';
  }

  return `${BACKEND_BASE}${cleanEndpoint}`;
};

export const AUTH_ENDPOINTS = {
  login: getApiUrl('/auth/login'),
  refresh: getApiUrl('/auth/refresh'),
  logout: getApiUrl('/auth/logout'),
  me: getApiUrl('/auth/me')
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
