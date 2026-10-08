import React, { useState, useMemo } from 'react';
import { Dropdown, Modal, Button, Form, Spinner, Badge } from 'react-bootstrap';
import {
  Search, Shield, ShieldCheck, Plus, Download, ChevronDown, Check,
  ArrowUpDown, ArrowUp, ArrowDown, Pencil, Copy, Trash2, Users, Eye, KeyRound
} from 'lucide-react';
import { bmsService } from '../../../services/bmsService';
import UserPagination from './UserPagination';
import UserTypeTabs from './UserTypeTabs';

/**
 * Tab definitions for Role Management
 */
const ROLES_TABS_CONFIG = [
  { id: 'ADMIN', label: 'Administrator Roles', singular: 'Administrator Role' },
  { id: 'INSTALLATION', label: 'Installation Roles', singular: 'Installation Role' },
  { id: 'ORGANIZATION', label: 'Organization Roles', singular: 'Organization Role' },
  { id: 'ALL', label: 'All Roles', singular: 'Role' }
];

/**
 * UserRolesView Component
 * Redesigned to match the Figma Community "Social Media Admin Dashboard" visual language:
 * - Dynamic category tabs with computed counts [count]
 * - Figma Toolbar: Search pill, Category filter pill, Role Type pill, Export button, + Add Role button
 * - Dark Navy table header with crisp white text and sortable columns
 * - Multi-select checkboxes
 * - Columns: Checkbox, Role Name ↕, Category ↕, Description ↕, Permissions ↕, Type ↕, Actions ↕
 * - Actions: Edit, Clone / Duplicate, Delete (with immutability check for predefined roles)
 * - Permissions inspector modal
 * - Rows per page & circular page navigation footer
 *
 * @param {Object} props
 * @param {Array} props.roles - Roles catalog from API
 * @param {boolean} [props.loading] - Loading state
 * @param {Function} [props.onRefresh] - Refresh data handler
 * @param {Function} props.onAddRole - Add role handler
 * @param {Function} props.onEditRole - Edit role handler
 * @param {Function} [props.onBackToUsers] - Switch back to users handler
 * @param {Function} [props.onManageOrg] - Navigate to Manage Organisation
 * @param {string} [props.activeTab] - Currently active tab ('ALL' | 'ADMIN' | 'INSTALLATION' | 'ORGANIZATION')
 * @param {Function} [props.setActiveTab] - Active tab change handler
 */
