import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Row, Col, Card, Button, Form, Modal, Spinner, InputGroup } from 'react-bootstrap';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  Zap,
  Activity,
  Clock,
  Search,
  Maximize2,
  X,
  RefreshCw,
  Sliders,
  Cpu,
  AlertTriangle,
  Grid,
  Columns
} from 'lucide-react';
import PageContextBanner from '../../components/PageContextBanner';
import PdfButton from '../../components/PdfButton';
import { useSiteStore } from '../../context/SiteContext';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
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
  isCumulativeSetting
} from '../../utils/scadaGraphUtils';
import TelemetryGraphCard, { ScadaTooltip } from '../../components/graphs/TelemetryGraphCard';


/**
 * Main EnergyGraphs Component
 */
const EnergyGraphs = () => {
  const { sites, selectedSite, setSelectedSite } = useSiteStore();
  const { getOverallStatus } = useDeviceStatus();

  // Sites state
  const [routeSites, setRouteSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    return localStorage.getItem('selected_main_meter_site_id') || '';
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

  // Telemetry API state
  const [telemetryData, setTelemetryData] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  const [telemetryError, setTelemetryError] = useState(null);

  // Per-setting individual overrides (allows updating only selected event without whole-page refresh)
  const [settingOverrides, setSettingOverrides] = useState({});

  // Modal Expand state: track setting object and setting key
  const [expandedSetting, setExpandedSetting] = useState(null);
  const [expandedSettingKey, setExpandedSettingKey] = useState(null);
  const [expandedChartType, setExpandedChartType] = useState('area');
  const [expandedColorScheme, setExpandedColorScheme] = useState(GRAPH_PALETTES[0]);

  // Dedicated modal controls state (independent of main page)
  const [modalInterval, setModalInterval] = useState('HOURLY');
  const [modalRangePreset, setModalRangePreset] = useState('last24h');
  const [modalSnapshots, setModalSnapshots] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

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

  // Synchronize initial selected site
  useEffect(() => {
    if (allSites.length > 0) {
      const match = allSites.find(s => String(s.id || s.siteId || s._id) === String(selectedSiteId));
      if (!match) {
        const firstId = String(allSites[0].id || allSites[0].siteId || allSites[0]._id);
        setSelectedSiteId(firstId);
        localStorage.setItem('selected_main_meter_site_id', firstId);
        if (setSelectedSite) setSelectedSite(allSites[0]);
      } else {
        if (setSelectedSite && selectedSite?.id !== match.id) setSelectedSite(match);
      }
    }
  }, [allSites, selectedSiteId, setSelectedSite, selectedSite]);

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

        if (isMounted) {
          // Filter for Energy Meter devices
          const energyCategories = ['MAIN_ENERGY_METER', 'SUB_ENERGY_METER', 'ENERGY_METER'];
          const filtered = items.filter(d => {
            const cat = String(d.category || '').toUpperCase();
            const tmpl = String(d.templateName || '').toUpperCase();
            const name = String(d.name || '').toUpperCase();
            return energyCategories.includes(cat) || tmpl.includes('METER') || name.includes('METER') || cat.includes('METER');
          });

          const finalDevices = filtered.length > 0 ? filtered : items;
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
  }, [selectedSiteId]);

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
      const { from, to } = calculateDateRange(targetRange);
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
  }, [selectedSiteId, selectedDeviceId, activeInterval, rangePreset]);

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
  const fetchIndividualSettingSnapshots = useCallback(async (targetSetting, targetInterval, targetRange) => {
    if (!selectedSiteId || !selectedDeviceId || !targetSetting) return;

    setModalLoading(true);
    setModalError(null);

    try {
      const { from, to } = calculateDateRange(targetRange);
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

    return Array.from(settingsMap.values());
  }, [selectedDevice, telemetryData]);

  // Derive active expanded setting dynamically from eligibleSettings
  const activeExpandedSetting = useMemo(() => {
    if (!expandedSettingKey) return expandedSetting;
    return eligibleSettings.find(s => {
      const key = s.settingId ? `id:${s.settingId}` : (s.fieldKey ? `key:${s.fieldKey}` : `name:${s.displayName}`);
      return key === expandedSettingKey;
    }) || expandedSetting;
  }, [eligibleSettings, expandedSettingKey, expandedSetting]);

  // Modal setting data combining active setting and latest modal snapshots
  const modalSettingData = useMemo(() => {
    if (!activeExpandedSetting) return null;
    return {
      ...activeExpandedSetting,
      snapshots: modalSnapshots,
      interval: modalInterval,
      rangePreset: modalRangePreset
    };
  }, [activeExpandedSetting, modalSnapshots, modalInterval, modalRangePreset]);

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

    const currentVal = selectedSiteId || siteOptions[0]?.value;

    return {
      value: currentVal,
      options: siteOptions,
      onChange: (newId) => {
        if (!newId || newId === selectedSiteId) return;
        setSelectedSiteId(newId);
        localStorage.setItem('selected_main_meter_site_id', String(newId));
        const found = allSites?.find(s => String(s.id || s._id || s.siteId) === String(newId));
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
    const key = setting.settingId ? `id:${setting.settingId}` : (setting.fieldKey ? `key:${setting.fieldKey}` : `name:${setting.displayName}`);
    const override = settingOverrides[key];
    const initialInterval = override?.interval || activeInterval;
    const initialRange = override?.rangePreset || rangePreset;
    const initialSnaps = override?.snapshots || setting.snapshots || [];

    setExpandedSettingKey(key);
    setExpandedSetting(setting);
    setExpandedChartType(type);
    setExpandedColorScheme(color);
    setModalInterval(initialInterval);
    setModalRangePreset(initialRange);
    setModalSnapshots(initialSnaps);
    setModalError(null);
  }, [settingOverrides, activeInterval, rangePreset]);

  const handleCloseExpandModal = useCallback(() => {
    setExpandedSetting(null);
    setExpandedSettingKey(null);
    setModalError(null);
  }, []);

  // Modal Range Selector change: individual fetch by settingId
  const handleModalRangeChange = (newPreset) => {
    setModalRangePreset(newPreset);
    const p = RANGE_PRESETS.find(x => x.id === newPreset);
    const newInterval = p?.defaultInterval || modalInterval;
    if (p?.defaultInterval) {
      setModalInterval(newInterval);
    }
    if (activeExpandedSetting) {
      fetchIndividualSettingSnapshots(activeExpandedSetting, newInterval, newPreset);
    }
  };

  // Modal Interval Selector change: individual fetch by settingId
  const handleModalIntervalChange = (newInterval) => {
    setModalInterval(newInterval);
    if (activeExpandedSetting) {
      fetchIndividualSettingSnapshots(activeExpandedSetting, newInterval, modalRangePreset);
    }
  };

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
        <div className="energy-graphs-toolbar d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Left: Range Presets */}
          <div className="energy-toolbar-group">
            <span className="text-secondary fs-8 fw-bold uppercase tracking-wider me-1">Range:</span>
            {RANGE_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                className={`energy-filter-btn ${rangePreset === preset.id ? 'active' : ''}`}
                onClick={() => handleRangeChange(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Middle: Sampling Interval Buttons */}
          <div className="energy-toolbar-group">
            <span className="text-secondary fs-8 fw-bold uppercase tracking-wider me-1">Interval:</span>
            {SAMPLING_INTERVALS.map(int => (
              <button
                key={int.value}
                type="button"
                className={`energy-filter-btn ${activeInterval === int.value ? 'active' : ''}`}
                onClick={() => handleIntervalChange(int.value)}
              >
                {int.label}
              </button>
            ))}
          </div>

          {/* Right: Quick Search Filter & Layout Toggle */}
          <div className="energy-toolbar-group ms-auto">
            <div style={{ width: '220px' }}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-dark border-secondary border-opacity-25 text-secondary pe-1">
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Filter parameters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="energy-search-input"
                />
                {searchTerm && (
                  <Button
                    variant="dark"
                    className="border-secondary border-opacity-25 text-secondary p-1"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={14} />
                  </Button>
                )}
              </InputGroup>
            </div>

            {/* Grid Columns Toggle */}
            <div className="btn-group btn-group-sm ms-1" role="group" aria-label="Layout Grid Toggle">
              <Button
                variant={gridColumns === 2 ? 'info' : 'outline-secondary'}
                className="py-1 px-2"
                onClick={() => setGridColumns(2)}
                title="2-Column Grid"
              >
                <Grid size={15} />
              </Button>
              <Button
                variant={gridColumns === 1 ? 'info' : 'outline-secondary'}
                className="py-1 px-2"
                onClick={() => setGridColumns(1)}
                title="1-Column Full Width"
              >
                <Columns size={15} />
              </Button>
            </div>
          </div>
        </div>
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

      {/* ── 4. Expand Graph Modal ── */}
      {modalSettingData && (
        <Modal
          show={Boolean(modalSettingData)}
          onHide={handleCloseExpandModal}
          size="xl"
          centered
          dialogClassName="modal-95w scada-expanded-modal"
        >
          <Modal.Header
            className="border-secondary border-opacity-25 p-3 px-4"
            style={{ background: '#0b1120' }}
          >
            <Modal.Title className="text-white w-100 d-flex flex-wrap justify-content-between align-items-center gap-3">
              {/* Left: Title & Identifiers */}
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: '5px', height: '26px', background: expandedColorScheme.stroke, borderRadius: '3px', boxShadow: `0 0 10px ${expandedColorScheme.stroke}88` }} />
                <div>
                  <h5 className="mb-0 fw-bold text-white fs-5">
                    {modalSettingData.displayName}
                  </h5>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    {modalSettingData.fieldKey && (
                      <span className="scada-graph-tag">{modalSettingData.fieldKey}</span>
                    )}
                    {modalSettingData.unit && (
                      <span className="scada-graph-unit">{modalSettingData.unit}</span>
                    )}
                    <span className="scada-graph-tag text-info border-info border-opacity-25" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                      IST (UTC+5:30)
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Range & Interval Selectors (Individual Fetch by settingId), Chart Type Switcher, and Close Button */}
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* Interactive Range Selector for this individual event */}
                <div className="d-flex align-items-center gap-1.5">
                  <span className="text-secondary fs-8 fw-bold text-uppercase tracking-wider">Range:</span>
                  <Form.Select
                    size="sm"
                    className="energy-modal-select"
                    value={modalRangePreset}
                    onChange={(e) => handleModalRangeChange(e.target.value)}
                    disabled={modalLoading}
                    style={{ width: '130px' }}
                  >
                    {RANGE_PRESETS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </Form.Select>
                </div>

                {/* Interactive Time-Interval Selector for this individual event */}
                <div className="d-flex align-items-center gap-1.5">
                  <span className="text-secondary fs-8 fw-bold text-uppercase tracking-wider">Interval:</span>
                  <Form.Select
                    size="sm"
                    className="energy-modal-select"
                    value={modalInterval}
                    onChange={(e) => handleModalIntervalChange(e.target.value)}
                    disabled={modalLoading}
                    style={{ width: '105px' }}
                  >
                    {SAMPLING_INTERVALS.map(int => (
                      <option key={int.value} value={int.value}>{int.label}</option>
                    ))}
                  </Form.Select>
                </div>

                {/* Chart Type Switcher */}
                <div className="btn-group btn-group-sm" role="group" aria-label="Modal Chart Switcher">
                  <Button
                    variant={expandedChartType === 'area' ? 'info' : 'outline-secondary'}
                    size="sm"
                    className="py-1 px-2.5 fs-8"
                    onClick={() => setExpandedChartType('area')}
                  >
                    Area
                  </Button>
                  <Button
                    variant={expandedChartType === 'line' ? 'info' : 'outline-secondary'}
                    size="sm"
                    className="py-1 px-2.5 fs-8"
                    onClick={() => setExpandedChartType('line')}
                  >
                    Line
                  </Button>
                  <Button
                    variant={expandedChartType === 'bar' ? 'info' : 'outline-secondary'}
                    size="sm"
                    className="py-1 px-2.5 fs-8"
                    onClick={() => setExpandedChartType('bar')}
                  >
                    Bar
                  </Button>
                </div>

                {/* Modal Close Button */}
                <Button
                  variant="link"
                  className="text-white p-0 opacity-75 hover-opacity-100 ms-1"
                  onClick={handleCloseExpandModal}
                  title="Close modal"
                >
                  <X size={24} />
                </Button>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ background: '#080d19', minHeight: '520px', padding: '24px', position: 'relative' }}>
            {/* Live Loading Overlay inside modal when re-fetching individual setting by settingId */}
            {modalLoading && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(8, 13, 25, 0.75)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}>
                <Spinner animation="border" variant="info" style={{ width: '2.5rem', height: '2.5rem' }} className="mb-2" />
                <span className="text-info fs-8 fw-semibold tracking-wider text-uppercase">Updating Parameter Telemetry (IST)...</span>
              </div>
            )}

            {modalError && (
              <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center justify-content-between fs-8">
                <span>{modalError}</span>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="py-0.5 px-2 fs-9 fw-bold"
                  onClick={() => fetchIndividualSettingSnapshots(activeExpandedSetting, modalInterval, modalRangePreset)}
                >
                  Retry
                </Button>
              </div>
            )}

            <TelemetryGraphCard
              setting={modalSettingData}
              interval={modalInterval}
              rangePreset={modalRangePreset}
              colorScheme={expandedColorScheme}
              onExpand={() => {}}
              initialChartType={expandedChartType}
              isExpanded={true}
              height={460}
            />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export {
  TelemetryGraphCard,
  ScadaTooltip,
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
