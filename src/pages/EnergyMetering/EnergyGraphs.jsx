import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import {
  Zap,
  Activity,
  Clock,
  RefreshCw,
  Sliders,
  Cpu,
  AlertTriangle,
  Search,
  Calendar
} from 'lucide-react';
import PageContextBanner from '../../components/PageContextBanner';
import PdfButton from '../../components/PdfButton';
import { useSiteStore } from '../../hooks/useSiteStore';
import { useDeviceStatus } from '../../hooks/useDeviceStatus';
import { bmsService } from '../../services/bmsService';
import { getApiUrl } from '../../utils/apiConfig';
import { getAuthHeaders, normalizeList } from '../../services/apiClient';
import { MAIN_METER_FIELDS_METADATA } from './utils/energyTelemetry';
import { normalizeKey } from './utils/energyTelemetryAdapter';
import './EnergyGraphs.css';

import {
  SAMPLING_INTERVALS,
  RANGE_PRESETS,
  GRAPH_PALETTES,
  parseUtcDate,
  calculateDateRange,
  formatTimestampLabel,
  formatTooltipWindow,
  formatVal,
  isCumulativeSetting,
  getTodayIstDateString
} from '../../utils/scadaGraphUtils';
import TelemetryGraphCard from '../../components/graphs/TelemetryGraphCard';
import TelemetryGraphModal from '../../components/graphs/TelemetryGraphModal';
import ScadaToolbar from '../../components/graphs/ScadaToolbar';


/**
 * Main EnergyGraphs Component
 */
