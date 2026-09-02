import React from 'react';
import { Form, Button, Badge, Card, Row, Col } from 'react-bootstrap';
import { Building, MapPin, Layers, Plus, Edit3, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const BuildingsTab = ({
  buildings,
  sites,
  selectedBuildingSiteId,
  setSelectedBuildingSiteId,
  searchTerm,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  isAdmin
}) => {
  const safeSearch = String(searchTerm || '').toLowerCase();
  const safeBuildings = Array.isArray(buildings) ? buildings : [];
  const safeSites = Array.isArray(sites) ? sites : [];
  const activeSites = safeSites.filter(s => s && s.status !== 'INACTIVE' && s.status !== 'DISABLED' && !s.deletedAt);

  const filtered = safeBuildings.filter(b => {
    if (!b) return false;
    const name = String(b.name || '').toLowerCase();
    const code = String(b.code || '').toLowerCase();
    const matchesSearch = !safeSearch || name.includes(safeSearch) || code.includes(safeSearch);
    const matchesSite = !selectedBuildingSiteId || selectedBuildingSiteId === 'ALL' ||
      String(b.siteId) === String(selectedBuildingSiteId);
    return matchesSearch && matchesSite;
  });

  return (
    <div className="d-flex flex-column gap-3">
      {/* Dynamic Physical Site Selector Header Bar */}
      <Card className="bg-dark bg-opacity-50 border-secondary border-opacity-25 shadow-sm p-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-3 bg-cyan bg-opacity-10 border border-cyan border-opacity-25 text-cyan">
              <MapPin size={18} />
            </div>
            <div>
              <div className="fs-12 text-uppercase fw-bold text-slate-400">Physical Site Filter</div>
              <div className="fs-13 text-white fw-semibold">
                {selectedBuildingSiteId === 'ALL'
                  ? 'All Sites Overview'
                  : sites.find(s => String(s.id) === String(selectedBuildingSiteId))?.name || 'Selected Site'}
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 260 }}>
            <Form.Select
              value={selectedBuildingSiteId}
              onChange={(e) => setSelectedBuildingSiteId(e.target.value)}
              className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
            >
              <option value="ALL">🏢 All Physical Sites ({activeSites.length})</option>
              {activeSites.map(s => (
                <option key={s.id} value={s.id}>
                  📍 {s.name} (Site #{s.id})
                </option>
              ))}
            </Form.Select>
            <Button
              variant="cyan"
              size="sm"
              onClick={onOpenCreate}
              className="d-flex align-items-center gap-1.5 px-3 py-2 text-dark fw-bold bg-cyan border-0 text-nowrap"
            >
              <Plus size={15} /> Add Building
            </Button>
          </div>
        </div>
      </Card>

      {/* Buildings Table */}
      <div className="table-responsive">
        <table className="table table-custom mb-0">
          <thead>
            <tr>
              <th>Building / Facility</th>
              <th>Parent Site</th>
              <th>Code</th>
              <th>Floors</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">
                  <Building size={36} className="mb-2 text-slate-500 opacity-50" />
                  <div>No buildings found for selected site context.</div>
                </td>
              </tr>
            ) : (
              filtered.map(b => {
                const matchedSite = sites.find(s => String(s.id) === String(b.siteId));
                const isInactive = b.isActive === false || b.deletedAt;
                return (
                  <tr key={b.id}>
                    <td className="fw-bold text-white">
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-1.5 rounded-2 bg-cyan bg-opacity-10 text-cyan">
                          <Building size={16} />
                        </div>
                        <div>
                          {b.name}
                          <div className="fs-11 text-muted font-monospace">{b.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-300 fs-13">
                      <div className="d-flex align-items-center gap-1">
                        <MapPin size={12} className="text-cyan" />
                        <span>{matchedSite ? matchedSite.name : `Site #${b.siteId}`}</span>
                      </div>
                    </td>
                    <td className="text-slate-300 fs-13 font-monospace">{b.code || 'N/A'}</td>
                    <td>
                      <Badge bg="dark" className="border border-secondary border-opacity-50 text-slate-300 font-monospace px-2 py-1">
                        <Layers size={11} className="me-1 text-warning" />
                        {b.totalFloors || 1} Floors
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={isInactive ? 'secondary' : 'success'} className="px-2 py-1">
                        {isInactive ? 'INACTIVE' : 'OPERATIONAL'}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1.5">
                        <Button
                          variant="outline-light"
                          size="sm"
                          title="Edit Building"
                          onClick={() => onOpenEdit(b)}
                          className="py-1"
                        >
                          <Edit3 size={13} />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            title="Delete Building"
                            onClick={() => onDelete(b.siteId, b.id)}
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
    </div>
  );
};

export default BuildingsTab;
