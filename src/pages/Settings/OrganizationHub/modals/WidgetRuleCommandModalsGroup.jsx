import React from 'react';
import { Modal, Form, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { Edit3, Eye, Terminal, Zap, Shield, Radio, FileText, BellRing } from 'lucide-react';

const WidgetRuleCommandModalsGroup = ({
  // Edit Widget Modal
  showEditWidgetModal,
  setShowEditWidgetModal,
  editingWidget,
  widgetForm,
  setWidgetForm,
  handleSaveWidget,

  // Edit Rule Modal
  showEditRuleModal,
  setShowEditRuleModal,
  editingRule,
  ruleForm,
  setRuleForm,
  handleSaveRuleItem,

  // Rule Details Modal
  showRuleDetailsModal,
  setShowRuleDetailsModal,
  inspectingRule,

  // Send Command Modal
  showSendCommandModal,
  setShowSendCommandModal,
  selectedDeviceForCommandsTab,
  activeDevices = [],
  devices = [],
  sendCommandFormData,
  setSendCommandFormData,
  handleExecuteSendCommand,

  // Command Details Modal
  showCommandDetailsModal,
  setShowCommandDetailsModal,
  inspectingCommand,

  // Resync Telemetry Modal
  showResyncModal,
  setShowResyncModal,
  resyncForm,
  setResyncForm,
  activeSites = [],
  sites = [],
  handleExecuteResync,

  // Report Modal
  showReportModal,
  setShowReportModal,
  reportForm,
  setReportForm,
  handleGenerateReport,

  // Alarm Modal
  showAlarmModal,
  setShowAlarmModal,
  alarmForm,
  setAlarmForm,
  handleTriggerAlarm,

  loading
}) => {
  const safeSites = Array.isArray(sites) && sites.length ? sites : Array.isArray(activeSites) ? activeSites : [];
  const safeDevices = Array.isArray(devices) && devices.length ? devices : Array.isArray(activeDevices) ? activeDevices : [];
  return (
    <>
      {/* 1. EDIT WIDGET MODAL */}
      <Modal show={showEditWidgetModal} onHide={() => setShowEditWidgetModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-info fs-16">
            <Edit3 size={18} /> Edit Widget: {editingWidget?.displayName || editingWidget?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveWidget}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Display Name *</Form.Label>
              <Form.Control
                type="text"
                required
                value={widgetForm.displayName}
                onChange={(e) => setWidgetForm({ ...widgetForm, displayName: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Widget Type</Form.Label>
              <Form.Select
                value={widgetForm.widgetType}
                onChange={(e) => setWidgetForm({ ...widgetForm, widgetType: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="GAUGE">GAUGE (Dial Gauge)</option>
                <option value="LINE_CHART">LINE_CHART (Time-Series Chart)</option>
                <option value="TOGGLE_SWITCH">TOGGLE_SWITCH (Switch)</option>
                <option value="STAT_CARD">STAT_CARD (Metric Card)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Display Order</Form.Label>
              <Form.Control
                type="number"
                value={widgetForm.displayOrder}
                onChange={(e) => setWidgetForm({ ...widgetForm, displayOrder: parseInt(e.target.value) || 1 })}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace"
              />
            </Form.Group>
            <Form.Group className="pt-2">
              <Form.Check
                type="switch"
                id="widget-active-switch"
                label="Widget Active Status (Show on Dashboard)"
                checked={widgetForm.isActive}
                onChange={(e) => setWidgetForm({ ...widgetForm, isActive: e.target.checked })}
                className="fw-semibold text-info fs-14"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowEditWidgetModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : 'Save Widget'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 2. EDIT RULE ITEM MODAL */}
      <Modal show={showEditRuleModal} onHide={() => setShowEditRuleModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-info fs-16">
            <Shield size={18} /> Edit Automation Rule: {editingRule?.name || editingRule?.title}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveRuleItem}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Rule Name *</Form.Label>
              <Form.Control
                type="text"
                required
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Metric Field Key</Form.Label>
              <Form.Control
                type="text"
                value={ruleForm.fieldName}
                onChange={(e) => setRuleForm({ ...ruleForm, fieldName: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Condition Expression</Form.Label>
              <Form.Select
                value={ruleForm.conditionType}
                onChange={(e) => setRuleForm({ ...ruleForm, conditionType: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="GREATER_THAN">GREATER THAN (&gt;)</option>
                <option value="LESS_THAN">LESS THAN (&lt;)</option>
                <option value="EQUALS">EQUALS (==)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Threshold Value</Form.Label>
              <Form.Control
                type="number"
                value={ruleForm.threshold}
                onChange={(e) => setRuleForm({ ...ruleForm, threshold: parseFloat(e.target.value) || 0 })}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace"
              />
            </Form.Group>
            <Form.Group className="pt-2">
              <Form.Check
                type="switch"
                id="rule-enabled-switch"
                label="Rule Active (Trigger Interlock Action)"
                checked={ruleForm.enabled}
                onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                className="fw-semibold text-info fs-14"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowEditRuleModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : 'Save Rule'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 3. RULE DETAILS INSPECT MODAL */}
      <Modal show={showRuleDetailsModal} onHide={() => setShowRuleDetailsModal(false)} centered size="lg" className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-info fs-16">
            <Eye size={18} /> Automation Rule Details (GET /rules/:ruleId)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {inspectingRule && (
            <div className="d-flex flex-column gap-3 font-monospace fs-13 text-slate-200">
              <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                <div className="text-info fw-bold mb-1">RULE IDENTIFIER: {inspectingRule.id}</div>
                <div className="text-white fw-bold fs-15">{inspectingRule.name || inspectingRule.title}</div>
              </div>
              <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                <span className="text-slate-400 fs-12 d-block mb-1">CONDITION EXPRESSION:</span>
                <div>IF field <span className="text-warning">{inspectingRule.fieldName || 'voltage'}</span> is {inspectingRule.conditionType || 'GREATER_THAN'} <span className="text-success fw-bold">{inspectingRule.threshold ?? 250}</span></div>
              </div>
              <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                <span className="text-slate-400 fs-12 d-block mb-1">CONSEQUENCE ACTION:</span>
                <Badge bg="outline" className="border border-warning text-warning fs-12">⚡ {inspectingRule.consequenceType || 'TRIGGER_ALARM_EVENT'}</Badge>
              </div>
              <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                <span className="text-slate-400 fs-12 d-block mb-1">ENABLED STATUS:</span>
                <Badge bg={inspectingRule.enabled !== false ? 'success' : 'secondary'} className="fs-12">
                  {inspectingRule.enabled !== false ? '● ACTIVE & PROTECTED' : '○ DISABLED'}
                </Badge>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="outline-light" size="sm" onClick={() => setShowRuleDetailsModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 4. SEND COMMAND MODAL */}
      <Modal show={showSendCommandModal} onHide={() => setShowSendCommandModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-warning fs-16">
            <Terminal size={20} /> Dispatch Hardware Command (POST /commands)
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleExecuteSendCommand}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Target Device *</Form.Label>
              <Form.Select
                value={selectedDeviceForCommandsTab}
                onChange={() => {}}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace fs-13"
              >
                {activeDevices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.category || 'BMS'})</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Field Key Parameter *</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. SET_PUMP_STATE, BREAKER_TRIP"
                value={sendCommandFormData.fieldKey}
                onChange={(e) => setSendCommandFormData({ ...sendCommandFormData, fieldKey: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace fs-13"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Command Register Value *</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. ON, OFF, 1, 0, 230"
                value={sendCommandFormData.commandValue}
                onChange={(e) => setSendCommandFormData({ ...sendCommandFormData, commandValue: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 font-monospace fs-13"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Execution Notes / Context</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Manual operator dispatch..."
                value={sendCommandFormData.notes}
                onChange={(e) => setSendCommandFormData({ ...sendCommandFormData, notes: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25 fs-13"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowSendCommandModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="fw-bold text-dark px-4">
              {loading ? <Spinner animation="border" size="sm" /> : '⚡ Dispatch Signal (POST)'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 5. COMMAND DETAILS INSPECT MODAL */}
      <Modal show={showCommandDetailsModal} onHide={() => setShowCommandDetailsModal(false)} centered size="lg" className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-info fs-16">
            <Terminal size={18} /> Command Execution Audit (GET /commands/:id)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {inspectingCommand && (
            <div className="d-flex flex-column gap-3 font-monospace fs-13 text-slate-200">
              <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                <div className="text-info fw-bold mb-1">COMMAND ID: {inspectingCommand.commandId || inspectingCommand.id}</div>
                <div className="text-warning fw-bold fs-16">FIELD KEY: {inspectingCommand.fieldKey || 'SET_PUMP_STATE'}</div>
              </div>
              <Row className="g-3">
                <Col md={6}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <span className="text-slate-400 fs-11">REGISTER VALUE:</span>
                    <div className="text-success fw-bold fs-16 mt-1">{inspectingCommand.commandValue || 'ON'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-3 bg-dark rounded border border-secondary border-opacity-25">
                    <span className="text-slate-400 fs-11">RESPONSE STATUS:</span>
                    <div className="mt-1">
                      <Badge bg={inspectingCommand.status === 'ACKNOWLEDGED' ? 'success' : 'info'} className="fs-12 px-2.5 py-1">
                        HTTP {inspectingCommand.responseCode || 200} {inspectingCommand.status || 'ACKNOWLEDGED'}
                      </Badge>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-secondary border-opacity-25">
          <Button variant="outline-light" size="sm" onClick={() => setShowCommandDetailsModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* 6. TELEMETRY RESYNC MODAL */}
      <Modal show={showResyncModal} onHide={() => setShowResyncModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Radio className="text-success" /> Resync Telemetry Data
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleExecuteResync}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Site *</Form.Label>
              <Form.Select
                value={resyncForm.siteId}
                onChange={(e) => setResyncForm({ ...resyncForm, siteId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                {safeSites.length === 0 ? (
                  <option value={7}>Site #7 - Main Campus</option>
                ) : safeSites.map(s => (
                  <option key={s.id} value={s.id}>Site #{s.id} - {s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Start Date *</Form.Label>
              <Form.Control
                type="date"
                value={resyncForm.startDate}
                onChange={(e) => setResyncForm({ ...resyncForm, startDate: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">End Date *</Form.Label>
              <Form.Control
                type="date"
                value={resyncForm.endDate}
                onChange={(e) => setResyncForm({ ...resyncForm, endDate: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowResyncModal(false)}>Cancel</Button>
            <Button variant="success" type="submit" disabled={loading} className="fw-semibold text-white">
              {loading ? <Spinner animation="border" size="sm" /> : '⚡ Execute Resync'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 7. REPORT GENERATOR MODAL */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <FileText className="text-info" /> Generate Async Report
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGenerateReport}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Report Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Daily Telemetry & DPR Report"
                value={reportForm.title}
                onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Report Type *</Form.Label>
              <Form.Select
                value={reportForm.reportType}
                onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="DAILY_DPR">DAILY_DPR (Daily Performance Report)</option>
                <option value="TELEMETRY_LOGS">TELEMETRY_LOGS (Sensor Telemetry Audit)</option>
                <option value="ALARM_SUMMARY">ALARM_SUMMARY (Alarm Events Audit)</option>
                <option value="DEVICE_HEALTH">DEVICE_HEALTH (Device Health Audit)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Target Site *</Form.Label>
              <Form.Select
                value={reportForm.siteId}
                onChange={(e) => setReportForm({ ...reportForm, siteId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                {safeSites.length === 0 ? (
                  <option value={7}>Site #7 - Main Campus</option>
                ) : safeSites.map(s => (
                  <option key={s.id} value={s.id}>Site #{s.id} - {s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Export Format *</Form.Label>
              <Form.Select
                value={reportForm.format}
                onChange={(e) => setReportForm({ ...reportForm, format: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="PDF">PDF Document (.pdf)</option>
                <option value="EXCEL">Excel Spreadsheet (.xlsx)</option>
                <option value="CSV">CSV Data Export (.csv)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowReportModal(false)}>Cancel</Button>
            <Button variant="info" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : '📄 Queue Async Report'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 8. ALARM TRIGGER MODAL */}
      <Modal show={showAlarmModal} onHide={() => setShowAlarmModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-secondary border-opacity-25">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <BellRing className="text-warning" /> Trigger Alarm Event
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTriggerAlarm}>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Select Target Device *</Form.Label>
              <Form.Select
                value={alarmForm.deviceId}
                onChange={(e) => setAlarmForm({ ...alarmForm, deviceId: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                {safeDevices.length === 0 ? (
                  <>
                    <option value="EM_LIVEWIZE_101">EM_LIVEWIZE_101 (Energy Meter)</option>
                    <option value="DG_SET_01">DG_SET_01 (Diesel Generator)</option>
                    <option value="CHILLER_PUMP_02">CHILLER_PUMP_02 (HVAC Pump)</option>
                  </>
                ) : safeDevices.map(d => (
                  <option key={d.id} value={d.name}>{d.name} ({d.category})</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Metric / Field Key *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. temperature, pressure, voltage_r"
                value={alarmForm.fieldKey}
                onChange={(e) => setAlarmForm({ ...alarmForm, fieldKey: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Trigger Threshold Value *</Form.Label>
              <Form.Control
                type="number"
                step="any"
                placeholder="e.g. 95.5"
                value={alarmForm.value}
                onChange={(e) => setAlarmForm({ ...alarmForm, value: e.target.value })}
                required
                className="bg-dark text-white border-secondary border-opacity-25"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="fs-13 fw-semibold text-slate-300">Severity Level *</Form.Label>
              <Form.Select
                value={alarmForm.severity}
                onChange={(e) => setAlarmForm({ ...alarmForm, severity: e.target.value })}
                className="bg-dark text-white border-secondary border-opacity-25"
              >
                <option value="CRITICAL">🔴 CRITICAL (Immediate Action)</option>
                <option value="WARNING">🟡 WARNING (Threshold Deviation)</option>
                <option value="INFO">🔵 INFO (System Advisory)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-secondary border-opacity-25">
            <Button variant="outline-secondary" onClick={() => setShowAlarmModal(false)}>Cancel</Button>
            <Button variant="warning" type="submit" disabled={loading} className="fw-semibold text-dark">
              {loading ? <Spinner animation="border" size="sm" /> : '🚨 Trigger Alarm Event'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default WidgetRuleCommandModalsGroup;
