import React from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { Award } from 'lucide-react';

const SubscriptionModal = ({
  show,
  onHide,
  selectedTenant,
  subForm,
  setSubForm,
  onSubmit,
  loading
}) => {
  return (
    <Modal show={show} onHide={onHide} centered className="scada-modal">
      <Modal.Header closeButton className="bg-dark text-white border-secondary border-opacity-25 pb-3">
        <div className="d-flex align-items-center gap-2">
          <Award className="text-warning" size={20} />
          <Modal.Title className="fs-5 fw-bold text-white mb-0">
            Subscription Plan: {selectedTenant?.name}
          </Modal.Title>
        </div>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body className="bg-dark text-white p-4 d-flex flex-column gap-3">
          <Form.Group>
            <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">Subscription Tier</Form.Label>
            <Form.Select
              value={subForm.subscription}
              onChange={(e) => setSubForm({ ...subForm, subscription: e.target.value })}
              className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
            >
              <option value="BASIC">BASIC</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="FREE">FREE</option>
              <option value="TRIAL">TRIAL</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">Billing Cycle</Form.Label>
            <Form.Select
              value={subForm.subscriptionPeriod}
              onChange={(e) => setSubForm({ ...subForm, subscriptionPeriod: e.target.value })}
              className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
            >
              <option value="MONTHLY">MONTHLY</option>
              <option value="QUARTERLY">QUARTERLY</option>
              <option value="YEARLY">YEARLY</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label className="fs-12 text-uppercase fw-bold text-slate-400">License Validity Date</Form.Label>
            <Form.Control
              type="date"
              value={subForm.licenseValidity}
              onChange={(e) => setSubForm({ ...subForm, licenseValidity: e.target.value })}
              className="bg-dark text-white border-secondary border-opacity-25 py-2 fs-13"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary border-opacity-25 px-4 py-3">
          <Button variant="outline-secondary" size="sm" onClick={onHide} className="px-3">
            Cancel
          </Button>
          <Button variant="warning" size="sm" type="submit" disabled={loading} className="px-4 fw-semibold text-dark">
            {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Update Plan
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SubscriptionModal;
