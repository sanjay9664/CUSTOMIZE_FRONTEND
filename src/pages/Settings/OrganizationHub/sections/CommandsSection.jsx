import React from 'react';
import { Form, Button, Card, Badge, Row, Col } from 'react-bootstrap';
import { Terminal, Plus, Cpu, CheckCircle2, Activity, Sparkles, Eye, Zap, FileText } from 'lucide-react';

const CommandsSection = ({
  setShowSendCommandModal = () => {},
  selectedDeviceForCommandsTab = 1,
  setSelectedDeviceForCommandsTab = () => {},
  handleFetchCommandHistory = () => {},
  activeDevices = [],
  commandsList = [],
  handleOpenCommandDetails = () => {},
  setSendCommandFormData = () => {}
}) => {
  const safeDevices = Array.isArray(activeDevices) ? activeDevices : [];
  const safeCommands = Array.isArray(commandsList) ? commandsList : [];

  return (
    <div className="p-3">
      {/* Ultra-Premium Cyber-Industrial SCADA Header Station */}
      <div className="p-4 rounded-3 border border-info border-opacity-30 shadow-lg mb-4 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.9))', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(56, 189, 248, 0.05)' }}>
        <div className="position-absolute top-0 start-0 w-100" style={{ height: 3, background: 'linear-gradient(90deg, #38bdf8, #10b981, #f59e0b, #38bdf8)' }} />
        
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 rounded-3 bg-dark border border-info border-opacity-50 shadow-sm" style={{ boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)' }}>
              <Terminal className="text-info" size={30} />
            </div>
            <div>
              <h4 className="fw-bold text-white mb-1 d-flex align-items-center gap-2 font-monospace">
                Hardware Commands &amp; Control Pipeline
              </h4>
              <p className="text-slate-400 fs-13 mb-0">
                Real-time Device Execution Signals, Field Key Writes, Modbus Registers &amp; Dispatch History
              </p>
            </div>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <Button variant="info" size="md" onClick={() => setShowSendCommandModal(true)} className="fw-bold text-dark rounded-3 d-flex align-items-center gap-2 shadow-lg px-4 py-2" style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)', border: 'none', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)' }}>
              <Plus size={18} /> Dispatch Hardware Command <Badge bg="dark" className="text-info fs-11 ms-1 font-monospace">POST /commands</Badge>
            </Button>
          </div>
        </div>

        <Row className="g-3 mt-3 pt-3 border-top border-secondary border-opacity-25 align-items-center">
          <Col md={5}>
            <div className="p-3 bg-dark rounded-3 border border-secondary border-opacity-30 d-flex align-items-center justify-content-between shadow-sm">
              <div className="d-flex align-items-center gap-3">
                <Cpu size={22} className="text-info" />
                <div>
                  <div className="text-slate-400 fs-11 font-monospace fw-bold text-uppercase">TARGET HARDWARE DEVICE:</div>
                  <Form.Select
                    size="sm"
                    style={{ width: 230, backgroundColor: '#070b14', color: '#38bdf8', borderColor: '#1e293b' }}
                    value={selectedDeviceForCommandsTab}
                    onChange={(e) => {
                      setSelectedDeviceForCommandsTab(Number(e.target.value));
                      handleFetchCommandHistory(Number(e.target.value));
                    }}
                    className="fw-bold rounded-2 mt-1 font-monospace fs-13"
                  >
                    {safeDevices.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.category || 'BMS'})</option>
                    ))}
                  </Form.Select>
                </div>
              </div>
              <Badge bg="outline" className="border border-success text-success fs-11 px-2.5 py-1 font-monospace">
                ● ONLINE (12ms)
              </Badge>
            </div>
          </Col>

          <Col md={7}>
            <div className="p-3 bg-dark rounded-3 border border-secondary border-opacity-30 d-flex align-items-center justify-content-around shadow-sm">
              <div className="d-flex align-items-center gap-2">
                <Activity size={18} className="text-info" />
                <div>
                  <span className="text-slate-400 fs-11 d-block font-monospace">TOTAL DISPATCHED</span>
                  <span className="fw-bold text-white fs-14 font-monospace">{safeCommands.length} Commands</span>
                </div>
              </div>
              <div className="vr bg-secondary opacity-25" style={{ height: 30 }} />
              <div className="d-flex align-items-center gap-2">
                <CheckCircle2 size={18} className="text-success" />
                <div>
                  <span className="text-slate-400 fs-11 d-block font-monospace">SUCCESS ACK</span>
                  <span className="fw-bold text-emerald-400 fs-14 font-monospace">{safeCommands.filter(c => c.status === 'SUCCESS' || c.status === 'SENT').length} ACK</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Commands Table */}
      <div className="table-responsive rounded-3 overflow-hidden" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <table className="table table-dark table-hover mb-0 align-middle fs-13">
          <thead style={{ background: '#090d16', color: '#94a3b8' }}>
            <tr className="text-uppercase fs-11 tracking-wider border-bottom border-secondary border-opacity-25">
              <th className="py-3 px-3">DISPATCH ID &amp; FIELD</th>
              <th className="py-3 px-3">PAYLOAD VALUE</th>
              <th className="py-3 px-3">EXECUTION STATUS</th>
              <th className="py-3 px-3">TIMESTAMP</th>
              <th className="py-3 px-3 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {safeCommands.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-5 text-slate-400">
                  <Terminal size={32} className="mb-2 text-info opacity-50" />
                  <div>No hardware command dispatch history for this device</div>
                </td>
              </tr>
            ) : safeCommands.map(cmd => (
              <tr key={cmd.id} className="border-bottom border-secondary border-opacity-10">
                <td className="py-3 px-3">
                  <div className="fw-bold text-white fs-14 font-monospace">{cmd.fieldKey}</div>
                  <div className="text-slate-400 fs-11 font-monospace">CMD ID: {cmd.id}</div>
                </td>
                <td className="py-3 px-3 font-monospace text-info fw-bold">
                  {String(cmd.commandValue ?? 'EXECUTE')}
                </td>
                <td className="py-3 px-3">
                  <Badge bg={cmd.status === 'SUCCESS' || cmd.status === 'SENT' ? 'success' : 'danger'} className="px-2 py-1 fs-11 font-monospace">
                    {cmd.status || 'SENT'}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-slate-400 fs-12 font-monospace">
                  {cmd.sentAt ? new Date(cmd.sentAt).toLocaleTimeString() : 'Just Now'}
                </td>
                <td className="py-3 px-3 text-end">
                  <Button
                    size="sm"
                    variant="outline-info"
                    onClick={() => handleOpenCommandDetails(cmd)}
                    title="Inspect Command Payload Specs"
                    className="p-1 border-0 rounded-circle text-info"
                  >
                    <Eye size={15} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommandsSection;
