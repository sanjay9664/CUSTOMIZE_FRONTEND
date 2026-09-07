import React from 'react';
import { Offcanvas, Badge, Button, Row, Col, Spinner } from 'react-bootstrap';
import {
  Building2, MapPin, Server, AlertTriangle, Zap, ExternalLink,
  Edit3, CheckCircle2, Phone, Mail, Clock, Globe, Layers,
  Navigation, Power
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

  // Google maps search link if coordinates or address exist
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
        backgroundColor: 'var(--scada-card, #1e293b)',
        color: 'var(--scada-text, #f8fafc)',
        borderLeft: '1px solid var(--scada-border, #334155)',
        zIndex: 1055
      }}
    >
      <style>{`
        .site-inspector-offcanvas .offcanvas-header {
          border-bottom: 1px solid var(--scada-border, #334155);
          padding: 18px 24px;
        }
        .site-inspector-offcanvas .offcanvas-body {
          padding: 24px;
          overflow-y: auto;
        }
        .inspector-metric-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--scada-border, #334155);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
        }
        .inspector-metric-card:hover {
          border-color: var(--scada-accent, #38bdf8);
          background: rgba(56, 189, 248, 0.05);
        }
        .inspector-section-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--scada-border, #334155);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .inspector-action-btn {
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          padding: 8px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .inspector-contact-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--scada-border, #334155);
          border-radius: 10px;
          padding: 12px 14px;
        }
        .tabular-numbers {
          font-variant-numeric: tabular-nums;
        }
      `}</style>

      {/* Drawer Header */}
      <Offcanvas.Header>
        <div className="d-flex align-items-center gap-3">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--scada-accent, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0 fw-bold">{site.name}</h5>
              <Badge
                bg={isEnabled ? 'success' : 'secondary'}
                className="d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.72rem', fontWeight: 600 }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />
                {isEnabled ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
            <small className="text-muted" style={{ fontSize: '0.8rem' }}>
              {/* Site ID: #{site.id} &bull; Created {formatDate(site.createdAt)} */}
            </small>
          </div>
        </div>
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Close Site Inspector"
          onClick={onHide}
          style={{ opacity: 0.7 }}
        />
      </Offcanvas.Header>

      {/* Drawer Body */}
      <Offcanvas.Body>
        {/* Quick Actions Bar */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--scada-border, #334155)' }}>
          <Button
            variant={isActiveDashboardSite ? 'success' : 'outline-info'}
            size="sm"
            className="inspector-action-btn"
            onClick={() => onSetActiveSite(site)}
          >
            <CheckCircle2 size={16} />
            {isActiveDashboardSite ? 'Active Dashboard Site' : 'Set as Active Site'}
          </Button>

          <Button
            variant="outline-secondary"
            size="sm"
            className="inspector-action-btn text-white"
            onClick={() => {
              onHide();
              onEditSite(site);
            }}
          >
            <Edit3 size={15} /> Edit Site
          </Button>

          {mapsUrl && (
            <Button
              as="a"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline-secondary"
              size="sm"
              className="inspector-action-btn text-info"
            >
              <Navigation size={15} /> Maps <ExternalLink size={13} />
            </Button>
          )}

          <Button
            variant={isEnabled ? 'outline-danger' : 'outline-success'}
            size="sm"
            className="inspector-action-btn ms-auto"
            onClick={(e) => onToggleStatus(site, e)}
          >
            <Power size={15} /> {isEnabled ? 'Disable Site' : 'Enable Site'}
          </Button>
        </div>

        {/* Telemetry & KPIs */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--scada-text-muted, #94a3b8)' }}>
              Live Telemetry & Metrics
            </span>
            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Real-time backend aggregates</small>
          </div>
          <Row className="g-3">
            <Col xs={6} sm={4}>
              <div
                className="inspector-metric-card"
                style={{ cursor: 'pointer' }}
                title="View site devices"
                onClick={() => {
                  onHide();
                  navigate(`/manage-organisation?tab=device&siteId=${site.id}`);
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Devices</span>
                  <Server size={16} className="text-primary" />
                </div>
                <div className="h4 mb-0 fw-bold tabular-numbers">{devicesCount}</div>
                <small className="text-info d-inline-flex align-items-center gap-1 mt-1" style={{ fontSize: '0.72rem' }}>
                  Manage &rarr;
                </small>
              </div>
            </Col>
            <Col xs={6} sm={4}>
              <div
                className="inspector-metric-card"
                style={{
                  cursor: 'pointer',
                  borderColor: alarmsCount > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined,
                  background: alarmsCount > 0 ? 'rgba(239, 68, 68, 0.08)' : undefined
                }}
                title="View site active alarms"
                onClick={() => {
                  onHide();
                  navigate(`/alarm-system/active?siteId=${site.id}`);
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Active Alarms</span>
                  <AlertTriangle size={16} className={alarmsCount > 0 ? 'text-danger' : 'text-success'} />
                </div>
                <div className={`h4 mb-0 fw-bold tabular-numbers ${alarmsCount > 0 ? 'text-danger' : 'text-success'}`}>
                  {alarmsCount}
                </div>
                <small className="text-info d-inline-flex align-items-center gap-1 mt-1" style={{ fontSize: '0.72rem' }}>
                  Inspect &rarr;
                </small>
              </div>
            </Col>
            <Col xs={12} sm={4}>
              <div
                className="inspector-metric-card"
                style={{ cursor: 'pointer' }}
                title="View energy metering"
                onClick={() => {
                  onHide();
                  navigate('/energy-metering/overview');
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>Energy Total</span>
                  <Zap size={16} className="text-warning" />
                </div>
                <div className="h4 mb-0 fw-bold tabular-numbers text-warning">
                  {Number(energyKwh).toLocaleString()}
                </div>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>kWh Cumulative</small>
              </div>
            </Col>
          </Row>
        </div>

        {/* Hierarchy Context */}
        <div className="inspector-section-card">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Globe size={16} className="text-info" />
            <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>Hierarchy & Organization Placement</h6>
          </div>
          <div className="d-flex flex-column gap-2" style={{ fontSize: '0.85rem' }}>
            <div className="d-flex justify-content-between py-1 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-muted">Organization / Tenant:</span>
              <span className="fw-semibold">{tenantName}</span>
            </div>
            <div className="d-flex justify-content-between py-1 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-muted">Geographic Zone:</span>
              <span className="fw-semibold">{zoneName}</span>
            </div>
            <div className="d-flex justify-content-between py-1 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-muted">Sub-Zone / Area:</span>
              <span className="fw-semibold">{areaName}</span>
            </div>
            <div className="d-flex justify-content-between py-1">
              <span className="text-muted">Timezone:</span>
              <span className="font-monospace text-info">{site.timezone || 'Asia/Kolkata'}</span>
            </div>
          </div>
        </div>

        {/* Physical Address & Coordinates */}
        <div className="inspector-section-card">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <MapPin size={16} className="text-danger" />
              <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>Physical Address & Geolocation</h6>
            </div>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-info text-decoration-none"
                style={{ fontSize: '0.75rem' }}
              >
                View Map &nearr;
              </a>
            )}
          </div>
          <div className="mb-3" style={{ fontSize: '0.85rem' }}>
            <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Base Address:</div>
            <div className="p-2 rounded bg-black bg-opacity-20 border" style={{ borderColor: 'var(--scada-border, #334155)' }}>
              {site.address || 'No street address specified.'}
            </div>
          </div>
          <Row className="g-2" style={{ fontSize: '0.82rem' }}>
            <Col xs={4}>
              <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>City</span>
              <span className="fw-semibold">{site.city || 'N/A'}</span>
            </Col>
            <Col xs={4}>
              <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>State</span>
              <span className="fw-semibold">{site.state || 'N/A'}</span>
            </Col>
            <Col xs={4}>
              <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Pincode</span>
              <span className="fw-semibold font-monospace">{site.pincode || 'N/A'}</span>
            </Col>
            <Col xs={6} className="mt-2">
              <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>GPS Latitude</span>
              <span className="fw-semibold font-monospace tabular-numbers text-info">
                {site.latitude != null && site.latitude !== '' ? site.latitude : 'N/A'}
              </span>
            </Col>
            <Col xs={6} className="mt-2">
              <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>GPS Longitude</span>
              <span className="fw-semibold font-monospace tabular-numbers text-info">
                {site.longitude != null && site.longitude !== '' ? site.longitude : 'N/A'}
              </span>
            </Col>
          </Row>
        </div>

        {/* Site Contacts */}
        <div className="inspector-section-card">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Phone size={16} className="text-success" />
            <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>Contact Persons</h6>
          </div>
          {Array.isArray(site.contacts) && site.contacts.length > 0 ? (
            <div className="d-flex flex-column gap-2">
              {site.contacts.map((contact, idx) => (
                <div key={idx} className="inspector-contact-chip d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{contact.name || `Contact #${idx + 1}`}</div>
                    <div className="d-flex flex-wrap align-items-center gap-3 mt-1" style={{ fontSize: '0.78rem' }}>
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="text-success text-decoration-none d-flex align-items-center gap-1">
                          <Phone size={12} /> {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-info text-decoration-none d-flex align-items-center gap-1">
                          <Mail size={12} /> {contact.email}
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
                <a key={idx} href={`mailto:${email}`} className="badge bg-secondary text-white text-decoration-none p-2">
                  <Mail size={12} className="me-1" /> {email}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
              No emergency or site contacts configured yet.
            </p>
          )}
        </div>

        {/* BMS Modules & Features */}
        <div className="inspector-section-card">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Layers size={16} className="text-warning" />
            <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>BMS Templates & Active Modules</h6>
          </div>

          <div className="mb-3">
            <span className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>Assigned Templates:</span>
            {assignedTemplates.length > 0 ? (
              <div className="d-flex flex-wrap gap-1">
                {assignedTemplates.map(t => (
                  <Badge key={t} bg="dark" className="border border-info text-info p-2 font-monospace" style={{ fontSize: '0.72rem' }}>
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <small className="text-muted">Standard telemetry template</small>
            )}
          </div>

          <div>
            <span className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>Active Features:</span>
            {activeFeatures.length > 0 ? (
              <div className="d-flex flex-wrap gap-1">
                {activeFeatures.map(f => (
                  <Badge key={f} bg="dark" className="border border-success text-success p-2 font-monospace" style={{ fontSize: '0.72rem' }}>
                    {f}
                  </Badge>
                ))}
              </div>
            ) : (
              <small className="text-muted">All standard features enabled</small>
            )}
          </div>
        </div>

        {/* Technical Metadata */}
        {/* <div className="p-3 rounded border" style={{ borderColor: 'var(--scada-border, #334155)', background: 'rgba(0,0,0,0.15)', fontSize: '0.78rem' }}>
          <div className="d-flex justify-content-between">
            <span className="text-muted">Tenant Name:</span>
            <span className="font-monospace">{site.tenantId || '—'}</span>
          </div>
        </div> */}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default SiteInspectorDrawer;
