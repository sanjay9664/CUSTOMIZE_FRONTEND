import React, { useState, useEffect } from 'react';
import { Offcanvas, Badge, Button, Row, Col, Spinner, Table } from 'react-bootstrap';
import {
  Cpu, MapPin, Box, Sliders, Edit3, Trash2, CheckCircle2,
  AlertTriangle, Copy, Check, Clock, ExternalLink, Activity, RefreshCw
} from 'lucide-react';
import bmsService from '../../../services/bmsService';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const DeviceInspectorDrawer = ({
  show = false,
  onHide = () => {},
  device = null,
  sites = [],
  assets = [],
  onEdit = () => {},
  onDelete = () => {},
  onOpenAsset = () => {}
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'telemetry' | 'settings'
  const [liveData, setLiveData] = useState(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState(null);

  const handleCopySn = () => {
    const val = device?.serialNumber || device?.bmsDeviceId || device?.id;
    if (val) {
      navigator.clipboard.writeText(String(val));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch live field readings when drawer opens or device changes
  useEffect(() => {
    if (!show || !device?.id || !device?.siteId) {
      setLiveData(null);
      return;
    }
    let isMounted = true;
    const fetchLive = async () => {
      setLoadingLive(true);
      setLiveError(null);
      try {
        const res = await bmsService.getDeviceLiveTelemetry(device.siteId, device.id);
        if (isMounted) {
          const data = res?.data || res || {};
          setLiveData(data);
        }
      } catch (err) {
        if (isMounted) {
          setLiveError('Live telemetry stream unavailable');
          setLiveData(null);
        }
      } finally {
        if (isMounted) setLoadingLive(false);
      }
    };
    fetchLive();
    return () => { isMounted = false; };
  }, [show, device?.id, device?.siteId]);

  if (!device) return null;

  const siteObj = sites.find(s => String(s.id) === String(device.siteId));
  const siteName = siteObj?.name || (device.siteId ? `Site #${device.siteId}` : 'Universal / Unassigned');

  const linkedAsset = assets.find(a => String(a.id) === String(device.assetId)) || (device.asset ? device.asset : null);

  const isActive = device.isActive !== false;

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="device-inspector-offcanvas"
      style={{
        width: 'min(92vw, 680px)',
        zIndex: 1055
      }}
    >
      <style>{`
        .device-inspector-offcanvas {
          background-color: #0f172a;
          color: #f8fafc;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }
        body:not(.light-mode) .device-inspector-offcanvas .btn-close {
          filter: invert(1) grayscale(100%) brightness(200%);
        }
        body.light-mode .device-inspector-offcanvas {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-left: 1px solid #cbd5e1 !important;
        }
        body.light-mode .device-inspector-offcanvas .btn-close {
          filter: none !important;
        }
        .device-inspector-offcanvas .offcanvas-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 18px 24px;
        }
        body.light-mode .device-inspector-offcanvas .offcanvas-header {
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .device-inspector-offcanvas .offcanvas-body {
          padding: 24px;
          overflow-y: auto;
        }
        .inspector-tab-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.82rem;
          padding: 8px 14px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .inspector-tab-btn:hover {
          color: #f8fafc;
        }
        .inspector-tab-btn.active {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
        }
        body.light-mode .inspector-tab-btn {
          color: #64748b !important;
        }
        body.light-mode .inspector-tab-btn:hover {
          color: #0f172a !important;
        }
        body.light-mode .inspector-tab-btn.active {
          background: #e0f2fe !important;
          color: #0284c7 !important;
        }
        .inspector-section-card {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        body.light-mode .inspector-section-card {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
        }
        .drawer-inner-box {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
        }
        body.light-mode .drawer-inner-box {
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
      `}</style>

      <Offcanvas.Header closeButton>
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8'
            }}
          >
            <Cpu size={22} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <Offcanvas.Title className="fs-5 fw-bold drawer-title mb-0">
                {device.name}
              </Offcanvas.Title>
              <Badge bg={isActive ? 'success' : 'secondary'} className="px-2 py-0.5 fs-11">
                {isActive ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
              <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 fs-11">
                {device.category ? device.category.replace(/_/g, ' ') : 'DEVICE'}
              </span>
            </div>
            <div className="fs-12 text-muted d-flex align-items-center gap-2 mt-1">
              <span>Site: <strong className="drawer-text-primary">{siteName}</strong></span>
              <span>•</span>
              <span className="font-monospace text-muted">SN: {device.serialNumber || device.bmsDeviceId || 'N/A'}</span>
              {(device.serialNumber || device.id) && (
                <button
                  type="button"
                  onClick={handleCopySn}
                  className="btn btn-link p-0 text-muted hover-text-white d-inline-flex align-items-center"
                  title="Copy Identifier"
                >
                  {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </Offcanvas.Header>

      <Offcanvas.Body>
        {/* Navigation & Quick Actions Bar */}
        <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary border-opacity-20">
          <div className="d-flex gap-2">
            <button
              type="button"
              className={`inspector-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`inspector-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              Live Telemetry
            </button>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="d-flex align-items-center gap-1.5 px-3 py-1.5 fs-12 rounded-2"
              onClick={() => onEdit(device)}
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              className="d-flex align-items-center gap-1.5 px-3 py-1.5 fs-12 rounded-2"
              onClick={() => onDelete(device)}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div>
            {/* Core Device Properties */}
            <div className="inspector-section-card">
              <h6 className="fs-12 text-uppercase text-muted fw-bold mb-3 tracking-wider">Device Identity</h6>
              <Row className="g-3">
                <Col xs={6}>
                  <div className="fs-11 text-muted">Serial Number</div>
                  <div className="fs-13 fw-semibold font-monospace text-info mt-0.5">{device.serialNumber || 'N/A'}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">BMS Device ID</div>
                  <div className="fs-13 fw-semibold font-monospace text-slate-200 mt-0.5">{device.bmsDeviceId || 'N/A'}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Category</div>
                  <div className="fs-13 fw-semibold text-slate-200 mt-0.5">{device.category || 'ENERGY_METER'}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Operational Status</div>
                  <div className="fs-13 fw-semibold text-slate-200 mt-0.5 d-flex align-items-center gap-1.5">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#22c55e' : '#94a3b8'
                      }}
                    />
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Asset Placement Card */}
            <div className="inspector-section-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fs-12 text-uppercase text-muted fw-bold mb-0 tracking-wider">Physical Asset Placement</h6>
                {linkedAsset && (
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="py-0.5 px-2 fs-11 d-flex align-items-center gap-1"
                    onClick={() => onOpenAsset(linkedAsset)}
                  >
                    <ExternalLink size={12} />
                    <span>Open Asset</span>
                  </Button>
                )}
              </div>

              <div className="p-3 drawer-inner-box">
                <div className="d-flex align-items-center gap-2 mb-2 text-muted fs-12">
                  <MapPin size={14} className="text-info" />
                  <span>Site: <strong className="drawer-text-primary">{siteName}</strong></span>
                </div>

                {linkedAsset ? (
                  <div className="d-flex align-items-center gap-2 ps-3 py-1.5 border-start border-info">
                    <Box size={16} className="text-info" />
                    <div>
                      <div className="fs-13 fw-bold drawer-text-primary">{linkedAsset.name}</div>
                      <div className="fs-11 text-muted">
                        Type: {linkedAsset.assetType || 'EQUIPMENT'} {linkedAsset.serialNumber ? `• SN: ${linkedAsset.serialNumber}` : ''}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted fs-12 ps-3 py-1 border-start border-secondary border-opacity-40">
                    Unassigned (Device is registered at site level)
                  </div>
                )}
              </div>
            </div>

            {/* Hardware & Sochiot Provisioning */}
            <div className="inspector-section-card">
              <h6 className="fs-12 text-uppercase text-muted fw-bold mb-3 tracking-wider">Hardware & Sochiot IDs</h6>
              <Row className="g-3">
                <Col xs={6}>
                  <div className="fs-11 text-muted">Profile ID</div>
                  <div className="fs-13 font-monospace text-slate-200 mt-0.5">{device.profileId || 'N/A'}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Template Name</div>
                  <div className="fs-13 text-slate-200 mt-0.5">{device.templateName || 'None'}</div>
                </Col>
                <Col xs={12}>
                  <div className="fs-11 text-muted">Sochiot Hardware Device IDs</div>
                  <div className="fs-13 font-monospace text-info mt-0.5">
                    {Array.isArray(device.sochiotDeviceIds) && device.sochiotDeviceIds.length > 0
                      ? device.sochiotDeviceIds.join(', ')
                      : 'None configured'}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Timestamps Card */}
            <div className="inspector-section-card">
              <h6 className="fs-12 text-uppercase text-muted fw-bold mb-3 tracking-wider">Timestamps & Audit</h6>
              <Row className="g-3">
                <Col xs={6}>
                  <div className="fs-11 text-muted">Installed At</div>
                  <div className="fs-13 drawer-text-secondary mt-0.5">{formatDate(device.installedAt)}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Last Seen</div>
                  <div className="fs-13 drawer-text-secondary mt-0.5">{formatDate(device.lastSeenAt)}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Created At</div>
                  <div className="fs-13 drawer-text-secondary mt-0.5">{formatDate(device.createdAt)}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Updated At</div>
                  <div className="fs-13 drawer-text-secondary mt-0.5">{formatDate(device.updatedAt)}</div>
                </Col>
              </Row>
            </div>
          </div>
        )}

        {/* Tab 2: Live Telemetry */}
        {activeTab === 'telemetry' && (
          <div>
            <div className="inspector-section-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fs-12 text-uppercase text-muted fw-bold mb-0 tracking-wider">
                  Live Sensor Stream & Field Readings
                </h6>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="py-0.5 px-2 fs-11 d-flex align-items-center gap-1"
                  onClick={() => {
                    setLoadingLive(true);
                    bmsService.getDeviceLiveTelemetry(device.siteId, device.id)
                      .then(res => setLiveData(res?.data || res || {}))
                      .catch(() => setLiveError('Unable to update telemetry'))
                      .finally(() => setLoadingLive(false));
                  }}
                  disabled={loadingLive}
                >
                  <RefreshCw size={12} className={loadingLive ? 'spin' : ''} />
                  <span>Refresh</span>
                </Button>
              </div>

              {loadingLive ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" variant="info" />
                  <div className="fs-12 text-muted mt-2">Connecting to live telemetry stream...</div>
                </div>
              ) : liveError || !liveData || Object.keys(liveData).length === 0 ? (
                <div className="text-center py-4 text-muted fs-13">
                  <Activity size={24} className="mb-2 opacity-40 text-slate-500" />
                  <div>{liveError || 'No live telemetry snapshot available for this device.'}</div>
                </div>
              ) : (
                <Table responsive borderless className="table-custom fs-12 mb-0">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Value</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(liveData).map(([key, val]) => (
                      <tr key={key}>
                        <td className="fw-semibold text-slate-200">{key}</td>
                        <td className="font-monospace text-info">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </td>
                        <td className="text-muted">{val?.unit || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default DeviceInspectorDrawer;
