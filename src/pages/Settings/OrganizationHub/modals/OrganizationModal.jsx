import React from 'react';
import { Modal, Form, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { Building2, Building, Mail, Phone, Globe, Shield, MapPin, Award } from 'lucide-react';

const OrganizationModal = ({
  show,
  onHide,
  editingTenant,
  tenantForm,
  setTenantForm,
  companies,
  onSubmit,
  loading
}) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="scada-modal">
      <Modal.Header closeButton className="bg-dark text-white border-secondary border-opacity-25 pb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-3 bg-info bg-opacity-10 border border-info border-opacity-25 text-info">
            <Building2 size={22} />
          </div>
          <div>
            <Modal.Title className="fs-5 fw-bold text-white mb-0">
              {editingTenant ? 'Edit Organization (Tenant)' : 'Add New Organization'}
            </Modal.Title>
            <span className="fs-12 text-slate-400 font-monospace">
              {editingTenant ? `ID: ${editingTenant.id}` : 'Create a tenant organization under a parent company'}
            </span>
          </div>
        </div>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body className="bg-dark text-white p-4">
          <Row className="g-3">
            {/* Parent Company Field: Locked Badge Card on Edit */}
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Building size={13} className="me-1 text-primary" /> Parent Company <span className="text-danger">*</span>
                </Form.Label>
                {editingTenant ? (
                  <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1.5 rounded-2 bg-success bg-opacity-10 text-success">
                        <Building size={16} />
                      </div>
                      <span className="fs-13 fw-semibold text-white">
                        {companies.find(c => String(c.id) === String(editingTenant.companyId))?.name || editingTenant.companyName || 'octiot'}
                      </span>
                    </div>
                    <Badge bg="dark" className="border border-secondary border-opacity-50 text-slate-400 font-monospace fs-11 px-2 py-0.5">
                      Locked
                    </Badge>
                  </div>
                ) : (
                  <Form.Select
                    value={tenantForm.companyId}
                    onChange={(e) => setTenantForm({ ...tenantForm, companyId: e.target.value })}
                    required
                    className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                  >
                    <option value="">Select Parent Company...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  Organization Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Acme Tech Park"
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Globe size={13} className="me-1 text-info" /> Server URL
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="https://client.iotcloud.com"
                  value={tenantForm.serverUrl}
                  onChange={(e) => setTenantForm({ ...tenantForm, serverUrl: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Mail size={13} className="me-1 text-warning" /> Contact Email <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="email"
                  placeholder="admin@tenant.com"
                  value={tenantForm.email}
                  onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Phone size={13} className="me-1 text-success" /> Phone Number
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="+91-XXXXXXXXXX"
                  value={tenantForm.phone}
                  onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Shield size={13} className="me-1 text-cyan" /> Sochiot Org ID
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="e.g. 101"
                  value={tenantForm.sochiotOrgId}
                  onChange={(e) => setTenantForm({ ...tenantForm, sochiotOrgId: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Award size={13} className="me-1 text-warning" /> Subscription Tier
                </Form.Label>
                <Form.Select
                  value={tenantForm.subscription || 'BASIC'}
                  onChange={(e) => setTenantForm({ ...tenantForm, subscription: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                >
                  <option value="BASIC">BASIC</option>
                  <option value="PREMIUM">PREMIUM</option>
                  <option value="FREE">FREE</option>
                  <option value="TRIAL">TRIAL</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <MapPin size={13} className="me-1 text-danger" /> Address / Location
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Building / Street / City address"
                  value={tenantForm.addressLine || ''}
                  onChange={(e) => setTenantForm({ ...tenantForm, addressLine: e.target.value })}
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
          <Button variant="info" size="sm" type="submit" disabled={loading} className="px-4 fw-semibold text-white">
            {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            {editingTenant ? 'Update Organization' : 'Create Organization'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default OrganizationModal;