const EnergyGraphs = () => {
  const { sites, selectedSite, setSelectedSite } = useSiteStore();
  const { getOverallStatus } = useDeviceStatus();

  // Sites state
  const [routeSites, setRouteSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    const globalId = selectedSite ? String(selectedSite.id ?? selectedSite.siteId ?? selectedSite._id ?? '') : '';
    return globalId || localStorage.getItem('selected_main_meter_site_id') || '';
  });

  // Devices state
  const [siteDevices, setSiteDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return localStorage.getItem('selected_main_meter_id') || '';
  });

  // Filter and view states
  const [activeInterval, setActiveInterval] = useState('HOURLY');
  const [rangePreset, setRangePreset] = useState('last24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [gridColumns, setGridColumns] = useState(2); // 1 = wide, 2 = grid

  // Custom Date Range state — pending (input-bound) vs applied (fetch-bound)
  // Inputs update freely; fetch only fires when Apply is clicked.
  const _defaultStart = () => {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  };
  const [customStartDate, setCustomStartDate] = useState(_defaultStart);
  const [customEndDate, setCustomEndDate] = useState(getTodayIstDateString);
  // Applied dates — only updated by Apply button; these drive the telemetry fetch.
  const [appliedStartDate, setAppliedStartDate] = useState(_defaultStart);
  const [appliedEndDate, setAppliedEndDate] = useState(getTodayIstDateString);

  // Telemetry API state
  const [telemetryData, setTelemetryData] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  const [telemetryError, setTelemetryError] = useState(null);

  // Per-setting individual overrides (allows updating only selected event without whole-page refresh)
  const [settingOverrides, setSettingOverrides] = useState({});

  // Modal Expand state: track setting object and style
  const [expandedSetting, setExpandedSetting] = useState(null);
  const [expandedChartType, setExpandedChartType] = useState('area');
  const [expandedColorScheme, setExpandedColorScheme] = useState(GRAPH_PALETTES[0]);

  // Stale request race condition prevention token
  const requestIdRef = useRef(0);

  // 1. Fetch available sites
  useEffect(() => {
    let isMounted = true;
    const fetchSites = async () => {
      try {
        const res = await bmsService.getSites().catch(() => null);
        const list = normalizeList(res, 'sites');
        if (isMounted && list && list.length > 0) {
          setRouteSites(list);
          try {
            localStorage.setItem('scada_sites_db', JSON.stringify(list));
          } catch (e) {}
          return;
        }
      } catch (err) {
        console.warn('bmsService.getSites notice in EnergyGraphs:', err);
      }

      // Fallback direct proxy fetch
      try {
        const url = getApiUrl('/sites');
        const res = await fetch(url, { headers: getAuthHeaders() }).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          const list = normalizeList(json, 'sites');
          if (isMounted && list && list.length > 0) {
            setRouteSites(list);
            try {
              localStorage.setItem('scada_sites_db', JSON.stringify(list));
            } catch (e) {}
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch sites in EnergyGraphs:', err);
      }

      if (isMounted && sites && sites.length > 0) {
        setRouteSites(sites);
      }
    };

    fetchSites();
    return () => { isMounted = false; };
  }, [sites]);

  const allSites = useMemo(() => {
    if (routeSites && routeSites.length > 0) return routeSites;
    if (sites && sites.length > 0) return sites;
    return [];
  }, [routeSites, sites]);

  // Synchronize local site filter with global selectedSite from SiteContext
  useEffect(() => {
    if (!allSites || allSites.length === 0) return;

    const globalSiteId = selectedSite ? String(selectedSite.id ?? selectedSite.siteId ?? selectedSite._id ?? '') : '';
    if (globalSiteId) {
      if (String(selectedSiteId) !== globalSiteId) {
        setSelectedSiteId(globalSiteId);
        localStorage.setItem('selected_main_meter_site_id', globalSiteId);
      }
    } else {
      const match = allSites.find(s => String(s.id ?? s.siteId ?? s._id ?? '') === String(selectedSiteId)) || allSites[0];
      const matchId = String(match.id ?? match.siteId ?? match._id ?? '');
      if (String(selectedSiteId) !== matchId) {
        setSelectedSiteId(matchId);
        localStorage.setItem('selected_main_meter_site_id', matchId);
      }
      if (setSelectedSite) setSelectedSite(match);
    }
  }, [selectedSite, allSites, setSelectedSite]);

  // 2. Fetch devices for selected site
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDevices([]);
      setSelectedDeviceId('');
      setTelemetryData(null);
      setTelemetryError(null);
      setSettingOverrides({});
      return;
    }

    let isMounted = true;
    const fetchSiteDevices = async () => {
      setDevicesLoading(true);
      setTelemetryData(null);
      setTelemetryError(null);
      setSettingOverrides({});

      try {
        let items = [];

        // Try site-scoped device listing
        try {
          const siteDevRes = await bmsService.getSiteDevices(selectedSiteId, {
            include: 'settings,rules,profile',
            limit: 100
          });
          items = normalizeList(siteDevRes, 'devices');
        } catch (err) {
          console.warn('getSiteDevices notice:', err);
        }

        // Fallback to cross-site endpoint with siteId filter if needed
        if (!items || items.length === 0) {
          try {
            const queryParams = new URLSearchParams({
              siteId: String(selectedSiteId),
              include: 'settings,rules,profile',
              limit: '100'
            });
            const url = getApiUrl(`/devices?${queryParams.toString()}`);
            const res = await fetch(url, {
              method: 'GET',
              headers: getAuthHeaders()
            });
            if (res && res.ok) {
              const json = await res.json();
              items = normalizeList(json, 'devices');
            }
          } catch (fallbackErr) {
            console.warn('Fallback /devices query error:', fallbackErr);
          }
        }

        // Fallback local storage check if no devices returned from API
        if (!items || items.length === 0) {
          const localKeys = ['scada_devices_db', 'bms_registered_devices', 'scada_device_mappings', 'tb_devices'];
          localKeys.forEach(k => {
            try {
              const raw = localStorage.getItem(k);
              if (raw) {
                const parsed = JSON.parse(raw);
                const arr = Array.isArray(parsed) ? parsed : [parsed];
                items.push(...arr);
              }
            } catch (e) {}
          });
        }

        if (isMounted) {
          // Resilient site filter matching ID, siteId, _id, or name
          const validSiteIds = [
            selectedSiteId,
            selectedSite?.id,
            selectedSite?.siteId,
            selectedSite?._id,
            selectedSite?.name,
            selectedSite?.siteName
          ].filter(Boolean).map(s => String(s).toLowerCase().trim());

          const siteFilteredItems = items.filter(d => {
            if (!d) return false;
            const devSiteId = d.siteId ?? d.site_id;
            if (devSiteId !== undefined && devSiteId !== null && String(devSiteId).trim() !== '') {
              return validSiteIds.includes(String(devSiteId).toLowerCase().trim());
            }
            return true;
          });

          // Filter for Energy Meter devices
          const energyCategories = ['MAIN_ENERGY_METER', 'SUB_ENERGY_METER', 'ENERGY_METER', 'LT_PANEL', 'METER'];
          const filtered = siteFilteredItems.filter(d => {
            const cat = String(d.category || '').toUpperCase();
            const tmpl = String(d.templateName || '').toUpperCase();
            const name = String(d.name || '').toUpperCase();
            return energyCategories.includes(cat) || tmpl.includes('METER') || name.includes('METER') || cat.includes('METER');
          });

          const finalDevices = filtered.length > 0 ? filtered : siteFilteredItems;
          setSiteDevices(finalDevices);

          if (finalDevices.length > 0) {
            const savedId = localStorage.getItem('selected_main_meter_id');
            const existsInList = finalDevices.some(d => String(d.id || d.deviceId) === String(savedId));
            const chosenId = existsInList ? String(savedId) : String(finalDevices[0].id || finalDevices[0].deviceId);
            setSelectedDeviceId(chosenId);
            localStorage.setItem('selected_main_meter_id', chosenId);
          } else {
            setSelectedDeviceId('');
            localStorage.removeItem('selected_main_meter_id');
          }
        }
      } catch (err) {
        console.warn('Error fetching devices in EnergyGraphs:', err);
        if (isMounted) {
          setSiteDevices([]);
          setSelectedDeviceId('');
        }
      } finally {
        if (isMounted) setDevicesLoading(false);
      }
    };

    fetchSiteDevices();
    return () => { isMounted = false; };
  }, [selectedSiteId, selectedSite]);

  // Listen for global device changes from GlobalSiteAssetDropdown
  useEffect(() => {
    const handleDeviceEvent = (e) => {
      if (e.detail?.deviceId) {
        setSelectedDeviceId(String(e.detail.deviceId));
      }
    };
    window.addEventListener('scada_device_changed', handleDeviceEvent);
    return () => window.removeEventListener('scada_device_changed', handleDeviceEvent);
  }, []);

  // Selected device object
  const selectedDevice = useMemo(() => {
    if (!siteDevices || siteDevices.length === 0) return null;
    return siteDevices.find(d => String(d.id || d.deviceId) === String(selectedDeviceId)) || siteDevices[0];
  }, [siteDevices, selectedDeviceId]);

  // Check online status of selected device
  const isDeviceOnline = useMemo(() => {
    if (!selectedDevice) return false;
    const devId = selectedDevice.id || selectedDevice.deviceId;
    const gatewayUuid = selectedDevice.gatewayUuid || selectedDevice.device?.gatewayUuid;

    if (devId && getOverallStatus) {
      const isOnline = getOverallStatus(devId, gatewayUuid);
      if (isOnline) return true;
    }

    if (selectedDevice.status) {
      const s = String(selectedDevice.status).toUpperCase();
      if (s === 'ONLINE' || s === 'ACTIVE') return true;
      if (s === 'OFFLINE' || s === 'INACTIVE' || s === 'DISABLED') return false;
    }

    if (selectedDevice.lastSeenAt) {
      const lastSeenMs = (parseUtcDate(selectedDevice.lastSeenAt) || new Date(0)).getTime();
      if (Math.abs(Date.now() - lastSeenMs) < 5 * 60 * 1000) return true;
    }

    return false;
  }, [selectedDevice, getOverallStatus]);

  // Keep telemetryData in a ref so fetchTelemetrySnapshots does not re-create on data update
  const telemetryDataRef = useRef(telemetryData);
  useEffect(() => {
    telemetryDataRef.current = telemetryData;
  }, [telemetryData]);

  // 3a. Device-Wide Telemetry Snapshots Fetch (Page level)
  const fetchTelemetrySnapshots = useCallback(async (customInterval, customRange) => {
    if (!selectedSiteId || !selectedDeviceId) {
      setTelemetryData(null);
      setTelemetryLoading(false);
      setIsBackgroundFetching(false);
      return;
    }

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    const targetInterval = (customInterval && typeof customInterval === 'string') ? customInterval : activeInterval;
    const targetRange = (customRange && typeof customRange === 'string') ? customRange : rangePreset;

    // If initial load, show full loading. If range/interval change, do background refresh without wiping existing cards
    if (!telemetryDataRef.current) {
      setTelemetryLoading(true);
    } else {
      setIsBackgroundFetching(true);
    }
    setTelemetryError(null);

    try {
      const { from, to } = calculateDateRange(targetRange, appliedStartDate, appliedEndDate);
      const params = {
        interval: targetInterval,
        from,
        to,
        limit: 1000
      };

      const res = await bmsService.getDeviceTelemetrySnapshots(selectedSiteId, selectedDeviceId, params);

      // Guard against stale responses from previous device or site
      if (requestIdRef.current !== currentRequestId) return;

      if (res && (res.success || res.data)) {
        setTelemetryData(res.data || res);
        // Clear individual overrides on page-wide interval/range change
        setSettingOverrides({});
      } else {
        setTelemetryData({ settings: [], settingsCount: 0 });
      }
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;
      console.error('Error retrieving telemetry snapshots:', err);
      setTelemetryError(err?.message || 'Failed to fetch device telemetry snapshots. Please try again.');
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setTelemetryLoading(false);
        setIsBackgroundFetching(false);
      }
    }
  }, [selectedSiteId, selectedDeviceId, activeInterval, rangePreset, appliedStartDate, appliedEndDate]);

  // Trigger telemetry fetch on site, device, interval, or rangePreset changes
  useEffect(() => {
    fetchTelemetrySnapshots();
  }, [fetchTelemetrySnapshots]);

  // Handlers for toolbar range and interval clicks
  const handleRangeChange = (preset) => {
    if (rangePreset === preset.id && (!preset.defaultInterval || activeInterval === preset.defaultInterval)) {
      fetchTelemetrySnapshots();
      return;
    }
    setRangePreset(preset.id);
    if (preset.defaultInterval) {
      setActiveInterval(preset.defaultInterval);
    }
  };

  const handleIntervalChange = (newInterval) => {
    if (activeInterval === newInterval) {
      fetchTelemetrySnapshots();
      return;
    }
    setActiveInterval(newInterval);
  };

  // 3b. Individual fetch for a single setting (event) using settingId
  // Only the selected event data changes without refreshing the whole page
  const fetchIndividualSettingSnapshots = useCallback(async (targetSetting, targetInterval, targetRange, customStart, customEnd) => {
    if (!selectedSiteId || !selectedDeviceId || !targetSetting) return;

    setModalLoading(true);
    setModalError(null);

    try {
      const activeStart = customStart || modalCustomStartDate;
      const activeEnd = customEnd || modalCustomEndDate;
      const { from, to } = calculateDateRange(targetRange, activeStart, activeEnd);
      const params = {
        interval: targetInterval,
        from,
        to,
        limit: 1000
      };

      // Supply settingId (numeric ID) OR fieldKey as per OpenAPI spec
      if (targetSetting.settingId && !isNaN(Number(targetSetting.settingId))) {
        params.settingId = Number(targetSetting.settingId);
      } else if (targetSetting.fieldKey) {
        params.fieldKey = targetSetting.fieldKey;
      }

      const res = await bmsService.getDeviceTelemetrySnapshots(selectedSiteId, selectedDeviceId, params);
      const dataObj = res?.data || res || {};
      const newSnapshots = dataObj.snapshots || (Array.isArray(dataObj.settings) && dataObj.settings[0]?.snapshots) || [];

      setModalSnapshots(newSnapshots);

      // Save into settingOverrides so the card on the grid also updates without full page refresh
      const sKey = targetSetting.settingId ? `id:${targetSetting.settingId}` : (targetSetting.fieldKey ? `key:${targetSetting.fieldKey}` : `name:${targetSetting.displayName}`);
      setSettingOverrides(prev => ({
        ...prev,
        [sKey]: {
          snapshots: newSnapshots,
          interval: targetInterval,
          rangePreset: targetRange
        }
      }));
    } catch (err) {
      console.error('Error fetching individual setting telemetry:', err);
      setModalError(err?.message || 'Failed to fetch telemetry for this parameter.');
    } finally {
      setModalLoading(false);
    }
  }, [selectedSiteId, selectedDeviceId]);

  // 4. Resolve Eligible Configured Settings and Map Snapshots
  const eligibleSettings = useMemo(() => {
    if (!selectedDevice) return [];

    // Create telemetry lookup map by settingId and by fieldKey
    const telemetryMap = new Map();
    const apiSettings = telemetryData?.settings || [];
    if (Array.isArray(apiSettings)) {
      apiSettings.forEach(s => {
        if (s.settingId !== undefined && s.settingId !== null) {
          telemetryMap.set(`id:${s.settingId}`, s);
        }
        if (s.fieldKey) {
          telemetryMap.set(`key:${s.fieldKey}`, s);
        }
      });
    }

    // A. Gather settings configured on device (filtering out command-only settings)
    const configuredSettings = (selectedDevice.settings || []).filter(s => {
      if (s.isCommand === true && s.isTelemetry === false) return false;
      return true;
    });

    const settingsMap = new Map();

    // Add device configured settings
    configuredSettings.forEach(s => {
      const sId = s.id || s.settingId;
      const stableKey = sId ? `id:${sId}` : (s.sochiotFieldName ? `key:${s.sochiotFieldName}` : `name:${s.displayName}`);
      
      // Look up telemetry snapshots using stable identifiers
      const sNameNorm = normalizeKey(s.displayName || s.name);
      const tel = (sId ? telemetryMap.get(`id:${sId}`) : null) ||
                  (s.sochiotFieldName ? telemetryMap.get(`key:${s.sochiotFieldName}`) : null) ||
                  (sNameNorm ? apiSettings.find(a => normalizeKey(a.displayName) === sNameNorm) : null);

      // Check metadata for friendly default units if missing
      const meta = MAIN_METER_FIELDS_METADATA.find(m =>
        m.key === s.sochiotFieldName ||
        normalizeKey(m.label) === sNameNorm
      );

      settingsMap.set(stableKey, {
        settingId: sId,
        fieldKey: s.sochiotFieldName || s.fieldName || (tel?.fieldKey) || '',
        displayName: s.displayName || s.name || (tel?.displayName) || 'Telemetry Parameter',
        unit: s.unit || (tel?.unit) || (meta?.unit) || '',
        isCumulative: tel?.isCumulative !== undefined ? tel.isCumulative : isCumulativeSetting(s),
        snapshots: tel?.snapshots || []
      });
    });

    // B. Also include any settings present in telemetry response not already captured
    apiSettings.forEach(apiS => {
      const stableKey = apiS.settingId ? `id:${apiS.settingId}` : (apiS.fieldKey ? `key:${apiS.fieldKey}` : `name:${apiS.displayName}`);
      if (!settingsMap.has(stableKey)) {
        settingsMap.set(stableKey, {
          settingId: apiS.settingId,
          fieldKey: apiS.fieldKey || '',
          displayName: apiS.displayName || 'Telemetry Parameter',
          unit: apiS.unit || '',
          isCumulative: apiS.isCumulative || false,
          snapshots: apiS.snapshots || []
        });
      }
    });

    const allSettings = Array.from(settingsMap.values());

    // Sort to prioritize settings with actual telemetry data, then primary load/energy metrics
    allSettings.sort((a, b) => {
      const aHasData = (a.snapshots && a.snapshots.length > 0) ? 1 : 0;
      const bHasData = (b.snapshots && b.snapshots.length > 0) ? 1 : 0;
      if (bHasData !== aHasData) return bHasData - aHasData;

      const isPriorityParam = (s) => {
        const name = (s.displayName || '').toUpperCase();
        return name.includes('KWH') || name.includes('LOAD') || name.includes('KW') || name.includes('ENERGY') || name.includes('VOLTAGE') || name.includes('CURRENT');
      };
      const aPri = isPriorityParam(a) ? 1 : 0;
      const bPri = isPriorityParam(b) ? 1 : 0;
      return bPri - aPri;
    });

    return allSettings;
  }, [selectedDevice, telemetryData]);


  // Filter settings by user search input
  const filteredSettings = useMemo(() => {
    if (!searchTerm.trim()) return eligibleSettings;
    const query = searchTerm.toLowerCase().trim();
    return eligibleSettings.filter(s =>
      s.displayName.toLowerCase().includes(query) ||
      (s.fieldKey && s.fieldKey.toLowerCase().includes(query)) ||
      (s.unit && s.unit.toLowerCase().includes(query))
    );
  }, [eligibleSettings, searchTerm]);

  // Header Ribbon Selectors
  const siteSelector = useMemo(() => {
    const siteOptions = (allSites && allSites.length > 0)
      ? allSites.map(s => ({
          value: String(s.id || s._id || s.siteId),
          label: s.name || s.siteName || s.title || `Site ${s.id}`
        }))
      : [{ value: '1', label: 'Main Facility Site' }];

    const currentVal = String(selectedSiteId || siteOptions[0]?.value || '');

    return {
      value: currentVal,
      options: siteOptions,
      onChange: (newId) => {
        const idStr = String(newId);
        if (!idStr || idStr === String(selectedSiteId)) return;
        setSelectedSiteId(idStr);
        localStorage.setItem('selected_main_meter_site_id', idStr);
        const found = allSites?.find(s => String(s.id ?? s._id ?? s.siteId ?? '') === idStr);
        if (found && setSelectedSite) setSelectedSite(found);
      },
      ariaLabel: 'Select Site'
    };
  }, [allSites, selectedSiteId, setSelectedSite]);

  const deviceSelector = useMemo(() => {
    if (devicesLoading) {
      return {
        value: '',
        options: [{ value: '', label: 'Loading devices...' }],
        disabled: true,
        ariaLabel: 'Loading devices'
      };
    }

    if (!siteDevices || siteDevices.length === 0) {
      return {
        value: '',
        options: [{ value: '', label: 'No devices configured' }],
        disabled: true,
        ariaLabel: 'No devices configured'
      };
    }

    // Deduplicate devices by ID
    const uniqueDevices = [];
    const seen = new Set();
    for (const d of siteDevices) {
      const id = String(d.id || d.deviceId || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const name = d.name || d.deviceName || d.title || d.serialNumber || `Meter (${id})`;
      uniqueDevices.push({ id, name });
    }

    const meterOptions = uniqueDevices.map(d => ({
      value: d.id,
      label: d.name
    }));

    const currentVal = (selectedDeviceId && meterOptions.some(m => String(m.value) === String(selectedDeviceId)))
      ? String(selectedDeviceId)
      : (meterOptions[0]?.value || '');

    return {
      value: currentVal,
      options: meterOptions,
      onChange: (newId) => {
        if (!newId || newId === selectedDeviceId) return;
        setSelectedDeviceId(newId);
        localStorage.setItem('selected_main_meter_id', String(newId));
      },
      ariaLabel: 'Select Meter Device',
      disabled: false
    };
  }, [siteDevices, devicesLoading, selectedDeviceId]);

  // Meter device options array for ScadaToolbar
  const meterDeviceOptions = useMemo(() => {
    if (!siteDevices || siteDevices.length === 0) return [];
    const unique = [];
    const seen = new Set();
    for (const d of siteDevices) {
      const id = String(d.id || d.deviceId || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const name = d.name || d.deviceName || d.title || d.serialNumber || `Meter (${id})`;
      unique.push({ value: id, label: name });
    }
    return unique;
  }, [siteDevices]);

  const isDeviceConfigured = Boolean(siteDevices && siteDevices.length > 0);

  // Range preset and active interval labels for banner metadata
  const currentRangeLabel = useMemo(() => {
    return RANGE_PRESETS.find(p => p.id === rangePreset)?.label || 'Last 24 Hours';
  }, [rangePreset]);

  const activeIntervalLabel = useMemo(() => {
    return SAMPLING_INTERVALS.find(i => i.value === activeInterval)?.label || activeInterval;
  }, [activeInterval]);

  // Handle expand graph modal with stable callback reference
  const handleOpenExpandModal = useCallback((setting, type, color) => {
    setExpandedSetting(setting);
    setExpandedChartType(type || 'area');
    setExpandedColorScheme(color || GRAPH_PALETTES[0]);
  }, []);

  const handleCloseExpandModal = useCallback(() => {
    setExpandedSetting(null);
  }, []);

  return (
    <div className="fade-in energy-graphs-workspace">
      {/* ── 1. Reusable PageContextBanner ── */}
      <PageContextBanner
        title={selectedDevice ? (selectedDevice.name || selectedDevice.deviceName || 'Energy Meter') : 'Energy Meter Graphs'}
        icon={<Zap className={isDeviceConfigured ? "text-warning" : "text-secondary"} size={22} />}
        status={isDeviceConfigured ? (isDeviceOnline ? 'ONLINE' : 'OFFLINE') : 'NOT CONFIGURED'}
        siteSelector={siteSelector}
        deviceSelector={deviceSelector}
        metadata={[
          {
            icon: <Clock size={15} />,
            label: `${activeIntervalLabel} • ${currentRangeLabel} (IST)`
          },
          ...(eligibleSettings.length > 0 ? [{
            icon: <Activity size={15} />,
            label: `${eligibleSettings.length} ${eligibleSettings.length === 1 ? 'Graph' : 'Graphs'}`
          }] : [])
        ]}
        actions={[
          <Button
            key="refresh-btn"
            variant="outline-info"
            size="sm"
            className="context-banner-action-btn d-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill fs-8 fw-semibold"
            onClick={fetchTelemetrySnapshots}
            disabled={telemetryLoading || isBackgroundFetching || !selectedDeviceId}
            title="Refresh Snapshots"
          >
            <RefreshCw size={14} className={(telemetryLoading || isBackgroundFetching) ? "spin-animation" : ""} />
            <span>{(telemetryLoading || isBackgroundFetching) ? 'Refreshing...' : 'Refresh'}</span>
          </Button>,
          <PdfButton
            key="pdf-export"
            label=""
            title="Download PDF Report"
            variant="custom"
            className="context-banner-action-btn p-1 border-0"
            disabled={!isDeviceConfigured}
          />
        ]}
        enableFullscreen={true}
        variant="scada"
        className="energy-graphs-context-banner"
      />

      {/* ── 2. Filter & Controls Toolbar ── */}
      {isDeviceConfigured && (
        <ScadaToolbar
          deviceOptions={meterDeviceOptions}
          selectedDeviceId={selectedDeviceId}
          selectedDeviceName={selectedDevice ? (selectedDevice.name || selectedDevice.deviceName || `Meter #${selectedDeviceId}`) : ''}
          onDeviceChange={(newId) => {
            if (!newId || String(newId) === String(selectedDeviceId)) return;
            setSelectedDeviceId(String(newId));
            localStorage.setItem('selected_main_meter_id', String(newId));
            window.dispatchEvent(new CustomEvent('scada_device_changed', { detail: { deviceId: String(newId) } }));
          }}
          deviceLoading={devicesLoading}
          rangePresets={RANGE_PRESETS}
          rangePreset={rangePreset}
          onRangeChange={handleRangeChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomStartChange={setCustomStartDate}
          onCustomEndChange={setCustomEndDate}
          onApplyCustom={() => {
            setAppliedStartDate(customStartDate);
            setAppliedEndDate(customEndDate);
          }}
          intervals={SAMPLING_INTERVALS}
          activeInterval={activeInterval}
          onIntervalChange={handleIntervalChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          gridColumns={gridColumns}
          onGridColumnsChange={setGridColumns}
          loading={telemetryLoading}
          getTodayIst={getTodayIstDateString}
        />
      )}

      {/* ── 3. Main Content / Empty & Error State Handling ── */}

      {/* Case A: No devices configured for selected site */}
      {!devicesLoading && !isDeviceConfigured && (
        <div className="energy-empty-state-card energy-empty-state-darkened">
          <Cpu className="text-secondary opacity-50 mb-3" size={56} />
          <h4 className="text-white fw-bold mb-2">No devices configured for this site</h4>
          <p className="text-secondary fs-7 mx-auto" style={{ maxWidth: '520px' }}>
            There are currently no energy meters configured for the selected site.
            Please configure or provision energy devices under Site Management or select a different site.
          </p>
        </div>
      )}

      {/* Case D: API Error State */}
      {isDeviceConfigured && telemetryError && !telemetryData && (
        <Card className="border-danger border-opacity-25 bg-danger bg-opacity-10 p-4 mb-4 text-center">
          <div className="d-flex flex-column align-items-center gap-2">
            <AlertTriangle className="text-danger" size={40} />
            <h5 className="text-danger fw-bold mb-1">Failed to load telemetry snapshots</h5>
            <p className="text-secondary fs-7 mb-3">{telemetryError}</p>
            <Button variant="outline-danger" size="sm" onClick={fetchTelemetrySnapshots} className="rounded-pill px-3 py-1.5 fw-bold">
              <RefreshCw size={14} className="me-2" /> Retry Request
            </Button>
          </div>
        </Card>
      )}

      {/* Case D: Initial Loading State */}
      {isDeviceConfigured && telemetryLoading && !telemetryData && (
        <div className="d-flex flex-column justify-content-center align-items-center py-5 my-5">
          <Spinner animation="border" variant="info" style={{ width: '3.2rem', height: '3.2rem' }} className="mb-3" />
          <h5 className="text-info fw-bold tracking-widest uppercase fs-6" style={{ letterSpacing: '2px' }}>
            Retrieving Device Snapshots...
          </h5>
          <small className="text-secondary opacity-60">
            Querying periodic telemetry snapshots for {selectedDevice?.name || 'device'}
          </small>
        </div>
      )}

      {/* Case B: Device exists, but has no settings/events configured */}
      {isDeviceConfigured && !telemetryLoading && !telemetryError && eligibleSettings.length === 0 && (
        <div className="energy-empty-state-card">
          <Sliders className="text-secondary opacity-50 mb-3" size={56} />
          <h4 className="text-white fw-bold mb-2">No settings/events configured for this device</h4>
          <p className="text-secondary fs-7 mx-auto" style={{ maxWidth: '520px' }}>
            {selectedDevice?.name || 'The selected meter'} has no active telemetry parameters or event mappings configured.
            Please map telemetry settings to view dynamic graphs.
          </p>
        </div>
      )}

      {/* Case C: Dynamic Telemetry Graphs Grid (Settings exist) */}
      {isDeviceConfigured && eligibleSettings.length > 0 && (
        <>
          {filteredSettings.length === 0 ? (
            <div className="energy-empty-state-card py-5">
              <Search className="text-secondary opacity-40 mb-2" size={36} />
              <h5 className="text-white fs-6 fw-bold mb-1">No matching parameters found</h5>
              <p className="text-secondary fs-8 mb-2">No graphs match &quot;{searchTerm}&quot;.</p>
              <Button variant="outline-info" size="sm" onClick={() => setSearchTerm('')} className="rounded-pill px-3 py-1 fs-8">
                Clear Filter
              </Button>
            </div>
          ) : (
            <Row className="g-3">
              {filteredSettings.map((setting, idx) => {
                const palette = GRAPH_PALETTES[idx % GRAPH_PALETTES.length];
                const key = setting.settingId ? `set-${setting.settingId}` : `fld-${setting.fieldKey || idx}`;
                const sKey = setting.settingId ? `id:${setting.settingId}` : (setting.fieldKey ? `key:${setting.fieldKey}` : `name:${setting.displayName}`);
                const override = settingOverrides[sKey];
                const cardSetting = override ? { ...setting, snapshots: override.snapshots } : setting;
                const cardInterval = override?.interval || activeInterval;
                const cardRange = override?.rangePreset || rangePreset;

                return (
                  <Col
                    key={key}
                    xs={12}
                    lg={gridColumns === 1 ? 12 : 6}
                    className="fade-in-slide"
                    style={{ animationDelay: `${Math.min(idx * 0.05, 0.4)}s` }}
                  >
                    <TelemetryGraphCard
                      setting={cardSetting}
                      interval={cardInterval}
                      rangePreset={cardRange}
                      colorScheme={palette}
                      onExpand={handleOpenExpandModal}
                      height={250}
                    />
                  </Col>
                );
              })}
            </Row>
          )}
        </>
      )}

      {/* ── 4. Expand Graph Modal (Common Reusable Component) ── */}
      <TelemetryGraphModal
        show={Boolean(expandedSetting)}
        onHide={handleCloseExpandModal}
        setting={expandedSetting}
        siteId={selectedSiteId}
        deviceId={selectedDeviceId}
        initialInterval={activeInterval}
        initialRangePreset={rangePreset}
        initialCustomStartDate={customStartDate}
        initialCustomEndDate={customEndDate}
        initialChartType={expandedChartType}
        colorScheme={expandedColorScheme}
        intervals={SAMPLING_INTERVALS}
        rangePresets={RANGE_PRESETS}
      />
    </div>
  );
};

export {
  TelemetryGraphCard,
  TelemetryGraphModal,
  SAMPLING_INTERVALS,
  RANGE_PRESETS,
  GRAPH_PALETTES,
  parseUtcDate,
  calculateDateRange,
  formatTimestampLabel,
  formatTooltipWindow,
  formatVal,
  isCumulativeSetting
};

export default EnergyGraphs;
