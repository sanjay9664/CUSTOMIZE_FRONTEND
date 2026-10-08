import React, { useState, useEffect } from 'react';
import { Container, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Users, Shield, Check, ArrowLeft } from 'lucide-react';
import SystemUsersView from './components/SystemUsersView';
import UserRolesView from './components/UserRolesView';
import UserFormView from './components/UserFormView';
import RoleFormView from './components/RoleFormView';
import UserDetailView from './components/UserDetailView';
import { bmsService } from '../../services/bmsService';

export const UserManagement = () => {
  const navigate = useNavigate();

  // Navigation Section: 'USERS' (System Users) or 'ROLES' (User Roles)
  const [activeSection, setActiveSection] = useState('USERS');

  // View Mode: 'LIST' | 'VIEW' | 'ADD' | 'EDIT'
  const [viewMode, setViewMode] = useState('LIST');
  const [selectedItem, setSelectedItem] = useState(null);

  // Tab State
  const [userTab, setUserTab] = useState('ALL');
  const [roleTab, setRoleTab] = useState('ADMIN');

  // Data State
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await bmsService.getUsers({ limit: 100 });
      const list = res?.data || (Array.isArray(res) ? res : []);
      setUsers(list);
    } catch (err) {
      console.warn('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Roles
  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const res = await bmsService.getRoles();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setRoles(list);
    } catch (err) {
      console.warn('Failed to fetch roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch Entities (tenants & companies for filter dropdown)
  const fetchEntities = async () => {
    try {
      const [tenantsRes, companiesRes] = await Promise.allSettled([
        bmsService.getTenants(),
        bmsService.getCompanies()
      ]);
      const list = [];
      if (tenantsRes.status === 'fulfilled') {
        const tenants = tenantsRes.value?.data || (Array.isArray(tenantsRes.value) ? tenantsRes.value : []);
        tenants.forEach((t) => list.push({ id: t.id, name: t.name || t.tenantName }));
      }
      if (companiesRes.status === 'fulfilled') {
        const companies = companiesRes.value?.data || (Array.isArray(companiesRes.value) ? companiesRes.value : []);
        companies.forEach((c) => list.push({ id: c.id, name: c.name }));
      }
      setEntities(list);
    } catch (err) {
      console.warn('Failed to fetch organizations:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchEntities();
  }, []);

  // Handlers for switching sections
  const handleSelectSection = (sectionKey) => {
    setActiveSection(sectionKey);
    setViewMode('LIST');
    setSelectedItem(null);
    if (sectionKey === 'ROLES' && roles.length === 0) {
      fetchRoles();
    }
  };

  // User Actions
  const handleAddUser = () => {
    setSelectedItem(null);
    setViewMode('ADD');
  };

  const handleEditUser = (user) => {
    setSelectedItem(user);
    setViewMode('EDIT');
  };

  const handleViewUser = (user) => {
    setSelectedItem(user);
    setViewMode('VIEW');
  };

  // Role Actions
  const handleAddRole = () => {
    setSelectedItem(null);
    setViewMode('ADD');
  };

  const handleEditRole = (role) => {
    setSelectedItem(role);
    setViewMode('EDIT');
  };

  return (
    <Container fluid className="user-management-page py-3 px-3 min-vh-100">
      {/* 
        When in ROLES view or nested forms, display dark breadcrumb header with navigation.
        When in USERS view (LIST mode), SystemUsersView renders the full reference header.
      */}
      {activeSection === 'ROLES' && viewMode === 'LIST' && (
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-2.5 gap-2">
          <div>
            <h2 className="page-main-title fw-bold text-white mb-0" style={{ fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
              User Roles
            </h2>
            <p className="page-sub-description mb-0 fs-12" style={{ color: '#94a3b8' }}>
              Manage access permission levels, custom roles, and authorization policies.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill fs-13 fw-semibold user-toolbar-pill-btn"
              onClick={() => handleSelectSection('USERS')}
            >
              <Users size={15} className="text-info" />
              <span>Back to System Users</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Views Container */}
      <div className="view-content-wrapper">
        {activeSection === 'USERS' ? (
          viewMode === 'LIST' ? (
            <SystemUsersView
              users={users}
              roles={roles}
              entities={entities}
              loading={loadingUsers}
              onRefresh={fetchUsers}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onViewUser={handleViewUser}
              onManageRoles={() => handleSelectSection('ROLES')}
              onManageOrg={() => navigate('/manage-organisation')}
              activeTab={userTab}
              setActiveTab={setUserTab}
            />
          ) : viewMode === 'VIEW' ? (
            <UserDetailView
              user={selectedItem}
              roles={roles}
              onBack={() => setViewMode('LIST')}
              onEdit={(u) => {
                setSelectedItem(u);
                setViewMode('EDIT');
              }}
              onDelete={async () => {
                setViewMode('LIST');
                setSelectedItem(null);
                await fetchUsers();
              }}
              onUserUpdated={(updatedUser) => {
                setSelectedItem(updatedUser);
                fetchUsers();
              }}
            />
          ) : (
            <UserFormView
              user={selectedItem}
              defaultUserType={userTab === 'ADMIN' ? 'Administrator User' : userTab === 'INSTALLER' ? 'Installation User' : 'Organisation User'}
              onBack={() => setViewMode(selectedItem ? 'VIEW' : 'LIST')}
              onSaved={() => {
                setViewMode('LIST');
                setSelectedItem(null);
                fetchUsers();
              }}
            />
          )
        ) : (
          viewMode === 'LIST' ? (
            <UserRolesView
              roles={roles}
              loading={loadingRoles}
              onRefresh={fetchRoles}
              onAddRole={handleAddRole}
              onEditRole={handleEditRole}
              onBackToUsers={() => handleSelectSection('USERS')}
              onManageOrg={() => navigate('/manage-organisation')}
              activeTab={roleTab}
              setActiveTab={setRoleTab}
            />
          ) : (
            <RoleFormView
              role={selectedItem}
              defaultRoleType={roleTab === 'ADMIN' ? 'Administrator' : roleTab === 'INSTALLATION' ? 'Installation' : 'Organization'}
              onBack={() => setViewMode('LIST')}
              onSaved={() => {
                setViewMode('LIST');
                fetchRoles();
              }}
            />
          )
        )}
      </div>

      {/* Dark Enterprise Theme Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .user-management-page {
          background-color: #080e1e !important;
          color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        /* Dark Card & Table Styling for nested views */
        .user-management-page .card {
          background-color: #0c1429 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #f8fafc !important;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4) !important;
        }

        .user-management-page .card h5,
        .user-management-page .card h6 {
          color: #ffffff !important;
        }

        .user-management-page .text-dark {
          color: #f8fafc !important;
        }
        .user-management-page .bg-white {
          background-color: #0c1429 !important;
        }
        .user-management-page .bg-light {
          background-color: #090e1f !important;
        }
        .user-management-page .text-secondary {
          color: #94a3b8 !important;
        }
        .user-management-page .border {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        .user-management-page .form-control,
        .user-management-page .form-select {
          background-color: #090e1f !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #f8fafc !important;
        }

        .user-management-page .form-control:focus,
        .user-management-page .form-select:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 1px #3b82f6 !important;
        }

        .user-management-page .input-group-text {
          background-color: #090e1f !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #94a3b8 !important;
        }

        /* Pill Buttons & Toolbar Styles */
        .user-management-page .user-toolbar-pill-btn {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 9999px !important;
          color: #ffffff !important;
          height: 35px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
        }
        .user-management-page .user-toolbar-pill-btn:hover,
        .user-management-page .user-toolbar-pill-btn:focus {
          background-color: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
          color: #ffffff !important;
        }
        .user-management-page .user-toolbar-primary-btn {
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
        .user-management-page .user-toolbar-primary-btn:hover {
          background-color: #0369a1 !important;
          border-color: #7dd3fc !important;
          color: #ffffff !important;
        }

        /* Top Nav Tabs */
        .reference-nav-tabs {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          gap: 4px;
        }
        .ref-tab-btn {
          color: #94a3b8 !important;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
        }
        .ref-tab-btn:hover {
          color: #f1f5f9 !important;
        }
        .ref-tab-btn.active-ref-tab {
          color: #ffffff !important;
          font-weight: 600;
          background-color: rgba(37, 99, 235, 0.08);
        }
        .active-tab-indicator {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #3b82f6;
          box-shadow: 0 0 10px #3b82f6;
          border-radius: 2px 2px 0 0;
        }

        /* Data Tables in Roles & Child views */
        .ref-data-table {
          background-color: transparent !important;
          color: #f8fafc !important;
        }
        .ref-data-table th {
          background-color: #091024 !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          font-weight: 600;
          font-size: 13px;
          padding: 12px 14px;
        }
        .ref-data-table td {
          background-color: transparent !important;
          color: #cbd5e1 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding: 14px;
          font-size: 13.5px;
        }
        .ref-table-row:hover td {
          background-color: rgba(255, 255, 255, 0.03) !important;
        }

        /* Form Inputs */
        .ref-form-input {
          background-color: #090e1f !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #f8fafc !important;
        }
        .ref-form-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 1px #3b82f6 !important;
        }

        /* Tree & selectors */
        .location-tree-container,
        .permission-grid-scroll {
          background-color: #090e1f !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .tree-row:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .permission-item {
          background-color: #0c1429 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          color: #f8fafc !important;
        }

        .actions-panel-toggle-btn {
          background-color: #121c35 !important;
          border: 1px solid rgba(59, 130, 246, 0.35) !important;
          color: #ffffff !important;
          transition: all 0.15s ease;
        }
        .actions-panel-toggle-btn:hover {
          background-color: #1a274a !important;
          border-color: rgba(59, 130, 246, 0.6) !important;
        }
      `}} />
    </Container>
  );
};

export default UserManagement;
