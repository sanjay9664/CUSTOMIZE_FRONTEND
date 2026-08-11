import React, { useState } from 'react';
import { Row, Col, Card, Badge, Button, Form, Modal, Table } from 'react-bootstrap';
import {
  Users, Building2, Layers, MapPin, UserCheck, ShieldCheck,
  Plus, Trash2, Edit, Check, ArrowRight, ChevronRight, Key, Sparkles,
  Zap, Eye, Bell, Settings as SettingsIcon, Crown, User, Lock, Mail, CheckSquare,
  ChevronDown, Folder, FolderOpen, CheckCircle, XCircle, Globe, Shield
} from 'lucide-react';

const ALL_SCADA_MODULES = [
  'Dashboard', 'Water Management', 'Motors', 'DG Set', 'Alarm System',
  'LT Panel', 'Transformer', 'Fire', 'Ticketing', 'Maintenance',
  'Service History', 'Daily DPR', 'Energy Metering', 'VRV', 'AQI Sensor',
  'HVAC', 'AC', 'Setting Templates'
];

const DEFAULT_COMPANIES = [
  {
    id: 'cmp-1',
    name: 'Sochiot Enterprise Corp',
    code: 'SOCHIOT_CORP',
    email: 'sa@ismartaccess.com',
    password: 'password123',
    status: 'ACTIVE',
    allowedModules: ALL_SCADA_MODULES,
    createdBy: 'SuperAdmin'
  },
  {
    id: 'cmp-2',
    name: 'Tata Group Corporation',
    code: 'TATA_GROUP',
    email: 'superadmin@tata.com',
    password: 'password123',
    status: 'ACTIVE',
    allowedModules: ALL_SCADA_MODULES,
    createdBy: 'SuperAdmin'
  }
];

const DEFAULT_ORGS = [
  { id: 'org-1', companyId: 'cmp-1', name: 'Tata Industrial Corp', code: 'TATA_IND', email: 'admin@tata.com', password: 'password123', allowedModules: ALL_SCADA_MODULES, createdBy: 'CompanyAdmin' },
  { id: 'org-2', companyId: 'cmp-1', name: 'Siemens Energy Ltd', code: 'SIEMENS_ENG', email: 'admin@siemens.com', password: 'password123', allowedModules: ['Dashboard', 'Motors', 'DG Set', 'Energy Metering'], createdBy: 'CompanyAdmin' },
  { id: 'org-3', companyId: 'cmp-1', name: 'Sochiot Smart Organization', code: 'SOCHIOT', email: 'sochiot@gmail.com', password: 'sochiot123', allowedModules: ['Water Management', 'Dashboard', 'AC'], createdBy: 'CompanyAdmin' }
];

const DEFAULT_ZONES = [
  { id: 'hzn-1', orgId: 'org-1', name: 'North Power Zone', email: 'zone.north@tata.com', password: 'password123', allowedModules: ALL_SCADA_MODULES, createdBy: 'OrgAdmin' },
  { id: 'hzn-2', orgId: 'org-1', name: 'South Water Zone', email: 'zone.south@tata.com', password: 'password123', allowedModules: ['Dashboard', 'Water Management', 'Alarm System'], createdBy: 'OrgAdmin' }
];

const DEFAULT_AREAS = [
  { id: 'ar-1', zoneId: 'hzn-1', name: 'Hot Rolling Mill Area', email: 'area.mill@tata.com', password: 'password123', allowedModules: ALL_SCADA_MODULES, createdBy: 'ZoneLead' },
  { id: 'ar-2', zoneId: 'hzn-2', name: 'Filtration Plant Area', email: 'area.filter@tata.com', password: 'password123', allowedModules: ['Water Management'], createdBy: 'ZoneLead' }
];

const DEFAULT_LOCATIONS = [
  { id: 'loc-1', areaId: 'ar-1', name: 'Substation 04 Bay', city: 'Jamshedpur', email: 'loc.sub04@tata.com', password: 'password123', allowedModules: ALL_SCADA_MODULES, createdBy: 'AreaManager' },
  { id: 'loc-2', areaId: 'ar-2', name: 'Pump Room Bravo', city: 'Pune', email: 'loc.pump@tata.com', password: 'password123', allowedModules: ['Water Management', 'Motors'], createdBy: 'AreaManager' }
];

const DEFAULT_UNIT_HEADS = [
  { id: 'uh-1', locationId: 'loc-1', name: 'Rajesh Kumar', email: 'rajesh.k@tata.com', password: 'password123', allowedModules: ALL_SCADA_MODULES, createdBy: 'LocationAdmin' },
  { id: 'uh-2', locationId: 'loc-2', name: 'Priya Sharma', email: 'priya.s@siemens.com', password: 'password123', allowedModules: ['Water Management', 'Motors'], createdBy: 'LocationAdmin' }
];

const DEFAULT_OPERATORS = [
  {
    id: 'op-1',
    unitHeadId: 'uh-1',
    name: 'Amit Singh',
    email: 'amit.op@tata.com',
    password: 'password123',
    allowedModules: ['Dashboard', 'Water Management', 'Motors', 'Alarm System'],
    permissions: ['VIEW_TELEMETRY', 'MOTOR_CONTROL', 'ALARM_ACK'],
    createdBy: 'UnitHead'
  }
];

