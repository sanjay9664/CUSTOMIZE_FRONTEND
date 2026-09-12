import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { Globe, Layers, Edit3, Trash2, Building2, MapPin, Activity, FileText, Settings } from 'lucide-react';

const LocationSection = ({
  activeTab,
  filteredZones = [],
  tenants = [],
  handleOpenEditZone = () => {},
  handleReactivateZone = () => {},
  handleDeleteZone = () => {},
  filteredAreas = [],
  zones = [],
  sites = [],
  handleOpenEditArea = () => {},
  handleDeleteArea = () => {}
}) => {
  const safeZones = Array.isArray(filteredZones) ? filteredZones : [];
  const safeAreas = Array.isArray(filteredAreas) ? filteredAreas : [];
  const safeTenants = Array.isArray(tenants) ? tenants : [];
  const safeAllZones = Array.isArray(zones) ? zones : [];
  const safeSites = Array.isArray(sites) ? sites : [];

  return (
    <div className="p-3 p-md-4">
      {/* TAB 3: ZONES MANAGEMENT */}
      {activeTab === 'zone' && (
        <div className="table-responsive rounded-3">
          <table className="table table-custom mb-0 align-middle">
            <thead>
              <tr>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Globe size={16} />
                    </div>
                    <span>ZONE NAME</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Building2 size={16} />
                    </div>
                    <span>ASSIGNED ORGANIZATION</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <MapPin size={16} />
                    </div>
                    <span>ASSIGNED SITE</span>
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
              {safeZones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 empty-text fw-semibold">No zones found</td>
                </tr>
              ) : safeZones.map(z => {
                const assignedTenant = safeTenants.find(t => String(t.id) === String(z.tenantId));
                const assignedSite = safeSites.find(s => String(s.id) === String(z.siteId));
                const isInactive = z.status === 'INACTIVE' || z.deletedAt;
                return (
                  <tr key={z.id} className="row-hover-effect">
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="cell-icon-badge bg-primary-subtle text-primary rounded-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, flexShrink: 0 }}>
                          <Globe size={16} />
                        </div>
                        <div>
                          <div className="fw-bold fs-14 text-heading">{z.name}</div>
                          {z.description && <small className="text-muted fs-12">{z.description}</small>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="cell-icon-badge bg-secondary-subtle text-secondary rounded-2 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, flexShrink: 0 }}>
                          <Building2 size={14} />
                        </div>
                        <span className="fs-13 text-body-secondary">{assignedTenant ? assignedTenant.name : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="cell-icon-badge bg-danger-subtle text-danger rounded-2 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, flexShrink: 0 }}>
                          <MapPin size={14} />
                        </div>
                        <span className="fs-13 text-body-secondary">{assignedSite ? assignedSite.name : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className={`status-pill d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-bold fs-12 ${isInactive ? 'bg-secondary-subtle text-secondary' : 'bg-success-subtle text-success'}`}>
                        <span className={`rounded-circle ${isInactive ? 'bg-secondary' : 'bg-success'}`} style={{ width: 7, height: 7 }} />
                        {isInactive ? 'INACTIVE' : 'ACTIVE'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button
                          onClick={() => handleOpenEditZone(z)}
                          title="Edit Zone Details"
                          className="btn-action-round btn-action-edit d-flex align-items-center justify-content-center border-0"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteZone(z.id, z.name)}
                          title="Delete Zone"
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

      {/* TAB 4: AREAS MANAGEMENT */}
      {activeTab === 'area' && (
        <div className="table-responsive rounded-3">
          <table className="table table-custom mb-0 align-middle">
            <thead>
              <tr>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Layers size={16} />
                    </div>
                    <span>AREA NAME</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Globe size={16} />
                    </div>
                    <span>ASSIGNED ZONE</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <Building2 size={16} />
                    </div>
                    <span>ASSIGNED ORGANIZATION</span>
                  </div>
                </th>
                <th className="py-3 px-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="header-icon-box bg-primary-subtle text-primary rounded-2 p-1.5 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                      <FileText size={16} />
                    </div>
                    <span>DESCRIPTION</span>
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
              {safeAreas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 empty-text fw-semibold">No operational areas found</td>
                </tr>
              ) : safeAreas.map(a => {
                const parentZone = safeAllZones.find(z => String(z.id) === String(a.zoneId));
                const parentTenant = safeTenants.find(t => String(t.id) === String(a.tenantId));

                return (
                  <tr key={a.id} className="row-hover-effect">
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="cell-icon-badge bg-primary-subtle text-primary rounded-2 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, flexShrink: 0 }}>
                          <Layers size={16} />
                        </div>
                        <span className="fw-bold fs-14 text-heading">{a.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="cell-icon-badge bg-secondary-subtle text-secondary rounded-2 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, flexShrink: 0 }}>
                          <Globe size={14} />
                        </div>
                        <span className="fs-13 text-body-secondary">{parentZone ? parentZone.name : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="cell-icon-badge bg-secondary-subtle text-secondary rounded-2 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, flexShrink: 0 }}>
                          <Building2 size={14} />
                        </div>
                        <span className="fs-13 text-body-secondary">{parentTenant ? parentTenant.name : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="fs-13 text-body-secondary text-truncate" style={{ maxWidth: 260 }}>{a.description || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-3 text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button
                          onClick={() => handleOpenEditArea(a)}
                          title="Edit Area Details"
                          className="btn-action-round btn-action-edit d-flex align-items-center justify-content-center border-0"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteArea(a.id, a.name)}
                          title="Delete Area"
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
    </div>
  );
};

export default LocationSection;
