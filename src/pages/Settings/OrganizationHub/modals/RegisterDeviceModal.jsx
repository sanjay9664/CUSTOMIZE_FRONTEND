import React from 'react';
import { Modal, Form, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { Cpu, Sliders, Trash2 } from 'lucide-react';

const RegisterDeviceModal = ({
  show,
  onHide,
  registerStep,
  setRegisterStep,
  registerForm,
  setRegisterForm,
  sites,
  editingDevice,
  activeAreas,
  activeBuildings,
  dynamicTemplateFields,
  setDynamicTemplateFields,
  showToast,
  loading,
  setLoading,
  setDevices,
  setSelectedBuildingFilter,
  setSelectedAreaFilter,
  setSearchTerm,
  API_BASE_URL,
  getAuthHeaders
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="glass-modal"
    >
      <Modal.Body className="p-0 rounded-4 overflow-hidden" style={{ background: '#09090b', color: '#f4f4f5', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {/* Top Header Station */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom" style={{ borderColor: '#27272a', background: '#121214' }}>
          <div className="d-flex align-items-center gap-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onHide}
              className="rounded-circle p-2 border-0 text-slate-300"
              style={{ backgroundColor: '#27272a' }}
            >
              ←
            </Button>
            <div>
              <h5 className="fw-bold text-white mb-0 fs-18">Register New Device</h5>
              <span className="text-slate-400 fs-12">Add a new device to your infrastructure</span>
            </div>
          </div>

          {/* Stepper Bar */}
          <div className="d-flex align-items-center gap-4">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-12 text-white"
                style={{
                  width: 32, height: 32,
                  backgroundColor: registerStep === 1 ? '#2563eb' : '#10b981',
                  boxShadow: registerStep === 1 ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none'
                }}
              >
                {registerStep > 1 ? '✓' : '1'}
              </div>
              <div>
                <div className="fw-bold text-white fs-12">Device Info</div>
                <div className="text-slate-400 fs-10">Basic details &amp; location</div>
              </div>
            </div>

            <div style={{ width: 60, height: 2, backgroundColor: registerStep === 2 ? '#2563eb' : '#27272a' }} />

            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-12"
                style={{
                  width: 32, height: 32,
                  backgroundColor: registerStep === 2 ? '#2563eb' : '#27272a',
                  color: registerStep === 2 ? '#fff' : '#71717a',
                  boxShadow: registerStep === 2 ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none'
                }}
              >
                2
              </div>
              <div>
                <div className={`fw-bold fs-12 ${registerStep === 2 ? 'text-white' : 'text-slate-500'}`}>Template Settings</div>
                <div className="text-slate-400 fs-10">Event fields &amp; mapping</div>
              </div>
            </div>
          </div>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onHide}
            className="rounded-circle p-2 border-0 text-slate-400"
          >
            ✕
          </Button>
        </div>

        {/* Registration Form Content */}
        <div className="container-fluid p-4" style={{ maxWidth: 1100 }}>
          {registerStep === 1 && (
            <div className="d-flex flex-column gap-4">
              <h6 className="fw-bold fs-14 tracking-wider uppercase d-flex align-items-center gap-2 mb-2" style={{ color: '#38bdf8' }}>
                <Cpu size={18} /> Device Information
              </h6>

              <Row className="g-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">SITE</Form.Label>
                    <Form.Select
                      disabled={!!editingDevice}
                      value={registerForm.siteId}
                      onChange={(e) => setRegisterForm({ ...registerForm, siteId: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                      style={editingDevice ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                    >
                      <option value={7}>STORE-1</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Form.Select>
                    {editingDevice && (
                      <Form.Text className="text-muted fs-11 mt-1 d-block">
                        Site location cannot be edited after device registration.
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">DEVICE NAME *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Incomer-1 LT Panel"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                      className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">DEVICE CATEGORY</Form.Label>
                    <Form.Select
                      value={registerForm.category}
                      onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3 font-monospace"
                    >
                      <option value="ENERGY_METER">ENERGY_METER (Energy Meter)</option>
                      <option value="DIESEL_GENERATOR">DIESEL_GENERATOR (Diesel Generator)</option>
                      <option value="UPS">UPS (Uninterruptible Power Supply)</option>
                      <option value="HVAC">HVAC (Heating &amp; Air Conditioning)</option>
                      <option value="WATER_PUMP">WATER_PUMP (Water &amp; Hydro Pump)</option>
                      <option value="ENVIRONMENT_SENSOR">ENVIRONMENT_SENSOR (AQI &amp; Ambient)</option>
                      <option value="OTHER">OTHER (General Device)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">AREA (OPTIONAL)</Form.Label>
                    <Form.Select
                      value={registerForm.areaId}
                      onChange={(e) => setRegisterForm({ ...registerForm, areaId: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                    >
                      <option value="">No Area Selected</option>
                      {activeAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">BUILDING / BLOCK (OPTIONAL)</Form.Label>
                    <Form.Select
                      value={registerForm.buildingId}
                      onChange={(e) => setRegisterForm({ ...registerForm, buildingId: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                    >
                      <option value="">No Building Selected</option>
                      {activeBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">FLOOR NUMBER (OPTIONAL)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 3"
                      value={registerForm.floorNo}
                      onChange={(e) => setRegisterForm({ ...registerForm, floorNo: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">ROOM NUMBER (OPTIONAL)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 302"
                      value={registerForm.roomNo}
                      onChange={(e) => setRegisterForm({ ...registerForm, roomNo: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">ENERGY GROUP (OPTIONAL)</Form.Label>
                    <Form.Select
                      value={registerForm.energyGroupId}
                      onChange={(e) => setRegisterForm({ ...registerForm, energyGroupId: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 fs-13 py-2.5 rounded-3"
                    >
                      <option value="">No Energy Group Selected</option>
                      <option value="1">Substation Main Metering</option>
                      <option value="2">HVAC Chiller Loop</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wide">DESCRIPTION / LOCATION NOTES</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="e.g. Ground floor plant room, serves block A &amp; B..."
                      value={registerForm.description}
                      onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                      className="bg-dark text-white border-secondary border-opacity-25 fs-13 rounded-3"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}

          {registerStep === 2 && (
            <div className="d-flex flex-column gap-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold fs-14 tracking-wider uppercase text-warning d-flex align-items-center gap-2 mb-1" style={{ color: '#f97316' }}>
                    <Sliders size={18} /> Template Settings
                  </h6>
                  <span className="text-slate-400 fs-12">
                    Define the event fields this device will report. Each row maps a Sochiot field to a display name.
                  </span>
                </div>
                <Badge bg="dark" className="border border-warning text-warning px-3 py-2 fs-11 font-monospace">
                  {dynamicTemplateFields.length} FIELD{dynamicTemplateFields.length !== 1 ? 'S' : ''}
                </Badge>
              </div>

              <div className="table-responsive rounded-3 overflow-hidden" style={{ background: '#121214', border: '1px solid #27272a' }}>
                <table className="table table-dark mb-0 align-middle fs-12">
                  <thead style={{ background: '#18181b', color: '#a1a1aa' }}>
                    <tr className="uppercase fs-10 tracking-wider">
                      <th className="py-3 px-3" style={{ width: '20%' }}>DEVICE ID</th>
                      <th className="py-3 px-3" style={{ width: '22%' }}>MODULE ID</th>
                      <th className="py-3 px-3" style={{ width: '22%' }}>EVENT FIELD</th>
                      <th className="py-3 px-3" style={{ width: '22%' }}>DISPLAY NAME</th>
                      <th className="py-3 px-3" style={{ width: '14%' }}>THRESHOLD VALUE</th>
                      <th className="py-3 px-2 text-center" style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicTemplateFields.map((f, idx) => (
                      <tr key={idx} className="border-bottom border-secondary border-opacity-10">
                        <td className="p-2">
                          <Form.Select
                            size="sm"
                            value={f.deviceId}
                            onChange={(e) => {
                              const copy = [...dynamicTemplateFields];
                              copy[idx].deviceId = e.target.value;
                              setDynamicTemplateFields(copy);
                            }}
                            className="bg-dark text-slate-200 border-secondary border-opacity-25 fs-12"
                          >
                            <option value="101">Select Device</option>
                            <option value="101">101 ({registerForm.name || 'Device'})</option>
                          </Form.Select>
                        </td>
                        <td className="p-2">
                          <Form.Select
                            size="sm"
                            value={f.moduleId}
                            onChange={(e) => {
                              const copy = [...dynamicTemplateFields];
                              copy[idx].moduleId = e.target.value;
                              setDynamicTemplateFields(copy);
                            }}
                            className="bg-dark text-slate-200 border-secondary border-opacity-25 fs-12"
                          >
                            <option value="4583">Select Module</option>
                            <option value="4583">4583 - Main Incomer</option>
                            <option value="4584">4584 - Chiller Unit</option>
                          </Form.Select>
                        </td>
                        <td className="p-2">
                          <Form.Control
                            size="sm"
                            type="text"
                            placeholder="Type or Select Field"
                            value={f.sochiotFieldName}
                            onChange={(e) => {
                              const copy = [...dynamicTemplateFields];
                              copy[idx].sochiotFieldName = e.target.value;
                              setDynamicTemplateFields(copy);
                            }}
                            className="bg-dark text-white border-secondary border-opacity-25 fs-12 font-monospace"
                          />
                        </td>
                        <td className="p-2">
                          <Form.Control
                            size="sm"
                            type="text"
                            placeholder="e.g. Voltage R"
                            value={f.displayName}
                            onChange={(e) => {
                              const copy = [...dynamicTemplateFields];
                              copy[idx].displayName = e.target.value;
                              setDynamicTemplateFields(copy);
                            }}
                            className="bg-dark text-white border-secondary border-opacity-25 fs-12"
                          />
                        </td>
                        <td className="p-2">
                          <div className="d-flex align-items-center gap-1">
                            <Form.Control
                              size="sm"
                              type="number"
                              placeholder="Warn High (250)"
                              value={f.warningHigh ?? 250}
                              onChange={(e) => {
                                const copy = [...dynamicTemplateFields];
                                copy[idx].warningHigh = parseInt(e.target.value) || 250;
                                copy[idx].thresholdValue = e.target.value;
                                setDynamicTemplateFields(copy);
                              }}
                              className="bg-dark text-warning border-secondary border-opacity-25 fs-11 font-monospace"
                              style={{ width: 85 }}
                            />
                            <Form.Control
                              size="sm"
                              type="number"
                              placeholder="Crit High (260)"
                              value={f.criticalHigh ?? 260}
                              onChange={(e) => {
                                const copy = [...dynamicTemplateFields];
                                copy[idx].criticalHigh = parseInt(e.target.value) || 260;
                                setDynamicTemplateFields(copy);
                              }}
                              className="bg-dark text-danger border-secondary border-opacity-25 fs-11 font-monospace"
                              style={{ width: 85 }}
                            />
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setDynamicTemplateFields(dynamicTemplateFields.filter((_, i) => i !== idx));
                            }}
                            className="p-1 border-0 text-danger rounded-circle"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add Field Button */}
                <div className="p-3 text-center border-top border-secondary border-opacity-25">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setDynamicTemplateFields([
                        ...dynamicTemplateFields,
                        {
                          deviceId: registerForm.sochiotDeviceIds || '101',
                          moduleId: '4583',
                          sochiotFieldName: '',
                          displayName: '',
                          thresholdValue: '240',
                          dataType: 'INTEGER',
                          unit: 'V',
                          isCommand: false,
                          graphable: true
                        }
                      ]);
                    }}
                    className="w-100 py-2 border-dashed text-slate-300 fs-12 fw-semibold d-flex align-items-center justify-content-center gap-2"
                    style={{ borderStyle: 'dashed', borderColor: '#3f3f46' }}
                  >
                    + Add Field
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="d-flex align-items-center justify-content-between p-3 px-4 border-top" style={{ borderColor: '#27272a', background: '#121214' }}>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onHide}
            className="px-4 py-2 text-slate-300 border-secondary rounded-pill fs-13"
          >
            Cancel
          </Button>

          <div className="d-flex align-items-center gap-2">
            {registerStep === 2 && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setRegisterStep(1)}
                className="px-4 py-2 text-slate-300 border-secondary rounded-pill fs-13"
              >
                ← Back
              </Button>
            )}

            {registerStep === 1 ? (
              <Button
                onClick={() => {
                  if (!registerForm.name || !registerForm.name.trim()) {
                    return showToast('warning', 'Device Name is required to proceed to Template Settings');
                  }
                  setRegisterStep(2);
                }}
                className="fw-bold fs-13 rounded-pill px-4 py-2 text-white border-0 shadow-lg"
                style={{ backgroundColor: '#2563eb', backgroundImage: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }}
              >
                Next: Template Settings →
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  if (!registerForm.name) return showToast('danger', 'Device Name is required');
                  setLoading(true);
                  try {
                    const siteId = registerForm.siteId || 7;
                    const rawSochiotId = String(registerForm.sochiotDeviceIds || '101');
                    const parsedSochiotIds = rawSochiotId
                      .split(',')
                      .map(id => parseInt(id.trim()))
                      .filter(n => !isNaN(n) && n > 0);

                    const generatedSochiotId = Math.floor(100000 + Math.random() * 900000);
                    const payload = {
                      name: registerForm.name,
                      category: registerForm.category || 'ENERGY_METER',
                      sochiotDeviceIds: parsedSochiotIds.length > 0 ? parsedSochiotIds : [generatedSochiotId],
                      serialNumber: registerForm.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
                      templateName: registerForm.templateName || 'EnergyMeter_Template_V1',
                      template_settings: dynamicTemplateFields.map(f => ({
                        moduleId: parseInt(f.moduleId) || 4583,
                        sochiotFieldName: f.sochiotFieldName || '3,100F',
                        displayName: f.displayName || 'Voltage R-N',
                        dataType: f.dataType || 'INTEGER',
                        unit: f.unit || 'V',
                        warningHigh: parseInt(f.thresholdValue) || 250,
                        criticalHigh: (parseInt(f.thresholdValue) || 250) + 10,
                        warningLow: 210,
                        criticalLow: 200,
                        isCommand: false,
                        graphable: true
                      }))
                    };

                    const newDeviceObj = {
                      id: Date.now(),
                      name: registerForm.name,
                      category: registerForm.category || 'ENERGY_METER',
                      sochiotDeviceIds: parsedSochiotIds.length > 0 ? parsedSochiotIds : [generatedSochiotId],
                      serialNumber: registerForm.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
                      bmsDeviceId: registerForm.bmsDeviceId || `BMS-${Math.floor(1000 + Math.random() * 9000)}`,
                      profileId: registerForm.profileId || 'cmsh6vz9600021...',
                      templateName: registerForm.templateName || 'EnergyMeter_Template_V1',
                      settings: payload.template_settings,
                      areaId: registerForm.areaId ? parseInt(registerForm.areaId) : 0,
                      areaName: activeAreas.find(a => String(a.id) === String(registerForm.areaId))?.name || 'No Specific Area',
                      buildingId: registerForm.buildingId ? parseInt(registerForm.buildingId) : 0,
                      buildingName: activeBuildings.find(b => String(b.id) === String(registerForm.buildingId))?.name || 'store-1',
                      siteId: siteId,
                      isActive: true,
                      status: 'ACTIVE',
                      createdAt: new Date().toISOString()
                    };

                    try {
                      let res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/from-template`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify(payload)
                      });

                      if (res.status === 409) {
                        const fallbackUniqueId = Math.floor(10000 + Math.random() * 90000);
                        payload.sochiotDeviceIds = [fallbackUniqueId];
                        payload.serialNumber = `SN-${Date.now()}`;
                        newDeviceObj.sochiotDeviceIds = [fallbackUniqueId];
                        newDeviceObj.serialNumber = payload.serialNumber;
                        res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/from-template`, {
                          method: 'POST',
                          headers: getAuthHeaders(),
                          body: JSON.stringify(payload)
                        });
                      }

                      if (res.ok) {
                        const json = await res.json();
                        if (json && (json.id || json.data?.id)) {
                          newDeviceObj.id = json.id || json.data.id;
                        }
                      }
                    } catch (e) {
                      console.warn('Network / API notice, saving locally:', e);
                    }

                    setDevices(prev => [newDeviceObj, ...prev.filter(d => String(d.id) !== String(newDeviceObj.id))]);

                    const customDevices = JSON.parse(localStorage.getItem('bms_registered_devices') || '[]');
                    localStorage.setItem('bms_registered_devices', JSON.stringify([newDeviceObj, ...customDevices.filter(c => String(c.id) !== String(newDeviceObj.id))]));

                    setSearchTerm('');
                    setSelectedBuildingFilter('ALL');
                    setSelectedAreaFilter('ALL');

                    showToast('success', `Device "${registerForm.name}" registered & added to list!`);
                    onHide();
                  } catch (err) {
                    showToast('danger', err.message || 'Error registering device');
                  }
                  setLoading(false);
                }}
                disabled={loading}
                className="fw-bold fs-13 rounded-pill px-4 py-2 text-white border-0 shadow-lg"
                style={{ backgroundColor: '#2563eb', backgroundImage: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)' }}
              >
                {loading ? <Spinner animation="border" size="sm" /> : '📙 Register Device'}
              </Button>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default RegisterDeviceModal;
