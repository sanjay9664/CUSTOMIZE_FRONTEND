import React, { useState } from 'react';
import { Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import { Zap, Thermometer, Gauge, Activity, Layers, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import ScadaCard from '../../components/ScadaCard';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';
import HierarchySelector from '../../components/HierarchySelector';

const TransformerOverview = () => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="fade-in p-3" style={{ background: 'var(--scada-bg)', color: 'var(--scada-text)', minHeight: '100vh' }}>
      <HierarchySelector
        moduleTitle="TRANSFORMER"
        accentColor="#fb923c"
        deviceCategory="ENERGY_METER"
        deviceLabel="TRANSFORMER"
        deviceBasePath="/transformer/device"
        icon={<Zap size={13} />}
        onDeviceSelect={(dev) => setSelectedDevice(dev)}
      />

      <div className="page-header d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <h2 className="mb-1 fw-bold text-uppercase" style={{ color: 'var(--scada-text)' }}>
            <Zap className="me-2 text-warning" size={26} />
            Transformer Master Command Page
          </h2>
          <p className="text-muted fs-8 mb-0">High-Voltage Substation, Distribution Transformers, Load & Oil Temperature Analytics.</p>
        </div>
        <PdfButton />
      </div>

      {/* VIEW TABS BAR */}
      <div className="d-flex align-items-center gap-2 mb-4 p-1 rounded-3" style={{ background: 'var(--scada-card, rgba(30, 41, 59, 0.5))', border: '1px solid var(--scada-border, rgba(255,255,255,0.08))' }}>
        {[
          { key: 'all', label: 'All Views Unified', icon: <Layers size={14} /> },
          { key: 'units', label: 'Transformer Units (T1 & T2)', icon: <Zap size={14} /> },
          { key: 'load', label: 'Load & Temp Monitoring', icon: <Thermometer size={14} /> },
          { key: 'quality', label: 'Power Quality & Harmonics', icon: <Activity size={14} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-2 fw-bold font-monospace fs-9 uppercase transition-all ${
              activeTab === tab.key 
                ? 'btn-warning text-dark shadow-sm' 
                : 'text-secondary border-0 bg-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TRANSFORMER UNITS ────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'units') && (
        <Row className="g-4 mb-4">
          <Col lg={6}>
            <Card className="scada-card border h-100 shadow-sm" style={{ background: 'var(--scada-card)', borderColor: 'var(--scada-border)' }}>
               <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h4 className="fw-bold mb-0 text-white">Transformer #1 (11kV / 415V)</h4>
                      <small className="text-secondary font-monospace">Rating: 1600 kVA (ONAN)</small>
                    </div>
                    <StatusBadge status="Running" />
                  </div>
                  
                  <Row className="text-center g-3 font-monospace mb-4">
                    <Col xs={4}>
                      <div className="p-3 rounded border" style={{ backgroundColor: 'var(--scada-input-bg)', borderColor: 'var(--scada-border)' }}>
                        <Zap className="text-info mb-2" size={24} />
                        <h5 className="mb-0 fw-bold text-cyan-400">11.2 kV</h5>
                        <small className="text-muted fs-10 uppercase">Incoming Voltage</small>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="p-3 rounded border" style={{ backgroundColor: 'var(--scada-input-bg)', borderColor: 'var(--scada-border)' }}>
                        <Thermometer className="text-warning mb-2" size={24} />
                        <h5 className="mb-0 fw-bold text-amber-400">62°C</h5>
                        <small className="text-muted fs-10 uppercase">Oil Temp (OTI)</small>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="p-3 rounded border" style={{ backgroundColor: 'var(--scada-input-bg)', borderColor: 'var(--scada-border)' }}>
                        <Activity className="text-success mb-2" size={24} />
                        <h5 className="mb-0 fw-bold text-emerald-400">98.4%</h5>
                        <small className="text-muted fs-10 uppercase">Efficiency</small>
                      </div>
                    </Col>
                  </Row>

                  <div className="p-3 rounded border mb-3" style={{ backgroundColor: 'var(--scada-input-bg)', borderColor: 'var(--scada-border)' }}>
                    <div className="d-flex justify-content-between mb-2 font-monospace">
                      <span className="text-muted fs-8">Load Distribution</span>
                      <span className="text-info fs-8 fw-bold">1240 kVA (77.5%)</span>
                    </div>
                    <ProgressBar now={77.5} variant="info" style={{ height: 10 }} />
                  </div>

                  <Row className="g-2 font-monospace fs-9">
                    <Col xs={6}>
                      <div className="p-2 rounded bg-black bg-opacity-30 border border-secondary border-opacity-25 d-flex justify-content-between">
                        <span className="text-secondary">Winding Temp (WTI):</span>
                        <strong className="text-warning">68°C</strong>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="p-2 rounded bg-black bg-opacity-30 border border-secondary border-opacity-25 d-flex justify-content-between">
                        <span className="text-secondary">OLTC Tap Position:</span>
                        <strong className="text-info">Tap #4</strong>
                      </div>
                    </Col>
                  </Row>
               </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="scada-card border h-100 shadow-sm" style={{ background: 'var(--scada-card)', borderColor: 'var(--scada-border)' }}>
               <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h4 className="fw-bold mb-0 text-white">Transformer #2 (11kV / 415V)</h4>
                      <small className="text-secondary font-monospace">Rating: 1600 kVA (ONAN)</small>
                    </div>
                    <StatusBadge status="Stopped" />
                  </div>
                  
                  <Row className="text-center g-3 font-monospace mb-4">
                    <Col xs={4}>
                      <div className="p-3 rounded border" style={{ backgroundColor: 'var(--scada-input-bg)', borderColor: 'var(--scada-border)' }}>
                        <Zap className="text-muted mb-2" size={24} />
                        <h5 className="mb-0 text-muted">0.0 kV</h5>
                        <small className="text-muted fs-10 uppercase">Incoming Voltage</small>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="p-3 rounded border" style={{ backgroundColor: 'var(--scada-input-bg)', borderColor: 'var(--scada-border)' }}>
                        <Thermometer className="text-muted mb-2" size={24} />
                        <h5 className="mb-0 text-muted">28°C</h5>
                        <small className="text-muted fs-10 uppercase">Oil Temp (OTI)</small>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="p-3 rounded border" style={{ backgroundColor: 'var(--scada-input-bg)', borderColor: 'var(--scada-border)' }}>
                        <Activity className="text-muted mb-2" size={24} />
                        <h5 className="mb-0 text-muted">--%</h5>
                        <small className="text-muted fs-10 uppercase">Efficiency</small>
                      </div>
                    </Col>
                  </Row>

                  <div className="p-3 rounded border mb-3" style={{ backgroundColor: 'var(--scada-input-bg)', borderColor: 'var(--scada-border)' }}>
                    <div className="d-flex justify-content-between mb-2 font-monospace">
                      <span className="text-muted fs-8">Load Distribution</span>
                      <span className="text-muted fs-8">Standby Mode (0 kVA)</span>
                    </div>
                    <ProgressBar now={0} variant="secondary" style={{ height: 10 }} />
                  </div>

                  <Row className="g-2 font-monospace fs-9">
                    <Col xs={6}>
                      <div className="p-2 rounded bg-black bg-opacity-30 border border-secondary border-opacity-25 d-flex justify-content-between">
                        <span className="text-secondary">Winding Temp (WTI):</span>
                        <strong className="text-muted">30°C</strong>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="p-2 rounded bg-black bg-opacity-30 border border-secondary border-opacity-25 d-flex justify-content-between">
                        <span className="text-secondary">OLTC Tap Position:</span>
                        <strong className="text-muted">Tap #1 (Neutral)</strong>
                      </div>
                    </Col>
                  </Row>
               </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── LOAD & TEMP MONITORING SECTION ────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'load') && (
        <div className="mb-4">
          <h5 className="fw-bold text-uppercase fs-6 mb-3 d-flex align-items-center" style={{ color: 'var(--scada-text)' }}>
            <Thermometer className="me-2 text-warning" size={20} />
            Thermal & Winding Temperature Monitoring
          </h5>
          <Row className="g-3">
            {[
              { title: 'OTI Alarm Threshold', val: '75°C', status: 'Normal', curr: '62°C', color: '#10b981' },
              { title: 'OTI Trip Threshold', val: '85°C', status: 'Normal', curr: '62°C', color: '#10b981' },
              { title: 'WTI Alarm Threshold', val: '80°C', status: 'Normal', curr: '68°C', color: '#f59e0b' },
              { title: 'Buchholz Relay Status', val: 'HEALTHY', status: 'No Gas', curr: 'OK', color: '#10b981' }
            ].map((item, idx) => (
              <Col md={3} sm={6} key={idx}>
                <div className="p-3 rounded border shadow-sm" style={{ backgroundColor: 'var(--scada-card)', borderColor: 'var(--scada-border)' }}>
                  <small className="text-muted d-block mb-1 font-monospace fs-10 uppercase">{item.title}</small>
                  <div className="d-flex justify-content-between align-items-end font-monospace">
                    <div>
                      <span className="fw-bold fs-4" style={{ color: item.color }}>{item.curr}</span>
                      <small className="text-muted d-block fs-11">Limit: {item.val}</small>
                    </div>
                    <Badge bg={item.status === 'Normal' || item.status === 'No Gas' ? 'success' : 'warning'} className="fs-9 mb-1">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* ── POWER QUALITY & HARMONICS ────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'quality') && (
        <div className="scada-card border p-4 shadow-sm" style={{ background: 'var(--scada-card)', borderColor: 'var(--scada-border)' }}>
          <h5 className="mb-4 fw-bold text-uppercase" style={{ color: 'var(--scada-text)' }}>
            <Activity className="me-2 text-info" size={20} />
            Power Quality & Harmonics Monitoring
          </h5>
          <Row className="g-4 font-monospace">
              {[
                  { label: 'Voltage THD (Total Harmonic Distortion)', value: '2.4%', status: 'Normal', desc: 'IEEE 519 Compliant (< 5%)' },
                  { label: 'Current THD', value: '3.1%', status: 'Optimal', desc: 'Acceptable range (< 8%)' },
                  { label: 'Power Factor (PF)', value: '0.98', status: 'Optimal', desc: 'Lagging (APFC Active)' },
                  { label: 'Phase Balance (V / I)', value: '1.2%', status: 'Normal', desc: 'Balanced Load' },
                  { label: 'Neutral Current', value: '0.8 A', status: 'Normal', desc: 'Low Leakage' },
                  { label: 'Frequency Stability', value: '50.02 Hz', status: 'Stable', desc: 'Grid In-Sync' }
              ].map((item, idx) => (
                  <Col md={4} sm={6} key={idx}>
                      <div className="p-3 rounded border" style={{ backgroundColor: 'var(--scada-input-bg)', borderColor: 'var(--scada-border)' }}>
                          <small className="text-muted d-block mb-1 uppercase fs-11">{item.label}</small>
                          <div className="d-flex justify-content-between align-items-end mb-1">
                              <span className="fw-bold fs-4 text-info">{item.value}</span>
                              <Badge bg="success" className="fs-9" style={{ marginBottom: 4 }}>{item.status}</Badge>
                          </div>
                          <small className="text-secondary d-block fs-11">{item.desc}</small>
                      </div>
                  </Col>
              ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default TransformerOverview;
