import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Badge, Button, Form, Spinner, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Plus, Building2, Activity, AlertTriangle, Zap,
  Eye, RefreshCw, Search, LayoutGrid, List, ChevronRight,
  Globe, Server, Clock, Edit3, Power, CheckCircle, XCircle,
  ArrowUpDown, ArrowUp, ArrowDown, X, Navigation, Filter,
  SlidersHorizontal, CheckCircle2, Radio, ArrowRight, Layers
} from 'lucide-react';

import { getAuthToken } from '../../utils/cookieUtils';
import { getApiUrl } from '../../utils/apiConfig';
import { useSiteStore } from '../../context/SiteContext';
import RegisterSiteModal from './modals/RegisterSiteModal';
import SiteInspectorDrawer from './modals/SiteInspectorDrawer';

const API_BASE_URL = getApiUrl();

const getAuthHeaders = () => {
  const token = getAuthToken() || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

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

const SiteManagement = ({ embedded = false }) => {
  const navigate = useNavigate();
  const {
    sites,
    setSites,
    addSite,
    updateSite,
    fetchSites: refreshStoreSites,
    selectedSite: activeDashboardSite,
    setSelectedSite
  } = useSiteStore();

  const [tenants, setTenants] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // View & Filtering State
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [kpiFilter, setKpiFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'ALARM'

  // Sorting State
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Modals & Drawers State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInspectorDrawer, setShowInspectorDrawer] = useState(false);
  const [inspectingSite, setInspectingSite] = useState(null);
  const [editingSite, setEditingSite] = useState(null);
  const [siteStats, setSiteStats] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [createModalError, setCreateModalError] = useState(null);
  const [editModalError, setEditModalError] = useState(null);

  // Status Change Confirmation State
  const [confirmToggleSite, setConfirmToggleSite] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Forms State
  const [createForm, setCreateForm] = useState({
    name: '',
    tenantId: '',
    zoneId: '',
    areaId: '',
    address: '',
    showExtendedAddress: false,
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    contacts: [],
    timezone: 'Asia/Kolkata',
    isActive: true,
    showSochiotLogo: true,
    logoUrl: '',
    selectedTemplates: [],
    selectedFeatures: []
  });

  const [editForm, setEditForm] = useState({});

  // Fetch hierarchy
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

  // Fetch sites
  const fetchSites = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/sites`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const result = await response.json();
        const list = normalizeList(result, 'sites');
        setSites(list);
      } else {
        setFetchError(`Server returned status ${response.status}. Could not fetch sites.`);
      }
    } catch (err) {
      console.warn('Sites fetch notice:', err);
      setFetchError('Network error while connecting to the site service.');
    } finally {
      setLoading(false);
    }
  }, [setSites]);

  // Fetch site live stats
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

  // Auto-clear toast notifications
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // Create Site Handler
  const handleCreateSite = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!createForm.name?.trim()) {
      setCreateModalError('Site name is required.');
      return;
    }
    setSubmitting(true);
    setCreateModalError(null);

    const createPayload = {
      name: createForm.name.trim(),
      address: createForm.address?.trim() || '',
      city: createForm.city?.trim() || null,
      state: createForm.state?.trim() || null,
      pincode: createForm.pincode?.trim() || null,
      latitude: createForm.latitude !== '' && createForm.latitude != null ? Number(createForm.latitude) : null,
      longitude: createForm.longitude !== '' && createForm.longitude != null ? Number(createForm.longitude) : null,
      contacts: (createForm.contacts || []).map(c => ({
        name: c.name?.trim() || '',
        phone: c.phone?.trim() || '',
        email: c.email?.trim() || null
      })),
      contactEmails: (createForm.contacts || []).map(c => c.email).filter(Boolean),
      timezone: createForm.timezone || 'Asia/Kolkata',
      isActive: createForm.isActive !== false,
      status: createForm.isActive !== false ? 'ACTIVE' : 'INACTIVE',
      showSochiotLogo: createForm.showSochiotLogo !== false,
      logoUrl: createForm.logoUrl || '',
      selectedTemplates: createForm.selectedTemplates || [],
      selectedFeatures: createForm.selectedFeatures || [],
      feature_permissions: {
        selectedFeatures: createForm.selectedFeatures || [],
        selectedTemplates: createForm.selectedTemplates || []
      },
      ...(createForm.tenantId?.trim() ? { tenantId: createForm.tenantId.trim() } : {}),
      ...(createForm.zoneId?.trim() ? { zoneId: createForm.zoneId.trim() } : {}),
      ...(createForm.areaId?.trim() ? { areaId: createForm.areaId.trim() } : {})
    };

    try {
      const response = await fetch(`${API_BASE_URL}/sites`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(createPayload)
      });

      if (response.ok) {
        const resData = await response.json();
        const created = resData.data || resData.site || { ...createPayload, id: Date.now() };

        addSite(created);
        setMessage({ type: 'success', text: `Site "${created.name}" created successfully!` });
        setShowCreateModal(false);

        // Reset form
        setCreateForm({
          name: '',
          tenantId: '',
          zoneId: '',
          areaId: '',
          address: '',
          showExtendedAddress: false,
          city: '',
          state: '',
          pincode: '',
          latitude: '',
          longitude: '',
          contacts: [],
          timezone: 'Asia/Kolkata',
          isActive: true,
          showSochiotLogo: true,
          logoUrl: '',
          selectedTemplates: [],
          selectedFeatures: []
        });
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || errData?.message || `Server returned error (${response.status}): Failed to create site.`;
        setCreateModalError(errMsg);
        setMessage({ type: 'error', text: errMsg });
      }
    } catch (err) {
      const errMsg = err?.message || 'Network error connecting to site service.';
      setCreateModalError(errMsg);
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: check if a site is operational/active
  const isSiteActive = useCallback((s) => {
    if (!s) return false;
    if (s.deletedAt) return false;
    if (s.isActive !== undefined && s.isActive !== null) {
      return Boolean(s.isActive);
    }
    if (s.status) {
      return s.status === 'ACTIVE' || s.status === 'ENABLED';
    }
    return true; // Default fallback if not specified
  }, []);

  // Helper: get accurate device count from site (handles Prisma _count, devicesCount, deviceCount)
  const getSiteDevicesCount = useCallback((s) => {
    if (!s) return 0;
    return Number(s._count?.devices ?? s.devicesCount ?? s.deviceCount ?? 0);
  }, []);

  // Helper: resolve hierarchy names
  const getSiteHierarchy = useCallback((s) => {
    if (!s) return { tenantName: null, zoneName: null, areaName: null, tenantId: null, zoneId: null, areaId: null };
    const tenantName = s.tenant?.name || tenants.find(t => String(t.id) === String(s.tenantId))?.name || (s.tenantId ? `Tenant #${s.tenantId}` : null);
    const zoneName = s.zone?.name || zones.find(z => String(z.id) === String(s.zoneId))?.name || null;
    const areaName = s.areaRef?.name || areas.find(a => String(a.id) === String(s.areaId))?.name || null;
    const tenantId = s.tenant?.id || s.tenantId;
    const zoneId = s.zone?.id || s.zoneId;
    const areaId = s.areaRef?.id || s.areaId;
    return { tenantName, zoneName, areaName, tenantId, zoneId, areaId };
  }, [tenants, zones, areas]);

  // Helper: parse permissions from feature_permissions or top-level arrays
  const parseSitePermissions = useCallback((s) => {
    if (!s) return { selectedTemplates: [], selectedFeatures: [] };
    let fp = s.feature_permissions;
    if (typeof fp === 'string') {
      try {
        fp = JSON.parse(fp);
      } catch (e) {
        fp = {};
      }
    }
    const selectedTemplates = (Array.isArray(s.selectedTemplates) && s.selectedTemplates.length > 0)
      ? s.selectedTemplates
      : (Array.isArray(fp?.selectedTemplates) ? fp.selectedTemplates : []);

    const selectedFeatures = (Array.isArray(s.selectedFeatures) && s.selectedFeatures.length > 0)
      ? s.selectedFeatures
      : (Array.isArray(fp?.selectedFeatures) ? fp.selectedFeatures : []);

    return { selectedTemplates, selectedFeatures };
  }, []);

  // Open Edit Modal with full field parity and automatic permission pre-selection
  const handleOpenEditModal = async (site) => {
    if (!site) return;
    setEditingSite(site);

    // 1. Initial pre-population from site list object
    const initialPerms = parseSitePermissions(site);
    setEditForm({
      id: site.id,
      name: site.name || '',
      tenantId: site.tenantId || site.tenant?.id || '',
      zoneId: site.zoneId || site.zone?.id || '',
      areaId: site.areaId || site.areaRef?.id || '',
      tenant: site.tenant || null,
      zone: site.zone || null,
      areaRef: site.areaRef || null,
      address: site.address || '',
      showExtendedAddress: Boolean(site.city || site.state || site.pincode || site.latitude != null || site.longitude != null),
      city: site.city || '',
      state: site.state || '',
      pincode: site.pincode || '',
      latitude: site.latitude ?? '',
      longitude: site.longitude ?? '',
      contacts: Array.isArray(site.contacts) && site.contacts.length > 0
        ? site.contacts
        : (Array.isArray(site.contactEmails) ? site.contactEmails.map(email => ({ name: '', phone: '', email })) : []),
      timezone: site.timezone || 'Asia/Kolkata',
      isActive: isSiteActive(site),
      showSochiotLogo: site.showSochiotLogo !== false,
      logoUrl: site.logoUrl || '',
      selectedTemplates: initialPerms.selectedTemplates,
      selectedFeatures: initialPerms.selectedFeatures
    });
    setEditModalError(null);
    setShowEditModal(true);

    // 2. Query single-site GET /sites/:id to fetch fresh feature_permissions & relations
    try {
      const response = await fetch(`${API_BASE_URL}/sites/${site.id}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const resData = await response.json();
        const detail = resData?.data || resData?.site;
        if (detail) {
          const detailPerms = parseSitePermissions(detail);
          setEditForm(prev => {
            if (!prev || String(prev.id) !== String(site.id)) return prev;
            return {
              ...prev,
              name: detail.name ?? prev.name,
              tenantId: detail.tenantId || detail.tenant?.id || prev.tenantId,
              zoneId: detail.zoneId || detail.zone?.id || prev.zoneId,
              areaId: detail.areaId || detail.areaRef?.id || prev.areaId,
              tenant: detail.tenant || prev.tenant,
              zone: detail.zone || prev.zone,
              areaRef: detail.areaRef || prev.areaRef,
              address: detail.address ?? prev.address,
              city: detail.city ?? prev.city,
              state: detail.state ?? prev.state,
              pincode: detail.pincode ?? prev.pincode,
              latitude: detail.latitude ?? prev.latitude,
              longitude: detail.longitude ?? prev.longitude,
              timezone: detail.timezone || prev.timezone,
              contacts: Array.isArray(detail.contacts) && detail.contacts.length > 0
                ? detail.contacts
                : (Array.isArray(detail.contactEmails) ? detail.contactEmails.map(email => ({ name: '', phone: '', email })) : prev.contacts),
              selectedTemplates: detailPerms.selectedTemplates.length > 0 ? detailPerms.selectedTemplates : prev.selectedTemplates,
              selectedFeatures: detailPerms.selectedFeatures.length > 0 ? detailPerms.selectedFeatures : prev.selectedFeatures
            };
          });
        }
      }
    } catch (e) {
      console.warn('Edit site detail fetch notice:', e);
    }
  };

  // Save Edit Site (PATCH /api/sites/:id)
  const handleUpdateSite = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editForm.name?.trim() || !editForm.id) {
      setEditModalError('Valid site name is required.');
      return;
    }
    setSubmitting(true);
    setEditModalError(null);

    const updatePayload = {
      name: editForm.name.trim(),
      tenantId: editForm.tenantId || undefined,
      zoneId: editForm.zoneId || undefined,
      areaId: editForm.areaId || undefined,
      address: editForm.address?.trim() || '',
      city: editForm.city?.trim() || null,
      state: editForm.state?.trim() || null,
      pincode: editForm.pincode?.trim() || null,
      latitude: editForm.latitude !== '' && editForm.latitude != null ? Number(editForm.latitude) : null,
      longitude: editForm.longitude !== '' && editForm.longitude != null ? Number(editForm.longitude) : null,
      contacts: (editForm.contacts || []).map(c => ({
        name: c.name?.trim() || '',
        phone: c.phone?.trim() || '',
        email: c.email?.trim() || null
      })),
      contactEmails: (editForm.contacts || []).map(c => c.email).filter(Boolean),
      timezone: editForm.timezone || 'Asia/Kolkata',
      status: editForm.isActive ? 'ACTIVE' : 'INACTIVE',
      isActive: editForm.isActive,
      showSochiotLogo: editForm.showSochiotLogo !== false,
      logoUrl: editForm.logoUrl || '',
      selectedTemplates: editForm.selectedTemplates || [],
      selectedFeatures: editForm.selectedFeatures || [],
      feature_permissions: {
        selectedFeatures: editForm.selectedFeatures || [],
        selectedTemplates: editForm.selectedTemplates || []
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/sites/${editForm.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        updateSite(editForm.id, updatePayload);
        if (inspectingSite && String(inspectingSite.id) === String(editForm.id)) {
          setInspectingSite(prev => ({ ...prev, ...updatePayload }));
        }
        setMessage({ type: 'success', text: `Site "${editForm.name}" updated successfully!` });
        setShowEditModal(false);
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || errData?.message || `Server returned error (${response.status}): Failed to update site.`;
        setEditModalError(errMsg);
        setMessage({ type: 'error', text: errMsg });
      }
    } catch (err) {
      console.warn('Update site API notice:', err);
      updateSite(editForm.id, updatePayload);
      setMessage({ type: 'warning', text: `Site updated locally. Please verify network connectivity.` });
      setShowEditModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Confirmation Modal for Status Change
  const handleToggleSiteStatus = (site, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!site || !site.id) return;
    setConfirmToggleSite(site);
  };

  // Perform Confirmed Enable / Disable Status Change
  const handleConfirmToggleStatus = async () => {
    if (!confirmToggleSite || !confirmToggleSite.id) return;
    const site = confirmToggleSite;
    const isCurrentlyActive = isSiteActive(site);
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const newIsActive = !isCurrentlyActive;

    setTogglingStatus(true);
    try {
      await fetch(`${API_BASE_URL}/sites/${site.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus, isActive: newIsActive })
      });
    } catch (err) {
      console.warn('Toggle site status notice:', err);
    } finally {
      setTogglingStatus(false);
    }

    updateSite(site.id, { status: newStatus, isActive: newIsActive });
    if (inspectingSite && String(inspectingSite.id) === String(site.id)) {
      setInspectingSite(prev => ({ ...prev, status: newStatus, isActive: newIsActive }));
    }

    setMessage({
      type: newStatus === 'ACTIVE' ? 'success' : 'warning',
      text: `Site "${site.name}" is now ${newStatus === 'ACTIVE' ? 'ENABLED' : 'DISABLED'}.`
    });
    setConfirmToggleSite(null);
  };

  // View site details in Inspector Drawer
  const handleViewSite = async (site) => {
    if (!site || !site.id || site.id === 'undefined') return;
    setInspectingSite(site);
    setShowInspectorDrawer(true);
    fetchSiteStats(site.id);

    try {
      const response = await fetch(`${API_BASE_URL}/sites/${site.id}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const resData = await response.json();
        const detail = resData?.data || resData?.site;
        if (detail) {
          setInspectingSite(prev => ({ ...prev, ...detail }));
        }
      }
    } catch (e) {
      console.warn('Site details fetch notice:', e);
    }
  };

  // KPI calculations
  const kpiData = useMemo(() => {
    const total = sites.length;
    const operational = sites.filter(s => isSiteActive(s)).length;
    const inAlarm = sites.filter(s => (Number(s.alarmsCount) || 0) > 0 && !s.deletedAt).length;
    const totalEnergy = sites.reduce((sum, s) => sum + (Number(s.energyKwh) || 0), 0);
    const totalDevices = sites.reduce((sum, s) => sum + getSiteDevicesCount(s), 0);
    return { total, operational, inAlarm, totalEnergy, totalDevices };
  }, [sites, isSiteActive, getSiteDevicesCount]);

  // Dependent Zone Options
  const availableZones = useMemo(() => {
    if (!selectedTenantFilter) return zones;
    return zones.filter(z => String(z.tenantId) === String(selectedTenantFilter));
  }, [zones, selectedTenantFilter]);

  // Filter logic
  const filteredSites = useMemo(() => {
    return sites.filter(s => {
      // 1. KPI Filter
      if (kpiFilter === 'ACTIVE') {
        if (!isSiteActive(s)) return false;
      } else if (kpiFilter === 'ALARM') {
        if ((Number(s.alarmsCount) || 0) <= 0) return false;
      }

      // 2. Tenant Filter
      const { tenantId: sTenantId, zoneId: sZoneId } = getSiteHierarchy(s);
      if (selectedTenantFilter && String(sTenantId) !== String(selectedTenantFilter)) {
        return false;
      }

      // 3. Zone Filter
      if (selectedZoneFilter && String(sZoneId) !== String(selectedZoneFilter)) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchCity = (s.city || '').toLowerCase().includes(q);
        const matchState = (s.state || '').toLowerCase().includes(q);
        const matchAddress = (s.address || '').toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchState && !matchAddress) return false;
      }

      return true;
    });
  }, [sites, kpiFilter, selectedTenantFilter, selectedZoneFilter, searchQuery, isSiteActive, getSiteHierarchy]);

  // Sort logic
  const sortedSites = useMemo(() => {
    return [...filteredSites].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (sortColumn === 'name') {
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
      } else if (sortColumn === 'devices') {
        aVal = getSiteDevicesCount(a);
        bVal = getSiteDevicesCount(b);
      } else if (sortColumn === 'alarms') {
        aVal = Number(a.alarmsCount) || 0;
        bVal = Number(b.alarmsCount) || 0;
      } else if (sortColumn === 'energy') {
        aVal = Number(a.energyKwh) || 0;
        bVal = Number(b.energyKwh) || 0;
      } else if (sortColumn === 'status') {
        aVal = isSiteActive(a) ? 1 : 0;
        bVal = isSiteActive(b) ? 1 : 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSites, sortColumn, sortDirection, getSiteDevicesCount, isSiteActive]);

  const handleSort = (colKey) => {
    if (sortColumn === colKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTenantFilter('');
    setSelectedZoneFilter('');
    setKpiFilter('ALL');
  };

  const isFiltered = Boolean(searchQuery.trim() || selectedTenantFilter || selectedZoneFilter || kpiFilter !== 'ALL');

  return (
    <div className={`site-mgmt-wrapper ${embedded ? 'p-0' : 'p-3'}`} style={{ color: 'var(--scada-text, #f8fafc)' }}>
      <style>{`
        .site-card-modern {
          background: linear-gradient(145deg, rgba(26, 36, 56, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          overflow: hidden;
          position: relative;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.3);
        }
        .site-card-modern:hover {
          transform: translateY(-3px);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(56, 189, 248, 0.2);
        }
        .site-card-modern.is-current-active {
          border-color: rgba(14, 165, 233, 0.55);
          background: linear-gradient(145deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%);
          box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.35), 0 0 16px rgba(14, 165, 233, 0.15);
        }
        .site-card-modern.has-alarm {
          border-color: rgba(239, 68, 68, 0.5);
          background: linear-gradient(145deg, rgba(239, 68, 68, 0.06) 0%, rgba(15, 23, 42, 0.9) 100%);
        }
        .site-card-modern.has-alarm:hover {
          border-color: #ef4444;
          box-shadow: 0 12px 30px -4px rgba(239, 68, 68, 0.25);
        }
        .site-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .site-status-pill.is-active {
          background: rgba(16, 185, 129, 0.14);
          border-color: rgba(16, 185, 129, 0.35);
          color: #34d399;
        }
        .site-status-pill.is-active:hover {
          background: rgba(16, 185, 129, 0.22);
          border-color: #10b981;
          color: #6ee7b7;
        }
        .site-status-pill.is-inactive {
          background: rgba(100, 116, 139, 0.15);
          border-color: rgba(100, 116, 139, 0.3);
          color: #94a3b8;
        }
        .site-status-pill.is-inactive:hover {
          background: rgba(100, 116, 139, 0.25);
          border-color: #94a3b8;
          color: #cbd5e1;
        }
        .status-dot-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
        }
        .status-dot-indicator.online {
          background-color: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
          animation: status-pulse 2s infinite ease-in-out;
        }
        .status-dot-indicator.offline {
          background-color: #94a3b8;
        }
        @keyframes status-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.85); }
        }
        .site-kpi-card-compact {
          background: linear-gradient(145deg, rgba(26, 36, 56, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .site-kpi-card-compact::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: transparent;
          transition: all 0.2s;
        }
        .site-kpi-card-compact.kpi-total::before { background: #0ea5e9; }
        .site-kpi-card-compact.kpi-operational::before { background: #10b981; }
        .site-kpi-card-compact.kpi-alarm::before { background: #ef4444; }
        .site-kpi-card-compact.kpi-devices::before { background: #6366f1; }
        .site-kpi-card-compact.kpi-energy::before { background: #f59e0b; }
        .site-kpi-card-compact:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.18);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
        }
        .site-kpi-card-compact.active-kpi {
          border-color: var(--scada-accent, #38bdf8);
          background: linear-gradient(145deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%);
          box-shadow: 0 0 0 1px var(--scada-accent, #38bdf8), 0 8px 20px rgba(0,0,0,0.3);
        }
        .site-toolbar {
          background: linear-gradient(145deg, rgba(26, 36, 56, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 10px 16px;
        }
        .toolbar-select, .toolbar-input {
          background-color: rgba(0, 0, 0, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: var(--scada-text, #f8fafc) !important;
          border-radius: 8px !important;
          font-size: 0.85rem !important;
          min-height: 40px !important;
        }
        .toolbar-select:focus, .toolbar-input:focus {
          border-color: var(--scada-accent, #38bdf8) !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25) !important;
        }
        .touch-action-btn {
          min-width: 40px;
          min-height: 40px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--scada-text-muted, #94a3b8);
          transition: all 0.2s;
        }
        .touch-action-btn:hover {
          color: #ffffff;
          border-color: var(--scada-accent, #38bdf8);
          background: rgba(56, 189, 248, 0.1);
        }
        .touch-action-btn:focus-visible {
          outline: 2px solid var(--scada-accent, #38bdf8);
          outline-offset: 2px;
        }
        .touch-action-btn.active {
          background: rgba(56, 189, 248, 0.18);
          border-color: var(--scada-accent, #38bdf8);
          color: var(--scada-accent, #38bdf8);
        }
        .stat-pill-action {
          min-height: 36px;
          padding: 5px 11px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
        }
        .stat-pill-action:hover {
          transform: translateY(-1px);
        }
        .stat-pill-action.pill-devices {
          background: rgba(56, 189, 248, 0.08);
          border-color: rgba(56, 189, 248, 0.2);
          color: #93c5fd;
        }
        .stat-pill-action.pill-devices:hover {
          background: rgba(56, 189, 248, 0.16);
          border-color: #38bdf8;
          color: #ffffff;
        }
        .stat-pill-action.pill-alarms-zero {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.2);
          color: #86efac;
        }
        .stat-pill-action.pill-alarms-zero:hover {
          background: rgba(16, 185, 129, 0.16);
          border-color: #10b981;
          color: #ffffff;
        }
        .stat-pill-action.pill-alarms-active {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }
        .stat-pill-action.pill-alarms-active:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: #ef4444;
          color: #ffffff;
        }
        .stat-pill-action.pill-energy {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.2);
          color: #fde68a;
        }
        .stat-pill-action.pill-energy:hover {
          background: rgba(245, 158, 11, 0.16);
          border-color: #f59e0b;
          color: #ffffff;
        }
        .site-hierarchy-trail {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          letter-spacing: 0.02em;
          color: #38bdf8;
          margin-bottom: 4px;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .site-hierarchy-crumb {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .site-inspect-btn {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(56, 189, 248, 0.1) 100%);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38bdf8;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 6px 14px;
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .site-inspect-btn:hover {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.35) 0%, rgba(56, 189, 248, 0.25) 100%);
          border-color: #38bdf8;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
        }
        .btn-create-site-primary {
          background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
          border: none;
          color: #ffffff !important;
          font-weight: 600;
          border-radius: 8px;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-create-site-primary:hover {
          background: linear-gradient(135deg, #0369a1 0%, #0891b2 100%);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.45);
          transform: translateY(-1px);
        }
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
        .site-data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          color: var(--scada-text, #f8fafc);
        }
        .site-data-table th {
          background-color: rgba(0, 0, 0, 0.25);
          border-bottom: 1px solid var(--scada-border, #334155);
          padding: 12px 16px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--scada-text-muted, #94a3b8);
          user-select: none;
        }
        .site-data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--scada-border, #334155);
          font-size: 0.85rem;
          vertical-align: middle;
        }
        .site-data-table tr:hover td {
          background-color: rgba(56, 189, 248, 0.05);
        }
        body.light-mode .site-card-modern {
          background: #ffffff;
          border-color: #e2e8f0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        body.light-mode .site-card-modern:hover {
          border-color: #0284c7;
          box-shadow: 0 8px 20px rgba(2, 132, 199, 0.12);
        }
        body.light-mode .site-card-modern.is-current-active {
          background: #f0f9ff;
          border-color: #0284c7;
        }
        body.light-mode .site-kpi-card-compact {
          background: #ffffff;
          border-color: #e2e8f0;
        }
        body.light-mode .site-toolbar {
          background: #ffffff;
          border-color: #e2e8f0;
        }
        body.light-mode .toolbar-select,
        body.light-mode .toolbar-input {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .site-data-table th {
          background-color: #f8fafc;
          color: #64748b;
        }
        body.light-mode .site-data-table td {
          color: #1e293b;
        }
        .scada-confirm-modal {
          z-index: 1070 !important;
        }
        .scada-confirm-modal .modal-dialog {
          max-width: 530px !important;
          margin: 1.75rem auto;
        }
        .scada-confirm-modal .modal-content {
          background: linear-gradient(165deg, rgba(26, 36, 56, 0.98) 0%, rgba(13, 20, 36, 0.99) 100%) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.14) !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 0, 0, 0.4) !important;
        }
        .scada-confirm-modal .modal-header {
          background: rgba(255, 255, 255, 0.02) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 22px 28px !important;
        }
        .scada-confirm-modal .modal-body {
          background: transparent !important;
          padding: 24px 28px !important;
        }
        .scada-confirm-modal .modal-footer {
          background: rgba(0, 0, 0, 0.25) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 18px 28px !important;
          gap: 12px;
        }
        .scada-confirm-backdrop {
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          background-color: rgba(3, 7, 18, 0.78) !important;
          z-index: 1065 !important;
        }
      `}</style>

      {/* Floating Toast Notification */}
      {message && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            backgroundColor: message.type === 'success' ? '#059669' : message.type === 'warning' ? '#d97706' : '#dc2626',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: '0.88rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
          <button
            type="button"
            className="btn-close btn-close-white ms-2"
            style={{ fontSize: '0.7rem' }}
            onClick={() => setMessage(null)}
          />
        </div>
      )}

      {/* Standalone Page Title & Action (Rendered ONLY when not embedded in ManageOrganisation) */}
      {!embedded && (
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Building2 size={24} className="text-info" />
                Site Management
              </h4>
              <Badge bg="secondary" className="font-monospace" style={{ fontSize: '0.75rem' }}>
                {sites.length} Sites
              </Badge>
            </div>
            <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
              Monitor and manage physical locations, telemetry bindings, and BMS presets.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <OverlayTrigger placement="bottom" overlay={<Tooltip>Refresh all sites</Tooltip>}>
              <button
                type="button"
                className="touch-action-btn"
                aria-label="Refresh sites list"
                onClick={fetchSites}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
              </button>
            </OverlayTrigger>

            <button
              type="button"
              className="btn-create-site-primary"
              onClick={() => {
                setCreateModalError(null);
                setShowCreateModal(true);
              }}
            >
              <Plus size={18} /> Create Site
            </button>
          </div>
        </div>
      )}

      {/* Compact Executive KPI Ribbon */}
      <Row className="g-2 mb-3">
        <Col xs={6} md={4} xl>
          <div
            className={`site-kpi-card-compact kpi-total ${kpiFilter === 'ALL' ? 'active-kpi' : ''}`}
            onClick={() => setKpiFilter('ALL')}
            title="Click to view all sites"
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                TOTAL SITES
              </span>
              <Building2 size={15} className="text-info" />
            </div>
            <div className="fw-bold tabular-nums" style={{ fontSize: '1.4rem' }}>{kpiData.total}</div>
            <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.7rem' }}>All campuses</small>
          </div>
        </Col>

        <Col xs={6} md={4} xl>
          <div
            className={`site-kpi-card-compact kpi-operational ${kpiFilter === 'ACTIVE' ? 'active-kpi' : ''}`}
            onClick={() => setKpiFilter(prev => prev === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
            title="Click to filter operational sites"
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                OPERATIONAL
              </span>
              <CheckCircle2 size={15} className="text-success" />
            </div>
            <div className="fw-bold text-success tabular-nums" style={{ fontSize: '1.4rem' }}>{kpiData.operational}</div>
            <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.7rem' }}>Active & reporting</small>
          </div>
        </Col>

        <Col xs={6} md={4} xl>
          <div
            className={`site-kpi-card-compact kpi-alarm ${kpiFilter === 'ALARM' ? 'active-kpi' : ''}`}
            onClick={() => setKpiFilter(prev => prev === 'ALARM' ? 'ALL' : 'ALARM')}
            title="Click to filter sites with active alarms"
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                IN ALARM
              </span>
              <AlertTriangle size={15} className={kpiData.inAlarm > 0 ? 'text-danger' : 'text-muted'} />
            </div>
            <div className={`fw-bold tabular-nums ${kpiData.inAlarm > 0 ? 'text-danger' : 'text-muted'}`} style={{ fontSize: '1.4rem' }}>
              {kpiData.inAlarm}
            </div>
            <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.7rem' }}>Sites with open alerts</small>
          </div>
        </Col>

        <Col xs={6} md={6} xl>
          <div
            className="site-kpi-card-compact kpi-devices"
            title="View fleet devices"
            onClick={() => navigate('/manage-organisation?tab=device')}
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                CONNECTED ASSETS
              </span>
              <Server size={15} className="text-primary" />
            </div>
            <div className="fw-bold tabular-nums" style={{ fontSize: '1.4rem' }}>{kpiData.totalDevices}</div>
            <small className="text-info d-block mt-0.5" style={{ fontSize: '0.7rem' }}>View Assets &rarr;</small>
          </div>
        </Col>

        <Col xs={12} md={6} xl>
          <div
            className="site-kpi-card-compact kpi-energy"
            title="View energy metering"
            onClick={() => navigate('/energy-metering/overview')}
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                CUMULATIVE ENERGY
              </span>
              <Zap size={15} className="text-warning" />
            </div>
            <div className="fw-bold text-warning tabular-nums" style={{ fontSize: '1.4rem' }}>
              {kpiData.totalEnergy.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>kWh</span>
            </div>
            <small className="text-info d-block mt-0.5" style={{ fontSize: '0.7rem' }}>View Metering &rarr;</small>
          </div>
        </Col>
      </Row>

      {/* Responsive Filter & Action Toolbar */}
      <div className="site-toolbar mb-3">
        <Row className="g-2 align-items-center">
          {/* Search Input */}
          <Col xs={12} md={4} lg={3}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--scada-text-muted)' }} />
              <Form.Control
                type="text"
                placeholder="Search site, city, address..."
                className="toolbar-input ps-5 pe-4"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search sites"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search text"
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--scada-text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </Col>

          {/* Tenant Filter */}
          <Col xs={6} md={3} lg={2}>
            <Form.Select
              className="toolbar-select"
              value={selectedTenantFilter}
              onChange={e => {
                setSelectedTenantFilter(e.target.value);
                setSelectedZoneFilter('');
              }}
              aria-label="Filter by Organization / Tenant"
            >
              <option value="">All Organizations</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Form.Select>
          </Col>

          {/* Zone Filter */}
          <Col xs={6} md={3} lg={2}>
            <Form.Select
              className="toolbar-select"
              value={selectedZoneFilter}
              onChange={e => setSelectedZoneFilter(e.target.value)}
              aria-label="Filter by Geographic Zone"
            >
              <option value="">All Zones</option>
              {availableZones.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </Form.Select>
          </Col>

          {/* View Toggles & Actions */}
          <Col xs={12} md={2} lg={5} className="d-flex align-items-center justify-content-between justify-content-md-end gap-2 mt-2 mt-md-0">
            {isFiltered && (
              <Button
                variant="link"
                className="text-info text-decoration-none p-0 d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.8rem' }}
                onClick={handleResetFilters}
              >
                <X size={14} /> Clear ({filteredSites.length}/{sites.length})
              </Button>
            )}

            <div className="d-flex align-items-center gap-2 ms-auto">
              <button
                type="button"
                className={`touch-action-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={`touch-action-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="Table view"
                title="List View"
              >
                <List size={16} />
              </button>

              {embedded && (
                <button
                  type="button"
                  className="btn-create-site-primary ms-1"
                  onClick={() => {
                    setCreateModalError(null);
                    setShowCreateModal(true);
                  }}
                >
                  <Plus size={16} /> Create Site
                </button>
              )}
            </div>
          </Col>
        </Row>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <Spinner animation="border" variant="info" className="mb-3" />
          <span className="text-muted fw-semibold">Loading physical sites & telemetry...</span>
        </div>
      ) : fetchError ? (
        <div className="p-4 rounded border text-center my-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
          <AlertTriangle size={32} className="text-danger mb-2" />
          <h6 className="text-danger fw-bold mb-1">Service Communication Error</h6>
          <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>{fetchError}</p>
          <Button variant="outline-danger" size="sm" onClick={fetchSites}>
            <RefreshCw size={14} className="me-1" /> Retry Connection
          </Button>
        </div>
      ) : sortedSites.length === 0 ? (
        <div
          className="p-5 rounded border text-center my-3"
          style={{
            borderColor: 'var(--scada-border, #334155)',
            backgroundColor: 'var(--scada-card, #1e293b)'
          }}
        >
          <Building2 size={40} className="text-muted opacity-50 mb-3" />
          {isFiltered ? (
            <>
              <h6 className="fw-bold mb-1">No Matching Sites Found</h6>
              <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                No sites match the current filter criteria or search query.
              </p>
              <Button variant="outline-info" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </>
          ) : (
            <>
              <h5 className="fw-bold mb-1">No sites registered yet</h5>
              <p className="text-muted mb-3" style={{ fontSize: '0.88rem' }}>
                Create your first physical site to start managing assets and telemetry.
              </p>
              <button type="button" className="btn-create-site-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} className="me-1" /> Create First Site
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View Layout */
        <Row className="g-3">
          {sortedSites.map((site) => {
            const isEnabled = isSiteActive(site);
            const alarms = Number(site.alarmsCount) || 0;
            const devices = getSiteDevicesCount(site);
            const energy = Number(site.energyKwh) || 0;
            const isSelectedActive = activeDashboardSite && String(activeDashboardSite.id) === String(site.id);

            const { tenantName, zoneName, areaName } = getSiteHierarchy(site);

            return (
              <Col xs={12} md={6} xl={4} key={site.id}>
                <div
                  className={`site-card-modern p-3 d-flex flex-column justify-content-between h-100 ${
                    isSelectedActive ? 'is-current-active' : ''
                  } ${alarms > 0 ? 'has-alarm' : ''}`}
                  onClick={() => handleViewSite(site)}
                >
                  {/* Top Row: Title + Operational Status */}
                  <div>
                    {/* Organization / Zone / Area Breadcrumb Trail */}
                    {(tenantName || zoneName) && (
                      <div className="site-hierarchy-trail">
                        {tenantName && (
                          <span className="site-hierarchy-crumb" title={`Organization: ${tenantName}`}>
                            <Building2 size={11} className="text-info" /> {tenantName}
                          </span>
                        )}
                        {zoneName && (
                          <>
                            <ChevronRight size={10} className="text-muted opacity-75" />
                            <span className="site-hierarchy-crumb" title={`Zone: ${zoneName}`}>
                              <MapPin size={11} className="text-info" /> {zoneName}
                            </span>
                          </>
                        )}
                        {areaName && (
                          <>
                            <ChevronRight size={10} className="text-muted opacity-75" />
                            <span className="site-hierarchy-crumb text-muted" title={`Area: ${areaName}`}>
                              {areaName}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="pe-2">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h6 className="fw-bold mb-0 text-white" style={{ fontSize: '1.02rem', letterSpacing: '-0.01em' }}>
                            {site.name}
                          </h6>
                          {isSelectedActive && (
                            <Badge
                              bg="info"
                              className="text-dark d-inline-flex align-items-center gap-1"
                              style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', padding: '3px 7px' }}
                            >
                              <Radio size={10} /> CURRENT
                            </Badge>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-1 text-muted mt-1" style={{ fontSize: '0.78rem' }}>
                          <MapPin size={12} className="text-secondary" />
                          <span>{site.city || 'Location unset'}{site.state ? `, ${site.state}` : ''}</span>
                        </div>
                      </div>

                      {/* Operational Status Badge with Visual Dot */}
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>{isEnabled ? 'Operational. Click to Disable.' : 'Disabled. Click to Enable.'}</Tooltip>}
                      >
                        <button
                          type="button"
                          className={`site-status-pill ${isEnabled ? 'is-active' : 'is-inactive'}`}
                          onClick={(e) => handleToggleSiteStatus(site, e)}
                          aria-label={isEnabled ? 'Site is active. Click to disable' : 'Site is disabled. Click to enable'}
                        >
                          <span className={`status-dot-indicator ${isEnabled ? 'online' : 'offline'}`} />
                          {isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </OverlayTrigger>
                    </div>

                    {/* Telemetry Metric Pills */}
                    <div className="d-flex flex-wrap gap-2 my-2.5">
                      <div
                        className="stat-pill-action pill-devices"
                        title="Click to view site devices"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/manage-organisation?tab=device&siteId=${site.id}`);
                        }}
                      >
                        <Server size={13} className="text-info" />
                        <span className="tabular-nums fw-bold text-white">{devices}</span> Devices
                      </div>

                      {/* Alarms Pill: Quiet when 0, Alert when > 0 */}
                      <div
                        className={`stat-pill-action ${alarms > 0 ? 'pill-alarms-active' : 'pill-alarms-zero'}`}
                        title={alarms > 0 ? 'Site has active alarms! Click to inspect' : 'No active alarms (Healthy)'}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/alarm-system/active?siteId=${site.id}`);
                        }}
                      >
                        {alarms > 0 ? (
                          <AlertTriangle size={13} className="text-danger" />
                        ) : (
                          <CheckCircle2 size={13} className="text-success" />
                        )}
                        <span className={`tabular-nums fw-bold ${alarms > 0 ? 'text-danger' : 'text-white'}`}>{alarms}</span> Alarms
                      </div>

                      <div
                        className="stat-pill-action pill-energy"
                        title="Click to view energy metering"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/energy-metering/overview');
                        }}
                      >
                        <Zap size={13} className="text-warning" />
                        <span className="tabular-nums fw-bold text-white">{energy.toLocaleString()}</span> kWh
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Metadata & Actions */}
                  <div className="pt-2.5 border-top d-flex align-items-center justify-content-between" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      <Clock size={11} className="me-1" />
                      {formatDate(site.createdAt)}
                    </div>

                    <div className="d-flex align-items-center gap-1.5">
                      <OverlayTrigger placement="top" overlay={<Tooltip>Edit Site Configuration</Tooltip>}>
                        <button
                          type="button"
                          className="touch-action-btn"
                          aria-label={`Edit ${site.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(site);
                          }}
                        >
                          <Edit3 size={15} />
                        </button>
                      </OverlayTrigger>

                      <button
                        type="button"
                        className="site-inspect-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSite(site);
                        }}
                      >
                        <span>Inspect</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* Table View Layout */
        <div className="table-responsive border rounded" style={{ borderColor: 'var(--scada-border, #334155)', background: 'var(--scada-card, #1e293b)' }}>
          <table className="site-data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Site Name {sortColumn === 'name' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} className="opacity-50" />}
                </th>
                <th>Organization & Location</th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status {sortColumn === 'status' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} className="opacity-50" />}
                </th>
                <th onClick={() => handleSort('devices')} style={{ cursor: 'pointer' }}>
                  Devices {sortColumn === 'devices' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} className="opacity-50" />}
                </th>
                <th onClick={() => handleSort('alarms')} style={{ cursor: 'pointer' }}>
                  Alarms {sortColumn === 'alarms' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} className="opacity-50" />}
                </th>
                <th onClick={() => handleSort('energy')} style={{ cursor: 'pointer' }}>
                  Energy (kWh) {sortColumn === 'energy' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} className="opacity-50" />}
                </th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSites.map((site) => {
                const isEnabled = isSiteActive(site);
                const alarms = Number(site.alarmsCount) || 0;
                const devices = getSiteDevicesCount(site);
                const isSelectedActive = activeDashboardSite && String(activeDashboardSite.id) === String(site.id);
                const { tenantName, zoneName } = getSiteHierarchy(site);

                return (
                  <tr key={site.id} style={{ cursor: 'pointer' }} onClick={() => handleViewSite(site)}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold text-white">{site.name}</span>
                        {isSelectedActive && (
                          <Badge bg="info" className="text-dark" style={{ fontSize: '0.65rem' }}>
                            CURRENT
                          </Badge>
                        )}
                      </div>
                      <small className="text-muted d-block font-monospace" style={{ fontSize: '0.72rem' }}>
                        ID: #{site.id}
                      </small>
                    </td>
                    <td>
                      <div className="text-info font-monospace" style={{ fontSize: '0.75rem' }}>
                        {tenantName || 'Root / Default'}
                      </div>
                      <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.78rem' }}>
                        <MapPin size={12} />
                        <span>{site.city || 'N/A'}{site.state ? `, ${site.state}` : ''}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`site-status-pill ${isEnabled ? 'is-active' : 'is-inactive'}`}
                        onClick={(e) => handleToggleSiteStatus(site, e)}
                        style={{ minHeight: 28 }}
                      >
                        <span className={`status-dot-indicator ${isEnabled ? 'online' : 'offline'}`} />
                        {isEnabled ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td>
                      <span
                        className="tabular-nums fw-bold text-info"
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/manage-organisation?tab=device&siteId=${site.id}`);
                        }}
                      >
                        {devices}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`tabular-nums fw-bold ${alarms > 0 ? 'text-danger' : 'text-success opacity-75'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/alarm-system/active?siteId=${site.id}`);
                        }}
                      >
                        {alarms > 0 ? (
                          <span className="badge bg-danger text-white">{alarms}</span>
                        ) : (
                          <span className="text-success">0</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="tabular-nums fw-semibold text-warning">
                        {(Number(site.energyKwh) || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="text-end" onClick={e => e.stopPropagation()}>
                      <div className="d-flex align-items-center justify-content-end gap-1.5">
                        <button
                          type="button"
                          className="touch-action-btn"
                          aria-label={`Inspect ${site.name}`}
                          title="Inspect Details"
                          onClick={() => handleViewSite(site)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="touch-action-btn"
                          aria-label={`Edit ${site.name}`}
                          title="Edit Configuration"
                          onClick={() => handleOpenEditModal(site)}
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Site Drawer */}
      <RegisterSiteModal
        show={showCreateModal}
        onHide={() => {
          setShowCreateModal(false);
          setCreateModalError(null);
        }}
        formData={createForm}
        setFormData={setCreateForm}
        onSubmit={handleCreateSite}
        tenants={tenants}
        zones={zones}
        areas={areas}
        submitting={submitting}
        error={createModalError}
        isEdit={false}
      />

      {/* Edit Site Drawer with 100% Schema Parity */}
      <RegisterSiteModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditModalError(null);
        }}
        formData={editForm}
        setFormData={setEditForm}
        onSubmit={handleUpdateSite}
        tenants={tenants}
        zones={zones}
        areas={areas}
        submitting={submitting}
        error={editModalError}
        isEdit={true}
        title="Edit Site Configuration"
        subtitle={editingSite?.name || 'Update site parameters'}
        submitLabel="Save Changes"
        submittingLabel="Saving Changes..."
      />

      {/* Modern Slide-Over Site Inspector Drawer */}
      <SiteInspectorDrawer
        show={showInspectorDrawer}
        onHide={() => setShowInspectorDrawer(false)}
        site={inspectingSite}
        siteStats={siteStats}
        isActiveDashboardSite={Boolean(activeDashboardSite && inspectingSite && String(activeDashboardSite.id) === String(inspectingSite.id))}
        onSetActiveSite={(site) => {
          setSelectedSite(site);
          setMessage({ type: 'success', text: `Site "${site.name}" set as active dashboard site.` });
        }}
        onEditSite={handleOpenEditModal}
        onToggleStatus={handleToggleSiteStatus}
        tenants={tenants}
        zones={zones}
        areas={areas}
      />

      {/* CONFIRM DISABLE / ENABLE SITE MODAL */}
      <Modal
        show={Boolean(confirmToggleSite)}
        onHide={() => !togglingStatus && setConfirmToggleSite(null)}
        centered
        backdrop="static"
        keyboard={!togglingStatus}
        className="scada-confirm-modal"
        backdropClassName="scada-confirm-backdrop"
      >
        <Modal.Header closeButton={!togglingStatus}>
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: 42,
                height: 42,
                minWidth: 42,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isSiteActive(confirmToggleSite) ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${isSiteActive(confirmToggleSite) ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                color: isSiteActive(confirmToggleSite) ? '#ef4444' : '#10b981',
                boxShadow: isSiteActive(confirmToggleSite) ? '0 0 16px rgba(239, 68, 68, 0.25)' : '0 0 16px rgba(16, 185, 129, 0.25)',
                flexShrink: 0
              }}
            >
              {isSiteActive(confirmToggleSite) ? <AlertTriangle size={20} /> : <Power size={20} />}
            </div>
            <div>
              <Modal.Title className="fs-16 fw-bold mb-0 text-white" style={{ letterSpacing: '0.01em' }}>
                {isSiteActive(confirmToggleSite) ? 'Disable Site Confirmation' : 'Enable Site Confirmation'}
              </Modal.Title>
              <div className="text-muted fs-12 mt-0.5">Safety verification required before state change</div>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          {/* Target Site Identity Box */}
          <div
            className="rounded-3 mb-3 d-flex align-items-center justify-content-between"
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '12px'
            }}
          >
            <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  minWidth: 38,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#38bdf8',
                  flexShrink: 0
                }}
              >
                <Building2 size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="fw-bold text-white fs-14 text-truncate" style={{ letterSpacing: '0.01em' }}>
                  {confirmToggleSite?.name}
                </div>
                <div className="text-muted fs-12 d-flex align-items-center gap-1 mt-0.5 text-truncate">
                  <MapPin size={12} className="text-secondary flex-shrink-0" />
                  <span>{confirmToggleSite?.city || 'Location unset'}{confirmToggleSite?.state ? `, ${confirmToggleSite?.state}` : ''}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                backgroundColor: isSiteActive(confirmToggleSite) ? 'rgba(16, 185, 129, 0.16)' : 'rgba(100, 116, 139, 0.16)',
                color: isSiteActive(confirmToggleSite) ? '#34d399' : '#94a3b8',
                border: `1px solid ${isSiteActive(confirmToggleSite) ? 'rgba(16, 185, 129, 0.4)' : 'rgba(100, 116, 139, 0.4)'}`,
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isSiteActive(confirmToggleSite) ? '#34d399' : '#94a3b8',
                  boxShadow: isSiteActive(confirmToggleSite) ? '0 0 8px rgba(52, 211, 153, 0.8)' : 'none',
                  flexShrink: 0
                }}
              />
              <span>{isSiteActive(confirmToggleSite) ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
          </div>

          {/* Impact Statement Box */}
          <div
            className="rounded-3"
            style={{
              padding: '16px 18px',
              background: isSiteActive(confirmToggleSite) ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              borderLeft: `4px solid ${isSiteActive(confirmToggleSite) ? '#ef4444' : '#10b981'}`,
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px'
            }}
          >
            <div
              className="d-flex align-items-center gap-2 mb-2"
              style={{
                color: isSiteActive(confirmToggleSite) ? '#f87171' : '#34d399',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            >
              <AlertTriangle size={17} className="flex-shrink-0" />
              <span>{isSiteActive(confirmToggleSite) ? 'Real-time telemetry will be paused' : 'Real-time telemetry will resume'}</span>
            </div>
            <p
              className="mb-0 text-slate-300"
              style={{
                fontSize: '0.82rem',
                lineHeight: 1.6,
                paddingLeft: '25px'
              }}
            >
              {isSiteActive(confirmToggleSite)
                ? 'Disabling this site will stop sensor data aggregation, mute automated threshold alarms, and mark connected assets as offline.'
                : 'Enabling this site will reconnect live SCADA telemetry, resume background health checks, and re-engage automated alert monitoring.'}
            </p>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={togglingStatus}
            className="px-4 py-2 text-slate-200 border-secondary border-opacity-40"
            style={{
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.85rem',
              background: 'rgba(255, 255, 255, 0.04)',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setConfirmToggleSite(null)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={togglingStatus}
            onClick={handleConfirmToggleStatus}
            className="px-4 py-2 border-0 d-inline-flex align-items-center gap-2 text-white"
            style={{
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: isSiteActive(confirmToggleSite)
                ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: isSiteActive(confirmToggleSite)
                ? '0 4px 16px rgba(220, 38, 38, 0.45)'
                : '0 4px 16px rgba(5, 150, 105, 0.45)'
            }}
          >
            {togglingStatus ? (
              <>
                <Spinner size="sm" animation="border" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Power size={15} />
                <span>{isSiteActive(confirmToggleSite) ? 'Yes, Disable Site' : 'Yes, Enable Site'}</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SiteManagement;
