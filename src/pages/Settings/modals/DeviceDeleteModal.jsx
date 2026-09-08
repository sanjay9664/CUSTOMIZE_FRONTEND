import React from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { AlertTriangle, Trash2, Cpu } from 'lucide-react';

const DeviceDeleteModal = ({
  show = false,
  onHide = () => {},
  device = null,
  sites = [],
  assets = [],
  onConfirm = () => {},
  submitting = false,
  error = null
}) => {
  if (!device) return null;

  const siteObj = sites.find(s => String(s.id) === String(device.siteId));
  const siteName = siteObj?.name || (device.siteId ? `Site #${device.siteId}` : 'Universal / Unassigned');

  const linkedAsset = assets.find(a => String(a.id) === String(device.assetId)) || (device.asset ? device.asset : null);

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="scada-delete-device-modal"
    >
      <style>{`
        .scada-delete-device-modal .modal-content {
          background-color: #0f172a;
          color: #f8fafc;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
        }
        body.light-mode .scada-delete-device-modal .modal-content {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #fca5a5 !important;
        }
        .scada-delete-device-modal .modal-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 24px;
        }
        body.light-mode .scada-delete-device-modal .modal-header {
          border-bottom-color: #e2e8f0 !important;
        }
        .scada-delete-device-modal .modal-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 24px;
        }
        body.light-mode .scada-delete-device-modal .modal-footer {
          border-top-color: #e2e8f0 !important;
        }
      `}</style>

      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold text-danger d-flex align-items-center gap-2">
          <AlertTriangle size={20} />
          <span>Decommission / Soft Delete Device</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {error && (
          <Alert variant="danger" className="py-2 fs-12 mb-3">
            {error}
          </Alert>
        )}

        <p className="fs-13 text-slate-200 mb-3">
          Are you sure you want to decommission and soft-delete device <strong>"{device.name}"</strong>?
        </p>

        <div className="p-3 mb-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-20 fs-12">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="text-muted">Device Name:</span>
            <strong className="text-slate-200">{device.name}</strong>
          </div>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="text-muted">Serial Number:</span>
            <span className="font-monospace text-info">{device.serialNumber || device.bmsDeviceId || 'N/A'}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="text-muted">Category:</span>
            <span className="text-slate-200">{device.category ? device.category.replace(/_/g, ' ') : 'ENERGY_METER'}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="text-muted">Site:</span>
            <span className="text-slate-200">{siteName}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Linked Asset:</span>
            <span className="text-slate-200">{linkedAsset ? linkedAsset.name : 'Unassigned'}</span>
          </div>
        </div>

        <p className="fs-12 text-muted mb-0">
          This operation will disable the device (<code className="text-danger">isActive = false</code>) and unassign active telemetry pipelines.
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onConfirm}
          disabled={submitting}
          className="d-flex align-items-center gap-1.5"
        >
          {submitting ? <Spinner animation="border" size="sm" /> : (
            <>
              <Trash2 size={14} />
              <span>Confirm Delete</span>
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeviceDeleteModal;
