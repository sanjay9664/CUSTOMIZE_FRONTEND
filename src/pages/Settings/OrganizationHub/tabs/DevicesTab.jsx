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
              const categoryBadgeBg = d.category === 'ENERGY_METER' ? 'primary' : d.category === 'DIESEL_GENERATOR' ? 'warning' : d.category === 'HVAC' ? 'info' : 'secondary';
              const rawIds = d.sochiotDeviceIds || d.sochiot_device_ids;
              const displayIds = Array.isArray(rawIds) ? rawIds.join(', ') : String(rawIds || '101');

              return (
                <tr key={d.id} className="border-bottom border-secondary border-opacity-10">
                  <td className="py-3 px-3">
                    <div className="fw-bold text-white fs-14">{d.name}</div>
                    <div className="text-slate-400 fs-11 font-monospace">BMS ID: {d.bmsDeviceId || `BMS-${d.id}`}</div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge bg={categoryBadgeBg} className="px-2 py-1 fs-11 font-monospace">
                      {d.category || 'ENERGY_METER'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 font-monospace text-slate-300">
                    {d.serialNumber || `SN-${d.id}`}
                  </td>
                  <td className="py-3 px-3 font-monospace text-info">
                    {displayIds}
                  </td>
                  <td className="py-3 px-3 text-slate-300 fs-12">
                    <div>{d.buildingName || 'store-1'}</div>
                    <div className="text-slate-400 fs-10">{d.areaName || 'Main Area'}</div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge bg={d.isActive !== false ? 'success' : 'secondary'} className="px-2 py-1 fs-11">
                      {d.isActive !== false ? '● ACTIVE' : '○ INACTIVE'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-end">
                    <div className="d-flex align-items-center justify-content-end gap-1">
                      <Button
                        size="sm"
                        variant="outline-info"
                        onClick={() => handleOpenLiveModal(d)}
                        title="Live Telemetry Data"
                        className="p-1 border-0 rounded-circle text-info"
                      >
                        <Zap size={15} />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-warning"
                        onClick={() => handleOpenThresholdsModal(d)}
                        title="Threshold Limits"
                        className="p-1 border-0 rounded-circle text-warning"
                      >
                        <Sliders size={15} />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => handleOpenSettingsModal(d)}
                        title="Modbus Settings"
                        className="p-1 border-0 rounded-circle text-slate-300"
                      >
                        <RefreshCw size={15} />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleOpenRulesModal(d)}
                        title="Automation Rules"
                        className="p-1 border-0 rounded-circle text-primary"
                      >
                        <Shield size={15} />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => {
                          setSelectedDeviceForCommandsTab(d.id);
                          setShowSendCommandModal(true);
                        }}
                        title="Dispatch Command"
                        className="p-1 border-0 rounded-circle text-success"
                      >
                        <Zap size={15} />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-info"
                        onClick={() => {
                          setSelectedDeviceForAudit(d);
                          handleOpenAuditLog(d);
                        }}
                        title="Audit Logs"
                        className="p-1 border-0 rounded-circle text-info"
                      >
                        <FileText size={15} />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => handleOpenEditDevice(d)}
                        title="Edit Device Details"
                        className="p-1 border-0 rounded-circle text-slate-300"
                      >
                        <Edit3 size={15} />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteDevice(d.id, d.name)}
                        title="Delete Device"
                        className="p-1 border-0 rounded-circle text-danger"
                      >
                        <Trash2 size={15} />
                      </Button>
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
