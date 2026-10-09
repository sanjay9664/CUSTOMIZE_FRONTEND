import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { Search, ChevronDown, Check, User, Shield, Calendar, Download, Plus, Building2, RefreshCw } from 'lucide-react';

/**
 * UserToolbar Component
 * Matches Figma Community design "User Management UI – Social Media Admin Dashboard":
 * - Left: Search Pill, Role Filter Pill, Status Filter Pill, Date/Org Filter Pill
 * - Right: Export Pill Button + Our Additional Action Buttons (+ Add User, Roles, Org)
 *
 * @param {Object} props
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Search term handler
 * @param {string} props.selectedRole - Selected role filter ('ALL' or role name)
 * @param {Function} props.onRoleChange - Role filter handler
 * @param {Array} props.roles - Available roles list
 * @param {string} props.selectedStatus - Selected status filter ('ALL', 'ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING', 'SUSPENDED')
 * @param {Function} props.onStatusChange - Status filter handler
 * @param {string} props.selectedEntity - Selected date/org filter
 * @param {Function} props.onEntityChange - Entity filter handler
 * @param {Array} props.entities - Available entities list
 * @param {Function} props.onExport - Export users handler
 * @param {Function} props.onAddUser - Add new user handler
 * @param {Function} props.onManageRoles - Open roles management
 * @param {Function} props.onManageOrg - Open organisation management
 * @param {Function} [props.onRefresh] - Refresh data handler
 */
