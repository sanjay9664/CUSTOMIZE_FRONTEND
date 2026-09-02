import React from 'react';
import { Form, Button, Badge } from 'react-bootstrap';
import { Search, Cpu, Zap, Edit3, RefreshCw, Activity, Sliders, Shield, FileText, Trash2 } from 'lucide-react';

const DevicesTab = ({
  searchTerm = '',
  setSearchTerm = () => {},
  selectedBuildingFilter = 'ALL',
  setSelectedBuildingFilter = () => {},
  selectedAreaFilter = 'ALL',
  setSelectedAreaFilter = () => {},
  activeBuildings = [],
  activeAreas = [],
  filteredDevices = [],
  handleOpenRecentEvents = () => {},
  handleGlobalResyncEventStats = () => {},
  setRegisterStep = () => {},
  setRegisterForm = () => {},
  setShowRegisterDeviceModal = () => {},
  handleOpenEditDevice = () => {},
  handleOpenLiveModal = () => {},
  handleOpenThresholdsModal = () => {},
  handleOpenSettingsModal = () => {},
  handleOpenRulesModal = () => {},
  setSelectedDeviceForCommandsTab = () => {},
  setShowSendCommandModal = () => {},
  handleOpenAuditLog = () => {},
  setSelectedDeviceForAudit = () => {},
  handleDeleteDevice = () => {},
  fetchDevices = () => {},
  showToast = () => {},
  getAuthHeaders = () => {},
  API_BASE_URL = '/api'
}) => {
  const safeBuildings = Array.isArray(activeBuildings) ? activeBuildings : [];
  const safeAreas = Array.isArray(activeAreas) ? activeAreas : [];
  const safeDevices = Array.isArray(filteredDevices) ? filteredDevices : [];

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Filter Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-dark rounded border border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: 400 }}>
          <Search size={16} className="text-slate-400" />
          <Form.Control
            type="text"
            placeholder="Search devices by name, serial or BMS ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-dark text-white border-secondary border-opacity-25 fs-13"
          />
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Form.Select
            size="sm"
            value={selectedBuildingFilter}
            onChange={(e) => setSelectedBuildingFilter(e.target.value)}
            className="bg-dark text-white border-secondary border-opacity-25 fs-12"
            style={{ width: 160 }}
          >
            <option value="ALL">All Buildings</option>
            {safeBuildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Form.Select>

          <Form.Select
            size="sm"
            value={selectedAreaFilter}
            onChange={(e) => setSelectedAreaFilter(e.target.value)}
            className="bg-dark text-white border-secondary border-opacity-25 fs-12"
            style={{ width: 160 }}
          >
            <option value="ALL">All Areas</option>
            {safeAreas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Form.Select>

          <Button
            variant="outline-warning"
            size="sm"
            onClick={handleOpenRecentEvents}
            className="fw-semibold d-flex align-items-center gap-1.5 fs-12"
          >
            <Activity size={14} /> Recent Events
          </Button>

          <Button
            variant="outline-info"
            size="sm"
            onClick={handleGlobalResyncEventStats}
            className="fw-semibold d-flex align-items-center gap-1.5 fs-12"
          >
            <RefreshCw size={14} /> Resync Events
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setRegisterStep(1);
              setRegisterForm({
                siteId: 7,
                name: '',
                sochiotDeviceIds: '',
                category: 'ENERGY_METER',
                areaId: '',
                buildingId: '',
                floorNo: '',
                roomNo: '',
                energyGroupId: '',
                description: '',
                serialNumber: `SN-${Math.floor(100000 + Math.random() * 900000)}`,
                profileId: 'MFM-1 Profile',
                templateName: 'EnergyMeter_Template_V1'
              });
              setShowRegisterDeviceModal(true);
            }}
            className="fw-bold fs-12 text-white px-3 border-0"
            style={{ backgroundColor: '#2563eb', backgroundImage: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          >
            + Register Device
          </Button>
        </div>
      </div>

      {/* Devices List Table */}
      <div className="table-responsive rounded-3 overflow-hidden" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <table className="table table-dark table-hover mb-0 align-middle fs-13">
          <thead style={{ background: '#090d16', color: '#94a3b8' }}>
            <tr className="text-uppercase fs-11 tracking-wider border-bottom border-secondary border-opacity-25">
              <th className="py-3 px-3">DEVICE DETAILS</th>
              <th className="py-3 px-3">CATEGORY</th>
              <th className="py-3 px-3">SERIAL NUMBER</th>
              <th className="py-3 px-3">SOCHIOT ID(S)</th>
              <th className="py-3 px-3">LOCATION</th>
              <th className="py-3 px-3">STATUS</th>
              <th className="py-3 px-3 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {safeDevices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-slate-400">
                  <Cpu size={32} className="mb-2 text-info opacity-50" />
                  <div>No devices matching filter criteria</div>
                </td>
              </tr>
            ) : safeDevices.map(d => {
              const catUpper = String(d.category || 'ENERGY_METER').toUpperCase();
              let badgeBg = 'rgba(2, 132, 199, 0.14)';
              let badgeColor = '#0284c7';
              let badgeBorder = '1px solid rgba(56, 189, 248, 0.35)';

              if (catUpper.includes('ENERGY') || catUpper.includes('METER')) {
                badgeBg = 'rgba(37, 99, 235, 0.14)';
                badgeColor = '#2563eb';
                badgeBorder = '1px solid rgba(59, 130, 246, 0.35)';
              } else if (catUpper.includes('GENERATOR') || catUpper.includes('DIESEL') || catUpper.includes('DG')) {
                badgeBg = 'rgba(217, 119, 6, 0.14)';
                badgeColor = '#d97706';
                badgeBorder = '1px solid rgba(245, 158, 11, 0.35)';
              } else if (catUpper.includes('PUMP')) {
                badgeBg = 'rgba(2, 132, 199, 0.14)';
                badgeColor = '#0284c7';
                badgeBorder = '1px solid rgba(56, 189, 248, 0.35)';
              } else if (catUpper.includes('HVAC') || catUpper.includes('AIR') || catUpper.includes('COOL')) {
                badgeBg = 'rgba(13, 148, 136, 0.14)';
                badgeColor = '#0d9488';
                badgeBorder = '1px solid rgba(45, 212, 191, 0.35)';
              } else {
                badgeBg = 'rgba(100, 116, 139, 0.14)';
                badgeColor = '#64748b';
                badgeBorder = '1px solid rgba(148, 163, 184, 0.35)';
              }

              const rawIds = d.sochiotDeviceIds || d.sochiot_device_ids;
              const displayIds = Array.isArray(rawIds) ? rawIds.join(', ') : String(rawIds || '101');

              return (
                <tr key={d.id} className="border-bottom border-secondary border-opacity-10">
                  <td className="py-3 px-3">
                    <div className="fw-bold text-white fs-14">{d.name}</div>
                    <div className="text-slate-400 fs-11 font-monospace fw-medium">BMS ID: {d.bmsDeviceId || `BMS-${d.id}`}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span 
                      className="px-3 py-1 fs-11 font-monospace fw-bold rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        border: badgeBorder,
                        letterSpacing: '0.04em'
                      }}
                    >
                      <span className="rounded-circle" style={{ width: 6, height: 6, backgroundColor: badgeColor }}></span>
                      {catUpper}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-monospace text-slate-300 fw-medium">
                    {d.serialNumber || `SN-${d.id}`}
                  </td>
                  <td className="py-3 px-3 font-monospace text-info fw-semibold">
                    {displayIds}
                  </td>
                  <td className="py-3 px-3 text-slate-300 fs-12">
                    <div className="fw-medium">{d.buildingName || 'store-1'}</div>
                    <div className="text-slate-400 fs-10">{d.areaName || 'Main Area'}</div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge bg={d.isActive !== false ? 'success' : 'secondary'} className="px-2 py-1 fs-11 fw-semibold">
                      {d.isActive !== false ? '● ACTIVE' : '○ INACTIVE'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-end">
                    <div className="d-flex align-items-center justify-content-end gap-1">
                      {[
                        { icon: <Zap size={14} />,       color: '#38bdf8', hoverBg: 'rgba(56,189,248,0.12)',  label: 'Live Telemetry',    onClick: () => handleOpenLiveModal(d) },
                        { icon: <Sliders size={14} />,   color: '#f59e0b', hoverBg: 'rgba(245,158,11,0.12)',  label: 'Threshold Limits',  onClick: () => handleOpenThresholdsModal(d) },
                        { icon: <RefreshCw size={14} />, color: '#94a3b8', hoverBg: 'rgba(148,163,184,0.12)', label: 'Modbus Settings',   onClick: () => handleOpenSettingsModal(d) },
                        { icon: <Shield size={14} />,    color: '#818cf8', hoverBg: 'rgba(129,140,248,0.12)', label: 'Automation Rules',  onClick: () => handleOpenRulesModal(d) },
                        { icon: <Zap size={14} />,       color: '#34d399', hoverBg: 'rgba(52,211,153,0.12)',  label: 'Send Command',      onClick: () => { setSelectedDeviceForCommandsTab(d.id); setShowSendCommandModal(true); } },
                        { icon: <FileText size={14} />,  color: '#38bdf8', hoverBg: 'rgba(56,189,248,0.12)',  label: 'Audit Logs',        onClick: () => { setSelectedDeviceForAudit(d); handleOpenAuditLog(d); } },
                        { icon: <Edit3 size={14} />,     color: '#22d3ee', hoverBg: 'rgba(34,211,238,0.12)',  label: 'Edit Device',       onClick: () => handleOpenEditDevice(d) },
                        { icon: <Trash2 size={14} />,    color: '#f87171', hoverBg: 'rgba(248,113,113,0.12)', label: 'Delete Device',     onClick: () => handleDeleteDevice(d.id, d.name) },
                      ].map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={action.onClick}
                          title={action.label}
                          className="device-action-btn"
                          style={{ '--_icon-color': action.color, '--_hover-bg': action.hoverBg }}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DevicesTab;
