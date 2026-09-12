import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import {
  Building, Building2, Layers, Edit3, Trash2, Mail, Phone,
  MapPin, Activity, Calendar, Settings, ShieldCheck, Zap
} from 'lucide-react';

const OrganizationSection = ({
  activeTab,
  filteredCompanies = [],
  formatDate = (d) => d || 'N/A',
  handleViewCompanyTenants = () => {},
  handleOpenEditCompany = () => {},
  handleDeleteCompany = () => {},
  filteredTenants = [],
  companies = [],
  handleOpenFeaturesModal = () => {},
  handleOpenSubModal = () => {},
  handleOpenEditTenant = () => {},
  handleReactivateTenant = () => {},
  handleDeleteTenant = () => {}
}) => {
  const safeCompanies = Array.isArray(filteredCompanies) ? filteredCompanies : [];
  const safeTenants = Array.isArray(filteredTenants) ? filteredTenants : [];

  return (
    <div className="p-3 p-md-4">
      {/* TAB 1: COMPANY MANAGEMENT */}
      {activeTab === 'company' && (
        <div className="table-responsive rounded-3">
          <table className="table table-custom mb-0 align-middle">
            <thead>
              <tr>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Building size={16} />
                    </div>
                    <span>COMPANY NAME</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Mail size={16} />
                    </div>
                    <span>EMAIL CONTACT</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Phone size={16} />
                    </div>
                    <span>PHONE</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <MapPin size={16} />
                    </div>
                    <span>ADDRESS</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Activity size={16} />
                    </div>
                    <span>STATUS</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Calendar size={16} />
                    </div>
                    <span>CREATED</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-end">
                  <div className="d-flex align-items-center justify-content-end gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Settings size={16} />
                    </div>
                    <span>ACTIONS</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {safeCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 empty-text fw-semibold">No companies found</td>
                </tr>
              ) : safeCompanies.map(cmp => {
                const isInactive = cmp.status === 'INACTIVE' || cmp.deletedAt;
                return (
                  <tr key={cmp.id} className="row-hover-effect">
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center me-2">
                        <div className="cell-icon-badge bg-primary-subtle text-primary rounded-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, flexShrink: 0, marginRight: 12 }}>
                          <Building size={16} />
                        </div>
                        <span className="fw-bold fs-14 text-heading">{cmp.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center">
                        <div className="cell-icon-badge bg-primary-subtle text-primary rounded-2 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, flexShrink: 0, marginRight: 10 }}>
                          <Mail size={14} />
                        </div>
                        <span className="fs-13 text-body-secondary">{cmp.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center">
                        <div className="cell-icon-badge bg-success-subtle text-success rounded-2 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, flexShrink: 0, marginRight: 10 }}>
                          <Phone size={14} />
                        </div>
                        <span className="fs-13 text-body-secondary">{cmp.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center">
                        <div className="cell-icon-badge bg-danger-subtle text-danger rounded-2 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, flexShrink: 0, marginRight: 10 }}>
                          <MapPin size={14} />
                        </div>
                        <span className="fs-13 text-body-secondary text-truncate" style={{ maxWidth: 260 }}>{cmp.address || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className={`status-pill d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-bold fs-12 ${isInactive ? 'bg-secondary-subtle text-secondary' : 'bg-success-subtle text-success'}`}>
                        <span className={`rounded-circle ${isInactive ? 'bg-secondary' : 'bg-success'}`} style={{ width: 7, height: 7 }} />
                        {isInactive ? 'INACTIVE' : 'ACTIVE'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="cell-icon-badge rounded-2 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, flexShrink: 0, backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                          <Calendar size={14} />
                        </div>
                        <span className="fs-13 text-body-secondary">{formatDate(cmp.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button
                          onClick={() => handleViewCompanyTenants(cmp)}
                          title="View Associated Organizations"
                          className="btn-action-round btn-action-view d-flex align-items-center justify-content-center border-0"
                        >
                          <Layers size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEditCompany(cmp)}
                          title="Edit Company Details"
                          className="btn-action-round btn-action-edit d-flex align-items-center justify-content-center border-0"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(cmp.id, cmp.name)}
                          title="Delete Company"
                          className="btn-action-round btn-action-delete d-flex align-items-center justify-content-center border-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: TENANT / ORGANIZATIONS MANAGEMENT */}
      {activeTab === 'tenant' && (
        <div className="table-responsive rounded-3">
          <table className="table table-custom mb-0 align-middle">
            <thead>
              <tr>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Building2 size={16} />
                    </div>
                    <span>ORGANIZATION NAME</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Building size={16} />
                    </div>
                    <span>PARENT COMPANY</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Zap size={16} />
                    </div>
                    <span>SUBSCRIPTION TIER</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Activity size={16} />
                    </div>
                    <span>STATUS</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <ShieldCheck size={16} />
                    </div>
                    <span>SERVER HOST URL</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-end">
                  <div className="d-flex align-items-center justify-content-end gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Settings size={16} />
                    </div>
                    <span>ACTIONS</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {safeTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 empty-text fw-semibold">No organizations found</td>
                </tr>
              ) : safeTenants.map(tn => {
                const parentCompany = (companies || []).find(c => c.id === tn.companyId);
                const isInactive = tn.status === 'INACTIVE' || tn.deletedAt;

                return (
                  <tr key={tn.id} className="row-hover-effect">
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="cell-icon-badge bg-primary-subtle text-primary rounded-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, flexShrink: 0 }}>
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div className="fw-bold fs-14 text-heading">{tn.name}</div>
                          {tn.description && <small className="text-muted fs-12">{tn.description}</small>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="cell-icon-badge bg-secondary-subtle text-secondary rounded-2 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, flexShrink: 0 }}>
                          <Building size={14} />
                        </div>
                        <span className="fs-13 text-body-secondary">{parentCompany ? parentCompany.name : (tn.companyId ? `Company #${tn.companyId}` : 'Independent')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis px-3 py-1.5 fw-bold fs-12">
                        {tn.subscription || 'BASIC'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className={`status-pill d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-bold fs-12 ${isInactive ? 'bg-secondary-subtle text-secondary' : 'bg-success-subtle text-success'}`}>
                        <span className={`rounded-circle ${isInactive ? 'bg-secondary' : 'bg-success'}`} style={{ width: 7, height: 7 }} />
                        {isInactive ? 'INACTIVE' : 'ACTIVE'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="fs-13 text-body-secondary font-monospace">{tn.serverUrl || 'Default Gateway'}</span>
                    </td>
                    <td className="py-3 px-3 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button
                          onClick={() => handleOpenFeaturesModal(tn)}
                          title="Configure Features & Modules"
                          className="btn-action-round btn-action-view d-flex align-items-center justify-content-center border-0"
                        >
                          <Zap size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEditTenant(tn)}
                          title="Edit Organization Details"
                          className="btn-action-round btn-action-edit d-flex align-items-center justify-content-center border-0"
                        >
                          <Edit3 size={15} />
                        </button>
                        {isInactive ? (
                          <button
                            onClick={() => handleReactivateTenant(tn.id, tn.name)}
                            title="Reactivate Organization"
                            className="btn-action-round btn-action-view d-flex align-items-center justify-content-center border-0 text-success"
                          >
                            <ShieldCheck size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteTenant(tn.id, tn.name)}
                            title="Delete Organization"
                            className="btn-action-round btn-action-delete d-flex align-items-center justify-content-center border-0"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrganizationSection;
