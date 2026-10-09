import React from 'react';
import UserManagementPage from './UserManagementPage';

/**
 * SystemUsersView Component
 * Reusable view wrapper for UserManagementPage.
 * Preserves existing component interface while adopting the new modular, prop-driven architecture.
 *
 * @param {Object} props
 * @param {Array} props.users - List of users
 * @param {boolean} [props.loading] - Loading indicator
 * @param {Function} [props.onRefresh] - Refresh users callback
 * @param {Function} [props.onAddUser] - Add user callback
 * @param {Function} [props.onEditUser] - Edit user callback
 * @param {Function} [props.onViewUser] - View user callback
 * @param {Function} [props.onManageRoles] - Manage roles callback
 * @param {Function} [props.onManageOrg] - Manage organisation callback
 * @param {Array} [props.roles] - Global roles array
 * @param {Array} [props.entities] - Entities array for filter dropdown
 * @param {string} [props.activeTab] - Active category tab ID
 * @param {Function} [props.setActiveTab] - Tab setter
 */
export const SystemUsersView = ({
  users = [],
  loading = false,
  onRefresh,
  onAddUser,
  onEditUser,
  onViewUser,
  onManageRoles,
  onManageOrg,
  roles = [],
  entities = [],
  activeTab = 'ADMIN',
  setActiveTab
}) => {
  return (
    <UserManagementPage
      users={users}
      loading={loading}
      onRefresh={onRefresh}
      onAddUser={onAddUser}
      onEditUser={onEditUser}
      onViewUser={onViewUser}
      onManageRoles={onManageRoles}
      onManageOrg={onManageOrg}
      roles={roles}
      entities={entities}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
};

export default SystemUsersView;
