import React from 'react';
import { Form, Button, Card, Badge, Row, Col, Dropdown } from 'react-bootstrap';
import { Shield, RefreshCw, Cpu, Zap, Sparkles, Eye, Edit3, Sliders, Trash2, FileText } from 'lucide-react';

const RulesSection = ({
  handleSyncAllRulesFromSochiot = () => {},
  selectedDeviceForRulesTab = 1,
  setSelectedDeviceForRulesTab = () => {},
  handleFetchRulesTab = () => {},
  activeDevices = [],
  rulesList = [],
  handleUpdateSingleRuleField = () => {},
  handleOpenRuleDetails = () => {},
  handleOpenEditRuleModal = () => {},
  handleSyncSpecificRuleToSochiot = () => {},
  handleSyncSpecificRuleByFields = () => {},
  handleDeleteRuleItem = () => {}
}) => {
  const safeDevices = Array.isArray(activeDevices) ? activeDevices : [];
  const safeRules = Array.isArray(rulesList) ? rulesList : [];

  return (
    <div className="p-3">
      {/* Executive Rules Microservice Header Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <h5 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
            <Shield className="text-info" size={24} /> Device Automation Rules Engine
          </h5>
          <p className="text-slate-400 fs-13 mb-0">
            Device Condition Triggers, Threshold Interlocks, Consequence Actions &amp; Sochiot Synchronization
          </p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button variant="outline-success" size="sm" onClick={handleSyncAllRulesFromSochiot} className="fw-semibold rounded-3 d-flex align-items-center gap-1 shadow-sm px-3 py-1-5">
            <RefreshCw size={15} /> Sync All Engine Rules <Badge bg="success" className="text-dark fs-10 ms-1">POST /sync</Badge>
          </Button>
        </div>
      </div>

      {/* Top Executive Metrics & Target Device Selector Bar */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <div className="p-3 bg-dark-card rounded-3 border border-secondary border-opacity-25 shadow-sm d-flex align-items-center justify-content-between h-100">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2-5 rounded-3 bg-dark border border-info border-opacity-25">
                <Cpu size={22} className="text-info" />
              </div>
              <div>
                <div className="text-slate-400 fs-12 fw-semibold">Target Hardware Device:</div>
                <Form.Select
                  size="sm"
                  style={{ width: 280, backgroundColor: '#0f172a', color: '#38bdf8', borderColor: '#334155' }}
                  value={selectedDeviceForRulesTab}
                  onChange={(e) => {
                    setSelectedDeviceForRulesTab(Number(e.target.value));
                    handleFetchRulesTab(Number(e.target.value));
                  }}
                  className="fw-semibold rounded-3 mt-1"
                >
                  {safeDevices.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.category || 'BMS'})</option>
                  ))}
                </Form.Select>
              </div>
            </div>
          </div>
        </Col>

        <Col md={6}>
          <div className="p-3 bg-dark-card rounded-3 border border-secondary border-opacity-25 shadow-sm d-flex align-items-center justify-content-around h-100">
            <div className="d-flex align-items-center gap-3">
              <Shield className="text-info" size={26} />
              <div>
                <span className="text-slate-400 fs-12 d-block">Configured Rules</span>
                <h5 className="fw-bold text-white mb-0">{safeRules.length} Rules</h5>
              </div>
            </div>
            <div className="vr bg-secondary opacity-25" style={{ height: 40 }} />
            <div className="d-flex align-items-center gap-3">
              <Zap className="text-warning" size={26} />
              <div>
                <span className="text-slate-400 fs-12 d-block">Active Protection</span>
                <h5 className="fw-bold text-emerald-400 mb-0">{safeRules.filter(r => r.enabled !== false).length} Active</h5>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Rules Table */}
      <div className="table-responsive rounded-3 overflow-hidden" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <table className="table table-dark table-hover mb-0 align-middle fs-13">
          <thead style={{ background: '#090d16', color: '#94a3b8' }}>
            <tr className="text-uppercase fs-11 tracking-wider border-bottom border-secondary border-opacity-25">
              <th className="py-3 px-3">RULE NAME &amp; TRIGGER</th>
              <th className="py-3 px-3">CONDITION TYPE</th>
              <th className="py-3 px-3">THRESHOLD</th>
              <th className="py-3 px-3">CONSEQUENCE ACTION</th>
              <th className="py-3 px-3">STATUS</th>
              <th className="py-3 px-3 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {safeRules.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-slate-400">
                  <Shield size={32} className="mb-2 text-info opacity-50" />
                  <div>No automation rules defined for this device</div>
                </td>
              </tr>
            ) : safeRules.map(r => (
              <tr key={r.id} className="border-bottom border-secondary border-opacity-10">
                <td className="py-3 px-3">
                  <div className="fw-bold text-white fs-14">{r.name}</div>
                  <div className="text-slate-400 fs-11 font-monospace">FIELD: {r.fieldName || 'voltage'}</div>
                </td>
                <td className="py-3 px-3 font-monospace text-slate-300">
                  <Badge bg="info" className="text-dark px-2 py-1 fs-11">
                    {r.conditionType || 'GREATER_THAN'}
                  </Badge>
                </td>
                <td className="py-3 px-3 font-monospace text-warning fw-bold">
                  {r.threshold ?? 250}
                </td>
                <td className="py-3 px-3 text-slate-300 fs-12">
                  <Badge bg="warning" className="text-dark px-2 py-1 fs-11">
                    {r.consequenceType || 'TRIGGER_ALARM'}
                  </Badge>
                </td>
                <td className="py-3 px-3">
                  <Badge bg={r.enabled !== false ? 'success' : 'secondary'} className="px-2 py-1 fs-11">
                    {r.enabled !== false ? '● ACTIVE' : '○ DISABLED'}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-end">
                  <div className="d-flex align-items-center justify-content-end gap-2">
                    <Button
                      size="sm"
                      variant="outline-info"
                      onClick={() => handleOpenRuleDetails(r)}
                      title="Inspect Rule Specs"
                      className="p-1 border-0 rounded-circle text-info"
                    >
                      <Eye size={15} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => handleOpenEditRuleModal(r)}
                      title="Edit Rule"
                      className="p-1 border-0 rounded-circle text-slate-300"
                    >
                      <Edit3 size={15} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => handleSyncSpecificRuleToSochiot(r)}
                      title="Sync Rule to Sochiot"
                      className="p-1 border-0 rounded-circle text-success"
                    >
                      <RefreshCw size={15} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDeleteRuleItem(r.id, r.name)}
                      title="Delete Rule"
                      className="p-1 border-0 rounded-circle text-danger"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RulesSection;
