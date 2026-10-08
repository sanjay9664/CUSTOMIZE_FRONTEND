import React from 'react';
import { Modal, Button, Badge, Row, Col, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  Droplets, Waves, Zap, Gauge, ArrowRight, ShieldCheck,
  AlertTriangle, Settings, Activity, Power, X
} from 'lucide-react';

const AssetInspectionModal = ({ show, onHide, asset }) => {
  const navigate = useNavigate();

  if (!asset) return null;

  const isAgTank = asset.type === 'AG_TANK' || asset.category === 'AG_TANK' || asset.sectorType !== undefined;
  const isUgTank = asset.type === 'UG_TANK' || asset.category === 'UG_TANK';
  const isPump = asset.type === 'PUMP' || asset.amp !== undefined;

  const isOnline = asset.isOnline !== false;
  const isRunning = asset.status === 'Running' || asset.status === 'running';

  const navigateToDedicatedPage = () => {
    onHide();
    if (isAgTank) {
      navigate('/water-management/ag-pump');
    } else {
      navigate('/water-management/ug-pump');
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      contentClassName="border border-secondary border-opacity-20 shadow-2xl rounded-4 overflow-hidden"
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <div
        className="modal-header border-bottom border-secondary border-opacity-15 px-4 py-3 d-flex justify-content-between align-items-center"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className="p-2.5 rounded-3"
            style={{
              backgroundColor: isAgTank ? 'rgba(56, 189, 248, 0.15)' : (isPump ? 'rgba(34, 197, 94, 0.15)' : 'rgba(129, 140, 248, 0.15)'),
              color: isAgTank ? '#38bdf8' : (isPump ? '#22c55e' : '#818cf8')
            }}
          >
            {isAgTank ? <Waves size={22} /> : (isPump ? <Zap size={22} /> : <Droplets size={22} />)}
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="modal-title text-white fw-black mb-0 fs-7">{asset.name}</h5>
              <Badge
                bg={isOnline ? 'success' : 'danger'}
                className="bg-opacity-20 fs-10 px-2 py-0.5 border border-opacity-30"
              >
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Badge>
              {isPump && (
                <Badge
                  bg={isRunning ? 'success' : 'secondary'}
                  className="bg-opacity-20 fs-10 px-2 py-0.5"
                >
                  {isRunning ? 'RUNNING' : 'STANDBY'}
                </Badge>
              )}
            </div>
            <small className="text-secondary fs-10">
              {isAgTank ? 'Above Ground Rooftop Storage Unit' : (isPump ? 'High-Pressure Booster Transfer Pump' : 'Underground Sump Reservoir')}
            </small>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-link text-secondary p-1"
          onClick={onHide}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="modal-body p-4 bg-dark bg-opacity-95 text-white">
        <Row className="g-3 mb-4">
          {/* Key Telemetry Metric 1 */}
          <Col md={4}>
            <div className="p-3 rounded-4 bg-dark bg-opacity-60 border border-secondary border-opacity-15 h-100">
              <span className="text-secondary fs-10 fw-bold uppercase d-block mb-1">
                {isPump ? 'OPERATING STATUS' : 'WATER LEVEL'}
              </span>
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-black text-info">
                  {isPump ? (isRunning ? 'RUNNING' : 'STOPPED') : `${asset.level || 0}%`}
                </span>
                {!isPump && <small className="text-secondary fs-10">Optimal</small>}
              </div>
              {!isPump && (
                <ProgressBar
                  now={asset.level || 0}
                  variant={asset.level > 85 ? 'warning' : (asset.level < 25 ? 'danger' : 'info')}
                  className="mt-2"
                  style={{ height: '6px' }}
                />
              )}
            </div>
          </Col>

          {/* Key Telemetry Metric 2 */}
          <Col md={4}>
            <div className="p-3 rounded-4 bg-dark bg-opacity-60 border border-secondary border-opacity-15 h-100">
              <span className="text-secondary fs-10 fw-bold uppercase d-block mb-1">
                {isPump ? 'MOTOR CURRENT DRAW' : 'STORAGE CAPACITY'}
              </span>
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-black text-warning">
                  {isPump ? `${Number(asset.amp || 0).toFixed(1)} A` : (asset.capacity ? `${asset.capacity.toLocaleString()} L` : '50,000 L')}
                </span>
              </div>
              <small className="text-secondary fs-10">
                {isPump ? 'Nominal Load: 15.0 A' : 'Gross Liquid Volume'}
              </small>
            </div>
          </Col>

          {/* Key Telemetry Metric 3 */}
          <Col md={4}>
            <div className="p-3 rounded-4 bg-dark bg-opacity-60 border border-secondary border-opacity-15 h-100">
              <span className="text-secondary fs-10 fw-bold uppercase d-block mb-1">
                {isPump ? 'DISCHARGE PRESSURE' : 'VALVE & AUTOMATION'}
              </span>
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-black text-success">
                  {isPump ? `${Number(asset.pressure || 12.2).toFixed(1)} BAR` : (asset.valveStatus || 'AUTO')}
                </span>
              </div>
              <small className="text-secondary fs-10">
                {isPump ? 'Station Header: 12.2 BAR' : 'Inlet Control: Motorized'}
              </small>
            </div>
          </Col>
        </Row>

        {/* Diagnostic Parameters Grid */}
        <h6 className="text-secondary fs-9 fw-bold uppercase letter-spacing-1 mb-2">
          Diagnostic Parameters & Health Check
        </h6>
        <div className="p-3 rounded-4 bg-dark bg-opacity-40 border border-secondary border-opacity-15 mb-4">
          <Row className="g-3 fs-9">
            <Col sm={6}>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10">
                <span className="text-secondary">Controller Link:</span>
                <span className="text-white fw-bold">Schneider Modicon M241 (PLC)</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10">
                <span className="text-secondary">Protocol:</span>
                <span className="text-info fw-bold">Modbus TCP / MQTT Gateway</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-secondary">Sensor Health:</span>
                <span className="text-success fw-bold d-flex align-items-center gap-1">
                  <ShieldCheck size={14} /> 100% Calibrated
                </span>
              </div>
            </Col>
            <Col sm={6}>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10">
                <span className="text-secondary">Low-Level Threshold:</span>
                <span className="text-warning fw-bold">{asset.minLevel || 20}%</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom border-secondary border-opacity-10">
                <span className="text-secondary">High-Level Threshold:</span>
                <span className="text-danger fw-bold">{asset.maxLevel || 90}%</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-secondary">Telemetry Latency:</span>
                <span className="text-white fw-bold">24 ms</span>
              </div>
            </Col>
          </Row>
        </div>

        {/* Quick Action Simulation Buttons */}
        <div className="d-flex justify-content-between align-items-center pt-2">
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="border-secondary border-opacity-25 text-secondary fs-9"
              onClick={onHide}
            >
              Close
            </Button>
          </div>

          <Button
            variant="info"
            size="sm"
            className="fw-bold fs-9 px-3 d-flex align-items-center gap-2"
            onClick={navigateToDedicatedPage}
          >
            <span>Open Full {isAgTank ? 'AG Tank Manager' : 'UG Station Manager'}</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(AssetInspectionModal);
