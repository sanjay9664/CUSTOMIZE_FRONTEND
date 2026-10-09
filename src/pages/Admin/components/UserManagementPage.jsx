import React, { useState, useMemo } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { Key, Unlock, Trash2 } from 'lucide-react';
import UserToolbar from './UserToolbar';
import UserTable from './UserTable';
import ImportExportModal from './ImportExportModal';
import PasswordInput from '../../../components/PasswordInput';
import { bmsService } from '../../../services/bmsService';
import { getUserUsername, formatJoinedDate, formatLastActive, getUserStatus } from '../../../utils/userUtils';

/**
 * UserManagementPage Component
 * Directly replicates the layout, hierarchy, and design of:
 * "User Management UI – Social Media Admin Dashboard (Community)"
 * with our additional BMS action buttons:
 * - Top Toolbar: Search Pill, Role Filter Pill, Status Filter Pill, Date/Org Filter Pill
 * - Action Buttons: Export, + Add User, Manage Roles, Manage Org
 * - Solid dark navy table header with crisp white text
 * - Checkbox multi-select
 * - 9 Columns: Checkbox, Full Name ↕, Email ↕, Username ↕, Status ↕, Role ↕, Joined Date ↕, Last Active ↕, Actions ↕
 * - Solid status pill badges (Active green, Inactive gray, Banned/Locked red, Pending navy, Suspended orange)
 * - Rows per page dropdown & circular active page pagination
 * - Working Edit, Lock/Unlock, Delete, Password Reset modals
 *
 * @param {Object} props
 * @param {Array} props.users - Users array from API
 * @param {Array} [props.roles] - Roles catalog
 * @param {Array} [props.entities] - Entities/organizations catalog
 * @param {boolean} [props.loading] - Data loading state
 * @param {Function} [props.onRefresh] - Refresh data handler
 * @param {Function} [props.onAddUser] - Add user handler
 * @param {Function} [props.onEditUser] - Edit user handler
 * @param {Function} [props.onViewUser] - View user handler
 * @param {Function} [props.onManageRoles] - Manage roles handler
 * @param {Function} [props.onManageOrg] - Manage organisation handler
 */
