import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Badge, Table, Button, Form } from 'react-bootstrap';
import { Zap, Activity, ShieldCheck, HelpCircle, ChevronLeft, ChevronRight, Play, Pause, Settings, RefreshCw, Info, AlertTriangle, Cpu, Sliders, ShieldAlert, Coins, Clock, Gauge, Flame, Lock } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';
import PageContextBanner from '../../components/PageContextBanner';
import { useSiteStore } from '../../context/SiteContext';
import { useDeviceStatus } from '../../services/DeviceStatusContext';

import { useTheme } from '../../context/ThemeContext';

import { getAuthHeaders, normalizeList } from '../../services/apiClient';
import { bmsService } from '../../services/bmsService';
import { getApiUrl } from '../../utils/apiConfig';

import {
  PARAMETER_SYNONYMS,
  getValueForField as getValueForFieldUtil,
  parseLimit,
  getThresholdStatus,
  polarToCartesian,
  describeArc,
  formatNumber,
  mapLatestEventsToTelemetry
} from './utils/energyTelemetry';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-4 text-white text-center m-5" style={{ background: 'linear-gradient(135deg, rgba(13, 20, 38, 0.8) 0%, rgba(8, 12, 24, 0.95) 100%)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div className="d-flex flex-column align-items-center gap-3">
            <AlertTriangle className="text-danger" size={48} />
            <h4 className="fw-black text-danger">Main Meter Dashboard Error</h4>
            <p className="text-secondary fs-7">
              Something went wrong while rendering this panel. This has been logged for diagnostics.
            </p>
            <pre className="p-3 bg-dark bg-opacity-50 text-start rounded text-warning border border-secondary border-opacity-20 font-monospace fs-11 w-100 overflow-auto" style={{ maxHeight: '200px' }}>
              {this.state.error?.toString()}
            </pre>
            <Button variant="outline-info" onClick={() => window.location.reload()}>
              <RefreshCw className="me-2" size={14} /> Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Telemetry synonyms, limit evaluation, and SVG arc geometry are imported from ./utils/energyTelemetry


