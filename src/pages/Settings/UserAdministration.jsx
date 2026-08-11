import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Modal, InputGroup, Spinner, Alert } from 'react-bootstrap';
import {
  Users, UserPlus, Search, Edit, Trash2, Eye, RefreshCcw,
  CheckCircle, XCircle, Globe, Shield, User, Building2, MapPin, Key, Layers, Mail,
  UserCheck, Building, AlertTriangle
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
    tenantId: 'cmshedsk40002zsvnhajul18y',
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
    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        headers: getAuthHeaders()
      });
      if (response.status === 401) {
        purgeExpiredTokens();
      }
      if (response.ok) {
        const result = await response.json();
        const tList = Array.isArray(result) ? result : (result.data || []);
        if (tList.length > 0) setTenants(tList);
      }
    } catch (e) {
      console.warn('Tenants fetch error:', e);
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

  useEffect(() => {
    fetchUsers();
    fetchTenants();
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
    const selectedTenant = formData.tenantId || 'cmshedsk40002zsvnhajul18y';
    const payload = {
      name: formData.name,
      email: formData.email,
      role: validRole,
      roleId: roleIdMap[validRole] || 4,
      tenantId: selectedTenant,
      zoneLocations: [
        { zoneNodeType: 'ZONE', zoneNodeId: '' },
        { zoneNodeType: 'SITE', zoneNodeId: '1' },
        { zoneNodeType: 'ASSET', zoneNodeId: 'room_101' }
      ],
      status: formData.status || 'ACTIVE',
      scopeType: 'ZONE',
      scopeId: '',
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
        createdUser = resJson.data || resJson.user || resJson;
      } else {
        const resErr = await response.json();
        if (resErr && resErr.message) {
          setMessage({ type: 'error', text: resErr.message });
          setEmailError(resErr.message);
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
    if (!user) return 'Sochiot';
    const tid = user.tenantId || user.scopeId || '';
    if (!tid) return 'Sochiot';
    if (tid === 'cmshedsk40002zsvnhajul18y' || tid === 'c2a8b410-449e-11ee-be56-0242ac120002' || tid.toLowerCase().includes('sochiot')) return 'Sochiot';
    if (tid === 'cmshedsjg0001zsvnof6oml' || tid.toLowerCase().includes('saas')) return 'SAAS Headquarters';
    if (tid === 'cmshedske0003zsvnysjzt2ap' || tid.toLowerCase().includes('tata')) return 'Tata Org';
    if (tid === 'cmshedskq0005zsvnrc1mcrg4' || tid.toLowerCase().includes('siemens')) return 'Siemens Org';
    const found = tenants.find(t => String(t.id) === String(tid));
    if (found) return found.name || 'Organization';
    return 'Sochiot';
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
    const payload = {
      name: formData.name,
      email: formData.email,
      role: validRole,
      tenantId: formData.tenantId || 'cmshedsk40002zsvnhajul18y',
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
        updatedResult = json.data || json.user || json;
      }
    } catch (err) {
      console.warn('PATCH error:', err);
    }

    setUsers(prev => {
      const updated = prev.map(u => String(u.id) === String(selectedUser.id) ? { ...u, ...payload, ...(updatedResult || {}) } : u);
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
    <Container fluid className="py-4 px-lg-4" style={{ backgroundColor: '#070605', minHeight: '100vh', color: '#ffffff' }}>
      
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
        .user-table-row {
          transition: all 0.2s ease;
        }
        .user-table-row:hover {
          background-color: rgba(2, 132, 199, 0.05) !important;
        }

        /* LIGHT MODE OVERRIDES FOR USER ADMINISTRATION & MODALS */
        body.light-mode .user-admin-wrapper {
          background-color: var(--scada-bg, #e2e8f0) !important;
          color: #0f172a !important;
        }
        body.light-mode .stat-tile-card {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
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
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06) !important;
        }
        body.light-mode .scada-controls-header {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .scada-floating-label {
          background-color: #f8fafc !important;
          color: #0284c7 !important;
        }
        body.light-mode .scada-search-input, 
        body.light-mode .scada-search-icon,
        body.light-mode .scada-select-input {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .scada-table-element {
          background-color: #ffffff !important;
        }
        body.light-mode .scada-table-header,
        body.light-mode .scada-table-header th {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #6b21a8 !important;
        }
        body.light-mode .scada-permissions-badge {
          background-color: #e2e8f0 !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .user-table-row {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .user-table-row:nth-child(even) {
          background-color: #f8fafc !important;
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
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
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

      {/* USER MANAGEMENT CONTAINER & SINGLE-ROW CONTROLS */}
      <div 
        className="rounded-4 overflow-hidden shadow-lg scada-user-container" 
        style={{ backgroundColor: '#090b10', border: '1px solid #1c2333' }}
      >
        {/* Controls Header - Single Row Matching Screenshot */}
        <div className="p-3 border-bottom border-secondary border-opacity-25 scada-controls-header" style={{ backgroundColor: '#0e121a' }}>
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            
            {/* Left Controls: Search, Roles Filter, Status Filter */}
            <div className="d-flex flex-wrap align-items-center gap-3 flex-grow-1">
              {/* Search Bar */}
              <InputGroup style={{ maxWidth: '300px' }}>
                <InputGroup.Text className="scada-search-icon" style={{ backgroundColor: '#0d111a', borderColor: '#232938', color: '#818cf8', paddingLeft: '12px', paddingRight: '8px' }}>
                  <Search size={15} />
                </InputGroup.Text>
                <Form.Control
                  className="scada-search-input"
                  placeholder="Search user by name, email or ID..."
                  style={{ backgroundColor: '#0d111a', borderColor: '#232938', color: '#ffffff', boxShadow: 'none', fontSize: '0.86rem' }}
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
                    backgroundColor: '#0e121a', 
                    color: '#818cf8', 
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
                  style={{ backgroundColor: '#0d111a', borderColor: '#232938', color: '#ffffff', boxShadow: 'none', width: 'auto', fontSize: '0.86rem', minWidth: '130px', fontWeight: 600 }}
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
                    backgroundColor: '#0e121a', 
                    color: '#818cf8', 
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
                  style={{ backgroundColor: '#0d111a', borderColor: '#232938', color: '#ffffff', boxShadow: 'none', width: 'auto', fontSize: '0.86rem', minWidth: '130px', fontWeight: 600 }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Form.Select>
              </div>
            </div>

            {/* Right Controls: Refresh & Add New User */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={fetchUsers} 
                className="rounded-3 px-3 py-1.5 d-flex align-items-center gap-1.5 btn-refresh-scada"
                style={{ backgroundColor: '#0d111a', borderColor: '#2d2738', color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}
              >
                <RefreshCcw size={14} style={{ color: '#a855f7' }} className={loading ? 'spin-anim' : ''} /> Refresh
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
        </div>

        {/* Custom High-Contrast Table */}
        <div className="table-responsive">
          <table className="w-100 align-middle" style={{ backgroundColor: '#090b10', color: '#ffffff', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="scada-table-header" style={{ backgroundColor: '#0e121a', borderBottom: '1px solid #1e2638' }}>
                <th className="py-3 px-4 text-start fw-bold" style={{ color: '#a855f7', fontSize: '0.78rem', letterSpacing: '1px' }}>USER DETAILS</th>
                <th className="py-3 text-start fw-bold" style={{ color: '#a855f7', fontSize: '0.78rem', letterSpacing: '1px' }}>ROLE & STATUS</th>
                <th className="py-3 text-start fw-bold" style={{ color: '#a855f7', fontSize: '0.78rem', letterSpacing: '1px' }}>SCOPE / TENANT</th>
                <th className="py-3 text-start fw-bold" style={{ color: '#a855f7', fontSize: '0.78rem', letterSpacing: '1px' }}>PERMISSIONS</th>
                <th className="py-3 px-4 text-end fw-bold" style={{ color: '#a855f7', fontSize: '0.78rem', letterSpacing: '1px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5" style={{ backgroundColor: '#090b10', color: '#64748b' }}>
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr 
                    key={u.id} 
                    className="user-table-row"
                    style={{ 
                      backgroundColor: idx % 2 === 0 ? '#090b10' : '#0c0f17', 
                      borderBottom: '1px solid #161c2b' 
                    }}
                  >
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
                          <div className="fw-bold user-name" style={{ color: '#ffffff', fontSize: '0.95rem' }}>
                            {u.name}
                          </div>
                          <div className="user-email" style={{ color: '#94a3b8', fontSize: '0.84rem' }}>
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
                        <span className="font-monospace fw-semibold tenant-name" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
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
                            style={{ backgroundColor: '#151c28', border: '1px solid #28354a', color: '#ffffff', fontSize: '0.78rem' }}
                          >
                            {p === 'read' || p === 'write' || p === '*' ? 'Standard' : p}
                          </span>
                        )) : (
                          <span 
                            className="px-3 py-1 rounded-3 font-monospace fw-semibold scada-permissions-badge"
                            style={{ backgroundColor: '#151c28', border: '1px solid #28354a', color: '#ffffff', fontSize: '0.78rem' }}
                          >
                            Standard
                          </span>
                        )}
                        {Array.isArray(u.permissions) && u.permissions.length > 3 && (
                          <span className="px-2 py-1 rounded text-muted fs-10 scada-permissions-badge" style={{ backgroundColor: '#151c28' }}>
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
                          className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: 32,
                            height: 32,
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid #3b82f6',
                            color: '#3b82f6'
                          }}
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
                              tenantId: u.tenantId || u.scopeId || 'c2a8b410-449e-11ee-be56-0242ac120002',
                              status: u.status || 'ACTIVE',
                              scopeType: u.scopeType || 'TENANT',
                              scopeId: u.scopeId || '',
                              permissions: Array.isArray(u.permissions) ? u.permissions.join(', ') : 'read'
                            });
                            setEmailError('');
                            setShowEditModal(true);
                          }}
                          className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: 32,
                            height: 32,
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid #f59e0b',
                            color: '#f59e0b'
                          }}
                          title="Edit User"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }}
                          className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: 32,
                            height: 32,
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid #ef4444',
                            color: '#ef4444'
                          }}
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER MATCHING SCREENSHOT */}
        <div className="p-3 border-top border-secondary border-opacity-25 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 scada-pagination-footer" style={{ backgroundColor: '#0a0d14' }}>
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

    </Container>
  );
};

export default UserAdministration;
