import React, { useState, useEffect } from 'react';
import { Offcanvas, Badge, Button, Row, Col, Spinner, Table } from 'react-bootstrap';
import {
  Sliders, MapPin, Server, AlertTriangle, Zap, ExternalLink,
  Edit3, CheckCircle2, Clock, Layers, GitFork, Cpu,
  Copy, Check, Trash2, ArrowRight, CornerDownRight, Box
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import bmsService from '../../../services/bmsService';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getTypeBadgeClass = (type) => {
  const t = String(type || '').toUpperCase();
  if (t === 'BUILDING') return 'type-building';
  if (['FLOOR', 'AREA'].includes(t)) return 'type-space';
  if (['ROOM', 'CUBICLE'].includes(t)) return 'type-room';
  return 'type-equipment';
};

const AssetInspectorDrawer = ({
  show = false,
  onHide = () => {},
  asset = null,
  allAssets = [],
  sites = [],
  onEdit = () => {},
  onDelete = () => {}
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'hierarchy' | 'devices' | 'metadata'
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devicesError, setDevicesError] = useState(null);

  // Copy Serial Number / Asset ID helper
  const handleCopySnOrId = () => {
    const val = asset?.serialNumber || asset?.id;
    if (val) {
      navigator.clipboard.writeText(String(val));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch linked devices when asset changes or drawer opens
  useEffect(() => {
    if (!show || !asset?.id) {
      setDevices([]);
      return;
    }

    let isMounted = true;
    const fetchDevices = async () => {
      setLoadingDevices(true);
      setDevicesError(null);
      try {
        const res = await bmsService.getAssetDevices(asset.id);
        if (isMounted) {
          const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
          setDevices(list);
        }
      } catch (err) {
        if (isMounted) {
          // If endpoint is not supported by legacy backend or returns 404, fallback gracefully to sochiotDeviceIds if any
          if (Array.isArray(asset.sochiotDeviceIds) && asset.sochiotDeviceIds.length > 0) {
            setDevices(asset.sochiotDeviceIds.map(devId => ({ id: devId, name: `Device #${devId}`, category: 'HARDWARE' })));
          } else {
            setDevices([]);
          }
          setDevicesError(err.message || 'Unable to fetch connected devices');
        }
      } finally {
        if (isMounted) setLoadingDevices(false);
      }
    };

    fetchDevices();
    return () => { isMounted = false; };
  }, [show, asset?.id, asset?.sochiotDeviceIds]);

  if (!asset) return null;

  // Site resolving
  const matchedSite = sites.find(s => String(s.id) === String(asset.siteId)) || asset.site;
  const siteName = matchedSite?.name || (asset.siteId ? `Site #${asset.siteId}` : 'Universal / Unassigned');

  // Hierarchy resolving
  const parentAsset = allAssets.find(a => String(a.id) === String(asset.parentId || asset.parentAssetId));
  const childAssets = allAssets.filter(a => String(a.parentId || a.parentAssetId) === String(asset.id));

  // Build ancestral breadcrumb
  const breadcrumb = [];
  let currentParent = parentAsset;
  const visited = new Set();
  while (currentParent && !visited.has(currentParent.id)) {
    visited.add(currentParent.id);
    breadcrumb.unshift(currentParent);
    currentParent = allAssets.find(a => String(a.id) === String(currentParent.parentId || currentParent.parentAssetId));
  }

  const isInactive = asset.status === 'INACTIVE' || asset.deletedAt;
  const isMaintenance = asset.status === 'MAINTENANCE';

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="asset-inspector-offcanvas"
      style={{
        width: 'min(92vw, 680px)',
        zIndex: 1055
      }}
    >
      <style>{`
        .asset-inspector-offcanvas {
          background-color: #0f172a;
          color: #f8fafc;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }
        body:not(.light-mode) .asset-inspector-offcanvas .btn-close {
          filter: invert(1) grayscale(100%) brightness(200%);
        }
        body.light-mode .asset-inspector-offcanvas {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-left: 1px solid #cbd5e1 !important;
        }
        body.light-mode .asset-inspector-offcanvas .btn-close {
          filter: none !important;
        }
        .asset-inspector-offcanvas .offcanvas-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 18px 24px;
        }
        body.light-mode .asset-inspector-offcanvas .offcanvas-header {
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .asset-inspector-offcanvas .offcanvas-body {
          padding: 24px;
          overflow-y: auto;
        }
        .asset-inspector-offcanvas .offcanvas-body::-webkit-scrollbar {
          width: 6px;
        }
        .asset-inspector-offcanvas .offcanvas-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 4px;
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
        .drawer-title {
          color: #f8fafc;
        }
        body.light-mode .drawer-title {
          color: #0f172a !important;
        }
        .drawer-text-primary {
          color: #f8fafc;
        }
        body.light-mode .drawer-text-primary {
          color: #0f172a !important;
        }
        .drawer-text-secondary {
          color: #cbd5e1;
        }
        body.light-mode .drawer-text-secondary {
          color: #475569 !important;
        }

        /* ── Crisp Asset Type Badges ── */
        .asset-type-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          line-height: 1.3;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
        }
        body.light-mode .asset-type-badge {
          background: #f1f5f9 !important;
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
        }
        .asset-type-badge.type-building {
          background: rgba(14, 165, 233, 0.15);
          border: 1px solid rgba(14, 165, 233, 0.35);
          color: #38bdf8;
        }
        body.light-mode .asset-type-badge.type-building {
          background: #e0f2fe !important;
          border-color: #bae6fd !important;
          color: #0369a1 !important;
        }
        .asset-type-badge.type-space {
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.35);
          color: #c084fc;
        }
        body.light-mode .asset-type-badge.type-space {
          background: #f3e8ff !important;
          border-color: #e9d5ff !important;
          color: #7e22ce !important;
        }
        .asset-type-badge.type-equipment {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fbbf24;
        }
        body.light-mode .asset-type-badge.type-equipment {
          background: #fef3c7 !important;
          border-color: #fde68a !important;
          color: #b45309 !important;
        }
        .asset-type-badge.type-room {
          background: rgba(20, 184, 166, 0.15);
          border: 1px solid rgba(20, 184, 166, 0.35);
          color: #2dd4bf;
        }
        body.light-mode .asset-type-badge.type-room {
          background: #ccfbf1 !important;
          border-color: #99f6e4 !important;
          color: #0f766e !important;
        }
      `}</style>

      {/* Header */}
      <Offcanvas.Header closeButton>
        <div className="d-flex align-items-center gap-3">
          <div
            className="p-2.5 rounded-3 d-flex align-items-center justify-content-center"
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}
          >
            <Sliders size={22} className="text-info" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <Offcanvas.Title className="fs-5 fw-bold drawer-title mb-0">
                {asset.name}
              </Offcanvas.Title>
              <Badge
                bg={isInactive ? 'secondary' : (isMaintenance ? 'warning' : 'success')}
                className="px-2 py-0.5 fs-11"
              >
                {asset.status || (isInactive ? 'INACTIVE' : 'ACTIVE')}
              </Badge>
              <span className={`asset-type-badge ${getTypeBadgeClass(asset.assetType)}`}>
                {asset.assetType || 'EQUIPMENT'}
              </span>
            </div>
            <div className="fs-12 text-muted d-flex align-items-center gap-2 mt-1">
              <span>Site: <strong className="drawer-text-primary">{siteName}</strong></span>
              <span>•</span>
              <span className="font-monospace text-muted">SN: {asset.serialNumber || 'N/A'}</span>
              {(asset.serialNumber || asset.id) && (
                <button
                  type="button"
                  onClick={handleCopySnOrId}
                  className="btn btn-link p-0 text-muted hover-text-white d-inline-flex align-items-center"
                  title="Copy Serial Number"
                >
                  {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </Offcanvas.Header>

      <Offcanvas.Body>
        {/* Quick Actions Bar */}
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
              className={`inspector-tab-btn ${activeTab === 'hierarchy' ? 'active' : ''}`}
              onClick={() => setActiveTab('hierarchy')}
            >
              Hierarchy ({childAssets.length})
            </button>
            <button
              type="button"
              className={`inspector-tab-btn ${activeTab === 'devices' ? 'active' : ''}`}
              onClick={() => setActiveTab('devices')}
            >
              Devices ({devices.length})
            </button>
            <button
              type="button"
              className={`inspector-tab-btn ${activeTab === 'metadata' ? 'active' : ''}`}
              onClick={() => setActiveTab('metadata')}
            >
              Specs & Metadata
            </button>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="d-flex align-items-center gap-1.5 px-3 py-1.5 fs-12 rounded-2"
              onClick={() => onEdit(asset)}
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              className="d-flex align-items-center gap-1.5 px-3 py-1.5 fs-12 rounded-2"
              onClick={() => onDelete(asset)}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div>
            <div className="inspector-section-card">
              <h6 className="fs-12 text-uppercase text-muted fw-bold mb-3 tracking-wider">Core Properties</h6>
              <Row className="g-3">
                <Col xs={6}>
                  <div className="fs-11 text-muted">Serial Number</div>
                  <div className="fs-13 fw-semibold font-monospace text-info mt-0.5">{asset.serialNumber || 'N/A'}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Asset Type</div>
                  <div className="fs-13 fw-semibold text-slate-200 mt-0.5">{asset.assetType || 'EQUIPMENT'}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Operational Status</div>
                  <div className="fs-13 fw-semibold text-slate-200 mt-0.5 d-flex align-items-center gap-1.5">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isInactive ? '#94a3b8' : (isMaintenance ? '#f59e0b' : '#22c55e')
                      }}
                    />
                    {asset.status || (isInactive ? 'INACTIVE' : 'ACTIVE')}
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Hierarchy Depth</div>
                  <div className="fs-13 fw-semibold text-slate-200 mt-0.5">
                    Level {asset.depth !== undefined ? asset.depth : (parentAsset ? 1 : 0)}
                  </div>
                </Col>
                {asset.description && (
                  <Col xs={12}>
                    <div className="fs-11 text-muted">Description</div>
                    <div className="fs-13 drawer-text-secondary mt-0.5">{asset.description}</div>
                  </Col>
                )}
              </Row>
            </div>

            <div className="inspector-section-card">
              <h6 className="fs-12 text-uppercase text-muted fw-bold mb-3 tracking-wider">Audit & Timestamps</h6>
              <Row className="g-3">
                <Col xs={6}>
                  <div className="fs-11 text-muted">Created On</div>
                  <div className="fs-13 drawer-text-secondary mt-0.5">{formatDate(asset.createdAt)}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Last Updated</div>
                  <div className="fs-13 drawer-text-secondary mt-0.5">{formatDate(asset.updatedAt)}</div>
                </Col>
                {asset.deletedAt && (
                  <Col xs={12}>
                    <div className="fs-11 text-danger">Soft Deleted At</div>
                    <div className="fs-13 text-danger mt-0.5">{formatDate(asset.deletedAt)}</div>
                  </Col>
                )}
              </Row>
            </div>
          </div>
        )}

        {/* Tab 2: Hierarchy */}
        {activeTab === 'hierarchy' && (
          <div>
            {/* Ancestor Breadcrumb Path */}
            <div className="inspector-section-card">
              <h6 className="fs-12 text-uppercase text-muted fw-bold mb-3 tracking-wider">Physical Hierarchy Tree</h6>
              <div className="p-3 drawer-inner-box">
                <div className="d-flex align-items-center gap-2 mb-2 text-muted fs-12">
                  <MapPin size={14} className="text-info" />
                  <span>Site: <strong className="drawer-text-primary">{siteName}</strong></span>
                </div>
                {breadcrumb.map((ancestor) => (
                  <div key={ancestor.id} className="d-flex align-items-center gap-2 ps-3 py-1 border-start border-secondary border-opacity-40">
                    <CornerDownRight size={14} className="text-slate-500" />
                    <span className="fs-13 drawer-text-secondary">{ancestor.name}</span>
                    <span className={`asset-type-badge ${getTypeBadgeClass(ancestor.assetType)}`}>
                      {ancestor.assetType}
                    </span>
                  </div>
                ))}
                <div className="d-flex align-items-center gap-2 ps-3 py-1.5 border-start border-info">
                  <CornerDownRight size={14} className="text-info" />
                  <strong className="fs-14 drawer-text-primary">{asset.name}</strong>
                  <Badge bg="info" className="fs-10 text-dark">Current Node</Badge>
                </div>
              </div>
            </div>

            {/* Direct Child Assets */}
            <div className="inspector-section-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fs-12 text-uppercase text-muted fw-bold mb-0 tracking-wider">
                  Child Assets ({childAssets.length})
                </h6>
              </div>
              {childAssets.length === 0 ? (
                <div className="text-center py-4 text-muted fs-13">
                  <GitFork size={24} className="mb-2 opacity-40 text-slate-500" />
                  <div>No child assets registered under this node.</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {childAssets.map(child => (
                    <div
                      key={child.id}
                      className="p-2.5 drawer-inner-box d-flex align-items-center justify-content-between"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <Box size={16} className="text-info" />
                        <div>
                          <div className="fs-13 fw-semibold drawer-text-primary">{child.name}</div>
                          <div className="fs-11 text-muted font-monospace">{child.serialNumber || child.id}</div>
                        </div>
                      </div>
                      <span className={`asset-type-badge ${getTypeBadgeClass(child.assetType)}`}>
                        {child.assetType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Connected Devices */}
        {activeTab === 'devices' && (
          <div>
            <div className="inspector-section-card">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fs-12 text-uppercase text-muted fw-bold mb-0 tracking-wider">
                  Connected IoT Devices ({devices.length})
                </h6>
                <Button
                  variant="link"
                  size="sm"
                  className="text-info p-0 fs-12 text-decoration-none d-flex align-items-center gap-1"
                  onClick={() => navigate('/settings/devices')}
                >
                  <span>Go to Device Management</span>
                  <ExternalLink size={12} />
                </Button>
              </div>

              {loadingDevices ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" variant="info" />
                  <div className="fs-12 text-muted mt-2">Loading connected hardware...</div>
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-4 text-muted fs-13">
                  <Cpu size={28} className="mb-2 opacity-40 text-slate-500" />
                  <div>No hardware devices mapped directly to this asset.</div>
                  <div className="fs-11 text-slate-400 mt-1">Devices can be provisioned and assigned in Device Management.</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {devices.map((dev, idx) => (
                    <div
                      key={dev.id || idx}
                      className="p-3 drawer-inner-box d-flex align-items-center justify-content-between"
                    >
                      <div className="d-flex align-items-center gap-2.5">
                        <div className="p-1.5 rounded bg-info bg-opacity-10 text-info">
                          <Cpu size={18} />
                        </div>
                        <div>
                          <div className="fs-13 fw-bold drawer-text-primary">{dev.name || `Device #${dev.id}`}</div>
                          <div className="fs-11 text-muted font-monospace">
                            {dev.serialNumber ? `SN: ${dev.serialNumber}` : `ID: ${dev.id}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <Badge bg="dark" className="border border-info border-opacity-30 text-info fs-11">
                          {dev.category || dev.type || 'CONTROLLER'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Technical Specs & Metadata */}
        {activeTab === 'metadata' && (
          <div>
            <div className="inspector-section-card">
              <h6 className="fs-12 text-uppercase text-muted fw-bold mb-3 tracking-wider">Hardware & Deployment Specs</h6>
              <Row className="g-3">
                <Col xs={6}>
                  <div className="fs-11 text-muted">Serial Number</div>
                  <div className="fs-13 font-monospace text-slate-200 mt-0.5">{asset.serialNumber || 'Not documented'}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Firmware Version</div>
                  <div className="fs-13 font-monospace text-slate-200 mt-0.5">{asset.firmware || 'N/A'}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Installation Date</div>
                  <div className="fs-13 text-slate-300 mt-0.5">{formatDate(asset.installDate)}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Installed By</div>
                  <div className="fs-13 text-slate-300 mt-0.5">{asset.installBy || 'Unspecified'}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Last Field Visit</div>
                  <div className="fs-13 text-slate-300 mt-0.5">{formatDate(asset.lastVisitDate)}</div>
                </Col>
                <Col xs={6}>
                  <div className="fs-11 text-muted">Display Order Index</div>
                  <div className="fs-13 text-slate-300 mt-0.5">{asset.order !== undefined ? asset.order : 0}</div>
                </Col>
              </Row>
            </div>

            {/* Custom Metadata Object */}
            <div className="inspector-section-card">
              <h6 className="fs-12 text-uppercase text-muted fw-bold mb-3 tracking-wider">Custom Fields & Metadata</h6>
              {asset.metadata && Object.keys(asset.metadata).length > 0 ? (
                <div className="table-responsive">
                  <Table size="sm" className="mb-0 text-slate-300 fs-12">
                    <thead>
                      <tr className="border-bottom border-secondary border-opacity-30">
                        <th className="text-muted fw-semibold">Key</th>
                        <th className="text-muted fw-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(asset.metadata).map(([key, val]) => (
                        <tr key={key} className="border-bottom border-secondary border-opacity-15">
                          <td className="font-monospace text-info">{key}</td>
                          <td>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-3 text-muted fs-13">
                  No custom metadata defined for this asset.
                </div>
              )}
            </div>
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default AssetInspectorDrawer;