export const UserManagementPage = ({
  users = [],
  roles = [],
  entities = [],
  loading = false,
  onRefresh,
  onAddUser,
  onEditUser,
  onViewUser,
  onManageRoles,
  onManageOrg
}) => {
  // ── Toolbar Filter State ──
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

  // ── Multi-select Checkbox State ──
  const [selectedIds, setSelectedIds] = useState([]);

  // ── Sorting & Pagination State ──
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Security Modals State ──
  const [securityModalUser, setSecurityModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // 1. Role Filter
  const roleFilteredUsers = useMemo(() => {
    if (selectedRole === 'ALL') return users;
    return users.filter((u) => {
      const uRole = String(u.role || '').toUpperCase();
      const uRoleId = String(u.roleId || '');
      const filterStr = String(selectedRole).toUpperCase();
      return uRole === filterStr || uRoleId === String(selectedRole) || uRole.includes(filterStr);
    });
  }, [users, selectedRole]);

  // 2. Status Filter
  const statusFilteredUsers = useMemo(() => {
    if (selectedStatus === 'ALL') return roleFilteredUsers;
    return roleFilteredUsers.filter((u) => {
      const st = getUserStatus(u).toUpperCase();
      return st === selectedStatus.toUpperCase();
    });
  }, [roleFilteredUsers, selectedStatus]);

  // 3. Entity / Organization / Date Filter
  const entityFilteredUsers = useMemo(() => {
    if (selectedEntity === 'ALL') return statusFilteredUsers;
    return statusFilteredUsers.filter((u) => {
      return (
        String(u.tenantId) === String(selectedEntity) ||
        String(u.companyId) === String(selectedEntity) ||
        String(u.organizationId) === String(selectedEntity)
      );
    });
  }, [statusFilteredUsers, selectedEntity]);

  // 4. Search Filter (matches Name, Email, Username, Role)
  const searchedUsers = useMemo(() => {
    if (!searchTerm.trim()) return entityFilteredUsers;
    const term = searchTerm.toLowerCase().trim();
    return entityFilteredUsers.filter((u) => {
      const name = String(u.name || u.user_name || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const username = getUserUsername(u).toLowerCase();
      const role = String(u.role || '').toLowerCase();
      return (
        name.includes(term) ||
        email.includes(term) ||
        username.includes(term) ||
        role.includes(term)
      );
    });
  }, [entityFilteredUsers, searchTerm]);

  // 5. Sorting
  const sortedUsers = useMemo(() => {
    return [...searchedUsers].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'username') {
        aVal = getUserUsername(a);
        bVal = getUserUsername(b);
      } else if (sortField === 'status') {
        aVal = getUserStatus(a);
        bVal = getUserStatus(b);
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [searchedUsers, sortField, sortAsc]);

  // 6. Pagination
  const totalUsersCount = sortedUsers.length;
  const totalPages = Math.ceil(totalUsersCount / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  // Reset pagination on filter changes
  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setCurrentPage(1);
  };
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };
  const handleEntityChange = (entityId) => {
    setSelectedEntity(entityId);
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
  const handleToggleSelect = (userId, isSelected) => {
    setSelectedIds((prev) =>
      isSelected ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };

  const handleToggleSelectAll = (isAll) => {
    if (isAll) {
      const pageIds = paginatedUsers.map((u) => u.id || u._id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedUsers.map((u) => u.id || u._id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  // ── Export CSV Handler ──
  const handleExportCSV = () => {
    const exportData = (selectedIds.length > 0
      ? sortedUsers.filter((u) => selectedIds.includes(u.id || u._id))
      : sortedUsers
    ).map((u) => ({
      'Full Name': u.name || u.user_name || 'Unnamed',
      'Email': u.email || '',
      'Username': getUserUsername(u),
      'Status': getUserStatus(u),
      'Role': u.role || 'User',
      'Joined Date': formatJoinedDate(u.createdAt || u.created_at),
      'Last Active': formatLastActive(u.lastLogin || u.updatedAt, u)
    }));

    if (exportData.length === 0) return;

    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData
      .map((row) => Object.values(row).map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + '\n' + rows);

    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `users-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Delete User Handler ──
  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await bmsService.deleteUser(deleteModalUser.id);
      setDeleteModalUser(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err?.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Change Password Handler ──
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!securityModalUser || !newPassword) return;
    try {
      setIsChangingPassword(true);
      setActionError(null);
      await bmsService.adminChangePassword(securityModalUser.id, { password: newPassword });
      setActionSuccess('Password updated successfully.');
      setTimeout(() => {
        setSecurityModalUser(null);
        setNewPassword('');
        setActionSuccess(null);
      }, 1400);
    } catch (err) {
      setActionError(err?.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ── Unlock Account Handler ──
  const handleUnlockUser = async () => {
    if (!securityModalUser) return;
    try {
      setIsUnlocking(true);
      setActionError(null);
      await bmsService.unlockUser(securityModalUser.id);
      setActionSuccess('User account unlocked successfully.');
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setSecurityModalUser(null);
        setActionSuccess(null);
      }, 1400);
    } catch (err) {
      setActionError(err?.message || 'Failed to unlock user.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="user-management-page-container w-100">
      {/* 1. Top Toolbar matching Figma UI with our additional action buttons */}
      <UserToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        selectedRole={selectedRole}
        onRoleChange={handleRoleChange}
        roles={roles}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        selectedEntity={selectedEntity}
        onEntityChange={handleEntityChange}
        entities={entities}
        onExport={() => setShowImportExportModal(true)}
        onAddUser={onAddUser}
        onManageRoles={onManageRoles}
        onManageOrg={onManageOrg}
        onRefresh={onRefresh}
      />

      {/* 2. Main Data Table matching Figma UI */}
      <UserTable
        users={paginatedUsers}
        loading={loading}
        roles={roles}
        sortField={sortField}
        sortAsc={sortAsc}
        onSort={handleSort}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onView={onViewUser}
        onEdit={onEditUser}
        onLock={(user) => {
          setSecurityModalUser(user);
          setNewPassword('');
          setActionError(null);
          setActionSuccess(null);
        }}
        onUnlock={(user) => {
          setSecurityModalUser(user);
          setNewPassword('');
          setActionError(null);
          setActionSuccess(null);
        }}
        onDelete={(user) => {
          setDeleteModalUser(user);
          setActionError(null);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalUsers={totalUsersCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        emptyMessage={
          searchTerm
            ? `No users matching "${searchTerm}".`
            : 'No users found matching current filters.'
        }
      />

      {/* Security Actions Modal (Unlock & Reset Password) */}
      <Modal
        show={Boolean(securityModalUser)}
        onHide={() => !isChangingPassword && !isUnlocking && setSecurityModalUser(null)}
        centered
        contentClassName="bg-dark border border-secondary border-opacity-25 text-light shadow-lg"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary border-opacity-25 pb-3">
          <Modal.Title className="fs-16 fw-semibold text-white d-flex align-items-center gap-2">
            <Key size={18} className="text-primary" />
            <span>Security Actions: {securityModalUser?.name}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          {actionSuccess && (
            <div className="alert alert-success py-2 px-3 fs-13 mb-3 border-0 bg-success bg-opacity-25 text-success">
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="alert alert-danger py-2 px-3 fs-13 mb-3 border-0 bg-danger bg-opacity-25 text-danger">
              {actionError}
            </div>
          )}

          {/* Unlock Option */}
          <div
            className="p-3 rounded-2 mb-3 d-flex align-items-center justify-content-between border"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <div>
              <div className="fw-semibold fs-13 text-white">Unlock Account</div>
              <div className="fs-12 text-muted">Clear lockout and restore active status</div>
            </div>
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleUnlockUser}
              disabled={isUnlocking}
              className="d-flex align-items-center gap-1.5 px-3 py-1 fs-12 fw-medium rounded-pill"
            >
              {isUnlocking ? <Spinner animation="border" size="sm" /> : <Unlock size={14} />}
              <span>Unlock</span>
            </Button>
          </div>

          {/* Change Password Form */}
          <Form onSubmit={handleChangePassword}>
            <Form.Group className="mb-3">
              <Form.Label className="fs-13 fw-semibold text-light">
                Set New Password
              </Form.Label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
                minLength={6}
                className="bg-dark text-white border-secondary border-opacity-50"
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2 pt-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setSecurityModalUser(null)}
                disabled={isChangingPassword}
                className="fs-13 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isChangingPassword || !newPassword || newPassword.length < 6}
                className="fs-13 px-3 fw-medium"
                style={{ backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' }}
              >
                {isChangingPassword ? <Spinner animation="border" size="sm" /> : 'Update Password'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        show={Boolean(deleteModalUser)}
        onHide={() => !isDeleting && setDeleteModalUser(null)}
        centered
        size="sm"
        contentClassName="bg-dark border border-secondary border-opacity-25 text-light shadow-lg"
      >
        <Modal.Header closeButton={!isDeleting} closeVariant="white" className="border-0 pb-0">
          <Modal.Title className="fs-16 fw-semibold text-danger d-flex align-items-center gap-2">
            <Trash2 size={18} />
            <span>Delete User?</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          <p className="fs-13 text-secondary mb-2">
            Are you sure you want to deactivate user:
          </p>
          <div
            className="p-2.5 rounded border fw-medium fs-13 text-white text-truncate mb-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            {deleteModalUser?.name} ({deleteModalUser?.email})
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
            onClick={() => setDeleteModalUser(null)}
            disabled={isDeleting}
            className="fs-13 px-3"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteUser}
            disabled={isDeleting}
            className="fs-13 px-3 fw-medium"
          >
            {isDeleting ? <Spinner animation="border" size="sm" /> : 'Confirm Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── 4. Import & Export Modal ── */}
      <ImportExportModal
        show={showImportExportModal}
        onHide={() => setShowImportExportModal(false)}
        entityType="USERS"
        items={sortedUsers}
        selectedIds={selectedIds}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};

export default UserManagementPage;
