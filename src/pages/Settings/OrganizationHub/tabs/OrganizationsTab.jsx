import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { Building2, Sliders, Award, Edit3, Trash2, Zap } from 'lucide-react';

const OrganizationsTab = ({
  tenants = [],
  companies = [],
  searchTerm = '',
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onReactivate,
  onOpenFeatures,
  onOpenSub,
  isAdmin
}) => {
  const safeSearch = String(searchTerm || '').toLowerCase();
  const safeTenants = Array.isArray(tenants) ? tenants : [];
  const safeCompanies = Array.isArray(companies) ? companies : [];

  const filtered = safeTenants.filter(t => {
    if (!t) return false;
    const name = String(t.name || '').toLowerCase();
    const email = String(t.email || '').toLowerCase();
    return !safeSearch || name.includes(safeSearch) || email.includes(safeSearch);
  });

  return (
    <div className="table-responsive">
      <table className="table table-custom mb-0">
        <thead>
          <tr>
            <th>Organization Name</th>
            <th>Parent Company</th>
            <th>Contact Details</th>
            <th>Subscription</th>
            <th>Status</th>
            <th>Features</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-5 text-muted">
                <Building2 size={36} className="mb-2 text-slate-500 opacity-50" />
                <div>No organizations found matching search criteria.</div>
              </td>
            </tr>
          ) : (
            filtered.map(tn => {
              const parentCmp = companies.find(c => String(c.id) === String(tn.companyId));
              const isInactive = tn.status === 'INACTIVE' || tn.deletedAt;
              return (
                <tr key={tn.id}>
                  <td className="fw-bold text-white">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1.5 rounded-2 bg-info bg-opacity-10 text-info">
                        <Building2 size={16} />
                      </div>
                      <div>
                        {tn.name}
                        <div className="fs-11 text-muted font-monospace">{tn.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-300 fs-13">{parentCmp ? parentCmp.name : (tn.companyId || 'Global')}</td>
                  <td className="text-slate-300 fs-13">
                    <div>{tn.email}</div>
                    <small className="text-muted font-monospace">{tn.phone}</small>
                  </td>
                  <td>
                    <Badge bg="warning" text="dark" className="px-2 py-1 me-1">
                      {tn.subscription || 'BASIC'}
                    </Badge>
                    {tn.subscriptionPeriod && <small className="text-muted">({tn.subscriptionPeriod})</small>}
                  </td>
                  <td>
                    <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1">
                      {isInactive ? 'INACTIVE' : 'ACTIVE'}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="fs-12 py-0 px-2 d-flex align-items-center gap-1"
                      onClick={() => onOpenFeatures(tn)}
                    >
                      <Sliders size={12} /> Features
                    </Button>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-1.5">
                      <Button variant="outline-warning" size="sm" title="Subscription Plan" onClick={() => onOpenSub(tn)}>
                        <Award size={14} />
                      </Button>
                      <Button variant="outline-light" size="sm" title="Edit Organization" onClick={() => onOpenEdit(tn)}>
                        <Edit3 size={14} />
                      </Button>
                      {isAdmin && (
                        isInactive ? (
                          <Button variant="outline-success" size="sm" title="Reactivate" onClick={() => onReactivate(tn.id)}>
                            <Zap size={14} />
                          </Button>
                        ) : (
                          <Button variant="outline-danger" size="sm" title="Delete Organization" onClick={() => onDelete(tn.id)}>
                            <Trash2 size={14} />
                          </Button>
                        )
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
  );
};

export default OrganizationsTab;
