import React from 'react';
import { Form, Button, Badge } from 'react-bootstrap';
import { MapPin, Building2, Plus, Edit3, Trash2 } from 'lucide-react';

const BuildingSection = ({
  selectedBuildingSiteId = 'ALL',
  setSelectedBuildingSiteId = () => {},
  activeSites = [],
  filteredBuildings = [],
  handleOpenCreateBuilding = () => {},
  sites = [],
  handleOpenEditBuilding = () => {},
  handleDeleteBuilding = () => {}
}) => {
  const safeSites = Array.isArray(activeSites) ? activeSites : [];
  const safeBuildings = Array.isArray(filteredBuildings) ? filteredBuildings : [];

  return (
    <div>
      {/* Site Selector & Metric Summary Banner */}
      <div className="p-3 mb-3 border-bottom border-secondary border-opacity-25 d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(30, 41, 59, 0.6))' }}>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <MapPin className="text-info" size={18} />
            <span className="fw-bold fs-13 text-slate-200">Active Site:</span>
          </div>
          <Form.Select
            size="sm"
            value={selectedBuildingSiteId}
            onChange={(e) => setSelectedBuildingSiteId(e.target.value)}
            style={{ minWidth: '240px', maxWidth: '320px' }}
            className="bg-dark text-white border-info border-opacity-50 fw-semibold"
          >
            <option value="ALL">🏢 All Physical Sites ({safeSites.length})</option>
            {safeSites.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} (Site #{s.id}{s.city ? ` • ${s.city}` : ''})
              </option>
            ))}
          </Form.Select>
          {selectedBuildingSiteId !== 'ALL' && (
            <Badge bg="info" className="text-dark fw-bold px-2 py-1 fs-12">
              Site ID: {selectedBuildingSiteId}
            </Badge>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          <Badge bg="dark" className="border border-secondary px-3 py-2 fs-12 text-slate-300">
            Total Buildings: <span className="text-info fw-bold">{safeBuildings.length}</span>
          </Badge>
          <Badge bg="dark" className="border border-secondary px-3 py-2 fs-12 text-slate-300">
            Total Floors: <span className="text-emerald-400 fw-bold">{safeBuildings.reduce((acc, b) => acc + (parseInt(b.totalFloors, 10) || 1), 0)}</span>
          </Badge>
        </div>
      </div>

      {/* Buildings Table */}
      <div className="table-responsive">
        <table className="table table-custom mb-0">
          <thead>
            <tr>
              <th>Building Details</th>
              <th>Building Code</th>
              <th>Parent Site</th>
              <th>Total Floors</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeBuildings.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 empty-text fw-semibold">
                  No buildings found {selectedBuildingSiteId !== 'ALL' ? `for Site ID ${selectedBuildingSiteId}` : ''}
                </td>
              </tr>
            ) : safeBuildings.map(b => {
              const isInactive = b.isActive === false || b.deletedAt;

              return (
                <tr key={b.id}>
                  <td className="fw-bold text-white">
                    <div className="d-flex align-items-center gap-2">
                      <Building2 className="text-cyan-400" size={18} />
                      <div>
                        <div>{b.name}</div>
                        {b.description && <small className="text-muted fs-12 d-block">{b.description}</small>}
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-300 font-monospace fs-13">{b.code || `BLD-${b.id}`}</td>
                  <td className="text-slate-300 fs-13">
                    <span className="badge bg-secondary bg-opacity-25 text-info border border-info border-opacity-25">
                      {b.siteName || `Site #${b.siteId || 'N/A'}`}
                    </span>
                  </td>
                  <td className="text-slate-300 font-monospace fs-13 fw-semibold">
                    {b.totalFloors || 1} Floor(s)
                  </td>
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
                        onClick={() => handleOpenEditBuilding(b)}
                        title="Edit Building Details"
                        className="p-1 border-0"
                      >
                        <Edit3 size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteBuilding(b)}
                        title="Delete Building"
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
    </div>
  );
};

export default BuildingSection;
