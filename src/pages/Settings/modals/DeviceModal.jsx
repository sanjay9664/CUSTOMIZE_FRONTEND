import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Cpu, MapPin, Box, Sliders, Layers, AlertTriangle } from 'lucide-react';
import bmsService from '../../../services/bmsService';
import { normalizeList } from '../../../services/apiClient';

export const DEVICE_CATEGORIES = [
  'ENERGY_METER',
  'UG_TANK',
  'AG_TANK',
  'PUMP',
  'VALVE',
  'GENERATOR',
  'LT_PANEL',
  'FIRE_PUMP',
  'HVAC_CHILLER',
  'HVAC_AHU',
  'HVAC_COOLING_TOWER',
  'VRV',
  'AQI_SENSOR',
  'BREAKER',
  'STP',
  'WTP',
  'LIFT',
  'LIGHTING',
  'FIRE_PANEL',
  'CONTROLLER',
  'SENSOR',
  'AC',
  'OTHER'
];

const DeviceModal = ({
  show = false,
  onHide = () => {},
  editingDevice = null,
  sites = [],
  onSaveSuccess = () => {}
}) => {
  const isEdit = Boolean(editingDevice);

  const [form, setForm] = useState({
    name: '',
    category: 'ENERGY_METER',
    siteId: '',
    assetId: '',
    serialNumber: '',
    bmsDeviceId: '',
    profileId: 'prf_default',
    sochiotDeviceIds: '',
    templateName: '',
    description: '',
    isActive: true
  });

  const [availableAssets, setAvailableAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sync form data when modal opens or editingDevice changes
  useEffect(() => {
    if (show) {
      setError(null);
      if (editingDevice) {
        setForm({
          name: editingDevice.name || '',
          category: editingDevice.category || 'ENERGY_METER',
          siteId: editingDevice.siteId ? String(editingDevice.siteId) : (sites[0]?.id ? String(sites[0].id) : '7'),
          assetId: editingDevice.assetId ? String(editingDevice.assetId) : '',
          serialNumber: editingDevice.serialNumber || '',
          bmsDeviceId: editingDevice.bmsDeviceId || '',
          profileId: editingDevice.profileId || 'prf_default',
          sochiotDeviceIds: Array.isArray(editingDevice.sochiotDeviceIds)
            ? editingDevice.sochiotDeviceIds.join(', ')
            : (editingDevice.sochiotDeviceIds || ''),
          templateName: editingDevice.templateName || '',
          description: editingDevice.description || '',
          isActive: editingDevice.isActive !== undefined ? Boolean(editingDevice.isActive) : true
        });
      } else {
        const defaultSiteId = sites[0]?.id ? String(sites[0].id) : '7';
        setForm({
          name: '',
          category: 'ENERGY_METER',
          siteId: defaultSiteId,
          assetId: '',
          serialNumber: '',
          bmsDeviceId: '',
          profileId: 'prf_default',
          sochiotDeviceIds: '',
          templateName: '',
          description: '',
          isActive: true
        });
      }
    }
  }, [show, editingDevice, sites]);

  // Fetch available assets when siteId changes
  useEffect(() => {
    if (!show || !form.siteId) {
      setAvailableAssets([]);
      return;
    }
    let isMounted = true;
    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const res = await bmsService.getAssets(form.siteId, { limit: 200 });
        if (isMounted) {
          const list = normalizeList(res, 'assets');
          setAvailableAssets(list);
        }
      } catch (err) {
        if (isMounted) setAvailableAssets([]);
      } finally {
        if (isMounted) setLoadingAssets(false);
      }
    };
    fetchAssets();
    return () => { isMounted = false; };
  }, [show, form.siteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Device Name is required.');
      return;
    }

    // Parse Sochiot Device IDs
    let parsedSochiotIds = [];
    if (form.sochiotDeviceIds) {
      if (typeof form.sochiotDeviceIds === 'string') {
        parsedSochiotIds = form.sochiotDeviceIds
          .split(',')
          .map(s => Number(s.trim()))
          .filter(n => !isNaN(n) && n > 0);
      } else if (Array.isArray(form.sochiotDeviceIds)) {
        parsedSochiotIds = form.sochiotDeviceIds.map(Number).filter(n => !isNaN(n) && n > 0);
      }
    }

    if (!isEdit && parsedSochiotIds.length === 0) {
      // Default auto-generated fallback if none provided to comply with OpenAPI requirement
      parsedSochiotIds = [Math.floor(1000 + Math.random() * 8999)];
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      profileId: form.profileId || 'prf_default',
      sochiotDeviceIds: parsedSochiotIds,
      serialNumber: form.serialNumber.trim() || null,
      bmsDeviceId: form.bmsDeviceId.trim() || null,
      description: form.description.trim() || null,
      templateName: form.templateName.trim() || null,
      assetId: form.assetId ? String(form.assetId) : null,
      isActive: form.isActive
    };

    setSubmitting(true);
    try {
      const siteIdNum = Number(form.siteId || (sites[0]?.id || 7));
      if (isEdit) {
        await bmsService.updateSiteDevice(siteIdNum, editingDevice.id, payload);
      } else {
        await bmsService.createSiteDevice(siteIdNum, payload);
      }
      onSaveSuccess();
      onHide();
    } catch (err) {
      console.error('Save device error:', err);
      setError(err.message || 'Failed to save device. Please check input values.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="scada-device-modal"
    >
      <style>{`
        .scada-device-modal .modal-content {
          background-color: #0f172a;
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
        }
        body.light-mode .scada-device-modal .modal-content {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }
        .scada-device-modal .modal-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 24px;
        }
        body.light-mode .scada-device-modal .modal-header {
          border-bottom-color: #e2e8f0 !important;
        }
        .scada-device-modal .modal-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 24px;
        }
        body.light-mode .scada-device-modal .modal-footer {
          border-top-color: #e2e8f0 !important;
        }
        .scada-device-modal .form-control,
        .scada-device-modal .form-select {
          background-color: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f8fafc;
          font-size: 0.84rem;
          border-radius: 6px;
        }
        body.light-mode .scada-device-modal .form-control,
        body.light-mode .scada-device-modal .form-select {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .scada-device-modal .form-control:focus,
        .scada-device-modal .form-select:focus {
          border-color: #0284c7 !important;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2) !important;
        }
        .scada-device-modal label {
          font-size: 0.76rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        body.light-mode .scada-device-modal label {
          color: #64748b !important;
        }
      `}</style>

      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
          <Cpu size={18} className="text-info" />
          <span>{isEdit ? `Edit Device: ${editingDevice.name}` : 'Provision New Device'}</span>
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {error && (
            <Alert variant="danger" className="py-2 fs-12 d-flex align-items-center gap-2 mb-3">
              <AlertTriangle size={16} />
              <div>{error}</div>
            </Alert>
          )}

          <Row className="g-3">
            {/* Device Identity Section */}
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Device Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. EM_LIVEWIZE_178"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Device Category <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  {DEVICE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Serial Number & BMS Device ID */}
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Serial Number (SN)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. 9454c5f385e821"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>BMS Device ID / Code</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. BMS-DEV-001"
                  value={form.bmsDeviceId}
                  onChange={(e) => setForm({ ...form, bmsDeviceId: e.target.value })}
                />
              </Form.Group>
            </Col>

            {/* Asset Linkage & Site Section */}
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Physical Site</Form.Label>
                <Form.Select
                  value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value, assetId: '' })}
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Linked Asset (Hierarchy Placement)</Form.Label>
                <Form.Select
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  disabled={loadingAssets}
                >
                  <option value="">-- Unassigned (Site-Level Device) --</option>
                  {availableAssets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} [{a.assetType || 'EQUIPMENT'}] {a.serialNumber ? `(SN: ${a.serialNumber})` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Hardware & Sochiot Connection */}
            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Sochiot Hardware IDs (Comma-separated)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. 1231, 1232"
                  value={form.sochiotDeviceIds}
                  onChange={(e) => setForm({ ...form, sochiotDeviceIds: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group>
                <Form.Label>Template Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. EnergyMeter_Template_V1"
                  value={form.templateName}
                  onChange={(e) => setForm({ ...form, templateName: e.target.value })}
                />
              </Form.Group>
            </Col>

            {/* Description & Operational Status */}
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Description / Installation Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Additional operational details or location notes..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Check
                type="switch"
                id="device-is-active-switch"
                label="Operational Status: Active"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="fs-13 fw-semibold text-info"
              />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={submitting}
            style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderColor: '#0284c7' }}
          >
            {submitting ? <Spinner animation="border" size="sm" /> : (isEdit ? 'Save Device' : 'Provision Device')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DeviceModal;
