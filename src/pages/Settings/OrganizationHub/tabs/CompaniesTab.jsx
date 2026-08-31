import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Building, Plus, Search, Edit3, Trash2, Layers } from 'lucide-react';

const CompaniesTab = ({
  companies,
  searchTerm,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onViewTenants,
  isAdmin
}) => {
  const filtered = companies.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="table-responsive">
      <table className="table table-custom mb-0">
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Contact Email</th>
            <th>Phone</th>
            <th>Corporate Address</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-5 text-muted">
                <Building size={36} className="mb-2 text-slate-500 opacity-50" />
                <div>No companies found matching search criteria.</div>
              </td>
            </tr>
          ) : (
            filtered.map(cmp => {
              const isInactive = cmp.status === 'INACTIVE' || cmp.deletedAt;
              return (
                <tr key={cmp.id}>
                  <td className="fw-bold text-white">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1.5 rounded-2 bg-primary bg-opacity-10 text-primary">
                        <Building size={16} />
                      </div>
                      <div>
                        {cmp.name}
                        <div className="fs-11 text-muted font-monospace">{cmp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-300 fs-13">{cmp.email || 'N/A'}</td>
                  <td className="text-slate-300 fs-13 font-monospace">{cmp.phone || 'N/A'}</td>
                  <td className="text-slate-300 fs-13" style={{ maxWidth: 220 }}>
                    <span className="text-truncate d-inline-block" style={{ maxWidth: 200 }}>
                      {cmp.address || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1">
                      {isInactive ? 'INACTIVE' : 'ACTIVE'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-1.5">
                      <Button
                        variant="outline-info"
                        size="sm"
                        title="View Tenants"
                        onClick={() => onViewTenants(cmp)}
                        className="d-flex align-items-center gap-1 py-1"
                      >
                        <Layers size={13} /> Tenants
                      </Button>
                      <Button
                        variant="outline-light"
                        size="sm"
                        title="Edit Company"
                        onClick={() => onOpenEdit(cmp)}
                        className="py-1"
                      >
                        <Edit3 size={13} />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          title="Delete Company"
                          onClick={() => onDelete(cmp.id)}
                          className="py-1"
                        >
                          <Trash2 size={13} />
                        </Button>
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

export default CompaniesTab;
