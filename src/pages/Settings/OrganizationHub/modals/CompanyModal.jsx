import React from 'react';
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { Building, Mail, Phone, MapPin } from 'lucide-react';

const CompanyModal = ({
  show,
  onHide,
  editingCompany,
  companyForm,
  setCompanyForm,
  onSubmit,
  loading
}) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="scada-modal">
      <Modal.Header closeButton className="bg-dark text-white border-secondary border-opacity-25 pb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 text-primary">
            <Building size={22} />
          </div>
          <div>
            <Modal.Title className="fs-5 fw-bold text-white mb-0">
              {editingCompany ? 'Edit Master Company' : 'Add Master Company'}
            </Modal.Title>
            <span className="fs-12 text-slate-400 font-monospace">
              {editingCompany ? `ID: ${editingCompany.id}` : 'Create a top-level parent company entity'}
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
                  Company Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Acme Global Corporation"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Mail size={13} className="me-1" /> Contact Email
                </Form.Label>
                <Form.Control
                  type="email"
                  placeholder="admin@company.com"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <Phone size={13} className="me-1" /> Phone Number
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="+91-XXXXXXXXXX"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13 font-monospace"
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">
                  <MapPin size={13} className="me-1" /> Corporate Address
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Headquarters location and address details"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
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
          <Button variant="primary" size="sm" type="submit" disabled={loading} className="px-4 fw-semibold">
            {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            {editingCompany ? 'Update Company' : 'Create Company'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CompanyModal;
