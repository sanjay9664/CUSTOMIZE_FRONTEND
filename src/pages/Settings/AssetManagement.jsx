import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Container, Row, Col, Badge, Button, Form, Spinner, InputGroup, OverlayTrigger, Tooltip, Pagination, Dropdown } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import {
  Sliders, Plus, Building2, Activity, AlertTriangle, RefreshCw,
  Search, List, ChevronRight, ChevronDown, Layers,
  Edit3, Trash2, Eye, GitFork, CornerDownRight, Cpu, CheckCircle2,
  Filter, X, ShieldAlert, ArrowUpDown, ArrowUp, ArrowDown,
  Box, MapPin, MoreVertical, Wrench
} from 'lucide-react';
import { useSiteStore } from '../../context/SiteContext';
import bmsService from '../../services/bmsService';
import { normalizePaginatedResponse, normalizeList } from '../../services/apiClient';
import AssetInspectorDrawer from './modals/AssetInspectorDrawer';
import RegisterAssetModal, { ASSET_TYPES, ASSET_STATUSES } from './modals/RegisterAssetModal';
import AssetDeleteModal from './modals/AssetDeleteModal';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const getTypeBadgeClass = (type) => {
  const t = String(type || '').toUpperCase();
  if (t === 'BUILDING') return 'type-building';
  if (['FLOOR', 'AREA'].includes(t)) return 'type-space';
  if (['ROOM', 'CUBICLE'].includes(t)) return 'type-room';
  return 'type-equipment';
};

const findAssetInTree = (nodes, id) => {
  if (!Array.isArray(nodes) || !id) return null;
  for (const n of nodes) {
    if (String(n.id) === String(id)) return n;
    if (Array.isArray(n.children) && n.children.length > 0) {
      const found = findAssetInTree(n.children, id);
      if (found) return found;
    }
  }
  return null;
};

