import React, { useRef, useState } from 'react';
import { Offcanvas, Form, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { X, AlertCircle, Upload, Mail, Plus, Trash2, Sliders, Layers, CheckSquare } from 'lucide-react';

/**
 * Enterprise Unified Register Modal / Drawer Component
 * 
 * Used throughout the project for all registration flows:
 * Sites, Devices, Companies, Organizations, Buildings, Assets, etc.
 * 
 * Supports declaratively configuring fields via the `fields` prop.
 */
const UnifiedRegisterModal = ({
  show = false,
  onHide = () => {},
  title = 'Register Entity',
  subtitle = '',
  icon: IconComponent = null,
  fields = [],
  formData = {},
  onChange = () => {},
  onSubmit = () => {},
  submitting = false,
  error = null,
  submitLabel = 'Create',
  submittingLabel = 'Creating...',
  cancelLabel = 'Cancel',
  width = 'calc(100vw - 65px)',
  maxWidth = '960px',
  children = null
}) => {
  const fileInputRefs = useRef({});
  const [tagInputs, setTagInputs] = useState({});

  // Helper to update a field in formData
  const handleFieldChange = (key, value) => {
    if (typeof onChange === 'function') {
      onChange(key, value);
    }
  };

  // Tag Input KeyDown (Hit Enter or comma to add tag/email)
  const handleTagKeyDown = (e, fieldKey) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const currentVal = (tagInputs[fieldKey] || '').trim();
      if (!currentVal) return;
      const currentList = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];
      if (!currentList.includes(currentVal)) {
        handleFieldChange(fieldKey, [...currentList, currentVal]);
      }
      setTagInputs(prev => ({ ...prev, [fieldKey]: '' }));
    }
  };

  // Remove Tag
  const handleRemoveTag = (fieldKey, tagToRemove) => {
    const currentList = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];
    handleFieldChange(fieldKey, currentList.filter(t => t !== tagToRemove));
  };

  // Image / File Upload Handler
  const handleFileUpload = (e, fieldKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleFieldChange(fieldKey, reader.result);
      handleFieldChange(`${fieldKey}Name`, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Checkbox toggle in array (Templates / Features)
  const handleArrayToggle = (fieldKey, itemId) => {
    const currentList = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];
    const nextList = currentList.includes(itemId)
      ? currentList.filter(id => id !== itemId)
      : [...currentList, itemId];
    handleFieldChange(fieldKey, nextList);
  };

  // Dynamic Custom Fields Handlers
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleAddCustomField = (fieldKey) => {
    if (!newFieldName.trim()) return;
    const current = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];
    const newField = {
      id: `cf_${Date.now().toString(36)}`,
      name: newFieldName.trim(),
      type: newFieldType,
      value: newFieldValue.trim()
    };
    handleFieldChange(fieldKey, [...current, newField]);
    setNewFieldName('');
    setNewFieldValue('');
    setNewFieldType('text');
  };

  const handleRemoveCustomField = (fieldKey, fieldId) => {
    const current = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];
    handleFieldChange(fieldKey, current.filter(f => f.id !== fieldId));
  };

  const handleCustomFieldValChange = (fieldKey, fieldId, val) => {
    const current = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];
    handleFieldChange(fieldKey, current.map(f => f.id === fieldId ? { ...f, value: val } : f));
  };

  // Render individual field based on type
  const renderField = (field) => {
    const {
      key,
      label,
      type = 'text',
      placeholder = '',
      required = false,
      options = [],
      helpText = '',
      colSpan = 12,
      rows = 3,
      disabled = false,
      render = null
    } = field;

    const value = formData[key];

    return (
      <Col md={colSpan} key={key}>
        {/* Custom Slot / Render function */}
        {type === 'custom' && typeof render === 'function' ? (
          render({ formData, handleFieldChange, field })
        ) : type === 'hierarchy' || type === 'location' ? (
          /* ── HIERARCHY / LOCATION SELECTOR ── */
          <div>
            {label && <label className="drawer-label">{label} {required && '*'}</label>}
            <Row className="g-2">
              {options.map((hSelect) => (
                <Col md={hSelect.colSpan || 4} key={hSelect.key}>
                  <Form.Select
                    className="drawer-select"
                    value={formData[hSelect.key] || ''}
                    disabled={disabled}
                    onChange={(e) => {
                      handleFieldChange(hSelect.key, e.target.value);
                      if (typeof hSelect.onChange === 'function') {
                        hSelect.onChange(e.target.value, formData, handleFieldChange);
                      }
                    }}
                    required={hSelect.required}
                  >
                    <option value="">{hSelect.placeholder || `Select ${hSelect.label}...`}</option>
                    {(hSelect.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Col>
              ))}
            </Row>
            {helpText && <small className="text-muted fs-11 mt-1 d-block">{helpText}</small>}
          </div>
        ) : type === 'textarea' ? (
          /* ── TEXTAREA ── */
          <Form.Group>
            {label && <label className="drawer-label">{label} {required && '*'}</label>}
            <Form.Control
              as="textarea"
              rows={rows}
              className="drawer-input"
              placeholder={placeholder}
              value={value || ''}
              disabled={disabled}
              required={required}
              onChange={(e) => handleFieldChange(key, e.target.value)}
            />
            {helpText && <small className="text-muted fs-11 mt-1 d-block">{helpText}</small>}
          </Form.Group>
        ) : type === 'select' ? (
          /* ── SELECT ── */
          <Form.Group>
            {label && <label className="drawer-label">{label} {required && '*'}</label>}
            <Form.Select
              className="drawer-select"
              value={value || ''}
              disabled={disabled}
              required={required}
              onChange={(e) => handleFieldChange(key, e.target.value)}
            >
              <option value="">{placeholder || `Select ${label}...`}</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Form.Select>
            {helpText && <small className="text-muted fs-11 mt-1 d-block">{helpText}</small>}
          </Form.Group>
        ) : type === 'switch' ? (
          /* ── SWITCH TOGGLE ── */
          <div className="text-center py-1">
            {label && <label className="drawer-label mb-2">{label}</label>}
            <div className="d-flex justify-content-center">
              <Form.Check
                type="switch"
                id={`switch-${key}`}
                checked={value !== false}
                disabled={disabled}
                onChange={(e) => handleFieldChange(key, e.target.checked)}
                className="fs-15"
              />
            </div>
            {helpText && <small className="text-muted fs-11 mt-1 d-block">{helpText}</small>}
          </div>
        ) : type === 'imageUpload' || type === 'fileUpload' ? (
          /* ── IMAGE / LOGO UPLOAD DASHED BOX ── */
          <div>
            {label && <label className="drawer-label">{label}</label>}
            <input
              type="file"
              ref={el => fileInputRefs.current[key] = el}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={(e) => handleFileUpload(e, key)}
            />
            <div
              className="drawer-upload-box"
              onClick={() => fileInputRefs.current[key]?.click()}
              title="Click to upload image"
            >
              {value ? (
                <img
                  src={value}
                  alt="Upload Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }}
                />
              ) : (
                <>
                  <Upload size={18} className="text-muted mb-1" />
                  <span className="text-muted fs-12 fw-medium">+Upload</span>
                </>
              )}
            </div>
            {helpText && <small className="text-muted fs-11 mt-1 d-block">{helpText}</small>}
          </div>
        ) : type === 'tags' || type === 'emailTags' ? (
          /* ── INTERACTIVE TAGS / EMAILS (HIT ENTER TO ADD) ── */
          <Form.Group>
            {label && <label className="drawer-label">{label} {required && '*'}</label>}
            <Form.Control
              type={type === 'emailTags' ? 'email' : 'text'}
              className="drawer-input"
              placeholder={placeholder || 'Please input and hit enter to add'}
              value={tagInputs[key] || ''}
              disabled={disabled}
              onChange={(e) => setTagInputs(prev => ({ ...prev, [key]: e.target.value }))}
              onKeyDown={(e) => handleTagKeyDown(e, key)}
            />
            <div className="d-flex flex-wrap gap-1 mt-2">
              {Array.isArray(value) && value.map((tag, idx) => (
                <Badge
                  key={idx}
                  bg="dark"
                  className="border border-secondary text-info d-flex align-items-center gap-1 py-1 px-2 fs-11"
                >
                  {type === 'emailTags' && <Mail size={11} />}
                  {tag}
                  <X
                    size={12}
                    className="cursor-pointer ms-1 hover-opacity text-danger"
                    onClick={() => handleRemoveTag(key, tag)}
                  />
                </Badge>
              ))}
            </div>
            {helpText ? (
              <small className="text-muted fs-11 d-block mt-1">{helpText}</small>
            ) : (
              <small className="text-muted fs-11 d-block mt-1">Please input value and hit enter to add</small>
            )}
          </Form.Group>
        ) : type === 'templateSelector' || type === 'featureSelector' ? (
          /* ── TEMPLATES OR FEATURES CHECKBOX LIST ── */
          <div className="drawer-panel p-3 rounded-3 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              {type === 'templateSelector' ? <Layers size={16} className="text-info" /> : <CheckSquare size={16} className="text-success" />}
              <h6 className="mb-0 fw-bold fs-14 drawer-section-heading">{label || (type === 'templateSelector' ? 'Select Template' : 'Select Feature')}</h6>
            </div>
            <div className="d-flex flex-column gap-2">
              {options.map((opt) => {
                const isChecked = Array.isArray(value) && value.includes(opt.id || opt.value);
                const itemId = opt.id || opt.value;
                return (
                  <div
                    key={itemId}
                    className={`drawer-selector-card p-2 rounded-2 border d-flex align-items-center justify-content-between ${
                      isChecked
                        ? (type === 'templateSelector' ? 'border-info active-info' : 'border-success active-success')
                        : 'border-secondary border-opacity-25'
                    }`}
                    onClick={() => handleArrayToggle(key, itemId)}
                  >
                    <Form.Check
                      type="checkbox"
                      id={`chk-${key}-${itemId}`}
                      label={opt.label || opt.name}
                      checked={isChecked}
                      onChange={() => {}}
                      className="mb-0 fs-13 user-select-none"
                    />
                    {isChecked && (
                      <Badge bg={type === 'templateSelector' ? 'info' : 'success'} className={type === 'templateSelector' ? 'text-dark fs-10' : 'text-white fs-10'}>
                        {type === 'templateSelector' ? 'Active' : 'Enabled'}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : type === 'customFields' ? (
          /* ── DYNAMIC CUSTOM METADATA FIELDS ── */
          <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <Sliders size={16} className="text-warning" />
                <h6 className="mb-0 fw-bold fs-14 drawer-section-heading">{label || 'Custom Metadata Fields'}</h6>
              </div>
              <small className="text-muted fs-11">Extend entity schema with custom fields</small>
            </div>

            {Array.isArray(value) && value.length > 0 ? (
              <div className="d-flex flex-column gap-2 mb-3">
                {value.map((cf, idx) => (
                  <div
                    key={cf.id || idx}
                    className="drawer-custom-field-row d-flex align-items-center gap-2 p-2 rounded-2"
                  >
                    <span className="badge bg-secondary text-white font-monospace fs-11" style={{ minWidth: '90px' }}>
                      {cf.name}
                    </span>
                    <span className="badge bg-dark border border-secondary text-info fs-10">
                      {cf.type}
                    </span>
                    <Form.Control
                      size="sm"
                      type={cf.type === 'number' ? 'number' : 'text'}
                      value={cf.value || ''}
                      placeholder="Value..."
                      className="drawer-input-sm flex-grow-1"
                      onChange={(e) => handleCustomFieldValChange(key, cf.id || idx, e.target.value)}
                    />
                    <Button
                      variant="link"
                      className="p-1 text-danger hover-opacity"
                      title="Remove Field"
                      onClick={() => handleRemoveCustomField(key, cf.id || idx)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 mb-3 text-center rounded-2 border border-secondary border-opacity-10 text-muted fs-12">
                No custom fields added yet.
              </div>
            )}

            {/* Add Custom Field Row */}
            <div className="drawer-custom-add-box d-flex flex-wrap align-items-center gap-2 p-2 rounded-2">
              <Form.Control
                size="sm"
                placeholder="Field name..."
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="drawer-input-sm"
                style={{ maxWidth: '180px' }}
              />
              <Form.Select
                size="sm"
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="drawer-input-sm"
                style={{ maxWidth: '100px' }}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </Form.Select>
              <Form.Control
                size="sm"
                placeholder="Initial value..."
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                className="drawer-input-sm flex-grow-1"
              />
              <Button
                size="sm"
                variant="info"
                onClick={() => handleAddCustomField(key)}
                disabled={!newFieldName.trim()}
                className="d-flex align-items-center gap-1 fs-12 text-dark fw-bold px-3"
              >
                <Plus size={14} /> Add Field
              </Button>
            </div>
          </div>
        ) : (
          /* ── DEFAULT TEXT / NUMBER / EMAIL INPUT ── */
          <Form.Group>
            {label && <label className="drawer-label">{label} {required && '*'}</label>}
            <Form.Control
              type={type}
              className="drawer-input"
              placeholder={placeholder}
              value={value !== undefined ? value : ''}
              disabled={disabled}
              required={required}
              onChange={(e) => handleFieldChange(key, e.target.value)}
            />
            {helpText && <small className="text-muted fs-11 mt-1 d-block">{helpText}</small>}
          </Form.Group>
        )}
      </Col>
    );
  };

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="unified-register-drawer"
    >
      <style>{`
        .unified-register-drawer {
          width: ${width} !important;
          max-width: ${maxWidth} !important;
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
          .unified-register-drawer {
            width: 100vw !important;
          }
        }

        .unified-register-drawer .offcanvas-body {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          padding: 0 !important;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .unified-register-drawer .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .unified-register-drawer .drawer-header-icon {
          width: 38px !important;
          height: 38px !important;
          border-radius: 9px !important;
          background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.35) !important;
        }
        .unified-register-drawer .drawer-header-icon svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
          width: 18px !important;
          height: 18px !important;
        }

        .unified-register-drawer .drawer-close-btn {
          background: transparent !important;
          border: none !important;
          color: #94a3b8 !important;
          border-radius: 6px !important;
          padding: 6px !important;
          cursor: pointer !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.15s ease !important;
        }
        .unified-register-drawer .drawer-close-btn:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.1) !important;
        }

        .unified-register-drawer .drawer-scroll-content {
          flex: 1;
          overflow-y: auto;
          padding: 28px 36px;
        }

        .unified-register-drawer .drawer-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 36px;
          background: #0f172a;
          flex-shrink: 0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .unified-register-drawer .drawer-cancel-btn {
          background-color: transparent !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
          color: #e2e8f0 !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          border-radius: 6px !important;
          padding: 8px 20px !important;
          transition: all 0.15s ease !important;
        }
        .unified-register-drawer .drawer-cancel-btn:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
          color: #ffffff !important;
        }

        .unified-register-drawer .drawer-submit-btn {
          background: #06b6d4 !important;
          border: 1px solid #06b6d4 !important;
          color: #0f172a !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          border-radius: 6px !important;
          padding: 8px 24px !important;
          transition: all 0.15s ease !important;
        }
        .unified-register-drawer .drawer-submit-btn:hover {
          background: #0891b2 !important;
          border-color: #0891b2 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4) !important;
        }

        .unified-register-drawer .drawer-input,
        .unified-register-drawer .drawer-select {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
          font-size: 13px !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .unified-register-drawer textarea.drawer-input {
          height: auto !important;
        }

        .unified-register-drawer .drawer-input:focus,
        .unified-register-drawer .drawer-select:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25) !important;
          outline: none !important;
        }

        .unified-register-drawer .drawer-input::placeholder,
        .unified-register-drawer .drawer-select::placeholder,
        .unified-register-drawer textarea.drawer-input::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
          font-size: 13px;
        }

        .unified-register-drawer .drawer-label {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 6px;
          display: block;
          letter-spacing: 0.01em;
        }

        .unified-register-drawer .drawer-upload-box {
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

        .unified-register-drawer .drawer-upload-box:hover {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.05);
        }

        .unified-register-drawer .drawer-panel {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .unified-register-drawer .drawer-section-heading {
          color: #f8fafc;
        }

        .unified-register-drawer .drawer-selector-card {
          background: rgba(15, 23, 42, 0.6);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .unified-register-drawer .drawer-selector-card:hover {
          background: rgba(30, 41, 59, 0.8);
        }
        .unified-register-drawer .drawer-selector-card.active-info {
          background: rgba(6, 182, 212, 0.12) !important;
        }
        .unified-register-drawer .drawer-selector-card.active-success {
          background: rgba(34, 197, 94, 0.12) !important;
        }

        .unified-register-drawer .drawer-custom-field-row {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .unified-register-drawer .drawer-custom-add-box {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .unified-register-drawer .drawer-input-sm {
          background-color: #0f172a !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
          font-size: 12px !important;
          border-radius: 4px !important;
        }
        .unified-register-drawer .drawer-input-sm::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }

        /* ── Light-mode Overrides ── */
        body.light-mode .unified-register-drawer {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-left: 1px solid #e2e8f0 !important;
          box-shadow: -10px 0 35px rgba(0, 0, 0, 0.1) !important;
        }
        body.light-mode .unified-register-drawer .offcanvas-body,
        body.light-mode .unified-register-drawer .drawer-footer {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        body.light-mode .unified-register-drawer .drawer-header {
          border-bottom: 1px solid #e2e8f0 !important;
        }
        body.light-mode .unified-register-drawer .drawer-header-icon {
          background: linear-gradient(135deg, #0284c7 0%, #7c3aed 100%) !important;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.28) !important;
        }
        body.light-mode .unified-register-drawer .drawer-header-icon svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
        body.light-mode .unified-register-drawer .drawer-close-btn {
          color: #64748b !important;
        }
        body.light-mode .unified-register-drawer .drawer-close-btn:hover {
          color: #0f172a !important;
          background: rgba(0, 0, 0, 0.06) !important;
        }
        body.light-mode .unified-register-drawer .drawer-cancel-btn {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
        }
        body.light-mode .unified-register-drawer .drawer-cancel-btn:hover {
          background-color: #f1f5f9 !important;
          border-color: #94a3b8 !important;
          color: #0f172a !important;
        }
        body.light-mode .unified-register-drawer .drawer-submit-btn {
          background: #0284c7 !important;
          border: 1px solid #0284c7 !important;
          color: #ffffff !important;
        }
        body.light-mode .unified-register-drawer .drawer-submit-btn:hover {
          background: #0369a1 !important;
          border-color: #0369a1 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35) !important;
        }
        body.light-mode .unified-register-drawer .drawer-input,
        body.light-mode .unified-register-drawer .drawer-select {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .unified-register-drawer .drawer-input:focus,
        body.light-mode .unified-register-drawer .drawer-select:focus {
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2) !important;
        }
        body.light-mode .unified-register-drawer .drawer-input::placeholder,
        body.light-mode .unified-register-drawer .drawer-select::placeholder,
        body.light-mode .unified-register-drawer textarea.drawer-input::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }
        body.light-mode .unified-register-drawer .drawer-label {
          color: #1e293b !important;
          font-weight: 600 !important;
        }
        body.light-mode .unified-register-drawer .drawer-panel {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
        }
        body.light-mode .unified-register-drawer .drawer-section-heading {
          color: #0f172a !important;
        }
        body.light-mode .unified-register-drawer .drawer-selector-card {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .unified-register-drawer .drawer-selector-card:hover {
          background: #f1f5f9 !important;
        }
        body.light-mode .unified-register-drawer .drawer-custom-field-row {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
        }
        body.light-mode .unified-register-drawer .drawer-custom-add-box {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
        }
        body.light-mode .unified-register-drawer .drawer-input-sm {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .unified-register-drawer .drawer-input-sm::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }
        body.light-mode .unified-register-drawer .drawer-upload-box {
          border: 1.5px dashed #cbd5e1 !important;
          background: #f8fafc !important;
        }
        body.light-mode .unified-register-drawer .drawer-upload-box:hover {
          border-color: #0284c7 !important;
          background: rgba(2, 132, 199, 0.05) !important;
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="drawer-header">
        <div className="d-flex align-items-center gap-3">
          {IconComponent && (
            <div className="drawer-header-icon">
              <IconComponent size={18} />
            </div>
          )}
          <div>
            <h5 className="mb-0 fw-bold fs-16" style={{ letterSpacing: '-0.01em' }}>{title}</h5>
            {subtitle && <small className="text-muted fs-11">{subtitle}</small>}
          </div>
        </div>
        <button
          onClick={onHide}
          className="drawer-close-btn"
          title="Close"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── SCROLLABLE FORM BODY ── */}
      <div className="drawer-scroll-content">
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 fs-13 mb-4 rounded-2 border-0">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <Form onSubmit={onSubmit} id="unified-register-form">
          <Row className="g-3">
            {fields.map(renderField)}
          </Row>

          {/* Children slot for domain-specific custom sections */}
          {children}
        </Form>
      </div>

      {/* ── STICKY FOOTER ── */}
      <div className="drawer-footer">
        <Button
          variant="outline-secondary"
          onClick={onHide}
          disabled={submitting}
          className="drawer-cancel-btn"
        >
          {cancelLabel}
        </Button>
        <Button
          variant="info"
          type="submit"
          form="unified-register-form"
          disabled={submitting}
          className="drawer-submit-btn d-flex align-items-center gap-2"
        >
          {submitting && <Spinner size="sm" animation="border" />}
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </Offcanvas>
  );
};

export default UnifiedRegisterModal;
export { UnifiedRegisterModal as BaseRegisterDrawer, UnifiedRegisterModal as BaseRegisterModal };
