import React from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { Sliders } from 'lucide-react';

const FeaturesModal = ({
  show,
  onHide,
  selectedTenant,
  featuresForm,
  setFeaturesForm,
  onSubmit,
  loading
}) => {
  return (
    <Modal show={show} onHide={onHide} centered className="scada-modal">
      <Modal.Header closeButton className="bg-dark text-white border-secondary border-opacity-25 pb-3">
        <div className="d-flex align-items-center gap-2">
          <Sliders className="text-info" size={20} />
          <Modal.Title className="fs-5 fw-bold text-white mb-0">
            Feature Permissions: {selectedTenant?.name}
          </Modal.Title>
        </div>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body className="bg-dark text-white p-4 d-flex flex-column gap-3">
          <Form.Check
            type="switch"
            id="feature-alarm"
            label="Real-time Alarm Monitoring & Notification"
            checked={featuresForm.alarm}
            onChange={(e) => setFeaturesForm({ ...featuresForm, alarm: e.target.checked })}
            className="fs-14 fw-medium text-slate-200"
          />
          <Form.Check
            type="switch"
            id="feature-reports"
            label="Automated PDF & Analytics Reports"
            checked={featuresForm.reports}
            onChange={(e) => setFeaturesForm({ ...featuresForm, reports: e.target.checked })}
            className="fs-14 fw-medium text-slate-200"
          />
          <Form.Check
            type="switch"
            id="feature-dpr"
            label="Daily Performance Record (DPR) Logs"
            checked={featuresForm.dpr}
            onChange={(e) => setFeaturesForm({ ...featuresForm, dpr: e.target.checked })}
            className="fs-14 fw-medium text-slate-200"
          />
          <Form.Check
            type="switch"
            id="feature-telemetry"
            label="Live Sensor Telemetry Streaming"
            checked={featuresForm.telemetry}
            onChange={(e) => setFeaturesForm({ ...featuresForm, telemetry: e.target.checked })}
            className="fs-14 fw-medium text-slate-200"
          />
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary border-opacity-25 px-4 py-3">
          <Button variant="outline-secondary" size="sm" onClick={onHide} className="px-3">
            Cancel
          </Button>
          <Button variant="info" size="sm" type="submit" disabled={loading} className="px-4 fw-semibold text-dark">
            {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            Save Features
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default FeaturesModal;
