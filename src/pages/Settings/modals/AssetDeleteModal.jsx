import React from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { AlertTriangle, Trash2, Cpu, GitFork, ShieldAlert } from 'lucide-react';

const AssetDeleteModal = ({
  show = false,
  onHide = () => {},
  asset = null,
  childCount = 0,
  onConfirm = () => {},
  deleting = false,
  error = null
}) => {
  if (!asset) return null;

  return (
    <Modal
      show={show}
      onHide={deleting ? undefined : onHide}
      centered
      backdrop="static"
      className="scada-asset-delete-modal"
    >
      <style>{`
        .scada-asset-delete-modal .modal-content {
          background-color: #0f172a;
          border: 1px solid rgba(239, 68, 68, 0.35);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.8), 0 0 35px rgba(239, 68, 68, 0.15);
          border-radius: 14px;
          color: #f8fafc;
          overflow: hidden;
        }
        body.light-mode .scada-asset-delete-modal .modal-content {
          background-color: #ffffff;
          border-color: #ef4444;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.15);
          color: #0f172a;
        }
      `}</style>

      <Modal.Body className="p-4">
        <div className="d-flex align-items-start gap-3">
          <div
            className="p-3 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <AlertTriangle size={28} className="text-danger" />
          </div>

          <div className="flex-grow-1">
            <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
              <span>Delete Asset</span>
              <span className="badge bg-danger bg-opacity-20 text-danger fs-11 px-2 py-0.5 border border-danger border-opacity-30">
                DESTRUCTIVE
              </span>
            </h5>
            <p className="fs-13 text-muted mb-3">
              Are you sure you want to delete <strong className="text-white">{asset.name}</strong>?
            </p>

            <div
              className="p-3 rounded-3 mb-3"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="d-flex justify-content-between fs-12 mb-1.5">
                <span className="text-muted">Asset Name:</span>
                <span className="fw-semibold text-slate-200">{asset.name}</span>
              </div>
              <div className="d-flex justify-content-between fs-12 mb-1.5">
                <span className="text-muted">Asset Type:</span>
                <span className="badge bg-dark border border-secondary border-opacity-40 text-slate-300 fs-11">
                  {asset.assetType || 'EQUIPMENT'}
                </span>
              </div>
              <div className="d-flex justify-content-between fs-12">
                <span className="text-muted">Asset ID:</span>
                <span className="font-monospace text-info fs-11">{asset.id}</span>
              </div>
            </div>

            {childCount > 0 && (
              <div className="p-2.5 rounded-2 bg-warning bg-opacity-10 border border-warning border-opacity-25 d-flex align-items-start gap-2 mb-3">
                <GitFork size={16} className="text-warning flex-shrink-0 mt-0.5" />
                <div className="fs-12 text-warning">
                  <strong>Warning:</strong> This asset has <strong>{childCount}</strong> child asset(s) in its hierarchy subtree. Deleting it will recursively soft-delete all child assets.
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-2 bg-danger bg-opacity-10 border border-danger border-opacity-25 d-flex align-items-start gap-2 mb-3">
              <ShieldAlert size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <div className="fs-12 text-danger">
                <strong>API Safeguard:</strong> The server will automatically reject deletion if active devices are currently associated with this asset or its descendants.
              </div>
            </div>

            {error && (
              <Alert variant="danger" className="py-2 px-3 fs-12 mb-3">
                {error}
              </Alert>
            )}

            <div className="d-flex justify-content-end gap-2 pt-2 border-top border-secondary border-opacity-20">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={onHide}
                disabled={deleting}
                className="px-3 py-1.5 fs-12"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={onConfirm}
                disabled={deleting}
                className="d-flex align-items-center gap-1.5 px-3 py-1.5 fs-12"
              >
                {deleting ? (
                  <>
                    <Spinner animation="border" size="sm" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default AssetDeleteModal;
