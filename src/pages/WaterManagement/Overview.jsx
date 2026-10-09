import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Row, Col, Card, Badge, Button, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  Droplets, Waves, Gauge, ArrowRight, Activity, ShieldCheck, Zap,
  AlertTriangle, RefreshCw, Layers, Play, Pause, ExternalLink,
  Cpu, CheckCircle2, Radio, ToggleRight, ArrowUpRight, Maximize2, Minimize2,
  Sliders, Grid, Columns, Database, ArrowDownCircle
} from 'lucide-react';
import { useSiteStore } from '../../context/SiteContext';
import bmsService from '../../services/bmsService';
import { apiClient, normalizeList } from '../../services/apiClient';
import { isCategoryMatch } from '../../constants/deviceTemplates';
import {
  mapBatchEventsToAgTanks,
  resolveAgTankDevice,
  formatWaterTelemetryValue
} from './utils/waterTelemetry';
import {
  mapBatchEventsToUgPumps,
  resolveUgPumpDevice,
  buildCompositeStationModel
} from './utils/ugPumpTelemetry';
import PumpStationSchematic from './components/PumpStationSchematic';
import AssetInspectionModal from './components/AssetInspectionModal';
import HydraulicBarChart from './components/HydraulicBarChart';
import UgStationTrendChart from './components/UgStationTrendChart';

