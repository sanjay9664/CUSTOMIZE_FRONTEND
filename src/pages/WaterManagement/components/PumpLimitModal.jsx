import React from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { X, Zap, XCircle, ShieldCheck } from 'lucide-react';

/**
 * PumpLimitModal - Threshold setup modal for Auto-start and Auto-stop pressure limits
 */
const PumpLimitModal = ({
  show = false,
  pump = null,
  limitForm = { start: 0, stop: 0 },
  isSendingRules = false,
  actionFeedback = null,
  onClose,
  onChangeLimit,
  onSendRuleToEngine
}) => {
  if (!pump) return null;

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      contentClassName="bg-transparent border-0 shadow-2xl"
    >
      <Modal.Body className="p-4 scada-control-modal-body rounded-4 position-relative">
        <Button
          variant="link"
          className="position-absolute top-0 end-0 m-2 scada-modal-footer-link transition-all p-2 text-white"
          onClick={onClose}
        >
          <X size={20} />
        </Button>
        <div className="text-center mb-4 mt-2">
          <h5 className="fw-black text-info tracking-tighter uppercase fs-9">
            PUMP P{pump.id} THRESHOLD SETUP
          </h5>
        </div>
        <div className="scada-limit-card p-3 p-sm-4 rounded-4 mb-4">
          <Form.Group className="mb-4">
            <Form.Label className="fs-9 text-muted uppercase fw-bold mb-2">
              AUTO-START THRESHOLD (kg/cm²)
            </Form.Label>
            <div className="scada-limit-input-wrap rounded-3 p-2">
              <Form.Control
                type="number"
                step="0.1"
                value={limitForm.start}
                onChange={(e) => onChangeLimit && onChangeLimit({ ...limitForm, start: e.target.value })}
                className="bg-transparent border-0 scada-limit-input fw-bold fs-4 p-0 shadow-none text-white"
              />
            </div>
            <small className="text-secondary opacity-70 fs-10 mt-1 d-block">
              PUMP WILL START BELOW THIS PRESSURE
            </small>
          </Form.Group>
          <Form.Group>
            <Form.Label className="fs-9 text-muted uppercase fw-bold mb-2">
              AUTO-STOP THRESHOLD (kg/cm²)
            </Form.Label>
            <div className="scada-limit-input-wrap rounded-3 p-2">
              <Form.Control
                type="number"
                step="0.1"
                value={limitForm.stop}
                onChange={(e) => onChangeLimit && onChangeLimit({ ...limitForm, stop: e.target.value })}
                className="bg-transparent border-0 scada-limit-input fw-bold fs-4 p-0 shadow-none text-white"
              />
            </div>
            <small className="text-secondary opacity-70 fs-10 mt-1 d-block">
              PUMP WILL TERMINATE ABOVE THIS PRESSURE
            </small>
          </Form.Group>
        </div>
        <div className="d-flex flex-column gap-2 mt-4">
          <Button
            variant="primary"
            className="w-100 py-3 fw-black tracking-widest d-flex align-items-center justify-content-center gap-2 shadow-glow-blue border-0 text-white"
            style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
            disabled={isSendingRules}
            onClick={() => onSendRuleToEngine && onSendRuleToEngine('BOTH')}
          >
            {isSendingRules ? <Spinner size="sm" animation="border" className="me-2" /> : <Zap size={18} />}
            SYNC WITH RULE ENGINE
          </Button>
        </div>

        {actionFeedback && (
          <div
            className="action-success-overlay position-absolute top-50 start-50 translate-middle w-75 p-4 rounded-4 shadow-2xl text-center border-2 border-white d-flex flex-column align-items-center gap-2"
            style={{
              backgroundColor: actionFeedback.includes('FAILED') || actionFeedback.includes('NOT APPLIED') || actionFeedback.includes('DEVICE OFFLINE') ? '#7f1d1d' : '#064e3b',
              zIndex: 1000,
              boxShadow: actionFeedback.includes('FAILED') || actionFeedback.includes('NOT APPLIED') || actionFeedback.includes('DEVICE OFFLINE') ? '0 0 40px rgba(239, 68, 68, 0.4)' : '0 0 40px rgba(6, 78, 59, 0.4)'
            }}
          >
            <div className="bg-white rounded-circle p-2 mb-2">
              {actionFeedback.includes('FAILED') || actionFeedback.includes('NOT APPLIED') || actionFeedback.includes('DEVICE OFFLINE') ? (
                <XCircle size={40} className="text-danger" />
              ) : (
                <ShieldCheck size={40} style={{ color: '#059669' }} />
              )}
            </div>
            <h4 className="text-white fw-black mb-0 letter-spacing-2">{actionFeedback}</h4>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default React.memo(PumpLimitModal);
