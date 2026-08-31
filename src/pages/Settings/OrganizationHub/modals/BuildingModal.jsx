import React from 'react';
import { Modal, Form, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { Building, MapPin, Layers, FileText, CheckCircle2 } from 'lucide-react';

const BuildingModal = ({
  show,
  onHide,
  editingBuilding,
  buildingForm,
  setBuildingForm,
  sites,
  selectedBuildingSiteId,
  onSubmit,
  loading
}) => {
  const activeSites = sites.filter(s => s.status !== 'INACTIVE' && s.status !== 'DISABLED' && !s.deletedAt);
  const currentSiteName = sites.find(s => String(s.id) === String(editingBuilding?.siteId || selectedBuildingSiteId))?.name || 'Selected Site';

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="scada-modal">
      <Modal.Header closeButton className="bg-dark text-white border-secondary border-opacity-25 pb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-3 bg-cyan bg-opacity-10 border border-cyan border-opacity-25 text-cyan">
            <Building size={22} />
          </div>
          <div>
            <Modal.Title className="fs-5 fw-bold text-white mb-0">
              {editingBuilding ? 'Edit Building Profile' : 'Add Physical Building'}
            </Modal.Title>
            <span className="fs-12 text-slate-400 font-monospace">
              {editingBuilding ? `ID: ${editingBuilding.id}` : 'Provision building infrastructure scoped under physical site'}
            </span>
          </div>
        </div>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body className="bg-dark text-white p-4">
          <Row className="g-3">
            {/* Parent Site Field: Locked Badge Card on Edit */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <MapPin size={13} className="me-1 text-cyan" /> Physical Parent Site <span className="text-danger">*</span>
                </Form.Label>
                {editingBuilding ? (
                  <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1.5 rounded-2 bg-info bg-opacity-10 text-info">
                        <MapPin size={16} />
                      </div>
                      <span className="fs-13 fw-semibold text-white">
                        {currentSiteName}
                      </span>
                    </div>
                    <Badge bg="dark" className="border border-secondary border-opacity-50 text-slate-400 font-monospace fs-11 px-2 py-0.5">
                      Locked
                    </Badge>
                  </div>
                ) : (
                  <Form.Select
                    value={buildingForm.siteId}
                    onChange={(e) => setBuildingForm({ ...buildingForm, siteId: e.target.value })}
                    required
                    className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                  >
                    <option value="">Select Physical Parent Site...</option>
                    {activeSites.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Site #{s.id})</option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  Building Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Tower A / Executive Block"
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  Building Code / Identifier
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. BLD-TOW-01"
                  value={buildingForm.code || ''}
                  onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Layers size={13} className="me-1 text-warning" /> Total Floors <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="200"
                  value={buildingForm.totalFloors}
                  onChange={(e) => setBuildingForm({ ...buildingForm, totalFloors: Number(e.target.value) })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  Display Order
                </Form.Label>
                <Form.Control
                  type="number"
                  value={buildingForm.displayOrder || 0}
                  onChange={(e) => setBuildingForm({ ...buildingForm, displayOrder: Number(e.target.value) })}
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <FileText size={13} className="me-1 text-info" /> Description & Notes
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Additional facility details or occupancy notes"
                  value={buildingForm.description || ''}
                  onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <div className="p-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                <div>
                  <div className="fs-13 fw-semibold text-white d-flex align-items-center gap-1.5">
                    <CheckCircle2 size={15} className={buildingForm.isActive ? 'text-success' : 'text-slate-500'} />
                    Operational Status
                  </div>
                  <div className="fs-12 text-slate-400">Enable or disable telemetry polling for this structure</div>
                </div>
                <Form.Check
                  type="switch"
                  id="building-active-switch"
                  checked={buildingForm.isActive}
                  onChange={(e) => setBuildingForm({ ...buildingForm, isActive: e.target.checked })}
                  className="fs-5"
                />
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary border-opacity-25 px-4 py-3">
          <Button variant="outline-secondary" size="sm" onClick={onHide} className="px-3">
            Cancel
          </Button>
          <Button variant="cyan" size="sm" type="submit" disabled={loading} className="px-4 fw-semibold text-dark bg-cyan border-0">
            {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            {editingBuilding ? 'Update Building' : 'Create Building'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default BuildingModal;
