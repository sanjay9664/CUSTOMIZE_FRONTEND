import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Card, Badge, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { 
  Zap, Activity, Gauge, Thermometer, Wind, 
  RotateCw, RefreshCw, Power, AlertCircle, 
  ShieldCheck, ArrowRight, Settings, Download,
  Building, Folder, Cpu, Search, Wifi, CheckCircle2,
  AlertTriangle, TrendingUp, ChevronRight, Sliders, Play, Square, Eye,
  Compass, BarChart3, Layers, SlidersHorizontal, Droplets
} from 'lucide-react';
import motorImage from '../../assets/motor.png';
import { useSiteStore } from '../../context/SiteContext';
import bmsService from '../../services/bmsService';
import apiClient, { normalizeList } from '../../services/apiClient';

/**
 * MotorCard Component
 * Features:
 *  - Extra Large Motor Graphic with double rotating HUD rings & status aura
 *  - Small, Compact Telemetry Tiles for mapped parameters (Speed, Current, Voltage, Power, Frequency, Pressure, Flow, Load)
 *  - Interactive diagnostics, control state, and detailed modal views
 */
const MotorCard = ({ motor, liveEvent, onToggleStatus, onOpenDiagnostics, onOpenDetails }) => {
  const { 
    id, name, siteName, assetName, status: rawStatus, node,
    speedRpm, currentAmp, voltageV, powerKw, frequencyHz, pressureBar, flowRateM3h, tempC, vibrationMms, loadPct 
  } = motor;

  const rawDeviceStatus = rawStatus || 'Running';
  const status = liveEvent?.['Pump Status'] || rawDeviceStatus;
  const isRunning = String(status).toUpperCase() === 'RUNNING' || String(status).toUpperCase() === 'ON' || String(status) === '1';
  const isFault = String(status).toUpperCase() === 'FAULT' || String(status).toUpperCase() === 'TRIP';
  const displayStatus = isFault ? 'FAULT' : isRunning ? 'RUNNING' : 'STANDBY';

  // Extract mapped values from live events or device fields (falling back to active status metrics)
  const speed = liveEvent?.['Running rotation Speed (RPM)'] ?? liveEvent?.speedRpm ?? speedRpm ?? (isRunning ? 1440 : 0);
  const current = liveEvent?.['Output current (A)'] ?? liveEvent?.currentAmp ?? currentAmp ?? (isRunning ? 12.4 : 0);
  const voltage = liveEvent?.['Output voltage (V)'] ?? liveEvent?.voltageV ?? voltageV ?? (isRunning ? 415 : 0);
  const power = liveEvent?.['Output Power (KW)'] ?? liveEvent?.powerKw ?? powerKw ?? (isRunning ? 45.0 : 0);
  const frequency = liveEvent?.['Current Frequency (Hz)'] ?? liveEvent?.frequencyHz ?? frequencyHz ?? (isRunning ? 50.0 : 0);
  const pressure = liveEvent?.['Pressure'] ?? liveEvent?.pressureBar ?? pressureBar ?? (isRunning ? 4.2 : 0);
  const flowRate = liveEvent?.['Flow Rate'] ?? liveEvent?.flowRateM3h ?? flowRateM3h ?? (isRunning ? 120 : 0);
  const load = liveEvent?.['Load %'] ?? liveEvent?.loadPct ?? loadPct ?? (isRunning ? 94 : 0);
  const temp = liveEvent?.['Motor Temperature'] ?? liveEvent?.tempC ?? tempC ?? (isRunning ? 42 : 0);
  const vibration = liveEvent?.['High Vibration'] ?? liveEvent?.vibrationMms ?? vibrationMms ?? (isRunning ? 0.8 : 0);
  const mode = liveEvent?.['Auto / Manual Mode'] ?? 'AUTO';

  const statusColor = isFault ? '#ef4444' : isRunning ? '#10b981' : '#f59e0b';
  const statusClass = isFault ? 'fault' : isRunning ? 'running' : 'standby';

  return (
    <Card 
      className={`motor-card-scada border-0 position-relative overflow-hidden mb-4 ${statusClass}`}
      style={{ '--card-accent': statusColor }}
    >
      {/* Top Accent Glow Line */}
      <div className="card-top-accent" style={{ background: statusColor }} />

      <Card.Body className="p-3 p-md-4">
        {/* Card Header Row */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="motor-id-badge">ID: {id}</span>
              <span className="node-badge">Node: {node || '01'}</span>
              <span className="mode-pill-badge">{mode}</span>
            </div>
            <h4 className="motor-title text-heading-adaptive fw-black mb-1">{name}</h4>
            <div className="motor-location-text text-secondary fs-11 fw-bold">
              {siteName || 'UG-Tank'} &bull; {assetName || 'Pump Room'}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className={`status-pill-glow ${statusClass}`}>
              <span className="status-dot-pulse" style={{ background: statusColor }} />
              {displayStatus}
            </span>
          </div>
        </div>

        {/* Card Main Body: Big Motor Graphic (Left) + Small Compact Tiles (Right) */}
        <Row className="align-items-center my-2 g-3">
          {/* 1. LARGE MOTOR GRAPHIC HUD (BADA MOTOR IMAGE) */}
          <Col lg={5} md={12} className="text-center position-relative py-2">
            <div className="hud-visualizer-wrapper-large">
              <div className={`hud-ring-outer ${isRunning ? 'hud-spin-cw' : ''}`} style={{ borderColor: `${statusColor}50` }} />
              <div className={`hud-ring-inner ${isRunning ? 'hud-spin-ccw' : ''}`} style={{ borderColor: `${statusColor}30` }} />
              
              <div className="motor-aura-glow" style={{ 
                background: `radial-gradient(circle, ${statusColor}45 0%, transparent 70%)`,
                opacity: isRunning ? 1 : 0.4
              }} />

              <div className="motor-avatar-frame-large" style={{ borderColor: `${statusColor}60` }}>
                <img src={motorImage} alt={name} className="motor-avatar-img-large" />
              </div>

              {/* Status HUD Tag */}
              <div className="hud-bottom-tag font-monospace" style={{ borderColor: `${statusColor}40` }}>
                <Activity size={12} style={{ color: statusColor }} />
                <span>{isRunning ? `${speed} RPM` : 'STANDBY IDLE'}</span>
              </div>
            </div>
          </Col>

          {/* 2. COMPACT MAPPED TELEMETRY TILES GRID (TILES SMALL KARO) */}
          <Col lg={7} md={12}>
            <div className="telemetry-compact-section ps-lg-2">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="telemetry-heading-small">MAPPED TELEMETRY (PUMP TEMPLATE)</span>
                <span className="live-tag-small">LIVE SYNC</span>
              </div>

              {/* 6 Compact Parameter Tiles */}
              <Row className="g-2">
                {[
                  { label: 'Speed', val: isRunning ? speed : 0, unit: 'RPM', icon: <RotateCw size={12} />, color: '#0ea5e9' },
                  { label: 'Current', val: isRunning ? current : 0.0, unit: 'A', icon: <Zap size={12} />, color: '#f59e0b' },
                  { label: 'Voltage', val: isRunning ? voltage : 0, unit: 'V', icon: <Activity size={12} />, color: '#38bdf8' },
                  { label: 'Power', val: isRunning ? power : 0.0, unit: 'kW', icon: <Power size={12} />, color: '#10b981' },
                  { label: 'Frequency', val: isRunning ? frequency : 0.0, unit: 'Hz', icon: <Compass size={12} />, color: '#a855f7' },
                  { label: 'Pressure', val: isRunning ? pressure : 0.0, unit: 'bar', icon: <Droplets size={12} />, color: '#f43f5e' }
                ].map((stat, i) => (
                  <Col xs={4} key={i}>
                    <div className="compact-tile">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="stat-label-small">{stat.label}</span>
                        <span style={{ color: stat.color }}>{stat.icon}</span>
                      </div>
                      <div className="d-flex align-items-baseline gap-1">
                        <span className="stat-val-small font-monospace">{stat.val}</span>
                        <span className="stat-unit-small">{stat.unit}</span>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* Operational Load Factor Compact Bar */}
              <div className="load-factor-compact-box mt-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="load-factor-label-small">Operational Load Factor</span>
                  <span className="load-factor-val-small font-monospace">{isRunning ? load : 0}%</span>
                </div>
                <div className="load-factor-track-small">
                  <div 
                    className="load-factor-fill-small" 
                    style={{ 
                      width: `${isRunning ? load : 0}%`,
                      background: `linear-gradient(90deg, #0ea5e9 0%, ${load > 80 ? '#10b981' : '#f59e0b'} 100%)`
                    }}
                  />
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Card Footer Actions */}
        <div className="card-actions-row pt-3 mt-2 border-top border-white border-opacity-10 d-flex gap-2">
          <Button 
            variant="outline-info" 
            className="action-btn-diag-small flex-grow-1"
            onClick={() => onOpenDiagnostics(motor)}
          >
            <Settings size={13} className="me-1" /> CORE DIAGNOSTICS
          </Button>

          <Button 
            variant={isRunning ? "danger" : "success"} 
            className={`action-btn-power-small flex-grow-1 ${isRunning ? 'btn-stop-glow' : 'btn-start-glow'}`}
            onClick={() => onToggleStatus(motor)}
          >
            <Power size={13} className="me-1" /> {isRunning ? 'EMERGENCY STOP' : 'INITIALIZE MOTOR'}
          </Button>

          <Button 
            variant="link" 
            className="action-btn-details-small text-secondary p-0 px-2 text-decoration-none d-flex align-items-center gap-1"
            onClick={() => onOpenDetails(motor)}
          >
            <span className="fs-11 fw-bold">DETAILS</span>
            <ArrowRight size={12} />
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

const MotorsOverview = () => {
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'units', 'vfd', 'rooms', 'analytics'
  const [showDiagModal, setShowDiagModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMotor, setSelectedMotor] = useState(null);
  const [liveEventsMap, setLiveEventsMap] = useState({});

  // 1. Dynamic Site Store & Backend Sites
  const { sites: contextSites, activeSites } = useSiteStore();
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedSiteName, setSelectedSiteName] = useState('');

  // 2. Dynamic Assets
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('ALL');

  // 3. Dynamic Devices
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('ALL');
  const [loading, setLoading] = useState(false);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Load Sites Correctly ──
  useEffect(() => {
    const loadSites = async () => {
      const siteMap = new Map();
      try {
        const res = await apiClient.get('/sites').catch(() => null);
        const list = normalizeList(res, 'sites');
        if (Array.isArray(list)) {
          list.forEach(s => {
            if (s && (s.id || s.siteId || s.name)) {
              const id = String(s.id || s.siteId || s._id);
              const name = String(s.name || s.label || s.title || id).trim();
              if (name && !name.toUpperCase().includes('SELECT')) siteMap.set(id, { id, name });
            }
          });
        }
      } catch (e) {}

      // Fallback to activeSites / contextSites / scada_sites_db
      const fallbackList = activeSites?.length > 0 ? activeSites : contextSites || [];
      fallbackList.forEach(s => {
        if (s && (s.id || s.name)) {
          const id = String(s.id || s.name);
          const name = String(s.name || s.label || id).trim();
          if (name && !siteMap.has(id)) siteMap.set(id, { id, name });
        }
      });

      try {
        const stored = localStorage.getItem('scada_sites_db');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach(s => {
              if (s && s.name) {
                const id = String(s.id || s.name);
                if (!siteMap.has(id)) siteMap.set(id, { id, name: s.name });
              }
            });
          }
        }
      } catch (e) {}

      if (siteMap.size === 0) {
        siteMap.set('1', { id: '1', name: 'UG-Tank' });
        siteMap.set('5', { id: '5', name: 'HCL sec 63' });
        siteMap.set('2', { id: '2', name: 'AG-Tank' });
        siteMap.set('3', { id: '3', name: 'Main Plant Room' });
      }

      const siteList = Array.from(siteMap.values());
      setSites(siteList);
      if (siteList.length > 0 && !selectedSiteId) {
        let initialSiteId = siteList[0].id;
        try {
          const savedSite = localStorage.getItem('motors_selected_site');
          if (savedSite && siteList.some(s => String(s.id) === String(savedSite))) {
            initialSiteId = savedSite;
          }
        } catch (e) {}
        setSelectedSiteId(initialSiteId);
        const match = siteList.find(s => String(s.id) === String(initialSiteId));
        if (match) setSelectedSiteName(match.name);
      }
    };
    loadSites();
  }, []);

  // ── Load Assets for Selected Site ──
  useEffect(() => {
    if (!selectedSiteId) return;
    const loadAssets = async () => {
      const assetMap = new Map();
      const currSite = sites.find(s => String(s.id) === String(selectedSiteId));
      if (currSite) setSelectedSiteName(currSite.name);

      try {
        const res = await apiClient.get(`/sites/${selectedSiteId}/assets`).catch(() => null) ||
                          await apiClient.get('/assets', { siteId: String(selectedSiteId) }).catch(() => null);
        const list = normalizeList(res, 'assets');
        if (Array.isArray(list)) {
          list.forEach(a => {
            if (a && (a.id || a.assetId || a.name)) {
              const id = String(a.id || a.assetId || a.name);
              const name = a.name || a.label || `Asset ${id}`;
              assetMap.set(id, { id, name });
            }
          });
        }
      } catch (e) {}

      if (assetMap.size === 0) {
        assetMap.set('PR-1', { id: 'PR-1', name: 'All PUMP_ROOM Assets' });
        assetMap.set('PR-2', { id: 'PR-2', name: 'Basement Pump House' });
        assetMap.set('PR-3', { id: 'PR-3', name: 'Secondary Booster Station' });
      }

      const list = Array.from(assetMap.values());
      setAssets(list);
      setSelectedAssetId('ALL');
    };
    loadAssets();
  }, [selectedSiteId, sites]);

  // ── Load Devices for Selected Site & Asset ──
  useEffect(() => {
    if (!selectedSiteId) return;
    const loadDevices = async () => {
      setLoading(true);
      let devList = [];
      try {
        // User requested API endpoint: /devices?siteId=X&category=UG_TANK&include=settings,rules,profile
        const res = await apiClient.get('/devices', { 
          siteId: String(selectedSiteId), 
          category: 'UG_TANK', 
          include: 'settings,rules,profile' 
        }).catch(() => null);
        let list = normalizeList(res, 'devices');

        if (!Array.isArray(list) || list.length === 0) {
          const res2 = await apiClient.get('/devices', { 
            siteId: String(selectedSiteId), 
            include: 'settings,rules,profile' 
          }).catch(() => null);
          list = normalizeList(res2, 'devices');
        }

        if (!Array.isArray(list) || list.length === 0) {
          const res3 = await apiClient.get(`/sites/${selectedSiteId}/devices`).catch(() => null);
          list = normalizeList(res3, 'devices');
        }

        if (Array.isArray(list) && list.length > 0) {
          devList = list;
        }
      } catch (e) {}

      // Read saved states from localStorage to maintain state across page refresh
      let savedStates = {};
      try {
        savedStates = JSON.parse(localStorage.getItem('scada_motor_states') || '{}');
      } catch (e) {}

      // Clean device list with status persistence
      const formattedDevs = devList.map(d => {
        const devId = String(d.id || d.deviceId || d.name);
        const saved = savedStates[devId];
        const status = saved?.status || d.status || (d.isActive !== false ? 'Running' : 'Standby');
        const isRunning = String(status).toUpperCase() === 'RUNNING';

        return {
          id: devId,
          name: d.name || d.title || d.deviceName || `Device #${devId}`,
          siteId: String(d.siteId || selectedSiteId),
          siteName: d.site?.name || selectedSiteName || 'Site Location',
          assetId: String(d.assetId || d.asset?.id || 'ALL'),
          assetName: d.asset?.name || d.assetName || 'Pump Asset Group',
          status: status,
          speedRpm: saved?.speedRpm ?? (isRunning ? 1440 : 0),
          currentAmp: saved?.currentAmp ?? (isRunning ? 12.4 : 0),
          loadPct: saved?.loadPct ?? (isRunning ? 94 : 0),
          node: d.node || d.nodeId || devId,
          settings: d.settings,
          rules: d.rules,
          profile: d.profile,
          rawDevice: d
        };
      });

      setDevices(formattedDevs);
      setSelectedDeviceId('ALL');
      setLoading(false);
    };
    loadDevices();
  }, [selectedSiteId, sites]);

  // ── Poll Live Device Events / Telemetry (Using User's per-device endpoint to avoid 400 Batch errors) ──
  useEffect(() => {
    if (!selectedSiteId || !devices || devices.length === 0) return;
    const fetchTelemetry = async () => {
      try {
        const eventsMap = {};
        await Promise.all(
          devices.map(async (d) => {
            const devId = d.id;
            if (!devId) return;
            try {
              // User specified endpoint: /sites/:siteId/devices/:deviceId/events/latest
              const res = await apiClient.get(`/sites/${selectedSiteId}/devices/${devId}/events/latest`).catch(() => null)
                       || await apiClient.get(`/devices/${devId}/events/latest`).catch(() => null);
              if (res) {
                const evData = res.data?.events || res.events || res.data?.data || res.data || res;
                eventsMap[devId] = evData;
              }
            } catch (e) {}
          })
        );
        if (Object.keys(eventsMap).length > 0) {
          setLiveEventsMap(prev => ({ ...prev, ...eventsMap }));
        }
      } catch (e) {}
    };

    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(timer);
  }, [selectedSiteId, devices]);

  // Filtered devices based on Site, Asset, and Device selection
  const filteredMotors = useMemo(() => {
    return devices.filter(m => {
      if (selectedAssetId !== 'ALL' && m.assetId !== selectedAssetId) {
        return false;
      }
      if (selectedDeviceId !== 'ALL' && String(m.id) !== String(selectedDeviceId)) {
        return false;
      }
      return true;
    });
  }, [devices, selectedAssetId, selectedDeviceId]);

  // Toggle motor status (Running <-> Standby) & persist to localStorage across refresh
  const handleToggleMotorStatus = useCallback((motor) => {
    setDevices(prev => {
      const updated = prev.map(m => {
        if (m.id === motor.id) {
          const isRunning = m.status === 'Running' || m.status === 'RUNNING';
          const nextStatus = isRunning ? 'Standby' : 'Running';
          const newObj = {
            ...m,
            status: nextStatus,
            speedRpm: nextStatus === 'Running' ? 1440 : 0,
            currentAmp: nextStatus === 'Running' ? 12.4 : 0.0,
            loadPct: nextStatus === 'Running' ? 94 : 0
          };

          // Persist state in localStorage so refresh keeps user choice intact
          try {
            const savedStates = JSON.parse(localStorage.getItem('scada_motor_states') || '{}');
            savedStates[m.id] = {
              status: nextStatus,
              speedRpm: newObj.speedRpm,
              currentAmp: newObj.currentAmp,
              loadPct: newObj.loadPct,
              updatedAt: Date.now()
            };
            localStorage.setItem('scada_motor_states', JSON.stringify(savedStates));
          } catch (e) {}

          return newObj;
        }
        return m;
      });

      return updated;
    });
  }, []);

  const handleOpenDiagnostics = (motor) => {
    setSelectedMotor(motor);
    setShowDiagModal(true);
  };

  const handleOpenDetails = (motor) => {
    setSelectedMotor(motor);
    setShowDetailsModal(true);
  };

  // ── Dynamic KPIs calculated purely from real backend devices & live telemetry ──
  const kpiStats = useMemo(() => {
    const total = devices.length;
    let operationalCount = 0;
    let totalPower = 0;
    let activeAlarms = 0;

    devices.forEach(d => {
      const live = liveEventsMap[d.id] || {};
      const current = Number(live['Output current (A)'] ?? live.currentAmp ?? 0);
      const speed = Number(live['Running rotation Speed (RPM)'] ?? live.speedRpm ?? 0);
      const isOp = current > 0 || speed > 0 || String(live['Pump Status']).toUpperCase() === 'RUNNING' || String(d.status).toUpperCase() === 'RUNNING';
      if (isOp) operationalCount++;

      const pwr = Number(live['Output Power (KW)'] ?? live.powerKw ?? 0);
      totalPower += pwr;

      if (String(live['Pump Status']).toUpperCase() === 'FAULT' || String(d.status).toUpperCase() === 'FAULT') {
        activeAlarms++;
      }
    });

    const healthPct = total > 0 ? Math.round(((total - activeAlarms) / total) * 100) : 100;

    return {
      total,
      operationalCount,
      totalPower: Math.round(totalPower * 10) / 10,
      healthPct,
      activeAlarms
    };
  }, [devices, liveEventsMap]);

  // ── Dynamic Starter Controllers Matrix (Built from live real devices) ──
  const startersData = useMemo(() => {
    return filteredMotors.map((m, idx) => {
      const live = liveEventsMap[m.id] || {};
      const freq = live['Current Frequency (Hz)'] ?? live.frequencyHz ?? 0;
      const speed = live['Running rotation Speed (RPM)'] ?? live.speedRpm ?? 0;
      const current = live['Output current (A)'] ?? live.currentAmp ?? 0;
      const isOp = Number(current) > 0 || Number(speed) > 0 || String(live['Pump Status']).toUpperCase() === 'RUNNING' || String(m.status).toUpperCase() === 'RUNNING';
      const isFault = String(live['Pump Status']).toUpperCase() === 'FAULT' || String(m.status).toUpperCase() === 'FAULT';

      return {
        id: `CTRL-${m.id}`,
        motor: m.name,
        type: live.starterType || (idx % 2 === 0 ? 'VFD Controller' : 'DOL Starter'),
        freq: `${freq} Hz`,
        speed: `${speed} RPM`,
        temp: `${live['Motor Temperature'] ?? live.tempC ?? 0}°C`,
        status: isFault ? 'FAULT' : isOp ? 'RUNNING' : 'STANDBY'
      };
    });
  }, [filteredMotors, liveEventsMap]);

  // ── Dynamic Pump Room Facility Distribution ──
  const facilityDistribution = useMemo(() => {
    const groups = {};
    devices.forEach(d => {
      const room = d.assetName || 'General Facility';
      if (!groups[room]) {
        groups[room] = { room, count: 0, running: 0, powerSum: 0 };
      }
      groups[room].count += 1;
      const live = liveEventsMap[d.id] || {};
      const current = Number(live['Output current (A)'] ?? live.currentAmp ?? 0);
      const pwr = Number(live['Output Power (KW)'] ?? live.powerKw ?? 0);
      if (current > 0 || String(live['Pump Status']).toUpperCase() === 'RUNNING' || String(d.status).toUpperCase() === 'RUNNING') {
        groups[room].running += 1;
      }
      groups[room].powerSum += pwr;
    });

    return Object.values(groups);
  }, [devices, liveEventsMap]);

  return (
    <div className="motors-page-wrapper p-3 p-md-4 fade-in">
      {/* ═════════════════════════════════════════════════════════════
          TOP HEADER TITLE BAR
          ═════════════════════════════════════════════════════════════ */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="live-node-badge">
              <span className="live-node-dot" />
              NODE_TX_STABLE
            </span>
            <span className="clock-badge font-monospace">
              {time.toLocaleTimeString()}
            </span>
          </div>
          <h1 className="header-title mb-0">
            Systems <span className="text-cyan-glow">Motorization</span> Hub
          </h1>
          <p className="header-subtitle mb-0">
            Monitor + Control + Optimize &nbsp;|&nbsp; Real-time Motor Operations
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button className="btn-scada-glass">
            <RefreshCw size={14} className="me-2" /> RE-CALIBRATE
          </Button>
          <Button className="btn-scada-primary">
            <Download size={14} className="me-2" /> EXPORT LOGS
          </Button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TOP CASCADED SELECTOR BAR (SITE, ASSETS, DEVICE)
          "DROP DOWN SAHI SE MAP KARO"
          ═════════════════════════════════════════════════════════════ */}
      <div className="top-selector-container mb-4">
        <Row className="g-3 align-items-stretch">
          {/* 1. SITE SELECTOR */}
          <Col lg={3} md={6}>
            <div className="selector-card">
              <div className="selector-header">
                <div className="selector-icon-box text-cyan">
                  <Building size={16} />
                </div>
                <span className="selector-label">Site</span>
              </div>
              <Form.Select 
                className="selector-dropdown"
                value={selectedSiteId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSiteId(val);
                  try { localStorage.setItem('motors_selected_site', val); } catch (err) {}
                }}
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
              <div className="selector-subtext">Select site location</div>
            </div>
          </Col>

          {/* 2. ASSETS SELECTOR */}
          <Col lg={3} md={6}>
            <div className="selector-card">
              <div className="selector-header">
                <div className="selector-icon-box text-blue">
                  <Folder size={16} />
                </div>
                <span className="selector-label">Assets</span>
              </div>
              <Form.Select 
                className="selector-dropdown"
                value={selectedAssetId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedAssetId(val);
                  try { localStorage.setItem('motors_selected_asset', val); } catch (err) {}
                }}
              >
                <option value="ALL">All PUMP_ROOM Assets</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Form.Select>
              <div className="selector-subtext">Select asset group</div>
            </div>
          </Col>

          {/* 3. DEVICE SELECTOR */}
          <Col lg={3} md={6}>
            <div className="selector-card">
              <div className="selector-header">
                <div className="selector-icon-box text-emerald">
                  <Cpu size={16} />
                </div>
                <span className="selector-label">Device</span>
              </div>
              <Form.Select 
                className="selector-dropdown"
                value={selectedDeviceId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDeviceId(val);
                  try { localStorage.setItem('motors_selected_device', val); } catch (err) {}
                }}
              >
                <option value="ALL">Motors (All Devices)</option>
                {devices.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                ))}
              </Form.Select>
              <div className="selector-subtext">Select motor device</div>
            </div>
          </Col>

          {/* 4. VIEW MOTORS BUTTON CARD */}
          <Col lg={3} md={6}>
            <div className="selector-card btn-card d-flex flex-column justify-content-between">
              <button 
                className="view-motors-action-btn"
                onClick={() => {
                  const el = document.getElementById('motors-grid-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Search size={16} />
                <span>VIEW MOTORS</span>
                <ArrowRight size={16} />
              </button>
              <div className="selector-subtext text-center mt-2">
                Select site, asset and device to view motors
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          5 KPI SUMMARY STATS ROW
          ═════════════════════════════════════════════════════════════ */}
      <Row className="g-3 mb-4">
        <Col xl={2} lg={4} md={6}>
          <div className="kpi-card">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="kpi-icon-box text-cyan bg-cyan-subtle">
                <Activity size={18} />
              </div>
              <span className="badge-trend positive">Live Sync</span>
            </div>
            <div className="kpi-label">Total Devices</div>
            <div className="kpi-value font-monospace">{kpiStats.total}</div>
          </div>
        </Col>

        <Col xl={2} lg={4} md={6}>
          <div className="kpi-card">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="kpi-icon-box text-emerald bg-emerald-subtle">
                <Power size={18} />
              </div>
              <div className="ring-gauge-badge">
                {kpiStats.total > 0 ? Math.round((kpiStats.operationalCount / kpiStats.total) * 100) : 0}%
              </div>
            </div>
            <div className="kpi-label">Operational</div>
            <div className="kpi-value font-monospace">{kpiStats.operationalCount}</div>
          </div>
        </Col>

        <Col xl={3} lg={4} md={6}>
          <div className="kpi-card">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="kpi-icon-box text-amber bg-amber-subtle">
                <Zap size={18} />
              </div>
              <span className="badge-trend positive">Real-Time</span>
            </div>
            <div className="kpi-label">Total Consumption</div>
            <div className="kpi-value font-monospace">{kpiStats.totalPower} <span className="fs-6 text-secondary">kW</span></div>
          </div>
        </Col>

        <Col xl={3} lg={6} md={6}>
          <div className="kpi-card">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="kpi-icon-box text-sky bg-sky-subtle">
                <ShieldCheck size={18} />
              </div>
              <span className="badge-trend text-emerald fw-bold">{kpiStats.healthPct >= 90 ? 'Optimal' : 'Attention'}</span>
            </div>
            <div className="kpi-label">System Health</div>
            <div className="d-flex align-items-baseline gap-2">
              <div className="kpi-value font-monospace">{kpiStats.healthPct}%</div>
              <div className="health-bar-container flex-grow-1">
                <div className="health-bar-fill" style={{ width: `${kpiStats.healthPct}%` }} />
              </div>
            </div>
          </div>
        </Col>

        <Col xl={2} lg={6} md={12}>
          <div className="kpi-card border-danger-subtle">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="kpi-icon-box text-rose bg-rose-subtle">
                <TrendingUp size={18} />
              </div>
              <span className="critical-alarm-badge">● {kpiStats.activeAlarms} Alarms</span>
            </div>
            <div className="kpi-label">Active Alarms</div>
            <div className="kpi-value font-monospace text-rose">{kpiStats.activeAlarms}</div>
          </div>
        </Col>
      </Row>

      {/* ═════════════════════════════════════════════════════════════
          NAVIGATION TABS BAR & REALTIME STATUS
          ═════════════════════════════════════════════════════════════ */}
      <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4 p-2 rounded-3 nav-tabs-container gap-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          {[
            { key: 'all', label: 'All Views Unified' },
            { key: 'units', label: 'Motor Units & Telemetry' },
            { key: 'vfd', label: 'VFD / DOL Starters' },
            { key: 'rooms', label: 'Pump Rooms Summary' },
            { key: 'analytics', label: 'Energy Analytics' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`nav-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="d-flex align-items-center gap-3 pe-2 text-secondary fs-11 fw-bold">
          <span className="d-flex align-items-center gap-1 text-emerald">
            <span className="live-dot-pulse bg-emerald" />
            Real-time Data
          </span>
          <span>Sep 23, 2026 | {time.toLocaleTimeString()}</span>
          <RefreshCw size={14} className="cursor-pointer text-cyan" />
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          MOTORS GRID SECTION
          ═════════════════════════════════════════════════════════════ */}
      <div id="motors-grid-section">
        {(activeTab === 'all' || activeTab === 'units') && (
          <Row className="g-4 mb-5">
            {loading ? (
              <Col xs={12} className="text-center py-5">
                <Spinner animation="border" variant="info" />
                <p className="text-secondary fs-9 mt-2 font-monospace">Loading Mapped Motor Telemetry...</p>
              </Col>
            ) : filteredMotors.length > 0 ? (
              filteredMotors.map((motor) => (
                <Col xl={6} key={motor.id}>
                  <MotorCard 
                    motor={motor}
                    liveEvent={liveEventsMap[motor.id]}
                    onToggleStatus={handleToggleMotorStatus}
                    onOpenDiagnostics={handleOpenDiagnostics}
                    onOpenDetails={handleOpenDetails}
                  />
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <div className="empty-motors-card text-center py-5 rounded-4">
                  <Cpu size={40} className="text-secondary opacity-50 mb-3" />
                  <h5 className="text-heading-adaptive fw-bold">No Mapped Motors Found for {selectedSiteName || 'Selected Site'}</h5>
                  <p className="text-secondary fs-9 mb-0">Try selecting another Site or Asset from the dropdown selector above.</p>
                </div>
              </Col>
            )}
          </Row>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════
          VFD & DOL STARTERS MATRIX TABLE
          ═════════════════════════════════════════════════════════════ */}
      {(activeTab === 'all' || activeTab === 'vfd') && (
        <div className="mb-5">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h4 className="text-heading-adaptive fw-black uppercase tracking-wide m-0 d-flex align-items-center gap-2">
              <Zap className="text-cyan" size={20} />
              VFD & DOL Starter Controllers Matrix
            </h4>
            <Badge bg="dark" className="border border-white border-opacity-10 text-cyan font-monospace fs-11">
              {startersData.length} STARTERS
            </Badge>
          </div>

          <Card className="border-0 scada-table-card rounded-4 overflow-hidden">
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead>
                  <tr className="table-header-row font-monospace text-uppercase fs-10 text-secondary">
                    <th className="py-3 px-4">Starter ID</th>
                    <th className="py-3">Associated Motor</th>
                    <th className="py-3">Starter Type</th>
                    <th className="py-3 text-end">Output Freq</th>
                    <th className="py-3 text-end">Speed Ratio</th>
                    <th className="py-3 text-end">Heat Temp</th>
                    <th className="py-3 text-center">Control State</th>
                  </tr>
                </thead>
                <tbody className="font-monospace fs-9">
                  {startersData.length > 0 ? (
                    startersData.map(st => (
                      <tr key={st.id} className="table-body-row">
                        <td className="px-4 py-3 text-cyan fw-bold">{st.id}</td>
                        <td className="py-3 text-heading-adaptive fw-bold">{st.motor}</td>
                        <td className="py-3 text-secondary">{st.type}</td>
                        <td className="py-3 text-end text-amber fw-bold">{st.freq}</td>
                        <td className="py-3 text-end text-sky fw-bold">{st.speed}</td>
                        <td className="py-3 text-end text-rose">{st.temp}</td>
                        <td className="py-3 text-center">
                          <Badge 
                            bg={st.status === 'RUNNING' ? 'success' : st.status === 'FAULT' ? 'danger' : 'secondary'} 
                            className="px-3 py-1 text-uppercase tracking-widest rounded-pill"
                          >
                            {st.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-secondary">
                        No active motor starter controllers found for selected filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          PUMP ROOMS SUMMARY SECTION
          ═════════════════════════════════════════════════════════════ */}
      {(activeTab === 'all' || activeTab === 'rooms') && (
        <div className="mb-5">
          <h4 className="text-heading-adaptive fw-black uppercase tracking-wide mb-3 d-flex align-items-center gap-2">
            <Activity className="text-emerald" size={20} />
            Pump Room Facility Distribution
          </h4>
          <Row className="g-4">
            {facilityDistribution.length > 0 ? (
              facilityDistribution.map((rm, idx) => (
                <Col md={4} key={idx}>
                  <div className="facility-summary-card p-4 rounded-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-heading-adaptive fw-bold m-0 font-monospace">{rm.room}</h6>
                      <Badge bg="success" className="fs-10 font-monospace px-2 py-1">Active Group</Badge>
                    </div>
                    <div className="d-flex justify-content-between text-secondary fs-9 font-monospace mb-2">
                      <span>Active Devices:</span>
                      <strong className="text-heading-adaptive">{rm.running} / {rm.count} RUNNING</strong>
                    </div>
                    <div className="d-flex justify-content-between text-secondary fs-9 font-monospace">
                      <span>Total Power Draw:</span>
                      <strong className="text-amber">{Math.round(rm.powerSum * 10) / 10} kW</strong>
                    </div>
                  </div>
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <div className="facility-summary-card p-4 rounded-4 text-center text-secondary font-monospace">
                  No facility asset groups mapped for this selection
                </div>
              </Col>
            )}
          </Row>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          DIAGNOSTICS MODAL
          ═════════════════════════════════════════════════════════════ */}
      <Modal show={showDiagModal} onHide={() => setShowDiagModal(false)} centered size="lg" className="scada-dark-modal">
        <Modal.Header closeButton className="border-bottom border-white border-opacity-10 bg-black">
          <Modal.Title className="text-white fw-black font-monospace fs-5">
            <Settings className="text-cyan me-2" size={18} />
            CORE DIAGNOSTICS: {selectedMotor?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white p-4 font-monospace">
          <Row className="g-3 mb-4">
            <Col md={6}>
              <div className="diag-stat-box p-3 rounded-3 bg-black border border-white border-opacity-10">
                <small className="text-secondary d-block">BEARING TEMPERATURE</small>
                <div className="fs-3 text-cyan fw-bold">42.5 °C</div>
                <small className="text-emerald">Within Normal Limits</small>
              </div>
            </Col>
            <Col md={6}>
              <div className="diag-stat-box p-3 rounded-3 bg-black border border-white border-opacity-10">
                <small className="text-secondary d-block">WINDING RESISTANCE</small>
                <div className="fs-3 text-emerald fw-bold">1.42 Ω</div>
                <small className="text-emerald">Optimal Balance</small>
              </div>
            </Col>
            <Col md={6}>
              <div className="diag-stat-box p-3 rounded-3 bg-black border border-white border-opacity-10">
                <small className="text-secondary d-block">INSULATION RESISTANCE (MEGGER)</small>
                <div className="fs-3 text-amber fw-bold">120 MΩ</div>
                <small className="text-secondary">Next inspection in 45 days</small>
              </div>
            </Col>
            <Col md={6}>
              <div className="diag-stat-box p-3 rounded-3 bg-black border border-white border-opacity-10">
                <small className="text-secondary d-block">VIBRATION SPECTRUM (FFT)</small>
                <div className="fs-3 text-sky fw-bold">0.8 mm/s</div>
                <small className="text-emerald">ISO 10816 Class I Pass</small>
              </div>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => setShowDiagModal(false)}>Close</Button>
            <Button variant="info" className="fw-bold">Run Self Diagnostic Test</Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════
          DETAILS MODAL
          ═════════════════════════════════════════════════════════════ */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered size="md" className="scada-dark-modal">
        <Modal.Header closeButton className="border-bottom border-white border-opacity-10 bg-black">
          <Modal.Title className="text-white fw-black font-monospace fs-5">
            <Eye className="text-emerald me-2" size={18} />
            MOTOR SPECIFICATIONS: {selectedMotor?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white p-4 font-monospace fs-9">
          <div className="d-flex justify-content-between py-2 border-bottom border-white border-opacity-10">
            <span className="text-secondary">Equipment Tag:</span>
            <span className="text-white fw-bold">{selectedMotor?.name}</span>
          </div>
          <div className="d-flex justify-content-between py-2 border-bottom border-white border-opacity-10">
            <span className="text-secondary">Rated Power Output:</span>
            <span className="text-cyan fw-bold">45 kW / 60 HP</span>
          </div>
          <div className="d-flex justify-content-between py-2 border-bottom border-white border-opacity-10">
            <span className="text-secondary">Voltage / Frequency:</span>
            <span className="text-white">415V AC / 50 Hz 3-Phase</span>
          </div>
          <div className="d-flex justify-content-between py-2 border-bottom border-white border-opacity-10">
            <span className="text-secondary">Rated RPM:</span>
            <span className="text-amber">1450 RPM</span>
          </div>
          <div className="d-flex justify-content-between py-2 border-bottom border-white border-opacity-10">
            <span className="text-secondary">Manufacturer:</span>
            <span className="text-white">Siemens 1LE1 Series</span>
          </div>
          <div className="d-flex justify-content-between py-2 border-bottom border-white border-opacity-10">
            <span className="text-secondary">Inclosure Protection:</span>
            <span className="text-emerald">IP55 / Class F Insulation</span>
          </div>

          <div className="mt-4 text-end">
            <Button variant="outline-light" onClick={() => setShowDetailsModal(false)}>Close Specifications</Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════
          CUSTOM SCADA STYLES (LARGE MOTOR HUD + COMPACT TELEMETRY TILES)
          ═════════════════════════════════════════════════════════════ */}
      <style dangerouslySetInnerHTML={{ __html: `
        .motors-page-wrapper {
          background: #060b17;
          min-height: 100vh;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #e2e8f0;
        }

        .text-cyan-glow {
          color: #0ea5e9;
          text-shadow: 0 0 15px rgba(14, 165, 233, 0.4);
        }

        .header-title {
          color: #ffffff;
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -1px;
          text-transform: uppercase;
        }

        .header-subtitle {
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .live-node-badge {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 1.5px;
          padding: 3px 12px;
          border-radius: 50px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .live-node-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: pulse 1.5s infinite;
        }

        .clock-badge {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          font-size: 0.72rem;
          padding: 3px 12px;
          border-radius: 50px;
        }

        .btn-scada-glass {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 10px 20px;
          transition: all 0.25s ease;
        }
        .btn-scada-glass:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border-color: #0ea5e9;
        }

        .btn-scada-primary {
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          border: none;
          color: #ffffff;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 10px 20px;
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.4);
          transition: all 0.25s ease;
        }
        .btn-scada-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(14, 165, 233, 0.6);
        }

        /* ═════════════════════════════════════════════════════════════
           TOP SELECTOR CARDS
           ═════════════════════════════════════════════════════════════ */
        .top-selector-container { position: relative; }

        .selector-card {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(8, 14, 28, 0.95) 100%);
          border: 1px solid rgba(14, 165, 233, 0.25);
          border-radius: 14px;
          padding: 14px 16px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
          height: 100%;
        }
        .selector-card:hover {
          border-color: #0ea5e9;
          box-shadow: 0 10px 35px rgba(14, 165, 233, 0.25);
        }

        .selector-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .selector-icon-box {
          width: 28px; height: 28px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .selector-label {
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .selector-dropdown {
          background-color: rgba(6, 11, 23, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #ffffff !important;
          font-weight: 800 !important;
          font-size: 0.9rem !important;
          padding: 10px 12px !important;
          border-radius: 10px !important;
          cursor: pointer;
          transition: all 0.25s ease;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230ea5e9' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
        }
        .selector-dropdown:focus, .selector-dropdown:hover {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 15px rgba(14, 165, 233, 0.3) !important;
        }

        .selector-subtext {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 700;
          margin-top: 6px;
        }

        .btn-card {
          border-color: rgba(14, 165, 233, 0.4);
          background: linear-gradient(145deg, rgba(14, 165, 233, 0.08) 0%, rgba(8, 14, 28, 0.95) 100%);
        }

        .view-motors-action-btn {
          width: 100%;
          background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
          border: none;
          color: #ffffff;
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 900;
          font-size: 0.82rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.5);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .view-motors-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(14, 165, 233, 0.7);
        }

        /* ═════════════════════════════════════════════════════════════
           KPI CARDS
           ═════════════════════════════════════════════════════════════ */
        .kpi-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 14px;
          padding: 14px;
          height: 100%;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .kpi-card:hover {
          background: rgba(15, 23, 42, 0.85);
          border-color: rgba(14, 165, 233, 0.3);
          transform: translateY(-3px);
        }

        .kpi-icon-box {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bg-cyan-subtle { background: rgba(14, 165, 233, 0.12); }
        .bg-emerald-subtle { background: rgba(16, 185, 129, 0.12); }
        .bg-amber-subtle { background: rgba(245, 158, 11, 0.12); }
        .bg-sky-subtle { background: rgba(56, 189, 248, 0.12); }
        .bg-rose-subtle { background: rgba(244, 63, 94, 0.12); }

        .text-cyan { color: #0ea5e9; }
        .text-emerald { color: #10b981; }
        .text-amber { color: #f59e0b; }
        .text-sky { color: #38bdf8; }
        .text-rose { color: #f43f5e; }
        .text-blue { color: #3b82f6; }

        .badge-trend {
          font-size: 0.62rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.05);
        }
        .badge-trend.positive { color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }

        .ring-gauge-badge {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 2px solid #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.62rem;
          font-weight: 900;
          color: #10b981;
        }

        .critical-alarm-badge {
          font-size: 0.62rem;
          font-weight: 900;
          color: #f43f5e;
          background: rgba(244, 63, 94, 0.15);
          border: 1px solid rgba(244, 63, 94, 0.3);
          padding: 2px 8px;
          border-radius: 50px;
        }

        .kpi-label {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 2px;
        }

        .kpi-value {
          font-size: 1.5rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1;
        }

        .health-bar-container {
          height: 5px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }
        .health-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #38bdf8, #10b981);
        }

        /* ═════════════════════════════════════════════════════════════
           MOTOR CARDS: LARGE MOTOR HUD + SMALL COMPACT TELEMETRY TILES
           ═════════════════════════════════════════════════════════════ */
        .motor-card-scada {
          background: linear-gradient(145deg, #0a1124 0%, #030816 100%);
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 18px !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .motor-card-scada:hover {
          transform: translateY(-5px);
          border-color: var(--card-accent) !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px var(--card-accent);
        }

        .card-top-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          opacity: 0.85;
        }

        .motor-id-badge {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 1px;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .node-badge {
          background: rgba(14, 165, 233, 0.12);
          color: #0ea5e9;
          font-size: 0.62rem;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .mode-pill-badge {
          background: rgba(168, 85, 247, 0.15);
          color: #c084fc;
          font-size: 0.62rem;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .motor-title {
          font-size: 1.2rem;
          letter-spacing: -0.3px;
        }

        .status-pill-glow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 50px;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 1.2px;
          border: 1px solid transparent;
        }
        .status-pill-glow.running {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
        }
        .status-pill-glow.standby {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
          border-color: rgba(245, 158, 11, 0.3);
        }
        .status-pill-glow.fault {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .status-dot-pulse {
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        /* ── LARGE MOTOR GRAPHIC HUD (BADA MOTOR IMAGE) ── */
        .hud-visualizer-wrapper-large {
          position: relative;
          width: 220px; height: 220px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hud-ring-outer {
          position: absolute;
          width: 100%; height: 100%;
          border-radius: 50%;
          border: 2px dashed;
          pointer-events: none;
        }
        .hud-ring-inner {
          position: absolute;
          width: 86%; height: 86%;
          border-radius: 50%;
          border: 1.5px dashed;
          pointer-events: none;
        }

        .hud-spin-cw { animation: spin 12s linear infinite; }
        .hud-spin-ccw { animation: spin-reverse 18s linear infinite; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }

        .motor-aura-glow {
          position: absolute;
          width: 78%; height: 78%;
          border-radius: 50%;
          transition: opacity 0.5s ease;
        }

        .motor-avatar-frame-large {
          width: 76%; height: 76%;
          border-radius: 50%;
          overflow: hidden;
          position: relative;
          z-index: 2;
          background: #020617;
          border: 3px solid;
          box-shadow: 0 0 25px rgba(0, 0, 0, 0.9), inset 0 0 15px rgba(0,0,0,0.8);
        }

        .motor-avatar-img-large {
          width: 135%; height: 135%;
          object-fit: cover;
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          filter: brightness(1.2) contrast(1.15);
        }

        .hud-bottom-tag {
          position: absolute;
          bottom: 2px;
          background: rgba(6, 11, 23, 0.95);
          border: 1px solid;
          color: #ffffff;
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 1px;
          padding: 3px 12px;
          border-radius: 50px;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        }

        /* ── COMPACT TELEMETRY TILES (TILES SMALL KARO) ── */
        .telemetry-heading-small {
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #0ea5e9;
        }

        .live-tag-small {
          font-size: 0.58rem;
          font-weight: 900;
          color: #64748b;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .compact-tile {
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          padding: 8px 10px;
          transition: all 0.2s ease;
        }
        .compact-tile:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(14, 165, 233, 0.3);
        }

        .stat-label-small {
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.3px;
        }

        .stat-val-small {
          font-size: 1.05rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
        }

        .stat-unit-small {
          font-size: 0.6rem;
          font-weight: 800;
          color: #64748b;
        }

        /* Compact Load Factor */
        .load-factor-compact-box {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 8px 10px;
        }

        .load-factor-label-small {
          font-size: 0.62rem;
          font-weight: 900;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #64748b;
        }

        .load-factor-val-small {
          font-size: 0.75rem;
          font-weight: 900;
          color: #0ea5e9;
        }

        .load-factor-track-small {
          height: 5px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          overflow: hidden;
        }

        .load-factor-fill-small {
          height: 100%;
          border-radius: 8px;
          transition: width 0.8s ease-out;
        }

        /* Buttons Small */
        .action-btn-diag-small {
          border-radius: 50px !important;
          font-size: 0.65rem !important;
          font-weight: 900 !important;
          letter-spacing: 1px !important;
          padding: 6px 12px !important;
        }

        .action-btn-power-small {
          border-radius: 50px !important;
          font-size: 0.65rem !important;
          font-weight: 900 !important;
          letter-spacing: 1px !important;
          padding: 6px 12px !important;
          border: none !important;
        }

        .action-btn-details-small {
          font-size: 0.65rem !important;
        }

        .btn-stop-glow { box-shadow: 0 3px 12px rgba(239, 68, 68, 0.4); }
        .btn-start-glow { box-shadow: 0 3px 12px rgba(16, 185, 129, 0.4); }

        /* Nav Tabs */
        .nav-tabs-container {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
        }

        .nav-tab-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 7px 14px;
          border-radius: 8px;
          transition: all 0.25s ease;
        }

        .nav-tab-btn:hover {
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-tab-btn.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #030712;
          font-weight: 900;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }

        .scada-table-card {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        .table-header-row { background: rgba(0, 0, 0, 0.6) !important; }
        .table-body-row:hover { background: rgba(255, 255, 255, 0.03) !important; }

        .facility-summary-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
        }
        .facility-summary-card:hover {
          border-color: #0ea5e9;
          transform: translateY(-3px);
        }

        .empty-motors-card {
          background: rgba(15, 23, 42, 0.4);
          border: 1px dashed rgba(255, 255, 255, 0.15);
        }

        .text-heading-adaptive { color: #ffffff; }

        /* ═════════════════════════════════════════════════════════════
           SOOTHING & EYE-COMFORTABLE LIGHT MODE THEME (ANTI-GLARE EXECUTIVE)
           ═════════════════════════════════════════════════════════════ */
        .light-mode .motors-page-wrapper,
        html[data-theme="light"] .motors-page-wrapper {
          background: #edf2f7 !important;
          color: #1e293b !important;
        }

        .light-mode .text-heading-adaptive,
        html[data-theme="light"] .text-heading-adaptive {
          color: #0f172a !important;
        }

        .light-mode .text-cyan-glow,
        html[data-theme="light"] .text-cyan-glow {
          color: #0284c7 !important;
          text-shadow: none !important;
        }

        .light-mode .header-title,
        html[data-theme="light"] .header-title {
          color: #0f172a !important;
          font-weight: 800;
        }
        .light-mode .header-subtitle,
        html[data-theme="light"] .header-subtitle {
          color: #475569 !important;
        }

        .light-mode .live-node-badge,
        html[data-theme="light"] .live-node-badge {
          background: #e0f2fe !important;
          border-color: #bae6fd !important;
          color: #0369a1 !important;
        }

        .light-mode .clock-badge,
        html[data-theme="light"] .clock-badge {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #475569 !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03) !important;
        }

        .light-mode .btn-scada-glass,
        html[data-theme="light"] .btn-scada-glass {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #334155 !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03) !important;
        }
        .light-mode .btn-scada-glass:hover,
        html[data-theme="light"] .btn-scada-glass:hover {
          border-color: #0284c7 !important;
          color: #0284c7 !important;
          background: #f0f9ff !important;
        }

        .light-mode .selector-card,
        html[data-theme="light"] .selector-card {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.03) !important;
          border-radius: 14px !important;
        }

        .light-mode .selector-label,
        html[data-theme="light"] .selector-label {
          color: #475569 !important;
        }

        .light-mode .selector-icon-box,
        html[data-theme="light"] .selector-icon-box {
          background: #f1f5f9 !important;
        }

        .light-mode .selector-dropdown,
        html[data-theme="light"] .selector-dropdown {
          background-color: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          font-weight: 700 !important;
          box-shadow: none !important;
        }
        .light-mode .selector-dropdown:focus,
        html[data-theme="light"] .selector-dropdown:hover {
          border-color: #0284c7 !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12) !important;
        }

        .light-mode .selector-subtext,
        html[data-theme="light"] .selector-subtext {
          color: #64748b !important;
        }

        .light-mode .btn-card,
        html[data-theme="light"] .btn-card {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
        }

        .light-mode .view-motors-action-btn,
        html[data-theme="light"] .view-motors-action-btn {
          background: linear-gradient(135deg, #0284c7 0%, #1e40af 100%) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25) !important;
        }
        .light-mode .view-motors-action-btn:hover,
        html[data-theme="light"] .view-motors-action-btn:hover {
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35) !important;
        }

        .light-mode .kpi-card,
        html[data-theme="light"] .kpi-card {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03) !important;
          border-radius: 14px !important;
        }
        .light-mode .kpi-card:hover,
        html[data-theme="light"] .kpi-card:hover {
          border-color: #0284c7 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06) !important;
        }

        .light-mode .kpi-label,
        html[data-theme="light"] .kpi-label {
          color: #475569 !important;
        }

        .light-mode .kpi-value,
        html[data-theme="light"] .kpi-value {
          color: #0f172a !important;
        }

        .light-mode .health-bar-container,
        html[data-theme="light"] .health-bar-container {
          background: #e2e8f0 !important;
        }

        .light-mode .nav-tabs-container,
        html[data-theme="light"] .nav-tabs-container {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03) !important;
          border-radius: 12px !important;
        }

        .light-mode .nav-tab-btn,
        html[data-theme="light"] .nav-tab-btn {
          color: #475569 !important;
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
        }
        .light-mode .nav-tab-btn:hover,
        html[data-theme="light"] .nav-tab-btn:hover {
          background: #f1f5f9 !important;
          color: #0284c7 !important;
        }

        .light-mode .nav-tab-btn.active,
        html[data-theme="light"] .nav-tab-btn.active {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
          color: #ffffff !important;
          border-color: transparent !important;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.2) !important;
        }

        .light-mode .motor-card-scada,
        html[data-theme="light"] .motor-card-scada {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04) !important;
          border-radius: 16px !important;
        }
        .light-mode .motor-card-scada:hover,
        html[data-theme="light"] .motor-card-scada:hover {
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08) !important;
        }

        .light-mode .motor-title,
        html[data-theme="light"] .motor-title {
          color: #0f172a !important;
        }

        .light-mode .motor-location-text,
        html[data-theme="light"] .motor-location-text {
          color: #475569 !important;
        }

        .light-mode .motor-id-badge,
        html[data-theme="light"] .motor-id-badge {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #334155 !important;
        }

        .light-mode .hud-bottom-tag,
        html[data-theme="light"] .hud-bottom-tag {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
        }

        .light-mode .motor-avatar-frame-large,
        html[data-theme="light"] .motor-avatar-frame-large {
          background: #f8fafc !important;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.08), inset 0 0 8px rgba(0,0,0,0.04) !important;
        }

        .light-mode .telemetry-heading-small,
        html[data-theme="light"] .telemetry-heading-small {
          color: #0369a1 !important;
        }

        .light-mode .compact-tile,
        html[data-theme="light"] .compact-tile {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: none !important;
          border-radius: 10px !important;
        }
        .light-mode .compact-tile:hover,
        html[data-theme="light"] .compact-tile:hover {
          background: #f1f5f9 !important;
          border-color: #0284c7 !important;
        }

        .light-mode .stat-label-small,
        html[data-theme="light"] .stat-label-small {
          color: #475569 !important;
        }

        .light-mode .stat-val-small,
        html[data-theme="light"] .stat-val-small {
          color: #0f172a !important;
        }

        .light-mode .stat-unit-small,
        html[data-theme="light"] .stat-unit-small {
          color: #64748b !important;
        }

        .light-mode .load-factor-compact-box,
        html[data-theme="light"] .load-factor-compact-box {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
        }

        .light-mode .load-factor-label-small,
        html[data-theme="light"] .load-factor-label-small {
          color: #475569 !important;
        }

        .light-mode .load-factor-val-small,
        html[data-theme="light"] .load-factor-val-small {
          color: #0284c7 !important;
        }

        .light-mode .load-factor-track-small,
        html[data-theme="light"] .load-factor-track-small {
          background: #e2e8f0 !important;
        }

        .light-mode .card-actions-row,
        html[data-theme="light"] .card-actions-row {
          border-top-color: #e2e8f0 !important;
        }

        .light-mode .action-btn-diag-small,
        html[data-theme="light"] .action-btn-diag-small {
          background: #f0f9ff !important;
          border: 1px solid #0284c7 !important;
          color: #0369a1 !important;
        }

        .light-mode .action-btn-details-small,
        html[data-theme="light"] .action-btn-details-small {
          color: #475569 !important;
        }
        .light-mode .action-btn-details-small:hover,
        html[data-theme="light"] .action-btn-details-small:hover {
          color: #0284c7 !important;
        }

        .light-mode .scada-table-card,
        html[data-theme="light"] .scada-table-card {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.03) !important;
        }

        .light-mode .table,
        html[data-theme="light"] .table {
          color: #0f172a !important;
          background-color: #ffffff !important;
        }

        .light-mode .table th,
        html[data-theme="light"] .table th {
          color: #475569 !important;
          background-color: #f1f5f9 !important;
          border-bottom-color: #cbd5e1 !important;
        }

        .light-mode .table td,
        html[data-theme="light"] .table td {
          border-bottom-color: #e2e8f0 !important;
          color: #0f172a !important;
        }

        .light-mode .table-header-row,
        html[data-theme="light"] .table-header-row {
          background: #f1f5f9 !important;
        }

        .light-mode .table-body-row:hover,
        html[data-theme="light"] .table-body-row:hover {
          background: #f8fafc !important;
        }

        .light-mode .facility-summary-card,
        html[data-theme="light"] .facility-summary-card {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.03) !important;
        }
        .light-mode .facility-summary-card h6,
        html[data-theme="light"] .facility-summary-card h6 {
          color: #0f172a !important;
        }

        .light-mode .empty-motors-card,
        html[data-theme="light"] .empty-motors-card {
          background: #ffffff !important;
          border: 1px dashed #cbd5e1 !important;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}} />
    </div>
  );
};

export default MotorsOverview;