const CircularGauge = ({ value, min = 0, max = 100, label, unit, limits, defaultColor, isConfigured = true }) => {
  const { isDark } = useTheme();

  const numericValue = typeof value === 'number' ? value : Number(value) || 0;
  const minVal = isNaN(Number(min)) ? 0 : Number(min);
  const rawMaxVal = isNaN(Number(max)) ? 100 : Number(max);
  const maxVal = rawMaxVal <= minVal ? minVal + 1 : rawMaxVal;

  // Check if we have valid user-defined limits
  const userLow = parseLimit(limits?.low);
  const userNormalMin = parseLimit(limits?.normalMin);
  const userNormalMax = parseLimit(limits?.normalMax);
  const userHigh = parseLimit(limits?.high);

  // Resolve actual limits to use (either user configured or defaults)
  let low = userLow;
  let normalMin = userNormalMin;
  let normalMax = userNormalMax;
  let high = userHigh;

  const isVoltage = unit === 'V';
  const isCurrent = unit === 'A';

  if (low === null && normalMin === null && normalMax === null && high === null) {
    // Use defaults
    if (isVoltage) {
      low = 180;
      normalMin = 210;
      normalMax = 250;
      high = 270;
    } else if (isCurrent) {
      low = 0;
      normalMin = 0.5;
      normalMax = maxVal * 0.70;
      high = maxVal * 0.85;
    } else {
      low = minVal + (maxVal - minVal) * 0.15;
      normalMin = minVal + (maxVal - minVal) * 0.3;
      normalMax = minVal + (maxVal - minVal) * 0.7;
      high = minVal + (maxVal - minVal) * 0.85;
    }
  } else {
    // Fill in missing limits gracefully
    if (low === null) low = minVal;
    if (normalMin === null) normalMin = low;
    if (normalMax === null) normalMax = maxVal;
    if (high === null) high = normalMax;
  }

  // Clamp values inside gauge range to prevent overflow and overlap
  const clamp = (val, mn, mx) => Math.min(mx, Math.max(mn, val));
  const l = clamp(low, minVal, maxVal);
  const nMin = clamp(normalMin, l, maxVal);
  const nMax = clamp(normalMax, nMin, maxVal);
  const h = clamp(high, nMax, maxVal);

  const getPercent = (v) => {
    const range = maxVal - minVal;
    if (range <= 0) return 0;
    return (v - minVal) / range;
  };

  const pLow = getPercent(l);
  const pNormalMin = getPercent(nMin);
  const pNormalMax = getPercent(nMax);
  const pHigh = getPercent(h);
  const pValue = getPercent(clamp(numericValue, minVal, maxVal));

  const getAngle = (p) => {
    const pct = isNaN(p) ? 0 : p;
    return 180 + pct * 180;
  };

  const angleLow = getAngle(pLow);
  const angleNormalMin = getAngle(pNormalMin);
  const angleNormalMax = getAngle(pNormalMax);
  const angleHigh = getAngle(pHigh);
  const angleValue = getAngle(pValue);

  // Determine current status based on thresholds
  const status = getThresholdStatus(numericValue, { low, normalMin, normalMax, high });

  let strokeColor = defaultColor || '#10b981';
  let statusText = 'Normal';
  let statusIcon = '✓';

  if (status === 'alert') { strokeColor = '#ef4444'; statusText = 'Alert'; statusIcon = '⚠'; }
  else if (status === 'warning') { strokeColor = '#f59e0b'; statusText = 'Warning'; statusIcon = '!'; }
  else if (status === 'normal') { strokeColor = '#10b981'; statusText = 'Normal'; statusIcon = '✓'; }
  else { statusText = 'OK'; strokeColor = defaultColor || '#10b981'; statusIcon = '●'; }

  const isAlert = status === 'alert';
  const isWarning = status === 'warning';

  const renderSegment = (startAngle, endAngle, color, opacity = 0.7) => {
    const gap = 1.5;
    const s = startAngle + gap;
    const e = endAngle - gap;
    if (isNaN(s) || isNaN(e) || e - s < 1) return null;
    return (
      <path
        key={`seg-${startAngle}-${endAngle}`}
        d={describeArc(50, 48, 38, s, e)}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="butt"
        style={{ transition: 'stroke 0.5s ease', opacity: isDark ? opacity : Math.min(1, opacity + 0.15) }}
      />
    );
  };

  const safeLabel = (label || 'gauge').replace(/[^a-zA-Z0-9]/g, '');

  // Theme-aware styles for CircularGauge
  const cardBg = isDark
    ? 'linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.9) 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)';
  const cardBorder = isDark ? `1px solid ${defaultColor}30` : '1px solid #e2e8f0';
  const cardShadow = isDark
    ? '0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
    : '0 4px 14px rgba(15,23,42,0.06), inset 0 1px 0 #ffffff';
  
  const arcTrackStroke = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const capFill = isDark ? '#1e293b' : '#0f172a';
  const capStroke = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0';
  const valueFill = isDark ? '#f8fafc' : '#0f172a';
  const unitFill = isDark ? 'rgba(255,255,255,0.45)' : '#64748b';
  const limitHintColor = isDark ? 'rgba(255,255,255,0.35)' : '#64748b';

  // Badge styles
  let badgeBg = `${strokeColor}15`;
  let badgeBorder = `1px solid ${strokeColor}30`;
  let badgeTextColor = strokeColor;
  if (!isDark) {
    if (status === 'alert') {
      badgeBg = '#fef2f2';
      badgeBorder = '1px solid #fecaca';
      badgeTextColor = '#dc2626';
    } else if (status === 'warning') {
      badgeBg = '#fffbeb';
      badgeBorder = '1px solid #fde68a';
      badgeTextColor = '#d97706';
    } else {
      badgeBg = '#ecfdf5';
      badgeBorder = '1px solid #a7f3d0';
      badgeTextColor = '#059669';
    }
  }

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-center h-100 scada-gauge-card"
      style={{
        padding: '16px 12px 12px',
        borderRadius: '16px',

        border: !isConfigured ? (isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0') : cardBorder,
        background: cardBg,
        boxShadow: cardShadow,

        transition: 'all 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar — phase color */}
      {isConfigured && (
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: '2.5px',
          background: `linear-gradient(90deg, transparent, ${defaultColor}, transparent)`,
          borderRadius: '0 0 6px 6px',
          opacity: isDark ? 0.6 : 0.9,
        }} />
      )}

      {/* Phase label */}
      <span style={{
        color: isConfigured ? defaultColor : '#94a3b8', fontSize: '0.68rem', fontWeight: 800,
        letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px',
        display: 'block',
      }}>
        {label}
      </span>

      {/* Gauge SVG — large and clear */}
      <div style={{ width: '140px', height: isConfigured ? '95px' : '80px', position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 72">
          <defs>
            <linearGradient id={`ng-${safeLabel}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={defaultColor} />
              <stop offset="100%" stopColor={isDark ? '#94a3b8' : '#334155'} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path d={describeArc(50, 48, 38, 180, 360)} fill="none" stroke={arcTrackStroke} strokeWidth="7" strokeLinecap="round" />

          {/* Zone segments — softer, thicker */}
          {isConfigured && renderSegment(180, angleLow, '#ef4444')}
          {isConfigured && renderSegment(angleLow, angleNormalMin, '#f59e0b')}
          {isConfigured && renderSegment(angleNormalMin, angleNormalMax, '#22c55e')}
          {isConfigured && renderSegment(angleNormalMax, angleHigh, '#f59e0b')}
          {isConfigured && renderSegment(angleHigh, 360, '#ef4444')}

          {/* Needle */}
          {isConfigured && (
            <g
              transform={`translate(50, 48) rotate(${isNaN(angleValue) ? 0 : angleValue - 270})`}
              style={{ transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <path d="M -1.5 4 L 0 -32 L 1.5 4 Z" fill={`url(#ng-${safeLabel})`}
                style={{ filter: isDark ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'drop-shadow(0 1px 2px rgba(15,23,42,0.25))' }} />
              <circle cx="0" cy="-30" r="1.8" fill={strokeColor} />
            </g>
          )}

          {/* Center cap */}
          <g transform="translate(50, 48)">
            <circle cx="0" cy="0" r="5.5" fill={capFill} stroke={capStroke} strokeWidth="1" />
            <circle cx="0" cy="0" r="2.5" fill={isConfigured ? defaultColor : (isDark ? '#64748b' : '#94a3b8')} />
          </g>

          {/* Value — big, readable or -- */}
          {isConfigured ? (
            <>
              <text x="50" y="62" textAnchor="middle" fill={valueFill}
                fontFamily="monospace" fontSize="11" fontWeight="900">
                {numericValue.toFixed(1)}
              </text>
              <text x="50" y="70" textAnchor="middle" fill={unitFill}
                fontFamily="monospace" fontSize="5.5" fontWeight="700">
                {unit}
              </text>
            </>
          ) : (
            <text x="50" y="60" textAnchor="middle" fill={isDark ? '#64748b' : '#94a3b8'}
              fontFamily="monospace" fontSize="13" fontWeight="800">
              --
            </text>
          )}
        </svg>
      </div>

      {/* Status badge */}
      {isConfigured && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: badgeBg,
          border: badgeBorder,
          borderRadius: '20px',
          padding: '3px 12px',
          marginTop: '4px',
        }}>
          <span style={{ fontSize: '0.55rem', color: badgeTextColor, fontWeight: 800, fontFamily: 'monospace' }}>{statusIcon}</span>
          <span style={{ fontSize: '0.55rem', color: badgeTextColor, fontWeight: 800, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{statusText}</span>
        </div>
      )}

      {/* Limits — small muted hint */}
      {isConfigured && (
        <div style={{ fontSize: '0.5rem', color: limitHintColor, fontFamily: 'monospace', marginTop: '4px', fontWeight: 600 }}>
          {limits && (parseLimit(limits.low) !== null || parseLimit(limits.high) !== null) ? (
            <>
              {parseLimit(limits.low) !== null && `L: ${parseLimit(limits.low)}`}
              {parseLimit(limits.normalMin) !== null && parseLimit(limits.normalMax) !== null && ` N: ${parseLimit(limits.normalMin)}–${parseLimit(limits.normalMax)}`}
              {parseLimit(limits.high) !== null && ` H: ${parseLimit(limits.high)}`}
            </>
          ) : (
            isVoltage ? 'L: 180  N: 210–250  H: 270' : isCurrent ? `H: ${(maxVal * 0.85).toFixed(0)}${unit}` : ''
          )}
        </div>
      )}
    </div>
  );
};

const MainMeter = () => {
  const { getOverallStatus } = useDeviceStatus();
  const { sites, selectedSite, setSelectedSite } = useSiteStore();

  // Sites fetched from sites route (http://localhost:3001/api/v1/sites)
  const [routeSites, setRouteSites] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('scada_sites_db') || '[]');
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    return [];
  });
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    return localStorage.getItem('selected_main_meter_site_id') || '';
  });

  // Devices fetched from http://localhost:3001/api/v1/devices/ with site_id and category=MAIN_ENERGY_METER
  const [siteDevices, setSiteDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  // 1. Live Telemetry Data States
  const [data, setData] = useState({
    // CHANGE
    ebKvah: 0, ebKwh: 0, balance: 0, totalKw: 0,
    vR: 0, vY: 0, vB: 0,
    iR: 0, iY: 0, iB: 0,
    pf: 0, totalKva: 0, dgKwh: 0,
    // WARNING
    lowBalanceCut: 0, overloadTrip: 0, overloadLimitReached: 0, connectedStatus: 0, forceOff: 0,
    // READ
    meterSrno: 0, noOfOverloadCheck: 0, ebDgStatus: 0, ebTariff: 0, dgTariff: 0,
    ebRLoadSet: 0, ebYLoadSet: 0, ebBLoadSet: 0,
    dgRLoadSet: 0, dgYLoadSet: 0, dgBLoadSet: 0,

    // NEW PARAMS
    vLLAvg: '', vLNAvg: '', iAvg: '', kvaAvg: '', kvarAvg: '', pfAvg: '',
    vRY: '', vYB: '', vBR: '', pfR: '', pfY: '', pfB: '',
    loadHrs: '', loadMin: '', noLoadHrs: '', noLoadMin: '', loadPct: '',

    // Legacy metrics
    activePower: 0, reactivePower: 0, apparentPower: 0, freq: 0, cumulativekWh: 0
  });
  // Tracks the timestamp (ms) of the latest MongoDB event received for the current meter.
  // Used for freshness check in isMeterOnline to avoid stale data causing false-ONLINE.
  const [lastTelemetryAt, setLastTelemetryAt] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [activeRightTab, setActiveRightTab] = useState('telemetry');
  const [selectedMeterId, setSelectedMeterId] = useState(() => {
    return localStorage.getItem('selected_main_meter_id') || '';
  });
  // Live history ring buffer — stores last 10 real readings
  const [historyLog, setHistoryLog] = useState([]);

  // 2. MFM Custom Display Page States
  const [mfmPageIndex, setMfmPageIndex] = useState(0);
  const [autoCycle, setAutoCycle] = useState(true);
  const [calBlink, setCalBlink] = useState(false);
  const autoCycleTimer = useRef(null);
  const userInteractionTimeout = useRef(null);

  // Ref so telemetry always reads latest template without stale closure
  const mainMeterTemplateRef = useRef(null);

  // Load templates on mount from scada_templates if available
  useEffect(() => {
    const saved = localStorage.getItem('scada_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTemplates(parsed);
      } catch (e) {
        console.error('Failed to parse templates from local storage:', e);
      }
    }
  }, []);

  // Save selected meter ID to localStorage when changed
  useEffect(() => {
    if (selectedMeterId) {
      localStorage.setItem('selected_main_meter_id', String(selectedMeterId));
    }
  }, [selectedMeterId]);

  // Fetch sites as per OpenAPI spec (GET /sites)
  useEffect(() => {
    let isMounted = true;
    const fetchSitesFromRoute = async () => {
      try {
        // OpenAPI 3.0.3: GET /sites
        const res = await bmsService.getSites().catch(() => null);
        const list = normalizeList(res, 'sites');
        if (isMounted && list && list.length > 0) {
          setRouteSites(list);
          try {
            localStorage.setItem('scada_sites_db', JSON.stringify(list));
          } catch (e) {}
          return;
        }
      } catch (err) {
        console.warn('bmsService.getSites notice:', err);
      }

      // Direct proxy route fallback (/sites)
      try {
        const proxyUrl = getApiUrl('/sites');
        const res = await fetch(proxyUrl, { headers: getAuthHeaders() }).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          const list = normalizeList(json, 'sites');
          if (isMounted && list && list.length > 0) {
            setRouteSites(list);
            try {
              localStorage.setItem('scada_sites_db', JSON.stringify(list));
            } catch (e) {}
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch sites from route:', err);
      }

      if (isMounted && sites && sites.length > 0) {
        setRouteSites(sites);
      }
    };

    fetchSitesFromRoute();
    return () => { isMounted = false; };
  }, [sites]);

  const allSites = useMemo(() => {
    if (routeSites && routeSites.length > 0) return routeSites;
    if (sites && sites.length > 0) return sites;
    return [];
  }, [routeSites, sites]);

  // Keep selected site synchronized with available sites
  useEffect(() => {
    if (allSites.length > 0) {
      const match = allSites.find(s => String(s.id || s.siteId || s._id) === String(selectedSiteId));
      if (!match) {
        const firstId = String(allSites[0].id || allSites[0].siteId || allSites[0]._id);
        setSelectedSiteId(firstId);
        localStorage.setItem('selected_main_meter_site_id', firstId);
        if (setSelectedSite) setSelectedSite(allSites[0]);
      } else {
        if (setSelectedSite && selectedSite?.id !== match.id) setSelectedSite(match);
      }
    }
  }, [allSites, selectedSiteId, setSelectedSite, selectedSite]);

  // Single OpenAPI route for main energy meters of the selected site:
  // GET /api/v1/devices?siteId={siteId}&category=MAIN_ENERGY_METER&include=settings,rules,profile
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDevices([]);
      setSelectedMeterId('');
      return;
    }

    let isMounted = true;
    const fetchMainEnergyMeters = async () => {
      setDevicesLoading(true);
      try {
        const queryParams = new URLSearchParams({
          siteId: String(selectedSiteId),
          category: 'MAIN_ENERGY_METER',
          include: 'settings,rules,profile'
        });

        const url = getApiUrl(`/devices?${queryParams.toString()}`);
        const res = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders()
        });

        let items = [];
        if (res && res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.data)) {
            items = json.data;
          } else if (Array.isArray(json)) {
            items = json;
          }
        }

        if (isMounted) {
          setSiteDevices(items);
          if (items.length > 0) {
            const currentInList = items.some(d => String(d.id || d.deviceId) === String(selectedMeterId));
            if (!currentInList) {
              const firstId = String(items[0].id || items[0].deviceId);
              setSelectedMeterId(firstId);
              localStorage.setItem('selected_main_meter_id', firstId);
            }
          } else {
            // Total size zero: clear selected device ID
            setSelectedMeterId('');
            localStorage.removeItem('selected_main_meter_id');
          }
        }
      } catch (err) {
        console.warn('Error fetching main energy meters:', err);
        if (isMounted) {
          setSiteDevices([]);
          setSelectedMeterId('');
        }
      } finally {
        if (isMounted) setDevicesLoading(false);
      }
    };

    fetchMainEnergyMeters();
    return () => { isMounted = false; };
  }, [selectedSiteId]);

  const mainMeterTemplate = useMemo(() => {
    if (!siteDevices || siteDevices.length === 0) {
      mainMeterTemplateRef.current = null;
      return null;
    }

    const foundDevice = siteDevices.find(d => String(d.id || d.deviceId) === String(selectedMeterId)) || siteDevices[0];
    if (!foundDevice) {
      mainMeterTemplateRef.current = null;
      return null;
    }

    const mappingSource = foundDevice.defaultValues || foundDevice.settings?.[0]?.meta || foundDevice.settings || foundDevice.mapping || {};
    const tpl = {
      id: foundDevice.id || foundDevice.deviceId,
      name: foundDevice.name || foundDevice.deviceName || foundDevice.title || 'Main Energy Meter',
      code: foundDevice.code || foundDevice.hardwareId || '',
      category: foundDevice.category || 'MAIN_ENERGY_METER',
      module: foundDevice.module || 'Main Meter',
      siteId: foundDevice.siteId || selectedSiteId,
      status: foundDevice.status,
      isActive: foundDevice.isActive,
      lastSeenAt: foundDevice.lastSeenAt,
      sochiotDeviceIds: foundDevice.sochiotDeviceIds || [],
      mapping: mappingSource,
      device: foundDevice
    };
    mainMeterTemplateRef.current = tpl;
    return tpl;
  }, [siteDevices, selectedMeterId, selectedSiteId]);

  const emLimitsConfig = useMemo(() => {
    return mainMeterTemplate?.mapping?.emLimitsConfig || {};
  }, [mainMeterTemplate]);

  const isMeterOnline = useMemo(() => {
    if (!mainMeterTemplate) return false;
    let devId = mainMeterTemplate?.mapping?.deviceId || mainMeterTemplate?.device?.id || mainMeterTemplate?.device?.deviceId;
    if (!devId && mainMeterTemplate?.mapping) {
      const anyConfig = Object.values(mainMeterTemplate.mapping).find(cfg => cfg && typeof cfg === 'object' && cfg.device);
      if (anyConfig) devId = anyConfig.device;
    }
    const gatewayUuid = mainMeterTemplate?.mapping?.gatewayUuid || mainMeterTemplate?.device?.gatewayUuid;
    if (devId) {
      const isOnline = getOverallStatus(devId, gatewayUuid);
      if (isOnline) return true;

      // Direct device status indicator from OpenAPI Device model
      if (mainMeterTemplate?.device?.status) {
        const s = String(mainMeterTemplate.device.status).toUpperCase();
        if (s === 'ONLINE' || s === 'ACTIVE') return true;
        if (s === 'OFFLINE' || s === 'INACTIVE' || s === 'DISABLED') return false;
      }
      if (mainMeterTemplate?.device?.lastSeenAt) {
        const lastSeenMs = new Date(mainMeterTemplate.device.lastSeenAt).getTime();
        if (Math.abs(Date.now() - lastSeenMs) < 5 * 60 * 1000) {
          return true;
        }
      }

      // Telemetry-based fallback: ONLY if data is FRESH (within 24 hours for robust QA/development).
      const FRESHNESS_MS = 24 * 60 * 60 * 1000; // 24 hours
      const isFresh = lastTelemetryAt && (Date.now() - lastTelemetryAt) < FRESHNESS_MS;
      if (isFresh) {
        const hasV = data.vR !== undefined && data.vR !== null && data.vR > 0;
        const hasI = data.iR !== undefined && data.iR !== null && data.iR > 0;
        const hasLoad = (data.totalKw !== undefined && data.totalKw !== null && data.totalKw > 0) || (data.activePower !== undefined && data.activePower !== null && data.activePower > 0);
        const hasSr = data.meterSrno !== undefined && data.meterSrno !== null && data.meterSrno !== '';
        if (hasV || hasI || hasLoad || hasSr) {
          return true;
        }
      }
    }
    return false;
  }, [mainMeterTemplate, getOverallStatus, lastTelemetryAt, data.vR, data.iR, data.totalKw, data.activePower, data.meterSrno]);

  // Site selector configuration for the context banner
  const siteSelector = useMemo(() => {
    const siteOptions = (allSites && allSites.length > 0)
      ? allSites.map(s => ({
          value: String(s.id || s._id || s.siteId),
          label: s.name || s.siteName || s.title || `Site ${s.id}`
        }))
      : [
          { value: '1', label: 'Main Facility Site' }
        ];

    const currentVal = selectedSiteId || siteOptions[0]?.value;

    return {
      value: currentVal,
      options: siteOptions,
      onChange: (newId) => {
        setSelectedSiteId(newId);
        localStorage.setItem('selected_main_meter_site_id', String(newId));
        const found = allSites?.find(s => String(s.id || s._id || s.siteId) === String(newId));
        if (found && setSelectedSite) {
          setSelectedSite(found);
        }
      },
      ariaLabel: 'Select Site'
    };
  }, [allSites, selectedSiteId, setSelectedSite]);

  // Device selector configuration for the context banner
  const deviceSelector = useMemo(() => {
    if (devicesLoading) {
      return {
        value: '',
        options: [{ value: '', label: 'Loading devices...' }],
        disabled: true,
        ariaLabel: 'Loading devices'
      };
    }

    if (!siteDevices || siteDevices.length === 0) {
      return {
        value: '',
        options: [{ value: '', label: 'No device configured' }],
        disabled: true,
        ariaLabel: 'No device configured'
      };
    }

    // Deduplicate devices by id
    const uniqueDevices = [];
    const seenIds = new Set();
    for (const d of siteDevices) {
      const id = String(d.id || d.deviceId || '');
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      const name = d.name || d.deviceName || d.title || d.serialNumber || `Meter (${id})`;
      uniqueDevices.push({ id, name });
    }

    const meterOptions = uniqueDevices.map(d => ({
      value: d.id,
      label: d.name
    }));

    const currentVal = (selectedMeterId && meterOptions.some(m => String(m.value) === String(selectedMeterId)))
      ? String(selectedMeterId)
      : (meterOptions[0]?.value || '');

    return {
      value: currentVal,
      options: meterOptions,
      onChange: (newId) => {
        if (!newId) return;
        setSelectedMeterId(newId);
        localStorage.setItem('selected_main_meter_id', String(newId));
      },
      ariaLabel: 'Select Meter Device',
      disabled: false
    };
  }, [siteDevices, devicesLoading, selectedMeterId]);

  // --- Reset live data, history & page index when the selected meter changes ---
  useEffect(() => {
    setData({
      ebKvah: 0, ebKwh: 0, balance: 0, totalKw: 0,
      vR: 0, vY: 0, vB: 0,
      iR: 0, iY: 0, iB: 0,
      pf: 0, totalKva: 0, dgKwh: 0,
      lowBalanceCut: 0, overloadTrip: 0, overloadLimitReached: 0, connectedStatus: 0, forceOff: 0,
      meterSrno: 0, noOfOverloadCheck: 0, ebDgStatus: 0, ebTariff: 0, dgTariff: 0,
      ebRLoadSet: 0, ebYLoadSet: 0, ebBLoadSet: 0,
      dgRLoadSet: 0, dgYLoadSet: 0, dgBLoadSet: 0,
      commStatus: null,
      activePower: 0, reactivePower: 0, apparentPower: 0, freq: 0, cumulativekWh: 0
    });
    setLastTelemetryAt(null); // Reset freshness timer so stale data from old meter doesn't bleed over
    setHistoryLog([]);
    setMfmPageIndex(0);
  }, [selectedMeterId]);

  const mappedFields = useMemo(() => {
    if (!mainMeterTemplate || !mainMeterTemplate.mapping) return {};
    const mapping = mainMeterTemplate.mapping;
    const mapped = {};

    const checkField = (config, key) => {
      if (config && config.enabled !== false && config[key]) {
        mapped[key] = true;
      }
    };

    // Legacy support
    checkField(mapping.emVoltageConfig, 'vR');
    checkField(mapping.emVoltageConfig, 'vY');
    checkField(mapping.emVoltageConfig, 'vB');
    checkField(mapping.emCurrentConfig, 'iR');
    checkField(mapping.emCurrentConfig, 'iY');
    checkField(mapping.emCurrentConfig, 'iB');
    checkField(mapping.emPowerConfig, 'activePower');
    checkField(mapping.emPowerConfig, 'reactivePower');
    checkField(mapping.emPowerConfig, 'apparentPower');
    checkField(mapping.emSystemConfig, 'pf');
    checkField(mapping.emSystemConfig, 'freq');
    checkField(mapping.emSystemConfig, 'commStatus');
    checkField(mapping.emConsumptionConfig, 'cumulativekWh');

    // New parameters mapping
    const changeFields = ['ebKvah', 'ebKwh', 'balance', 'totalKw', 'vR', 'vY', 'vB', 'iR', 'iY', 'iB', 'pf', 'totalKva', 'dgKwh'];
    const warningFields = ['lowBalanceCut', 'overloadTrip', 'overloadLimitReached', 'connectedStatus', 'forceOff'];
    const readFields = ['meterSrno', 'noOfOverloadCheck', 'ebDgStatus', 'ebTariff', 'dgTariff', 'ebRLoadSet', 'ebYLoadSet', 'ebBLoadSet', 'dgRLoadSet', 'dgYLoadSet', 'dgBLoadSet'];

    changeFields.forEach(k => checkField(mapping.emChangeConfig, k));
    warningFields.forEach(k => checkField(mapping.emWarningConfig, k));
    readFields.forEach(k => checkField(mapping.emReadConfig, k));

    return mapped;
  }, [mainMeterTemplate]);

  const isTemplateMapped = useMemo(() => {
    return Object.keys(mappedFields).length > 0;
  }, [mappedFields]);

  // Polling for Latest Device Events: GET /devices/:deviceId/events/latest every 30 seconds
  useEffect(() => {
    if (!selectedMeterId) return;

    let isMounted = true;
    let isFetching = false;

    const fetchLatestEvents = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const eventsRes = await bmsService.getDeviceEventsLatest(selectedMeterId, selectedSiteId).catch(() => null);
        if (!isMounted || !eventsRes) return;

        const { updates, lastEventTime } = mapLatestEventsToTelemetry(eventsRes, mainMeterTemplateRef.current?.mapping);

        if (updates && Object.keys(updates).length > 0) {
          setData(prev => ({
            ...prev,
            ...updates
          }));

          if (lastEventTime) {
            const tsMs = lastEventTime > 1e12 ? lastEventTime : lastEventTime * 1000;
            setLastTelemetryAt(tsMs);
          } else {
            setLastTelemetryAt(Date.now());
          }

          // Record snapshot into historyLog ring buffer for charts/trends
          setHistoryLog(prev => {
            const snap = {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              vR: updates.vR ?? prev[prev.length - 1]?.vR ?? 0,
              vY: updates.vY ?? prev[prev.length - 1]?.vY ?? 0,
              vB: updates.vB ?? prev[prev.length - 1]?.vB ?? 0,
              iR: updates.iR ?? prev[prev.length - 1]?.iR ?? 0,
              iY: updates.iY ?? prev[prev.length - 1]?.iY ?? 0,
              iB: updates.iB ?? prev[prev.length - 1]?.iB ?? 0,
              totalKw: updates.totalKw ?? prev[prev.length - 1]?.totalKw ?? 0,
              freq: updates.freq ?? prev[prev.length - 1]?.freq ?? 50,
              pf: updates.pf ?? prev[prev.length - 1]?.pf ?? 1,
              ebKwh: updates.ebKwh ?? prev[prev.length - 1]?.ebKwh ?? 0,
              dgKwh: updates.dgKwh ?? prev[prev.length - 1]?.dgKwh ?? 0,
              ebKvah: updates.ebKvah ?? prev[prev.length - 1]?.ebKvah ?? 0,
              totalKva: updates.totalKva ?? prev[prev.length - 1]?.totalKva ?? 0,
              reactivePower: updates.reactivePower ?? prev[prev.length - 1]?.reactivePower ?? 0,
              commStatus: updates.commStatus ?? 1,
              connectedStatus: updates.connectedStatus ?? 1,
            };
            const next = [...prev, snap];
            return next.length > 50 ? next.slice(next.length - 50) : next;
          });
        }
      } catch (err) {
        console.warn('Error fetching device latest events:', err);
      } finally {
        isFetching = false;
      }
    };

    // Immediate initial call on device selection
    fetchLatestEvents();

    // Recurring poll every 30 seconds
    const intervalId = setInterval(fetchLatestEvents, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [selectedMeterId, selectedSiteId]);


  // Cal LED Blinking frequency based on active power load
  useEffect(() => {
    // 1600 imp/kWh. If load is higher, Cal LED flashes faster.
    const activePowerVal = Number(data.activePower) || 0;
    const totalKwVal = Number(data.totalKw) || 0;
    const powerLoad = Math.max(1, activePowerVal, totalKwVal);
    const blinkRate = Math.max(120, Math.min(2500, 120000 / powerLoad));
    const blinkTimer = setInterval(() => {
      setCalBlink(prev => !prev);
    }, blinkRate);

    return () => clearInterval(blinkTimer);
  }, [data.activePower, data.totalKw]);

  // MFM Pages Definition
  const mfmPages = useMemo(() => {
    const formatNum = (val, dec = 1) => {
      return typeof val === 'number' && !isNaN(val) ? val.toFixed(dec) : '0.0';
    };

    return [
      {
        title: "PHASE-NEUTRAL VOLTAGE",
        lines: [
          { label: "Ua", value: formatNum(data.vR, 1), unit: "V" },
          { label: "Ub", value: formatNum(data.vY, 1), unit: "V" },
          { label: "Uc", value: formatNum(data.vB, 1), unit: "V" },
          { label: "F", value: formatNum(data.freq || 50.00, 3), unit: "Hz" }
        ],
        footerLabels: ["<Up", ">Down", "^Menu", "vEvnt"]
      },
      {
        title: "PHASE CURRENTS & LOAD",
        lines: [
          { label: "Ia", value: formatNum(data.iR, 2), unit: "A" },
          { label: "Ib", value: formatNum(data.iY, 2), unit: "A" },
          { label: "Ic", value: formatNum(data.iB, 2), unit: "A" },
          { label: "kW", value: formatNum(data.totalKw || data.activePower, 2), unit: "kW" }
        ],
        footerLabels: ["<Up", ">Down", "^Menu", "vEvnt"]
      },
      {
        title: "POWER & ENERGY",
        lines: [
          { label: "EP", value: formatNum(data.ebKwh || data.cumulativekWh, 1), unit: "kWh" },
          { label: "Eq", value: formatNum(data.ebKvah, 1), unit: "kVAh" },
          { label: "PF", value: formatNum(data.pf, 2), unit: "" },
          { label: "S", value: formatNum(data.totalKva || data.apparentPower, 2), unit: "kVA" }
        ],
        footerLabels: ["<Up", ">Down", "^Menu", "vEvnt"]
      },
      {
        title: "PREPAID DIAGNOSTICS",
        lines: [
          { label: "Bal", value: `₹${formatNum(data.balance, 2)}`, unit: "" },
          { label: "DG", value: formatNum(data.dgKwh, 1), unit: "kWh" },
          { label: "Src", value: data.ebDgStatus === 0 ? "EB GRID" : "DG SET", unit: "" },
          { label: "Ry", value: data.connectedStatus > 0 ? "ON" : "OFF", unit: "" }
        ],
        footerLabels: ["<Up", ">Down", "^Menu", "vEvnt"]
      }
    ];
  }, [data]);

  // Auto cycling logic for MFM pages
  useEffect(() => {
    if (autoCycle) {
      autoCycleTimer.current = setInterval(() => {
        setMfmPageIndex(prev => (prev + 1) % mfmPages.length);
      }, 4000);
    }
    return () => {
      if (autoCycleTimer.current) clearInterval(autoCycleTimer.current);
    };
  }, [autoCycle, mfmPages.length]);

  // Handle user manual button presses
  const pauseAutoCycleAndResetTimeout = () => {
    setAutoCycle(false);
    if (autoCycleTimer.current) clearInterval(autoCycleTimer.current);
    if (userInteractionTimeout.current) clearTimeout(userInteractionTimeout.current);

    // Auto-resume cycling after 15 seconds of no button presses
    userInteractionTimeout.current = setTimeout(() => {
      setAutoCycle(true);
    }, 15000);
  };

  const handleSW1 = () => {
    pauseAutoCycleAndResetTimeout();
    setMfmPageIndex(prev => (prev + 1) % mfmPages.length);
  };

  const handleSW2 = () => {
    pauseAutoCycleAndResetTimeout();
    setMfmPageIndex(prev => (prev - 1 + mfmPages.length) % mfmPages.length);
  };

  const activeMode = mfmPages[mfmPageIndex];

  const isDeviceConfigured = Boolean(siteDevices && siteDevices.length > 0);

  return (
    <div className="fade-in main-meter-workspace">
      <PageContextBanner
        title={mainMeterTemplate ? mainMeterTemplate.name : 'Main meter'}
        icon={<Zap className={isDeviceConfigured ? "text-warning" : "text-secondary"} size={22} />}
        status={isDeviceConfigured ? (isMeterOnline ? 'ONLINE' : 'OFFLINE') : 'NOT CONFIGURED'}
        siteSelector={siteSelector}
        deviceSelector={deviceSelector}
        metadata={[
          {
            icon: <Clock size={15} />,
            label: 'Realtime - last 1 day'
          }
        ]}
        actions={[
          <PdfButton
            key="pdf-export"
            label=""
            title="Download Custom PDF Report"
            variant="custom"
            className="context-banner-action-btn p-1 border-0"
            disabled={!isDeviceConfigured}
          />
        ]}
        enableFullscreen={true}
        variant="scada"
        className="main-meter-context-banner"
      />

      <Row className="g-3 mt-1">
        {/* LEFT COLUMN: HARDWARE DIGITAL TWIN METER */}
        <Col lg={5} xl={5}>
          <Card className="scada-glass-card border h-100 p-3 position-relative overflow-hidden">
            <div className="telemetry-wave-visualizer">
              <svg className="hud-wave-svg" viewBox="0 0 1000 400" preserveAspectRatio="none">
                <path className="wave-line-1" d="M 0 200 Q 250 50, 500 200 T 1000 200" fill="none" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="2" />
                <path className="wave-line-2" d="M 0 200 Q 250 350, 500 200 T 1000 200" fill="none" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="2" />
              </svg>
              <div className="grid-overlay"></div>
            </div>

            <div className="position-relative d-flex flex-column align-items-center justify-content-start h-100" style={{ zIndex: 2 }}>
              {/* Hardware Title Header */}
              <div className="w-100 d-flex justify-content-between align-items-center mb-2 px-1">
                <h6 className="text-secondary uppercase tracking-wider fs-11 fw-bold mb-0 d-flex align-items-center gap-2">
                  <Cpu size={14} className="text-info" /> Smart Meter Digital Twin
                </h6>
                <Button
                  size="sm"
                  variant={autoCycle ? "outline-info" : "outline-secondary"}
                  className="py-0 px-2 fs-10 fw-bold rounded-pill"
                  onClick={() => setAutoCycle(!autoCycle)}
                >
                  {autoCycle ? "⏸ Auto Cycle" : "▶ Manual"}
                </Button>
              </div>

              {/* Physical Digital Twin Hardware Casing */}
              <div className="mfm-polycarbonate-case my-1">
                <div className="screw top-left"></div>
                <div className="screw top-right"></div>
                <div className="screw bottom-left"></div>
                <div className="screw bottom-right"></div>

                <div className="mfm-metallic-bezel">
                  <div className="mfm-brand-header d-flex justify-content-between align-items-center">
                    <span className="mfm-brand-logo">SOCHIOT</span>
                    <span className="mfm-model-no font-monospace">APM Series</span>
                  </div>


                  {/* Grid LCD Screen Window */}
                  <div className="mfm-lcd-window mb-3">
                    <div className={`mfm-lcd-glass ${!isDeviceConfigured ? 'unconfigured-lcd-glass' : ''}`}>
                      <div className={`mfm-lcd-screen ${!isDeviceConfigured ? 'unconfigured-lcd-screen' : ''}`}>
                        {!isDeviceConfigured ? (
                          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center px-3 py-4 select-none">
                            {/* Dashed circular boundary */}
                            <div 
                              className="d-flex align-items-center justify-content-center mb-3"
                              style={{
                                width: '84px',
                                height: '84px',
                                borderRadius: '50%',
                                border: '1.5px dashed rgba(56, 189, 248, 0.45)',
                                background: 'rgba(56, 189, 248, 0.03)'
                              }}
                            >
                              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="7" width="18" height="13" rx="2" />
                                <line x1="3" y1="11" x2="21" y2="11" />
                                <line x1="7" y1="15" x2="10" y2="15" />
                                <path d="M15 4a3 3 0 0 1 3 3" />
                                <path d="M13 2a6 6 0 0 1 6 6" />
                                <line x1="1" y1="1" x2="23" y2="23" stroke="#38bdf8" strokeWidth="1.8" />
                              </svg>
                            </div>


                            <h5 className="fw-bold text-white mb-2" style={{ fontSize: '1.05rem', letterSpacing: '0.2px' }}>
                              No device configured for this site
                            </h5>

                            <p className="text-secondary mb-0" style={{ fontSize: '0.78rem', lineHeight: '1.45', maxWidth: '240px' }}>
                              Configure a device to view live telemetry, meter readings and SCADA data.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Top status bar */}
                            <div className="mfm-lcd-top-bar d-flex justify-content-between px-1">
                              <span className="mfm-lcd-title font-monospace">{activeMode.title}</span>
                              <span className="mfm-lcd-page-num font-monospace">P0{mfmPageIndex + 1}</span>
                            </div>

                            {/* LCD Screen Grid Rows */}
                            <div className="mfm-lcd-grid d-flex flex-column gap-1">
                              {activeMode.lines.map((line, lIdx) => (
                                <div key={lIdx} className="mfm-lcd-row d-flex align-items-center justify-content-between px-2 font-monospace">
                                  <div className="mfm-lcd-row-left d-flex align-items-center">
                                    <span className="mfm-lcd-label text-start me-1">{line.label}</span>
                                  </div>
                                  <div className="mfm-lcd-row-right d-flex align-items-baseline justify-content-end">
                                    <span className="mfm-lcd-value text-end fw-black">{line.value}</span>
                                    {line.unit && <span className="mfm-lcd-unit text-start ms-1">{line.unit}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Bottom menu bar */}
                            <div className="mfm-lcd-bottom-bar d-flex justify-content-between px-2 font-monospace mt-1">
                              {activeMode.footerLabels.map((lbl, idx) => (
                                <span key={idx} className="mfm-lcd-btn-label">{lbl}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic lights and push buttons row */}
                  <div className="mfm-bezel-bottom px-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      {/* LED Indicators */}
                      <div className="mfm-leds-rack d-flex gap-3 align-items-center">
                        <div className="mfm-led-group">
                          <div className={`mfm-led-bulb bulb-red ${isDeviceConfigured && calBlink ? 'glow-active' : ''}`}></div>
                          <span className="mfm-led-label font-monospace">CAL</span>
                        </div>
                        <div className="mfm-led-group">
                          <div className={`mfm-led-bulb bulb-green ${isDeviceConfigured && isMeterOnline ? 'glow-active' : ''}`}></div>
                          <span className="mfm-led-label font-monospace">COM</span>
                        </div>
                        <div className="mfm-led-group">
                          <div className={`mfm-led-bulb bulb-orange ${isDeviceConfigured && (data.overloadTrip > 0 || data.overloadLimitReached > 0) ? 'glow-active' : ''}`}></div>
                          <span className="mfm-led-label font-monospace">ALM</span>
                        </div>
                      </div>

                      {/* Standards markings — dynamic */}
                      <div className="mfm-spec-labels font-monospace text-secondary text-end">
                        <div>Sr No: {isDeviceConfigured && data.meterSrno > 0 ? data.meterSrno : '—'}</div>
                        <div>{isDeviceConfigured && data.freq > 0 ? `${data.freq.toFixed(1)}Hz` : '—'} · SOCHIOT</div>
                      </div>
                    </div>

                    {/* Glossy tact plastic buttons */}
                    <div className="mfm-button-deck d-flex justify-content-between gap-2 px-1 mt-3">
                      <button className="mfm-tactile-btn prev-btn" onClick={handleSW2} disabled={!isDeviceConfigured} title="Page UP (<)">
                        <span className="btn-glyph">&lt;</span>
                      </button>
                      <button className="mfm-tactile-btn next-btn" onClick={handleSW1} disabled={!isDeviceConfigured} title="Page DOWN (>)">
                        <span className="btn-glyph">&gt;</span>
                      </button>
                      <button className="mfm-tactile-btn menu-btn" disabled title="System Mapping Information">
                        <span className="btn-glyph">⚙</span>
                      </button>
                      <button className="mfm-tactile-btn enter-btn" onClick={() => { pauseAutoCycleAndResetTimeout(); setAutoCycle(prev => !prev); }} disabled={!isDeviceConfigured} title="Toggle Page Auto-Cycle">
                        <span className="btn-glyph">↵</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horizontal HUD Panel */}
              <div className="w-100 mt-2 d-flex justify-content-center gap-2 flex-wrap px-1">
                <div className="hud-metric-horizontal">
                  <span className="hud-label">METER TARGET</span>
                  <span className="hud-value text-info font-monospace">
                    {isDeviceConfigured ? (mainMeterTemplate?.mapping?.energyMeteringTarget || mainMeterTemplate?.name || '—') : '--'}
                  </span>
                </div>
                <div className="hud-metric-horizontal">
                  <span className="hud-label">EB TARIFF</span>
                  <span className="hud-value text-success font-monospace">
                    {isDeviceConfigured ? (data.ebTariff > 0 ? `₹${data.ebTariff}/U` : '—') : '--'}
                  </span>
                </div>
                <div className="hud-metric-horizontal">
                  <span className="hud-label">DG TARIFF</span>
                  <span className="hud-value text-warning font-monospace">
                    {isDeviceConfigured ? (data.dgTariff > 0 ? `₹${data.dgTariff}/U` : '—') : '--'}
                  </span>
                </div>
                <div className="hud-metric-horizontal">
                  <span className="hud-label">R-PHASE LOAD</span>
                  <span className="hud-value text-danger font-monospace">
                    {isDeviceConfigured ? `${data.vR}V / ${data.iR}A` : '--'}
                  </span>
                </div>
                <div className="hud-metric-horizontal">
                  <span className="hud-label">Y-PHASE LOAD</span>
                  <span className="hud-value text-warning font-monospace">
                    {isDeviceConfigured ? `${data.vY}V / ${data.iY}A` : '--'}
                  </span>
                </div>
                <div className="hud-metric-horizontal">
                  <span className="hud-label">B-PHASE LOAD</span>
                  <span className="hud-value text-primary font-monospace">
                    {isDeviceConfigured ? `${data.vB}V / ${data.iB}A` : '--'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* RIGHT COLUMN: TECHNICAL METRICS, WAVE DIAGRAMS, DIALS */}
        <Col lg={7} xl={7}>
          <Card 
            className="scada-glass-card border h-100 p-3"
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3" style={{ zIndex: 5 }}>
              <h5 className="mb-0 fw-black d-flex align-items-center gap-2 uppercase tracking-wide fs-11" style={{ color: 'var(--scada-text)' }}>
                <Activity className="text-info animate-pulse" size={18} /> SCADA Control Panel
              </h5>
              <div className="d-flex align-items-center gap-1 scada-tabs-container p-1 rounded-3" style={{ backgroundColor: 'var(--scada-accent-bg)', border: '1px solid var(--scada-border)' }}>
                <Button
                  size="sm"
                  variant="link"
                  className={`scada-tab-btn px-3 py-1.5 fs-11 uppercase fw-bold rounded-2 text-decoration-none border-0 transition-all ${activeRightTab === 'telemetry' ? 'text-info active-tab' : 'text-secondary'}`}
                  onClick={() => setActiveRightTab('telemetry')}
                >
                  Live Telemetry
                </Button>
                <Button
                  size="sm"
                  variant="link"
                  className={`scada-tab-btn px-3 py-1.5 fs-11 uppercase fw-bold rounded-2 text-decoration-none border-0 transition-all ${activeRightTab === 'config' ? 'text-info active-tab' : 'text-secondary'}`}
                  onClick={() => setActiveRightTab('config')}
                >
                  Config & Limits
                </Button>
                <Button
                  size="sm"
                  variant="link"
                  className={`scada-tab-btn px-3 py-1.5 fs-11 uppercase fw-bold rounded-2 text-decoration-none border-0 transition-all ${activeRightTab === 'alarms' ? 'text-warning active-tab' : 'text-secondary'}`}
                  onClick={() => setActiveRightTab('alarms')}
                >
                  Alarms & Relays
                </Button>
              </div>
            </div>
            {/* Helper inside render to query field visibility */}
            {(() => {
              const mapping = mainMeterTemplate?.mapping;
              const isFieldVisible = (key) => {
                if (!isTemplateMapped) return true;
                return !!mappedFields[key];
              };

              const getFieldMetadata = (config, fieldKey, defaultLabel, defaultUnit, rawValue) => {
                if (!isDeviceConfigured) {
                  return { label: defaultLabel, val: '--' };
                }

                if (rawValue === '' || rawValue === null || rawValue === undefined) {
                  return { label: defaultLabel, val: '—' };
                }

                if (config && config.enabled !== false && config[fieldKey]) {
                  const fieldVal = config[fieldKey];
                  let cleanKey = fieldVal;
                  if (typeof fieldVal === 'string') {
                    if (fieldVal.includes(':')) {
                      cleanKey = fieldVal.split(':').pop();
                    }
                    const cleanUpper = cleanKey.trim().toUpperCase();

                    // Prioritize defaultLabel (the parameter's configuration name)
                    let label = defaultLabel ? defaultLabel.toUpperCase() : cleanUpper;
                    if (!defaultLabel) {
                      if (cleanUpper === 'EBKVAH' || cleanUpper === 'KVAH') label = 'EB KVAH';
                      else if (cleanUpper === 'EBKWH' || cleanUpper === 'KWH') label = 'EB KWH';
                      else if (cleanUpper === 'VR') label = 'VOLTAGE R-PHASE';
                      else if (cleanUpper === 'VY') label = 'VOLTAGE Y-PHASE';
                      else if (cleanUpper === 'VB') label = 'VOLTAGE B-PHASE';
                      else if (cleanUpper === 'IR') label = 'R-CURRENT';
                      else if (cleanUpper === 'IY') label = 'Y-CURRENT';
                      else if (cleanUpper === 'IB') label = 'B-CURRENT';
                      else if (cleanUpper === 'PF') label = 'POWER FACTOR';
                      else if (cleanUpper === 'TOTALKW') label = 'TOTAL KW';
                      else if (cleanUpper === 'TOTALKVA') label = 'TOTAL KVA';
                      else if (cleanUpper === 'DGKWH') label = 'DG KWH';
                    }

                    let unit = defaultUnit;
                    if (!unit) {
                      if (cleanUpper.includes('KVAH')) {
                        unit = 'kVAh';
                      } else if (cleanUpper.includes('KWH')) {
                        unit = 'kWh';
                      } else if (cleanUpper.includes('KVAR')) {
                        unit = 'kVAR';
                      } else if (cleanUpper.includes('KW')) {
                        unit = 'kW';
                      } else if (cleanUpper.includes('KVA')) {
                        unit = 'kVA';
                      } else if (cleanUpper.includes('V')) {
                        unit = 'V';
                      } else if (cleanUpper.includes('A')) {
                        unit = 'A';
                      }
                    }

                    // Format value with unit or prefix (round numerics)
                    const fmtVal = rawValue === undefined || rawValue === null || rawValue === '' ? '—' : (typeof rawValue === 'number' ? rawValue.toFixed(2) : rawValue);
                    let val = fmtVal;
                    if (label === 'BALANCE') {
                      val = `₹${fmtVal}`;
                    } else if (unit) {
                      val = `${fmtVal} ${unit}`;
                    }

                    return { label, val };
                  }
                }

                // Default formatting (round numerics)
                const fmtVal2 = rawValue === undefined || rawValue === null || rawValue === '' ? '—' : (typeof rawValue === 'number' ? rawValue.toFixed(2) : rawValue);
                let val = fmtVal2;
                if (defaultLabel === 'BALANCE') {
                  val = `₹${fmtVal2}`;
                } else if (defaultUnit) {
                  val = `${fmtVal2} ${defaultUnit}`;
                }
                return { label: defaultLabel, val };
              };

              const hasChangeParams =
                isFieldVisible('ebKvah') || isFieldVisible('ebKwh') ||
                isFieldVisible('balance') || isFieldVisible('totalKw') ||
                isFieldVisible('vR') || isFieldVisible('vY') ||
                isFieldVisible('vB') || isFieldVisible('iR') ||
                isFieldVisible('iY') || isFieldVisible('iB') ||
                isFieldVisible('pf') || isFieldVisible('totalKva') ||
                isFieldVisible('dgKwh') ||
                isFieldVisible('activePower') || isFieldVisible('reactivePower') ||
                isFieldVisible('apparentPower') || isFieldVisible('cumulativekWh') ||
                isFieldVisible('freq');

              const hasWarningParams =
                isFieldVisible('lowBalanceCut') || isFieldVisible('overloadTrip') ||
                isFieldVisible('overloadLimitReached') || isFieldVisible('connectedStatus') ||
                isFieldVisible('forceOff');

              const hasReadParams =
                isFieldVisible('meterSrno') || isFieldVisible('noOfOverloadCheck') ||
                isFieldVisible('ebDgStatus') || isFieldVisible('ebTariff') ||
                isFieldVisible('dgTariff') || isFieldVisible('ebRLoadSet') ||
                isFieldVisible('ebYLoadSet') || isFieldVisible('ebBLoadSet') ||
                isFieldVisible('dgRLoadSet') || isFieldVisible('dgYLoadSet') ||
                isFieldVisible('dgBLoadSet');

              return (
                <div className="d-flex flex-column gap-4 w-100" style={{ zIndex: 5 }}>
                  {/* CHANGE Parameters Group */}
                  {activeRightTab === 'telemetry' && hasChangeParams && (
                    <div className="p-3 scada-section-box rounded-4">
                      <h6 className="text-info fw-black uppercase tracking-widest fs-12 mb-3 d-flex align-items-center gap-2">
                        <Activity size={14} /> Mapped Change Parameters
                      </h6>
                      <Row className="g-3">
                        {/* Voltages subgroup */}
                        {(isFieldVisible('vR') || isFieldVisible('vY') || isFieldVisible('vB')) && (
                          <Col lg={6} md={12} className="mb-3">
                            <div className="p-2.5 bg-dark bg-opacity-40 rounded-4 border border-secondary border-opacity-10 h-100">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <small className="text-secondary fs-11 uppercase fw-bold tracking-wider">Line-to-Neutral Voltages</small>
                                <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-20 fs-10 font-monospace">
                                  {isDeviceConfigured && data.ebRLoadSet > 0 ? `R-LIMIT: ${data.ebRLoadSet}kW` : 'VOLTAGE — 3Φ'}
                                </Badge>
                              </div>
                              <Row className="g-2">
                                {isFieldVisible('vR') && (
                                  <Col xs={4}>
                                    <CircularGauge
                                      value={data.vR}
                                      min={150}
                                      max={300}
                                      label="R-Phase Voltage"
                                      unit="V"
                                      limits={emLimitsConfig.vR}
                                      defaultColor="#ef4444"
                                      defaultGlowClass={true}
                                      isConfigured={isDeviceConfigured}
                                    />
                                  </Col>
                                )}
                                {isFieldVisible('vY') && (
                                  <Col xs={4}>
                                    <CircularGauge
                                      value={data.vY}
                                      min={150}
                                      max={300}
                                      label="Y-Phase Voltage"
                                      unit="V"
                                      limits={emLimitsConfig.vY}
                                      defaultColor="#f59e0b"
                                      defaultGlowClass={true}
                                      isConfigured={isDeviceConfigured}
                                    />
                                  </Col>
                                )}
                                {isFieldVisible('vB') && (
                                  <Col xs={4}>
                                    <CircularGauge
                                      value={data.vB}
                                      min={150}
                                      max={300}
                                      label="B-Phase Voltage"
                                      unit="V"
                                      limits={emLimitsConfig.vB}
                                      defaultColor="#06b6d4"
                                      defaultGlowClass={true}
                                      isConfigured={isDeviceConfigured}
                                    />
                                  </Col>
                                )}
                              </Row>
                            </div>
                          </Col>
                        )}

                        {/* Currents subgroup */}
                        {(isFieldVisible('iR') || isFieldVisible('iY') || isFieldVisible('iB')) && (
                          <Col lg={6} md={12} className="mb-3">
                            <div className="p-2.5 bg-dark bg-opacity-40 rounded-4 border border-secondary border-opacity-10 h-100">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <small className="text-secondary fs-11 uppercase fw-bold tracking-wider">Line Currents</small>
                                <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-20 fs-10 font-monospace">
                                  {isDeviceConfigured && data.ebRLoadSet > 0 ? `LOAD LIMIT: ${data.ebRLoadSet}kW` : 'CURRENT — 3Φ'}
                                </Badge>
                              </div>
                              <Row className="g-2">
                                {isFieldVisible('iR') && (
                                  <Col xs={4}>
                                    <CircularGauge
                                      value={data.iR}
                                      min={0}
                                      max={data.ebRLoadSet > 0 ? data.ebRLoadSet * 4.35 : 60}
                                      label="R-Current"
                                      unit="A"
                                      limits={emLimitsConfig.iR}
                                      defaultColor="#ef4444"
                                      defaultGlowClass={true}
                                      isConfigured={isDeviceConfigured}
                                    />
                                  </Col>
                                )}
                                {isFieldVisible('iY') && (
                                  <Col xs={4}>
                                    <CircularGauge
                                      value={data.iY}
                                      min={0}
                                      max={data.ebYLoadSet > 0 ? data.ebYLoadSet * 4.35 : 60}
                                      label="Y-Current"
                                      unit="A"
                                      limits={emLimitsConfig.iY}
                                      defaultColor="#f59e0b"
                                      defaultGlowClass={true}
                                      isConfigured={isDeviceConfigured}
                                    />
                                  </Col>
                                )}
                                {isFieldVisible('iB') && (
                                  <Col xs={4}>
                                    <CircularGauge
                                      value={data.iB}
                                      min={0}
                                      max={data.ebBLoadSet > 0 ? data.ebBLoadSet * 4.35 : 60}
                                      label="B-Current"
                                      unit="A"
                                      limits={emLimitsConfig.iB}
                                      defaultColor="#06b6d4"
                                      defaultGlowClass={true}
                                      isConfigured={isDeviceConfigured}
                                    />
                                  </Col>
                                )}
                              </Row>
                            </div>
                          </Col>
                        )}

                        {/* Grid Change Parameters */}
                        {[
                          { defaultLabel: 'EB KVAH', defaultUnit: 'kVAh', key: 'ebKvah', config: mapping?.emChangeConfig, rawValue: data.ebKvah, icon: <Gauge size={14} className="text-info" /> },
                          { defaultLabel: 'EB KWH', defaultUnit: 'kWh', key: 'ebKwh', config: mapping?.emChangeConfig, rawValue: data.ebKwh, icon: <Zap size={14} className="text-warning animate-pulse" /> },
                          { defaultLabel: 'BALANCE', defaultUnit: '', key: 'balance', isImportant: true, config: mapping?.emChangeConfig, rawValue: data.balance, icon: <Coins size={14} className="text-warning" /> },
                          { defaultLabel: 'TOTAL KW', defaultUnit: 'kW', key: 'totalKw', config: mapping?.emChangeConfig, rawValue: data.totalKw, icon: <Sliders size={14} className="text-danger" />, limits: emLimitsConfig.totalKw },
                          { defaultLabel: 'POWER FACTOR', defaultUnit: '', key: 'pf', config: mapping?.emChangeConfig, rawValue: data.pf, icon: <Cpu size={14} className="text-success" /> },
                          { defaultLabel: 'TOTAL KVA', defaultUnit: 'kVA', key: 'totalKva', config: mapping?.emChangeConfig, rawValue: data.totalKva, icon: <Gauge size={14} className="text-primary" />, limits: emLimitsConfig.totalKva },
                          { defaultLabel: 'DG KWH', defaultUnit: 'kWh', key: 'dgKwh', config: mapping?.emChangeConfig, rawValue: data.dgKwh, icon: <Flame size={14} className="text-orange" /> },
                          { defaultLabel: 'ACTIVE POWER', defaultUnit: 'kW', key: 'activePower', config: mapping?.emPowerConfig, rawValue: data.activePower, icon: <Zap size={14} className="text-info" /> },
                          { defaultLabel: 'REACTIVE POWER', defaultUnit: 'kVAR', key: 'reactivePower', config: mapping?.emPowerConfig, rawValue: data.reactivePower, icon: <Activity size={14} className="text-warning" /> },
                          { defaultLabel: 'APPARENT POWER', defaultUnit: 'kVA', key: 'apparentPower', config: mapping?.emPowerConfig, rawValue: data.apparentPower, icon: <Gauge size={14} className="text-primary" /> },
                          { defaultLabel: 'CUMULATIVE ENERGY', defaultUnit: 'kWh', key: 'cumulativekWh', config: mapping?.emConsumptionConfig, rawValue: data.cumulativekWh, icon: <Zap size={14} className="text-success" /> },
                          { defaultLabel: 'FREQUENCY', defaultUnit: 'Hz', key: 'freq', config: mapping?.emSystemConfig, rawValue: data.freq, icon: <Activity size={14} className="text-info" /> },
                          { defaultLabel: 'AVG VOLTAGE L-L', defaultUnit: 'V', key: 'vLLAvg', config: mapping?.emChangeConfig, rawValue: data.vLLAvg, icon: <Activity size={14} className="text-info" /> },
                          { defaultLabel: 'AVG VOLTAGE L-N', defaultUnit: 'V', key: 'vLNAvg', config: mapping?.emChangeConfig, rawValue: data.vLNAvg, icon: <Activity size={14} className="text-info" /> },
                          { defaultLabel: 'AVG CURRENT', defaultUnit: 'A', key: 'iAvg', config: mapping?.emChangeConfig, rawValue: data.iAvg, icon: <Activity size={14} className="text-info" /> },
                          { defaultLabel: 'POWER KVA (AVG)', defaultUnit: 'kVA', key: 'kvaAvg', config: mapping?.emChangeConfig, rawValue: data.kvaAvg, icon: <Activity size={14} className="text-primary" /> },
                          { defaultLabel: 'POWER KVAR (AVG)', defaultUnit: 'kVAR', key: 'kvarAvg', config: mapping?.emChangeConfig, rawValue: data.kvarAvg, icon: <Activity size={14} className="text-warning" /> },
                          { defaultLabel: 'AVG PF', defaultUnit: '', key: 'pfAvg', config: mapping?.emChangeConfig, rawValue: data.pfAvg, icon: <Cpu size={14} className="text-success" /> },
                          { defaultLabel: 'VOLTAGE R-Y', defaultUnit: 'V', key: 'vRY', config: mapping?.emChangeConfig, rawValue: data.vRY, icon: <Activity size={14} className="text-danger" /> },
                          { defaultLabel: 'VOLTAGE Y-B', defaultUnit: 'V', key: 'vYB', config: mapping?.emChangeConfig, rawValue: data.vYB, icon: <Activity size={14} className="text-warning" /> },
                          { defaultLabel: 'VOLTAGE B-R', defaultUnit: 'V', key: 'vBR', config: mapping?.emChangeConfig, rawValue: data.vBR, icon: <Activity size={14} className="text-info" /> },
                          { defaultLabel: 'PF-R', defaultUnit: '', key: 'pfR', config: mapping?.emChangeConfig, rawValue: data.pfR, icon: <Cpu size={14} className="text-danger" /> },
                          { defaultLabel: 'PF-Y', defaultUnit: '', key: 'pfY', config: mapping?.emChangeConfig, rawValue: data.pfY, icon: <Cpu size={14} className="text-warning" /> },
                          { defaultLabel: 'PF-B', defaultUnit: '', key: 'pfB', config: mapping?.emChangeConfig, rawValue: data.pfB, icon: <Cpu size={14} className="text-info" /> },
                          { defaultLabel: 'LOAD HRS', defaultUnit: 'h', key: 'loadHrs', config: mapping?.emChangeConfig, rawValue: data.loadHrs, icon: <Clock size={14} className="text-secondary" /> },
                          { defaultLabel: 'LOAD MIN', defaultUnit: 'm', key: 'loadMin', config: mapping?.emChangeConfig, rawValue: data.loadMin, icon: <Clock size={14} className="text-secondary" /> },
                          { defaultLabel: 'NO LOAD HRS', defaultUnit: 'h', key: 'noLoadHrs', config: mapping?.emChangeConfig, rawValue: data.noLoadHrs, icon: <Clock size={14} className="text-secondary" /> },
                          { defaultLabel: 'NO LOAD MIN', defaultUnit: 'm', key: 'noLoadMin', config: mapping?.emChangeConfig, rawValue: data.noLoadMin, icon: <Clock size={14} className="text-secondary" /> },
                          { defaultLabel: 'LOAD %', defaultUnit: '%', key: 'loadPct', config: mapping?.emChangeConfig, rawValue: data.loadPct, icon: <Gauge size={14} className="text-primary" /> }
                        ].map((item, idx) => {
                          if (!isFieldVisible(item.key)) return null;

                          // Skip rendering duplicates if primary parameters are already present
                          if (item.key === 'activePower' && isFieldVisible('totalKw')) return null;
                          if (item.key === 'apparentPower' && isFieldVisible('totalKva')) return null;
                          if (item.key === 'cumulativekWh' && isFieldVisible('ebKwh')) return null;

                          const { label, val } = getFieldMetadata(item.config, item.key, item.defaultLabel, item.defaultUnit, item.rawValue);
                          const numericValue = typeof item.rawValue === 'number' ? item.rawValue : Number(item.rawValue) || 0;

                          // Get threshold status if limits are configured and device is configured
                          const cardStatus = (isDeviceConfigured && item.limits) ? getThresholdStatus(numericValue, item.limits) : 'default';

                          // Determine the parameter accent color based on key
                          let accentColor = 'rgba(255, 255, 255, 0.1)';
                          if (item.key.includes('R') || item.key === 'vR' || item.key === 'iR') accentColor = '#ef4444';
                          else if (item.key.includes('Y') || item.key === 'vY' || item.key === 'iY') accentColor = '#f59e0b';
                          else if (item.key.includes('B') || item.key === 'vB' || item.key === 'iB') accentColor = '#06b6d4';
                          else if (item.key === 'balance') accentColor = '#eab308';
                          else if (item.key === 'totalKw' || item.key === 'activePower' || item.key === 'cumulativekWh' || item.key === 'ebKwh') accentColor = '#10b981';
                          else if (item.key === 'totalKva' || item.key === 'apparentPower' || item.key === 'ebKvah') accentColor = '#3b82f6';
                          else if (item.key === 'dgKwh') accentColor = '#f97316';
                          else if (item.key === 'pf') accentColor = '#14b8a6';
                          else if (item.key === 'freq') accentColor = '#06b6d4';

                          let borderStyle = !isDeviceConfigured
                            ? { border: '1px solid rgba(255, 255, 255, 0.05)', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }
                            : { borderLeft: `4px solid ${accentColor}`, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' };
                          let textClass = !isDeviceConfigured ? 'text-secondary' : (item.isImportant ? 'text-warning' : 'text-white');

                          if (isDeviceConfigured) {
                            if (cardStatus === 'alert') {
                              borderStyle = {
                                ...borderStyle,
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                borderLeft: '4px solid #ef4444',
                                boxShadow: '0 0 12px rgba(239, 68, 68, 0.25)'
                              };
                              textClass = 'text-danger';
                            } else if (cardStatus === 'warning') {
                              borderStyle = {
                                ...borderStyle,
                                borderColor: 'rgba(245, 158, 11, 0.4)',
                                borderLeft: '4px solid #f59e0b',
                                boxShadow: '0 0 12px rgba(245, 158, 11, 0.25)'
                              };
                              textClass = 'text-warning';
                            } else if (cardStatus === 'normal') {
                              borderStyle = {
                                ...borderStyle,
                                borderColor: 'rgba(16, 185, 129, 0.4)',
                                borderLeft: '4px solid #10b981',
                                boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)'
                              };
                              textClass = 'text-success';
                            }
                          }

                          return (
                            <Col xs={6} sm={4} md={3} lg={3} className="mb-3" key={idx}>
                              <div
                                className={`parameter-glass-card p-2.5 rounded-3 h-100 d-flex flex-column align-items-center justify-content-center text-center ${isDeviceConfigured && item.isImportant ? 'important-glow-card' : ''}`}
                                style={borderStyle}
                              >
                                <div className="d-flex align-items-center justify-content-center gap-1.5 mb-1 w-100" style={{ opacity: isDeviceConfigured ? 1 : 0.6 }}>
                                  {item.icon}
                                  <small className="text-secondary uppercase fw-bold tracking-wider" style={{ fontSize: '0.68rem' }}>{label}</small>
                                </div>
                                <h5 className={`mb-0 fw-bold font-monospace tracking-wide ${textClass}`} style={{ fontSize: '0.95rem' }}>{val}</h5>
                                {isDeviceConfigured && item.limits && (parseLimit(item.limits.low) !== null || parseLimit(item.limits.high) !== null || parseLimit(item.limits.normalMin) !== null || parseLimit(item.limits.normalMax) !== null) && (
                                  <div className="fs-10 text-secondary font-monospace mt-1 text-center" style={{ opacity: 0.7, fontSize: '0.65rem' }}>
                                    {parseLimit(item.limits.low) !== null && `L: <${item.limits.low}`}
                                    {parseLimit(item.limits.high) !== null && ` H: >${item.limits.high}`}
                                    {parseLimit(item.limits.normalMin) !== null && parseLimit(item.limits.normalMax) !== null && ` [${item.limits.normalMin}-${item.limits.normalMax}]`}
                                  </div>
                                )}
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}

                  {/* WARNING / Alarm Panel */}
                  {activeRightTab === 'alarms' && hasWarningParams && (
                    <div className="p-3 scada-section-box rounded-4">
                      <h6 className="text-warning fw-black uppercase tracking-widest fs-12 mb-3 d-flex align-items-center gap-2">
                        <ShieldCheck size={14} /> Warnings & Relays
                      </h6>
                      <Row className="g-3">
                        {[
                          { label: 'Low Balance Cut', val: data.lowBalanceCut, key: 'lowBalanceCut', icon: <AlertTriangle size={14} className="text-danger" /> },
                          { label: 'Overload Trip', val: data.overloadTrip, key: 'overloadTrip', icon: <ShieldAlert size={14} className="text-danger" /> },
                          { label: 'Overload Limit Reached', val: data.overloadLimitReached, key: 'overloadLimitReached', icon: <Info size={14} className="text-warning" /> },
                          { label: 'Connected Status', val: data.connectedStatus, key: 'connectedStatus', isConnected: true, icon: <Cpu size={14} className="text-success" /> },
                          { label: 'Force Off', val: data.forceOff, key: 'forceOff', icon: <AlertTriangle size={14} className="text-secondary" /> }
                        ].map((item, idx) => {
                          if (!isFieldVisible(item.key)) return null;
                          const isActive = isDeviceConfigured && Number(item.val) > 0;
                          return (
                            <Col xs={6} sm={4} md={3} lg={3} className="mb-3" key={idx}>
                              <div
                                className="p-2.5 parameter-glass-card rounded-3 d-flex flex-column align-items-center justify-content-center text-center h-100"
                                style={{
                                  backgroundColor: isActive
                                    ? (item.isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)')
                                    : 'rgba(255, 255, 255, 0.02)',
                                  borderColor: isActive
                                    ? (item.isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)')
                                    : 'rgba(255, 255, 255, 0.05)',
                                  borderWidth: '1px',
                                  borderStyle: 'solid'
                                }}
                              >
                                <div className="d-flex align-items-center justify-content-center gap-2 mb-1 w-100">
                                  <div className="p-1 bg-dark bg-opacity-40 rounded-3 border border-secondary border-opacity-10">
                                    {item.icon}
                                  </div>
                                  <span className={`pulse-dot-${isActive ? (item.isConnected ? 'green' : 'red') : 'grey'}`}></span>
                                </div>
                                <small className={`${isActive ? 'text-white' : 'text-secondary'} d-block uppercase fw-bold mb-0.5`} style={{ fontSize: '0.68rem' }}>{item.label}</small>
                                <span className={`fw-bold ${isActive ? (item.isConnected ? 'text-success' : 'text-danger') : 'text-secondary'}`} style={{ fontSize: '0.85rem' }}>
                                  {isDeviceConfigured ? (item.isConnected ? (isActive ? 'CONN' : 'DISC') : (isActive ? 'ACT' : 'INACT')) : '--'}
                                </span>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}

                  {/* READ Parameters */}
                  {activeRightTab === 'config' && hasReadParams && (
                    <div className="p-3 scada-section-box rounded-4">
                      <h6 className="text-success fw-black uppercase tracking-widest fs-12 mb-3 d-flex align-items-center gap-2">
                        <Activity size={14} /> Mapped Configuration & Limits
                      </h6>
                      <Row className="g-3">
                        {[
                          { label: 'Meter Serial No', val: data.meterSrno, key: 'meterSrno', icon: <Info size={13} className="text-info" /> },
                          { label: 'No of Overload Check', val: data.noOfOverloadCheck, key: 'noOfOverloadCheck', icon: <Sliders size={13} className="text-info" /> },
                          { label: 'EB/DG Status', val: data.ebDgStatus === 0 ? 'EB GRID' : 'DG SET', key: 'ebDgStatus', icon: <Cpu size={13} className="text-success" /> },
                          { label: 'EB Tariff', val: `₹${data.ebTariff}/Unit`, key: 'ebTariff', icon: <Coins size={13} className="text-warning" /> },
                          { label: 'DG Tariff', val: `₹${data.dgTariff}/Unit`, key: 'dgTariff', icon: <Coins size={13} className="text-warning" /> },
                          { label: 'EB R Load Set', val: `${data.ebRLoadSet} kW`, key: 'ebRLoadSet', icon: <Sliders size={13} className="text-danger" /> },
                          { label: 'EB Y Load Set', val: `${data.ebYLoadSet} kW`, key: 'ebYLoadSet', icon: <Sliders size={13} className="text-warning" /> },
                          { label: 'EB B Load Set', val: `${data.ebBLoadSet} kW`, key: 'ebBLoadSet', icon: <Sliders size={13} className="text-primary" /> },
                          { label: 'DG R Load Set', val: `${data.dgRLoadSet} kW`, key: 'dgRLoadSet', icon: <Sliders size={13} className="text-danger" /> },
                          { label: 'DG Y Load Set', val: `${data.dgYLoadSet} kW`, key: 'dgYLoadSet', icon: <Sliders size={13} className="text-warning" /> },
                          { label: 'DG B Load Set', val: `${data.dgBLoadSet} kW`, key: 'dgBLoadSet', icon: <Sliders size={13} className="text-primary" /> }
                        ].map((item, idx) => {
                          if (!isFieldVisible(item.key)) return null;
                          const displayVal = !isDeviceConfigured ? '--' : item.val;
                          return (
                            <Col xs={6} sm={4} md={3} lg={3} className="mb-3" key={idx}>
                              <div className="p-2.5 parameter-glass-card rounded-3 h-100 d-flex flex-column align-items-center justify-content-center text-center">
                                <div className="p-1 bg-dark bg-opacity-40 rounded-3 border border-secondary border-opacity-10 mb-1" style={{ opacity: isDeviceConfigured ? 1 : 0.6 }}>
                                  {item.icon}
                                </div>
                                <small className="text-secondary d-block uppercase fw-bold mb-0.5" style={{ fontSize: '0.68rem' }}>{item.label}</small>
                                <h5 className={`mb-0 fw-bold font-monospace ${!isDeviceConfigured ? 'text-secondary' : 'text-white'}`} style={{ fontSize: '0.92rem' }}>{displayVal}</h5>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}
                </div>
              );
            })()}
          </Card>
        </Col>
      </Row>

      {/* HISTORICAL LOG TABLE */}
      <Card className="scada-glass-card border-0 text-white mt-3">
        <Card.Body className="p-3">
          <h5 className="mb-3 fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11">
            <Activity className="text-info animate-pulse" size={18} /> Main Incomer Log History
          </h5>
          <div className="table-responsive">
            <Table hover borderless className="align-middle scada-table text-white mb-0">
              <thead>
                <tr className="border-bottom border-secondary border-opacity-15 fs-13 text-secondary text-uppercase tracking-wider">
                  <th className="py-2">Timestamp</th>
                  <th className="py-2 text-center">Voltage R-Y-B</th>
                  <th className="py-2 text-center">Current R-Y-B</th>
                  <th className="py-2 text-center">Active Load</th>
                  <th className="py-2 text-center">Frequency</th>
                  <th className="py-2 text-center">Power Factor</th>
                  <th className="py-2 text-end">Grid Condition</th>
                </tr>
              </thead>
              <tbody>
                {historyLog.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-secondary font-monospace fs-13">
                      <div className="d-flex flex-column align-items-center gap-2" style={{ opacity: 0.5 }}>
                        <Activity size={20} className={isDeviceConfigured ? "text-info" : "text-secondary"} />
                        <span>{isDeviceConfigured ? `Waiting for live telemetry from ${mainMeterTemplate?.name || 'meter'}...` : 'No device configured for this site'}</span>
                        <small>{isDeviceConfigured ? 'Data will populate automatically every 4 seconds.' : 'Configure a device to view live telemetry and historical logs.'}</small>
                      </div>
                    </td>
                  </tr>
                ) : historyLog.map((row, idx) => {
                  const fmt = (v, d = 1) => v !== null && v !== undefined ? Number(v).toFixed(d) : '—';
                  const isNormal = !row.connectedStatus || row.connectedStatus > 0;
                  return (
                    <tr key={idx} className="border-bottom border-secondary border-opacity-5">
                      <td className="py-2 font-monospace text-info fs-13">{row.time}</td>
                      <td className="py-2 text-center font-monospace">
                        <span className="text-danger">{fmt(row.vR)}</span>
                        <span className="text-muted mx-1">/</span>
                        <span className="text-warning">{fmt(row.vY)}</span>
                        <span className="text-muted mx-1">/</span>
                        <span className="text-info">{fmt(row.vB)}</span>
                        <span className="text-secondary ms-1">V</span>
                      </td>
                      <td className="py-2 text-center font-monospace">
                        <span className="text-danger">{fmt(row.iR, 2)}</span>
                        <span className="text-muted mx-1">/</span>
                        <span className="text-warning">{fmt(row.iY, 2)}</span>
                        <span className="text-muted mx-1">/</span>
                        <span className="text-info">{fmt(row.iB, 2)}</span>
                        <span className="text-secondary ms-1">A</span>
                      </td>
                      <td className="py-2 text-center text-white fw-bold font-monospace">{fmt(row.totalKw, 2)} kW</td>
                      <td className="py-2 text-center text-secondary font-monospace">{fmt(row.freq, 2)} Hz</td>
                      <td className="py-2 text-center text-secondary font-monospace">{fmt(row.pf, 2)}</td>
                      <td className="py-2 text-end">
                        <Badge bg={isNormal ? 'success' : 'danger'} className={`bg-opacity-10 ${isNormal ? 'text-success border-success' : 'text-danger border-danger'} border border-opacity-20 px-2 py-1`}>
                          {isNormal ? 'Normal' : 'Alarm'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* DETAILED REAL-TIME CSS STYLING FOR DIGITAL TWIN METER */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* SCADA Common styles & Glassmorphism */
        .scada-glass-card {
          background: linear-gradient(135deg, rgba(13, 20, 38, 0.8) 0%, rgba(8, 12, 24, 0.95) 100%) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 20px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scada-glass-card:hover {
          border-color: rgba(6, 182, 212, 0.3) !important;
          box-shadow: 0 12px 40px 0 rgba(6, 182, 212, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
        }
        .scada-card { background: #0f172a; border-radius: 20px; transition: all 0.3s ease; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.4); }
        .scada-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -4px rgba(0,0,0,0.5); }
        .pulse-dot-green { width: 8px; height: 8px; border-radius: 50px; background-color: #10b981; display: inline-block; box-shadow: 0 0 8px #10b981; animation: pulseGlow 1.8s infinite; }
        .pulse-dot-red { width: 8px; height: 8px; border-radius: 50px; background-color: #ef4444; display: inline-block; box-shadow: 0 0 8px #ef4444; animation: pulseGlow 1.8s infinite; }
        .pulse-dot-grey { width: 8px; height: 8px; border-radius: 50px; background-color: #4b5563; display: inline-block; }
        .phase-indicator-accent { width: 4px; height: 100%; position: absolute; left: 0; top: 0; bottom: 0; }
        .scada-table tbody tr { transition: all 0.2s; cursor: pointer; }
        .scada-table tbody tr:hover { background: rgba(255, 255, 255, 0.03); }
        .fw-black { font-weight: 900 !important; }
        .fs-10 { font-size: 0.72rem !important; }
        .fs-12 { font-size: 0.82rem !important; }
        .fs-13 { font-size: 0.9rem !important; }
        .fs-7 { font-size: 0.95rem !important; }
        .scada-tabs-container {
          display: flex;
          background: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 8px;
          padding: 2px;
        }
        .scada-tab-btn {
          font-size: 0.72rem !important;
          letter-spacing: 0.5px;
          color: #94a3b8 !important;
          border-radius: 6px;
          border: 1px solid transparent !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scada-tab-btn:hover {
          color: #f8fafc !important;
          background: rgba(255, 255, 255, 0.03) !important;
        }
        .scada-tab-btn.active-tab {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1) !important;
        }
        .scada-tab-btn.active-tab.text-info {
          border-left: 2px solid #06b6d4 !important;
          color: #06b6d4 !important;
        }
        .scada-tab-btn.active-tab.text-warning {
          border-left: 2px solid #f59e0b !important;
          color: #f59e0b !important;
        }
        .scada-tab-btn.active-tab.text-success {
          border-left: 2px solid #10b981 !important;
          color: #10b981 !important;
        }

        /* Oscilloscope Live Telemetry Backdrop */
        .telemetry-wave-visualizer {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.15;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }
        .hud-wave-svg {
          width: 100%;
          height: 100%;
        }
        .wave-line-1 {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawWave 12s linear infinite;
        }
        .wave-line-2 {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawWave 16s linear infinite reverse;
        }
        .wave-line-3 {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawWave 20s linear infinite;
        }
        @keyframes drawWave {
          to { stroke-dashoffset: 0; }
        }
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        /* Floating Laboratory HUD Panel */
        .hud-panel {
          display: flex;
          flex-direction: column;
          width: 145px;
          gap: 14px;
          z-index: 10;
        }
        .hud-metric {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 10px 12px;
          transition: all 0.3s;
          text-align: left;
        }
        .hud-metric:hover {
          background: rgba(6, 182, 212, 0.06);
          border-color: rgba(6, 182, 212, 0.2);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.1);
        }
        .hud-label {
          font-size: 0.6rem;
          color: #64748b;
          font-weight: 700;
          display: block;
          margin-bottom: 4px;
          letter-spacing: 0.8px;
        }
        .hud-value {
          font-size: 0.85rem;
          font-weight: bold;
        }
        .hud-metric-horizontal {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 10px;
          padding: 7px 10px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: center;
          flex: 1 1 calc(33.3% - 10px);
          min-width: 105px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .hud-metric-horizontal:hover {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0.02) 100%) !important;
          border-color: rgba(6, 182, 212, 0.3) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .hud-metric-horizontal .hud-label {
          font-size: 0.58rem;
          color: #94a3b8;
          font-weight: 800;
          display: block;
          margin-bottom: 2px;
          letter-spacing: 0.8px;
        }
        .hud-metric-horizontal .hud-value {
          font-size: 0.72rem;
          font-weight: 800;
          display: block;
        }

        /* Horizontal Phase Gauges styling */
        .phase-bar-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 5px;
          overflow: hidden;
          width: 100%;
          margin-top: 5px;
        }
        .phase-bar-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .shadow-glow-red {
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.7);
        }
        .shadow-glow-yellow {
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.7);
        }
        .shadow-glow-blue {
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.7);
        }

        /* Parameter Glass Cards styling */
        .scada-section-box {
          background: rgba(0, 0, 0, 0.22) !important;
          border: 1px solid rgba(255, 255, 255, 0.04) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.25);
        }
        .parameter-glass-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 14px !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1) !important;
          position: relative;
        }
        .parameter-glass-card:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
          transform: translateY(-4px) scale(1.025);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .important-glow-card {
          border-color: rgba(245, 158, 11, 0.3) !important;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.05);
        }
        .important-glow-card:hover {
          border-color: rgba(245, 158, 11, 0.6) !important;
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.15) !important;
        }
        .text-orange {
          color: #f97316 !important;
        }

        /* MFM DIGITAL TWIN PREMIUM STYLING */
        .mfm-polycarbonate-case {
          width: 100%;
          max-width: 440px;
          background: linear-gradient(135deg, #2d3548 0%, #151a24 100%);
          border: 10px solid #3d4659;
          border-radius: 28px;
          padding: 24px 20px;
          position: relative;
          box-shadow: inset 0 0 30px rgba(255,255,255,0.06), 
                      0 20px 45px rgba(0,0,0,0.85),
                      0 0 0 1px rgba(0,0,0,0.45),
                      0 0 35px rgba(6, 182, 212, 0.35);
          overflow: visible;
        }

        /* Bezel Corner Hex Screws */
        .mfm-polycarbonate-case .screw {
          width: 16px;
          height: 16px;
          background: radial-gradient(circle, #8a95a5 30%, #3e4856 80%);
          border-radius: 50%;
          position: absolute;
          box-shadow: 1px 1px 3px rgba(0,0,0,0.6);
          border: 1px solid #1a222e;
        }
        .mfm-polycarbonate-case .screw::after {
          content: '';
          position: absolute;
          top: 6px;
          left: 2px;
          width: 11px;
          height: 2px;
          background: #11151c;
          transform: rotate(45deg);
        }
        .mfm-polycarbonate-case .screw.top-left { top: 14px; left: 14px; }
        .mfm-polycarbonate-case .screw.top-right { top: 14px; right: 14px; }
        .mfm-polycarbonate-case .screw.bottom-left { bottom: 14px; left: 14px; }
        .mfm-polycarbonate-case .screw.bottom-right { bottom: 14px; right: 14px; }

        .mfm-metallic-bezel {
          background: linear-gradient(145deg, #1f2533 0%, #0d1017 100%);
          border-radius: 20px;
          padding: 20px 16px;
          border: 2px solid rgba(255,255,255,0.04);
          box-shadow: inset 0 0 25px rgba(0,0,0,0.75);
          position: relative;
        }

        .mfm-brand-header {
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 8px;
          margin-bottom: 12px !important;
        }
        .mfm-brand-logo {
          font-size: 1.4rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 3px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.6);
        }
        .mfm-model-no {
          font-size: 0.75rem;
          color: #38bdf8;
          font-weight: bold;
          letter-spacing: 1px;
          background: rgba(56, 189, 248, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid rgba(56, 189, 248, 0.2);
        }

        /* Premium LCD Window */
        .mfm-lcd-window {
          background: #0f131a;
          border: 6px solid #222936;
          border-radius: 14px;
          padding: 12px;
          position: relative;
          box-shadow: inset 0 4px 15px rgba(0,0,0,0.9);
        }
        .mfm-lcd-glass {
          background: #022c22;
          border-radius: 8px;
          padding: 8px;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.98);
          position: relative;
        }
        .mfm-lcd-glass.unconfigured-lcd-glass {
          background: #070c18 !important;
          box-shadow: inset 0 0 25px rgba(0,0,0,0.98) !important;
        }
        .mfm-lcd-screen {
          background: #052e16;
          background-image: radial-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px);
          background-size: 3px 3px;
          border-radius: 6px;
          padding: 12px 10px;
          height: 280px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 0 25px rgba(16,185,129,0.3);
          position: relative;
          overflow: hidden;
        }
        .mfm-lcd-screen.unconfigured-lcd-screen {
          background: #080d19 !important;
          background-image: radial-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px) !important;
          box-shadow: inset 0 0 35px rgba(0,0,0,0.85), 0 0 15px rgba(56, 189, 248, 0.04) !important;
        }
        .mfm-lcd-screen:not(.unconfigured-lcd-screen)::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%);
          pointer-events: none;
          z-index: 2;
        }

        .mfm-lcd-top-bar {
          font-size: 0.8rem;
          color: #10b981;
          font-weight: 800;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(16, 185, 129, 0.2);
          padding-bottom: 5px;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        .mfm-lcd-page-num {
          background: rgba(16, 185, 129, 0.15);
          padding: 1px 6px;
          border-radius: 3px;
        }

        .mfm-lcd-grid {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }
        .mfm-lcd-row {
          font-size: 1.3rem;
          font-weight: 700;
          color: #10b981;
          text-shadow: 0 0 4px rgba(16, 185, 129, 0.8);
          line-height: 1.3;
          display: flex;
          align-items: center;
        }
        .mfm-lcd-label {
          width: 42px;
          color: #10b981;
          font-size: 1.05rem;
          font-weight: 900;
          opacity: 0.75;
        }
        .mfm-lcd-value {
          font-size: 1.85rem;
          color: #34d399;
          letter-spacing: 1px;
          font-family: 'Consolas', 'Courier New', Courier, monospace !important;
        }
        .mfm-lcd-unit {
          font-size: 0.95rem;
          color: #10b981;
          opacity: 0.8;
          width: 48px;
        }

        .mfm-lcd-bottom-bar {
          font-size: 0.65rem;
          color: #10b981;
          opacity: 0.7;
          border-top: 1px solid rgba(16, 185, 129, 0.2);
          padding-top: 6px;
          margin-top: 6px;
          letter-spacing: 0.5px;
        }

        /* LED bulbs under display */
        .mfm-bezel-bottom {
          margin-top: 14px;
        }
        .mfm-leds-rack {
          display: flex;
          gap: 16px;
        }
        .mfm-led-group {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .mfm-led-bulb {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background-color: #1a2234;
          border: 1px solid #0f172a;
          box-shadow: inset 1px 1px 2px rgba(0,0,0,0.8);
          transition: all 0.15s ease;
        }
        .mfm-led-bulb.bulb-red {
          background-color: #2b1414;
        }
        .mfm-led-bulb.bulb-red.glow-active {
          background-color: #ef4444;
          box-shadow: 0 0 12px #ef4444, inset 0 0 2px white;
        }
        .mfm-led-bulb.bulb-green {
          background-color: #12281a;
        }
        .mfm-led-bulb.bulb-green.glow-active {
          background-color: #22c55e;
          box-shadow: 0 0 12px #22c55e, inset 0 0 2px white;
        }
        .mfm-led-bulb.bulb-orange {
          background-color: #2e1e12;
        }
        .mfm-led-bulb.bulb-orange.glow-active {
          background-color: #f59e0b;
          box-shadow: 0 0 12px #f59e0b, inset 0 0 2px white;
        }
        .mfm-led-label {
          font-size: 0.6rem;
          color: #94a3b8;
          margin-top: 4px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }

        .mfm-spec-labels {
          font-size: 0.65rem;
          line-height: 1.4;
          opacity: 0.65;
        }

        /* Glossy industrial rounded navigation buttons */
        .mfm-button-deck {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 16px;
        }
        .mfm-tactile-btn {
          flex: 1;
          height: 40px;
          background: linear-gradient(180deg, #374151 0%, #1f2937 100%);
          border: 1px solid #111827;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.55), 
                      inset 0 1px 2px rgba(255,255,255,0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.1s ease;
        }
        .mfm-tactile-btn:hover {
          background: linear-gradient(180deg, #4b5563 0%, #374151 100%);
          border-color: #1f2937;
        }
        .mfm-tactile-btn:active {
          transform: translateY(1.5px);
          box-shadow: 0 1px 3px rgba(0,0,0,0.6), 
                      inset 0 1px 4px rgba(0,0,0,0.6);
          background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
        }
        .mfm-tactile-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
          transform: none !important;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
        }
        .mfm-tactile-btn .btn-glyph {
          color: #e5e7eb;
          font-size: 1.0rem;
          font-weight: 800;
          text-shadow: 0 -1px 1px rgba(0,0,0,0.7);
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; filter: brightness(1.2); }
        }

        @media (max-width: 375px) {
          .mfm-polycarbonate-case {
            padding: 10px !important;
            border-width: 4px !important;
            border-radius: 16px !important;
          }
          .mfm-metallic-bezel {
            padding: 10px 8px !important;
            border-radius: 12px !important;
          }
          .mfm-lcd-window {
            border-width: 3px !important;
            border-radius: 8px !important;
            padding: 6px !important;
          }
          .mfm-lcd-screen {
            height: 140px !important;
            padding: 4px 2px !important;
          }
          .mfm-lcd-value {
            font-size: 1.0rem !important;
          }
          .mfm-lcd-label {
            font-size: 0.65rem !important;
          }
          .mfm-lcd-unit {
            font-size: 0.6rem !important;
            width: 24px !important;
          }
        }

        .scada-gauge-card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.025) 0%, rgba(0, 0, 0, 0.12) 100%);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .scada-gauge-card:hover {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.08) 100%);
          border-color: rgba(6, 182, 212, 0.25);
          transform: translateY(-4px) scale(1.03);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* Main meter workspace: calm industrial surfaces with high telemetry legibility. */
        .main-meter-workspace { --meter-surface: #091221; --meter-panel: #0d1829; --meter-line: rgba(148, 163, 184, .16); }
        .main-meter-workspace .scada-glass-card { border-radius: 12px; background: linear-gradient(145deg, rgba(10, 20, 37, .98), rgba(5, 11, 22, .98)) !important; border-color: var(--meter-line) !important; box-shadow: 0 14px 34px rgba(2, 8, 23, .30), inset 0 1px 0 rgba(255,255,255,.035); }
        .main-meter-workspace .scada-glass-card:hover { transform: translateY(-2px); border-color: rgba(34, 211, 238, .34) !important; box-shadow: 0 18px 38px rgba(2, 8, 23, .38), 0 0 0 1px rgba(34,211,238,.05); }
        .main-meter-workspace .scada-section-box { border-radius: 10px !important; background: rgba(2, 8, 20, .54) !important; border-color: rgba(148,163,184,.12) !important; box-shadow: none; }
        .main-meter-workspace .scada-section-box > h6 { font-size: .70rem !important; letter-spacing: .08em; }
        .main-meter-workspace .scada-tabs-container { border-radius: 7px !important; padding: 3px !important; }
        .main-meter-workspace .scada-tab-btn { letter-spacing: 0; font-size: .68rem !important; min-height: 30px; }
        .main-meter-workspace .scada-tab-btn.active-tab { background: rgba(34, 211, 238, .13); box-shadow: inset 2px 0 0 #22d3ee; }
        .main-meter-workspace .parameter-glass-card { min-height: 68px; border-radius: 8px !important; background: linear-gradient(150deg, rgba(21, 33, 52, .86), rgba(10, 17, 29, .92)) !important; border-color: rgba(148,163,184,.13) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.035); }
        .main-meter-workspace .parameter-glass-card:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(0,0,0,.20), inset 0 1px 0 rgba(255,255,255,.06); }
        .main-meter-workspace .parameter-glass-card h5 { letter-spacing: 0 !important; font-size: 1rem !important; }
        .main-meter-workspace .hud-metric-horizontal { border-radius: 7px; box-shadow: none; }
        .main-meter-workspace .telemetry-wave-visualizer { opacity: .72; }
        .main-meter-workspace .mfm-polycarbonate-case { box-shadow: inset 0 0 30px rgba(255,255,255,.06), 0 20px 42px rgba(0,0,0,.60), 0 0 26px rgba(34,211,238,.18); }

        /* Clean, executive Light Mode theme overrides */
        body.light-mode .main-meter-workspace,
        [data-theme="light"] .main-meter-workspace {
          --meter-surface: #f8fafc;
          --meter-panel: #ffffff;
          --meter-line: #e2e8f0;
          background: #f1f5f9;
          padding: 8px;
          border-radius: 16px;
        }

        body.light-mode .main-meter-workspace .scada-glass-card,
        [data-theme="light"] .main-meter-workspace .scada-glass-card {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03) !important;
        }

        body.light-mode .main-meter-workspace .scada-glass-card:hover,
        [data-theme="light"] .main-meter-workspace .scada-glass-card:hover {
          border-color: #cbd5e1 !important;
          box-shadow: 0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04) !important;
        }

        body.light-mode .main-meter-workspace .scada-section-box,
        [data-theme="light"] .main-meter-workspace .scada-section-box {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
        }

        body.light-mode .main-meter-workspace .scada-section-box .bg-dark,
        [data-theme="light"] .main-meter-workspace .scada-section-box .bg-dark {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
        }

        body.light-mode .main-meter-workspace .scada-section-box > h6,
        [data-theme="light"] .main-meter-workspace .scada-section-box > h6 {
          color: #0284c7 !important;
        }

        body.light-mode .main-meter-workspace .scada-tabs-container,
        [data-theme="light"] .main-meter-workspace .scada-tabs-container {
          background: #f1f5f9 !important;
          border: 1px solid #e2e8f0 !important;
        }

        body.light-mode .main-meter-workspace .scada-tab-btn,
        [data-theme="light"] .main-meter-workspace .scada-tab-btn {
          color: #64748b !important;
        }

        body.light-mode .main-meter-workspace .scada-tab-btn.active-tab,
        [data-theme="light"] .main-meter-workspace .scada-tab-btn.active-tab {
          background: #ffffff !important;
          color: #0891b2 !important;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08) !important;
        }

        body.light-mode .main-meter-workspace .scada-gauge-card,
        [data-theme="light"] .main-meter-workspace .scada-gauge-card {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04) !important;
        }

        body.light-mode .main-meter-workspace .scada-gauge-card:hover,
        [data-theme="light"] .main-meter-workspace .scada-gauge-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 20px -3px rgba(15, 23, 42, 0.1) !important;
          border-color: #cbd5e1 !important;
        }

        body.light-mode .main-meter-workspace .parameter-glass-card,
        [data-theme="light"] .main-meter-workspace .parameter-glass-card {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04) !important;
        }

        body.light-mode .main-meter-workspace .parameter-glass-card:hover,
        [data-theme="light"] .main-meter-workspace .parameter-glass-card:hover {
          background: #ffffff !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.08) !important;
        }

        body.light-mode .main-meter-workspace .parameter-glass-card small,
        [data-theme="light"] .main-meter-workspace .parameter-glass-card small {
          color: #64748b !important;
          font-weight: 700 !important;
        }

        body.light-mode .main-meter-workspace .parameter-glass-card h5.text-white,
        [data-theme="light"] .main-meter-workspace .parameter-glass-card h5.text-white {
          color: #0f172a !important;
        }

        body.light-mode .main-meter-workspace .hud-metric-horizontal,
        [data-theme="light"] .main-meter-workspace .hud-metric-horizontal {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
        }

        body.light-mode .main-meter-workspace .hud-metric-horizontal .hud-label,
        [data-theme="light"] .main-meter-workspace .hud-meter-workspace .hud-label {
          color: #64748b !important;
        }

        body.light-mode .main-meter-workspace .telemetry-wave-visualizer,
        [data-theme="light"] .main-meter-workspace .telemetry-wave-visualizer {
          opacity: 0.18 !important;
        }

        body.light-mode .main-meter-workspace .mfm-polycarbonate-case,
        [data-theme="light"] .main-meter-workspace .mfm-polycarbonate-case {
          box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.1) !important;
        }

        @media (max-width: 991px) { .main-meter-workspace .parameter-glass-card { min-height: 62px; }.main-meter-workspace .scada-tabs-container { width: 100%; overflow-x: auto; flex-wrap: nowrap; }.main-meter-workspace .scada-tab-btn { white-space: nowrap; flex: 1 0 auto; } }
        @keyframes gaugeAlertPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.2); }
          50% { box-shadow: 0 0 24px rgba(239, 68, 68, 0.45), 0 0 48px rgba(239, 68, 68, 0.15); }
        }
        .gauge-alert-pulse {
          animation: gaugeAlertPulse 2s ease-in-out infinite;
        }
        @keyframes gaugeWarningPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(245, 158, 11, 0.15); }
          50% { box-shadow: 0 0 18px rgba(245, 158, 11, 0.35); }
        }
      `}} />
    </div>
  );
};

export default function MainMeterWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <MainMeter />
    </ErrorBoundary>
  );
}

