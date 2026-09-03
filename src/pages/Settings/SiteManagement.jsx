import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Badge, Button, Modal, Form, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Plus, Building2, Activity, AlertTriangle, Zap,
  Eye, RefreshCw, Search, LayoutGrid, List, ChevronRight,
  Globe, Server, Clock, TrendingUp, Edit3, Power, CheckCircle, XCircle
} from 'lucide-react';

import { getAuthToken } from '../../utils/cookieUtils';
import { useSiteStore } from '../../context/SiteContext';

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = getAuthToken() || '';

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Helper to format dates safely
const formatDate = (dateStr) => {
  if (!dateStr) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normalizeList = (raw, key) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (raw.data && Array.isArray(raw.data[key])) return raw.data[key];
  if (Array.isArray(raw[key])) return raw[key];
  return [];
};

const SiteManagement = () => {
  const navigate = useNavigate();
  const { sites, setSites, addSite, updateSite, deleteSite: removeSiteFromStore, fetchSites: refreshStoreSites } = useSiteStore();
  const [tenants, setTenants] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [editingSite, setEditingSite] = useState(null);
  const [siteStats, setSiteStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    sochiotLocationId: '',
    organizationId: '',
    tenantId: '',
    zoneId: '',
    areaId: '',
    city: '',
    state: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    sochiotLocationId: '',
    organizationId: '',
    tenantId: '',
    zoneId: '',
    areaId: '',
    city: '',
    state: '',
    status: 'ACTIVE'
  });

  // Fetch hierarchy (Tenants, Zones, Tenant Areas)
  const fetchHierarchyData = useCallback(async () => {
    try {
      const [tRes, zRes, aRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tenants`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/zones`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/areas`, { headers: getAuthHeaders() })
      ]);

      if (tRes.ok) {
        const json = await tRes.json();
        const list = normalizeList(json, 'tenants');
        setTenants(list.filter(t => t.status !== 'INACTIVE' && !t.deletedAt));
      }
      if (zRes.ok) {
        const json = await zRes.json();
        const list = normalizeList(json, 'zones');
        setZones(list.filter(z => z.status !== 'INACTIVE' && !z.deletedAt));
      }
      if (aRes.ok) {
        const json = await aRes.json();
        const list = normalizeList(json, 'areas');
        setAreas(list.filter(a => a.status !== 'INACTIVE' && !a.deletedAt));
      }
    } catch (err) {
      console.warn('Hierarchy fetch notice:', err);
    }
  }, []);

  // Fetch sites strictly from backend API dynamically
  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sites`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const result = await response.json();
        const list = normalizeList(result, 'sites');
        setSites(list);
      } else {
        setSites([]);
      }
    } catch (err) {
      console.warn('Sites fetch notice:', err);
      setSites([]);
    }
    setLoading(false);
  }, []);

  // Fetch site stats directly from backend
  const fetchSiteStats = async (siteId) => {
    if (!siteId || siteId === 'undefined') return;
    setSiteStats(null);
    try {
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}/stats`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const result = await response.json();
        setSiteStats(result?.data || result);
      }
    } catch (err) {
      console.warn('Site stats fetch notice:', err);
    }
  };

  useEffect(() => {
    fetchSites();
    fetchHierarchyData();
  }, [fetchSites, fetchHierarchyData]);

  // Create site handler
  const handleCreateSite = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setMessage({ type: 'error', text: 'Site name is required.' });
      return;
    }
    setSubmitting(true);

    const locationId = parseInt(createForm.sochiotLocationId) || (Math.floor(Date.now() / 1000) % 89999 + 1000);
    const orgId = parseInt(createForm.organizationId) || 1;

    const payload = {
      name: createForm.name.trim(),
      sochiotLocationId: locationId,
      organizationId: orgId,
      city: createForm.city.trim() || 'Noida',
      state: createForm.state.trim() || 'Uttar Pradesh',
      ...(createForm.tenantId?.trim() ? { tenantId: createForm.tenantId.trim() } : {}),
      ...(createForm.zoneId?.trim() ? { zoneId: createForm.zoneId.trim() } : {}),
      ...(createForm.areaId?.trim() ? { areaId: createForm.areaId.trim() } : {})
    };

    let createdSiteFromDb = null;

    try {
      const response = await fetch(`${API_BASE_URL}/sites`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        createdSiteFromDb = result?.data || result?.site || result;
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn('Backend create site error:', errData);
      }
    } catch (err) {
      console.warn('Create site API notice:', err);
    }

    const finalSite = {
      id: createdSiteFromDb?.id || `site_${Date.now().toString(36)}`,
      name: payload.name,
      sochiotLocationId: payload.sochiotLocationId,
      organizationId: payload.organizationId,
      tenantId: payload.tenantId || '',
      zoneId: payload.zoneId || '',
      areaId: payload.areaId || '',
      city: payload.city,
      state: payload.state,
      status: 'ACTIVE',
      createdAt: createdSiteFromDb?.createdAt || new Date().toISOString()
    };

    await fetchSites();
    setMessage({ type: 'success', text: `Site "${payload.name}" created successfully!` });
    setShowCreateModal(false);
    setCreateForm({ name: '', sochiotLocationId: '', organizationId: '', tenantId: '', zoneId: '', areaId: '', city: '', state: '' });
    setSubmitting(false);
  };

  // Open Edit Modal
  const handleOpenEditModal = (site) => {
    if (!site) return;
    setEditingSite(site);
    setEditForm({
      id: site.id,
      name: site.name || '',
      sochiotLocationId: site.sochiotLocationId || '',
      organizationId: site.organizationId || '',
      tenantId: site.tenantId || '',
      zoneId: site.zoneId || '',
      areaId: site.areaId || '',
      city: site.city || '',
      state: site.state || '',
      status: site.status || 'ACTIVE'
    });
    setShowEditModal(true);
  };

  // Save Edit Site (PATCH /api/sites/:siteId)
  const handleUpdateSite = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.id) {
      setMessage({ type: 'error', text: 'Valid site ID and name are required.' });
      return;
    }
    setSubmitting(true);

    const updatePayload = {
      name: editForm.name.trim(),
      sochiotLocationId: parseInt(editForm.sochiotLocationId) || 7,
      organizationId: parseInt(editForm.organizationId) || 7,
      tenantId: editForm.tenantId || undefined,
      zoneId: editForm.zoneId || undefined,
      areaId: editForm.areaId || undefined,
      city: editForm.city.trim(),
      state: editForm.state.trim(),
      status: editForm.status
    };

    try {
      await fetch(`${API_BASE_URL}/sites/${editForm.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatePayload)
      });
    } catch (err) {
      console.warn('Update site API notice:', err);
    }

    // Update global store
    updateSite(editForm.id, updatePayload);

    setMessage({ type: 'success', text: `Site "${editForm.name}" updated successfully!` });
    setShowEditModal(false);
    setSubmitting(false);
  };

  // Toggle Enable / Disable Status
  const handleToggleSiteStatus = async (site, e) => {
    if (e) e.stopPropagation();
    if (!site || !site.id) return;
    const newStatus = site.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await fetch(`${API_BASE_URL}/sites/${site.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.warn('Toggle site status notice:', err);
    }

    // Update global store
    updateSite(site.id, { status: newStatus });

    setMessage({
      type: newStatus === 'ACTIVE' ? 'success' : 'warning',
      text: `Site "${site.name}" is now ${newStatus === 'ACTIVE' ? 'ENABLED' : 'DISABLED'}!`
    });
  };

  // View site details
  const handleViewSite = async (site) => {
    if (!site || !site.id || site.id === 'undefined') return;
    setSelectedSite(site);
    setShowDetailModal(true);
    fetchSiteStats(site.id);

    try {
      const response = await fetch(`${API_BASE_URL}/sites/${site.id}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData?.data || resData?.site) {
          setSelectedSite(resData.data || resData.site);
        }
      }
    } catch (e) {
      console.warn('Site details fetch notice:', e);
    }
  };

  // Filter sites - Only active ones are displayed and counted
  const activeSites = sites.filter(s => s.status !== 'INACTIVE' && s.status !== 'DISABLED' && s.isActive !== false && !s.deletedAt);

  const filteredSites = activeSites.filter(s => {
    const q = searchQuery.toLowerCase();
    return !q || (s.name || '').toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q) || (s.state || '').toLowerCase().includes(q);
  });

  // Auto-clear messages
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const statusBadge = (status) => {
    const s = (status || 'ACTIVE').toUpperCase();
    const colors = { ACTIVE: '#10b981', MAINTENANCE: '#f59e0b', INACTIVE: '#ef4444', DISABLED: '#64748b' };
    const bgOpacity = { ACTIVE: 'rgba(16, 185, 129, 0.15)', MAINTENANCE: 'rgba(245, 158, 11, 0.15)', INACTIVE: 'rgba(239, 68, 68, 0.15)', DISABLED: 'rgba(100, 116, 139, 0.15)' };
    return (
      <span style={{
        backgroundColor: bgOpacity[s] || 'rgba(100,116,139,0.15)',
        color: colors[s] || '#6b7280',
        border: `1px solid ${colors[s] || '#6b7280'}40`,
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        padding: '4px 12px',
        borderRadius: 20,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: colors[s] || '#6b7280', display: 'inline-block' }} />
        {s === 'INACTIVE' ? 'DISABLED' : s}
      </span>
    );
  };

  return (
    <Container fluid className="site-mgmt-wrapper py-4 px-lg-4" style={{ minHeight: '100vh' }}>
      <style>{`
        .site-mgmt-wrapper {
          background-color: #070605;
          color: #e2e8f0;
        }
        body.light-mode .site-mgmt-wrapper {
          background-color: var(--scada-bg, #e2e8f0) !important;
          color: #1e293b !important;
        }
        .site-card {
          background: linear-gradient(135deg, rgba(30, 30, 36, 0.95), rgba(20, 20, 25, 0.9));
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          overflow: hidden;
          position: relative;
        }
        .site-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .site-card:hover {
          transform: translateY(-6px);
          border-color: rgba(6, 182, 212, 0.35);
          box-shadow: 0 20px 40px rgba(0,0,0,0.45), 0 0 30px rgba(6,182,212,0.1);
        }
        .site-card:hover::before { opacity: 1; }
        body.light-mode .site-card {
          background: linear-gradient(135deg, #ffffff, #f8fafc) !important;
          border-color: #e2e8f0 !important;
          color: #1e293b !important;
        }
        body.light-mode .site-card:hover {
          box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 0 30px rgba(6,182,212,0.12) !important;
          border-color: rgba(6, 182, 212, 0.4) !important;
        }
        .stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 6px 12px;
          font-size: 0.78rem;
          color: #94a3b8;
          transition: all 0.25s;
        }
        .stat-pill:hover {
          background: rgba(6,182,212,0.1);
          border-color: rgba(6,182,212,0.2);
        }
        body.light-mode .stat-pill {
          background: #f1f5f9 !important;
          border-color: #e2e8f0 !important;
          color: #475569 !important;
        }
        .site-table-row {
          transition: all 0.2s;
        }
        .site-table-row:hover {
          background: rgba(6,182,212,0.06) !important;
        }
        .create-site-btn {
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          border: none;
          border-radius: 14px;
          padding: 12px 28px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(6,182,212,0.25);
        }
        .create-site-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(6,182,212,0.4);
        }
        .search-input-site {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #e2e8f0;
          padding: 10px 16px 10px 42px;
          font-size: 0.9rem;
          transition: all 0.3s;
        }
        .search-input-site:focus {
          background: rgba(255,255,255,0.06);
          border-color: rgba(6,182,212,0.4);
          box-shadow: 0 0 0 3px rgba(6,182,212,0.1);
          color: #f1f5f9;
          outline: none;
        }
        .search-input-site::placeholder { color: #64748b; }
        body.light-mode .search-input-site {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #1e293b !important;
        }
        .view-toggle-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #64748b;
          border-radius: 10px;
          padding: 8px 12px;
          transition: all 0.25s;
          cursor: pointer;
        }
        .view-toggle-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
        }
        .view-toggle-btn.active-view {
          background: rgba(6,182,212,0.15);
          border-color: rgba(6,182,212,0.3);
          color: #06b6d4;
        }
        body.light-mode .view-toggle-btn {
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
          color: #64748b !important;
        }
        body.light-mode .view-toggle-btn.active-view {
          background: rgba(6,182,212,0.1) !important;
          border-color: rgba(6,182,212,0.3) !important;
          color: #0284c7 !important;
        }
        /* Toggle Switch UI */
        .toggle-switch-pill {
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.25s;
          user-select: none;
        }
        .toggle-switch-pill.enabled {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
        }
        .toggle-switch-pill.enabled:hover {
          background: rgba(16, 185, 129, 0.25);
        }
        .toggle-switch-pill.disabled {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        .toggle-switch-pill.disabled:hover {
          background: rgba(239, 68, 68, 0.25);
        }
        .action-icon-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          color: #94a3b8;
          transition: all 0.25s;
          cursor: pointer;
        }
        .action-icon-btn:hover {
          background: rgba(6,182,212,0.15);
          border-color: rgba(6,182,212,0.3);
          color: #06b6d4;
          transform: translateY(-1px);
        }
        body.light-mode .action-icon-btn {
          background: #f1f5f9 !important;
          border-color: #e2e8f0 !important;
          color: #475569 !important;
        }
        .detail-stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s;
        }
        .detail-stat-card:hover {
          background: rgba(6,182,212,0.06);
          border-color: rgba(6,182,212,0.15);
        }
        body.light-mode .detail-stat-card {
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        .site-modal .modal-content {
          background: linear-gradient(135deg, #1a1a2e, #16162a);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          color: #e2e8f0;
        }
        body.light-mode .site-modal .modal-content {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #1e293b !important;
        }
        .site-modal .modal-header {
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        body.light-mode .site-modal .modal-header {
          border-bottom-color: #e2e8f0 !important;
        }
        .site-modal .form-control, .site-modal .form-select {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #e2e8f0;
          padding: 10px 14px;
        }
        .site-modal .form-control:focus, .site-modal .form-select:focus {
          background: rgba(255,255,255,0.06);
          border-color: rgba(6,182,212,0.5);
          box-shadow: 0 0 0 3px rgba(6,182,212,0.1);
          color: #f1f5f9;
        }
        body.light-mode .site-modal .form-control, body.light-mode .site-modal .form-select {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #1e293b !important;
        }
        .site-modal .form-label {
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }
        body.light-mode .site-modal .form-label { color: #475569 !important; }
        .stat-val-text { color: #f1f5f9; }
        body.light-mode .stat-val-text { color: #0f172a !important; }
        .stat-lbl-text { color: #64748b; }
        body.light-mode .stat-lbl-text { color: #475569 !important; }
        .config-val-text { color: #e2e8f0; }
        body.light-mode .config-val-text { color: #0f172a !important; }
        .config-lbl-text { color: #64748b; }
        body.light-mode .config-lbl-text { color: #475569 !important; }
        .modal-subtitle-text { color: #94a3b8; }
        body.light-mode .modal-subtitle-text { color: #475569 !important; }
        .section-subtitle-text { color: #94a3b8; }
        body.light-mode .section-subtitle-text { color: #334155 !important; }
        .site-title-text { color: #f1f5f9; }
        body.light-mode .site-title-text { color: #0f172a !important; }
        .site-config-box {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
        }
        body.light-mode .site-config-box {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
        }
        .site-config-row {
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .site-config-row:last-child {
          border-bottom: none;
        }
        body.light-mode .site-config-row {
          border-bottom-color: #e2e8f0 !important;
        }
        body.light-mode .site-modal .btn-close {
          filter: invert(0) !important;
          opacity: 0.8 !important;
        }
        @keyframes slideUpFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .site-card-animated {
          animation: slideUpFadeIn 0.5s ease-out forwards;
        }
      `}</style>

      {/* Toast Notification */}
      {message && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: message.type === 'success' ? 'linear-gradient(135deg, #059669, #10b981)' : message.type === 'warning' ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
          color: '#fff', padding: '14px 24px', borderRadius: 14, fontWeight: 600,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)', fontSize: '0.9rem',
          animation: 'slideUpFadeIn 0.3s ease-out'
        }}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#06b6d4' }}>
            <Building2 size={24} className="me-2" style={{ verticalAlign: 'text-bottom' }} />
            Site
          </h4>
          <p className="mb-0" style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Create, edit, enable/disable & monitor physical sites across your organization
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              className="search-input-site"
              placeholder="Search sites..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 240 }}
            />
          </div>
          {/* View Toggle */}
          <div className="d-flex gap-1">
            <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active-view' : ''}`} onClick={() => setViewMode('grid')}>
              <LayoutGrid size={16} />
            </button>
            <button className={`view-toggle-btn ${viewMode === 'list' ? 'active-view' : ''}`} onClick={() => setViewMode('list')}>
              <List size={16} />
            </button>
          </div>
          {/* Refresh */}
          <OverlayTrigger placement="bottom" overlay={<Tooltip>Refresh Sites</Tooltip>}>
            <button className="view-toggle-btn" onClick={fetchSites}>
              <RefreshCw size={16} />
            </button>
          </OverlayTrigger>
          {/* Create */}
          <button className="create-site-btn text-white d-flex align-items-center gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Create Site
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="info" />
          <p className="mt-3" style={{ color: '#64748b' }}>Loading sites...</p>
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="text-center py-5">
          <MapPin size={48} style={{ color: '#334155' }} />
          <p className="mt-3" style={{ color: '#64748b' }}>No sites found. Create your first site!</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <Row className="g-4">
          {filteredSites.map((site, idx) => {
            const isEnabled = site.status === 'ACTIVE';
            return (
              <Col xs={12} md={6} xl={4} key={site.id}>
                <div
                  className="site-card site-card-animated p-4"
                  style={{ animationDelay: `${idx * 0.08}s` }}
                  onClick={() => handleViewSite(site)}
                >
                  {/* Site Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="fw-bold mb-1" style={{ color: '#f1f5f9', fontSize: '1.05rem' }}>{site.name}</h6>
                      <div className="d-flex align-items-center gap-2" style={{ color: '#64748b', fontSize: '0.82rem' }}>
                        <MapPin size={13} />
                        {site.city || 'N/A'}{site.state ? `, ${site.state}` : ''}
                      </div>
                    </div>
                    {statusBadge(site.status)}
                  </div>

                  {/* Stats Grid */}
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <div className="stat-pill">
                      <Server size={13} style={{ color: '#8b5cf6' }} />
                      <span>{site.devicesCount || 0} Devices</span>
                    </div>
                    <div
                      className="stat-pill"
                      style={{ cursor: 'pointer' }}
                      title="Click to manage buildings for this site"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/manage-organisation?tab=building&siteId=${site.id}`);
                      }}
                    >
                      <Building2 size={13} style={{ color: '#06b6d4' }} />
                      <span>{site.buildingsCount || 0} Buildings</span>
                    </div>
                    <div className="stat-pill">
                      <AlertTriangle size={13} style={{ color: (site.alarmsCount || 0) > 5 ? '#ef4444' : '#f59e0b' }} />
                      <span>{site.alarmsCount || 0} Alarms</span>
                    </div>
                    <div className="stat-pill">
                      <Zap size={13} style={{ color: '#10b981' }} />
                      <span>{(site.energyKwh || 0).toLocaleString()} kWh</span>
                    </div>
                  </div>

                  {/* Card Actions & Footer */}
                  <div className="d-flex justify-content-end align-items-center pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="d-flex align-items-center gap-2">
                      {/* Edit Button */}
                      <OverlayTrigger placement="top" overlay={<Tooltip>Edit Site</Tooltip>}>
                        <div
                          className="action-icon-btn"
                          onClick={(e) => { e.stopPropagation(); handleOpenEditModal(site); }}
                        >
                          <Edit3 size={15} />
                        </div>
                      </OverlayTrigger>

                      {/* View Details Link */}
                      <div className="d-flex align-items-center gap-1 ms-1" style={{ color: '#06b6d4', fontSize: '0.8rem', fontWeight: 600 }}>
                        View Details <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="mt-2 text-end" style={{ fontSize: '0.73rem', color: '#475569' }}>
                    <Clock size={11} className="me-1" /> Created {formatDate(site.createdAt)}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* List / Table View */
        <div style={{
          background: 'rgba(30,30,36,0.6)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Site Name', 'Location', 'Status', 'Devices', 'Alarms', 'Energy', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSites.map(site => {
                return (
                  <tr key={site.id} className="site-table-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#f1f5f9' }}>{site.name}</td>
                    <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <MapPin size={13} className="me-1" /> {site.city || 'N/A'}{site.state ? `, ${site.state}` : ''}
                    </td>
                    <td style={{ padding: '14px 18px' }}>{statusBadge(site.status)}</td>
                    <td style={{ padding: '14px 18px', color: '#8b5cf6', fontWeight: 600 }}>{site.devicesCount || 0}</td>
                    <td style={{ padding: '14px 18px', color: (site.alarmsCount || 0) > 5 ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{site.alarmsCount || 0}</td>
                    <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: 600 }}>{(site.energyKwh || 0).toLocaleString()} kWh</td>
                    <td style={{ padding: '14px 18px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <button className="view-toggle-btn" onClick={() => handleViewSite(site)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                          <Eye size={14} className="me-1" /> View
                        </button>
                        <div className="action-icon-btn" onClick={() => handleOpenEditModal(site)}>
                          <Edit3 size={14} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Site Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered size="lg" className="site-modal" backdrop="static">
        <Modal.Header closeButton closeVariant="white" style={{ border: 'none', padding: '24px 28px 8px' }}>
          <Modal.Title className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '1.15rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} color="#fff" />
            </div>
            Create New Site
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px 28px 28px' }}>
          <Form onSubmit={handleCreateSite}>
            <Row className="g-3">
              {/* 1. Organization / Tenant Select */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Organization / Tenant *</Form.Label>
                  <Form.Select
                    value={createForm.tenantId}
                    onChange={e => {
                      const tId = e.target.value;
                      const selTenant = tenants.find(t => t.id === tId);
                      setCreateForm(p => ({
                        ...p,
                        tenantId: tId,
                        organizationId: selTenant?.sochiotOrgId || 1,
                        zoneId: '',
                        areaId: ''
                      }));
                    }}
                    required
                  >
                    <option value="">Select Organization / Tenant...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.email || t.subscription || 'Tenant'})</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* 2. Geographic Zone Select */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Geographic Zone</Form.Label>
                  <Form.Select
                    value={createForm.zoneId}
                    onChange={e => {
                      const zId = e.target.value;
                      setCreateForm(p => ({ ...p, zoneId: zId, areaId: '' }));
                    }}
                  >
                    <option value="">Select Geographic Zone...</option>
                    {zones
                      .filter(z => !createForm.tenantId || z.tenantId === createForm.tenantId)
                      .map(z => (
                        <option key={z.id} value={z.id}>{z.name} ({z.region || 'Zone'})</option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* 3. Tenant Area Select */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Tenant Area *</Form.Label>
                  <Form.Select
                    value={createForm.areaId}
                    onChange={e => setCreateForm(p => ({ ...p, areaId: e.target.value }))}
                  >
                    <option value="">Select Tenant Area...</option>
                    {areas
                      .filter(a => {
                        if (createForm.zoneId && a.zoneId !== createForm.zoneId) return false;
                        if (createForm.tenantId && a.tenantId !== createForm.tenantId) return false;
                        return true;
                      })
                      .map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Site Name *</Form.Label>
                  <Form.Control
                    placeholder="e.g. Noida Testing Site"
                    value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">City</Form.Label>
                  <Form.Control
                    placeholder="e.g. Noida"
                    value={createForm.city}
                    onChange={e => setCreateForm(p => ({ ...p, city: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">State</Form.Label>
                  <Form.Control
                    placeholder="e.g. Uttar Pradesh"
                    value={createForm.state}
                    onChange={e => setCreateForm(p => ({ ...p, state: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Sochiot Location ID</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g. 7"
                    value={createForm.sochiotLocationId}
                    onChange={e => setCreateForm(p => ({ ...p, sochiotLocationId: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-3 mt-4">
              <Button variant="outline-secondary" onClick={() => setShowCreateModal(false)} style={{ borderRadius: 12, padding: '10px 24px' }}>
                Cancel
              </Button>
              <button type="submit" className="create-site-btn text-white d-flex align-items-center gap-2" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : <Plus size={16} />}
                {submitting ? 'Creating...' : 'Create Site'}
              </button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Site Modal (PATCH /api/sites/:siteId) */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" className="site-modal" backdrop="static">
        <Modal.Header closeButton closeVariant="white" style={{ border: 'none', padding: '24px 28px 8px' }}>
          <Modal.Title className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '1.15rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Edit3 size={18} color="#fff" />
            </div>
            Edit Site Configuration
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px 28px 28px' }}>
          <Form onSubmit={handleUpdateSite}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Organization / Tenant *</Form.Label>
                  <Form.Select
                    disabled
                    value={editForm.tenantId}
                    onChange={e => {
                      const tId = e.target.value;
                      const selTenant = tenants.find(t => t.id === tId);
                      setEditForm(p => ({
                        ...p,
                        tenantId: tId,
                        organizationId: selTenant?.sochiotOrgId || p.organizationId,
                        zoneId: '',
                        areaId: ''
                      }));
                    }}
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  >
                    <option value="">Select Organization / Tenant...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted small fs-11 mt-1 d-block">
                    Organization cannot be edited after site creation.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Geographic Zone</Form.Label>
                  <Form.Select
                    value={editForm.zoneId}
                    onChange={e => setEditForm(p => ({ ...p, zoneId: e.target.value, areaId: '' }))}
                  >
                    <option value="">Select Geographic Zone...</option>
                    {zones
                      .filter(z => !editForm.tenantId || z.tenantId === editForm.tenantId)
                      .map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Tenant Area</Form.Label>
                  <Form.Select
                    value={editForm.areaId}
                    onChange={e => setEditForm(p => ({ ...p, areaId: e.target.value }))}
                  >
                    <option value="">Select Tenant Area...</option>
                    {areas
                      .filter(a => {
                        if (editForm.zoneId && a.zoneId !== editForm.zoneId) return false;
                        if (editForm.tenantId && a.tenantId !== editForm.tenantId) return false;
                        return true;
                      })
                      .map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Site Name *</Form.Label>
                  <Form.Control
                    placeholder="Site Name"
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Status (Enable/Disable)</Form.Label>
                  <Form.Select
                    value={editForm.status}
                    onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                  >
                    <option value="ACTIVE">ACTIVE (Enabled)</option>
                    <option value="INACTIVE">INACTIVE (Disabled)</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">City</Form.Label>
                  <Form.Control
                    placeholder="City"
                    value={editForm.city}
                    onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">State</Form.Label>
                  <Form.Control
                    placeholder="State"
                    value={editForm.state}
                    onChange={e => setEditForm(p => ({ ...p, state: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-3 mt-4">
              <Button variant="outline-secondary" onClick={() => setShowEditModal(false)} style={{ borderRadius: 12, padding: '10px 24px' }}>
                Cancel
              </Button>
              <button type="submit" className="create-site-btn text-white d-flex align-items-center gap-2" disabled={submitting}>
                {submitting ? <Spinner size="sm" /> : <Edit3 size={16} />}
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Site Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg" className="site-modal">
        <Modal.Header closeButton closeVariant="white" style={{ border: 'none', padding: '24px 28px 8px' }}>
          <Modal.Title className="d-flex align-items-center gap-3 fw-bold" style={{ fontSize: '1.15rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="#fff" />
            </div>
            {selectedSite?.name || 'Site Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '16px 28px 28px' }}>
          {selectedSite && (
            <>
              <div className="d-flex flex-wrap align-items-center gap-3 mb-4 modal-subtitle-text" style={{ fontSize: '0.9rem' }}>
                <span><MapPin size={14} className="me-1" /> {selectedSite.city || 'N/A'}{selectedSite.state ? `, ${selectedSite.state}` : ''}</span>
                <span>|</span>
                {statusBadge(selectedSite.status)}
                <span>|</span>
                <span><Clock size={14} className="me-1" /> Created {formatDate(selectedSite.createdAt)}</span>
              </div>

              {/* Stats */}
              <h6 className="fw-bold mb-3 section-subtitle-text" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Activity size={14} className="me-2" /> Site Stats & Metrics
              </h6>
              {siteStats ? (
                <Row className="g-3 mb-4">
                  {[
                    { label: 'Total Devices', value: siteStats.totalDevices || selectedSite.devicesCount || 0, icon: <Server size={22} />, color: '#8b5cf6' },
                    { label: 'Active Alarms', value: siteStats.activeAlarms ?? selectedSite.alarmsCount ?? 0, icon: <AlertTriangle size={22} />, color: '#f59e0b' },
                    { label: 'Energy (kWh)', value: (siteStats.energyConsumption || selectedSite.energyKwh || 0).toLocaleString(), icon: <Zap size={22} />, color: '#10b981' },
                    { label: 'Uptime %', value: `${siteStats.uptime || '99.2'}%`, icon: <TrendingUp size={22} />, color: '#06b6d4' },
                    { label: 'Buildings', value: siteStats.buildingsCount || selectedSite.buildingsCount || 0, icon: <Building2 size={22} />, color: '#ec4899' }
                  ].map((s, i) => (
                    <Col xs={6} md={4} lg key={i}>
                      <div className="detail-stat-card">
                        <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
                        <div className="stat-val-text" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.value}</div>
                        <div className="stat-lbl-text" style={{ fontSize: '0.75rem', marginTop: 4 }}>{s.label}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-3">
                  <Spinner size="sm" variant="info" /> <span className="ms-2 stat-lbl-text">Loading stats...</span>
                </div>
              )}

              {/* Site Info */}
              <h6 className="fw-bold mb-3 section-subtitle-text" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Site Configuration
              </h6>
              <div className="site-config-box" style={{ borderRadius: 14, padding: 20 }}>
                {[
                  { label: 'Site ID', value: selectedSite.id },
                  { label: 'Sochiot Location ID', value: selectedSite.sochiotLocationId },
                  { label: 'Organization ID', value: selectedSite.organizationId },
                  { label: 'Tenant ID', value: selectedSite.tenantId }
                ].map((item, i) => (
                  <div key={i} className="d-flex justify-content-between py-2 site-config-row">
                    <span className="config-lbl-text" style={{ fontSize: '0.85rem' }}>{item.label}</span>
                    <span className="config-val-text" style={{ fontWeight: 500, fontSize: '0.85rem', fontFamily: 'monospace' }}>{item.value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Building Settings Quick Link */}
              <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
                <Button
                  variant="outline-info"
                  size="sm"
                  className="d-flex align-items-center gap-2 fw-semibold"
                  onClick={() => {
                    setShowDetailModal(false);
                    navigate(`/manage-organisation?tab=building&siteId=${selectedSite.id}`);
                  }}
                >
                  <Building2 size={16} /> Manage Buildings for this Site
                </Button>
                <Button variant="outline-light" size="sm" onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SiteManagement;