const UserSettings = () => {
  const [step, setStep] = useState(1);
  const [saveMsg, setSaveMsg] = useState('');
  const [expandedCompanies, setExpandedCompanies] = useState({ 'cmp-1': true, 'cmp-2': false });
  const [expandedOrgs, setExpandedOrgs] = useState({ 'org-1': true, 'org-2': false, 'org-3': false });

  // ── ENTITY STORAGE ──────────────────────────────────────────────────────
  const [companies, setCompanies] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_companies');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANIES;
    } catch { return DEFAULT_COMPANIES; }
  });

  const [orgs, setOrgs] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_organizations');
      return saved ? JSON.parse(saved) : DEFAULT_ORGS;
    } catch { return DEFAULT_ORGS; }
  });

  const [zones, setZones] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_hierarchy_zones');
      return saved ? JSON.parse(saved) : DEFAULT_ZONES;
    } catch { return DEFAULT_ZONES; }
  });

  const [areas, setAreas] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_areas');
      return saved ? JSON.parse(saved) : DEFAULT_AREAS;
    } catch { return DEFAULT_AREAS; }
  });

  const [locations, setLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_locations');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS;
    } catch { return DEFAULT_LOCATIONS; }
  });

  const [unitHeads, setUnitHeads] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_unit_heads');
      return saved ? JSON.parse(saved) : DEFAULT_UNIT_HEADS;
    } catch { return DEFAULT_UNIT_HEADS; }
  });

  const [operators, setOperators] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_operators');
      return saved ? JSON.parse(saved) : DEFAULT_OPERATORS;
    } catch { return DEFAULT_OPERATORS; }
  });

  // Selected parent pointers
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => companies[0]?.id || '');
  const [selectedOrgId, setSelectedOrgId] = useState(() => orgs[0]?.id || '');
  const [selectedZoneId, setSelectedZoneId] = useState(() => zones[0]?.id || '');
  const [selectedAreaId, setSelectedAreaId] = useState(() => areas[0]?.id || '');
  const [selectedLocId, setSelectedLocId] = useState(() => locations[0]?.id || '');
  const [selectedUhId, setSelectedUhId] = useState(() => unitHeads[0]?.id || '');

  // ── FORM & MODAL STATES WITH EDIT SUPPORT ──────────────────────────────
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyForm, setCompanyForm] = useState({ id: '', name: '', code: '', email: '', password: '', status: 'ACTIVE', allowedModules: ALL_SCADA_MODULES });

  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgForm, setOrgForm] = useState({ id: '', companyId: '', name: '', code: '', email: '', password: '', allowedModules: ALL_SCADA_MODULES });

  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneForm, setZoneForm] = useState({ id: '', orgId: '', name: '', email: '', password: '', allowedModules: ALL_SCADA_MODULES });

  const [showAreaModal, setShowAreaModal] = useState(false);
  const [areaForm, setAreaForm] = useState({ id: '', zoneId: '', name: '', email: '', password: '', allowedModules: ALL_SCADA_MODULES });

  const [showLocModal, setShowLocModal] = useState(false);
  const [locForm, setLocForm] = useState({ id: '', areaId: '', name: '', city: '', email: '', password: '', allowedModules: ALL_SCADA_MODULES });

  const [showUhModal, setShowUhModal] = useState(false);
  const [uhForm, setUhForm] = useState({ id: '', locationId: '', name: '', email: '', password: '', allowedModules: ALL_SCADA_MODULES });

  const [showOpModal, setShowOpModal] = useState(false);
  const [opForm, setOpForm] = useState({
    id: '',
    unitHeadId: '',
    name: '',
    email: '',
    password: '',
    allowedModules: ['Dashboard', 'Water Management', 'Motors', 'Alarm System'],
    permissions: ['VIEW_TELEMETRY', 'MOTOR_CONTROL', 'ALARM_ACK']
  });

  const toggleCompanyTree = (cmpId) => {
    setExpandedCompanies(prev => ({ ...prev, [cmpId]: !prev[cmpId] }));
  };

  const toggleOrgTree = (orgId) => {
    setExpandedOrgs(prev => ({ ...prev, [orgId]: !prev[orgId] }));
  };

  // Save changes to localStorage & trigger live update
  const persistChanges = (newCompanies, newOrgs, newZones, newAreas, newLocs, newUhs, newOps) => {
    localStorage.setItem('tb_companies', JSON.stringify(newCompanies));
    localStorage.setItem('tb_organizations', JSON.stringify(newOrgs));
    localStorage.setItem('tb_hierarchy_zones', JSON.stringify(newZones));
    localStorage.setItem('tb_areas', JSON.stringify(newAreas));
    localStorage.setItem('tb_locations', JSON.stringify(newLocs));
    localStorage.setItem('tb_unit_heads', JSON.stringify(newUhs));
    localStorage.setItem('tb_operators', JSON.stringify(newOps));
    window.dispatchEvent(new Event('storage-update'));

    setSaveMsg('Saved & Synced!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  // Helper toggle module
  const toggleModuleInForm = (modName, formObj, setFormObj) => {
    const list = formObj.allowedModules || [];
    if (list.includes(modName)) {
      setFormObj({ ...formObj, allowedModules: list.filter(m => m !== modName) });
    } else {
      setFormObj({ ...formObj, allowedModules: [...list, modName] });
    }
  };

  const enableAllModules = (formObj, setFormObj) => {
    setFormObj({ ...formObj, allowedModules: ALL_SCADA_MODULES });
  };

  const disableAllModules = (formObj, setFormObj) => {
    setFormObj({ ...formObj, allowedModules: [] });
  };

  // ── SAVE / UPDATE HANDLERS ──────────────────────────────────────────────
  const handleSaveCompany = () => {
    if (!companyForm.name) return;
    const exists = companies.some(c => c.id === companyForm.id);
    let updated;
    if (exists) {
      updated = companies.map(c => c.id === companyForm.id ? companyForm : c);
    } else {
      const newCmp = { ...companyForm, id: `cmp-${Date.now()}`, createdBy: 'SuperAdmin' };
      updated = [...companies, newCmp];
    }
    setCompanies(updated);
    persistChanges(updated, orgs, zones, areas, locations, unitHeads, operators);
    setShowCompanyModal(false);
  };

  const handleDeleteCompany = (id) => {
    const updated = companies.filter(c => c.id !== id);
    setCompanies(updated);
    persistChanges(updated, orgs, zones, areas, locations, unitHeads, operators);
  };

  const handleSaveOrg = () => {
    if (!orgForm.name || !selectedCompanyId) return;
    const exists = orgs.some(o => o.id === orgForm.id);
    let updated;
    if (exists) {
      updated = orgs.map(o => o.id === orgForm.id ? orgForm : o);
    } else {
      const newOrg = { ...orgForm, id: `org-${Date.now()}`, companyId: selectedCompanyId, createdBy: 'CompanyAdmin' };
      updated = [...orgs, newOrg];
    }
    setOrgs(updated);
    persistChanges(companies, updated, zones, areas, locations, unitHeads, operators);
    setShowOrgModal(false);
  };

  const handleDeleteOrg = (id) => {
    const updated = orgs.filter(o => o.id !== id);
    setOrgs(updated);
    persistChanges(companies, updated, zones, areas, locations, unitHeads, operators);
  };

  const handleSaveZone = () => {
    if (!zoneForm.name || !selectedOrgId) return;
    const exists = zones.some(z => z.id === zoneForm.id);
    let updated;
    if (exists) {
      updated = zones.map(z => z.id === zoneForm.id ? zoneForm : z);
    } else {
      const newZone = { ...zoneForm, id: `hzn-${Date.now()}`, orgId: selectedOrgId, createdBy: 'OrgAdmin' };
      updated = [...zones, newZone];
    }
    setZones(updated);
    persistChanges(companies, orgs, updated, areas, locations, unitHeads, operators);
    setShowZoneModal(false);
  };

  const handleDeleteZone = (id) => {
    const updated = zones.filter(z => z.id !== id);
    setZones(updated);
    persistChanges(companies, orgs, updated, areas, locations, unitHeads, operators);
  };

  const handleSaveArea = () => {
    if (!areaForm.name || !selectedZoneId) return;
    const exists = areas.some(a => a.id === areaForm.id);
    let updated;
    if (exists) {
      updated = areas.map(a => a.id === areaForm.id ? areaForm : a);
    } else {
      const newArea = { ...areaForm, id: `ar-${Date.now()}`, zoneId: selectedZoneId, createdBy: 'ZoneLead' };
      updated = [...areas, newArea];
    }
    setAreas(updated);
    persistChanges(companies, orgs, zones, updated, locations, unitHeads, operators);
    setShowAreaModal(false);
  };

  const handleDeleteArea = (id) => {
    const updated = areas.filter(a => a.id !== id);
    setAreas(updated);
    persistChanges(companies, orgs, zones, updated, locations, unitHeads, operators);
  };

  const handleSaveLoc = () => {
    if (!locForm.name || !selectedAreaId) return;
    const exists = locations.some(l => l.id === locForm.id);
    let updated;
    if (exists) {
      updated = locations.map(l => l.id === locForm.id ? locForm : l);
    } else {
      const newLoc = { ...locForm, id: `loc-${Date.now()}`, areaId: selectedAreaId, createdBy: 'AreaManager' };
      updated = [...locations, newLoc];
    }
    setLocations(updated);
    persistChanges(companies, orgs, zones, areas, updated, unitHeads, operators);
    setShowLocModal(false);
  };

  const handleDeleteLoc = (id) => {
    const updated = locations.filter(l => l.id !== id);
    setLocations(updated);
    persistChanges(companies, orgs, zones, areas, updated, unitHeads, operators);
  };

  const handleSaveUh = () => {
    if (!uhForm.name || !selectedLocId) return;
    const exists = unitHeads.some(u => u.id === uhForm.id);
    let updated;
    if (exists) {
      updated = unitHeads.map(u => u.id === uhForm.id ? uhForm : u);
    } else {
      const newUh = { ...uhForm, id: `uh-${Date.now()}`, locationId: selectedLocId, createdBy: 'LocationAdmin' };
      updated = [...unitHeads, newUh];
    }
    setUnitHeads(updated);
    persistChanges(companies, orgs, zones, areas, locations, updated, operators);
    setShowUhModal(false);
  };

  const handleDeleteUh = (id) => {
    const updated = unitHeads.filter(u => u.id !== id);
    setUnitHeads(updated);
    persistChanges(companies, orgs, zones, areas, locations, updated, operators);
  };

  const handleSaveOp = () => {
    if (!opForm.name || !selectedUhId) return;
    const exists = operators.some(o => o.id === opForm.id);
    let updated;
    if (exists) {
      updated = operators.map(o => o.id === opForm.id ? opForm : o);
    } else {
      const newOp = { ...opForm, id: `op-${Date.now()}`, unitHeadId: selectedUhId, createdBy: 'UnitHead' };
      updated = [...operators, newOp];
    }
    setOperators(updated);
    persistChanges(companies, orgs, zones, areas, locations, unitHeads, updated);
    setShowOpModal(false);
  };

  const handleDeleteOp = (id) => {
    const updated = operators.filter(o => o.id !== id);
    setOperators(updated);
    persistChanges(companies, orgs, zones, areas, locations, unitHeads, updated);
  };

  const stepsMeta = [
    { num: 1, title: 'SuperAdmin', label: '1. SuperAdmin (Company)', icon: <Crown size={16} /> },
    { num: 2, title: 'Company Admin', label: '2. Organization', icon: <Building2 size={16} /> },
    { num: 3, title: 'Org Admin', label: '3. Zone', icon: <Layers size={16} /> },
    { num: 4, title: 'Zone Lead', label: '4. Area', icon: <MapPin size={16} /> },
    { num: 5, title: 'Area Manager', label: '5. Location', icon: <Building2 size={16} /> },
    { num: 6, title: 'Location Admin', label: '6. Unit Head', icon: <UserCheck size={16} /> },
    { num: 7, title: 'Unit Head', label: '7. Operator', icon: <User size={16} /> }
  ];

  return (
    <div className="fade-in p-3">
      {/* HEADER */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Badge bg="info" className="px-3 py-1 fw-bold fs-11 tracking-wider uppercase border-0 text-dark">
              7-STEP HIERARCHY & CREDENTIAL MANAGER
            </Badge>
            {saveMsg && <Badge bg="success" className="fs-11 px-3 py-1 fade-in text-white">{saveMsg}</Badge>}
          </div>
          <h2 className="mb-0 text-white fw-bold">User & Hierarchy Settings</h2>
          <p className="text-slate-300 fs-12 mb-0">Multi-tenant hierarchy manager starting from SuperAdmin & Company level down to Operators.</p>
        </div>
      </div>

      {/* ── SLEEK UNIFIED HORIZONTAL STEPPER BAR ─────────────────────────────── */}
      <div className="p-2 mb-4 rounded-4 bg-dark-glass border border-white border-opacity-10 d-flex justify-content-between align-items-center flex-wrap gap-2">
        {stepsMeta.map((s, idx) => (
          <React.Fragment key={s.num}>
            <button
              onClick={() => setStep(s.num)}
              className={`btn border-0 py-2 px-3 rounded-3 fs-12 fw-bold d-flex align-items-center gap-2 transition-all ${
                step === s.num
                  ? 'btn-info text-dark shadow-sm fw-black'
                  : 'text-slate-300 hover-bg-dark'
              }`}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
            {idx < stepsMeta.length - 1 && (
              <ChevronRight size={14} className="text-slate-500 d-none d-md-inline" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── ACTIVE STEP TABLE PANEL ────────────────────────────────────────── */}
      <Card className="scada-card border-0 shadow-lg mb-4" style={{ background: '#0f172a', borderRadius: '16px' }}>
        <Card.Body className="p-4">
          
          {/* STEP 1: SUPERADMIN CREATES COMPANIES */}
          {step === 1 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
                    <Crown className="text-info" size={20} /> Step 1: Companies (SuperAdmin Created)
                  </h5>
                  <small className="text-slate-300 fs-12">SuperAdmin creates main enterprise Companies with Email/Password & Allowed SCADA Modules</small>
                </div>
                <Button variant="info" size="sm" className="fw-bold px-4 rounded-pill text-dark shadow-sm" onClick={() => {
                  setCompanyForm({ id: `cmp-${Date.now()}`, name: '', code: '', email: '', password: 'password123', status: 'ACTIVE', allowedModules: ALL_SCADA_MODULES });
                  setShowCompanyModal(true);
                }}>
                  <Plus size={16} className="me-1" /> Add Company
                </Button>
              </div>

              <Table borderless responsive className="scada-table align-middle">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Login Email</th>
                    <th>Password</th>
                    <th>Allowed Modules</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(cmp => (
                    <tr key={cmp.id}>
                      <td className="fw-bold text-white fs-13">
                        <Globe size={18} className="text-info me-2" /> {cmp.name} <Badge bg="dark" className="ms-2 text-info border border-info">{cmp.code}</Badge>
                      </td>
                      <td className="font-monospace text-info fs-12 fw-bold">📧 {cmp.email || 'sa@company.com'}</td>
                      <td className="font-monospace text-warning fs-12 fw-bold">🔑 {cmp.password || 'password123'}</td>
                      <td>
                        <Badge bg="success" className="fs-11 px-3 py-1">{cmp.allowedModules?.length || ALL_SCADA_MODULES.length} Modules</Badge>
                      </td>
                      <td>
                        <Badge bg={cmp.status === 'ACTIVE' ? 'success' : 'secondary'} className="fs-11 px-2 py-1">{cmp.status || 'ACTIVE'}</Badge>
                      </td>
                      <td className="text-end">
                        <Button variant="link" className="text-info p-1 me-2" onClick={() => { setCompanyForm(cmp); setShowCompanyModal(true); }}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="link" className="text-danger p-1 me-3" onClick={() => handleDeleteCompany(cmp.id)}>
                          <Trash2 size={16} />
                        </Button>
                        <Button variant="info" size="sm" className="fs-11 fw-bold rounded-pill text-dark px-3" onClick={() => { setSelectedCompanyId(cmp.id); setStep(2); }}>
                          Next: Create Organizations <ArrowRight size={14} className="ms-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {/* STEP 2: COMPANY ADMIN CREATES ORGANIZATIONS */}
          {step === 2 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h5 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
                    <Building2 className="text-primary" size={20} /> Step 2: Organizations (Company Created)
                  </h5>
                  <small className="text-slate-300 fs-12">Select parent Company and create Organizations with Login Credentials & Allowed Modules</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)} className="cyber-input py-1 px-3 fs-12" style={{ width: 250 }}>
                    {companies.map(c => <option key={c.id} value={c.id}>Company: {c.name}</option>)}
                  </Form.Select>
                  <Button variant="primary" size="sm" className="fw-bold px-4 rounded-pill shadow-sm" onClick={() => {
                    setOrgForm({ id: `org-${Date.now()}`, companyId: selectedCompanyId, name: '', code: '', email: '', password: 'password123', allowedModules: ALL_SCADA_MODULES });
                    setShowOrgModal(true);
                  }}>
                    <Plus size={16} className="me-1" /> Add Organization
                  </Button>
                </div>
              </div>

              <Table borderless responsive className="scada-table align-middle">
                <thead>
                  <tr>
                    <th>Organization Name</th>
                    <th>Parent Company</th>
                    <th>Login Email</th>
                    <th>Password</th>
                    <th>Allowed Modules</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.filter(o => !selectedCompanyId || o.companyId === selectedCompanyId).map(org => {
                    const parentCmp = companies.find(c => c.id === org.companyId);
                    return (
                      <tr key={org.id}>
                        <td className="fw-bold text-white fs-13">
                          <Building2 size={18} className="text-cyan-exact me-2" /> {org.name} <Badge bg="dark" className="ms-2 text-info border border-info">{org.code}</Badge>
                        </td>
                        <td className="text-slate-300 fs-12 fw-bold">{parentCmp ? parentCmp.name : 'Unassigned'}</td>
                        <td className="font-monospace text-info fs-12 fw-bold">📧 {org.email || 'admin@tata.com'}</td>
                        <td className="font-monospace text-warning fs-12 fw-bold">🔑 {org.password || 'password123'}</td>
                        <td>
                          <Badge bg="primary" className="fs-11 px-3 py-1">{org.allowedModules?.length || ALL_SCADA_MODULES.length} Modules</Badge>
                        </td>
                        <td className="text-end">
                          <Button variant="link" className="text-info p-1 me-2" onClick={() => { setOrgForm(org); setShowOrgModal(true); }}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="link" className="text-danger p-1 me-3" onClick={() => handleDeleteOrg(org.id)}>
                            <Trash2 size={16} />
                          </Button>
                          <Button variant="primary" size="sm" className="fs-11 fw-bold rounded-pill px-3" onClick={() => { setSelectedOrgId(org.id); setStep(3); }}>
                            Next: Create Zones <ArrowRight size={14} className="ms-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {/* STEP 3: ORG ADMIN CREATES ZONE */}
          {step === 3 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h5 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
                    <Layers className="text-info" size={20} /> Step 3: Zones (Org Admin Created)
                  </h5>
                  <small className="text-slate-300 fs-12">Select parent organization and create operational zones with Login Credentials</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Select value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)} className="cyber-input py-1 px-3 fs-12" style={{ width: 250 }}>
                    {orgs.map(o => <option key={o.id} value={o.id}>Org: {o.name}</option>)}
                  </Form.Select>
                  <Button variant="info" size="sm" className="fw-bold px-4 rounded-pill text-dark shadow-sm" onClick={() => {
                    setZoneForm({ id: `hzn-${Date.now()}`, name: '', orgId: selectedOrgId, email: '', password: 'password123', allowedModules: ALL_SCADA_MODULES });
                    setShowZoneModal(true);
                  }}>
                    <Plus size={16} className="me-1" /> Add Zone
                  </Button>
                </div>
              </div>

              <Table borderless responsive className="scada-table align-middle">
                <thead>
                  <tr>
                    <th>Zone Name</th>
                    <th>Parent Org</th>
                    <th>Login Email</th>
                    <th>Allowed Modules</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.filter(z => !selectedOrgId || z.orgId === selectedOrgId).map(z => {
                    const parent = orgs.find(o => o.id === z.orgId);
                    return (
                      <tr key={z.id}>
                        <td className="fw-bold text-white fs-13"><Layers size={18} className="text-info me-2" /> {z.name}</td>
                        <td className="text-slate-300 fs-12 fw-bold">{parent ? parent.name : 'Unassigned'}</td>
                        <td className="font-monospace text-info fs-12 fw-bold">📧 {z.email || 'zone@company.com'}</td>
                        <td><Badge bg="info" className="fs-11 px-3 py-1">{z.allowedModules?.length || ALL_SCADA_MODULES.length} Modules</Badge></td>
                        <td className="text-end">
                          <Button variant="link" className="text-info p-1 me-2" onClick={() => { setZoneForm(z); setShowZoneModal(true); }}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="link" className="text-danger p-1 me-3" onClick={() => handleDeleteZone(z.id)}>
                            <Trash2 size={16} />
                          </Button>
                          <Button variant="info" size="sm" className="fs-11 fw-bold text-dark rounded-pill px-3" onClick={() => { setSelectedZoneId(z.id); setStep(4); }}>
                            Next: Create Areas <ArrowRight size={14} className="ms-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {/* STEP 4: ZONE LEAD CREATES AREA */}
          {step === 4 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h5 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
                    <MapPin className="text-success" size={20} /> Step 4: Areas (Zone Lead Created)
                  </h5>
                  <small className="text-slate-300 fs-12">Select parent zone and create operational areas with Login Credentials</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Select value={selectedZoneId} onChange={e => setSelectedZoneId(e.target.value)} className="cyber-input py-1 px-3 fs-12" style={{ width: 250 }}>
                    {zones.map(z => <option key={z.id} value={z.id}>Zone: {z.name}</option>)}
                  </Form.Select>
                  <Button variant="success" size="sm" className="fw-bold px-4 rounded-pill shadow-sm" onClick={() => {
                    setAreaForm({ id: `ar-${Date.now()}`, name: '', zoneId: selectedZoneId, email: '', password: 'password123', allowedModules: ALL_SCADA_MODULES });
                    setShowAreaModal(true);
                  }}>
                    <Plus size={16} className="me-1" /> Add Area
                  </Button>
                </div>
              </div>

              <Table borderless responsive className="scada-table align-middle">
                <thead>
                  <tr>
                    <th>Area Name</th>
                    <th>Parent Zone</th>
                    <th>Login Email</th>
                    <th>Allowed Modules</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.filter(a => !selectedZoneId || a.zoneId === selectedZoneId).map(a => {
                    const parent = zones.find(z => z.id === a.zoneId);
                    return (
                      <tr key={a.id}>
                        <td className="fw-bold text-white fs-13"><MapPin size={18} className="text-success me-2" /> {a.name}</td>
                        <td className="text-slate-300 fs-12 fw-bold">{parent ? parent.name : 'Unassigned'}</td>
                        <td className="font-monospace text-info fs-12 fw-bold">📧 {a.email || 'area@company.com'}</td>
                        <td><Badge bg="success" className="fs-11 px-3 py-1">{a.allowedModules?.length || ALL_SCADA_MODULES.length} Modules</Badge></td>
                        <td className="text-end">
                          <Button variant="link" className="text-info p-1 me-2" onClick={() => { setAreaForm(a); setShowAreaModal(true); }}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="link" className="text-danger p-1 me-3" onClick={() => handleDeleteArea(a.id)}>
                            <Trash2 size={16} />
                          </Button>
                          <Button variant="success" size="sm" className="fs-11 fw-bold rounded-pill px-3" onClick={() => { setSelectedAreaId(a.id); setStep(5); }}>
                            Next: Create Locations <ArrowRight size={14} className="ms-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {/* STEP 5: AREA MANAGER CREATES LOCATION */}
          {step === 5 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h5 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
                    <Building2 className="text-warning" size={20} /> Step 5: Locations (Area Manager Created)
                  </h5>
                  <small className="text-slate-300 fs-12">Select parent area and create facility locations with Login Credentials</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Select value={selectedAreaId} onChange={e => setSelectedAreaId(e.target.value)} className="cyber-input py-1 px-3 fs-12" style={{ width: 250 }}>
                    {areas.map(a => <option key={a.id} value={a.id}>Area: {a.name}</option>)}
                  </Form.Select>
                  <Button variant="warning" size="sm" className="fw-bold px-4 rounded-pill text-dark shadow-sm" onClick={() => {
                    setLocForm({ id: `loc-${Date.now()}`, name: '', areaId: selectedAreaId, city: 'Jamshedpur', email: '', password: 'password123', allowedModules: ALL_SCADA_MODULES });
                    setShowLocModal(true);
                  }}>
                    <Plus size={16} className="me-1" /> Add Location
                  </Button>
                </div>
              </div>

              <Table borderless responsive className="scada-table align-middle">
                <thead>
                  <tr>
                    <th>Location Name</th>
                    <th>Parent Area</th>
                    <th>Login Email</th>
                    <th>Allowed Modules</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.filter(l => !selectedAreaId || l.areaId === selectedAreaId).map(l => {
                    const parent = areas.find(a => a.id === l.areaId);
                    return (
                      <tr key={l.id}>
                        <td className="fw-bold text-white fs-13"><Building2 size={18} className="text-warning me-2" /> {l.name}</td>
                        <td className="text-slate-300 fs-12 fw-bold">{parent ? parent.name : 'Unassigned'}</td>
                        <td className="font-monospace text-info fs-12 fw-bold">📧 {l.email || 'loc@company.com'}</td>
                        <td><Badge bg="warning" className="fs-11 px-3 py-1 text-dark">{l.allowedModules?.length || ALL_SCADA_MODULES.length} Modules</Badge></td>
                        <td className="text-end">
                          <Button variant="link" className="text-info p-1 me-2" onClick={() => { setLocForm(l); setShowLocModal(true); }}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="link" className="text-danger p-1 me-3" onClick={() => handleDeleteLoc(l.id)}>
                            <Trash2 size={16} />
                          </Button>
                          <Button variant="warning" size="sm" className="fs-11 fw-bold rounded-pill text-dark px-3" onClick={() => { setSelectedLocId(l.id); setStep(6); }}>
                            Next: Create Unit Head <ArrowRight size={14} className="ms-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {/* STEP 6: LOCATION ADMIN CREATES UNIT HEAD */}
          {step === 6 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h5 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
                    <UserCheck className="text-info" size={20} /> Step 6: Unit Heads (Location Admin Created)
                  </h5>
                  <small className="text-slate-300 fs-12">Select parent location and assign unit head managers with Login Credentials</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Select value={selectedLocId} onChange={e => setSelectedLocId(e.target.value)} className="cyber-input py-1 px-3 fs-12" style={{ width: 250 }}>
                    {locations.map(l => <option key={l.id} value={l.id}>Location: {l.name}</option>)}
                  </Form.Select>
                  <Button variant="info" size="sm" className="fw-bold px-4 rounded-pill text-dark shadow-sm" onClick={() => {
                    setUhForm({ id: `uh-${Date.now()}`, name: '', locationId: selectedLocId, email: '', password: 'password123', allowedModules: ALL_SCADA_MODULES });
                    setShowUhModal(true);
                  }}>
                    <Plus size={16} className="me-1" /> Add Unit Head
                  </Button>
                </div>
              </div>

              <Table borderless responsive className="scada-table align-middle">
                <thead>
                  <tr>
                    <th>Unit Head Name</th>
                    <th>Login Email</th>
                    <th>Password</th>
                    <th>Allowed Modules</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unitHeads.filter(u => !selectedLocId || u.locationId === selectedLocId).map(u => {
                    return (
                      <tr key={u.id}>
                        <td className="fw-bold text-white fs-13"><UserCheck size={18} className="text-info me-2" /> {u.name}</td>
                        <td className="font-monospace text-info fs-12 fw-bold">📧 {u.email}</td>
                        <td className="font-monospace text-warning fs-12 fw-bold">🔑 {u.password || 'password123'}</td>
                        <td><Badge bg="info" className="fs-11 px-3 py-1">{u.allowedModules?.length || ALL_SCADA_MODULES.length} Modules</Badge></td>
                        <td className="text-end">
                          <Button variant="link" className="text-info p-1 me-2" onClick={() => { setUhForm(u); setShowUhModal(true); }}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="link" className="text-danger p-1 me-3" onClick={() => handleDeleteUh(u.id)}>
                            <Trash2 size={16} />
                          </Button>
                          <Button variant="info" size="sm" className="fs-11 fw-bold rounded-pill text-dark px-3" onClick={() => { setSelectedUhId(u.id); setStep(7); }}>
                            Next: Create Operators <ArrowRight size={14} className="ms-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {/* STEP 7: UNIT HEAD CREATES OPERATORS & PERMISSIONS */}
          {step === 7 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h5 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
                    <User className="text-danger" size={20} /> Step 7: Operators & Allowed Modules (Unit Head Created)
                  </h5>
                  <small className="text-slate-300 fs-12">Select Unit Head, configure Login Credentials (Email/Password), allowed modules & permissions</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Select value={selectedUhId} onChange={e => setSelectedUhId(e.target.value)} className="cyber-input py-1 px-3 fs-12" style={{ width: 250 }}>
                    {unitHeads.map(u => <option key={u.id} value={u.id}>Unit Head: {u.name}</option>)}
                  </Form.Select>
                  <Button variant="danger" size="sm" className="fw-bold px-4 rounded-pill shadow-sm" onClick={() => {
                    setOpForm({
                      id: `op-${Date.now()}`,
                      name: '',
                      email: '',
                      password: 'password123',
                      unitHeadId: selectedUhId,
                      allowedModules: ['Dashboard', 'Water Management', 'Motors', 'Alarm System'],
                      permissions: ['VIEW_TELEMETRY', 'MOTOR_CONTROL', 'ALARM_ACK']
                    });
                    setShowOpModal(true);
                  }}>
                    <Plus size={16} className="me-1" /> Add Operator
                  </Button>
                </div>
              </div>

              <Table borderless responsive className="scada-table align-middle">
                <thead>
                  <tr>
                    <th>Operator Name</th>
                    <th>Login Email</th>
                    <th>Password</th>
                    <th>Allowed Modules</th>
                    <th>Permissions</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.filter(op => !selectedUhId || op.unitHeadId === selectedUhId).map(op => {
                    return (
                      <tr key={op.id}>
                        <td className="fw-bold text-white fs-13"><User size={18} className="text-danger me-2" /> {op.name}</td>
                        <td className="font-monospace text-info fs-12 fw-bold">📧 {op.email}</td>
                        <td className="font-monospace text-warning fs-12 fw-bold">🔑 {op.password || 'password123'}</td>
                        <td>
                          <Badge bg="danger" className="fs-11 px-3 py-1">{op.allowedModules?.length || 4} Modules Allowed</Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {(op.permissions || []).map(p => (
                              <Badge key={p} bg="info" className="fs-10">
                                {p.replace('PERM_', '')}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="text-end">
                          <Button variant="link" className="text-info p-1 me-2" onClick={() => { setOpForm(op); setShowOpModal(true); }}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="link" className="text-danger p-1" onClick={() => handleDeleteOp(op.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

        </Card.Body>
      </Card>

      {/* ── ELEGANT VISUAL TREE EXPLORER ────────────────────────────────────── */}
      <Card className="scada-card border-0 shadow-lg" style={{ background: '#0f172a', borderRadius: '16px' }}>
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="text-info fw-black fs-15 mb-0 d-flex align-items-center gap-2">
                <Sparkles size={18} /> Visual Multi-Tenant Hierarchy Map (SuperAdmin ➔ Company ➔ Organization ➔ Zone...)
              </h5>
              <small className="text-slate-300 fs-12">Clean tree view. Click to expand/collapse Companies and Organizations.</small>
            </div>
          </div>

          <div className="tree-explorer-container p-3 rounded-4 bg-black bg-opacity-40 border border-white border-opacity-5">
            {companies.map(cmp => {
              const isCmpExpanded = expandedCompanies[cmp.id] !== false;
              const cmpOrgs = orgs.filter(o => o.companyId === cmp.id);

              return (
                <div key={cmp.id} className="company-tree-block mb-3 p-3 rounded-3 bg-dark-glass border border-warning border-opacity-30">
                  {/* COMPANY HEADER */}
                  <div className="d-flex justify-content-between align-items-center cursor-pointer flex-wrap gap-2" onClick={() => toggleCompanyTree(cmp.id)}>
                    <div className="d-flex align-items-center gap-2">
                      {isCmpExpanded ? <ChevronDown size={18} className="text-warning" /> : <ChevronRight size={18} className="text-warning" />}
                      <Crown size={20} className="text-warning" />
                      <span className="fw-black text-white fs-15 me-2">{cmp.name}</span>
                      <Badge bg="dark" className="border border-warning text-warning fs-10">{cmp.code}</Badge>
                      <Badge bg="info" className="fs-9 ms-2">COMPANY</Badge>
                      <span className="font-monospace text-slate-300 fs-11 ms-3 d-none d-md-inline">📧 {cmp.email}</span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Button variant="link" className="text-info p-0 me-2" onClick={(e) => { e.stopPropagation(); setCompanyForm(cmp); setShowCompanyModal(true); }}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="link" className="text-danger p-0" onClick={(e) => { e.stopPropagation(); handleDeleteCompany(cmp.id); }}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* ORGANIZATIONS TREE LIST */}
                  {isCmpExpanded && (
                    <div className="mt-3 ps-3 border-start border-warning border-opacity-30">
                      {cmpOrgs.map(o => {
                        const isExpanded = expandedOrgs[o.id] !== false;
                        const orgZones = zones.filter(z => z.orgId === o.id);

                        return (
                          <div key={o.id} className="org-tree-block mb-3 p-3 rounded-3 bg-dark-glass border border-info border-opacity-20">
                            {/* ORG HEADER */}
                            <div className="d-flex justify-content-between align-items-center cursor-pointer flex-wrap gap-2" onClick={() => toggleOrgTree(o.id)}>
                              <div className="d-flex align-items-center gap-2">
                                {isExpanded ? <ChevronDown size={18} className="text-info" /> : <ChevronRight size={18} className="text-info" />}
                                <Building2 size={20} className="text-info" />
                                <span className="fw-black text-white fs-14 me-2">{o.name}</span>
                                <Badge bg="dark" className="border border-info text-info fs-10">{o.code}</Badge>
                                <span className="font-monospace text-slate-300 fs-11 ms-3 d-none d-md-inline">📧 {o.email}</span>
                              </div>

                              <div className="d-flex align-items-center gap-2">
                                <div className="d-flex flex-wrap gap-1 me-2 d-none d-lg-flex">
                                  {(o.allowedModules || ALL_SCADA_MODULES).slice(0, 4).map(m => (
                                    <Badge key={m} bg="info" className="fs-9">{m}</Badge>
                                  ))}
                                </div>
                                <Button variant="link" className="text-info p-0 me-2" onClick={(e) => { e.stopPropagation(); setOrgForm(o); setShowOrgModal(true); }}>
                                  <Edit size={16} />
                                </Button>
                                <Button variant="link" className="text-danger p-0" onClick={(e) => { e.stopPropagation(); handleDeleteOrg(o.id); }}>
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </div>

                            {/* ZONES TREE LIST */}
                            {isExpanded && (
                              <div className="mt-3 ps-3 border-start border-info border-opacity-30">
                                {orgZones.map(z => {
                                  const zoneAreas = areas.filter(a => a.zoneId === z.id);

                                  return (
                                    <div key={z.id} className="mb-3 ps-3 border-start border-primary border-opacity-40">
                                      <div className="d-flex justify-content-between align-items-center py-1">
                                        <div className="d-flex align-items-center gap-2 text-white fw-bold fs-12">
                                          <Layers size={16} className="text-primary" />
                                          <span>{z.name}</span>
                                          <Badge bg="primary" className="fs-9">ZONE</Badge>
                                          <span className="font-monospace text-slate-400 fs-10 ms-2">📧 {z.email}</span>
                                        </div>
                                        <div>
                                          <Button variant="link" className="text-info p-0 me-2" onClick={() => { setZoneForm(z); setShowZoneModal(true); }}>
                                            <Edit size={14} />
                                          </Button>
                                          <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteZone(z.id)}>
                                            <Trash2 size={14} />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* AREAS TREE LIST */}
                                      {zoneAreas.map(a => {
                                        const areaLocs = locations.filter(l => l.areaId === a.id);

                                        return (
                                          <div key={a.id} className="ms-3 mb-2 ps-3 border-start border-success border-opacity-40">
                                            <div className="d-flex justify-content-between align-items-center py-1">
                                              <div className="d-flex align-items-center gap-2 text-slate-200 fs-12">
                                                <MapPin size={15} className="text-success" />
                                                <span className="fw-semibold">{a.name}</span>
                                                <Badge bg="success" className="fs-9">AREA</Badge>
                                              </div>
                                              <div>
                                                <Button variant="link" className="text-info p-0 me-2" onClick={() => { setAreaForm(a); setShowAreaModal(true); }}>
                                                  <Edit size={14} />
                                                </Button>
                                                <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteArea(a.id)}>
                                                  <Trash2 size={14} />
                                                </Button>
                                              </div>
                                            </div>

                                            {/* LOCATIONS */}
                                            {areaLocs.map(l => {
                                              const locUhs = unitHeads.filter(u => u.locationId === l.id);

                                              return (
                                                <div key={l.id} className="ms-3 mb-2 ps-3 border-start border-warning border-opacity-40">
                                                  <div className="d-flex justify-content-between align-items-center py-1">
                                                    <div className="d-flex align-items-center gap-2 text-warning fs-12">
                                                      <Building2 size={14} />
                                                      <span>{l.name} ({l.city})</span>
                                                      <Badge bg="warning" className="fs-9 text-dark">LOCATION</Badge>
                                                    </div>
                                                    <div>
                                                      <Button variant="link" className="text-info p-0 me-2" onClick={() => { setLocForm(l); setShowLocModal(true); }}>
                                                        <Edit size={14} />
                                                      </Button>
                                                      <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteLoc(l.id)}>
                                                        <Trash2 size={14} />
                                                      </Button>
                                                    </div>
                                                  </div>

                                                  {/* UNIT HEADS */}
                                                  {locUhs.map(u => {
                                                    const uhOps = operators.filter(op => op.unitHeadId === u.id);

                                                    return (
                                                      <div key={u.id} className="ms-3 mb-1 ps-3 border-start border-info border-opacity-30">
                                                        <div className="d-flex justify-content-between align-items-center py-1">
                                                          <div className="d-flex align-items-center gap-2 text-info fs-11 fw-bold">
                                                            <UserCheck size={14} />
                                                            <span>{u.name} (Unit Head)</span>
                                                            <small className="font-monospace text-slate-400 fs-10">📧 {u.email}</small>
                                                          </div>
                                                          <div>
                                                            <Button variant="link" className="text-info p-0 me-2" onClick={() => { setUhForm(u); setShowUhModal(true); }}>
                                                              <Edit size={14} />
                                                            </Button>
                                                            <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteUh(u.id)}>
                                                              <Trash2 size={14} />
                                                            </Button>
                                                          </div>
                                                        </div>

                                                        {/* OPERATORS */}
                                                        {uhOps.map(op => (
                                                          <div key={op.id} className="ms-3 text-slate-300 fs-10 d-flex justify-content-between align-items-center py-1">
                                                            <div className="d-flex align-items-center gap-2">
                                                              <Zap size={13} className="text-danger" />
                                                              <span>Operator: <strong className="text-white">{op.name}</strong> (📧 {op.email})</span>
                                                            </div>
                                                            <div>
                                                              <Button variant="link" className="text-info p-0 me-2" onClick={() => { setOpForm(op); setShowOpModal(true); }}>
                                                                <Edit size={13} />
                                                              </Button>
                                                              <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteOp(op.id)}>
                                                                <Trash2 size={13} />
                                                              </Button>
                                                            </div>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {/* ── MODALS WITH 1-CLICK ENABLE ALL & DISABLE ALL BUTTONS ────────────── */}
      {/* COMPANY MODAL */}
      <Modal show={showCompanyModal} onHide={() => setShowCompanyModal(false)} centered size="lg" className="compact-tenant-modal">
        <Modal.Header closeButton>
          <Modal.Title>Step 1: Company Credentials & Allowed Modules (SuperAdmin)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Company Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Sochiot Enterprise Corp" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Company Code</Form.Label>
              <Form.Control type="text" placeholder="e.g. SOCHIOT_CORP" value={companyForm.code} onChange={e => setCompanyForm({ ...companyForm, code: e.target.value })} className="cyber-modal-input-compact font-monospace" />
            </Col>
            <Col md={6}>
              <Form.Label>Login Email</Form.Label>
              <Form.Control type="email" placeholder="e.g. sa@ismartaccess.com" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Login Password</Form.Label>
              <Form.Control type="text" placeholder="e.g. password123" value={companyForm.password} onChange={e => setCompanyForm({ ...companyForm, password: e.target.value })} className="cyber-modal-input-compact font-monospace" />
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fs-11 text-cyan-exact fw-bold text-uppercase mb-0">
              Select Enabled SCADA Modules for this Company
            </Form.Label>
            <div className="d-flex gap-2">
              <Button variant="outline-success" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => enableAllModules(companyForm, setCompanyForm)}>
                <CheckCircle size={12} /> Enable All
              </Button>
              <Button variant="outline-danger" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => disableAllModules(companyForm, setCompanyForm)}>
                <XCircle size={12} /> Disable All
              </Button>
            </div>
          </div>

          <Row className="g-2 max-h-250 overflow-auto p-2 bg-black bg-opacity-40 rounded-3 border border-white border-opacity-10">
            {ALL_SCADA_MODULES.map(mod => {
              const checked = (companyForm.allowedModules || []).includes(mod);
              return (
                <Col md={4} key={mod}>
                  <div className={`p-2 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${checked ? 'border-warning bg-warning bg-opacity-10' : 'border-secondary opacity-60'}`} onClick={() => toggleModuleInForm(mod, companyForm, setCompanyForm)}>
                    <span className="fs-11 text-white fw-bold">{mod}</span>
                    <Form.Check type="checkbox" checked={checked} onChange={() => {}} />
                  </div>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowCompanyModal(false)}>Cancel</Button>
          <Button variant="info" size="sm" className="fw-bold text-dark px-4" onClick={handleSaveCompany}>Save Company</Button>
        </Modal.Footer>
      </Modal>

      {/* ORG MODAL */}
      <Modal show={showOrgModal} onHide={() => setShowOrgModal(false)} centered size="lg" className="compact-tenant-modal">
        <Modal.Header closeButton>
          <Modal.Title>Step 2: Organization Credentials & Allowed Modules (Company Admin)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Organization Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Tata Industrial Corp" value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Parent Company</Form.Label>
              <Form.Select value={orgForm.companyId || selectedCompanyId} onChange={e => setOrgForm({ ...orgForm, companyId: e.target.value })} className="cyber-modal-input-compact">
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Organization Code</Form.Label>
              <Form.Control type="text" placeholder="e.g. TATA_IND" value={orgForm.code} onChange={e => setOrgForm({ ...orgForm, code: e.target.value })} className="cyber-modal-input-compact font-monospace" />
            </Col>
            <Col md={6}>
              <Form.Label>Login Email</Form.Label>
              <Form.Control type="email" placeholder="e.g. admin@tata.com" value={orgForm.email} onChange={e => setOrgForm({ ...orgForm, email: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Login Password</Form.Label>
              <Form.Control type="text" placeholder="e.g. password123" value={orgForm.password} onChange={e => setOrgForm({ ...orgForm, password: e.target.value })} className="cyber-modal-input-compact font-monospace" />
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fs-11 text-cyan-exact fw-bold text-uppercase mb-0">
              Select Enabled SCADA Modules for this Organization
            </Form.Label>
            <div className="d-flex gap-2">
              <Button variant="outline-success" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => enableAllModules(orgForm, setOrgForm)}>
                <CheckCircle size={12} /> Enable All
              </Button>
              <Button variant="outline-danger" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => disableAllModules(orgForm, setOrgForm)}>
                <XCircle size={12} /> Disable All
              </Button>
            </div>
          </div>

          <Row className="g-2 max-h-250 overflow-auto p-2 bg-black bg-opacity-40 rounded-3 border border-white border-opacity-10">
            {ALL_SCADA_MODULES.map(mod => {
              const checked = (orgForm.allowedModules || []).includes(mod);
              return (
                <Col md={4} key={mod}>
                  <div className={`p-2 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${checked ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary opacity-60'}`} onClick={() => toggleModuleInForm(mod, orgForm, setOrgForm)}>
                    <span className="fs-11 text-white fw-bold">{mod}</span>
                    <Form.Check type="checkbox" checked={checked} onChange={() => {}} />
                  </div>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowOrgModal(false)}>Cancel</Button>
          <Button variant="primary" size="sm" className="fw-bold px-4" onClick={handleSaveOrg}>Save Organization</Button>
        </Modal.Footer>
      </Modal>

      {/* ZONE MODAL */}
      <Modal show={showZoneModal} onHide={() => setShowZoneModal(false)} centered size="lg" className="compact-tenant-modal">
        <Modal.Header closeButton>
          <Modal.Title>Step 3: Zone Credentials & Allowed Modules (Org Admin)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Zone Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. North Power Zone" value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Parent Organization</Form.Label>
              <Form.Select value={zoneForm.orgId || selectedOrgId} onChange={e => setZoneForm({ ...zoneForm, orgId: e.target.value })} className="cyber-modal-input-compact">
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Login Email</Form.Label>
              <Form.Control type="email" placeholder="e.g. zone@tata.com" value={zoneForm.email} onChange={e => setZoneForm({ ...zoneForm, email: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Login Password</Form.Label>
              <Form.Control type="text" placeholder="e.g. password123" value={zoneForm.password} onChange={e => setZoneForm({ ...zoneForm, password: e.target.value })} className="cyber-modal-input-compact font-monospace" />
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fs-11 text-cyan-exact fw-bold text-uppercase mb-0">
              Select Enabled SCADA Modules for this Zone
            </Form.Label>
            <div className="d-flex gap-2">
              <Button variant="outline-success" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => enableAllModules(zoneForm, setZoneForm)}>
                <CheckCircle size={12} /> Enable All
              </Button>
              <Button variant="outline-danger" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => disableAllModules(zoneForm, setZoneForm)}>
                <XCircle size={12} /> Disable All
              </Button>
            </div>
          </div>

          <Row className="g-2 max-h-250 overflow-auto p-2 bg-black bg-opacity-40 rounded-3 border border-white border-opacity-10">
            {ALL_SCADA_MODULES.map(mod => {
              const checked = (zoneForm.allowedModules || []).includes(mod);
              return (
                <Col md={4} key={mod}>
                  <div className={`p-2 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${checked ? 'border-info bg-info bg-opacity-10' : 'border-secondary opacity-60'}`} onClick={() => toggleModuleInForm(mod, zoneForm, setZoneForm)}>
                    <span className="fs-11 text-white fw-bold">{mod}</span>
                    <Form.Check type="checkbox" checked={checked} onChange={() => {}} />
                  </div>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowZoneModal(false)}>Cancel</Button>
          <Button variant="info" size="sm" className="fw-bold text-dark px-4" onClick={handleSaveZone}>Save Zone</Button>
        </Modal.Footer>
      </Modal>

      {/* AREA MODAL */}
      <Modal show={showAreaModal} onHide={() => setShowAreaModal(false)} centered size="lg" className="compact-tenant-modal">
        <Modal.Header closeButton>
          <Modal.Title>Step 4: Area Credentials & Allowed Modules (Zone Lead)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Area Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Rolling Mill Area" value={areaForm.name} onChange={e => setAreaForm({ ...areaForm, name: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Parent Zone</Form.Label>
              <Form.Select value={areaForm.zoneId || selectedZoneId} onChange={e => setAreaForm({ ...areaForm, zoneId: e.target.value })} className="cyber-modal-input-compact">
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Login Email</Form.Label>
              <Form.Control type="email" placeholder="e.g. area@tata.com" value={areaForm.email} onChange={e => setAreaForm({ ...areaForm, email: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Login Password</Form.Label>
              <Form.Control type="text" placeholder="e.g. password123" value={areaForm.password} onChange={e => setAreaForm({ ...areaForm, password: e.target.value })} className="cyber-modal-input-compact font-monospace" />
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fs-11 text-cyan-exact fw-bold text-uppercase mb-0">
              Select Enabled SCADA Modules for this Area
            </Form.Label>
            <div className="d-flex gap-2">
              <Button variant="outline-success" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => enableAllModules(areaForm, setAreaForm)}>
                <CheckCircle size={12} /> Enable All
              </Button>
              <Button variant="outline-danger" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => disableAllModules(areaForm, setAreaForm)}>
                <XCircle size={12} /> Disable All
              </Button>
            </div>
          </div>

          <Row className="g-2 max-h-250 overflow-auto p-2 bg-black bg-opacity-40 rounded-3 border border-white border-opacity-10">
            {ALL_SCADA_MODULES.map(mod => {
              const checked = (areaForm.allowedModules || []).includes(mod);
              return (
                <Col md={4} key={mod}>
                  <div className={`p-2 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${checked ? 'border-success bg-success bg-opacity-10' : 'border-secondary opacity-60'}`} onClick={() => toggleModuleInForm(mod, areaForm, setAreaForm)}>
                    <span className="fs-11 text-white fw-bold">{mod}</span>
                    <Form.Check type="checkbox" checked={checked} onChange={() => {}} />
                  </div>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowAreaModal(false)}>Cancel</Button>
          <Button variant="success" size="sm" className="fw-bold px-4" onClick={handleSaveArea}>Save Area</Button>
        </Modal.Footer>
      </Modal>

      {/* LOCATION MODAL */}
      <Modal show={showLocModal} onHide={() => setShowLocModal(false)} centered size="lg" className="compact-tenant-modal">
        <Modal.Header closeButton>
          <Modal.Title>Step 5: Location Credentials & Allowed Modules (Area Manager)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Location Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Substation 04" value={locForm.name} onChange={e => setLocForm({ ...locForm, name: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Parent Area</Form.Label>
              <Form.Select value={locForm.areaId || selectedAreaId} onChange={e => setLocForm({ ...locForm, areaId: e.target.value })} className="cyber-modal-input-compact">
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Login Email</Form.Label>
              <Form.Control type="email" placeholder="e.g. loc@tata.com" value={locForm.email} onChange={e => setLocForm({ ...locForm, email: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Login Password</Form.Label>
              <Form.Control type="text" placeholder="e.g. password123" value={locForm.password} onChange={e => setLocForm({ ...locForm, password: e.target.value })} className="cyber-modal-input-compact font-monospace" />
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fs-11 text-cyan-exact fw-bold text-uppercase mb-0">
              Select Enabled SCADA Modules for this Location
            </Form.Label>
            <div className="d-flex gap-2">
              <Button variant="outline-success" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => enableAllModules(locForm, setLocForm)}>
                <CheckCircle size={12} /> Enable All
              </Button>
              <Button variant="outline-danger" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => disableAllModules(locForm, setLocForm)}>
                <XCircle size={12} /> Disable All
              </Button>
            </div>
          </div>

          <Row className="g-2 max-h-250 overflow-auto p-2 bg-black bg-opacity-40 rounded-3 border border-white border-opacity-10">
            {ALL_SCADA_MODULES.map(mod => {
              const checked = (locForm.allowedModules || []).includes(mod);
              return (
                <Col md={4} key={mod}>
                  <div className={`p-2 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${checked ? 'border-warning bg-warning bg-opacity-10' : 'border-secondary opacity-60'}`} onClick={() => toggleModuleInForm(mod, locForm, setLocForm)}>
                    <span className="fs-11 text-white fw-bold">{mod}</span>
                    <Form.Check type="checkbox" checked={checked} onChange={() => {}} />
                  </div>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowLocModal(false)}>Cancel</Button>
          <Button variant="warning" size="sm" className="fw-bold text-dark px-4" onClick={handleSaveLoc}>Save Location</Button>
        </Modal.Footer>
      </Modal>

      {/* UNIT HEAD MODAL */}
      <Modal show={showUhModal} onHide={() => setShowUhModal(false)} centered size="lg" className="compact-tenant-modal">
        <Modal.Header closeButton>
          <Modal.Title>Step 6: Unit Head Credentials & Allowed Modules (Location Admin)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Unit Head Full Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Rajesh Kumar" value={uhForm.name} onChange={e => setUhForm({ ...uhForm, name: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Assigned Location</Form.Label>
              <Form.Select value={uhForm.locationId || selectedLocId} onChange={e => setUhForm({ ...uhForm, locationId: e.target.value })} className="cyber-modal-input-compact">
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Login Email</Form.Label>
              <Form.Control type="email" placeholder="e.g. rajesh@tata.com" value={uhForm.email} onChange={e => setUhForm({ ...uhForm, email: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Login Password</Form.Label>
              <Form.Control type="text" placeholder="e.g. password123" value={uhForm.password} onChange={e => setUhForm({ ...uhForm, password: e.target.value })} className="cyber-modal-input-compact font-monospace" />
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fs-11 text-cyan-exact fw-bold text-uppercase mb-0">
              Select Enabled SCADA Modules for this Unit Head
            </Form.Label>
            <div className="d-flex gap-2">
              <Button variant="outline-success" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => enableAllModules(uhForm, setUhForm)}>
                <CheckCircle size={12} /> Enable All
              </Button>
              <Button variant="outline-danger" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => disableAllModules(uhForm, setUhForm)}>
                <XCircle size={12} /> Disable All
              </Button>
            </div>
          </div>

          <Row className="g-2 max-h-250 overflow-auto p-2 bg-black bg-opacity-40 rounded-3 border border-white border-opacity-10">
            {ALL_SCADA_MODULES.map(mod => {
              const checked = (uhForm.allowedModules || []).includes(mod);
              return (
                <Col md={4} key={mod}>
                  <div className={`p-2 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${checked ? 'border-info bg-info bg-opacity-10' : 'border-secondary opacity-60'}`} onClick={() => toggleModuleInForm(mod, uhForm, setUhForm)}>
                    <span className="fs-11 text-white fw-bold">{mod}</span>
                    <Form.Check type="checkbox" checked={checked} onChange={() => {}} />
                  </div>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowUhModal(false)}>Cancel</Button>
          <Button variant="info" size="sm" className="fw-bold text-dark px-4" onClick={handleSaveUh}>Save Unit Head</Button>
        </Modal.Footer>
      </Modal>

      {/* OPERATOR MODAL */}
      <Modal show={showOpModal} onHide={() => setShowOpModal(false)} centered size="lg" className="compact-tenant-modal">
        <Modal.Header closeButton>
          <Modal.Title>Step 7: Operator Credentials & Allowed Modules (Unit Head)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Label>Operator Full Name</Form.Label>
              <Form.Control type="text" placeholder="e.g. Amit Singh" value={opForm.name} onChange={e => setOpForm({ ...opForm, name: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Parent Unit Head</Form.Label>
              <Form.Select value={opForm.unitHeadId || selectedUhId} onChange={e => setOpForm({ ...opForm, unitHeadId: e.target.value })} className="cyber-modal-input-compact">
                {unitHeads.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Login Email</Form.Label>
              <Form.Control type="email" placeholder="e.g. amit@tata.com" value={opForm.email} onChange={e => setOpForm({ ...opForm, email: e.target.value })} className="cyber-modal-input-compact" />
            </Col>
            <Col md={6}>
              <Form.Label>Login Password</Form.Label>
              <Form.Control type="text" placeholder="e.g. password123" value={opForm.password} onChange={e => setOpForm({ ...opForm, password: e.target.value })} className="cyber-modal-input-compact font-monospace" />
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fs-11 text-cyan-exact fw-bold text-uppercase mb-0">
              Select Enabled SCADA Modules for this Operator
            </Form.Label>
            <div className="d-flex gap-2">
              <Button variant="outline-success" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => enableAllModules(opForm, setOpForm)}>
                <CheckCircle size={12} /> Enable All
              </Button>
              <Button variant="outline-danger" size="sm" className="py-0 px-2 fs-10 fw-bold rounded-pill d-flex align-items-center gap-1" onClick={() => disableAllModules(opForm, setOpForm)}>
                <XCircle size={12} /> Disable All
              </Button>
            </div>
          </div>

          <Row className="g-2 mb-3 max-h-200 overflow-auto p-2 bg-black bg-opacity-40 rounded-3 border border-white border-opacity-10">
            {ALL_SCADA_MODULES.map(mod => {
              const checked = (opForm.allowedModules || []).includes(mod);
              return (
                <Col md={4} key={mod}>
                  <div className={`p-2 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${checked ? 'border-danger bg-danger bg-opacity-10' : 'border-secondary opacity-60'}`} onClick={() => toggleModuleInForm(mod, opForm, setOpForm)}>
                    <span className="fs-11 text-white fw-bold">{mod}</span>
                    <Form.Check type="checkbox" checked={checked} onChange={() => {}} />
                  </div>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowOpModal(false)}>Cancel</Button>
          <Button variant="danger" size="sm" className="fw-bold px-4" onClick={handleSaveOp}>Save Operator & Permissions</Button>
        </Modal.Footer>
      </Modal>

      {/* STYLES */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hover-bg-dark:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
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
        .cyber-input {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
          font-size: 0.85rem !important;
          border-radius: 8px !important;
        }
        .max-h-250 { max-height: 250px; }
        .max-h-200 { max-height: 200px; }
      `}} />
    </div>
  );
};

export default UserSettings;
