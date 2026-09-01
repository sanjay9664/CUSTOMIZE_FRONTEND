import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { Building, Building2, Layers, Edit3, Trash2, Award, Sliders, Zap } from 'lucide-react';

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
    <div>
      {/* TAB 1: COMPANY MANAGEMENT */}
      {activeTab === 'company' && (
        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Email Contact</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 empty-text fw-semibold">No companies found</td>
                </tr>
              ) : safeCompanies.map(cmp => (
                <tr key={cmp.id}>
                  <td className="fw-bold text-white">
                    <div className="d-flex align-items-center gap-2">
                      <Building className="text-info" size={18} />
                      {cmp.name}
                    </div>
                  </td>
                  <td className="text-slate-300">{cmp.email || 'N/A'}</td>
                  <td className="text-slate-300">{cmp.phone || 'N/A'}</td>
                  <td className="text-slate-400 fs-13">{cmp.address || 'N/A'}</td>
                  <td>
                    <Badge bg={cmp.status === 'INACTIVE' || cmp.deletedAt ? 'secondary' : 'success'} className="px-2 py-1">
                      {cmp.status === 'INACTIVE' || cmp.deletedAt ? 'INACTIVE' : 'ACTIVE'}
                    </Badge>
                  </td>
                  <td className="text-slate-400 fs-12">{formatDate(cmp.createdAt)}</td>
                  <td className="text-end">
                    <div className="d-flex align-items-center justify-content-end gap-2">
                      <Button
                        size="sm"
                        variant="outline-info"
                        onClick={() => handleViewCompanyTenants(cmp)}
                        title="View Associated Organizations"
                        className="p-1 border-0"
                      >
                        <Layers size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => handleOpenEditCompany(cmp)}
                        title="Edit Company Details"
                        className="p-1 border-0"
                      >
                        <Edit3 size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteCompany(cmp.id, cmp.name)}
                        title="Delete Company"
                        className="p-1 border-0"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: TENANT / ORGANIZATIONS MANAGEMENT */}
      {activeTab === 'tenant' && (
        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Parent Company</th>
                <th>Subscription Tier</th>
                <th>Status</th>
                <th>Server Host URL</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 empty-text fw-semibold">No organizations / tenants found</td>
                </tr>
              ) : safeTenants.map(tn => {
                const parentCompany = (companies || []).find(c => c.id === tn.companyId);
                const isInactive = tn.status === 'INACTIVE' || tn.deletedAt;
                const subBadge = tn.subscription === 'ENTERPRISE' ? 'warning' : tn.subscription === 'PRO' ? 'info' : 'secondary';

                return (
                  <tr key={tn.id}>
                    <td className="fw-bold text-white">
                      <div className="d-flex align-items-center gap-2">
                        <Building2 className="text-primary" size={18} />
                        <div>
                          <div>{tn.name}</div>
                          {tn.description && <small className="text-muted fs-12">{tn.description}</small>}
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-300">
                      {parentCompany ? parentCompany.name : (tn.companyId ? `Company #${tn.companyId}` : 'Independent')}
                    </td>
                    <td>
                      <Badge bg={subBadge} className="px-2 py-1 text-dark fw-bold">
                        {tn.subscription || 'BASIC'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1">
                        {isInactive ? 'INACTIVE' : 'ACTIVE'}
                      </Badge>
                    </td>
                    <td className="text-slate-400 fs-12 font-monospace">{tn.serverUrl || 'Default Gateway'}</td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button
                          size="sm"
                          variant="outline-info"
                          onClick={() => handleOpenFeaturesModal(tn)}
                          title="Configure Features & Modules"
                          className="p-1 border-0"
                        >
                          <Sliders size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-warning"
                          onClick={() => handleOpenSubModal(tn)}
                          title="Manage License & Subscription"
                          className="p-1 border-0"
                        >
                          <Award size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleOpenEditTenant(tn)}
                          title="Edit Organization Details"
                          className="p-1 border-0"
                        >
                          <Edit3 size={16} />
                        </Button>
                        {isInactive ? (
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => handleReactivateTenant(tn)}
                            title="Reactivate Organization"
                            className="p-1 border-0"
                          >
                            <Zap size={16} />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDeleteTenant(tn.id, tn.name)}
                            title="Deactivate Organization"
                            className="p-1 border-0"
                          >
                            <Trash2 size={16} />
                          </Button>
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