const AssetManagement = ({ embedded = false }) => {
  const { sites, fetchSites, selectedSite } = useSiteStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL Query State Synchronization ─────────────────────────────────────
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialLimit = parseInt(searchParams.get('limit') || '25', 10);
  const initialSite = searchParams.get('siteId') || (selectedSite?.id ? String(selectedSite.id) : 'ALL');
  const initialType = searchParams.get('assetType') || 'ALL';
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialDepth = searchParams.get('depth') || 'ALL';
  const initialSearch = searchParams.get('search') || '';
  const initialView = searchParams.get('view') || localStorage.getItem('bms_asset_view_mode') || 'table';

  // ── State Management ──────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState(initialView); // 'table' | 'hierarchy'
  const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS.includes(initialLimit) ? initialLimit : 25);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState(initialSite);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState(initialType);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(initialStatus);
  const [selectedDepthFilter, setSelectedDepthFilter] = useState(initialDepth); // 'ALL' | '0' | '1' | '2' | '3+'
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Data & Pagination from Server
  const [tableAssets, setTableAssets] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Hierarchy Tree Data State
  const [hierarchyTree, setHierarchyTree] = useState([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [expandedNodeIds, setExpandedNodeIds] = useState(() => new Set());

  // Compact KPI Stats State
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
    buildings: 0,
    spaces: 0,
    equipment: 0
  });

  // Modal / Drawer States
  const [inspectingAsset, setInspectingAsset] = useState(null);
  const [showInspector, setShowInspector] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formError, setFormError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Form State for Create / Edit
  const [assetForm, setAssetForm] = useState({
    name: '',
    assetType: 'EQUIPMENT',
    status: 'ACTIVE',
    siteId: '',
    isChildAsset: false,
    parentId: '',
    order: 0,
    description: '',
    serialNumber: '',
    firmware: '',
    installDate: '',
    installBy: '',
    lastVisitDate: ''
  });

  // ── Debounce Search Input (350ms) ──────────────────────────────────────
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setCurrentPage(1); // Reset page to 1 on search change
    }, 350);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  // ── Update URL Search Params ───────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (currentPage > 1) params.set('page', String(currentPage)); else params.delete('page');
    if (pageSize !== 25) params.set('limit', String(pageSize)); else params.delete('limit');
    if (selectedSiteFilter !== 'ALL') params.set('siteId', selectedSiteFilter); else params.delete('siteId');
    if (selectedTypeFilter !== 'ALL') params.set('assetType', selectedTypeFilter); else params.delete('assetType');
    if (selectedStatusFilter !== 'ALL') params.set('status', selectedStatusFilter); else params.delete('status');
    if (selectedDepthFilter !== 'ALL') params.set('depth', selectedDepthFilter); else params.delete('depth');
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim()); else params.delete('search');
    if (viewMode !== 'table') params.set('view', viewMode); else params.delete('view');

    // Only update if changes occurred to avoid infinite re-render
    const newStr = params.toString();
    const oldStr = searchParams.toString();
    if (newStr !== oldStr) {
      setSearchParams(params, { replace: true });
    }
  }, [currentPage, pageSize, selectedSiteFilter, selectedTypeFilter, selectedStatusFilter, selectedDepthFilter, debouncedSearch, viewMode, searchParams, setSearchParams]);

  // Ensure sites are loaded
  useEffect(() => {
    if (sites.length === 0) fetchSites();
  }, [sites.length, fetchSites]);

  // ── Fetch Server Statistics (KPIs) ─────────────────────────────────────
  const fetchStatsData = useCallback(async () => {
    try {
      if (selectedSiteFilter !== 'ALL') {
        const statsRes = await bmsService.getAssetStats(selectedSiteFilter);
        const data = statsRes?.data || statsRes || {};
        const byStatus = data.byStatus || {};
        const byType = data.byType || {};

        setStats({
          total: data.total ?? 0,
          active: byStatus.ACTIVE ?? 0,
          inactive: byStatus.INACTIVE ?? 0,
          maintenance: byStatus.MAINTENANCE ?? 0,
          buildings: byType.BUILDING ?? (data.byDepth?.['0'] ?? 0),
          spaces: (byType.FLOOR ?? 0) + (byType.AREA ?? 0) + (byType.ROOM ?? 0) + (byType.CUBICLE ?? 0),
          equipment: (byType.EQUIPMENT ?? 0) + (byType.MACHINE ?? 0) + (byType.PANEL ?? 0) + (byType.DG ?? 0)
        });
      } else {
        // Across All Sites: Query base assets summary
        const allRes = await bmsService.getAssets(null, { limit: 100 });
        const { items, total } = normalizePaginatedResponse(allRes, 'assets');
        const active = items.filter(a => a.status === 'ACTIVE' || (!a.status && !a.deletedAt)).length;
        const inactive = items.filter(a => a.status === 'INACTIVE' || a.deletedAt).length;
        const maintenance = items.filter(a => a.status === 'MAINTENANCE').length;
        const buildings = items.filter(a => a.assetType === 'BUILDING' || a.depth === 0).length;
        const spaces = items.filter(a => ['FLOOR', 'AREA', 'ROOM', 'CUBICLE'].includes(a.assetType)).length;
        const equipment = items.filter(a => ['EQUIPMENT', 'MACHINE', 'LINE', 'PANEL', 'DG', 'LT_ROOM', 'PUMP_ROOM'].includes(a.assetType)).length;

        setStats({
          total: total || items.length,
          active,
          inactive,
          maintenance,
          buildings,
          spaces,
          equipment
        });
      }
    } catch (err) {
      console.warn('Unable to load server asset stats:', err);
    }
  }, [selectedSiteFilter]);

  // ── Fetch Server-Side Paginated Assets (Table View) ───────────────────
  const fetchTableAssets = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Build OpenAPI parameters: strictly non-empty values
      const queryParams = {
        page: currentPage,
        limit: pageSize
      };

      if (debouncedSearch.trim()) {
        queryParams.search = debouncedSearch.trim();
      }
      if (selectedTypeFilter !== 'ALL') {
        queryParams.assetType = selectedTypeFilter;
      }
      if (selectedStatusFilter !== 'ALL') {
        queryParams.status = selectedStatusFilter;
      }
      if (selectedDepthFilter !== 'ALL') {
        if (selectedDepthFilter === 'ROOT') queryParams.depth = 0;
        else if (selectedDepthFilter === 'CHILD') queryParams.minDepth = 1;
        else if (!isNaN(Number(selectedDepthFilter))) queryParams.depth = Number(selectedDepthFilter);
      }

      const siteIdParam = selectedSiteFilter !== 'ALL' ? selectedSiteFilter : null;
      const res = await bmsService.getAssets(siteIdParam, queryParams);
      const { items, total, totalPages } = normalizePaginatedResponse(res, 'assets');

      setTableAssets(items);
      setTotalRecords(total);
      setServerTotalPages(Math.max(1, totalPages));
    } catch (err) {
      console.error('Failed to load paginated assets:', err);
      setFetchError(err.message || 'Unable to load asset inventory from server.');
      setTableAssets([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedSiteFilter, selectedTypeFilter, selectedStatusFilter, selectedDepthFilter, debouncedSearch]);

  // ── Fetch Dedicated Hierarchy Tree (Hierarchy View) ───────────────────
  const fetchHierarchyData = useCallback(async () => {
    setLoadingHierarchy(true);
    try {
      if (selectedSiteFilter !== 'ALL') {
        // Dedicated site hierarchy endpoint
        const treeRes = await bmsService.getAssetHierarchy(selectedSiteFilter);
        const rawTree = normalizeList(treeRes, 'assets');
        if (Array.isArray(rawTree) && rawTree.length > 0) {
          setHierarchyTree(rawTree);
          // Auto-expand roots
          setExpandedNodeIds(new Set(rawTree.map(n => String(n.id))));
          setLoadingHierarchy(false);
          return;
        }
      }

      // Fallback or All Sites: Fetch top-level assets and construct branch structure
      const res = await bmsService.getAssets(selectedSiteFilter !== 'ALL' ? selectedSiteFilter : null, { limit: 100 });
      const flatList = normalizeList(res, 'assets');
      
      const assetMap = new Map();
      flatList.forEach(a => assetMap.set(String(a.id), { ...a, children: [] }));

      const roots = [];
      assetMap.forEach(node => {
        const parentId = node.parentId || node.parentAssetId;
        if (parentId && assetMap.has(String(parentId))) {
          assetMap.get(String(parentId)).children.push(node);
        } else {
          roots.push(node);
        }
      });

      setHierarchyTree(roots);
      setExpandedNodeIds(new Set(roots.map(r => String(r.id))));
    } catch (err) {
      console.warn('Hierarchy endpoint fallback:', err);
    } finally {
      setLoadingHierarchy(false);
    }
  }, [selectedSiteFilter]);

  // Load Data on Filter / Page Changes
  useEffect(() => {
    fetchStatsData();
  }, [fetchStatsData]);

  useEffect(() => {
    if (viewMode === 'table') {
      fetchTableAssets();
    } else {
      fetchHierarchyData();
    }
  }, [viewMode, fetchTableAssets, fetchHierarchyData]);

  // ── Filter Change Handlers (Always Reset Page to 1) ────────────────────
  const handleSiteChange = (val) => {
    setSelectedSiteFilter(val);
    setCurrentPage(1);
  };

  const handleTypeChange = (val) => {
    setSelectedTypeFilter(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val) => {
    setSelectedStatusFilter(val);
    setCurrentPage(1);
  };

  const handleDepthChange = (val) => {
    setSelectedDepthFilter(val);
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
    setSelectedTypeFilter('ALL');
    setSelectedStatusFilter('ALL');
    setSelectedDepthFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = debouncedSearch !== '' ||
    selectedSiteFilter !== 'ALL' ||
    selectedTypeFilter !== 'ALL' ||
    selectedStatusFilter !== 'ALL' ||
    selectedDepthFilter !== 'ALL';

  // ── Tree Expansion Controls ────────────────────────────────────────────
  const toggleNodeExpand = (nodeId) => {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const expandAllNodes = () => {
    const ids = new Set();
    const collect = (nodes) => {
      nodes.forEach(n => {
        ids.add(String(n.id));
        if (n.children && n.children.length > 0) collect(n.children);
      });
    };
    collect(hierarchyTree);
    setExpandedNodeIds(ids);
  };

  const collapseAllNodes = () => {
    setExpandedNodeIds(new Set());
  };

  // ── Modal Handlers ────────────────────────────────────────────────────
  // Consolidate all available assets across table & hierarchy for parent dropdown selection
  const allPotentialParents = useMemo(() => {
    const map = new Map();
    tableAssets.forEach(a => { if (a?.id) map.set(String(a.id), a); });
    const flatten = (nodes) => {
      if (!Array.isArray(nodes)) return;
      nodes.forEach(n => {
        if (n?.id) map.set(String(n.id), n);
        if (n.children && n.children.length > 0) flatten(n.children);
      });
    };
    flatten(hierarchyTree);
    return Array.from(map.values());
  }, [tableAssets, hierarchyTree]);

  const handleOpenCreate = (parentAsset = null) => {
    setEditingAsset(null);
    setFormError(null);
    const targetSiteId = parentAsset?.siteId || (selectedSiteFilter !== 'ALL' ? selectedSiteFilter : (sites[0]?.id || 7));

    setAssetForm({
      name: '',
      assetType: parentAsset ? (parentAsset.assetType === 'BUILDING' ? 'FLOOR' : (parentAsset.assetType === 'FLOOR' ? 'ROOM' : 'EQUIPMENT')) : 'BUILDING',
      status: 'ACTIVE',
      siteId: targetSiteId,
      isChildAsset: Boolean(parentAsset),
      parentId: parentAsset ? String(parentAsset.id) : '',
      order: 0,
      description: '',
      serialNumber: '',
      firmware: '',
      installDate: '',
      installBy: '',
      lastVisitDate: '',
      capacity: '',
      sqft: '',
      sochiotDeviceIds: ''
    });
    setShowRegisterModal(true);
  };

  const handleOpenEdit = (assetToEdit) => {
    setEditingAsset(assetToEdit);
    setFormError(null);
    const hasParent = Boolean(assetToEdit.parentId || assetToEdit.parentAssetId);
    setAssetForm({
      name: assetToEdit.name || '',
      assetType: assetToEdit.assetType || 'EQUIPMENT',
      status: assetToEdit.status || 'ACTIVE',
      siteId: assetToEdit.siteId || (sites[0]?.id || 7),
      isChildAsset: hasParent,
      parentId: hasParent ? String(assetToEdit.parentId || assetToEdit.parentAssetId) : '',
      order: assetToEdit.order !== undefined ? assetToEdit.order : 0,
      description: assetToEdit.description || '',
      serialNumber: assetToEdit.serialNumber || '',
      firmware: assetToEdit.firmware || '',
      installDate: assetToEdit.installDate ? assetToEdit.installDate.slice(0, 10) : '',
      installBy: assetToEdit.installBy || '',
      lastVisitDate: assetToEdit.lastVisitDate ? assetToEdit.lastVisitDate.slice(0, 10) : '',
      capacity: assetToEdit.metadata?.capacity || '',
      sqft: assetToEdit.metadata?.sqft || '',
      sochiotDeviceIds: Array.isArray(assetToEdit.sochiotDeviceIds) ? assetToEdit.sochiotDeviceIds.join(', ') : (assetToEdit.sochiotDeviceIds || '')
    });
    setShowRegisterModal(true);
  };

  const handleSaveAsset = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmittingForm(true);
    setFormError(null);

    try {
      const isEdit = Boolean(editingAsset);

      // Construct OpenAPI metadata object if fields are populated
      const metadata = {};
      if (assetForm.capacity !== '' && assetForm.capacity !== undefined && !isNaN(Number(assetForm.capacity))) {
        metadata.capacity = Number(assetForm.capacity);
      }
      if (assetForm.sqft !== '' && assetForm.sqft !== undefined && !isNaN(Number(assetForm.sqft))) {
        metadata.sqft = Number(assetForm.sqft);
      }

      // Parse Sochiot device IDs
      let deviceIds = [];
      if (assetForm.sochiotDeviceIds) {
        if (Array.isArray(assetForm.sochiotDeviceIds)) {
          deviceIds = assetForm.sochiotDeviceIds.map(Number).filter(n => !isNaN(n) && n > 0);
        } else if (typeof assetForm.sochiotDeviceIds === 'string') {
          deviceIds = assetForm.sochiotDeviceIds
            .split(',')
            .map(s => Number(s.trim()))
            .filter(n => !isNaN(n) && n > 0);
        }
      }

      const payload = {
        name: assetForm.name.trim(),
        assetType: assetForm.assetType,
        status: assetForm.status,
        description: assetForm.description || null,
        order: Number(assetForm.order) || 0,
        serialNumber: assetForm.serialNumber || null,
        firmware: assetForm.firmware || null,
        installDate: assetForm.installDate ? new Date(assetForm.installDate).toISOString() : null,
        installBy: assetForm.installBy || null,
        lastVisitDate: assetForm.lastVisitDate ? new Date(assetForm.lastVisitDate).toISOString() : null,
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
        ...(deviceIds.length > 0 ? { sochiotDeviceIds: deviceIds } : {})
      };

      if (!isEdit) {
        payload.siteId = Number(assetForm.siteId || (sites[0]?.id || 7));
      }

      if (assetForm.isChildAsset && assetForm.parentId) {
        payload.parentId = String(assetForm.parentId);
      } else {
        payload.parentId = null;
      }

      if (isEdit) {
        await bmsService.updateAsset(editingAsset.id, payload);
        setActionMessage({ type: 'success', text: `Asset "${payload.name}" updated successfully!` });
      } else {
        await bmsService.createAsset(payload);
        setActionMessage({ type: 'success', text: `Asset "${payload.name}" registered successfully!` });
      }

      setShowRegisterModal(false);
      fetchTableAssets();
      fetchStatsData();
      if (viewMode === 'hierarchy') fetchHierarchyData();
    } catch (err) {
      console.error('Failed to save asset:', err);
      setFormError(err.message || 'Error saving asset. Please verify input fields.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleOpenDelete = (assetToDelete) => {
    setDeletingAsset(assetToDelete);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAsset) return;
    setSubmittingForm(true);
    setFormError(null);

    try {
      await bmsService.deleteAsset(deletingAsset.id);
      setActionMessage({ type: 'success', text: `Asset "${deletingAsset.name}" deleted successfully.` });
      setShowDeleteModal(false);
      if (inspectingAsset?.id === deletingAsset.id) setShowInspector(false);
      fetchTableAssets();
      fetchStatsData();
      if (viewMode === 'hierarchy') fetchHierarchyData();
    } catch (err) {
      console.error('Failed to delete asset:', err);
      setFormError(err.message || 'Deletion rejected. Please unlink any active devices before deleting.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleInspect = (assetToInspect) => {
    setInspectingAsset(assetToInspect);
    setShowInspector(true);
  };

  // ── Refresh Button Handler (Preserves all states) ──────────────────────
  const handleRefresh = () => {
    fetchStatsData();
    if (viewMode === 'table') fetchTableAssets();
    else fetchHierarchyData();
  };

  // ── Recursive Hierarchy Tree Renderer ──────────────────────────────────
  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodeIds.has(String(node.id));
    const isInactive = node.status === 'INACTIVE' || node.deletedAt;
    const isMaintenance = node.status === 'MAINTENANCE';
    const siteObj = sites.find(s => String(s.id) === String(node.siteId));

    return (
      <div key={node.id} className="tree-node-wrapper">
        <div
          className={`tree-node-row d-flex align-items-center justify-content-between py-2 px-3 ${depth > 0 ? 'tree-node-child' : 'tree-node-root'}`}
          style={{
            paddingLeft: `${16 + depth * 44}px`
          }}
        >
          {/* Left: Branch Indicator + Name + Type */}
          <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                className="btn btn-link p-0 text-slate-400 hover-text-white d-inline-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 18, height: 18 }}
                onClick={() => toggleNodeExpand(String(node.id))}
                aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
              >
                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            ) : (
              <span
                className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 18, height: 18 }}
              >
                {depth > 0 ? (
                  <CornerDownRight size={13} className="text-slate-400 opacity-75" />
                ) : (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      backgroundColor: '#64748b'
                    }}
                  />
                )}
              </span>
            )}

            <div className={`tree-icon-container ${depth === 0 ? 'depth-0' : 'depth-sub'}`}>
              {depth === 0 ? (
                <Building2 size={15} className="text-info" />
              ) : depth === 1 ? (
                <Layers size={14} className="text-warning" />
              ) : (
                <Sliders size={13} className="text-slate-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold asset-primary-name fs-13 text-truncate" title={node.name}>
                  {node.name}
                </span>
                <span className={`asset-type-badge ${getTypeBadgeClass(node.assetType)}`}>
                  {node.assetType || 'EQUIPMENT'}
                </span>
              </div>
              <div className="asset-sub-id text-truncate">
                {node.serialNumber ? `SN: ${node.serialNumber}` : node.id}
              </div>
            </div>
          </div>

          {/* Middle: Site + Status */}
          <div className="d-none d-md-flex align-items-center gap-3 me-3 flex-shrink-0">
            <span className="asset-meta-text">
              {siteObj?.name || `Site #${node.siteId || '7'}`}
            </span>

            <div className="d-flex align-items-center gap-1.5">
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: isInactive ? '#94a3b8' : (isMaintenance ? '#f59e0b' : '#22c55e')
                }}
              />
              <span className="fs-11 fw-semibold asset-meta-text">
                {node.status || (isInactive ? 'INACTIVE' : 'ACTIVE')}
              </span>
            </div>
          </div>

          {/* Right: Actions Menu */}
          <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              className="btn-scada-inspect"
              onClick={() => handleInspect(node)}
            >
              <Eye size={12} />
              <span>Inspect</span>
            </button>

            <button
              type="button"
              className="btn-scada-edit"
              onClick={() => handleOpenEdit(node)}
            >
              <Edit3 size={12} />
              <span>Edit</span>
            </button>

            <Dropdown align="end">
              <Dropdown.Toggle
                as="button"
                className="btn-scada-more"
                aria-label="More actions"
              >
                <MoreVertical size={14} />
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu-dark shadow-lg">
                <Dropdown.Item onClick={() => handleOpenCreate(node)} className="fs-12 d-flex align-items-center gap-2">
                  <Plus size={14} className="text-info" />
                  <span>Add Child Asset</span>
                </Dropdown.Item>
                <Dropdown.Divider className="border-secondary border-opacity-30" />
                <Dropdown.Item onClick={() => handleOpenDelete(node)} className="fs-12 text-danger d-flex align-items-center gap-2">
                  <Trash2 size={14} />
                  <span>Delete Asset</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Nested Children */}
        {hasChildren && isExpanded && (
          <div className="tree-children-block position-relative">
            <div
              className="tree-branch-guide"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 8,
                left: `${16 + depth * 44 + 9}px`,
                width: 1,
                pointerEvents: 'none',
                zIndex: 1
              }}
            />
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`asset-management-wrapper ${embedded ? 'embedded-mode' : 'standalone-page'}`}>
      <style>{`
        /* ── Core Wrapper & Base Colors ── */
        .asset-management-wrapper {
          min-height: 100vh;
          background-color: #090d16;
          color: #f8fafc;
          padding: 24px;
        }
        .asset-management-wrapper.embedded-mode {
          min-height: auto;
          padding: 0;
          background-color: transparent !important;
        }
        body.light-mode .asset-management-wrapper {
          background-color: #f8fafc;
          color: #0f172a;
        }
        body.light-mode .asset-management-wrapper.embedded-mode {
          background-color: transparent !important;
        }

        /* ── SCADA Card Surfaces ── */
        .asset-management-wrapper .scada-card-surface {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        body.light-mode .asset-management-wrapper .scada-card-surface {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05) !important;
        }

        /* ── Header Typography & Badges ── */
        .asset-management-wrapper .asset-header-title {
          color: #f8fafc;
        }
        body.light-mode .asset-management-wrapper .asset-header-title {
          color: #0f172a !important;
        }
        .asset-management-wrapper .asset-header-subtitle {
          color: #94a3b8;
        }
        body.light-mode .asset-management-wrapper .asset-header-subtitle {
          color: #64748b !important;
        }
        .asset-management-wrapper .asset-total-badge {
          background: rgba(14, 165, 233, 0.15);
          border: 1px solid rgba(14, 165, 233, 0.35);
          color: #38bdf8;
          font-weight: 600;
        }
        body.light-mode .asset-management-wrapper .asset-total-badge {
          background: #e0f2fe !important;
          border-color: #bae6fd !important;
          color: #0284c7 !important;
          font-weight: 700 !important;
        }

        /* ── View Switcher Box ── */
        .asset-management-wrapper .view-switcher-box {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 3px;
          display: flex;
          gap: 3px;
        }
        body.light-mode .asset-management-wrapper .view-switcher-box {
          background: #e2e8f0 !important;
          border-color: #cbd5e1 !important;
        }
        .asset-management-wrapper .view-switch-btn {
          border: none;
          background: transparent;
          color: #94a3b8;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .asset-management-wrapper .view-switch-btn:hover {
          color: #f8fafc;
        }
        .asset-management-wrapper .view-switch-btn.active {
          background: #0284c7 !important;
          color: #ffffff !important;
          font-weight: 700;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        body.light-mode .asset-management-wrapper .view-switch-btn {
          color: #475569;
        }
        body.light-mode .asset-management-wrapper .view-switch-btn:hover {
          color: #0f172a;
        }
        body.light-mode .asset-management-wrapper .view-switch-btn.active {
          background: #0284c7 !important;
          color: #ffffff !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }

        /* ── Sleek Compact KPI Strip ── */
        .compact-kpi-strip {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }
        @media (max-width: 991.98px) {
          .compact-kpi-strip {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 575.98px) {
          .compact-kpi-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        .compact-kpi-item {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
        }
        .compact-kpi-item:hover {
          border-color: rgba(56, 189, 248, 0.4);
        }
        body.light-mode .compact-kpi-item {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }
        body.light-mode .compact-kpi-item:hover {
          border-color: #0284c7 !important;
          box-shadow: 0 3px 6px rgba(2, 132, 199, 0.08);
        }
        .kpi-lbl {
          font-size: 0.68rem;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #94a3b8;
        }
        body.light-mode .kpi-lbl {
          color: #64748b !important;
        }
        .kpi-val-primary {
          color: #f8fafc;
        }
        body.light-mode .kpi-val-primary {
          color: #0f172a !important;
        }

        /* ── Filter & Search Toolbar ── */
        .asset-management-wrapper .scada-input-group-addon {
          background-color: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-right: none !important;
          color: #94a3b8 !important;
        }
        body.light-mode .asset-management-wrapper .scada-input-group-addon {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          border-right: none !important;
          color: #64748b !important;
        }
        .asset-management-wrapper .filter-input-scada {
          background-color: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #f8fafc !important;
          border-radius: 6px;
          font-size: 0.82rem;
        }
        body.light-mode .asset-management-wrapper .filter-input-scada {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .asset-management-wrapper .filter-input-scada:focus {
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2) !important;
        }
        .asset-management-wrapper .filter-clear-btn {
          background-color: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-left: none !important;
          color: #94a3b8 !important;
        }
        body.light-mode .asset-management-wrapper .filter-clear-btn {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          border-left: none !important;
          color: #64748b !important;
        }
        .asset-management-wrapper .btn-clear-filters {
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #38bdf8;
          background: transparent;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 6px;
          transition: all 0.15s ease;
        }
        .asset-management-wrapper .btn-clear-filters:hover {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
        }
        body.light-mode .asset-management-wrapper .btn-clear-filters {
          border-color: #0284c7 !important;
          color: #0284c7 !important;
          background: #f0f9ff !important;
        }
        body.light-mode .asset-management-wrapper .btn-clear-filters:hover {
          background: #0284c7 !important;
          color: #ffffff !important;
        }

        /* ── Crisp Asset Type Badges (Fixed for Light & Dark Mode) ── */
        .asset-type-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.3;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
        }
        body.light-mode .asset-type-badge {
          background: #f1f5f9 !important;
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
        }
        .asset-type-badge.type-building {
          background: rgba(14, 165, 233, 0.15);
          border: 1px solid rgba(14, 165, 233, 0.35);
          color: #38bdf8;
        }
        body.light-mode .asset-type-badge.type-building {
          background: #e0f2fe !important;
          border-color: #bae6fd !important;
          color: #0369a1 !important;
        }
        .asset-type-badge.type-space {
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.35);
          color: #c084fc;
        }
        body.light-mode .asset-type-badge.type-space {
          background: #f3e8ff !important;
          border-color: #e9d5ff !important;
          color: #7e22ce !important;
        }
        .asset-type-badge.type-equipment {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fbbf24;
        }
        body.light-mode .asset-type-badge.type-equipment {
          background: #fef3c7 !important;
          border-color: #fde68a !important;
          color: #b45309 !important;
        }
        .asset-type-badge.type-room {
          background: rgba(20, 184, 166, 0.15);
          border: 1px solid rgba(20, 184, 166, 0.35);
          color: #2dd4bf;
        }
        body.light-mode .asset-type-badge.type-room {
          background: #ccfbf1 !important;
          border-color: #99f6e4 !important;
          color: #0f766e !important;
        }

        /* ── Section Bars (Tree Header & Pagination Footer) ── */
        .asset-management-wrapper .scada-section-bar {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #94a3b8 !important;
        }
        body.light-mode .asset-management-wrapper .scada-section-bar {
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
          color: #475569 !important;
        }

        /* ── Table Styling ── */
        .asset-management-wrapper .table-custom th {
          background-color: #1e293b !important;
          color: #38bdf8 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 10px 14px;
        }
        body.light-mode .asset-management-wrapper .table-custom th {
          background-color: #f1f5f9 !important;
          color: #0369a1 !important;
          border-bottom: 1px solid #cbd5e1 !important;
        }
        .asset-management-wrapper .table-custom td {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
          padding: 10px 14px;
          vertical-align: middle;
        }
        body.light-mode .asset-management-wrapper .table-custom td {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .asset-management-wrapper .table-custom tbody tr:hover td {
          background-color: rgba(255, 255, 255, 0.025) !important;
        }
        body.light-mode .asset-management-wrapper .table-custom tbody tr:hover td {
          background-color: #f8fafc !important;
        }

        /* ── Cell Typography ── */
        .asset-primary-name {
          color: #f8fafc;
          font-weight: 600;
          font-size: 0.82rem;
        }
        body.light-mode .asset-primary-name {
          color: #0f172a !important;
        }
        .asset-sub-id {
          color: #64748b;
          font-size: 0.72rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        body.light-mode .asset-sub-id {
          color: #64748b !important;
        }
        .asset-meta-text {
          color: #cbd5e1;
          font-size: 0.76rem;
        }
        body.light-mode .asset-meta-text {
          color: #334155 !important;
        }

        /* ── Hierarchy Tree Rows ── */
        .tree-node-row {
          transition: background 0.15s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        body.light-mode .tree-node-row {
          border-bottom: 1px solid #f1f5f9;
        }
        .tree-node-row:hover {
          background-color: rgba(255, 255, 255, 0.025) !important;
        }
        body.light-mode .tree-node-row:hover {
          background-color: #f8fafc !important;
        }
        .tree-node-child {
          background-color: rgba(255, 255, 255, 0.01);
        }
        body.light-mode .tree-node-child {
          background-color: #fafbfc;
        }
        .tree-branch-guide {
          border-left: 1.5px dashed rgba(148, 163, 184, 0.35);
        }
        body.light-mode .tree-branch-guide {
          border-left: 1.5px dashed rgba(100, 116, 139, 0.35);
        }
        .tree-icon-container {
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tree-icon-container.depth-0 {
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
        }
        body.light-mode .tree-icon-container.depth-0 {
          background: #e0f2fe;
          border: 1px solid #bae6fd;
        }
        .tree-icon-container.depth-sub {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        body.light-mode .tree-icon-container.depth-sub {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
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
          padding: 3px 5px;
          border-radius: 5px;
          display: inline-flex;
          align-items: center;
        }
        .btn-scada-more:hover {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.08);
        }
        body.light-mode .btn-scada-more {
          color: #64748b !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
        }
        body.light-mode .btn-scada-more:hover {
          color: #0f172a !important;
          background: #f8fafc !important;
        }

        /* ── Header Refresh Button ── */
        .btn-scada-refresh {
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 500;
          padding: 5px 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .btn-scada-refresh:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        body.light-mode .btn-scada-refresh {
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
          background: #ffffff !important;
        }
        body.light-mode .btn-scada-refresh:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }

        /* ── Pagination Overrides ── */
        .asset-management-wrapper .pagination .page-item .page-link {
          background-color: rgba(15, 23, 42, 0.8);
          border-color: rgba(255, 255, 255, 0.12);
          color: #94a3b8;
          font-size: 0.78rem;
          padding: 4px 9px;
        }
        .asset-management-wrapper .pagination .page-item.active .page-link {
          background-color: #0284c7 !important;
          border-color: #0284c7 !important;
          color: #ffffff !important;
        }
        body.light-mode .asset-management-wrapper .pagination .page-item .page-link {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #334155 !important;
        }
        body.light-mode .asset-management-wrapper .pagination .page-item.active .page-link {
          background-color: #0284c7 !important;
          border-color: #0284c7 !important;
          color: #ffffff !important;
        }
        body.light-mode .asset-management-wrapper .pagination .page-item.disabled .page-link {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
          color: #94a3b8 !important;
        }
      `}</style>

      {/* Floating Action Message */}
      {actionMessage && (
        <div className="position-fixed" style={{ zIndex: 9999, top: '1.2rem', right: '1.2rem' }}>
          <div className="px-3 py-2 rounded-3 bg-dark text-white shadow-lg border border-info border-opacity-40 d-flex align-items-center gap-2">
            <CheckCircle2 size={16} className="text-success" />
            <span className="fs-13">{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="btn-close btn-close-white ms-2" size="sm" />
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
        <div className="d-flex align-items-center gap-2.5">
          <div
            className="p-2 rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)', color: '#ffffff' }}
          >
            <Sliders size={20} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold mb-0 asset-header-title fs-5">Asset Management</h4>
              <span className="badge asset-total-badge px-2 py-0.5 fs-11">
                {totalRecords} Total
              </span>
            </div>
            <p className="fs-12 asset-header-subtitle mb-0">
              Physical asset topology, spaces, and equipment inventory.
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* View Mode Switcher */}
          <div className="view-switcher-box">
            <button
              type="button"
              className={`view-switch-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('table');
                localStorage.setItem('bms_asset_view_mode', 'table');
              }}
            >
              <List size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              className={`view-switch-btn ${viewMode === 'hierarchy' ? 'active' : ''}`}
              onClick={() => {
                setViewMode('hierarchy');
                localStorage.setItem('bms_asset_view_mode', 'hierarchy');
              }}
            >
              <GitFork size={13} />
              <span>Hierarchy</span>
            </button>
          </div>

          <button
            type="button"
            className="btn-scada-refresh"
            onClick={handleRefresh}
            disabled={loading || loadingHierarchy}
            title="Refresh assets and statistics"
          >
            <RefreshCw size={13} className={loading || loadingHierarchy ? 'spin-animation' : ''} />
            <span className="d-none d-sm-inline">Refresh</span>
          </button>

          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-1.5 px-3 py-1 fs-12 fw-semibold rounded"
            style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderColor: '#0284c7' }}
            onClick={() => handleOpenCreate(null)}
          >
            <Plus size={15} />
            <span>Add Asset</span>
          </Button>
        </div>
      </div>

      {/* COMPACT SUMMARY / KPI STRIP (Mathematically Real Server Data) */}
      <div className="compact-kpi-strip">
        <div className="compact-kpi-item">
          <div>
            <div className="kpi-lbl">Total</div>
            <div className="fs-5 fw-bold kpi-val-primary lh-1 mt-1">{stats.total}</div>
          </div>
          <Box size={16} className="text-info opacity-75" />
        </div>

        <div className="compact-kpi-item">
          <div>
            <div className="kpi-lbl">Active</div>
            <div className="fs-5 fw-bold text-success lh-1 mt-1">{stats.active}</div>
          </div>
          <CheckCircle2 size={16} className="text-success opacity-75" />
        </div>

        <div className="compact-kpi-item">
          <div>
            <div className="kpi-lbl">Maintenance</div>
            <div className="fs-5 fw-bold text-warning lh-1 mt-1">{stats.maintenance}</div>
          </div>
          <Wrench size={16} className="text-warning opacity-75" />
        </div>

        <div className="compact-kpi-item">
          <div>
            <div className="kpi-lbl">Buildings</div>
            <div className="fs-5 fw-bold text-primary lh-1 mt-1">{stats.buildings}</div>
          </div>
          <Building2 size={16} className="text-primary opacity-75" />
        </div>

        <div className="compact-kpi-item">
          <div>
            <div className="kpi-lbl">Spaces & Rooms</div>
            <div className="fs-5 fw-bold text-info lh-1 mt-1">{stats.spaces}</div>
          </div>
          <Layers size={16} className="text-info opacity-75" />
        </div>

        <div className="compact-kpi-item">
          <div>
            <div className="kpi-lbl">Equipment</div>
            <div className="fs-5 fw-bold text-danger lh-1 mt-1">{stats.equipment}</div>
          </div>
          <Cpu size={16} className="text-danger opacity-75" />
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR (Mapped to OpenAPI Query Parameters) */}
      <div className="scada-card-surface p-2.5 mb-3">
        <Row className="g-2 align-items-center">
          {/* Server Search Input */}
          <Col xs={12} md={4} lg={4}>
            <InputGroup size="sm">
              <InputGroup.Text className="scada-input-group-addon">
                <Search size={13} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search assets (name, ID, SN, desc)..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="filter-input-scada"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="filter-clear-btn px-2 d-flex align-items-center"
                  aria-label="Clear search input"
                >
                  <X size={12} />
                </button>
              )}
            </InputGroup>
          </Col>

          {/* Site Selector */}
          <Col xs={6} sm={4} md={2}>
            <Form.Select
              size="sm"
              className="filter-input-scada"
              value={selectedSiteFilter}
              onChange={e => handleSiteChange(e.target.value)}
              aria-label="Filter by site"
            >
              <option value="ALL">All Sites · {sites.length}</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Asset Type Filter */}
          <Col xs={6} sm={4} md={2}>
            <Form.Select
              size="sm"
              className="filter-input-scada"
              value={selectedTypeFilter}
              onChange={e => handleTypeChange(e.target.value)}
              aria-label="Filter by asset type"
            >
              <option value="ALL">All Asset Types</option>
              {ASSET_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.value}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Status Filter */}
          <Col xs={6} sm={4} md={2}>
            <Form.Select
              size="sm"
              className="filter-input-scada"
              value={selectedStatusFilter}
              onChange={e => handleStatusChange(e.target.value)}
              aria-label="Filter by operational status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </Form.Select>
          </Col>

          {/* Hierarchy Level Filter */}
          <Col xs={6} sm={4} md={1}>
            <Form.Select
              size="sm"
              className="filter-input-scada"
              value={selectedDepthFilter}
              onChange={e => handleDepthChange(e.target.value)}
              aria-label="Filter by depth"
            >
              <option value="ALL">All Depths</option>
              <option value="ROOT">Root (L0)</option>
              <option value="CHILD">Sub (L1+)</option>
            </Form.Select>
          </Col>

          {/* Reset Filters */}
          <Col xs={12} sm={4} md={1} className="text-end">
            {hasActiveFilters && (
              <button
                type="button"
                className="btn-clear-filters w-100 py-1 d-flex align-items-center justify-content-center gap-1"
                onClick={handleClearAllFilters}
                title="Reset all active filters"
              >
                <X size={11} />
                <span>Clear</span>
              </button>
            )}
          </Col>
        </Row>
      </div>

      {/* CONTENT AREA: TABLE OR HIERARCHY */}
      <div className="scada-card-surface overflow-hidden">
        {viewMode === 'table' ? (
          /* ── TABLE VIEW ─────────────────────────────────────────────── */
          <div>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" size="sm" variant="info" />
                <div className="fs-12 asset-header-subtitle mt-2">Querying server asset inventory...</div>
              </div>
            ) : fetchError ? (
              <div className="text-center py-5 px-3">
                <AlertTriangle size={32} className="text-danger mb-2 opacity-75" />
                <h6 className="asset-header-title fw-bold">Unable to load assets</h6>
                <p className="fs-12 asset-header-subtitle mb-3">{fetchError}</p>
                <Button variant="outline-info" size="sm" onClick={fetchTableAssets}>
                  Retry Query
                </Button>
              </div>
            ) : tableAssets.length === 0 ? (
              <div className="text-center py-5 px-3">
                <Box size={36} className="text-slate-500 mb-2 opacity-40" />
                {hasActiveFilters ? (
                  <>
                    <h6 className="asset-header-title fw-bold">No assets match current filters</h6>
                    <p className="fs-12 asset-header-subtitle mb-3">Try adjusting your search criteria or clearing active filters.</p>
                    <Button variant="outline-info" size="sm" onClick={handleClearAllFilters}>
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <h6 className="asset-header-title fw-bold">No assets registered yet</h6>
                    <p className="fs-12 asset-header-subtitle mb-3">Begin by registering your first physical building or facility asset.</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenCreate(null)}
                      style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderColor: '#0284c7' }}
                    >
                      + Add Asset
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom mb-0">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 200 }}>Asset / Equipment</th>
                      <th style={{ minWidth: 110 }}>Type</th>
                      <th style={{ minWidth: 150 }}>Parent / Path</th>
                      <th style={{ minWidth: 130 }}>Site</th>
                      <th style={{ minWidth: 100 }}>Status</th>
                      <th style={{ minWidth: 100 }}>Updated</th>
                      <th className="text-end" style={{ minWidth: 160 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableAssets.map(a => {
                      const isInactive = a.status === 'INACTIVE' || a.deletedAt;
                      const isMaintenance = a.status === 'MAINTENANCE';
                      const siteObj = sites.find(s => String(s.id) === String(a.siteId));
                      const parentId = a.parentId || a.parentAssetId;
                      const parentObj = parentId ? (tableAssets.find(p => String(p.id) === String(parentId)) || findAssetInTree(hierarchyTree, parentId)) : null;
                      const parentLabel = parentObj ? (parentObj.name || parentObj.serialNumber) : parentId;

                      return (
                        <tr key={a.id}>
                          {/* Asset Name Primary dominant, Asset ID secondary subdued */}
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="tree-icon-container depth-sub">
                                <Sliders size={14} className="text-info" />
                              </div>
                              <div className="min-w-0">
                                <div className="fw-bold asset-primary-name text-truncate" title={a.name}>
                                  {a.name}
                                </div>
                                <div className="asset-sub-id text-truncate">
                                  {a.serialNumber ? `SN: ${a.serialNumber}` : a.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td>
                            <span className={`asset-type-badge ${getTypeBadgeClass(a.assetType)}`}>
                              {a.assetType || 'EQUIPMENT'}
                            </span>
                          </td>

                          {/* Parent */}
                          <td className="asset-meta-text">
                            {parentId ? (
                              <div className="d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: 200 }} title={parentObj ? `${parentObj.name}${parentObj.serialNumber ? ` (${parentObj.serialNumber})` : ''}` : parentId}>
                                <CornerDownRight size={12} className="text-muted flex-shrink-0" />
                                <span className="font-monospace">{parentLabel}</span>
                              </div>
                            ) : (
                              <span className="text-muted fs-11">Root Node</span>
                            )}
                          </td>

                          {/* Site */}
                          <td className="asset-meta-text text-truncate" style={{ maxWidth: 140 }}>
                            {siteObj?.name || `Site #${a.siteId || '7'}`}
                          </td>

                          {/* Status */}
                          <td>
                            <div className="d-flex align-items-center gap-1.5">
                              <span
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  backgroundColor: isInactive ? '#94a3b8' : (isMaintenance ? '#f59e0b' : '#22c55e')
                                }}
                              />
                              <span className="fs-11 fw-semibold asset-meta-text">
                                {a.status || (isInactive ? 'INACTIVE' : 'ACTIVE')}
                              </span>
                            </div>
                          </td>

                          {/* Updated */}
                          <td className="asset-sub-id">
                            {formatDate(a.updatedAt || a.createdAt)}
                          </td>

                          {/* Actions: [Inspect] [Edit] [...] */}
                          <td className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-1.5">
                              <button
                                type="button"
                                className="btn-scada-inspect"
                                onClick={() => handleInspect(a)}
                                title="Inspect asset details"
                              >
                                <Eye size={12} />
                                <span>Inspect</span>
                              </button>

                              <button
                                type="button"
                                className="btn-scada-edit"
                                onClick={() => handleOpenEdit(a)}
                                title="Edit asset"
                              >
                                <Edit3 size={12} />
                                <span>Edit</span>
                              </button>

                              <Dropdown align="end">
                                <Dropdown.Toggle
                                  as="button"
                                  className="btn-scada-more"
                                  aria-label="More actions"
                                >
                                  <MoreVertical size={14} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="dropdown-menu-dark shadow-lg">
                                  <Dropdown.Item onClick={() => handleOpenCreate(a)} className="fs-12 d-flex align-items-center gap-2">
                                    <Plus size={14} className="text-info" />
                                    <span>Add Child Asset</span>
                                  </Dropdown.Item>
                                  <Dropdown.Divider className="border-secondary border-opacity-30" />
                                  <Dropdown.Item onClick={() => handleOpenDelete(a)} className="fs-12 text-danger d-flex align-items-center gap-2">
                                    <Trash2 size={14} />
                                    <span>Delete Asset</span>
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

            {/* ── SERVER-SIDE PAGINATION BAR ───────────────────────────── */}
            <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between p-3 border-top scada-section-bar gap-2">
              <div className="fs-12 asset-header-subtitle">
                Showing {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} assets
              </div>

              <div className="d-flex align-items-center gap-3">
                {/* Page Size Selector */}
                <div className="d-flex align-items-center gap-1.5">
                  <span className="fs-12 asset-header-subtitle">Rows:</span>
                  <Form.Select
                    size="sm"
                    value={pageSize}
                    onChange={e => handlePageSizeChange(e.target.value)}
                    className="filter-input-scada py-0 px-2"
                    style={{ width: 70, height: 28 }}
                    aria-label="Rows per page"
                  >
                    {PAGE_SIZE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Form.Select>
                </div>

                {/* Page Navigation */}
                <Pagination size="sm" className="mb-0">
                  <Pagination.Prev
                    disabled={currentPage <= 1 || loading}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  />
                  {Array.from({ length: Math.min(serverTotalPages, 5) }, (_, i) => {
                    let pageNum = i + 1;
                    if (serverTotalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > serverTotalPages) pageNum = serverTotalPages - (4 - i);
                    }
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  })}
                  <Pagination.Next
                    disabled={currentPage >= serverTotalPages || loading}
                    onClick={() => setCurrentPage(p => Math.min(serverTotalPages, p + 1))}
                  />
                </Pagination>
              </div>
            </div>
          </div>
        ) : (
          /* ── HIERARCHY TREE VIEW ─────────────────────────────────────── */
          <div>
            <div className="d-flex align-items-center justify-content-between p-2.5 px-3 border-bottom scada-section-bar">
              <div className="fs-12 asset-header-subtitle fw-semibold">
                Facility Tree Topology ({hierarchyTree.length} root branches)
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-link p-0 text-info fs-11 text-decoration-none fw-semibold"
                  onClick={expandAllNodes}
                >
                  Expand All
                </button>
                <span className="text-muted fs-11">•</span>
                <button
                  type="button"
                  className="btn btn-link p-0 asset-header-subtitle fs-11 text-decoration-none"
                  onClick={collapseAllNodes}
                >
                  Collapse All
                </button>
              </div>
            </div>

            {loadingHierarchy ? (
              <div className="text-center py-5">
                <Spinner animation="border" size="sm" variant="info" />
                <div className="fs-12 asset-header-subtitle mt-2">Loading facility hierarchy tree...</div>
              </div>
            ) : hierarchyTree.length === 0 ? (
              <div className="text-center py-5 px-3">
                <GitFork size={32} className="text-slate-500 mb-2 opacity-40" />
                <h6 className="asset-header-title fw-bold">No hierarchy tree available</h6>
                <p className="fs-12 asset-header-subtitle mb-0">Select a specific site or register root building assets.</p>
              </div>
            ) : (
              <div className="asset-tree-body">
                {hierarchyTree.map(rootNode => renderTreeNode(rootNode, 0))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DRAWERS & MODALS */}
      <AssetInspectorDrawer
        show={showInspector}
        onHide={() => setShowInspector(false)}
        asset={inspectingAsset}
        allAssets={allPotentialParents}
        sites={sites}
        onEdit={(a) => {
          setShowInspector(false);
          handleOpenEdit(a);
        }}
        onDelete={(a) => {
          setShowInspector(false);
          handleOpenDelete(a);
        }}
      />

      <RegisterAssetModal
        show={showRegisterModal}
        onHide={() => setShowRegisterModal(false)}
        editingAsset={editingAsset}
        assetForm={assetForm}
        setAssetForm={setAssetForm}
        handleSaveAsset={handleSaveAsset}
        sites={sites}
        assets={allPotentialParents}
        submitting={submittingForm}
        error={formError}
      />

      <AssetDeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        asset={deletingAsset}
        childCount={deletingAsset ? allPotentialParents.filter(a => String(a.parentId || a.parentAssetId) === String(deletingAsset.id)).length : 0}
        onConfirm={handleConfirmDelete}
        deleting={submittingForm}
        error={formError}
      />
    </div>
  );
};

export default AssetManagement;
