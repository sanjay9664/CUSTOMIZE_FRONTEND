import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Spinner, Tabs, Tab, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, Shield, Settings, Trash2, Eye, EyeOff, Save, 
  Search, Edit, ShieldCheck, Mail, Lock, User, 
  LayoutDashboard, Droplets, Activity, Database, Bell, Zap, 
  ShieldAlert, ClipboardList, PenTool, History, Gauge, Building2, Sliders, ChevronDown,
  Clock, Copy, Check, Send, Link2, RefreshCw, XCircle, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PasswordInput from '../../components/PasswordInput';
import { getApiUrl } from '../../utils/apiConfig';

const API_BASE_URL = getApiUrl();

const getAuthHeaders = () => {
  let token = localStorage.getItem('token') || 
              localStorage.getItem('sochiot_token') || 
              localStorage.getItem('auth_token') || 
              localStorage.getItem('access_token') || 'bms-dev-token-admin';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const defaultSubmoduleVisibility = {
  showWaterManagement: { Overview: true, 'AG TANK': true, 'UG TANK': true },
  showMotors: { Overview: true, 'Pump Room 1': true, 'Pump Room 2': true, 'VFD / DOL Status': true, 'PDF Report': true },
  showDGSet: { Overview: true, 'DG Set-1': true, 'DG Set-2': true, 'DG Set-3': true },
  showAlarms: { Overview: true, 'Active Alarms': true, 'Inactive Alarms': true, 'ACK (Acknowledge)': true, 'Alarm History': true, 'PDF Report': true },
  showLTPanel: { Overview: true, 'LT Room-1': true, 'LT Room-2': true, 'LT Room-3': true, 'Incoming / Outgoing': true, 'Breaker Status': true, 'PDF Report': true },
  showTransformers: { Overview: true, 'Transformer-1': true, 'Transformer-2': true, 'Load / Temp': true, 'PDF Report': true },
  showFirePumps: { Overview: true, 'Pump Status': true, 'Header Pressure': true, 'Jockey / Main': true, 'PDF Report': true },
  showMaintenance: { Scheduled: true, 'Pending Tasks': true, 'PDF Report': true },
  showServiceHistory: { 'Equipment-wise': true, 'Service Records': true, 'PDF Report': true },
  showDailyDPR: { 'Data Aggregation': true, 'Daily Logs': true, 'PDF Report': true },
  showEnergyMetering: { Overview: true, 'Main Meter': true, 'Sub Meters': true, 'Graphs': true, 'PDF Report': true }
};

const moduleDetails = {
  showDashboard: { label: 'Dashboard', icon: <LayoutDashboard size={18} />, subItems: [] },
  showEnergyMetering: { label: 'Energy Metering', icon: <Zap size={18} />, subItems: ['Overview', 'Main Meter', 'Sub Meters', 'Graphs', 'PDF Report'] },
  showDGSet: { label: 'DG Set Module', icon: <Database size={18} />, subItems: ['Overview', 'DG Set-1', 'DG Set-2', 'DG Set-3'] },
  showLTPanel: { label: 'LT Panel', icon: <LayoutDashboard size={18} />, subItems: ['Overview', 'LT Room-1', 'LT Room-2', 'LT Room-3', 'Incoming / Outgoing', 'Breaker Status', 'PDF Report'] },
  showTransformers: { label: 'Transformer', icon: <Zap size={18} />, subItems: ['Overview', 'Transformer-1', 'Transformer-2', 'Load / Temp', 'PDF Report'] },
  showWaterManagement: { label: 'Water Management', icon: <Droplets size={18} />, subItems: ['Overview', 'AG TANK', 'UG TANK'] },
  showMotors: { label: 'Motors Module', icon: <Activity size={18} />, subItems: ['Overview', 'Pump Room 1', 'Pump Room 2', 'VFD / DOL Status', 'PDF Report'] },
  showFirePumps: { label: 'Fire', icon: <ShieldAlert size={18} />, subItems: ['Overview', 'Pump Status', 'Header Pressure', 'Jockey / Main', 'PDF Report'] },
  showAlarms: { label: 'Alarm System', icon: <Bell size={18} />, subItems: ['Overview', 'Active Alarms', 'Inactive Alarms', 'ACK (Acknowledge)', 'Alarm History', 'PDF Report'] },
  showTicketing: { label: 'Ticketing System', icon: <ClipboardList size={18} />, subItems: [] },
  showMaintenance: { label: 'Maintenance', icon: <PenTool size={18} />, subItems: ['Scheduled', 'Pending Tasks', 'PDF Report'] },
  showServiceHistory: { label: 'Service History', icon: <History size={18} />, subItems: ['Equipment-wise', 'Service Records', 'PDF Report'] },
  showDailyDPR: { label: 'Daily DPR', icon: <Gauge size={18} />, subItems: ['Data Aggregation', 'Daily Logs', 'PDF Report'] },
  showSettingTemplates: { label: 'Setting Templates', icon: <Settings size={18} />, subItems: [] },
};

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedUser, setSelectedUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [invitations, setInvitations] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('scada_invitations_db') || '[]');
    } catch {
      return [];
    }
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({ email: '', role: 'USER', expirationDays: '7', note: '' });
  const [copiedInviteId, setCopiedInviteId] = useState(null);
  
  const [tenantId] = useState(() => JSON.parse(localStorage.getItem('userData'))?.tenantId);
  const [showModal, setShowModal] = useState(false);
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowManageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'roles' && users.length > 0 && !selectedUser) {
      handleAction(users[0], 'configure');
    }
  }, [users]);

  // Real API Fetch with local storage fallback & sync
  const fetchUsers = async () => {
    setLoading(true);
    let userList = [];
    try {
      const endpoint = `${API_BASE_URL}/users`;
      const response = await fetch(endpoint, { headers: getAuthHeaders() });
      if (response.ok) {
        const result = await response.json();
        const rawData = Array.isArray(result) ? result : (result.data || []);
        userList = rawData.map(u => ({
          ...u,
          name: u.name || u.fullName || u.email?.split('@')[0] || 'User',
          role: u.role || 'USER'
        }));
      }
    } catch (error) {
      console.warn('API fetch unavailable, using cached user database:', error);
    }

    if (!userList || userList.length === 0) {
      try {
        const saved = JSON.parse(localStorage.getItem('scada_users_db') || '[]');
        if (Array.isArray(saved) && saved.length > 0) userList = saved;
      } catch (e) {}
    }

    if (!userList || userList.length === 0) {
      userList = [
        { id: 'usr-101', name: 'Rajesh Padhi', email: 'rajesh@sochiot.com', role: 'ADMIN', tenantId: tenantId || 1, createdAt: new Date().toISOString() },
        { id: 'usr-102', name: 'Sanjay Gupta', email: 'sanjay@sochiot.com', role: 'ADMIN', tenantId: tenantId || 1, createdAt: new Date().toISOString() },
        { id: 'usr-103', name: 'Operator 1', email: 'operator1@sochiot.com', role: 'USER', tenantId: tenantId || 1, createdAt: new Date().toISOString() },
        { id: 'usr-104', name: 'Maintenance Engineer', email: 'engineer@sochiot.com', role: 'USER', tenantId: tenantId || 1, createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('scada_users_db', JSON.stringify(userList));
    }

    setUsers(userList);
    setLoading(false);
  };

  const handleAction = async (user, action) => {
    if (action === 'configure') {
      setSelectedUser(user);
      const userConfig = user.config?.features || { submoduleVisibility: defaultSubmoduleVisibility };
      setConfig({ ...userConfig, submoduleVisibility: { ...defaultSubmoduleVisibility, ...(userConfig.submoduleVisibility || {}) } });
      setActiveTab('config');
    } else if (action === 'view') {
        if (!localStorage.getItem('impersonator_backup_role')) {
            localStorage.setItem('impersonator_backup_user', localStorage.getItem('userData'));
            localStorage.setItem('impersonator_backup_role', localStorage.getItem('userRole'));
        }
        
        const mockUserData = { id: user.id, name: `Preview: ${user.name}`, email: user.email, role: 'USER', tenantId: user.tenantId };
        localStorage.setItem('userData', JSON.stringify(mockUserData));
        localStorage.setItem('userRole', 'USER');
        
        const userConfig = user.config?.features || {};
        const sidebarMapping = Object.fromEntries(Object.keys(moduleDetails).map(k => [moduleDetails[k].label, userConfig[k] ?? true]));
        localStorage.setItem('scada_modules_config', JSON.stringify(sidebarMapping));
        localStorage.setItem('scada_submodules_config', JSON.stringify(userConfig.submoduleVisibility || defaultSubmoduleVisibility));
        
        window.dispatchEvent(new Event('storage-update'));
        window.location.href = '/dashboard';
    } else if (action === 'edit') {
        setFormData({ id: user.id, name: user.name, email: user.email, role: user.role, password: '' });
        setShowModal(true);
    } else if (action === 'delete') {
        if (window.confirm(`Delete user ${user.name}?`)) {
            try {
              const endpoint = `${API_BASE_URL}/users/${user.id}`;
              await fetch(endpoint, { method: 'DELETE', headers: getAuthHeaders() });
            } catch (e) {}
            const updated = users.filter(u => String(u.id) !== String(user.id));
            setUsers(updated);
            localStorage.setItem('scada_users_db', JSON.stringify(updated));
        }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(formData.id);
    try {
      const endpoint = isEdit ? `${API_BASE_URL}/users/${formData.id}` : `${API_BASE_URL}/users`;
      const method = isEdit ? 'PATCH' : 'POST';
      const bodyPayload = {
        name: formData.name,
        email: formData.email,
        role: formData.role || 'USER',
        ...(formData.password ? { password: formData.password } : {}),
        ...(tenantId ? { tenantId } : {})
      };
      await fetch(endpoint, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyPayload)
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }

    let updated;
    if (isEdit) {
      updated = users.map(u => String(u.id) === String(formData.id) ? { ...u, name: formData.name, email: formData.email, role: formData.role } : u);
    } else {
      const newUser = {
        id: `usr-${Date.now().toString(36)}`,
        name: formData.name,
        email: formData.email,
        role: formData.role || 'USER',
        tenantId: tenantId || 1,
        createdAt: new Date().toISOString()
      };
      updated = [newUser, ...users];
    }

    setUsers(updated);
    localStorage.setItem('scada_users_db', JSON.stringify(updated));
    setShowModal(false);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      const endpoint = `${API_BASE_URL}/users/${selectedUser.id}/permissions`;
      await fetch(endpoint, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissions: config })
      });
    } catch (error) {
      console.error('Error saving permissions API:', error);
    }

    const updated = users.map(u => {
      if (String(u.id) === String(selectedUser.id)) {
        return { ...u, config: { ...(u.config || {}), features: config } };
      }
      return u;
    });
    setUsers(updated);
    localStorage.setItem('scada_users_db', JSON.stringify(updated));
    setActiveTab('list');
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteFormData.email) return;

    const inviteToken = `INV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const expDays = parseInt(inviteFormData.expirationDays) || 7;
    const expiresAt = new Date(Date.now() + expDays * 24 * 60 * 60 * 1000).toISOString();

    const newInvite = {
      id: `inv-${Date.now()}`,
      email: inviteFormData.email,
      role: inviteFormData.role,
      tenantId: tenantId || 1,
      token: inviteToken,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt,
      note: inviteFormData.note || ''
    };

    try {
      await fetch(`${API_BASE_URL}/admin/invitations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newInvite)
      });
    } catch (err) {
      console.warn('API invitation sync failed, saved locally:', err);
    }

    const updated = [newInvite, ...invitations];
    setInvitations(updated);
    localStorage.setItem('scada_invitations_db', JSON.stringify(updated));
    setShowInviteModal(false);
    setInviteFormData({ email: '', role: 'USER', expirationDays: '7', note: '' });
    setActiveTab('invitations');
  };

  const handleRevokeInvitation = (invId) => {
    if (window.confirm('Revoke this invitation?')) {
      const updated = invitations.filter(i => i.id !== invId);
      setInvitations(updated);
      localStorage.setItem('scada_invitations_db', JSON.stringify(updated));
    }
  };

  const handleCopyInviteLink = (invite) => {
    const link = `${window.location.origin}/accept-invite?token=${invite.token}`;
    navigator.clipboard.writeText(link);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || (u.role || '').toUpperCase() === roleFilter.toUpperCase();
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  return (
    <Container fluid className="py-4 user-mgmt-premium">
      <div className="mgmt-header mb-4">
        <Row className="align-items-center">
          <Col md={8}>
            <div className="d-flex align-items-center gap-3">
              <div className="mgmt-icon-glow"><ShieldCheck size={32} /></div>
              <div>
                <h2 className="header-title mb-1">Personnel Management</h2>
                <p className="text-muted mb-0">Control access levels and module visibility for building operators.</p>
              </div>
            </div>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0 position-relative">
            <div className="d-inline-block position-relative" ref={dropdownRef}>
              <Button 
                variant="info" 
                className="rounded-pill px-4 shadow-sm fw-bold d-inline-flex align-items-center gap-2"
                onClick={() => setShowManageDropdown(!showManageDropdown)}
                style={{ background: 'linear-gradient(135deg, #06b6d4, #0284c7)', border: 'none', padding: '0.6rem 1.4rem' }}
              >
                <Settings size={18} />
                <span>Manage Users</span>
                <ChevronDown size={14} style={{ transform: showManageDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
              </Button>

              <AnimatePresence>
                {showManageDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="manage-popover-dropdown shadow-2xl p-3 border rounded-4 position-absolute end-0 mt-2 text-start"
                    style={{ zIndex: 1050, width: '640px', right: 0 }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-25 px-1">
                      <span className="fs-12 fw-bold text-info uppercase tracking-wider d-flex align-items-center gap-2">
                        <Sliders size={14} /> Management Controls
                      </span>
                      <small className="text-muted fs-11">Select an action</small>
                    </div>

                    <Row className="g-2">
                      {/* Card 1: Users */}
                      <Col md={4}>
                        <div 
                          className="manage-hub-card text-center p-3 rounded-4 border h-100"
                          onClick={() => {
                            setShowManageDropdown(false);
                            setActiveTab('list');
                            setFormData({ name: '', email: '', password: '', role: 'USER' });
                            setShowModal(true);
                          }}
                        >
                          <div className="manage-icon-dashed mx-auto mb-2">
                            <UserPlus size={34} strokeWidth={1.4} />
                          </div>
                          <h6 className="fw-bold mb-1 card-title-txt">Users</h6>
                          <p className="text-muted fs-11 mb-0">Create a new user and assign them a role</p>
                        </div>
                      </Col>

                      {/* Card 2: Manage Roles */}
                      <Col md={4}>
                        <div 
                          className="manage-hub-card text-center p-3 rounded-4 border h-100"
                          onClick={() => {
                            setShowManageDropdown(false);
                            if (users.length > 0) handleAction(users[0], 'configure');
                            else setActiveTab('config');
                          }}
                        >
                          <div className="manage-icon-dashed mx-auto mb-2">
                            <Shield size={34} strokeWidth={1.4} />
                          </div>
                          <h6 className="fw-bold mb-1 card-title-txt">Manage Roles</h6>
                          <p className="text-muted fs-11 mb-0">Create new roles with different permissions</p>
                        </div>
                      </Col>

                      {/* Card 3: Manage Organisation */}
                      <Col md={4}>
                        <div 
                          className="manage-hub-card text-center p-3 rounded-4 border h-100"
                          onClick={() => {
                            setShowManageDropdown(false);
                            navigate('/manage-organisation');
                          }}
                        >
                          <div className="manage-icon-dashed mx-auto mb-2">
                            <Building2 size={34} strokeWidth={1.4} />
                          </div>
                          <h6 className="fw-bold mb-1 card-title-txt">Manage Organisation</h6>
                          <p className="text-muted fs-11 mb-0">Create new Company and Client</p>
                        </div>
                      </Col>
                    </Row>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Col>
        </Row>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="scada-tabs mb-4">
        <Tab eventKey="list" title={<><User size={16} className="me-2"/> Operator List ({users.length})</>}>
          <Card className="glass-card border-0">
            <Card.Header className="bg-transparent border-bottom border-light border-opacity-10 p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
               <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ maxWidth: '600px' }}>
                 <InputGroup className="glass-search flex-grow-1">
                   <InputGroup.Text className="bg-transparent border-0 text-muted"><Search size={16} /></InputGroup.Text>
                   <Form.Control placeholder="Filter users..." className="bg-transparent border-0 text-white shadow-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                 </InputGroup>
                 <Form.Select 
                   value={roleFilter} 
                   onChange={(e) => setRoleFilter(e.target.value)}
                   className="scada-input rounded-3 text-white border-secondary border-opacity-25" 
                   style={{ width: '160px', height: '38px', fontSize: '0.82rem' }}
                 >
                   <option value="ALL">All Roles</option>
                   <option value="ADMIN">ADMIN</option>
                   <option value="USER">USER</option>
                   <option value="OPERATOR">OPERATOR</option>
                   <option value="VIEWER">VIEWER</option>
                 </Form.Select>
               </div>
               <Button variant="outline-info" size="sm" className="rounded-pill px-3 fw-bold d-flex align-items-center gap-2" onClick={() => setShowInviteModal(true)}>
                 <Send size={14} /> Send User Invite
               </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center p-5"><Spinner animation="border" variant="info" /></div>
              ) : (
                <Table responsive hover className="scada-table mb-0">
                  <thead>
                    <tr>
                      <th>OPERATOR</th>
                      <th>CONTACT</th>
                      <th>ROLE</th>
                      <th>PERMISSION STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td><div className="fw-bold text-white d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-info bg-opacity-25 text-info d-flex align-items-center justify-content-center fw-bold" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div></td>
                        <td><div className="text-muted small">{user.email}</div></td>
                        <td><Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25 px-3 uppercase">{user.role}</Badge></td>
                        <td>
                          <Badge bg={user.config?.features ? "success" : "secondary"} className="bg-opacity-10 border border-opacity-25 px-3">
                            {user.config?.features ? "Custom Access" : "Standard Access"}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button variant="outline-info" size="sm" onClick={() => handleAction(user, 'configure')} title="Set Permissions"><Settings size={14} /></Button>
                            <Button variant="outline-success" size="sm" onClick={() => handleAction(user, 'view')} title="View as User"><Eye size={14} /></Button>
                            <Button variant="outline-light" size="sm" onClick={() => handleAction(user, 'edit')} title="Edit User"><Edit size={14} /></Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleAction(user, 'delete')} title="Delete User"><Trash2 size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="invitations" title={<><Mail size={16} className="me-2"/> Pending Invitations ({invitations.length})</>}>
          <Card className="glass-card border-0">
            <Card.Header className="bg-transparent border-bottom border-light border-opacity-10 p-3 d-flex justify-content-between align-items-center">
              <span className="text-white fw-bold d-flex align-items-center gap-2">
                <Clock size={16} className="text-info" /> Outstanding User Invitations
              </span>
              <Button variant="info" size="sm" className="rounded-pill px-3 fw-bold d-flex align-items-center gap-2" onClick={() => setShowInviteModal(true)}>
                <Send size={14} /> Send User Invite
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="scada-table mb-0">
                <thead>
                  <tr>
                    <th>INVITED EMAIL</th>
                    <th>ROLE</th>
                    <th>INVITATION LINK / TOKEN</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td><div className="fw-bold text-white d-flex align-items-center gap-2"><Mail size={16} className="text-info"/>{inv.email}</div></td>
                      <td><Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25 px-3 uppercase">{inv.role}</Badge></td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <code className="text-cyan-exact bg-dark px-2 py-1 rounded fs-11">{inv.token}</code>
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="py-0 px-2 fs-11 d-flex align-items-center gap-1"
                            onClick={() => handleCopyInviteLink(inv)}
                          >
                            {copiedInviteId === inv.id ? <><Check size={12}/> Copied</> : <><Copy size={12}/> Copy Link</>}
                          </Button>
                        </div>
                      </td>
                      <td><Badge bg="warning" className="bg-opacity-10 text-warning border border-warning border-opacity-25 px-3 uppercase">{inv.status || 'PENDING'}</Badge></td>
                      <td>
                        <Button variant="outline-danger" size="sm" onClick={() => handleRevokeInvitation(inv.id)} title="Revoke Invite">
                          <XCircle size={14} /> Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {invitations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-400 py-4">No pending invitations. Click "Send User Invite" to invite a user.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="config" title={<><Shield size={16} className="me-2"/> {selectedUser ? `Access: ${selectedUser.name}` : 'Permission Config'}</>} disabled={!selectedUser}>
           {selectedUser && (
             <Card className="glass-card border-0">
               <Card.Body className="p-4">
                  <h5 className="text-info mb-4 d-flex align-items-center gap-2"><Lock size={20}/> Toggle Visible Modules for {selectedUser.name}</h5>
                  <div className="permission-grid">
                    {Object.entries(moduleDetails).map(([key, module]) => (
                      <div key={key} className="permission-item p-3 mb-2 rounded border border-light border-opacity-10 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`p-2 rounded ${config?.[key] ? 'bg-info bg-opacity-10 text-info' : 'bg-secondary bg-opacity-10 text-muted'}`}>{module.icon}</div>
                          <span className={config?.[key] ? 'text-white fw-bold' : 'text-muted'}>{module.label}</span>
                        </div>
                        <button className={`modern-toggle ${config?.[key] ? 'on' : 'off'}`} onClick={() => setConfig({...config, [key]: !config?.[key]})}>
                          <span className="toggle-slider"></span>
                          <span className="toggle-label">{config?.[key] ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="text-end mt-4">
                    <Button variant="secondary" className="me-2 rounded-pill" onClick={() => setActiveTab('list')}>Cancel</Button>
                    <Button variant="info" className="rounded-pill px-5" onClick={handleSavePermissions}><Save size={18} className="me-2"/> Save Access Rules</Button>
                  </div>
               </Card.Body>
             </Card>
           )}
        </Tab>
      </Tabs>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="scada-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25"><Modal.Title className="text-white">{formData.id ? 'Modify Operator' : 'Register New Operator'}</Modal.Title></Modal.Header>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Full Name</Form.Label><Form.Control type="text" className="scada-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Email Address</Form.Label><Form.Control type="email" className="scada-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>{formData.id ? 'New Password (Optional)' : 'Default Password'}</Form.Label><PasswordInput className="scada-input" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!formData.id} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Assigned Role</Form.Label>
              <Form.Select className="scada-input" value={formData.role || 'USER'} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                <option value="USER">Field User / Operator</option>
                <option value="ADMIN">Administrator</option>
                <option value="VIEWER">Viewer</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="info" type="submit">Complete Registration</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* SEND INVITATION MODAL */}
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered className="scada-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="text-white d-flex align-items-center gap-2">
            <Send size={18} className="text-info" /> Send User Invitation
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSendInvitation}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control 
                type="email" 
                className="scada-input" 
                placeholder="user@organization.com"
                value={inviteFormData.email} 
                onChange={(e) => setInviteFormData({...inviteFormData, email: e.target.value})} 
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select 
                className="scada-input" 
                value={inviteFormData.role} 
                onChange={(e) => setInviteFormData({...inviteFormData, role: e.target.value})}
              >
                <option value="USER">Field User / Operator</option>
                <option value="ADMIN">Administrator</option>
                <option value="VIEWER">Viewer</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expiration (Days)</Form.Label>
              <Form.Control 
                type="number" 
                className="scada-input" 
                value={inviteFormData.expirationDays} 
                onChange={(e) => setInviteFormData({...inviteFormData, expirationDays: e.target.value})} 
                min="1" 
                max="30" 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button variant="info" type="submit">Generate Invite Token</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .user-mgmt-premium { color: var(--scada-text); }
        .mgmt-header { background: linear-gradient(135deg, var(--scada-sidebar), var(--scada-bg)); border: 1px solid var(--scada-border); border-radius: 20px; padding: 1.5rem; }
        .mgmt-icon-glow { width: 56px; height: 56px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--scada-accent); }
        .header-title { font-weight: 700; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .glass-card { background: var(--scada-card) !important; border: 1px solid var(--scada-border); border-radius: 16px; overflow: hidden; }
        .scada-table { background: transparent !important; color: var(--scada-text) !important; }
        .scada-table th { background: rgba(255,255,255,0.02) !important; color: var(--scada-text-muted) !important; font-size: 0.7rem; letter-spacing: 0.1rem; text-transform: uppercase; border-bottom: 1px solid var(--scada-border) !important; padding: 1rem !important; }
        .scada-table td { border-color: var(--scada-border) !important; padding: 1rem !important; vertical-align: middle; background: transparent !important; color: var(--scada-text) !important; }
        .scada-table tr:hover { background: rgba(255,255,255,0.02) !important; }
        .scada-tabs .nav-link { color: var(--scada-text-muted); border: 0; padding: 1rem 1.5rem; font-weight: 600; transition: 0.3s; }
        .scada-tabs .nav-link.active { background: rgba(56, 189, 248, 0.1); color: var(--scada-accent); border-bottom: 2px solid var(--scada-accent); }
        .permission-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .modern-toggle { width: 80px; height: 32px; background: var(--scada-bg); border: 1px solid var(--scada-border); border-radius: 100px; position: relative; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; overflow: hidden; }
        .modern-toggle.on { background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.4); }
        .toggle-slider { position: absolute; width: 24px; height: 24px; background: var(--scada-text-muted); border-radius: 50%; left: 4px; transition: 0.3s; z-index: 2; }
        .on .toggle-slider { left: 52px; background: var(--scada-accent); box-shadow: 0 0 10px rgba(56, 189, 248, 0.5); }
        .toggle-label { width: 100%; font-size: 0.6rem; font-weight: 800; text-align: center; padding-left: 24px; color: var(--scada-text-muted); transition: 0.3s; }
        .on .toggle-label { padding-left: 0; padding-right: 24px; color: var(--scada-accent); }
        .scada-modal .modal-content { background: var(--scada-bg); border: 1px solid var(--scada-border); border-radius: 16px; }
        .scada-input { background: rgba(255,255,255,0.05); border: 1px solid var(--scada-border); color: var(--scada-text); }
        .scada-input:focus { background: rgba(255,255,255,0.08); border-color: var(--scada-accent); color: var(--scada-text); box-shadow: 0 0 0 0.25rem rgba(56, 189, 248, 0.15); }

        /* ── MANAGE POPOVER DROPDOWN (ANCHORED RIGHT BELOW BUTTON) ── */
        .manage-popover-dropdown {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55) !important;
        }
        body.light-mode .manage-popover-dropdown {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15) !important;
        }

        .manage-hub-card {
          background: rgba(30, 41, 59, 0.7);
          border-color: rgba(255, 255, 255, 0.12) !important;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 1.25rem 0.85rem !important;
        }
        body.light-mode .manage-hub-card {
          background: #f8fafc;
          border-color: #e2e8f0 !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        }
        .manage-hub-card:hover {
          transform: translateY(-3px);
          border-color: #06b6d4 !important;
          box-shadow: 0 10px 22px rgba(6, 182, 212, 0.25);
        }
        body.light-mode .manage-hub-card:hover {
          background: #ffffff;
          border-color: #0284c7 !important;
          box-shadow: 0 10px 22px rgba(2, 132, 199, 0.15);
        }
        .manage-icon-dashed {
          width: 76px;
          height: 76px;
          border-radius: 16px;
          border: 2px dashed rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #38bdf8;
          background: rgba(0, 0, 0, 0.25);
          transition: all 0.25s ease;
        }
        body.light-mode .manage-icon-dashed {
          border-color: #cbd5e1;
          background: #ffffff;
          color: #0284c7;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .manage-hub-card:hover .manage-icon-dashed {
          border-color: #06b6d4;
          color: #38bdf8;
          transform: scale(1.05);
          box-shadow: 0 0 18px rgba(6, 182, 212, 0.35);
        }
        body.light-mode .manage-hub-card:hover .manage-icon-dashed {
          border-color: #0284c7;
          color: #0284c7;
        }
        .card-title-txt {
          color: #ffffff;
          font-size: 1.05rem;
        }
        body.light-mode .card-title-txt {
          color: #1e293b;
        }

        /* ── LIGHT MODE COMPREHENSIVE OVERRIDES FOR HIGH CONTRAST & READABILITY ── */
        body.light-mode .user-mgmt-premium {
          color: #0f172a !important;
        }
        body.light-mode .mgmt-header {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04) !important;
        }
        body.light-mode .header-title {
          background: none !important;
          -webkit-background-clip: unset !important;
          -webkit-text-fill-color: #0f172a !important;
          color: #0f172a !important;
        }
        body.light-mode .mgmt-header p.text-muted {
          color: #475569 !important;
        }
        body.light-mode .glass-card {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.04) !important;
        }
        body.light-mode .glass-card .card-header {
          border-bottom-color: #f1f5f9 !important;
        }
        body.light-mode .scada-table th {
          background: #f8fafc !important;
          color: #475569 !important;
          border-bottom: 1px solid #e2e8f0 !important;
          font-weight: 700;
        }
        body.light-mode .scada-table td {
          border-bottom: 1px solid #f1f5f9 !important;
          color: #1e293b !important;
        }
        body.light-mode .scada-table tr:hover {
          background: #f8fafc !important;
        }
        body.light-mode .scada-table td .text-white {
          color: #0f172a !important;
        }
        body.light-mode .scada-table td .text-muted {
          color: #64748b !important;
        }
        body.light-mode .scada-tabs .nav-link {
          color: #64748b !important;
        }
        body.light-mode .scada-tabs .nav-link:hover {
          color: #0284c7 !important;
        }
        body.light-mode .scada-tabs .nav-link.active {
          background: rgba(2, 132, 199, 0.08) !important;
          color: #0284c7 !important;
          border-bottom: 2px solid #0284c7 !important;
        }
        body.light-mode .glass-search {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px;
        }
        body.light-mode .glass-search .form-control {
          color: #0f172a !important;
        }
        body.light-mode .glass-search .form-control::placeholder {
          color: #94a3b8 !important;
        }
        body.light-mode select.scada-input {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
        }
        body.light-mode select.scada-input option {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        body.light-mode .badge.bg-info {
          background-color: rgba(2, 132, 199, 0.12) !important;
          color: #0284c7 !important;
          border: 1px solid rgba(2, 132, 199, 0.3) !important;
        }
        body.light-mode .badge.bg-success {
          background-color: rgba(22, 163, 74, 0.12) !important;
          color: #16a34a !important;
          border: 1px solid rgba(22, 163, 74, 0.3) !important;
        }
        body.light-mode .badge.bg-secondary {
          background-color: rgba(100, 116, 139, 0.12) !important;
          color: #475569 !important;
          border: 1px solid rgba(100, 116, 139, 0.3) !important;
        }
        body.light-mode .badge.bg-warning {
          background-color: rgba(217, 119, 6, 0.12) !important;
          color: #d97706 !important;
          border: 1px solid rgba(217, 119, 6, 0.3) !important;
        }
        body.light-mode .btn-outline-info {
          color: #0284c7 !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .btn-outline-info:hover {
          background: #0284c7 !important;
          color: #ffffff !important;
        }
        body.light-mode .btn-outline-success {
          color: #16a34a !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .btn-outline-success:hover {
          background: #16a34a !important;
          color: #ffffff !important;
        }
        body.light-mode .btn-outline-light {
          color: #475569 !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .btn-outline-light:hover {
          background: #e2e8f0 !important;
          color: #0f172a !important;
        }
        body.light-mode .btn-outline-danger {
          color: #dc2626 !important;
          border-color: #fca5a5 !important;
        }
        body.light-mode .btn-outline-danger:hover {
          background: #dc2626 !important;
          color: #ffffff !important;
        }
        body.light-mode .scada-modal .modal-content {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
        }
        body.light-mode .scada-modal .modal-header {
          border-bottom-color: #e2e8f0 !important;
        }
        body.light-mode .scada-modal .modal-header .modal-title {
          color: #0f172a !important;
        }
        body.light-mode .scada-modal .modal-footer {
          border-top-color: #e2e8f0 !important;
        }
        body.light-mode .scada-modal label {
          color: #334155 !important;
          font-weight: 600;
        }
        body.light-mode .scada-modal .scada-input {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .permission-item {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .permission-item .text-white {
          color: #0f172a !important;
        }
        body.light-mode .permission-item .text-muted {
          color: #64748b !important;
        }
        body.light-mode .modern-toggle {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        body.light-mode .modern-toggle.on {
          background: rgba(2, 132, 199, 0.15);
          border-color: rgba(2, 132, 199, 0.4);
        }
      `}} />
    </Container>
  );
};

export default UserManagement;
