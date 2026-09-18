import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCookie, getAuthToken } from '../../../../utils/cookieUtils';
import { getApiUrl } from '../../../../utils/apiConfig';
import { Building2, MapPin, Cpu, Building, Sliders, Grid, Shield, Terminal, FileText } from 'lucide-react';
import { useSiteStore } from '../../../../context/SiteContext';
import { isCategoryMatch } from '../../../../constants/deviceTemplates';

import useOrgHierarchy, { normalizeList } from './useOrgHierarchy';
import useOrgDevices from './useOrgDevices';
import useOrgTelemetryAndControls from './useOrgTelemetryAndControls';

export { normalizeList };
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

export const useManageOrganisation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sites: storeSites, fetchSites: fetchStoreSites } = useSiteStore();

  // Role-Based Access Control (RBAC) Security Check
  const userRole = (localStorage.getItem('userRole') || getCookie('userRole') || 'USER').toUpperCase();
  const isAdmin = ['SUPERADMIN', 'ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN'].includes(userRole);

  // Global State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (['company', 'tenant', 'zone', 'area', 'site', 'building', 'asset', 'device', 'widgets', 'rules', 'commands', 'telemetry', 'report', 'alarm'].includes(tabParam)) return tabParam;
    return 'company';
  });

  const showToast = useCallback((type, text) => {
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
  }, []);

  // Shared Site Filter State for device and asset scoping
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');

  // Sub-hook 1: Hierarchy (Companies, Tenants, Zones, Areas, Sites, Buildings, Assets)
  const hierarchy = useOrgHierarchy({
    showToast,
    setLoading,
    storeSites,
    fetchStoreSites,
    selectedSiteFilter
  });

  // Sub-hook 2: Devices (Devices, Registration Wizard, Live stream, Settings, Thresholds, Audit, Recent Events)
  const devicesSub = useOrgDevices({
    showToast,
    setLoading,
    selectedAssetFilter: hierarchy.selectedAssetFilter,
    selectedSiteFilter,
    activeSites: hierarchy.activeSites
  });

  // Sub-hook 3: Telemetry, Widgets, Rules Engine, Commands, Reports, Alarms
  const controls = useOrgTelemetryAndControls({
    showToast,
    setLoading,
    devices: devicesSub.devices
  });

  // Sync tab with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const siteParam = params.get('siteId');
    if (tabParam && ['company', 'tenant', 'zone', 'area', 'site', 'building', 'asset', 'device', 'widgets', 'rules', 'commands', 'telemetry', 'report', 'alarm'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab('company');
    }
    if (siteParam) {
      hierarchy.setSelectedBuildingSiteId(siteParam);
    }
  }, [location.search]);

  // Tab switch handler
  const handleTabSelect = (key) => {
    setActiveTab(key);
    const basePath = location.pathname.startsWith('/settings') ? '/settings/manage-organisation' : '/manage-organisation';
    navigate(`${basePath}?tab=${key}`, { replace: true });
  };

  // Full Refresh / Fetch All Data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    try {
      await Promise.allSettled([
        hierarchy.fetchCompanies(),
        hierarchy.fetchTenants(),
        hierarchy.fetchZones(),
        hierarchy.fetchAreas(),
        hierarchy.fetchSites(),
        hierarchy.fetchAssets(),
        devicesSub.fetchDevices()
      ]);
    } catch (err) {
      console.warn('Initial data fetch error:', err);
    } finally {
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }, [hierarchy, devicesSub]);

  // Fetch API data dynamically on tab entrance (lazy load)
  useEffect(() => {
    if (activeTab === 'company') {
      hierarchy.fetchCompanies();
    } else if (activeTab === 'tenant') {
      hierarchy.fetchTenants();
    } else if (activeTab === 'zone') {
      hierarchy.fetchZones();
    } else if (activeTab === 'area') {
      hierarchy.fetchAreas();
    } else if (activeTab === 'site') {
      hierarchy.fetchSites();
    } else if (activeTab === 'asset') {
      hierarchy.fetchAssets();
    } else if (activeTab === 'device') {
      hierarchy.fetchAssets();
      devicesSub.fetchDevices();
    } else if (activeTab === 'widgets' && typeof controls.handleFetchWidgets === 'function') {
      controls.handleFetchWidgets(controls.selectedDeviceForWidgets);
    } else if (activeTab === 'rules' && typeof controls.handleFetchRulesTab === 'function') {
      controls.handleFetchRulesTab(controls.selectedDeviceForRulesTab);
    } else if (activeTab === 'commands' && typeof controls.handleFetchCommandHistory === 'function') {
      controls.handleFetchCommandHistory(controls.selectedDeviceForCommandsTab);
    }
  }, [
    activeTab,
    hierarchy.fetchCompanies,
    hierarchy.fetchTenants,
    hierarchy.fetchZones,
    hierarchy.fetchAreas,
    hierarchy.fetchSites,
    hierarchy.fetchAssets,
    devicesSub.fetchDevices,
    controls.selectedDeviceForWidgets,
    controls.selectedDeviceForRulesTab,
    controls.selectedDeviceForCommandsTab
  ]);

  // Filters & Search Computation
  const safeLower = (val) => String(val || '').toLowerCase();
  const searchLower = safeLower(searchTerm);

  const filteredCompanies = useMemo(() => {
    return hierarchy.activeCompanies.filter(c => c && (
      safeLower(c.name).includes(searchLower) ||
      safeLower(c.email).includes(searchLower)
    ));
  }, [hierarchy.activeCompanies, searchLower]);

  const filteredTenants = useMemo(() => {
    return hierarchy.activeTenants.filter(t => t && (
      safeLower(t.name).includes(searchLower) ||
      safeLower(t.email).includes(searchLower)
    ));
  }, [hierarchy.activeTenants, searchLower]);

  const filteredZones = useMemo(() => {
    return hierarchy.activeZones.filter(z => z && (
      safeLower(z.name).includes(searchLower) ||
      safeLower(z.region).includes(searchLower)
    ));
  }, [hierarchy.activeZones, searchLower]);

  const filteredAreas = useMemo(() => {
    return hierarchy.activeAreas.filter(a => a && (
      safeLower(a.name).includes(searchLower) ||
      safeLower(a.description).includes(searchLower)
    ));
  }, [hierarchy.activeAreas, searchLower]);

  const filteredBuildings = useMemo(() => {
    return hierarchy.activeBuildings.filter(b => {
      if (!b) return false;
      const matchesSearch = !searchTerm ||
        safeLower(b.name).includes(searchLower) ||
        safeLower(b.code).includes(searchLower) ||
        safeLower(b.description).includes(searchLower) ||
        safeLower(b.siteName).includes(searchLower);
      const matchesSite = !hierarchy.selectedBuildingSiteId || hierarchy.selectedBuildingSiteId === 'ALL' || String(b.siteId) === String(hierarchy.selectedBuildingSiteId);
      return matchesSearch && matchesSite;
    });
  }, [hierarchy.activeBuildings, hierarchy.selectedBuildingSiteId, searchTerm, searchLower]);

  const filteredAssets = useMemo(() => {
    return hierarchy.activeAssets.filter(a => a && (
      safeLower(a.name).includes(searchLower) ||
      safeLower(a.assetType).includes(searchLower)
    ));
  }, [hierarchy.activeAssets, searchLower]);

  const filteredDevices = useMemo(() => {
    return devicesSub.activeDevices.filter(d => {
      if (!d) return false;
      const matchesSearch = !searchTerm ||
        safeLower(d.name).includes(searchLower) ||
        safeLower(d.bmsDeviceId).includes(searchLower) ||
        safeLower(d.serialNumber).includes(searchLower);
      const matchesSite = !selectedSiteFilter || selectedSiteFilter === 'ALL' || String(d.siteId) === String(selectedSiteFilter);
      const matchesBuilding = !hierarchy.selectedBuildingFilter || hierarchy.selectedBuildingFilter === 'ALL' || String(d.buildingId) === String(hierarchy.selectedBuildingFilter);
      const matchesArea = !hierarchy.selectedAreaFilter || hierarchy.selectedAreaFilter === 'ALL' || String(d.areaId) === String(hierarchy.selectedAreaFilter);
      const matchesAsset = !hierarchy.selectedAssetFilter || hierarchy.selectedAssetFilter === 'ALL' || String(d.assetId) === String(hierarchy.selectedAssetFilter);
      const matchesCategory = isCategoryMatch(d.category, devicesSub.selectedCategoryFilter);
      let matchesAssetType = true;
      if (hierarchy.selectedAssetTypeFilter && hierarchy.selectedAssetTypeFilter !== 'ALL') {
        const linkedAsset = hierarchy.activeAssets.find(a => String(a.id) === String(d.assetId)) || d.asset;
        matchesAssetType = linkedAsset && String(linkedAsset.assetType || '').toUpperCase() === String(hierarchy.selectedAssetTypeFilter).toUpperCase();
      }
      return matchesSearch && matchesSite && matchesBuilding && matchesArea && matchesAsset && matchesAssetType && matchesCategory;
    });
  }, [
    devicesSub.activeDevices,
    searchTerm,
    searchLower,
    selectedSiteFilter,
    hierarchy.selectedBuildingFilter,
    hierarchy.selectedAreaFilter,
    hierarchy.selectedAssetFilter,
    hierarchy.selectedAssetTypeFilter,
    devicesSub.selectedCategoryFilter,
    hierarchy.activeAssets
  ]);

  // Tab Group Flags & Header Meta
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
    loading, setLoading, message, setMessage, showToast,
    searchTerm, setSearchTerm,
    selectedSiteFilter, setSelectedSiteFilter,

    // Hierarchy Exports
    ...hierarchy,

    // Devices Exports
    ...devicesSub,
    auditLogList: devicesSub.auditLogs,
    handleOpenAuditLogModal: devicesSub.handleOpenAuditLog,
    deviceRulesForm: devicesSub.deviceRulesForm,
    setDeviceRulesForm: devicesSub.setDeviceRulesForm,

    // Telemetry & Controls Exports
    ...controls,

    // Filtered lists
    filteredCompanies, filteredTenants, filteredZones, filteredAreas, filteredBuildings, filteredAssets, filteredDevices,

    // UI meta
    isOrgGroup, isLocationGroup, isDeviceGroup, isSiteGroup, isAssetGroup, isBuildingGroup, isWidgetGroup, isRuleGroup, isCommandGroup, isReportGroup,
    pageTitle, pageSubtitle, PageIcon,
    fetchAllData
  };
};

export default useManageOrganisation;
