import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Spinner, InputGroup } from 'react-bootstrap';
import { 
  PlusCircle, Trash2, Edit3, Search, 
  ArrowUpDown, ArrowUp, ArrowDown, Shield, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { bmsService } from '../../../services/bmsService';

const ROLES_TABS = [
  { id: 'ADMIN', label: 'Administrator Roles', singular: 'Administrator Role' },
  { id: 'INSTALLATION', label: 'Installation Roles', singular: 'Installation Role' },
  { id: 'ORGANIZATION', label: 'Organization Roles', singular: 'Organization Role' },
  { id: 'ALL', label: 'All Roles', singular: 'Role' }
];

export const UserRolesView = ({
  roles = [],
  loading = false,
  onRefresh,
  onAddRole,
  onEditRole,
  activeTab = 'ADMIN',
  setActiveTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [deleteModalRole, setDeleteModalRole] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const currentTabObj = useMemo(() => {
    return ROLES_TABS.find(t => t.id === activeTab) || ROLES_TABS[0];
  }, [activeTab]);

  // Filter roles by active tab
  const tabFilteredRoles = useMemo(() => {
    return roles.filter(role => {
      const name = String(role.name || '').toUpperCase();
      const isCustom = !role.isPredefined;

      if (activeTab === 'ADMIN') {
        // Administrator roles: Admin, SuperAdmin, Area/Zone Managers, etc.
        return name.includes('ADMIN') || name.includes('SUPER') || name === 'AREA_MANAGER' || name === 'ZONE_MANAGER';
      }
      if (activeTab === 'INSTALLATION') {
        // Installation roles: Installer, Operators
        return name.includes('INSTALL') || name.includes('OPERATOR') || name.includes('INCHARGE');
      }
      if (activeTab === 'ORGANIZATION') {
        // Organization roles: Tenant custom roles, Manager, Viewer
        return isCustom || name.includes('VIEWER') || name.includes('ORGANIS') || name.includes('ORGANIZ') || name === 'MANAGER';
      }
      return true; // 'ALL'
    });
  }, [roles, activeTab]);

  // Apply search
  const searchedRoles = useMemo(() => {
    if (!searchTerm) return tabFilteredRoles;
    const term = searchTerm.toLowerCase();
    return tabFilteredRoles.filter(r =>
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.description && r.description.toLowerCase().includes(term))
    );
  }, [tabFilteredRoles, searchTerm]);

  // Sort
  const sortedRoles = useMemo(() => {
    return [...searchedRoles].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [searchedRoles, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedRoles.length / pageSize) || 1;
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRoles.slice(start, start + pageSize);
  }, [sortedRoles, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Delete Role Handler
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

  return (
    <div className="user-roles-view">
      {/* Reference Navigation Tabs matching Screenshot 2 */}
      <div className="reference-nav-tabs d-flex border-bottom mb-4">
        {ROLES_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ref-tab-btn py-2 px-3 fw-500 fs-14 border-0 bg-transparent text-nowrap position-relative ${
              activeTab === tab.id ? 'active-ref-tab text-primary' : 'text-secondary'
            }`}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
          >
            {tab.label}
            {activeTab === tab.id && <div className="active-tab-indicator" />}
          </button>
        ))}
      </div>

      {/* Main Content Card matching Screenshot 2 */}
      <Card className="border-0 shadow-sm rounded-3 bg-white">
        <Card.Body className="p-4">
          {/* Card Header Row: Title & Action Button */}
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
            <h5 className="mb-0 fw-semibold text-dark fs-16">
              {currentTabObj.label}
            </h5>

            <div className="d-flex align-items-center gap-2">
              {/* Search Box */}
              <InputGroup size="sm" style={{ width: '240px' }}>
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={14} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search role by name or description..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border-start-0"
                />
              </InputGroup>

              {/* Add Role Button matching Screenshot 2 */}
              <Button
                variant="outline-primary"
                size="sm"
                className="d-flex align-items-center gap-2 px-3 py-1 fw-500 rounded-pill ref-add-btn"
                onClick={() => onAddRole(currentTabObj.singular)}
              >
                <PlusCircle size={15} />
                <span>Add {currentTabObj.singular}</span>
              </Button>
            </div>
          </div>

          {/* Table matching Screenshot 2 */}
          <div className="table-responsive">
            <Table hover className="align-middle mb-0 ref-data-table">
              <thead>
                <tr className="border-bottom text-muted fs-13">
                  <th 
                    style={{ cursor: 'pointer', width: '30%' }}
                    onClick={() => handleSort('name')}
                    className="user-select-none"
                  >
                    <span className="d-flex align-items-center gap-1">
                      Name
                      {sortField === 'name' ? (
                        sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-50" />
                      )}
                    </span>
                  </th>
                  <th 
                    style={{ cursor: 'pointer', width: '56%' }}
                    onClick={() => handleSort('description')}
                    className="user-select-none"
                  >
                    <span className="d-flex align-items-center gap-1">
                      Description
                      {sortField === 'description' ? (
                        sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-50" />
                      )}
                    </span>
                  </th>
                  <th style={{ width: '14%' }} className="text-end pe-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-5 text-muted">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading roles...
                    </td>
                  </tr>
                ) : paginatedRoles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-5 text-muted fs-14">
                      {searchTerm ? 'No roles matching search.' : `No ${currentTabObj.label.toLowerCase()} found.`}
                    </td>
                  </tr>
                ) : (
                  paginatedRoles.map((role) => {
                    const isSystemRole = Boolean(role.isPredefined);
                    return (
                      <tr key={role.id} className="border-bottom ref-table-row">
                        {/* Name Column (Blue text matching screenshot) */}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-link p-0 text-decoration-none fw-500 text-primary fs-14 text-start text-truncate"
                              style={{ maxWidth: '280px' }}
                              onClick={() => onEditRole(role)}
                              title={isSystemRole ? `${role.name} (System Role)` : role.name}
                            >
                              {role.name}
                            </button>
                            {isSystemRole && (
                              <Badge bg="light" className="text-muted border fs-10 fw-normal">
                                System
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Description Column */}
                        <td className="text-secondary fs-14 text-truncate" style={{ maxWidth: '480px' }} title={role.description || ''}>
                          {role.description || '-'}
                        </td>

                        {/* Action Column: Trash icon */}
                        <td className="text-end pe-3">
                          <div className="d-inline-flex align-items-center gap-2">
                            {/* Edit Role Button */}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-secondary text-hover-primary"
                              title={isSystemRole ? "View System Role Details" : "Edit Custom Role"}
                              onClick={() => onEditRole(role)}
                            >
                              <Edit3 size={15} />
                            </Button>

                            {/* Delete Role Button (Disabled for predefined roles per Section 22 & 23) */}
                            {isSystemRole ? (
                              <span 
                                className="p-1 text-muted opacity-25 d-inline-block" 
                                title="System predefined roles cannot be deleted"
                                style={{ cursor: 'not-allowed' }}
                              >
                                <Trash2 size={15} />
                              </span>
                            ) : (
                              <Button
                                variant="link"
                                size="sm"
                                className="p-1 text-secondary text-hover-danger"
                                title="Delete Custom Role"
                                onClick={() => {
                                  setDeleteModalRole(role);
                                  setActionError(null);
                                }}
                              >
                                <Trash2 size={15} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination Row matching Screenshot 2 */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-center mt-4 pt-2">
              <nav aria-label="Roles pagination">
                <ul className="pagination pagination-sm mb-0 gap-1 align-items-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link rounded-1 border text-secondary" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      &lt;
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                      <button
                        className={`page-link rounded-1 border ${
                          currentPage === pageNum ? 'bg-primary text-white border-primary' : 'text-secondary'
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link rounded-1 border text-secondary" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      &gt;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Role Confirmation Modal */}
      <Modal 
        show={Boolean(deleteModalRole)} 
        onHide={() => !isDeleting && setDeleteModalRole(null)}
        centered
        size="sm"
      >
        <Modal.Header closeButton={!isDeleting} className="border-0 pb-0">
          <Modal.Title className="fs-16 fw-semibold text-danger d-flex align-items-center gap-2">
            <Trash2 size={18} />
            Delete Role?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          <p className="fs-14 text-secondary mb-2">
            Are you sure you want to permanently delete custom role:
          </p>
          <div className="p-2 rounded bg-light border fw-semibold fs-14 text-dark text-truncate">
            {deleteModalRole?.name}
          </div>
          {deleteModalRole?.userCount > 0 && (
            <div className="alert alert-warning py-2 px-3 fs-12 mt-2 mb-0 d-flex align-items-center gap-2">
              <AlertTriangle size={15} />
              <span>Warning: This role is assigned to {deleteModalRole.userCount} user(s).</span>
            </div>
          )}
          {actionError && (
            <div className="alert alert-danger py-2 px-3 fs-12 mt-2 mb-0">
              {actionError}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button 
            variant="light" 
            size="sm" 
            onClick={() => setDeleteModalRole(null)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={handleDeleteRole}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner animation="border" size="sm" /> : 'Delete Role'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserRolesView;
