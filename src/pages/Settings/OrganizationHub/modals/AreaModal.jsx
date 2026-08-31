import React from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { Grid, Layers, Building2 } from 'lucide-react';

const AreaModal = ({
  show,
  onHide,
  editingArea,
  areaForm,
  setAreaForm,
  tenants,
  zones,
  onSubmit,
  loading
}) => {
  const activeTenants = tenants.filter(t => t.status !== 'INACTIVE' && !t.deletedAt);
  const filteredZones = zones.filter(z => !areaForm.tenantId || z.tenantId === areaForm.tenantId);

  return (
    <Modal show={show} onHide={onHide} centered className="scada-modal">
      <Modal.Header closeButton className="bg-dark text-white border-secondary border-opacity-25 pb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 text-success">
            <Grid size={22} />
          </div>
          <div>
            <Modal.Title className="fs-5 fw-bold text-white mb-0">
              {editingArea ? 'Edit Area / Space' : 'Add Area / Space'}
            </Modal.Title>
            <span className="fs-12 text-slate-400 font-monospace">
              {editingArea ? `ID: ${editingArea.id}` : 'Create a specific physical or operational area inside a zone'}
            </span>
          </div>
        </div>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body className="bg-dark text-white p-4">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Building2 size={13} className="me-1" /> Organization
                </Form.Label>
                <Form.Select
                  value={areaForm.tenantId}
                  onChange={(e) => setAreaForm({ ...areaForm, tenantId: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                >
                  <option value="">Select Organization...</option>
                  {activeTenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Layers size={13} className="me-1" /> Parent Zone <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={areaForm.zoneId}
                  onChange={(e) => setAreaForm({ ...areaForm, zoneId: e.target.value })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                >
                  <option value="">Select Zone...</option>
                  {filteredZones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  Area Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Server Room A / Basement Floor"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  Description / Function
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Specific room occupancy, floor area or HVAC zone notes"
                  value={areaForm.description || ''}
                  onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 fs-13"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary border-opacity-25 px-4 py-3">
          <Button variant="outline-secondary" size="sm" onClick={onHide} className="px-3">
            Cancel
          </Button>
          <Button variant="success" size="sm" type="submit" disabled={loading} className="px-4 fw-semibold text-white">
            {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            {editingArea ? 'Update Area' : 'Create Area'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AreaModal;
