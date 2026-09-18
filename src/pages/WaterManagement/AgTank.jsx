import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Row, Col, Card, Tooltip, OverlayTrigger, Form, Button, Modal, Badge, Spinner } from 'react-bootstrap';
import { Home, Waves, LayoutGrid, Settings, Save, AlertCircle, CheckCircle2, XCircle, Activity, X, Droplets, ToggleRight, ToggleLeft, Maximize, Minimize, ShieldCheck, ArrowUp, ArrowDown, Zap, MapPin, Cpu, Filter, Building2, Layers } from 'lucide-react';
import PdfButton from '../../components/PdfButton';
import { getSochiotDeviceDetails } from '../../services/authService';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
import { getAuthHeaders, normalizeList, apiClient } from '../../services/apiClient';
import { getApiUrl } from '../../utils/apiConfig';
import { io } from 'socket.io-client';

const AgTank = () => {
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showConfig, setShowConfig] = useState(false);
  const [tempDomesticCount, setTempDomesticCount] = useState(24);
  const [domesticCount, setDomesticCount] = useState(24);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pageRef = useRef(null);

  // Site, Asset & Device Selector states (3-Level Cascade: Site -> Asset -> Device)
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Filter helper to ensure real site names appear in Site dropdown
  const isRealSiteName = (name) => {
    if (!name || typeof name !== 'string') return false;
    const clean = name.trim().toUpperCase();
    const invalidNames = new Set([
      'SELECT SITE / LOCATION', 'SELECT SITE', 'NONE', 'NULL', 'UNDEFINED'
    ]);
    if (!clean || invalidNames.has(clean)) return false;
    return true;
  };

  // 1. Fetch REAL Sites from backend API (via apiClient & getApiUrl) & localStorage
  useEffect(() => {
    const loadSites = async () => {
      const siteMap = new Map();

      // Backend API fetch using apiClient / getApiUrl
      try {
        const res = await apiClient.get('/sites').catch(() => null);
        const list = normalizeList(res, 'sites');
        if (Array.isArray(list)) {
          list.forEach(s => {
            if (s && (s.id || s.siteId || s.name)) {
              const id = String(s.id || s.siteId || s._id || s.name);
              const name = String(s.name || s.label || s.title || id).trim();
              if (isRealSiteName(name)) {
                siteMap.set(id, { id, name });
              }
            }
          });
        }
      } catch (e) {
        console.warn('Backend sites fetch notice:', e);
      }

      // Fallback direct backendUrl fetch if apiClient returned empty
      if (siteMap.size === 0) {
        try {
          const backendUrl = window.process?.env?.REACT_APP_BACKEND_URL || '';
          const token = localStorage.getItem('sochiot_token');
          const res = await fetch(`${backendUrl}/api/sites`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.sites || []);
            list.forEach(s => {
              if (s && (s.id || s.name)) {
                const name = String(s.name || s.label || s.id).trim();
                if (isRealSiteName(name)) {
                  siteMap.set(String(s.id || name), { id: String(s.id || name), name });
                }
              }
            });
          }
        } catch (e) {}
      }

      // LocalStorage real site references
      try {
        const scadaSitesDb = localStorage.getItem('scada_sites_db');
        if (scadaSitesDb) {
          const parsed = JSON.parse(scadaSitesDb);
          if (Array.isArray(parsed)) {
            parsed.forEach(s => {
              if (s && (s.name || s.label) && isRealSiteName(s.name || s.label)) {
                const id = String(s.id || s.siteId || s.name);
                if (!siteMap.has(id)) siteMap.set(id, { id, name: s.name || s.label });
              }
            });
          }
        }

        ['tb_locations', 'tb_companies', 'tb_organizations'].forEach(key => {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            items.forEach(loc => {
              if (loc && (loc.name || loc.label)) {
                const name = String(loc.name || loc.label).trim();
                if (isRealSiteName(name)) {
                  const id = String(loc.id || name);
                  if (!siteMap.has(id)) siteMap.set(id, { id, name });
                }
              }
            });
          }
        });

        const globalScope = localStorage.getItem('global_location_scope');
        if (globalScope) {
          const parsed = JSON.parse(globalScope);
          if (parsed && (parsed.name || parsed.label)) {
            const name = String(parsed.name || parsed.label).trim();
            if (isRealSiteName(name)) {
              siteMap.set(String(parsed.id || name), { id: String(parsed.id || name), name });
            }
          }
        }

        const hierarchySel = localStorage.getItem('global_hierarchy_selection');
        if (hierarchySel) {
          const parsed = JSON.parse(hierarchySel);
          const name = String(parsed.building || parsed.client || parsed.organization || '').trim();
          if (name && isRealSiteName(name)) {
            siteMap.set(name, { id: name, name });
          }
        }

        const savedTemplates = localStorage.getItem('scada_templates');
        if (savedTemplates) {
          const templates = JSON.parse(savedTemplates);
          templates.forEach(t => {
            const siteName = t.mapping?.globalHierarchy?.building || t.mapping?.globalHierarchy?.client || t.mapping?.globalHierarchy?.organization || t.site || t.siteName;
            if (siteName && isRealSiteName(String(siteName)) && !siteMap.has(String(siteName))) {
              siteMap.set(String(siteName), { id: String(siteName), name: String(siteName) });
            }
          });
        }
      } catch (e) {
        console.warn('LocalStorage sites parse notice:', e);
      }

      const sitesList = Array.from(siteMap.values());
      setSites(sitesList);
      if (sitesList.length > 0) {
        setSelectedSiteId(prev => {
          if (prev && sitesList.some(s => String(s.id) === String(prev))) return prev;
          return sitesList[0].id;
        });
      }
    };

    loadSites();
  }, []);

  // 2. Fetch Assets when Site selection changes & AUTO-SELECT first asset
  useEffect(() => {
    if (!selectedSiteId) {
      setAssets([]);
      setSelectedAssetId('');
      setDevices([]);
      setSelectedDeviceId('');
      return;
    }

    const loadAssets = async () => {
      const assetMap = new Map();
      const selectedSiteObj = sites.find(s => String(s.id) === String(selectedSiteId));
      const selectedSiteName = selectedSiteObj?.name || selectedSiteId;

      // A. Backend API fetch using apiClient
      try {
        const res = await apiClient.get('/assets', { siteId: selectedSiteId }).catch(() => null);
        const list = normalizeList(res, 'assets');
        if (Array.isArray(list)) {
          list.forEach(a => {
            if (a && (a.id || a.assetId || a.name)) {
              const id = String(a.id || a.assetId || a.name);
              assetMap.set(id, { id, name: a.name || a.label || `Asset #${id}`, raw: a });
            }
          });
        }
      } catch (e) {
        console.warn('Backend assets fetch notice:', e);
      }

      // Secondary API fetch via site endpoint
      if (assetMap.size === 0) {
        try {
          const res = await apiClient.get(`/sites/${selectedSiteId}/assets`).catch(() => null);
          const list = normalizeList(res, 'assets');
          if (Array.isArray(list)) {
            list.forEach(a => {
              if (a && (a.id || a.assetId || a.name)) {
                const id = String(a.id || a.assetId || a.name);
                assetMap.set(id, { id, name: a.name || a.label || `Asset #${id}`, raw: a });
              }
            });
          }
        } catch (e) {}
      }

      // B. LocalStorage DBs (bms_registered_assets, scada_assets_db, tb_assets, tb_buildings)
      ['bms_registered_assets', 'scada_assets_db', 'tb_assets', 'tb_buildings'].forEach(key => {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            items.forEach(a => {
              if (a && (a.id || a.name)) {
                const aSite = a.siteId || a.site || a.building || a.siteName;
                const matchesSite = !selectedSiteId || !aSite ||
                  String(aSite).toLowerCase() === String(selectedSiteId).toLowerCase() ||
                  String(aSite).toLowerCase() === String(selectedSiteName).toLowerCase();

                if (matchesSite) {
                  const id = String(a.id || a.name);
                  if (!assetMap.has(id)) {
                    assetMap.set(id, { id, name: a.name || a.label || `Asset #${id}`, raw: a });
                  }
                }
              }
            });
          }
        } catch (e) {}
      });

      // C. Extract assets defined in saved templates for this site
      try {
        const savedTemplates = localStorage.getItem('scada_templates');
        if (savedTemplates) {
          const templates = JSON.parse(savedTemplates);
          templates.forEach(t => {
            const tSite = t.mapping?.globalHierarchy?.building || t.mapping?.globalHierarchy?.client || t.mapping?.globalHierarchy?.organization || t.site || t.siteName;
            const siteMatches = !selectedSiteId || !tSite ||
              String(tSite).toLowerCase() === String(selectedSiteId).toLowerCase() ||
              String(tSite).toLowerCase() === String(selectedSiteName).toLowerCase();

            if (siteMatches) {
              const rawAssetName = t.mapping?.globalHierarchy?.asset || t.assetName || t.asset || t.name;
              if (rawAssetName) {
                const assetId = String(rawAssetName);
                if (!assetMap.has(assetId)) {
                  assetMap.set(assetId, { id: assetId, name: String(rawAssetName), raw: t });
                }
              }
            }
          });
        }
      } catch (e) {}

      // D. Default Fallback Asset for site if no explicit asset entry exists
      if (assetMap.size === 0) {
        const defaultAssetId = `${String(selectedSiteId).toLowerCase().replace(/\s+/g, '-')}-asset`;
        const defaultAssetName = `${selectedSiteName} Asset`;
        assetMap.set(defaultAssetId, { id: defaultAssetId, name: defaultAssetName });
      }

      const assetList = Array.from(assetMap.values());
      setAssets(assetList);

      if (assetList.length > 0) {
        setSelectedAssetId(prev => {
          if (prev && assetList.some(a => String(a.id) === String(prev))) return prev;
          return assetList[0].id;
        });
      } else {
        setSelectedAssetId('');
      }
    };

    loadAssets();
  }, [selectedSiteId, sites]);

  // 3. Fetch REAL devices via API (/api/v1/devices?siteId=...&category=AG_TANK&include=settings,rules,profile) & AUTO-SELECT first device
  useEffect(() => {
    if (!selectedAssetId) {
      setDevices([]);
      setSelectedDeviceId('');
      return;
    }

    const loadDevices = async () => {
      const devMap = new Map();
      const selectedSiteObj = sites.find(s => String(s.id) === String(selectedSiteId));
      const selectedSiteName = selectedSiteObj?.name || selectedSiteId;
      const selectedAssetObj = assets.find(a => String(a.id) === String(selectedAssetId));
      const selectedAssetName = selectedAssetObj?.name || selectedAssetId;

      // A. Primary API fetch with category=AG_TANK
      try {
        const queryParams = {
          siteId: String(selectedSiteId),
          category: 'AG_TANK',
          include: 'settings,rules,profile'
        };
        const res = await apiClient.get('/devices', queryParams).catch(() => null);
        const list = normalizeList(res, 'devices');
        if (Array.isArray(list)) {
          list.forEach(d => {
            if (d && (d.id || d.deviceId || d.name)) {
              const id = String(d.id || d.deviceId || d.name);
              const name = d.name || d.title || d.deviceName || `Device #${id}`;
              devMap.set(id, { id, name, template: d });
            }
          });
        }
      } catch (e) {
        console.warn('Backend AG_TANK devices fetch notice:', e);
      }

      // B. Secondary API fetch without strict category filter
      if (devMap.size === 0) {
        try {
          const res = await apiClient.get('/devices', {
            siteId: String(selectedSiteId),
            include: 'settings,rules,profile'
          }).catch(() => null);
          const list = normalizeList(res, 'devices');
          if (Array.isArray(list)) {
            list.forEach(d => {
              if (d && (d.id || d.deviceId || d.name)) {
                const id = String(d.id || d.deviceId || d.name);
                const name = d.name || d.title || d.deviceName || `Device #${id}`;
                devMap.set(id, { id, name, template: d });
              }
            });
          }
        } catch (e) {}
      }

      // C. Fallback API fetch via /sites/${selectedSiteId}/devices
      if (devMap.size === 0) {
        try {
          const res = await apiClient.get(`/sites/${selectedSiteId}/devices`).catch(() => null);
          const list = normalizeList(res, 'devices');
          if (Array.isArray(list)) {
            list.forEach(d => {
              if (d && (d.id || d.deviceId || d.name)) {
                const id = String(d.id || d.deviceId || d.name);
                const name = d.name || d.title || d.deviceName || `Device #${id}`;
                devMap.set(id, { id, name, template: d });
              }
            });
          }
        } catch (e) {}
      }

      // D. LocalStorage saved templates
      try {
        const savedTemplates = localStorage.getItem('scada_templates');
        if (savedTemplates) {
          const templates = JSON.parse(savedTemplates);
          templates.forEach(t => {
            const tSite = t.mapping?.globalHierarchy?.building || t.mapping?.globalHierarchy?.client || t.mapping?.globalHierarchy?.organization || t.site || t.siteName;
            const siteMatches = !selectedSiteId || !tSite ||
              String(tSite).toLowerCase() === String(selectedSiteId).toLowerCase() ||
              String(tSite).toLowerCase() === String(selectedSiteName).toLowerCase();

            const tAsset = t.mapping?.globalHierarchy?.asset || t.assetName || t.asset;
            const assetMatches = !selectedAssetId || !tAsset ||
              String(tAsset).toLowerCase() === String(selectedSiteId).toLowerCase() ||
              String(tAsset).toLowerCase() === String(selectedAssetName).toLowerCase();

            if (siteMatches && (assetMatches || devMap.size === 0)) {
              const devId = String(t.id || t.name || 'device-1');
              const devName = t.name || `${t.module || 'AG Tank Device'}`;
              if (!devMap.has(devId)) {
                devMap.set(devId, { id: devId, name: devName, template: t });
              }
            }
          });
        }
      } catch (e) {
        console.warn('LocalStorage devices parse notice:', e);
      }

      // E. LocalStorage registered devices DB
      ['tb_devices', 'scada_devices_db', 'sochiot_devices', 'bms_registered_devices'].forEach(key => {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            const items = Array.isArray(parsed) ? parsed : [parsed];
            items.forEach(d => {
              if (d && (d.id || d.name)) {
                const dSite = d.siteId || d.site || d.building;
                const dAsset = d.assetId || d.asset || d.assetName;
                const siteMatches = !selectedSiteId || !dSite || String(dSite).toLowerCase() === String(selectedSiteId).toLowerCase() || String(dSite).toLowerCase() === String(selectedSiteName).toLowerCase();
                const assetMatches = !selectedAssetId || !dAsset || String(dAsset).toLowerCase() === String(selectedAssetId).toLowerCase() || String(dAsset).toLowerCase() === String(selectedAssetName).toLowerCase();

                if (siteMatches && (assetMatches || devMap.size === 0)) {
                  const id = String(d.id || d.name);
                  if (!devMap.has(id)) {
                    devMap.set(id, { id: id, name: d.name || d.label || `Device #${id}`, template: d });
                  }
                }
              }
            });
          }
        } catch (e) {}
      });

      // F. Default Fallback Device for selected asset
      if (devMap.size === 0) {
        const defaultDevId = `${String(selectedSiteId).toLowerCase().replace(/\s+/g, '-')}-device`;
        const defaultDevName = `${selectedSiteName} AG Tank Panel`;
        devMap.set(defaultDevId, {
          id: defaultDevId,
          name: defaultDevName,
          template: { module: 'AG Tank', category: 'AG_TANK', name: defaultDevName }
        });
      }

      const devList = Array.from(devMap.values());
      setDevices(devList);

      if (devList.length > 0) {
        setSelectedDeviceId(prev => {
          if (prev && devList.some(d => String(d.id) === String(prev))) return prev;
          return devList[0].id;
        });
      } else {
        setSelectedDeviceId('');
      }
    };

    loadDevices();
  }, [selectedAssetId, selectedSiteId, assets, sites]);

  // 4. Sync REAL telemetry & Device Mapping onto UI tanks
  // Uses: /sites/{siteId}/devices/{deviceId}/events/latest to get module-level events
  // Matches eventFields displayNames (Tank Level, Valve Status, Water Flow) & module types
  useEffect(() => {
    if (!selectedDeviceId) {
      setAllTanks(prev => prev.map(tank => ({
        ...tank,
        isMapped: false,
        isOnline: false,
        level: 0,
        status: 'Stopped',
        amps: undefined
      })));
      return;
    }

    const selectedDev = devices.find(d => String(d.id) === String(selectedDeviceId));
    const template = selectedDev?.template || {};

    const fetchRealTelemetry = async () => {
      try {
        // Step 1: Fetch latest events from device
        let eventsRes = await apiClient.get(`/sites/${selectedSiteId}/devices/${selectedDeviceId}/events/latest`).catch(() => null) ||
                        await apiClient.get(`/devices/${selectedDeviceId}/events/latest`).catch(() => null);

        // Step 2: Also fetch live telemetry as fallback
        const liveData = await apiClient.get(`/sites/${selectedSiteId || 1}/devices/${selectedDeviceId}/live`).catch(() => null) ||
                         await apiClient.get(`/devices/${selectedDeviceId}`).catch(() => null);

        // Step 3: Fetch full device details if template settings missing
        let devSettings = template.template_settings || template.settings || liveData?.template_settings || liveData?.settings || [];
        if (!Array.isArray(devSettings) || devSettings.length === 0) {
          const fullDev = await apiClient.get(`/sites/${selectedSiteId}/devices/${selectedDeviceId}`, { include: 'settings,rules,profile' }).catch(() => null) ||
                          await apiClient.get(`/devices/${selectedDeviceId}`, { include: 'settings,rules,profile' }).catch(() => null);
          const dData = fullDev?.data || fullDev;
          devSettings = dData?.settings || dData?.template_settings || [];
        }

        // Build module → field → displayName mapping from template settings
        let levelModuleId = null, levelFieldName = null;
        let valveModuleId = null, valveFieldName = null;
        let flowModuleId = null, flowFieldName = null;

        if (Array.isArray(devSettings)) {
          devSettings.forEach(field => {
            const displayName = String(field.displayName || field.name || field.sochiotFieldName || '').toLowerCase();
            const moduleId = field.moduleId || field.module_id || field.module || field.moduleName;
            const fieldName = field.sochiotFieldName || field.fieldName || field.eventField || field.field || 'Value';

            if (displayName.includes('tank level') || displayName.includes('water level') || displayName.includes('level')) {
              levelModuleId = moduleId;
              levelFieldName = fieldName;
            }
            if (displayName.includes('valve') || displayName.includes('status')) {
              valveModuleId = moduleId;
              valveFieldName = fieldName;
            }
            if (displayName.includes('water flow') || displayName.includes('flow') || displayName.includes('amps') || displayName.includes('current')) {
              flowModuleId = moduleId;
              flowFieldName = fieldName;
            }
          });
        }

        // Step 4: Extract real values from events data
        let realLevel, realValve, realAmps;

        const extractFromEvents = (eventsPayload) => {
          if (!eventsPayload) return;

          const payloadData = eventsPayload?.data ?? eventsPayload;
          
          // Collect all fields from both direct fields and module fields
          const allFields = [];
          if (Array.isArray(payloadData?.fields)) allFields.push(...payloadData.fields);
          if (Array.isArray(eventsPayload?.fields)) allFields.push(...eventsPayload.fields);

          const rawList = Array.isArray(payloadData) ? payloadData
            : Array.isArray(eventsPayload) ? eventsPayload
            : Array.isArray(payloadData?.modules) ? payloadData.modules
            : [payloadData];

          rawList.forEach(evt => {
            if (!evt) return;
            if (Array.isArray(evt.eventFields)) allFields.push(...evt.eventFields);
            if (Array.isArray(evt.fields)) allFields.push(...evt.fields);
          });

          // 1. Inspect explicit display names (Level, Tank Level, Water Level)
          allFields.forEach(f => {
            const fName = String(f.fieldName || f.eventFieldName || f.name || '').toLowerCase();
            const fDispName = String(f.displayName || f.eventFieldDisplayName || fName).toLowerCase();
            const fVal = f.currentValue ?? f.fieldCurrentValue ?? f.value ?? f.fieldcurrentvalue;

            if (fVal !== undefined && fVal !== null && fVal !== '') {
              if (fDispName.includes('level') || fDispName.includes('tank') || fDispName.includes('water') || fName.includes('level')) {
                if (realLevel === undefined) realLevel = fVal;
              }
              if (fDispName.includes('valve') || fDispName.includes('status') || fDispName.includes('pump') || fName.includes('valve')) {
                if (realValve === undefined) realValve = fVal;
              }
              if (fDispName.includes('flow') || fDispName.includes('amps') || fDispName.includes('current')) {
                if (realAmps === undefined) realAmps = fVal;
              }
            }
          });

          // 2. Direct match via levelModuleId from template settings
          if (realLevel === undefined && levelModuleId) {
            allFields.forEach(f => {
              const fName = String(f.fieldName || f.eventFieldName || f.name || '').toLowerCase();
              const fModId = String(f.moduleId || f.module_id || f.module || '');
              if (fModId === String(levelModuleId) || (levelFieldName && fName === String(levelFieldName).toLowerCase())) {
                const val = f.currentValue ?? f.fieldCurrentValue ?? f.value;
                if (val !== undefined && val !== null && val !== '') realLevel = val;
              }
            });
          }

          // 3. Fallback to generic analog/input/value fields with numeric values <= 100
          if (realLevel === undefined) {
            allFields.forEach(f => {
              const fName = String(f.fieldName || f.eventFieldName || f.name || '').toLowerCase();
              const fDispName = String(f.displayName || f.eventFieldDisplayName || fName).toLowerCase();
              const fVal = f.currentValue ?? f.fieldCurrentValue ?? f.value;
              const num = Number(fVal);

              if (fVal !== undefined && fVal !== null && !isNaN(num) && num >= 0 && num <= 100) {
                if (fDispName.includes('value') || fDispName.includes('analog') || fDispName.includes('adc') || fDispName.includes('ai') || fName === 'value' || fName === 'val') {
                  if (realLevel === undefined) realLevel = num;
                }
              }
            });
          }

          // 4. Any numeric field between 0 and 100
          if (realLevel === undefined) {
            allFields.forEach(f => {
              const fVal = f.currentValue ?? f.fieldCurrentValue ?? f.value;
              const num = Number(fVal);
              if (fVal !== undefined && fVal !== null && !isNaN(num) && num >= 0 && num <= 100) {
                if (realLevel === undefined) realLevel = num;
              }
            });
          }
        };

        extractFromEvents(eventsRes);

        // Step 5: Fallback - extract from live telemetry flat object
        if (liveData && realLevel === undefined) {
          const t = liveData?.telemetry || liveData?.meta || liveData?.data || liveData || {};
          realLevel = t.tank_level ?? t.water_level ?? t.level ?? t.value ?? t['Tank Level'] ?? t['Water Level'] ?? t['Value'];
          if (realValve === undefined) realValve = t.valve_status ?? t.valveStatus ?? t.status ?? t['Valve Status'] ?? t.state;
          if (realAmps === undefined) realAmps = t.amps ?? t.flow ?? t.current ?? t['Water Flow'];
        }

        // Step 6: Convert to display values
        const numLevel = (realLevel !== undefined && realLevel !== null && !isNaN(Number(realLevel))) ? Math.round(Number(realLevel)) : 0;
        
        // Valve: LOW/0 = CLOSE, HIGH/1 = OPEN
        let valveState = 'CLOSE';
        if (realValve !== undefined && realValve !== null) {
          const v = String(realValve).toUpperCase();
          if (v === 'HIGH' || v === '1' || v === 'OPEN' || v === 'RUNNING' || v === 'ON') {
            valveState = 'OPEN';
          }
        }
        const numAmps = (realAmps !== undefined && realAmps !== null && !isNaN(Number(realAmps))) ? Number(realAmps).toFixed(1) : undefined;

        const devNameStr = String(selectedDev?.name || template?.name || template?.deviceName || '').toUpperCase();
        const domTarget = template?.mapping?.agTankRange?.domStart;
        const flushTarget = template?.mapping?.agTankRange?.flushStart;
        const domEndTarget = template?.mapping?.agTankRange?.domEnd;
        const flushEndTarget = template?.mapping?.agTankRange?.flushEnd;

        const hasExplicitTankName = devNameStr.includes('TOWER-D-') || devNameStr.includes('TOWER-F-') || devNameStr.includes('DOM-') || devNameStr.includes('FLUSH-');

        setAllTanks(prev => prev.map(tank => {
          const tankName = `${tank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-${tank.localId}`;

          let isMapped = false;
          if (domTarget || flushTarget) {
            if (tank.type === 'DOMESTIC' && domTarget) {
              const s = parseInt((domTarget.match(/\d+/) || [])[0] || '1', 10);
              const e = domEndTarget ? parseInt((domEndTarget.match(/\d+/) || [])[0] || String(s), 10) : s;
              isMapped = tank.localId >= Math.min(s, e) && tank.localId <= Math.max(s, e);
            } else if (tank.type === 'FLUSHING' && flushTarget) {
              const s = parseInt((flushTarget.match(/\d+/) || [])[0] || '1', 10);
              const e = flushEndTarget ? parseInt((flushEndTarget.match(/\d+/) || [])[0] || String(s), 10) : s;
              isMapped = tank.localId >= Math.min(s, e) && tank.localId <= Math.max(s, e);
            }
          } else if (hasExplicitTankName) {
            isMapped = devNameStr.includes(tankName.toUpperCase());
          } else {
            // Default fallback if no explicit target or name given: map ONLY TOWER-D-1
            isMapped = (tank.type === 'DOMESTIC' && tank.localId === 1);
          }

          if (isMapped) {
            return {
              ...tank,
              isMapped: true,
              isOnline: true,
              level: numLevel,
              valveStatus: valveState,
              status: valveState === 'OPEN' ? 'Running' : 'Stopped',
              amps: numAmps
            };
          }
          return {
            ...tank,
            isMapped: false,
            isOnline: false,
            level: 0,
            status: 'Stopped',
            amps: undefined
          };
        }));

        console.log('[AG-Tank Telemetry]', { levelModuleId, levelFieldName, realLevel: numLevel, valveModuleId, realValve: valveState, flowModuleId, realAmps: numAmps });
      } catch (e) {
        console.warn('Real telemetry check notice:', e);
        const devNameStr = String(selectedDev?.name || template?.name || template?.deviceName || '').toUpperCase();
        const domTarget = template?.mapping?.agTankRange?.domStart;
        const flushTarget = template?.mapping?.agTankRange?.flushStart;
        const hasExplicitTankName = devNameStr.includes('TOWER-D-') || devNameStr.includes('TOWER-F-') || devNameStr.includes('DOM-') || devNameStr.includes('FLUSH-');

        setAllTanks(prev => prev.map(tank => {
          const tankName = `${tank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-${tank.localId}`;
          let isMapped = false;
          if (domTarget || flushTarget) {
            if (tank.type === 'DOMESTIC' && domTarget) isMapped = tankName === domTarget;
            if (tank.type === 'FLUSHING' && flushTarget) isMapped = tankName === flushTarget;
          } else if (hasExplicitTankName) {
            isMapped = devNameStr.includes(tankName.toUpperCase());
          } else {
            isMapped = (tank.type === 'DOMESTIC' && tank.localId === 1);
          }

          if (isMapped) {
            return { ...tank, isMapped: true };
          }
          return { ...tank, isMapped: false, isOnline: false, level: 0, status: 'Stopped' };
        }));
      }
    };

    fetchRealTelemetry();
    const interval = setInterval(fetchRealTelemetry, 3000);
    return () => clearInterval(interval);
  }, [selectedDeviceId, selectedSiteId, devices]);

  // Helper to clean corrupted template keys
  const cleanCorruptedMapping = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      let newKey = key;
      if (key.includes('Water Level') && key !== 'agLevelConfig' && key !== 'ugTankLevelConfig' && key !== 'Water Level' && key !== 'agLevel' && key !== 'waterLevel') {
        newKey = key.replace('Water Level', '').trim();
      }
      let value = obj[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) value = cleanCorruptedMapping(value);
      cleaned[newKey] = value;
    });
    return cleaned;
  };

  // Helper to normalize template settings array (e.g. from Edit Device Modal) into mapping structure
  const getNormalizedMapping = (template) => {
    if (!template) return null;
    let mapping = { ...(template.mapping || {}) };

    const settings = template.template_settings || template.settings;
    if (Array.isArray(settings) && settings.length > 0) {
      settings.forEach(field => {
        const name = String(field.displayName || field.sochiotFieldName || '').toLowerCase();
        const mId = field.moduleId;
        const fName = field.sochiotFieldName || field.fieldName || 'Value';

        if (name.includes('tank level') || name.includes('water level') || name.includes('level')) {
          if (!mapping.agLevelConfig) {
            mapping.agLevelConfig = { module: mId, field: fName, enabled: true };
          }
        }
        if (name.includes('valve') || name.includes('status')) {
          if (!mapping.agStatusStartConfig) {
            mapping.agStatusStartConfig = { module: mId, field: fName, operator: '>', value: '0', enabled: true };
          }
          if (!mapping.agOpenConfig) {
            mapping.agOpenConfig = { module: mId, field: fName, enabled: true };
          }
        }
        if (name.includes('flow') || name.includes('water flow') || name.includes('amps') || name.includes('current')) {
          if (!mapping.agAmpsConfig) {
            mapping.agAmpsConfig = { module: mId, field: fName, enabled: true };
          }
        }
      });
    }
    return mapping;
  };

  const matchesAgTankTemplate = (template, tankName, tankType) => {
    if (!template) return false;
    const isAgModule = template.module === 'AG Tank' ||
                       template.module === 'Water Management' ||
                       template.category === 'AG_TANK' ||
                       template.category === 'WTP' ||
                       template.category === 'Water Treatment (WTP)';
    if (!isAgModule) return false;
    const mapping = template.mapping;
    const domStart = mapping?.agTankRange?.domStart;
    const flushStart = mapping?.agTankRange?.flushStart;
    const domEnd = mapping?.agTankRange?.domEnd;
    const flushEnd = mapping?.agTankRange?.flushEnd;

    if (domStart || flushStart) {
      if (tankType === 'DOMESTIC' && domStart) {
        const localId = parseInt((tankName.match(/\d+/) || [])[0] || '0', 10);
        const s = parseInt((domStart.match(/\d+/) || [])[0] || '1', 10);
        const e = domEnd ? parseInt((domEnd.match(/\d+/) || [])[0] || String(s), 10) : s;
        return localId >= Math.min(s, e) && localId <= Math.max(s, e);
      }
      if (tankType === 'FLUSHING' && flushStart) {
        const localId = parseInt((tankName.match(/\d+/) || [])[0] || '0', 10);
        const s = parseInt((flushStart.match(/\d+/) || [])[0] || '1', 10);
        const e = flushEnd ? parseInt((flushEnd.match(/\d+/) || [])[0] || String(s), 10) : s;
        return localId >= Math.min(s, e) && localId <= Math.max(s, e);
      }
      return false;
    }

    const devNameStr = String(template.name || template.title || template.deviceName || template.assetName || '').toUpperCase();
    const hasExplicitTankName = devNameStr.includes('TOWER-D-') || devNameStr.includes('TOWER-F-') || devNameStr.includes('DOM-') || devNameStr.includes('FLUSH-');

    if (hasExplicitTankName) {
      return devNameStr.includes(tankName.toUpperCase());
    }

    return tankName === 'TOWER-D-1';
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const totalTanks = 48;

  const { getOverallStatus } = useDeviceStatus();

  // Sync global online/offline status into allTanks state dynamically
  useEffect(() => {
    const saved = localStorage.getItem('scada_templates');
    if (!saved) return;
    try {
      const templates = JSON.parse(saved);
      setAllTanks(prev => {
        let changed = false;
        const next = prev.map(tank => {
          const tankName = `${tank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-${tank.localId}`;
          const rawTemplate = templates.find(t => matchesAgTankTemplate(t, tankName, tank.type));
          if (rawTemplate) {
            const mapping = getNormalizedMapping(rawTemplate);
            let deviceId = mapping?.deviceId || mapping?.agStatusStartConfig?.device || mapping?.agStatusConfig?.device;
            if (!deviceId && mapping) {
              const anyConfig = Object.values(mapping).find(cfg => cfg && typeof cfg === 'object' && cfg.device);
              if (anyConfig) deviceId = anyConfig.device;
            }
            const gatewayUuid = mapping?.gatewayUuid;
            const isOnline = getOverallStatus(deviceId, gatewayUuid);
            if (tank.isOnline !== isOnline || !tank.isMapped) {
              changed = true;
              return { ...tank, isOnline: true, isMapped: true };
            }
          } else {
            if (tank.isMapped || tank.isOnline) {
              changed = true;
              return { ...tank, isMapped: false, isOnline: false };
            }
          }
          return tank;
        });
        return changed ? next : prev;
      });
    } catch (e) { console.error(e); }
  }, [getOverallStatus]);

  // Initialize tanks with valve states
  const [allTanks, setAllTanks] = useState(() => {
    const initial = Array.from({ length: totalTanks }, (_, i) => ({
      globalId: i + 1,
      localId: i < 24 ? i + 1 : i - 23,
      type: i < 24 ? 'DOMESTIC' : 'FLUSHING',
      level: 0,
      status: 'Stopped',
      valveMode: 'AUTO',
      valveStatus: 'CLOSE',
      minLevel: 20,
      maxLevel: 90,
      isOnline: false,
      isMapped: false
    }));

    // Initial Sync from LocalStorage templates
    const saved = localStorage.getItem('scada_templates');
    if (saved) {
      try {
        const templates = JSON.parse(saved).map(t => ({
          ...t,
          mapping: cleanCorruptedMapping(t.mapping)
        }));
        return initial.map(tank => {
          const tankName = `${tank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-${tank.localId}`;
          const rawTemplate = templates.find(t => matchesAgTankTemplate(t, tankName, tank.type));
          if (rawTemplate) {
            const mapping = getNormalizedMapping(rawTemplate);
            return {
              ...tank,
              isMapped: true,
              isOnline: true,
              minLevel: mapping?.rule1Config?.consequence?.value ? Number(mapping.rule1Config.consequence.value) : tank.minLevel,
              maxLevel: mapping?.rule2Config?.consequence?.value ? Number(mapping.rule2Config.consequence.value) : tank.maxLevel
            };
          }
          return tank;
        });
      } catch (e) { console.error("Initial Tank Sync Error:", e); }
    }
    return initial;
  });

  const [isSendingRules, setIsSendingRules] = useState(false);
  const [isSendingCommand, setIsSendingCommand] = useState(false);

  const [controlMode, setControlMode] = useState('REMOTE');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) pageRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  const handleSendRuleToEngine = async (limitType) => {
    if (!selectedTank) return;

    if (!selectedTank.minLevel || !selectedTank.maxLevel || Number(selectedTank.minLevel) === 0 || Number(selectedTank.maxLevel) === 0) {
      setActionFeedback("RULE IS NOT APPLIED");
      setTimeout(() => setActionFeedback(null), 2000);
      return;
    }

    // 1. Identify Tank Name
    const tankName = `${selectedTank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-${selectedTank.localId}`;

    // 2. Fetch Template
    const saved = localStorage.getItem('scada_templates');
    if (!saved) {
      setActionFeedback("ERROR: NO TEMPLATES FOUND");
      setTimeout(() => setActionFeedback(null), 2000);
      return;
    }

    const templates = JSON.parse(saved);
    const templateIndex = templates.findIndex(t =>
      t.module === 'AG Tank' &&
      (t.mapping?.agTankRange?.domStart === tankName || t.mapping?.agTankRange?.flushStart === tankName)
    );

    if (templateIndex === -1) {
      setActionFeedback("ERROR: TANK NOT MAPPED");
      setTimeout(() => setActionFeedback(null), 2000);
      return;
    }

    const template = templates[templateIndex];
    const typesToSend = limitType === 'BOTH' ? ['LOWER', 'UPPER'] : [limitType];

    setIsSendingRules(true);
    setActionFeedback("SENDING RULES...");

    try {
      const apiURL = `${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/rule-engine/apply`;
      const token = localStorage.getItem('sochiot_token');
      let rulesProcessed = 0;

      for (const type of typesToSend) {
        // 3. Prepare Config
        const config = type === 'LOWER' ? template.mapping.rule1Config : template.mapping.rule2Config;
        const moduleId = type === 'LOWER' ? template.mapping.agLowerConfig?.module : template.mapping.agUpperConfig?.module;
        const isEnabled = type === 'LOWER' ? (template.mapping.agLowerConfig?.enabled !== false) : (template.mapping.agUpperConfig?.enabled !== false);

        if (!moduleId || !isEnabled) {
          console.warn(`Module ID missing or disabled for ${type} limit`);
          continue;
        }

        rulesProcessed++;

        // 4. Update Consequence Value to current UI limit
        const updatedValue = type === 'LOWER' ? selectedTank.minLevel : selectedTank.maxLevel;

        // 5. Send to API
        const payload = {
          moduleId: moduleId,
          settingFields: [
            { fieldName: "condition_date_time", currentValue: config?.condition?.timeDate || "" },
            { fieldName: "condition_date_time_repeat_days", currentValue: config?.condition?.repeatDays?.join(',') || "" },
            { fieldName: "consequence_value", currentValue: String(updatedValue) },
            { fieldName: "condition_type", currentValue: config?.condition?.type || "MODBUS" },
            { fieldName: "condition_modbus", currentValue: config?.condition?.modbus || "" },
            { fieldName: "comparison_type", currentValue: config?.condition?.comparisonType || "LESS_THAN" },
            { fieldName: "comparison_value", currentValue: config?.condition?.comparisonValue || "" },
            { fieldName: "consequence_type", currentValue: config?.consequence?.type || "OUTPUT_2" },
            { fieldName: "consequence_modbus", currentValue: config?.consequence?.modbus || "" }
          ]
        };

        const response = await fetch(apiURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`${type} API request failed`);

        // Update local template object for persistence
        if (type === 'LOWER') {
          template.mapping.rule1Config = {
            ...template.mapping.rule1Config,
            consequence: { ...template.mapping.rule1Config?.consequence, value: String(updatedValue) }
          };
        } else {
          template.mapping.rule2Config = {
            ...template.mapping.rule2Config,
            consequence: { ...template.mapping.rule2Config?.consequence, value: String(updatedValue) }
          };
        }
      }

      if (rulesProcessed === 0) {
        setActionFeedback("RULE IS NOT APPLIED");
        setTimeout(() => setActionFeedback(null), 2000);
        setIsSendingRules(false);
        return;
      }

      // 6. Save updated templates to localStorage for persistence
      templates[templateIndex] = template;
      localStorage.setItem('scada_templates', JSON.stringify(templates));
      window.dispatchEvent(new Event('storage'));

      setActionFeedback("SETTINGS APPLIED SUCCESS");
      setTimeout(() => setActionFeedback(null), 2000);
    } catch (error) {
      console.error("Error sending rules:", error);
      setActionFeedback("FAILED TO UPDATE RULES");
      setTimeout(() => setActionFeedback(null), 2000);
    } finally {
      setIsSendingRules(false);
    }
  };

  const updateTankValve = async (globalId, updates) => {
    const userRole = (localStorage.getItem('userRole') || 'user').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      setActionFeedback("ACCESS DENIED: ADMIN ONLY");
      setTimeout(() => setActionFeedback(null), 1500);
      return;
    }

    // Handle Manual Remote Control via API
    if (updates.valveStatus && selectedTank && selectedTank.valveMode === 'MANUAL') {
      if (!selectedTank.isOnline) {
        setActionFeedback("DEVICE OFFLINE");
        setTimeout(() => setActionFeedback(null), 2000);
        return;
      }
      const tankName = `${selectedTank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-${selectedTank.localId}`;
      const saved = localStorage.getItem('scada_templates');

      if (saved) {
        try {
          const templates = JSON.parse(saved);
          const template = templates.find(t =>
            t.module === 'AG Tank' &&
            (t.mapping?.agTankRange?.domStart === tankName || t.mapping?.agTankRange?.flushStart === tankName)
          );

          const config = updates.valveStatus === 'OPEN' ? template?.mapping?.agOpenConfig : template?.mapping?.agCloseConfig;

          if (config && config.module && config.field) {
            setIsSendingCommand(true);
            setActionFeedback("SYNCHRONIZING...");

            const payload = {
              argValue: 1,
              cmdArg: updates.valveStatus === 'OPEN' ? 1 : 0,
              moduleId: parseInt(config.module),
              cmdField: config.field
            };

            const response = await fetch(`${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/command/push`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('sochiot_token')}`
              },
              body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Remote Control failed");

            setActionFeedback("COMMAND SUCCESS");
            setTimeout(() => setActionFeedback(null), 800);
          }
        } catch (error) {
          console.error("Manual Control error:", error);
          setActionFeedback("COMMAND FAILED");
          setTimeout(() => setActionFeedback(null), 2000);
          setIsSendingCommand(false);
          return; // Exit if failed
        } finally {
          setIsSendingCommand(false);
        }
      }
    }

    setAllTanks(prev => {
      const next = prev.map(t => {
        if (t.globalId === globalId) {
          let syncedUpdates = { ...updates };
          // Synchronize Valve and Status for "Same Value" logic
          if (updates.valveStatus === 'OPEN') syncedUpdates.status = 'Running';
          if (updates.valveStatus === 'CLOSE') syncedUpdates.status = 'Stopped';
          if (updates.status === 'Running') syncedUpdates.valveStatus = 'OPEN';
          if (updates.status === 'Stopped') syncedUpdates.valveStatus = 'CLOSE';

          return { ...t, ...syncedUpdates };
        }
        return t;
      });

      if (selectedTank && selectedTank.globalId === globalId) {
        const currentItem = next.find(t => t.globalId === globalId);
        setSelectedTank(currentItem);
      }
      return next;
    });

    if (updates.valveStatus) {
      if (!isSendingCommand) {
        setActionFeedback(`${updates.valveStatus === 'OPEN' ? 'STARTED' : 'STOPPED'} SUCCESSFULLY`);
        setTimeout(() => setActionFeedback(null), 800);
      }
      // Auto-hide modal after brief success visualization
      setTimeout(() => setShowValveModal(false), 500);
    }
  };

  // Re-allocate types when configuration changes
  useMemo(() => {
    setAllTanks(prev => prev.map((t, i) => ({
      ...t,
      type: i < domesticCount ? 'DOMESTIC' : 'FLUSHING',
      localId: i < domesticCount ? i + 1 : i - domesticCount + 1
    })));
  }, [domesticCount]);

  // Comprehensive Stats Calculation including Sector Counts
  const stats = useMemo(() => {
    const s = {
      total: { running: 0, fault: 0, warning: 0, healthy: 0, all: totalTanks },
      domestic: { running: 0, fault: 0, warning: 0, healthy: 0, count: domesticCount },
      flushing: { running: 0, fault: 0, warning: 0, healthy: 0, count: totalTanks - domesticCount }
    };

    allTanks.forEach(t => {
      const statusKey = t.status.toLowerCase();
      if (t.status === 'Running') {
        s.total.healthy++;
        if (t.type === 'DOMESTIC') s.domestic.healthy++;
        else s.flushing.healthy++;
      }
      s.total[statusKey]++;
      if (t.type === 'DOMESTIC') s.domestic[statusKey]++;
      else s.flushing[statusKey]++;
    });

    return s;
  }, [allTanks, domesticCount]);

  const filteredTanks = allTanks.filter(t => {
    const matchesSector = sectorFilter === 'ALL' || t.type === sectorFilter;
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'RUNNING' && t.status === 'Running') ||
      (statusFilter === 'FAULT' && t.status === 'Fault') ||
      (statusFilter === 'WARNING' && t.status === 'Warning') ||
      (statusFilter === 'ACTIVE' && (t.status === 'Running' || t.status === 'Warning'));
    return matchesSector && matchesStatus;
  });

  const getTankColor = (type, level, status) => {
    if (status === 'Fault') return '#ef4444';
    if (level < 20) return '#f59e0b';
    return '#38bdf8'; // Constant Blue inside
  };

  // Valve Control States
  const [selectedTank, setSelectedTank] = useState(null);
  const [showValveModal, setShowValveModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [disabledTanks, setDisabledTanks] = useState({});

  useEffect(() => {
    const syncDisabledTanks = () => {
      const saved = localStorage.getItem('scada_templates');
      if (saved) {
        const templates = JSON.parse(saved);
        const disabledMap = {};
        templates.forEach(t => {
          if (t.module === 'AG Tank' && t.mapping.agMasterEnabled === false) {
            const tankName = t.mapping.agTankRange.domStart || t.mapping.agTankRange.flushStart;
            if (tankName) {
              disabledMap[tankName] = true;
            }
          }
        });
        setDisabledTanks(disabledMap);
      }
    };

    syncDisabledTanks();
    window.addEventListener('storage', syncDisabledTanks);
    // Listen for custom events if navigation happens within same tab without storage event firing
    window.addEventListener('focus', syncDisabledTanks);

    return () => {
      window.removeEventListener('storage', syncDisabledTanks);
      window.removeEventListener('focus', syncDisabledTanks);
    };
  }, []);

  useEffect(() => {
    const backendUrl = window.process?.env?.REACT_APP_BACKEND_URL || '';
    const socket = io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'], autoConnect: false });

    socket.on('connect', () => {
      console.log('AgTank WebSocket Connected - Listening for Telemetry');
    });

    const processTelemetry = (stats) => {
      if (!Array.isArray(stats)) return;
      try {
        const saved = localStorage.getItem('scada_templates');
        if (!saved) return;
        const templates = JSON.parse(saved).map(t => ({
          ...t,
          mapping: cleanCorruptedMapping(t.mapping)
        }));

        setAllTanks(prev => {
          let updated = false;

          const next = prev.map((tank, index) => {
            const tankName = `${tank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-${tank.localId}`;

            let rawTemplate = templates.find(t => matchesAgTankTemplate(t, tankName, tank.type));
            let mapping = getNormalizedMapping(rawTemplate);

            let newTank = { ...tank };

            if (rawTemplate && mapping) {
              // Sync Rules Limits for visualization (Grid markers)
              const isEditing = showValveModal && selectedTank?.globalId === tank.globalId;
              if (!isEditing) {
                if (mapping.rule1Config?.consequence?.value) {
                  const newMin = Number(mapping.rule1Config.consequence.value);
                  if (newTank.minLevel !== newMin) {
                    newTank.minLevel = newMin;
                    updated = true;
                  }
                }
                if (mapping.rule2Config?.consequence?.value) {
                  const newMax = Number(mapping.rule2Config.consequence.value);
                  if (newTank.maxLevel !== newMax) {
                    newTank.maxLevel = newMax;
                    updated = true;
                  }
                }
              }

              // Level Config
              if (mapping.agLevelConfig?.field && mapping.agLevelConfig?.module) {
                const config = mapping.agLevelConfig;
                const stat = stats.find(s => String(s.moduleId) === String(config.module) || String(s.meta?.module_id) === String(config.module));
                if (stat && stat.meta && stat.meta[config.field] !== undefined) {
                  updated = true;
                  newTank.level = Math.round(Number(stat.meta[config.field]));
                }
              }

              // Amps/Current/Flow Config
              if (mapping.agAmpsConfig?.field && mapping.agAmpsConfig?.module) {
                const config = mapping.agAmpsConfig;
                const stat = stats.find(s => String(s.moduleId) === String(config.module) || String(s.meta?.module_id) === String(config.module));
                if (stat && stat.meta && stat.meta[config.field] !== undefined) {
                  updated = true;
                  newTank.amps = Number(stat.meta[config.field]).toFixed(1);
                }
              }

              // Helper to evaluate condition based on operator
              const evaluateCondition = (val, operator, threshold) => {
                const vNum = parseFloat(val);
                const tNum = parseFloat(threshold);
                
                const isNumeric = !isNaN(vNum) && !isNaN(tNum);
                
                const v = isNumeric ? vNum : String(val).trim();
                const t = isNumeric ? tNum : String(threshold).trim();
                
                switch (operator) {
                  case '=': return v === t;
                  case '>': return v > t;
                  case '<': return v < t;
                  default: return v === t;
                }
              };

              // Status Interpretation
              const startCfg = mapping.agStatusStartConfig || mapping.agStatusConfig;
              const stopCfg = mapping.agStatusStopConfig;

              let devId = mapping.deviceId || startCfg?.device;
              if (!devId && mapping) {
                const anyConfig = Object.values(mapping).find(cfg => cfg && typeof cfg === 'object' && cfg.device);
                if (anyConfig) devId = anyConfig.device;
              }
              const gwyUuid = mapping.gatewayUuid;
              let isOnline = getOverallStatus(devId, gwyUuid);

              if (!isOnline && mapping) {
                const activeModules = new Set();
                ['agLevelConfig', 'agAmpsConfig', 'agStatusConfig', 'agStatusStartConfig', 'agStatusStopConfig', 'agOpenConfig', 'agCloseConfig'].forEach(cfgKey => {
                  const cfg = mapping[cfgKey];
                  if (cfg && cfg.enabled !== false && cfg.module) {
                    activeModules.add(String(cfg.module));
                  }
                });
                const hasRecentStats = stats.some(s => activeModules.has(String(s.moduleId)) || activeModules.has(String(s.meta?.module_id)));
                if (hasRecentStats || rawTemplate) {
                  isOnline = true;
                }
              }

              if (newTank.isOnline !== isOnline || !newTank.isMapped) {
                newTank.isOnline = isOnline;
                newTank.isMapped = true;
                updated = true;
              }

              let conditionMet = false;

              // 1. Check for START condition (OPEN)
              if (startCfg?.field && startCfg?.module) {
                const stat = stats.find(s => String(s.moduleId) === String(startCfg.module) || String(s.meta?.module_id) === String(startCfg.module));
                if (stat && stat.meta) {
                  const currentVal = stat.meta[startCfg.field];
                  const isStartMet = evaluateCondition(currentVal, startCfg.operator || '=', startCfg.value || '10');

                  if (isStartMet) {
                    updated = true;
                    conditionMet = true;
                    newTank.valveStatus = 'OPEN';
                    newTank.status = 'Running';
                  }
                }
              }

              // 2. Check for STOP condition (CLOSE)
              if (!conditionMet && stopCfg?.field && stopCfg?.module) {
                const stat = stats.find(s => String(s.moduleId) === String(stopCfg.module) || String(s.meta?.module_id) === String(stopCfg.module));
                if (stat && stat.meta && stat.meta[stopCfg.field] !== undefined) {
                  const currentVal = stat.meta[stopCfg.field];
                  const isStopMet = evaluateCondition(currentVal, stopCfg.operator || '=', stopCfg.value || '10');

                  if (isStopMet) {
                    updated = true;
                    conditionMet = true;
                    newTank.valveStatus = 'CLOSE';
                    newTank.status = 'Stopped';
                  }
                }
              }

              // 3. Fallback
              if (!conditionMet && startCfg?.field && startCfg?.module) {
                updated = true;
                newTank.valveStatus = 'CLOSE';
                newTank.status = 'Stopped';
              }

              // Legacy Open Config
              if (!updated && mapping.agOpenConfig?.field && mapping.agOpenConfig?.module) {
                const config = mapping.agOpenConfig;
                const stat = stats.find(s => String(s.moduleId) === String(config.module) || String(s.meta?.module_id) === String(config.module));
                if (stat && stat.meta && stat.meta[config.field] !== undefined) {
                  updated = true;
                  const val = stat.meta[config.field];
                  if (val > 0) {
                    newTank.valveStatus = 'OPEN';
                    newTank.status = 'Running';
                  } else {
                    newTank.valveStatus = 'CLOSE';
                    newTank.status = 'Stopped';
                  }
                }
              }
            } else {
              // Explicitly unmapped if no template is found and no top device is selected
              if (!selectedDeviceId && (newTank.isMapped || newTank.isOnline)) {
                newTank.isMapped = false;
                newTank.isOnline = false;
                newTank.level = 0;
                newTank.status = 'Stopped';
                updated = true;
              }
            }
            return newTank;
          });
          return updated ? next : prev;
        });
      } catch (error) {
        console.error('Error handling WebSocket dynamic ag level:', error);
      }
    };

    socket.on('telemetry_update', processTelemetry);

    // ── INSTANT DATA LOAD STRATEGY ────────────────────────────────────────────
    try {
      const cached = localStorage.getItem('scada_agtank_telemetry_cache');
      if (cached) processTelemetry(JSON.parse(cached));
    } catch (e) { /* ignore cache errors */ }

    return () => {
      socket.disconnect();
    };
  }, [selectedTank, showValveModal, getOverallStatus, selectedDeviceId]);

  const isTankDisabled = (tank) => {
    const name = `${tank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-${tank.localId}`;
    return disabledTanks[name];
  };

  const handleTankClick = (tank) => {
    if (isTankDisabled(tank)) {
      setActionFeedback("PLEASE CONNECT ADMIN");
      setTimeout(() => setActionFeedback(null), 2000);
      return;
    }

    // Refresh limits from localStorage templates before opening
    const saved = localStorage.getItem('scada_templates');
    if (saved) {
      try {
        const templates = JSON.parse(saved);
        const tankName = `${tank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-${tank.localId}`;
        const template = templates.find(t =>
          t.module === 'AG Tank' &&
          (t.mapping?.agTankRange?.domStart === tankName || t.mapping?.agTankRange?.flushStart === tankName)
        );
        if (template && template.mapping) {
          const min = template.mapping.rule1Config?.consequence?.value ? Number(template.mapping.rule1Config.consequence.value) : tank.minLevel;
          const max = template.mapping.rule2Config?.consequence?.value ? Number(template.mapping.rule2Config.consequence.value) : tank.maxLevel;

          // Update local tank object for the modal
          const syncedTank = { ...tank, minLevel: min, maxLevel: max };

          // Update in master list to sync markers
          setAllTanks(prev => prev.map(t => t.globalId === tank.globalId ? syncedTank : t));
          setSelectedTank(syncedTank);
        } else {
          setSelectedTank(tank);
        }
      } catch (e) {
        console.error("Tank Click Sync Error:", e);
        setSelectedTank(tank);
      }
    } else {
      setSelectedTank(tank);
    }

    setShowValveModal(true);
  };

  return (
    <div className={`fade-in p-2 ${isFullscreen ? 'fullscreen-scada-page' : ''}`} ref={pageRef}>
      <div className="page-header d-flex justify-content-between align-items-center mb-3 p-3 bg-dark bg-opacity-20 rounded-4 border border-white border-opacity-5">
        <div className="d-flex align-items-center gap-3">
          <div>
            <h2 className="mb-0 text-white fw-black tracking-tighter">AG TANK <span className="text-info">SCADA</span></h2>
            <p className="text-secondary fs-10 fw-bold opacity-75 mb-0 uppercase letter-spacing-1">Unit Array: 01-48 | Active Sector: {domesticCount}D / {48 - domesticCount}F</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="info" size="sm" className="d-flex align-items-center fw-bold shadow-sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize size={16} className="me-2" /> : <Maximize size={16} className="me-2" />}
            {isFullscreen ? 'NORMAL VIEW' : 'EXPAND VIEW'}
          </Button>
          <Button variant="outline-info" size="sm" className="d-flex align-items-center" onClick={() => setShowConfig(true)}>
            <Settings size={16} className="me-2" /> Sector Config
          </Button>
          <PdfButton />
        </div>
      </div>

      {/* 3-TIER HIERARCHICAL CASCADED SELECTOR BAR: Site -> Asset -> Device */}
      <div className="p-3 mb-4 rounded-4 bg-dark bg-opacity-40 border border-white border-opacity-10 shadow-lg">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3 flex-wrap flex-grow-1">
            {/* 1. Site Selector Dropdown */}
            <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-80 px-3 py-2 rounded-3 border border-secondary border-opacity-40 shadow-sm">
              <Building2 size={18} className="text-info" />
              <Form.Select
                size="sm"
                value={selectedSiteId}
                onChange={(e) => {
                  setSelectedSiteId(e.target.value);
                  setSelectedAssetId('');
                  setSelectedDeviceId('');
                }}
                className="bg-transparent text-white border-0 fs-13 fw-bold focus-none shadow-none"
                style={{ minWidth: 180, cursor: 'pointer', color: '#fff' }}
              >
                <option value="" className="bg-dark text-white">Select Site / Location</option>
                {sites.map(s => (
                  <option key={s.id} value={String(s.id)} className="bg-dark text-white">
                    {s.name || s.label || `Site #${s.id}`}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* 2. Asset Selector Dropdown (Created Assets for Selected Site Name) */}
            <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-80 px-3 py-2 rounded-3 border border-warning border-opacity-40 shadow-sm">
              <Layers size={18} className="text-warning" />
              <Form.Select
                size="sm"
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setSelectedDeviceId('');
                }}
                className="bg-transparent text-warning border-0 fs-13 fw-bold focus-none shadow-none"
                style={{ minWidth: 200, cursor: 'pointer' }}
                disabled={!selectedSiteId}
              >
                <option value="" className="bg-dark text-white">Select Site Asset</option>
                {assets.map(a => (
                  <option key={a.id} value={String(a.id)} className="bg-dark text-warning">
                    {a.name || a.label || `Asset #${a.id}`}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* 3. Device Selector Dropdown (Enabled when Asset is selected / active) */}
            <div className={`d-flex align-items-center gap-2 bg-dark bg-opacity-80 px-3 py-2 rounded-3 border ${selectedAssetId ? 'border-info border-opacity-60' : 'border-secondary border-opacity-20'} shadow-sm`}>
              <Cpu size={18} className={selectedAssetId ? "text-success" : "text-muted"} />
              <Form.Select
                size="sm"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-transparent text-info border-0 fw-bold fs-13 focus-none shadow-none"
                style={{ minWidth: 220, cursor: selectedAssetId ? 'pointer' : 'not-allowed' }}
                disabled={!selectedAssetId}
              >
                <option value="" className="bg-dark text-white">Select Asset Device</option>
                {devices.map(d => (
                  <option key={d.id} value={String(d.id)} className="bg-dark text-info">
                    {d.name || d.label || `Device #${d.id}`}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>

          {/* Live Telemetry Status Badge */}
          <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-dark bg-opacity-60 border border-white border-opacity-10 text-secondary fs-12 fw-bold">
            <Activity size={16} className={selectedDeviceId ? "text-success pulse-icon" : "text-muted"} />
            <span className={selectedDeviceId ? "text-success" : "text-muted"}>
              {selectedDeviceId ? 'Device Active & Mapped' : 'Select Active Asset & Device'}
            </span>
          </div>
        </div>
      </div>

      <div className={`scada-card ${isFullscreen ? 'p-5' : 'p-4'}`}>
        <Row className="g-4">
          {filteredTanks.map((tank) => (
            <Col key={tank.globalId} xs={6} sm={4} md={isFullscreen ? 4 : 3} lg={isFullscreen ? 2 : 2} className={isFullscreen ? 'col-fs-2' : ''}>
              <div
                className={`tank-unit-wrapper p-2 rounded text-center position-relative ${tank.status === 'Stopped' ? 'tank-stopped-outline' : ''} ${isFullscreen ? 'expanded-unit' : ''} ${isTankDisabled(tank) ? 'tank-disabled' : ''}`}
                onClick={() => handleTankClick(tank)}
                style={{ cursor: isTankDisabled(tank) ? 'not-allowed' : 'pointer' }}
              >
                {isTankDisabled(tank) && <div className="disabled-overlay-text">DISABLED</div>}
                <div className="tank-assembly-anchor mx-auto position-relative" style={{ width: isFullscreen ? '48px' : '44px' }}>
                  <div
                    className={`tank-vessel ${isFullscreen ? 'vessel-large' : ''}`}
                  >
                    <div className="tank-fill" style={{ height: `${tank.level}%`, backgroundColor: getTankColor(tank.type, tank.level, tank.status) }}>
                      <div className="tank-water-wave"></div>
                    </div>
                    {/* Visual Threshold Markers */}
                    <div className="threshold-marker lower" style={{ bottom: `${tank.minLevel}%` }}></div>
                    <div className="threshold-marker upper" style={{ bottom: `${tank.maxLevel}%` }}></div>
                  </div>
                  <div className="valve-connector-pipe"></div>
                  <div className={`industrial-valve-node ${!tank.isMapped ? 'valve-unmapped' : (!tank.isOnline ? 'valve-offline' : (tank.valveStatus === 'OPEN' ? 'valve-open' : 'valve-closed'))}`}>
                    {/* Mode Indicator A/M */}
                    <div className={`valve-mode-pill mode-${tank.valveMode.toLowerCase()} ${(!tank.isMapped || !tank.isOnline) ? 'opacity-25' : ''}`}>
                      {tank.valveMode === 'AUTO' ? 'A' : tank.valveMode === 'MANUAL' ? 'M' : 'B'}
                    </div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 6L20 18V6L4 18V6Z"
                        fill={(!tank.isMapped || !tank.isOnline) ? '#334155' : (tank.valveStatus === 'OPEN' ? '#22c55e' : '#ef4444')}
                        stroke={(!tank.isMapped || !tank.isOnline) ? '#334155' : (tank.valveStatus === 'OPEN' ? '#22c55e' : '#ef4444')}
                        strokeWidth="2"
                        style={{ transition: 'all 0.3s ease', filter: (!tank.isMapped || !tank.isOnline) ? 'none' : (tank.valveStatus === 'OPEN' ? 'drop-shadow(0 0 5px #22c55e)' : 'drop-shadow(0 0 5px #ef4444)') }} />
                      <rect x="11" y="2" width="2" height="6" fill="#94a3b8" />
                      <rect x="9" y="2" width="6" height="1" fill="#94a3b8" />
                    </svg>
                  </div>
                  {/* Discharge Flow Animation - Reacts to both Valve and Operation Status */}
                  {tank.valveStatus === 'OPEN' && tank.status === 'Running' && (
                    <div className="discharge-manifold-system">

                    </div>
                  )}
                </div>
                <div className={`fw-bold mb-0 mt-1 ${isFullscreen ? 'fs-7' : 'fs-10'} ${!tank.isMapped ? 'text-secondary opacity-50' : (!tank.isOnline ? 'text-danger' : 'text-success')}`}>
                  {!tank.isMapped ? 'NOT MAPPED' : (tank.isOnline ? 'ONLINE' : 'OFFLINE')}
                </div>
                <div className={`fw-bold mb-0 ${isFullscreen ? 'fs-7' : 'fs-10'} text-muted`}>{tank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-{tank.localId}</div>
                <div className={`d-flex justify-content-center gap-2 opacity-75 ${isFullscreen ? 'fs-7' : 'fs-10'}`}>
                  <span style={{ color: !tank.isMapped ? '#334155' : (!tank.isOnline ? '#475569' : getTankColor(tank.type, tank.level, tank.status)) }}>{!tank.isMapped ? '--' : (!tank.isOnline ? '--' : tank.level)}%</span>
                  {tank.isOnline && tank.amps !== undefined && (
                    <span className="text-warning d-flex align-items-center gap-1 fw-bold fs-7">
                      <Zap size={12} className="pulse-icon" /> {tank.amps}A
                    </span>
                  )}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .fullscreen-scada-page { 
            background: #020617 !important; 
            background-image: 
                radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.03) 0%, transparent 100%),
                linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
            background-size: 100% 100%, 40px 40px, 40px 40px;
            min-height: 100vh !important; 
            width: 100% !important; 
            padding: 60px !important; 
            overflow-y: auto !important; 
            position: fixed; 
            top: 0; 
            left: 0; 
            z-index: 2000; 
        }
        .ag-tank-main-container {
            background-image: 
                radial-gradient(circle at 50% 10%, rgba(56, 189, 248, 0.05) 0%, transparent 50%),
                linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
            background-size: 100% 100%, 30px 30px, 30px 30px;
            min-height: 100vh;
        }

        .tank-unit-wrapper { 
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
            border: 1px solid transparent;
        }
        .tank-unit-wrapper:hover {
            background: rgba(255,255,255,0.03);
            border-color: rgba(56, 189, 248, 0.1);
            transform: translateY(-5px);
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        
        .tank-disabled {
            opacity: 0.3 !important;
            filter: grayscale(1) !important;
            pointer-events: auto !important; /* Keep click enabled for the admin message */
        }
        .tank-disabled:hover {
            transform: none !important;
            background: transparent !important;
            border-color: transparent !important;
            box-shadow: none !important;
        }
        .disabled-overlay-text {
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-15deg);
            background: #ef4444;
            color: white;
            padding: 2px 6px;
            font-size: 7px;
            font-weight: 900;
            border-radius: 3px;
            z-index: 100;
            letter-spacing: 1px;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
            pointer-events: none;
        }

        .tank-vessel { 
            width: 44px; 
            height: 60px; 
            border: 2px solid #475569; 
            border-radius: 4px 4px 8px 8px; 
            background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); 
            position: relative; 
            overflow: hidden; 
            transition: 0.4s; 
            box-shadow: 
                inset 0 0 10px rgba(0,0,0,0.5),
                0 4px 6px -1px rgba(0,0,0,0.2); 
        }

        body.light-mode .tank-vessel,
        [data-theme="light"] .tank-vessel {
            background: linear-gradient(90deg, #cbd5e1 0%, #f8fafc 50%, #cbd5e1 100%) !important;
            border-color: #64748b !important;
            box-shadow: inset 0 0 8px rgba(0,0,0,0.08), 0 4px 6px -1px rgba(0,0,0,0.05) !important;
        }
        
        /* 3D Glossy Highlight Overlay */
        .tank-vessel::after {
            content: '';
            position: absolute;
            top: 0;
            left: 5px;
            width: 8px;
            height: 100%;
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
            z-index: 5;
            pointer-events: none;
        }

        .tank-fill { 
            position: absolute; 
            bottom: 0; 
            left: 0; 
            width: 100%; 
            transition: height 1s cubic-bezier(0.4, 0, 0.2, 1); 
            background-image: linear-gradient(90deg, rgba(0,0,0,0.2) 0%, transparent 50%, rgba(0,0,0,0.2) 100%);
        }
        
        .tank-stopped-outline { border: 1px dashed rgba(255,255,255,0.1); }
        .vessel-stopped { opacity: 0.6; grayscale: 100%; filter: grayscale(1); }
        .expanded-unit { transform: scale(1.15); margin-bottom: 80px; margin-top: 40px; }
        .vessel-large { width: 48px !important; height: 68px !important; border-width: 3px !important; }
        .vessel-closed-state { background: #1e293b !important; border-color: #334155 !important; }

        .filter-tile { background-color: #0f172a; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; transition: 0.3s; }
        .filter-tile:hover { transform: translateY(-2px); border-color: rgba(56, 189, 248, 0.2); background: rgba(15, 23, 42, 0.8); }
        .filter-tile.active.domestic { border-bottom: 4px solid #38bdf8; background: rgba(56, 189, 248, 0.08); }
        .filter-tile.active.flushing { border-bottom: 4px solid #10b981; background: rgba(16, 185, 129, 0.08); }
        .filter-tile.active.all { border-bottom: 4px solid #94a3b8; background: rgba(148, 163, 184, 0.1); }
        
        .status-filter-card { transition: 0.3s; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px); will-change: transform; }
        .status-filter-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.02); }
        .status-filter-card.active { border-bottom-width: 4px !important; background: rgba(56, 189, 248, 0.05); }

        .scada-card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; backdrop-filter: blur(10px); }
        
        .hud-stat-container { border-left: 2px solid rgba(56, 189, 248, 0.2); padding-left: 15px; }
        .hud-label { font-size: 9px; color: #94a3b8; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }
        .hud-value { font-size: 18px; color: #fff; font-weight: 900; }
        .tank-fill { position: absolute; bottom: 0; left: 0; width: 100%; transition: height 1s cubic-bezier(0.4, 0, 0.2, 1); will-change: height; }
        .tank-water-wave { position: absolute; top: -4px; width: calc(100% + 30px); height: 8px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 28'%3E%3Cpath d='M0 28h120V12C90 12 90 0 60 0S30 12 0 12z' fill='rgba(255,255,255,0.2)'/%3E%3C/svg%3E"); background-size: 30px 8px; background-repeat: repeat-x; animation: ag-wave 2s linear infinite; will-change: transform; transform: translateZ(0); }
        @keyframes ag-wave { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-30px, 0, 0); } }
        .industrial-valve-node { width: 24px; height: 16px; position: absolute; top: 45%; right: -24px; transform: translateY(-50%) rotate(90deg); display: flex; align-items: center; justify-content: center; z-index: 10; transition: 0.3s; }
        .vessel-large + .valve-connector-pipe { width: 20px !important; height: 8px !important; }
        .expanded-unit .industrial-valve-node { right: -32px; transform: translateY(-50%) rotate(90deg) scale(1.3); }
        .valve-connector-pipe { position: absolute; top: 45%; left: 100%; width: 14px; height: 6px; background: #475569; transform: translateY(-50%); z-index: 5; }
        .valve-handle-stem { width: 3px; height: 8px; background: #94a3b8; position: absolute; top: -3px; left: 10px; border-radius: 1px; }
        .valve-body-wing { width: 0; height: 0; border-top: 7px solid transparent; border-bottom: 7px solid transparent; }
        
        .discharge-manifold-system { position: absolute; top: 45%; left: calc(100% + 24px); width: 20px; height: 100%; transform: translateY(-50%); }
        
        .valve-mode-pill {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%) rotate(-90deg);
            background: #1e293b;
            color: #38bdf8;
            font-size: 7px;
            font-weight: 900;
            width: 10px;
            height: 10px;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #334155;
            z-index: 20;
            transition: all 0.3s ease;
        }
        .valve-mode-pill.mode-auto { color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); }
        .valve-mode-pill.mode-manual { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
        .valve-mode-pill.mode-bypass { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

        .threshold-marker {
            position: absolute;
            left: 0;
            width: 100%;
            height: 1px;
            border-top: 1px dashed rgba(255, 255, 255, 0.4);
            z-index: 10;
        }
        .threshold-marker.lower { border-color: rgba(56, 189, 248, 0.6); }
        .threshold-marker.upper { border-color: rgba(239, 68, 68, 0.6); }

        .horizontal-stream { width: 30px; height: 6px; background: rgba(71, 85, 105, 0.5); position: relative; overflow: hidden; border-radius: 0 4px 4px 0; }
        .stream-pulse { position: absolute; top: 0; left: 0; height: 100%; width: 50%; background: linear-gradient(90deg, transparent, #38bdf8, transparent); animation: stream-flow 1s linear infinite; will-change: transform; }
        
        @keyframes stream-flow { from { transform: translate3d(-100%, 0, 0); } to { transform: translate3d(200%, 0, 0); } }

        .fw-black { font-weight: 900 !important; }
        .fs-10 { font-size: 0.65rem; }
        .fs-9 { font-size: 0.75rem; }
        .fs-7 { font-size: 1.1rem; }
        .w-40 { width: 40% !important; }
        .custom-modal-wide { width: 85% !important; max-width: 85% !important; }
        .text-glow { text-shadow: 0 0 10px currentColor; }
        .hover-glow:hover { border-color: rgba(56, 189, 248, 0.3) !important; box-shadow: 0 0 20px rgba(56, 189, 248, 0.1); }
        .transition-all { transition: all 0.3s ease; }
        .premium-action-btn { 
            padding: 16px; 
            border-radius: 12px; 
            border: 1px solid rgba(255,255,255,0.1); 
            background: rgba(255,255,255,0.02); 
            color: #94a3b8; 
            transition: all 0.3s ease; 
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .premium-action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .premium-action-btn .btn-label { font-size: 12px; font-weight: 900; letter-spacing: 1px; }
        .premium-action-btn .btn-subtext { font-size: 9px; font-weight: 600; opacity: 0.5; text-transform: uppercase; }
        
        .premium-action-btn.open.active { background: rgba(34, 197, 94, 0.15); border-color: #22c55e; color: #22c55e; box-shadow: 0 0 20px rgba(34, 197, 94, 0.1); }
        .premium-action-btn.open:hover:not(:disabled) { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; color: #22c55e; }
        
        .premium-action-btn.close.active { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.1); }
        .premium-action-btn.close:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; }

        .pulse-icon { animation: ag-pulse 2s infinite; }
        @keyframes ag-pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        .fade-in { animation: ag-fadeIn 0.5s ease-out; }
        .scale-in { animation: ag-scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes ag-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ag-scaleIn { from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }

        /* Mobile Performance Optimizations */
        @media (max-width: 768px) {
            .scada-card, .status-filter-card { backdrop-filter: none !important; background: #0f172a !important; box-shadow: none !important; }
            .tank-water-wave { display: none !important; animation: none !important; }
            .tank-vessel { box-shadow: none !important; border-width: 1px !important; }
            .tank-vessel::after { display: none !important; }
            .tank-fill { transition: none !important; }
            .stream-pulse { display: none !important; }
            .filter-tile { box-shadow: none !important; }
            .tank-unit-wrapper { padding: 4px !important; }
            .industrial-valve-node { transform: translateY(-50%) rotate(90deg) scale(0.8); right: -20px; }
        }
      `}} />

      <Modal show={showValveModal} onHide={() => setShowValveModal(false)} centered size="lg" contentClassName="bg-transparent border-0 shadow-2xl custom-modal-wide">
        {selectedTank && (
          <Modal.Body className="p-0 scada-control-modal-body overflow-hidden rounded-5">

            {/* Modal Header Bar */}
            <div className="p-4 text-center border-bottom scada-modal-header">
              <Badge bg="info" className="bg-opacity-10 text-info px-3 py-1 mb-2 border border-info border-opacity-25 rounded-pill">
                <div className="d-flex align-items-center gap-2 fs-12 fw-black tracking-widest uppercase">
                  <Activity size={10} className="pulse-icon" /> Operational Control
                </div>
              </Badge>
              <h3 className="fw-black scada-modal-title mb-0 size-3 tracking-tighter">
                {selectedTank.type === 'DOMESTIC' ? 'TOWER-D' : 'TOWER-F'}-{selectedTank.localId} <span className="text-info-scada">COMMAND</span>
              </h3>
            </div>
            <div className="p-4 px-5">
              {/* Mode Control Section */}
              <div className="d-flex justify-content-between align-items-center p-3 rounded-4 position-relative overflow-hidden mb-3 scada-mode-card">
                <div className="position-absolute top-0 start-0 h-100 w-1 bg-info bg-opacity-50"></div>
                <div>
                  <div className="fw-black fs-10 tracking-widest text-secondary uppercase">Control Strategy</div>
                  <div className="fw-bold fs-6 scada-mode-title">AUTO / MANUAL OVERRIDE</div>
                </div>
                <div className="d-flex align-items-center gap-1 p-1 rounded-pill scada-mode-pill-box shadow-inner">
                  {[
                    { id: 'AUTO', label: 'AUTO', activeClass: 'scada-pill-auto' },
                    { id: 'MANUAL', label: 'MANUAL', activeClass: 'scada-pill-manual' },
                    { id: 'BYPASS', label: 'BYPASS', activeClass: 'scada-pill-bypass' }
                  ].map(modeObj => (
                    <div
                      key={modeObj.id}
                      onClick={() => updateTankValve(selectedTank.globalId, { valveMode: modeObj.id })}
                      className={`px-4 py-2 rounded-pill fw-black tracking-widest transition-all cursor-pointer ${selectedTank.valveMode === modeObj.id
                          ? `${modeObj.activeClass} text-white shadow-lg scale-105`
                          : 'scada-mode-pill-inactive'
                        }`}
                      style={{ fontSize: '11px', letterSpacing: '1px', cursor: 'pointer' }}
                    >
                      {modeObj.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Thresholds Section - Only visible in AUTO */}
              {selectedTank.valveMode === 'AUTO' && (
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <div className="p-3 rounded-4 scada-limit-card transition-all text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                        <div className="p-1 px-2 rounded bg-info bg-opacity-10 text-info border border-info border-opacity-20"><ArrowDown size={12} /></div>
                        <Form.Label className="fs-11 text-secondary fw-black tracking-widest mb-0 uppercase">Lower Limit</Form.Label>
                      </div>
                      <div className="d-flex align-items-center justify-content-center gap-2 scada-limit-input-wrap rounded-3 p-2 px-3">
                        <Form.Control
                          type="number"
                          value={selectedTank.minLevel}
                          onChange={(e) => updateTankValve(selectedTank.globalId, { minLevel: parseInt(e.target.value) })}
                          className="bg-transparent border-0 scada-limit-input text-center fw-black fs-3 p-0 shadow-none w-100"
                        />
                        <span className="text-info fw-black fs-4">%</span>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="p-3 rounded-4 scada-limit-card transition-all text-center">
                      <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                        <div className="p-1 px-2 rounded bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20"><ArrowUp size={12} /></div>
                        <Form.Label className="fs-11 text-secondary fw-black tracking-widest mb-0 uppercase">Upper Limit</Form.Label>
                      </div>
                      <div className="d-flex align-items-center justify-content-center gap-2 scada-limit-input-wrap rounded-3 p-2 px-3">
                        <Form.Control
                          type="number"
                          value={selectedTank.maxLevel}
                          onChange={(e) => updateTankValve(selectedTank.globalId, { maxLevel: parseInt(e.target.value) })}
                          className="bg-transparent border-0 scada-limit-input text-center fw-black fs-3 p-0 shadow-none w-100"
                        />
                        <span className="text-danger fw-black fs-4">%</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              )}

              {/* Action Section */}
              <div className="mb-2">
                {selectedTank.valveMode === 'AUTO' ? (
                  <>
                    <Form.Label className="fs-11 text-secondary fw-black tracking-widest mb-3 uppercase">Automation Settings Control</Form.Label>
                    <Button
                      variant="info"
                      className="w-100 py-3 rounded-4 fw-black tracking-widest d-flex align-items-center justify-content-center gap-3 shadow-lg border-0 text-white"
                      style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', transition: 'all 0.3s ease' }}
                      onClick={() => handleSendRuleToEngine('BOTH')}
                      disabled={isSendingRules}
                    >
                      {isSendingRules ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        <Zap size={18} className="pulse-icon" />
                      )}
                      {isSendingRules ? 'SYNCHRONIZING...' : 'APPLY LIMIT SETTINGS'}
                    </Button>
                  </>
                ) : selectedTank.valveMode === 'MANUAL' ? (
                  <>
                    <Form.Label className="fs-11 text-secondary fw-black tracking-widest mb-2 uppercase">Supply Override Water Control</Form.Label>
                    <Row className="g-3">
                      <Col xs={6}>
                        <button
                          className="premium-action-btn open w-100"
                          style={{ padding: '12px' }}
                          disabled={isSendingCommand}
                          onClick={() => updateTankValve(selectedTank.globalId, { valveStatus: 'OPEN' })}>
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            {isSendingCommand && selectedTank.valveStatus !== 'OPEN' ? <Spinner size="sm" animation="border" /> : <Droplets size={16} />}
                            <div>
                              <div className="btn-label">{isSendingCommand && selectedTank.valveStatus !== 'OPEN' ? 'SENDING...' : 'OPEN SUPPLY'}</div>
                            </div>
                          </div>
                        </button>
                      </Col>
                      <Col xs={6}>
                        <button
                          className="premium-action-btn close w-100"
                          style={{ padding: '12px' }}
                          disabled={isSendingCommand}
                          onClick={() => updateTankValve(selectedTank.globalId, { valveStatus: 'CLOSE' })}>
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            {isSendingCommand && selectedTank.valveStatus !== 'CLOSE' ? <Spinner size="sm" animation="border" /> : <X size={16} />}
                            <div>
                              <div className="btn-label">{isSendingCommand && selectedTank.valveStatus !== 'CLOSE' ? 'SENDING...' : 'CLOSE SUPPLY'}</div>
                            </div>
                          </div>
                        </button>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <div className="text-center p-3 rounded-4 position-relative overflow-hidden"
                    style={{
                      background: 'rgba(251, 191, 36, 0.08)',
                      border: '1px solid rgba(251, 191, 36, 0.3)'
                    }}>
                    <div className="position-absolute top-0 start-0 w-100 h-1 bg-warning opacity-50"></div>
                    <div className="d-flex align-items-center justify-content-center gap-3">
                      <ShieldCheck size={24} className="text-warning opacity-90" />
                      <div className="text-start">
                        <h4 className="fw-black text-warning tracking-widest mb-0" style={{ textTransform: 'uppercase', fontSize: '13px' }}>
                          System Bypass Active
                        </h4>
                        <div className="text-secondary fs-10 fw-bold opacity-80 uppercase tracking-tighter">
                          Automation & Manual Controls Suspended
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 px-4 border-top scada-modal-footer d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2 fs-12 fw-bold tracking-widest">
                <ShieldCheck size={14} className="text-success" /> BMS VERIFIED LINK
              </div>
              <Button variant="link" className="scada-modal-footer-link fs-12 fw-black text-decoration-none transition-all uppercase tracking-widest" onClick={() => setShowValveModal(false)}>
                Dismiss Panel
              </Button>
            </div>


            {actionFeedback && (
              <div className="action-success-overlay position-absolute top-50 start-50 translate-middle w-75 p-4 rounded-4 shadow-2xl text-center border-2 border-white d-flex flex-column align-items-center gap-2"
                style={{
                  backgroundColor: actionFeedback.includes('DENIED') || actionFeedback.includes('NOT APPLIED') || actionFeedback.includes('DEVICE OFFLINE') ? '#7f1d1d' : '#064e3b',
                  zIndex: 1000,
                  boxShadow: actionFeedback.includes('DENIED') || actionFeedback.includes('NOT APPLIED') || actionFeedback.includes('DEVICE OFFLINE') ? '0 0 40px rgba(239, 68, 68, 0.4)' : '0 0 40px rgba(6, 78, 59, 0.4)'
                }}>
                <div className="bg-white rounded-circle p-2 mb-2">
                  {actionFeedback.includes('DENIED') || actionFeedback.includes('NOT APPLIED') || actionFeedback.includes('DEVICE OFFLINE') ? <XCircle size={40} className="text-danger" /> : <ShieldCheck size={40} style={{ color: '#059669' }} />}
                </div>
                <h4 className="text-white fw-black mb-0 letter-spacing-2">{actionFeedback}</h4>
                <small className="text-white opacity-90 fw-bold">{actionFeedback.includes('DENIED') || actionFeedback.includes('NOT APPLIED') || actionFeedback.includes('DEVICE OFFLINE') ? 'SECURITY PROTOCOL ACTIVE' : 'VALVE OPERATION VERIFIED'}</small>
              </div>
            )}

            <div className="mt-4 pt-3 border-top border-secondary border-opacity-10 text-center">
              <Button variant="link" className="text-secondary fs-10 text-decoration-none" onClick={() => setShowValveModal(false)}>DISMISS CONTROLS</Button>
            </div>
          </Modal.Body>
        )}
      </Modal>

      <Modal show={showConfig} onHide={() => setShowConfig(false)} centered contentClassName="bg-dark border-secondary">
        <Modal.Header closeButton className="border-secondary text-white"><Modal.Title className="fs-6">Sector Calibration</Modal.Title></Modal.Header>
        <Modal.Body className="text-white p-3">
          <Form.Label className="fs-9 text-muted d-flex justify-content-between mb-3">DOMESTIC TANK COUNT <span>{tempDomesticCount} / 48</span></Form.Label>
          <Form.Range min={0} max={48} value={tempDomesticCount} onChange={(e) => setTempDomesticCount(parseInt(e.target.value))} />
          <Button variant="info" size="sm" className="w-100 mt-4 fw-bold" onClick={() => { setDomesticCount(tempDomesticCount); setShowConfig(false); }}>CALIBRATE SECTORS</Button>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AgTank;
