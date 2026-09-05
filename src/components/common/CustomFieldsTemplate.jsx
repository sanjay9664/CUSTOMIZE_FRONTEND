import React, { useState } from 'react';
import { Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { Plus, Trash2, Sliders, Layers, CheckSquare, Sparkles } from 'lucide-react';

export const DEFAULT_SITE_TEMPLATES = [
  { id: 'mouldings', label: 'Mouldings' },
  { id: 'extrusion', label: 'Extrusion' },
  { id: 'punch_press', label: 'Punch Press' },
  { id: 'cnc', label: 'CNC' }
];

export const DEFAULT_SITE_FEATURES = [
  { id: 'andon', label: 'Andon System' },
  { id: 'breakdown', label: 'Breakdown Reports' },
  { id: 'alert', label: 'Alert System' },
  { id: 'erp', label: 'ERP Integration' },
  { id: 'pnl', label: 'Profit & Loss' }
];

const CustomFieldsTemplate = ({
  templates = DEFAULT_SITE_TEMPLATES,
  selectedTemplates = [],
  onToggleTemplate,
  features = DEFAULT_SITE_FEATURES,
  selectedFeatures = [],
  onToggleFeature,
  customFields = [],
  onAddCustomField,
  onRemoveCustomField,
  onCustomFieldChange,
  readOnly = false
}) => {
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    if (typeof onAddCustomField === 'function') {
      onAddCustomField({
        id: `cf_${Date.now().toString(36)}`,
        name: newFieldName.trim(),
        type: newFieldType,
        value: newFieldValue.trim()
      });
    }
    setNewFieldName('');
    setNewFieldValue('');
    setNewFieldType('text');
  };

  return (
    <div className="custom-fields-template-wrapper">
      <Row className="g-4">
        {/* ── SELECT TEMPLATE ── */}
        <Col md={6}>
          <div className="template-box-panel p-3 rounded-3 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Layers size={16} className="text-info" />
              <h6 className="mb-0 fw-bold fs-14 cft-heading">Select Template</h6>
            </div>

            <div className="template-checkbox-list d-flex flex-column gap-2">
              {templates.map((tpl) => {
                const isChecked = selectedTemplates.includes(tpl.id);
                return (
                  <div
                    key={tpl.id}
                    className={`template-check-card p-2 rounded-2 border d-flex align-items-center justify-content-between ${
                      isChecked ? 'border-info active-info' : 'border-secondary border-opacity-25'
                    }`}
                    style={{ cursor: readOnly ? 'default' : 'pointer' }}
                    onClick={() => {
                      if (!readOnly && typeof onToggleTemplate === 'function') {
                        onToggleTemplate(tpl.id);
                      }
                    }}
                  >
                    <Form.Check
                      type="checkbox"
                      id={`template-${tpl.id}`}
                      label={tpl.label}
                      checked={isChecked}
                      onChange={() => {}}
                      className="mb-0 fs-13 user-select-none"
                      disabled={readOnly}
                    />
                    {isChecked && <Badge bg="info" className="text-dark fs-10">Active</Badge>}
                  </div>
                );
              })}
            </div>
          </div>
        </Col>

        {/* ── SELECT FEATURE ── */}
        <Col md={6}>
          <div className="template-box-panel p-3 rounded-3 h-100">
            <div className="d-flex align-items-center gap-2 mb-3">
              <CheckSquare size={16} className="text-success" />
              <h6 className="mb-0 fw-bold fs-14 cft-heading">Select Feature</h6>
            </div>

            <div className="feature-checkbox-list d-flex flex-column gap-2">
              {features.map((feat) => {
                const isChecked = selectedFeatures.includes(feat.id);
                return (
                  <div
                    key={feat.id}
                    className={`feature-check-card p-2 rounded-2 border d-flex align-items-center justify-content-between ${
                      isChecked ? 'border-success active-success' : 'border-secondary border-opacity-25'
                    }`}
                    style={{ cursor: readOnly ? 'default' : 'pointer' }}
                    onClick={() => {
                      if (!readOnly && typeof onToggleFeature === 'function') {
                        onToggleFeature(feat.id);
                      }
                    }}
                  >
                    <Form.Check
                      type="checkbox"
                      id={`feature-${feat.id}`}
                      label={feat.label}
                      checked={isChecked}
                      onChange={() => {}}
                      className="mb-0 fs-13 user-select-none"
                      disabled={readOnly}
                    />
                    {isChecked && <Badge bg="success" className="text-white fs-10">Enabled</Badge>}
                  </div>
                );
              })}
            </div>
          </div>
        </Col>
      </Row>

      {/* ── DYNAMIC CUSTOM FIELDS BUILDER ── */}
      <div className="dynamic-custom-fields-section mt-4 pt-3 border-top border-secondary border-opacity-25">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <Sliders size={16} className="text-warning" />
            <h6 className="mb-0 fw-bold fs-14 cft-heading">Custom Metadata Fields</h6>
          </div>
          <small className="text-muted fs-11">Extend site parameters modularly</small>
        </div>

        {/* Existing Custom Fields List */}
        {customFields && customFields.length > 0 ? (
          <div className="custom-fields-grid d-flex flex-column gap-2 mb-3">
            {customFields.map((field, idx) => (
              <div
                key={field.id || idx}
                className="cft-custom-field-row d-flex align-items-center gap-2 p-2 rounded-2"
              >
                <span className="badge bg-secondary text-white font-monospace fs-11" style={{ minWidth: '90px' }}>
                  {field.name}
                </span>
                <span className="badge bg-dark border border-secondary text-info fs-10">
                  {field.type}
                </span>
                <Form.Control
                  size="sm"
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={field.value || ''}
                  placeholder="Field value..."
                  className="cft-input-sm flex-grow-1"
                  disabled={readOnly}
                  onChange={(e) => {
                    if (typeof onCustomFieldChange === 'function') {
                      onCustomFieldChange(field.id || idx, e.target.value);
                    }
                  }}
                />
                {!readOnly && typeof onRemoveCustomField === 'function' && (
                  <Button
                    variant="link"
                    className="p-1 text-danger hover-opacity"
                    title="Remove Field"
                    onClick={() => onRemoveCustomField(field.id || idx)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2 mb-3 text-center rounded-2 border border-secondary border-opacity-10 text-muted fs-12">
            No custom fields configured for this site yet.
          </div>
        )}

        {/* Add Field Input Group */}
        {!readOnly && (
          <div className="cft-add-field-row d-flex flex-wrap align-items-center gap-2 p-2 rounded-2">
            <Form.Control
              size="sm"
              placeholder="Field name (e.g. Sanctioned Load)..."
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="cft-input-sm"
              style={{ maxWidth: '200px' }}
            />
            <Form.Select
              size="sm"
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value)}
              className="cft-input-sm"
              style={{ maxWidth: '110px' }}
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
              className="cft-input-sm flex-grow-1"
            />
            <Button
              size="sm"
              variant="info"
              onClick={handleAddField}
              disabled={!newFieldName.trim()}
              className="d-flex align-items-center gap-1 fs-12 text-dark fw-bold px-3"
            >
              <Plus size={14} /> Add Field
            </Button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-fields-template-wrapper .template-box-panel {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .custom-fields-template-wrapper .cft-heading {
          color: #f8fafc;
        }
        .custom-fields-template-wrapper .template-check-card,
        .custom-fields-template-wrapper .feature-check-card {
          background: rgba(15, 23, 42, 0.6);
          transition: all 0.15s ease;
        }
        .custom-fields-template-wrapper .template-check-card:hover,
        .custom-fields-template-wrapper .feature-check-card:hover {
          background: rgba(30, 41, 59, 0.8);
        }
        .custom-fields-template-wrapper .template-check-card.active-info {
          background: rgba(6, 182, 212, 0.12) !important;
        }
        .custom-fields-template-wrapper .feature-check-card.active-success {
          background: rgba(34, 197, 94, 0.12) !important;
        }
        .custom-fields-template-wrapper .cft-custom-field-row {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .custom-fields-template-wrapper .cft-add-field-row {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .custom-fields-template-wrapper .cft-input-sm {
          background-color: #0f172a !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
          font-size: 12px !important;
          border-radius: 4px !important;
        }
        .custom-fields-template-wrapper .cft-input-sm::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }
        .hover-opacity:hover {
          opacity: 0.75;
        }

        /* ── Light Mode Overrides ── */
        body.light-mode .custom-fields-template-wrapper .template-box-panel {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
        }
        body.light-mode .custom-fields-template-wrapper .cft-heading {
          color: #0f172a !important;
        }
        body.light-mode .custom-fields-template-wrapper .template-check-card,
        body.light-mode .custom-fields-template-wrapper .feature-check-card {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .custom-fields-template-wrapper .template-check-card:hover,
        body.light-mode .custom-fields-template-wrapper .feature-check-card:hover {
          background: #f1f5f9 !important;
        }
        body.light-mode .custom-fields-template-wrapper .cft-custom-field-row {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
        }
        body.light-mode .custom-fields-template-wrapper .cft-add-field-row {
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
        }
        body.light-mode .custom-fields-template-wrapper .cft-input-sm {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .custom-fields-template-wrapper .cft-input-sm::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }
      `}} />
    </div>
  );
};

export default CustomFieldsTemplate;
