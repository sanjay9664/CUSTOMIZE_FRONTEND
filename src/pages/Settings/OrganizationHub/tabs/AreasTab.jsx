import React from 'react';
import { Button, Badge, Form } from 'react-bootstrap';
import { Grid, Layers, Edit3, Trash2, Building2 } from 'lucide-react';

const AreasTab = ({
  areas,
  zones,
  tenants,
  selectedZoneFilter,
  setSelectedZoneFilter,
  selectedTenantFilter,
  setSelectedTenantFilter,
  searchTerm,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  isAdmin
}) => {
  const activeTenants = tenants.filter(t => t.status !== 'INACTIVE' && !t.deletedAt);
  const activeZones = zones.filter(z => z.status !== 'INACTIVE' && !z.deletedAt);

  const filtered = areas.filter(a => {
    const matchesSearch = !searchTerm ||
      (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZoneFilter === 'ALL' || String(a.zoneId) === String(selectedZoneFilter);
    const matchesTenant = selectedTenantFilter === 'ALL' || String(a.tenantId) === String(selectedTenantFilter);
    return matchesSearch && matchesZone && matchesTenant;
  });

  return (
    <div className="d-flex flex-column gap-3">
      {/* Filters Bar */}
      <div className="d-flex flex-wrap align-items-center gap-2">
        <Form.Select
          value={selectedTenantFilter}
          onChange={(e) => setSelectedTenantFilter(e.target.value)}
          className="bg-dark text-white border-secondary border-opacity-25 py-1.5 fs-13"
          style={{ maxWidth: 240 }}
        >
          <option value="ALL">🏢 All Organizations ({activeTenants.length})</option>
          {activeTenants.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Form.Select>
        <Form.Select
          value={selectedZoneFilter}
          onChange={(e) => setSelectedZoneFilter(e.target.value)}
          className="bg-dark text-white border-secondary border-opacity-25 py-1.5 fs-13"
          style={{ maxWidth: 240 }}
        >
          <option value="ALL">🌐 All Zones ({activeZones.length})</option>
          {activeZones.map(z => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </Form.Select>
      </div>

      <div className="table-responsive">
        <table className="table table-custom mb-0">
          <thead>
            <tr>
              <th>Area / Space Name</th>
              <th>Parent Zone</th>
              <th>Organization</th>
              <th>Description</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted">
                  <Grid size={36} className="mb-2 text-slate-500 opacity-50" />
                  <div>No areas found matching criteria.</div>
                </td>
              </tr>
            ) : (
              filtered.map(a => {
                const parentZone = zones.find(z => String(z.id) === String(a.zoneId));
                const parentTenant = tenants.find(t => String(t.id) === String(a.tenantId));
                return (
                  <tr key={a.id}>
                    <td className="fw-bold text-white">
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-1.5 rounded-2 bg-success bg-opacity-10 text-success">
                          <Grid size={16} />
                        </div>
                        <div>
                          {a.name}
                          <div className="fs-11 text-muted font-monospace">{a.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-300 fs-13">
                      <div className="d-flex align-items-center gap-1">
                        <Layers size={12} className="text-purple" />
                        <span>{parentZone ? parentZone.name : (a.zoneId || 'Unassigned')}</span>
                      </div>
                    </td>
                    <td className="text-slate-300 fs-13">
                      <div className="d-flex align-items-center gap-1">
                        <Building2 size={12} className="text-info" />
                        <span>{parentTenant ? parentTenant.name : (a.tenantId || 'Global')}</span>
                      </div>
                    </td>
                    <td className="text-slate-300 fs-13" style={{ maxWidth: 250 }}>
                      <span className="text-truncate d-inline-block" style={{ maxWidth: 230 }}>
                        {a.description || 'N/A'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1.5">
                        <Button variant="outline-light" size="sm" title="Edit Area" onClick={() => onOpenEdit(a)} className="py-1">
                          <Edit3 size={13} />
                        </Button>
                        {isAdmin && (
                          <Button variant="outline-danger" size="sm" title="Delete Area" onClick={() => onDelete(a.id)} className="py-1">
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
    </div>
  );
};

export default AreasTab;
