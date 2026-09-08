import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Container, Row, Col, Badge, Button, Form, Spinner, InputGroup, Pagination, Dropdown } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Cpu, Plus, RefreshCw, Search, Filter, X, Eye, Edit3, Trash2,
  Box, MapPin, Activity, CheckCircle2, AlertTriangle, Layers, Zap, MoreVertical
} from 'lucide-react';
import { useSiteStore } from '../../context/SiteContext';
import bmsService from '../../services/bmsService';
import { normalizePaginatedResponse, normalizeList } from '../../services/apiClient';
import DeviceModal, { DEVICE_CATEGORIES } from './modals/DeviceModal';
import DeviceInspectorDrawer from './modals/DeviceInspectorDrawer';
import DeviceDeleteModal from './modals/DeviceDeleteModal';
import AssetInspectorDrawer from './modals/AssetInspectorDrawer';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

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

  // Load assets for asset name mapping in device list
  useEffect(() => {
    let isMounted = true;
    const fetchAssetsData = async () => {
      try {
        const siteIdParam = selectedSiteFilter !== 'ALL' ? selectedSiteFilter : null;
        const res = await bmsService.getAssets(siteIdParam, { limit: 200 });
        if (isMounted) {
          const list = normalizeList(res, 'assets');
          setAssets(list);
        }
      } catch (err) {
        if (isMounted) setAssets([]);
      }
    };
    fetchAssetsData();
    return () => { isMounted = false; };
  }, [selectedSiteFilter]);

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
      if (selectedSiteFilter !== 'ALL') {
        res = await bmsService.getSiteDevices(selectedSiteFilter, queryParams);
      } else {
        res = await bmsService.getDevices(queryParams);
      }

      const { items, total, totalPages } = normalizePaginatedResponse(res, 'devices');

      setDevices(items);
      setTotalRecords(total);
      setServerTotalPages(Math.max(1, totalPages));

      // Calculate summary statistics
      const activeCount = items.filter(d => d.isActive !== false).length;
      const inactiveCount = items.filter(d => d.isActive === false).length;
      const unassignedCount = items.filter(d => !d.assetId).length;

      setSummary({
        total: total || items.length,
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
  }, [currentPage, pageSize, selectedSiteFilter, selectedCategoryFilter, selectedStatusFilter, debouncedSearch]);

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
    setSelectedCategoryFilter('ALL');
    setSelectedStatusFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = debouncedSearch !== '' ||
    selectedSiteFilter !== 'ALL' ||
    selectedCategoryFilter !== 'ALL' ||
    selectedStatusFilter !== 'ALL';

  // ── Modal & Drawer Handlers ───────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingDevice(null);
    setShowModal(true);
  };

  const handleOpenEdit = (dev) => {
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
        /* ── Core Wrapper & Base Colors ── */
        .device-management-wrapper {
          min-height: 100vh;
          background-color: #090d16;
          color: #f8fafc;
          padding: 24px;
        }
        .device-management-wrapper.embedded-mode {
          min-height: auto;
          padding: 0;
          background-color: transparent !important;
        }
        body.light-mode .device-management-wrapper {
          background-color: #f8fafc;
          color: #0f172a;
        }
        body.light-mode .device-management-wrapper.embedded-mode {
          background-color: transparent !important;
        }

        /* ── SCADA Card Surfaces ── */
        .device-management-wrapper .scada-card-surface {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        body.light-mode .device-management-wrapper .scada-card-surface {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05) !important;
        }

        /* ── Header Typography & Badges ── */
        .device-management-wrapper .device-header-title {
          color: #f8fafc;
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
        .device-management-wrapper .device-total-badge {
          background: rgba(14, 165, 233, 0.15);
          border: 1px solid rgba(14, 165, 233, 0.35);
          color: #38bdf8;
          font-weight: 600;
        }
        body.light-mode .device-management-wrapper .device-total-badge {
          background: #e0f2fe !important;
          border-color: #bae6fd !important;
          color: #0284c7 !important;
          font-weight: 700 !important;
        }

        /* ── Compact KPI Strip ── */
        .device-kpi-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        @media (max-width: 767.98px) {
          .device-kpi-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .device-kpi-item {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
        }
        body.light-mode .device-kpi-item {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }
        .device-kpi-lbl {
          font-size: 0.68rem;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #94a3b8;
        }
        body.light-mode .device-kpi-lbl {
          color: #64748b !important;
        }

        /* ── Filter Controls ── */
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
          font-size: 0.82rem;
        }
        body.light-mode .device-management-wrapper .filter-input-scada {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .device-management-wrapper .btn-clear-filters {
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #38bdf8;
          background: transparent;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 6px;
        }

        /* ── Table Customization ── */
        .device-management-wrapper .table-custom th {
          background-color: #1e293b !important;
          color: #38bdf8 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 10px 14px;
        }
        body.light-mode .device-management-wrapper .table-custom th {
          background-color: #f1f5f9 !important;
          color: #0369a1 !important;
          border-bottom: 1px solid #cbd5e1 !important;
        }
        .device-management-wrapper .table-custom td {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
          padding: 10px 14px;
          vertical-align: middle;
        }
        body.light-mode .device-management-wrapper .table-custom td {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .device-management-wrapper .table-custom tbody tr:hover td {
          background-color: rgba(255, 255, 255, 0.025) !important;
        }
        body.light-mode .device-management-wrapper .table-custom tbody tr:hover td {
          background-color: #f8fafc !important;
        }

        /* ── Primary & Subdued Text ── */
        .device-primary-name {
          color: #f8fafc;
          font-weight: 600;
          font-size: 0.84rem;
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
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 5px;
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
          font-size: 0.72rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 5px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        body.light-mode .btn-scada-edit {
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
          background: #ffffff !important;
        }

        .btn-scada-more {
          border: 1px solid transparent;
          color: #94a3b8;
          background: transparent;
          padding: 3px 5px;
          border-radius: 5px;
          display: inline-flex;
          align-items: center;
        }
      `}</style>

      <Container fluid className="px-0">
        {/* Header Bar */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2.5 mb-1">
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.1))',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8'
                }}
              >
                <Cpu size={18} />
              </div>
              <h4 className="fs-5 fw-bold mb-0 device-header-title">Device Management</h4>
              <Badge className="device-total-badge px-2.5 py-1 fs-11 rounded-pill">
                {totalRecords} Devices
              </Badge>
            </div>
            <p className="fs-12 mb-0 device-header-subtitle">
              Manage devices, controllers, meters, sensors, and field equipment connected to physical assets.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-scada-edit d-flex align-items-center gap-1.5"
              onClick={fetchDevicesData}
              title="Refresh inventory"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <Button
              variant="primary"
              size="sm"
              className="d-flex align-items-center gap-1.5 px-3 py-1.5 fs-12 fw-semibold rounded-2"
              onClick={handleOpenCreate}
              style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderColor: '#0284c7' }}
            >
              <Plus size={15} />
              <span>+ Add Device</span>
            </Button>
          </div>
        </div>

        {/* Compact KPI Strip */}
        <div className="device-kpi-strip">
          <div className="device-kpi-item">
            <div>
              <div className="device-kpi-lbl">Total Inventory</div>
              <div className="fs-5 fw-bold text-slate-100">{summary.total}</div>
            </div>
            <Cpu size={20} className="text-info opacity-75" />
          </div>

          <div className="device-kpi-item">
            <div>
              <div className="device-kpi-lbl">Active / Online</div>
              <div className="fs-5 fw-bold text-success">{summary.active}</div>
            </div>
            <CheckCircle2 size={20} className="text-success opacity-75" />
          </div>

          <div className="device-kpi-item">
            <div>
              <div className="device-kpi-lbl">Inactive / Offline</div>
              <div className="fs-5 fw-bold text-slate-400">{summary.inactive}</div>
            </div>
            <Activity size={20} className="text-slate-400 opacity-75" />
          </div>

          <div className="device-kpi-item">
            <div>
              <div className="device-kpi-lbl">Unassigned Devices</div>
              <div className="fs-5 fw-bold text-warning">{summary.unassigned}</div>
            </div>
            <Layers size={20} className="text-warning opacity-75" />
          </div>
        </div>

        {/* Filter & Toolbar */}
        <div className="scada-card-surface p-3 mb-4">
          <Row className="g-2 align-items-center">
            {/* Search Input */}
            <Col xs={12} md={4} lg={3}>
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
            </Col>

            {/* Site Filter */}
            <Col xs={6} md={3} lg={2.5}>
              <Form.Select
                size="sm"
                className="filter-input-scada"
                value={selectedSiteFilter}
                onChange={(e) => handleSiteChange(e.target.value)}
              >
                <option value="ALL">All Sites</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
            </Col>

            {/* Category Filter */}
            <Col xs={6} md={3} lg={2.5}>
              <Form.Select
                size="sm"
                className="filter-input-scada"
                value={selectedCategoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {DEVICE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </Form.Select>
            </Col>

            {/* Status Filter */}
            <Col xs={6} md={2} lg={2}>
              <Form.Select
                size="sm"
                className="filter-input-scada"
                value={selectedStatusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Form.Select>
            </Col>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Col xs={6} md="auto">
                <button
                  type="button"
                  className="btn btn-clear-filters px-2.5 py-1"
                  onClick={handleClearAllFilters}
                >
                  <X size={12} className="me-1" />
                  Clear Filters
                </button>
              </Col>
            )}
          </Row>
        </div>

        {/* Content Area Table */}
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
                    <th style={{ minWidth: 200 }}>Device</th>
                    <th style={{ minWidth: 120 }}>Category</th>
                    <th style={{ minWidth: 160 }}>Linked Asset</th>
                    <th style={{ minWidth: 120 }}>Site</th>
                    <th style={{ minWidth: 100 }}>Status</th>
                    <th style={{ minWidth: 110 }}>Installed / Last Seen</th>
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
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 6,
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                color: '#38bdf8'
                              }}
                            >
                              <Cpu size={14} />
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
                          <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 fs-11">
                            {dev.category ? dev.category.replace(/_/g, ' ') : 'ENERGY_METER'}
                          </span>
                        </td>

                        {/* Linked Asset */}
                        <td>
                          {linkedAsset ? (
                            <div className="d-flex align-items-center gap-1.5 text-truncate" style={{ maxWidth: 180 }}>
                              <Box size={13} className="text-info flex-shrink-0" />
                              <span
                                className="fw-semibold text-slate-200 fs-12 text-truncate cursor-pointer hover-text-info"
                                onClick={() => handleOpenAssetFromDevice(linkedAsset)}
                                title={`Linked Asset: ${linkedAsset.name}`}
                              >
                                {linkedAsset.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted fs-11">Unassigned</span>
                          )}
                        </td>

                        {/* Site */}
                        <td className="text-truncate" style={{ maxWidth: 130 }}>
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
                                backgroundColor: isActive ? '#22c55e' : '#94a3b8'
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
        onHide={() => setShowModal(false)}
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
