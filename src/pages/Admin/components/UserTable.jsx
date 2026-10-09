import React from 'react';
import { Table, Spinner } from 'react-bootstrap';
import { ArrowUpDown, ArrowUp, ArrowDown, Users } from 'lucide-react';
import UserTableRow from './UserTableRow';
import UserPagination from './UserPagination';

/**
 * UserTable Component
 * Matches Figma Community design "User Management UI – Social Media Admin Dashboard":
 * - Dark Navy table header with crisp white column labels and sort icons
 * - Multi-select checkbox column
 * - Columns: Checkbox, Full Name ↕, Email ↕, Username ↕, Status ↕, Role ↕, Joined Date ↕, Last Active ↕, Actions ↕
 * - Dense, clean row styling with avatars, solid status pills, and action icons
 * - Footer with rows per page dropdown & Figma-style pagination
 *
 * @param {Object} props
 * @param {Array} props.users - List of users for current page
 * @param {boolean} [props.loading] - Loading state
 * @param {Array} [props.roles] - Global roles catalog
 * @param {string} [props.sortField] - Current sort column
 * @param {boolean} [props.sortAsc] - Sort direction
 * @param {Function} [props.onSort] - Sort column toggle callback
 * @param {Array} [props.selectedIds] - Selected user IDs array
 * @param {Function} [props.onToggleSelect] - Toggle single row selection
 * @param {Function} [props.onToggleSelectAll] - Toggle all rows selection
 * @param {Function} [props.onView] - View user handler
 * @param {Function} [props.onEdit] - Edit user handler
 * @param {Function} [props.onLock] - Lock user handler
 * @param {Function} [props.onUnlock] - Unlock user handler
 * @param {Function} [props.onDelete] - Delete user handler
 * @param {number} [props.currentPage] - Current pagination page
 * @param {number} [props.totalPages] - Total pages
 * @param {number} [props.totalUsers] - Total user count
 * @param {number} [props.pageSize] - Page size
 * @param {Function} [props.onPageChange] - Page change callback
 * @param {Function} [props.onPageSizeChange] - Page size change callback
 * @param {string} [props.emptyMessage] - Empty state message
 */
export const UserTable = ({
  users = [],
  loading = false,
  roles = [],
  sortField = 'name',
  sortAsc = true,
  onSort,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onLock,
  onUnlock,
  onDelete,
  currentPage = 1,
  totalPages = 1,
  totalUsers = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  emptyMessage = 'No users found.'
}) => {
  const isAllSelected = users.length > 0 && users.every(u => selectedIds.includes(u.id || u._id));

  const renderSortHeader = (label, field, width = 'auto') => {
    const isSorted = sortField === field;
    return (
      <th
        style={{ width, cursor: onSort ? 'pointer' : 'default' }}
        className="py-2.5 user-select-none"
        onClick={() => onSort && onSort(field)}
        scope="col"
      >
        <div className="d-flex align-items-center gap-1.5">
          <span className="fw-semibold text-white fs-13">{label}</span>
          {onSort && (
            isSorted ? (
              sortAsc ? <ArrowUp size={12} className="text-info" /> : <ArrowDown size={12} className="text-info" />
            ) : (
              <ArrowUpDown size={11} className="opacity-40" />
            )
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="user-figma-table-card rounded-3 overflow-hidden border">
      <div className="table-responsive mb-0">
        <Table hover className="align-middle mb-0 enterprise-data-table border-0">
          <thead>
            <tr className="border-bottom figma-table-header-row text-white fs-13">
              {/* 1. Checkbox Select All */}
              <th style={{ width: '40px' }} className="ps-3 py-2.5" scope="col">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onToggleSelectAll && onToggleSelectAll(e.target.checked)}
                  className="form-check-input user-header-checkbox m-0"
                  aria-label="Select all users"
                />
              </th>

              {/* 2. Columns matching Figma */}
              {renderSortHeader('Full Name', 'name', '18%')}
              {renderSortHeader('Email', 'email', '18%')}
              {renderSortHeader('Username', 'username', '12%')}
              {renderSortHeader('Status', 'status', '10%')}
              {renderSortHeader('Role', 'role', '12%')}
              {renderSortHeader('Joined Date', 'createdAt', '12%')}
              {renderSortHeader('Last Active', 'updatedAt', '10%')}

              {/* Actions Header */}
              <th style={{ width: '8%' }} className="py-2.5 pe-3 text-end user-select-none" scope="col">
                <span className="fw-semibold text-white fs-13">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-5">
                  <div className="d-flex flex-column align-items-center justify-content-center py-4">
                    <Spinner animation="border" size="sm" variant="primary" className="mb-2" />
                    <span className="fs-13 text-secondary">Loading system users...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-5">
                  <div className="d-flex flex-column align-items-center justify-content-center py-4 text-secondary">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                      style={{ width: '44px', height: '44px', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                    >
                      <Users size={20} className="text-muted" />
                    </div>
                    <span className="fs-14 fw-medium text-light mb-1">{emptyMessage}</span>
                    <span className="fs-12 text-muted">Try adjusting search or status filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const uId = user.id || user._id;
                return (
                  <UserTableRow
                    key={uId || user.email}
                    user={user}
                    roles={roles}
                    isSelected={selectedIds.includes(uId)}
                    onToggleSelect={onToggleSelect}
                    onView={onView}
                    onEdit={onEdit}
                    onLock={onLock}
                    onUnlock={onUnlock}
                    onDelete={onDelete}
                  />
                );
              })
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination Footer matching Figma */}
      <UserPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalUsers={totalUsers}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .user-figma-table-card {
          background-color: #0c1429 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .figma-table-header-row {
          background-color: #0f1c3f !important;
          border-bottom-color: rgba(255, 255, 255, 0.12) !important;
        }
        .figma-table-header-row th {
          background-color: transparent !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        .user-figma-table-row {
          transition: background-color 0.15s ease;
          border-bottom-color: rgba(255, 255, 255, 0.05) !important;
        }
        .user-figma-table-row:hover {
          background-color: rgba(255, 255, 255, 0.03) !important;
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
        .user-action-icon-btn {
          border-radius: 6px;
          transition: all 0.15s ease;
        }
        .user-action-icon-btn:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
        .user-action-icon-btn.delete-icon-btn:hover {
          background-color: rgba(239, 68, 68, 0.15) !important;
        }

        /* Light mode overrides */
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
        body.light-mode .user-figma-table-row.selected-row {
          background-color: #f0f9ff !important;
        }
        body.light-mode .user-name-link {
          color: #0f172a !important;
        }
        body.light-mode .user-email-text,
        body.light-mode .user-role-text,
        body.light-mode .user-date-text,
        body.light-mode .user-active-text {
          color: #64748b !important;
        }
        body.light-mode .user-handle-text {
          color: #334155 !important;
        }
        body.light-mode .user-row-checkbox,
        body.light-mode .user-header-checkbox {
          border-color: #94a3b8;
        }
      `}} />
    </div>
  );
};

export default UserTable;
