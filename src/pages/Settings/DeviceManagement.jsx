import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Container, Row, Col, Badge, Button, Form, Spinner, InputGroup, Pagination, Dropdown } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Cpu, Plus, RefreshCw, Search, Filter, X, Eye, Edit3, Trash2,
  Box, MapPin, Activity, CheckCircle2, AlertTriangle, Layers, Zap,
  MoreVertical, ExternalLink, ChevronRight, Droplets, Flame, Wind,
  Snowflake, ShieldAlert, Sliders, Radio, ArrowUpRight
} from 'lucide-react';
import { useSiteStore } from '../../context/SiteContext';
import bmsService, { fetchAndStoreSochiotAccessToken } from '../../services/bmsService';
import { normalizePaginatedResponse, normalizeList } from '../../services/apiClient';
import DeviceModal, { DEVICE_CATEGORIES } from './modals/DeviceModal';
import DeviceInspectorDrawer from './modals/DeviceInspectorDrawer';
import DeviceDeleteModal from './modals/DeviceDeleteModal';
import AssetInspectorDrawer from './modals/AssetInspectorDrawer';
import CommonFilterPopover from '../../components/common/CommonFilterPopover';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Category Icon & Color Mapping for Premium Visual Hierarchy
const getCategoryIcon = (category) => {
  const c = String(category || '').toUpperCase();
  if (c.includes('ENERGY') || c.includes('METER') || c === 'BREAKER') return <Zap size={14} className="text-info" />;
  if (c.includes('TANK') || c.includes('PUMP') || c.includes('VALVE') || c === 'STP' || c === 'WTP') return <Droplets size={14} className="text-teal" style={{ color: '#2dd4bf' }} />;
  if (c.includes('HVAC') || c === 'AC' || c === 'VRV') return <Snowflake size={14} className="text-sky" style={{ color: '#38bdf8' }} />;
  if (c.includes('GENERATOR') || c.includes('FIRE')) return <Flame size={14} className="text-amber" style={{ color: '#f59e0b' }} />;
  if (c.includes('SENSOR') || c.includes('AQI')) return <Activity size={14} className="text-purple" style={{ color: '#c084fc' }} />;
  return <Cpu size={14} className="text-slate-400" />;
};

const getCategoryBadgeClass = (category) => {
  const c = String(category || '').toUpperCase();
  if (c.includes('ENERGY') || c.includes('METER')) return 'cat-badge-energy';
  if (c.includes('TANK') || c.includes('PUMP') || c.includes('VALVE')) return 'cat-badge-water';
  if (c.includes('HVAC') || c === 'AC' || c === 'VRV') return 'cat-badge-hvac';
  if (c.includes('GENERATOR') || c.includes('FIRE')) return 'cat-badge-fire';
  if (c.includes('SENSOR') || c.includes('AQI')) return 'cat-badge-sensor';
  return 'cat-badge-generic';
};

