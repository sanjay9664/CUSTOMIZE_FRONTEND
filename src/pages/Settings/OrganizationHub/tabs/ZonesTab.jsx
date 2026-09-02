import React from 'react';
import { Button, Badge, Form } from 'react-bootstrap';
import { Layers, Edit3, Trash2, Zap, Building2 } from 'lucide-react';

const ZonesTab = ({
  zones,
  tenants,
  selectedTenantFilter,
  setSelectedTenantFilter,
  searchTerm,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onReactivate,
  isAdmin
}) => {
  const safeSearch = String(searchTerm || '').toLowerCase();
  const safeZones = Array.isArray(zones) ? zones : [];
  const safeTenants = Array.isArray(tenants) ? tenants : [];

  const activeTenants = safeTenants.filter(t => t && t.status !== 'INACTIVE' && !t.deletedAt);

  const filtered = safeZones.filter(z => {
    if (!z) return false;
    const name = String(z.name || '').toLowerCase();
    const region = String(z.region || '').toLowerCase();
    const matchesSearch = !safeSearch || name.includes(safeSearch) || region.includes(safeSearch);
    const matchesTenant = !selectedTenantFilter || selectedTenantFilter === 'ALL' || String(z.tenantId) === String(selectedTenantFilter);
    return matchesSearch && matchesTenant;
  });

  return (
    <div className="d-flex flex-column gap-3">
      {/* Tenant Filter Selector */}
      <div className="d-flex align-items-center gap-2">
        <Form.Select
          value={selectedTenantFilter}
          onChange={(e) => setSelectedTenantFilter(e.target.value)}
          className="bg-dark text-white border-secondary border-opacity-25 py-1.5 fs-13"
          style={{ maxWidth: 300 }}
        >
          <option value="ALL">🏢 All Organizations ({activeTenants.length})</option>
          {activeTenants.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Form.Select>
      </div>

      <div className="table-responsive">
        <table className="table table-custom mb-0">
          <thead>
            <tr>
              <th>Zone Name</th>
              <th>Organization</th>
              <th>Region</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted">
                  <Layers size={36} className="mb-2 text-slate-500 opacity-50" />
                  <div>No zones found matching criteria.</div>
                </td>
              </tr>
            ) : (
              filtered.map(z => {
                const parentTenant = tenants.find(t => String(t.id) === String(z.tenantId));
                const isInactive = z.status === 'INACTIVE' || z.deletedAt;
                return (
                  <tr key={z.id}>
                    <td className="fw-bold text-white">
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-1.5 rounded-2 bg-purple bg-opacity-10 text-purple">
                          <Layers size={16} />
                        </div>
                        <div>
                          {z.name}
                          <div className="fs-11 text-muted font-monospace">{z.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-300 fs-13">
                      <div className="d-flex align-items-center gap-1">
                        <Building2 size={12} className="text-info" />
                        <span>{parentTenant ? parentTenant.name : (z.tenantId || 'Global')}</span>
                      </div>
                    </td>
                    <td className="text-slate-300 fs-13">{z.region || 'N/A'}</td>
                    <td>
                      <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1">
                        {isInactive ? 'INACTIVE' : 'ACTIVE'}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1.5">
                        <Button variant="outline-light" size="sm" title="Edit Zone" onClick={() => onOpenEdit(z)} className="py-1">
                          <Edit3 size={13} />
                        </Button>
                        {isAdmin && (
                          isInactive ? (
                            <Button variant="outline-success" size="sm" title="Reactivate" onClick={() => onReactivate(z.id)} className="py-1">
                              <Zap size={13} />
                            </Button>
                          ) : (
                            <Button variant="outline-danger" size="sm" title="Delete Zone" onClick={() => onDelete(z.id)} className="py-1">
                              <Trash2 size={13} />
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
    </div>
  );
};

export default ZonesTab;
