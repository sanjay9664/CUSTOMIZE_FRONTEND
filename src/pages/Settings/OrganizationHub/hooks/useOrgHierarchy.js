import { useState, useEffect, useCallback, useMemo } from 'react';
import { getApiUrl } from '../../../../utils/apiConfig';
import { getAuthToken } from '../../../../utils/cookieUtils';

export const API_BASE_URL = getApiUrl();

export const getAuthHeaders = () => {
  const token = getAuthToken() || '';
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

export const useOrgHierarchy = ({ showToast, setLoading, storeSites, fetchStoreSites, selectedSiteFilter }) => {
  // Data States
  const [companies, setCompanies] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [sites, setSites] = useState(() => (storeSites && storeSites.length > 0 ? storeSites : []));
  const [buildings, setBuildings] = useState([]);
  const [assets, setAssets] = useState([]);

  // Filter States
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');
  const [selectedBuildingSiteId, setSelectedBuildingSiteId] = useState('ALL');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState('ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState('ALL');
  const [selectedAssetTypeFilter, setSelectedAssetTypeFilter] = useState('ALL');

  // Modals & Form States
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '', address: '' });

  const [showCompanyTenantsModal, setShowCompanyTenantsModal] = useState(false);
  const [companyTenantsList, setCompanyTenantsList] = useState([]);
  const [selectedCompanyForTenants, setSelectedCompanyForTenants] = useState(null);

  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [tenantForm, setTenantForm] = useState({
    companyId: '', name: '', serverUrl: '', orgType: 'Company', description: '', email: '', phone: '', sochiotOrgId: '', subscription: 'BASIC', address: ''
  });

  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedTenantForFeatures, setSelectedTenantForFeatures] = useState(null);
  const [featuresForm, setFeaturesForm] = useState({ alarm: true, reports: true, dpr: true, telemetry: true });

  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedTenantForSub, setSelectedTenantForSub] = useState(null);
  const [subForm, setSubForm] = useState({ subscription: 'BASIC', subscriptionPeriod: 'ANNUALLY', licenseValidity: '' });

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({
    tenantId: '', name: '', region: '', timezone: 'Asia/Kolkata', country: 'India', description: ''
  });

  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [areaForm, setAreaForm] = useState({ tenantId: '', zoneId: '', name: '', description: '' });

  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingForm, setBuildingForm] = useState({
    name: '', code: '', totalFloors: 1, description: '', isActive: true, displayOrder: 0, siteId: ''
  });

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    name: '', assetType: 'BUILDING', parentAssetId: '', isChildAsset: false, description: '', siteId: 7
  });

  // Active Entity Helpers
  const activeCompanies = useMemo(() => {
    return normalizeList(companies, 'companies').filter(c => c && c.status !== 'INACTIVE' && !c.deletedAt);
  }, [companies]);

  const activeTenants = useMemo(() => {
    return normalizeList(tenants, 'tenants').filter(t => t && t.status !== 'INACTIVE' && !t.deletedAt);
  }, [tenants]);

  const activeZones = useMemo(() => {
    return normalizeList(zones, 'zones').filter(z => z && z.status !== 'INACTIVE' && !z.deletedAt);
  }, [zones]);

  const activeAreas = useMemo(() => {
    return normalizeList(areas, 'areas').filter(a => a && a.status !== 'INACTIVE' && !a.deletedAt);
  }, [areas]);

  const activeSites = useMemo(() => {
    return normalizeList(sites, 'sites').filter(s => s && s.status !== 'INACTIVE' && s.status !== 'DISABLED' && s.isActive !== false && !s.deletedAt);
  }, [sites]);

  const activeBuildings = useMemo(() => {
    return normalizeList(buildings, 'buildings').filter(b => b && b.isActive !== false && !b.deletedAt);
  }, [buildings]);

  const activeAssets = useMemo(() => {
    return normalizeList(assets, 'assets').filter(a => a && a.status !== 'INACTIVE' && !a.deletedAt);
  }, [assets]);

  // Sync sites with global Site Store and real-time events
  useEffect(() => {
    if (storeSites && Array.isArray(storeSites) && storeSites.length > 0) {
      setSites(storeSites);
    }
  }, [storeSites]);

  useEffect(() => {
    const handleSitesUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSites(e.detail);
      }
    };
    const handleSiteCreated = (e) => {
      if (e.detail && e.detail.id) {
        setSites(prev => {
          if (prev.some(s => String(s.id) === String(e.detail.id))) return prev;
          return [e.detail, ...prev];
        });
      }
    };
    window.addEventListener('bms_sites_updated', handleSitesUpdated);
    window.addEventListener('bms_site_created', handleSiteCreated);
    return () => {
      window.removeEventListener('bms_sites_updated', handleSitesUpdated);
      window.removeEventListener('bms_site_created', handleSiteCreated);
    };
  }, []);

  // Fetch Companies
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/companies`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setCompanies(normalizeList(json, 'companies'));
      }
    } catch (err) {
      console.warn('Companies fetch err:', err);
    }
  }, []);

  // Fetch Tenants
  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tenants`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setTenants(normalizeList(json, 'tenants'));
      }
    } catch (err) {
      console.warn('Tenants fetch err:', err);
    }
  }, []);

  // Fetch Zones
  const fetchZones = useCallback(async (tenantFilterArg) => {
    try {
      const targetFilter = tenantFilterArg !== undefined ? tenantFilterArg : selectedTenantFilter;
      const url = targetFilter && targetFilter !== 'ALL'
        ? `${API_BASE_URL}/zones?tenantId=${targetFilter}`
        : `${API_BASE_URL}/zones`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setZones(normalizeList(json, 'zones'));
      }
    } catch (err) {
      console.warn('Zones fetch err:', err);
    }
  }, [selectedTenantFilter]);

  // Fetch Tenant Areas
  const fetchAreas = useCallback(async (zoneFilterArg, tenantFilterArg) => {
    try {
      const zFilter = zoneFilterArg !== undefined ? zoneFilterArg : selectedZoneFilter;
      const tFilter = tenantFilterArg !== undefined ? tenantFilterArg : selectedTenantFilter;
      let url = `${API_BASE_URL}/areas`;
      const query = [];
      if (zFilter && zFilter !== 'ALL') query.push(`zoneId=${zFilter}`);
      if (tFilter && tFilter !== 'ALL') query.push(`tenantId=${tFilter}`);
      if (query.length) url += `?${query.join('&')}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setAreas(normalizeList(json, 'areas'));
      }
    } catch (err) {
      console.warn('Areas fetch err:', err);
    }
  }, [selectedZoneFilter, selectedTenantFilter]);

  // Fetch Sites
  const fetchSites = useCallback(async () => {
    try {
      if (typeof fetchStoreSites === 'function') {
        const list = await fetchStoreSites();
        if (list && list.length > 0) {
          setSites(list);
          return list;
        }
      }
      const res = await fetch(`${API_BASE_URL}/sites`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const norm = normalizeList(json, 'sites');
        setSites(norm);
        return norm;
      }
    } catch (err) {
      console.warn('Sites fetch err:', err);
    }
  }, [fetchStoreSites]);

  // Fetch Buildings
  const fetchBuildings = useCallback(async () => {
    setBuildings([]);
  }, []);

  // Fetch Assets
  const fetchAssets = useCallback(async (siteIdParam = null) => {
    try {
      const activeSiteId = siteIdParam !== null ? siteIdParam : selectedSiteFilter;
      const url = activeSiteId && activeSiteId !== 'ALL'
        ? `${API_BASE_URL}/sites/${activeSiteId}/assets`
        : `${API_BASE_URL}/assets`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Assets could not be loaded');
      const listResponse = await response.json();
      let list = normalizeList(listResponse, 'assets');
      const userAssets = JSON.parse(localStorage.getItem('tb_created_assets') || '[]');
      if (userAssets.length > 0) {
        const existingIds = new Set(list.map(a => String(a.id)));
        const newAdditions = userAssets.filter(a => !existingIds.has(String(a.id)));
        list = [...newAdditions, ...list.map(a => {
          const userEdit = userAssets.find(u => String(u.id) === String(a.id));
          return userEdit ? { ...a, ...userEdit } : a;
        })];
      }
      setAssets(list);
    } catch (err) {
      console.warn('Assets fetch err:', err);
    }
  }, [selectedSiteFilter]);

  // Company Actions
  const handleOpenCreateCompany = () => {
    setEditingCompany(null);
    setCompanyForm({ name: '', email: '', phone: '', address: '' });
    setShowCompanyModal(true);
  };

  const handleOpenEditCompany = (cmp) => {
    setEditingCompany(cmp);
    setCompanyForm({ name: cmp.name || '', email: cmp.email || '', phone: cmp.phone || '', address: cmp.address || '' });
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingCompany ? `${API_BASE_URL}/companies/${editingCompany.id}` : `${API_BASE_URL}/companies`;
      const method = editingCompany ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(companyForm)
      });

      if (res.ok) {
        showToast('success', `Company ${editingCompany ? 'updated' : 'created'} successfully!`);
        setShowCompanyModal(false);
        fetchCompanies();
      } else {
        const err = await res.json();
        showToast('danger', err.error?.message || err.message || 'Error saving company');
      }
    } catch (err) {
      showToast('danger', err.message || 'Network error saving company');
    }
    setLoading(false);
  };

  const handleDeleteCompany = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete company "${name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/companies/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', `Company "${name}" deleted.`);
        fetchCompanies();
      } else {
        showToast('danger', 'Failed to delete company');
      }
    } catch (err) {
      showToast('danger', 'Error deleting company');
    }
    setLoading(false);
  };

  const handleViewCompanyTenants = async (cmp) => {
    setSelectedCompanyForTenants(cmp);
    try {
      const res = await fetch(`${API_BASE_URL}/companies/${cmp.id}/tenants`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setCompanyTenantsList(normalizeList(json, 'tenants'));
      } else {
        setCompanyTenantsList(activeTenants.filter(t => t.companyId === cmp.id));
      }
    } catch (e) {
      setCompanyTenantsList(activeTenants.filter(t => t.companyId === cmp.id));
    }
    setShowCompanyTenantsModal(true);
  };

  // Tenant Actions
  const handleOpenCreateTenant = () => {
    setEditingTenant(null);
    setTenantForm({
      companyId: activeCompanies.length ? activeCompanies[0].id : '',
      name: '', serverUrl: '', orgType: 'Company', description: '', email: '', phone: '', sochiotOrgId: '', subscription: 'BASIC', address: ''
    });
    setShowTenantModal(true);
  };

  const handleOpenEditTenant = (tn) => {
    setEditingTenant(tn);
    setTenantForm({
      companyId: tn.companyId || '',
      name: tn.name || '',
      serverUrl: tn.serverUrl || '',
      orgType: tn.orgType || 'Company',
      description: tn.description || '',
      email: tn.email || '',
      phone: tn.phone || '',
      sochiotOrgId: tn.sochiotOrgId || '',
      subscription: tn.subscription || 'BASIC',
      address: tn.address || ''
    });
    setShowTenantModal(true);
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingTenant ? `${API_BASE_URL}/tenants/${editingTenant.id}` : `${API_BASE_URL}/tenants`;
      const method = editingTenant ? 'PATCH' : 'POST';

      const payload = {
        companyId: tenantForm.companyId || (activeCompanies.length ? String(activeCompanies[0].id) : ''),
        name: tenantForm.name?.trim(),
        email: tenantForm.email?.trim(),
        subscription: tenantForm.subscription || 'BASIC'
      };

      if (tenantForm.phone?.trim()) payload.phone = tenantForm.phone.trim();
      if (tenantForm.address?.trim()) payload.address = tenantForm.address.trim();

      if (tenantForm.sochiotOrgId !== undefined && tenantForm.sochiotOrgId !== null && String(tenantForm.sochiotOrgId).trim() !== '') {
        const parsedOrgId = parseInt(tenantForm.sochiotOrgId, 10);
        if (!isNaN(parsedOrgId)) {
          payload.sochiotOrgId = parsedOrgId;
        }
      }

      if (!payload.companyId) {
        showToast('danger', 'Please select a valid Parent Company.');
        setLoading(false);
        return;
      }

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('success', `Organization ${editingTenant ? 'updated' : 'created'} successfully!`);
        setShowTenantModal(false);
        fetchTenants();
      } else {
        const err = await res.json().catch(() => ({}));
        const errMsg = typeof err?.error === 'string'
          ? err.error
          : err?.error?.message || err?.message || (Array.isArray(err?.errors) ? err.errors.map(item => item.message).join(', ') : 'Error saving organization');
        showToast('danger', errMsg);
      }
    } catch (err) {
      showToast('danger', err?.message || 'Network error saving organization');
    }
    setLoading(false);
  };

  const handleReactivateTenant = async (tn) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/${tn.id}/reactivate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', `Organization "${tn.name}" reactivated.`);
        fetchTenants();
      } else {
        showToast('danger', 'Failed to reactivate organization');
      }
    } catch (err) {
      showToast('danger', 'Error reactivating organization');
    }
    setLoading(false);
  };

  const handleDeleteTenant = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate organization "${name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tenants/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('success', `Organization "${name}" deactivated.`);
        fetchTenants();
      } else {
        showToast('danger', 'Failed to deactivate organization');
      }
    } catch (err) {
      showToast('danger', 'Error deactivating organization');
    }
    setLoading(false);
  };

  // Zone Actions
  const handleOpenCreateZone = () => {
    setEditingZone(null);
    setZoneForm({ tenantId: activeTenants.length ? activeTenants[0].id : '', name: '', region: '', timezone: 'Asia/Kolkata', country: 'India', description: '' });
    setShowZoneModal(true);
  };

  const handleOpenEditZone = (z) => {
    setEditingZone(z);
    setZoneForm({ tenantId: z.tenantId || '', name: z.name || '', region: z.region || '', timezone: z.timezone || 'Asia/Kolkata', country: z.country || 'India', description: z.description || '' });
    setShowZoneModal(true);
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tenantId = zoneForm.tenantId || (activeTenants.length ? activeTenants[0].id : '');
      if (!tenantId) {
        showToast('danger', 'Please select a valid Organization (Tenant).');
        setLoading(false);
        return;
      }

      const url = editingZone
        ? `${API_BASE_URL}/zones/${editingZone.id}`
        : `${API_BASE_URL}/tenants/${tenantId}/zones`;
      const method = editingZone ? 'PATCH' : 'POST';

      const payload = {
        tenantId,
        name: zoneForm.name?.trim(),
        region: zoneForm.region?.trim() || 'General',
        timezone: zoneForm.timezone || 'Asia/Kolkata',
        country: zoneForm.country || 'India'
      };
      if (zoneForm.description?.trim()) payload.description = zoneForm.description.trim();

      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });

      if (res.ok) {
        showToast('success', `Zone ${editingZone ? 'updated' : 'created'} successfully!`);
        setShowZoneModal(false);
        fetchZones();
      } else {
        const err = await res.json().catch(() => ({}));
        const errMsg = typeof err?.error === 'string'
          ? err.error
          : err?.error?.message || err?.message || (Array.isArray(err?.errors) ? err.errors.map(item => item.message).join(', ') : 'Error saving zone');
        showToast('danger', errMsg);
      }
    } catch (err) {
      showToast('danger', err?.message || 'Network error saving zone');
    }
    setLoading(false);
  };

  const handleReactivateZone = async (z) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/zones/${z.id}/reactivate`, { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        showToast('success', `Zone "${z.name}" reactivated.`);
        fetchZones();
      }
    } catch (err) {
      showToast('danger', 'Error reactivating zone');
    }
    setLoading(false);
  };

  const handleDeleteZone = async (id, name) => {
    if (!window.confirm(`Deactivate zone "${name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/zones/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        showToast('success', `Zone "${name}" deactivated.`);
        fetchZones();
      }
    } catch (err) {
      showToast('danger', 'Error deactivating zone');
    }
    setLoading(false);
  };

  // Area Actions
  const handleOpenCreateArea = () => {
    setEditingArea(null);
    setAreaForm({ tenantId: activeTenants.length ? activeTenants[0].id : '', zoneId: activeZones.length ? activeZones[0].id : '', name: '', description: '' });
    setShowAreaModal(true);
  };

  const handleOpenEditArea = (a) => {
    setEditingArea(a);
    setAreaForm({ tenantId: a.tenantId || '', zoneId: a.zoneId || '', name: a.name || '', description: a.description || '' });
    setShowAreaModal(true);
  };

  const handleSaveArea = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tenantId = areaForm.tenantId || (activeTenants.length ? activeTenants[0].id : '');
      const zoneId = areaForm.zoneId || (activeZones.length ? activeZones[0].id : '');

      if (!zoneId) {
        showToast('danger', 'Please select a valid Zone.');
        setLoading(false);
        return;
      }
      if (!tenantId) {
        showToast('danger', 'Please select a valid Organization.');
        setLoading(false);
        return;
      }

      const url = editingArea
        ? `${API_BASE_URL}/areas/${editingArea.id}`
        : `${API_BASE_URL}/tenants/${tenantId}/zones/${zoneId}/areas`;
      const method = editingArea ? 'PATCH' : 'POST';

      const payload = {
        tenantId,
        zoneId,
        name: areaForm.name?.trim(),
      };
      if (areaForm.description?.trim()) payload.description = areaForm.description.trim();

      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });

      if (res.ok) {
        showToast('success', `Area ${editingArea ? 'updated' : 'created'} successfully!`);
        setShowAreaModal(false);
        fetchAreas();
      } else {
        const err = await res.json().catch(() => ({}));
        const errMsg = typeof err?.error === 'string'
          ? err.error
          : err?.error?.message || err?.message || (Array.isArray(err?.errors) ? err.errors.map(item => item.message).join(', ') : 'Error saving area');
        showToast('danger', errMsg);
      }
    } catch (err) {
      showToast('danger', err?.message || 'Network error saving area');
    }
    setLoading(false);
  };

  const handleDeleteArea = async (id, name) => {
    if (!window.confirm(`Deactivate area "${name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/areas/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        showToast('success', `Area "${name}" deactivated.`);
        fetchAreas();
      }
    } catch (err) {
      showToast('danger', 'Error deactivating area');
    }
    setLoading(false);
  };

  // Building Actions
  const handleOpenCreateBuilding = () => {
    setEditingBuilding(null);
    setBuildingForm({ name: '', code: '', totalFloors: 1, description: '', isActive: true, displayOrder: 0, siteId: activeSites.length ? activeSites[0].id : '' });
    setShowBuildingModal(true);
  };

  const handleOpenEditBuilding = (b) => {
    setEditingBuilding(b);
    setBuildingForm({ name: b.name || '', code: b.code || '', totalFloors: b.totalFloors || 1, description: b.description || '', isActive: b.isActive !== false, displayOrder: b.displayOrder || 0, siteId: b.siteId || '' });
    setShowBuildingModal(true);
  };

  const handleSaveBuilding = async (e) => {
    e.preventDefault();
    if (!buildingForm.siteId) return showToast('danger', 'Parent Site is required');
    setLoading(true);
    try {
      const siteId = buildingForm.siteId;
      const url = editingBuilding ? `${API_BASE_URL}/sites/${siteId}/buildings/${editingBuilding.id}` : `${API_BASE_URL}/sites/${siteId}/buildings`;
      const method = editingBuilding ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(buildingForm) });
      if (res.ok) {
        showToast('success', `Building ${editingBuilding ? 'updated' : 'created'} successfully!`);
        setShowBuildingModal(false);
        fetchBuildings();
      } else {
        const err = await res.json();
        showToast('danger', err.error?.message || err.message || 'Error saving building');
      }
    } catch (err) {
      showToast('danger', 'Error saving building');
    }
    setLoading(false);
  };

  const handleDeleteBuilding = async (b) => {
    if (!window.confirm(`Delete building "${b.name}"?`)) return;
    setLoading(true);
    try {
      const siteId = b.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/buildings/${b.id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        showToast('success', `Building "${b.name}" deleted.`);
        fetchBuildings();
      } else {
        showToast('danger', 'Error deleting building');
      }
    } catch (err) {
      showToast('danger', 'Error deleting building');
    }
    setLoading(false);
  };

  // Asset Actions
  const handleOpenCreateAsset = () => {
    setEditingAsset(null);
    setAssetForm({ name: '', assetType: 'BUILDING', parentAssetId: '', isChildAsset: false, description: '', siteId: activeSites.length ? activeSites[0].id : 7 });
    setShowAssetModal(true);
  };

  const handleOpenEditAsset = (a) => {
    const hasParent = !!(a.parentAssetId || a.parentId);
    setEditingAsset(a);
    setAssetForm({
      name: a.name || '',
      assetType: a.assetType || 'BUILDING',
      parentAssetId: a.parentAssetId || a.parentId || '',
      isChildAsset: hasParent,
      description: a.description || '',
      siteId: a.siteId || (activeSites.length ? activeSites[0].id : 7)
    });
    setShowAssetModal(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const siteId = assetForm.siteId || 7;
      const url = editingAsset ? `${API_BASE_URL}/sites/${siteId}/assets/${editingAsset.id}` : `${API_BASE_URL}/sites/${siteId}/assets`;
      const method = editingAsset ? 'PATCH' : 'POST';
      const payload = { name: assetForm.name, assetType: assetForm.assetType, description: assetForm.description };
      if (assetForm.isChildAsset && assetForm.parentAssetId) {
        const pId = assetForm.parentAssetId;
        payload.parentId = String(pId);
        payload.parentAssetId = isNaN(Number(pId)) ? pId : Number(pId);
      } else {
        payload.parentId = null;
        payload.parentAssetId = null;
      }
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });

      if (res.ok) {
        showToast('success', `Asset ${editingAsset ? 'updated' : 'created'} successfully!`);
        setShowAssetModal(false);
        fetchAssets();
      } else {
        const err = await res.json();
        showToast('danger', err.error?.message || err.message || 'Error saving asset');
      }
    } catch (err) {
      showToast('danger', 'Error saving asset');
    }
    setLoading(false);
  };

  const handleDeleteAsset = async (a) => {
    if (!window.confirm(`Delete asset "${a.name}"?`)) return;
    setLoading(true);
    try {
      const siteId = a.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/assets/${a.id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        showToast('success', `Asset "${a.name}" deleted.`);
        fetchAssets();
      } else {
        showToast('danger', 'Error deleting asset');
      }
    } catch (err) {
      showToast('danger', 'Error deleting asset');
    }
    setLoading(false);
  };

  // Features & Subscription actions
  const handleOpenFeaturesModal = (tn) => {
    setSelectedTenantForFeatures(tn);
    setShowFeaturesModal(true);
  };

  const handleSaveFeatures = (e) => {
    e.preventDefault();
    showToast('success', 'Tenant feature flags updated.');
    setShowFeaturesModal(false);
  };

  const handleOpenSubModal = (tn) => {
    setSelectedTenantForSub(tn);
    setShowSubModal(true);
  };

  const handleSaveSub = (e) => {
    e.preventDefault();
    showToast('success', 'Tenant subscription updated.');
    setShowSubModal(false);
  };

  return {
    companies, setCompanies,
    tenants, setTenants,
    zones, setZones,
    areas, setAreas,
    sites, setSites,
    buildings, setBuildings,
    assets, setAssets,
    activeCompanies, activeTenants, activeZones, activeAreas, activeSites, activeBuildings, activeAssets,
    selectedTenantFilter, setSelectedTenantFilter,
    selectedZoneFilter, setSelectedZoneFilter,
    selectedBuildingSiteId, setSelectedBuildingSiteId,
    selectedBuildingFilter, setSelectedBuildingFilter,
    selectedAreaFilter, setSelectedAreaFilter,
    selectedAssetFilter, setSelectedAssetFilter,
    selectedAssetTypeFilter, setSelectedAssetTypeFilter,
    showCompanyModal, setShowCompanyModal, editingCompany, setEditingCompany, companyForm, setCompanyForm,
    handleOpenCreateCompany, handleOpenEditCompany, handleSaveCompany, handleDeleteCompany,
    showCompanyTenantsModal, setShowCompanyTenantsModal, companyTenantsList, setCompanyTenantsList, selectedCompanyForTenants, setSelectedCompanyForTenants, handleViewCompanyTenants,
    showTenantModal, setShowTenantModal, editingTenant, setEditingTenant, tenantForm, setTenantForm,
    handleOpenCreateTenant, handleOpenEditTenant, handleSaveTenant, handleReactivateTenant, handleDeleteTenant,
    showFeaturesModal, setShowFeaturesModal, selectedTenantForFeatures, setSelectedTenantForFeatures, featuresForm, setFeaturesForm, handleOpenFeaturesModal, handleSaveFeatures,
    showSubModal, setShowSubModal, selectedTenantForSub, setSelectedTenantForSub, subForm, setSubForm, handleOpenSubModal, handleSaveSub,
    showZoneModal, setShowZoneModal, editingZone, setEditingZone, zoneForm, setZoneForm,
    handleOpenCreateZone, handleOpenEditZone, handleSaveZone, handleReactivateZone, handleDeleteZone,
    showAreaModal, setShowAreaModal, editingArea, setEditingArea, areaForm, setAreaForm,
    handleOpenCreateArea, handleOpenEditArea, handleSaveArea, handleDeleteArea,
    showBuildingModal, setShowBuildingModal, editingBuilding, setEditingBuilding, buildingForm, setBuildingForm,
    handleOpenCreateBuilding, handleOpenEditBuilding, handleSaveBuilding, handleDeleteBuilding,
    showAssetModal, setShowAssetModal, editingAsset, setEditingAsset, assetForm, setAssetForm,
    handleOpenCreateAsset, handleOpenEditAsset, handleSaveAsset, handleDeleteAsset,
    fetchCompanies, fetchTenants, fetchZones, fetchAreas, fetchSites, fetchBuildings, fetchAssets
  };
};

export default useOrgHierarchy;