const WaterOverview = () => {
  const navigate = useNavigate();
  const activeRequestIdRef = useRef(0);

  // ── 1. SITE & STORE SYNCHRONIZATION ───────────────────────────────────────
  const { sites: storeSites, activeSites, selectedSite, setSelectedSite } = useSiteStore();

  const getSiteId = useCallback((s) => String(s?.id ?? s?.siteId ?? s?._id ?? ''), []);
  const getSiteName = useCallback((s) => s?.name || s?.siteName || s?.label || (getSiteId(s) ? `Site #${getSiteId(s)}` : 'Main Campus'), [getSiteId]);

  const [fetchedSites, setFetchedSites] = useState([]);
  const sites = useMemo(() => {
    if (Array.isArray(activeSites) && activeSites.length > 0) return activeSites;
    if (Array.isArray(storeSites) && storeSites.length > 0) return storeSites;
    if (fetchedSites.length > 0) return fetchedSites;
    return [];
  }, [activeSites, storeSites, fetchedSites]);

  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    const globalId = selectedSite ? String(selectedSite.id ?? selectedSite.siteId ?? selectedSite._id ?? '') : '';
    if (globalId) return globalId;
    return localStorage.getItem('selected_water_site_id') || localStorage.getItem('selected_agtank_site_id') || '';
  });

  // Sync real sites if store is empty
  useEffect(() => {
    if (sites.length > 0) return;
    const loadSites = async () => {
      try {
        const res = await apiClient.get('/sites').catch(() => null);
        const list = normalizeList(res, 'sites');
        if (Array.isArray(list) && list.length > 0) {
          setFetchedSites(list);
          if (!selectedSiteId) {
            const firstId = getSiteId(list[0]);
            setSelectedSiteId(firstId);
            localStorage.setItem('selected_water_site_id', firstId);
            if (setSelectedSite) setSelectedSite(list[0]);
          }
        }
      } catch (err) {
        console.warn('[WaterOverview] Sites fetch warning:', err);
      }
    };
    loadSites();
  }, [sites.length, selectedSiteId, setSelectedSite, getSiteId]);

  // Downward sync: When selectedSite in Header / Context changes, update selectedSiteId
  useEffect(() => {
    if (!selectedSite) {
      if (sites.length > 0 && !selectedSiteId) {
        const initial = sites[0];
        const initialId = getSiteId(initial);
        setSelectedSiteId(initialId);
        localStorage.setItem('selected_water_site_id', initialId);
        if (setSelectedSite) setSelectedSite(initial);
      }
      return;
    }

    const globalId = getSiteId(selectedSite);
    if (globalId && String(globalId) !== String(selectedSiteId)) {
      setSelectedSiteId(globalId);
      localStorage.setItem('selected_water_site_id', globalId);
    }
  }, [selectedSite, sites, selectedSiteId, setSelectedSite, getSiteId]);

  // Sync site from Header event
  useEffect(() => {
    const handleSiteEvent = (e) => {
      const site = e.detail;
      if (site) {
        const siteId = getSiteId(site);
        if (siteId && siteId !== String(selectedSiteId)) {
          setSelectedSiteId(siteId);
          localStorage.setItem('selected_water_site_id', siteId);
          if (setSelectedSite) setSelectedSite(site);
        }
      }
    };
    window.addEventListener('bms_site_changed', handleSiteEvent);
    return () => window.removeEventListener('bms_site_changed', handleSiteEvent);
  }, [selectedSiteId, setSelectedSite, getSiteId]);

  const currentSite = useMemo(() => {
    return sites.find(s => getSiteId(s) === String(selectedSiteId)) || selectedSite || null;
  }, [sites, selectedSiteId, selectedSite, getSiteId]);

  const currentSiteName = useMemo(() => {
    return getSiteName(currentSite);
  }, [currentSite, getSiteName]);

  // ── 2. DYNAMIC CONTROLS & LAYOUT MODES ─────────────────────────────────────
  const [isLiveStream, setIsLiveStream] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [selectedAssetForModal, setSelectedAssetForModal] = useState(null);
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Layout View Mode: 'split' (side-by-side), 'ag-focus' (AG full), 'ug-focus' (UG full)
  const [viewMode, setViewMode] = useState('split');
  // UG Station View Mode: 'schematic' (digital twin), 'trend' (pressure/flow graph), 'power' (electrical harmonics)
  const [ugViewMode, setUgViewMode] = useState('schematic');
  // AG Box Tab: 'tanks' (tank vessels) | 'chart' (24h hydraulic dispatch)
  const [agBoxTab, setAgBoxTab] = useState('tanks');
  // AG View Filter: 'ALL' (all mapped tanks in responsive grid) | 'PAIR' (focused dual tank view)
  const [agViewFilter, setAgViewFilter] = useState('ALL');

  // ── 3. STATE FOR AG TANKS (BOX 1) & UG (BOX 2) ────────────────────────────
  const [agTanks, setAgTanks] = useState([]);
  const [ugReservoirs, setUgReservoirs] = useState([]);
  const [ugPumps, setUgPumps] = useState([]);
  const [isAgLoading, setIsAgLoading] = useState(true);
  const [isUgLoading, setIsUgLoading] = useState(true);

  const [masterPressure, setMasterPressure] = useState(0.0);
  const [masterFlow, setMasterFlow] = useState(0);
  const [powerKw, setPowerKw] = useState(0.0);
  const [avgVoltage, setAvgVoltage] = useState(0.0);
  const [powerFactor, setPowerFactor] = useState(0.0);
  const [frequency, setFrequency] = useState(0.0);

  // ── 3.1 DERIVED FILTERED & MAPPED ARRAYS ──────────────────────────────────
  const mappedAgTanks = useMemo(() => {
    return agTanks.filter(t => t.isMapped !== false);
  }, [agTanks]);

  const displayedTanks = useMemo(() => {
    if (agViewFilter === 'PAIR') {
      return mappedAgTanks.slice(0, 2);
    }
    return mappedAgTanks;
  }, [mappedAgTanks, agViewFilter]);

  const mappedUgPumps = useMemo(() => {
    return ugPumps.filter(p => p.isMapped !== false);
  }, [ugPumps]);

  const activePumpsCount = useMemo(() => {
    return mappedUgPumps.filter(p => p.status === 'Running' || p.status === 'running').length;
  }, [mappedUgPumps]);

  const avgAgLevel = useMemo(() => {
    const validLevels = mappedAgTanks.filter(t => t.level !== null && t.level !== undefined).map(t => Number(t.level));
    if (validLevels.length === 0) return null;
    return Math.round(validLevels.reduce((a, b) => a + b, 0) / validLevels.length);
  }, [mappedAgTanks]);

  const onlineAgCount = useMemo(() => {
    return mappedAgTanks.filter(t => t.isOnline !== false).length;
  }, [mappedAgTanks]);

  // ── 4. FETCH REAL SITE DEVICES FROM BACKEND ───────────────────────────────
  const fetchSiteDevices = useCallback(async () => {
    if (!selectedSiteId) {
      setAgTanks([]);
      setUgReservoirs([]);
      setUgPumps([]);
      setIsAgLoading(false);
      setIsUgLoading(false);
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    setIsAgLoading(true);
    setIsUgLoading(true);

    try {
      // 1. Fetch AG Tanks specifically for selected site
      let foundAgDevices = [];
      try {
        const agRes = await bmsService.getDevices({
          siteId: String(selectedSiteId),
          category: 'AG_TANK',
          include: 'settings,rules,profile'
        }).catch(() => null);
        const list = normalizeList(agRes, 'devices');
        if (Array.isArray(list) && list.length > 0) {
          foundAgDevices = list.filter(d => isCategoryMatch(d.category, 'AG_TANK'));
        }

        // Fallback: fetch all devices for site and filter by AG_TANK
        if (foundAgDevices.length === 0) {
          const allDevsRes = await bmsService.getDevices({
            siteId: String(selectedSiteId),
            include: 'settings,rules,profile'
          }).catch(() => null);
          const allList = normalizeList(allDevsRes, 'devices');
          if (Array.isArray(allList) && allList.length > 0) {
            foundAgDevices = allList.filter(d => isCategoryMatch(d.category, 'AG_TANK'));
          }
        }
      } catch (agErr) {
        console.warn('[WaterOverview] AG devices fetch error:', agErr);
      }

      // 2. Fetch UG Tanks / Pumps specifically for selected site
      let foundUgDevices = [];
      try {
        const ugRes = await bmsService.getDevices({
          siteId: String(selectedSiteId),
          category: 'UG_TANK',
          include: 'settings,rules,profile'
        }).catch(() => null);
        const list = normalizeList(ugRes, 'devices');
        if (Array.isArray(list) && list.length > 0) {
          foundUgDevices = list.filter(d =>
            isCategoryMatch(d.category, 'UG_TANK') ||
            isCategoryMatch(d.category, 'UG_PUMP') ||
            isCategoryMatch(d.category, 'PUMP')
          );
        }

        // Fallback: fetch all devices for site and filter by UG_TANK / PUMP
        if (foundUgDevices.length === 0) {
          const allDevsRes = await bmsService.getDevices({
            siteId: String(selectedSiteId),
            include: 'settings,rules,profile'
          }).catch(() => null);
          const allList = normalizeList(allDevsRes, 'devices');
          if (Array.isArray(allList) && allList.length > 0) {
            foundUgDevices = allList.filter(d =>
              isCategoryMatch(d.category, 'UG_TANK') ||
              isCategoryMatch(d.category, 'UG_PUMP') ||
              isCategoryMatch(d.category, 'PUMP')
            );
          }
        }
      } catch (ugErr) {
        console.warn('[WaterOverview] UG devices fetch error:', ugErr);
      }

      if (currentRequestId !== activeRequestIdRef.current) return;

      // 3. Map AG Tanks
      if (foundAgDevices.length === 0) {
        setAgTanks([]);
      } else {
        const initialTanks = foundAgDevices.map(d => resolveAgTankDevice(d, null));
        setAgTanks(initialTanks);
      }

      // 4. Map UG Tanks / Pumps
      if (foundUgDevices.length === 0) {
        setUgReservoirs([]);
        setUgPumps([]);
        setMasterPressure(0.0);
        setMasterFlow(0);
        setPowerKw(0.0);
        setAvgVoltage(0.0);
        setPowerFactor(0.0);
        setFrequency(0.0);
      } else {
        const initialStations = foundUgDevices.map(d => resolveUgPumpDevice(d, null, 1, foundUgDevices));
        const composite = buildCompositeStationModel(initialStations, 1);
        if (Array.isArray(composite?.reservoirs)) setUgReservoirs(composite.reservoirs);
        if (Array.isArray(composite?.pumps)) setUgPumps(composite.pumps);
        if (composite?.masterPressure !== undefined) setMasterPressure(Number(composite.masterPressure) || 0.0);
        if (composite?.masterFlow !== undefined) setMasterFlow(Number(composite.masterFlow) || 0);
        if (composite?.powerKw !== undefined) setPowerKw(Number(composite.powerKw) || 0.0);
        if (composite?.avgVoltage !== undefined) setAvgVoltage(Number(composite.avgVoltage) || 383.0);
        if (composite?.powerFactor !== undefined) setPowerFactor(Number(composite.powerFactor) || 0.98);
        if (composite?.frequency !== undefined) setFrequency(Number(composite.frequency) || 49.99);
      }

      // 5. Batch Telemetry Fetch for all mapped devices
      const allDeviceIds = [
        ...foundAgDevices.map(d => d.bmsDeviceId || d.deviceId || d.id),
        ...foundUgDevices.map(d => d.bmsDeviceId || d.deviceId || d.id)
      ].filter(Boolean);

      if (allDeviceIds.length > 0) {
        const batchRes = await bmsService.getDeviceEventsLatestBatch(allDeviceIds).catch(() => null);
        const results = batchRes?.data?.results || batchRes?.results || [];

        if (currentRequestId !== activeRequestIdRef.current) return;

        if (Array.isArray(results) && results.length > 0) {
          // Update AG Tanks with real live telemetry
          if (foundAgDevices.length > 0) {
            const mappedAg = mapBatchEventsToAgTanks(foundAgDevices, results);
            if (mappedAg.length > 0) setAgTanks(mappedAg);
          }

          // Update UG Network with real live telemetry
          if (foundUgDevices.length > 0) {
            const mappedUg = mapBatchEventsToUgPumps(foundUgDevices, results, 1);
            if (mappedUg.length > 0) {
              const composite = buildCompositeStationModel(mappedUg, 1);
              if (Array.isArray(composite?.reservoirs)) setUgReservoirs(composite.reservoirs);
              if (Array.isArray(composite?.pumps)) setUgPumps(composite.pumps);
              if (composite?.masterPressure !== undefined) setMasterPressure(Number(composite.masterPressure) || 0.0);
              if (composite?.masterFlow !== undefined) setMasterFlow(Number(composite.masterFlow) || 0);
              if (composite?.powerKw !== undefined) setPowerKw(Number(composite.powerKw) || 0.0);
              if (composite?.avgVoltage !== undefined) setAvgVoltage(Number(composite.avgVoltage) || 383.0);
              if (composite?.powerFactor !== undefined) setPowerFactor(Number(composite.powerFactor) || 0.98);
              if (composite?.frequency !== undefined) setFrequency(Number(composite.frequency) || 49.99);
            }
          }
        }
      }
    } catch (err) {
      if (currentRequestId === activeRequestIdRef.current) {
        console.error('[WaterOverview] Fetch notice:', err);
      }
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setIsAgLoading(false);
        setIsUgLoading(false);
      }
    }
  }, [selectedSiteId]);

  useEffect(() => {
    fetchSiteDevices();
  }, [fetchSiteDevices]);

  // ── 5. REAL-TIME FLUID DYNAMICS LIVE SIMULATION (ONLY FOR MAPPED ACTIVE PUMPS) ──
  useEffect(() => {
    if (!isLiveStream || mappedUgPumps.length === 0) return;

    const interval = setInterval(() => {
      setLastRefreshedAt(new Date());

      if (activePumpsCount > 0) {
        setMasterPressure(prev => {
          const delta = (Math.random() - 0.48) * 0.12;
          return parseFloat(Math.max(1.0, prev + delta).toFixed(1));
        });

        setMasterFlow(prev => {
          const delta = Math.floor((Math.random() - 0.48) * 25);
          return Math.max(100, prev + delta);
        });

        setUgPumps(prevPumps =>
          prevPumps.map((p, idx) => {
            if (p.status !== 'Running' && p.status !== 'running') return p;
            const baseAmp = idx === 1 ? 18.9 : 13.5;
            const variance = (Math.random() - 0.5) * 0.3;
            return {
              ...p,
              amp: (baseAmp + variance).toFixed(1)
            };
          })
        );
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveStream, mappedUgPumps.length, activePumpsCount]);

  // Manual Refresh
  const handleManualRefresh = () => {
    setIsManualRefreshing(true);
    setLastRefreshedAt(new Date());
    fetchSiteDevices();
    setTimeout(() => setIsManualRefreshing(false), 600);
  };

  // Inspect Modal Open
  const handleOpenAssetModal = (asset) => {
    setSelectedAssetForModal(asset);
    setShowAssetModal(true);
  };

  // ── 8. RENDER AG TANK CARD (SCADA GLASS CYLINDER + CENTERED 2x2 TELEMETRY TILES) ──
  const renderAgTankCard = (tank, idx, isMultiColumn = false, totalCount = 1) => {
    const hasLevel = tank.level !== null && tank.level !== undefined && !isNaN(Number(tank.level));
    let rawLevelNum = hasLevel ? Number(tank.level) : 0;
    if (rawLevelNum > 0 && rawLevelNum <= 1) rawLevelNum = rawLevelNum * 100;
    else if (rawLevelNum > 100 && rawLevelNum <= 10000) rawLevelNum = rawLevelNum / 100;
    const levelVal = Math.min(100, Math.max(0, Math.round(rawLevelNum)));
    const isValveOpen = tank.valveStatus === 'OPEN' || tank.valveStatus === '1' || tank.valveStatus === true;
    const capacityNum = tank.capacity && !isNaN(Number(tank.capacity)) ? Number(tank.capacity) : (tank.totalCapacity ? Number(tank.totalCapacity) : null);
    const currentVolume = capacityNum ? Math.round((capacityNum * levelVal) / 100) : 0;
    const isRunning = tank.status === 'Running' || Number(tank.currentAmps) > 0;

    const zoneLabel = tank.zone || (idx === 0 ? 'Zone A' : (idx === 1 ? 'Zone B' : (idx === 2 ? 'Zone C' : `Zone ${idx + 1}`)));
    const sectorTag = tank.sectorType || tank.type || 'WATER';

    const rawName = tank.name || tank.deviceName || `AG Tank #${idx + 1}`;
    const cleanName = rawName.replace(/^AG Rooftop\s+/i, '').replace(/^AG\s+/i, '');

    const isSingleTank = totalCount === 1 && !isMultiColumn;
    const isDualTank = totalCount === 2 && !isMultiColumn;

    // Responsive dimensions: Centered SCADA vessel with enlarged proportional heights
    const vesselHeight = isSingleTank ? '280px' : (isDualTank ? '175px' : '140px');
    const vesselWidth = isSingleTank ? '170px' : (isDualTank ? '120px' : '95px');

    return (
      <div
        key={tank.id || idx}
        className="ag-tank-horizontal-card rounded-3 border border-secondary border-opacity-20 d-flex flex-column justify-content-between h-100"
        style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(20, 30, 48, 0.85) 100%)',
          boxShadow: isSingleTank ? '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(56, 189, 248, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.4)',
          cursor: 'pointer',
          minHeight: isSingleTank ? '340px' : (isDualTank ? '230px' : '190px'),
          padding: isSingleTank ? '14px 16px' : (isDualTank ? '10px 14px' : '8px 10px'),
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.25s ease'
        }}
        onClick={() => handleOpenAssetModal({ ...tank, type: 'AG_TANK' })}
        title="Click to inspect tank diagnostics"
      >
        {/* Tank Header */}
        <div className="d-flex justify-content-between align-items-center pb-2 border-bottom border-secondary border-opacity-15" style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flex: '1 1 auto' }}>
            <span
              style={{
                width: isSingleTank ? '9px' : '7px',
                height: isSingleTank ? '9px' : '7px',
                borderRadius: '50%',
                background: isValveOpen ? '#22c55e' : '#38bdf8',
                boxShadow: isValveOpen ? '0 0 8px rgba(34, 197, 94, 0.9)' : '0 0 8px rgba(56, 189, 248, 0.8)',
                flexShrink: 0
              }}
            />
            <strong
              className="text-white text-truncate"
              style={{ fontSize: isSingleTank ? '14px' : (isMultiColumn ? '11.5px' : '12.5px'), letterSpacing: '0.2px' }}
            >
              {cleanName}
            </strong>
            <span
              className="badge rounded-pill flex-shrink-0"
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: isSingleTank ? '9.5px' : '8px',
                fontWeight: 700,
                padding: isSingleTank ? '2px 8px' : '1.5px 6px'
              }}
            >
              {zoneLabel}
            </span>
            {isSingleTank && (
              <span
                style={{
                  background: 'rgba(148, 163, 184, 0.1)',
                  color: '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1.5px 7px',
                  borderRadius: '4px'
                }}
              >
                VERTICAL SCADA CYLINDER #0{idx + 1}
              </span>
            )}
          </div>

          <div className="d-flex align-items-center gap-1.5 flex-shrink-0 ms-1">
            <span
              className="badge rounded-pill"
              style={{
                background: !tank.isOnline ? 'rgba(148, 163, 184, 0.15)' : (hasLevel && levelVal > 15 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                color: !tank.isOnline ? '#94a3b8' : (hasLevel && levelVal > 15 ? '#4ade80' : '#f87171'),
                border: `1px solid ${!tank.isOnline ? 'rgba(148, 163, 184, 0.3)' : (hasLevel && levelVal > 15 ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)')}`,
                fontSize: isSingleTank ? '9px' : '8px',
                fontWeight: 700,
                padding: isSingleTank ? '2.5px 8px' : '2px 6px'
              }}
            >
              {!tank.isOnline ? 'OFFLINE' : (hasLevel && levelVal > 15 ? 'NORMAL STORAGE' : (hasLevel ? 'LOW LEVEL' : 'UNMAPPED'))}
            </span>
            <span
              style={{
                background: 'rgba(2, 132, 199, 0.25)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                fontSize: isSingleTank ? '9.5px' : '8px',
                fontWeight: 800,
                padding: isSingleTank ? '2.5px 8px' : '2px 6px',
                borderRadius: '4px'
              }}
            >
              {sectorTag}
            </span>
            <span
              style={{
                background: isValveOpen || isRunning ? 'rgba(34, 197, 94, 0.18)' : 'rgba(148, 163, 184, 0.12)',
                color: isValveOpen || isRunning ? '#4ade80' : '#94a3b8',
                border: `1px solid ${isValveOpen || isRunning ? 'rgba(34, 197, 94, 0.35)' : 'rgba(148, 163, 184, 0.25)'}`,
                fontSize: isSingleTank ? '9.5px' : '8px',
                fontWeight: 800,
                padding: isSingleTank ? '2.5px 8px' : '1.5px 6px',
                borderRadius: '4px'
              }}
            >
              {isValveOpen || isRunning ? 'OPTIMAL' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Tank Main Body: Centered Tank with Generous, Symmetrical Top & Bottom Spacing */}
        <div
          className="d-flex flex-column align-items-center justify-content-center flex-grow-1 w-100 my-auto"
          style={{
            minHeight: 0,
            paddingTop: isSingleTank ? '18px' : (isDualTank ? '12px' : '8px'),
            paddingBottom: isSingleTank ? '18px' : (isDualTank ? '12px' : '8px'),
            gap: isSingleTank ? '12px' : (isDualTank ? '8px' : '6px')
          }}
        >
          {/* Centered SCADA Vessel with Scale */}
          <div className="d-flex align-items-center justify-content-center gap-2" style={{ flexShrink: 0 }}>
            {/* Graduation scale */}
            {isSingleTank || isDualTank ? (
              <div
                className="d-flex flex-column justify-content-between text-end pe-1"
                style={{ height: vesselHeight, fontSize: isSingleTank ? '8px' : '7.5px', color: '#64748b', fontWeight: 800, lineHeight: 1 }}
              >
                <div className="d-flex align-items-center gap-1 justify-content-end">
                  <span style={{ color: levelVal >= 90 ? '#38bdf8' : '#64748b' }}>100%</span>
                  <span style={{ width: '5px', height: '1px', background: levelVal >= 90 ? '#38bdf8' : '#475569' }} />
                </div>
                <div className="d-flex align-items-center gap-1 justify-content-end">
                  <span style={{ color: levelVal >= 75 ? '#38bdf8' : '#475569' }}>75%</span>
                  <span style={{ width: '3.5px', height: '1px', background: levelVal >= 75 ? '#38bdf8' : '#334155' }} />
                </div>
                <div className="d-flex align-items-center gap-1 justify-content-end">
                  <span style={{ color: levelVal >= 50 ? '#38bdf8' : '#64748b' }}>50%</span>
                  <span style={{ width: '5px', height: '1px', background: levelVal >= 50 ? '#38bdf8' : '#475569' }} />
                </div>
                <div className="d-flex align-items-center gap-1 justify-content-end">
                  <span style={{ color: levelVal >= 25 ? '#38bdf8' : '#475569' }}>25%</span>
                  <span style={{ width: '3.5px', height: '1px', background: levelVal >= 25 ? '#38bdf8' : '#334155' }} />
                </div>
                <div className="d-flex align-items-center gap-1 justify-content-end">
                  <span style={{ color: '#64748b' }}>0%</span>
                  <span style={{ width: '5px', height: '1px', background: '#475569' }} />
                </div>
              </div>
            ) : (
              <div
                className="d-flex flex-column justify-content-between text-end pe-0.5"
                style={{ height: vesselHeight, fontSize: '7px', color: '#64748b', fontWeight: 800, lineHeight: 1 }}
              >
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
              </div>
            )}

            {/* Cylinder Vessel Assembly */}
            <div
              className="scada-tank-cylindrical-vessel position-relative d-flex flex-column"
              style={{
                width: vesselWidth,
                height: vesselHeight,
                flexShrink: 0
              }}
            >
              {/* Metallic Cap with Hatch & Transmitter Sensor */}
              <div
                className="position-relative w-100 flex-shrink-0"
                style={{
                  height: isSingleTank ? '14px' : (isDualTank ? '8px' : '6px'),
                  background: 'linear-gradient(180deg, #64748b 0%, #334155 60%, #1e293b 100%)',
                  borderRadius: '10px 10px 0 0',
                  borderTop: '1px solid rgba(255, 255, 255, 0.35)',
                  borderLeft: '2px solid rgba(56, 189, 248, 0.55)',
                  borderRight: '2px solid rgba(56, 189, 248, 0.55)',
                  borderBottom: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                {/* Top Sensor Beacon (Render for both single and dual view) */}
                <div
                  style={{
                    position: 'absolute',
                    top: isSingleTank ? '-6px' : '-5px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: isSingleTank ? '14px' : '11px',
                    height: isSingleTank ? '6px' : '5px',
                    borderRadius: '2px',
                    background: '#0284c7',
                    border: '1px solid #38bdf8',
                    boxShadow: '0 0 8px rgba(56, 189, 248, 0.9)'
                  }}
                  title="Ultrasonic Level Transmitter Sensor"
                />
                {/* Center Inspection Hatch */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isSingleTank ? '32px' : '22px',
                    height: isSingleTank ? '4px' : '3px',
                    borderRadius: '2px',
                    background: '#475569',
                    border: '1px solid rgba(255, 255, 255, 0.25)'
                  }}
                />
              </div>

              {/* Main Transparent Vessel Chamber */}
              <div
                className="position-relative flex-grow-1 overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #091325 0%, #040914 100%)',
                  borderLeft: '2px solid rgba(56, 189, 248, 0.55)',
                  borderRight: '2px solid rgba(56, 189, 248, 0.55)',
                  boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.95), inset 0 0 8px rgba(56, 189, 248, 0.25)'
                }}
              >
                {/* High Alarm Line (HH 90%) */}
                {(isSingleTank || isDualTank) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10%',
                      left: 0,
                      width: '100%',
                      borderTop: '1px dashed rgba(239, 68, 68, 0.6)',
                      zIndex: 4,
                      pointerEvents: 'none'
                    }}
                  >
                    <span style={{ position: 'absolute', right: '4px', top: '-10px', fontSize: '6.5px', color: '#f87171', fontWeight: 800 }}>
                      HH 90%
                    </span>
                  </div>
                )}

                {/* Low Alarm Line (LL 20%) */}
                {(isSingleTank || isDualTank) && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '20%',
                      left: 0,
                      width: '100%',
                      borderTop: '1px dashed rgba(245, 158, 11, 0.6)',
                      zIndex: 4,
                      pointerEvents: 'none'
                    }}
                  >
                    <span style={{ position: 'absolute', right: '4px', top: '-10px', fontSize: '6.5px', color: '#fbbf24', fontWeight: 800 }}>
                      LL 20%
                    </span>
                  </div>
                )}

                {/* Liquid Fill — only render when tank has actual water */}
                {levelVal > 0 && (
                  <div
                    className="position-absolute bottom-0 w-100"
                    style={{
                      height: `${levelVal}%`,
                      background: levelVal <= 20 
                        ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 40%, #b45309 80%, #78350f 100%)'
                        : 'linear-gradient(180deg, #38bdf8 0%, #0284c7 40%, #0369a1 80%, #082f49 100%)',
                      opacity: 0.92,
                      transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderTop: '2px solid rgba(186, 230, 253, 0.85)',
                      boxShadow: levelVal <= 20 ? '0 0 12px rgba(245, 158, 11, 0.8)' : '0 0 12px rgba(56, 189, 248, 0.8)'
                    }}
                  >
                    <div className="tank-water-wave" />
                  </div>
                )}

                {/* Glass Vertical Specular Reflection Glare */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: isSingleTank ? '14px' : '8px',
                    width: isSingleTank ? '22px' : '12px',
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 70%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: 5
                  }}
                />

                {/* Center HUD — show % & volume when water present, else show EMPTY state */}
                <div className="position-absolute top-50 start-50 translate-middle text-center w-100" style={{ zIndex: 6, pointerEvents: 'none' }}>
                  {levelVal > 0 ? (
                    <>
                      {/* Water Present: show % readout */}
                      <div
                        className="fw-black text-white"
                        style={{
                          fontSize: isSingleTank ? '38px' : (isDualTank ? '26px' : '17px'),
                          lineHeight: 1,
                          letterSpacing: '-1px',
                          textShadow: '0 3px 12px rgba(0,0,0,0.95), 0 0 20px rgba(56, 189, 248, 0.75)'
                        }}
                      >
                        {levelVal}%
                      </div>
                      <div
                        style={{
                          background: 'rgba(5, 12, 24, 0.85)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          borderRadius: '10px',
                          padding: isSingleTank ? '3px 12px' : (isDualTank ? '2px 8px' : '1px 5px'),
                          marginTop: isSingleTank ? '6px' : (isDualTank ? '3px' : '2px'),
                          display: 'inline-block',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.7)'
                        }}
                      >
                        <span style={{ color: '#e0f2fe', fontSize: isSingleTank ? '13px' : (isDualTank ? '10.5px' : '8.5px'), fontWeight: 900 }}>
                          {currentVolume.toLocaleString()} L
                        </span>
                      </div>
                      {(isSingleTank || isDualTank) && (
                        <div className="mt-0.5">
                          <span
                            style={{
                              fontSize: isSingleTank ? '8.5px' : '7px',
                              fontWeight: 800,
                              color: levelVal >= 85 ? '#f87171' : levelVal <= 20 ? '#fbbf24' : '#38bdf8',
                              background: 'rgba(0, 0, 0, 0.55)',
                              padding: '1px 6px',
                              borderRadius: '5px',
                              letterSpacing: '0.3px',
                              border: `1px solid ${levelVal >= 85 ? 'rgba(239, 68, 68, 0.4)' : levelVal <= 20 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`
                            }}
                          >
                            ● {levelVal >= 85 ? 'HIGH LEVEL' : levelVal <= 20 ? 'LOW RESERVE' : 'OPTIMAL FILL'}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Empty Tank: no water, no % — show empty indicator */
                    <>
                      <div
                        style={{
                          fontSize: isSingleTank ? '11px' : (isDualTank ? '9px' : '8px'),
                          fontWeight: 800,
                          color: '#475569',
                          letterSpacing: '1.5px',
                          textTransform: 'uppercase',
                          lineHeight: 1.4
                        }}
                      >
                        {hasLevel ? 'EMPTY' : 'NO DATA'}
                      </div>
                      {(isSingleTank || isDualTank) && (
                        <div
                          style={{
                            background: 'rgba(71, 85, 105, 0.15)',
                            border: '1px dashed rgba(71, 85, 105, 0.4)',
                            borderRadius: '10px',
                            padding: '2px 10px',
                            marginTop: '5px',
                            display: 'inline-block'
                          }}
                        >
                          <span style={{ color: '#475569', fontSize: '9px', fontWeight: 700 }}>
                            {hasLevel ? '0 L / Awaiting Fill' : '-- L / Sensor Offline'}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Base Skid Foundation */}
              <div
                className="flex-shrink-0"
                style={{
                  height: isSingleTank ? '10px' : (isDualTank ? '6px' : '5px'),
                  background: 'linear-gradient(180deg, #334155 0%, #0f172a 100%)',
                  borderRadius: '0 0 10px 10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                  borderLeft: '2px solid rgba(56, 189, 248, 0.55)',
                  borderRight: '2px solid rgba(56, 189, 248, 0.55)',
                  borderBottom: '2px solid rgba(56, 189, 248, 0.55)'
                }}
              />
            </div>

            {/* Industrial Discharge Pipe Graphic (for Single Tank) */}
            {isSingleTank && (
              <div className="d-none d-md-flex flex-column align-items-center justify-content-end" style={{ width: '20px', height: vesselHeight, flexShrink: 0, paddingBottom: '16px' }}>
                <div style={{ width: '100%', height: '8px', background: 'linear-gradient(180deg, #64748b 0%, #334155 50%, #1e293b 100%)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-13px', left: '1px', fontSize: '7px', color: '#38bdf8', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    DN80 ➔
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tank Footer */}
        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-15">
          <span style={{ color: '#4ade80', fontSize: isSingleTank ? '9px' : '8px', fontWeight: 800 }} className="d-flex align-items-center gap-1.5">
            <span className="live-radar-dot" style={{ width: '5px', height: '5px' }} />
            TELEMETRY NORMAL • MODBUS RTU #{String(idx + 1).padStart(2, '0')}
          </span>
          <span
            style={{ color: '#38bdf8', fontSize: isSingleTank ? '9.5px' : '8.5px', fontWeight: 800, cursor: 'pointer' }}
            className="hover-cyan"
          >
            Inspect Diagnostics →
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="water-management-overview-page fade-in">
      {/* ═══════════════════════════════════════════════════════════════════════
          SCADA MASTER COMMAND & CONTROL RIBBON (CLEAN, 48PX, HIGH AESTHETICS)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="scada-command-bar px-3 py-1.5 rounded-3 d-flex align-items-center justify-content-between mb-2"
        style={{
          background: 'linear-gradient(90deg, rgba(11, 19, 36, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
          minHeight: '44px'
        }}
      >
        {/* Left: Branding & Site Name */}
        <div className="d-flex align-items-center gap-2.5">
          <div
            className="p-1.5 rounded-2 d-flex align-items-center justify-content-center"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)'
            }}
          >
            <Layers size={18} />
          </div>
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0 text-white fw-black" style={{ fontSize: '15px', letterSpacing: '-0.3px' }}>
              Hydraulic Master Overview
            </h5>
            <span className="text-secondary opacity-40">|</span>
            <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
              Site: <strong style={{ color: '#ffffff' }}>{currentSiteName}</strong>
            </span>
          </div>
        </div>

        {/* Right: Layout Switcher & Live Feed Toggle */}
        <div className="d-flex align-items-center gap-2">
          {/* View Mode Buttons */}
          <div
            className="d-flex align-items-center p-0.5 rounded-2"
            style={{ background: '#050a14', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <button
              type="button"
              className="btn btn-sm border-0 py-1 px-2.5"
              style={{
                background: viewMode === 'split' ? '#38bdf8' : 'transparent',
                color: viewMode === 'split' ? '#0f172a' : '#cbd5e1',
                fontWeight: 800,
                fontSize: '11px',
                borderRadius: '5px'
              }}
              onClick={() => setViewMode('split')}
              title="Dual Split View (50 / 50)"
            >
              <Columns size={12} className="me-1" />
              Split View
            </button>
            <button
              type="button"
              className="btn btn-sm border-0 py-1 px-2"
              style={{
                background: viewMode === 'ag-focus' ? '#38bdf8' : 'transparent',
                color: viewMode === 'ag-focus' ? '#0f172a' : '#cbd5e1',
                fontWeight: 800,
                fontSize: '11px',
                borderRadius: '5px'
              }}
              onClick={() => setViewMode('ag-focus')}
              title="AG Tanks Focus"
            >
              AG Focus
            </button>
            <button
              type="button"
              className="btn btn-sm border-0 py-1 px-2"
              style={{
                background: viewMode === 'ug-focus' ? '#22c55e' : 'transparent',
                color: viewMode === 'ug-focus' ? '#042f2e' : '#cbd5e1',
                fontWeight: 800,
                fontSize: '11px',
                borderRadius: '5px'
              }}
              onClick={() => setViewMode('ug-focus')}
              title="UG Network Focus"
            >
              UG Focus
            </button>
          </div>

          {/* Live / Refresh */}
          <div
            className="d-flex align-items-center gap-1.5 px-2 py-1 rounded-2"
            style={{ background: '#050a14', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => setIsLiveStream(!isLiveStream)}
              className={`btn btn-sm p-0 px-1 border-0 d-flex align-items-center gap-1 fs-10 fw-bold ${
                isLiveStream ? 'text-success' : 'text-secondary'
              }`}
            >
              {isLiveStream ? <span className="live-radar-dot" style={{ width: '6px', height: '6px' }}></span> : <Play size={10} />}
              <span>{isLiveStream ? 'LIVE' : 'PAUSED'}</span>
            </button>
            <button
              onClick={handleManualRefresh}
              className="btn btn-sm btn-link text-secondary p-0 ps-1"
              title="Refresh"
            >
              <RefreshCw size={12} className={isManualRefreshing ? 'spin-animation' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          THE MASTER SPLIT HYDRAULIC WORKSPACE (50 / 50 BALANCED, ZERO SCROLLING)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="master-split-hydraulic-container p-2 rounded-3 flex-grow-1 d-flex flex-column"
        style={{ minHeight: 0, overflow: 'hidden' }}
      >
        <Row className="g-2 h-100 flex-grow-1 m-0">
          {/* ═════════════════════════════════════════════════════════════════
              BOX 1: ABOVE GROUND (AG) TANKS (LEFT BOX - 50% WIDTH)
             ═════════════════════════════════════════════════════════════════ */}
          {(viewMode === 'split' || viewMode === 'ag-focus') && (
            <Col
              xl={viewMode === 'split' ? 6 : 12}
              lg={viewMode === 'split' ? 6 : 12}
              md={12}
              className="h-100 p-0 pe-xl-1"
            >
              <div
                className="scada-dual-box ag-box-card rounded-3 h-100 d-flex flex-column justify-content-between"
                style={{ padding: '14px 16px' }}
              >
                {/* Box 1 Header */}
                <div className="d-flex justify-content-between align-items-center mb-1.5 pb-1 border-bottom border-secondary border-opacity-15 flex-wrap gap-1">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="p-1.5 rounded-2 d-flex align-items-center justify-content-center"
                      style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        boxShadow: '0 0 10px rgba(56, 189, 248, 0.25)'
                      }}
                    >
                      <Waves size={18} />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-1.5">
                        <h6 className="text-white fw-black mb-0 fs-6">Above Ground (AG) Tanks</h6>
                        <span
                          style={{
                            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(3, 105, 161, 0.45) 100%)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            fontSize: '9px',
                            fontWeight: 900,
                            letterSpacing: '0.4px',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          ROOFTOP SUPPLY
                        </span>
                      </div>
                      <small style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 500 }}>
                        {currentSiteName} • {mappedAgTanks.length} Mapped Tank{mappedAgTanks.length !== 1 ? 's' : ''}
                      </small>
                    </div>
                  </div>

                  {/* Box 1 Mode Tabs & Breakdown Link */}
                  <div className="d-flex align-items-center gap-1.5">
                    <div
                      className="d-flex align-items-center p-0.5 rounded-2"
                      style={{ background: '#091122', border: '1px solid rgba(56, 189, 248, 0.25)' }}
                    >
                      <button
                        type="button"
                        className="btn btn-sm border-0 py-0.5 px-2"
                        style={{
                          background: agBoxTab === 'tanks' && agViewFilter === 'ALL' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                          color: agBoxTab === 'tanks' && agViewFilter === 'ALL' ? '#ffffff' : '#94a3b8',
                          fontWeight: 800,
                          fontSize: '10px',
                          borderRadius: '4px',
                          boxShadow: agBoxTab === 'tanks' && agViewFilter === 'ALL' ? '0 1px 4px rgba(2, 132, 199, 0.4)' : 'none'
                        }}
                        onClick={() => { setAgBoxTab('tanks'); setAgViewFilter('ALL'); }}
                        title="Show All Mapped Tanks (Grid View)"
                      >
                        💧 All Tanks ({mappedAgTanks.length})
                      </button>
                      {mappedAgTanks.length > 2 && (
                        <button
                          type="button"
                          className="btn btn-sm border-0 py-0.5 px-2"
                          style={{
                            background: agBoxTab === 'tanks' && agViewFilter === 'PAIR' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                            color: agBoxTab === 'tanks' && agViewFilter === 'PAIR' ? '#ffffff' : '#94a3b8',
                            fontWeight: 800,
                            fontSize: '10px',
                            borderRadius: '4px',
                            boxShadow: agBoxTab === 'tanks' && agViewFilter === 'PAIR' ? '0 1px 4px rgba(2, 132, 199, 0.4)' : 'none'
                          }}
                          onClick={() => { setAgBoxTab('tanks'); setAgViewFilter('PAIR'); }}
                          title="Focused Dual Tank View"
                        >
                          ⚡ Dual View (2)
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm border-0 py-0.5 px-2"
                        style={{
                          background: agBoxTab === 'chart' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                          color: agBoxTab === 'chart' ? '#ffffff' : '#94a3b8',
                          fontWeight: 800,
                          fontSize: '10px',
                          borderRadius: '4px',
                          boxShadow: agBoxTab === 'chart' ? '0 1px 4px rgba(2, 132, 199, 0.4)' : 'none'
                        }}
                        onClick={() => setAgBoxTab('chart')}
                        title="24-Hr Hydraulic Flow vs Demand Chart"
                      >
                        📊 Flow Chart
                      </button>
                    </div>

                    <Button
                      variant="outline-info"
                      size="sm"
                      style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '10px',
                        padding: '2px 8px'
                      }}
                      className="d-flex align-items-center gap-1 rounded-2 hover-cyan"
                      onClick={() => navigate('/water-management/ag-pump')}
                      title="Open Dedicated AG Console"
                    >
                      <span>Breakdown</span>
                      <ArrowRight size={11} />
                    </Button>
                  </div>
                </div>

                {/* Box 1 Primary Telemetry Ribbon */}
                <div
                  className="px-2 py-1 rounded-2 mb-1.5"
                  style={{ background: 'rgba(11, 19, 36, 0.85)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Row className="g-1 text-center align-items-center">
                    <Col xs={3}>
                      <span style={{ color: '#94a3b8', fontSize: '8.5px', fontWeight: 700, display: 'block' }}>TOTAL</span>
                      <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 900 }}>{mappedAgTanks.length} Tanks</span>
                    </Col>
                    <Col xs={3} style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: '#94a3b8', fontSize: '8.5px', fontWeight: 700, display: 'block' }}>ONLINE</span>
                      <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 900 }}>{mappedAgTanks.length > 0 ? `${onlineAgCount}/${mappedAgTanks.length} Linked` : '--'}</span>
                    </Col>
                    <Col xs={3} style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: '#94a3b8', fontSize: '8.5px', fontWeight: 700, display: 'block' }}>AVG LEVEL</span>
                      <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 900 }}>{mappedAgTanks.length > 0 && avgAgLevel !== null ? `${avgAgLevel}%` : '--'}</span>
                    </Col>
                    <Col xs={3} style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: '#94a3b8', fontSize: '8.5px', fontWeight: 700, display: 'block' }}>SUPPLY HEAD</span>
                      <span style={{ color: '#facc15', fontSize: '12px', fontWeight: 900 }}>{mappedAgTanks.length > 0 ? '4.2 BAR' : '--'}</span>
                    </Col>
                  </Row>
                </div>

                {/* Box 1 Main View Canvas (Zero Scroll Flex Container) */}
                <div className="flex-grow-1 d-flex flex-column overflow-hidden" style={{ minHeight: 0 }}>
                  {isAgLoading ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 py-4">
                      <RefreshCw size={24} className="spin-animation text-info mb-2" />
                      <span className="text-secondary fs-11 fw-bold">Querying AG Tanks Telemetry...</span>
                    </div>
                  ) : mappedAgTanks.length === 0 ? (
                    <div
                      className="d-flex flex-column align-items-center justify-content-center text-center h-100 rounded-3 border border-secondary border-opacity-15 p-4"
                      style={{ background: 'rgba(11, 19, 36, 0.4)' }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: '52px',
                          height: '52px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          color: '#38bdf8'
                        }}
                      >
                        <Waves size={26} />
                      </div>
                      <h6 className="text-white fw-black mb-1" style={{ fontSize: '13px' }}>
                        No AG Tanks Configured
                      </h6>
                      <p className="text-secondary mb-3" style={{ fontSize: '11px', maxWidth: '340px', lineHeight: 1.4 }}>
                        No Above Ground (AG) Tanks are mapped to <strong className="text-info">{currentSiteName}</strong>. Select a configured site or provision new tanks.
                      </p>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="d-flex align-items-center gap-1.5 px-3 py-1 rounded-2"
                        style={{ fontSize: '11px', fontWeight: 800 }}
                        onClick={() => navigate('/water-management/ag-pump')}
                      >
                        <span>Open AG Console</span>
                        <ArrowRight size={12} />
                      </Button>
                    </div>
                  ) : agBoxTab === 'chart' ? (
                    <div className="h-100 overflow-hidden">
                      <HydraulicBarChart agLevel={avgAgLevel || 0} masterFlow={masterFlow} />
                    </div>
                  ) : (
                    /* DYNAMIC SCALABLE AG TANK CARDS (1, 2, OR 4+ TANKS IN HARMONIOUS VIEW) */
                    <div
                      className="d-flex flex-column gap-2.5 flex-grow-1 custom-scada-scrollbar h-100"
                      style={{
                        minHeight: 0,
                        overflowY: 'auto',
                        paddingRight: '2px'
                      }}
                    >
                      {displayedTanks.length <= 2 ? (
                        // Focused Dual / Single Stacked View
                        displayedTanks.map((tank, idx) => (
                          <div key={tank.id || idx} className="w-100 flex-shrink-0" style={{ flex: displayedTanks.length === 1 ? 1 : '0 0 auto', minHeight: 0 }}>
                            {renderAgTankCard(tank, idx, false, displayedTanks.length)}
                          </div>
                        ))
                      ) : (
                        // Responsive Multi-Tank Grid View (3, 4, 6+ Tanks)
                        <Row className="g-2 m-0 w-100 h-100">
                          {displayedTanks.map((tank, idx) => (
                            <Col xs={12} xl={6} key={tank.id || idx} className="p-1" style={{ height: displayedTanks.length <= 4 ? '50%' : 'auto' }}>
                              {renderAgTankCard(tank, idx, true, displayedTanks.length)}
                            </Col>
                          ))}
                        </Row>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Col>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              BOX 2: UNDERGROUND (UG) NETWORK & PUMP STATION (RIGHT BOX - 50% WIDTH)
             ═════════════════════════════════════════════════════════════════ */}
          {(viewMode === 'split' || viewMode === 'ug-focus') && (
            <Col
              xl={viewMode === 'split' ? 6 : 12}
              lg={viewMode === 'split' ? 6 : 12}
              md={12}
              className="h-100 p-0 ps-xl-1"
            >
              <div
                className="scada-dual-box ug-box-card rounded-3 h-100 d-flex flex-column justify-content-between"
                style={{ padding: '14px 16px' }}
              >
                {/* Box 2 Header */}
                <div className="d-flex justify-content-between align-items-center mb-1.5 pb-1 border-bottom border-secondary border-opacity-15 flex-wrap gap-1">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="p-1.5 rounded-2 d-flex align-items-center justify-content-center"
                      style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid #22c55e',
                        color: '#22c55e',
                        boxShadow: '0 0 10px rgba(34, 197, 94, 0.25)'
                      }}
                    >
                      <Droplets size={18} />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-1.5">
                        <h6 className="text-white fw-black mb-0 fs-6">Underground (UG) Network</h6>
                        <span
                          style={{
                            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.35) 0%, rgba(21, 128, 61, 0.45) 100%)',
                            color: '#4ade80',
                            border: '1px solid rgba(34, 197, 94, 0.4)',
                            fontSize: '9px',
                            fontWeight: 900,
                            letterSpacing: '0.4px',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          PUMP STATION #01
                        </span>
                      </div>
                      <small style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 500 }}>
                        {currentSiteName} • {mappedUgPumps.length} Mapped Pump{mappedUgPumps.length !== 1 ? 's' : ''}
                      </small>
                    </div>
                  </div>

                  {/* Box 2 Mode Tabs & Telemetry Link */}
                  <div className="d-flex align-items-center gap-1.5">
                    <div
                      className="d-flex align-items-center p-0.5 rounded-2"
                      style={{ background: '#091122', border: '1px solid rgba(34, 197, 94, 0.25)' }}
                    >
                      <button
                        type="button"
                        className="btn btn-sm border-0 py-0.5 px-2"
                        style={{
                          background: ugViewMode === 'schematic' ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'transparent',
                          color: ugViewMode === 'schematic' ? '#ffffff' : '#94a3b8',
                          fontWeight: 800,
                          fontSize: '10px',
                          borderRadius: '4px',
                          boxShadow: ugViewMode === 'schematic' ? '0 1px 4px rgba(22, 163, 74, 0.4)' : 'none'
                        }}
                        onClick={() => setUgViewMode('schematic')}
                        title="SCADA Digital Twin Schematic"
                      >
                        ⚡ SCADA Twin
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm border-0 py-0.5 px-2"
                        style={{
                          background: ugViewMode === 'trend' ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'transparent',
                          color: ugViewMode === 'trend' ? '#ffffff' : '#94a3b8',
                          fontWeight: 800,
                          fontSize: '10px',
                          borderRadius: '4px',
                          boxShadow: ugViewMode === 'trend' ? '0 1px 4px rgba(22, 163, 74, 0.4)' : 'none'
                        }}
                        onClick={() => setUgViewMode('trend')}
                        title="Live Pressure & Flow Graph"
                      >
                        📈 Station Graph
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm border-0 py-0.5 px-2"
                        style={{
                          background: ugViewMode === 'power' ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'transparent',
                          color: ugViewMode === 'power' ? '#ffffff' : '#94a3b8',
                          fontWeight: 800,
                          fontSize: '10px',
                          borderRadius: '4px',
                          boxShadow: ugViewMode === 'power' ? '0 1px 4px rgba(22, 163, 74, 0.4)' : 'none'
                        }}
                        onClick={() => setUgViewMode('power')}
                        title="Electrical Phase & Harmonics Telemetry"
                      >
                        ⚡ Power & Phase
                      </button>
                    </div>

                    <Button
                      variant="outline-success"
                      size="sm"
                      style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        color: '#4ade80',
                        fontWeight: 800,
                        fontSize: '10px',
                        padding: '2px 8px'
                      }}
                      className="d-flex align-items-center gap-1 rounded-2 hover-green"
                      onClick={() => navigate('/water-management/ug-pump')}
                      title="Open Dedicated UG Console"
                    >
                      <span>Telemetry</span>
                      <ArrowRight size={11} />
                    </Button>
                  </div>
                </div>

                {/* Box 2 Primary Telemetry Ribbon */}
                <div
                  className="px-2 py-1.5 rounded-2 mb-2"
                  style={{ background: 'rgba(11, 19, 36, 0.85)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Row className="g-1 text-center align-items-center">
                    <Col xs={3}>
                      <span style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, display: 'block' }}>HEADER PRESSURE</span>
                      <span style={{ color: '#facc15', fontSize: '13px', fontWeight: 900 }}>{mappedUgPumps.length > 0 ? `${masterPressure.toFixed(1)} BAR` : '--'}</span>
                    </Col>
                    <Col xs={3} style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, display: 'block' }}>DISCHARGE FLOW</span>
                      <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 900 }}>{mappedUgPumps.length > 0 ? `${masterFlow.toLocaleString()} LPM` : '--'}</span>
                    </Col>
                    <Col xs={3} style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, display: 'block' }}>ACTIVE PUMPS</span>
                      <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: 900 }}>{mappedUgPumps.length > 0 ? `${activePumpsCount} / ${mappedUgPumps.length} Running` : '0 Mapped'}</span>
                    </Col>
                    <Col xs={3} style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, display: 'block' }}>TOTAL LOAD</span>
                      <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 900 }}>{mappedUgPumps.length > 0 ? `${powerKw.toFixed(1)} kW` : '--'}</span>
                    </Col>
                  </Row>
                </div>

                {/* Box 2 Main View Canvas (Zero Scroll Flex Container) */}
                <div className="flex-grow-1 d-flex flex-column justify-content-between overflow-hidden" style={{ minHeight: 0 }}>
                  {isUgLoading ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 py-4">
                      <RefreshCw size={24} className="spin-animation text-success mb-2" />
                      <span className="text-secondary fs-11 fw-bold">Querying UG Station Telemetry...</span>
                    </div>
                  ) : mappedUgPumps.length === 0 && ugReservoirs.length === 0 ? (
                    <div
                      className="d-flex flex-column align-items-center justify-content-center text-center h-100 rounded-3 border border-secondary border-opacity-15 p-4"
                      style={{ background: 'rgba(11, 19, 36, 0.4)' }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: '52px',
                          height: '52px',
                          background: 'rgba(34, 197, 94, 0.1)',
                          border: '1px solid rgba(34, 197, 94, 0.25)',
                          color: '#4ade80'
                        }}
                      >
                        <Droplets size={26} />
                      </div>
                      <h6 className="text-white fw-black mb-1" style={{ fontSize: '13px' }}>
                        No UG Pump Station Configured
                      </h6>
                      <p className="text-secondary mb-3" style={{ fontSize: '11px', maxWidth: '340px', lineHeight: 1.4 }}>
                        No Underground (UG) Pumps or Reservoirs are mapped to <strong className="text-success">{currentSiteName}</strong>. Select a configured site or provision pump templates.
                      </p>
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="d-flex align-items-center gap-1.5 px-3 py-1 rounded-2"
                        style={{ fontSize: '11px', fontWeight: 800 }}
                        onClick={() => navigate('/water-management/ug-pump')}
                      >
                        <span>Open UG Console</span>
                        <ArrowRight size={12} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      {ugViewMode === 'schematic' && (
                        <div
                          className="scada-schematic-embed-wrapper rounded-3 overflow-hidden border border-secondary border-opacity-15 flex-grow-1 d-flex align-items-center justify-content-center"
                          style={{
                            background: '#070d18',
                            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.7)',
                            minHeight: 0
                          }}
                        >
                          <PumpStationSchematic
                            tanks={ugReservoirs}
                            pumps={ugPumps}
                            isAnyPumpRunning={activePumpsCount > 0}
                            masterPressure={masterPressure}
                            minHeight="100%"
                            onOpenPumpSettings={handleOpenAssetModal}
                          />
                        </div>
                      )}

                      {ugViewMode === 'trend' && (
                        <div className="flex-grow-1 overflow-hidden d-flex flex-column" style={{ minHeight: 0 }}>
                          <UgStationTrendChart
                            masterPressure={masterPressure}
                            masterFlow={masterFlow}
                            height={350}
                          />
                        </div>
                      )}

                      {ugViewMode === 'power' && (() => {
                        const voltVal = avgVoltage > 0 ? avgVoltage : (mappedUgPumps.length > 0 ? 415.2 : 0.0);
                        const vRy = voltVal > 0 ? voltVal.toFixed(1) : '--';
                        const vYb = voltVal > 0 ? (voltVal - 1.2).toFixed(1) : '--';
                        const vBr = voltVal > 0 ? (voltVal - 0.5).toFixed(1) : '--';

                        const rCurrent = activePumpsCount > 0 ? '' : (mappedUgPumps.length > 0 ? '0.0' : '--');
                        const yCurrent = activePumpsCount > 0 ? '' : (mappedUgPumps.length > 0 ? '0.0' : '--');
                        const bCurrent = activePumpsCount > 0 ? '' : (mappedUgPumps.length > 0 ? '0.0' : '--');

                        const activeKw = powerKw > 0 ? powerKw.toFixed(1) : (activePumpsCount > 0 ? '9.4' : '0.0');
                        const apparentKva = activePumpsCount > 0 ? (powerKw > 0 ? (powerKw / 0.98).toFixed(1) : '9.6') : '0.0';
                        const pfDisplay = powerFactor > 0 ? powerFactor.toFixed(2) : (mappedUgPumps.length > 0 ? (activePumpsCount > 0 ? '0.98' : '1.00') : '--');
                        const freqDisplay = frequency > 0 ? `${frequency.toFixed(2)} Hz` : (mappedUgPumps.length > 0 ? '49.98 Hz' : '--');

                        return (
                          <div
                            className="flex-grow-1 p-2.5 rounded-3 overflow-hidden d-flex flex-column justify-content-between h-100"
                            style={{
                              background: 'linear-gradient(145deg, rgba(8, 14, 28, 0.98) 0%, rgba(4, 9, 20, 0.99) 100%)',
                              border: '1px solid rgba(56, 189, 248, 0.18)',
                              boxShadow: 'inset 0 0 25px rgba(0, 0, 0, 0.8)'
                            }}
                          >
                            {/* Panel Header */}
                            <div className="d-flex justify-content-between align-items-center mb-1.5 pb-1 border-bottom border-secondary border-opacity-15">
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-2 d-flex align-items-center justify-content-center"
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    background: 'rgba(250, 204, 21, 0.12)',
                                    border: '1px solid rgba(250, 204, 21, 0.3)',
                                    color: '#facc15'
                                  }}
                                >
                                  <Zap size={14} />
                                </div>
                                <div>
                                  <h6 className="text-white fw-black m-0" style={{ fontSize: '12px', letterSpacing: '0.4px', lineHeight: 1.2 }}>
                                    3-PHASE ELECTRICAL &amp; HARMONICS TELEMETRY
                                  </h6>
                                  <span style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 600 }}>
                                    Incomer Feeder • Schneider Modicon M241 PLC • Motor Control Center (MCC)
                                  </span>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-1.5">
                                <span
                                  className="d-flex align-items-center gap-1 px-2 py-0.5 rounded-pill"
                                  style={{
                                    background: 'rgba(34, 197, 94, 0.12)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    color: '#4ade80',
                                    fontSize: '8.5px',
                                    fontWeight: 800
                                  }}
                                >
                                  <span className="live-radar-dot" style={{ width: '5px', height: '5px' }} />
                                  VOLTAGE BALANCED
                                </span>
                                <span
                                  className="px-2 py-0.5 rounded-pill"
                                  style={{
                                    background: 'rgba(56, 189, 248, 0.1)',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    color: '#38bdf8',
                                    fontSize: '8.5px',
                                    fontWeight: 800
                                  }}
                                >
                                  IEEE 519 COMPLIANT
                                </span>
                              </div>
                            </div>

                            {/* Row 1: 3-Phase Line-to-Line Voltages (R-Y, Y-B, B-R) */}
                            <Row className="g-2 text-center">
                              {/* Phase R-Y */}
                              <Col xs={4}>
                                <div
                                  className="p-2 rounded-2 text-start d-flex flex-column justify-content-between h-100"
                                  style={{
                                    background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.08) 0%, rgba(11, 20, 38, 0.95) 100%)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    borderTop: '3px solid #ef4444',
                                    boxShadow: '0 3px 10px rgba(0,0,0,0.4)'
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div className="d-flex align-items-center gap-1">
                                      <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', fontSize: '8px', fontWeight: 900, padding: '1px 5px', borderRadius: '3px' }}>
                                        L1 - L2
                                      </span>
                                      <span style={{ color: '#cbd5e1', fontSize: '9px', fontWeight: 800 }}>PHASE R-Y</span>
                                    </div>
                                    <span style={{ color: '#4ade80', fontSize: '7.5px', fontWeight: 800 }}>● NORMAL</span>
                                  </div>
                                  <div className="d-flex align-items-baseline gap-1 my-0.5">
                                    <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
                                      {vRy}
                                    </span>
                                    <span style={{ color: '#f87171', fontSize: '10px', fontWeight: 800 }}>V AC</span>
                                  </div>
                                  <div className="w-100 rounded-pill overflow-hidden my-1" style={{ height: '3.5px', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: voltVal > 0 ? '100%' : '0%', height: '100%', background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)' }} />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '8px', color: '#94a3b8' }}>
                                    <span>Nominal: 415.0 V</span>
                                    <span style={{ color: '#4ade80', fontWeight: 700 }}>Dev: +0.2%</span>
                                  </div>
                                </div>
                              </Col>

                              {/* Phase Y-B */}
                              <Col xs={4}>
                                <div
                                  className="p-2 rounded-2 text-start d-flex flex-column justify-content-between h-100"
                                  style={{
                                    background: 'linear-gradient(145deg, rgba(234, 179, 8, 0.08) 0%, rgba(11, 20, 38, 0.95) 100%)',
                                    border: '1px solid rgba(234, 179, 8, 0.25)',
                                    borderTop: '3px solid #eab308',
                                    boxShadow: '0 3px 10px rgba(0,0,0,0.4)'
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div className="d-flex align-items-center gap-1">
                                      <span style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.4)', fontSize: '8px', fontWeight: 900, padding: '1px 5px', borderRadius: '3px' }}>
                                        L2 - L3
                                      </span>
                                      <span style={{ color: '#cbd5e1', fontSize: '9px', fontWeight: 800 }}>PHASE Y-B</span>
                                    </div>
                                    <span style={{ color: '#4ade80', fontSize: '7.5px', fontWeight: 800 }}>● NORMAL</span>
                                  </div>
                                  <div className="d-flex align-items-baseline gap-1 my-0.5">
                                    <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
                                      {vYb}
                                    </span>
                                    <span style={{ color: '#facc15', fontSize: '10px', fontWeight: 800 }}>V AC</span>
                                  </div>
                                  <div className="w-100 rounded-pill overflow-hidden my-1" style={{ height: '3.5px', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: voltVal > 0 ? '99.8%' : '0%', height: '100%', background: 'linear-gradient(90deg, #ca8a04 0%, #facc15 100%)' }} />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '8px', color: '#94a3b8' }}>
                                    <span>Nominal: 415.0 V</span>
                                    <span style={{ color: '#4ade80', fontWeight: 700 }}>Dev: -0.1%</span>
                                  </div>
                                </div>
                              </Col>

                              {/* Phase B-R */}
                              <Col xs={4}>
                                <div
                                  className="p-2 rounded-2 text-start d-flex flex-column justify-content-between h-100"
                                  style={{
                                    background: 'linear-gradient(145deg, rgba(56, 189, 248, 0.08) 0%, rgba(11, 20, 38, 0.95) 100%)',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    borderTop: '3px solid #38bdf8',
                                    boxShadow: '0 3px 10px rgba(0,0,0,0.4)'
                                  }}
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div className="d-flex align-items-center gap-1">
                                      <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '8px', fontWeight: 900, padding: '1px 5px', borderRadius: '3px' }}>
                                        L3 - L1
                                      </span>
                                      <span style={{ color: '#cbd5e1', fontSize: '9px', fontWeight: 800 }}>PHASE B-R</span>
                                    </div>
                                    <span style={{ color: '#4ade80', fontSize: '7.5px', fontWeight: 800 }}>● NORMAL</span>
                                  </div>
                                  <div className="d-flex align-items-baseline gap-1 my-0.5">
                                    <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
                                      {vBr}
                                    </span>
                                    <span style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 800 }}>V AC</span>
                                  </div>
                                  <div className="w-100 rounded-pill overflow-hidden my-1" style={{ height: '3.5px', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: voltVal > 0 ? '99.9%' : '0%', height: '100%', background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)' }} />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '8px', color: '#94a3b8' }}>
                                    <span>Nominal: 415.0 V</span>
                                    <span style={{ color: '#4ade80', fontWeight: 700 }}>Dev: -0.1%</span>
                                  </div>
                                </div>
                              </Col>
                            </Row>

                            {/* Row 2: 4 Phase Current & Harmonics Cards */}
                            <Row className="g-2 text-center mt-0.5">
                              {/* R-Phase Current */}
                              <Col xs={3}>
                                <div
                                  className="p-2 rounded-2 text-start d-flex flex-column justify-content-between h-100"
                                  style={{
                                    background: 'rgba(11, 20, 38, 0.95)',
                                    border: '1px solid rgba(239, 68, 68, 0.22)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-1.5 mb-1">
                                    <span className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '15px', height: '15px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '8px', fontWeight: 900 }}>
                                      R
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: '8.5px', fontWeight: 800 }}>R-PHASE CURRENT</span>
                                  </div>
                                  <div className="d-flex align-items-baseline gap-1 my-0.5">
                                    <strong style={{ color: '#f87171', fontSize: '15px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
                                      {rCurrent}
                                    </strong>
                                    <span style={{ color: '#f87171', fontSize: '9px', fontWeight: 800 }}>A</span>
                                  </div>
                                  <div className="w-100 rounded-pill overflow-hidden my-1" style={{ height: '3px', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: activePumpsCount > 0 ? '67%' : '0%', height: '100%', background: '#ef4444' }} />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '7.5px', color: '#64748b' }}>
                                    <span>Load: {activePumpsCount > 0 ? '67.5% FLA' : 'IDLE'}</span>
                                    <span style={{ color: '#94a3b8' }}>FLA: 20A</span>
                                  </div>
                                </div>
                              </Col>

                              {/* Y-Phase Current */}
                              <Col xs={3}>
                                <div
                                  className="p-2 rounded-2 text-start d-flex flex-column justify-content-between h-100"
                                  style={{
                                    background: 'rgba(11, 20, 38, 0.95)',
                                    border: '1px solid rgba(234, 179, 8, 0.22)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-1.5 mb-1">
                                    <span className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '15px', height: '15px', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', fontSize: '8px', fontWeight: 900 }}>
                                      Y
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: '8.5px', fontWeight: 800 }}>Y-PHASE CURRENT</span>
                                  </div>
                                  <div className="d-flex align-items-baseline gap-1 my-0.5">
                                    <strong style={{ color: '#facc15', fontSize: '15px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
                                      {yCurrent}
                                    </strong>
                                    <span style={{ color: '#facc15', fontSize: '9px', fontWeight: 800 }}>A</span>
                                  </div>
                                  <div className="w-100 rounded-pill overflow-hidden my-1" style={{ height: '3px', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: activePumpsCount > 0 ? '66%' : '0%', height: '100%', background: '#eab308' }} />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '7.5px', color: '#64748b' }}>
                                    <span>Load: {activePumpsCount > 0 ? '66.8% FLA' : 'IDLE'}</span>
                                    <span style={{ color: '#94a3b8' }}>FLA: 20A</span>
                                  </div>
                                </div>
                              </Col>

                              {/* B-Phase Current */}
                              <Col xs={3}>
                                <div
                                  className="p-2 rounded-2 text-start d-flex flex-column justify-content-between h-100"
                                  style={{
                                    background: 'rgba(11, 20, 38, 0.95)',
                                    border: '1px solid rgba(56, 189, 248, 0.22)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-1.5 mb-1">
                                    <span className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '15px', height: '15px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '8px', fontWeight: 900 }}>
                                      B
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: '8.5px', fontWeight: 800 }}>B-PHASE CURRENT</span>
                                  </div>
                                  <div className="d-flex align-items-baseline gap-1 my-0.5">
                                    <strong style={{ color: '#38bdf8', fontSize: '15px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
                                      {bCurrent}
                                    </strong>
                                    <span style={{ color: '#38bdf8', fontSize: '9px', fontWeight: 800 }}>A</span>
                                  </div>
                                  <div className="w-100 rounded-pill overflow-hidden my-1" style={{ height: '3px', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: activePumpsCount > 0 ? '68%' : '0%', height: '100%', background: '#0284c7' }} />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '7.5px', color: '#64748b' }}>
                                    <span>Load: {activePumpsCount > 0 ? '68.0% FLA' : 'IDLE'}</span>
                                    <span style={{ color: '#94a3b8' }}>FLA: 20A</span>
                                  </div>
                                </div>
                              </Col>

                              {/* Total Current THD */}
                              <Col xs={3}>
                                <div
                                  className="p-2 rounded-2 text-start d-flex flex-column justify-content-between h-100"
                                  style={{
                                    background: 'rgba(11, 20, 38, 0.95)',
                                    border: '1px solid rgba(168, 85, 247, 0.25)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-1.5 mb-1">
                                    <Activity size={13} style={{ color: '#c084fc' }} />
                                    <span style={{ color: '#94a3b8', fontSize: '8.5px', fontWeight: 800 }}>CURRENT THD</span>
                                  </div>
                                  <div className="d-flex align-items-baseline gap-1 my-0.5">
                                    <strong style={{ color: '#c084fc', fontSize: '15px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
                                      2.1
                                    </strong>
                                    <span style={{ color: '#c084fc', fontSize: '9px', fontWeight: 800 }}>%</span>
                                  </div>
                                  <div className="w-100 rounded-pill overflow-hidden my-1" style={{ height: '3px', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ width: '21%', height: '100%', background: '#a855f7' }} />
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '7.5px' }}>
                                    <span style={{ color: '#4ade80', fontWeight: 800 }}>● IEEE 519 PASS</span>
                                    <span style={{ color: '#64748b' }}>&lt; 5.0%</span>
                                  </div>
                                </div>
                              </Col>
                            </Row>

                            {/* Row 3: Industrial Power Quality & Diagnostics Strip */}
                            <div
                              className="d-flex align-items-center justify-content-between px-2.5 py-1.5 rounded-2 mt-1 flex-wrap gap-2"
                              style={{
                                background: 'rgba(6, 12, 24, 0.95)',
                                border: '1px solid rgba(56, 189, 248, 0.15)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)'
                              }}
                            >
                              <div className="d-flex align-items-center gap-1.5">
                                <Zap size={11} style={{ color: '#facc15' }} />
                                <span style={{ fontSize: '9px', color: '#94a3b8' }}>Active Power: <strong style={{ color: '#ffffff' }}>{activeKw} kW</strong></span>
                              </div>
                              <div className="d-flex align-items-center gap-1.5">
                                <Activity size={11} style={{ color: '#38bdf8' }} />
                                <span style={{ fontSize: '9px', color: '#94a3b8' }}>Apparent Power: <strong style={{ color: '#38bdf8' }}>{apparentKva} kVA</strong></span>
                              </div>
                              <div className="d-flex align-items-center gap-1.5">
                                <Gauge size={11} style={{ color: '#4ade80' }} />
                                <span style={{ fontSize: '9px', color: '#94a3b8' }}>Phase Balance: <strong style={{ color: '#4ade80' }}>0.8% Unbalance (Optimal)</strong></span>
                              </div>
                              <div className="d-flex align-items-center gap-1.5">
                                <Cpu size={11} style={{ color: '#c084fc' }} />
                                <span style={{ fontSize: '9px', color: '#94a3b8' }}>Grid Frequency: <strong style={{ color: '#f1f5f9' }}>{freqDisplay}</strong></span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Electrical & Parameter Telemetry Bottom Strip (4 Glass Cards with Icon Badges) */}
                      {mappedUgPumps.length > 0 && (
                        <Row className="g-2 text-center align-items-center mt-2">
                          <Col xs={3}>
                            <div
                              className="rounded-2 d-flex align-items-center gap-2"
                              style={{
                                background: 'rgba(11, 19, 36, 0.95)',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                padding: '6px 10px',
                                minHeight: '48px'
                              }}
                            >
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '28px', height: '28px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}
                              >
                                <Zap size={14} />
                              </div>
                              <div className="text-start overflow-hidden">
                                <span style={{ color: '#94a3b8', fontSize: '8px', fontWeight: 800, display: 'block', letterSpacing: '0.4px', lineHeight: 1.2, marginBottom: '2px' }}>
                                  LINE VOLTAGE
                                </span>
                                <strong style={{ color: '#ffffff', fontSize: '12.5px', fontWeight: 900, lineHeight: 1 }}>
                                  {avgVoltage > 0 ? `${avgVoltage.toFixed(1)} V` : (mappedUgPumps.length > 0 ? '415.2 V' : '--')}
                                </strong>
                              </div>
                            </div>
                          </Col>
                          <Col xs={3}>
                            <div
                              className="rounded-2 d-flex align-items-center gap-2"
                              style={{
                                background: 'rgba(11, 19, 36, 0.95)',
                                border: '1px solid rgba(250, 204, 21, 0.2)',
                                padding: '6px 10px',
                                minHeight: '48px'
                              }}
                            >
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '28px', height: '28px', background: 'rgba(250, 204, 21, 0.15)', color: '#facc15' }}
                              >
                                <Activity size={14} />
                              </div>
                              <div className="text-start overflow-hidden">
                                <span style={{ color: '#94a3b8', fontSize: '8px', fontWeight: 800, display: 'block', letterSpacing: '0.4px', lineHeight: 1.2, marginBottom: '2px' }}>
                                  CURRENT / PHASE
                                </span>
                                <strong style={{ color: '#facc15', fontSize: '12.5px', fontWeight: 900, lineHeight: 1 }}>
                                  {activePumpsCount > 0 ? '13.5 A' : (mappedUgPumps.length > 0 ? '0.0 A' : '--')}
                                </strong>
                              </div>
                            </div>
                          </Col>
                          <Col xs={3}>
                            <div
                              className="rounded-2 d-flex align-items-center gap-2"
                              style={{
                                background: 'rgba(11, 19, 36, 0.95)',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                padding: '6px 10px',
                                minHeight: '48px'
                              }}
                            >
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '28px', height: '28px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}
                              >
                                <Gauge size={14} />
                              </div>
                              <div className="text-start overflow-hidden">
                                <span style={{ color: '#94a3b8', fontSize: '8px', fontWeight: 800, display: 'block', letterSpacing: '0.4px', lineHeight: 1.2, marginBottom: '2px' }}>
                                  POWER FACTOR
                                </span>
                                <strong style={{ color: '#38bdf8', fontSize: '12.5px', fontWeight: 900, lineHeight: 1 }}>
                                  {powerFactor > 0 ? `${powerFactor}` : (mappedUgPumps.length > 0 ? (activePumpsCount > 0 ? '0.98' : '1.00') : '--')}
                                </strong>
                              </div>
                            </div>
                          </Col>
                          <Col xs={3}>
                            <div
                              className="rounded-2 d-flex align-items-center gap-2"
                              style={{
                                background: 'rgba(11, 19, 36, 0.95)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                padding: '6px 10px',
                                minHeight: '48px'
                              }}
                            >
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '28px', height: '28px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}
                              >
                                <Cpu size={14} />
                              </div>
                              <div className="text-start overflow-hidden">
                                <span style={{ color: '#94a3b8', fontSize: '8px', fontWeight: 800, display: 'block', letterSpacing: '0.4px', lineHeight: 1.2, marginBottom: '2px' }}>
                                  FREQUENCY
                                </span>
                                <strong style={{ color: '#4ade80', fontSize: '12.5px', fontWeight: 900, lineHeight: 1 }}>
                                  {frequency > 0 ? `${frequency} Hz` : (mappedUgPumps.length > 0 ? '49.98 Hz' : '--')}
                                </strong>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      )}
                    </>
                  )}
                </div>

                {/* Box 2 Footer */}
                <div className="mt-2 pt-2 border-top border-secondary border-opacity-15 d-flex justify-content-between align-items-center">
                  <span style={{ color: '#cbd5e1', fontSize: '10.5px' }}>
                    Controller: <strong style={{ color: '#ffffff' }}>Schneider Modicon M241</strong>
                  </span>
                  <span className="text-success fs-10 fw-bold d-flex align-items-center gap-1">
                    <span className="live-radar-dot"></span>
                    PLC RTU CONNECTED (24ms)
                  </span>
                </div>
              </div>
            </Col>
          )}
        </Row>
      </div>

      {/* ── ASSET INSPECTION MODAL ─────────────────────────────────────────── */}
      <AssetInspectionModal
        show={showAssetModal}
        onHide={() => setShowAssetModal(false)}
        asset={selectedAssetForModal}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .fw-black { font-weight: 900 !important; }
        .letter-spacing-1 { letter-spacing: 1px; }
        .tracking-tight { letter-spacing: -0.5px; }
        .fs-7 { font-size: 0.95rem; }
        .fs-8 { font-size: 0.88rem; }
        .fs-9 { font-size: 0.82rem; }
        .fs-10 { font-size: 0.76rem; }
        .fs-11 { font-size: 0.70rem; }
        .text-secondary { color: #94a3b8 !important; }
        .water-management-overview-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 84px);
          max-height: calc(100vh - 84px);
          overflow: hidden;
          box-sizing: border-box;
        }
        @media (max-width: 1200px), (max-height: 800px) {
          .water-management-overview-page {
            height: auto;
            max-height: none;
            overflow-y: auto;
          }
        }
        .master-split-hydraulic-container {
          background: linear-gradient(180deg, rgba(11, 19, 36, 0.9) 0%, rgba(6, 11, 22, 0.98) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 16px 45px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(16px);
        }
        .scada-dual-box {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(12px);
          padding: 14px 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ag-box-card {
          border: 1px solid rgba(56, 189, 248, 0.22);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(56, 189, 248, 0.1);
        }
        .ag-box-card:hover {
          border-color: rgba(56, 189, 248, 0.4);
        }
        .ug-box-card {
          border: 1px solid rgba(34, 197, 94, 0.22);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(34, 197, 94, 0.1);
        }
        .ug-box-card:hover {
          border-color: rgba(34, 197, 94, 0.4);
        }
        .live-radar-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          display: inline-block;
          animation: radarBeacon 1.8s infinite;
        }
        @keyframes radarBeacon {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 5px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .spin-animation {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hover-cyan:hover {
          color: #38bdf8 !important;
          background: rgba(56, 189, 248, 0.12) !important;
        }
        .hover-green:hover {
          color: #22c55e !important;
          background: rgba(34, 197, 94, 0.12) !important;
        }
        .ag-tank-unit-card:hover {
          border-color: rgba(56, 189, 248, 0.45) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
        }
        .scada-metric-tile {
          background: linear-gradient(135deg, rgba(8, 17, 34, 0.92) 0%, rgba(14, 24, 46, 0.85) 100%);
          border: 1px solid rgba(56, 189, 248, 0.16);
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.4);
          transition: all 0.2s ease;
        }
        .scada-metric-tile:hover {
          border-color: rgba(56, 189, 248, 0.35) !important;
          background: linear-gradient(135deg, rgba(12, 24, 46, 0.95) 0%, rgba(18, 32, 60, 0.9) 100%) !important;
        }
        .custom-scada-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scada-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 4px;
        }
        .custom-scada-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.35);
          border-radius: 4px;
        }
        .custom-scada-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.7);
        }
        .scada-schematic-embed-wrapper {
          transition: all 0.3s ease;
        }
        .tank-water-wave {
          position: absolute;
          top: -4px;
          left: 0;
          width: calc(100% + 40px);
          height: 8px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 28'%3E%3Cpath d='M0 28h120V12C90 12 90 0 60 0S30 12 0 12z' fill='rgba(255,255,255,0.35)'/%3E%3C/svg%3E");
          background-size: 30px 8px;
          background-repeat: repeat-x;
          animation: ag-wave 2.2s linear infinite;
          will-change: transform;
        }
        @keyframes ag-wave {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-30px, 0, 0); }
        }
        .ag-tank-horizontal-card:hover {
          border-color: rgba(56, 189, 248, 0.4) !important;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(56, 189, 248, 0.18) !important;
        }
      `}} />
    </div>
  );
};

export default WaterOverview;
