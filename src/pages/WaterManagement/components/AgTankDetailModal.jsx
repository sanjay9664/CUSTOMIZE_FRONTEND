import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge, Spinner } from 'react-bootstrap';
import {
  Activity, ArrowDown, ArrowUp, Droplets, X, ShieldCheck, Zap,
  AlertCircle, CheckCircle2, Sliders, Layers
} from 'lucide-react';
import { formatWaterTelemetryValue } from '../utils/waterTelemetry';

/**
 * AgTankDetailModal - Props-Driven SCADA Control & Telemetry Breakdown Modal
 * 
 * @param {Object} props
 * @param {boolean} props.show - Modal visibility
 * @param {Function} props.onHide - Close modal callback
 * @param {Object} props.tank - Selected tank model
 * @param {Function} [props.onUpdateLimits] - Callback to apply automation limits (minLevel, maxLevel)
 * @param {Function} [props.onCommand] - Callback to push valve command ('OPEN' | 'CLOSE')
 * @param {Function} [props.onUpdateMode] - Callback to switch mode ('AUTO' | 'MANUAL' | 'BYPASS')
 */
const AgTankDetailModal = ({
  show,
  onHide,
  tank,
  onUpdateLimits,
  onCommand,
  onUpdateMode
}) => {
  if (!tank) return null;

  const [minLevel, setMinLevel] = useState(tank.minLevel ?? 20);
  const [maxLevel, setMaxLevel] = useState(tank.maxLevel ?? 90);
  const [activeMode, setActiveMode] = useState(tank.valveMode || 'AUTO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    if (tank) {
      setMinLevel(tank.minLevel ?? 20);
      setMaxLevel(tank.maxLevel ?? 90);
      setActiveMode(tank.valveMode || 'AUTO');
    }
  }, [tank]);

  const handleModeChange = async (newMode) => {
    setActiveMode(newMode);
    if (onUpdateMode) {
      onUpdateMode(tank, newMode);
    }
  };

  const handleApplyLimits = async () => {
    setIsSubmitting(true);
    setActionFeedback({ type: 'info', message: 'Applying limits...' });
    try {
      if (onUpdateLimits) {
        await onUpdateLimits(tank, minLevel, maxLevel);
      }
      setActionFeedback({ type: 'success', message: 'Threshold limits updated successfully' });
      setTimeout(() => setActionFeedback(null), 2000);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err?.message || 'Failed to update limits' });
      setTimeout(() => setActionFeedback(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValveCommand = async (commandState) => {
    setIsSubmitting(true);
    setActionFeedback({ type: 'info', message: `Sending ${commandState} command...` });
    try {
      if (onCommand) {
        await onCommand(tank, commandState);
      }
      setActionFeedback({ type: 'success', message: `Valve ${commandState === 'OPEN' ? 'Opened' : 'Closed'} successfully` });
      setTimeout(() => setActionFeedback(null), 2000);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err?.message || 'Command failed' });
      setTimeout(() => setActionFeedback(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOnline = Boolean(tank.isOnline);
  const rawFields = Array.isArray(tank.rawFields) ? tank.rawFields : [];

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      contentClassName="bg-transparent border-0 shadow-2xl custom-modal-wide"
    >
      <Modal.Body className="p-0 scada-control-modal-body overflow-hidden rounded-4" style={{ background: '#0b1120', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Modal Header */}
        <div className="p-4 border-bottom border-white border-opacity-10 d-flex justify-content-between align-items-center" style={{ background: 'rgba(15, 23, 42, 0.8)' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="p-2.5 rounded-3 bg-info bg-opacity-10 border border-info border-opacity-20 text-info">
              <Droplets size={22} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h4 className="fw-black text-white mb-0">{tank.name}</h4>
                <Badge bg={isOnline ? 'success' : 'secondary'} className="bg-opacity-20 text-uppercase fs-11 px-2.5 py-1">
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </Badge>
              </div>
              <div className="text-secondary fs-11 fw-bold">
                Device ID: {tank.id} • Category: {tank.category} {tank.buildingName ? `• ${tank.buildingName}` : ''}
              </div>
            </div>
          </div>
          <Button variant="link" className="text-secondary p-1 text-decoration-none hover-text-white" onClick={onHide}>
            <X size={22} />
          </Button>
        </div>

        <div className="p-4">
          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div
              className={`p-3 rounded-3 mb-3 d-flex align-items-center gap-2 fs-12 fw-bold ${
                actionFeedback.type === 'success'
                  ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                  : actionFeedback.type === 'error'
                  ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                  : 'bg-info bg-opacity-10 text-info border border-info border-opacity-25'
              }`}
            >
              {actionFeedback.type === 'success' && <CheckCircle2 size={16} />}
              {actionFeedback.type === 'error' && <AlertCircle size={16} />}
              {actionFeedback.type === 'info' && <Spinner size="sm" animation="border" />}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          {/* Control Strategy Section */}
          <div className="p-3 rounded-4 mb-4" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <div className="fw-bold fs-10 tracking-widest text-secondary uppercase">OPERATIONAL STRATEGY</div>
                <div className="fw-black fs-6 text-white">CONTROL OVERRIDE</div>
              </div>
              <div className="d-flex align-items-center gap-1 p-1 rounded-pill" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  { id: 'AUTO', label: 'AUTO' },
                  { id: 'MANUAL', label: 'MANUAL' },
                  { id: 'BYPASS', label: 'BYPASS' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeChange(mode.id)}
                    className={`btn btn-sm px-3 py-1 rounded-pill fw-bold fs-11 border-0 ${
                      activeMode === mode.id
                        ? 'btn-info text-white shadow-sm'
                        : 'btn-link text-secondary text-decoration-none'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Threshold Limit Inputs (Visible in AUTO mode) */}
            {activeMode === 'AUTO' && (
              <div className="mt-3 pt-3 border-top border-white border-opacity-5">
                <Row className="g-3">
                  <Col md={6}>
                    <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                      <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                        <ArrowDown size={14} className="text-info" />
                        <Form.Label className="fs-11 text-secondary fw-bold mb-0 text-uppercase">Lower Limit (Low Alert)</Form.Label>
                      </div>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <Form.Control
                          type="number"
                          value={minLevel}
                          onChange={(e) => setMinLevel(Number(e.target.value))}
                          className="bg-transparent border-0 text-center fw-black fs-3 text-info shadow-none p-0"
                          style={{ width: '80px' }}
                          min={0}
                          max={100}
                        />
                        <span className="text-info fw-black fs-4">%</span>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                        <ArrowUp size={14} className="text-danger" />
                        <Form.Label className="fs-11 text-secondary fw-bold mb-0 text-uppercase">Upper Limit (High Alert)</Form.Label>
                      </div>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <Form.Control
                          type="number"
                          value={maxLevel}
                          onChange={(e) => setMaxLevel(Number(e.target.value))}
                          className="bg-transparent border-0 text-center fw-black fs-3 text-danger shadow-none p-0"
                          style={{ width: '80px' }}
                          min={0}
                          max={100}
                        />
                        <span className="text-danger fw-black fs-4">%</span>
                      </div>
                    </div>
                  </Col>
                </Row>

                <Button
                  variant="info"
                  className="w-100 mt-3 py-2 fw-bold text-white d-flex align-items-center justify-content-center gap-2"
                  onClick={handleApplyLimits}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Spinner size="sm" animation="border" /> : <Zap size={16} />}
                  <span>{isSubmitting ? 'SYNCHRONIZING...' : 'APPLY LIMIT SETTINGS'}</span>
                </Button>
              </div>
            )}

            {/* Manual Controls (Visible in MANUAL mode) */}
            {activeMode === 'MANUAL' && (
              <div className="mt-3 pt-3 border-top border-white border-opacity-5">
                <Form.Label className="fs-11 text-secondary fw-bold mb-2 uppercase">Direct Valve Override</Form.Label>
                <Row className="g-3">
                  <Col xs={6}>
                    <Button
                      variant="outline-success"
                      className="w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleValveCommand('OPEN')}
                      disabled={isSubmitting || !isOnline}
                    >
                      <Droplets size={16} /> OPEN SUPPLY
                    </Button>
                  </Col>
                  <Col xs={6}>
                    <Button
                      variant="outline-danger"
                      className="w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleValveCommand('CLOSE')}
                      disabled={isSubmitting || !isOnline}
                    >
                      <X size={16} /> CLOSE SUPPLY
                    </Button>
                  </Col>
                </Row>
              </div>
            )}

            {/* Bypass Notice (Visible in BYPASS mode) */}
            {activeMode === 'BYPASS' && (
              <div className="mt-3 p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 text-warning d-flex align-items-center gap-2">
                <ShieldCheck size={20} />
                <div className="fs-11">
                  <div className="fw-bold">SYSTEM BYPASS ACTIVE</div>
                  <div className="opacity-75">Automation rules and manual overrides are suspended.</div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Template Telemetry Breakdown Grid */}
          <div className="mt-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <Activity size={16} className="text-info" />
                <h6 className="fw-bold text-white mb-0">Configured Parameters Telemetry Breakdown</h6>
              </div>
              <small className="text-secondary fs-10">
                {rawFields.length} Parameters Configured
              </small>
            </div>

            {rawFields.length === 0 ? (
              <div className="p-4 text-center rounded-3 bg-dark bg-opacity-30 border border-white border-opacity-5 text-secondary fs-12">
                No telemetry parameters configured in device template.
              </div>
            ) : (
              <div
                className="rounded-3 overflow-hidden border border-white border-opacity-10"
                style={{ maxHeight: '280px', overflowY: 'auto' }}
              >
                <table className="table table-dark table-hover mb-0 fs-12 align-middle">
                  <thead style={{ background: '#0f172a', position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr>
                      <th className="py-2.5 px-3 text-secondary text-uppercase fs-10">Parameter</th>
                      <th className="py-2.5 px-3 text-secondary text-uppercase fs-10 text-end">Current Reading</th>
                      <th className="py-2.5 px-3 text-secondary text-uppercase fs-10 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-secondary text-uppercase fs-10 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawFields.map((field, idx) => (
                      <tr key={field.id || field.fieldKey || idx}>
                        <td className="px-3 py-2 text-white fw-semibold">
                          {field.displayName}
                        </td>
                        <td className="px-3 py-2 text-end fw-black" style={{ color: field.status === 'alert' ? '#ef4444' : (field.status === 'warning' ? '#f59e0b' : '#38bdf8') }}>
                          {formatWaterTelemetryValue(field.value, 1)}
                        </td>
                        <td className="px-3 py-2 text-center text-secondary">
                          {field.unit || '--'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            bg={field.status === 'alert' ? 'danger' : (field.status === 'warning' ? 'warning' : 'success')}
                            className="bg-opacity-20 fs-10 px-2 py-0.5 text-uppercase"
                          >
                            {field.status === 'alert' ? 'ALARM' : (field.status === 'warning' ? 'WARN' : 'NORMAL')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-4 border-top border-white border-opacity-10 d-flex justify-content-between align-items-center" style={{ background: 'rgba(15, 23, 42, 0.8)' }}>
          <div className="d-flex align-items-center gap-1.5 text-success fs-11 fw-bold">
            <ShieldCheck size={14} /> BMS Verified Connection
          </div>
          <Button variant="outline-secondary" size="sm" className="px-4 rounded-pill fw-bold fs-11" onClick={onHide}>
            Dismiss
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default React.memo(AgTankDetailModal);