export const UserToolbar = ({
  searchTerm = '',
  onSearchChange,
  selectedRole = 'ALL',
  onRoleChange,
  roles = [],
  selectedStatus = 'ALL',
  onStatusChange,
  selectedEntity = 'ALL',
  onEntityChange,
  entities = [],
  onExport,
  onAddUser,
  onManageRoles,
  onManageOrg,
  onRefresh
}) => {
  const currentEntityName = selectedEntity === 'ALL'
    ? 'Date'
    : (entities.find(e => String(e.id) === String(selectedEntity))?.name || 'Date');

  const currentRoleName = selectedRole === 'ALL'
    ? 'Role'
    : (roles.find(r => String(r.id) === String(selectedRole) || String(r.name) === String(selectedRole))?.name || selectedRole);

  const currentStatusName = selectedStatus === 'ALL'
    ? 'Status'
    : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).toLowerCase();

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5 mb-3 user-toolbar-figma">
      {/* ── Left Filter Controls ── */}
      <div className="d-flex flex-wrap align-items-center gap-2">
        {/* 1. Search Pill Input */}
        <div className="position-relative user-toolbar-search-wrap" style={{ width: '220px' }}>
          <div
            className="position-absolute top-50 translate-middle-y ps-3 text-secondary d-flex align-items-center pointer-events-none"
            style={{ zIndex: 2 }}
          >
            <Search size={14} style={{ color: '#94a3b8' }} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search"
            className="form-control ps-5 py-1.5 fs-13 text-white user-toolbar-pill-input"
            aria-label="Search users"
          />
        </div>

        {/* 2. Role Filter Pill Dropdown */}
        <Dropdown>
          <Dropdown.Toggle
            variant="custom"
            id="role-filter-dropdown"
            className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fs-13 user-toolbar-pill-btn"
          >
            <User size={14} className="opacity-75" />
            <span className="text-truncate" style={{ maxWidth: '110px' }}>{currentRoleName}</span>
            <ChevronDown size={13} className="opacity-60 ms-0.5" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-lg border py-1 user-toolbar-menu">
            <Dropdown.Item
              active={selectedRole === 'ALL'}
              onClick={() => onRoleChange && onRoleChange('ALL')}
              className="d-flex align-items-center justify-content-between py-1.5 px-3 fs-13 text-light"
            >
              <span>All Roles</span>
              {selectedRole === 'ALL' && <Check size={13} className="text-primary" />}
            </Dropdown.Item>
            <Dropdown.Divider style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
            {roles.map((r) => (
              <Dropdown.Item
                key={r.id || r.name}
                active={selectedRole === r.id || selectedRole === r.name}
                onClick={() => onRoleChange && onRoleChange(r.id || r.name)}
                className="d-flex align-items-center justify-content-between py-1.5 px-3 fs-13 text-light"
              >
                <span>{r.name || r}</span>
                {(selectedRole === r.id || selectedRole === r.name) && <Check size={13} className="text-primary" />}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        {/* 3. Status Filter Pill Dropdown */}
        <Dropdown>
          <Dropdown.Toggle
            variant="custom"
            id="status-filter-dropdown"
            className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fs-13 user-toolbar-pill-btn"
          >
            <Shield size={14} className="opacity-75" />
            <span className="text-truncate" style={{ maxWidth: '100px' }}>{currentStatusName}</span>
            <ChevronDown size={13} className="opacity-60 ms-0.5" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-lg border py-1 user-toolbar-menu">
            {['ALL', 'ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING', 'SUSPENDED'].map((st) => (
              <Dropdown.Item
                key={st}
                active={selectedStatus === st}
                onClick={() => onStatusChange && onStatusChange(st)}
                className="d-flex align-items-center justify-content-between py-1.5 px-3 fs-13 text-light"
              >
                <span>{st === 'ALL' ? 'All Statuses' : st.charAt(0) + st.slice(1).toLowerCase()}</span>
                {selectedStatus === st && <Check size={13} className="text-primary" />}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        {/* 4. Date / Organization Filter Pill Dropdown */}
        <Dropdown>
          <Dropdown.Toggle
            variant="custom"
            id="date-entity-filter-dropdown"
            className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fs-13 user-toolbar-pill-btn"
          >
            <Calendar size={14} className="opacity-75" />
            <span className="text-truncate" style={{ maxWidth: '120px' }}>{currentEntityName}</span>
            <ChevronDown size={13} className="opacity-60 ms-0.5" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-lg border py-1 user-toolbar-menu">
            <Dropdown.Item
              active={selectedEntity === 'ALL'}
              onClick={() => onEntityChange && onEntityChange('ALL')}
              className="d-flex align-items-center justify-content-between py-1.5 px-3 fs-13 text-light"
            >
              <span>All Dates & Orgs</span>
              {selectedEntity === 'ALL' && <Check size={13} className="text-primary" />}
            </Dropdown.Item>
            {entities.length > 0 && <Dropdown.Divider style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />}
            {entities.map((e) => (
              <Dropdown.Item
                key={e.id}
                active={String(selectedEntity) === String(e.id)}
                onClick={() => onEntityChange && onEntityChange(e.id)}
                className="d-flex align-items-center justify-content-between py-1.5 px-3 fs-13 text-light"
              >
                <span className="text-truncate">{e.name}</span>
                {String(selectedEntity) === String(e.id) && <Check size={13} className="text-primary" />}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* ── Right Action Controls: Export + Additional Action Buttons ── */}
      <div className="d-flex flex-wrap align-items-center gap-2">
        {/* Import / Export Button matching Figma */}
        <button
          type="button"
          onClick={onExport}
          className="btn d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fs-13 fw-medium user-toolbar-pill-btn user-toolbar-export-btn"
          title="Import or Export users data"
        >
          <Download size={14} />
          <span>Import / Export</span>
        </button>

        {/* Our Additional Action: Manage Roles */}
        {onManageRoles && (
          <button
            type="button"
            onClick={onManageRoles}
            className="btn d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fs-13 fw-medium user-toolbar-pill-btn"
            title="Manage Roles and Access Permissions"
          >
            <Shield size={14} className="text-info" />
            <span>Manage Roles</span>
          </button>
        )}

        {/* Our Additional Action: Manage Organisation */}
        {/* {onManageOrg && (
          <button
            type="button"
            onClick={onManageOrg}
            className="btn d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fs-13 fw-medium user-toolbar-pill-btn"
            title="Manage Organisation and Clients"
          >
            <Building2 size={14} className="text-primary" />
            <span>Manage Org</span>
          </button>
        )} */}

        {/* Primary Action Button: + Add User (matching Figma + manage button) */}
        {onAddUser && (
          <button
            type="button"
            onClick={onAddUser}
            className="btn d-inline-flex align-items-center gap-1.5 px-3.5 py-1.5 fs-13 fw-semibold user-toolbar-primary-btn"
            title="Add a new user"
          >
            <Plus size={15} />
            <span> Add User</span>
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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
        }
        .user-toolbar-pill-btn:hover,
        .user-toolbar-pill-btn:focus {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
          color: #ffffff !important;
        }
        .user-toolbar-primary-btn {
          background-color: #1e293b !important;
          border: 1px solid rgba(56, 189, 248, 0.45) !important;
          border-radius: 9999px !important;
          color: #ffffff !important;
          height: 35px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        }
        .user-toolbar-primary-btn:hover {
          background-color: #0284c7 !important;
          border-color: #38bdf8 !important;
          color: #ffffff !important;
        }
        .user-toolbar-menu {
          background-color: #0f172a !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          border-radius: 12px !important;
          min-width: 170px;
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
      `}} />
    </div>
  );
};

export default UserToolbar;
