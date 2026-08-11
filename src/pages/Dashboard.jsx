import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Badge, Table, Form, Button } from 'react-bootstrap';
import {
  Zap, Droplets, Database, ShieldAlert, Activity,
  Clock, AlertTriangle, CheckCircle2, ChevronRight,
  LayoutPanelTop, Gauge, Thermometer, Battery, Wind, Globe, Cpu, Network,
  Building2, Layers, Box, CreditCard, Filter, Settings as SettingsIcon, Plus, ArrowRight,
  GitMerge, UserCheck, ShieldCheck, Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  // ── ACTIVE ROLE & PERMISSIONS ────────────────────────────────────────────
  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('simulated_active_role') || 'SUPER_ADMIN';
  });

  // ── HIERARCHICAL STATES FROM LOCALSTORAGE ────────────────────────────────
  const [organizations, setOrganizations] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_organizations');
      return saved ? JSON.parse(saved) : [{ id: 'org-1', name: 'Tata Industrial Corp', code: 'TATA_IND' }];
    } catch { return []; }
  });

  const [hierarchyZones, setHierarchyZones] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_hierarchy_zones');
      return saved ? JSON.parse(saved) : [{ id: 'hzn-1', name: 'North Power Zone', orgId: 'org-1' }];
    } catch { return []; }
  });

  const [areas, setAreas] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_areas');
      return saved ? JSON.parse(saved) : [{ id: 'ar-1', name: 'Hot Rolling Mill Area', zoneId: 'hzn-1' }];
    } catch { return []; }
  });

  const [locations, setLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_locations');
      return saved ? JSON.parse(saved) : [{ id: 'loc-1', name: 'Substation 04 Bay', areaId: 'ar-1', city: 'Jamshedpur' }];
    } catch { return []; }
  });

  const [subscription, setSubscription] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_subscription_config');
      return saved ? JSON.parse(saved) : { planTier: 'ENTERPRISE', maxDevices: 100, status: 'ACTIVE' };
    } catch { return { planTier: 'ENTERPRISE', maxDevices: 100, status: 'ACTIVE' }; }
  });

  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_assets');
      return saved ? JSON.parse(saved) : [
        { id: 'ast-1', name: 'Hydro Booster Pump #1', zoneId: 'zn-1', type: 'PUMP', rating: '45 kW' },
        { id: 'ast-2', name: 'Underground Water Tank A', zoneId: 'zn-1', type: 'TANK', rating: '50,000 L' },
        { id: 'ast-3', name: 'Main LT Panel Breaker', zoneId: 'zn-2', type: 'LT_PANEL', rating: '1600 A' }
      ];
    } catch { return []; }
  });

  const [devices, setDevices] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_devices');
      return saved ? JSON.parse(saved) : [
        { id: 'dev-1', name: 'Pump Flow Meter FS-101', uuid: 'DEV-MQTT-PUMP-01', assetId: 'ast-1', protocol: 'MQTT', telemetryKeys: 'flow_rate, pressure, status', status: 'ONLINE' },
        { id: 'dev-2', name: 'Water Tank Level Radar', uuid: 'DEV-HTTP-TANK-02', assetId: 'ast-2', protocol: 'HTTP', telemetryKeys: 'level, volume', status: 'ONLINE' },
        { id: 'dev-3', name: 'LT Panel Multi-Meter', uuid: 'DEV-MODBUS-LT-03', assetId: 'ast-3', protocol: 'Modbus TCP', telemetryKeys: 'voltage, current', status: 'ONLINE' }
      ];
    } catch { return []; }
  });

  // ── FILTER STATES FOR 6-TIER HIERARCHY ──────────────────────────────────
  const [selectedOrgId, setSelectedOrgId] = useState('ALL');
  const [selectedHzoneId, setSelectedHzoneId] = useState('ALL');

  // Listen for storage changes from Settings page
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const role = localStorage.getItem('simulated_active_role');
        if (role) setActiveRole(role);

        const orgs = localStorage.getItem('tb_organizations');
        if (orgs) setOrganizations(JSON.parse(orgs));

        const hzones = localStorage.getItem('tb_hierarchy_zones');
        if (hzones) setHierarchyZones(JSON.parse(hzones));

        const ars = localStorage.getItem('tb_areas');
        if (ars) setAreas(JSON.parse(ars));

        const locs = localStorage.getItem('tb_locations');
        if (locs) setLocations(JSON.parse(locs));

        const sub = localStorage.getItem('tb_subscription_config');
        if (sub) setSubscription(JSON.parse(sub));

        const asts = localStorage.getItem('tb_assets');
        if (asts) setAssets(JSON.parse(asts));

        const devs = localStorage.getItem('tb_devices');
        if (devs) setDevices(JSON.parse(devs));
      } catch (e) {
        console.warn('Storage sync error:', e);
      }
    };

    window.addEventListener('storage-update', handleStorageUpdate);
    return () => window.removeEventListener('storage-update', handleStorageUpdate);
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered Zones based on Org selection
  const filteredZones = useMemo(() => {
    if (selectedOrgId === 'ALL') return hierarchyZones;
    return hierarchyZones.filter(z => z.orgId === selectedOrgId);
  }, [hierarchyZones, selectedOrgId]);

  const onlineDevicesCount = useMemo(() => {
    return devices.filter(d => d.status === 'ONLINE').length;
  }, [devices]);

  const StatusCard = ({ title, value, unit, icon, color, path }) => {
    return (
      <Card
        onClick={() => path && navigate(path)}
        className="dash-card h-100 border-0 shadow-lg cursor-pointer transition-all overflow-hidden position-relative"
        style={{ background: 'linear-gradient(145deg, #0f172a 0%, #020617 100%)' }}
      >
        <div className={`card-accent-line bg-${color}`}></div>
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className={`icon-box bg-${color} bg-opacity-10 text-${color} border border-${color} border-opacity-20`}>
              {icon}
            </div>
            <Badge bg={color} className="bg-opacity-10 text-opacity-100 rounded-pill px-2 border-0 fs-10 uppercase fw-bold">
              ACTIVE
            </Badge>
          </div>
          <h6 className="text-secondary fw-black uppercase tracking-widest fs-12 mb-1 opacity-75">{title}</h6>
          <div className="d-flex align-items-baseline gap-2">
            <h3 className="text-white fw-black mb-0 fs-3">{value}</h3>
            <small className="text-info-scada fw-bold uppercase fs-11 tracking-tighter">{unit}</small>
          </div>
          <div className="mt-4 pt-3 border-top border-white border-opacity-5 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="scada-static-dot bg-success"></span>
              <small className="text-muted fs-12 fw-black tracking-widest">LIVE DATA</small>
            </div>
            <ChevronRight size={14} className="text-muted opacity-25" />
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="dashboard-wrapper p-4">
      {/* ── 6-TIER HIERARCHY FILTER BAR ────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 p-3 rounded-4 bg-panel border border-white border-opacity-5 shadow-lg">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <Filter size={18} className="text-cyan-exact" />
            <span className="fw-bold text-white fs-12">Organization:</span>
          </div>

          <Form.Select
            value={selectedOrgId}
            onChange={(e) => {
              setSelectedOrgId(e.target.value);
              setSelectedHzoneId('ALL');
            }}
            className="cyber-filter-select"
            style={{ width: '210px' }}
          >
            <option value="ALL">All Organizations ({organizations.length})</option>
            {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Form.Select>

          <div className="d-flex align-items-center gap-2 ms-md-2">
            <span className="fw-bold text-white fs-12">Hierarchy Zone:</span>
          </div>

          <Form.Select
            value={selectedHzoneId}
            onChange={(e) => setSelectedHzoneId(e.target.value)}
            className="cyber-filter-select"
            style={{ width: '210px' }}
          >
            <option value="ALL">All Zones ({filteredZones.length})</option>
            {filteredZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center gap-3">
          <Badge bg="warning" className="bg-opacity-10 text-warning border border-warning border-opacity-20 px-3 py-2 fw-bold fs-11 uppercase d-flex align-items-center gap-1">
            <UserCheck size={14} /> Active Role: {activeRole}
          </Badge>
          <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-20 px-3 py-2 fw-bold fs-11 uppercase">
            <CreditCard size={14} className="me-1" /> {subscription.planTier || 'ENTERPRISE'} TIER
          </Badge>
        </div>
      </div>

      {/* HEADER TITLE SECTION */}
      <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom border-white border-opacity-5">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <Badge bg="info" className="bg-opacity-10 text-info px-3 py-2 border border-info border-opacity-20">
              <div className="d-flex align-items-center gap-2">
                <div className="scada-static-dot bg-success" style={{ width: 8, height: 8 }}></div>
                <span className="fw-black uppercase tracking-widest fs-12">System: Optimal</span>
              </div>
            </Badge>
            <div className="text-muted fw-bold fs-11 uppercase p-2 border border-white border-opacity-5 rounded bg-black bg-opacity-20">
              <Clock size={12} className="me-2 text-info" />
              {time.toLocaleDateString()} | {time.toLocaleTimeString()}
            </div>
          </div>
          <h1 className="text-white fw-black tracking-tight mb-2 size-2">SOCHIOT <span className="text-gradient">6-TIER IOT CLOUD</span></h1>
          <div className="d-flex align-items-center gap-3 opacity-75">
            <small className="text-muted fs-11 uppercase f-tracking-widest fw-black">SUPERADMIN &gt; ORG &gt; ZONE &gt; AREA &gt; LOCATION &gt; UNIT HEAD &gt; OPERATOR</small>
          </div>
        </div>

      </div>

      {/* TOP METRICS CARDS */}
      <Row className="g-4 mb-5">
        <Col xl={3} md={6}>
          <StatusCard
            title="ORGANIZATIONS"
            value={organizations.length < 10 ? `0${organizations.length}` : organizations.length}
            unit="SuperAdmin Managed"
            icon={<Building2 size={20} />}
            color="info"
          />
        </Col>
        <Col xl={3} md={6}>
          <StatusCard
            title="HIERARCHY ZONES"
            value={filteredZones.length < 10 ? `0${filteredZones.length}` : filteredZones.length}
            unit="Org Admin Managed"
            icon={<Layers size={20} />}
            color="success"
          />
        </Col>
        <Col xl={3} md={6}>
          <StatusCard
            title="AREAS & LOCATIONS"
            value={(areas.length + locations.length) < 10 ? `0${areas.length + locations.length}` : (areas.length + locations.length)}
            unit="Zone/Area Managed"
            icon={<GitMerge size={20} />}
            color="warning"
          />
        </Col>
        <Col xl={3} md={6}>
          <StatusCard
            title="PROVISIONED DEVICES"
            value={onlineDevicesCount < 10 ? `0${onlineDevicesCount}` : onlineDevicesCount}
            unit={`Online / ${devices.length} Total`}
            icon={<Cpu size={20} />}
            color="success"
          />
        </Col>
      </Row>

      {/* DYNAMIC PROVISIONED IOT DEVICES GRID */}
      <Card className="bg-panel border-0 shadow-lg rounded-4 overflow-hidden">
        <div className="px-4 py-3 border-bottom border-white border-opacity-5 d-flex justify-content-between align-items-center bg-black bg-opacity-20">
          <div>
            <h6 className="mb-0 text-white fw-black tracking-widest uppercase fs-12">
              <Cpu size={16} className="me-2 text-cyan-exact" /> Active Configured IoT Assets & Telemetry Nodes
            </h6>
            <small className="text-slate-400 fs-11">Live equipment telemetry stream under active role ({activeRole})</small>
          </div>
        </div>

        <Card.Body className="p-4">
          <Row className="g-3">
            {devices.map((dev) => {
              const targetAsset = assets.find(a => a.id === dev.assetId);

              return (
                <Col key={dev.id} xl={4} md={6}>
                  <div className="p-3 bg-black bg-opacity-40 rounded-4 border border-white border-opacity-5 position-relative hover-border-cyan transition-all">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className={`p-2 rounded bg-dark border border-white border-opacity-5 text-${dev.status === 'ONLINE' ? 'info' : 'danger'}`}>
                          <Cpu size={18} />
                        </div>
                        <div>
                          <h6 className="text-white fw-bold fs-12 mb-0">{dev.name}</h6>
                          <small className="text-slate-400 fs-10 font-monospace">{dev.uuid}</small>
                        </div>
                      </div>

                      <Badge bg={dev.status === 'ONLINE' ? 'success' : 'danger'} className="fs-10 px-2 py-1 uppercase fw-bold">
                        {dev.status}
                      </Badge>
                    </div>

                    <div className="mb-3 pt-2 border-top border-white border-opacity-5 fs-11 text-slate-300">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-slate-400">Target Asset:</span>
                        <span className="fw-bold text-warning">{targetAsset ? targetAsset.name : 'Unassigned'}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-slate-400">Protocol:</span>
                        <Badge bg="dark" className="border border-secondary text-info fs-10">{dev.protocol}</Badge>
                      </div>
                    </div>

                    <div className="p-2 bg-dark rounded-3 border border-white border-opacity-5">
                      <small className="text-slate-400 fs-10 d-block mb-1 fw-bold">TELEMETRY KEYS STREAM</small>
                      <code className="text-cyan-exact fs-11 font-monospace d-block text-truncate">
                        {dev.telemetryKeys || 'temperature, status, pressure'}
                      </code>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card.Body>
      </Card>

      <style dangerouslySetInnerHTML={{
        __html: `
        .dashboard-wrapper { background: #020617; min-height: 100vh; }
        .bg-panel { background-color: #0f172a; border: 1px solid rgba(255, 255, 255, 0.05) !important; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
        .dash-card { transition: transform 0.2s ease; }
        .dash-card:hover { transform: translateY(-4px); border: 1px solid rgba(14, 165, 233, 0.2) !important; }
        .card-accent-line { position: absolute; top: 0; left: 0; height: 3px; width: 100%; border-radius: 4px 4px 0 0; }
        
        .cyber-filter-select {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
          font-size: 0.82rem !important;
          border-radius: 8px !important;
        }

        .hover-border-cyan:hover {
          border-color: rgba(0, 242, 254, 0.4) !important;
        }

        .text-gradient { background: linear-gradient(90deg, #0ea5e9, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .size-2 { font-size: 2.5rem; letter-spacing: -1px; }
        .f-tracking-widest { letter-spacing: 2px !important; }
        .v-divider { width: 1px; height: 12px; background: rgba(255,255,255,0.1); }

        .icon-box { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .scada-static-dot { border-radius: 50%; display: inline-block; width: 6px; height: 6px; }
        
        .btn-scada-glow {
            background: #0ea5e9;
            border: none;
            color: #020617;
            padding: 10px 24px;
            border-radius: 12px;
            font-size: 0.72rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            box-shadow: 0 4px 20px rgba(14, 165, 233, 0.4);
            cursor: pointer;
        }

        .text-info-scada { color: #0ea5e9; }
        .fw-black { font-weight: 900 !important; }
        .fs-12 { font-size: 0.75rem !important; }
        .fs-11 { font-size: 0.85rem !important; }
        .cursor-pointer { cursor: pointer; }
        .transition-all { transition: all 0.2s ease; }
      `}} />
    </div>
  );
};

export default Dashboard;
