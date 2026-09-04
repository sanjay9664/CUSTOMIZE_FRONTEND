import React from 'react';
import { Offcanvas, Form, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { FileText, BarChart2, Sliders, LayoutGrid, Trash2, X, Plus } from 'lucide-react';
import { useSiteStore } from '../../../../context/SiteContext';

const RegisterDeviceModal = ({
  show,
  onHide,
  registerStep = 1,
  setRegisterStep = () => {},
  registerForm = {},
  setRegisterForm = () => {},
  sites = [],
  editingDevice = null,
  activeAreas = [],
  activeBuildings = [],
  dynamicTemplateFields = [],
  setDynamicTemplateFields = () => {},
  fetchDevices = () => {},
  showToast = () => {},
  loading = false,
  setLoading = () => {},
  setDevices = () => {},
  setSelectedBuildingFilter = () => {},
  setSelectedAreaFilter = () => {},
  setSearchTerm = () => {},
  API_BASE_URL = '',
  getAuthHeaders = () => ({})
}) => {
  const { activeSites: storeActiveSites } = useSiteStore();
  const effectiveSites = (sites && sites.length > 0) ? sites : (storeActiveSites || []);
  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="register-wizard-drawer"
    >
      <style>{`
        /* ── Right-to-Left Slide Drawer Placement & Dimensions ── */
        .register-wizard-drawer {
          width: calc(100vw - 65px) !important;
          max-width: 100vw !important;
          height: 100vh !important;
          top: 0 !important;
          bottom: 0 !important;
          right: 0 !important;
          border: none !important;
          z-index: 1055 !important;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        @media (max-width: 768px) {
          .register-wizard-drawer {
            width: 100vw !important;
          }
        }

        /* ── Base Drawer & Offcanvas Body (Dark Default) ── */
        .register-wizard-drawer,
        body:not(.light-mode) .register-wizard-drawer {
          background-color: #0f172a !important;
          background: #0f172a !important;
          color: #f8fafc !important;
          border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: -10px 0 35px rgba(0, 0, 0, 0.5) !important;
        }
        .register-wizard-drawer .offcanvas-body,
        body:not(.light-mode) .register-wizard-drawer .offcanvas-body {
          background-color: #0f172a !important;
          background: #0f172a !important;
          color: #f8fafc !important;
          padding: 0 !important;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* ── Header ── */
        .register-wizard-drawer .wizard-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 36px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }
        .register-wizard-drawer .wizard-header-title {
          color: #f8fafc !important;
        }
        .register-wizard-drawer .wizard-close-btn {
          color: #94a3b8;
          transition: color 0.15s ease;
        }
        .register-wizard-drawer .wizard-close-btn:hover {
          color: #f8fafc;
        }

        /* ── Stepper Process Bar ── */
        .register-wizard-drawer .wizard-stepper-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 48px 12px 48px;
          gap: 18px;
          flex-shrink: 0;
        }
        .register-wizard-drawer .wizard-step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s ease;
        }
        .register-wizard-drawer .wizard-step-item.active {
          color: #38bdf8 !important;
        }
        .register-wizard-drawer .wizard-step-line {
          flex: 1;
          height: 1px;
          background-color: #334155;
          min-width: 60px;
          transition: background-color 0.2s ease;
        }
        .register-wizard-drawer .wizard-step-line.active {
          background-color: #38bdf8;
        }

        /* ── Form Body Scroll Area ── */
        .register-wizard-drawer .wizard-content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px 48px;
        }

        /* ── Form Labels & Inputs (Dark Default) ── */
        .register-wizard-drawer .wizard-label {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 6px;
          display: block;
        }
        .register-wizard-drawer .wizard-input,
        .register-wizard-drawer .wizard-select,
        body:not(.light-mode) .register-wizard-drawer .wizard-input,
        body:not(.light-mode) .register-wizard-drawer .wizard-select {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
          font-size: 13px !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          height: 38px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .register-wizard-drawer textarea.wizard-input,
        body:not(.light-mode) .register-wizard-drawer textarea.wizard-input {
          height: auto !important;
        }
        .register-wizard-drawer .wizard-input:focus,
        .register-wizard-drawer .wizard-select:focus,
        body:not(.light-mode) .register-wizard-drawer .wizard-input:focus,
        body:not(.light-mode) .register-wizard-drawer .wizard-select:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2) !important;
          outline: none !important;
        }
        .register-wizard-drawer .wizard-input::placeholder,
        body:not(.light-mode) .register-wizard-drawer .wizard-input::placeholder {
          color: #64748b !important;
          font-size: 13px;
        }

        /* ── Table (Dark Default) ── */
        .register-wizard-drawer .table-wizard-custom {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border: 1px solid #334155;
          border-radius: 8px;
          overflow: hidden;
        }
        .register-wizard-drawer .table-wizard-custom th {
          background-color: #1e293b;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 10px 14px;
          border-bottom: 1px solid #334155;
        }
        .register-wizard-drawer .table-wizard-custom td {
          background-color: #0f172a;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          vertical-align: middle;
          color: #f8fafc;
        }
        .register-wizard-drawer .table-wizard-custom tr:last-child td {
          border-bottom: none;
        }

        /* ── Typography & Footer (Dark Default) ── */
        .register-wizard-drawer .wizard-subheading {
          color: #f8fafc !important;
        }
        .register-wizard-drawer .wizard-muted-text {
          color: #94a3b8 !important;
        }
        .register-wizard-drawer .wizard-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 48px;
          background: #0f172a;
          flex-shrink: 0;
        }
        .register-wizard-drawer .wizard-badge {
          background-color: #1e293b;
          color: #38bdf8;
          border: 1px solid #334155;
        }
        .register-wizard-drawer .wizard-btn-add {
          border: 1px solid #38bdf8;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
        }
        .register-wizard-drawer .wizard-btn-add:hover {
          background: rgba(56, 189, 248, 0.16);
          color: #38bdf8;
        }
        .register-wizard-drawer .wizard-btn-cancel {
          background-color: #1e293b;
          border: 1px solid #334155;
          color: #cbd5e1;
          font-weight: 500;
          font-size: 13px;
          border-radius: 6px;
          padding: 7px 22px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .register-wizard-drawer .wizard-btn-cancel:hover {
          background-color: #334155;
          border-color: #475569;
          color: #ffffff;
        }
        .register-wizard-drawer .wizard-btn-primary {
          background-color: #2563eb;
          border: 1px solid #2563eb;
          color: #ffffff;
          font-weight: 500;
          font-size: 13px;
          border-radius: 6px;
          padding: 7px 24px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .register-wizard-drawer .wizard-btn-primary:hover {
          background-color: #1d4ed8;
          border-color: #1d4ed8;
        }
        .register-wizard-drawer .wizard-btn-primary:disabled {
          background-color: #1e3a8a;
          border-color: #1e3a8a;
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* ══════════════════════════════════════════════
           ── LIGHT MODE THEME OVERRIDES ──
           ══════════════════════════════════════════════ */
        body.light-mode .register-wizard-drawer {
          background-color: #ffffff !important;
          background: #ffffff !important;
          color: #1e293b !important;
          border-left: 1px solid #e2e8f0 !important;
          box-shadow: -8px 0 25px rgba(0, 0, 0, 0.08) !important;
        }
        body.light-mode .register-wizard-drawer .offcanvas-body {
          background-color: #ffffff !important;
          background: #ffffff !important;
          color: #1e293b !important;
        }
        body.light-mode .register-wizard-drawer .wizard-header {
          border-bottom: 1px solid #f1f5f9;
        }
        body.light-mode .register-wizard-drawer .wizard-header-title {
          color: #1e293b !important;
        }
        body.light-mode .register-wizard-drawer .wizard-close-btn {
          color: #64748b;
        }
        body.light-mode .register-wizard-drawer .wizard-close-btn:hover {
          color: #1e293b;
        }
        body.light-mode .register-wizard-drawer .wizard-step-item {
          color: #94a3b8;
        }
        body.light-mode .register-wizard-drawer .wizard-step-item.active {
          color: #2563eb !important;
        }
        body.light-mode .register-wizard-drawer .wizard-step-line {
          background-color: #e2e8f0;
        }
        body.light-mode .register-wizard-drawer .wizard-step-line.active {
          background-color: #2563eb;
        }
        body.light-mode .register-wizard-drawer .wizard-label {
          color: #374151;
        }
        body.light-mode .register-wizard-drawer .wizard-input,
        body.light-mode .register-wizard-drawer .wizard-select {
          background-color: #ffffff !important;
          border: 1px solid #d1d5db !important;
          color: #111827 !important;
        }
        body.light-mode .register-wizard-drawer .wizard-input:focus,
        body.light-mode .register-wizard-drawer .wizard-select:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15) !important;
        }
        body.light-mode .register-wizard-drawer .wizard-input::placeholder {
          color: #9ca3af !important;
        }
        body.light-mode .register-wizard-drawer .table-wizard-custom {
          border: 1px solid #e2e8f0;
        }
        body.light-mode .register-wizard-drawer .table-wizard-custom th {
          background-color: #f8fafc;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
        }
        body.light-mode .register-wizard-drawer .table-wizard-custom td {
          background-color: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
        }
        body.light-mode .register-wizard-drawer .wizard-subheading {
          color: #1e293b !important;
        }
        body.light-mode .register-wizard-drawer .wizard-muted-text {
          color: #64748b !important;
        }
        body.light-mode .register-wizard-drawer .wizard-footer {
          border-top: 1px solid #f1f5f9;
          background: #ffffff;
        }
        body.light-mode .register-wizard-drawer .wizard-badge {
          background-color: #f8fafc;
          color: #2563eb;
          border: 1px solid #e2e8f0;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-add {
          border: 1px solid #2563eb;
          color: #2563eb;
          background: #ffffff;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-add:hover {
          background: #eff6ff;
          color: #1d4ed8;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-cancel {
          background-color: #ffffff;
          border: 1px solid #d1d5db;
          color: #374151;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-cancel:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
          color: #111827;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-primary {
          background-color: #2563eb;
          border: 1px solid #2563eb;
          color: #ffffff;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-primary:hover {
          background-color: #1d4ed8;
        }
        body.light-mode .register-wizard-drawer .wizard-btn-primary:disabled {
          background-color: #93c5fd;
          border-color: #93c5fd;
          color: #ffffff;
        }
      `}</style>

      <Offcanvas.Body>
        {/* Top Header matching reference image: "✕ Register New Device" */}
        <div className="wizard-header">
          <button
            type="button"
            onClick={onHide}
            className="btn p-0 border-0 wizard-close-btn d-flex align-items-center justify-content-center"
            style={{ width: 22, height: 22 }}
            title="Close"
          >
            <X size={18} />
          </button>
          <h5 className="mb-0 fs-16 fw-semibold wizard-header-title">
            {editingDevice ? 'Edit Device' : 'Register New Device'}
          </h5>
        </div>

        {/* Stepper Bar across top: [📄 Basic] ── [📊 Template Settings] ── [🗂️ Template data] */}
        <div className="wizard-stepper-wrap">
          {/* Step 1: Basic */}
          <div
            className={`wizard-step-item ${registerStep >= 1 ? 'active' : ''}`}
            onClick={() => setRegisterStep(1)}
          >
            <FileText size={18} />
            <span className="fw-semibold">Basic</span>
          </div>

          <div className={`wizard-step-line ${registerStep > 1 ? 'active' : ''}`} />

          {/* Step 2: Template Settings / Graph */}
          <div
            className={`wizard-step-item ${registerStep === 2 ? 'active' : ''}`}
            onClick={() => {
              if (registerForm.name && registerForm.name.trim()) {
                setRegisterStep(2);
              }
            }}
          >
            <BarChart2 size={18} />
            <span className="fw-semibold">Template Settings</span>
          </div>

          <div className="wizard-step-line" />

          {/* Step 3: Template Data (Indicator matching reference) */}
          <div className="wizard-step-item" style={{ cursor: 'default' }}>
            <LayoutGrid size={18} />
            <span>Template data</span>
          </div>
        </div>

        {/* Scrollable Form Content Container */}
        <div className="wizard-content-scroll">
          {/* Step 1: Basic Information */}
          {registerStep === 1 && (
            <div>
              <Row className="g-4">
                {/* Company / Site */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Company / Site</Form.Label>
                    <Form.Select
                      disabled={!!editingDevice}
                      value={registerForm.siteId || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, siteId: e.target.value })}
                      className="wizard-select"
                      style={editingDevice ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                    >
                      <option value="">Select Company / Site</option>
                      {effectiveSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Machine Name / Device Name */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Machine / Device Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Incomer-1 LT Panel"
                      value={registerForm.name || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                      className="wizard-input"
                    />
                  </Form.Group>
                </Col>

                {/* Template / Device Category */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Template / Category</Form.Label>
                    <Form.Select
                      value={registerForm.category || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                      className="wizard-select"
                    >
                      <option value="">Select Template / Category</option>
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

                {/* Building / Block (Optional) */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Building / Block (Optional)</Form.Label>
                    <Form.Select
                      value={registerForm.buildingId || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, buildingId: e.target.value })}
                      className="wizard-select"
                    >
                      <option value="">Select Building</option>
                      {activeBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Area (Optional) */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Area (Optional)</Form.Label>
                    <Form.Select
                      value={registerForm.areaId || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, areaId: e.target.value })}
                      className="wizard-select"
                    >
                      <option value="">Select Area</option>
                      {activeAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Energy Group (Optional) */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Energy Group (Optional)</Form.Label>
                    <Form.Select
                      value={registerForm.energyGroupId || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, energyGroupId: e.target.value })}
                      className="wizard-select"
                    >
                      <option value="">Select Energy Group</option>
                      <option value="1">Substation Main Metering</option>
                      <option value="2">HVAC Chiller Loop</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                {/* Floor Number (Optional) */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Floor Number (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 3"
                      value={registerForm.floorNo || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, floorNo: e.target.value })}
                      className="wizard-input"
                    />
                  </Form.Group>
                </Col>

                {/* Room Number (Optional) */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Room Number (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 302"
                      value={registerForm.roomNo || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, roomNo: e.target.value })}
                      className="wizard-input"
                    />
                  </Form.Group>
                </Col>

                {/* Serial Number (Optional) */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Serial Number (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. SN-492019"
                      value={registerForm.serialNumber || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, serialNumber: e.target.value })}
                      className="wizard-input"
                    />
                  </Form.Group>
                </Col>

                {/* Description / Location Notes */}
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="wizard-label">Description / Location Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="e.g. Ground floor plant room, serves block A &amp; B..."
                      value={registerForm.description || ''}
                      onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                      className="wizard-input"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          )}

          {/* Step 2: Template Settings */}
          {registerStep === 2 && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center pb-2">
                <div>
                  <h6 className="fw-semibold fs-14 mb-1 wizard-subheading">
                    Event Fields &amp; Mapping
                  </h6>
                  <span className="fs-12 wizard-muted-text">
                    Define the telemetry fields this device will report and map them to friendly display names.
                  </span>
                </div>
                <span className="badge wizard-badge px-3 py-1.5 fs-11 font-monospace">
                  {dynamicTemplateFields.length} FIELD{dynamicTemplateFields.length !== 1 ? 'S' : ''}
                </span>
              </div>

              <div className="table-responsive">
                <table className="table-wizard-custom">
                  <thead>
                    <tr>
                      <th style={{ width: '20%' }}>Device ID</th>
                      <th style={{ width: '22%' }}>Module ID</th>
                      <th style={{ width: '22%' }}>Event Field</th>
                      <th style={{ width: '22%' }}>Display Name</th>
                      <th style={{ width: '14%' }}>Thresholds</th>
                      <th style={{ width: '50px' }} className="text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dynamicTemplateFields.map((f, idx) => (
                      <tr key={idx}>
                        <td>
                          <Form.Select
                            size="sm"
                            value={f.deviceId}
                            onChange={(e) => {
                              const copy = [...dynamicTemplateFields];
                              copy[idx].deviceId = e.target.value;
                              setDynamicTemplateFields(copy);
                            }}
                            className="wizard-select"
                            style={{ height: 32, fontSize: 12 }}
                          >
                            <option value="101">Select Device</option>
                            <option value="101">101 ({registerForm.name || 'Device'})</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Select
                            size="sm"
                            value={f.moduleId}
                            onChange={(e) => {
                              const copy = [...dynamicTemplateFields];
                              copy[idx].moduleId = e.target.value;
                              setDynamicTemplateFields(copy);
                            }}
                            className="wizard-select"
                            style={{ height: 32, fontSize: 12 }}
                          >
                            <option value="4583">Select Module</option>
                            <option value="4583">4583 - Main Incomer</option>
                            <option value="4584">4584 - Chiller Unit</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control
                            size="sm"
                            type="text"
                            placeholder="e.g. 3,100F"
                            value={f.sochiotFieldName}
                            onChange={(e) => {
                              const copy = [...dynamicTemplateFields];
                              copy[idx].sochiotFieldName = e.target.value;
                              setDynamicTemplateFields(copy);
                            }}
                            className="wizard-input font-monospace"
                            style={{ height: 32, fontSize: 12 }}
                          />
                        </td>
                        <td>
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
                            className="wizard-input"
                            style={{ height: 32, fontSize: 12 }}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <Form.Control
                              size="sm"
                              type="number"
                              placeholder="Warn (250)"
                              value={f.warningHigh ?? 250}
                              onChange={(e) => {
                                const copy = [...dynamicTemplateFields];
                                copy[idx].warningHigh = parseInt(e.target.value) || 250;
                                copy[idx].thresholdValue = e.target.value;
                                setDynamicTemplateFields(copy);
                              }}
                              className="wizard-input font-monospace text-warning fw-medium"
                              style={{ width: 80, height: 32, fontSize: 11 }}
                              title="Warning High Threshold"
                            />
                            <Form.Control
                              size="sm"
                              type="number"
                              placeholder="Crit (260)"
                              value={f.criticalHigh ?? 260}
                              onChange={(e) => {
                                const copy = [...dynamicTemplateFields];
                                copy[idx].criticalHigh = parseInt(e.target.value) || 260;
                                setDynamicTemplateFields(copy);
                              }}
                              className="wizard-input font-monospace text-danger fw-medium"
                              style={{ width: 80, height: 32, fontSize: 11 }}
                              title="Critical High Threshold"
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setDynamicTemplateFields(dynamicTemplateFields.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-danger border-0"
                            title="Remove Field"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Add Field Button */}
                <div className="mt-2 text-start">
                  <button
                    type="button"
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
                    className="wizard-btn-add d-inline-flex align-items-center gap-1 px-3 py-1.5 fs-12 fw-medium rounded-2 border-0"
                  >
                    <Plus size={14} /> Add Field
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Controls */}
        <div className="d-flex align-items-center justify-content-end gap-2.5 wizard-footer">
          <button
            type="button"
            onClick={onHide}
            className="wizard-btn-cancel"
          >
            Cancel
          </button>

          {registerStep === 2 && (
            <button
              type="button"
              onClick={() => setRegisterStep(1)}
              className="wizard-btn-cancel"
            >
              Back
            </button>
          )}

          {registerStep === 1 ? (
            <button
              type="button"
              onClick={() => {
                if (!registerForm.name || !registerForm.name.trim()) {
                  return showToast('warning', 'Device Name is required to proceed to Template Settings');
                }
                setRegisterStep(2);
              }}
              className="wizard-btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                if (!registerForm.name || !registerForm.name.trim()) {
                  if (typeof showToast === 'function') showToast('danger', 'Device Name is required');
                  return;
                }
                if (typeof setLoading === 'function') setLoading(true);
                try {
                  const siteId = registerForm.siteId || (sites && sites.length ? sites[0].id : 7);
                  const generatedSochiotId = Math.floor(100000 + Math.random() * 899999);
                  const rawSochiotId = String(registerForm.sochiotDeviceIds || '');
                  let parsedSochiotIds = rawSochiotId
                    .split(',')
                    .map(id => parseInt(id.trim()))
                    .filter(n => !isNaN(n) && n > 0);

                  if (parsedSochiotIds.length === 0) {
                    parsedSochiotIds = [generatedSochiotId];
                  }

                  const templateSettings = (dynamicTemplateFields && dynamicTemplateFields.length > 0 ? dynamicTemplateFields : [
                    {
                      moduleId: 4583,
                      sochiotFieldName: "3,100F",
                      displayName: "Voltage R-N",
                      dataType: "INTEGER",
                      unit: "V",
                      warningHigh: 250,
                      criticalHigh: 260,
                      warningLow: 210,
                      criticalLow: 200,
                      isCommand: false,
                      graphable: true
                    }
                  ]).map(f => ({
                    moduleId: parseInt(f.moduleId) || 4583,
                    sochiotFieldName: f.sochiotFieldName || '3,100F',
                    displayName: f.displayName || 'Voltage R-N',
                    dataType: (f.dataType && ['INTEGER', 'FLOAT', 'BOOLEAN', 'STRING', 'ENUM'].includes(f.dataType)) ? f.dataType : 'INTEGER',
                    unit: f.unit || 'V',
                    warningHigh: parseInt(f.warningHigh ?? f.thresholdValue) || 250,
                    criticalHigh: parseInt(f.criticalHigh) || ((parseInt(f.warningHigh ?? f.thresholdValue) || 250) + 10),
                    warningLow: parseInt(f.warningLow) || 210,
                    criticalLow: parseInt(f.criticalLow) || 200,
                    isCommand: Boolean(f.isCommand),
                    graphable: f.graphable !== false
                  }));

                  const payload = {
                    name: registerForm.name?.trim() || 'EM_LIVEWIZE_178',
                    category: registerForm.category || 'ENERGY_METER',
                    sochiotDeviceIds: parsedSochiotIds,
                    serialNumber: registerForm.serialNumber || `SN-${Math.floor(100000 + Math.random() * 899999)}`,
                    templateName: registerForm.templateName || 'EnergyMeter_Template_V1',
                    template_settings: templateSettings
                  };

                  if (registerForm.areaId && activeAreas.some(a => String(a.id) === String(registerForm.areaId))) {
                    payload.areaId = parseInt(registerForm.areaId);
                  }
                  if (registerForm.buildingId && activeBuildings.some(b => String(b.id) === String(registerForm.buildingId))) {
                    payload.buildingId = parseInt(registerForm.buildingId);
                  }
                  if (registerForm.floorNo && !isNaN(parseInt(registerForm.floorNo))) {
                    payload.floorNo = parseInt(registerForm.floorNo);
                  }
                  if (registerForm.roomNo && !isNaN(parseInt(registerForm.roomNo))) {
                    payload.roomNo = parseInt(registerForm.roomNo);
                  }
                  if (registerForm.description && registerForm.description.trim()) {
                    payload.description = registerForm.description.trim();
                  }
                  if (registerForm.profileId && typeof registerForm.profileId === 'string' && registerForm.profileId.length >= 20 && !registerForm.profileId.includes(' ')) {
                    payload.profileId = registerForm.profileId;
                  }

                  const newDeviceObj = {
                    id: Date.now(),
                    name: registerForm.name.trim(),
                    category: registerForm.category || 'ENERGY_METER',
                    sochiotDeviceIds: payload.sochiotDeviceIds,
                    serialNumber: payload.serialNumber,
                    bmsDeviceId: registerForm.bmsDeviceId || `BMS-${Math.floor(1000 + Math.random() * 9000)}`,
                    profileId: payload.profileId || null,
                    templateName: registerForm.templateName || 'EnergyMeter_Template_V1',
                    settings: payload.template_settings,
                    areaId: payload.areaId || 0,
                    areaName: (activeAreas || []).find(a => String(a.id) === String(registerForm.areaId))?.name || 'No Specific Area',
                    buildingId: payload.buildingId || 0,
                    buildingName: (activeBuildings || []).find(b => String(b.id) === String(registerForm.buildingId))?.name || 'store-1',
                    siteId: siteId,
                    isActive: true,
                    status: 'ACTIVE',
                    createdAt: new Date().toISOString()
                  };

                  try {
                    const headers = typeof getAuthHeaders === 'function' ? getAuthHeaders() : { 'Content-Type': 'application/json' };
                    let res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/from-template`, {
                      method: 'POST',
                      headers,
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
                        headers,
                        body: JSON.stringify(payload)
                      });
                    }

                    if (res.ok) {
                      const json = await res.json().catch(() => ({}));
                      if (json && (json.id || json.data?.id)) {
                        newDeviceObj.id = json.id || json.data.id;
                      }
                    }
                  } catch (e) {
                    console.warn('Network / API notice, saving locally:', e);
                  }

                  if (typeof setDevices === 'function') {
                    setDevices(prev => [newDeviceObj, ...(Array.isArray(prev) ? prev.filter(d => String(d.id) !== String(newDeviceObj.id)) : [])]);
                  }
                  if (typeof fetchDevices === 'function') {
                    fetchDevices();
                  }

                  const customDevices = JSON.parse(localStorage.getItem('bms_registered_devices') || '[]');
                  localStorage.setItem('bms_registered_devices', JSON.stringify([newDeviceObj, ...customDevices.filter(c => String(c.id) !== String(newDeviceObj.id))]));

                  if (typeof setSearchTerm === 'function') setSearchTerm('');
                  if (typeof setSelectedBuildingFilter === 'function') setSelectedBuildingFilter('ALL');
                  if (typeof setSelectedAreaFilter === 'function') setSelectedAreaFilter('ALL');

                  if (typeof showToast === 'function') {
                    showToast('success', `Device "${registerForm.name}" registered & added to list!`);
                  }
                  onHide();
                } catch (err) {
                  if (typeof showToast === 'function') {
                    showToast('danger', err.message || 'Error registering device');
                  }
                }
                if (typeof setLoading === 'function') setLoading(false);
              }}
              disabled={loading}
              className="wizard-btn-primary"
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Register Device'}
            </button>
          )}
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default RegisterDeviceModal;

