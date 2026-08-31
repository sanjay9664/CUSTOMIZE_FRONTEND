/**
 * Organization Management Domain Services
 * Companies, Tenants, Zones, Areas, Buildings, Assets, Devices, Commands, Telemetry
 */
import apiClient, { normalizeList } from './apiClient';

export const organizationService = {
  // Companies
  async getCompanies() {
    const res = await apiClient.get('/companies');
    return normalizeList(res, 'companies');
  },
  async createCompany(data) {
    return apiClient.post('/companies', data);
  },
  async updateCompany(id, data) {
    return apiClient.patch(`/companies/${id}`, data);
  },
  async deleteCompany(id) {
    return apiClient.delete(`/companies/${id}`);
  },
  async getCompanyTenants(companyId) {
    const res = await apiClient.get(`/companies/${companyId}/tenants`);
    return normalizeList(res, 'tenants');
  },

  // Tenants (Organizations)
  async getTenants() {
    const res = await apiClient.get('/tenants');
    return normalizeList(res, 'tenants');
  },
  async createTenant(data) {
    return apiClient.post('/tenants', data);
  },
  async updateTenant(id, data) {
    return apiClient.patch(`/tenants/${id}`, data);
  },
  async deleteTenant(id) {
    return apiClient.delete(`/tenants/${id}`);
  },
  async reactivateTenant(id) {
    return apiClient.post(`/tenants/${id}/reactivate`);
  },
  async updateTenantFeatures(id, features) {
    return apiClient.patch(`/tenants/${id}/features`, { features });
  },
  async updateTenantSubscription(id, subscription, subscriptionPeriod) {
    return apiClient.patch(`/tenants/${id}/subscription`, { subscription, subscriptionPeriod });
  },

  // Zones
  async getZones(tenantId) {
    const endpoint = tenantId ? `/zones?tenantId=${tenantId}` : '/zones';
    const res = await apiClient.get(endpoint);
    return normalizeList(res, 'zones');
  },
  async createZone(data) {
    return apiClient.post('/zones', data);
  },
  async updateZone(id, data) {
    return apiClient.patch(`/zones/${id}`, data);
  },
  async deleteZone(id) {
    return apiClient.delete(`/zones/${id}`);
  },
  async reactivateZone(id) {
    return apiClient.post(`/zones/${id}/reactivate`);
  },

  // Areas
  async getAreas(zoneId, tenantId) {
    let query = [];
    if (zoneId) query.push(`zoneId=${zoneId}`);
    if (tenantId) query.push(`tenantId=${tenantId}`);
    const qs = query.length > 0 ? `?${query.join('&')}` : '';
    const res = await apiClient.get(`/areas${qs}`);
    return normalizeList(res, 'areas');
  },
  async createArea(data) {
    return apiClient.post('/areas', data);
  },
  async updateArea(id, data) {
    return apiClient.patch(`/areas/${id}`, data);
  },
  async deleteArea(id) {
    return apiClient.delete(`/areas/${id}`);
  },

  // Sites & Buildings
  async getSites() {
    const res = await apiClient.get('/sites');
    return normalizeList(res, 'sites');
  },
  async getBuildings(siteId) {
    if (siteId && siteId !== 'ALL') {
      const res = await apiClient.get(`/sites/${siteId}/buildings`);
      return normalizeList(res, 'buildings');
    }
    const sites = await this.getSites();
    const active = sites.filter(s => s.status !== 'INACTIVE' && s.status !== 'DISABLED' && !s.deletedAt);
    let all = [];
    for (const s of active) {
      try {
        const bRes = await apiClient.get(`/sites/${s.id}/buildings`);
        const list = normalizeList(bRes, 'buildings').map(b => ({ ...b, siteId: s.id, siteName: s.name }));
        all.push(...list);
      } catch (e) {}
    }
    return all;
  },
  async createBuilding(siteId, data) {
    return apiClient.post(`/sites/${siteId}/buildings`, data);
  },
  async updateBuilding(siteId, buildingId, data) {
    return apiClient.patch(`/sites/${siteId}/buildings/${buildingId}`, data);
  },
  async deleteBuilding(siteId, buildingId) {
    return apiClient.delete(`/sites/${siteId}/buildings/${buildingId}`);
  },

  // Assets & Devices
  async getAssets() {
    const res = await apiClient.get('/assets');
    return normalizeList(res, 'assets');
  },
  async getDevices() {
    const res = await apiClient.get('/devices');
    return normalizeList(res, 'devices');
  },

  // Telemetry & Logs
  async getTelemetryLogs(siteId = 1) {
    const res = await apiClient.get(`/sites/${siteId}/telemetry/resync-logs`);
    return normalizeList(res, 'logs');
  },
  async triggerTelemetryResync(siteId, startDate, endDate) {
    return apiClient.post(`/sites/${siteId}/telemetry/resync`, { startDate, endDate });
  }
};

export default organizationService;
