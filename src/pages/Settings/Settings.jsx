import React, { useState } from 'react';
import { Row, Col, Card, Form, Badge, Table, Modal, Button, Nav, Tab, ProgressBar } from 'react-bootstrap';
import {
  Settings as SettingsIcon,
  Shield,
  Save,
  RotateCcw,
  Building2,
  Layers,
  Box,
  Cpu,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Default Seed Entities if empty
const DEFAULT_SUBSCRIPTION = {
  planName: 'Enterprise Cloud',
  planTier: 'ENTERPRISE',
  maxDevices: 100,
  retentionDays: 90,
  status: 'ACTIVE',
  billingCycle: 'Annual',
  licenseKey: 'TB-ENT-9981-2026-X89'
};

const DEFAULT_BUILDINGS = [
  { id: 'bld-1', name: 'Sochiot Cyber Tower A', location: 'Industrial Zone Phase-1', city: 'Mumbai', floors: 12 },
  { id: 'bld-2', name: 'West Wing Processing Plant', location: 'Tech Park Sector 4', city: 'Pune', floors: 5 },
  { id: 'bld-3', name: 'South Logistics Hub', location: 'Freight Corridor', city: 'Bengaluru', floors: 3 }
];

const DEFAULT_ZONES = [
  { id: 'zn-1', name: 'Main Hydro Pump Room', buildingId: 'bld-1', type: 'PUMP_ROOM' },
  { id: 'zn-2', name: 'LT Switchgear Bay', buildingId: 'bld-1', type: 'ELECTRICAL' },
  { id: 'zn-3', name: 'HVAC Chiller Floor', buildingId: 'bld-2', type: 'HVAC' },
  { id: 'zn-4', name: 'DG Power Bay 1', buildingId: 'bld-2', type: 'POWER' },
  { id: 'zn-5', name: 'Roof Water Storage', buildingId: 'bld-3', type: 'WATER' }
];

const DEFAULT_ASSETS = [
  { id: 'ast-1', name: 'Hydro Booster Pump #1', zoneId: 'zn-1', type: 'PUMP', rating: '45 kW' },
  { id: 'ast-2', name: 'Underground Water Tank A', zoneId: 'zn-1', type: 'TANK', rating: '50,000 L' },
  { id: 'ast-3', name: 'Main LT Panel Breaker', zoneId: 'zn-2', type: 'LT_PANEL', rating: '1600 A' },
  { id: 'ast-4', name: 'DG Generator 500kVA', zoneId: 'zn-4', type: 'DG_SET', rating: '500 kVA' },
  { id: 'ast-5', name: 'Central Water Chiller #2', zoneId: 'zn-3', type: 'CHILLER', rating: '120 TR' }
];

const DEFAULT_DEVICES = [
  { id: 'dev-1', name: 'Pump Flow Meter FS-101', uuid: 'DEV-MQTT-PUMP-01', assetId: 'ast-1', protocol: 'MQTT', telemetryKeys: 'flow_rate, pressure, status', status: 'ONLINE' },
  { id: 'dev-2', name: 'Water Tank Level Radar', uuid: 'DEV-HTTP-TANK-02', assetId: 'ast-2', protocol: 'HTTP', telemetryKeys: 'level, volume, overflow_alarm', status: 'ONLINE' },
  { id: 'dev-3', name: 'LT Panel Multi-Meter', uuid: 'DEV-MODBUS-LT-03', assetId: 'ast-3', protocol: 'Modbus TCP', telemetryKeys: 'voltage, current, power_factor', status: 'ONLINE' },
  { id: 'dev-4', name: 'DG Engine Telemetry ECU', uuid: 'DEV-CAN-DG-04', assetId: 'ast-4', protocol: 'MQTT', telemetryKeys: 'rpm, oil_pressure, fuel_level', status: 'ONLINE' },
  { id: 'dev-5', name: 'Chiller Temp & Pressure Node', uuid: 'DEV-MQTT-HVAC-05', assetId: 'ast-5', protocol: 'MQTT', telemetryKeys: 'chilled_temp, psi, cop', status: 'OFFLINE' }
];

const createDefaultModules = () => ({
  Dashboard: true,
  'Water Management': true,
  Motors: true,
  'DG Set': true,
  'Setting Templates': true,
  'Alarm System': true,
  'LT Panel': true,
  Transformer: true,
  'Fire': true,
  Ticketing: true,
  Maintenance: true,
  'Service History': true,
  'Daily DPR': true,
  'Energy Metering': true,
  'VRV': true,
  'AQI Sensor': true,
  'HVAC': true,
  'AC': true
});

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subscription');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // ── ENTITY STATES ────────────────────────────────────────────────────────
  const [subscription, setSubscription] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_subscription_config');
      return saved ? JSON.parse(saved) : DEFAULT_SUBSCRIPTION;
    } catch { return DEFAULT_SUBSCRIPTION; }
  });

  const [buildings, setBuildings] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_buildings');
      return saved ? JSON.parse(saved) : DEFAULT_BUILDINGS;
    } catch { return DEFAULT_BUILDINGS; }
  });

  const [zones, setZones] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_zones');
      return saved ? JSON.parse(saved) : DEFAULT_ZONES;
    } catch { return DEFAULT_ZONES; }
  });

  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_assets');
      return saved ? JSON.parse(saved) : DEFAULT_ASSETS;
    } catch { return DEFAULT_ASSETS; }
  });

  const [devices, setDevices] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_devices');
      return saved ? JSON.parse(saved) : DEFAULT_DEVICES;
    } catch { return DEFAULT_DEVICES; }
  });

  const [modules, setModules] = useState(() => {
    try {
      const saved = localStorage.getItem('scada_modules_config');
      return saved ? JSON.parse(saved) : createDefaultModules();
    } catch { return createDefaultModules(); }
  });

  // ── MODAL STATES ────────────────────────────────────────────────────────
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [buildingForm, setBuildingForm] = useState({ id: '', name: '', location: '', city: '', floors: 1 });

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneForm, setZoneForm] = useState({ id: '', name: '', buildingId: '', type: 'PUMP_ROOM' });

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState({ id: '', name: '', zoneId: '', type: 'PUMP', rating: '' });

  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ id: '', name: '', uuid: '', assetId: '', protocol: 'MQTT', telemetryKeys: '', status: 'ONLINE' });

  // ── PERSIST ALL DATA ───────────────────────────────────────────────────
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      localStorage.setItem('tb_subscription_config', JSON.stringify(subscription));
      localStorage.setItem('tb_buildings', JSON.stringify(buildings));
      localStorage.setItem('tb_zones', JSON.stringify(zones));
      localStorage.setItem('tb_assets', JSON.stringify(assets));
      localStorage.setItem('tb_devices', JSON.stringify(devices));
      localStorage.setItem('scada_modules_config', JSON.stringify(modules));

      window.dispatchEvent(new Event('storage-update'));

      setSaveStatus('ThingsBoard Cloud Configuration & Entities Saved Successfully!');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveStatus('Error saving configurations.');
    } finally {
      setSaving(false);
    }
  };

  // ── RESET TO DEFAULT SEED ──────────────────────────────────────────────
  const handleResetDefaults = () => {
    setSubscription(DEFAULT_SUBSCRIPTION);
    setBuildings(DEFAULT_BUILDINGS);
    setZones(DEFAULT_ZONES);
    setAssets(DEFAULT_ASSETS);
    setDevices(DEFAULT_DEVICES);
    setModules(createDefaultModules());
    setSaveStatus('Entities reset to factory defaults (Click Save to Persist)');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // ── HANDLERS: BUILDINGS ────────────────────────────────────────────────
  const handleOpenBuildingModal = (bld = null) => {
    if (bld) {
      setBuildingForm(bld);
    } else {
      setBuildingForm({ id: `bld-${Date.now()}`, name: '', location: '', city: '', floors: 1 });
    }
    setShowBuildingModal(true);
  };

  const handleSaveBuilding = () => {
    if (!buildingForm.name) return;
    setBuildings(prev => {
      const exists = prev.some(b => b.id === buildingForm.id);
      if (exists) return prev.map(b => b.id === buildingForm.id ? buildingForm : b);
      return [...prev, buildingForm];
    });
    setShowBuildingModal(false);
  };

  const handleDeleteBuilding = (id) => {
    setBuildings(prev => prev.filter(b => b.id !== id));
  };

  // ── HANDLERS: ZONES ────────────────────────────────────────────────────
  const handleOpenZoneModal = (zn = null) => {
    if (zn) {
      setZoneForm(zn);
    } else {
      setZoneForm({ id: `zn-${Date.now()}`, name: '', buildingId: buildings[0]?.id || '', type: 'PUMP_ROOM' });
    }
    setShowZoneModal(true);
  };

  const handleSaveZone = () => {
    if (!zoneForm.name) return;
    setZones(prev => {
      const exists = prev.some(z => z.id === zoneForm.id);
      if (exists) return prev.map(z => z.id === zoneForm.id ? zoneForm : z);
      return [...prev, zoneForm];
    });
    setShowZoneModal(false);
  };

  const handleDeleteZone = (id) => {
    setZones(prev => prev.filter(z => z.id !== id));
  };

  // ── HANDLERS: ASSETS ───────────────────────────────────────────────────
  const handleOpenAssetModal = (ast = null) => {
    if (ast) {
      setAssetForm(ast);
    } else {
      setAssetForm({ id: `ast-${Date.now()}`, name: '', zoneId: zones[0]?.id || '', type: 'PUMP', rating: 'Normal' });
    }
    setShowAssetModal(true);
  };

  const handleSaveAsset = () => {
    if (!assetForm.name) return;
    setAssets(prev => {
      const exists = prev.some(a => a.id === assetForm.id);
      if (exists) return prev.map(a => a.id === assetForm.id ? assetForm : a);
      return [...prev, assetForm];
    });
    setShowAssetModal(false);
  };

  const handleDeleteAsset = (id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // ── HANDLERS: DEVICES ──────────────────────────────────────────────────
  const handleOpenDeviceModal = (dev = null) => {
    if (dev) {
      setDeviceForm(dev);
    } else {
      setDeviceForm({ id: `dev-${Date.now()}`, name: '', uuid: `DEV-${Math.floor(Math.random()*10000)}`, assetId: assets[0]?.id || '', protocol: 'MQTT', telemetryKeys: 'temperature, status', status: 'ONLINE' });
    }
    setShowDeviceModal(true);
  };

  const handleSaveDevice = () => {
    if (!deviceForm.name) return;
    setDevices(prev => {
      const exists = prev.some(d => d.id === deviceForm.id);
      if (exists) return prev.map(d => d.id === deviceForm.id ? deviceForm : d);
      return [...prev, deviceForm];
    });
    setShowDeviceModal(false);
  };

  const handleDeleteDevice = (id) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="fade-in p-3">
      {/* HEADER SECTION */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-20 px-3 py-1 fw-bold fs-11">
              THINGSBOARD CLOUD IOT ENGINE v4.2
            </Badge>
            <span className="text-slate-400 fs-11">System & IoT Entity Configurator</span>
          </div>
          <h2 className="mb-0 text-white fw-bold">System & Entity Management</h2>
        </div>

        <div className="d-flex gap-2 align-items-center flex-wrap">
          <Button variant="outline-info" size="sm" className="fw-bold fs-11 d-flex align-items-center gap-1 me-2" onClick={() => navigate('/settings/users')}>
            <UserCheck size={16} /> User & Hierarchy Settings
          </Button>

          {saveStatus && <Badge bg="success" className="d-flex align-items-center px-3 py-2 fade-in">{saveStatus}</Badge>}
          <button onClick={handleResetDefaults} className="btn-scada-outline d-flex align-items-center gap-2">
            <RotateCcw size={16} /> RESET DEFAULTS
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn btn-info rounded-pill px-4 fw-bold fs-11 shadow-lg d-flex align-items-center gap-2"
          >
            {saving ? <div className="spinner-border spinner-border-sm" /> : <Save size={16} />}
            SAVE & SYNC SYSTEM
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav className="cyber-nav-tabs mb-4 p-1 rounded-3 bg-dark-glass border-glass gap-2">
          <Nav.Item>
            <Nav.Link eventKey="subscription" className="cyber-tab-link d-flex align-items-center gap-2">
              <CreditCard size={17} /> <span>Subscription & Plan</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="buildings" className="cyber-tab-link d-flex align-items-center gap-2">
              <Building2 size={17} /> <span>Buildings & Sites ({buildings.length})</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="zones" className="cyber-tab-link d-flex align-items-center gap-2">
              <Layers size={17} /> <span>Zones & Rooms ({zones.length})</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="assets" className="cyber-tab-link d-flex align-items-center gap-2">
              <Box size={17} /> <span>Assets & Equipment ({assets.length})</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="devices" className="cyber-tab-link d-flex align-items-center gap-2">
              <Cpu size={17} /> <span>IoT Devices & Telemetry ({devices.length})</span>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="modules" className="cyber-tab-link d-flex align-items-center gap-2">
              <SettingsIcon size={17} /> <span>Application Modules</span>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* ── TAB 1: SUBSCRIPTION & TENANT PLAN ──────────────────────────── */}
          <Tab.Pane eventKey="subscription">
            <Row className="g-4">
              <Col lg={7}>
                <Card className="scada-card border-0 shadow-lg h-100" style={{ background: '#0f172a' }}>
                  <Card.Body className="p-4">
                    <h6 className="mb-4 d-flex align-items-center text-info fw-black uppercase tracking-widest fs-12">
                      <CreditCard size={18} className="me-2" /> Tenant Subscription Configuration
                    </h6>

                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fs-11 text-slate-300">Plan Tier</Form.Label>
                          <Form.Select
                            value={subscription.planTier}
                            onChange={(e) => {
                              const tier = e.target.value;
                              let maxDevs = 100;
                              if (tier === 'FREE') maxDevs = 10;
                              if (tier === 'PRO') maxDevs = 50;
                              if (tier === 'ENTERPRISE') maxDevs = 500;
                              setSubscription({ ...subscription, planTier: tier, maxDevices: maxDevs });
                            }}
                            className="cyber-input"
                          >
                            <option value="FREE">Free Trial (Max 10 Devices)</option>
                            <option value="PRO">Business Pro (Max 50 Devices)</option>
                            <option value="ENTERPRISE">Enterprise Cloud (Max 500 Devices)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fs-11 text-slate-300">Subscription Status</Form.Label>
                          <Form.Select
                            value={subscription.status}
                            onChange={(e) => setSubscription({ ...subscription, status: e.target.value })}
                            className="cyber-input"
                          >
                            <option value="ACTIVE">ACTIVE (Fully Operational)</option>
                            <option value="TRIAL">TRIAL (14 Days Remaining)</option>
                            <option value="EXPIRED">EXPIRED (Suspended)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fs-11 text-slate-300">Max Provisioned Device Quota</Form.Label>
                          <Form.Control
                            type="number"
                            value={subscription.maxDevices}
                            onChange={(e) => setSubscription({ ...subscription, maxDevices: Number(e.target.value) })}
                            className="cyber-input"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fs-11 text-slate-300">Telemetry Data Retention (Days)</Form.Label>
                          <Form.Control
                            type="number"
                            value={subscription.retentionDays}
                            onChange={(e) => setSubscription({ ...subscription, retentionDays: Number(e.target.value) })}
                            className="cyber-input"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fs-11 text-slate-300">Subscription License Key</Form.Label>
                          <Form.Control
                            type="text"
                            value={subscription.licenseKey}
                            onChange={(e) => setSubscription({ ...subscription, licenseKey: e.target.value })}
                            className="cyber-input font-monospace"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={5}>
                <Card className="scada-card border-0 shadow-lg h-100" style={{ background: '#09101d' }}>
                  <Card.Body className="p-4 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <Badge bg="info" className="fs-11 px-3 py-2 uppercase fw-black">{subscription.planTier} TIER</Badge>
                        <Badge bg={subscription.status === 'ACTIVE' ? 'success' : 'danger'} className="fs-11 px-3 py-2 uppercase fw-black">
                          {subscription.status}
                        </Badge>
                      </div>

                      <h4 className="text-white fw-bold mb-2">{subscription.planName || 'ThingsBoard Cloud Subscription'}</h4>
                      <p className="text-slate-400 fs-12 mb-4">
                        Multi-tenant cloud HMI instance with edge gateway routing, sub-millisecond RPC control, and high-frequency telemetry storage.
                      </p>

                      <div className="p-3 bg-black bg-opacity-40 rounded-3 border border-white border-opacity-5 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1 fs-12">
                          <span className="text-slate-300">Device Quota Usage</span>
                          <span className="text-cyan-exact fw-bold">{devices.length} / {subscription.maxDevices} Devices</span>
                        </div>
                        <ProgressBar
                          now={(devices.length / subscription.maxDevices) * 100}
                          variant={devices.length >= subscription.maxDevices ? 'danger' : 'info'}
                          style={{ height: 8 }}
                          className="rounded-pill bg-dark"
                        />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          {/* ── TAB 2: BUILDINGS & SITES ───────────────────────────────────── */}
          <Tab.Pane eventKey="buildings">
            <Card className="scada-card border-0 shadow-lg" style={{ background: '#0f172a' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h6 className="mb-1 text-info fw-black uppercase tracking-widest fs-12 d-flex align-items-center gap-2">
                      <Building2 size={18} /> Buildings & Facility Sites
                    </h6>
                    <small className="text-slate-400 fs-11">Configure physical infrastructure facilities and sites</small>
                  </div>
                  <Button variant="info" size="sm" className="fw-bold fs-11 rounded-pill px-3" onClick={() => handleOpenBuildingModal()}>
                    <Plus size={14} className="me-1" /> Add Building
                  </Button>
                </div>

                <Table borderless responsive className="scada-table mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Building Name</th>
                      <th>Location / Area</th>
                      <th>City</th>
                      <th>Total Floors</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((bld) => (
                      <tr key={bld.id}>
                        <td className="fw-bold text-white fs-12 d-flex align-items-center gap-2">
                          <Building2 size={16} className="text-cyan-exact" />
                          <span>{bld.name}</span>
                        </td>
                        <td className="text-slate-300 fs-12">{bld.location || 'N/A'}</td>
                        <td className="text-slate-300 fs-12">{bld.city || 'N/A'}</td>
                        <td><Badge bg="dark" className="border border-secondary text-info fs-11">{bld.floors} Floors</Badge></td>
                        <td className="text-end">
                          <Button variant="link" className="text-info p-1 me-2" onClick={() => handleOpenBuildingModal(bld)}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="link" className="text-danger p-1" onClick={() => handleDeleteBuilding(bld.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {buildings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-400 py-4">No buildings configured yet. Click "Add Building" to create one.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* ── TAB 3: ZONES & ROOMS ──────────────────────────────────────── */}
          <Tab.Pane eventKey="zones">
            <Card className="scada-card border-0 shadow-lg" style={{ background: '#0f172a' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h6 className="mb-1 text-info fw-black uppercase tracking-widest fs-12 d-flex align-items-center gap-2">
                      <Layers size={18} /> Zones & Functional Rooms
                    </h6>
                    <small className="text-slate-400 fs-11">Assign operational zones and rooms under buildings</small>
                  </div>
                  <Button variant="info" size="sm" className="fw-bold fs-11 rounded-pill px-3" onClick={() => handleOpenZoneModal()}>
                    <Plus size={14} className="me-1" /> Add Zone
                  </Button>
                </div>

                <Table borderless responsive className="scada-table mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Zone / Room Name</th>
                      <th>Parent Building</th>
                      <th>Zone Category</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((zn) => {
                      const parentBld = buildings.find(b => b.id === zn.buildingId);
                      return (
                        <tr key={zn.id}>
                          <td className="fw-bold text-white fs-12 d-flex align-items-center gap-2">
                            <Layers size={16} className="text-info" />
                            <span>{zn.name}</span>
                          </td>
                          <td className="text-slate-300 fs-12">{parentBld ? parentBld.name : 'Unassigned'}</td>
                          <td><Badge bg="info" className="bg-opacity-20 text-info border border-info border-opacity-30 fs-11">{zn.type}</Badge></td>
                          <td className="text-end">
                            <Button variant="link" className="text-info p-1 me-2" onClick={() => handleOpenZoneModal(zn)}>
                              <Edit size={16} />
                            </Button>
                            <Button variant="link" className="text-danger p-1" onClick={() => handleDeleteZone(zn.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {zones.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-slate-400 py-4">No zones configured. Add a building first then add zones.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* ── TAB 4: ASSETS & EQUIPMENT ─────────────────────────────────── */}
          <Tab.Pane eventKey="assets">
            <Card className="scada-card border-0 shadow-lg" style={{ background: '#0f172a' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h6 className="mb-1 text-info fw-black uppercase tracking-widest fs-12 d-flex align-items-center gap-2">
                      <Box size={18} /> Assets & Industrial Equipment
                    </h6>
                    <small className="text-slate-400 fs-11">Register physical machinery, pumps, panels, and tanks</small>
                  </div>
                  <Button variant="info" size="sm" className="fw-bold fs-11 rounded-pill px-3" onClick={() => handleOpenAssetModal()}>
                    <Plus size={14} className="me-1" /> Add Asset
                  </Button>
                </div>

                <Table borderless responsive className="scada-table mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Asset Name</th>
                      <th>Assigned Zone</th>
                      <th>Asset Type</th>
                      <th>Capacity / Rating</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((ast) => {
                      const parentZone = zones.find(z => z.id === ast.zoneId);
                      return (
                        <tr key={ast.id}>
                          <td className="fw-bold text-white fs-12 d-flex align-items-center gap-2">
                            <Box size={16} className="text-warning" />
                            <span>{ast.name}</span>
                          </td>
                          <td className="text-slate-300 fs-12">{parentZone ? parentZone.name : 'Unassigned'}</td>
                          <td><Badge bg="warning" className="bg-opacity-20 text-warning border border-warning border-opacity-30 fs-11">{ast.type}</Badge></td>
                          <td className="text-slate-300 fs-12">{ast.rating || 'N/A'}</td>
                          <td className="text-end">
                            <Button variant="link" className="text-info p-1 me-2" onClick={() => handleOpenAssetModal(ast)}>
                              <Edit size={16} />
                            </Button>
                            <Button variant="link" className="text-danger p-1" onClick={() => handleDeleteAsset(ast.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {assets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-400 py-4">No assets configured. Add zones first then add assets.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* ── TAB 5: IOT DEVICES & TELEMETRY ────────────────────────────── */}
          <Tab.Pane eventKey="devices">
            <Card className="scada-card border-0 shadow-lg" style={{ background: '#0f172a' }}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h6 className="mb-1 text-info fw-black uppercase tracking-widest fs-12 d-flex align-items-center gap-2">
                      <Cpu size={18} /> Provisioned IoT Devices & Sensors
                    </h6>
                    <small className="text-slate-400 fs-11">Configure edge hardware gateways, telemetry keys, and protocols</small>
                  </div>
                  <Button variant="info" size="sm" className="fw-bold fs-11 rounded-pill px-3" onClick={() => handleOpenDeviceModal()}>
                    <Plus size={14} className="me-1" /> Add Device
                  </Button>
                </div>

                <Table borderless responsive className="scada-table mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Device Name</th>
                      <th>Device UUID / EUI</th>
                      <th>Target Asset</th>
                      <th>Protocol</th>
                      <th>Telemetry Keys</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((dev) => {
                      const targetAsset = assets.find(a => a.id === dev.assetId);
                      return (
                        <tr key={dev.id}>
                          <td className="fw-bold text-white fs-12 d-flex align-items-center gap-2">
                            <Cpu size={16} className="text-cyan-exact" />
                            <span>{dev.name}</span>
                          </td>
                          <td className="font-monospace text-slate-300 fs-11">{dev.uuid}</td>
                          <td className="text-slate-300 fs-12">{targetAsset ? targetAsset.name : 'Unassigned'}</td>
                          <td><Badge bg="dark" className="border border-info text-info fs-11">{dev.protocol}</Badge></td>
                          <td className="font-monospace text-slate-400 fs-11 max-w-xs">{dev.telemetryKeys}</td>
                          <td>
                            <Badge bg={dev.status === 'ONLINE' ? 'success' : 'danger'} className="fs-10 px-2 py-1 uppercase fw-bold">
                              {dev.status}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Button variant="link" className="text-info p-1 me-2" onClick={() => handleOpenDeviceModal(dev)}>
                              <Edit size={16} />
                            </Button>
                            <Button variant="link" className="text-danger p-1" onClick={() => handleDeleteDevice(dev.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {devices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center text-slate-400 py-4">No IoT devices provisioned yet. Click "Add Device" to provision one.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* ── TAB 6: APPLICATION MODULES ───────────────────────────────── */}
          <Tab.Pane eventKey="modules">
            <Card className="scada-card border-0 shadow-lg" style={{ background: '#0f172a' }}>
              <Card.Body className="p-4">
                <h6 className="mb-4 d-flex align-items-center text-info fw-black uppercase tracking-widest fs-12">
                  <Shield size={18} className="me-2" /> Application Module Enable/Disable Controls
                </h6>

                <Row className="g-3">
                  {Object.keys(modules).map((name) => (
                    <Col key={name} md={6} lg={4} xl={3}>
                      <div
                        className={`d-flex justify-content-between align-items-center h-100 p-3 rounded-4 border transition-all ${
                          modules[name]
                            ? 'border-info border-opacity-10 bg-black bg-opacity-40'
                            : 'border-secondary border-opacity-5 bg-dark bg-opacity-10 opacity-40'
                        }`}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className={`p-2 rounded-circle ${modules[name] ? 'bg-info text-dark' : 'bg-secondary text-white opacity-10'}`}>
                            <SettingsIcon size={14} />
                          </div>
                          <span className={`fw-bold fs-11 ${modules[name] ? 'text-white' : 'text-muted'}`}>{name}</span>
                        </div>
                        <Form.Check
                          type="switch"
                          id={`switch-${name}`}
                          checked={modules[name]}
                          onChange={() => setModules({ ...modules, [name]: !modules[name] })}
                          className="scada-switch custom-switch-large"
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* ── BUILDING MODAL ────────────────────────────────────────────────── */}
      <Modal show={showBuildingModal} onHide={() => setShowBuildingModal(false)} centered className="compact-tenant-modal">
        <Modal.Header closeButton className="bg-dark-glass text-white py-2 px-3 border-secondary">
          <Modal.Title className="fs-15 fw-bold d-flex align-items-center gap-2">
            <Building2 size={18} className="text-cyan-exact" /> Add / Edit Building Site
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-cyber-dark text-white p-3">
          <Form.Group className="mb-3">
            <Form.Label className="fs-11 text-slate-300">Building Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Cyber Tower A"
              value={buildingForm.name}
              onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
              className="cyber-modal-input-compact"
            />
          </Form.Group>
          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label className="fs-11 text-slate-300">Location / Area</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Sector 5"
                value={buildingForm.location}
                onChange={(e) => setBuildingForm({ ...buildingForm, location: e.target.value })}
                className="cyber-modal-input-compact"
              />
            </Col>
            <Col md={6}>
              <Form.Label className="fs-11 text-slate-300">City</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Mumbai"
                value={buildingForm.city}
                onChange={(e) => setBuildingForm({ ...buildingForm, city: e.target.value })}
                className="cyber-modal-input-compact"
              />
            </Col>
          </Row>
          <Form.Group>
            <Form.Label className="fs-11 text-slate-300">Total Floors</Form.Label>
            <Form.Control
              type="number"
              value={buildingForm.floors}
              onChange={(e) => setBuildingForm({ ...buildingForm, floors: Number(e.target.value) })}
              className="cyber-modal-input-compact"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-dark-glass py-2 px-3 border-secondary">
          <Button variant="secondary" size="sm" onClick={() => setShowBuildingModal(false)}>Cancel</Button>
          <Button variant="info" size="sm" className="fw-bold px-3 text-dark" onClick={handleSaveBuilding}>Save Building</Button>
        </Modal.Footer>
      </Modal>

      {/* ── ZONE MODAL ────────────────────────────────────────────────────── */}
      <Modal show={showZoneModal} onHide={() => setShowZoneModal(false)} centered className="compact-tenant-modal">
        <Modal.Header closeButton className="bg-dark-glass text-white py-2 px-3 border-secondary">
          <Modal.Title className="fs-15 fw-bold d-flex align-items-center gap-2">
            <Layers size={18} className="text-cyan-exact" /> Add / Edit Operational Zone
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-cyber-dark text-white p-3">
          <Form.Group className="mb-3">
            <Form.Label className="fs-11 text-slate-300">Zone / Room Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Main Hydro Pump Room"
              value={zoneForm.name}
              onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
              className="cyber-modal-input-compact"
            />
          </Form.Group>
          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label className="fs-11 text-slate-300">Parent Building</Form.Label>
              <Form.Select
                value={zoneForm.buildingId}
                onChange={(e) => setZoneForm({ ...zoneForm, buildingId: e.target.value })}
                className="cyber-modal-input-compact"
              >
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label className="fs-11 text-slate-300">Zone Category</Form.Label>
              <Form.Select
                value={zoneForm.type}
                onChange={(e) => setZoneForm({ ...zoneForm, type: e.target.value })}
                className="cyber-modal-input-compact"
              >
                <option value="PUMP_ROOM">Pump Room</option>
                <option value="ELECTRICAL">Electrical Switchgear</option>
                <option value="HVAC">HVAC & Chiller</option>
                <option value="POWER">Generator / DG Set</option>
                <option value="WATER">Water Storage / Tanks</option>
                <option value="GENERAL">General Zone</option>
              </Form.Select>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-dark-glass py-2 px-3 border-secondary">
          <Button variant="secondary" size="sm" onClick={() => setShowZoneModal(false)}>Cancel</Button>
          <Button variant="info" size="sm" className="fw-bold px-3 text-dark" onClick={handleSaveZone}>Save Zone</Button>
        </Modal.Footer>
      </Modal>

      {/* ── ASSET MODAL ───────────────────────────────────────────────────── */}
      <Modal show={showAssetModal} onHide={() => setShowAssetModal(false)} centered className="compact-tenant-modal">
        <Modal.Header closeButton className="bg-dark-glass text-white py-2 px-3 border-secondary">
          <Modal.Title className="fs-15 fw-bold d-flex align-items-center gap-2">
            <Box size={18} className="text-warning" /> Add / Edit Asset Equipment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-cyber-dark text-white p-3">
          <Form.Group className="mb-3">
            <Form.Label className="fs-11 text-slate-300">Asset Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Hydro Booster Pump #1"
              value={assetForm.name}
              onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
              className="cyber-modal-input-compact"
            />
          </Form.Group>
          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label className="fs-11 text-slate-300">Assigned Zone</Form.Label>
              <Form.Select
                value={assetForm.zoneId}
                onChange={(e) => setAssetForm({ ...assetForm, zoneId: e.target.value })}
                className="cyber-modal-input-compact"
              >
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label className="fs-11 text-slate-300">Asset Type</Form.Label>
              <Form.Select
                value={assetForm.type}
                onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                className="cyber-modal-input-compact"
              >
                <option value="PUMP">Pump / Motor</option>
                <option value="TANK">Water Tank</option>
                <option value="DG_SET">DG Generator</option>
                <option value="LT_PANEL">LT Panel / Breaker</option>
                <option value="CHILLER">Chiller Plant</option>
                <option value="TRANSFORMER">Transformer</option>
                <option value="SENSOR">Environmental Sensor</option>
              </Form.Select>
            </Col>
          </Row>
          <Form.Group>
            <Form.Label className="fs-11 text-slate-300">Capacity / Rating</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. 45 kW / 1600 A"
              value={assetForm.rating}
              onChange={(e) => setAssetForm({ ...assetForm, rating: e.target.value })}
              className="cyber-modal-input-compact"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-dark-glass py-2 px-3 border-secondary">
          <Button variant="secondary" size="sm" onClick={() => setShowAssetModal(false)}>Cancel</Button>
          <Button variant="info" size="sm" className="fw-bold px-3 text-dark" onClick={handleSaveAsset}>Save Asset</Button>
        </Modal.Footer>
      </Modal>

      {/* ── DEVICE MODAL ──────────────────────────────────────────────────── */}
      <Modal show={showDeviceModal} onHide={() => setShowDeviceModal(false)} centered className="compact-tenant-modal">
        <Modal.Header closeButton className="bg-dark-glass text-white py-2 px-3 border-secondary">
          <Modal.Title className="fs-15 fw-bold d-flex align-items-center gap-2">
            <Cpu size={18} className="text-cyan-exact" /> Provision IoT Device / Gateway
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-cyber-dark text-white p-3">
          <Form.Group className="mb-3">
            <Form.Label className="fs-11 text-slate-300">Device Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Pump Flow Meter FS-101"
              value={deviceForm.name}
              onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
              className="cyber-modal-input-compact"
            />
          </Form.Group>
          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label className="fs-11 text-slate-300">Device EUI / UUID</Form.Label>
              <Form.Control
                type="text"
                placeholder="DEV-MQTT-1001"
                value={deviceForm.uuid}
                onChange={(e) => setDeviceForm({ ...deviceForm, uuid: e.target.value })}
                className="cyber-modal-input-compact font-monospace"
              />
            </Col>
            <Col md={6}>
              <Form.Label className="fs-11 text-slate-300">Target Asset</Form.Label>
              <Form.Select
                value={deviceForm.assetId}
                onChange={(e) => setDeviceForm({ ...deviceForm, assetId: e.target.value })}
                className="cyber-modal-input-compact"
              >
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Form.Select>
            </Col>
          </Row>
          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label className="fs-11 text-slate-300">Protocol</Form.Label>
              <Form.Select
                value={deviceForm.protocol}
                onChange={(e) => setDeviceForm({ ...deviceForm, protocol: e.target.value })}
                className="cyber-modal-input-compact"
              >
                <option value="MQTT">MQTT Broker</option>
                <option value="HTTP">HTTP REST API</option>
                <option value="Modbus TCP">Modbus TCP</option>
                <option value="CoAP">CoAP</option>
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label className="fs-11 text-slate-300">Status</Form.Label>
              <Form.Select
                value={deviceForm.status}
                onChange={(e) => setDeviceForm({ ...deviceForm, status: e.target.value })}
                className="cyber-modal-input-compact"
              >
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </Form.Select>
            </Col>
          </Row>
          <Form.Group>
            <Form.Label className="fs-11 text-slate-300">Telemetry Keys (Comma Separated)</Form.Label>
            <Form.Control
              type="text"
              placeholder="flow_rate, pressure, status, voltage"
              value={deviceForm.telemetryKeys}
              onChange={(e) => setDeviceForm({ ...deviceForm, telemetryKeys: e.target.value })}
              className="cyber-modal-input-compact font-monospace"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-dark-glass py-2 px-3 border-secondary">
          <Button variant="secondary" size="sm" onClick={() => setShowDeviceModal(false)}>Cancel</Button>
          <Button variant="info" size="sm" className="fw-bold px-3 text-dark" onClick={handleSaveDevice}>Provision Device</Button>
        </Modal.Footer>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        /* HIGH CONTRAST MODAL STYLES */
        .compact-tenant-modal .modal-content {
            background: #0f172a !important;
            border: 1px solid rgba(0, 242, 254, 0.3) !important;
            color: #f8fafc !important;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9) !important;
            border-radius: 16px !important;
            overflow: hidden;
        }
        .compact-tenant-modal .modal-header {
            background: #09101d !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
        }
        .compact-tenant-modal .modal-title {
            color: #00f2fe !important;
            font-weight: 800 !important;
            font-size: 1.05rem !important;
        }
        .compact-tenant-modal .btn-close {
            filter: invert(1) grayscale(100%) brightness(200%) !important;
        }
        .compact-tenant-modal .modal-body {
            background: #0f172a !important;
            color: #f8fafc !important;
        }
        .compact-tenant-modal .modal-footer {
            background: #09101d !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .compact-tenant-modal .form-label {
            color: #e2e8f0 !important;
            font-weight: 700 !important;
            font-size: 0.82rem !important;
            margin-bottom: 4px !important;
        }
        .cyber-modal-input-compact {
            background: #020617 !important;
            border: 1px solid #334155 !important;
            color: #ffffff !important;
            font-size: 0.85rem !important;
            padding: 8px 12px !important;
            border-radius: 8px !important;
        }
        .cyber-modal-input-compact::placeholder {
            color: #94a3b8 !important;
        }
        .cyber-modal-input-compact:focus {
            border-color: #00f2fe !important;
            box-shadow: 0 0 10px rgba(0, 242, 254, 0.3) !important;
            color: #ffffff !important;
        }

        /* HIGH CONTRAST BADGES */
        .badge.bg-info, .badge.bg-cyan {
            background-color: rgba(0, 242, 254, 0.15) !important;
            color: #00f2fe !important;
            border: 1px solid rgba(0, 242, 254, 0.4) !important;
            font-weight: 800 !important;
        }
        .badge.bg-success {
            background-color: rgba(34, 197, 94, 0.15) !important;
            color: #22c55e !important;
            border: 1px solid rgba(34, 197, 94, 0.4) !important;
            font-weight: 800 !important;
        }
        .badge.bg-warning {
            background-color: rgba(245, 158, 11, 0.15) !important;
            color: #fbbf24 !important;
            border: 1px solid rgba(245, 158, 11, 0.4) !important;
            font-weight: 800 !important;
        }
        .badge.bg-primary {
            background-color: rgba(59, 130, 246, 0.15) !important;
            color: #60a5fa !important;
            border: 1px solid rgba(59, 130, 246, 0.4) !important;
            font-weight: 800 !important;
        }
        .badge.bg-danger {
            background-color: rgba(239, 68, 68, 0.15) !important;
            color: #f87171 !important;
            border: 1px solid rgba(239, 68, 68, 0.4) !important;
            font-weight: 800 !important;
        }
        .scada-table thead th { 
            background: rgba(0, 0, 0, 0.3); 
            color: #94a3b8 !important;
            font-size: 0.7rem; 
            text-transform: uppercase; 
            letter-spacing: 1.5px; 
            font-weight: 800;
            padding: 14px;
        }
        .scada-table tbody td { 
            padding: 14px; 
            border-bottom: 1px solid rgba(255, 255, 255, 0.04); 
            color: #ffffff !important;
        }
        .cyber-nav-tabs .nav-link {
          color: #94a3b8;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .cyber-nav-tabs .nav-link.active {
          color: #00f2fe;
          background: rgba(0, 242, 254, 0.1);
          border-color: rgba(0, 242, 254, 0.3);
        }
        .cyber-input {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          color: #ffffff !important;
          font-size: 0.85rem !important;
          border-radius: 8px !important;
        }
        .btn-scada-outline {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          transition: all 0.3s;
        }
      `}} />
    </div>
  );
};

export default Settings;
