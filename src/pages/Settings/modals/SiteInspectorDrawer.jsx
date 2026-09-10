import React from 'react';
import { Offcanvas, Badge, Button, Row, Col } from 'react-bootstrap';
import {
  Building2, MapPin, Server, AlertTriangle, Zap, ExternalLink,
  Edit3, CheckCircle2, Phone, Mail, Clock, Globe, Layers,
  Navigation, Power, Radio, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const SiteInspectorDrawer = ({
  show = false,
  onHide = () => {},
  site = null,
  siteStats = null,
  isActiveDashboardSite = false,
  onSetActiveSite = () => {},
  onEditSite = () => {},
  onToggleStatus = () => {},
  tenants = [],
  zones = [],
  areas = []
}) => {
  const navigate = useNavigate();

  if (!site) return null;

  const tenantObj = tenants.find(t => String(t.id) === String(site.tenantId));
  const zoneObj = zones.find(z => String(z.id) === String(site.zoneId));
  const areaObj = areas.find(a => String(a.id) === String(site.areaId));

  const tenantName = site.tenant?.name || tenantObj?.name || (site.tenantId ? `Tenant #${site.tenantId}` : 'Root / Default');
  const zoneName = site.zone?.name || zoneObj?.name || (site.zoneId ? `Zone #${site.zoneId}` : 'Not assigned');
  const areaName = site.areaRef?.name || areaObj?.name || (site.areaId ? `Area #${site.areaId}` : 'Not assigned');

  const isEnabled = (site.isActive !== undefined && site.isActive !== null)
    ? Boolean(site.isActive)
    : (site.status === 'ACTIVE' || site.status === 'ENABLED');
  const alarmsCount = siteStats?.activeAlarms ?? site.alarmsCount ?? 0;
  const devicesCount = siteStats?.totalDevices ?? site._count?.devices ?? site.devicesCount ?? 0;
  const energyKwh = siteStats?.energyConsumption ?? site.energyKwh ?? 0;

  let fp = site.feature_permissions;
  if (typeof fp === 'string') {
    try { fp = JSON.parse(fp); } catch (e) { fp = {}; }
  }
  const assignedTemplates = (Array.isArray(site.selectedTemplates) && site.selectedTemplates.length > 0)
    ? site.selectedTemplates
    : (Array.isArray(fp?.selectedTemplates) ? fp.selectedTemplates : []);

  const activeFeatures = (Array.isArray(site.selectedFeatures) && site.selectedFeatures.length > 0)
    ? site.selectedFeatures
    : (Array.isArray(fp?.selectedFeatures) ? fp.selectedFeatures : []);

  // Google maps search link
  const mapsUrl = (site.latitude != null && site.longitude != null && site.latitude !== '' && site.longitude !== '')
    ? `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`
    : (site.address || site.city)
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([site.address, site.city, site.state, site.pincode].filter(Boolean).join(', '))}`
      : null;

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="site-inspector-offcanvas"
      style={{
        width: 'min(92vw, 680px)',
        backgroundColor: '#0c1427',
        color: '#f8fafc',
        borderLeft: '1px solid rgba(56, 189, 248, 0.18)',
        zIndex: 1055
      }}
    >
      <style>{`
        /* High Performance Hardware-Accelerated Drawer Transitions */
        .site-inspector-offcanvas.offcanvas {
          transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.32s ease !important;
          will-change: transform;
          transform: translateZ(0);
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.6) !important;
          background: linear-gradient(165deg, #0d162a 0%, #080d19 100%) !important;
        }

        .offcanvas-backdrop.show {
          background: rgba(4, 8, 16, 0.7) !important;
          backdrop-filter: blur(6px) !important;
        }

        .site-inspector-offcanvas .offcanvas-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 20px 24px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
        }

        .site-inspector-offcanvas .offcanvas-body {
          padding: 24px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(56, 189, 248, 0.2) transparent;
        }
        .site-inspector-offcanvas .offcanvas-body::-webkit-scrollbar { width: 5px; }
        .site-inspector-offcanvas .offcanvas-body::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.25);
          border-radius: 4px;
        }

        /* Pulsing Status Dot */
        .inspector-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 11px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          border: 1px solid transparent;
        }
        .inspector-status-pill.active {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.35);
          color: #34d399;
        }
        .inspector-status-pill.inactive {
          background: rgba(148, 163, 184, 0.15);
          border-color: rgba(148, 163, 184, 0.3);
          color: #cbd5e1;
        }
        .inspector-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
        }
        .inspector-dot.online {
          background-color: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: dotPulse 2s infinite ease-in-out;
        }
        .inspector-dot.offline { background-color: #94a3b8; }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        /* Action Toolbar Panel */
        .inspector-toolbar-panel {
          background: linear-gradient(145deg, rgba(22, 32, 52, 0.85) 0%, rgba(10, 16, 30, 0.92) 100%);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 14px 18px;
          margin-bottom: 24px;
          gap: 14px !important;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
        }

        .inspector-toolbar-panel button,
        .inspector-toolbar-panel a {
          border-radius: 10px !important;
          margin-right: 14px !important;
          margin-bottom: 6px !important;
        }

        .btn-action-primary {
          background: linear-gradient(135deg, #0284c7 0%, #06b6d4 100%);
          border: 1px solid rgba(56, 189, 248, 0.5);
          color: #ffffff !important;
          font-weight: 600;
          border-radius: 10px !important;
          padding: 8px 18px;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          gap: 8px !important;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-action-primary:hover {
          background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.5);
          transform: translateY(-1.5px);
        }

        .btn-action-active {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          border: 1px solid rgba(16, 185, 129, 0.5);
          color: #ffffff !important;
          font-weight: 600;
          border-radius: 10px !important;
          padding: 8px 18px;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          gap: 8px !important;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
          transition: all 0.22s ease;
        }

        .btn-action-glass {
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38bdf8 !important;
          font-weight: 600;
          border-radius: 10px !important;
          padding: 8px 18px;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          gap: 8px !important;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-action-glass:hover {
          background: rgba(56, 189, 248, 0.2);
          border-color: #38bdf8;
          color: #ffffff !important;
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.35);
          transform: translateY(-1.5px);
        }

        .btn-action-danger {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171 !important;
          font-weight: 600;
          border-radius: 10px !important;
          padding: 8px 18px;
          font-size: 0.82rem;
          display: inline-flex;
          align-items: center;
          gap: 8px !important;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-action-danger:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: #ef4444;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.4);
          color: #ffffff !important;
          transform: translateY(-1.5px);
        }

        /* Metric Cards with Accent Tops & Floating Badges */
        .inspector-metric-card {
          background: linear-gradient(145deg, rgba(24, 34, 54, 0.8) 0%, rgba(12, 18, 32, 0.9) 100%);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          padding: 18px;
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .inspector-metric-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: transparent;
          transition: all 0.25s ease;
        }
        .inspector-metric-card.card-devices::before { background: linear-gradient(90deg, #38bdf8, #0284c7); }
        .inspector-metric-card.card-alarms-zero::before { background: linear-gradient(90deg, #10b981, #059669); }
        .inspector-metric-card.card-alarms-alert::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
        .inspector-metric-card.card-energy::before { background: linear-gradient(90deg, #f59e0b, #d97706); }

        .inspector-metric-card:hover {
          transform: translateY(-3px);
          border-color: rgba(56, 189, 248, 0.45);
          box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.45), 0 0 14px rgba(56, 189, 248, 0.15);
        }

        .metric-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .badge-devices {
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38bdf8;
        }
        .badge-alarms-zero {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
        }
        .badge-alarms-alert {
          background: rgba(239, 68, 68, 0.18);
          border: 1px solid rgba(239, 68, 68, 0.45);
          color: #ef4444;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
        }
        .badge-energy {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }

        .metric-link-arrow {
          transition: transform 0.2s ease;
        }
        .inspector-metric-card:hover .metric-link-arrow {
          transform: translateX(4px);
        }

        /* Section Containers */
        .inspector-section-card {
          background: linear-gradient(145deg, rgba(22, 32, 52, 0.6) 0%, rgba(10, 16, 30, 0.7) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .inspector-contact-chip {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 12px 16px;
          transition: all 0.2s ease;
        }
        .inspector-contact-chip:hover {
          border-color: rgba(56, 189, 248, 0.3);
          background: rgba(56, 189, 248, 0.05);
        }

        .tabular-numbers { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* Drawer Header */}
      <Offcanvas.Header>
        <div className="d-flex align-items-center gap-3">
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(2, 132, 199, 0.35) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)',
              flexShrink: 0
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2.5 flex-wrap">
              <h5 className="mb-0 fw-bold text-white fs-18">{site.name}</h5>
              <span className={`inspector-status-pill ${isEnabled ? 'active' : 'inactive'}`}>
                <span className={`inspector-dot ${isEnabled ? 'online' : 'offline'}`} />
                {isEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <small className="text-muted d-flex align-items-center gap-1.5 mt-1" style={{ fontSize: '0.78rem' }}>
              <Clock size={12} className="text-info opacity-75" />
              <span>Created {formatDate(site.createdAt)} &bull; {site.city || 'Physical Campus'}{site.state ? `, ${site.state}` : ''}</span>
            </small>
          </div>
        </div>
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Close Site Inspector"
          onClick={onHide}
          style={{ opacity: 0.8 }}
        />
      </Offcanvas.Header>

      {/* Drawer Body */}
      <Offcanvas.Body>
        {/* Quick Actions Bar Panel */}
        <div className="inspector-toolbar-panel d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center flex-wrap" style={{ gap: '12px' }}>
            <button
              type="button"
              className={isActiveDashboardSite ? 'btn-action-active' : 'btn-action-primary'}
              onClick={() => onSetActiveSite(site)}
              style={{ marginRight: '10px' }}
            >
              <CheckCircle2 size={16} className="me-2" />
              <span>{isActiveDashboardSite ? 'Active Dashboard Site' : 'Set as Active Site'}</span>
            </button>

            <button
              type="button"
              className="btn-action-glass"
              onClick={() => {
                onHide();
                onEditSite(site);
              }}
              style={{ marginRight: '10px' }}
            >
              <Edit3 size={15} className="me-2" />
              <span>Edit Site</span>
            </button>

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-action-glass text-decoration-none"
                style={{ marginRight: '10px' }}
              >
                <Navigation size={15} className="me-2" />
                <span className="me-1.5">Maps</span>
                <ExternalLink size={12} className="opacity-75" />
              </a>
            )}
          </div>

          <button
            type="button"
            className={isEnabled ? 'btn-action-danger' : 'btn-action-primary'}
            onClick={(e) => onToggleStatus(site, e)}
          >
            <Power size={15} className="me-2" />
            <span>{isEnabled ? 'Disable Site' : 'Enable Site'}</span>
          </button>
        </div>

        {/* Telemetry & KPIs */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2.5">
            <span className="text-uppercase fw-bold tracking-wider text-info" style={{ fontSize: '0.74rem' }}>
              LIVE TELEMETRY & METRICS
            </span>
            <small className="text-muted" style={{ fontSize: '0.74rem' }}>Real-time backend aggregates</small>
          </div>
          <Row className="g-3">
            <Col xs={12} sm={4}>
              <div
                className="inspector-metric-card card-devices"
                title="View site devices"
                onClick={() => {
                  onHide();
                  navigate(`/manage-organisation?tab=device&siteId=${site.id}`);
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Devices</span>
                  <div className="metric-icon-badge badge-devices">
                    <Server size={18} />
                  </div>
                </div>
                <div className="h2 mb-1 fw-bold tabular-numbers text-white">{devicesCount}</div>
                <div className="text-info d-inline-flex align-items-center gap-1 mt-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  <span>Manage</span>
                  <ChevronRight size={13} className="metric-link-arrow" />
                </div>
              </div>
            </Col>

            <Col xs={12} sm={4}>
              <div
                className={`inspector-metric-card ${alarmsCount > 0 ? 'card-alarms-alert' : 'card-alarms-zero'}`}
                title="View site active alarms"
                onClick={() => {
                  onHide();
                  navigate(`/alarm-system/active?siteId=${site.id}`);
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Active Alarms</span>
                  <div className={`metric-icon-badge ${alarmsCount > 0 ? 'badge-alarms-alert' : 'badge-alarms-zero'}`}>
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div className={`h2 mb-1 fw-bold tabular-numbers ${alarmsCount > 0 ? 'text-danger' : 'text-success'}`}>
                  {alarmsCount}
                </div>
                <div className="text-info d-inline-flex align-items-center gap-1 mt-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  <span>Inspect</span>
                  <ChevronRight size={13} className="metric-link-arrow" />
                </div>
              </div>
            </Col>

            <Col xs={12} sm={4}>
              <div
                className="inspector-metric-card card-energy"
                title="View energy metering"
                onClick={() => {
                  onHide();
                  navigate('/energy-metering/overview');
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>Energy Total</span>
                  <div className="metric-icon-badge badge-energy">
                    <Zap size={18} />
                  </div>
                </div>
                <div className="h2 mb-1 fw-bold tabular-numbers text-warning">
                  {Number(energyKwh).toLocaleString()}
                </div>
                <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>kWh Cumulative</small>
              </div>
            </Col>
          </Row>
        </div>

        {/* Hierarchy Placement Section */}
        <div className="inspector-section-card">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Globe size={17} className="text-info" />
            <h6 className="mb-0 fw-bold text-white fs-15">Hierarchy & Organization Placement</h6>
          </div>
          <div className="d-flex flex-column gap-2" style={{ fontSize: '0.86rem' }}>
            <div className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-muted">Organization / Tenant</span>
              <span className="badge bg-dark border border-info border-opacity-40 text-info px-3 py-1.5 fs-12 fw-semibold rounded-pill">
                {tenantName}
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-muted">Geographic Zone</span>
              <span className="fw-semibold text-slate-200">{zoneName}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-muted">Sub-Zone / Area</span>
              <span className="fw-semibold text-slate-200">{areaName}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center py-2">
              <span className="text-muted">Timezone</span>
              <span className="font-monospace text-info fs-12 fw-bold">{site.timezone || 'Asia/Kolkata'}</span>
            </div>
          </div>
        </div>

        {/* Physical Address & Geolocation Section */}
        <div className="inspector-section-card">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <MapPin size={17} className="text-danger" />
              <h6 className="mb-0 fw-bold text-white fs-15">Physical Address & Geolocation</h6>
            </div>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-info text-decoration-none d-flex align-items-center gap-1.5 fw-semibold"
                style={{ fontSize: '0.8rem' }}
              >
                <span>View Map</span> <ExternalLink size={13} />
              </a>
            )}
          </div>
          <div className="mb-3">
            <div className="text-muted mb-1.5" style={{ fontSize: '0.76rem', fontWeight: 600 }}>Base Address:</div>
            <div
              className="p-3 rounded-2"
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                fontSize: '0.86rem',
                lineHeight: 1.5
              }}
            >
              {site.address || 'No street address specified.'}
            </div>
          </div>
          <div className="p-3 rounded-2" style={{ background: 'rgba(0, 0, 0, 0.18)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Row className="g-3" style={{ fontSize: '0.84rem' }}>
              <Col xs={4}>
                <span className="text-muted d-block mb-1" style={{ fontSize: '0.74rem' }}>City</span>
                <span className="fw-bold text-white">{site.city || '—'}</span>
              </Col>
              <Col xs={4}>
                <span className="text-muted d-block mb-1" style={{ fontSize: '0.74rem' }}>State</span>
                <span className="fw-bold text-white">{site.state || '—'}</span>
              </Col>
              <Col xs={4}>
                <span className="text-muted d-block mb-1" style={{ fontSize: '0.74rem' }}>Pincode</span>
                <span className="fw-bold font-monospace text-white">{site.pincode || '—'}</span>
              </Col>
              <Col xs={6} className="pt-2.5 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                <span className="text-muted d-block mb-1" style={{ fontSize: '0.74rem' }}>GPS Latitude</span>
                <span className="fw-bold font-monospace tabular-numbers text-info">
                  {site.latitude != null && site.latitude !== '' ? site.latitude : '—'}
                </span>
              </Col>
              <Col xs={6} className="pt-2.5 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                <span className="text-muted d-block mb-1" style={{ fontSize: '0.74rem' }}>GPS Longitude</span>
                <span className="fw-bold font-monospace tabular-numbers text-info">
                  {site.longitude != null && site.longitude !== '' ? site.longitude : '—'}
                </span>
              </Col>
            </Row>
          </div>
        </div>

        {/* Site Contacts */}
        <div className="inspector-section-card">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Phone size={17} className="text-success" />
            <h6 className="mb-0 fw-bold text-white fs-15">Contact Persons</h6>
          </div>
          {Array.isArray(site.contacts) && site.contacts.length > 0 ? (
            <div className="d-flex flex-column gap-2.5">
              {site.contacts.map((contact, idx) => (
                <div key={idx} className="inspector-contact-chip d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-bold text-white" style={{ fontSize: '0.88rem' }}>{contact.name || `Contact #${idx + 1}`}</div>
                    <div className="d-flex flex-wrap align-items-center gap-3 mt-1.5" style={{ fontSize: '0.8rem' }}>
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="text-success text-decoration-none d-flex align-items-center gap-1.5 fw-semibold">
                          <Phone size={13} /> {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-info text-decoration-none d-flex align-items-center gap-1.5 fw-semibold">
                          <Mail size={13} /> {contact.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : Array.isArray(site.contactEmails) && site.contactEmails.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {site.contactEmails.map((email, idx) => (
                <a key={idx} href={`mailto:${email}`} className="badge bg-dark border border-info text-info text-decoration-none p-2 fs-12 fw-semibold">
                  <Mail size={13} className="me-1.5" /> {email}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted mb-0" style={{ fontSize: '0.84rem' }}>
              No emergency or site contacts configured yet.
            </p>
          )}
        </div>

        {/* BMS Modules & Features */}
        <div className="inspector-section-card mb-0">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Layers size={17} className="text-warning" />
            <h6 className="mb-0 fw-bold text-white fs-15">BMS Templates & Active Modules</h6>
          </div>

          <div className="mb-3">
            <span className="text-muted d-block mb-1.5" style={{ fontSize: '0.76rem', fontWeight: 600 }}>Assigned Templates:</span>
            {assignedTemplates.length > 0 ? (
              <div className="d-flex flex-wrap gap-1.5">
                {assignedTemplates.map(t => (
                  <Badge key={t} bg="dark" className="border border-info text-info px-2.5 py-1.5 font-monospace" style={{ fontSize: '0.74rem' }}>
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <small className="text-muted">Standard telemetry template</small>
            )}
          </div>

          <div>
            <span className="text-muted d-block mb-1.5" style={{ fontSize: '0.76rem', fontWeight: 600 }}>Active Features:</span>
            {activeFeatures.length > 0 ? (
              <div className="d-flex flex-wrap gap-1.5">
                {activeFeatures.map(f => (
                  <Badge key={f} bg="dark" className="border border-success text-success px-2.5 py-1.5 font-monospace" style={{ fontSize: '0.74rem' }}>
                    {f}
                  </Badge>
                ))}
              </div>
            ) : (
              <small className="text-muted">All standard features enabled</small>
            )}
          </div>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default SiteInspectorDrawer;
