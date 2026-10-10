import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Building2, ChevronDown, ChevronRight, Search, Check, 
  Cpu, Zap, Droplets, Activity, Thermometer, Layers, 
  LayoutDashboard, Flame, Wind, Loader2
} from 'lucide-react';
import { bmsService } from '../services/bmsService';
import { normalizeList, getAuthHeaders } from '../services/apiClient';
import { getApiUrl } from '../utils/apiConfig';

// Custom Generator Engine Icon
const DgGeneratorIcon = ({ size = 15, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="6" width="16" height="12" rx="2" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="18" x2="8" y2="22" />
    <line x1="16" y1="18" x2="16" y2="22" />
    <circle cx="12" cy="12" r="2.5" />
    <line x1="19" y1="10" x2="21" y2="10" />
    <line x1="19" y1="14" x2="21" y2="14" />
  </svg>
);

/**
 * Strict category validator to prevent cross-module & sub-tab device pollution
 */
const isDeviceMatchingCategory = (device, category) => {
  if (!device) return false;
  if (!category) return true;

  const cat = String(device.category || device.type || '').toUpperCase().trim();
  const name = String(device.name || device.deviceName || device.label || device.title || '').toUpperCase().trim();
  const mod = String(device.module || '').toUpperCase().trim();

  // 1. MAIN ENERGY METER (Strict: Only Main meters, no submeters)
  if (category === 'MAIN_ENERGY_METER') {
    const isExplicitMain = cat === 'MAIN_ENERGY_METER' || cat === 'MAIN_METER' || cat === 'MAIN_ENERGY_METERS';
    const isMainByName = name.includes('MAIN METER') || name.includes('MAIN-METER') || name.includes('GRID INCOMER') || name.includes('INCOMER METER');
    const isSub = cat.includes('SUB') || name.includes('SUB METER') || name.includes('SUB-METER') || name.includes('SUBMETER') || name.includes('SENSOR METER') || name.includes('NORMAL METER');
    return (isExplicitMain || isMainByName) && !isSub;
  }

  // 2. SUB ENERGY METER (Strict: Sub meters and branch distribution meters)
  if (category === 'SUB_ENERGY_METER') {
    const isExplicitSub = cat === 'SUB_ENERGY_METER' || cat === 'SUB_METER';
    const isGenericMeter = cat === 'ENERGY_METER' || cat === 'METER' || mod.includes('ENERGY') || name.includes('METER');
    const isMain = cat === 'MAIN_ENERGY_METER' || cat === 'MAIN_METER' || name.includes('MAIN METER') || name.includes('GRID INCOMER');
    const isDG = cat.includes('GEN') || name.includes('GENSET') || name.includes('DG-');
    return (isExplicitSub || isGenericMeter) && !isMain && !isDG;
  }

  // 3. ALL ENERGY METERS (Overview)
  if (category === 'ENERGY_METER') {
    const isMeter = 
      cat.includes('ENERGY') || 
      cat.includes('METER') || 
      mod.includes('ENERGY') || 
      name.includes('METER');
    const isDG = cat.includes('GEN') || name.includes('GENSET') || name.includes('DG-');
    const isWater = cat.includes('WATER') || cat.includes('TANK');
    return isMeter && !isDG && !isWater;
  }

  // 4. GENERATOR / DG SET
  if (category === 'GENERATOR') {
    const isDG = 
      cat.includes('GEN') || 
      cat.includes('DG') || 
      mod.includes('DG') || 
      mod.includes('GEN') || 
      name.includes('DG') || 
      name.includes('GENERATOR') || 
      name.includes('GENSET') || 
      device.module === 'DG Set';
    const isMeter = cat.includes('METER') || name.includes('METER');
    return isDG && !isMeter;
  }

  // 5. WATER MANAGEMENT
  if (category === 'WATER') {
    return cat.includes('WATER') || cat.includes('TANK') || cat.includes('PUMP') || mod.includes('WATER') || name.includes('TANK');
  }

  // 6. MOTORS
  if (category === 'MOTOR') {
    return cat.includes('MOTOR') || cat.includes('PUMP') || mod.includes('MOTOR') || name.includes('MOTOR');
  }

  // 7. TRANSFORMER
  if (category === 'TRANSFORMER') {
    return cat.includes('TRANSFORMER') || cat.includes('XFMR') || name.includes('TRANSFORMER') || name.includes('XFMR');
  }

  // 8. LT PANEL
  if (category === 'LT_PANEL') {
    return cat.includes('LT_PANEL') || cat.includes('PANEL') || cat.includes('BREAKER') || name.includes('PANEL');
  }

  // 9. HVAC & VRV
  if (category === 'HVAC') {
    return cat.includes('HVAC') || cat.includes('AC') || cat.includes('CHILLER') || cat.includes('VRV') || cat.includes('AHU') || name.includes('CHILLER') || name.includes('AHU');
  }

  // 10. FIRE PUMP
  if (category === 'FIRE_PUMP') {
    return cat.includes('FIRE') || cat.includes('PUMP') || name.includes('FIRE');
  }

  // 11. AQI SENSOR
  if (category === 'AQI_SENSOR' || category === 'AQI') {
    const isAqi = cat === 'AQI_SENSOR' || cat === 'AQI' || cat.includes('AQI') || cat.includes('AIR') || mod.includes('AQI') || name.includes('AQI') || name.includes('AIR QUALITY') || name.includes('HUMIDITY');
    const isOther = cat.includes('ENERGY') || cat.includes('METER') || cat.includes('GEN') || cat.includes('DG') || cat.includes('WATER') || cat.includes('MOTOR') || cat.includes('TRANSFORMER') || cat.includes('LT_PANEL') || name.includes('MAIN METER') || name.includes('GENSET') || name.includes('DG-') || name.includes('SOLAR METER');
    return isAqi && !isOther;
  }

  return cat.includes(category) || name.includes(category);
};

/**
 * GlobalSiteAssetDropdown Component
 * 
 * Strict Click-Driven cascading dropdown for BMS/SCADA pages:
 * - Route-aware category detection (`MAIN_ENERGY_METER` for Main Meter tab, `SUB_ENERGY_METER` for Sub Meters tab, `AQI_SENSOR` for AQI).
 * - Module-scoped device cache (`siteId__category`) preventing cross-tab and cross-module pollution.
 * - Opens ONLY on click (no hover-triggers).
 * - Left Panel (Sites): Hover provides subtle CSS styling ONLY. Clicking a site loads its devices.
 * - Right Panel (Devices): Shows devices for the clicked site with live category filtering and selection.
 * 
 * @param {Object} props
 * @param {Array} props.activeSites - Available sites list
 * @param {Object} props.selectedSite - Currently active site
 * @param {Function} props.setSelectedSite - Site change handler
 * @param {Object} [props.moduleHeader] - Current module metadata ({ title: 'Energy Metering' })
 * @param {React.Component} [props.ModuleIcon] - Icon component for the module
 * @param {Function} [props.onDeviceSelect] - Optional custom device selection callback
 */
export const GlobalSiteAssetDropdown = ({
  activeSites = [],
  selectedSite,
  setSelectedSite,
  moduleHeader,
  ModuleIcon,
  onDeviceSelect
}) => {
  const { pathname = '' } = useLocation();
  const getSiteId = (site) => site?.id ?? site?.siteId ?? site?._id ?? '';

  // Derive active category from module title and current sub-route
  const currentCategory = useMemo(() => {
    const path = (pathname || (typeof window !== 'undefined' ? window.location.pathname : '')).toLowerCase();
    const title = moduleHeader?.title || '';

    if (title === 'Energy Metering' || path.includes('/energy-metering')) {
      if (path.includes('/energy-metering/main')) return 'MAIN_ENERGY_METER';
      if (path.includes('/energy-metering/sub') || path.includes('/submeters') || path.includes('/sub-meters')) return 'SUB_ENERGY_METER';
      return 'ENERGY_METER';
    }

    if (title === 'DG Set' || path.includes('/dg-set')) return 'GENERATOR';
    if (title === 'Water Management' || path.includes('/water-management')) return 'WATER';
    if (title === 'Motors' || path.includes('/motors')) return 'MOTOR';
    if (title === 'Transformer' || path.includes('/transformer')) return 'TRANSFORMER';
    if (title === 'LT Panel' || path.includes('/lt-panel')) return 'LT_PANEL';
    if (title === 'HVAC' || path.includes('/hvac') || title === 'VRV' || path.includes('/vrv') || title === 'AC' || path.includes('/ac')) return 'HVAC';
    if (title === 'Fire' || title === 'ACMS' || path.includes('/fire') || path.includes('/fire-pumps') || path.includes('/acms')) return 'FIRE_PUMP';
    if (title === 'AQI Sensor' || title === 'AQI' || path.includes('/aqi-sensor') || path.includes('/aqi')) return 'AQI_SENSOR';
    return null;
  }, [moduleHeader?.title, pathname]);

  // Check if current tab is a site-wide overview (e.g. Water Management, Motors, Overview, Sub Meters, Graphs, Reports) where device selection is unnecessary
  const isSiteOnlyMode = useMemo(() => {
    const path = (pathname || (typeof window !== 'undefined' ? window.location.pathname : '')).toLowerCase();
    const title = (moduleHeader?.title || '').toLowerCase();
    
    // Modules that target individual sub-devices (like DG Set with generators, Main Energy Meter, or AQI individual sensor):
    const isDeviceTargetedModule = 
      title === 'dg set' || path.includes('/dg-set') ||
      path.includes('/energy-metering/main') ||
      path.includes('/aqi-sensor/overview');

    if (isDeviceTargetedModule) {
      return false;
    }

    // All other modules operate at site level (Water Management, Motors, Energy Overview, Sub Meters, Graphs, Reports, Daily DPR, LT Panel, Transformer, HVAC, VRV, AC, Fire, Alarms):
    return true;
  }, [pathname, moduleHeader?.title]);

  // Derive plural asset label
  const assetLabel = useMemo(() => {
    if (currentCategory === 'MAIN_ENERGY_METER') return 'Main Meters';
    if (currentCategory === 'SUB_ENERGY_METER') return 'Sub Meters';
    if (currentCategory === 'ENERGY_METER') return 'Meters';
    if (currentCategory === 'GENERATOR') return 'DGs';
    if (currentCategory === 'WATER') return 'Tanks / Pumps';
    if (currentCategory === 'MOTOR') return 'Motors';
    if (currentCategory === 'TRANSFORMER') return 'Transformers';
    if (currentCategory === 'LT_PANEL') return 'Panels';
    if (currentCategory === 'HVAC') return 'ACs';
    if (currentCategory === 'FIRE_PUMP') return 'Fire Pumps';
    if (currentCategory === 'AQI_SENSOR') return 'AQI Sensors';
    return 'Devices';
  }, [currentCategory]);

  const [isOpen, setIsOpen] = useState(false);
  const [activePanelSiteId, setActivePanelSiteId] = useState(null);
  const [devicesBySiteCategory, setDevicesBySiteCategory] = useState({});
  const [loadingSitesMap, setLoadingSitesMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Module-specific device key helper
  const getDeviceStorageKey = useCallback((category) => {
    if (category === 'MAIN_ENERGY_METER') return 'selected_main_meter_id';
    if (category === 'SUB_ENERGY_METER') return 'selected_sub_meter_id';
    if (category === 'GENERATOR') return 'selected_dg_device_id';
    if (category === 'AQI_SENSOR') return 'selected_aqi_sensor_id';
    if (category) return `selected_${category.toLowerCase()}_device_id`;
    return 'selected_device_id';
  }, []);

  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return localStorage.getItem(getDeviceStorageKey(currentCategory)) || '';
  });

  // Sync selectedDeviceId whenever module category changes
  useEffect(() => {
    const key = getDeviceStorageKey(currentCategory);
    const saved = localStorage.getItem(key) || '';
    setSelectedDeviceId(saved);
  }, [currentCategory, getDeviceStorageKey]);

  const dropdownRef = useRef(null);

  // Helper to generate module-scoped cache key
  const getCacheKey = useCallback((siteId, category) => {
    return `${String(siteId)}__${category || 'ALL'}`;
  }, []);

  // Render category icon
  const renderAssetIcon = useCallback((size = 14) => {
    if (currentCategory === 'MAIN_ENERGY_METER' || currentCategory === 'SUB_ENERGY_METER' || currentCategory === 'ENERGY_METER') {
      return <Zap size={size} className="text-warning" />;
    }
    if (currentCategory === 'GENERATOR') return <DgGeneratorIcon size={size} />;
    if (currentCategory === 'WATER') return <Droplets size={size} className="text-info" />;
    if (currentCategory === 'MOTOR') return <Activity size={size} className="text-success" />;
    if (currentCategory === 'TRANSFORMER') return <Zap size={size} className="text-primary" />;
    if (currentCategory === 'LT_PANEL') return <LayoutDashboard size={size} className="text-info" />;
    if (currentCategory === 'HVAC') return <Thermometer size={size} className="text-cyan" />;
    if (currentCategory === 'FIRE_PUMP') return <Flame size={size} className="text-danger" />;
    if (currentCategory === 'AQI_SENSOR') return <Wind size={size} className="text-info" />;
    return <Cpu size={size} className="text-info" />;
  }, [currentCategory]);

  // Fetch devices for a specific site scoped strictly to currentCategory
  const fetchDevicesForSite = useCallback(async (siteId, forceRefresh = false) => {
    if (!siteId || isSiteOnlyMode) return;
    const sId = String(siteId);
    const cacheKey = getCacheKey(sId, currentCategory);

    // Skip if already cached in memory for this module category
    if (!forceRefresh && devicesBySiteCategory[cacheKey] !== undefined) {
      return;
    }

    setLoadingSitesMap((prev) => ({ ...prev, [cacheKey]: true }));

    const siteDeviceList = [];
    const seenIds = new Set();

    const addDevice = (d) => {
      if (!d) return;
      const devId = String(d.id || d.deviceId || d._id || '').trim();
      if (!devId || seenIds.has(devId)) return;

      const devSiteId = d.siteId !== undefined && d.siteId !== null ? String(d.siteId) : null;
      if (devSiteId && devSiteId !== sId) return;

      // Strict category check
      if (!isDeviceMatchingCategory(d, currentCategory)) {
        return;
      }

      seenIds.add(devId);
      siteDeviceList.push({
        ...d,
        id: devId,
        name: d.name || d.deviceName || d.label || d.title || `${assetLabel.slice(0, -1)} ${siteDeviceList.length + 1}`,
        category: d.category || currentCategory || 'DEVICE'
      });
    };

    try {
      // 1. Primary API: bmsService.getSiteDevices(sId, { category })
      const queryParams = {};
      if (currentCategory === 'MAIN_ENERGY_METER') {
        queryParams.category = 'MAIN_ENERGY_METER';
      } else if (currentCategory === 'SUB_ENERGY_METER') {
        queryParams.category = 'SUB_ENERGY_METER';
      } else if (currentCategory) {
        queryParams.category = currentCategory;
      }

      const res = await bmsService.getSiteDevices(sId, queryParams).catch(() => null);
      const list = normalizeList(res, 'devices');
      if (Array.isArray(list)) list.forEach(addDevice);
    } catch (e) {}

    try {
      // 2. Fallback /devices endpoint via apiClient (benefits from auto 401 retry)
      const params = { siteId: sId };
      if (currentCategory === 'MAIN_ENERGY_METER') {
        params.category = 'MAIN_ENERGY_METER';
      } else if (currentCategory === 'SUB_ENERGY_METER') {
        params.category = 'SUB_ENERGY_METER';
      } else if (currentCategory) {
        params.category = currentCategory;
      }

      const res = await bmsService.getDevices(params).catch(() => null);
      const list = normalizeList(res, 'devices');
      if (Array.isArray(list)) list.forEach(addDevice);
    } catch (e) {}

    // 3. Fallback check local storage items
    const localKeys = ['dg_generator_devices', 'scada_devices_db', 'bms_registered_devices', 'scada_device_mappings', 'tb_devices'];
    localKeys.forEach((k) => {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          arr.forEach(addDevice);
        }
      } catch (e) {}
    });

    setDevicesBySiteCategory((prev) => ({ ...prev, [cacheKey]: siteDeviceList }));
    setLoadingSitesMap((prev) => ({ ...prev, [cacheKey]: false }));
  }, [currentCategory, assetLabel, devicesBySiteCategory, getCacheKey]);

  // Initial fetch for the active selected site when site or category changes
  useEffect(() => {
    const curSiteId = String(getSiteId(selectedSite) || getSiteId(activeSites[0]) || '');
    if (curSiteId) {
      fetchDevicesForSite(curSiteId);
    }
  }, [selectedSite, activeSites, currentCategory, fetchDevicesForSite]);

  // Re-fetch on auth refresh or site updates
  useEffect(() => {
    const handleRefreshEvent = () => {
      const curSiteId = String(getSiteId(selectedSite) || getSiteId(activeSites[0]) || '');
      if (curSiteId) {
        fetchDevicesForSite(curSiteId, true);
      }
    };

    window.addEventListener('bms_auth_refreshed', handleRefreshEvent);
    window.addEventListener('bms_sites_updated', handleRefreshEvent);
    return () => {
      window.removeEventListener('bms_auth_refreshed', handleRefreshEvent);
      window.removeEventListener('bms_sites_updated', handleRefreshEvent);
    };
  }, [selectedSite, activeSites, fetchDevicesForSite]);

  // Listen to external device change events
  useEffect(() => {
    const handleDeviceEvent = (e) => {
      if (e.detail?.deviceId) {
        setSelectedDeviceId(String(e.detail.deviceId));
      }
    };
    window.addEventListener('scada_device_changed', handleDeviceEvent);
    return () => window.removeEventListener('scada_device_changed', handleDeviceEvent);
  }, []);

  // Click outside & Escape key listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Dropdown toggle on click
  const handleToggle = (e) => {
    if (e) e.stopPropagation();
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        const initSiteId = String(getSiteId(selectedSite) || getSiteId(activeSites[0]) || '');
        setActivePanelSiteId(initSiteId);
        setSearchQuery('');
        if (initSiteId) {
          fetchDevicesForSite(initSiteId);
        }
      }
      return next;
    });
  };

  // Click handler when user selects a site in the left panel
  const handleSiteClick = (siteId) => {
    const sId = String(siteId);
    setActivePanelSiteId(sId);
    fetchDevicesForSite(sId);
  };

  // Device selection handler
  const handleSelectDevice = (site, device) => {
    if (site && setSelectedSite) setSelectedSite(site);

    const devId = String(device.id || device.deviceId || '');
    setSelectedDeviceId(devId);

    const storageKey = getDeviceStorageKey(currentCategory);
    localStorage.setItem(storageKey, devId);
    localStorage.setItem('selected_device_id', devId);

    window.dispatchEvent(new CustomEvent('scada_device_changed', {
      detail: {
        deviceId: devId,
        device,
        siteId: String(getSiteId(site)),
        module: moduleHeader?.title,
        category: currentCategory
      }
    }));

    if (onDeviceSelect) onDeviceSelect(device, site);
    setIsOpen(false);
  };

  // Site-only selection handler (used in Sub Meters tab or direct site clicks)
  const handleSelectSiteOnly = (site) => {
    if (!site) return;
    if (setSelectedSite) setSelectedSite(site);

    const sId = String(getSiteId(site));
    try {
      localStorage.setItem('selected_site_id', sId);
      localStorage.setItem('selected_site', JSON.stringify(site));
    } catch (e) {}

    if (isSiteOnlyMode) {
      // In Sub Meters tab: page shows all submeters of the site, no single device selected
      setSelectedDeviceId('');
      const storageKey = getDeviceStorageKey(currentCategory);
      localStorage.removeItem(storageKey);
      localStorage.removeItem('selected_device_id');

      window.dispatchEvent(new CustomEvent('scada_device_changed', {
        detail: {
          deviceId: '',
          device: null,
          siteId: sId,
          site,
          module: moduleHeader?.title,
          category: currentCategory
        }
      }));
      window.dispatchEvent(new CustomEvent('site_changed', {
        detail: { siteId: sId, site }
      }));
      setIsOpen(false);
      return;
    }

    // Otherwise (single-device modules): default to first device if available
    const cacheKey = getCacheKey(sId, currentCategory);
    const devices = devicesBySiteCategory[cacheKey] || [];

    if (devices.length > 0) {
      handleSelectDevice(site, devices[0]);
    } else {
      setSelectedDeviceId('');
      const storageKey = getDeviceStorageKey(currentCategory);
      localStorage.removeItem(storageKey);
      localStorage.removeItem('selected_device_id');
      window.dispatchEvent(new CustomEvent('scada_device_changed', {
        detail: {
          deviceId: '',
          device: null,
          siteId: sId,
          site,
          module: moduleHeader?.title,
          category: currentCategory
        }
      }));
      window.dispatchEvent(new CustomEvent('site_changed', {
        detail: { siteId: sId, site }
      }));
      setIsOpen(false);
    }
  };

  // Effective sites list with persistent fallback to selectedSite / cache
  const effectiveSites = useMemo(() => {
    if (activeSites && activeSites.length > 0) return activeSites;
    if (selectedSite) return [selectedSite];
    try {
      const stored = localStorage.getItem('scada_selected_site');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.id ?? parsed.siteId ?? parsed._id)) return [parsed];
      }
      const storedDb = localStorage.getItem('scada_sites_db');
      if (storedDb) {
        const parsedDb = JSON.parse(storedDb);
        if (Array.isArray(parsedDb) && parsedDb.length > 0) return parsedDb;
      }
    } catch (e) {}
    return [];
  }, [activeSites, selectedSite]);

  // Computed state for active panel site & its devices
  const activePanelSiteObj = useMemo(() => {
    return effectiveSites.find((s) => String(getSiteId(s)) === String(activePanelSiteId)) || selectedSite || effectiveSites[0];
  }, [effectiveSites, activePanelSiteId, selectedSite]);

  const activePanelDevices = useMemo(() => {
    if (!activePanelSiteObj || isSiteOnlyMode) return [];
    const sId = String(getSiteId(activePanelSiteObj));
    const cacheKey = getCacheKey(sId, currentCategory);
    return devicesBySiteCategory[cacheKey] || [];
  }, [activePanelSiteObj, currentCategory, devicesBySiteCategory, getCacheKey, isSiteOnlyMode]);

  const activePanelCacheKey = activePanelSiteObj ? getCacheKey(getSiteId(activePanelSiteObj), currentCategory) : '';
  const isCurrentSiteLoading = Boolean(loadingSitesMap[activePanelCacheKey]);

  // Filter sites by search query
  const filteredSites = useMemo(() => {
    if (!searchQuery.trim()) return effectiveSites;
    const q = searchQuery.toLowerCase().trim();
    return effectiveSites.filter((site) => {
      const sName = (site.name || site.siteName || '').toLowerCase();
      if (sName.includes(q)) return true;
      if (isSiteOnlyMode) return false;
      const sId = String(getSiteId(site));
      const cacheKey = getCacheKey(sId, currentCategory);
      const devs = devicesBySiteCategory[cacheKey] || [];
      return devs.some((d) => (d.name || d.deviceName || '').toLowerCase().includes(q));
    });
  }, [effectiveSites, searchQuery, currentCategory, devicesBySiteCategory, getCacheKey, isSiteOnlyMode]);

  // Filter devices in right panel by search query
  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return activePanelDevices;
    const q = searchQuery.toLowerCase().trim();
    return activePanelDevices.filter((d) => (d.name || d.deviceName || '').toLowerCase().includes(q));
  }, [activePanelDevices, searchQuery]);

  // Resolve current active device for capsule display in header
  const currentSelectedSiteId = String(getSiteId(selectedSite) || '');
  const currentSiteCacheKey = getCacheKey(currentSelectedSiteId, currentCategory);
  const currentSiteDevices = devicesBySiteCategory[currentSiteCacheKey] || [];
  const currentActiveDeviceObj = useMemo(() => {
    if (isSiteOnlyMode || !currentSiteDevices || currentSiteDevices.length === 0) return null;
    if (selectedDeviceId) {
      const found = currentSiteDevices.find((d) => String(d.id || d.deviceId) === String(selectedDeviceId));
      if (found) return found;
    }
    return currentSiteDevices[0];
  }, [selectedDeviceId, currentSiteDevices, isSiteOnlyMode]);

  if (!effectiveSites || effectiveSites.length === 0) return null;

  return (
    <div 
      className="global-site-select-wrap position-relative" 
      ref={dropdownRef}
    >
      {/* ── 1. Header Capsule Button (Click to toggle) ── */}
      <button
        type="button"
        onClick={handleToggle}
        className={`global-site-cascading-toggle d-flex align-items-center justify-content-between ${isOpen ? 'active' : ''}`}
        aria-expanded={isOpen}
        title={isSiteOnlyMode ? "Click to select Site" : "Click to select Site & Device"}
      >
        <div className="d-flex align-items-center gap-1.5 overflow-hidden me-1">
          <Building2 size={15} className="global-site-icon flex-shrink-0 text-cyan" />
          <span className="global-site-current-name text-truncate">
            {selectedSite?.name || selectedSite?.siteName || (getSiteId(selectedSite) ? `Site ${getSiteId(selectedSite)}` : 'Select Site')}
          </span>
          {!isSiteOnlyMode && currentActiveDeviceObj && (
            <>
              <span className="global-site-divider opacity-50 px-0.5">›</span>
              <span className="global-device-current-name d-flex align-items-center gap-1 text-truncate">
                {renderAssetIcon(13)}
                <span className="text-truncate">{currentActiveDeviceObj.name}</span>
              </span>
            </>
          )}
        </div>
        <ChevronDown size={14} className={`global-site-chevron flex-shrink-0 ms-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ── 2. Cascading Menu (Click-only interaction) ── */}
      {isOpen && (
        <div 
          className={`global-cascading-menu-container open shadow-2xl ${isSiteOnlyMode ? 'site-only-mode' : ''}`}
          style={isSiteOnlyMode ? { width: '300px', maxWidth: '90vw' } : {}}
        >
          {/* Search Bar */}
          <div className="global-cascading-search-box p-2.5 border-bottom border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-dark bg-opacity-75 border border-secondary border-opacity-30">
              <Search size={13} className="text-muted flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSiteOnlyMode ? "Search site..." : `Search site or ${assetLabel.toLowerCase()}...`}
                className="bg-transparent border-0 text-white fs-12 w-100 shadow-none"
                style={{ outline: 'none' }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                  className="btn btn-link p-0 text-muted fs-11 text-decoration-none"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Conditional Layout: Single-Column for Site-Only Mode, Two-Column Split for Device Modes */}
          {isSiteOnlyMode ? (
            /* SINGLE-PANEL SITE SELECTOR (FOR SUB METERS) */
            <div className="d-flex flex-column w-100">
              <div className="global-cascading-panel-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom border-secondary border-opacity-20">
                <span className="text-uppercase tracking-wider fs-11 fw-bold text-muted">Select Site</span>
                <span className="badge bg-secondary bg-opacity-30 text-white fs-10 px-1.5 py-0.5 rounded-pill">
                  {filteredSites.length} Sites
                </span>
              </div>
              <div className="global-cascading-list-scroll p-1.5" style={{ maxHeight: '300px' }}>
                {filteredSites.length === 0 ? (
                  <div className="text-muted text-center py-4 fs-12">No matching site</div>
                ) : (
                  filteredSites.map((site) => {
                    const sId = String(getSiteId(site));
                    const isGloballySelected = String(getSiteId(selectedSite)) === sId;

                    return (
                      <button
                        key={sId}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSiteOnly(site);
                        }}
                        className={`global-cascading-asset-item w-100 d-flex align-items-center justify-content-between p-2 rounded-2 text-start transition-all mb-1 border-0 ${isGloballySelected ? 'active' : ''}`}
                      >
                        <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                          <Building2 size={15} className={`flex-shrink-0 ${isGloballySelected ? 'text-cyan' : 'text-muted'}`} />
                          <span className="global-cascading-item-name text-truncate fs-12 fw-medium">
                            {site.name || site.siteName || `Site ${sId}`}
                          </span>
                        </div>
                        {isGloballySelected ? (
                          <div className="global-cascading-active-pill d-flex align-items-center gap-1 px-2 py-0.5 rounded-pill flex-shrink-0">
                            <Check size={12} className="stroke-2 flex-shrink-0" />
                            <span className="fs-10 fw-bold">Active</span>
                          </div>
                        ) : (
                          <span className="global-cascading-select-hint fs-10 text-muted opacity-50 pe-1">
                            Select
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* TWO-COLUMN SPLIT LAYOUT (FOR DEVICE-BASED MODULES) */
            <div className="d-flex global-cascading-body" style={{ minHeight: '280px' }}>
              {/* LEFT PANEL: SITES LIST */}
              <div className="global-cascading-sites-panel">
                <div className="global-cascading-panel-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom border-secondary border-opacity-20">
                  <span className="text-uppercase tracking-wider fs-11 fw-bold text-muted">Sites</span>
                  <span className="badge bg-secondary bg-opacity-30 fs-10 px-1.5 py-0.5 rounded-pill">
                    {filteredSites.length}
                  </span>
                </div>
                <div className="global-cascading-list-scroll">
                  {filteredSites.length === 0 ? (
                    <div className="text-muted text-center py-4 fs-12">No matching site</div>
                  ) : (
                    filteredSites.map((site) => {
                      const sId = String(getSiteId(site));
                      const isPanelActive = String(activePanelSiteId) === sId;
                      const isGloballySelected = String(getSiteId(selectedSite)) === sId;
                      const cacheKey = getCacheKey(sId, currentCategory);
                      const siteDevs = devicesBySiteCategory[cacheKey];
                      const hasLoaded = Array.isArray(siteDevs);
                      const devCount = hasLoaded ? siteDevs.length : null;

                      return (
                        <div
                          key={sId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSiteClick(sId);
                          }}
                          className={`global-cascading-site-item d-flex align-items-center justify-content-between px-3 py-2.5 ${isPanelActive ? 'active' : ''}`}
                          title={`Click to view ${site.name || 'Site'} ${assetLabel.toLowerCase()}`}
                        >
                          <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                            <Building2 size={15} className={`flex-shrink-0 ${isPanelActive || isGloballySelected ? 'text-cyan' : 'text-muted'}`} />
                            <span className="global-cascading-item-name text-truncate fs-12 fw-medium">
                              {site.name || site.siteName || `Site ${sId}`}
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                            {devCount !== null ? (
                              devCount > 0 ? (
                                <span className="badge bg-cyan-subtle text-cyan fs-10 px-2 py-0.5 rounded-pill border border-cyan-glow">
                                  {devCount}
                                </span>
                              ) : (
                                <span className="badge bg-dark text-muted fs-10 px-1.5 py-0.5 rounded-pill opacity-60">
                                  0
                                </span>
                              )
                            ) : (
                              <span className="badge bg-dark text-muted fs-10 px-1.5 py-0.5 rounded-pill opacity-40">
                                •
                              </span>
                            )}
                            <ChevronRight size={13} className={`global-cascading-chevron-right ${isPanelActive ? 'active text-cyan' : 'opacity-40'}`} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT PANEL: DYNAMICALLY FETCHED DEVICES FOR CLICKED SITE */}
              <div className="global-cascading-assets-panel flex-grow-1 border-start border-secondary border-opacity-20">
                {/* Header with Site Name and Select Site Pill */}
                <div className="global-cascading-panel-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom border-secondary border-opacity-20">
                  <div className="d-flex align-items-center gap-1.5 overflow-hidden me-2">
                    <Building2 size={13} className="text-cyan flex-shrink-0" />
                    <span className="global-cascading-panel-title text-truncate fs-12 fw-bold" title={activePanelSiteObj?.name}>
                      {activePanelSiteObj?.name || 'Selected Site'}
                    </span>
                    <span className="badge bg-secondary bg-opacity-25 text-info fs-10 px-2 py-0.5 rounded-pill ms-1 flex-shrink-0">
                      {activePanelDevices.length} {assetLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSiteOnly(activePanelSiteObj);
                    }}
                    className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-0.5 fs-11 fw-semibold text-nowrap select-site-pill-btn"
                    title={`Select ${activePanelSiteObj?.name || 'this site'}`}
                  >
                    Select Site
                  </button>
                </div>

                {/* Content Area: Loader, Empty State, or Device Items */}
                <div className="global-cascading-list-scroll p-2">
                  {isCurrentSiteLoading ? (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                      <Loader2 size={24} className="text-cyan animate-spin mb-2" />
                      <span className="fs-12 text-light">Loading {assetLabel.toLowerCase()}...</span>
                    </div>
                  ) : activePanelDevices.length === 0 ? (
                    <div className="global-cascading-empty text-center py-4 px-3">
                      <div className="p-3 d-inline-flex rounded-circle bg-dark bg-opacity-50 border border-secondary border-opacity-25 mb-2">
                        <Cpu size={26} className="text-muted opacity-60" />
                      </div>
                      <div className="global-cascading-panel-title fs-13 fw-semibold mb-1">No {assetLabel} Mapped</div>
                      <div className="fs-11 text-muted mb-3">
                        No {assetLabel.toLowerCase()} registered under {activePanelSiteObj?.name || 'this site'}.
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSiteOnly(activePanelSiteObj);
                        }}
                        className="btn btn-sm btn-outline-info rounded-pill px-3 py-1 fs-11 fw-medium"
                      >
                        Select {activePanelSiteObj?.name || 'Site'}
                      </button>
                    </div>
                  ) : filteredDevices.length === 0 ? (
                    <div className="text-muted text-center py-4 fs-12">
                      No {assetLabel.toLowerCase()} match "{searchQuery}"
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-1">
                      {filteredDevices.map((dev, idx) => {
                        const dId = String(dev.id || dev.deviceId || idx);
                        const isDevActive = String(selectedDeviceId) === dId && String(getSiteId(selectedSite)) === String(getSiteId(activePanelSiteObj));

                        return (
                          <button
                            key={dId}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectDevice(activePanelSiteObj, dev);
                            }}
                            className={`global-cascading-asset-item w-100 d-flex align-items-center justify-content-between p-2 rounded-2 text-start transition-all ${isDevActive ? 'active' : ''}`}
                          >
                            <div className="d-flex align-items-center gap-2.5 overflow-hidden me-2">
                              <div className={`global-cascading-asset-icon-box d-flex align-items-center justify-content-center rounded-2 ${isDevActive ? 'active' : ''}`}>
                                {renderAssetIcon(14)}
                              </div>
                              <div className="d-flex flex-column overflow-hidden">
                                <span className="global-cascading-item-name text-truncate fs-12 fw-medium">
                                  {dev.name || dev.deviceName || `${assetLabel.slice(0, -1)} ${idx + 1}`}
                                </span>
                                <span className="fs-10 text-muted text-truncate opacity-75">
                                  {dev.category || currentCategory || assetLabel} {isDevActive ? '• Selected' : ''}
                                </span>
                              </div>
                            </div>
                            {isDevActive ? (
                              <div className="global-cascading-active-pill d-flex align-items-center gap-1 px-2 py-0.5 rounded-pill flex-shrink-0">
                                <Check size={12} className="stroke-2 flex-shrink-0" />
                                <span className="fs-10 fw-bold">Active</span>
                              </div>
                            ) : (
                              <span className="global-cascading-select-hint fs-10 text-muted opacity-50 pe-1">
                                Select
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. Component Styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .global-site-select-wrap {
          position: relative;
          z-index: 1050;
        }
        .global-site-cascading-toggle {
          background-color: rgba(15, 23, 42, 0.75) !important;
          border: 1px solid rgba(56, 189, 248, 0.25) !important;
          border-radius: 9999px !important;
          padding: 5px 12px !important;
          color: #f8fafc !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          max-width: 320px;
          height: 32px;
        }
        .global-site-cascading-toggle:hover,
        .global-site-cascading-toggle.active {
          background-color: rgba(30, 41, 59, 0.95) !important;
          border-color: #38bdf8 !important;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
        }
        .rotate-180 {
          transform: rotate(180deg);
        }
        .transition-transform {
          transition: transform 0.2s ease;
        }
        .text-cyan {
          color: #38bdf8 !important;
        }
        .border-cyan-glow {
          border-color: rgba(56, 189, 248, 0.4) !important;
        }
        .bg-cyan-subtle {
          background-color: rgba(56, 189, 248, 0.15) !important;
        }

        /* Popover Menu Container */
        .global-cascading-menu-container {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          width: 540px;
          max-width: 90vw;
          background: #081024 !important;
          border: 1px solid rgba(56, 189, 248, 0.25) !important;
          border-radius: 12px !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.15);
          overflow: hidden;
          z-index: 1060;
          animation: menuFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Sites Panel */
        .global-cascading-sites-panel {
          width: 220px;
          flex-shrink: 0;
          background-color: rgba(0, 0, 0, 0.2);
        }
        .global-cascading-list-scroll {
          max-height: 280px;
          overflow-y: auto;
        }
        .global-cascading-list-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .global-cascading-list-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }

        /* Site Item (Hover is CSS only; active state on click) */
        .global-cascading-site-item {
          cursor: pointer;
          border-left: 3px solid transparent;
          transition: background-color 0.15s ease;
        }
        .global-cascading-site-item:hover {
          background-color: rgba(56, 189, 248, 0.08);
        }
        .global-cascading-site-item.active {
          background-color: rgba(56, 189, 248, 0.15) !important;
          border-left-color: #38bdf8 !important;
        }
        .global-cascading-site-item.active .global-cascading-item-name {
          color: #38bdf8 !important;
          font-weight: 600 !important;
        }

        /* Asset Item */
        .global-cascading-asset-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
        }
        .global-cascading-asset-item:hover {
          background: rgba(56, 189, 248, 0.08) !important;
          border-color: rgba(56, 189, 248, 0.3) !important;
        }
        .global-cascading-asset-item.active {
          background: rgba(56, 189, 248, 0.15) !important;
          border-color: #38bdf8 !important;
        }
        .global-cascading-asset-icon-box {
          width: 28px;
          height: 28px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }
        .global-cascading-asset-icon-box.active {
          background: rgba(56, 189, 248, 0.2);
          border-color: #38bdf8;
        }
        .select-site-pill-btn {
          font-size: 10.5px !important;
          padding: 2px 8px !important;
          height: 22px;
          display: inline-flex;
          align-items: center;
        }

        /* Active Status Pill */
        .global-cascading-active-pill {
          background-color: rgba(34, 197, 94, 0.2) !important;
          color: #4ade80 !important;
          border: 1px solid rgba(34, 197, 94, 0.5) !important;
        }
        .global-cascading-item-name {
          color: #f8fafc;
        }
        .global-cascading-panel-title {
          color: #f8fafc;
        }

        /* Light mode support */
        body.light-mode .global-site-cascading-toggle,
        [data-theme="light"] .global-site-cascading-toggle {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }
        body.light-mode .global-site-cascading-toggle:hover,
        body.light-mode .global-site-cascading-toggle.active,
        [data-theme="light"] .global-site-cascading-toggle:hover,
        [data-theme="light"] .global-site-cascading-toggle.active {
          background-color: #f8fafc !important;
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
        }
        body.light-mode .global-site-current-name,
        [data-theme="light"] .global-site-current-name {
          color: #0f172a !important;
        }
        body.light-mode .global-device-current-name,
        [data-theme="light"] .global-device-current-name {
          color: #0284c7 !important;
        }
        body.light-mode .global-site-divider,
        [data-theme="light"] .global-site-divider {
          color: #94a3b8 !important;
        }
        body.light-mode .global-site-chevron,
        [data-theme="light"] .global-site-chevron {
          color: #64748b !important;
        }
        body.light-mode .global-device-badge-empty,
        [data-theme="light"] .global-device-badge-empty {
          color: #64748b !important;
        }
        body.light-mode .text-cyan,
        [data-theme="light"] .text-cyan {
          color: #0284c7 !important;
        }
        body.light-mode .border-cyan-glow,
        [data-theme="light"] .border-cyan-glow {
          border-color: rgba(2, 132, 199, 0.3) !important;
        }
        body.light-mode .bg-cyan-subtle,
        [data-theme="light"] .bg-cyan-subtle {
          background-color: rgba(2, 132, 199, 0.1) !important;
        }

        /* Popover in Light Mode */
        body.light-mode .global-cascading-menu-container,
        [data-theme="light"] .global-cascading-menu-container {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.05);
        }
        body.light-mode .global-cascading-search-box,
        [data-theme="light"] .global-cascading-search-box {
          border-bottom-color: #e2e8f0 !important;
        }
        body.light-mode .global-cascading-search-box > div,
        [data-theme="light"] .global-cascading-search-box > div {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .global-cascading-search-box input,
        [data-theme="light"] .global-cascading-search-box input {
          color: #0f172a !important;
        }
        body.light-mode .global-cascading-search-box input::placeholder,
        [data-theme="light"] .global-cascading-search-box input::placeholder {
          color: #94a3b8 !important;
        }
        body.light-mode .global-cascading-sites-panel,
        [data-theme="light"] .global-cascading-sites-panel {
          background-color: #f8fafc !important;
          border-right-color: #e2e8f0 !important;
        }
        body.light-mode .global-cascading-panel-header,
        [data-theme="light"] .global-cascading-panel-header {
          border-bottom-color: #e2e8f0 !important;
        }
        body.light-mode .global-cascading-panel-header span,
        [data-theme="light"] .global-cascading-panel-header span {
          color: #475569 !important;
        }
        body.light-mode .global-cascading-panel-title,
        [data-theme="light"] .global-cascading-panel-title {
          color: #0f172a !important;
        }
        body.light-mode .global-cascading-site-item,
        [data-theme="light"] .global-cascading-site-item {
          color: #334155;
        }
        body.light-mode .global-cascading-site-item:hover,
        [data-theme="light"] .global-cascading-site-item:hover {
          background-color: #f1f5f9 !important;
        }
        body.light-mode .global-cascading-site-item.active,
        [data-theme="light"] .global-cascading-site-item.active {
          background-color: #e0f2fe !important;
          border-left-color: #0284c7 !important;
        }
        body.light-mode .global-cascading-site-item.active .global-cascading-item-name,
        [data-theme="light"] .global-cascading-site-item.active .global-cascading-item-name {
          color: #0284c7 !important;
        }
        body.light-mode .global-cascading-site-item .global-cascading-item-name,
        [data-theme="light"] .global-cascading-site-item .global-cascading-item-name {
          color: #0f172a !important;
        }
        body.light-mode .global-cascading-assets-panel,
        [data-theme="light"] .global-cascading-assets-panel {
          border-left-color: #e2e8f0 !important;
        }
        body.light-mode .global-cascading-asset-item,
        [data-theme="light"] .global-cascading-asset-item {
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .global-cascading-asset-item:hover,
        [data-theme="light"] .global-cascading-asset-item:hover {
          background: #f0f9ff !important;
          border-color: #0284c7 !important;
        }
        body.light-mode .global-cascading-asset-item.active,
        [data-theme="light"] .global-cascading-asset-item.active {
          background: #e0f2fe !important;
          border-color: #0284c7 !important;
        }
        body.light-mode .global-cascading-asset-item .global-cascading-item-name,
        [data-theme="light"] .global-cascading-asset-item .global-cascading-item-name {
          color: #0f172a !important;
        }
        body.light-mode .global-cascading-asset-icon-box,
        [data-theme="light"] .global-cascading-asset-icon-box {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        body.light-mode .global-cascading-asset-icon-box.active,
        [data-theme="light"] .global-cascading-asset-icon-box.active {
          background: #bae6fd;
          border-color: #0284c7;
        }
        body.light-mode .global-cascading-active-pill,
        [data-theme="light"] .global-cascading-active-pill {
          background-color: #dcfce7 !important;
          color: #15803d !important;
          border-color: #86efac !important;
        }
      `}} />
    </div>
  );
};

export default GlobalSiteAssetDropdown;