const DeviceManagement = ({ embedded = false }) => {
  const { sites, fetchSites, selectedSite } = useSiteStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── URL Query State Synchronization ─────────────────────────────────────
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialLimit = parseInt(searchParams.get('limit') || '25', 10);
  const initialSite = searchParams.get('siteId') || (selectedSite?.id ? String(selectedSite.id) : 'ALL');
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialSearch = searchParams.get('search') || '';

  // ── State Management ──────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS.includes(initialLimit) ? initialLimit : 25);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState(initialSite);
  const [selectedAssetFilter, setSelectedAssetFilter] = useState('ALL');
  const [selectedAssetTypeFilter, setSelectedAssetTypeFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(initialCategory);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Server Data & Pagination
  const [devices, setDevices] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Cached assets for linking display
  const [assets, setAssets] = useState([]);

  // Summary Metrics State
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    unassigned: 0
  });

  // Modals & Drawers
  const [inspectingDevice, setInspectingDevice] = useState(null);
  const [showInspector, setShowInspector] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Cross-Navigation to Asset Inspector
  const [inspectingAsset, setInspectingAsset] = useState(null);
  const [showAssetInspector, setShowAssetInspector] = useState(false);

  // Ensure sites are loaded
  useEffect(() => {
    if (sites.length === 0) fetchSites();
  }, [sites.length, fetchSites]);

  // Load assets for asset filter and mapping per OpenAPI:
  // If ALL sites selected -> GET /assets
  // If specific site selected -> GET /sites/{siteId}/assets
  const [allAssets, setAllAssets] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadAllAssets = async () => {
      try {
        const res = await bmsService.getAssets(null, { limit: 500 });
        if (isMounted) {
          const list = normalizeList(res, 'assets');
          setAllAssets(list);
          if (selectedSiteFilter === 'ALL') {
            setAssets(list);
          }
        }
      } catch (err) {
        if (isMounted) setAllAssets([]);
      }
    };
    loadAllAssets();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchAssetsData = async () => {
      try {
        const siteIdParam = selectedSiteFilter !== 'ALL' ? selectedSiteFilter : null;
        const res = await bmsService.getAssets(siteIdParam, { limit: 500 });
        if (isMounted) {
          const list = normalizeList(res, 'assets');
          setAssets(list);
        }
      } catch (err) {
        if (isMounted) {
          if (selectedSiteFilter !== 'ALL') {
            setAssets(allAssets.filter(a => String(a.siteId) === String(selectedSiteFilter)));
          } else {
            setAssets(allAssets);
          }
        }
      }
    };
    fetchAssetsData();
    return () => { isMounted = false; };
  }, [selectedSiteFilter, allAssets]);

  // ── Debounce Search Input (350ms) ──────────────────────────────────────
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1);
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  // ── Sync URL Query Parameters ──────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (currentPage > 1) params.set('page', String(currentPage)); else params.delete('page');
    if (pageSize !== 25) params.set('limit', String(pageSize)); else params.delete('limit');
    if (selectedSiteFilter !== 'ALL') params.set('siteId', selectedSiteFilter); else params.delete('siteId');
    if (selectedCategoryFilter !== 'ALL') params.set('category', selectedCategoryFilter); else params.delete('category');
    if (selectedStatusFilter !== 'ALL') params.set('status', selectedStatusFilter); else params.delete('status');
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim()); else params.delete('search');

    const newStr = params.toString();
    const oldStr = searchParams.toString();
    if (newStr !== oldStr) {
      setSearchParams(params, { replace: true });
    }
  }, [currentPage, pageSize, selectedSiteFilter, selectedCategoryFilter, selectedStatusFilter, debouncedSearch, searchParams, setSearchParams]);

  // ── Fetch Devices (Server-Side Paginated) ──────────────────────────────
  const fetchDevicesData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const queryParams = {
        page: currentPage,
        limit: pageSize,
        include: 'settings,rules,profile,area,building'
      };

      if (debouncedSearch.trim()) queryParams.search = debouncedSearch.trim();
      if (selectedCategoryFilter !== 'ALL') queryParams.category = selectedCategoryFilter;
      if (selectedStatusFilter !== 'ALL') queryParams.isActive = selectedStatusFilter === 'ACTIVE';

      let res;
      if (selectedAssetFilter !== 'ALL') {
        // Follow OpenAPI: GET /assets/{id}/devices
        res = await bmsService.getAssetDevices(selectedAssetFilter);
      } else if (selectedSiteFilter !== 'ALL') {
        // Follow OpenAPI: GET /sites/{siteId}/devices
        res = await bmsService.getSiteDevices(selectedSiteFilter, queryParams);
      } else {
        // Follow OpenAPI: GET /devices
        res = await bmsService.getDevices(queryParams);
      }

      const { items, total, totalPages } = normalizePaginatedResponse(res, 'devices');

      let itemsToUse = items;
      if (selectedAssetFilter !== 'ALL') {
        itemsToUse = itemsToUse.filter(d => String(d.assetId) === String(selectedAssetFilter));
      }
      if (selectedAssetTypeFilter !== 'ALL') {
        itemsToUse = itemsToUse.filter(d => {
          const la = assets.find(a => String(a.id) === String(d.assetId)) || d.asset;
          return la && String(la.assetType || '').toUpperCase() === String(selectedAssetTypeFilter).toUpperCase();
        });
      }

      setDevices(itemsToUse);
      setTotalRecords(itemsToUse.length === items.length ? total : itemsToUse.length);
      setServerTotalPages(Math.max(1, totalPages));

      // Calculate summary statistics
      const activeCount = itemsToUse.filter(d => d.isActive !== false).length;
      const inactiveCount = itemsToUse.filter(d => d.isActive === false).length;
      const unassignedCount = itemsToUse.filter(d => !d.assetId).length;

      setSummary({
        total: total || itemsToUse.length,
        active: activeCount,
        inactive: inactiveCount,
        unassigned: unassignedCount
      });
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      setFetchError(err.message || 'Unable to load devices inventory from server.');
      setDevices([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedSiteFilter, selectedCategoryFilter, selectedStatusFilter, selectedAssetFilter, selectedAssetTypeFilter, debouncedSearch, assets]);

  useEffect(() => {
    fetchDevicesData();
  }, [fetchDevicesData]);

  // ── Filter Change Handlers ────────────────────────────────────────────
  const handleSiteChange = (val) => {
    setSelectedSiteFilter(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val) => {
    setSelectedCategoryFilter(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val) => {
    setSelectedStatusFilter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val) => {
    setPageSize(Number(val));
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedSiteFilter('ALL');
    setSelectedAssetFilter('ALL');
    setSelectedAssetTypeFilter('ALL');
    setSelectedCategoryFilter('ALL');
    setSelectedStatusFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = debouncedSearch !== '' ||
    selectedSiteFilter !== 'ALL' ||
    selectedAssetFilter !== 'ALL' ||
    selectedAssetTypeFilter !== 'ALL' ||
    selectedCategoryFilter !== 'ALL' ||
    selectedStatusFilter !== 'ALL';

  const getDeviceFilters = (draftValues) => {
    const currentSiteId = draftValues?.siteId !== undefined ? draftValues.siteId : (selectedSiteFilter || 'ALL');

    // Follow OpenAPI:
    // If all sites selected -> all assets are shown, user can choose any asset
    // If one site is selected -> show only the assets under that site
    const assetsForSite = currentSiteId === 'ALL'
      ? (allAssets.length > 0 ? allAssets : assets)
      : (allAssets.length > 0
          ? allAssets.filter(a => String(a.siteId) === String(currentSiteId))
          : assets.filter(a => String(a.siteId) === String(currentSiteId)));

    const assetTypesList = Array.from(
      new Set(assetsForSite.map(a => a.assetType).filter(Boolean))
    ).sort();

    return [
      {
        id: 'siteId',
        label: 'Site',
        options: [
          { value: 'ALL', label: 'All Sites' },
          ...sites.map(s => ({ value: String(s.id), label: s.name }))
        ],
        onChange: (newSiteVal, currentDrafts) => {
          let nextAssetId = currentDrafts.assetId;
          let nextAssetType = currentDrafts.assetType;
          if (newSiteVal !== 'ALL') {
            const assetStillValid = assets.some(
              a => String(a.siteId) === String(newSiteVal) && String(a.id) === String(nextAssetId)
            );
            if (!assetStillValid) nextAssetId = 'ALL';

            const siteAssets = assets.filter(a => String(a.siteId) === String(newSiteVal));
            const typeStillValid = siteAssets.some(a => a.assetType === nextAssetType);
            if (!typeStillValid) nextAssetType = 'ALL';
          }
          return {
            ...currentDrafts,
            siteId: newSiteVal,
            assetId: nextAssetId,
            assetType: nextAssetType
          };
        }
      },
      {
        id: 'assetId',
        label: 'Asset',
        options: [
          { value: 'ALL', label: currentSiteId === 'ALL' ? 'All Assets' : 'All Site Assets' },
          ...assetsForSite.map(a => ({
            value: String(a.id),
            label: a.name ? `${a.name}${a.assetType ? ` [${a.assetType}]` : ''}` : `Asset #${a.id}`
          }))
        ]
      },
      {
        id: 'assetType',
        label: 'Asset type',
        options: [
          { value: 'ALL', label: 'All Asset Types' },
          ...assetTypesList.map(type => ({
            value: type,
            label: type.replace(/_/g, ' ')
          }))
        ]
      },
      {
        id: 'category',
        label: 'Device profile',
        options: [
          { value: 'ALL', label: 'All' },
          ...DEVICE_CATEGORIES.map(cat => ({ value: cat, label: cat.replace(/_/g, ' ') }))
        ]
      },
      {
        id: 'status',
        label: 'Device state',
        options: [
          { value: 'ALL', label: 'Any' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }
        ]
      }
    ];
  };

  const activeFilterValues = {
    siteId: selectedSiteFilter,
    assetId: selectedAssetFilter,
    assetType: selectedAssetTypeFilter,
    category: selectedCategoryFilter,
    status: selectedStatusFilter
  };

  const handleApplyFilters = (newValues) => {
    if (newValues.siteId !== undefined) setSelectedSiteFilter(newValues.siteId);
    if (newValues.assetId !== undefined) setSelectedAssetFilter(newValues.assetId);
    if (newValues.assetType !== undefined) setSelectedAssetTypeFilter(newValues.assetType);
    if (newValues.category !== undefined) setSelectedCategoryFilter(newValues.category);
    if (newValues.status !== undefined) setSelectedStatusFilter(newValues.status);
    setCurrentPage(1);
  };

  // ── Modal & Drawer Handlers ───────────────────────────────────────────
  const handleOpenCreate = () => {
    fetchAndStoreSochiotAccessToken();
    setEditingDevice(null);
    setShowModal(true);
  };

  const handleOpenEdit = (dev) => {
    fetchAndStoreSochiotAccessToken();
    setEditingDevice(dev);
    setShowModal(true);
  };

  const handleOpenDelete = (dev) => {
    setDeletingDevice(dev);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDevice) return;
    setSubmitting(true);
    setDeleteError(null);
    try {
      const siteIdNum = Number(deletingDevice.siteId || (sites[0]?.id || 7));
      await bmsService.deleteSiteDevice(siteIdNum, deletingDevice.id);
      setActionMessage({ type: 'success', text: `Device "${deletingDevice.name}" decommissioned successfully.` });
      setShowDeleteModal(false);
      if (inspectingDevice?.id === deletingDevice.id) setShowInspector(false);
      fetchDevicesData();
    } catch (err) {
      console.error('Failed to soft delete device:', err);
      setDeleteError(err.message || 'Failed to soft delete device. Please check API connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspect = (dev) => {
    setInspectingDevice(dev);
    setShowInspector(true);
  };

  const handleOpenAssetFromDevice = (assetObj) => {
    setInspectingAsset(assetObj);
    setShowAssetInspector(true);
  };

  return (
    <div className={`device-management-wrapper ${embedded ? 'embedded-mode' : 'standalone-page'}`}>
      <style>{`
        /* ── Core Wrapper & Ambient Glow ── */
        .device-management-wrapper {
          min-height: 100vh;
          background: #090d16;
          color: #f8fafc;
          padding: 28px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .device-management-wrapper.embedded-mode {
          min-height: auto;
          padding: 0;
          background: transparent !important;
        }
        body.light-mode .device-management-wrapper {
          background: #f8fafc;
          color: #0f172a;
        }
        body.light-mode .device-management-wrapper.embedded-mode {
          background: transparent !important;
        }

        /* ── SCADA Card Surfaces & Glassmorphism ── */
        .device-management-wrapper .scada-card-surface {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), 0 0 20px rgba(56, 189, 248, 0.03);
          backdrop-filter: blur(12px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        body.light-mode .device-management-wrapper .scada-card-surface {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05) !important;
        }

        /* ── Header Bar Styling ── */
        .device-header-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(14, 165, 233, 0.08));
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #38bdf8;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
        }
        body.light-mode .device-header-icon-box {
          background: #e0f2fe;
          border-color: #bae6fd;
          color: #0284c7;
          box-shadow: none;
        }
        .device-management-wrapper .device-header-title {
          color: #f8fafc;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        body.light-mode .device-management-wrapper .device-header-title {
          color: #0f172a !important;
        }
        .device-management-wrapper .device-header-subtitle {
          color: #94a3b8;
        }
        body.light-mode .device-management-wrapper .device-header-subtitle {
          color: #64748b !important;
        }
        .device-total-badge {
          background: rgba(14, 165, 233, 0.12);
          border: 1px solid rgba(14, 165, 233, 0.3);
          color: #38bdf8;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        body.light-mode .device-total-badge {
          background: #e0f2fe !important;
          border-color: #bae6fd !important;
          color: #0284c7 !important;
        }

        /* ── Pulse System Live Pill ── */
        .system-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .live-dot-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: pulseGlow 2s infinite ease-in-out;
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }

        /* ── Dynamic KPI Metric Strip ── */
        .device-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        @media (max-width: 991.98px) {
          .device-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 575.98px) {
          .device-kpi-grid {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
        }
        .device-kpi-card {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .device-kpi-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: #38bdf8;
          border-radius: 12px 0 0 12px;
        }
        .device-kpi-card.kpi-active::before { background: #22c55e; }
        .device-kpi-card.kpi-inactive::before { background: #94a3b8; }
        .device-kpi-card.kpi-unassigned::before { background: #f59e0b; }

        .device-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.3);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
        body.light-mode .device-kpi-card {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04) !important;
        }
        .device-kpi-lbl {
          font-size: 0.68rem;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #94a3b8;
          margin-bottom: 2px;
        }
        body.light-mode .device-kpi-lbl {
          color: #64748b !important;
        }
        .device-kpi-num {
          font-size: 1.45rem;
          font-weight: 700;
          line-height: 1.2;
        }

        /* ── Filter Controls Toolbar ── */
        .device-management-wrapper .scada-input-group-addon {
          background-color: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-right: none !important;
          color: #94a3b8 !important;
        }
        body.light-mode .device-management-wrapper .scada-input-group-addon {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          border-right: none !important;
          color: #64748b !important;
        }
        .device-management-wrapper .filter-input-scada {
          background-color: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #f8fafc !important;
          border-radius: 6px;
          font-size: 0.84rem;
        }
        body.light-mode .device-management-wrapper .filter-input-scada {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .device-management-wrapper .filter-input-scada:focus {
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2) !important;
        }
        .device-management-wrapper .btn-clear-filters {
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          font-size: 0.78rem;
          font-weight: 600;
          border-radius: 6px;
          transition: all 0.15s ease;
        }
        .device-management-wrapper .btn-clear-filters:hover {
          background: #0284c7;
          color: #ffffff;
        }

        /* ── Category Badges Styling ── */
        .cat-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .cat-badge-energy {
          background: rgba(14, 165, 233, 0.12);
          border: 1px solid rgba(14, 165, 233, 0.3);
          color: #38bdf8;
        }
        .cat-badge-water {
          background: rgba(20, 184, 166, 0.12);
          border: 1px solid rgba(20, 184, 166, 0.3);
          color: #2dd4bf;
        }
        .cat-badge-hvac {
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #7dd3fc;
        }
        .cat-badge-fire {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }
        .cat-badge-sensor {
          background: rgba(168, 85, 247, 0.12);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: #c084fc;
        }
        .cat-badge-generic {
          background: rgba(148, 163, 184, 0.12);
          border: 1px solid rgba(148, 163, 184, 0.25);
          color: #cbd5e1;
        }

        /* ── Table Customization ── */
        .device-management-wrapper .table-custom th {
          background-color: #1e293b !important;
          color: #38bdf8 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 12px 16px;
        }
        body.light-mode .device-management-wrapper .table-custom th {
          background-color: #f1f5f9 !important;
          color: #0369a1 !important;
          border-bottom: 1px solid #cbd5e1 !important;
        }
        .device-management-wrapper .table-custom td {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding: 12px 16px;
          vertical-align: middle;
          transition: background 0.15s ease;
        }
        body.light-mode .device-management-wrapper .table-custom td {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .device-management-wrapper .table-custom tbody tr:hover td {
          background-color: rgba(255, 255, 255, 0.03) !important;
        }
        body.light-mode .device-management-wrapper .table-custom tbody tr:hover td {
          background-color: #f8fafc !important;
        }

        /* ── Primary & Subdued Text ── */
        .device-primary-name {
          color: #f8fafc;
          font-weight: 600;
          font-size: 0.86rem;
        }
        body.light-mode .device-primary-name {
          color: #0f172a !important;
        }
        .device-sub-id {
          color: #64748b;
          font-size: 0.72rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        body.light-mode .device-sub-id {
          color: #64748b !important;
        }

        /* ── Action Buttons ── */
        .btn-scada-inspect {
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          font-size: 0.74rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .btn-scada-inspect:hover {
          background: #38bdf8;
          color: #0f172a;
        }
        body.light-mode .btn-scada-inspect {
          border: 1px solid #0284c7 !important;
          color: #0284c7 !important;
          background: #f0f9ff !important;
        }
        body.light-mode .btn-scada-inspect:hover {
          background: #0284c7 !important;
          color: #ffffff !important;
        }

        .btn-scada-edit {
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.04);
          font-size: 0.74rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .btn-scada-edit:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        body.light-mode .btn-scada-edit {
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
          background: #ffffff !important;
        }
        body.light-mode .btn-scada-edit:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }

        .btn-scada-more {
          border: 1px solid transparent;
          color: #94a3b8;
          background: transparent;
          padding: 4px 6px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
        }
        .btn-scada-more:hover {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>

      <Container fluid className="px-0">
        {/* Header Bar */}
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <div className="d-flex align-items-center gap-2">
              <h4 className="fs-5 fw-bold mb-0 device-header-title">Device Management</h4>
              <div className="system-live-pill ms-1">
                <span className="live-dot-pulse" />
                <span>SYSTEM LIVE</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-scada-edit d-flex align-items-center gap-1.5"
              onClick={fetchDevicesData}
              title="Refresh inventory"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="d-flex align-items-center justify-content-between">
            <p className="fs-12 mb-0 device-header-subtitle">
              BMS IoT Device Provisioning, Serial Numbers & Telemetry Controls
            </p>
            <div className="d-flex align-items-center gap-2">
              <Badge className="device-total-badge px-2.5 py-1 fs-11 rounded-pill">
                {totalRecords} Devices
              </Badge>
              <Button
                variant="primary"
                size="sm"
                className="d-flex align-items-center gap-1.5 px-3 py-1.5 fs-12 fw-semibold rounded-2 shadow-sm"
                onClick={handleOpenCreate}
                style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderColor: '#0284c7' }}
              >
                <Plus size={15} />
                <span>+ Add Device</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Dynamic KPI Metric Cards */}
        <div className="device-kpi-grid mb-3">
          <div className="device-kpi-card">
            <div>
              <div className="device-kpi-lbl">Total Inventory</div>
              <div className="device-kpi-num text-slate-100">{summary.total}</div>
            </div>
            <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info">
              <Cpu size={22} />
            </div>
          </div>

          <div className="device-kpi-card kpi-active">
            <div>
              <div className="device-kpi-lbl">Active / Online</div>
              <div className="device-kpi-num text-success">{summary.active}</div>
            </div>
            <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="device-kpi-card kpi-inactive">
            <div>
              <div className="device-kpi-lbl">Inactive / Offline</div>
              <div className="device-kpi-num text-slate-400">{summary.inactive}</div>
            </div>
            <div className="p-2 rounded-3 bg-slate-500 bg-opacity-10 text-slate-400">
              <Activity size={22} />
            </div>
          </div>

          <div className="device-kpi-card kpi-unassigned">
            <div>
              <div className="device-kpi-lbl">Unassigned Devices</div>
              <div className="device-kpi-num text-warning">{summary.unassigned}</div>
            </div>
            <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning">
              <Layers size={22} />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="scada-card-surface p-3 mb-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            {/* Search Input */}
            <div style={{ minWidth: 260, flex: 1, maxWidth: 400 }}>
              <InputGroup size="sm">
                <InputGroup.Text className="scada-input-group-addon">
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search device name, SN, ID..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="filter-input-scada"
                />
                {searchQuery && (
                  <Button variant="outline-secondary" className="filter-clear-btn" onClick={handleClearSearch}>
                    <X size={13} />
                  </Button>
                )}
              </InputGroup>
            </div>

            {/* Reusable Common Filter Popover */}
            <div className="d-flex align-items-center gap-2">
              <CommonFilterPopover
                buttonLabel="Device filter"
                filters={getDeviceFilters}
                values={activeFilterValues}
                onApply={handleApplyFilters}
                onReset={handleClearAllFilters}
                extraHeader={
                  <Form.Check
                    type="switch"
                    id="include-customer-entities-switch"
                    label={<span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Include customer entities</span>}
                    defaultChecked
                  />
                }
              />
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-clear-filters px-3 py-1"
                  onClick={handleClearAllFilters}
                >
                  <X size={12} className="me-1" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Device Table Card */}
        <div className="scada-card-surface overflow-hidden">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" size="sm" variant="info" />
              <div className="fs-12 device-header-subtitle mt-2">Querying server device inventory...</div>
            </div>
          ) : fetchError ? (
            <div className="text-center py-5 px-3">
              <AlertTriangle size={32} className="text-danger mb-2 opacity-75" />
              <h6 className="device-header-title fw-bold">Unable to load devices</h6>
              <p className="fs-12 device-header-subtitle mb-3">{fetchError}</p>
              <Button variant="outline-info" size="sm" onClick={fetchDevicesData}>
                Retry Query
              </Button>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-5 px-3">
              <Cpu size={36} className="text-slate-500 mb-2 opacity-40" />
              {hasActiveFilters ? (
                <>
                  <h6 className="device-header-title fw-bold">No devices match current filters</h6>
                  <p className="fs-12 device-header-subtitle mb-3">Try adjusting your search criteria or clearing active filters.</p>
                  <Button variant="outline-info" size="sm" onClick={handleClearAllFilters}>
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <h6 className="device-header-title fw-bold">No devices registered yet</h6>
                  <p className="fs-12 device-header-subtitle mb-3">Begin by provisioning your first meter, sensor, or controller device.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenCreate}
                    style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderColor: '#0284c7' }}
                  >
                    + Add Device
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th style={{ minWidth: 220 }}>Device</th>
                    <th style={{ minWidth: 140 }}>Category</th>
                    <th style={{ minWidth: 170 }}>Linked Asset</th>
                    <th style={{ minWidth: 130 }}>Site</th>
                    <th style={{ minWidth: 110 }}>Status</th>
                    <th style={{ minWidth: 130 }}>Installed / Last Seen</th>
                    <th className="text-end" style={{ minWidth: 150 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map(dev => {
                    const isActive = dev.isActive !== false;
                    const siteObj = sites.find(s => String(s.id) === String(dev.siteId));
                    const linkedAsset = assets.find(a => String(a.id) === String(dev.assetId)) || dev.asset;

                    return (
                      <tr key={dev.id}>
                        {/* Device Name Primary, Serial / BMS ID Secondary */}
                        <td>
                          <div className="d-flex align-items-center gap-2.5">
                            <div
                              className="d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                color: '#38bdf8'
                              }}
                            >
                              {getCategoryIcon(dev.category)}
                            </div>
                            <div className="min-w-0">
                              <div className="fw-bold device-primary-name text-truncate" title={dev.name}>
                                {dev.name}
                              </div>
                              <div className="device-sub-id text-truncate">
                                {dev.serialNumber ? `SN: ${dev.serialNumber}` : (dev.bmsDeviceId || `ID: ${dev.id}`)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className={`cat-badge ${getCategoryBadgeClass(dev.category)}`}>
                            {getCategoryIcon(dev.category)}
                            <span>{dev.category ? dev.category.replace(/_/g, ' ') : 'ENERGY METER'}</span>
                          </span>
                        </td>

                        {/* Linked Asset */}
                        <td>
                          {linkedAsset ? (
                            <div className="d-flex align-items-center gap-1.5 text-truncate" style={{ maxWidth: 190 }}>
                              <Box size={14} className="text-info flex-shrink-0" />
                              <span
                                className="fw-semibold text-slate-200 fs-12 text-truncate cursor-pointer hover-text-info d-inline-flex align-items-center gap-1"
                                onClick={() => handleOpenAssetFromDevice(linkedAsset)}
                                title={`Linked Asset: ${linkedAsset.name}`}
                              >
                                <span>{linkedAsset.name}</span>
                                <ArrowUpRight size={11} className="text-muted flex-shrink-0" />
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted fs-11">Unassigned</span>
                          )}
                        </td>

                        {/* Site */}
                        <td className="text-truncate" style={{ maxWidth: 140 }}>
                          <span className="fs-12 text-slate-200">
                            {siteObj?.name || (dev.siteId ? `Site #${dev.siteId}` : 'Universal')}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <div className="d-flex align-items-center gap-1.5">
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                backgroundColor: isActive ? '#22c55e' : '#94a3b8',
                                boxShadow: isActive ? '0 0 6px #22c55e' : 'none'
                              }}
                            />
                            <span className="fs-11 fw-semibold text-slate-300">
                              {isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                        </td>

                        {/* Installed / Last Seen */}
                        <td>
                          <span className="fs-11 text-muted">
                            {formatDate(dev.lastSeenAt || dev.installedAt || dev.updatedAt)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="text-end">
                          <div className="d-flex align-items-center justify-content-end gap-1.5">
                            <button
                              type="button"
                              className="btn-scada-inspect"
                              onClick={() => handleInspect(dev)}
                            >
                              <Eye size={12} />
                              <span>Inspect</span>
                            </button>

                            <button
                              type="button"
                              className="btn-scada-edit"
                              onClick={() => handleOpenEdit(dev)}
                            >
                              <Edit3 size={12} />
                              <span>Edit</span>
                            </button>

                            <Dropdown align="end">
                              <Dropdown.Toggle as="button" className="btn-scada-more" aria-label="More actions">
                                <MoreVertical size={14} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu className="dropdown-menu-dark shadow-lg">
                                <Dropdown.Item
                                  onClick={() => handleOpenDelete(dev)}
                                  className="fs-12 text-danger d-flex align-items-center gap-2"
                                >
                                  <Trash2 size={14} />
                                  <span>Decommission</span>
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && devices.length > 0 && (
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between p-3 border-top border-secondary border-opacity-20 gap-3">
              <div className="fs-12 text-muted">
                Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of <strong>{totalRecords}</strong> devices
              </div>

              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-1.5 fs-12 text-muted">
                  <span>Rows per page:</span>
                  <Form.Select
                    size="sm"
                    style={{ width: 70, padding: '2px 8px', fontSize: '0.78rem' }}
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(e.target.value)}
                  >
                    {PAGE_SIZE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Form.Select>
                </div>

                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  />
                  <Pagination.Item active>{currentPage}</Pagination.Item>
                  <Pagination.Next
                    disabled={currentPage >= serverTotalPages}
                    onClick={() => setCurrentPage(p => Math.min(serverTotalPages, p + 1))}
                  />
                </Pagination>
              </div>
            </div>
          )}
        </div>
      </Container>

      {/* Modals & Drawers */}
      <DeviceModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingDevice(null);
        }}
        editingDevice={editingDevice}
        sites={sites}
        onSaveSuccess={fetchDevicesData}
      />

      <DeviceInspectorDrawer
        show={showInspector}
        onHide={() => setShowInspector(false)}
        device={inspectingDevice}
        sites={sites}
        assets={assets}
        onEdit={(dev) => {
          setShowInspector(false);
          handleOpenEdit(dev);
        }}
        onDelete={(dev) => {
          setShowInspector(false);
          handleOpenDelete(dev);
        }}
        onOpenAsset={(assetObj) => {
          setShowInspector(false);
          handleOpenAssetFromDevice(assetObj);
        }}
      />

      <DeviceDeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        device={deletingDevice}
        sites={sites}
        assets={assets}
        onConfirm={handleConfirmDelete}
        submitting={submitting}
        error={deleteError}
      />

      <AssetInspectorDrawer
        show={showAssetInspector}
        onHide={() => setShowAssetInspector(false)}
        asset={inspectingAsset}
        allAssets={assets}
        sites={sites}
      />
    </div>
  );
};

export default DeviceManagement;
