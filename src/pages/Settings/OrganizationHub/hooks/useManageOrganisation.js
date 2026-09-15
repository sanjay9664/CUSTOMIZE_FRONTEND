import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCookie, getAuthToken } from '../../../../utils/cookieUtils';
import { getApiUrl } from '../../../../utils/apiConfig';
import { Building2, MapPin, Cpu, Building, Sliders, Grid, Shield, Terminal, FileText } from 'lucide-react';
import { useSiteStore } from '../../../../context/SiteContext';
import { fetchAndStoreSochiotAccessToken } from '../../../../services/bmsService';
import { fetchDevicesByDeviceIds, extractDeviceModulesAndFields } from '../../../../services/sochiotLocationService';

export const API_BASE_URL = getApiUrl();

export const getAuthHeaders = () => {
  const token = getAuthToken() || '';

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

export const useManageOrganisation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sites: storeSites, activeSites: storeActiveSites, fetchSites: fetchStoreSites } = useSiteStore();

  // Role-Based Access Control (RBAC) Security Check
  const userRole = (localStorage.getItem('userRole') || getCookie('userRole') || 'USER').toUpperCase();
  const isAdmin = ['SUPERADMIN', 'ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN'].includes(userRole);

  // Tab State
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (['company', 'tenant', 'zone', 'area', 'site', 'building', 'asset', 'device', 'widgets', 'rules', 'commands', 'telemetry', 'report', 'alarm'].includes(tabParam)) return tabParam;
    return 'company';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['company', 'tenant', 'zone', 'area', 'site', 'building', 'asset', 'device', 'widgets', 'rules', 'commands', 'telemetry', 'report', 'alarm'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab('company');
    }
  }, [location.search]);

  // Data States
  const [companies, setCompanies] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [sites, setSites] = useState(() => (storeSites && storeSites.length > 0 ? storeSites : []));
  const [buildings, setBuildings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [alarmsList, setAlarmsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isInitialMount = useRef(true);

  // Purge any stale mock storage that causes phantom non-DB devices (e.g. jkanjd, frfr)
  useEffect(() => {
    try {
      localStorage.removeItem('bms_registered_devices');
      localStorage.removeItem('bms_device_edits');
    } catch (e) {}
  }, []);

  // Active Entity Helpers
  const activeCompanies = normalizeList(companies, 'companies').filter(c => c && c.status !== 'INACTIVE' && !c.deletedAt);
  const activeTenants = normalizeList(tenants, 'tenants').filter(t => t && t.status !== 'INACTIVE' && !t.deletedAt);
  const activeZones = normalizeList(zones, 'zones').filter(z => z && z.status !== 'INACTIVE' && !z.deletedAt);
  const activeAreas = normalizeList(areas, 'areas').filter(a => a && a.status !== 'INACTIVE' && !a.deletedAt);
  const activeSites = useMemo(() => {
    return normalizeList(sites, 'sites').filter(s => s && s.status !== 'INACTIVE' && s.status !== 'DISABLED' && s.isActive !== false && !s.deletedAt);
  }, [sites]);
  const activeBuildings = normalizeList(buildings, 'buildings').filter(b => b && b.isActive !== false && !b.deletedAt);
  const activeAssets = normalizeList(assets, 'assets').filter(a => a && a.status !== 'INACTIVE' && !a.deletedAt);
  const rawActiveDevices = normalizeList(devices, 'devices').filter(d => d && d.isActive !== false && d.status !== 'DISABLED');
  const activeDevices = rawActiveDevices;

  // Modals state
  const [showResyncModal, setShowResyncModal] = useState(false);
  const [resyncForm, setResyncForm] = useState({
    siteId: 7,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'DAILY_DPR',
    siteId: 7,
    format: 'PDF',
    title: 'Daily Telemetry & DPR Report'
  });

  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [alarmForm, setAlarmForm] = useState({
    deviceId: 'EM_LIVEWIZE_101',
    fieldKey: 'temperature',
    value: '95.5',
    severity: 'CRITICAL'
  });

  const [selectedBuildingSiteId, setSelectedBuildingSiteId] = useState('ALL');
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingForm, setBuildingForm] = useState({
    name: '', code: '', totalFloors: 1, description: '', isActive: true, displayOrder: 0, siteId: ''
  });

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({ name: '', assetType: 'BUILDING', parentAssetId: '', isChildAsset: false, description: '', siteId: 7 });

  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState({ name: '', category: 'ENERGY_METER', bmsDeviceId: '', serialNumber: '', siteId: 7 });

  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState('ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState('ALL');
  const [selectedAssetTypeFilter, setSelectedAssetTypeFilter] = useState('ALL');
  const [deviceSubTab, setDeviceSubTab] = useState('registration');
  const [showRegisterDeviceModal, setShowRegisterDeviceModal] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [registerForm, setRegisterForm] = useState({
    siteId: '', name: '', sochiotDeviceIds: '', moduleIds: [], sochiotTemplateId: null, category: 'ENERGY_METER', areaId: '', buildingId: '', floorNo: '', roomNo: '', energyGroupId: '', description: '', serialNumber: '', profileId: '', assetId: ''
  });

  const [dynamicTemplateFields, setDynamicTemplateFields] = useState([]);

  const [showLiveModal, setShowLiveModal] = useState(false);
  const [selectedDeviceForLive, setSelectedDeviceForLive] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedDeviceForSettings, setSelectedDeviceForSettings] = useState(null);
  const [deviceSettingsForm, setDeviceSettingsForm] = useState({
    slaveId: 1, baudRate: 9600, parity: 'NONE', pollingIntervalMs: 2000,
    fieldMappings: [
      { field: 'voltage', register: 40001, dataType: 'FLOAT32' },
      { field: 'current', register: 40003, dataType: 'FLOAT32' },
      { field: 'powerKw', register: 40005, dataType: 'FLOAT32' }
    ]
  });

  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [selectedDeviceForThresholds, setSelectedDeviceForThresholds] = useState(null);
  const [thresholdsForm, setThresholdsForm] = useState({
    '3,100F': { warningHigh: 250, criticalHigh: 260, warningLow: 210, criticalLow: 200 },
    '4,0F': { warningHigh: 50, criticalHigh: 65, warningLow: 0, criticalLow: 0 }
  });

  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [selectedDeviceForAudit, setSelectedDeviceForAudit] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const [showRecentEventsModal, setShowRecentEventsModal] = useState(false);
  const [showConfigDevicesModal, setShowConfigDevicesModal] = useState(false);
  const [recentEventsList, setRecentEventsList] = useState([]);

  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedDeviceForRules, setSelectedDeviceForRules] = useState(null);
  const [deviceRules, setDeviceRules] = useState([]);

  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false);
  const [editingDeviceItem, setEditingDeviceItem] = useState(null);
  const [editDeviceForm, setEditDeviceForm] = useState({ name: '', category: 'ENERGY_METER', serialNumber: '' });

  const [showCreateWidgetModal, setShowCreateWidgetModal] = useState(false);
  const [widgetFilterActiveOnly, setWidgetFilterActiveOnly] = useState(false);
  const [selectedDeviceForWidgets, setSelectedDeviceForWidgets] = useState(1);
  const [widgetsList, setWidgetsList] = useState([]);
  const [widgetForm, setWidgetForm] = useState({ displayName: '', widgetType: 'GAUGE', displayOrder: 1, isActive: true });
  const [showEditWidgetModal, setShowEditWidgetModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);

  const [selectedDeviceForRulesTab, setSelectedDeviceForRulesTab] = useState(1);
  const [rulesList, setRulesList] = useState([]);
  const [showRuleDetailsModal, setShowRuleDetailsModal] = useState(false);
  const [inspectingRule, setInspectingRule] = useState(null);
  const [showEditRuleModal, setShowEditRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({ name: '', fieldName: 'voltage', conditionType: 'GREATER_THAN', threshold: 250, enabled: true });

  const [selectedDeviceForCommandsTab, setSelectedDeviceForCommandsTab] = useState(1);
  const [commandsList, setCommandsList] = useState([]);
  const [showSendCommandModal, setShowSendCommandModal] = useState(false);
  const [sendCommandFormData, setSendCommandFormData] = useState({ fieldKey: '', commandValue: '', notes: '' });
  const [showCommandDetailsModal, setShowCommandDetailsModal] = useState(false);
  const [inspectingCommand, setInspectingCommand] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [selectedTenantForFeatures, setSelectedTenantForFeatures] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedTenantForSub, setSelectedTenantForSub] = useState(null);
  const [showCompanyTenantsModal, setShowCompanyTenantsModal] = useState(false);
  const [companyTenantsList, setCompanyTenantsList] = useState([]);
  const [selectedCompanyForTenants, setSelectedCompanyForTenants] = useState(null);

  const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [tenantForm, setTenantForm] = useState({ companyId: '', name: '', serverUrl: '', orgType: 'Company', description: '', email: '', phone: '', sochiotOrgId: '', subscription: 'BASIC', address: '' });
  const [zoneForm, setZoneForm] = useState({ tenantId: '', name: '', region: '', timezone: 'Asia/Kolkata', country: 'India', description: '' });
  const [areaForm, setAreaForm] = useState({ tenantId: '', zoneId: '', name: '', description: '' });
  const [featuresForm, setFeaturesForm] = useState({ alarm: true, reports: true, dpr: true, telemetry: true });
  const [subForm, setSubForm] = useState({ subscription: 'BASIC', subscriptionPeriod: 'ANNUALLY', licenseValidity: '' });

  const showToast = (type, text) => {
    let msgText = 'Operation completed';
    if (typeof text === 'string') {
      msgText = text;
    } else if (text && typeof text === 'object') {
      msgText = text.message || (typeof text.error === 'string' ? text.error : text.error?.message) || JSON.stringify(text);
    } else if (text !== undefined && text !== null) {
      msgText = String(text);
    }
    setMessage({ type, text: msgText });
    setTimeout(() => setMessage(null), 4000);
  };

  // Sync tab with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const siteParam = params.get('siteId');
    if (tabParam && ['company', 'tenant', 'zone', 'area', 'site', 'building', 'asset', 'device', 'widgets', 'rules', 'commands', 'telemetry', 'report', 'alarm'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    if (siteParam) {
      setSelectedBuildingSiteId(siteParam);
    }
  }, [location.search]);

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

  // Fetch Buildings (Commented out: building is now managed as an asset)
  const fetchBuildings = useCallback(async (siteIdArg) => {
    setBuildings([]);
    /*
    try {
      const targetSiteId = siteIdArg !== undefined ? siteIdArg : selectedBuildingSiteId;
      if (targetSiteId && targetSiteId !== 'ALL') {
        const res = await fetch(`${API_BASE_URL}/sites/${targetSiteId}/buildings`, { headers: getAuthHeaders() });
        if (res.ok) {
          const json = await res.json();
          const list = normalizeList(json, 'buildings');
          setBuildings(list.map(b => ({ ...b, siteId: targetSiteId })));
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/sites`, { headers: getAuthHeaders() });
        let siteList = [];
        if (res.ok) {
          const json = await res.json();
          siteList = normalizeList(json, 'sites');
        }
        if (!siteList.length) {
          siteList = [];
        }
        const buildingPromises = siteList.slice(0, 10).map(async (s) => {
          try {
            const bRes = await fetch(`${API_BASE_URL}/sites/${s.id}/buildings`, { headers: getAuthHeaders() });
            if (bRes.ok) {
              const bJson = await bRes.json();
              const list = normalizeList(bJson, 'buildings');
              return list.map(b => ({ ...b, siteId: s.id, siteName: s.name }));
            }
          } catch(e) {}
          return [];
        });
        const results = await Promise.all(buildingPromises);
        setBuildings(results.flat());
      }
    } catch (err) {
      console.warn('Buildings fetch err:', err);
    }
    */
  }, [selectedBuildingSiteId]);

  // Fetch Assets (per OpenAPI: GET /sites/{siteId}/assets or GET /assets)
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

  // Fetch Devices (per OpenAPI: /assets/{id}/devices, /sites/{siteId}/devices, or /devices)
  const fetchDevices = useCallback(async () => {
    try {
      let endpoint = `${API_BASE_URL}/devices`;
      if (selectedAssetFilter && selectedAssetFilter !== 'ALL') {
        endpoint = `${API_BASE_URL}/assets/${selectedAssetFilter}/devices`;
      } else if (selectedSiteFilter && selectedSiteFilter !== 'ALL') {
        endpoint = `${API_BASE_URL}/sites/${selectedSiteFilter}/devices`;
      }

      const res = await fetch(endpoint, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const list = normalizeList(json, 'devices');
        const deletedIds = JSON.parse(localStorage.getItem('bms_deleted_devices') || '[]');
        const finalDevices = list.filter(d => !deletedIds.includes(String(d.id)));
        setDevices(finalDevices);

        // Purge obsolete local mock storage that causes phantom non-DB devices (e.g. jkanjd, frfr)
        try {
          localStorage.removeItem('bms_registered_devices');
          localStorage.removeItem('bms_device_edits');
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Devices fetch err:', err);
    }
  }, [selectedSiteFilter, selectedAssetFilter]);

  // Manual full refresh only. Do not invoke this on mount: loading every
  // hierarchy resource when the user opens one tab creates unnecessary network
  // traffic and duplicate requests. The tab effect below performs lazy loads.
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    try {
      await Promise.allSettled([
        fetchCompanies(),
        fetchTenants(),
        fetchZones(),
        fetchAreas(),
        fetchSites(),
        // fetchBuildings(), // Commented out: building moved to asset-based model
        fetchAssets(),
        fetchDevices()
      ]);
    } catch (err) {
      console.warn('Initial data fetch error:', err);
    } finally {
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }, [fetchCompanies, fetchTenants, fetchZones, fetchAreas, fetchSites, fetchBuildings, fetchAssets, fetchDevices]);

  // Tab switch handler
  const handleTabSelect = (key) => {
    setActiveTab(key);
    const basePath = location.pathname.startsWith('/settings') ? '/settings/manage-organisation' : '/manage-organisation';
    navigate(`${basePath}?tab=${key}`, { replace: true });
  };

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

  // Tenant / Org Actions
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
      }
    } catch (err) {
      showToast('danger', 'Error deleting asset');
    }
    setLoading(false);
  };

  // Device Actions
  const handleOpenEditDevice = async (d) => {
    fetchAndStoreSochiotAccessToken();
    setEditingDeviceItem(d);
    setRegisterStep(1);
    const resolvedSiteId = d.siteId || d.site?.id || d.site_id || (selectedSiteFilter && selectedSiteFilter !== 'ALL' ? String(selectedSiteFilter) : '') || (activeSites && activeSites.length ? String(activeSites[0].id) : '');

    // Set initial baseline from row data so modal opens immediately
    setRegisterForm({
      id: d.id,
      siteId: resolvedSiteId,
      name: d.name || '',
      sochiotDeviceIds: Array.isArray(d.sochiotDeviceIds) ? d.sochiotDeviceIds.join(', ') : (d.sochiotDeviceIds || d.sochiot_device_ids || ''),
      category: d.category || '',
      areaId: d.areaId ? String(d.areaId) : '',
      buildingId: d.buildingId ? String(d.buildingId) : '',
      floorNo: d.floorNo !== null && d.floorNo !== undefined ? String(d.floorNo) : '',
      roomNo: d.roomNo !== null && d.roomNo !== undefined ? String(d.roomNo) : '',
      energyGroupId: d.energyGroupId || '',
      description: d.description || '',
      serialNumber: d.serialNumber || '',
      profileId: d.profileId || '',
      sochiotTemplateId: d.sochiotTemplateId || d.sochiot_template_id || null,
      moduleIds: Array.isArray(d.moduleIds) ? d.moduleIds : (d.moduleId ? [d.moduleId] : []),
      assetId: d.assetId ? String(d.assetId) : ''
    });

    const extractAllDeviceIds = (targetDev, settingsList = []) => {
      const ids = new Set();
      const rawDevIds = targetDev?.sochiotDeviceIds || targetDev?.sochiot_device_ids;
      if (Array.isArray(rawDevIds)) {
        rawDevIds.forEach(id => { const n = parseInt(id, 10); if (!isNaN(n) && n > 0 && n !== 101) ids.add(n); });
      } else if (typeof rawDevIds === 'string' && rawDevIds.trim()) {
        rawDevIds.split(',').forEach(s => { const n = parseInt(s.trim(), 10); if (!isNaN(n) && n > 0 && n !== 101) ids.add(n); });
      } else if (typeof rawDevIds === 'number' && rawDevIds > 0 && rawDevIds !== 101) {
        ids.add(rawDevIds);
      }

      (settingsList || []).forEach(s => {
        if (s?.sochiotDeviceId) {
          const n = parseInt(s.sochiotDeviceId, 10);
          if (!isNaN(n) && n > 0 && n !== 101) ids.add(n);
        }
        if (s?.deviceId && targetDev?.id && String(s.deviceId) !== String(targetDev.id) && String(s.deviceId) !== '101') {
          const n = parseInt(s.deviceId, 10);
          if (!isNaN(n) && n > 0) ids.add(n);
        }
      });

      return Array.from(ids);
    };

    const matchSettingsWithSochiotDevices = (settingsList, sochiotDevicesList, fallbackDevIds = [], currentDev = null) => {
      const normalizedDevices = (sochiotDevicesList || []).map(dev => {
        const extracted = extractDeviceModulesAndFields(dev);
        return {
          raw: dev,
          id: String(dev.id || dev.hardwareId || ''),
          name: dev.name || '',
          modules: extracted.modules || []
        };
      });

      return (settingsList || []).map(s => {
        let matchedDev = null;
        let matchedModule = null;
        let matchedFieldDef = null;

        const sDevName = (s.deviceName || '').trim().toLowerCase();
        const sModName = (s.moduleName || '').trim().toLowerCase();
        const sField = (s.sochiotFieldName || '').trim();
        const sModId = s.moduleId ? String(s.moduleId).trim() : '';

        // 1. Match device:
        // 1a. If explicit sochiotDeviceId
        if (s.sochiotDeviceId) {
          matchedDev = normalizedDevices.find(dev => String(dev.id) === String(s.sochiotDeviceId));
        }

        // 1b. Match by device name (e.g. s.deviceName === "PARM" or "CHANGE")
        if (!matchedDev && sDevName) {
          matchedDev = normalizedDevices.find(dev => dev.name && dev.name.trim().toLowerCase() === sDevName);
        }

        // 1c. Match by event field presence across all devices (e.g. "4,20F")
        if (!matchedDev && sField) {
          for (const dev of normalizedDevices) {
            const foundM = dev.modules.find(m => m.allFields?.some(f => f.fieldName === sField));
            if (foundM) {
              matchedDev = dev;
              matchedModule = foundM;
              matchedFieldDef = foundM.allFields?.find(f => f.fieldName === sField);
              break;
            }
          }
        }

        // 1d. Match by moduleId across all devices
        if (!matchedDev && sModId) {
          for (const dev of normalizedDevices) {
            const foundM = dev.modules.find(m => String(m.id) === sModId);
            if (foundM) {
              matchedDev = dev;
              matchedModule = foundM;
              break;
            }
          }
        }

        // 1e. If single device in list
        if (!matchedDev && normalizedDevices.length === 1) {
          matchedDev = normalizedDevices[0];
        }

        // 2. Match module within device:
        if (matchedDev) {
          if (!matchedModule && sModId) {
            matchedModule = matchedDev.modules.find(m => String(m.id) === sModId);
          }
          if (!matchedModule && sField) {
            matchedModule = matchedDev.modules.find(m => m.allFields?.some(f => f.fieldName === sField));
          }
          if (!matchedModule && sModName) {
            matchedModule = matchedDev.modules.find(m => m.name && m.name.trim().toLowerCase() === sModName);
          }
          if (!matchedModule && matchedDev.modules.length === 1) {
            matchedModule = matchedDev.modules[0];
          }

          if (matchedModule && sField) {
            matchedFieldDef = matchedModule.allFields?.find(f => f.fieldName === sField);
          }
        }

        const isDbFk = s?.deviceId && currentDev?.id && String(s.deviceId) === String(currentDev.id);
        const fallbackId = (!isDbFk && s?.deviceId && String(s.deviceId) !== '101')
          ? String(s.deviceId)
          : (fallbackDevIds.length > 0 ? String(fallbackDevIds[0]) : '');

        const resolvedDevId = matchedDev ? matchedDev.id : (s.sochiotDeviceId ? String(s.sochiotDeviceId) : fallbackId);
        const resolvedDevName = matchedDev?.name || s.deviceName || (matchedDev?.id ? `Device #${matchedDev.id}` : '');
        const resolvedModId = matchedModule ? String(matchedModule.id) : (s.moduleId ? String(s.moduleId) : '');
        const resolvedModName = matchedModule?.name || matchedModule?.label || s.moduleName || (resolvedModId ? `Module #${resolvedModId}` : '');

        return {
          id: s.id,
          deviceId: resolvedDevId,
          deviceName: resolvedDevName,
          moduleId: resolvedModId,
          moduleName: resolvedModName,
          sochiotFieldName: s.sochiotFieldName || '',
          displayName: s.displayName || matchedFieldDef?.displayName || s.sochiotFieldName || '',
          dataType: s.dataType || matchedFieldDef?.dataType || 'INTEGER',
          unit: s.unit || matchedFieldDef?.unit || '',
          warningHigh: s.warningHigh !== undefined && s.warningHigh !== null ? s.warningHigh : '',
          criticalHigh: s.criticalHigh !== undefined && s.criticalHigh !== null ? s.criticalHigh : '',
          warningLow: s.warningLow !== undefined && s.warningLow !== null ? s.warningLow : '',
          criticalLow: s.criticalLow !== undefined && s.criticalLow !== null ? s.criticalLow : '',
          isCommand: Boolean(s.isCommand),
          graphable: s.graphable !== false
        };
      });
    };

    const initialSettings = (Array.isArray(d.template_settings) && d.template_settings.length > 0)
      ? d.template_settings
      : (Array.isArray(d.settings) && d.settings.length > 0)
      ? d.settings
      : (Array.isArray(d.deviceSettings) && d.deviceSettings.length > 0)
      ? d.deviceSettings
      : (Array.isArray(d.templateFields) && d.templateFields.length > 0)
      ? d.templateFields
      : [];

    const initialDevIds = extractAllDeviceIds(d, initialSettings);
    if (initialSettings.length > 0 && typeof setDynamicTemplateFields === 'function') {
      setDynamicTemplateFields(matchSettingsWithSochiotDevices(initialSettings, [], initialDevIds, d));
    } else if (typeof setDynamicTemplateFields === 'function') {
      setDynamicTemplateFields([]);
    }

    setShowRegisterDeviceModal(true);

    // Call GET /sites/{siteId}/devices/{deviceId} to fetch full pre-fed values and settings
    if (resolvedSiteId && d.id) {
      try {
        const getUrl = `${API_BASE_URL}/sites/${resolvedSiteId}/devices/${d.id}`;
        const res = await fetch(getUrl, {
          method: 'GET',
          headers: getAuthHeaders()
        });

        if (res.ok) {
          const json = await res.json();
          const detail = json?.data || json;
          if (detail && (detail.id || detail.name)) {
            setEditingDeviceItem(detail);
            setRegisterForm(prev => ({
              ...prev,
              id: detail.id,
              siteId: String(detail.siteId || resolvedSiteId),
              name: detail.name || prev.name,
              sochiotDeviceIds: Array.isArray(detail.sochiotDeviceIds)
                ? detail.sochiotDeviceIds.join(', ')
                : (detail.sochiotDeviceIds || detail.sochiot_device_ids || prev.sochiotDeviceIds),
              category: detail.category || prev.category,
              areaId: detail.areaId ? String(detail.areaId) : prev.areaId,
              buildingId: detail.buildingId ? String(detail.buildingId) : prev.buildingId,
              floorNo: detail.floorNo !== null && detail.floorNo !== undefined ? String(detail.floorNo) : prev.floorNo,
              roomNo: detail.roomNo !== null && detail.roomNo !== undefined ? String(detail.roomNo) : prev.roomNo,
              energyGroupId: detail.energyGroupId || prev.energyGroupId,
              description: detail.description || prev.description,
              serialNumber: detail.serialNumber || prev.serialNumber,
              profileId: detail.profileId || prev.profileId,
              sochiotTemplateId: detail.sochiotTemplateId || detail.sochiot_template_id || prev.sochiotTemplateId || null,
              moduleIds: Array.isArray(detail.moduleIds) ? detail.moduleIds : prev.moduleIds,
              assetId: detail.assetId ? String(detail.assetId) : prev.assetId
            }));

            let fullSettings = (Array.isArray(detail.settings) && detail.settings.length > 0)
              ? detail.settings
              : (Array.isArray(detail.template_settings) && detail.template_settings.length > 0)
              ? detail.template_settings
              : (Array.isArray(detail.deviceSettings) && detail.deviceSettings.length > 0)
              ? detail.deviceSettings
              : (Array.isArray(detail.templateFields) && detail.templateFields.length > 0)
              ? detail.templateFields
              : [];

            // Fallback: If detail object didn't have settings, fetch from /sites/{siteId}/devices/{deviceId}/settings
            if (fullSettings.length === 0) {
              try {
                const settingsUrl = `${API_BASE_URL}/sites/${resolvedSiteId}/devices/${d.id}/settings`;
                const sRes = await fetch(settingsUrl, {
                  method: 'GET',
                  headers: getAuthHeaders()
                });
                if (sRes.ok) {
                  const sJson = await sRes.json();
                  fullSettings = normalizeList(sJson, 'settings');
                }
              } catch (se) {
                console.warn('Fallback settings fetch error:', se);
              }
            }

            // Fetch Sochiot device and module details using https://app.sochiot.com/api/config-engine/device/get/byDeviceIds
            const allDevIds = extractAllDeviceIds(detail, fullSettings);
            let sochiotDevs = [];
            if (allDevIds.length > 0) {
              try {
                sochiotDevs = await fetchDevicesByDeviceIds(allDevIds);
              } catch (be) {
                console.warn('[useManageOrganisation] fetchDevicesByDeviceIds notice:', be);
              }
            }

            if (fullSettings.length > 0 && typeof setDynamicTemplateFields === 'function') {
              const mappedFields = matchSettingsWithSochiotDevices(fullSettings, sochiotDevs, allDevIds, detail);
              setDynamicTemplateFields(mappedFields);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch device detail:', err);
      }
    }
  };

  const handleOpenRegisterDevice = () => {
    fetchAndStoreSochiotAccessToken();
    setEditingDeviceItem(null);
    setRegisterStep(1);
    const defaultSiteId = (selectedSiteFilter && selectedSiteFilter !== 'ALL')
      ? String(selectedSiteFilter)
      : (activeSites && activeSites.length ? String(activeSites[0].id) : '');
    setRegisterForm({
      id: '',
      siteId: defaultSiteId,
      name: '',
      sochiotDeviceIds: '',
      category: '',
      areaId: '',
      buildingId: '',
      floorNo: '',
      roomNo: '',
      energyGroupId: '',
      description: '',
      serialNumber: '',
      profileId: '',
      assetId: '',
      sochiotTemplateId: null,
      moduleIds: []
    });
    if (typeof setDynamicTemplateFields === 'function') {
      setDynamicTemplateFields([]);
    }
    setShowRegisterDeviceModal(true);
  };

  const handleSaveEditDevice = async (e) => {
    e.preventDefault();
    if (!editingDeviceItem) return;
    setLoading(true);
    try {
      await fetchAndStoreSochiotAccessToken();
      const siteId = editingDeviceItem.siteId || 7;
      const queryParam = siteId ? `?siteId=${siteId}` : '';
      const updateUrl = getApiUrl(`/devices/${editingDeviceItem.id}${queryParam}`);
      const res = await fetch(updateUrl, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editDeviceForm.name,
          category: editDeviceForm.category,
          ...(siteId ? { siteId: Number(siteId) } : {})
        })
      });
      if (res.ok) {
        showToast('success', `Device updated successfully!`);
        setShowEditDeviceModal(false);
        fetchDevices();
      } else {
        const err = await res.json();
        showToast('danger', err.error?.message || err.message || 'Failed to update device');
      }
    } catch (err) {
      showToast('danger', 'Error updating device');
    }
    setLoading(false);
  };

  const handleDeleteDevice = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete device "${name}"?`)) return;
    setLoading(true);
    try {
      const siteId = 7;
      try {
        await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      } catch (e) {
        console.warn('Backend delete notice, removing locally:', e);
      }

      // Persist deleted status
      const deletedIds = JSON.parse(localStorage.getItem('bms_deleted_devices') || '[]');
      if (!deletedIds.includes(String(id))) {
        localStorage.setItem('bms_deleted_devices', JSON.stringify([...deletedIds, String(id)]));
      }

      // Remove from custom registered devices in localStorage
      const customDevices = JSON.parse(localStorage.getItem('bms_registered_devices') || '[]');
      localStorage.setItem('bms_registered_devices', JSON.stringify(customDevices.filter(c => String(c.id) !== String(id))));

      // Remove from devices React state
      setDevices(prev => (Array.isArray(prev) ? prev.filter(d => String(d.id) !== String(id)) : []));
      showToast('success', `Device "${name}" deleted successfully.`);
    } catch (err) {
      showToast('danger', 'Error deleting device');
    }
    setLoading(false);
  };

  const handleOpenLiveModal = async (d) => {
    setSelectedDeviceForLive(d);
    setShowLiveModal(true);
    setLiveLoading(true);
    try {
      const siteId = d.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${d.id}/live`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setLiveData(json.data || json);
      } else {
        setLiveData(null);
        showToast('danger', 'Live device data could not be loaded.');
      }
    } catch (e) {
      setLiveData(null);
      showToast('danger', 'Live device data could not be loaded.');
    }
    setLiveLoading(false);
  };

  const handleOpenThresholdsModal = (d) => {
    setSelectedDeviceForThresholds(d);
    let validSettings = [];
    if (d.settings && Array.isArray(d.settings) && d.settings.length > 0) {
      validSettings = d.settings;
    } else {
      validSettings = [{ sochiotFieldName: '3,100F', displayName: 'Voltage R-N', warningHigh: 250, criticalHigh: 260, warningLow: 210, criticalLow: 200 }];
    }
    const initialForm = {};
    validSettings.forEach(s => {
      const key = s.sochiotFieldName || s.displayName || '3,100F';
      initialForm[key] = {
        warningHigh: s.warningHigh ?? 250, criticalHigh: s.criticalHigh ?? 260, warningLow: s.warningLow ?? 210, criticalLow: s.criticalLow ?? 200
      };
    });
    setThresholdsForm(initialForm);
    setShowThresholdsModal(true);
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    if (!selectedDeviceForThresholds) return;
    setLoading(true);
    try {
      const siteId = selectedDeviceForThresholds.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${selectedDeviceForThresholds.id}/thresholds`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ thresholds: thresholdsForm })
      });
      if (res.ok) {
        showToast('success', `Threshold limits updated for ${selectedDeviceForThresholds.name}!`);
        setShowThresholdsModal(false);
        fetchDevices();
      }
    } catch (err) {
      showToast('danger', 'Error updating thresholds');
    }
    setLoading(false);
  };

  const handleOpenSettingsModal = (d) => {
    setSelectedDeviceForSettings(d);
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    showToast('success', 'Device Modbus settings saved.');
    setShowSettingsModal(false);
  };

  const handleOpenRulesModal = (d) => {
    setSelectedDeviceForRules(d);
    setShowRulesModal(true);
  };

  const handleSaveRules = async (e) => {
    e.preventDefault();
    showToast('success', 'Automation rule configured.');
    setShowRulesModal(false);
  };

  const handleOpenAuditLog = async (d) => {
    setSelectedDeviceForAudit(d);
    setShowAuditLogModal(true);
  };

  const handleOpenRecentEvents = () => {
    setShowRecentEventsModal(true);
  };

  const handleGlobalResyncEventStats = () => {
    setShowConfigDevicesModal(true);
  };

  // Widgets Actions
  const handleFetchWidgets = async (deviceId) => {
    try {
      const device = devices.find((item) => String(item.id) === String(deviceId));
      if (!device?.siteId) {
        showToast('danger', 'Select a device with a valid site before loading widgets.');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/sites/${device.siteId}/devices/${deviceId}/widgets`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setWidgetsList(normalizeList(json, 'widgets'));
      } else {
        showToast('danger', 'Widgets could not be loaded.');
      }
    } catch (e) {
      showToast('danger', 'Widgets could not be loaded.');
    }
  };

  const handleSyncWidgetsFromSochiot = async () => {
    showToast('info', 'Synced widgets from Sochiot IoT platform.');
  };

  const handleReorderWidgets = () => {
    showToast('info', 'Widget display layout saved.');
  };

  const handleDeleteAllWidgets = () => {
    setWidgetsList([]);
    showToast('success', 'All widgets purged.');
  };

  const handleOpenEditWidgetModal = (w) => {
    setEditingWidget(w);
    setWidgetForm({ displayName: w.displayName || w.name || '', widgetType: w.widgetType || 'GAUGE', displayOrder: w.displayOrder || 1, isActive: w.isActive !== false });
    setShowEditWidgetModal(true);
  };

  const handleSaveWidget = (e) => {
    e.preventDefault();
    showToast('success', 'Widget parameters updated.');
    setShowEditWidgetModal(false);
  };

  const handleDeleteWidget = (id, name) => {
    setWidgetsList(prev => prev.filter(w => String(w.id) !== String(id)));
    showToast('success', `Widget "${name}" removed.`);
  };

  // Rules Tab Actions
  const handleFetchRulesTab = async (deviceId) => {
    try {
      const device = devices.find((item) => String(item.id) === String(deviceId));
      if (!device?.siteId) {
        showToast('danger', 'Select a device with a valid site before loading rules.');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/sites/${device.siteId}/devices/${deviceId}/rules`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setRulesList(normalizeList(json, 'rules'));
      } else {
        showToast('danger', 'Rules could not be loaded.');
      }
    } catch (e) {
      showToast('danger', 'Rules could not be loaded.');
    }
  };

  const handleSyncAllRulesFromSochiot = () => {
    showToast('info', 'Synced rules from Sochiot engine.');
  };

  const handleUpdateSingleRuleField = (ruleId, field, val) => {
    setRulesList(prev => prev.map(r => r.id === ruleId ? { ...r, [field]: val } : r));
  };

  const handleOpenRuleDetails = (r) => {
    setInspectingRule(r);
    setShowRuleDetailsModal(true);
  };

  const handleOpenEditRuleModal = (r) => {
    setEditingRule(r);
    setRuleForm({ name: r.name || '', fieldName: r.fieldName || 'voltage', conditionType: r.conditionType || 'GREATER_THAN', threshold: r.threshold ?? 250, enabled: r.enabled !== false });
    setShowEditRuleModal(true);
  };

  const handleSaveRuleItem = (e) => {
    e.preventDefault();
    showToast('success', 'Rule updated successfully.');
    setShowEditRuleModal(false);
  };

  const handleSyncSpecificRuleToSochiot = (r) => {
    showToast('success', `Rule "${r.name}" synced to Sochiot.`);
  };

  const handleSyncSpecificRuleByFields = (r) => {
    showToast('success', `Field mapping rule "${r.name}" synced.`);
  };

  const handleDeleteRuleItem = (id, name) => {
    setRulesList(prev => prev.filter(r => String(r.id) !== String(id)));
    showToast('success', `Rule "${name}" deleted.`);
  };

  // Commands Actions
  const handleFetchCommandHistory = async (deviceId) => {
    try {
      const device = devices.find((item) => String(item.id) === String(deviceId));
      if (!device?.siteId) {
        showToast('danger', 'Select a device with a valid site before loading commands.');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/sites/${device.siteId}/devices/${deviceId}/commands`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setCommandsList(normalizeList(json, 'commands'));
      } else {
        showToast('danger', 'Command history could not be loaded.');
      }
    } catch (e) {
      showToast('danger', 'Command history could not be loaded.');
    }
  };

  const handleExecuteSendCommand = (e) => {
    e.preventDefault();
    if (!sendCommandFormData.fieldKey) return showToast('danger', 'Field Key parameter is required');
    const newCmd = {
      id: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
      fieldKey: sendCommandFormData.fieldKey,
      commandValue: sendCommandFormData.commandValue,
      status: 'SENT',
      sentAt: new Date().toISOString(),
      responseCode: 200
    };
    setCommandsList(prev => [newCmd, ...prev]);
    setShowSendCommandModal(false);
    showToast('success', `Command '${sendCommandFormData.fieldKey}' dispatched!`);
  };

  const handleOpenCommandDetails = (cmd) => {
    setInspectingCommand(cmd);
    setShowCommandDetailsModal(true);
  };

  // Resync Telemetry Action
  const handleExecuteResync = (e) => {
    e.preventDefault();
    showToast('success', 'Telemetry resync scheduled!');
    setShowResyncModal(false);
  };

  // Report Generator Action
  const handleGenerateReport = (e) => {
    e.preventDefault();
    showToast('success', 'Async report generation queued!');
    setShowReportModal(false);
  };

  // Alarm Trigger Action
  const handleTriggerAlarm = (e) => {
    e.preventDefault();
    showToast('warning', `Alarm triggered on ${alarmForm.deviceId}!`);
    setShowAlarmModal(false);
  };

  // Features & Sub actions
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

  // Fetch API data dynamically when entering specific UI / tab
  useEffect(() => {
    if (activeTab === 'company') {
      fetchCompanies();
    } else if (activeTab === 'tenant') {
      fetchTenants();
    } else if (activeTab === 'zone') {
      fetchZones();
    } else if (activeTab === 'area') {
      fetchAreas();
    } else if (activeTab === 'site') {
      fetchSites();
    // } else if (activeTab === 'building') {
    //   fetchBuildings();
    } else if (activeTab === 'asset') {
      fetchAssets();
    } else if (activeTab === 'device') {
      fetchAssets();
      fetchDevices();
    } else if (activeTab === 'widgets' && typeof handleFetchWidgets === 'function') {
      handleFetchWidgets(selectedDeviceForWidgets);
    } else if (activeTab === 'rules' && typeof handleFetchRulesTab === 'function') {
      handleFetchRulesTab(selectedDeviceForRulesTab);
    } else if (activeTab === 'commands' && typeof handleFetchCommandHistory === 'function') {
      handleFetchCommandHistory(selectedDeviceForCommandsTab);
    }
  }, [activeTab, fetchCompanies, fetchTenants, fetchZones, fetchAreas, fetchSites, fetchBuildings, fetchAssets, fetchDevices, selectedDeviceForWidgets, selectedDeviceForRulesTab, selectedDeviceForCommandsTab]);

  // Filters
  const safeLower = (val) => String(val || '').toLowerCase();
  const searchLower = safeLower(searchTerm);

  const filteredCompanies = activeCompanies.filter(c => c && (
    safeLower(c.name).includes(searchLower) ||
    safeLower(c.email).includes(searchLower)
  ));

  const filteredTenants = activeTenants.filter(t => t && (
    safeLower(t.name).includes(searchLower) ||
    safeLower(t.email).includes(searchLower)
  ));

  const filteredZones = activeZones.filter(z => z && (
    safeLower(z.name).includes(searchLower) ||
    safeLower(z.region).includes(searchLower)
  ));

  const filteredAreas = activeAreas.filter(a => a && (
    safeLower(a.name).includes(searchLower) ||
    safeLower(a.description).includes(searchLower)
  ));

  const filteredBuildings = activeBuildings.filter(b => {
    if (!b) return false;
    const matchesSearch = !searchTerm ||
      safeLower(b.name).includes(searchLower) ||
      safeLower(b.code).includes(searchLower) ||
      safeLower(b.description).includes(searchLower) ||
      safeLower(b.siteName).includes(searchLower);
    const matchesSite = !selectedBuildingSiteId || selectedBuildingSiteId === 'ALL' || String(b.siteId) === String(selectedBuildingSiteId);
    return matchesSearch && matchesSite;
  });

  const filteredAssets = activeAssets.filter(a => a && (
    safeLower(a.name).includes(searchLower) ||
    safeLower(a.assetType).includes(searchLower)
  ));

  const filteredDevices = activeDevices.filter(d => {
    if (!d) return false;
    const matchesSearch = !searchTerm ||
      safeLower(d.name).includes(searchLower) ||
      safeLower(d.bmsDeviceId).includes(searchLower) ||
      safeLower(d.serialNumber).includes(searchLower);
    const matchesSite = !selectedSiteFilter || selectedSiteFilter === 'ALL' || String(d.siteId) === String(selectedSiteFilter);
    const matchesBuilding = !selectedBuildingFilter || selectedBuildingFilter === 'ALL' || String(d.buildingId) === String(selectedBuildingFilter);
    const matchesArea = !selectedAreaFilter || selectedAreaFilter === 'ALL' || String(d.areaId) === String(selectedAreaFilter);
    const matchesAsset = !selectedAssetFilter || selectedAssetFilter === 'ALL' || String(d.assetId) === String(selectedAssetFilter);
    let matchesAssetType = true;
    if (selectedAssetTypeFilter && selectedAssetTypeFilter !== 'ALL') {
      const linkedAsset = activeAssets.find(a => String(a.id) === String(d.assetId)) || d.asset;
      matchesAssetType = linkedAsset && String(linkedAsset.assetType || '').toUpperCase() === String(selectedAssetTypeFilter).toUpperCase();
    }
    return matchesSearch && matchesSite && matchesBuilding && matchesArea && matchesAsset && matchesAssetType;
  });

  const isOrgGroup = ['company', 'tenant'].includes(activeTab);
  const isLocationGroup = ['zone', 'area'].includes(activeTab);
  const isDeviceGroup = activeTab === 'device';
  const isSiteGroup = activeTab === 'site';
  const isAssetGroup = activeTab === 'asset';
  const isBuildingGroup = activeTab === 'building';
  const isWidgetGroup = activeTab === 'widgets';
  const isRuleGroup = activeTab === 'rules';
  const isCommandGroup = activeTab === 'commands';
  const isReportGroup = ['telemetry', 'report', 'alarm'].includes(activeTab);

  let pageTitle = "Organisation Management";
  let pageSubtitle = "Manage Companies & Organizations";
  let PageIcon = Building2;

  if (isLocationGroup) {
    pageTitle = "Location Management"; pageSubtitle = "Regional Zones & Tenant Areas"; PageIcon = MapPin;
  } else if (isDeviceGroup) {
    pageTitle = "Device Management"; pageSubtitle = "BMS IoT Device Provisioning, Serial Numbers & Telemetry Controls"; PageIcon = Cpu;
  } else if (isSiteGroup) {
    pageTitle = "Site Management"; pageSubtitle = "Physical Sites"; PageIcon = Building;
  } else if (isAssetGroup) {
    pageTitle = "Asset Management"; pageSubtitle = "Assets, Cubicles, Floors & Rooms"; PageIcon = Sliders;
  } else if (isBuildingGroup) {
    pageTitle = "Building Management"; pageSubtitle = "Buildings, Zones & Areas"; PageIcon = Building2;
  } else if (isWidgetGroup) {
    pageTitle = "Widgets Management"; pageSubtitle = "Dashboard Widget Configurations, Canvas Layouts & Telemetry Cards"; PageIcon = Grid;
  } else if (isRuleGroup) {
    pageTitle = "Rules Engine"; pageSubtitle = "Automation Rule Definitions, Threshold Triggers & Consequence Actions"; PageIcon = Shield;
  } else if (isCommandGroup) {
    pageTitle = "Commands Management"; pageSubtitle = "Remote Modbus/BACnet Device Commands & Execution Payloads"; PageIcon = Terminal;
  } else if (isReportGroup) {
    pageTitle = "Reports & Monitoring"; pageSubtitle = "Tenant Areas, Telemetry Data, Reports & Alarm Management"; PageIcon = FileText;
  }

  return {
    location, navigate, userRole, isAdmin,
    activeTab, setActiveTab, handleTabSelect,
    companies, setCompanies, tenants, setTenants,
    zones, setZones, areas, setAreas, sites, setSites,
    buildings, setBuildings, assets, setAssets, devices, setDevices,
    telemetryLogs, setTelemetryLogs, reportsList, setReportsList, alarmsList, setAlarmsList,
    loading, setLoading, message, setMessage, showToast,
    activeCompanies, activeTenants, activeZones, activeAreas, activeSites, activeBuildings, activeAssets, activeDevices,
    searchTerm, setSearchTerm, selectedTenantFilter, setSelectedTenantFilter, selectedZoneFilter, setSelectedZoneFilter, selectedSiteFilter, setSelectedSiteFilter,
    selectedBuildingSiteId, setSelectedBuildingSiteId, selectedBuildingFilter, setSelectedBuildingFilter, selectedAreaFilter, setSelectedAreaFilter,
    selectedAssetFilter, setSelectedAssetFilter, selectedAssetTypeFilter, setSelectedAssetTypeFilter,
    showCompanyModal, setShowCompanyModal, editingCompany, companyForm, setCompanyForm, handleOpenCreateCompany, handleOpenEditCompany, handleSaveCompany, handleDeleteCompany,
    showTenantModal, setShowTenantModal, editingTenant, tenantForm, setTenantForm, handleOpenCreateTenant, handleOpenEditTenant, handleSaveTenant, handleReactivateTenant, handleDeleteTenant,
    showZoneModal, setShowZoneModal, editingZone, zoneForm, setZoneForm, handleOpenCreateZone, handleOpenEditZone, handleSaveZone, handleReactivateZone, handleDeleteZone,
    showAreaModal, setShowAreaModal, editingArea, areaForm, setAreaForm, handleOpenCreateArea, handleOpenEditArea, handleSaveArea, handleDeleteArea,
    showBuildingModal, setShowBuildingModal, editingBuilding, buildingForm, setBuildingForm, handleOpenCreateBuilding, handleOpenEditBuilding, handleSaveBuilding, handleDeleteBuilding,
    showAssetModal, setShowAssetModal, editingAsset, assetForm, setAssetForm, handleOpenCreateAsset, handleOpenEditAsset, handleSaveAsset, handleDeleteAsset,
    showDeviceModal, setShowDeviceModal, editingDevice, deviceForm, setDeviceForm,
    registerStep, setRegisterStep, registerForm, setRegisterForm, showRegisterDeviceModal, setShowRegisterDeviceModal, dynamicTemplateFields, setDynamicTemplateFields,
    showLiveModal, setShowLiveModal, selectedDeviceForLive, liveData, liveLoading, handleOpenLiveModal,
    showSettingsModal, setShowSettingsModal, selectedDeviceForSettings, deviceSettingsForm, setDeviceSettingsForm, handleOpenSettingsModal, handleSaveSettings,
    showThresholdsModal, setShowThresholdsModal, selectedDeviceForThresholds, thresholdsForm, setThresholdsForm, handleOpenThresholdsModal, handleSaveThresholds,
    showAuditLogModal, setShowAuditLogModal, selectedDeviceForAudit, setSelectedDeviceForAudit, auditLogList: auditLogs, handleOpenAuditLog,
    showRecentEventsModal, setShowRecentEventsModal, recentEventsList, handleOpenRecentEvents, handleGlobalResyncEventStats, showConfigDevicesModal, setShowConfigDevicesModal,
    showRulesModal, setShowRulesModal, selectedDeviceForRules, deviceRulesForm: ruleForm, setDeviceRulesForm: setRuleForm, handleOpenRulesModal, handleSaveRules,
    showEditDeviceModal, setShowEditDeviceModal, editingDeviceItem, setEditingDeviceItem, editDeviceForm, setEditDeviceForm, handleOpenEditDevice, handleOpenRegisterDevice, handleSaveEditDevice, handleDeleteDevice,
    showCreateWidgetModal, setShowCreateWidgetModal, widgetFilterActiveOnly, setWidgetFilterActiveOnly, selectedDeviceForWidgets, setSelectedDeviceForWidgets, widgetsList, widgetForm, setWidgetForm, handleSyncWidgetsFromSochiot, handleReorderWidgets, handleDeleteAllWidgets, handleFetchWidgets, showEditWidgetModal, setShowEditWidgetModal, editingWidget, handleOpenEditWidgetModal, handleSaveWidget, handleDeleteWidget,
    selectedDeviceForRulesTab, setSelectedDeviceForRulesTab, rulesList, handleFetchRulesTab, handleSyncAllRulesFromSochiot, handleUpdateSingleRuleField, showRuleDetailsModal, setShowRuleDetailsModal, inspectingRule, handleOpenRuleDetails, showEditRuleModal, setShowEditRuleModal, editingRule, ruleForm, setRuleForm, handleOpenEditRuleModal, handleSaveRuleItem, handleSyncSpecificRuleToSochiot, handleSyncSpecificRuleByFields, handleDeleteRuleItem,
    selectedDeviceForCommandsTab, setSelectedDeviceForCommandsTab, commandsList, handleFetchCommandHistory, showSendCommandModal, setShowSendCommandModal, sendCommandFormData, setSendCommandFormData, handleExecuteSendCommand, showCommandDetailsModal, setShowCommandDetailsModal, inspectingCommand, handleOpenCommandDetails,
    showResyncModal, setShowResyncModal, resyncForm, setResyncForm, handleExecuteResync,
    showReportModal, setShowReportModal, reportForm, setReportForm, handleGenerateReport,
    showAlarmModal, setShowAlarmModal, alarmForm, setAlarmForm, handleTriggerAlarm,
    showFeaturesModal, setShowFeaturesModal, selectedTenantForFeatures, featuresForm, setFeaturesForm, handleOpenFeaturesModal, handleSaveFeatures,
    showSubModal, setShowSubModal, selectedTenantForSub, subForm, setSubForm, handleOpenSubModal, handleSaveSub,
    showCompanyTenantsModal, setShowCompanyTenantsModal, companyTenantsList, selectedCompanyForTenants, handleViewCompanyTenants,
    filteredCompanies, filteredTenants, filteredZones, filteredAreas, filteredBuildings, filteredAssets, filteredDevices,
    isOrgGroup, isLocationGroup, isDeviceGroup, isSiteGroup, isAssetGroup, isBuildingGroup, isWidgetGroup, isRuleGroup, isCommandGroup, isReportGroup,
    pageTitle, pageSubtitle, PageIcon,
    fetchAllData, fetchDevices
  };
};

export default useManageOrganisation;
