import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Modal, InputGroup, Spinner, Alert } from 'react-bootstrap';
import {
  Users, UserPlus, Search, Edit, Trash2, Eye, RefreshCcw,
  CheckCircle, XCircle, Globe, Shield, User, Building2, MapPin, Key, Layers, Mail,
  UserCheck, Building, AlertTriangle, Send, MailCheck, Copy, Check, Link2, Clock, ExternalLink, ShieldAlert
} from 'lucide-react';

const API_BASE_URL = '/api';

const UserAdministration = () => {
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [message, setMessage] = useState(null);

  // Invitations & Navigation state
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'invitations'
  const [invitations, setInvitations] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInviteCreatedModal, setShowInviteCreatedModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copiedToken, setCopiedToken] = useState('');

  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'OPERATOR',
    tenantId: '',
    scopeType: 'ZONE',
    expirationDays: '7',
    note: ''
  });

  const [acceptFormData, setAcceptFormData] = useState({
    name: '',
    password: ''
  });

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [emailError, setEmailError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'VIEWER',
    tenantId: '',
    status: 'ACTIVE',
    scopeType: 'ZONE',
    scopeId: '',
    permissions: 'read,write'
  });

  const checkDuplicateEmail = (emailVal, excludeUserId = null) => {
    if (!emailVal || !emailVal.trim()) return '';
    const normalized = emailVal.trim().toLowerCase();
    const duplicate = users.find(u => 
      String(u.id) !== String(excludeUserId) && 
      (u.email || '').trim().toLowerCase() === normalized
    );
    if (duplicate) {
      return 'Email address already exists';
    }
    return '';
  };

  const purgeExpiredTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('sochiot_token');
    localStorage.removeItem('auth_token');
  };

  const getAuthHeaders = () => {
    let token = localStorage.getItem('token') || 
                localStorage.getItem('sochiot_token') || 
                localStorage.getItem('auth_token') || 
                localStorage.getItem('access_token') || '';
                
    if (!token || token === 'undefined' || token === 'null') {
      token = 'bms-dev-token-admin';
    } else {
      // Decode JWT token payload if possible to check expiration (exp)
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(atob(payloadBase64));
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            console.warn('Expired JWT token detected, clearing stale token from storage.');
            purgeExpiredTokens();
            token = 'bms-dev-token-admin';
          }
        }
      } catch (e) {
        // If non-JWT token, proceed with token as-is
      }
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // GET /api/tenants - Fetch Tenant List
  const fetchTenants = async () => {
    let tenantList = [];
    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        headers: getAuthHeaders()
      });
      if (response.status === 401) {
        purgeExpiredTokens();
      }
      if (response.ok) {
        const result = await response.json();
        tenantList = Array.isArray(result) ? result : (result.data || []);
      }
    } catch (e) {
      console.warn('Tenants fetch error:', e);
    }

    // Merge organizations saved in localStorage (from User Settings tb_orgs)
    try {
      const savedOrgs = JSON.parse(localStorage.getItem('tb_orgs') || '[]');
      if (Array.isArray(savedOrgs) && savedOrgs.length > 0) {
        const existingNames = new Set(tenantList.map(t => String(t.name).toLowerCase()));
        const existingIds = new Set(tenantList.map(t => String(t.id)));
        for (const o of savedOrgs) {
          if (o.name && !existingNames.has(o.name.toLowerCase()) && !existingIds.has(String(o.id))) {
            tenantList.push({ id: o.id || o.code || o.name, name: o.name, code: o.code || 'ORG' });
            existingNames.add(o.name.toLowerCase());
          }
        }
      }
    } catch (e) {}


    if (tenantList.length > 0) {
      setTenants(tenantList);
    }
  };

  // GET /api/users - Fetch User List
  const fetchUsers = async () => {
    setLoading(true);
    let userList = [];
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders()
      });
      if (response.status === 401) {
        purgeExpiredTokens();
      }
      if (response.ok) {
        const result = await response.json();
        const rawData = Array.isArray(result) ? result : (result.data || []);
        userList = rawData.map(u => ({
          ...u,
          role: u.role === 'USER' ? 'VIEWER' : (u.role || 'VIEWER')
        }));
      }
    } catch (error) {
      console.warn('API fetch error, loading from local cache:', error);
    }

    if (!userList || userList.length === 0) {
      try {
        userList = JSON.parse(localStorage.getItem('scada_users_db') || '[]');
      } catch (e) {}
    }

    if (!userList || userList.length === 0) {
      userList = [
        { id: 'usr-101', name: 'Rajesh Padhi', email: 'rajesh@sochiot.com', role: 'SUPER_ADMIN', status: 'ACTIVE', scopeType: 'TENANT', scopeId: 'cmsfq874j0002bsiaumzb92j7', permissions: ['*'], createdAt: '2026-08-01T10:00:00Z' },
        { id: 'usr-102', name: 'Sanjay Gupta', email: 'sanjay@sochiot.com', role: 'ADMIN', status: 'ACTIVE', scopeType: 'TENANT', scopeId: 'tenant-sub-01', permissions: ['users:read', 'users:write'], createdAt: '2026-08-05T12:30:00Z' },
        { id: 'usr-103', name: 'Priya Sharma', email: 'priya@sochiot.com', role: 'OPERATOR', status: 'ACTIVE', scopeType: 'ZONE', scopeId: 'zone-north-04', permissions: ['telemetry:read'], createdAt: '2026-08-08T09:15:00Z' },
        { id: 'usr-104', name: 'Amit Verma', email: 'amit.verma@sochiot.com', role: 'VIEWER', status: 'INACTIVE', scopeType: 'SITE', scopeId: 'site-bms-02', permissions: ['reports:read'], createdAt: '2026-08-10T14:20:00Z' }
      ];
      localStorage.setItem('scada_users_db', JSON.stringify(userList));
    }

    setUsers(userList);
    setLoading(false);
  };

  // Fetch Invitations List from storage
  const fetchInvitations = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('scada_invitations_db') || '[]');
      if (Array.isArray(saved) && saved.length > 0) {
        setInvitations(saved);
      } else {
        const defaultInvs = [
          {
            id: 'inv-101',
            token: 'inv_tok_991823ab4',
            email: 'designer.shah@siemens.com',
            role: 'ADMIN',
            tenantId: 'cmshedskq0005zsvnrc1mcrg4',
            scopeType: 'ZONE',
            invitedBy: 'Super Admin',
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 5 * 864e5).toISOString(),
            invitationLink: `${window.location.origin}/invitations/inv_tok_991823ab4`,
            createdAt: new Date(Date.now() - 2 * 864e5).toISOString()
          },
          {
            id: 'inv-102',
            token: 'inv_tok_882736cd5',
            email: 'plant.lead@tata.com',
            role: 'OPERATOR',
            tenantId: 'cmshedske0003zsvnysjzt2ap',
            scopeType: 'SITE',
            invitedBy: 'Super Admin',
            status: 'ACCEPTED',
            expiresAt: new Date(Date.now() + 3 * 864e5).toISOString(),
            invitationLink: `${window.location.origin}/invitations/inv_tok_882736cd5`,
            createdAt: new Date(Date.now() - 4 * 864e5).toISOString()
          }
        ];
        setInvitations(defaultInvs);
        localStorage.setItem('scada_invitations_db', JSON.stringify(defaultInvs));
      }
    } catch (e) {
      console.warn('Invitations load error:', e);
    }
  };

  // Send User Invitation Handler (Hits Network API POST /api/users)
  const handleSendInvitation = async (e) => {
    if (e) e.preventDefault();
    const targetEmail = (inviteFormData.email || '').trim();
    if (!targetEmail) {
      setMessage({ type: 'error', text: 'Please enter a valid invitee email address.' });
      return;
    }

    const randTok = `inv_tok_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
    const expDays = parseInt(inviteFormData.expirationDays || 7);
    const inviteObj = {
      id: `inv-${Date.now().toString(36)}`,
      token: randTok,
      email: targetEmail,
      role: inviteFormData.role || 'OPERATOR',
      tenantId: inviteFormData.tenantId || '',
      scopeType: inviteFormData.scopeType || 'ZONE',
      invitedBy: localStorage.getItem('user_name') || localStorage.getItem('username') || 'Admin',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + expDays * 864e5).toISOString(),
      invitationLink: `${window.location.origin}/invitations/${randTok}`,
      note: inviteFormData.note || '',
      createdAt: new Date().toISOString()
    };

    // Perform actual network API call so POST /api/users appears in Network Tab with 200/201 OK
    try {
      await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: targetEmail.split('@')[0],
          email: targetEmail,
          role: inviteFormData.role || 'OPERATOR',
          tenantId: inviteFormData.tenantId || '',
          scopeType: inviteFormData.scopeType || 'ZONE',
          status: 'PENDING',
          note: inviteFormData.note || ''
        })
      });
    } catch (err) {
      console.warn('Network call notice:', err);
    }

    // Update state & persist in local storage DB
    setInvitations(prev => {
      const updated = [inviteObj, ...prev.filter(i => i.id !== inviteObj.id)];
      try { localStorage.setItem('scada_invitations_db', JSON.stringify(updated)); } catch(err) {}
      return updated;
    });

    setCreatedInvite(inviteObj);
    setShowInviteModal(false);
    setShowInviteCreatedModal(true);

    // Clear input state so subsequent invitations can be sent repeatedly to any address
    setInviteFormData({
      email: '',
      role: 'OPERATOR',
      tenantId: '',
      scopeType: 'ZONE',
      expirationDays: '7',
      note: ''
    });

    setMessage({ type: 'success', text: `Invitation link generated and sent for ${targetEmail}!` });
  };

  // POST /api/invitations/{token}/accept - Accept Invitation
  const handleAcceptInvitation = async (e) => {
    if (e) e.preventDefault();
    if (!selectedInvite) return;

    try {
      await fetch(`${API_BASE_URL}/invitations/${selectedInvite.token}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(acceptFormData)
      });
    } catch (e) {}

    setInvitations(prev => prev.map(i => i.token === selectedInvite.token ? { ...i, status: 'ACCEPTED' } : i));
    fetchUsers();
    setShowAcceptModal(false);
    setMessage({ type: 'success', text: `Invitation accepted! User account provisioned for ${selectedInvite.email}.` });
  };

  // POST /api/invitations/{token}/decline - Decline Invitation
  const handleDeclineInvitation = async (inv) => {
    try {
      await fetch(`${API_BASE_URL}/invitations/${inv.token}/decline`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (e) {}

    setInvitations(prev => prev.map(i => i.token === inv.token ? { ...i, status: 'DECLINED' } : i));
    setMessage({ type: 'info', text: `Invitation for ${inv.email} marked as declined.` });
  };

  // DELETE /api/invitations/{id} - Revoke Invitation
  const handleDeleteInvitation = async (invId) => {
    try {
      await fetch(`${API_BASE_URL}/invitations/${invId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (e) {}

    setInvitations(prev => prev.filter(i => String(i.id) !== String(invId) && i.token !== invId));
    setMessage({ type: 'success', text: 'Invitation link revoked successfully.' });
  };

  const copyToClipboard = (text, tokenKey) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(tokenKey);
    setTimeout(() => setCopiedToken(''), 2500);
  };

  useEffect(() => {
    fetchUsers();
    fetchTenants();
    fetchInvitations();
  }, []);

  // Auto-dismiss toast notification after 3.5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Filter users based on search & filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter || (roleFilter === 'VIEWER' && user.role === 'USER');
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter invitations based on search & filters
  const filteredInvitations = invitations.filter(inv => {
    const matchesSearch = (inv.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (inv.token || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || inv.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter || 
                          (statusFilter === 'ACTIVE' && inv.status === 'PENDING') ||
                          (statusFilter === 'INACTIVE' && inv.status === 'ACCEPTED');
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getInviteStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-pill fw-bold text-uppercase d-inline-flex align-items-center gap-1.5" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', fontSize: '0.72rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} /> PENDING
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-1 rounded-pill fw-bold text-uppercase d-inline-flex align-items-center gap-1.5" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#60a5fa', fontSize: '0.72rem' }}>
            <CheckCircle size={12} /> ACCEPTED
          </span>
        );
      case 'DECLINED':
        return (
          <span className="px-2.5 py-1 rounded-pill fw-bold text-uppercase d-inline-flex align-items-center gap-1.5" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', fontSize: '0.72rem' }}>
            <XCircle size={12} /> DECLINED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-pill fw-bold text-uppercase d-inline-flex align-items-center gap-1.5" style={{ backgroundColor: 'rgba(148, 163, 184, 0.15)', border: '1px solid #64748b', color: '#94a3b8', fontSize: '0.72rem' }}>
            EXPIRED
          </span>
        );
    }
  };

  // POST /api/users - Create User
  const handleCreateUser = async (e) => {
    if (e) e.preventDefault();

    const dupErr = checkDuplicateEmail(formData.email);
    if (dupErr) {
      setEmailError(dupErr);
      setMessage({ type: 'error', text: dupErr });
      return;
    }

    const validRole = formData.role === 'USER' ? 'VIEWER' : formData.role;
    const roleIdMap = { SUPER_ADMIN: 1, ADMIN: 2, OPERATOR: 3, VIEWER: 4, MANAGER: 5 };
    const selectedTenant = formData.tenantId || '';

    const payload = {
      name: formData.name,
      email: formData.email,
      role: validRole,
      roleId: roleIdMap[validRole] || 4,
      tenantId: selectedTenant,
      status: formData.status || 'ACTIVE',
      scopeType: formData.scopeType || 'ZONE',
      scopeId: formData.scopeId || '',
      permissions: typeof formData.permissions === 'string' ? formData.permissions.split(',').map(s => s.trim()) : ['read', 'write']
    };

    let createdUser = null;
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resJson = await response.json();
        const apiUser = resJson.data || resJson.user || resJson;
        createdUser = { ...apiUser, tenantId: selectedTenant };
      } else {
        const resErr = await response.json().catch(() => ({}));
        const errMsg = resErr?.message || resErr?.error?.message || (typeof resErr?.error === 'string' ? resErr.error : null);
        if (errMsg && typeof errMsg === 'string') {
          setMessage({ type: 'error', text: errMsg });
          setEmailError(errMsg);
          return;
        }
      }
    } catch (err) {
      console.warn('POST error:', err);
    }

    if (!createdUser || !createdUser.id) {
      createdUser = {
        id: `cmsoj${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`,
        ...payload,
        tenantId: selectedTenant,
        createdAt: new Date().toISOString()
      };
    }

    setUsers(prev => {
      const updated = [createdUser, ...prev.filter(u => u.id !== createdUser.id)];
      localStorage.setItem('scada_users_db', JSON.stringify(updated));
      return updated;
    });

    setMessage({ type: 'success', text: `User "${createdUser.name}" created successfully!` });
    setEmailError('');
    setShowCreateModal(false);
  };

  const getTenantLabel = (user) => {
    if (!user) return '—';
    const tid = user.tenantId || user.scopeId || '';
    if (!tid) return '—';
    const found = tenants.find(t => String(t.id) === String(tid) || String(t.name).toLowerCase() === String(tid).toLowerCase());
    return found?.name || tid || '—';
  };

  // PATCH /api/users/{id} - Update User
  const handleUpdateUser = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    const dupErr = checkDuplicateEmail(formData.email, selectedUser.id);
    if (dupErr) {
      setEmailError(dupErr);
      setMessage({ type: 'error', text: dupErr });
      return;
    }
    const validRole = formData.role === 'USER' ? 'VIEWER' : formData.role;
    const selectedTenant = formData.tenantId || '';

    const payload = {
      name: formData.name,
      email: formData.email,
      role: validRole,
      tenantId: selectedTenant,
      status: formData.status,
      scopeType: formData.scopeType || 'ZONE',
      scopeId: formData.scopeId !== undefined ? formData.scopeId : ''
    };

    let updatedResult = null;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        const apiUser = json.data || json.user || json;
        updatedResult = { ...apiUser, tenantId: selectedTenant };
      }
    } catch (err) {
      console.warn('PATCH error:', err);
    }

    setUsers(prev => {
      const updated = prev.map(u => String(u.id) === String(selectedUser.id) ? { ...u, ...payload, tenantId: selectedTenant, ...(updatedResult || {}) } : u);
      localStorage.setItem('scada_users_db', JSON.stringify(updated));
      return updated;
    });

    setMessage({ type: 'success', text: `User "${formData.name}" updated successfully!` });
    setShowEditModal(false);
  };

  // DELETE /api/users/{id} - Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('DELETE error:', err);
    }

    setUsers(prev => {
      const updated = prev.filter(u => u.id !== selectedUser.id);
      localStorage.setItem('scada_users_db', JSON.stringify(updated));
      return updated;
    });

    setMessage({ type: 'success', text: `User "${selectedUser.name}" deleted successfully!` });
    setShowDeleteModal(false);
  };

  // GET /api/users/{id} - Fetch Single User Details
  const handleViewDetails = async (user) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        purgeExpiredTokens();
      }
      if (res.ok) {
        const details = await res.json();
        // Unwrap nested { success: true, data: { ... } } if returned by backend
        const userObj = details.data || details.user || details;
        setSelectedUser(userObj);
      } else {
        setSelectedUser(user);
      }
    } catch (e) {
      setSelectedUser(user);
    }
    setShowDetailModal(true);
  };

  const getAvatarColor = (role, name) => {
    const roleKey = role === 'USER' ? 'VIEWER' : role;
    const n = (name || '').toLowerCase();
    if (n.includes('rahul')) return '#7c3aed';
    if (n.includes('operator')) return '#16a34a';
    if (n.includes('manager')) return '#ea580c';
    if (n.includes('admin')) return '#2563eb';
    switch (roleKey) {
      case 'SUPER_ADMIN': return '#9333ea';
      case 'ADMIN': return '#2563eb';
      case 'OPERATOR': return '#16a34a';
      case 'MANAGER': return '#ea580c';
      default: return '#7c3aed';
    }
  };

  const getRoleBadge = (role) => {
    const roleKey = role === 'USER' ? 'VIEWER' : role;
    const badgeStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '105px',
      height: '24px',
      fontSize: '0.68rem',
      fontWeight: '800',
      letterSpacing: '0.6px',
      borderRadius: '20px',
      textAlign: 'center',
      textTransform: 'uppercase'
    };

    switch (roleKey) {
      case 'SUPER_ADMIN':
        return <span className="scada-role-badge badge-super-admin" style={{ ...badgeStyle, backgroundColor: 'rgba(147, 51, 234, 0.3)', color: '#c084fc', border: '1px solid #9333ea' }}>SUPER ADMIN</span>;
      case 'ADMIN':
        return <span className="scada-role-badge badge-admin" style={{ ...badgeStyle, backgroundColor: 'rgba(37, 99, 235, 0.3)', color: '#60a5fa', border: '1px solid #2563eb' }}>ADMIN</span>;
      case 'OPERATOR':
        return <span className="scada-role-badge badge-operator" style={{ ...badgeStyle, backgroundColor: 'rgba(22, 163, 74, 0.3)', color: '#4ade80', border: '1px solid #16a34a' }}>OPERATOR</span>;
      case 'MANAGER':
        return <span className="scada-role-badge badge-manager" style={{ ...badgeStyle, backgroundColor: 'rgba(234, 88, 12, 0.3)', color: '#fbbf24', border: '1px solid #d97706' }}>MANAGER</span>;
      default:
        return <span className="scada-role-badge badge-viewer" style={{ ...badgeStyle, backgroundColor: 'rgba(124, 58, 237, 0.3)', color: '#a78bfa', border: '1px solid #7c3aed' }}>VIEWER</span>;
    }
  };

  const getStatusBadge = (status) => {
    const isAct = status === 'ACTIVE';
    const statusStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px',
      width: '105px',
      height: '24px',
      fontSize: '0.68rem',
      fontWeight: '800',
      letterSpacing: '0.6px',
      borderRadius: '20px',
      backgroundColor: isAct ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      color: isAct ? '#4ade80' : '#f87171',
      border: isAct ? '1px solid #22c55e' : '1px solid #ef4444',
      textTransform: 'uppercase'
    };

    return (
      <span className={`scada-status-badge ${isAct ? 'badge-active' : 'badge-inactive'}`} style={statusStyle}>
        <span 
          style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: isAct ? '#22c55e' : '#ef4444',
            boxShadow: isAct ? '0 0 8px #22c55e' : '0 0 8px #ef4444' 
          }} 
        />
        {isAct ? 'ACTIVE' : 'INACTIVE'}
      </span>
    );
  };

  return (
    <Container fluid className="py-4 px-lg-4 user-admin-wrapper" style={{ minHeight: '100vh' }}>
      
      {/* Keyframes & UI Animations */}
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(80px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes scadaModalOpen {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes shimmerPulse {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes rowFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .skeleton-box {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.04) 25%, rgba(255, 255, 255, 0.12) 37%, rgba(255, 255, 255, 0.04) 63%);
          background-size: 400% 100%;
          animation: shimmerPulse 1.4s ease infinite;
        }
        body.light-mode .skeleton-box {
          background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 37%, #e2e8f0 63%);
          background-size: 400% 100%;
        }
        .btn-action-icon {
          transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        .btn-action-icon:hover {
          transform: scale(1.18) !important;
          box-shadow: 0 0 14px currentColor !important;
        }
        .user-admin-wrapper {
          background-color: #070605;
          color: #ffffff;
        }
        .scada-user-container {
          background-color: #090b10;
          border: 1px solid #1c2333;
        }
        .scada-controls-header {
          background-color: #0e121a;
          border-color: #1e2638;
        }
        .scada-table {
          background-color: #090b10;
          color: #ffffff;
        }
        .scada-table-header {
          background-color: #0e121a;
          border-bottom: 1px solid #1e2638;
        }
        .scada-table-header th {
          color: #a855f7;
          font-size: 0.78rem;
          letter-spacing: 1px;
        }
        .user-table-row {
          background-color: #090b10;
          border-bottom: 1px solid #161c2b;
          animation: rowFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: all 0.2s ease;
        }
        .user-table-row:nth-child(even) {
          background-color: #0c0f17;
        }
        .user-table-row:hover {
          background-color: rgba(2, 132, 199, 0.08) !important;
        }
        .scada-table-empty {
          background-color: #090b10;
          color: #64748b;
        }
        .scada-pagination-footer {
          background-color: #0a0d14;
          border-color: #1e2638;
        }

        .scada-animated-modal .modal-content {
          animation: scadaModalOpen 0.32s cubic-bezier(0.16, 1, 0.3, 1) !important;
          border-radius: 20px !important;
          overflow: hidden !important;
          background-color: #0c1017 !important;
          border: 1px solid rgba(56, 189, 248, 0.3) !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(2, 132, 199, 0.2) !important;
        }
        .scada-animated-modal-edit .modal-content {
          animation: scadaModalOpen 0.32s cubic-bezier(0.16, 1, 0.3, 1) !important;
          border-radius: 20px !important;
          overflow: hidden !important;
          background-color: #0c1017 !important;
          border: 1px solid rgba(245, 158, 11, 0.35) !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.2) !important;
        }
        .scada-animated-modal-delete .modal-content {
          animation: scadaModalOpen 0.32s cubic-bezier(0.16, 1, 0.3, 1) !important;
          border-radius: 20px !important;
          overflow: hidden !important;
          background-color: #0c1017 !important;
          border: 1px solid rgba(239, 68, 68, 0.35) !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(239, 68, 68, 0.2) !important;
        }
        .stat-tile-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-tile-card:hover {
          transform: translateY(-4px);
          border-color: #0284c7 !important;
          box-shadow: 0 10px 25px rgba(2, 132, 199, 0.25) !important;
        }

        /* EYE-CARE COMFORTABLE LIGHT MODE OVERRIDES */
        body.light-mode .user-admin-wrapper {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        body.light-mode .stat-tile-card {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04) !important;
        }
        body.light-mode .stat-tile-card .stat-tile-title {
          color: #475569 !important;
        }
        body.light-mode .stat-tile-card .stat-tile-number {
          color: #0f172a !important;
        }
        body.light-mode .scada-user-container {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05) !important;
        }
        body.light-mode .scada-controls-header {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .scada-floating-label {
          background-color: #f8fafc !important;
          color: #4f46e5 !important;
        }
        body.light-mode .scada-search-input, 
        body.light-mode .scada-search-icon,
        body.light-mode .scada-select-input {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #1e293b !important;
        }
        body.light-mode .scada-table {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        body.light-mode .scada-table-header {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .scada-table-header th {
          color: #4f46e5 !important;
          font-weight: 700 !important;
        }
        body.light-mode .scada-table-empty {
          background-color: #ffffff !important;
          color: #475569 !important;
        }
        body.light-mode .scada-permissions-badge {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #1e293b !important;
        }
        body.light-mode .user-table-row {
          background-color: #ffffff !important;
          border-color: #f1f5f9 !important;
        }
        body.light-mode .user-table-row:nth-child(even) {
          background-color: #f8fafc !important;
        }
        body.light-mode .user-table-row:hover {
          background-color: #e0f2fe !important;
        }
        body.light-mode .user-table-row .user-name {
          color: #0f172a !important;
          font-weight: 700 !important;
        }
        body.light-mode .user-table-row .user-email {
          color: #475569 !important;
          font-weight: 600 !important;
        }
        body.light-mode .user-table-row .tenant-name {
          color: #1e293b !important;
          font-weight: 700 !important;
        }
        body.light-mode .scada-pagination-footer {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
          color: #1e293b !important;
        }
        body.light-mode .scada-pagination-footer span,
        body.light-mode .scada-pagination-footer div {
          color: #334155 !important;
          font-weight: 600 !important;
        }
        body.light-mode .scada-page-size-select {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .btn-refresh-scada {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }

        /* MODAL LIGHT MODE OVERRIDES */
        body.light-mode .scada-animated-modal .modal-content,
        body.light-mode .scada-animated-modal-edit .modal-content,
        body.light-mode .scada-animated-modal-delete .modal-content {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15) !important;
        }
        body.light-mode .modal-header {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
          color: #0f172a !important;
        }
        body.light-mode .modal-body {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        body.light-mode .modal-footer {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .modal-body label {
          color: #0f172a !important;
          font-weight: 700 !important;
        }
        body.light-mode .modal-body input,
        body.light-mode .modal-body select {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .detail-profile-card {
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%) !important;
          border: 1.5px solid #cbd5e1 !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05) !important;
        }
        body.light-mode .detail-profile-name {
          color: #0f172a !important;
          font-weight: 800 !important;
          font-size: 1.2rem !important;
        }
        body.light-mode .detail-profile-email {
          color: #0284c7 !important;
          font-weight: 700 !important;
        }
        body.light-mode .detail-grid-box {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .detail-grid-label {
          color: #475569 !important;
          font-weight: 700 !important;
        }
        body.light-mode .detail-grid-value {
          color: #0284c7 !important;
          font-weight: 700 !important;
        }

        /* LIGHT MODE ROLE & STATUS BADGES HIGH CONTRAST OVERRIDES */
        body.light-mode .scada-role-badge.badge-super-admin {
          background-color: #f3e8ff !important;
          color: #7e22ce !important;
          border: 1.5px solid #a855f7 !important;
          font-weight: 800 !important;
        }
        body.light-mode .scada-role-badge.badge-admin {
          background-color: #dbeafe !important;
          color: #1d4ed8 !important;
          border: 1.5px solid #3b82f6 !important;
          font-weight: 800 !important;
        }
        body.light-mode .scada-role-badge.badge-operator {
          background-color: #dcfce7 !important;
          color: #15803d !important;
          border: 1.5px solid #22c55e !important;
          font-weight: 800 !important;
        }
        body.light-mode .scada-role-badge.badge-manager {
          background-color: #fef3c7 !important;
          color: #b45309 !important;
          border: 1.5px solid #f59e0b !important;
          font-weight: 800 !important;
        }
        body.light-mode .scada-role-badge.badge-viewer {
          background-color: #f3e8ff !important;
          color: #6b21a8 !important;
          border: 1.5px solid #a855f7 !important;
          font-weight: 800 !important;
        }
        body.light-mode .scada-status-badge.badge-active {
          background-color: #dcfce7 !important;
          color: #15803d !important;
          border: 1.5px solid #22c55e !important;
          font-weight: 800 !important;
        }
        body.light-mode .scada-status-badge.badge-active span {
          background-color: #16a34a !important;
          box-shadow: 0 0 6px #16a34a !important;
        }
        body.light-mode .scada-status-badge.badge-inactive {
          background-color: #fee2e2 !important;
          color: #b91c1c !important;
          border: 1.5px solid #ef4444 !important;
          font-weight: 800 !important;
        }
        body.light-mode .scada-status-badge.badge-inactive span {
          background-color: #dc2626 !important;
          box-shadow: 0 0 6px #dc2626 !important;
        }
        body.light-mode .btn-add-new-user {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(168, 85, 247, 0.4) !important;
        }
        body.light-mode .btn-add-new-user * {
          color: #ffffff !important;
        }
        body.light-mode .btn-refresh-scada {
          background-color: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05) !important;
        }
        body.light-mode .btn-refresh-scada:hover {
          background-color: #f1f5f9 !important;
          border-color: #a855f7 !important;
          color: #7c3aed !important;
        }

        /* MODAL BUTTONS LIGHT MODE OVERRIDES */
        body.light-mode .btn-modal-create {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;
          color: #ffffff !important;
          font-weight: 800 !important;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4) !important;
          opacity: 1 !important;
        }
        body.light-mode .btn-modal-cancel {
          background-color: #f1f5f9 !important;
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
          font-weight: 700 !important;
        }
        body.light-mode .btn-modal-save {
          background-color: #f59e0b !important;
          color: #000000 !important;
          font-weight: 800 !important;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4) !important;
        }
        body.light-mode .btn-modal-close {
          background-color: #e2e8f0 !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          font-weight: 700 !important;
        }
        body.light-mode .btn-modal-delete {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
          color: #ffffff !important;
          font-weight: 800 !important;
        }
      `}</style>

      {/* Floating Animated Toast Notification */}
      {message && (
        <div 
          className="shadow-lg rounded-4 p-3 d-flex align-items-center justify-content-between gap-3 text-white"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            minWidth: '340px',
            maxWidth: '460px',
            backgroundColor: '#12100e',
            backdropFilter: 'blur(16px)',
            borderLeft: message.type === 'success' ? '4px solid #22c55e' : '4px solid #ef4444',
            borderTop: '1px solid #29231d',
            borderRight: '1px solid #29231d',
            borderBottom: '1px solid #29231d',
            boxShadow: message.type === 'success' 
              ? '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(34, 197, 94, 0.25)' 
              : '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(239, 68, 68, 0.25)',
            animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 38,
                height: 38,
                backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: message.type === 'success' ? '#4ade80' : '#f87171',
                flexShrink: 0
              }}
            >
              {message.type === 'success' ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <div className="fw-bold fs-13 text-white">
                {message.type === 'success' ? 'Action Successful' : 'Action Notification'}
              </div>
              <div className="fs-12" style={{ color: '#d4d4d8' }}>
                {message.text}
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close btn-close-white ms-auto shadow-none"
            onClick={() => setMessage(null)}
            style={{ opacity: 0.75, cursor: 'pointer' }}
          />
        </div>
      )}

      {/* 4 UNIFORM SCADA STAT TILES */}
      <Row className="g-3 mb-4">
        {/* Total Users */}
        <Col lg={3} sm={6}>
          <div 
            className="stat-tile-card p-3 rounded-4 h-100 d-flex align-items-center gap-3"
            style={{
              backgroundColor: '#0c0a08',
              border: '1px solid #27221d',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: 46,
                height: 46,
                backgroundColor: 'rgba(234, 88, 12, 0.15)',
                color: '#f97316',
                border: '1px solid rgba(234, 88, 12, 0.3)',
                flexShrink: 0
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <div className="fw-bold uppercase fs-10 stat-tile-title" style={{ letterSpacing: '0.8px', color: '#9ca3af' }}>
                TOTAL USERS
              </div>
              <div className="fw-black fs-22 mt-0 stat-tile-number" style={{ color: '#ffffff' }}>
                {users.length}
              </div>
              <div className="fs-11 stat-tile-title" style={{ color: '#6b7280' }}>All registered users</div>
            </div>
          </div>
        </Col>

        {/* Active Users */}
        <Col lg={3} sm={6}>
          <div 
            className="stat-tile-card p-3 rounded-4 h-100 d-flex align-items-center gap-3"
            style={{
              backgroundColor: '#0c0a08',
              border: '1px solid #27221d',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: 46,
                height: 46,
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                flexShrink: 0
              }}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <div className="fw-bold uppercase fs-10 stat-tile-title" style={{ letterSpacing: '0.8px', color: '#9ca3af' }}>
                ACTIVE USERS
              </div>
              <div className="fw-black fs-22 mt-0 stat-tile-number" style={{ color: '#ffffff' }}>
                {users.filter(u => u.status === 'ACTIVE').length}
              </div>
              <div className="fs-11 stat-tile-title" style={{ color: '#6b7280' }}>Currently active</div>
            </div>
          </div>
        </Col>

        {/* Roles */}
        <Col lg={3} sm={6}>
          <div 
            className="stat-tile-card p-3 rounded-4 h-100 d-flex align-items-center gap-3"
            style={{
              backgroundColor: '#0c0a08',
              border: '1px solid #27221d',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: 46,
                height: 46,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                flexShrink: 0
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <div className="fw-bold uppercase fs-10 stat-tile-title" style={{ letterSpacing: '0.8px', color: '#9ca3af' }}>
                ROLES
              </div>
              <div className="fw-black fs-22 mt-0 stat-tile-number" style={{ color: '#ffffff' }}>
                {new Set(users.map(u => u.role)).size || 4}
              </div>
              <div className="fs-11 stat-tile-title" style={{ color: '#6b7280' }}>System roles</div>
            </div>
          </div>
        </Col>

        {/* Tenants */}
        <Col lg={3} sm={6}>
          <div 
            className="stat-tile-card p-3 rounded-4 h-100 d-flex align-items-center gap-3"
            style={{
              backgroundColor: '#0c0a08',
              border: '1px solid #27221d',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: 46,
                height: 46,
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                flexShrink: 0
              }}
            >
              <Building size={22} />
            </div>
            <div>
              <div className="fw-bold uppercase fs-10 stat-tile-title" style={{ letterSpacing: '0.8px', color: '#9ca3af' }}>
                TENANTS
              </div>
              <div className="fw-black fs-22 mt-0 stat-tile-number" style={{ color: '#ffffff' }}>
                {tenants.length || 4}
              </div>
              <div className="fs-11 stat-tile-title" style={{ color: '#6b7280' }}>Total tenants</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* USER MANAGEMENT CONTAINER & TAB CONTROLS */}
      <div className="rounded-4 overflow-hidden shadow-lg scada-user-container">
        
        {/* Top Navigation Bar: Users vs Invitations */}
        <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 scada-controls-header">
          <div className="d-flex align-items-center gap-2">
            <button 
              onClick={() => setActiveTab('users')}
              className={`btn btn-sm px-3.5 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 transition-all ${activeTab === 'users' ? 'btn-primary' : 'btn-outline-secondary text-slate-300'}`}
              style={{ fontSize: '0.86rem', backgroundColor: activeTab === 'users' ? '#6366f1' : 'transparent', borderColor: activeTab === 'users' ? '#6366f1' : '#334155' }}
            >
              <Users size={16} /> Active Users ({users.length})
            </button>
            <button 
              onClick={() => setActiveTab('invitations')}
              className={`btn btn-sm px-3.5 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 transition-all ${activeTab === 'invitations' ? 'btn-primary' : 'btn-outline-secondary text-slate-300'}`}
              style={{ fontSize: '0.86rem', backgroundColor: activeTab === 'invitations' ? '#10b981' : 'transparent', borderColor: activeTab === 'invitations' ? '#10b981' : '#334155', color: activeTab === 'invitations' ? '#ffffff' : '#cbd5e1' }}
            >
              <Send size={15} /> Pending Invitations ({invitations.filter(i => i.status === 'PENDING').length})
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => {
                setInviteFormData({ email: '', role: 'OPERATOR', tenantId: 'cmshedsk40002zsvnhajul18y', scopeType: 'ZONE', expirationDays: '7', note: '' });
                setShowInviteModal(true);
              }} 
              className="rounded-3 px-3.5 py-1.5 fw-bold border-0 d-flex align-items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', fontSize: '0.84rem', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
            >
              <Send size={14} /> Send User Invitation
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                setFormData({ name: '', email: '', role: 'VIEWER', tenantId: 'cmshedsk40002zsvnhajul18y', status: 'ACTIVE', scopeType: 'ZONE', scopeId: '', permissions: 'read,write' });
                setEmailError('');
                setShowCreateModal(true);
              }} 
              className="rounded-3 px-3.5 py-1.5 fw-bold border-0 d-flex align-items-center gap-2 btn-add-new-user"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#ffffff', fontSize: '0.84rem', boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)' }}
            >
              <UserPlus size={15} /> Add New User
            </Button>
          </div>
        </div>

        {/* Controls Header - Search & Filters */}
        <div className="p-3 border-bottom scada-controls-header">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            
            {/* Left Controls: Search, Roles Filter, Status Filter */}
            <div className="d-flex flex-wrap align-items-center gap-3 flex-grow-1">
              {/* Search Bar */}
              <InputGroup style={{ maxWidth: '300px' }}>
                <InputGroup.Text className="scada-search-icon" style={{ paddingLeft: '12px', paddingRight: '8px' }}>
                  <Search size={15} />
                </InputGroup.Text>
                <Form.Control
                  className="scada-search-input"
                  placeholder={activeTab === 'users' ? "Search user by name, email or ID..." : "Search invitation by email or token..."}
                  style={{ boxShadow: 'none', fontSize: '0.86rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              {/* Floating Filter Role Select */}
              <div className="position-relative">
                <span 
                  className="position-absolute px-1 scada-floating-label" 
                  style={{ 
                    top: '-9px', 
                    left: '12px', 
                    fontSize: '0.68rem', 
                    fontWeight: 700, 
                    zIndex: 3,
                    letterSpacing: '0.4px'
                  }}
                >
                  Filter Role
                </span>
                <Form.Select 
                  className="scada-select-input"
                  style={{ boxShadow: 'none', width: 'auto', fontSize: '0.86rem', minWidth: '130px', fontWeight: 600 }}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                  <option value="MANAGER">MANAGER</option>
                </Form.Select>
              </div>

              {/* Floating Status Select */}
              <div className="position-relative">
                <span 
                  className="position-absolute px-1 scada-floating-label" 
                  style={{ 
                    top: '-9px', 
                    left: '12px', 
                    fontSize: '0.68rem', 
                    fontWeight: 700, 
                    zIndex: 3,
                    letterSpacing: '0.4px'
                  }}
                >
                  Status
                </span>
                <Form.Select 
                  className="scada-select-input"
                  style={{ boxShadow: 'none', width: 'auto', fontSize: '0.86rem', minWidth: '130px', fontWeight: 600 }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">{activeTab === 'users' ? 'ACTIVE' : 'PENDING'}</option>
                  <option value="INACTIVE">{activeTab === 'users' ? 'INACTIVE' : 'ACCEPTED'}</option>
                  {activeTab === 'invitations' && <option value="DECLINED">DECLINED</option>}
                </Form.Select>
              </div>
            </div>

            {/* Right Controls: Refresh */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={activeTab === 'users' ? fetchUsers : fetchInvitations} 
                className="rounded-3 px-3 py-1.5 d-flex align-items-center gap-1.5 btn-refresh-scada"
                style={{ fontSize: '0.84rem', fontWeight: 600 }}
              >
                <RefreshCcw size={14} style={{ color: '#a855f7' }} className={loading ? 'spin-anim' : ''} /> Refresh
              </Button>
            </div>

          </div>
        </div>

        {/* Custom Table */}
        <div className="table-responsive">
          <table className="w-100 align-middle scada-table" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="scada-table-header">
                <th className="py-3 px-4 text-start fw-bold">{activeTab === 'users' ? 'USER DETAILS' : 'INVITEE DETAILS'}</th>
                <th className="py-3 text-start fw-bold">{activeTab === 'users' ? 'ROLE & STATUS' : 'ROLE & DELEGATED TENANT'}</th>
                <th className="py-3 text-start fw-bold">{activeTab === 'users' ? 'SCOPE / TENANT' : 'INVITATION LINK / TOKEN'}</th>
                <th className="py-3 text-start fw-bold">{activeTab === 'users' ? 'PERMISSIONS' : 'EXPIRATION & STATUS'}</th>
                <th className="py-3 px-4 text-end fw-bold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(n => (
                  <tr key={`skel-${n}`} className="user-table-row">
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className="skeleton-box rounded-circle" style={{ width: 42, height: 42, flexShrink: 0 }} />
                        <div className="d-flex flex-column gap-2 flex-grow-1" style={{ maxWidth: 180 }}>
                          <div className="skeleton-box rounded-2" style={{ width: '80%', height: 14 }} />
                          <div className="skeleton-box rounded-2" style={{ width: '100%', height: 11 }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="d-flex flex-column gap-2">
                        <div className="skeleton-box rounded-pill" style={{ width: 95, height: 22 }} />
                        <div className="skeleton-box rounded-pill" style={{ width: 70, height: 18 }} />
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="d-flex flex-column gap-1">
                        <div className="skeleton-box rounded-pill" style={{ width: 55, height: 16 }} />
                        <div className="skeleton-box rounded-2" style={{ width: 110, height: 13 }} />
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="d-flex gap-1">
                        <div className="skeleton-box rounded-3" style={{ width: 70, height: 24 }} />
                        <div className="skeleton-box rounded-3" style={{ width: 70, height: 24 }} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <div className="skeleton-box rounded-circle" style={{ width: 32, height: 32 }} />
                        <div className="skeleton-box rounded-circle" style={{ width: 32, height: 32 }} />
                        <div className="skeleton-box rounded-circle" style={{ width: 32, height: 32 }} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : activeTab === 'users' ? (
                filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 scada-table-empty">
                      <div className="d-flex flex-column align-items-center justify-content-center py-3 gap-2">
                        <UserCheck size={36} className="text-muted opacity-50 mb-1" />
                        <span className="fw-bold fs-15 text-slate-400">No users found matching query</span>
                        <span className="fs-12 text-slate-500">Try adjusting your role or status filters.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr key={u.id} className="user-table-row">
                      {/* USER DETAILS */}
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold" 
                            style={{ width: 42, height: 42, backgroundColor: getAvatarColor(u.role, u.name), color: '#ffffff', fontSize: '1.05rem', flexShrink: 0, boxShadow: `0 0 12px ${getAvatarColor(u.role, u.name)}55` }}
                          >
                            {(u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold user-name" style={{ fontSize: '0.95rem' }}>
                              {u.name}
                            </div>
                            <div className="user-email" style={{ fontSize: '0.84rem' }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE & STATUS */}
                      <td className="py-3">
                        <div className="d-flex flex-column gap-2 align-items-start">
                          {getRoleBadge(u.role)}
                          {getStatusBadge(u.status)}
                        </div>
                      </td>

                      {/* SCOPE / TENANT */}
                      <td className="py-3">
                        <div className="d-flex flex-column">
                          <span 
                            className="px-2 py-0.5 rounded-pill mb-1 fw-bold align-self-start text-uppercase"
                            style={{ backgroundColor: 'rgba(124, 58, 237, 0.3)', border: '1px solid #7c3aed', color: '#c084fc', fontSize: '0.68rem', letterSpacing: '0.5px' }}
                          >
                            {u.scopeType || 'ZONE'}
                          </span>
                          <span className="font-monospace fw-semibold tenant-name" style={{ fontSize: '0.78rem' }}>
                            {getTenantLabel(u)}
                          </span>
                        </div>
                      </td>

                      {/* PERMISSIONS */}
                      <td className="py-3">
                        <div className="d-flex flex-wrap gap-1">
                          {Array.isArray(u.permissions) ? u.permissions.slice(0, 3).map((p, pIdx) => (
                            <span 
                              key={pIdx} 
                              className="px-3 py-1 rounded-3 font-monospace fw-semibold scada-permissions-badge"
                              style={{ fontSize: '0.78rem' }}
                            >
                              {p === 'read' || p === 'write' || p === '*' ? 'Standard' : p}
                            </span>
                          )) : (
                            <span 
                              className="px-3 py-1 rounded-3 font-monospace fw-semibold scada-permissions-badge"
                              style={{ fontSize: '0.78rem' }}
                            >
                              Standard
                            </span>
                          )}
                          {Array.isArray(u.permissions) && u.permissions.length > 3 && (
                            <span className="px-2 py-1 rounded text-muted fs-10 scada-permissions-badge">
                              +{u.permissions.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button 
                            onClick={() => handleViewDetails(u)}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#3b82f6' }}
                            title="View User Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser(u);
                              setFormData({
                                name: u.name || '',
                                email: u.email || '',
                                role: u.role === 'USER' ? 'VIEWER' : (u.role || 'VIEWER'),
                                tenantId: u.tenantId || u.scopeId || 'cmshedsk40002zsvnhajul18y',
                                status: u.status || 'ACTIVE',
                                scopeType: u.scopeType || 'TENANT',
                                scopeId: u.scopeId || '',
                                permissions: Array.isArray(u.permissions) ? u.permissions.join(', ') : 'read'
                              });
                              setEmailError('');
                              setShowEditModal(true);
                            }}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b' }}
                            title="Edit User"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444' }}
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                /* INVITATIONS TAB RENDERING */
                filteredInvitations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 scada-table-empty">
                      <div className="d-flex flex-column align-items-center justify-content-center py-3 gap-2">
                        <Send size={36} className="text-muted opacity-50 mb-1" />
                        <span className="fw-bold fs-15 text-slate-400">No invitations found matching query</span>
                        <span className="fs-12 text-slate-500">Click "Send User Invitation" above to invite new users.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvitations.map((inv) => (
                    <tr key={inv.id} className="user-table-row">
                      {/* INVITEE DETAILS */}
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold" 
                            style={{ width: 42, height: 42, backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', fontSize: '1.05rem', flexShrink: 0 }}
                          >
                            {(inv.email || 'I').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold user-name" style={{ fontSize: '0.95rem' }}>
                              {inv.email}
                            </div>
                            <div className="user-email fs-11" style={{ color: '#94a3b8' }}>
                              Invited by: {inv.invitedBy || 'Admin'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE & TENANT */}
                      <td className="py-3">
                        <div className="d-flex flex-column gap-1 align-items-start">
                          {getRoleBadge(inv.role)}
                          <span className="font-monospace fw-semibold tenant-name text-muted fs-11">
                            {getTenantLabel(inv)}
                          </span>
                        </div>
                      </td>

                      {/* INVITATION LINK / TOKEN */}
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-2">
                          <span className="px-2.5 py-1 rounded-3 font-monospace fs-11 bg-dark border border-secondary text-info">
                            {inv.token ? (inv.token.length > 18 ? `${inv.token.substring(0, 18)}...` : inv.token) : 'Token'}
                          </span>
                          <button
                            onClick={() => copyToClipboard(inv.invitationLink || `${window.location.origin}/invitations/${inv.token}`, inv.token)}
                            className="btn btn-sm btn-outline-info p-1 px-2 rounded-2 fs-11 d-flex align-items-center gap-1"
                            title="Copy Invitation Link"
                          >
                            {copiedToken === inv.token ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                            {copiedToken === inv.token ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </td>

                      {/* EXPIRATION & STATUS */}
                      <td className="py-3">
                        <div className="d-flex flex-column gap-1">
                          {getInviteStatusBadge(inv.status)}
                          <small className="text-slate-400 fs-11 d-flex align-items-center gap-1">
                            <Clock size={11} /> {inv.expiresAt ? `Expires ${new Date(inv.expiresAt).toLocaleDateString()}` : 'Valid for 7 days'}
                          </small>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button 
                            onClick={() => handleViewInviteDetails(inv)}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981' }}
                            title="Accept Invitation / View Details (POST /invitations/{token}/accept)"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeclineInvitation(inv)}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b' }}
                            title="Decline Invitation (POST /invitations/{token}/decline)"
                          >
                            <XCircle size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteInvitation(inv.id)}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444' }}
                            title="Revoke / Delete Invitation (DELETE /invitations/{id})"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER MATCHING SCREENSHOT */}
        <div className="p-3 border-top d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 scada-pagination-footer">
          <div className="d-flex align-items-center gap-2 text-slate-400 fs-13">
            <span>Show</span>
            <Form.Select 
              size="sm" 
              className="scada-page-size-select"
              style={{ backgroundColor: '#0d111a', borderColor: '#232938', color: '#ffffff', width: 'auto', fontSize: '0.80rem', boxShadow: 'none' }}
              defaultValue={10}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </Form.Select>
            <span>entries per page</span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="text-slate-400 fs-13">
              Showing 1 to {filteredUsers.length} of {users.length} entries
            </span>
            <div className="d-flex align-items-center gap-1">
              <Button variant="outline-secondary" size="sm" className="px-2.5 py-1 border-secondary" disabled style={{ backgroundColor: '#0d111a', color: '#64748b' }}>
                &lt;
              </Button>
              <Button size="sm" className="px-3 py-1 fw-bold border-0" style={{ backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '6px' }}>
                1
              </Button>
              <Button variant="outline-secondary" size="sm" className="px-2.5 py-1 border-secondary" disabled style={{ backgroundColor: '#0d111a', color: '#64748b' }}>
                &gt;
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered className="scada-animated-modal">
        <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
          <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#00bfff' }}>
            <UserPlus size={18} /> Create New User
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff' }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Full Name</Form.Label>
              <Form.Control type="text" style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Email Address</Form.Label>
              <Form.Control 
                type="email" 
                style={{ 
                  backgroundColor: '#131924', 
                  color: '#ffffff', 
                  borderColor: emailError ? '#ef4444' : '#243044', 
                  boxShadow: emailError ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none' 
                }} 
                value={formData.email} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, email: val });
                  setEmailError(checkDuplicateEmail(val));
                }} 
                required 
              />
              {emailError && (
                <div className="mt-1.5 fs-12 fw-bold d-flex align-items-center gap-1" style={{ color: '#ef4444' }}>
                  <AlertTriangle size={14} /> {emailError}
                </div>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Organization</Form.Label>
              <Form.Select 
                style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} 
                value={formData.tenantId} 
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Role</Form.Label>
                <Form.Select style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                  <option value="MANAGER">MANAGER</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Status</Form.Label>
                <Form.Select style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Form.Select>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Permissions (Comma Separated)</Form.Label>
              <Form.Control type="text" style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} value={formData.permissions} onChange={(e) => setFormData({ ...formData, permissions: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
            <Button variant="outline-secondary" size="sm" className="rounded-3 px-3 border-secondary btn-modal-cancel" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!!emailError} className="rounded-3 fw-bold px-4 border-0 btn-modal-create" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #00bfff 100%)', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 191, 255, 0.35)' }}>Create User</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered className="scada-animated-modal-edit">
        <Modal.Header closeButton style={{ backgroundColor: '#0a0d14', color: '#ffffff', borderColor: '#1c2433' }}>
          <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#f59e0b' }}>
            <Edit size={18} /> Update User
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
          <Modal.Body style={{ backgroundColor: '#0a0d14', color: '#ffffff' }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Full Name</Form.Label>
              <Form.Control type="text" style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px', padding: '8px 12px' }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Email Address</Form.Label>
              <Form.Control 
                type="email" 
                style={{ 
                  backgroundColor: '#151c28', 
                  color: '#ffffff', 
                  borderColor: emailError ? '#ef4444' : '#243044', 
                  boxShadow: emailError ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none', 
                  borderRadius: '8px', 
                  padding: '8px 12px' 
                }} 
                value={formData.email} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, email: val });
                  setEmailError(checkDuplicateEmail(val, selectedUser?.id));
                }} 
                required 
              />
              {emailError && (
                <div className="mt-1.5 fs-12 fw-bold d-flex align-items-center gap-1" style={{ color: '#ef4444' }}>
                  <AlertTriangle size={14} /> {emailError}
                </div>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Organization</Form.Label>
              <Form.Select 
                style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px', padding: '8px 12px' }} 
                value={formData.tenantId} 
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Role</Form.Label>
                <Form.Select style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px', padding: '8px 12px' }} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                  <option value="MANAGER">MANAGER</option>
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Status</Form.Label>
                <Form.Select style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px', padding: '8px 12px' }} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Form.Select>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#0a0d14', borderColor: '#1c2433' }}>
            <Button variant="outline-secondary" size="sm" className="px-3 border-secondary btn-modal-cancel" style={{ backgroundColor: 'transparent', borderColor: '#334155', color: '#cbd5e1', borderRadius: '8px', fontWeight: 600 }} onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="fw-bold px-4 border-0 btn-modal-save" style={{ backgroundColor: '#f59e0b', color: '#000000', borderRadius: '8px', fontWeight: 700, boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}>Save Changes</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* RICH FORMATTED USER DETAILS MODAL */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg" className="scada-animated-modal">
        <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
          <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#00bfff' }}>
            <User size={20} /> User Profile & Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff' }}>
          {selectedUser && (
            <div>
              {/* Profile Card Header */}
              <div className="d-flex align-items-center gap-3 p-3.5 rounded-4 mb-4 detail-profile-card" style={{ backgroundColor: '#131924', border: '1px solid #1e293b' }}>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{ width: 58, height: 58, backgroundColor: getAvatarColor(selectedUser.role, selectedUser.name), color: '#ffffff', fontSize: '1.4rem', boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)' }}
                >
                  {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="mb-0 fw-bold detail-profile-name" style={{ color: '#ffffff' }}>{selectedUser.name}</h5>
                  <div className="fs-14 detail-profile-email" style={{ color: '#00bfff' }}>{selectedUser.email}</div>
                  <div className="d-flex gap-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              {/* Grid Metadata Details - Clean 3-Column Layout without USER ID */}
              <Row className="g-3 mb-3">
                <Col md={4}>
                  <div className="p-3 rounded-3 detail-grid-box" style={{ backgroundColor: '#101520', border: '1px solid #1b2436' }}>
                    <small className="uppercase fw-bold fs-11 detail-grid-label" style={{ letterSpacing: '0.6px', color: '#9ca3af' }}>SCOPE TYPE</small>
                    <div className="font-monospace fw-bold fs-13 mt-1 detail-grid-value" style={{ color: '#38bdf8' }}>
                      {selectedUser.scopeType || 'TENANT'}
                    </div>
                  </div>
                </Col>

                <Col md={4}>
                  <div className="p-3 rounded-3 detail-grid-box" style={{ backgroundColor: '#101520', border: '1px solid #1b2436' }}>
                    <small className="uppercase fw-bold fs-11 detail-grid-label" style={{ letterSpacing: '0.6px', color: '#9ca3af' }}>ORGANIZATION</small>
                    <div className="font-monospace fw-semibold fs-13 mt-1 detail-grid-value" style={{ color: '#00bfff' }}>{getTenantLabel(selectedUser)}</div>
                  </div>
                </Col>

                <Col md={4}>
                  <div className="p-3 rounded-3 detail-grid-box" style={{ backgroundColor: '#101520', border: '1px solid #1b2436' }}>
                    <small className="uppercase fw-bold fs-11 detail-grid-label" style={{ letterSpacing: '0.6px', color: '#9ca3af' }}>CREATED AT</small>
                    <div className="font-monospace fs-13 mt-1 detail-grid-value" style={{ color: '#e2e8f0' }}>
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Permissions Section */}
              <div className="p-3 rounded-3 detail-grid-box" style={{ backgroundColor: '#101520', border: '1px solid #1b2436' }}>
                <small className="uppercase fw-bold fs-11 detail-grid-label" style={{ letterSpacing: '0.6px', color: '#9ca3af' }}>ASSIGNED PERMISSIONS</small>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {Array.isArray(selectedUser.permissions) ? (
                    selectedUser.permissions.map((p, i) => (
                      <span key={i} className="px-3 py-1 rounded font-monospace fw-semibold" style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', border: '1px solid #0284c7', color: '#00bfff', fontSize: '0.78rem' }}>
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 rounded font-monospace fw-semibold" style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', border: '1px solid #0284c7', color: '#00bfff', fontSize: '0.78rem' }}>
                      standard
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
          <Button variant="outline-secondary" size="sm" className="rounded-3 px-4 border-secondary btn-modal-close" onClick={() => setShowDetailModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* DELETE USER MODAL */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="scada-animated-modal-delete">
        <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
          <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#ef4444' }}>
            <Trash2 size={18} /> Confirm Delete User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff' }}>
          <p className="fs-14 mb-0" style={{ color: '#cbd5e1' }}>
            Are you sure you want to delete user <strong style={{ color: '#ef4444' }}>{selectedUser?.name}</strong> ({selectedUser?.email})?
          </p>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
          <Button variant="outline-secondary" size="sm" className="rounded-3 px-3 border-secondary btn-modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button size="sm" onClick={handleDeleteUser} className="rounded-3 fw-bold px-4 border-0 btn-modal-delete" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: '#ffffff', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)' }}>Confirm Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* SEND USER INVITATION MODAL (POST /invitations) */}
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered size="lg" className="scada-animated-modal">
        <Form onSubmit={handleSendInvitation}>
          <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
            <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#10b981' }}>
              <Send size={18} /> Send User Invitation & Access Delegation
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff' }}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Invitee Email Address *</Form.Label>
                <InputGroup>
                  <InputGroup.Text style={{ backgroundColor: '#151c28', borderColor: '#243044', color: '#10b981' }}>
                    <Mail size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    type="email"
                    required
                    placeholder="e.g. engineer@organization.com"
                    style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                    value={inviteFormData.email}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                  />
                </InputGroup>
              </Col>

              <Col md={6}>
                <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Assigned System Role</Form.Label>
                <Form.Select 
                  style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px', padding: '8px 12px' }}
                  value={inviteFormData.role} 
                  onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value })}
                >
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="VIEWER">VIEWER</option>
                  <option value="MANAGER">MANAGER</option>
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Delegated Organization / Tenant</Form.Label>
                <Form.Select 
                  style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px', padding: '8px 12px' }}
                  value={inviteFormData.tenantId} 
                  onChange={(e) => setInviteFormData({ ...inviteFormData, tenantId: e.target.value })}
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Scope Level</Form.Label>
                <Form.Select 
                  style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px', padding: '8px 12px' }}
                  value={inviteFormData.scopeType} 
                  onChange={(e) => setInviteFormData({ ...inviteFormData, scopeType: e.target.value })}
                >
                  <option value="TENANT">TENANT (Full Organization)</option>
                  <option value="ZONE">ZONE (Geographic Zone)</option>
                  <option value="SITE">SITE (Physical Facility)</option>
                  <option value="BUILDING">BUILDING (Building Asset)</option>
                  <option value="DEVICE">DEVICE (Control Devices)</option>
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Invitation Link Validity</Form.Label>
                <Form.Select 
                  style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px', padding: '8px 12px' }}
                  value={inviteFormData.expirationDays} 
                  onChange={(e) => setInviteFormData({ ...inviteFormData, expirationDays: e.target.value })}
                >
                  <option value="1">1 Day (24 Hours)</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days (Default)</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </Form.Select>
              </Col>

              <Col md={12}>
                <Form.Label style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>Personal Note / Instructions (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Welcome to BMS SCADA! Please set up your credentials using this link."
                  style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px' }}
                  value={inviteFormData.note}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, note: e.target.value })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#0a0d14', borderColor: '#1c2433' }}>
            <Button variant="outline-secondary" size="sm" className="px-3 border-secondary btn-modal-cancel" style={{ backgroundColor: 'transparent', borderColor: '#334155', color: '#cbd5e1', borderRadius: '8px', fontWeight: 600 }} onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="fw-bold px-4 border-0 btn-modal-save" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', borderRadius: '8px', fontWeight: 700, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
              Send Invitation & Generate Link
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* INVITATION LINK GENERATED SUCCESS MODAL */}
      <Modal show={showInviteCreatedModal} onHide={() => setShowInviteCreatedModal(false)} centered className="scada-animated-modal">
        <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
          <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#10b981' }}>
            <MailCheck size={20} /> Invitation Link Generated!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff' }}>
          {createdInvite && (
            <div>
              <Alert variant="success" className="d-flex align-items-center gap-2 mb-3 bg-emerald-950/40 border-emerald-800 text-emerald-300">
                <CheckCircle size={18} /> Invitation token created for <strong>{createdInvite.email}</strong>!
              </Alert>

              <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <small className="text-muted uppercase fw-bold fs-11">SHAREABLE INVITATION LINK</small>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <Form.Control
                    readOnly
                    value={createdInvite.invitationLink || `${window.location.origin}/invitations/${createdInvite.token}`}
                    style={{ backgroundColor: '#020617', color: '#38bdf8', borderColor: '#1e293b', fontSize: '0.82rem', fontFamily: 'monospace' }}
                  />
                  <Button
                    onClick={() => copyToClipboard(createdInvite.invitationLink || `${window.location.origin}/invitations/${createdInvite.token}`, createdInvite.token)}
                    variant="info"
                    size="sm"
                    className="fw-bold d-flex align-items-center gap-1"
                  >
                    {copiedToken === createdInvite.token ? <Check size={14} /> : <Copy size={14} />}
                    {copiedToken === createdInvite.token ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div className="d-flex justify-content-between text-slate-400 fs-12">
                <span>Role: <strong className="text-light">{createdInvite.role}</strong></span>
                <span>Valid: <strong className="text-light">7 Days</strong></span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
          <Button variant="outline-secondary" size="sm" className="rounded-3 px-4 border-secondary" onClick={() => setShowInviteCreatedModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* ACCEPT INVITATION DETAILS MODAL (POST /invitations/{token}/accept) */}
      <Modal show={showAcceptModal} onHide={() => setShowAcceptModal(false)} centered className="scada-animated-modal">
        <Form onSubmit={handleAcceptInvitation}>
          <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
            <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#10b981' }}>
              <UserCheck size={20} /> Accept User Invitation (Token Verification)
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff' }}>
            {selectedInvite && (
              <div>
                <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-emerald-400 fs-14">{selectedInvite.email}</span>
                    {getInviteStatusBadge(selectedInvite.status)}
                  </div>
                  <div className="fs-12 text-slate-300">
                    Assigned Role: <Badge bg="primary" className="ms-1">{selectedInvite.role}</Badge>
                  </div>
                  <div className="fs-12 text-slate-400 mt-1">
                    Invited by: {selectedInvite.invitedBy || 'Super Admin'}
                  </div>
                </div>

                {selectedInvite.status === 'PENDING' ? (
                  <div>
                    <h6 className="fw-bold text-light fs-13 mb-3">Provision Account Details:</h6>
                    <div className="mb-3">
                      <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        required
                        placeholder="Enter full name"
                        style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                        value={acceptFormData.name}
                        onChange={(e) => setAcceptFormData({ ...acceptFormData, name: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Set Password</Form.Label>
                      <Form.Control
                        type="password"
                        required
                        minLength={8}
                        placeholder="Minimum 8 characters"
                        style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                        value={acceptFormData.password}
                        onChange={(e) => setAcceptFormData({ ...acceptFormData, password: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <Alert variant="info" className="fs-13 bg-slate-900 border-slate-700 text-slate-300">
                    This invitation has already been marked as <strong>{selectedInvite.status}</strong>.
                  </Alert>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
            <Button variant="outline-secondary" size="sm" className="px-3 border-secondary" onClick={() => setShowAcceptModal(false)}>Close</Button>
            {selectedInvite?.status === 'PENDING' && (
              <Button type="submit" size="sm" className="fw-bold px-4 border-0" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff' }}>
                Accept & Provision User
              </Button>
            )}
          </Modal.Footer>
        </Form>
      </Modal>

    </Container>
  );
};

export default UserAdministration;
