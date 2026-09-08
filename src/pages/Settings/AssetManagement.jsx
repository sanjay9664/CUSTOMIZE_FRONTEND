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
  // Depth-to-accent color mapping
  const depthAccentColors = {
    0: { accent: '#38bdf8', glow: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.35)' },
    1: { accent: '#c084fc', glow: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
    2: { accent: '#2dd4bf', glow: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.3)' },
    3: { accent: '#fbbf24', glow: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  };

  const getDepthAccent = (d) => depthAccentColors[Math.min(d, 3)];

  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodeIds.has(String(node.id));
    const isInactive = node.status === 'INACTIVE' || node.deletedAt;
    const isMaintenance = node.status === 'MAINTENANCE';
    const siteObj = sites.find(s => String(s.id) === String(node.siteId));
    const childCount = hasChildren ? node.children.length : 0;
    const accent = getDepthAccent(depth);

    const depthIconClass = depth === 0 ? 'depth-0' : depth === 1 ? 'depth-1' : depth === 2 ? 'depth-2' : 'depth-sub';

    return (
      <div key={node.id} className={`tree-node-wrapper ${depth === 0 ? 'tree-root-wrapper' : ''}`}>
        <div
          className={`tree-node-row ${depth > 0 ? 'tree-node-child' : 'tree-node-root'}`}
          style={{
            paddingLeft: `${20 + depth * 36}px`,
            paddingRight: 18,
            paddingTop: depth === 0 ? 14 : 11,
            paddingBottom: depth === 0 ? 14 : 11,
            cursor: hasChildren ? 'pointer' : 'default',
            borderLeft: depth > 0 ? `3px solid ${accent.accent}22` : 'none',
          }}
          onClick={() => {
            if (hasChildren) toggleNodeExpand(String(node.id));
          }}
        >
          <div className="d-flex align-items-center flex-grow-1 min-w-0" style={{ gap: '14px' }}>
            {/* Expand/Collapse chevron */}
            {hasChildren ? (
              <button
                type="button"
                className={`tree-expand-btn d-inline-flex align-items-center justify-content-center flex-shrink-0 ${isExpanded ? 'expanded' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleNodeExpand(String(node.id)); }}
                aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
                style={{
                  borderColor: isExpanded ? accent.border : undefined,
                  background: isExpanded ? accent.glow : undefined,
                  color: isExpanded ? accent.accent : undefined
                }}
              >
                <ChevronRight size={13} className={`tree-chevron-icon ${isExpanded ? 'tree-chevron-rotated' : ''}`} />
              </button>
            ) : (
              <span className="tree-leaf-spacer d-inline-flex align-items-center justify-content-center flex-shrink-0">
                {depth > 0 ? (
                  <CornerDownRight size={11} className="tree-leaf-indicator" />
                ) : (
                  <span className="tree-leaf-dot" />
                )}
              </span>
            )}

            {/* Icon container */}
            <div className={`tree-icon-container ${depthIconClass}`}>
              {depth === 0 ? (
                <Building2 size={17} />
              ) : depth === 1 ? (
                <Layers size={15} />
              ) : depth === 2 ? (
                <MapPin size={14} />
              ) : (
                <Cpu size={13} />
              )}
            </div>

            {/* Name + Badge + sub-id */}
            <div className="min-w-0 tree-node-info">
              <div className="d-flex align-items-center" style={{ gap: '10px' }}>
                <span className="fw-bold asset-primary-name text-truncate" title={node.name} style={{ fontSize: depth === 0 ? '0.88rem' : '0.82rem' }}>
                  {node.name}
                </span>
                <span className={`asset-type-badge ${getTypeBadgeClass(node.assetType)}`}>
                  {node.assetType || 'EQUIPMENT'}
                </span>
                {hasChildren && (
                  <span className="tree-child-count-badge" style={{ borderColor: `${accent.accent}40`, color: accent.accent, background: `${accent.accent}15` }}>
                    {childCount}
                  </span>
                )}
              </div>
              <div className="asset-sub-id text-truncate" style={{ marginTop: 2 }}>
                {node.serialNumber ? `SN: ${node.serialNumber}` : node.id}
              </div>
            </div>
          </div>

          {/* Middle: Site + Status */}
          <div className="d-none d-md-flex align-items-center flex-shrink-0" style={{ gap: '16px', marginRight: 14 }}>
            <span className="tree-site-pill">
              {siteObj?.name || `Site #${node.siteId || '7'}`}
            </span>

            <div className="tree-status-pill" style={{ background: isInactive ? 'rgba(148,163,184,0.1)' : isMaintenance ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', borderColor: isInactive ? 'rgba(148,163,184,0.25)' : isMaintenance ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)' }}>
              <span
                className="tree-status-dot"
                style={{
                  backgroundColor: isInactive ? '#94a3b8' : (isMaintenance ? '#f59e0b' : '#22c55e'),
                  boxShadow: isInactive ? 'none' : `0 0 8px ${isMaintenance ? 'rgba(245,158,11,0.5)' : 'rgba(34,197,94,0.5)'}`
                }}
              />
              <span style={{ color: isInactive ? '#94a3b8' : isMaintenance ? '#fbbf24' : '#4ade80', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.03em' }}>
                {node.status || (isInactive ? 'INACTIVE' : 'ACTIVE')}
              </span>
            </div>
          </div>

          {/* Right: Actions Menu */}
          <div className="d-flex align-items-center flex-shrink-0" style={{ gap: '5px' }} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="btn-scada-inspect" onClick={() => handleInspect(node)}>
              <Eye size={12} />
              <span>Inspect</span>
            </button>

            <button type="button" className="btn-scada-edit" onClick={() => handleOpenEdit(node)}>
              <Edit3 size={12} />
              <span>Edit</span>
            </button>

            <Dropdown align="end" drop="down">
              <Dropdown.Toggle as="button" className="btn-scada-more" aria-label="More actions">
                <MoreVertical size={14} />
              </Dropdown.Toggle>
              <Dropdown.Menu
                className="dropdown-menu-dark shadow-lg"
                style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', minWidth: 180, padding: '6px 0', backdropFilter: 'blur(12px)', background: 'rgba(15,23,42,0.96)' }}
              >
                <Dropdown.Item onClick={() => handleOpenCreate(node)} className="fs-12 d-flex align-items-center gap-2" style={{ padding: '8px 14px' }}>
                  <Plus size={14} className="text-info" />
                  <span>Add Child Asset</span>
                </Dropdown.Item>
                <Dropdown.Divider className="border-secondary border-opacity-30" style={{ margin: '4px 0' }} />
                <Dropdown.Item onClick={() => handleOpenDelete(node)} className="fs-12 text-danger d-flex align-items-center gap-2" style={{ padding: '8px 14px' }}>
                  <Trash2 size={14} />
                  <span>Delete Asset</span>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Nested Children with smooth expand/collapse */}
        {hasChildren && (
          <div
            className="tree-children-block position-relative"
            style={{
              maxHeight: isExpanded ? 'none' : '0px',
              opacity: isExpanded ? 1 : 0,
              overflow: isExpanded ? 'visible' : 'hidden',
              transition: isExpanded ? 'opacity 0.3s ease' : 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            }}
          >
            <div
              className="tree-branch-guide"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 8,
                left: `${20 + depth * 36 + 10}px`,
                width: 0,
                pointerEvents: 'none',
                zIndex: 1,
                borderLeft: `2px dashed ${accent.accent}25`
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
          overflow: visible !important;
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
          background-color: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-right: none !important;
          color: #64748b !important;
          border-radius: 8px 0 0 8px;
        }
        body.light-mode .asset-management-wrapper .scada-input-group-addon {
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-right: none !important;
          color: #64748b !important;
        }
        .asset-management-wrapper .filter-input-scada {
          background-color: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #e2e8f0 !important;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 500;
          padding: 6px 12px;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }
        .asset-management-wrapper .filter-input-scada:hover {
          border-color: rgba(56, 189, 248, 0.25) !important;
          background-color: rgba(15, 23, 42, 0.75) !important;
        }
        body.light-mode .asset-management-wrapper .filter-input-scada {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #0f172a !important;
          backdrop-filter: none;
        }
        body.light-mode .asset-management-wrapper .filter-input-scada:hover {
          border-color: #bae6fd !important;
        }
        .asset-management-wrapper .filter-input-scada:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12) !important;
          background-color: rgba(15, 23, 42, 0.9) !important;
        }
        body.light-mode .asset-management-wrapper .filter-input-scada:focus {
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1) !important;
          background-color: #ffffff !important;
        }
        .asset-management-wrapper .filter-clear-btn {
          background-color: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-left: none !important;
          color: #94a3b8 !important;
          border-radius: 0 8px 8px 0;
          transition: color 0.15s ease;
        }
        .asset-management-wrapper .filter-clear-btn:hover {
          color: #f87171 !important;
        }
        body.light-mode .asset-management-wrapper .filter-clear-btn {
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-left: none !important;
          color: #64748b !important;
        }
        .asset-management-wrapper .btn-clear-filters {
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          background: rgba(239, 68, 68, 0.06);
          font-size: 0.72rem;
          font-weight: 600;
          border-radius: 8px;
          transition: all 0.18s ease;
          padding: 5px 12px;
        }
        .asset-management-wrapper .btn-clear-filters:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.5);
          color: #ef4444;
        }
        body.light-mode .asset-management-wrapper .btn-clear-filters {
          border-color: #fca5a5 !important;
          color: #dc2626 !important;
          background: #fef2f2 !important;
        }
        body.light-mode .asset-management-wrapper .btn-clear-filters:hover {
          background: #fee2e2 !important;
          border-color: #f87171 !important;
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

        /* ── Tree dropdown z-index & positioning fix ── */
        .tree-node-wrapper {
          position: relative;
          z-index: 1;
        }
        .tree-root-wrapper {
          position: relative;
          z-index: 1;
        }
        .tree-root-wrapper:hover,
        .tree-root-wrapper:focus-within,
        .tree-root-wrapper:has(.show) {
          z-index: 50 !important;
        }
        .tree-node-row {
          position: relative;
          z-index: 1;
        }
        .tree-node-row:hover,
        .tree-node-row:focus-within,
        .tree-node-row:has(.show) {
          z-index: 60 !important;
        }
        .tree-node-wrapper .dropdown,
        .tree-node-wrapper .dropdown.show {
          position: relative;
          z-index: 70 !important;
        }
        .tree-node-wrapper .dropdown-menu {
          z-index: 9999 !important;
          margin-top: 4px !important;
        }
        .asset-management-wrapper .table-responsive {
          overflow-x: auto;
          overflow-y: visible !important;
        }
        .asset-management-wrapper .table tbody tr:focus-within,
        .asset-management-wrapper .table tbody tr:has(.show) {
          z-index: 50 !important;
          position: relative;
        }

        /* ── Hierarchy Tree ── Premium Glassmorphism Design ── */
        .asset-tree-body {
          padding: 6px 8px;
          position: relative;
          z-index: 2;
          overflow: visible !important;
        }

        /* Root wrapper - card-like separation */
        .tree-root-wrapper {
          margin: 6px 6px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
          overflow: visible;
          transition: all 0.25s ease;
        }
        .tree-root-wrapper:hover {
          border-color: rgba(56, 189, 248, 0.15);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(56, 189, 248, 0.06);
        }
        body.light-mode .tree-root-wrapper {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          backdrop-filter: none;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
        }
        body.light-mode .tree-root-wrapper:hover {
          border-color: #bae6fd;
          box-shadow: 0 4px 16px rgba(14, 165, 233, 0.06);
        }

        /* Tree node rows */
        .tree-node-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          position: relative;
        }
        .tree-node-row:last-child {
          border-bottom: none;
        }
        body.light-mode .tree-node-row {
          border-bottom-color: #f1f5f9;
        }
        .tree-node-row:hover {
          background: linear-gradient(90deg, rgba(56, 189, 248, 0.04) 0%, rgba(56, 189, 248, 0.01) 100%) !important;
        }
        body.light-mode .tree-node-row:hover {
          background: linear-gradient(90deg, #f0f9ff 0%, #ffffff 100%) !important;
        }

        /* Root node row - slightly bolder */
        .tree-node-root {
          background: transparent;
        }
        .tree-node-child {
          background: rgba(255, 255, 255, 0.008);
        }
        body.light-mode .tree-node-child {
          background: rgba(241, 245, 249, 0.5);
        }

        /* ── Tree Expand Button ── */
        .tree-expand-btn {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: #64748b;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          padding: 0;
        }
        .tree-expand-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 10px rgba(56, 189, 248, 0.15);
        }
        .tree-expand-btn.expanded {
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
        }
        body.light-mode .tree-expand-btn {
          background: #ffffff;
          border-color: #e2e8f0;
          color: #64748b;
        }
        body.light-mode .tree-expand-btn:hover {
          background: #e0f2fe;
          border-color: #0284c7;
          color: #0284c7;
          transform: scale(1.1);
        }

        /* Leaf spacer */
        .tree-leaf-spacer {
          width: 24px;
          height: 24px;
        }

        /* ── Chevron rotation animation ── */
        .tree-chevron-icon {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: rotate(0deg);
        }
        .tree-chevron-icon.tree-chevron-rotated {
          transform: rotate(90deg);
        }

        /* ── Tree leaf indicators ── */
        .tree-leaf-indicator {
          color: #475569;
          opacity: 0.45;
        }
        .tree-leaf-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: linear-gradient(135deg, #38bdf8, #818cf8);
          opacity: 0.6;
        }

        /* ── Tree status dot ── */
        .tree-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: tree-pulse 2.5s ease-in-out infinite;
        }
        @keyframes tree-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* ── Status pill ── */
        .tree-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid;
        }
        body.light-mode .tree-status-pill {
          border-color: #e2e8f0 !important;
          background: #f8fafc !important;
        }
        body.light-mode .tree-status-pill span:last-child {
          color: #334155 !important;
        }

        /* ── Site pill ── */
        .tree-site-pill {
          color: #94a3b8;
          font-size: 0.72rem;
          font-weight: 500;
          padding: 2px 10px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        body.light-mode .tree-site-pill {
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #475569;
        }

        /* ── Child count badge ── */
        .tree-child-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 800;
          border: 1px solid;
          line-height: 1;
          letter-spacing: 0.02em;
        }
        body.light-mode .tree-child-count-badge {
          background: #e0f2fe !important;
          color: #0369a1 !important;
          border-color: #bae6fd !important;
        }

        /* ── Icon containers per depth ── */
        .tree-icon-container {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.22s ease;
        }
        .tree-node-row:hover .tree-icon-container {
          transform: scale(1.05);
        }
        .tree-icon-container.depth-0 {
          background: linear-gradient(145deg, rgba(56, 189, 248, 0.18), rgba(14, 165, 233, 0.06));
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38bdf8;
          box-shadow: 0 3px 12px rgba(56, 189, 248, 0.12), inset 0 1px 1px rgba(255,255,255,0.05);
        }
        body.light-mode .tree-icon-container.depth-0 {
          background: linear-gradient(145deg, #dbeafe, #bae6fd);
          border: 1px solid #7dd3fc;
          color: #0369a1;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
        }
        .tree-icon-container.depth-1 {
          background: linear-gradient(145deg, rgba(168, 85, 247, 0.15), rgba(139, 92, 246, 0.06));
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: #c084fc;
          box-shadow: 0 2px 10px rgba(168, 85, 247, 0.08);
        }
        body.light-mode .tree-icon-container.depth-1 {
          background: linear-gradient(145deg, #f3e8ff, #e9d5ff);
          border: 1px solid #d8b4fe;
          color: #7e22ce;
          box-shadow: 0 2px 8px rgba(168, 85, 247, 0.06);
        }
        .tree-icon-container.depth-2 {
          background: linear-gradient(145deg, rgba(20, 184, 166, 0.15), rgba(13, 148, 136, 0.06));
          border: 1px solid rgba(20, 184, 166, 0.3);
          color: #2dd4bf;
          box-shadow: 0 2px 10px rgba(20, 184, 166, 0.08);
        }
        body.light-mode .tree-icon-container.depth-2 {
          background: linear-gradient(145deg, #ccfbf1, #99f6e4);
          border: 1px solid #5eead4;
          color: #0f766e;
          box-shadow: 0 2px 8px rgba(20, 184, 166, 0.06);
        }
        .tree-icon-container.depth-sub {
          background: linear-gradient(145deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.05));
          border: 1px solid rgba(245, 158, 11, 0.25);
          color: #fbbf24;
          box-shadow: 0 2px 10px rgba(245, 158, 11, 0.06);
        }
        body.light-mode .tree-icon-container.depth-sub {
          background: linear-gradient(145deg, #fef3c7, #fde68a);
          border: 1px solid #fcd34d;
          color: #b45309;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.06);
        }

        /* ── Hierarchy tree header bar ── */
        .tree-topology-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: linear-gradient(90deg, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.4) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
          z-index: 1;
        }
        body.light-mode .tree-topology-header {
          background: linear-gradient(90deg, #f8fafc, #ffffff) !important;
          border-bottom-color: #e2e8f0 !important;
        }
        .tree-topology-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tree-topology-icon {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(168, 85, 247, 0.1));
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #38bdf8;
        }
        body.light-mode .tree-topology-icon {
          background: linear-gradient(135deg, #e0f2fe, #f3e8ff);
          border-color: #bae6fd;
          color: #0369a1;
        }
        .tree-topology-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: 0.01em;
        }
        body.light-mode .tree-topology-label {
          color: #1e293b !important;
        }
        .tree-topology-count {
          font-size: 0.68rem;
          font-weight: 600;
          color: #64748b;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        body.light-mode .tree-topology-count {
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #475569;
        }
        .tree-header-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 6px;
          transition: all 0.18s ease;
          cursor: pointer;
        }
        .tree-header-btn:hover {
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.06);
        }
        .tree-header-btn.btn-expand {
          color: #38bdf8;
          border-color: rgba(56, 189, 248, 0.2);
        }
        .tree-header-btn.btn-expand:hover {
          background: rgba(56, 189, 248, 0.1);
          border-color: rgba(56, 189, 248, 0.35);
        }
        body.light-mode .tree-header-btn {
          background: #ffffff;
          border-color: #e2e8f0;
          color: #64748b;
        }
        body.light-mode .tree-header-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        body.light-mode .tree-header-btn.btn-expand {
          color: #0284c7;
          border-color: #bae6fd;
        }
        body.light-mode .tree-header-btn.btn-expand:hover {
          background: #e0f2fe;
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
        <div className="d-flex align-items-center" style={{ gap: '14px' }}>
          <div
            className="p-2 rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)', color: '#ffffff', width: 40, height: 40 }}
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
            <p className="fs-12 asset-header-subtitle mb-0" style={{ marginTop: 2 }}>
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

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="scada-card-surface mb-3" style={{ padding: '10px 14px', borderRadius: 12 }}>
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
      <div className="scada-card-surface">
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
                            {a.parentId || a.parentAssetId ? (
                              <div className="d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: 200 }}>
                                <CornerDownRight size={12} className="text-muted flex-shrink-0" />
                                <span className="font-monospace">{a.parentId || a.parentAssetId}</span>
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

                              <Dropdown align="end" drop="down">
                                <Dropdown.Toggle
                                  as="button"
                                  className="btn-scada-more"
                                  aria-label="More actions"
                                >
                                  <MoreVertical size={14} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="dropdown-menu-dark shadow-lg" style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', minWidth: 180, padding: '6px 0', backdropFilter: 'blur(12px)', background: 'rgba(15,23,42,0.96)' }}>
                                  <Dropdown.Item onClick={() => handleOpenCreate(a)} className="fs-12 d-flex align-items-center gap-2" style={{ padding: '8px 14px' }}>
                                    <Plus size={14} className="text-info" />
                                    <span>Add Child Asset</span>
                                  </Dropdown.Item>
                                  <Dropdown.Divider className="border-secondary border-opacity-30" style={{ margin: '4px 0' }} />
                                  <Dropdown.Item onClick={() => handleOpenDelete(a)} className="fs-12 text-danger d-flex align-items-center gap-2" style={{ padding: '8px 14px' }}>
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
            <div className="tree-topology-header">
              <div className="tree-topology-title">
                <div className="tree-topology-icon">
                  <GitFork size={14} />
                </div>
                <span className="tree-topology-label">Facility Tree Topology</span>
                <span className="tree-topology-count">{hierarchyTree.length} root branches</span>
              </div>
              <div className="d-flex" style={{ gap: '6px' }}>
                <button
                  type="button"
                  className="tree-header-btn btn-expand"
                  onClick={expandAllNodes}
                >
                  Expand All
                </button>
                <button
                  type="button"
                  className="tree-header-btn"
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
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <GitFork size={24} style={{ color: '#38bdf8', opacity: 0.6 }} />
                </div>
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
