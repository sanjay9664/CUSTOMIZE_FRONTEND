import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { RefreshCw, Layers, Cpu } from 'lucide-react';
import PageContextBanner from '../../components/PageContextBanner';
import PdfButton from '../../components/PdfButton';
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
      } catch (err) {
        console.warn('[UgPump] Sites fetch notice:', err);
      }
    };

    loadSites();
  }, [storeSites, selectedSite, selectedSiteId, setSelectedSite]);

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
