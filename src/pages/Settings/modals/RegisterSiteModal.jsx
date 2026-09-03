import React, { useState, useRef } from 'react';
import { Offcanvas, Form, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { X, Building2, MapPin, Mail, Upload, Image as ImageIcon, CheckCircle, AlertCircle, ChevronRight, Layers } from 'lucide-react';
import CustomFieldsTemplate, { DEFAULT_SITE_TEMPLATES, DEFAULT_SITE_FEATURES } from '../../../components/common/CustomFieldsTemplate';

const RegisterSiteModal = ({
  show,
  onHide,
  createForm = {},
  setCreateForm = () => {},
  handleCreateSite = () => {},
  tenants = [],
  zones = [],
  areas = [],
  submitting = false,
  error = null
}) => {
  const fileInputRef = useRef(null);
  const [emailInput, setEmailInput] = useState('');

  // Contact Emails Tag Handler
  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = emailInput.trim().toLowerCase();
      if (!val) return;
      const current = Array.isArray(createForm.contactEmails) ? createForm.contactEmails : [];
      if (!current.includes(val)) {
        setCreateForm(prev => ({
          ...prev,
          contactEmails: [...current, val]
        }));
      }
      setEmailInput('');
    }
  };

  const removeEmail = (emailToRemove) => {
    const current = Array.isArray(createForm.contactEmails) ? createForm.contactEmails : [];
    setCreateForm(prev => ({
      ...prev,
      contactEmails: current.filter(em => em !== emailToRemove)
    }));
  };

  // Logo Upload Handler
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCreateForm(prev => ({
        ...prev,
        logoUrl: reader.result,
        logoFileName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  // Templates Toggle
  const handleToggleTemplate = (templateId) => {
    const current = Array.isArray(createForm.selectedTemplates) ? createForm.selectedTemplates : [];
    const next = current.includes(templateId)
      ? current.filter(id => id !== templateId)
      : [...current, templateId];
    setCreateForm(prev => ({ ...prev, selectedTemplates: next }));
  };

  // Features Toggle
  const handleToggleFeature = (featureId) => {
    const current = Array.isArray(createForm.selectedFeatures) ? createForm.selectedFeatures : [];
    const next = current.includes(featureId)
      ? current.filter(id => id !== featureId)
      : [...current, featureId];
    setCreateForm(prev => ({ ...prev, selectedFeatures: next }));
  };

  // Custom Fields Handlers
  const handleAddCustomField = (newField) => {
    const current = Array.isArray(createForm.customFields) ? createForm.customFields : [];
    setCreateForm(prev => ({ ...prev, customFields: [...current, newField] }));
  };

  const handleRemoveCustomField = (fieldId) => {
    const current = Array.isArray(createForm.customFields) ? createForm.customFields : [];
    setCreateForm(prev => ({
      ...prev,
      customFields: current.filter(f => f.id !== fieldId)
    }));
  };

  const handleCustomFieldChange = (fieldId, val) => {
    const current = Array.isArray(createForm.customFields) ? createForm.customFields : [];
    setCreateForm(prev => ({
      ...prev,
      customFields: current.map(f => f.id === fieldId ? { ...f, value: val } : f)
    }));
  };

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="register-site-drawer"
    >
      <style>{`
        .register-site-drawer {
          width: calc(100vw - 65px) !important;
          max-width: 960px !important;
          height: 100vh !important;
          top: 0 !important;
          bottom: 0 !important;
          right: 0 !important;
          border: none !important;
          z-index: 1055 !important;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
          background-color: #0f172a !important;
          color: #f8fafc !important;
          border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: -10px 0 35px rgba(0, 0, 0, 0.5) !important;
        }

        @media (max-width: 768px) {
          .register-site-drawer {
            width: 100vw !important;
          }
        }

        .register-site-drawer .offcanvas-body {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          padding: 0 !important;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .register-site-drawer .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .register-site-drawer .drawer-scroll-content {
          flex: 1;
          overflow-y: auto;
          padding: 28px 36px;
        }

        .register-site-drawer .drawer-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 36px;
          background: #0f172a;
          flex-shrink: 0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .register-site-drawer .site-input,
        .register-site-drawer .site-select {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
          font-size: 13px !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .register-site-drawer .site-input:focus,
        .register-site-drawer .site-select:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2) !important;
          outline: none !important;
        }

        .register-site-drawer .site-label {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          margin-bottom: 6px;
          display: block;
        }

        .register-site-drawer .logo-upload-box {
          width: 92px;
          height: 92px;
          border: 1.5px dashed #475569;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(30, 41, 59, 0.4);
        }

        .register-site-drawer .logo-upload-box:hover {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.05);
        }

        /* Light-mode overrides */
        body.light-mode .register-site-drawer {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-left: 1px solid #e2e8f0 !important;
          box-shadow: -10px 0 35px rgba(0, 0, 0, 0.1) !important;
        }
        body.light-mode .register-site-drawer .offcanvas-body,
        body.light-mode .register-site-drawer .drawer-footer {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        body.light-mode .register-site-drawer .drawer-header {
          border-bottom: 1px solid #e2e8f0 !important;
        }
        body.light-mode .register-site-drawer .site-input,
        body.light-mode .register-site-drawer .site-select {
          background-color: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .register-site-drawer .site-label {
          color: #475569 !important;
        }
      `}</style>

      {/* ── DRAWER HEADER ── */}
      <div className="drawer-header">
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={16} color="#fff" />
          </div>
          <div>
            <h5 className="mb-0 fw-bold fs-16" style={{ letterSpacing: '-0.01em' }}>Add Company / Site</h5>
            <small className="text-muted fs-11">Configure site entity, templates, features, and custom metadata</small>
          </div>
        </div>
        <button
          onClick={onHide}
          className="btn btn-link text-muted p-1 hover-opacity"
          style={{ textDecoration: 'none' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* ── DRAWER BODY CONTENT ── */}
      <div className="drawer-scroll-content">
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 fs-13 mb-4 rounded-2 border-0">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <Form onSubmit={handleCreateSite} id="register-site-form">
          {/* ── 1. LOCATION & HIERARCHY SELECTOR ── */}
          <div className="mb-4">
            <label className="site-label">Location *</label>
            <Row className="g-2">
              <Col md={4}>
                <Form.Select
                  className="site-select"
                  value={createForm.tenantId || ''}
                  onChange={e => {
                    const tId = e.target.value;
                    const selTenant = tenants.find(t => t.id === tId);
                    setCreateForm(p => ({
                      ...p,
                      tenantId: tId,
                      organizationId: selTenant?.sochiotOrgId || 1,
                      zoneId: '',
                      areaId: ''
                    }));
                  }}
                  required
                >
                  <option value="">Select Organization / Tenant...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subscription || 'Tenant'})</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Select
                  className="site-select"
                  value={createForm.zoneId || ''}
                  onChange={e => {
                    const zId = e.target.value;
                    setCreateForm(p => ({ ...p, zoneId: zId, areaId: '' }));
                  }}
                >
                  <option value="">Select Geographic Zone...</option>
                  {zones
                    .filter(z => !createForm.tenantId || z.tenantId === createForm.tenantId)
                    .map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Select
                  className="site-select"
                  value={createForm.areaId || ''}
                  onChange={e => setCreateForm(p => ({ ...p, areaId: e.target.value }))}
                >
                  <option value="">Select Tenant Area...</option>
                  {areas
                    .filter(a => !createForm.zoneId || a.zoneId === createForm.zoneId)
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                </Form.Select>
              </Col>
            </Row>
          </div>

          {/* ── 2. COMPANY NAME & ADDRESS ── */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Form.Group>
                <label className="site-label">Company name *</label>
                <Form.Control
                  type="text"
                  className="site-input"
                  placeholder="Company name"
                  value={createForm.name || ''}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <label className="site-label">Address</label>
                <Form.Control
                  as="textarea"
                  rows={1}
                  className="site-input"
                  placeholder="Address"
                  value={createForm.address || `${createForm.city || ''} ${createForm.state || ''}`.trim()}
                  onChange={e => setCreateForm(p => ({ ...p, address: e.target.value }))}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* ── 3. CONTACT EMAILS & LOGO SETTINGS ── */}
          <Row className="g-3 mb-4 align-items-center">
            {/* Contact Emails with Interactive Tags */}
            <Col md={6}>
              <Form.Group>
                <label className="site-label">Contact emails</label>
                <Form.Control
                  type="email"
                  className="site-input"
                  placeholder="Please input email and hit enter to add"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                />
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {Array.isArray(createForm.contactEmails) && createForm.contactEmails.map((em, idx) => (
                    <Badge
                      key={idx}
                      bg="dark"
                      className="border border-secondary text-info d-flex align-items-center gap-1 py-1 px-2 fs-11"
                    >
                      <Mail size={11} />
                      {em}
                      <X
                        size={12}
                        className="cursor-pointer ms-1 hover-opacity text-danger"
                        onClick={() => removeEmail(em)}
                      />
                    </Badge>
                  ))}
                </div>
                <small className="text-muted fs-11 d-block mt-1">Please input email and hit enter to add</small>
              </Form.Group>
            </Col>

            {/* Show Sochiot Logo Switch */}
            <Col md={3} className="text-center">
              <label className="site-label">Show sochiot Logo</label>
              <div className="d-flex justify-content-center mt-2">
                <Form.Check
                  type="switch"
                  id="show-sochiot-logo-switch"
                  checked={createForm.showSochiotLogo !== false}
                  onChange={e => setCreateForm(p => ({ ...p, showSochiotLogo: e.target.checked }))}
                  className="fs-15"
                />
              </div>
            </Col>

            {/* Upload Logo Box */}
            <Col md={3}>
              <label className="site-label">Upload logo</label>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <div
                className="logo-upload-box"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload site logo"
              >
                {createForm.logoUrl ? (
                  <img
                    src={createForm.logoUrl}
                    alt="Logo Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }}
                  />
                ) : (
                  <>
                    <Upload size={18} className="text-muted mb-1" />
                    <span className="text-muted fs-12 fw-medium">+Upload</span>
                  </>
                )}
              </div>
            </Col>
          </Row>

          {/* ── 4. MODULAR TEMPLATE & FEATURE & CUSTOM FIELDS ── */}
          <div className="mb-4">
            <CustomFieldsTemplate
              templates={DEFAULT_SITE_TEMPLATES}
              selectedTemplates={createForm.selectedTemplates || []}
              onToggleTemplate={handleToggleTemplate}
              features={DEFAULT_SITE_FEATURES}
              selectedFeatures={createForm.selectedFeatures || []}
              onToggleFeature={handleToggleFeature}
              customFields={createForm.customFields || []}
              onAddCustomField={handleAddCustomField}
              onRemoveCustomField={handleRemoveCustomField}
              onCustomFieldChange={handleCustomFieldChange}
            />
          </div>
        </Form>
      </div>

      {/* ── DRAWER FOOTER ── */}
      <div className="drawer-footer">
        <Button
          variant="outline-secondary"
          onClick={onHide}
          disabled={submitting}
          className="fs-13 px-3 text-muted"
        >
          Cancel
        </Button>
        <Button
          variant="info"
          type="submit"
          form="register-site-form"
          disabled={submitting}
          className="fs-13 px-4 text-dark fw-bold d-flex align-items-center gap-2"
        >
          {submitting && <Spinner size="sm" animation="border" />}
          {submitting ? 'Creating Site...' : 'Create Site'}
        </Button>
      </div>
    </Offcanvas>
  );
};

export default RegisterSiteModal;
