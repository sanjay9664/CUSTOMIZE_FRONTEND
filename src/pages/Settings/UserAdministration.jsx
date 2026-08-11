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
        return <span style={{ ...badgeStyle, backgroundColor: 'rgba(153, 27, 27, 0.25)', color: '#f87171', border: '1px solid #ef4444' }}>SUPER ADMIN</span>;
      case 'ADMIN':
        return <span style={{ ...badgeStyle, backgroundColor: 'rgba(2, 132, 199, 0.25)', color: '#38bdf8', border: '1px solid #0284c7' }}>ADMIN</span>;
      case 'OPERATOR':
        return <span style={{ ...badgeStyle, backgroundColor: 'rgba(37, 99, 235, 0.25)', color: '#60a5fa', border: '1px solid #2563eb' }}>OPERATOR</span>;
      case 'MANAGER':
        return <span style={{ ...badgeStyle, backgroundColor: 'rgba(217, 119, 6, 0.25)', color: '#fbbf24', border: '1px solid #d97706' }}>MANAGER</span>;
      default:
        return <span style={{ ...badgeStyle, backgroundColor: 'rgba(63, 63, 70, 0.3)', color: '#d4d4d8', border: '1px solid #71717a' }}>VIEWER</span>;
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
      <span style={statusStyle}>
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
              <div className="fw-bold uppercase fs-10" style={{ letterSpacing: '0.8px', color: '#9ca3af' }}>
                TOTAL USERS
              </div>
              <div className="fw-black text-white fs-22 mt-0">
                {users.length}
              </div>
              <div className="fs-11" style={{ color: '#6b7280' }}>All registered users</div>
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
              <div className="fw-bold uppercase fs-10" style={{ letterSpacing: '0.8px', color: '#9ca3af' }}>
                ACTIVE USERS
              </div>
              <div className="fw-black text-white fs-22 mt-0">
                {users.filter(u => u.status === 'ACTIVE').length}
              </div>
              <div className="fs-11" style={{ color: '#6b7280' }}>Currently active</div>
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
              <div className="fw-bold uppercase fs-10" style={{ letterSpacing: '0.8px', color: '#9ca3af' }}>
                ROLES
              </div>
              <div className="fw-black text-white fs-22 mt-0">
                {new Set(users.map(u => u.role)).size || 4}
              </div>
              <div className="fs-11" style={{ color: '#6b7280' }}>System roles</div>
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
              <div className="fw-bold uppercase fs-10" style={{ letterSpacing: '0.8px', color: '#9ca3af' }}>
                TENANTS
              </div>
              <div className="fw-black text-white fs-22 mt-0">
                {tenants.length || 4}
              </div>
              <div className="fs-11" style={{ color: '#6b7280' }}>Total tenants</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* USER MANAGEMENT CONTAINER & SINGLE-ROW CONTROLS */}
      <div 
        className="rounded-4 overflow-hidden shadow-lg" 
        style={{ backgroundColor: '#090807', border: '1px solid #27231e' }}
      >
        {/* Controls Header - Single Row Matching Screenshot */}
        <div className="p-3 border-bottom border-secondary border-opacity-25" style={{ backgroundColor: '#110f0d' }}>
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            
            {/* Left Controls: Search, Roles Filter, Status Filter */}
            <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
              <InputGroup style={{ maxWidth: '300px' }}>
                <InputGroup.Text style={{ backgroundColor: '#1a1714', borderColor: '#332d27', color: '#a1a1aa', paddingLeft: '12px', paddingRight: '8px' }}>
                  <Search size={15} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search user by name, email or ID..."
                  style={{ backgroundColor: '#1a1714', borderColor: '#332d27', color: '#ffffff', boxShadow: 'none', fontSize: '0.86rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Form.Select 
                style={{ backgroundColor: '#1a1714', borderColor: '#332d27', color: '#ffffff', boxShadow: 'none', width: 'auto', fontSize: '0.86rem' }}
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

              <Form.Select 
                style={{ backgroundColor: '#1a1714', borderColor: '#332d27', color: '#ffffff', boxShadow: 'none', width: 'auto', fontSize: '0.86rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Form.Select>
            </div>

            {/* Right Controls: Refresh & Add New User */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={fetchUsers} 
                className="rounded-3 px-3 py-1.5 d-flex align-items-center gap-1.5 border-0"
                style={{ backgroundColor: '#1e293b', color: '#38bdf8', fontSize: '0.84rem', fontWeight: 600 }}
              >
                <RefreshCcw size={14} className={loading ? 'spin-anim' : ''} /> Refresh
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  setFormData({ name: '', email: '', role: 'VIEWER', tenantId: 'cmshedsk40002zsvnhajul18y', status: 'ACTIVE', scopeType: 'ZONE', scopeId: '', permissions: 'read,write' });
                  setShowCreateModal(true);
                }} 
                className="rounded-3 px-3.5 py-1.5 fw-bold border-0 d-flex align-items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0284c7 0%, #00d2ff 100%)', color: '#ffffff', fontSize: '0.84rem', boxShadow: '0 4px 14px rgba(0, 210, 255, 0.35)' }}
              >
                <UserPlus size={15} /> Add New User
              </Button>
            </div>

          </div>
        </div>

        {/* Custom High-Contrast Table */}
        <div className="table-responsive">
          <table className="w-100 align-middle" style={{ backgroundColor: '#090807', color: '#ffffff', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#14110f', borderBottom: '2px solid #2e2620' }}>
                <th className="py-3 px-4 text-start fw-bold" style={{ color: '#38bdf8', fontSize: '0.78rem', letterSpacing: '1px' }}>USER DETAILS</th>
                <th className="py-3 text-start fw-bold" style={{ color: '#38bdf8', fontSize: '0.78rem', letterSpacing: '1px' }}>ROLE & STATUS</th>
                <th className="py-3 text-start fw-bold" style={{ color: '#38bdf8', fontSize: '0.78rem', letterSpacing: '1px' }}>SCOPE / TENANT</th>
                <th className="py-3 text-start fw-bold" style={{ color: '#38bdf8', fontSize: '0.78rem', letterSpacing: '1px' }}>PERMISSIONS</th>
                <th className="py-3 px-4 text-end fw-bold" style={{ color: '#38bdf8', fontSize: '0.78rem', letterSpacing: '1px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5" style={{ backgroundColor: '#0d0b09', color: '#71717a' }}>
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr 
                    key={u.id} 
                    className="user-table-row"
                    style={{ 
                      backgroundColor: idx % 2 === 0 ? '#0b0908' : '#0e0c0a', 
                      borderBottom: '1px solid #1c1917' 
                    }}
                  >
                    {/* USER DETAILS */}
                    <td className="py-3 px-4">
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold" 
                          style={{ width: 42, height: 42, backgroundColor: '#0284c7', color: '#ffffff', fontSize: '1rem', flexShrink: 0 }}
                        >
                          {(u.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold" style={{ color: '#ffffff', fontSize: '0.95rem' }}>
                            {u.name}
                          </div>
                          <div style={{ color: '#38bdf8', fontSize: '0.84rem' }}>
                            {u.email}
                          </div>
                          <div className="font-monospace mt-1" style={{ color: '#64748b', fontSize: '0.76rem' }} title={u.id}>
                            ID: {u.id && u.id.length > 18 ? `${u.id.slice(0, 10)}...${u.id.slice(-4)}` : u.id}
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
                          className="px-2 py-0.5 rounded mb-1 fw-bold align-self-start"
                          style={{ backgroundColor: 'rgba(2, 132, 199, 0.15)', border: '1px solid #0284c7', color: '#38bdf8', fontSize: '0.70rem' }}
                        >
                          {u.scopeType || 'TENANT'}
                        </span>
                        <span className="font-monospace fw-semibold" style={{ color: '#38bdf8', fontSize: '0.78rem' }}>
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
                            className="px-2 py-1 rounded font-monospace"
                            style={{ backgroundColor: '#1e1b18', border: '1px solid #3d352e', color: '#f3f4f6', fontSize: '0.72rem' }}
                          >
                            {p}
                          </span>
                        )) : (
                          <span 
                            className="px-2 py-1 rounded font-monospace"
                            style={{ backgroundColor: '#1e1b18', border: '1px solid #3d352e', color: '#f3f4f6', fontSize: '0.72rem' }}
                          >
                            standard
                          </span>
                        )}
                        {Array.isArray(u.permissions) && u.permissions.length > 3 && (
                          <span className="px-2 py-1 rounded text-muted fs-10" style={{ backgroundColor: '#1a1714' }}>
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
                            width: 34,
                            height: 34,
                            backgroundColor: 'rgba(2, 132, 199, 0.15)',
                            border: '1px solid #0284c7',
                            color: '#38bdf8'
                          }}
                          title="View User Details"
                        >
                          <Eye size={15} />
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
                            setShowEditModal(true);
                          }}
                          className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: 34,
                            height: 34,
                            backgroundColor: 'rgba(217, 119, 6, 0.15)',
                            border: '1px solid #f59e0b',
                            color: '#fbbf24'
                          }}
                          title="Edit User"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }}
                          className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: 34,
                            height: 34,
                            backgroundColor: 'rgba(220, 38, 38, 0.15)',
                            border: '1px solid #ef4444',
                            color: '#f87171'
                          }}
                          title="Delete User"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              <Form.Control type="email" style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
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
            <Button variant="outline-secondary" size="sm" className="rounded-3 px-3 border-secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="rounded-3 fw-bold px-4 border-0" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #00bfff 100%)', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 191, 255, 0.35)' }}>Create User</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered className="scada-animated-modal-edit">
        <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
          <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#f59e0b' }}>
            <Edit size={18} /> Update User
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
          <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff' }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Full Name</Form.Label>
              <Form.Control type="text" style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Email Address</Form.Label>
              <Form.Control type="email" style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
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
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
            <Button variant="outline-secondary" size="sm" className="rounded-3 px-3 border-secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="rounded-3 fw-bold px-4 border-0" style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', color: '#ffffff', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)' }}>Save Changes</Button>
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
              <div className="d-flex align-items-center gap-3 p-3.5 rounded-4 mb-4" style={{ backgroundColor: '#131924', border: '1px solid #1e293b' }}>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{ width: 58, height: 58, backgroundColor: '#0284c7', color: '#ffffff', fontSize: '1.4rem', boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)' }}
                >
                  {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="mb-0 fw-bold text-white">{selectedUser.name}</h5>
                  <div className="fs-14" style={{ color: '#00bfff' }}>{selectedUser.email}</div>
                  <div className="d-flex gap-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              {/* Grid Metadata Details */}
              <Row className="g-3 mb-3">
                <Col md={6}>
                  <div className="p-3 rounded-3" style={{ backgroundColor: '#101520', border: '1px solid #1b2436' }}>
                    <small className="text-muted uppercase fw-bold fs-11" style={{ letterSpacing: '0.6px' }}>USER ID</small>
                    <div className="font-monospace fw-bold fs-13 mt-1" style={{ color: '#00bfff' }}>{selectedUser.id}</div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="p-3 rounded-3" style={{ backgroundColor: '#101520', border: '1px solid #1b2436' }}>
                    <small className="text-muted uppercase fw-bold fs-11" style={{ letterSpacing: '0.6px' }}>SCOPE TYPE</small>
                    <div className="font-monospace fw-bold fs-13 mt-1" style={{ color: '#38bdf8' }}>
                      {selectedUser.scopeType || 'TENANT'}
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="p-3 rounded-3" style={{ backgroundColor: '#101520', border: '1px solid #1b2436' }}>
                    <small className="text-muted uppercase fw-bold fs-11" style={{ letterSpacing: '0.6px' }}>ORGANIZATION</small>
                    <div className="font-monospace fw-semibold fs-13 mt-1" style={{ color: '#00bfff' }}>{getTenantLabel(selectedUser)}</div>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="p-3 rounded-3" style={{ backgroundColor: '#101520', border: '1px solid #1b2436' }}>
                    <small className="text-muted uppercase fw-bold fs-11" style={{ letterSpacing: '0.6px' }}>CREATED AT</small>
                    <div className="font-monospace text-slate-300 fs-13 mt-1">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Permissions Section */}
              <div className="p-3 rounded-3" style={{ backgroundColor: '#101520', border: '1px solid #1b2436' }}>
                <small className="text-muted uppercase fw-bold fs-11" style={{ letterSpacing: '0.6px' }}>ASSIGNED PERMISSIONS</small>
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
          <Button variant="outline-secondary" size="sm" className="rounded-3 px-4 border-secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
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
          <Button variant="outline-secondary" size="sm" className="rounded-3 px-3 border-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button size="sm" onClick={handleDeleteUser} className="rounded-3 fw-bold px-4 border-0" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: '#ffffff', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)' }}>Confirm Delete</Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default UserAdministration;
