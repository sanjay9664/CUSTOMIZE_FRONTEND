import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import {
  AlertCircle, CheckCircle2, Droplets,
  Zap, Building2, Cpu, RefreshCw, Waves
} from 'lucide-react';
import PageContextBanner from '../../components/PageContextBanner';
import PdfButton from '../../components/PdfButton';
import { useSiteStore } from '../../context/SiteContext';
import bmsService from '../../services/bmsService';
import { apiClient, normalizeList } from '../../services/apiClient';
import { isCategoryMatch } from '../../constants/deviceTemplates';
import {
  resolveAgTankDevice,
  mapBatchEventsToAgTanks,
  formatWaterTelemetryValue
} from './utils/waterTelemetry';
import AgTankCard from './components/AgTankCard';
import AgTankDetailModal from './components/AgTankDetailModal';
import AgTankSkeleton from './components/AgTankSkeleton';

const AgTank = () => {
  const pageRef = useRef(null);
  const activeRequestIdRef = useRef(0);

  // ── SITE & STORE INTEGRATION ──────────────────────────────────────────────
  const { sites: storeSites, selectedSite, setSelectedSite } = useSiteStore();
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    return localStorage.getItem('selected_agtank_site_id') || '';
  });

  // ── DEVICE & SCADA STATES ─────────────────────────────────────────────────
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── TELEMETRY & VIEW MODEL STATES ─────────────────────────────────────────
  const [tanks, setTanks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchFetching, setIsBatchFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [lastTelemetryAt, setLastTelemetryAt] = useState(null);

  // ── MODAL STATES ──────────────────────────────────────────────────────────
  const [selectedTankId, setSelectedTankId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Derive active selected tank from current tanks list (no extra state sync/ref recreation)
  const selectedTank = useMemo(() => {
    if (!selectedTankId) return null;
    return tanks.find(t => String(t.id) === String(selectedTankId)) || null;
  }, [tanks, selectedTankId]);

  // ── FULLSCREEN CHANGE HANDLER ─────────────────────────────────────────────
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // ── 1. SYNC REAL SITES ────────────────────────────────────────────────────
  useEffect(() => {
    if (Array.isArray(storeSites) && storeSites.length > 0) {
      setSites(storeSites);
      if (!selectedSiteId || !storeSites.some(s => String(s.id || s.siteId) === String(selectedSiteId))) {
        const initialSite = selectedSite?.id ? String(selectedSite.id) : String(storeSites[0].id || storeSites[0].siteId);
        setSelectedSiteId(initialSite);
        localStorage.setItem('selected_agtank_site_id', initialSite);
        if (setSelectedSite && !selectedSite) {
          setSelectedSite(storeSites[0]);
        }
      }
      return;
    }

    const loadSites = async () => {
      try {
        const res = await apiClient.get('/sites').catch(() => null);
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
            localStorage.setItem('selected_agtank_site_id', initialId);
            if (setSelectedSite) {
              setSelectedSite(clean.find(s => String(s.id) === String(initialId)) || clean[0]);
            }
          }
        }
      } catch (err) {
        console.warn('[AgTank] Sites fetch warning:', err);
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

  // ── 2. FETCH AG TANK DEVICES FOR SELECTED SITE ────────────────────────────
  const fetchAgTankDevices = useCallback(async () => {
    if (!selectedSiteId) {
      setDevices([]);
      setTanks([]);
      setIsLoading(false);
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    setIsLoading(true);
    setFetchError(null);

    try {
      // Primary fetch: filter by category 'AG_TANK'
      const queryParams = {
        siteId: String(selectedSiteId),
        category: 'AG_TANK',
        include: 'settings,rules,profile'
      };

      const res = await bmsService.getDevices(queryParams).catch(() => null);
      const list = normalizeList(res, 'devices');

      let agDevices = [];
      if (Array.isArray(list) && list.length > 0) {
        agDevices = list.filter(d => isCategoryMatch(d.category, 'AG_TANK'));
      }

      // Fallback: If strict category parameter returned empty, fetch site devices and filter client-side
      if (agDevices.length === 0) {
        const allDevsRes = await bmsService.getDevices({
          siteId: String(selectedSiteId),
          include: 'settings,rules,profile'
        }).catch(() => null);
        const allList = normalizeList(allDevsRes, 'devices');
        if (Array.isArray(allList) && allList.length > 0) {
          agDevices = allList.filter(d => isCategoryMatch(d.category, 'AG_TANK'));
        }
      }

      // Check for stale response
      if (currentRequestId !== activeRequestIdRef.current) return;

      setDevices(agDevices);

      // Pre-map normalized tanks
      const initialTanks = agDevices.map(d => resolveAgTankDevice(d, null));
      setTanks(initialTanks);

      // Preserve or reset selected device ID
      setSelectedDeviceId(prev => {
        if (prev && prev !== 'ALL' && agDevices.some(d => String(d.id || d.deviceId) === String(prev))) {
          return prev;
        }
        return 'ALL';
      });

    } catch (err) {
      if (currentRequestId === activeRequestIdRef.current) {
        console.error('[AgTank] Failed to fetch devices:', err);
        setFetchError(err.message || 'Failed to fetch AG Tank devices');
        setDevices([]);
        setTanks([]);
      }
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedSiteId]);

  useEffect(() => {
    fetchAgTankDevices();
  }, [fetchAgTankDevices]);

  // ── 3. FETCH BATCH RECENT EVENTS FOR ALL AG TANKS ─────────────────────────
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
        setLastTelemetryAt(Date.now());
        const mapped = mapBatchEventsToAgTanks(devices, results);
        setTanks(mapped);
      }
    } catch (err) {
      console.warn('[AgTank] Batch event fetch notice:', err);
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setIsBatchFetching(false);
      }
    }
  }, [devices]);

  // Initial and recurring 20-second batch polling with clean unmount
  useEffect(() => {
    if (devices.length === 0) return;

    fetchBatchEvents();
    const interval = setInterval(() => {
      fetchBatchEvents();
    }, 20000);
    return () => clearInterval(interval);
  }, [devices, fetchBatchEvents]);

  // ── 4. DERIVED STATS & FILTERING ──────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tanks.length;
    const online = tanks.filter(t => t.isOnline).length;
    const running = tanks.filter(t => t.status === 'Running').length;
    const warnings = tanks.filter(t => t.status === 'Warning').length;
    const faults = tanks.filter(t => t.status === 'Fault').length;

    // Calculate average water level across online tanks
    const onlineLevels = tanks.filter(t => t.isOnline && t.level !== null).map(t => t.level);
    const avgLevel = onlineLevels.length > 0
      ? Math.round(onlineLevels.reduce((a, b) => a + b, 0) / onlineLevels.length)
      : null;

    // Calculate total capacity if available
    let totalCap = 0;
    let hasCap = false;
    tanks.forEach(t => {
      if (t.capacity && !isNaN(Number(t.capacity))) {
        totalCap += Number(t.capacity);
        hasCap = true;
      }
    });

    return {
      total,
      online,
      running,
      warnings,
      faults,
      avgLevel,
      totalCapacity: hasCap ? `${totalCap.toLocaleString('en-IN')} L` : '--'
    };
  }, [tanks]);
  // Filtered tanks for UI presentation (supports device dropdown from header ribbon)
  const filteredTanks = useMemo(() => {
    if (selectedDeviceId !== 'ALL') {
      return tanks.filter(tank => String(tank.id) === String(selectedDeviceId));
    }
    return tanks;
  }, [tanks, selectedDeviceId]);

  // Overall site status indicator matching DG Set & Energy Meter
  const isConfigured = devices.length > 0;
  const isOnline = stats.online > 0;
  const pageStatus = !isConfigured ? 'NOT CONFIGURED' : (isOnline ? 'ONLINE' : 'OFFLINE');

  // ── 5. MODAL ACTIONS (LIMITS, COMMANDS, MODE) ─────────────────────────────
  const handleTankCardClick = (tank) => {
    setSelectedTankId(tank.id);
    setShowDetailModal(true);
  };

  const handleUpdateLimits = async (tank, newMin, newMax) => {
    // Optimistic UI update
    setTanks(prev => prev.map(t => {
      if (String(t.id) === String(tank.id)) {
        return { ...t, minLevel: newMin, maxLevel: newMax };
      }
      return t;
    }));

    // Call rule engine or update device settings endpoint if available
    try {
      await bmsService.updateDevice(tank.id, {
        minLevel: newMin,
        maxLevel: newMax
      }, selectedSiteId).catch(() => null);
    } catch (e) {
      console.warn('[AgTank] Limit update API notice:', e);
    }
  };

  const handleValveCommand = async (tank, cmdState) => {
    // Optimistic UI update
    setTanks(prev => prev.map(t => {
      if (String(t.id) === String(tank.id)) {
        return {
          ...t,
          valveStatus: cmdState,
          status: cmdState === 'OPEN' ? 'Running' : 'Stopped'
        };
      }
      return t;
    }));

    // Send command to hardware pipeline via commands service or command push
    try {
      await apiClient.post('/command/push', {
        deviceId: tank.id,
        cmd: cmdState,
        siteId: selectedSiteId
      }).catch(() => null);
    } catch (e) {
      console.warn('[AgTank] Valve command push notice:', e);
    }
  };

  const handleUpdateMode = (tank, newMode) => {
    setTanks(prev => prev.map(t => {
      if (String(t.id) === String(tank.id)) {
        return { ...t, valveMode: newMode };
      }
      return t;
    }));
  };

  // ── 6. SELECTOR CONFIGURATIONS FOR PAGECONTEXTBANNER ──────────────────────
  const siteSelector = {
    value: selectedSiteId,
    options: sites.map(s => ({
      value: String(s.id),
      label: s.name || `Site #${s.id}`
    })),
    onChange: (newSiteId) => {
      setSelectedSiteId(newSiteId);
      localStorage.setItem('selected_agtank_site_id', newSiteId);
      const matched = sites.find(s => String(s.id) === String(newSiteId));
      if (matched && setSelectedSite) setSelectedSite(matched);
      setSelectedDeviceId('ALL');
    },
    placeholder: 'Select Site / Location',
    icon: <Building2 size={16} className="text-info" />
  };

  const deviceSelector = {
    value: selectedDeviceId,
    options: [
      { value: 'ALL', label: `ALL (${devices.length} Configured Tanks)` },
      ...devices.map(d => ({
        value: String(d.id || d.deviceId),
        label: d.name || d.deviceName || `Tank #${d.id}`
      }))
    ],
    onChange: (newDevId) => setSelectedDeviceId(newDevId),
    placeholder: 'Select AG Tank Device',
    icon: <Cpu size={16} className={devices.length > 0 ? "text-success" : "text-muted"} />,
    disabled: devices.length === 0
  };

  return (
    <div
      className={`fade-in p-2 ${isFullscreen ? 'fullscreen-scada-page' : ''}`}
      ref={pageRef}
      style={{ minHeight: '100vh', background: '#020617' }}
    >
      {/* ── REUSABLE PAGE CONTEXT BANNER (MATCHING DG SET & ENERGY METER) ── */}
      <PageContextBanner
        title="AG Tank SCADA"
        icon={<Waves className={isConfigured ? "text-info" : "text-secondary"} size={22} />}
        status={pageStatus}
        siteSelector={siteSelector}
        deviceSelector={deviceSelector}
        actions={[
          <PdfButton
            key="pdf-export"
            label=""
            title="Download Custom PDF Report"
            variant="custom"
            className="context-banner-action-btn p-1 border-0"
            disabled={!isConfigured}
            sites={sites}
          />
        ]}
        enableFullscreen={true}
        fullscreenTargetRef={pageRef}
        variant="scada"
        className="main-meter-context-banner mb-3"
      />

      {/* ── KPI METRICS STRIP (ALWAYS RENDERED - ZERO LAYOUT SHIFT) ────────── */}
      <Row className="g-3 mb-3">
        <Col xs={6} sm={4} md={2}>
          <div className="p-3 rounded-4 hud-stat-card" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="hud-label">TOTAL TANKS</div>
            <div className="hud-value text-white">{isLoading ? '-' : stats.total}</div>
            <div className="fs-10 text-secondary">Configured</div>
          </div>
        </Col>
        <Col xs={6} sm={4} md={2}>
          <div className="p-3 rounded-4 hud-stat-card" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div className="hud-label">ONLINE TANKS</div>
            <div className="hud-value text-success">{isLoading ? '-' : stats.online}</div>
            <div className="fs-10 text-secondary">{stats.total > 0 ? `${Math.round((stats.online / stats.total) * 100)}% Linked` : '--'}</div>
          </div>
        </Col>
        <Col xs={6} sm={4} md={2}>
          <div className="p-3 rounded-4 hud-stat-card" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div className="hud-label">ACTIVE / RUNNING</div>
            <div className="hud-value text-info">{isLoading ? '-' : stats.running}</div>
            <div className="fs-10 text-secondary">Discharging / Open</div>
          </div>
        </Col>
        <Col xs={6} sm={4} md={2}>
          <div className="p-3 rounded-4 hud-stat-card" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div className="hud-label">AVG WATER LEVEL</div>
            <div className="hud-value text-info">
              {isLoading ? '-' : (stats.avgLevel !== null ? `${stats.avgLevel}%` : '--')}
            </div>
            <div className="fs-10 text-secondary">Mean Liquid Depth</div>
          </div>
        </Col>
        <Col xs={6} sm={4} md={2}>
          <div className="p-3 rounded-4 hud-stat-card" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div className="hud-label">TOTAL CAPACITY</div>
            <div className="hud-value text-white fs-6 mt-1 text-truncate" title={stats.totalCapacity}>
              {isLoading ? '-' : stats.totalCapacity}
            </div>
            <div className="fs-10 text-secondary">Gross Reserve</div>
          </div>
        </Col>
        <Col xs={6} sm={4} md={2}>
          <div className="p-3 rounded-4 hud-stat-card" style={{ background: 'rgba(15, 23, 42, 0.6)', border: stats.faults > 0 || stats.warnings > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
            <div className="hud-label">SYSTEM ALARMS</div>
            <div className={`hud-value ${stats.faults > 0 ? 'text-danger' : (stats.warnings > 0 ? 'text-warning' : 'text-secondary')}`}>
              {isLoading ? '-' : (stats.faults + stats.warnings)}
            </div>
            <div className="fs-10 text-secondary">{stats.faults} Faults • {stats.warnings} Warn</div>
          </div>
        </Col>
      </Row>

      {/* ── ERROR ALERT IF FETCH FAILS ──────────────────────────────────────── */}
      {fetchError && (
        <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger border-opacity-30 text-white p-3 rounded-4 mb-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={20} className="text-danger" />
            <div>
              <div className="fw-bold fs-12">Failed to load AG Tank devices</div>
              <div className="text-secondary fs-11">{fetchError}</div>
            </div>
          </div>
          <Button variant="danger" size="sm" className="fw-bold px-3 py-1 rounded-pill" onClick={fetchAgTankDevices}>
            Retry
          </Button>
        </Alert>
      )}

      {/* ── MAIN CONTENT CONTAINER (FIXED POSITION & ZERO CLS JUMP) ─────────── */}
      <div
        className={`scada-card ${isFullscreen ? 'p-4 p-md-5' : 'p-4'}`}
        style={{
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          minHeight: '420px'
        }}
      >
        {isLoading ? (
          <AgTankSkeleton count={4} isFullscreen={isFullscreen} />
        ) : devices.length === 0 ? (
          /* Empty State: No AG Tanks Configured */
          <div
            className="d-flex flex-column align-items-center justify-content-center text-center py-5"
            style={{ minHeight: '320px' }}
          >
            <div className="p-4 rounded-circle bg-dark bg-opacity-50 border border-white border-opacity-10 d-inline-flex mb-3">
              <Waves size={48} className="text-secondary opacity-50" />
            </div>
            <h4 className="fw-black text-white mb-2">No AG Tank configured for this site</h4>
            <p className="text-secondary fs-12 mb-4" style={{ maxWidth: '440px' }}>
              There are no Above Ground (AG) Tanks configured for {selectedSite?.name || 'the selected location'}. Select another site or provision a new device template under Settings.
            </p>
            <Button
              variant="outline-info"
              size="sm"
              className="fw-bold px-4 rounded-pill"
              onClick={fetchAgTankDevices}
            >
              <RefreshCw size={14} className="me-1.5" /> Re-check Devices
            </Button>
          </div>
        ) : filteredTanks.length === 0 ? (
          /* No Tanks match the selected device */
          <div
            className="d-flex flex-column align-items-center justify-content-center text-center py-5"
            style={{ minHeight: '320px' }}
          >
            <div className="text-secondary fs-12 mb-2">No tank found for the selected device.</div>
            <Button
              variant="link"
              size="sm"
              className="text-info fw-bold text-decoration-none"
              onClick={() => setSelectedDeviceId('ALL')}
            >
              Show All Tanks
            </Button>
          </div>
        ) : (
          /* Dynamic SCADA Tank Cards Grid */
          <Row className="g-4">
            {filteredTanks.map((tank) => (
              <Col
                key={tank.id}
                xs={12}
                sm={6}
                md={isFullscreen ? 4 : 6}
                lg={isFullscreen ? 3 : 4}
                xl={isFullscreen ? 3 : 3}
              >
                <AgTankCard
                  tank={tank}
                  onClick={handleTankCardClick}
                  isSelected={selectedTank?.id === tank.id && showDetailModal}
                  isFullscreen={isFullscreen}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* ── DETAIL & OPERATIONAL CONTROL MODAL ─────────────────────────────── */}
      <AgTankDetailModal
        show={showDetailModal}
        onHide={() => {
          setShowDetailModal(false);
          setSelectedTankId(null);
        }}
        tank={selectedTank}
        onUpdateLimits={handleUpdateLimits}
        onCommand={handleValveCommand}
        onUpdateMode={handleUpdateMode}
      />

      {/* ── SCADA STYLES (VESSEL, WAVE, VALVE, HUD STATS) ──────────────────── */}
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
            padding: 40px !important; 
            overflow-y: auto !important; 
            position: fixed; 
            top: 0; 
            left: 0; 
            z-index: 2000; 
        }

        .tank-unit-wrapper { 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .tank-unit-wrapper:hover {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.6) 100%) !important;
            border-color: rgba(56, 189, 248, 0.3) !important;
            transform: translateY(-3px);
            box-shadow: 0 16px 32px -8px rgba(0,0,0,0.6), 0 0 15px rgba(56, 189, 248, 0.15) !important;
        }
        .tank-selected-border {
            border-color: #38bdf8 !important;
            box-shadow: 0 0 20px rgba(56, 189, 248, 0.25) !important;
        }

        .tank-vessel { 
            width: 68px; 
            height: 110px; 
            border: 2px solid #475569; 
            border-radius: 8px 8px 12px 12px; 
            background: linear-gradient(180deg, #070d17 0%, #0f172a 100%); 
            position: relative; 
            overflow: hidden; 
            transition: all 0.3s ease; 
            box-shadow: 
                inset 0 0 14px rgba(0,0,0,0.8),
                0 6px 16px -2px rgba(0,0,0,0.5); 
        }
        .vessel-large { 
            width: 80px !important; 
            height: 128px !important; 
        }
        .tank-vessel::after {
            content: '';
            position: absolute;
            top: 0;
            left: 6px;
            width: 8px;
            height: 100%;
            background: linear-gradient(90deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 60%, transparent 100%);
            z-index: 6;
            pointer-events: none;
        }

        .vessel-scale {
            position: absolute;
            left: 2px;
            top: 8px;
            bottom: 8px;
            width: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            z-index: 7;
            pointer-events: none;
        }
        .vessel-tick {
            width: 5px;
            height: 1px;
            background: rgba(255, 255, 255, 0.2);
        }
        .vessel-tick.major {
            width: 8px;
            background: rgba(255, 255, 255, 0.45);
        }

        .tank-fill { 
            position: absolute; 
            bottom: 0; 
            left: 0; 
            width: 100%; 
            transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1); 
            background-image: linear-gradient(90deg, rgba(0,0,0,0.2) 0%, transparent 50%, rgba(0,0,0,0.2) 100%);
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
        @keyframes ag-wave { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-30px, 0, 0); } }

        .threshold-marker {
            position: absolute;
            left: 0;
            width: 100%;
            height: 1px;
            border-top: 1px dashed rgba(255, 255, 255, 0.45);
            z-index: 10;
        }
        .threshold-marker.lower { border-color: rgba(56, 189, 248, 0.85); }
        .threshold-marker.upper { border-color: rgba(239, 68, 68, 0.85); }

        .valve-connector-pipe { 
            width: 14px; 
            height: 6px; 
            background: linear-gradient(180deg, #64748b 0%, #334155 50%, #1e293b 100%); 
            z-index: 5; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .industrial-valve-node { 
            width: 24px; 
            height: 24px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            position: relative;
            z-index: 10; 
            transition: 0.3s; 
        }

        .discharge-manifold-system { 
            position: absolute; 
            top: 50%; 
            left: 100%; 
            width: 18px; 
            height: 6px; 
            transform: translateY(-50%); 
        }
        .horizontal-stream { 
            width: 18px; 
            height: 6px; 
            background: rgba(71, 85, 105, 0.4); 
            position: relative; 
            overflow: hidden; 
            border-radius: 0 3px 3px 0; 
        }
        .stream-pulse { 
            position: absolute; 
            top: 0; 
            left: 0; 
            height: 100%; 
            width: 50%; 
            background: linear-gradient(90deg, transparent, #22c55e, transparent); 
            animation: stream-flow 0.8s linear infinite; 
            will-change: transform; 
        }
        @keyframes stream-flow { 
            from { transform: translate3d(-100%, 0, 0); } 
            to { transform: translate3d(200%, 0, 0); } 
        }

        .hud-stat-card {
            transition: transform 0.2s ease;
        }
        .hud-stat-card:hover {
            transform: translateY(-2px);
        }
        .hud-label { 
            font-size: 9px; 
            color: #94a3b8; 
            font-weight: 900; 
            letter-spacing: 1.2px; 
            text-transform: uppercase; 
        }
        .hud-value { 
            font-size: 20px; 
            font-weight: 900; 
        }

        .tank-action-hint {
            transition: color 0.2s ease;
        }
        .tank-unit-wrapper:hover .tank-action-hint {
            color: #38bdf8 !important;
        }

        .pulse-icon { animation: ag-pulse 2s infinite; }
        @keyframes ag-pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

        .fw-black { font-weight: 900 !important; }
        .fs-10 { font-size: 0.68rem; }
        .fs-11 { font-size: 0.75rem; }
        .fs-12 { font-size: 0.82rem; }
        .fs-13 { font-size: 0.88rem; }
        `
      }} />
    </div>
  );
};

export default AgTank;
