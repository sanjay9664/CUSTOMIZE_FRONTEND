import React from 'react';
import { Modal, Form, Button, Row, Col, Badge, Card, Spinner } from 'react-bootstrap';
import { Activity, Eye, Sliders, Shield, Cpu, Zap, FileText } from 'lucide-react';

const DeviceModalsGroup = ({
  // Thresholds Modal
  showThresholdsModal,
  setShowThresholdsModal,
  selectedDeviceForThresholds,
  thresholdsForm,
  setThresholdsForm,
  handleSaveThresholds,
  
  // Live Modal
  showLiveModal,
  setShowLiveModal,
  selectedDeviceForLive,
  liveLoading,
  liveData,

  // Settings Modal
  showSettingsModal,
  setShowSettingsModal,
  deviceSettingsForm,
  setDeviceSettingsForm,
  handleSaveSettings,

  // Rules Modal
  showRulesModal,
  setShowRulesModal,
  selectedDeviceForRules,
  deviceRulesForm,
  setDeviceRulesForm,
  handleSaveRules,

  // Edit Device Modal
  showEditDeviceModal,
  setShowEditDeviceModal,
  editingDeviceItem,
  editDeviceForm,
  setEditDeviceForm,
  handleSaveEditDevice,

  // Recent Events Modal
  showRecentEventsModal,
  setShowRecentEventsModal,
  recentEventsList = [],

  // Audit Log Modal
  showAuditLogModal,
  setShowAuditLogModal,
  selectedDeviceForAudit,
  auditLogList = [],

  loading
}) => {
  const safeEvents = Array.isArray(recentEventsList) ? recentEventsList : [];
  const safeAuditLogs = Array.isArray(auditLogList) ? auditLogList : [];

  return (
    <>
      {/* 1. MANAGE THRESHOLD VALUE LIMITS MODAL */}
      <Modal show={showThresholdsModal} onHide={() => setShowThresholdsModal(false)} size="lg" centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <div className="w-100 d-flex justify-content-between align-items-center">
            <Modal.Title className="fw-bold d-flex align-items-center gap-2 fs-16 text-warning">
              <Activity size={20} /> Manage Device Threshold Value Limits
            </Modal.Title>
            <Badge bg="dark" className="border border-warning text-warning fs-10 font-monospace">
              PATCH /sites/{selectedDeviceForThresholds?.siteId || 7}/devices/{selectedDeviceForThresholds?.id}/thresholds
            </Badge>
          </div>
        </Modal.Header>
        <Form onSubmit={handleSaveThresholds}>
          <Modal.Body className="d-flex flex-column gap-3">
            <div className="p-3 bg-dark-card rounded-3 border border-warning border-opacity-25">
              <div className="fw-bold text-white fs-14 mb-1">
                Configure Threshold Limits — {selectedDeviceForThresholds?.name}
              </div>
              <p className="text-slate-400 fs-12 mb-0">
                Set upper and lower threshold boundaries for automated alarm notifications and safety trip interlocks.
              </p>
            </div>

            {Object.keys(thresholdsForm).map((fieldKey, idx) => {
              const item = thresholdsForm[fieldKey];
              return (
                <Card key={idx} className="bg-dark border-secondary border-opacity-25 p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold text-info font-monospace fs-13">Metric Field: {fieldKey}</span>
                    <Badge bg="warning" className="text-dark fs-11 fw-bold">ACTIVE THRESHOLD RULE</Badge>
                  </div>

                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fs-11 fw-semibold text-warning">Warning High *</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.warningHigh ?? 250}
                          onChange={(e) => {
                            setThresholdsForm({
                              ...thresholdsForm,
                              [fieldKey]: { ...item, warningHigh: parseFloat(e.target.value) || 0 }
                            });
                          }}
                          className="bg-dark-card text-warning border-warning border-opacity-25 font-monospace fs-12"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fs-11 fw-semibold text-danger">Critical High *</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.criticalHigh ?? 260}
                          onChange={(e) => {
                            setThresholdsForm({
                              ...thresholdsForm,
                              [fieldKey]: { ...item, criticalHigh: parseFloat(e.target.value) || 0 }
                            });
                          }}
                          className="bg-dark-card text-danger border-danger border-opacity-25 font-monospace fs-12"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fs-11 fw-semibold text-info">Warning Low</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.warningLow ?? 210}
                          onChange={(e) => {
                            setThresholdsForm({
                              ...thresholdsForm,
                              [fieldKey]: { ...item, warningLow: parseFloat(e.target.value) || 0 }
                            });
                          }}
                          className="bg-dark-card text-info border-info border-opacity-25 font-monospace fs-12"
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="fs-11 fw-semibold text-slate-400">Critical Low</Form.Label>
                        <Form.Control
                          type="number"
                          value={item.criticalLow ?? 200}
                          onChange={(e) => {
                            setThresholdsForm({
                              ...thresholdsForm,
                              [fieldKey]: { ...item, criticalLow: parseFloat(e.target.value) || 0 }
                            });
                          }}
                          className="bg-dark-card text-slate-300 border-secondary border-opacity-25 font-monospace fs-12"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowThresholdsModal(false)}>Cancel</Button>
            <Button variant="warning" type="submit" disabled={loading} className="fw-bold text-dark px-4">
              {loading ? <Spinner animation="border" size="sm" /> : '⚡ Save Threshold Limits'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 2. LIVE FIELD VALUES MODAL */}
      <Modal show={showLiveModal} onHide={() => setShowLiveModal(false)} centered size="lg" className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Eye className="text-info" /> Live Telemetry &amp; Field Readings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {liveLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="info" />
              <p className="mt-2 text-slate-400">Fetching real-time data stream...</p>
            </div>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-dark rounded border border-secondary border-opacity-25">
                <div>
                  <h6 className="fw-bold text-white mb-0">{selectedDeviceForLive?.name}</h6>
                  <span className="text-slate-400 fs-12">BMS ID: {selectedDeviceForLive?.bmsDeviceId || 'N/A'}</span>
                </div>
                <Badge bg="success" className="px-3 py-2 fs-12">LIVE STREAMING</Badge>
              </div>
              <Row className="g-3">
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Voltage (Phase A)</div>
                    <div className="text-info fs-24 fw-bold mt-1">{liveData?.voltage || '230.4'} V</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Current</div>
                    <div className="text-warning fs-24 fw-bold mt-1">{liveData?.current || '12.8'} A</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Active Power</div>
                    <div className="text-success fs-24 fw-bold mt-1">{liveData?.powerKw || '2.94'} kW</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Frequency</div>
                    <div className="text-primary fs-20 fw-bold mt-1">{liveData?.frequency || '50.01'} Hz</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Temperature</div>
                    <div className="text-danger fs-20 fw-bold mt-1">{liveData?.temperature || '34.2'} °C</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <div className="text-slate-400 fs-12 fw-semibold">Device Status</div>
                    <div className="text-success fs-20 fw-bold mt-1">{liveData?.status || 'OPERATIONAL'}</div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="outline-light" onClick={() => setShowLiveModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 3. DEVICE SETTINGS & MAPPINGS MODAL */}
      <Modal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} centered size="lg" className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Sliders className="text-warning" /> Device Settings &amp; Modbus Field Mappings
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveSettings}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Modbus Slave ID</Form.Label>
                  <Form.Control
                    type="number"
                    value={deviceSettingsForm.slaveId}
                    onChange={(e) => setDeviceSettingsForm({ ...deviceSettingsForm, slaveId: parseInt(e.target.value) || 1 })}
                    className="bg-dark text-white border-secondary border-opacity-25"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fs-13 fw-semibold text-slate-300">Baud Rate</Form.Label>
                  <Form.Select
                    value={deviceSettingsForm.baudRate}
                    onChange={(e) => setDeviceSettingsForm({ ...deviceSettingsForm, baudRate: parseInt(e.target.value) || 9600 })}
                    className="bg-dark text-white border-secondary border-opacity-25"
                  >
                    <option value={4800}>4800</option>
                    <option value={9600}>9600</option>
                    <option value={19200}>19200</option>
                    <option value={115200}>115200</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Telemetry Sampling Interval (Seconds)</Form.Label>
              <Form.Control
                type="number"
                value={deviceSettingsForm.pollInterval}
                onChange={(e) => setDeviceSettingsForm({ ...deviceSettingsForm, pollInterval: parseInt(e.target.value) || 5 })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>

            <Form.Group className="pt-2">
              <Form.Check
                type="switch"
                id="enable-telemetry-streaming"
                label="Enable Real-Time Sochiot MQTT Telemetry Streaming"
                checked={deviceSettingsForm.enableTelemetry}
                onChange={(e) => setDeviceSettingsForm({ ...deviceSettingsForm, enableTelemetry: e.target.checked })}
                className="fw-semibold text-info fs-14"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
            <Button variant="warning" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : 'Save Device Settings'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 4. DEVICE AUTOMATION RULES MODAL */}
      <Modal show={showRulesModal} onHide={() => setShowRulesModal(false)} centered size="lg" className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Shield className="text-info" /> Device Automation Rules: {selectedDeviceForRules?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveRules}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Rule Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Overvoltage Protection Rule"
                value={deviceRulesForm.ruleName}
                onChange={(e) => setDeviceRulesForm({ ...deviceRulesForm, ruleName: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Trigger Metric Parameter</Form.Label>
              <Form.Select
                value={deviceRulesForm.conditionParam}
                onChange={(e) => setDeviceRulesForm({ ...deviceRulesForm, conditionParam: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="voltage">voltage (Volts)</option>
                <option value="current">current (Amperes)</option>
                <option value="powerKw">powerKw (Kilowatts)</option>
                <option value="frequency">frequency (Hertz)</option>
                <option value="temperature">temperature (Celsius)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Threshold Cutoff Limit</Form.Label>
              <Form.Control
                type="number"
                value={deviceRulesForm.thresholdValue}
                onChange={(e) => setDeviceRulesForm({ ...deviceRulesForm, thresholdValue: parseFloat(e.target.value) || 250 })}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace"
              />
            </Form.Group>
            <Form.Group className="pt-2">
              <Form.Check
                type="switch"
                id="enable-rule-trigger"
                label="Rule Active (Trigger Alarm & Send SCADA Signal on Threshold Exceeded)"
                checked={deviceRulesForm.enableRule}
                onChange={(e) => setDeviceRulesForm({ ...deviceRulesForm, enableRule: e.target.checked })}
                className="fw-semibold text-info fs-14"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowRulesModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : 'Save Rule Configuration'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 5. EDIT DEVICE DETAILS MODAL */}
      <Modal show={showEditDeviceModal} onHide={() => setShowEditDeviceModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Cpu className="text-info" /> Edit Device: {editingDeviceItem?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveEditDevice}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Device Name *</Form.Label>
              <Form.Control
                type="text"
                required
                value={editDeviceForm.name}
                onChange={(e) => setEditDeviceForm({ ...editDeviceForm, name: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Device Category</Form.Label>
              <Form.Select
                value={editDeviceForm.category}
                onChange={(e) => setEditDeviceForm({ ...editDeviceForm, category: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="ENERGY_METER">ENERGY_METER</option>
                <option value="DIESEL_GENERATOR">DIESEL_GENERATOR</option>
                <option value="UPS">UPS</option>
                <option value="HVAC">HVAC</option>
                <option value="WATER_PUMP">WATER_PUMP</option>
                <option value="ENVIRONMENT_SENSOR">ENVIRONMENT_SENSOR</option>
                <option value="OTHER">OTHER</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Serial Number</Form.Label>
              <Form.Control
                type="text"
                disabled
                value={editDeviceForm.serialNumber}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace"
                style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
              />
              <Form.Text className="text-muted fs-11 mt-1 d-block">
                Serial Number is immutable after device registration.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowEditDeviceModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 6. RECENT EVENTS MODAL */}
      <Modal show={showRecentEventsModal} onHide={() => setShowRecentEventsModal(false)} size="lg" centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-warning fs-16">
            ⚡ Recent Sochiot Device Events
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle fs-13">
              <thead style={{ background: '#050811', color: '#94a3b8' }}>
                <tr className="text-uppercase fs-11 tracking-wider border-bottom border-secondary border-opacity-25">
                  <th className="py-3 px-3">EVENT ID</th>
                  <th className="py-3 px-3">DEVICE ID</th>
                  <th className="py-3 px-3">TYPE</th>
                  <th className="py-3 px-3">SEVERITY</th>
                  <th className="py-3 px-3">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {safeEvents.map(ev => (
                  <tr key={ev.id} className="border-bottom border-secondary border-opacity-10">
                    <td className="py-3 px-3 font-monospace text-info">{ev.id}</td>
                    <td className="py-3 px-3 fw-bold text-white">{ev.deviceId}</td>
                    <td className="py-3 px-3">{ev.type}</td>
                    <td className="py-3 px-3">
                      <Badge bg={ev.severity === 'CRITICAL' ? 'danger' : 'warning'} className="px-2 py-1 fs-11">
                        {ev.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-400 fs-12">{ev.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="outline-light" size="sm" onClick={() => setShowRecentEventsModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 7. AUDIT LOG MODAL */}
      <Modal show={showAuditLogModal} onHide={() => setShowAuditLogModal(false)} size="lg" centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-info fs-16">
            <FileText size={18} /> Device Audit Action Logs — {selectedDeviceForAudit?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle fs-13">
              <thead style={{ background: '#050811', color: '#94a3b8' }}>
                <tr className="text-uppercase fs-11 tracking-wider border-bottom border-secondary border-opacity-25">
                  <th className="py-3 px-3">LOG ID</th>
                  <th className="py-3 px-3">ACTION</th>
                  <th className="py-3 px-3">USER / AGENT</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {safeAuditLogs.map(log => (
                  <tr key={log.id} className="border-bottom border-secondary border-opacity-10">
                    <td className="py-3 px-3 font-monospace text-info">{log.id}</td>
                    <td className="py-3 px-3 fw-bold text-white">{log.action}</td>
                    <td className="py-3 px-3 text-slate-300">{log.user}</td>
                    <td className="py-3 px-3">
                      <Badge bg="success" className="px-2 py-1 fs-11">{log.status}</Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-400 fs-12">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="outline-light" size="sm" onClick={() => setShowAuditLogModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DeviceModalsGroup;
