import React from 'react';
import { Modal, Row, Col, Badge, Button, Form, Spinner } from 'react-bootstrap';
import { Activity, Zap, X, ShieldCheck, XCircle, ToggleRight, ToggleLeft } from 'lucide-react';

/**
 * PumpControlModal - Interactive modal for switching pump mode and manual Start/Stop control
 */
const PumpControlModal = ({
  show = false,
  pump = null,
  isSendingCommand = false,
  actionFeedback = null,
  onClose,
  onPumpControl
}) => {
  if (!pump) return null;

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="lg"
      contentClassName="bg-transparent border-0 shadow-2xl custom-modal-wide"
    >
      <Modal.Body className="p-0 scada-control-modal-body overflow-hidden rounded-5">
        {/* Modal Header Bar */}
        <div className="p-4 text-center border-bottom scada-modal-header">
          <Badge bg="info" className="bg-opacity-10 text-info px-3 py-1 mb-2 border border-info border-opacity-25 rounded-pill">
            <div className="d-flex align-items-center gap-2 fs-12 fw-black tracking-widest uppercase">
              <Activity size={10} className="pulse-icon" /> Station Controller
            </div>
          </Badge>
          <h3 className="fw-black scada-modal-title mb-0 size-3 tracking-tighter">
            PUMP STATION <span className="text-info-scada">P{pump.id}</span>
          </h3>
        </div>

        <div className="p-4 px-5">
          {/* Mode Control Section */}
          <div className="d-flex justify-content-between align-items-center p-3 rounded-4 position-relative overflow-hidden mb-3 scada-mode-card">
            <div className="position-absolute top-0 start-0 h-100 w-1 bg-info bg-opacity-50"></div>
            <div>
              <div className="fw-black fs-10 tracking-widest text-secondary uppercase">System Mode</div>
              <div className="fw-bold fs-6 scada-mode-title">AUTO / MANUAL OVERRIDE</div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <span className={`fs-11 fw-black tracking-widest ${pump.mode === 'MANUAL' ? 'text-warning text-glow' : 'text-muted opacity-50'}`}>
                MANUAL
              </span>
              <div
                className="mode-toggle-switch"
                style={{ cursor: 'pointer' }}
                onClick={() => onPumpControl && onPumpControl(pump.id, { mode: pump.mode === 'AUTO' ? 'MANUAL' : 'AUTO' })}
              >
                {pump.mode === 'AUTO' ? (
                  <ToggleRight className="text-info" size={36} />
                ) : (
                  <ToggleLeft className="text-muted" size={36} />
                )}
              </div>
              <span className={`fs-11 fw-black tracking-widest ${pump.mode === 'AUTO' ? 'text-info text-glow' : 'text-muted opacity-50'}`}>
                AUTO
              </span>
            </div>
          </div>

          {/* Action Section */}
          <div className="mb-4">
            <Form.Label className="fs-11 text-secondary fw-black tracking-widest mb-2 uppercase text-center w-100">
              Pump Commutation Water Control
            </Form.Label>
            <Row className="g-3">
              <Col xs={6}>
                <button
                  type="button"
                  className="premium-action-btn open w-100"
                  disabled={pump.mode === 'AUTO' || isSendingCommand}
                  style={{ padding: '16px' }}
                  onClick={() => onPumpControl && onPumpControl(pump.id, { status: 'Running', hz: '50.0' })}
                >
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    {isSendingCommand && pump.status !== 'Running' ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      <Zap size={20} />
                    )}
                    <div>
                      <div className="btn-label fs-5">
                        {isSendingCommand && pump.status !== 'Running' ? 'SENDING...' : 'START PUMP'}
                      </div>
                    </div>
                  </div>
                </button>
              </Col>
              <Col xs={6}>
                <button
                  type="button"
                  className="premium-action-btn close w-100"
                  disabled={pump.mode === 'AUTO' || isSendingCommand}
                  style={{ padding: '16px' }}
                  onClick={() => onPumpControl && onPumpControl(pump.id, { status: 'Stopped', hz: '0.0' })}
                >
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    {isSendingCommand && pump.status !== 'Stopped' ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      <X size={20} />
                    )}
                    <div>
                      <div className="btn-label fs-5">
                        {isSendingCommand && pump.status !== 'Stopped' ? 'SENDING...' : 'STOP PUMP'}
                      </div>
                    </div>
                  </div>
                </button>
              </Col>
            </Row>
          </div>

          {actionFeedback && (
            <div
              className="action-success-overlay position-absolute top-50 start-50 translate-middle w-75 p-4 rounded-4 shadow-2xl text-center border-2 border-white d-flex flex-column align-items-center gap-2"
              style={{
                backgroundColor: actionFeedback.includes('DENIED') ? '#7f1d1d' : '#064e3b',
                zIndex: 1000,
                boxShadow: actionFeedback.includes('DENIED') ? '0 0 40px rgba(239, 68, 68, 0.4)' : '0 0 40px rgba(6, 78, 59, 0.4)'
              }}
            >
              <div className="bg-white rounded-circle p-2 mb-2">
                {actionFeedback.includes('DENIED') ? (
                  <XCircle size={40} className="text-danger" />
                ) : (
                  <ShieldCheck size={40} style={{ color: '#059669' }} />
                )}
              </div>
              <h4 className="text-white fw-black mb-0 letter-spacing-2">{actionFeedback}</h4>
            </div>
          )}
        </div>

        <div className="p-3 border-top scada-modal-footer d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 text-muted fs-12 fw-bold tracking-widest">
            <ShieldCheck size={14} className="text-success" /> SECURE STATION LINK
          </div>
          <Button
            variant="link"
            className="scada-modal-footer-link fs-12 fw-black text-decoration-none transition-all uppercase tracking-widest"
            onClick={onClose}
          >
            Dismiss Panel
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default React.memo(PumpControlModal);
