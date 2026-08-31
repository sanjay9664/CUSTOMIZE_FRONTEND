import React from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { Layers, Building2 } from 'lucide-react';

const ZoneModal = ({
  show,
  onHide,
  editingZone,
  zoneForm,
  setZoneForm,
  tenants,
  onSubmit,
  loading
}) => {
  const activeTenants = tenants.filter(t => t.status !== 'INACTIVE' && !t.deletedAt);

  return (
    <Modal show={show} onHide={onHide} centered className="scada-modal">
      <Modal.Header closeButton className="bg-dark text-white border-secondary border-opacity-25 pb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-3 bg-purple bg-opacity-10 border border-purple border-opacity-25 text-purple">
            <Layers size={22} />
          </div>
          <div>
            <Modal.Title className="fs-5 fw-bold text-white mb-0">
              {editingZone ? 'Edit Zone' : 'Add New Zone'}
            </Modal.Title>
            <span className="fs-12 text-slate-400 font-monospace">
              {editingZone ? `ID: ${editingZone.id}` : 'Create a regional zone scoped under an organization'}
            </span>
          </div>
        </div>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body className="bg-dark text-white p-4">
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Building2 size={13} className="me-1" /> Organization (Tenant) <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={zoneForm.tenantId}
                  onChange={(e) => setZoneForm({ ...zoneForm, tenantId: e.target.value })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                >
                  <option value="">Select Organization...</option>
                  {activeTenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  Zone Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. North Zone / Tower Zone"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  Region / Description
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Delhi NCR / Floor 1-5"
                  value={zoneForm.region || ''}
                  onChange={(e) => setZoneForm({ ...zoneForm, region: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary border-opacity-25 px-4 py-3">
          <Button variant="outline-secondary" size="sm" onClick={onHide} className="px-3">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={loading} className="px-4 fw-semibold">
            {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            {editingZone ? 'Update Zone' : 'Create Zone'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ZoneModal;
