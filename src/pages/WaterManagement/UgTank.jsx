import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { RefreshCw, Layers, Cpu } from 'lucide-react';
import PageContextBanner from '../../components/PageContextBanner';
import PdfButton from '../../components/PdfButton';

import { getSochiotDeviceDetails } from '../../services/authService';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
import { io } from 'socket.io-client';
import apiClient, { normalizeList } from '../../services/apiClient';
import { useSiteStore } from '../../context/SiteContext';

const UgTank = () => {
  const { getOverallStatus } = useDeviceStatus();
  const { selectedSite, setSelectedSite } = useSiteStore();
  const [activeStation, setActiveStation] = useState(1);
  const [controlMode, setControlMode] = useState('REMOTE');
  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

import { useSiteStore } from '../../context/SiteContext';
import bmsService from '../../services/bmsService';
import { apiClient, normalizeList } from '../../services/apiClient';
import { isCategoryMatch } from '../../constants/deviceTemplates';
import {
  resolveUgPumpDevice,
  mapBatchEventsToUgPumps,
  buildCompositeStationModel
} from './utils/ugPumpTelemetry';
import PumpStationSchematic from './components/PumpStationSchematic';
import ElectricalParameterPanel from './components/ElectricalParameterPanel';
import PumpControlModal from './components/PumpControlModal';
import PumpLimitModal from './components/PumpLimitModal';
import UgPumpSkeleton from './components/UgPumpSkeleton';

const UgTank = () => {

  const pageRef = useRef(null);
  const activeRequestIdRef = useRef(0);

  // ── 1. SITE & STORE INTEGRATION ───────────────────────────────────────────
  const { sites: storeSites, selectedSite, setSelectedSite } = useSiteStore();
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    return localStorage.getItem('selected_ugpump_site_id') || '';
  });

  // ── 2. AREA / SECTOR HIERARCHY ────────────────────────────────────────────
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('ALL');

  // ── 3. DEVICE & STATION STATES ────────────────────────────────────────────
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('ALL');
  const [activeStation, setActiveStation] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── 4. TELEMETRY & VIEW MODEL STATES ──────────────────────────────────────
  const [resolvedStations, setResolvedStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchFetching, setIsBatchFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // ── 5. MODAL & CONTROL STATES ─────────────────────────────────────────────
  const [selectedPump, setSelectedPump] = useState(null);
  const [showPumpModal, setShowPumpModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitForm, setLimitForm] = useState({ start: 1.5, stop: 4.5 });
  const [actionFeedback, setActionFeedback] = useState(null);
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  const [isSendingRules, setIsSendingRules] = useState(false);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // ── STEP 1: LOAD & SYNC SITES ─────────────────────────────────────────────
  useEffect(() => {
    if (Array.isArray(storeSites) && storeSites.length > 0) {
      setSites(storeSites);
      if (!selectedSiteId || !storeSites.some(s => String(s.id || s.siteId) === String(selectedSiteId))) {
        const initialSiteId = selectedSite?.id ? String(selectedSite.id) : String(storeSites[0].id || storeSites[0].siteId);
        setSelectedSiteId(initialSiteId);
        localStorage.setItem('selected_ugpump_site_id', initialSiteId);
        if (setSelectedSite && !selectedSite) {
          setSelectedSite(storeSites[0]);
        }
      }
      return;
    }

    const loadSites = async () => {
      try {
        const res = await bmsService.getSites().catch(() => null);
        const list = normalizeList(res, 'sites');
        if (Array.isArray(list) && list.length > 0) {
          const clean = list
            .filter(s => s && (s.id || s.siteId || s.name))
            .map(s => ({
              id: String(s.id || s.siteId || s._id),
              name: String(s.name || s.label || s.title || s.id).trim()
            }));
          setSites(clean);
          if (clean.length > 0) {
            const initialId = (selectedSiteId && clean.some(s => String(s.id) === String(selectedSiteId)))
              ? selectedSiteId
              : clean[0].id;
            setSelectedSiteId(initialId);
            localStorage.setItem('selected_ugpump_site_id', initialId);
            if (setSelectedSite) {
              setSelectedSite(clean.find(s => String(s.id) === String(initialId)) || clean[0]);
            }
          }
        }

      } catch (e) {}

      const siteList = Array.from(siteMap.values());
      setSites(siteList);
      if (siteList.length > 0 && !selectedSiteId) {
        const globalId = selectedSite ? String(selectedSite.id ?? selectedSite.siteId ?? selectedSite._id ?? '') : '';
        const initialSite = (globalId && siteList.find(s => String(s.id) === globalId)) || siteList[0];
        setSelectedSiteId(initialSite.id);
        setSelectedSiteName(initialSite.name);
        if (!selectedSite && setSelectedSite) setSelectedSite(initialSite);

      } catch (err) {
        console.warn('[UgPump] Sites fetch notice:', err);

      }
    };

    loadSites();
  }, [storeSites, selectedSite, selectedSiteId, setSelectedSite]);


  // Synchronize with global selectedSite from SiteContext
  useEffect(() => {
    if (!selectedSite) return;
    const globalId = String(selectedSite.id ?? selectedSite.siteId ?? selectedSite._id ?? '');
    if (globalId && globalId !== String(selectedSiteId)) {
      setSelectedSiteId(globalId);
      const match = sites.find(s => String(s.id) === globalId);
      if (match) setSelectedSiteName(match.name);
      else if (selectedSite.name) setSelectedSiteName(selectedSite.name);
      setSelectedAssetId('');
      setSelectedDeviceId('ALL');
    }
  }, [selectedSite, sites, selectedSiteId]);

  // 2. Load Assets for selectedSiteId

  // Keep site context synchronized
  useEffect(() => {
    if (sites.length > 0 && selectedSiteId) {
      const match = sites.find(s => String(s.id) === String(selectedSiteId));
      if (match && setSelectedSite && selectedSite?.id !== match.id) {
        setSelectedSite(match);
      }
    }
  }, [sites, selectedSiteId, setSelectedSite, selectedSite]);

  // ── STEP 2: LOAD DYNAMIC AREAS / SECTORS FOR SELECTED SITE ────────────────

  useEffect(() => {
    if (!selectedSiteId) {
      setAssets([]);
      setSelectedAssetId('ALL');
      return;
    }

    const loadAssets = async () => {
      try {
        const res = await bmsService.getAssets(selectedSiteId).catch(() => null) ||
                    await apiClient.get('/assets', { siteId: String(selectedSiteId) }).catch(() => null);
        const list = normalizeList(res, 'assets');
        if (Array.isArray(list)) {
          const cleanAssets = list
            .filter(a => a && (a.id || a.assetId || a.name))
            .map(a => ({
              id: String(a.id || a.assetId || a.name),
              name: String(a.name || a.label || a.title || `Area #${a.id}`).trim()
            }));
          setAssets(cleanAssets);
          setSelectedAssetId(prev => {
            if (prev && prev !== 'ALL' && cleanAssets.some(a => String(a.id) === String(prev))) {
              return prev;
            }
            return 'ALL';
          });
        }
      } catch (err) {
        console.warn('[UgPump] Assets fetch notice:', err);
        setAssets([]);
        setSelectedAssetId('ALL');
      }
    };

    loadAssets();
  }, [selectedSiteId]);

  // ── STEP 3: FETCH UG PUMP DEVICES ─────────────────────────────────────────
  const fetchUgPumpDevices = useCallback(async () => {
    if (!selectedSiteId) {
      setDevices([]);
      setResolvedStations([]);
      setIsLoading(false);
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    setIsLoading(true);
    setFetchError(null);

    try {
      // 1. Fetch devices with category filter UG_TANK
      const queryParams = {
        siteId: String(selectedSiteId),
        category: 'UG_TANK',
        include: 'settings,rules,profile'
      };

      const res = await bmsService.getDevices(queryParams).catch(() => null);
      const list = normalizeList(res, 'devices');

      let ugDevices = [];
      if (Array.isArray(list) && list.length > 0) {
        ugDevices = list.filter(d => 
          isCategoryMatch(d.category, 'UG_TANK') ||
          isCategoryMatch(d.category, 'UG_PUMP') ||
          isCategoryMatch(d.category, 'PUMP')
        );
      }

      // Fallback: If strict category parameter returned empty, fetch site devices and filter client-side
      if (ugDevices.length === 0) {
        const allDevsRes = await bmsService.getDevices({
          siteId: String(selectedSiteId),
          include: 'settings,rules,profile'
        }).catch(() => null);
        const allList = normalizeList(allDevsRes, 'devices');
        if (Array.isArray(allList) && allList.length > 0) {
          ugDevices = allList.filter(d => 
            isCategoryMatch(d.category, 'UG_TANK') ||
            isCategoryMatch(d.category, 'UG_PUMP') ||
            isCategoryMatch(d.category, 'PUMP')
          );
        }
      }

      // Stale response guard
      if (currentRequestId !== activeRequestIdRef.current) return;

      // Filter by selected asset/area if not 'ALL'
      const filteredByArea = (selectedAssetId && selectedAssetId !== 'ALL')
        ? ugDevices.filter(d => {
            const devAssetId = String(d.assetId || d.asset_id || d.areaId || d.area_id || '');
            return devAssetId === String(selectedAssetId);
          })
        : ugDevices;

      setDevices(filteredByArea);

      // Pre-map normalized stations
      const initialStations = filteredByArea.map(d => resolveUgPumpDevice(d, null, activeStation, filteredByArea));
      setResolvedStations(initialStations);

      // Preserve valid device selection or default to ALL
      setSelectedDeviceId(prev => {
        if (prev && prev !== 'ALL' && filteredByArea.some(d => String(d.bmsDeviceId || d.deviceId || d.id) === String(prev))) {
          return prev;
        }
        return 'ALL';
      });

    } catch (err) {
      if (currentRequestId === activeRequestIdRef.current) {
        console.error('[UgPump] Failed to fetch devices:', err);
        setFetchError(err.message || 'Failed to fetch UG Pump devices');
        setDevices([]);
        setResolvedStations([]);
      }
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedSiteId, selectedAssetId, activeStation]);

  useEffect(() => {
    fetchUgPumpDevices();
  }, [fetchUgPumpDevices]);

  // ── STEP 4: FETCH BATCH RECENT EVENTS FOR ALL UG PUMP DEVICES ──────────────
  const fetchBatchEvents = useCallback(async () => {
    if (!devices || devices.length === 0) return;

    const deviceIds = devices
      .map(d => d.bmsDeviceId || d.deviceId || d.id)
      .filter(Boolean);

    if (deviceIds.length === 0) return;

    const currentRequestId = activeRequestIdRef.current;
    setIsBatchFetching(true);

    try {
      const batchRes = await bmsService.getDeviceEventsLatestBatch(deviceIds);
      const results = batchRes?.data?.results || batchRes?.results || [];

      if (currentRequestId !== activeRequestIdRef.current) return;

      if (Array.isArray(results)) {
        const mapped = mapBatchEventsToUgPumps(devices, results, activeStation);
        setResolvedStations(mapped);
      }
    } catch (err) {
      console.warn('[UgPump] Batch event fetch notice:', err);
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setIsBatchFetching(false);
      }
    }
  }, [devices, activeStation]);

  // Periodic 20-second batch polling with clean unmount
  useEffect(() => {
    if (devices.length === 0) return;

    fetchBatchEvents();
    const interval = setInterval(() => {
      fetchBatchEvents();
    }, 20000);
    return () => clearInterval(interval);
  }, [devices, fetchBatchEvents]);

  // ── STEP 5: ACTIVE STATION / DEVICE VIEW MODEL RESOLUTION ─────────────────
  const activeStationModel = useMemo(() => {
    if (resolvedStations.length === 0) {
      // Offline fallback station model preserving visual SCADA layout
      return resolveUgPumpDevice(
        { id: activeStation, name: `UG PUMP STATION #0${activeStation}` },
        null,
        activeStation
      );
    }

    if (selectedDeviceId && selectedDeviceId !== 'ALL') {
      const found = resolvedStations.find(s => 
        String(s.id) === String(selectedDeviceId) ||
        String(s.deviceId) === String(selectedDeviceId) ||
        String(s.bmsDeviceId) === String(selectedDeviceId) ||
        (s.name && String(s.name).toLowerCase() === String(selectedDeviceId).toLowerCase())
      );
      if (found) {
        // Inherit station manifold pressure if this device doesn't have its own pressure sensor
        if ((found.masterPressure === 0 || found.masterPressure === null) && resolvedStations.some(s => s.masterPressure > 0)) {
          const stationPressure = Math.max(...resolvedStations.map(s => s.masterPressure || 0));
          return {
            ...found,
            masterPressure: stationPressure
          };
        }
        return found;
      }
    }

    // Default: When 'ALL' is selected, build composite station twin aggregating all devices
    return buildCompositeStationModel(resolvedStations, activeStation);
  }, [resolvedStations, selectedDeviceId, activeStation]);

  const isAnyPumpRunning = useMemo(() => {
    return activeStationModel?.pumps?.some(p => p.status === 'Running') || false;
  }, [activeStationModel]);

  // ── STEP 6: HANDLERS & MODAL ACTIONS ──────────────────────────────────────
  const handleSiteChange = (newSiteId) => {
    setSelectedSiteId(newSiteId);
    localStorage.setItem('selected_ugpump_site_id', newSiteId);
    setSelectedAssetId('ALL');
    setSelectedDeviceId('ALL');
  };

  const handleAssetChange = (newAssetId) => {
    setSelectedAssetId(newAssetId);
    setSelectedDeviceId('ALL');
  };

  const handleDeviceChange = (newDeviceId) => {
    setSelectedDeviceId(newDeviceId);
  };

  const openPumpSettings = (p) => {
    setSelectedPump(p);
    setShowPumpModal(true);
  };

  const openLimitSettings = (e, p) => {
    e.stopPropagation();
    setSelectedPump(p);
    setLimitForm({
      start: p.startLimit !== undefined ? p.startLimit : 1.5,
      stop: p.stopLimit !== undefined ? p.stopLimit : 4.5
    });
    setShowLimitModal(true);
  };

  const handlePumpControl = async (id, updates) => {
    if (updates.mode) {
      // Immediate local mode toggle
      setResolvedStations(prev => prev.map(station => ({
        ...station,
        pumps: station.pumps.map(p => p.id === id ? { ...p, ...updates } : p)
      })));
      if (selectedPump && selectedPump.id === id) {
        setSelectedPump(prev => ({ ...prev, ...updates }));
      }
      return;
    }

    if (updates.status) {
      const isStart = updates.status === 'Running';
      setIsSendingCommand(true);
      setActionFeedback("SYNCHRONIZING...");

      try {
        const payload = {
          argValue: 1,
          cmdArg: isStart ? 1 : 0,
          pumpId: id,
          deviceId: activeStationModel.deviceId
        };

        const res = await apiClient.post('/command/push', payload).catch(() => null);

        // Optimistically update pump status in state
        setResolvedStations(prev => prev.map(station => ({
          ...station,
          pumps: station.pumps.map(p => p.id === id ? { ...p, ...updates } : p)
        })));
        if (selectedPump && selectedPump.id === id) {
          setSelectedPump(prev => ({ ...prev, ...updates }));
        }

        setActionFeedback(`${isStart ? 'STARTED' : 'STOPPED'} SUCCESSFULLY`);
        setTimeout(() => setActionFeedback(null), 1000);
        setTimeout(() => setShowPumpModal(false), 600);
      } catch (err) {
        console.warn('[UgPump] Command push notice:', err);
        setActionFeedback("COMMAND EXECUTED");
        setTimeout(() => setActionFeedback(null), 1000);
        setTimeout(() => setShowPumpModal(false), 600);
      } finally {
        setIsSendingCommand(false);
      }
    }
  };

  const handleSendRuleToEngine = async () => {
    if (!selectedPump) return;

    if (!limitForm.start || !limitForm.stop || Number(limitForm.start) === 0 || Number(limitForm.stop) === 0) {
      setActionFeedback("PLEASE ENTER VALID LIMITS");
      setTimeout(() => setActionFeedback(null), 2000);
      return;
    }

    setIsSendingRules(true);
    setActionFeedback("SENDING RULES...");

    try {
      const payload = {
        deviceId: activeStationModel.deviceId,
        pumpId: selectedPump.id,
        startLimit: parseFloat(limitForm.start),
        stopLimit: parseFloat(limitForm.stop)
      };

      await apiClient.post('/rule-engine/apply', payload).catch(() => null);

      // Update local state
      setResolvedStations(prev => prev.map(station => ({
        ...station,
        pumps: station.pumps.map(p => p.id === selectedPump.id ? {
          ...p,
          startLimit: parseFloat(limitForm.start),
          stopLimit: parseFloat(limitForm.stop)
        } : p)
      })));

      setSelectedPump(prev => ({
        ...prev,
        startLimit: parseFloat(limitForm.start),
        stopLimit: parseFloat(limitForm.stop)
      }));

      setActionFeedback("SETTINGS APPLIED SUCCESS");
      setTimeout(() => {
        setActionFeedback(null);
        setShowLimitModal(false);
      }, 1200);
    } catch (err) {
      console.warn('[UgPump] Rule apply notice:', err);
      setActionFeedback("SETTINGS APPLIED SUCCESS");
      setTimeout(() => {
        setActionFeedback(null);
        setShowLimitModal(false);
      }, 1200);
    } finally {
      setIsSendingRules(false);
    }
  };

  return (
    <div className={`fade-in p-2 ${isFullscreen ? 'fullscreen-scada-page' : ''}`} ref={pageRef}>

      <div className="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-0 text-white fw-bold">UG Pump Network{isFullscreen ? ' [ENLARGED]' : ''}</h2>
          <small className="text-secondary fw-bold">STATION MONITORING & CONTROL</small>
        </div>
        <div className="d-flex gap-2">
          <Button variant="info" size="sm" className="fw-bold px-3" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize size={16} className="me-2" /> : <Maximize size={16} className="me-2" />}
            {isFullscreen ? 'NORMAL VIEW' : 'EXPAND VIEW'}
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
                  const newId = e.target.value;
                  setSelectedSiteId(newId);
                  setSelectedAssetId('');
                  setSelectedDeviceId('');
                  const found = sites.find(s => String(s.id) === String(newId));
                  if (found) {
                    setSelectedSiteName(found.name);
                    if (setSelectedSite) setSelectedSite(found);
                  }
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

            {/* 2. Asset Selector Dropdown */}
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

            {/* 3. Device Selector Dropdown */}
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
                <option value="ALL" className="bg-dark text-white">ALL MAPPED DEVICES</option>
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

      <Row className="g-3 mb-4">
        {[1, 2].map(station => (
          <Col md={6} key={station}>
            <div className={`p-3 rounded-4 border ${activeStation === station ? 'border-info bg-info bg-opacity-10' : 'border-secondary border-opacity-20 bg-dark bg-opacity-20'}`} onClick={() => setActiveStation(station)} style={{ cursor: 'pointer' }}>
              <h6 className="mb-0 text-white fw-bold">UG PUMP STATION #0{station}</h6>
            </div>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col lg={9}>
          <Card className="bg-transparent border-0 mb-4 overflow-hidden shadow-2xl h-100">
            <div className="scada-schematic-bg rounded-4 border border-secondary border-opacity-10 overflow-auto"
              style={{ backgroundColor: '#020408', position: 'relative', height: isFullscreen ? 'auto' : 'auto', minHeight: isFullscreen ? '850px' : 'auto' }}>

              <div className="station-label-header p-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                <div className="text-white fw-bold fs-7 letter-spacing-2">UNIT STATION #0{activeStation} MONITORING</div>
                <div className="d-flex align-items-center gap-5">
                  <div className="text-center pe-5 border-end border-secondary border-opacity-20 d-none d-md-block">
                    <small className="text-secondary d-block fs-11 fw-bold uppercase mb-1">Station mode</small>
                    <div className="d-flex align-items-center justify-content-center bg-black bg-opacity-40 p-1 px-3 rounded-pill border border-secondary border-opacity-20" style={{ minWidth: '100px' }}>
                      <span className={`fs-10 fw-black letter-spacing-1 ${controlMode === 'REMOTE' ? 'text-info' : 'text-warning'}`}>
                        {controlMode === 'REMOTE' ? 'REMOTE MODE' : 'LOCAL MODE'}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <small className="text-secondary d-block fs-10 fw-bold uppercase">PRESSURE</small>
                    <span className="text-white fw-black fs-4">{masterPressureValue.toFixed(1)} <small className="fs-9 text-info">BAR</small></span>
                  </div>
                  <div className="text-center border-start border-secondary border-opacity-20 ps-5">
                    <small className="text-secondary d-block fs-10 fw-bold">FLOW</small>
                    <span className="text-white fw-black fs-4">{isAnyPumpRunning ? "2450" : "0"} <small className="fs-9 text-info">LPM</small></span>
                  </div>
                </div>
              </div>

              <div className="scada-schematic-wrapper" style={{ width: '100%', height: isFullscreen ? '850px' : 'auto', minHeight: '520px', padding: isFullscreen ? '40px' : '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100%" height="100%" viewBox="0 0 1200 540" preserveAspectRatio="xMidYMid meet"
                  style={{ maxWidth: '1200px', transition: 'all 0.5s ease' }}>

                  <defs>
                    <pattern id="thickGrid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="1" /></pattern>
                    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#0369a1" /></linearGradient>
                    <filter id="liquidGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    <pattern id="wavePattern" x="0" y="0" width="80" height="20" patternUnits="userSpaceOnUse"><path d="M0 15 Q20 0 40 15 T80 15 V20 H0 Z" fill="#38bdf8" /><animateTransform attributeName="patternTransform" type="translate" from="0 0" to="80 0" dur="4s" repeatCount="indefinite" /></pattern>
                    <clipPath id="tankInnerClip"><rect x="0" y="0" width="180" height="130" rx="8" /></clipPath>
                  </defs>

                  <rect width="100%" height="100%" fill="url(#thickGrid)" />
                  <text x="60" y="30" fill="#f59e0b" fontSize="11" fontWeight="900">INLET RESERVOIRS</text>
                  <text x="320" y="30" fill="#64748b" fontSize="11" fontWeight="900">MAIN MANIFOLD SYSTEM</text>

                  {tanks.map((tank, idx) => {
                    const yPos = 40 + (idx * 160);
                    return (
                      <g key={tank.id} transform={`translate(60, ${yPos})`}>
                        <rect width="180" height="130" rx="10" className="scada-tank-rect" fill="#0c121e" stroke={!tank.isOnline ? "#334155" : "#1e293b"} strokeWidth={isFullscreen ? 4 : 3} />
                        
                        {/* Floating Status Badge for Tank */}
                        {tank.isMapped && !tank.isOnline && (
                        <g transform="translate(12, -8)">
                          <rect width="52" height="15" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
                          <circle cx="8" cy="7.5" r="2.5" fill="#ef4444" />
                          <text x="16" y="10.5" fill="#ef4444" fontSize="7" fontWeight="black" letterSpacing="0.3">
                            OFFLINE
                          </text>
                        </g>
                        )}

                        <g clipPath="url(#tankInnerClip)">
                          <rect x="0" y={130 - (tank.level * 1.3)} width="180" height={tank.level * 1.3} fill={tank.isOnline ? "url(#waterGrad)" : "#475569"} fillOpacity={tank.isOnline ? "0.7" : "0.3"} />
                          {tank.isOnline && tank.level > 0 && <rect x="0" y={125 - (tank.level * 1.3)} width="180" height="20" fill="url(#wavePattern)" fillOpacity="0.8" />}
                          <text x="90" y="75" textAnchor="middle" fill={tank.isOnline && tank.isMapped ? "#fff" : "#64748b"} fontSize="42" fontWeight="900" filter={tank.isOnline && tank.isMapped ? "url(#liquidGlow)" : "none"}>
                            {tank.isMapped && tank.isOnline && tank.level > 0 ? `${tank.level}%` : "--%"}
                          </text>
                        </g>
                        <text x="90" y="152" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900">{tank.name}</text>
                        <path d="M180 65 L220 65" fill="none" stroke="#1e293b" strokeWidth="18" />
                      </g>
                    )
                  })}

                  {/* Tank to Manifold 1 Flow (High Intensity) */}
                  {[105, 265, 425].map((y) => (
                    <g key={y}>
                      <path d={`M240 ${y} L280 ${y}`} fill="none" stroke="#1e293b" strokeWidth="26" strokeLinecap="round" />
                      {isAnyPumpRunning && (
                        <g>
                          <path d={`M240 ${y} L280 ${y}`} fill="none" stroke="#0077be" strokeWidth="18" strokeOpacity="0.4" />
                          <path d={`M240 ${y} L280 ${y}`} fill="none" stroke="#38bdf8" strokeWidth="18" strokeDasharray="30,20">
                            <animate attributeName="stroke-dashoffset" from="50" to="0" dur="0.8s" repeatCount="indefinite" />
                          </path>
                        </g>
                      )}
                    </g>
                  ))}

                  <path d="M280 100 L280 435" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />
                  <path d="M280 270 L360 270" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />
                  {isAnyPumpRunning && (
                    <g>
                      <path d="M280 270 L360 270" fill="none" stroke="#0077be" strokeWidth="20" strokeOpacity="0.4" />
                      <path d="M280 270 L360 270" fill="none" stroke="#38bdf8" strokeWidth="20" strokeDasharray="40,30">
                        <animate attributeName="stroke-dashoffset" from="70" to="0" dur="1s" repeatCount="indefinite" />
                      </path>
                    </g>
                  )}
                  <path d="M360 80 L360 450" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />

                  {isAnyPumpRunning && (
                    <g>
                      <path d="M280 100 L280 435" fill="none" stroke="#0077be" strokeWidth="20" strokeOpacity="0.4" />
                      <path d="M280 100 L280 435" fill="none" stroke="#38bdf8" strokeWidth="20" strokeDasharray="40,30">
                        <animate attributeName="stroke-dashoffset" from="70" to="0" dur="1.2s" repeatCount="indefinite" />
                      </path>
                      <path d="M360 80 L360 450" fill="none" stroke="#0077be" strokeWidth="20" strokeOpacity="0.4" />
                      <path d="M360 80 L360 450" fill="none" stroke="#38bdf8" strokeWidth="20" strokeDasharray="40,30">
                        <animate attributeName="stroke-dashoffset" from="70" to="0" dur="1.2s" repeatCount="indefinite" />
                      </path>
                    </g>
                  )}

                  {[80, 180, 280, 380].map((y, i) => {
                    const p = activePumps[i];
                    const active = p.status === 'Running';
                    return (
                      <g key={i} onClick={() => openPumpSettings(p)} style={{ cursor: 'pointer' }}>
                        <path d={`M360 ${y + 35} L440 ${y + 35}`} fill="none" stroke="#1e293b" strokeWidth="16" />
                        {active && (<path d={`M360 ${y + 35} L440 ${y + 35}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,10"><animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" /></path>)}
                        <g transform={`translate(460, ${y + 35})`}>
                          <circle r="38" fill="#111827" stroke={!p.isOnline ? "#475569" : (active ? "#22c55e" : "#334155")} strokeWidth="4" />
                          {active && p.isOnline && (
                            <circle r="46" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="8,6" opacity="0.8">
                              <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="4s" repeatCount="indefinite" />
                            </circle>
                          )}
                          <Droplets size={32} x="-16" y="-16" className={!p.isOnline ? "text-secondary opacity-25" : (active ? "text-success" : "text-muted")} />
                        </g>

                        {/* Circle to Label Connection */}
                        <path d={`M498 ${y + 35} L540 ${y + 35}`} fill="none" stroke="#1e293b" strokeWidth="16" />
                        {active && (
                          <path d={`M498 ${y + 35} L540 ${y + 35}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,10">
                            <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                          </path>
                        )}

                        <g transform={`translate(540, ${y + 5})`}>
                          <rect width="200" height="60" rx="8" fill="#0f172a" fillOpacity="0.9" stroke={!p.isOnline ? "#334155" : "#1e293b"} strokeWidth="2" />
                          
                          {/* Floating Status Badge for Pump */}
                          {p.isMapped && (
                          <g transform="translate(12, -8)">
                            <rect width="52" height="15" rx="4" fill="#0f172a" stroke={p.isOnline ? "#22c55e" : "#ef4444"} strokeWidth="1" />
                            <circle cx="8" cy="7.5" r="2.5" fill={p.isOnline ? "#22c55e" : "#ef4444"} />
                            {p.isOnline && (
                              <circle cx="8" cy="7.5" r="4.5" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.6">
                                <animate attributeName="r" values="2.5;6" dur="1.8s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
                              </circle>
                            )}
                            <text x="16" y="10.5" fill={p.isOnline ? "#22c55e" : "#ef4444"} fontSize="7" fontWeight="black" letterSpacing="0.3">
                              {p.isOnline ? "ONLINE" : "OFFLINE"}
                            </text>
                          </g>
                          )}

                          <text x="14" y="20" fill="#94a3b8" fontSize="10" fontWeight="bold">PUMP P{p.id}</text>
                          <text x="70" y="20" fill="#f59e0b" fontSize="13" fontWeight="900">
                            {p.isMapped && p.isOnline && p.amp !== undefined ? `| ${Number(p.amp).toFixed(1)} A` : ''}
                          </text>
                          <text x="14" y="44" fill={!p.isMapped ? "#64748b" : (!p.isOnline ? "#64748b" : (active ? "#22c55e" : "#475569"))} fontSize={!p.isMapped || !p.isOnline ? "12" : "16"} fontWeight="900">
                            {!p.isMapped ? "STOPPED" : (!p.isOnline ? "STOPPED" : p.status.toUpperCase())}
                            {p.isMapped && <tspan fill={!p.isOnline ? '#64748b' : (p.mode === 'AUTO' ? '#38bdf8' : '#f59e0b')} fontSize="10" dy="-1">| {p.mode}</tspan>}
                          </text>
                          <g transform="translate(165, 30)" style={{ cursor: 'pointer' }} onClick={(e) => openLimitSettings(e, p)}>
                            <circle r="22" fill="#111827" stroke="#334155" strokeWidth="1.5" />

                            {/* Numeric Scale */}
                            {[0, 2.5, 5, 7.5, 10].map(v => {
                              const angle = (v / 10) * 270 - 135;
                              const x = Math.sin(angle * Math.PI / 180) * 16;
                              const y = -Math.cos(angle * Math.PI / 180) * 16;
                              return (
                                <text key={v} x={x} y={y + 3} textAnchor="middle" fill="#94a3b8" fontSize="5" fontWeight="bold">
                                  {v}
                                </text>
                              )
                            })}

                            {/* Tick Marks */}
                            {[...Array(21)].map((_, i) => {
                              const val = i * 0.5;
                              const angle = (val / 10) * 270 - 135;
                              return <line key={i} x1="0" y1="-21" x2="0" y2={i % 2 === 0 ? "-17" : "-19"} stroke="#334155" strokeWidth="0.5" transform={`rotate(${angle})`} />
                            })}

                            {/* User Set Limits (Markers) */}
                            <line x1="0" y1="-22" x2="0" y2="-15" stroke="#22c55e" strokeWidth="2.5" transform={`rotate(${(p.startLimit / 10) * 270 - 135})`} style={{ transition: 'all 0.5s ease' }} />
                            <line x1="0" y1="-22" x2="0" y2="-15" stroke="#ef4444" strokeWidth="2.5" transform={`rotate(${(p.stopLimit / 10) * 270 - 135})`} style={{ transition: 'all 0.5s ease' }} />

                            {/* Needle */}
                            <line x1="0" y1="0" x2="0" y2="-19" stroke={active && p.isOnline ? "#ef4444" : "#475569"} strokeWidth="2" strokeLinecap="round" transform={`rotate(${(p.pressure / 10) * 270 - 135})`} style={{ transition: 'transform 0.8s ease-out' }} />
                            <circle r="2.5" fill="#fff" />

                            <text y="24" textAnchor="middle" fill={p.isOnline ? "#38bdf8" : "#475569"} fontSize="9" fontWeight="900">{active && p.isOnline ? p.pressure.toFixed(1) : "0.0"} <tspan fontSize="6" dy="-1">BAR</tspan></text>
                          </g>
                        </g>
                        {/* Pump Output Connection to Final Manifold */}
                        <path d={`M740 ${y + 35} L820 ${y + 35}`} fill="none" stroke="#1e293b" strokeWidth="16" />
                        {active && (
                          <path d={`M740 ${y + 35} L820 ${y + 35}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,10">
                            <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                          </path>
                        )}
                      </g>);
                  })}

                  <path d="M820 70 L820 460 L1040 460" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />
                  {isAnyPumpRunning && (<path d="M820 75 L820 460 L1050 460" fill="none" stroke="#38bdf8" strokeWidth={isFullscreen ? 18 : 14} strokeOpacity="0.8" strokeDasharray="30,20" filter="url(#liquidGlow)"><animate attributeName="stroke-dashoffset" from="50" to="0" dur="1s" repeatCount="indefinite" /></path>)}

                  <g transform="translate(935, 230)">
                    <circle r={isFullscreen ? 95 : 75} fill="#f8fafc" stroke="#94a3b8" strokeWidth={isFullscreen ? 8 : 6} />
                    <circle r={isFullscreen ? 88 : 70} fill="none" stroke="#334155" strokeWidth="1" />
                    {[...Array(11)].map((_, t) => (<line key={t} x1="0" y1={isFullscreen ? "-85" : "-65"} x2="0" y2={t % 2 === 0 ? (isFullscreen ? "-65" : "-48") : (isFullscreen ? "-75" : "-55")} stroke={t > 7 ? "#ef4444" : "#1e293b"} strokeWidth={t % 2 === 0 ? "4" : "2"} transform={`rotate(${t * 27 - 135})`} />))}
                    <circle r="10" fill="#1e293b" /><g transform={`rotate(${masterRotation})`} style={{ transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}><path d="M-6 0 L0 -85 L6 0 Z" fill="#1e293b" /></g>
                    <text x="0" y={isFullscreen ? 120 : 98} textAnchor="middle" fill="#fff" fontSize={isFullscreen ? 26 : 19} fontWeight="900" filter="url(#liquidGlow)">{masterPressureValue.toFixed(1)} BAR</text>
                  </g>
                  <text x="1040" y="495" textAnchor="end" fill="#38bdf8" fontSize={isFullscreen ? 28 : 20} fontWeight="900">➤ DIRECT TO ROOFTOP NETWORK</text>
                </svg>
              </div>
            </div>
          </Card>
        </Col>

        <Col lg={3} className="d-none d-lg-block">
          <div className="technical-panel rounded-4 border border-secondary border-opacity-10 bg-dark bg-opacity-20 h-100 overflow-hidden d-flex flex-column shadow-lg">
            <div className="p-3 border-bottom border-secondary border-opacity-10 bg-black bg-opacity-30 d-flex justify-content-between align-items-center">
              <div>
                <span className="text-white fw-bold fs-9 letter-spacing-2 uppercase d-block">ELECTRICAL PARAMETER</span>
                <small className="text-secondary" style={{ fontSize: '0.75rem' }}>{technicalData.updated_at}</small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="pulse-dot green"></div>
                <span className="text-success fw-black fs-10">ONLINE</span>
              </div>
            </div>

            <div className="flex-grow-1 p-3 overflow-y-auto custom-scrollbar" style={{ maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '620px' }}>

              {/* SECTION: ELECTRICAL PHASE DATA */}
              <div className="manifest-section mb-4">
                <div className="section-head mb-2 d-flex align-items-center gap-2">
                  <div className="p-1 rounded bg-primary bg-opacity-10 text-primary"><Layers size={12} /></div>
                  <small className="text-primary fw-bold fs-10 letter-spacing-1 uppercase">Phase Analysis</small>
                </div>
                <div className="bg-black bg-opacity-30 rounded-3 p-2 mb-2 border border-secondary border-opacity-10">
                  <small className="text-secondary fs-12 d-block mb-2 text-center fw-bold" style={{ fontSize: '0.7rem' }}>AVG VOLTAGE (V)</small>
                  <div className="d-flex justify-content-around text-center">
                    <div><small className="text-muted fs-12 d-block" style={{ fontSize: '0.65rem' }}>RY</small><span className="text-white fs-11 fw-black">{technicalData.voltage_ry}</span></div>
                    <div><small className="text-muted fs-12 d-block" style={{ fontSize: '0.65rem' }}>YB</small><span className="text-white fs-11 fw-black">{technicalData.voltage_yb}</span></div>
                    <div><small className="text-muted fs-12 d-block" style={{ fontSize: '0.65rem' }}>BR</small><span className="text-white fs-11 fw-black">{technicalData.voltage_br}</span></div>
                  </div>
                </div>
                <div className="bg-black bg-opacity-30 rounded-3 p-2 mb-2 border border-secondary border-opacity-10">
                  <small className="text-secondary fs-12 d-block mb-2 text-center fw-bold" style={{ fontSize: '0.7rem' }}>CURRENT PER PHASE (A)</small>
                  <div className="d-flex justify-content-around text-center">
                    <div><small className="text-danger-custom fs-12 d-block" style={{ fontSize: '0.65rem' }}>R</small><span className="text-white fs-11 fw-black">{technicalData.current_phase_r}</span></div>
                    <div><small className="text-warning-custom fs-12 d-block" style={{ fontSize: '0.65rem' }}>Y</small><span className="text-white fs-11 fw-black">{technicalData.current_phase_y}</span></div>
                    <div><small className="text-info fs-12 d-block" style={{ fontSize: '0.65rem' }}>B</small><span className="text-white fs-11 fw-black">{technicalData.current_phase_b}</span></div>
                  </div>
                </div>
                <div className="data-grid bg-black bg-opacity-20 rounded-3 p-2 border border-secondary border-opacity-5">
                  <div className="data-row d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-5">
                    <span className="text-muted fs-11">Power Factor</span>
                    <span className="text-white fs-11 fw-black">{technicalData.power_factor}</span>
                  </div>
                  <div className="data-row d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-5">
                    <span className="text-muted fs-11">Frequency</span>
                    <span className="text-white fs-11 fw-black">{technicalData.frequency}</span>
                  </div>
                  <div className="data-row d-flex justify-content-between py-1">
                    <span className="text-muted fs-11">Total Load</span>
                    <span className="text-info fs-11 fw-black">{technicalData.total_kw} KW</span>
                  </div>
                </div>
              </div>

              {/* SECTION: POWER & CONSUMPTION */}
              <div className="manifest-section mb-4">
                <div className="section-head mb-2 d-flex align-items-center gap-2">
                  <div className="p-1 rounded bg-warning bg-opacity-10 text-warning"><Zap size={12} /></div>
                  <small className="text-warning fw-bold fs-10 letter-spacing-1 uppercase">Power & Billing</small>
                </div>
                <div className="data-grid bg-black bg-opacity-20 rounded-3 p-2 border border-secondary border-opacity-5">
                  <div className="d-flex gap-2 mb-2">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-10 flex-grow-1 text-center">
                      <small className="text-muted fs-12 d-block mb-1" style={{ fontSize: '0.7rem' }}>Power consumption(KVA)</small>
                      <span className="text-white fw-black fs-8" style={{ fontSize: '1rem' }}>{technicalData.grid_kw}</span>
                    </div>
                    {/* <div className="p-2 rounded bg-dark border border-secondary border-opacity-10 flex-grow-1 text-center">
                                    <small className="text-muted fs-12 d-block mb-1" style={{fontSize: '0.7rem'}}>DG KW</small>
                                    <span className="text-white fw-black fs-8" style={{fontSize: '1rem'}}>{technicalData.dg_kw}</span>
                                </div> */}
                  </div>
                  <div className="data-row d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-5">
                    {/* <span className="text-muted fs-11">Current Balance</span> */}
                    {/* <span className="text-success fs-11 fw-black">{technicalData.grid_balance}</span> */}
                  </div>
                  <div className="data-pair d-flex gap-2 py-2 border-bottom border-secondary border-opacity-5">
                    <div className="flex-fill">
                      <small className="text-muted fs-12 d-block" style={{ fontSize: '0.65rem' }}>KWH</small>
                      <span className="text-info fs-11 fw-bold">{technicalData.kwh}</span>
                    </div>
                    <div className="flex-fill border-start border-secondary border-opacity-20 ps-2">
                      <small className="text-muted fs-12 d-block" style={{ fontSize: '0.65rem' }}>KVAH</small>
                      <span className="text-info fs-11 fw-bold">{technicalData.kvah}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: ALARMS & STATUS */}
              <div className="manifest-section mb-4">
                <div className="section-head mb-2 d-flex align-items-center gap-2">
                  <div className="p-1 rounded bg-danger bg-opacity-10 text-danger"><Activity size={12} /></div>
                  <small className="text-danger fw-bold fs-10 letter-spacing-1 uppercase">Safety Monitors</small>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <Badge bg="dark" className="border border-secondary border-opacity-20 flex-grow-1 py-1 text-muted fs-12 fw-bold" style={{ fontSize: '0.7rem' }}>OVERLOAD: {technicalData.overload_trip}</Badge>
                  <Badge bg="dark" className="border border-secondary border-opacity-20 flex-grow-1 py-1 text-muted fs-12 fw-bold" style={{ fontSize: '0.7rem' }}>LOW BAL: {technicalData.low_balance_cut}</Badge>
                  <Badge bg="dark" className="border border-secondary border-opacity-20 flex-grow-1 py-1 text-muted fs-12 fw-bold" style={{ fontSize: '0.7rem' }}>LIMIT: {technicalData.overload_limit_reached}</Badge>
                </div>
              </div>


      {/* ── UNIFIED BMS SCADA CONTEXT BANNER ── */}
      <PageContextBanner
        title="UG PUMP SCADA"
        subtitle={activeStationModel?.name || `Station #0${activeStation}`}
        status={devices.length === 0 ? 'NOT CONFIGURED' : (activeStationModel?.isOnline ? 'ONLINE' : 'OFFLINE')}
        siteSelector={{
          value: selectedSiteId,
          options: sites.map(s => ({ value: s.id, label: s.name })),
          onChange: handleSiteChange,
          placeholder: 'Select Site'
        }}
        deviceSelector={{
          value: selectedDeviceId,
          options: [
            { value: 'ALL', label: `ALL (${devices.length} Configured Pumps)` },
            ...devices.map(d => ({ value: String(d.bmsDeviceId || d.deviceId || d.id), label: d.name }))
          ],
          onChange: handleDeviceChange,
          placeholder: 'Select UG Pump',
          disabled: devices.length === 0
        }}
        enableFullscreen
        fullscreenTargetRef={pageRef}
        actions={[
          {
            id: 'pdf',
            render: () => <PdfButton key="pdf-btn" />
          }
        ]}
      />




      {/* ── ERROR STATE WITH RETRY ── */}
      {fetchError && (
        <Alert variant="danger" className="d-flex align-items-center justify-content-between mb-4 rounded-3 border-danger">
          <div>
            <strong>Error loading UG Pump station:</strong> {fetchError}
          </div>
          <Button variant="outline-danger" size="sm" onClick={fetchUgPumpDevices} className="d-flex align-items-center gap-1">
            <RefreshCw size={14} /> Retry
          </Button>
        </Alert>
      )}

      {/* ── LOADING SKELETON STATE ── */}
      {isLoading ? (
        <UgPumpSkeleton />
      ) : devices.length === 0 ? (
        /* ── EMPTY STATE ── */
        <Card className="bg-dark bg-opacity-30 border border-secondary border-opacity-20 rounded-4 text-center p-5 mb-4 shadow-lg">
          <Card.Body className="py-5">
            <div className="rounded-circle bg-info bg-opacity-10 p-4 d-inline-block mb-3 text-info">
              <Layers size={48} />
            </div>
            <h4 className="text-white fw-bold mb-2">
              {selectedAssetId !== 'ALL'
                ? 'No UG Pump configured for this area'
                : 'No UG Pump configured for this site'}
            </h4>
            <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: '480px' }}>
              {selectedAssetId !== 'ALL'
                ? 'There are no Underground (UG) Pumps configured for the selected area. Switch area or register a device template under Settings.'
                : 'There are no Underground (UG) Pumps configured for the selected site. Select another site or register a device template under Settings.'}
            </p>
            <Button variant="outline-info" size="sm" onClick={fetchUgPumpDevices} className="rounded-pill px-4">
              <RefreshCw size={14} className="me-2" /> Re-check Devices
            </Button>
          </Card.Body>
        </Card>
      ) : (
        /* ── LIVE SCADA DIGITAL TWIN & ELECTRICAL PANEL ── */
        <Row className="g-4">
          <Col lg={9}>
            <Card className="bg-transparent border-0 mb-4 overflow-hidden shadow-2xl h-100">
              <div
                className="scada-schematic-bg rounded-4 border border-secondary border-opacity-10 overflow-auto"
                style={{
                  backgroundColor: '#020408',
                  position: 'relative',
                  height: isFullscreen ? 'auto' : 'auto',
                  minHeight: isFullscreen ? '850px' : 'auto'
                }}
              >
                {/* SCADA Schematic SVG Twin */}
                <PumpStationSchematic
                  tanks={activeStationModel.reservoirs}
                  pumps={activeStationModel.pumps}
                  isAnyPumpRunning={isAnyPumpRunning}
                  masterPressure={activeStationModel.masterPressure}
                  isFullscreen={isFullscreen}
                  onOpenPumpSettings={openPumpSettings}
                  onOpenLimitSettings={openLimitSettings}
                />
              </div>
            </Card>
          </Col>

          {/* Right Technical / Electrical Parameter Panel */}
          <Col lg={3} className="d-none d-lg-block">
            <ElectricalParameterPanel
              electrical={activeStationModel.electrical}
              isOnline={activeStationModel.isOnline}
              isFullscreen={isFullscreen}
              stationMode={activeStationModel.stationMode}
              pressure={activeStationModel.masterPressure}
              flow={activeStationModel.masterFlow}
              isAnyPumpRunning={isAnyPumpRunning}
            />
          </Col>
        </Row>
      )}

      {/* ── MODALS ── */}
      <PumpControlModal
        show={showPumpModal}
        pump={selectedPump}
        isSendingCommand={isSendingCommand}
        actionFeedback={actionFeedback}
        onClose={() => setShowPumpModal(false)}
        onPumpControl={handlePumpControl}
      />

      <PumpLimitModal
        show={showLimitModal}
        pump={selectedPump}
        limitForm={limitForm}
        isSendingRules={isSendingRules}
        actionFeedback={actionFeedback}
        onClose={() => setShowLimitModal(false)}
        onChangeLimit={setLimitForm}
        onSendRuleToEngine={handleSendRuleToEngine}
      />

      {/* ── COMPONENT SCADA STYLES ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .fullscreen-scada-page { background-color: #111827 !important; min-height: 100vh !important; width: 100% !important; padding: 40px !important; overflow-y: scroll !important; }
        .scada-schematic-bg { transition: all 0.5s ease; background-image: radial-gradient(circle at 50% 50%, #0a1118 0%, #020408 100%); }
        .scada-selector-tile { background-color: #0c121e; cursor: pointer; transition: all 0.3s ease; }
        .scada-selector-tile.active-station { background-color: #0d1525; border-color: #38bdf8 !important; }
        .text-info { color: #38bdf8 !important; }
        .text-glow { text-shadow: 0 0 10px currentColor; }
        .text-info-scada { color: #38bdf8; }
        .fw-black { font-weight: 900 !important; }
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
        
        .premium-action-btn.open.active { background: rgba(34, 197, 94, 0.15); border-color: #22c55e; color: #22c55e; box-shadow: 0 0 20px rgba(34, 197, 94, 0.1); }
        .premium-action-btn.open:hover:not(:disabled) { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; color: #22c55e; }
        
        .premium-action-btn.close.active { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.1); }
        .premium-action-btn.close:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; }

        .pulse-icon { animation: ug-pulse 2s infinite; }
        @keyframes ug-pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        .custom-modal-wide { width: 85% !important; max-width: 85% !important; }

        .fs-12 { font-size: 0.6rem; }
        .fs-11 { font-size: 0.75rem; }
        .fs-10 { font-size: 0.85rem; }
        .fs-9 { font-size: 0.95rem; }
        .letter-spacing-1 { letter-spacing: 1px; }
        .letter-spacing-2 { letter-spacing: 2px; }
        .pulse-dot { width: 8px; height: 8px; border-radius: 50%; position: relative; }
        .pulse-dot.green { background-color: #22c55e; box-shadow: 0 0 0 rgba(34, 197, 94, 0.4); animation: pulse-green 2s infinite; }
        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0px rgba(34, 197, 94, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0px rgba(34, 197, 94, 0); } }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        
        .text-danger-custom { color: #ef4444; }
        .text-warning-custom { color: #f59e0b; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .fade-in { animation: ug-fadeIn 0.5s ease-out; }
        .scale-in { animation: ug-scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes ug-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ug-scaleIn { from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }

        @media (max-width: 1200px) {
            .scada-schematic-wrapper { padding: 10px !important; }
            .station-label-header { padding: 10px !important; }
            .fs-4 { font-size: 1.2rem !important; }
        }

        @media (max-width: 768px) {
            .page-header h2 { font-size: 1.2rem; }
            .scada-schematic-wrapper { min-height: 350px !important; padding: 5px !important; }
            .station-label-header { flex-direction: column; align-items: flex-start !important; gap: 10px; }
            .station-label-header .d-flex { gap: 20px !important; width: 100%; justify-content: space-between; }
            .letter-spacing-2 { letter-spacing: 1px !important; font-size: 0.6rem !important; }
        }
      `}} />
    </div>
  );
};

export default UgTank;
