import apiClient, { normalizeList } from './apiClient';

/**
 * Standardized BMS API Service Layer
 * Uses apiClient object methods (get, post, put, patch, delete) matching backend routes in app.ts & openapi.yaml
 */

export const bmsService = {
  // Auth Services
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),

  // Companies Service
  getCompanies: (params = {}) => apiClient.get('/companies', params),
  createCompany: (data) => apiClient.post('/companies', data),
  updateCompany: (id, data) => apiClient.patch(`/companies/${id}`, data),
  deleteCompany: (id) => apiClient.delete(`/companies/${id}`),

  // Tenants / Organizations Service
  getTenants: (params = {}) => apiClient.get('/tenants', params),
  createTenant: (data) => apiClient.post('/tenants', data),
  updateTenant: (id, data) => apiClient.patch(`/tenants/${id}`, data),
  deleteTenant: (id) => apiClient.delete(`/tenants/${id}`),

  // Zones Service
  getZones: (params = {}) => apiClient.get('/zones', params),
  createZone: (data) => apiClient.post('/zones', data),
  updateZone: (id, data) => apiClient.patch(`/zones/${id}`, data),
  deleteZone: (id) => apiClient.delete(`/zones/${id}`),

  // Tenant Areas Service
  getAreas: (params = {}) => apiClient.get('/areas', params),
  createArea: (data) => apiClient.post('/areas', data),
  updateArea: (id, data) => apiClient.patch(`/areas/${id}`, data),
  deleteArea: (id) => apiClient.delete(`/areas/${id}`),

  // Sites Service
  getSites: (params = {}) => apiClient.get('/sites', params),
  createSite: (data) => apiClient.post('/sites', data),
  updateSite: (id, data) => apiClient.patch(`/sites/${id}`, data),
  deleteSite: (id) => apiClient.delete(`/sites/${id}`),

  // Buildings are now managed as assets in the backend
  getBuildings: async () => [],
  getSiteBuildings: async () => [],
  /*
  getBuildings: async (siteId, params = {}) => {
    if (siteId) return apiClient.get(`/sites/${siteId}/buildings`, params);
    const sites = normalizeList(await apiClient.get('/sites'), 'sites');
    const results = await Promise.all(
      sites.map(async (site) => {
        const response = await apiClient.get(`/sites/${site.id}/buildings`, params);
        return normalizeList(response, 'buildings').map((building) => ({ ...building, siteId: site.id, siteName: site.name }));
      })
    );
    return results.flat();
  },
  getSiteBuildings: (siteId, params = {}) => apiClient.get(`/sites/${siteId}/buildings`, params),
  createBuilding: (siteId, data) => apiClient.post(`/sites/${siteId}/buildings`, data),
  updateBuilding: (siteId, buildingId, data) => apiClient.patch(`/sites/${siteId}/buildings/${buildingId}`, data),
  deleteBuilding: (siteId, buildingId) => apiClient.delete(`/sites/${siteId}/buildings/${buildingId}`),
  */

  // Assets Service
  getAssets: async (siteId, params = {}) => {
    if (siteId) return apiClient.get(`/sites/${siteId}/assets`, params);
    return apiClient.get('/assets', params);
  },
  getAssetDetails: (id) => apiClient.get(`/assets/${id}`),
  getAssetHierarchy: (siteId, params = {}) => apiClient.get(`/sites/${siteId}/assets/hierarchy`, params),
  getAssetStats: (siteId) => apiClient.get(`/sites/${siteId}/assets/stats`),
  getAssetDevices: (id) => apiClient.get(`/assets/${id}/devices`),
  getAssetTree: (id) => apiClient.get(`/assets/${id}/tree`),
  createAsset: (data) => apiClient.post('/assets', data),
  createSiteAsset: (siteId, data) => apiClient.post(`/sites/${siteId}/assets`, data),
  updateAsset: (id, data) => apiClient.patch(`/assets/${id}`, data),
  deleteAsset: (id) => apiClient.delete(`/assets/${id}`),

  // Devices Service
  getDevices: (params = {}) => apiClient.get('/devices', params),
  getSiteDevices: (siteId, params = {}) => apiClient.get(`/sites/${siteId}/devices`, params),
  getDeviceSummary: (siteId) => apiClient.get(`/sites/${siteId}/devices/summary`),
  getDeviceDetails: (siteId, deviceId) => apiClient.get(`/sites/${siteId}/devices/${deviceId}`),
  createSiteDevice: (siteId, data) => apiClient.post(`/sites/${siteId}/devices`, data),
  createDeviceFromTemplate: (siteId, data) => apiClient.post(`/sites/${siteId}/devices/from-template`, data),
  getSiteDeviceTemplates: (siteId) => apiClient.get(`/sites/${siteId}/devices/templates`),
  updateSiteDevice: (siteId, deviceId, data) => apiClient.patch(`/sites/${siteId}/devices/${deviceId}`, data),
  deleteSiteDevice: (siteId, deviceId) => apiClient.delete(`/sites/${siteId}/devices/${deviceId}`),
  syncSiteDevice: (siteId, deviceId) => apiClient.post(`/sites/${siteId}/devices/${deviceId}/sync`),
  getDeviceLiveTelemetry: (siteId, deviceId) => apiClient.get(`/sites/${siteId}/devices/${deviceId}/live`),
  getDeviceLatestEvents: (siteId, deviceId) => apiClient.get(`/sites/${siteId}/devices/${deviceId}/events/latest`),

  // Widgets Service
  getWidgets: (params = {}) => apiClient.get('/widgets', params),

  // Rules Service (Device Specific)
  getDeviceRules: (siteId, deviceId, params = {}) => apiClient.get(`/sites/${siteId}/devices/${deviceId}/rules`, params),

  // Commands Service
  getCommands: (siteId, deviceId, params = {}) => apiClient.get(`/sites/${siteId}/devices/${deviceId}/commands`, params),

  // Reports & Telemetry Service
  getReports: (params = {}) => apiClient.get('/reports', params),

  // Sochiot Platform Token Service
  getSochiotAccessToken: () => apiClient.get('/auth/Access-token')
};

export const fetchAndStoreSochiotAccessToken = async () => {
  try {
    const res = await bmsService.getSochiotAccessToken();
    const token = res?.data?.token || res?.token || (typeof res?.data === 'string' ? res.data : null);
    if (token) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('Sochiot-accesstoken', token);
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
    console.warn('Failed to fetch and store Sochiot-accesstoken:', err);
  }
  return null;
};

export default bmsService;