export const UserRolesView = ({
  roles = [],
  loading = false,
  onRefresh,
  onAddRole,
  onEditRole,
  onBackToUsers,
  onManageOrg,
  activeTab = 'ALL',
  setActiveTab
}) => {
  // ── Toolbar & Filter State ──
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'SYSTEM' | 'CUSTOM'

  // ── Multi-select Checkbox State ──
  const [selectedIds, setSelectedIds] = useState([]);

  // ── Sorting & Pagination State ──
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Modals State (Delete, Clone, Permissions Inspector) ──
  const [deleteModalRole, setDeleteModalRole] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [cloneModalRole, setCloneModalRole] = useState(null);
  const [cloneName, setCloneName] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  const [inspectPermissionsRole, setInspectPermissionsRole] = useState(null);

  // 1. Dynamic Counts for Role Tabs
  const tabCounts = useMemo(() => {
    let adminCount = 0;
    let installerCount = 0;
    let orgCount = 0;

    roles.forEach((role) => {
      const name = String(role.name || '').toUpperCase();
      const isCustom = !role.isPredefined;
      if (name.includes('ADMIN') || name.includes('SUPER') || name === 'AREA_MANAGER' || name === 'ZONE_MANAGER') {
        adminCount++;
      } else if (name.includes('INSTALL') || name.includes('OPERATOR') || name.includes('INCHARGE')) {
        installerCount++;
      } else if (isCustom || name.includes('VIEWER') || name.includes('ORGANIS') || name.includes('ORGANIZ') || name === 'MANAGER') {
        orgCount++;
      }
    });

    return {
      ADMIN: adminCount,
      INSTALLATION: installerCount,
      ORGANIZATION: orgCount,
      ALL: roles.length
    };
  }, [roles]);

  // Tabs definition: hide tabs with 0 count to reduce unnecessary clutter, but always keep ALL and activeTab
  const visibleTabs = useMemo(() => {
    const all = ROLES_TABS_CONFIG.map((t) => ({
      ...t,
      count: tabCounts[t.id] ?? 0
    }));
    const filtered = all.filter((t) => t.count > 0 || t.id === 'ALL' || t.id === activeTab);
    return filtered.length > 0 ? filtered : all;
  }, [tabCounts, activeTab]);

  const currentTabObj = useMemo(() => {
    return ROLES_TABS_CONFIG.find((t) => t.id === activeTab) || ROLES_TABS_CONFIG[3];
  }, [activeTab]);

  // Derive role category string
  const getRoleCategory = (role) => {
    const name = String(role?.name || '').toUpperCase();
    if (name.includes('ADMIN') || name.includes('SUPER') || name === 'AREA_MANAGER' || name === 'ZONE_MANAGER') {
      return 'Administrator';
    }
    if (name.includes('INSTALL') || name.includes('OPERATOR') || name.includes('INCHARGE')) {
      return 'Installation';
    }
    return 'Organization';
  };

  // 2. Filter roles by active tab
  const tabFilteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const name = String(role.name || '').toUpperCase();
      const isCustom = !role.isPredefined;

      if (activeTab === 'ADMIN') {
        return name.includes('ADMIN') || name.includes('SUPER') || name === 'AREA_MANAGER' || name === 'ZONE_MANAGER';
      }
      if (activeTab === 'INSTALLATION') {
        return name.includes('INSTALL') || name.includes('OPERATOR') || name.includes('INCHARGE');
      }
      if (activeTab === 'ORGANIZATION') {
        return isCustom || name.includes('VIEWER') || name.includes('ORGANIS') || name.includes('ORGANIZ') || name === 'MANAGER';
      }
      return true; // 'ALL'
    });
  }, [roles, activeTab]);

  // 3. Filter roles by Type (System Predefined vs Custom)
  const typeFilteredRoles = useMemo(() => {
    if (selectedType === 'ALL') return tabFilteredRoles;
    if (selectedType === 'SYSTEM') return tabFilteredRoles.filter((r) => Boolean(r.isPredefined));
    if (selectedType === 'CUSTOM') return tabFilteredRoles.filter((r) => !r.isPredefined);
    return tabFilteredRoles;
  }, [tabFilteredRoles, selectedType]);

  // 4. Filter roles by Search Query
  const searchedRoles = useMemo(() => {
    if (!searchTerm.trim()) return typeFilteredRoles;
    const term = searchTerm.toLowerCase().trim();
    return typeFilteredRoles.filter((r) => {
      const name = String(r.name || '').toLowerCase();
      const desc = String(r.description || '').toLowerCase();
      const category = getRoleCategory(r).toLowerCase();
      return name.includes(term) || desc.includes(term) || category.includes(term);
    });
  }, [typeFilteredRoles, searchTerm]);

  // 5. Sorting
  const sortedRoles = useMemo(() => {
    return [...searchedRoles].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'category') {
        aVal = getRoleCategory(a);
        bVal = getRoleCategory(b);
      } else if (sortField === 'permissions') {
        aVal = Array.isArray(a.permissions) ? a.permissions.length : 0;
        bVal = Array.isArray(b.permissions) ? b.permissions.length : 0;
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [searchedRoles, sortField, sortAsc]);

  // 6. Pagination
  const totalRolesCount = sortedRoles.length;
  const totalPages = Math.ceil(totalRolesCount / pageSize) || 1;
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRoles.slice(start, start + pageSize);
  }, [sortedRoles, currentPage, pageSize]);

  // Reset pagination on filter changes
  const handleTabSelect = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
    setCurrentPage(1);
  };
  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };
  const handleTypeChange = (typeVal) => {
    setSelectedType(typeVal);
    setCurrentPage(1);
  };
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // ── Multi-select Checkbox Handlers ──
  const isAllSelected = paginatedRoles.length > 0 && paginatedRoles.every((r) => selectedIds.includes(r.id));

  const handleToggleSelect = (roleId, isSelected) => {
    setSelectedIds((prev) =>
      isSelected ? [...prev, roleId] : prev.filter((id) => id !== roleId)
    );
  };

  const handleToggleSelectAll = (isAll) => {
    if (isAll) {
      const pageIds = paginatedRoles.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedRoles.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const exportData = (selectedIds.length > 0
      ? sortedRoles.filter((r) => selectedIds.includes(r.id))
      : sortedRoles
    ).map((r) => ({
      'Role Name': r.name || 'Unnamed',
      'Category': getRoleCategory(r),
      'Nature': r.isPredefined ? 'System Predefined' : 'Custom Role',
      'Permissions Count': Array.isArray(r.permissions) ? r.permissions.length : 0,
      'Description': r.description || ''
    }));

    if (exportData.length === 0) return;

    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData
      .map((row) => Object.values(row).map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + '\n' + rows);

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `roles-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Delete Role Handler ──
  const handleDeleteRole = async () => {
    if (!deleteModalRole) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await bmsService.deleteRole(deleteModalRole.id);
      setDeleteModalRole(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err?.message || 'Failed to delete role. It may be assigned to active users.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Clone Role Handler ──
  const handleCloneRole = async (e) => {
    e.preventDefault();
    if (!cloneModalRole || !cloneName.trim()) return;
    try {
      setIsCloning(true);
      setActionError(null);
      await bmsService.cloneRole(cloneModalRole.id, { name: cloneName.trim() });
      setCloneModalRole(null);
      setCloneName('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err?.message || 'Failed to duplicate role.');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="user-roles-view w-100">
      {/* ── 1. Category Tabs with Dynamic Counts [count] ── */}
      <UserTypeTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
      />

      {/* ── 2. Top Toolbar (Figma Pill Style with Action Buttons) ── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5 mb-3 user-toolbar-figma">
        {/* Left Filter Controls */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Search Pill Input */}
          <div className="position-relative user-toolbar-search-wrap" style={{ width: '240px' }}>
            <div
              className="position-absolute top-50 translate-middle-y ps-3 text-secondary d-flex align-items-center pointer-events-none"
              style={{ zIndex: 2 }}
            >
              <Search size={14} style={{ color: '#94a3b8' }} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search roles..."
              className="form-control ps-5 py-1.5 fs-13 text-white user-toolbar-pill-input"
              aria-label="Search roles"
            />
          </div>

          {/* Nature / Type Filter Pill */}
          <Dropdown>
            <Dropdown.Toggle
              variant="custom"
              id="role-type-filter-dropdown"
              className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fs-13 user-toolbar-pill-btn"
            >
              <ShieldCheck size={14} className="opacity-75" />
              <span>
                {selectedType === 'ALL'
                  ? 'Type'
                  : selectedType === 'SYSTEM'
                  ? 'System'
                  : 'Custom'}
              </span>
              <ChevronDown size={13} className="opacity-60 ms-0.5" />
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow-lg border py-1 user-toolbar-menu">
              <Dropdown.Item
                active={selectedType === 'ALL'}
                onClick={() => handleTypeChange('ALL')}
                className="d-flex align-items-center justify-content-between py-1.5 px-3 fs-13 text-light"
              >
                <span>All Types</span>
                {selectedType === 'ALL' && <Check size={13} className="text-primary" />}
              </Dropdown.Item>
              <Dropdown.Item
                active={selectedType === 'SYSTEM'}
                onClick={() => handleTypeChange('SYSTEM')}
                className="d-flex align-items-center justify-content-between py-1.5 px-3 fs-13 text-light"
              >
                <span>System Predefined</span>
                {selectedType === 'SYSTEM' && <Check size={13} className="text-primary" />}
              </Dropdown.Item>
              <Dropdown.Item
                active={selectedType === 'CUSTOM'}
                onClick={() => handleTypeChange('CUSTOM')}
                className="d-flex align-items-center justify-content-between py-1.5 px-3 fs-13 text-light"
              >
                <span>Custom Roles</span>
                {selectedType === 'CUSTOM' && <Check size={13} className="text-primary" />}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Right Action Controls: Export + Additional Action Buttons */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fs-13 fw-medium user-toolbar-pill-btn"
            title="Export roles data as CSV"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          {/* Primary Action Button: + Add Role */}
          {onAddRole && (
            <button
              type="button"
              onClick={() => onAddRole(currentTabObj.singular)}
              className="btn d-inline-flex align-items-center gap-1.5 px-3.5 py-1.5 fs-13 fw-semibold user-toolbar-primary-btn"
              title="Create a new custom role"
            >
              <Plus size={15} />
              <span>Add Role</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Main Roles Data Table (Figma Style) ── */}
      <div className="user-figma-table-card rounded-3 overflow-hidden border">
        <div className="table-responsive mb-0">
          <table className="table hover align-middle mb-0 enterprise-data-table border-0">
            <thead>
              <tr className="border-bottom figma-table-header-row text-white fs-13">
                {/* Checkbox Select All */}
                <th style={{ width: '40px' }} className="ps-3 py-2.5" scope="col">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="form-check-input user-header-checkbox m-0"
                    aria-label="Select all roles"
                  />
                </th>

                {/* Role Name */}
                <th
                  style={{ width: '24%', cursor: 'pointer' }}
                  className="py-2.5 user-select-none"
                  onClick={() => handleSort('name')}
                  scope="col"
                >
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="fw-semibold text-white fs-13">Role Name</span>
                    {sortField === 'name' ? (
                      sortAsc ? <ArrowUp size={12} className="text-info" /> : <ArrowDown size={12} className="text-info" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40" />
                    )}
                  </div>
                </th>

                {/* Category */}
                <th
                  style={{ width: '16%', cursor: 'pointer' }}
                  className="py-2.5 user-select-none"
                  onClick={() => handleSort('category')}
                  scope="col"
                >
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="fw-semibold text-white fs-13">Category</span>
                    {sortField === 'category' ? (
                      sortAsc ? <ArrowUp size={12} className="text-info" /> : <ArrowDown size={12} className="text-info" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40" />
                    )}
                  </div>
                </th>

                {/* Description */}
                <th
                  style={{ width: '30%', cursor: 'pointer' }}
                  className="py-2.5 user-select-none"
                  onClick={() => handleSort('description')}
                  scope="col"
                >
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="fw-semibold text-white fs-13">Description</span>
                    {sortField === 'description' ? (
                      sortAsc ? <ArrowUp size={12} className="text-info" /> : <ArrowDown size={12} className="text-info" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40" />
                    )}
                  </div>
                </th>

                {/* Permissions Count */}
                <th
                  style={{ width: '12%', cursor: 'pointer' }}
                  className="py-2.5 user-select-none"
                  onClick={() => handleSort('permissions')}
                  scope="col"
                >
                  <div className="d-flex align-items-center gap-1.5">
                    <span className="fw-semibold text-white fs-13">Permissions</span>
                    {sortField === 'permissions' ? (
                      sortAsc ? <ArrowUp size={12} className="text-info" /> : <ArrowDown size={12} className="text-info" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-40" />
                    )}
                  </div>
                </th>

                {/* Nature / Type */}
                <th style={{ width: '10%' }} className="py-2.5 user-select-none" scope="col">
                  <span className="fw-semibold text-white fs-13">Nature</span>
                </th>

                {/* Actions */}
                <th style={{ width: '8%' }} className="py-2.5 pe-3 text-end user-select-none" scope="col">
                  <span className="fw-semibold text-white fs-13">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="d-flex flex-column align-items-center justify-content-center py-4">
                      <Spinner animation="border" size="sm" variant="primary" className="mb-2" />
                      <span className="fs-13 text-secondary">Loading access roles...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRoles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="d-flex flex-column align-items-center justify-content-center py-4 text-secondary">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                        style={{ width: '44px', height: '44px', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                      >
                        <Shield size={20} className="text-muted" />
                      </div>
                      <span className="fs-14 fw-medium text-light mb-1">
                        {searchTerm ? `No roles matching "${searchTerm}".` : `No roles found.`}
                      </span>
                      <span className="fs-12 text-muted">Try adjusting search filters or adding a new role.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRoles.map((role) => {
                  const isSystem = Boolean(role.isPredefined);
                  const isSelected = selectedIds.includes(role.id);
                  const category = getRoleCategory(role);
                  const permCount = Array.isArray(role.permissions) ? role.permissions.length : 0;

                  return (
                    <tr
                      key={role.id || role.name}
                      className={`user-figma-table-row align-middle border-bottom ${isSelected ? 'selected-row' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="ps-3 py-2.5" style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(role.id, e.target.checked)}
                          className="form-check-input user-row-checkbox m-0"
                          aria-label={`Select ${role.name}`}
                        />
                      </td>

                      {/* Role Name */}
                      <td className="py-2.5">
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: isSystem ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: isSystem ? '#38bdf8' : '#34d399',
                              border: isSystem ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                            }}
                          >
                            {isSystem ? <ShieldCheck size={15} /> : <Shield size={15} />}
                          </div>
                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none text-start fw-semibold text-white fs-13 user-name-link text-truncate"
                            style={{ maxWidth: '220px' }}
                            onClick={() => onEditRole(role)}
                            title={isSystem ? `${role.name} (System Defined)` : role.name}
                          >
                            {role.name}
                          </button>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-2.5">
                        <span className="fs-13" style={{ color: '#cbd5e1' }}>
                          {category}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-2.5">
                        <span
                          className="fs-13 text-truncate d-inline-block"
                          style={{ maxWidth: '320px', color: '#94a3b8' }}
                          title={role.description || 'No description provided'}
                        >
                          {role.description || '—'}
                        </span>
                      </td>

                      {/* Permissions Badge */}
                      <td className="py-2.5">
                        <button
                          type="button"
                          className="btn btn-sm p-0 border-0 bg-transparent"
                          onClick={() => setInspectPermissionsRole(role)}
                          title="Inspect role permissions"
                        >
                          <span
                            className="d-inline-flex align-items-center gap-1 px-2.5 py-0.5 rounded-pill fs-11 fw-medium"
                            style={{
                              backgroundColor: permCount > 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                              color: permCount > 0 ? '#38bdf8' : '#94a3b8',
                              border: permCount > 0 ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)',
                              cursor: 'pointer'
                            }}
                          >
                            <KeyRound size={11} />
                            <span>{permCount} Perms</span>
                          </span>
                        </button>
                      </td>

                      {/* Type (Solid Figma Pill Badge) */}
                      <td className="py-2.5">
                        {isSystem ? (
                          <span
                            className="d-inline-flex align-items-center justify-content-center px-2.5 py-0.5 rounded-pill fw-semibold user-select-none"
                            style={{
                              backgroundColor: '#1e293b',
                              color: '#f8fafc',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              fontSize: '11px',
                              minWidth: '58px'
                            }}
                          >
                            System
                          </span>
                        ) : (
                          <span
                            className="d-inline-flex align-items-center justify-content-center px-2.5 py-0.5 rounded-pill fw-semibold user-select-none"
                            style={{
                              backgroundColor: 'rgba(34, 197, 94, 0.15)',
                              color: '#4ade80',
                              border: '1px solid rgba(34, 197, 94, 0.4)',
                              fontSize: '11px',
                              minWidth: '58px'
                            }}
                          >
                            Custom
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pe-3 text-end">
                        <div className="d-inline-flex align-items-center gap-1.5">
                          {/* Edit / Inspect */}
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-1 user-action-icon-btn"
                            onClick={() => onEditRole(role)}
                            title={isSystem ? 'View Role Details' : 'Edit Role'}
                            aria-label={`Edit ${role.name}`}
                          >
                            <Pencil size={15} style={{ color: '#cbd5e1' }} />
                          </button>

                          {/* Clone Role Button */}
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-1 user-action-icon-btn"
                            onClick={() => {
                              setCloneModalRole(role);
                              setCloneName(`Copy of ${role.name}`);
                              setActionError(null);
                            }}
                            title="Clone / Duplicate Role"
                            aria-label={`Clone ${role.name}`}
                          >
                            <Copy size={15} style={{ color: '#cbd5e1' }} />
                          </button>

                          {/* Delete Button (Disabled for predefined roles) */}
                          {isSystem ? (
                            <span
                              className="p-1 opacity-25 d-inline-block"
                              title="System predefined roles cannot be deleted"
                              style={{ cursor: 'not-allowed' }}
                            >
                              <Trash2 size={15} style={{ color: '#64748b' }} />
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-1 text-danger user-action-icon-btn delete-icon-btn"
                              onClick={() => {
                                setDeleteModalRole(role);
                                setActionError(null);
                              }}
                              title="Delete Role"
                              aria-label={`Delete ${role.name}`}
                            >
                              <Trash2 size={15} style={{ color: '#f87171' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 4. Pagination Footer matching Figma ── */}
        <UserPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalRolesCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* ── 5. Clone Role Modal ── */}
      <Modal
        show={Boolean(cloneModalRole)}
        onHide={() => !isCloning && setCloneModalRole(null)}
        centered
        contentClassName="bg-dark border border-secondary border-opacity-25 text-light shadow-lg"
      >
        <Modal.Header closeButton={!isCloning} closeVariant="white" className="border-secondary border-opacity-25 pb-3">
          <Modal.Title className="fs-16 fw-semibold text-white d-flex align-items-center gap-2">
            <Copy size={18} className="text-primary" />
            <span>Duplicate Role: {cloneModalRole?.name}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          {actionError && (
            <div className="alert alert-danger py-2 px-3 fs-13 mb-3 border-0 bg-danger bg-opacity-25 text-danger">
              {actionError}
            </div>
          )}
          <Form onSubmit={handleCloneRole}>
            <Form.Group className="mb-3">
              <Form.Label className="fs-13 fw-semibold text-light">
                New Role Name
              </Form.Label>
              <Form.Control
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="Enter role name"
                required
                className="bg-dark text-white border-secondary border-opacity-50"
              />
              <Form.Text className="text-muted fs-12">
                This will create a new custom role with the exact permissions of {cloneModalRole?.name}.
              </Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 pt-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setCloneModalRole(null)}
                disabled={isCloning}
                className="fs-13 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isCloning || !cloneName.trim()}
                className="fs-13 px-3 fw-medium"
                style={{ backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' }}
              >
                {isCloning ? <Spinner animation="border" size="sm" /> : 'Clone Role'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ── 6. Permissions Inspector Modal ── */}
      <Modal
        show={Boolean(inspectPermissionsRole)}
        onHide={() => setInspectPermissionsRole(null)}
        centered
        size="lg"
        contentClassName="bg-dark border border-secondary border-opacity-25 text-light shadow-lg"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary border-opacity-25 pb-3">
          <Modal.Title className="fs-16 fw-semibold text-white d-flex align-items-center gap-2">
            <KeyRound size={18} className="text-info" />
            <span>Permissions: {inspectPermissionsRole?.name}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          <div className="mb-3 fs-13 text-secondary">
            Role Type: <strong className="text-white">{getRoleCategory(inspectPermissionsRole)}</strong> (
            {inspectPermissionsRole?.isPredefined ? 'System Defined' : 'Custom'})
          </div>
          {Array.isArray(inspectPermissionsRole?.permissions) && inspectPermissionsRole.permissions.length > 0 ? (
            <div className="d-flex flex-wrap gap-2" style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {inspectPermissionsRole.permissions.map((p, idx) => {
                const code = typeof p === 'string' ? p : p.code || p.name;
                return (
                  <Badge
                    key={idx}
                    bg="dark"
                    className="border border-secondary border-opacity-50 py-1.5 px-2.5 fs-12 fw-normal text-light"
                  >
                    {code}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <div className="text-muted fs-13 py-3 text-center">
              No individual permissions assigned to this role.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25 pt-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setInspectPermissionsRole(null)}
            className="fs-13 px-3"
          >
            Close
          </Button>
          {!inspectPermissionsRole?.isPredefined && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const target = inspectPermissionsRole;
                setInspectPermissionsRole(null);
                onEditRole(target);
              }}
              className="fs-13 px-3"
            >
              Edit Permissions
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* ── 7. Delete Role Confirmation Modal ── */}
      <Modal
        show={Boolean(deleteModalRole)}
        onHide={() => !isDeleting && setDeleteModalRole(null)}
        centered
        size="sm"
        contentClassName="bg-dark border border-secondary border-opacity-25 text-light shadow-lg"
      >
        <Modal.Header closeButton={!isDeleting} closeVariant="white" className="border-0 pb-0">
          <Modal.Title className="fs-16 fw-semibold text-danger d-flex align-items-center gap-2">
            <Trash2 size={18} />
            <span>Delete Role?</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          <p className="fs-13 text-secondary mb-2">
            Are you sure you want to delete this custom role:
          </p>
          <div
            className="p-2.5 rounded border fw-medium fs-13 text-white text-truncate mb-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            {deleteModalRole?.name}
          </div>
          {actionError && (
            <div className="alert alert-danger py-2 px-3 fs-12 mb-0 border-0 bg-danger bg-opacity-25 text-danger">
              {actionError}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setDeleteModalRole(null)}
            disabled={isDeleting}
            className="fs-13 px-3"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteRole}
            disabled={isDeleting}
            className="fs-13 px-3 fw-medium"
          >
            {isDeleting ? <Spinner animation="border" size="sm" /> : 'Confirm Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── 8. Scoped Visual Styling (Toolbar, Table, Buttons, Contrast) ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .user-roles-view {
          color: #f8fafc;
        }

        /* Toolbar Controls */
        .user-toolbar-pill-input {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-radius: 9999px !important;
          height: 35px;
          color: #ffffff !important;
          box-shadow: none !important;
          transition: all 0.15s ease;
        }
        .user-toolbar-pill-input:focus {
          background-color: rgba(255, 255, 255, 0.09) !important;
          border-color: #38bdf8 !important;
          color: #ffffff !important;
        }
        .user-toolbar-pill-btn {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-radius: 9999px !important;
          color: #ffffff !important;
          height: 35px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
        }
        .user-toolbar-pill-btn:hover,
        .user-toolbar-pill-btn:focus {
          background-color: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
          color: #ffffff !important;
        }
        .user-toolbar-primary-btn {
          background-color: #0284c7 !important;
          border: 1px solid #38bdf8 !important;
          border-radius: 9999px !important;
          color: #ffffff !important;
          height: 35px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
          display: inline-flex !important;
          align-items: center !important;
        }
        .user-toolbar-primary-btn:hover {
          background-color: #0369a1 !important;
          border-color: #7dd3fc !important;
          color: #ffffff !important;
        }
        .user-toolbar-menu {
          background-color: #0f172a !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 12px !important;
          min-width: 170px;
        }
        .user-toolbar-menu .dropdown-item {
          color: #cbd5e1 !important;
        }
        .user-toolbar-menu .dropdown-item:hover,
        .user-toolbar-menu .dropdown-item:focus {
          background-color: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }

        /* Table Card & Row Styling */
        .user-figma-table-card {
          background-color: #081024 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .figma-table-header-row {
          background-color: #0f1c3f !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
        }
        .figma-table-header-row th {
          background-color: transparent !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        .user-figma-table-row {
          transition: background-color 0.15s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .user-figma-table-row:hover {
          background-color: rgba(255, 255, 255, 0.04) !important;
        }
        .user-figma-table-row.selected-row {
          background-color: rgba(14, 165, 233, 0.08) !important;
        }
        .user-row-checkbox,
        .user-header-checkbox {
          cursor: pointer;
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
        }
        .user-row-checkbox:checked,
        .user-header-checkbox:checked {
          background-color: #0284c7;
          border-color: #0284c7;
        }
        .user-name-link {
          color: #ffffff !important;
          transition: color 0.15s ease;
        }
        .user-name-link:hover {
          color: #38bdf8 !important;
        }
        .user-action-icon-btn {
          border-radius: 6px;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #cbd5e1 !important;
        }
        .user-action-icon-btn:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }
        .user-action-icon-btn.delete-icon-btn {
          color: #f87171 !important;
        }
        .user-action-icon-btn.delete-icon-btn:hover {
          background-color: rgba(239, 68, 68, 0.18) !important;
          color: #ef4444 !important;
        }

        /* Light mode overrides */
        body.light-mode .user-toolbar-pill-input {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .user-toolbar-pill-btn {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .user-toolbar-pill-btn:hover {
          background-color: #f1f5f9 !important;
          border-color: #94a3b8 !important;
        }
        body.light-mode .user-toolbar-primary-btn {
          background-color: #0f172a !important;
          color: #ffffff !important;
          border-color: #0f172a !important;
        }
        body.light-mode .user-toolbar-primary-btn:hover {
          background-color: #0284c7 !important;
          border-color: #0284c7 !important;
        }
        body.light-mode .user-toolbar-menu {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .user-toolbar-menu .dropdown-item {
          color: #0f172a !important;
        }
        body.light-mode .user-figma-table-card {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .figma-table-header-row {
          background-color: #0f172a !important;
        }
        body.light-mode .figma-table-header-row th {
          color: #ffffff !important;
        }
        body.light-mode .user-figma-table-row {
          border-bottom-color: #f1f5f9 !important;
        }
        body.light-mode .user-figma-table-row:hover {
          background-color: #f8fafc !important;
        }
        body.light-mode .user-name-link {
          color: #0f172a !important;
        }
      `}} />
    </div>
  );
};

export default UserRolesView;
