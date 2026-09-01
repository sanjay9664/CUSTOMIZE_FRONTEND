import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { Globe, Layers, Edit3, Trash2 } from 'lucide-react';

const LocationSection = ({
  activeTab,
  filteredZones = [],
  tenants = [],
  handleOpenEditZone = () => {},
  handleReactivateZone = () => {},
  handleDeleteZone = () => {},
  filteredAreas = [],
  zones = [],
  handleOpenEditArea = () => {},
  handleDeleteArea = () => {}
}) => {
  const safeZones = Array.isArray(filteredZones) ? filteredZones : [];
  const safeAreas = Array.isArray(filteredAreas) ? filteredAreas : [];
  const safeTenants = Array.isArray(tenants) ? tenants : [];
  const safeAllZones = Array.isArray(zones) ? zones : [];

  return (
    <div>
      {/* TAB 3: ZONES MANAGEMENT */}
      {activeTab === 'zone' && (
        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>Zone Name</th>
                <th>Assigned Organization</th>
                <th>Region / Country</th>
                <th>Timezone</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeZones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 empty-text fw-semibold">No zones found</td>
                </tr>
              ) : safeZones.map(z => {
                const assignedTenant = safeTenants.find(t => t.id === z.tenantId);
                const isInactive = z.status === 'INACTIVE' || z.deletedAt;
                return (
                  <tr key={z.id}>
                    <td className="fw-bold text-white">
                      <div className="d-flex align-items-center gap-2">
                        <Globe className="text-amber-400" size={18} />
                        <div>
                          <div>{z.name}</div>
                          {z.description && <small className="text-muted fs-12">{z.description}</small>}
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-300">{assignedTenant ? assignedTenant.name : z.tenantId}</td>
                    <td className="text-slate-300 fs-13">
                      {z.region || 'N/A'} {z.country ? `, ${z.country}` : ''}
                    </td>
                    <td className="text-slate-400 fs-12">{z.timezone || 'Asia/Kolkata'}</td>
                    <td>
                      <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1">
                        {isInactive ? 'INACTIVE' : 'ACTIVE'}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleOpenEditZone(z)}
                          title="Edit Zone Details"
                          className="p-1 border-0"
                        >
                          <Edit3 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDeleteZone(z.id, z.name)}
                          title="Deactivate Zone"
                          className="p-1 border-0"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: AREAS MANAGEMENT */}
      {activeTab === 'area' && (
        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>Area Name</th>
                <th>Assigned Zone</th>
                <th>Assigned Organization</th>
                <th>Description</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeAreas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 empty-text fw-semibold">No operational areas found</td>
                </tr>
              ) : safeAreas.map(a => {
                const parentZone = safeAllZones.find(z => z.id === a.zoneId);
                const parentTenant = safeTenants.find(t => t.id === a.tenantId);

                return (
                  <tr key={a.id}>
                    <td className="fw-bold text-white">
                      <div className="d-flex align-items-center gap-2">
                        <Layers className="text-cyan-400" size={18} />
                        {a.name}
                      </div>
                    </td>
                    <td className="text-slate-300">{parentZone ? parentZone.name : (a.zoneId ? `Zone #${a.zoneId}` : 'N/A')}</td>
                    <td className="text-slate-300">{parentTenant ? parentTenant.name : (a.tenantId ? `Org #${a.tenantId}` : 'N/A')}</td>
                    <td className="text-slate-400 fs-13">{a.description || 'N/A'}</td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => handleOpenEditArea(a)}
                          title="Edit Area Details"
                          className="p-1 border-0"
                        >
                          <Edit3 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDeleteArea(a.id, a.name)}
                          title="Deactivate Area"
                          className="p-1 border-0"
                        >
                          <Trash2 size={16} />
                        </Button>
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

export default LocationSection;
