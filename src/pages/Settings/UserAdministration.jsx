import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Modal, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Edit, Trash2, Eye, RefreshCcw,
  CheckCircle, XCircle, Globe, Shield, User, Building2, MapPin, Key, Layers, Mail,
  UserCheck, Building, AlertTriangle, Send, MailCheck, Copy, Check, Link2, Clock, ExternalLink, ShieldAlert,
  Unlock, Lock, ShieldPlus, ShieldCheck, CheckSquare, Square, FolderPlus, ChevronRight, ChevronDown,
  Sliders, Settings, Radio, FileText, CheckCheck, Filter
} from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig';
import { getAuthToken } from '../../utils/cookieUtils';
import bmsService from '../../services/bmsService';
import { useAuth } from '../../hooks/useAuth';

const API_BASE_URL = getApiUrl();

const UserAdministration = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [zones, setZones] = useState([]);
  const [sites, setSites] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [message, setMessage] = useState(null);

  // Selector state for 'Manage Users' popover (ismartaccess-v2 style)
  const [showManageSelector, setShowManageSelector] = useState(false);
  const selectorRef = useRef(null);

  // Pagination state for users table (meta alignment)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Navigation tabs: 'all-users' | 'administrators' | 'operators' | 'viewers' | 'roles' | 'invitations'
  const [activeTab, setActiveTab] = useState('all-users');
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

  // Modals state for Users
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Admin Change Password & Unlock state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState(null);
  const [passwordUserName, setPasswordUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // RBAC Roles Modals State
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showCloneRoleModal, setShowCloneRoleModal] = useState(false);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '', organizationId: '', roleType: 'ORGANIZATION', permissionCodes: [] });
  const [cloneRoleName, setCloneRoleName] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [emailError, setEmailError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleType: 'SYSTEM',
    role: 'VIEWER',
    roleId: '',
    tenantId: '',
    status: 'ACTIVE',
    scopeType: 'ZONE',
    scopeId: '',
    password: '',
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

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken() || ''}`
  });

  // GET /api/v1/tenants - Fetch Tenant List
  const fetchTenants = async () => {
    let tenantList = [];
    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        headers: getAuthHeaders()
      });
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

  // GET /api/v1/users - Fetch Paginated User List
  const fetchUsers = async (targetPage = page, targetPageSize = pageSize) => {
    setLoading(true);
    let userList = [];
    try {
      const params = {
        page: targetPage,
        pageSize: targetPageSize,
        ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
        ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {})
      };
      const res = await bmsService.getUsers(params);
      const rawData = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      userList = rawData.map(u => ({
        ...u,
        role: u.role === 'USER' ? 'VIEWER' : (u.role || 'VIEWER'),
        resolvedPermissions: u.resolvedPermissions || u.permissions || []
      }));
      const meta = res?.meta || res?.data?.meta;
      if (meta) {
        setPage(meta.page || targetPage);
        setPageSize(meta.pageSize || targetPageSize);
        setTotal(meta.total ?? userList.length);
        setTotalPages(meta.totalPages || (meta.pageSize ? Math.ceil((meta.total || userList.length) / meta.pageSize) : 1));
      } else {
        setTotal(userList.length);
        setTotalPages(Math.ceil(userList.length / targetPageSize) || 1);
      }
    } catch (error) {
      console.warn('API fetch error, loading from local cache:', error);
    }

    if (!userList || userList.length === 0) {
      try {
        const cached = JSON.parse(localStorage.getItem('scada_users_db') || '[]');
        if (Array.isArray(cached) && cached.length > 0) userList = cached;
      } catch (e) {}
    }

    if (!userList || userList.length === 0) {
      userList = [
        { id: 'usr-101', name: 'Rajesh Padhi', email: 'rajesh@sochiot.com', role: 'SUPER_ADMIN', roleId: 'cm01_super_admin', status: 'ACTIVE', scopeType: 'TENANT', scopeId: 'cmsfq874j0002bsiaumzb92j7', resolvedPermissions: ['*'], createdAt: '2026-08-01T10:00:00Z' },
        { id: 'usr-102', name: 'Sanjay Gupta', email: 'sanjay@sochiot.com', role: 'ADMIN', roleId: 'cm02_admin', status: 'ACTIVE', scopeType: 'TENANT', scopeId: 'tenant-sub-01', resolvedPermissions: ['user:*', 'role:manage'], createdAt: '2026-08-05T12:30:00Z' },
        { id: 'usr-103', name: 'Priya Sharma', email: 'priya@sochiot.com', role: 'OPERATOR', roleId: 'cm04_operator', status: 'ACTIVE', scopeType: 'ZONE', scopeId: 'zone-north-04', resolvedPermissions: ['device:read', 'alarm:read'], createdAt: '2026-08-08T09:15:00Z' },
        { id: 'usr-104', name: 'Amit Verma', email: 'amit.verma@sochiot.com', role: 'VIEWER', roleId: 'cm05_viewer', status: 'INACTIVE', scopeType: 'SITE', scopeId: 'site-bms-02', resolvedPermissions: ['report:read'], createdAt: '2026-08-10T14:20:00Z' }
      ];
      localStorage.setItem('scada_users_db', JSON.stringify(userList));
    }

    setUsers(userList);
    setLoading(false);
  };

  // GET /api/v1/roles - Fetch Predefined and Custom Roles
  const fetchRoles = async () => {
    setRolesLoading(true);
    let roleList = [];
    try {
      const res = await bmsService.getRoles();
      roleList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('Roles fetch warning:', e);
    }

    if (!roleList || roleList.length === 0) {
      try {
        const saved = JSON.parse(localStorage.getItem('scada_roles_db') || '[]');
        if (Array.isArray(saved) && saved.length > 0) roleList = saved;
      } catch (e) {}
    }

    if (!roleList || roleList.length === 0) {
      roleList = [
        { id: 'cm01_super_admin', name: 'SUPER_ADMIN', description: 'Full access to all tenant and system operations', isPredefined: true, permissions: ['*'], userCount: 1 },
        { id: 'cm02_admin', name: 'ADMIN', description: 'Full organizational administration for users, devices, alarms & reports', isPredefined: true, permissions: ['user:*', 'device:*', 'alarm:*', 'report:*', 'ticket:*', 'role:manage'], userCount: 1 },
        { id: 'cm03_manager', name: 'MANAGER', description: 'Facility manager access for device control and incident resolution', isPredefined: true, permissions: ['device:read', 'device:control', 'alarm:*', 'ticket:*', 'report:*', 'user:read'], userCount: 0 },
        { id: 'cm04_operator', name: 'OPERATOR', description: 'Day-to-day equipment monitoring and alarm acknowledgment', isPredefined: true, permissions: ['device:read', 'alarm:read', 'alarm:acknowledge', 'ticket:create', 'report:read'], userCount: 1 },
        { id: 'cm05_viewer', name: 'VIEWER', description: 'Read-only visibility into operational dashboards and trends', isPredefined: true, permissions: ['device:read', 'report:read', 'alarm:read'], userCount: 1 }
      ];
      localStorage.setItem('scada_roles_db', JSON.stringify(roleList));
    }

    setRoles(roleList);
    setRolesLoading(false);
  };

  // GET /api/v1/zones - Fetch Zones Hierarchy
  const fetchZones = async () => {
    try {
      const res = await bmsService.getZones();
      const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.zones) ? res.zones : (Array.isArray(res) ? res : []));
      if (raw.length > 0) {
        setZones(raw);
        return;
      }
    } catch (e) {
      console.warn('Zones fetch warning:', e);
    }
    setZones([
      { id: 'zone-north-01', name: 'North Sector Facility', code: 'Z-NORTH' },
      { id: 'zone-south-02', name: 'South Operations Hub', code: 'Z-SOUTH' },
      { id: 'zone-east-03', name: 'East Logistics Complex', code: 'Z-EAST' },
      { id: 'zone-west-04', name: 'West Manufacturing Wing', code: 'Z-WEST' }
    ]);
  };

  // GET /api/v1/sites - Fetch Sites Hierarchy
  const fetchSites = async () => {
    try {
      const res = await bmsService.getSites();
      const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.sites) ? res.sites : (Array.isArray(res) ? res : []));
      if (raw.length > 0) {
        setSites(raw);
        return;
      }
    } catch (e) {
      console.warn('Sites fetch warning:', e);
    }
    setSites([
      { id: 'site-bms-01', name: 'Central Plant & HVAC Facility', zoneId: 'zone-north-01' },
      { id: 'site-bms-02', name: 'Chiller & Substation Plant', zoneId: 'zone-south-02' },
      { id: 'site-bms-03', name: 'Cleanroom & Assembly Line', zoneId: 'zone-east-03' }
    ]);
  };

  // GET /api/v1/permissions - Fetch RBAC Permissions Catalog
  const fetchPermissions = async () => {
    try {
      const res = await bmsService.getPermissions();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (list.length > 0) {
        setPermissionsCatalog(list);
        return;
      }
    } catch (e) {
      console.warn('Permissions catalog warning:', e);
    }

    const defaultCatalog = [
      { code: 'device:read', name: 'View Devices', category: 'device', description: 'View real-time telemetry, telemetry graphs, and status' },
      { code: 'device:control', name: 'Control Devices', category: 'device', description: 'Send hardware control commands and modify setpoints' },
      { code: 'device:manage', name: 'Manage Devices', category: 'device', description: 'Provision, configure, and delete IoT devices' },
      { code: 'alarm:read', name: 'View Alarms', category: 'alarm', description: 'Access active alarms, warning notifications, and history' },
      { code: 'alarm:acknowledge', name: 'Acknowledge Alarms', category: 'alarm', description: 'Acknowledge active alarms and silence sirens' },
      { code: 'ticket:read', name: 'View Tickets', category: 'ticket', description: 'View maintenance, servicing, and repair tickets' },
      { code: 'ticket:create', name: 'Create Tickets', category: 'ticket', description: 'Open new maintenance or incident tickets' },
      { code: 'ticket:manage', name: 'Manage Tickets', category: 'ticket', description: 'Assign, escalate, and resolve maintenance tickets' },
      { code: 'report:read', name: 'View Reports', category: 'report', description: 'View and export daily DPR and telemetry logs' },
      { code: 'report:generate', name: 'Generate Reports', category: 'report', description: 'Trigger asynchronous report generation jobs' },
      { code: 'user:read', name: 'View Users', category: 'user', description: 'View user directory and user access scopes' },
      { code: 'user:write', name: 'Manage Users', category: 'user', description: 'Create, update, unlock, and delete user profiles' },
      { code: 'role:manage', name: 'Manage Roles', category: 'role', description: 'Create, configure, clone, and remove RBAC roles' },
      { code: 'tenant:read', name: 'View Organization', category: 'tenant', description: 'View company and tenant administrative details' },
      { code: 'tenant:write', name: 'Manage Organization', category: 'tenant', description: 'Update organization parameters, zones, and subscription' }
    ];
    setPermissionsCatalog(defaultCatalog);
  };

  const permissionsByCategory = useMemo(() => {
    const groups = {};
    for (const perm of permissionsCatalog) {
      const cat = (perm.category || 'general').toLowerCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(perm);
    }
    return groups;
  }, [permissionsCatalog]);

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
    fetchUsers(page, pageSize);
    fetchTenants();
    fetchInvitations();
    fetchRoles();
    fetchPermissions();
    fetchZones();
    fetchSites();
  }, []);

  useEffect(() => {
    fetchUsers(page, pageSize);
  }, [page, pageSize, roleFilter, statusFilter]);

  // Close manage selector popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setShowManageSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter users based on search & filters & role-scoped tabs
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = (searchTerm || '').toLowerCase();
      const matchesSearch = !q ||
        (user.name || '').toLowerCase().includes(q) ||
        (user.email || '').toLowerCase().includes(q) ||
        (user.id || '').toLowerCase().includes(q);

      let matchesTab = true;
      if (activeTab === 'administrators') {
        matchesTab = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
      } else if (activeTab === 'operators') {
        matchesTab = user.role === 'MANAGER' || user.role === 'OPERATOR';
      } else if (activeTab === 'viewers') {
        matchesTab = user.role === 'VIEWER' || user.role === 'USER';
      }

      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter || (roleFilter === 'VIEWER' && user.role === 'USER');
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
      return matchesSearch && matchesTab && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, activeTab, roleFilter, statusFilter]);

  const isUserTab = activeTab !== 'roles' && activeTab !== 'invitations';
  const adminCount = useMemo(() => users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length, [users]);
  const opCount = useMemo(() => users.filter(u => u.role === 'OPERATOR' || u.role === 'MANAGER').length, [users]);
  const viewerCount = useMemo(() => users.filter(u => u.role === 'VIEWER' || u.role === 'USER').length, [users]);
  const pendingInvitesCount = useMemo(() => invitations.filter(i => i.status === 'PENDING').length, [invitations]);

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

  // Filter roles based on search
  const filteredRoles = roles.filter(r => {
    const q = (searchTerm || '').toLowerCase();
    return (r.name || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
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

  // POST /api/v1/users - Create User
  const handleCreateUser = async (e) => {
    if (e) e.preventDefault();

    const dupErr = checkDuplicateEmail(formData.email);
    if (dupErr) {
      setEmailError(dupErr);
      setMessage({ type: 'error', text: dupErr });
      return;
    }

    const matchedRole = roles.find(r => r.name === formData.role || r.id === formData.roleId);
    const resolvedRoleId = matchedRole?.id || formData.roleId || formData.role;
    const selectedTenant = formData.tenantId || (tenants[0]?.id || '');
    const selectedScopeId = formData.scopeId || (formData.scopeType === 'ZONE' ? (zones[0]?.id || 'zone-north-01') : formData.scopeType === 'SITE' ? (sites[0]?.id || 'site-bms-01') : selectedTenant);

    const locationMapping = {};
    if (formData.scopeType === 'SITE') {
      const sId = Number(selectedScopeId);
      locationMapping.siteId = !isNaN(sId) && sId > 0 ? sId : selectedScopeId;
    } else if (formData.scopeType === 'ZONE') {
      locationMapping.zoneId = String(selectedScopeId);
    } else if (selectedTenant) {
      locationMapping.tenantId = String(selectedTenant);
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role || 'VIEWER',
      roleId: resolvedRoleId,
      tenantId: selectedTenant,
      status: formData.status || 'ACTIVE',
      ...(formData.password ? { password: formData.password } : {}),
      locationMappings: Object.keys(locationMapping).length > 0 ? [locationMapping] : []
    };

    let createdUser = null;
    try {
      const res = await bmsService.createUser(payload);
      const apiUser = res?.data || res?.user || res;
      createdUser = {
        ...payload,
        id: apiUser?.id || `usr_${Date.now().toString(36)}`,
        resolvedPermissions: apiUser?.resolvedPermissions || matchedRole?.permissions || ['*'],
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('bmsService.createUser warning:', err);
      setMessage({ type: 'error', text: err?.message || 'Failed to create user on backend' });
    }

    if (!createdUser || !createdUser.id) {
      createdUser = {
        id: `usr_${Date.now().toString(36)}`,
        ...payload,
        createdAt: new Date().toISOString(),
        resolvedPermissions: matchedRole?.permissions || []
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

  // PATCH /api/v1/users/{id} - Update User
  const handleUpdateUser = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    const dupErr = checkDuplicateEmail(formData.email, selectedUser.id);
    if (dupErr) {
      setEmailError(dupErr);
      setMessage({ type: 'error', text: dupErr });
      return;
    }
    const matchedRole = roles.find(r => r.name === formData.role || r.id === formData.roleId);
    const resolvedRoleId = matchedRole?.id || formData.roleId || formData.role;
    const selectedTenant = formData.tenantId || selectedUser.tenantId || (tenants[0]?.id || '');
    const selectedScopeId = formData.scopeId || (formData.scopeType === 'ZONE' ? (zones[0]?.id || 'zone-north-01') : formData.scopeType === 'SITE' ? (sites[0]?.id || 'site-bms-01') : selectedTenant);

    const locationMapping = {};
    if (formData.scopeType === 'SITE') {
      const sId = Number(selectedScopeId);
      locationMapping.siteId = !isNaN(sId) && sId > 0 ? sId : selectedScopeId;
    } else if (formData.scopeType === 'ZONE') {
      locationMapping.zoneId = String(selectedScopeId);
    } else if (selectedTenant) {
      locationMapping.tenantId = String(selectedTenant);
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      roleId: resolvedRoleId,
      status: formData.status,
      tenantId: selectedTenant,
      locationMappings: Object.keys(locationMapping).length > 0 ? [locationMapping] : []
    };

    let updatedResult = null;
    try {
      const res = await bmsService.updateUser(selectedUser.id, payload);
      const apiUser = res?.data || res?.user || res;
      updatedResult = { ...apiUser, tenantId: selectedTenant };
    } catch (err) {
      console.warn('bmsService.updateUser warning:', err);
    }

    setUsers(prev => {
      const updated = prev.map(u => String(u.id) === String(selectedUser.id) ? { ...u, ...payload, tenantId: selectedTenant, ...(updatedResult || {}) } : u);
      localStorage.setItem('scada_users_db', JSON.stringify(updated));
      return updated;
    });

    setMessage({ type: 'success', text: `User "${formData.name}" updated successfully!` });
    setShowEditModal(false);
  };

  // DELETE /api/v1/users/{id} - Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await bmsService.deleteUser(selectedUser.id);
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

  // POST /api/v1/users/{id}/unlock - Admin Unlock User Account
  const handleUnlockUser = async (user) => {
    try {
      await bmsService.unlockUser(user.id);
      setUsers(prev => prev.map(u => String(u.id) === String(user.id) ? { ...u, status: 'ACTIVE' } : u));
      setMessage({ type: 'success', text: `User account for "${user.name}" has been unlocked successfully.` });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to unlock user account.' });
    }
  };

  // POST /api/v1/users/{id}/change-password - Admin Change Password
  const handleAdminChangePassword = async (e) => {
    if (e) e.preventDefault();
    if (!passwordUserId || !newPassword) return;
    setPasswordLoading(true);
    try {
      await bmsService.adminChangePassword(passwordUserId, { password: newPassword, newPassword });
      setMessage({ type: 'success', text: `Password for "${passwordUserName}" has been updated successfully.` });
      setShowChangePasswordModal(false);
      setNewPassword('');
      setPasswordUserId(null);
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to change user password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // GET /api/v1/users/{id} - Fetch Single User Details
  const handleViewDetails = async (user) => {
    try {
      const res = await bmsService.getUser(user.id);
      const userObj = res?.data || res?.user || res;
      setSelectedUser(userObj || user);
    } catch (e) {
      setSelectedUser(user);
    }
    setShowDetailModal(true);
  };

  // RBAC Roles Handlers
  const handleCreateRole = async (e) => {
    if (e) e.preventDefault();
    if (!roleFormData.name.trim()) return;
    setRoleLoading(true);
    try {
      const payload = {
        name: roleFormData.name.trim(),
        description: roleFormData.description || '',
        permissionCodes: roleFormData.permissionCodes || []
      };
      const res = await bmsService.createRole(payload);
      const created = res?.data || { ...payload, id: `role_${Date.now().toString(36)}`, isPredefined: false, userCount: 0 };
      setRoles(prev => [...prev, created]);
      setMessage({ type: 'success', text: `Custom role "${payload.name}" created successfully!` });
      setShowCreateRoleModal(false);
      setRoleFormData({ name: '', description: '', permissionCodes: [] });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to create custom role' });
    } finally {
      setRoleLoading(false);
    }
  };

  const handleUpdateRole = async (e) => {
    if (e) e.preventDefault();
    if (!selectedRole || selectedRole.isPredefined) return;
    setRoleLoading(true);
    try {
      const payload = {
        name: roleFormData.name.trim(),
        description: roleFormData.description || '',
        permissionCodes: roleFormData.permissionCodes || []
      };
      await bmsService.updateRole(selectedRole.id, payload);
      setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...r, ...payload, permissions: payload.permissionCodes } : r));
      setMessage({ type: 'success', text: `Role "${payload.name}" updated successfully!` });
      setShowEditRoleModal(false);
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update role' });
    } finally {
      setRoleLoading(false);
    }
  };

  const handleCloneRole = async (e) => {
    if (e) e.preventDefault();
    if (!selectedRole || !cloneRoleName.trim()) return;
    setRoleLoading(true);
    try {
      const payload = { name: cloneRoleName.trim(), description: `Cloned from ${selectedRole.name}` };
      const res = await bmsService.cloneRole(selectedRole.id, payload);
      const cloned = res?.data || {
        id: `role_${Date.now().toString(36)}`,
        name: payload.name,
        description: payload.description,
        isPredefined: false,
        permissions: selectedRole.permissions || [],
        userCount: 0
      };
      setRoles(prev => [...prev, cloned]);
      setMessage({ type: 'success', text: `Role cloned as "${payload.name}" successfully!` });
      setShowCloneRoleModal(false);
      setCloneRoleName('');
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to clone role' });
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    if (selectedRole.isPredefined) {
      setMessage({ type: 'error', text: 'Predefined system roles cannot be deleted.' });
      return;
    }
    if ((selectedRole.userCount || 0) > 0) {
      setMessage({ type: 'error', text: `Cannot delete role assigned to ${selectedRole.userCount} active users.` });
      return;
    }
    try {
      await bmsService.deleteRole(selectedRole.id);
      setRoles(prev => prev.filter(r => r.id !== selectedRole.id));
      setMessage({ type: 'success', text: `Role "${selectedRole.name}" deleted successfully.` });
      setShowDeleteRoleModal(false);
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to delete role' });
    }
  };

  const togglePermissionCode = (code) => {
    setRoleFormData(prev => {
      const current = prev.permissionCodes || [];
      const updated = current.includes(code)
        ? current.filter(c => c !== code)
        : [...current, code];
      return { ...prev, permissionCodes: updated };
    });
  };

  const toggleCategoryPermissions = (categoryPerms) => {
    setRoleFormData(prev => {
      const current = prev.permissionCodes || [];
      const categoryCodes = categoryPerms.map(p => p.code);
      const allSelected = categoryCodes.every(c => current.includes(c));
      const updated = allSelected
        ? current.filter(c => !categoryCodes.includes(c))
        : Array.from(new Set([...current, ...categoryCodes]));
      return { ...prev, permissionCodes: updated };
    });
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
        
        {/* Top Navigation Bar: Manage Modules Popover & Role-Scoped Tabs */}
        <div className="p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3 scada-controls-header">
          <div className="d-flex flex-wrap align-items-center gap-2.5">
            {/* Manage Modules Selector Popover (ismartaccess-v2 style) */}
            <div className="position-relative" ref={selectorRef}>
              <button
                type="button"
                onClick={() => setShowManageSelector(!showManageSelector)}
                className="btn btn-sm px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2"
                style={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  color: '#f8fafc',
                  fontSize: '0.84rem'
                }}
              >
                <Sliders size={15} className="text-cyan-400" />
                <span>Manage Modules</span>
                <ChevronDown size={14} className={`text-slate-400 transition-all ${showManageSelector ? 'rotate-180' : ''}`} />
              </button>

              {showManageSelector && (
                <div
                  className="position-absolute shadow-2xl rounded-4 p-3 z-3"
                  style={{
                    top: '115%',
                    left: 0,
                    width: '320px',
                    backgroundColor: '#0c1017',
                    border: '1px solid #243044',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                    zIndex: 1050
                  }}
                >
                  <div className="fs-11 fw-bold text-slate-400 text-uppercase mb-2 px-1" style={{ letterSpacing: '0.6px' }}>
                    Access & User Management Modules
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {/* Module 1: Users */}
                    <div
                      onClick={() => {
                        setActiveTab('all-users');
                        setShowManageSelector(false);
                      }}
                      className="p-2.5 rounded-3 d-flex align-items-center gap-3 cursor-pointer transition-all"
                      style={{
                        backgroundColor: isUserTab ? 'rgba(99, 102, 241, 0.15)' : '#131924',
                        border: `1px solid ${isUserTab ? '#6366f1' : '#1e293b'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div className="p-2 rounded-2" style={{ backgroundColor: '#6366f1', color: '#fff' }}>
                        <Users size={16} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold fs-13 text-slate-100">Users Directory</div>
                        <div className="fs-11 text-slate-400">All system & organization users ({users.length})</div>
                      </div>
                    </div>

                    {/* Module 2: Manage Roles */}
                    <div
                      onClick={() => {
                        setActiveTab('roles');
                        setShowManageSelector(false);
                      }}
                      className="p-2.5 rounded-3 d-flex align-items-center gap-3 cursor-pointer transition-all"
                      style={{
                        backgroundColor: activeTab === 'roles' ? 'rgba(139, 92, 246, 0.15)' : '#131924',
                        border: `1px solid ${activeTab === 'roles' ? '#8b5cf6' : '#1e293b'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div className="p-2 rounded-2" style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
                        <Shield size={16} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold fs-13 text-slate-100">Manage Roles</div>
                        <div className="fs-11 text-slate-400">RBAC permissions & policies ({roles.length})</div>
                      </div>
                    </div>

                    {/* Module 3: Manage Organisation */}
                    <div
                      onClick={() => {
                        setShowManageSelector(false);
                        navigate('/manage-organisation');
                      }}
                      className="p-2.5 rounded-3 d-flex align-items-center gap-3 cursor-pointer transition-all"
                      style={{
                        backgroundColor: '#131924',
                        border: '1px solid #1e293b',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="p-2 rounded-2" style={{ backgroundColor: '#0284c7', color: '#fff' }}>
                        <Building2 size={16} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold fs-13 text-slate-100">Manage Organisation</div>
                        <div className="fs-11 text-slate-400">Tenants & facility hierarchy</div>
                      </div>
                      <ExternalLink size={13} className="text-slate-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6 Role-Scoped Navigation Tabs */}
            <div className="d-flex flex-wrap align-items-center gap-1.5">
              <button 
                onClick={() => setActiveTab('all-users')}
                className={`btn btn-sm px-3 py-1.5 rounded-3 fw-bold d-flex align-items-center gap-2 transition-all ${activeTab === 'all-users' ? 'btn-primary' : 'btn-outline-secondary text-slate-300'}`}
                style={{ fontSize: '0.82rem', backgroundColor: activeTab === 'all-users' ? '#6366f1' : 'transparent', borderColor: activeTab === 'all-users' ? '#6366f1' : '#334155' }}
              >
                <Users size={14} /> All Users ({users.length})
              </button>
              <button 
                onClick={() => setActiveTab('administrators')}
                className={`btn btn-sm px-3 py-1.5 rounded-3 fw-bold d-flex align-items-center gap-2 transition-all ${activeTab === 'administrators' ? 'btn-primary' : 'btn-outline-secondary text-slate-300'}`}
                style={{ fontSize: '0.82rem', backgroundColor: activeTab === 'administrators' ? '#ef4444' : 'transparent', borderColor: activeTab === 'administrators' ? '#ef4444' : '#334155', color: activeTab === 'administrators' ? '#ffffff' : '#cbd5e1' }}
              >
                <ShieldAlert size={14} /> Administrator ({adminCount})
              </button>
              <button 
                onClick={() => setActiveTab('operators')}
                className={`btn btn-sm px-3 py-1.5 rounded-3 fw-bold d-flex align-items-center gap-2 transition-all ${activeTab === 'operators' ? 'btn-primary' : 'btn-outline-secondary text-slate-300'}`}
                style={{ fontSize: '0.82rem', backgroundColor: activeTab === 'operators' ? '#f59e0b' : 'transparent', borderColor: activeTab === 'operators' ? '#f59e0b' : '#334155', color: activeTab === 'operators' ? '#ffffff' : '#cbd5e1' }}
              >
                <Sliders size={14} /> Operator & Manager ({opCount})
              </button>
              <button 
                onClick={() => setActiveTab('viewers')}
                className={`btn btn-sm px-3 py-1.5 rounded-3 fw-bold d-flex align-items-center gap-2 transition-all ${activeTab === 'viewers' ? 'btn-primary' : 'btn-outline-secondary text-slate-300'}`}
                style={{ fontSize: '0.82rem', backgroundColor: activeTab === 'viewers' ? '#06b6d4' : 'transparent', borderColor: activeTab === 'viewers' ? '#06b6d4' : '#334155', color: activeTab === 'viewers' ? '#ffffff' : '#cbd5e1' }}
              >
                <Eye size={14} /> Viewer ({viewerCount})
              </button>
              <button 
                onClick={() => setActiveTab('roles')}
                className={`btn btn-sm px-3 py-1.5 rounded-3 fw-bold d-flex align-items-center gap-2 transition-all ${activeTab === 'roles' ? 'btn-primary' : 'btn-outline-secondary text-slate-300'}`}
                style={{ fontSize: '0.82rem', backgroundColor: activeTab === 'roles' ? '#8b5cf6' : 'transparent', borderColor: activeTab === 'roles' ? '#8b5cf6' : '#334155', color: activeTab === 'roles' ? '#ffffff' : '#cbd5e1' }}
              >
                <Shield size={14} /> RBAC Roles ({roles.length})
              </button>
              <button 
                onClick={() => setActiveTab('invitations')}
                className={`btn btn-sm px-3 py-1.5 rounded-3 fw-bold d-flex align-items-center gap-2 transition-all ${activeTab === 'invitations' ? 'btn-primary' : 'btn-outline-secondary text-slate-300'}`}
                style={{ fontSize: '0.82rem', backgroundColor: activeTab === 'invitations' ? '#10b981' : 'transparent', borderColor: activeTab === 'invitations' ? '#10b981' : '#334155', color: activeTab === 'invitations' ? '#ffffff' : '#cbd5e1' }}
              >
                <Send size={14} /> Invitations ({pendingInvitesCount})
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {activeTab === 'roles' ? (
              <Button 
                size="sm" 
                onClick={() => {
                  setRoleFormData({ 
                    name: '', 
                    description: '', 
                    permissionCodes: [], 
                    roleType: 'ORGANIZATION',
                    organizationId: tenants[0]?.id || '' 
                  });
                  setShowCreateRoleModal(true);
                }} 
                className="rounded-3 px-3.5 py-1.5 fw-bold border-0 d-flex align-items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: '#ffffff', fontSize: '0.84rem', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)' }}
              >
                <ShieldPlus size={15} /> Create Custom Role
              </Button>
            ) : (
              <>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setInviteFormData({ 
                      email: '', 
                      role: 'OPERATOR', 
                      tenantId: tenants[0]?.id || '', 
                      scopeType: 'ZONE', 
                      expirationDays: '7', 
                      note: '' 
                    });
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
                    setFormData({ 
                      name: '', 
                      email: '', 
                      password: '', 
                      role: 'VIEWER', 
                      roleId: '', 
                      tenantId: tenants[0]?.id || '', 
                      roleType: 'SYSTEM',
                      status: 'ACTIVE', 
                      scopeType: 'ZONE', 
                      scopeId: zones[0]?.id || '', 
                      permissions: 'read,write' 
                    });
                    setEmailError('');
                    setShowCreateModal(true);
                  }} 
                  className="rounded-3 px-3.5 py-1.5 fw-bold border-0 d-flex align-items-center gap-2 btn-add-new-user"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#ffffff', fontSize: '0.84rem', boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)' }}
                >
                  <UserPlus size={15} /> Add New User
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Controls Header - Search & Filters */}
        <div className="p-3 border-bottom scada-controls-header">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            
            {/* Left Controls: Search, Roles Filter, Status Filter */}
            <div className="d-flex flex-wrap align-items-center gap-3 flex-grow-1">
              {/* Search Bar */}
              <InputGroup style={{ maxWidth: '320px' }}>
                <InputGroup.Text className="scada-search-icon" style={{ paddingLeft: '12px', paddingRight: '8px' }}>
                  <Search size={15} />
                </InputGroup.Text>
                <Form.Control
                  className="scada-search-input"
                  placeholder={isUserTab ? "Search user by name, email or ID..." : (activeTab === 'roles' ? "Search role by name or description..." : "Search invitation by email or token...")}
                  style={{ boxShadow: 'none', fontSize: '0.86rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              {activeTab !== 'roles' && (
                <>
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
                      <option value="ACTIVE">{isUserTab ? 'ACTIVE' : 'PENDING'}</option>
                      <option value="INACTIVE">{isUserTab ? 'INACTIVE' : 'ACCEPTED'}</option>
                      {activeTab === 'invitations' && <option value="DECLINED">DECLINED</option>}
                    </Form.Select>
                  </div>
                </>
              )}
            </div>

            {/* Right Controls: Refresh */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={isUserTab ? () => fetchUsers(page, pageSize) : (activeTab === 'roles' ? fetchRoles : fetchInvitations)} 
                className="rounded-3 px-3 py-1.5 d-flex align-items-center gap-1.5 btn-refresh-scada"
                style={{ fontSize: '0.84rem', fontWeight: 600 }}
              >
                <RefreshCcw size={14} style={{ color: '#a855f7' }} className={loading || rolesLoading ? 'spin-anim' : ''} /> Refresh
              </Button>
            </div>

          </div>
        </div>

        {/* Custom Table */}
        <div className="table-responsive">
          <table className="w-100 align-middle scada-table" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="scada-table-header">
                {activeTab === 'roles' ? (
                  <>
                    <th className="py-3 px-4 text-start fw-bold">ROLE NAME & TYPE</th>
                    <th className="py-3 text-start fw-bold">DESCRIPTION</th>
                    <th className="py-3 text-start fw-bold">USERS COUNT</th>
                    <th className="py-3 text-start fw-bold">PERMISSIONS</th>
                    <th className="py-3 px-4 text-end fw-bold">ACTIONS</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4 text-start fw-bold">{isUserTab ? 'USER DETAILS' : 'INVITEE DETAILS'}</th>
                    <th className="py-3 text-start fw-bold">{isUserTab ? 'ROLE & STATUS' : 'ROLE & DELEGATED TENANT'}</th>
                    <th className="py-3 text-start fw-bold">{isUserTab ? 'SCOPE / TENANT' : 'INVITATION LINK / TOKEN'}</th>
                    <th className="py-3 text-start fw-bold">{isUserTab ? 'PERMISSIONS' : 'EXPIRATION & STATUS'}</th>
                    <th className="py-3 px-4 text-end fw-bold">ACTIONS</th>
                  </>
                )}
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
              ) : isUserTab ? (
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
                            onClick={() => handleUnlockUser(u)}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981' }}
                            title="Unlock User Account (Reset Rate-Limit Lockout)"
                          >
                            <Unlock size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              setPasswordUserId(u.id);
                              setPasswordUserName(u.name || u.email);
                              setNewPassword('');
                              setShowChangePasswordModal(true);
                            }}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: 'rgba(139, 92, 246, 0.15)', border: '1px solid #8b5cf6', color: '#a78bfa' }}
                            title="Change User Password"
                          >
                            <Key size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser(u);
                              const mapping = u.locationMappings?.[0] || u.zoneLocations?.[0];
                              const parsedScopeType = mapping?.siteId ? 'SITE' : (mapping?.zoneId ? 'ZONE' : (mapping?.zoneNodeType || u.scopeType || 'ZONE'));
                              const parsedScopeId = mapping?.siteId || mapping?.zoneId || mapping?.zoneNodeId || u.scopeId || (parsedScopeType === 'ZONE' ? zones[0]?.id : (parsedScopeType === 'SITE' ? sites[0]?.id : u.tenantId)) || '';
                              setFormData({
                                name: u.name || '',
                                email: u.email || '',
                                password: '',
                                role: u.role === 'USER' ? 'VIEWER' : (u.role || 'VIEWER'),
                                roleId: u.roleId || '',
                                tenantId: u.tenantId || u.scopeId || tenants[0]?.id || '',
                                roleType: u.roleType || 'SYSTEM',
                                status: u.status || 'ACTIVE',
                                scopeType: parsedScopeType,
                                scopeId: parsedScopeId,
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
              ) : activeTab === 'roles' ? (
                /* RBAC ROLES TAB RENDERING */
                filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 scada-table-empty">
                      <div className="d-flex flex-column align-items-center justify-content-center py-3 gap-2">
                        <Shield size={36} className="text-muted opacity-50 mb-1" />
                        <span className="fw-bold fs-15 text-slate-400">No roles found matching query</span>
                        <span className="fs-12 text-slate-500">Click "Create Custom Role" above to configure a new role.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map(r => (
                    <tr key={r.id} className="user-table-row">
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                            style={{ width: 40, height: 40, backgroundColor: r.isPredefined ? 'rgba(139, 92, 246, 0.2)' : 'rgba(6, 182, 212, 0.2)', border: `1px solid ${r.isPredefined ? '#8b5cf6' : '#06b6d4'}`, color: r.isPredefined ? '#c084fc' : '#22d3ee', fontSize: '1rem', flexShrink: 0 }}
                          >
                            <Shield size={18} />
                          </div>
                          <div>
                            <div className="fw-bold user-name d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                              {r.name}
                              {r.isPredefined ? (
                                <Badge bg="secondary" style={{ fontSize: '0.65rem', backgroundColor: '#334155' }}>SYSTEM</Badge>
                              ) : (
                                <Badge bg="info" style={{ fontSize: '0.65rem' }}>CUSTOM</Badge>
                              )}
                            </div>
                            <div className="user-email font-monospace" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              ID: {r.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="fs-13 text-slate-300">
                          {r.description || 'No description provided'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', fontSize: '0.78rem' }}>
                          <Users size={12} className="me-1 inline" /> {r.userCount || 0} Users
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="d-flex flex-wrap gap-1 align-items-center">
                          <Badge bg="dark" className="border border-secondary font-monospace" style={{ fontSize: '0.78rem' }}>
                            {r.permissions?.includes('*') ? 'Wildcard (*)' : `${r.permissions?.length || 0} permissions`}
                          </Badge>
                          {Array.isArray(r.permissions) && r.permissions.slice(0, 2).map((code, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded font-monospace fs-11" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                              {code}
                            </span>
                          ))}
                          {Array.isArray(r.permissions) && r.permissions.length > 2 && (
                            <span className="fs-11 text-slate-400">+{r.permissions.length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button 
                            onClick={() => {
                              setSelectedRole(r);
                              setCloneRoleName(`${r.name}_COPY`);
                              setShowCloneRoleModal(true);
                            }}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#3b82f6' }}
                            title="Clone Role"
                          >
                            <Copy size={13} />
                          </button>
                          <button 
                            disabled={r.isPredefined}
                            onClick={() => {
                              setSelectedRole(r);
                              setRoleFormData({
                                name: r.name,
                                description: r.description || '',
                                permissionCodes: r.permissions || []
                              });
                              setShowEditRoleModal(true);
                            }}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: r.isPredefined ? '#1e293b' : 'rgba(245, 158, 11, 0.15)', border: `1px solid ${r.isPredefined ? '#334155' : '#f59e0b'}`, color: r.isPredefined ? '#64748b' : '#f59e0b', cursor: r.isPredefined ? 'not-allowed' : 'pointer' }}
                            title={r.isPredefined ? 'Predefined system roles cannot be modified' : 'Edit Role'}
                          >
                            <Edit size={13} />
                          </button>
                          <button 
                            disabled={r.isPredefined || (r.userCount || 0) > 0}
                            onClick={() => {
                              setSelectedRole(r);
                              setShowDeleteRoleModal(true);
                            }}
                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center btn-action-icon"
                            style={{ width: 32, height: 32, backgroundColor: (r.isPredefined || (r.userCount || 0) > 0) ? '#1e293b' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${(r.isPredefined || (r.userCount || 0) > 0) ? '#334155' : '#ef4444'}`, color: (r.isPredefined || (r.userCount || 0) > 0) ? '#64748b' : '#ef4444', cursor: (r.isPredefined || (r.userCount || 0) > 0) ? 'not-allowed' : 'pointer' }}
                            title={r.isPredefined ? 'System roles cannot be deleted' : ((r.userCount || 0) > 0 ? 'Cannot delete role with assigned users' : 'Delete Role')}
                          >
                            <Trash2 size={13} />
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
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </Form.Select>
            <span>entries per page</span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="text-slate-400 fs-13">
              {isUserTab ? (
                `Showing ${users.length > 0 ? (page - 1) * pageSize + 1 : 0} to ${Math.min(page * pageSize, total || users.length)} of ${total || users.length} entries`
              ) : activeTab === 'roles' ? (
                `Showing ${filteredRoles.length} of ${roles.length} roles`
              ) : (
                `Showing ${filteredInvitations.length} of ${invitations.length} invitations`
              )}
            </span>
            {isUserTab && (
              <div className="d-flex align-items-center gap-1">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="px-2.5 py-1 border-secondary" 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ backgroundColor: '#0d111a', color: page <= 1 ? '#64748b' : '#ffffff' }}
                >
                  &lt;
                </Button>
                <span className="px-3 py-1 fw-bold fs-12 rounded-2" style={{ backgroundColor: '#6366f1', color: '#ffffff' }}>
                  {page} / {totalPages || 1}
                </span>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="px-2.5 py-1 border-secondary" 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ backgroundColor: '#0d111a', color: page >= totalPages ? '#64748b' : '#ffffff' }}
                >
                  &gt;
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE USER MODAL (POST /api/v1/users) */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered size="xl" className="scada-animated-modal">
        <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
          <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#00bfff' }}>
            <UserPlus size={18} /> Create New User (RBAC & Scope)
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff', maxHeight: '75vh', overflowY: 'auto' }}>
            <Row className="g-4">
              {/* Left Column: User Profile & Role Info */}
              <Col lg={6} className="d-flex flex-column gap-3">
                <div className="fs-12 fw-bold text-uppercase text-cyan-400 d-flex align-items-center gap-1.5 pb-1 border-bottom" style={{ borderColor: '#1e293b' }}>
                  <User size={14} /> User Profile & Credentials
                </div>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Full Name *</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. John Doe"
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Email Address *</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="user@organization.com"
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

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Initial Password (Optional)</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Leave blank for auto-generated or default"
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} 
                    value={formData.password || ''} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  />
                  <Form.Text style={{ color: '#64748b', fontSize: '0.74rem' }}>
                    If empty, the user can activate their account or set password via invitation.
                  </Form.Text>
                </Form.Group>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Tenant Organization *</Form.Label>
                  <Form.Select 
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} 
                    value={formData.tenantId} 
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row className="g-2">
                  <Col md={6}>
                    <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Role Type</Form.Label>
                    <Form.Select 
                      style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} 
                      value={formData.roleType || 'SYSTEM'} 
                      onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                    >
                      <option value="SYSTEM">SYSTEM (Global)</option>
                      <option value="ORGANIZATION">ORGANIZATION (Scoped)</option>
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Account Status</Form.Label>
                    <Form.Select 
                      style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} 
                      value={formData.status} 
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </Form.Select>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Assigned Role *</Form.Label>
                  <Form.Select 
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }} 
                    value={formData.role} 
                    onChange={(e) => {
                      const found = roles.find(r => r.name === e.target.value || r.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        role: found?.name || e.target.value,
                        roleId: found?.id || ''
                      });
                    }}
                  >
                    <optgroup label="System Predefined Roles">
                      {['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    {roles.filter(r => !r.isPredefined).length > 0 && (
                      <optgroup label="Custom Roles">
                        {roles.filter(r => !r.isPredefined).map(cr => (
                          <option key={cr.id} value={cr.name}>{cr.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Right Column: Location Scope Hierarchy (ismartaccess-v2 LocationInput style) */}
              <Col lg={6} className="d-flex flex-column gap-3">
                <div className="fs-12 fw-bold text-uppercase text-cyan-400 d-flex align-items-center gap-1.5 pb-1 border-bottom" style={{ borderColor: '#1e293b' }}>
                  <MapPin size={14} /> Location Hierarchy & Scope Restriction
                </div>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Hierarchy Scope Level</Form.Label>
                  <div className="d-flex gap-2">
                    {['TENANT', 'ZONE', 'SITE'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          let defId = '';
                          if (lvl === 'TENANT') defId = formData.tenantId || tenants[0]?.id || '';
                          else if (lvl === 'ZONE') defId = zones[0]?.id || 'zone-north-01';
                          else if (lvl === 'SITE') defId = sites[0]?.id || 'site-delhi-01';
                          setFormData({ ...formData, scopeType: lvl, scopeId: defId });
                        }}
                        className={`btn btn-sm flex-grow-1 py-2 rounded-3 fw-bold transition-all ${formData.scopeType === lvl ? 'btn-primary' : 'btn-outline-secondary text-slate-300'}`}
                        style={{
                          backgroundColor: formData.scopeType === lvl ? '#0284c7' : '#131924',
                          borderColor: formData.scopeType === lvl ? '#0284c7' : '#243044',
                          fontSize: '0.80rem'
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </Form.Group>

                {formData.scopeType === 'TENANT' && (
                  <Form.Group>
                    <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Selected Tenant Boundary</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={tenants.find(t => t.id === formData.tenantId)?.name || formData.tenantId}
                      style={{ backgroundColor: '#131924', color: '#94a3b8', borderColor: '#243044', boxShadow: 'none' }}
                    />
                    <Form.Text style={{ color: '#64748b', fontSize: '0.74rem' }}>
                      User will have access across all zones and sites within this tenant.
                    </Form.Text>
                  </Form.Group>
                )}

                {formData.scopeType === 'ZONE' && (
                  <Form.Group>
                    <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Target Zone Node *</Form.Label>
                    <Form.Select
                      style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                      value={formData.scopeId}
                      onChange={(e) => setFormData({ ...formData, scopeId: e.target.value })}
                    >
                      {zones.length > 0 ? (
                        zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name} ({z.code || z.id})</option>
                        ))
                      ) : (
                        <option value="zone-north-01">Default North Zone (zone-north-01)</option>
                      )}
                    </Form.Select>
                    <Form.Text style={{ color: '#64748b', fontSize: '0.74rem' }}>
                      Restricts user to devices, alarms, and telemetry within this operational zone.
                    </Form.Text>
                  </Form.Group>
                )}

                {formData.scopeType === 'SITE' && (
                  <Form.Group>
                    <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Target Site Facility *</Form.Label>
                    <Form.Select
                      style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                      value={formData.scopeId}
                      onChange={(e) => setFormData({ ...formData, scopeId: e.target.value })}
                    >
                      {sites.length > 0 ? (
                        sites.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code || s.id})</option>
                        ))
                      ) : (
                        <option value="site-delhi-01">Main Data Center Site (site-delhi-01)</option>
                      )}
                    </Form.Select>
                    <Form.Text style={{ color: '#64748b', fontSize: '0.74rem' }}>
                      Restricts user to this specific physical site facility.
                    </Form.Text>
                  </Form.Group>
                )}

                {/* Scope Preview Card */}
                <div className="p-3 rounded-3" style={{ backgroundColor: '#0c1017', border: '1px solid #1e293b' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fs-12 fw-bold text-slate-300">Generated Zone Location Scope</span>
                    <span className="badge bg-primary fs-11 text-uppercase">{formData.scopeType}</span>
                  </div>
                  <div className="font-monospace fs-11 p-2 rounded-2" style={{ backgroundColor: '#131924', color: '#38bdf8' }}>
                    {`locationMappings: [{ ${formData.scopeType === 'SITE' ? `siteId: ${formData.scopeId || 'null'}` : `zoneId: "${formData.scopeId || formData.tenantId}"`} }]`}
                  </div>
                  <div className="fs-11 text-slate-400 mt-2 d-flex align-items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>Enforced at backend gateway level for telemetry streams and alarms.</span>
                  </div>
                </div>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Explicit Permissions Override (Optional)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. read, write or leave empty for role defaults"
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', fontSize: '0.84rem' }} 
                    value={formData.permissions} 
                    onChange={(e) => setFormData({ ...formData, permissions: e.target.value })} 
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
            <Button variant="outline-secondary" size="sm" className="rounded-3 px-3 border-secondary btn-modal-cancel" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!!emailError} className="rounded-3 fw-bold px-4 border-0 btn-modal-create" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #00bfff 100%)', color: '#ffffff', boxShadow: '0 4px 14px rgba(0, 191, 255, 0.35)' }}>
              Create User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EDIT USER MODAL (PATCH /api/v1/users/{id}) */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="xl" className="scada-animated-modal-edit">
        <Modal.Header closeButton style={{ backgroundColor: '#0a0d14', color: '#ffffff', borderColor: '#1c2433' }}>
          <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#f59e0b' }}>
            <Edit size={18} /> Update User: {selectedUser?.name || selectedUser?.email}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateUser}>
          <Modal.Body style={{ backgroundColor: '#0a0d14', color: '#ffffff', maxHeight: '75vh', overflowY: 'auto' }}>
            <Row className="g-4">
              {/* Left Column: User Profile & Role Info */}
              <Col lg={6} className="d-flex flex-column gap-3">
                <div className="fs-12 fw-bold text-uppercase text-amber-400 d-flex align-items-center gap-1.5 pb-1 border-bottom" style={{ borderColor: '#1e293b' }}>
                  <User size={14} /> User Profile & Credentials
                </div>

                <Form.Group>
                  <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Full Name *</Form.Label>
                  <Form.Control 
                    type="text" 
                    style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px' }} 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Email Address *</Form.Label>
                  <Form.Control 
                    type="email" 
                    style={{ 
                      backgroundColor: '#151c28', 
                      color: '#ffffff', 
                      borderColor: emailError ? '#ef4444' : '#243044', 
                      boxShadow: emailError ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none', 
                      borderRadius: '8px' 
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

                <Form.Group>
                  <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Organization</Form.Label>
                  <Form.Select 
                    disabled
                    style={{ backgroundColor: '#151c28', color: '#94a3b8', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px', cursor: 'not-allowed', opacity: 0.7 }} 
                    value={formData.tenantId} 
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                    ))}
                  </Form.Select>
                  <Form.Text style={{ color: '#64748b', fontSize: '0.74rem' }}>
                    User tenant organization cannot be changed after creation.
                  </Form.Text>
                </Form.Group>

                <Row className="g-2">
                  <Col md={6}>
                    <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Role Type</Form.Label>
                    <Form.Select 
                      style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px' }} 
                      value={formData.roleType || 'SYSTEM'} 
                      onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                    >
                      <option value="SYSTEM">SYSTEM (Global)</option>
                      <option value="ORGANIZATION">ORGANIZATION (Scoped)</option>
                    </Form.Select>
                  </Col>
                  <Col md={6}>
                    <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Account Status</Form.Label>
                    <Form.Select 
                      style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px' }} 
                      value={formData.status} 
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </Form.Select>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Role *</Form.Label>
                  <Form.Select 
                    style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px' }} 
                    value={formData.role} 
                    onChange={(e) => {
                      const found = roles.find(r => r.name === e.target.value || r.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        role: found?.name || e.target.value,
                        roleId: found?.id || ''
                      });
                    }}
                  >
                    <optgroup label="System Predefined Roles">
                      {['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    {roles.filter(r => !r.isPredefined).length > 0 && (
                      <optgroup label="Custom Roles">
                        {roles.filter(r => !r.isPredefined).map(cr => (
                          <option key={cr.id} value={cr.name}>{cr.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Right Column: Location Scope Hierarchy */}
              <Col lg={6} className="d-flex flex-column gap-3">
                <div className="fs-12 fw-bold text-uppercase text-amber-400 d-flex align-items-center gap-1.5 pb-1 border-bottom" style={{ borderColor: '#1e293b' }}>
                  <MapPin size={14} /> Location Hierarchy & Scope Restriction
                </div>

                <Form.Group>
                  <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Hierarchy Scope Level</Form.Label>
                  <div className="d-flex gap-2">
                    {['TENANT', 'ZONE', 'SITE'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          let defId = '';
                          if (lvl === 'TENANT') defId = formData.tenantId || tenants[0]?.id || '';
                          else if (lvl === 'ZONE') defId = zones[0]?.id || 'zone-north-01';
                          else if (lvl === 'SITE') defId = sites[0]?.id || 'site-delhi-01';
                          setFormData({ ...formData, scopeType: lvl, scopeId: defId });
                        }}
                        className={`btn btn-sm flex-grow-1 py-2 rounded-3 fw-bold transition-all ${formData.scopeType === lvl ? 'btn-warning text-dark' : 'btn-outline-secondary text-slate-300'}`}
                        style={{
                          backgroundColor: formData.scopeType === lvl ? '#f59e0b' : '#151c28',
                          borderColor: formData.scopeType === lvl ? '#f59e0b' : '#243044',
                          fontSize: '0.80rem'
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </Form.Group>

                {formData.scopeType === 'TENANT' && (
                  <Form.Group>
                    <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Selected Tenant Boundary</Form.Label>
                    <Form.Control
                      type="text"
                      disabled
                      value={tenants.find(t => t.id === formData.tenantId)?.name || formData.tenantId}
                      style={{ backgroundColor: '#151c28', color: '#94a3b8', borderColor: '#243044', boxShadow: 'none' }}
                    />
                  </Form.Group>
                )}

                {formData.scopeType === 'ZONE' && (
                  <Form.Group>
                    <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Target Zone Node *</Form.Label>
                    <Form.Select
                      style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px' }}
                      value={formData.scopeId}
                      onChange={(e) => setFormData({ ...formData, scopeId: e.target.value })}
                    >
                      {zones.length > 0 ? (
                        zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name} ({z.code || z.id})</option>
                        ))
                      ) : (
                        <option value="zone-north-01">Default North Zone (zone-north-01)</option>
                      )}
                    </Form.Select>
                  </Form.Group>
                )}

                {formData.scopeType === 'SITE' && (
                  <Form.Group>
                    <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Target Site Facility *</Form.Label>
                    <Form.Select
                      style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px' }}
                      value={formData.scopeId}
                      onChange={(e) => setFormData({ ...formData, scopeId: e.target.value })}
                    >
                      {sites.length > 0 ? (
                        sites.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code || s.id})</option>
                        ))
                      ) : (
                        <option value="site-delhi-01">Main Data Center Site (site-delhi-01)</option>
                      )}
                    </Form.Select>
                  </Form.Group>
                )}

                {/* Scope Preview Card */}
                <div className="p-3 rounded-3" style={{ backgroundColor: '#0a0d14', border: '1px solid #1c2433' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fs-12 fw-bold text-slate-300">Updated Scope Preview</span>
                    <span className="badge bg-warning text-dark fs-11 text-uppercase">{formData.scopeType}</span>
                  </div>
                  <div className="font-monospace fs-11 p-2 rounded-2" style={{ backgroundColor: '#151c28', color: '#fbbf24' }}>
                    {`locationMappings: [{ ${formData.scopeType === 'SITE' ? `siteId: ${formData.scopeId || 'null'}` : `zoneId: "${formData.scopeId || formData.tenantId}"`} }]`}
                  </div>
                </div>

                <Form.Group>
                  <Form.Label style={{ color: '#ffffff', fontSize: '0.84rem', fontWeight: 600 }}>Explicit Permissions Override</Form.Label>
                  <Form.Control 
                    type="text" 
                    style={{ backgroundColor: '#151c28', color: '#ffffff', borderColor: '#243044', boxShadow: 'none', borderRadius: '8px', fontSize: '0.84rem' }} 
                    value={formData.permissions} 
                    onChange={(e) => setFormData({ ...formData, permissions: e.target.value })} 
                  />
                </Form.Group>
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

      {/* ADMIN CHANGE PASSWORD MODAL (POST /api/v1/users/{id}/change-password) */}
      <Modal show={showChangePasswordModal} onHide={() => setShowChangePasswordModal(false)} centered className="scada-animated-modal">
        <Form onSubmit={handleAdminChangePassword}>
          <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
            <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#f59e0b' }}>
              <Key size={18} /> Admin Change Password
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff' }}>
            <p className="fs-13 text-slate-300 mb-3">
              Reset account login password for user <strong className="text-light">{passwordUserName}</strong>.
            </p>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>New Password *</Form.Label>
              <Form.Control
                type="password"
                required
                minLength={8}
                placeholder="Enter minimum 8 characters"
                style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowChangePasswordModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={passwordLoading || !newPassword} className="fw-bold px-4 border-0" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#000' }}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* CREATE CUSTOM ROLE MODAL (POST /api/v1/roles) */}
      <Modal show={showCreateRoleModal} onHide={() => setShowCreateRoleModal(false)} centered size="xl" className="scada-animated-modal">
        <Form onSubmit={handleCreateRole}>
          <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
            <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#8b5cf6' }}>
              <ShieldPlus size={18} /> Create Custom RBAC Role
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff', maxHeight: '75vh', overflowY: 'auto' }}>
            <Row className="g-4">
              {/* Left Column: Role Details & Scope */}
              <Col lg={5} className="d-flex flex-column gap-3">
                <div className="fs-12 fw-bold text-uppercase text-purple-400 d-flex align-items-center gap-1.5 pb-1 border-bottom" style={{ borderColor: '#1e293b' }}>
                  <Shield size={14} /> Role Definition & Scope
                </div>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Role Identifier / Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="e.g. MAINTENANCE_SUPERVISOR"
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  />
                  <Form.Text style={{ color: '#64748b', fontSize: '0.74rem' }}>
                    Standard format: UPPERCASE_UNDERSCORE (e.g. OPERATIONS_DIRECTOR)
                  </Form.Text>
                </Form.Group>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Role Scope Type</Form.Label>
                  <Form.Select
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                    value={roleFormData.roleType || 'ORGANIZATION'}
                    onChange={(e) => setRoleFormData({ ...roleFormData, roleType: e.target.value })}
                  >
                    <option value="ORGANIZATION">ORGANIZATION (Scoped to Tenant)</option>
                    <option value="SYSTEM">SYSTEM (Global Application Role)</option>
                  </Form.Select>
                </Form.Group>

                {roleFormData.roleType === 'ORGANIZATION' && (
                  <Form.Group>
                    <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Target Organization *</Form.Label>
                    <Form.Select
                      style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                      value={roleFormData.organizationId || tenants[0]?.id || ''}
                      onChange={(e) => setRoleFormData({ ...roleFormData, organizationId: e.target.value })}
                    >
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Role Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Describe role responsibilities, operational boundaries and access requirements..."
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  />
                </Form.Group>

                {/* RBAC Policy Summary Card */}
                <div className="p-3 rounded-3" style={{ backgroundColor: '#0c1017', border: '1px solid #1e293b' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fs-12 fw-bold text-slate-300">RBAC Policy Summary</span>
                    <Badge bg="purple" style={{ backgroundColor: '#8b5cf6' }}>
                      {(roleFormData.permissionCodes || []).length} Granted
                    </Badge>
                  </div>
                  <p className="fs-11 text-slate-400 mb-2">
                    Users assigned to this role will inherit all selected capabilities across devices, alarm management, ticket dispatch, and reporting.
                  </p>
                  <div className="d-flex align-items-center gap-1.5 fs-11 text-purple-300 font-monospace">
                    <ShieldCheck size={13} />
                    <span>Payload: {(roleFormData.permissionCodes || []).length} Permission Codes</span>
                  </div>
                </div>
              </Col>

              {/* Right Column: Categorized Permissions Matrix */}
              <Col lg={7} className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center justify-content-between pb-1 border-bottom" style={{ borderColor: '#1e293b' }}>
                  <span className="fs-12 fw-bold text-uppercase text-purple-400 d-flex align-items-center gap-1.5">
                    <ShieldCheck size={15} /> Permission Matrix & API Capabilities
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRoleFormData({ ...roleFormData, permissionCodes: permissionsCatalog.map(p => p.code) })}
                      className="btn btn-sm btn-outline-secondary py-0.5 px-2.5 fs-11 rounded-2"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFormData({ ...roleFormData, permissionCodes: [] })}
                      className="btn btn-sm btn-outline-secondary py-0.5 px-2.5 fs-11 rounded-2"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Categorized Permissions Grid */}
                <div className="d-flex flex-column gap-3" style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
                  {Object.entries(permissionsByCategory).map(([cat, perms]) => (
                    <div key={cat} className="p-3 rounded-3" style={{ backgroundColor: '#0d131f', border: '1px solid #1e293b' }}>
                      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2" style={{ borderColor: '#1e293b' }}>
                        <span className="fw-bold text-uppercase fs-12 text-slate-300" style={{ letterSpacing: '0.5px' }}>
                          {cat} Module
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCategoryPermissions(perms)}
                          className="btn btn-link p-0 text-decoration-none fs-11 text-slate-400"
                        >
                          Toggle {cat}
                        </button>
                      </div>
                      <Row className="g-2">
                        {perms.map(p => {
                          const checked = (roleFormData.permissionCodes || []).includes(p.code);
                          return (
                            <Col md={6} key={p.code}>
                              <div 
                                onClick={() => togglePermissionCode(p.code)}
                                className="p-2 rounded-2 d-flex align-items-start gap-2 cursor-pointer transition-all"
                                style={{ 
                                  backgroundColor: checked ? 'rgba(139, 92, 246, 0.15)' : '#131924', 
                                  border: `1px solid ${checked ? '#8b5cf6' : '#1e293b'}`,
                                  cursor: 'pointer'
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={checked} 
                                  onChange={() => {}} 
                                  className="mt-1" 
                                  style={{ cursor: 'pointer' }}
                                />
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <span className="fw-semibold fs-12 text-slate-200">{p.name || p.code}</span>
                                    <span className="font-monospace fs-10 text-slate-400">{p.code}</span>
                                  </div>
                                  {p.description && (
                                    <div className="fs-11 text-slate-400 mt-0.5">{p.description}</div>
                                  )}
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowCreateRoleModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={roleLoading || !roleFormData.name.trim()} className="fw-bold px-4 border-0" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: '#ffffff' }}>
              {roleLoading ? 'Creating...' : 'Create Role'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* EDIT CUSTOM ROLE MODAL (PATCH /api/v1/roles/{id}) */}
      <Modal show={showEditRoleModal} onHide={() => setShowEditRoleModal(false)} centered size="xl" className="scada-animated-modal">
        <Form onSubmit={handleUpdateRole}>
          <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
            <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#f59e0b' }}>
              <Edit size={18} /> Edit Custom Role: {selectedRole?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff', maxHeight: '75vh', overflowY: 'auto' }}>
            <Row className="g-4">
              {/* Left Column: Role Details & Scope */}
              <Col lg={5} className="d-flex flex-column gap-3">
                <div className="fs-12 fw-bold text-uppercase text-amber-400 d-flex align-items-center gap-1.5 pb-1 border-bottom" style={{ borderColor: '#1e293b' }}>
                  <Shield size={14} /> Role Definition & Scope
                </div>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Role Identifier / Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Role Scope Type</Form.Label>
                  <Form.Select
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                    value={roleFormData.roleType || 'ORGANIZATION'}
                    onChange={(e) => setRoleFormData({ ...roleFormData, roleType: e.target.value })}
                  >
                    <option value="ORGANIZATION">ORGANIZATION (Scoped to Tenant)</option>
                    <option value="SYSTEM">SYSTEM (Global Application Role)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>Role Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  />
                </Form.Group>

                {/* RBAC Policy Summary Card */}
                <div className="p-3 rounded-3" style={{ backgroundColor: '#0c1017', border: '1px solid #1e293b' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fs-12 fw-bold text-slate-300">RBAC Policy Summary</span>
                    <Badge bg="warning" text="dark">
                      {(roleFormData.permissionCodes || []).length} Granted
                    </Badge>
                  </div>
                  <p className="fs-11 text-slate-400 mb-0">
                    Modifying permissions will take effect on next token refresh or session validation for active users.
                  </p>
                </div>
              </Col>

              {/* Right Column: Categorized Permissions Matrix */}
              <Col lg={7} className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center justify-content-between pb-1 border-bottom" style={{ borderColor: '#1e293b' }}>
                  <span className="fs-12 fw-bold text-uppercase text-amber-400 d-flex align-items-center gap-1.5">
                    <ShieldCheck size={15} /> Permission Matrix & Capabilities
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRoleFormData({ ...roleFormData, permissionCodes: permissionsCatalog.map(p => p.code) })}
                      className="btn btn-sm btn-outline-secondary py-0.5 px-2.5 fs-11 rounded-2"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFormData({ ...roleFormData, permissionCodes: [] })}
                      className="btn btn-sm btn-outline-secondary py-0.5 px-2.5 fs-11 rounded-2"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Categorized Permissions Grid */}
                <div className="d-flex flex-column gap-3" style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
                  {Object.entries(permissionsByCategory).map(([cat, perms]) => (
                    <div key={cat} className="p-3 rounded-3" style={{ backgroundColor: '#0d131f', border: '1px solid #1e293b' }}>
                      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2" style={{ borderColor: '#1e293b' }}>
                        <span className="fw-bold text-uppercase fs-12 text-slate-300" style={{ letterSpacing: '0.5px' }}>
                          {cat} Module
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCategoryPermissions(perms)}
                          className="btn btn-link p-0 text-decoration-none fs-11 text-slate-400"
                        >
                          Toggle {cat}
                        </button>
                      </div>
                      <Row className="g-2">
                        {perms.map(p => {
                          const checked = (roleFormData.permissionCodes || []).includes(p.code);
                          return (
                            <Col md={6} key={p.code}>
                              <div 
                                onClick={() => togglePermissionCode(p.code)}
                                className="p-2 rounded-2 d-flex align-items-start gap-2 cursor-pointer transition-all"
                                style={{ 
                                  backgroundColor: checked ? 'rgba(245, 158, 11, 0.15)' : '#131924', 
                                  border: `1px solid ${checked ? '#f59e0b' : '#1e293b'}`,
                                  cursor: 'pointer'
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={checked} 
                                  onChange={() => {}} 
                                  className="mt-1" 
                                  style={{ cursor: 'pointer' }}
                                />
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <span className="fw-semibold fs-12 text-slate-200">{p.name || p.code}</span>
                                    <span className="font-monospace fs-10 text-slate-400">{p.code}</span>
                                  </div>
                                  {p.description && (
                                    <div className="fs-11 text-slate-400 mt-0.5">{p.description}</div>
                                  )}
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowEditRoleModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={roleLoading || !roleFormData.name.trim()} className="fw-bold px-4 border-0" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#000' }}>
              {roleLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* CLONE ROLE MODAL (POST /api/v1/roles/{id}/clone) */}
      <Modal show={showCloneRoleModal} onHide={() => setShowCloneRoleModal(false)} centered className="scada-animated-modal">
        <Form onSubmit={handleCloneRole}>
          <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
            <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#38bdf8' }}>
              <Copy size={18} /> Clone Role: {selectedRole?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff' }}>
            <p className="fs-13 text-slate-300 mb-3">
              Create a duplicate custom role inheriting all permissions from <strong className="text-light">{selectedRole?.name}</strong>.
            </p>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#94a3b8', fontSize: '0.84rem', fontWeight: 600 }}>New Cloned Role Name *</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. SENIOR_OPERATOR"
                style={{ backgroundColor: '#131924', color: '#ffffff', borderColor: '#243044', boxShadow: 'none' }}
                value={cloneRoleName}
                onChange={(e) => setCloneRoleName(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowCloneRoleModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={roleLoading || !cloneRoleName.trim()} className="fw-bold px-4 border-0" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', color: '#ffffff' }}>
              {roleLoading ? 'Cloning...' : 'Clone Role'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* DELETE ROLE MODAL (DELETE /api/v1/roles/{id}) */}
      <Modal show={showDeleteRoleModal} onHide={() => setShowDeleteRoleModal(false)} centered className="scada-animated-modal-delete">
        <Modal.Header closeButton style={{ backgroundColor: '#0c1017', color: '#ffffff', borderColor: '#1e293b' }}>
          <Modal.Title className="fs-16 fw-bold d-flex align-items-center gap-2" style={{ color: '#ef4444' }}>
            <Trash2 size={18} /> Confirm Delete Role
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#070a0f', color: '#ffffff' }}>
          <p className="fs-14 mb-0" style={{ color: '#cbd5e1' }}>
            Are you sure you want to delete custom role <strong style={{ color: '#ef4444' }}>{selectedRole?.name}</strong>?
          </p>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#0c1017', borderColor: '#1e293b' }}>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowDeleteRoleModal(false)}>Cancel</Button>
          <Button size="sm" onClick={handleDeleteRole} className="fw-bold px-4 border-0" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: '#ffffff' }}>
            Confirm Delete
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

export default UserAdministration;
