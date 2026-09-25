import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Card, Badge, Table, Tab, Tabs, Modal, Button, Form, Spinner } from 'react-bootstrap';
import {
  Zap,
  Activity,
  Cpu,
  ShieldCheck,
  RefreshCcw,
  Settings2,
  Plus,
  Trash2,
  FolderTree,
  CheckCircle2,
  Check,
  Clock,
  Radio,
  Layers,
  AlertCircle
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PdfButton from '../../components/PdfButton';
import PageContextBanner from '../../components/PageContextBanner';
import { useSiteStore } from '../../context/SiteContext';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
import { useLocation } from 'react-router-dom';
import { getAuthHeaders, normalizeList } from '../../services/apiClient';
import { bmsService } from '../../services/bmsService';
import { getApiUrl } from '../../utils/apiConfig';
import './MFMMeter.css';

import {
  PARAMETER_SYNONYMS,
  getValueForField,
  formatNumber,
  mapLatestEventsToTelemetry
} from './utils/energyTelemetry';
import EnergyMetricCard from './components/EnergyMetricCard';
import { resolveDeviceTelemetry } from './utils/energyTelemetryAdapter';
import {
  useMeterGroups,
  normalizeMeterGroups,
  createGroupId,
  GROUP_COLORS,
  GROUP_EVENT_NAME
} from './hooks/useMeterGroups';

const FIELD_LABELS = {
  ebKvah: { label: 'EB KVAH', unit: 'kVAh' },
  ebKwh: { label: 'EB KWH', unit: 'kWh' },
  balance: { label: 'Balance', unit: 'Rs' },
  totalKw: { label: 'Total KW', unit: 'kW' },
  vR: { label: 'Voltage-R', unit: 'V' },
  vY: { label: 'Voltage-Y', unit: 'V' },
  vB: { label: 'Voltage-B', unit: 'V' },
  iR: { label: 'R-Current', unit: 'A' },
  iY: { label: 'Y-Current', unit: 'A' },
  iB: { label: 'B-Current', unit: 'A' },
  pf: { label: 'Power Factor', unit: '' },
  totalKva: { label: 'Total KVA', unit: 'kVA' },
  dgKwh: { label: 'DG KWH', unit: 'kWh' },
  freq: { label: 'Frequency', unit: 'Hz' },
  lowBalanceCut: { label: 'Low Balance Cut', unit: '' },
  overloadTrip: { label: 'Overload Trip', unit: '' },
  overloadLimitReached: { label: 'Overload Limit Reached', unit: '' },
  connectedStatus: { label: 'Connected Status', unit: '' },
  forceOff: { label: 'Force Off', unit: '' },
  meterSrno: { label: 'Meter Serial No', unit: '' },
  noOfOverloadCheck: { label: 'No of Overload Check', unit: '' },
  ebDgStatus: { label: 'EB/DG Status', unit: '' },
  ebTariff: { label: 'EB Tariff', unit: 'Rs' },
  dgTariff: { label: 'DG Tariff', unit: 'Rs' },
  ebRLoadSet: { label: 'EB R Load Set', unit: 'kW' },
  ebYLoadSet: { label: 'EB Y Load Set', unit: 'kW' },
  ebBLoadSet: { label: 'EB B Load Set', unit: 'kW' },
  dgRLoadSet: { label: 'DG R Load Set', unit: 'kW' },
  dgYLoadSet: { label: 'DG Y Load Set', unit: 'kW' },
  dgBLoadSet: { label: 'DG B Load Set', unit: 'kW' },
  activePower: { label: 'Active Power', unit: 'kW' },
  reactivePower: { label: 'Reactive Power', unit: 'kVAr' },
  apparentPower: { label: 'Apparent Power', unit: 'kVA' },
  cumulativekWh: { label: 'Cumulative KWH', unit: 'kWh' },
  commStatus: { label: 'Comm Status', unit: '' },
  vLLAvg: { label: 'AVG VOLTAGE L-L', unit: 'V' },
  vLNAvg: { label: 'AVG VOLTAGE L-N', unit: 'V' },
  iAvg: { label: 'AVG CURRENT', unit: 'A' },
  kvaAvg: { label: 'POWER KVA (AVG)', unit: 'kVA' },
  kvarAvg: { label: 'POWER KVAR (AVG)', unit: 'kVAR' },
  pfAvg: { label: 'AVG PF', unit: '' },
  vRY: { label: 'VOLTAGE R-Y', unit: 'V' },
  vYB: { label: 'VOLTAGE Y-B', unit: 'V' },
  vBR: { label: 'VOLTAGE B-R', unit: 'V' },
  pfR: { label: 'PF-R', unit: '' },
  pfY: { label: 'PF-Y', unit: '' },
  pfB: { label: 'PF-B', unit: '' },
  loadHrs: { label: 'LOAD HRS', unit: 'h' },
  loadMin: { label: 'LOAD MIN', unit: 'm' },
  noLoadHrs: { label: 'NO LOAD HRS', unit: 'h' },
  noLoadMin: { label: 'NO LOAD MIN', unit: 'm' },
  loadPct: { label: 'LOAD %', unit: '%' },
};

const MiniMFMMeter = ({ meter, isMapped = true, isOnline, onClick }) => {
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPage(p => (p + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const getPageData = () => {
    const tv = meter.telemetryValues || {};
    const parseNum = (v) => {
      if (v === null || v === undefined) return 0;
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    };
    const hasTelemetry = Object.keys(tv).length > 0;
    const showActive = isOnline || hasTelemetry;
    switch (page) {
      case 0:
        return {
          title: "PHASE-NEUTRAL VOLTAGE",
          pageCode: "P01",
          lines: [
            { label: "Ua", value: showActive ? parseNum(tv.vR ?? meter.vR ?? meter.voltage).toFixed(1) : "—", unit: "V" },
            { label: "Ub", value: showActive ? parseNum(tv.vY ?? meter.vY).toFixed(1) : "—", unit: "V" },
            { label: "Uc", value: showActive ? parseNum(tv.vB ?? meter.vB).toFixed(1) : "—", unit: "V" },
            { label: "F", value: showActive ? parseNum(tv.freq ?? meter.freq ?? 50.0).toFixed(3) : "—", unit: "Hz" },
          ]
        };
      case 1:
        return {
          title: "LINE CURRENTS",
          pageCode: "P02",
          lines: [
            { label: "Ia", value: showActive ? parseNum(tv.iR ?? meter.iR ?? meter.current).toFixed(1) : "—", unit: "A" },
            { label: "Ib", value: showActive ? parseNum(tv.iY ?? meter.iY).toFixed(1) : "—", unit: "A" },
            { label: "Ic", value: showActive ? parseNum(tv.iB ?? meter.iB).toFixed(1) : "—", unit: "A" },
            { label: "IN", value: showActive ? "0.0" : "—", unit: "A" },
          ]
        };
      case 2:
      default:
        return {
          title: "SYSTEM POWER",
          pageCode: "P03",
          lines: [
            { label: "kW", value: showActive ? parseNum(tv.activePower ?? tv.totalKw ?? meter.activePower ?? meter.load).toFixed(1) : "—", unit: "kW" },
            { label: "kVAr", value: showActive ? parseNum(tv.reactivePower ?? meter.reactivePower).toFixed(1) : "—", unit: "kVAr" },
            { label: "kVA", value: showActive ? parseNum(tv.apparentPower ?? tv.totalKva ?? meter.apparentPower).toFixed(1) : "—", unit: "kVA" },
            { label: "PF", value: showActive ? parseNum(tv.pf ?? meter.pf).toFixed(3) : "—", unit: "" },
          ]
        };
    }
  };

  const pageData = getPageData();
  const hasTelemetry = Object.keys(meter.telemetryValues || {}).length > 0;
  const showActive = isOnline || hasTelemetry;

  return (
    <div className="w-100 d-flex flex-column align-items-center scada-meter-wrapper" onClick={onClick} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
      <div className="mb-2 text-center" style={{ minHeight: '36px' }}>
        <h6 className="fw-bold text-white mb-0" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>{meter.label}</h6>
        <Badge bg="secondary" className="bg-opacity-10 border border-secondary border-opacity-10 px-2 py-0 fs-12 uppercase text-muted" style={{ fontSize: '0.6rem' }}>{meter.type}</Badge>
      </div>
      <div className="mfm-polycarbonate-case shadow-2xl mx-auto" style={{ maxWidth: '270px', padding: '14px 10px', borderWidth: '8px', borderRadius: '24px' }}>
        {/* Bezel Screws */}
        <div className="screw top-left" style={{ top: '6px', left: '6px', width: '10px', height: '10px' }}></div>
        <div className="screw top-right" style={{ top: '6px', right: '6px', width: '10px', height: '10px' }}></div>
        <div className="screw bottom-left" style={{ bottom: '6px', left: '6px', width: '10px', height: '10px' }}></div>
        <div className="screw bottom-right" style={{ bottom: '6px', right: '6px', width: '10px', height: '10px' }}></div>

        <div className="mfm-metallic-bezel" style={{ padding: '12px 10px', borderRadius: '12px' }}>
          {/* Brand Header */}
          <div className="mfm-brand-header d-flex justify-content-between align-items-center mb-2 px-1">
            <span className="mfm-brand-logo" style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>SOCHIOT</span>
            <span className="mfm-model-no" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>APM Series</span>
          </div>

          {/* Grid LCD Screen Window */}
          <div className="mfm-lcd-window" style={{ padding: '6px', borderWidth: '4px', borderRadius: '8px', opacity: showActive ? 1 : 0.6 }}>
            <div className="mfm-lcd-screen" style={{ height: '185px', padding: '6px' }}>
              <div className="lcd-grid-overlay"></div>

              {/* Screen Header */}
              <div className="d-flex justify-content-between align-items-start mb-2 border-bottom border-success border-opacity-25 pb-1">
                <span className="text-success fw-bold opacity-75" style={{ fontSize: '0.6rem' }}>{pageData.title}</span>
                <span className="bg-success bg-opacity-25 text-success px-1 rounded" style={{ fontSize: '0.6rem' }}>{pageData.pageCode}</span>
              </div>

              {/* Display Lines */}
              <div className="d-flex flex-column gap-1 flex-grow-1 justify-content-center">
                {pageData.lines.map((line, idx) => (
                  <div key={idx} className="d-flex justify-content-between align-items-end">
                    <span className="text-success fw-bold opacity-75" style={{ fontSize: '0.8rem', width: '30px' }}>{line.label}</span>
                    <div className="d-flex align-items-baseline gap-1">
                      <span className="text-success fw-bold" style={{ fontSize: '1.4rem', letterSpacing: '1px', fontFamily: 'monospace' }}>{line.value}</span>
                      <span className="text-success opacity-75" style={{ fontSize: '0.7rem', width: '30px' }}>{line.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Nav Bar */}
              <div className="d-flex justify-content-between mt-auto pt-1 border-top border-success border-opacity-25 text-success opacity-75" style={{ fontSize: '0.55rem' }}>
                <span>&lt;Up</span>
                <span>&gt;Down</span>
                <span>^Menu</span>
                <span>vEvnt</span>
              </div>
            </div>
          </div>

          {/* LED Indicators and Specs */}
          <div className="mfm-led-panel d-flex justify-content-between align-items-center mt-2 px-1">
            <div className="d-flex gap-2">
              <div className="d-flex flex-column align-items-center">
                <div className="mfm-led-bulb bulb-blue" style={{ width: '8px', height: '8px' }}></div>
                <span className="mfm-led-label" style={{ fontSize: '0.5rem', marginTop: '2px' }}>CAL</span>
              </div>
              <div className="d-flex flex-column align-items-center">
                <div className={`mfm-led-bulb bulb-green ${isOnline ? 'glow-active pulse-dot-green' : ''}`} style={{ width: '8px', height: '8px', animation: isOnline ? 'pulseGlow 1.8s infinite' : 'none' }}></div>
                <span className="mfm-led-label" style={{ fontSize: '0.5rem', marginTop: '2px' }}>COM</span>
              </div>
              <div className="d-flex flex-column align-items-center">
                <div className={`mfm-led-bulb bulb-orange ${meter.status === 'Warning' ? 'glow-active' : ''}`} style={{ width: '8px', height: '8px' }}></div>
                <span className="mfm-led-label" style={{ fontSize: '0.5rem', marginTop: '2px' }}>ALM</span>
              </div>
            </div>

            <div className="mfm-spec-labels text-end" style={{ fontSize: '0.55rem' }}>
              <div className="text-white fw-bold">{meter.telemetryValues?.meterSrno || meter.id}</div>
              <div>50.0Hz • SOCHIOT</div>
            </div>
          </div>

          {/* Hardware Nav Buttons */}
          <div className="mfm-button-deck d-flex gap-1 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              className="mfm-tactile-btn flex-fill"
              style={{ height: '28px', borderRadius: '4px' }}
              onClick={(e) => {
                e.stopPropagation();
                setPage(p => (p - 1 + 3) % 3);
              }}
              title="Page Up (<)"
            >
              <span className="btn-glyph text-white fw-bold" style={{ fontSize: '0.7rem' }}>&lt;</span>
            </button>
            <button
              className="mfm-tactile-btn flex-fill"
              style={{ height: '28px', borderRadius: '4px' }}
              onClick={(e) => {
                e.stopPropagation();
                setPage(p => (p + 1) % 3);
              }}
              title="Page Down (>)"
            >
              <span className="btn-glyph text-white fw-bold" style={{ fontSize: '0.7rem' }}>&gt;</span>
            </button>
            <button
              className="mfm-tactile-btn flex-fill"
              style={{ height: '28px', borderRadius: '4px' }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              title="Menu"
            >
              <span className="btn-glyph text-white fw-bold" style={{ fontSize: '0.7rem' }}>⚙</span>
            </button>
            <button
              className="mfm-tactile-btn flex-fill"
              style={{ height: '28px', borderRadius: '4px' }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              title="Enter"
            >
              <span className="btn-glyph text-white fw-bold" style={{ fontSize: '0.7rem' }}>⏎</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubMeters = () => {
  const location = useLocation();
  const { getOverallStatus, refreshStatuses } = useDeviceStatus();
  const { sites, selectedSite, setSelectedSite } = useSiteStore();

  // Sites fetched from sites route (GET /api/v1/sites)
  const [routeSites, setRouteSites] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('scada_sites_db') || '[]');
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    return [];
  });
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    return localStorage.getItem('selected_sub_meter_site_id') || localStorage.getItem('selected_main_meter_site_id') || '';
  });

  // Devices state fetched with siteId and category=SUB_ENERGY_METER
  const [siteDevices, setSiteDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [isBatchFetching, setIsBatchFetching] = useState(false);
  const [lastBatchTime, setLastBatchTime] = useState(null);

  const [selectedMeter, setSelectedMeter] = useState(null);
  const [meters, setMeters] = useState([]);
  const [showGroupingSettings, setShowGroupingSettings] = useState(false);
  const [meterGroups, setMeterGroups] = useState([]);
  const [groupSaveStatus, setGroupSaveStatus] = useState(null);
  const [showSaveSuccessPopup, setShowSaveSuccessPopup] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('Group created successfully');
  const groupsHydratedRef = useRef(false);
  const TELEMETRY_FRESHNESS_MS = 24 * 60 * 60 * 1000;

  // Fetch sites as per OpenAPI spec (GET /sites)
  useEffect(() => {
    let isMounted = true;
    const fetchSitesFromRoute = async () => {
      try {
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
        console.warn('bmsService.getSites notice in SubMeters:', err);
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
        console.warn('Could not fetch sites from route in SubMeters:', err);
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
        localStorage.setItem('selected_sub_meter_site_id', firstId);
        if (setSelectedSite) setSelectedSite(allSites[0]);
      } else {
        if (setSelectedSite && selectedSite?.id !== match.id) setSelectedSite(match);
      }
    }
  }, [allSites, selectedSiteId, setSelectedSite, selectedSite]);

  // Fetch all devices for the selected site using category SUB_ENERGY_METER:
  // GET /api/v1/devices?siteId={siteId}&category=SUB_ENERGY_METER&include=settings,rules,profile
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDevices([]);
      setMeters([]);
      return;
    }

    let isMounted = true;
    const fetchSubEnergyMeters = async () => {
      setDevicesLoading(true);
      try {
        const queryParams = new URLSearchParams({
          siteId: String(selectedSiteId),
          category: 'SUB_ENERGY_METER',
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

        // Fallback: If 0 items with SUB_ENERGY_METER, check if devices were registered as ENERGY_METER
        if (items.length === 0) {
          try {
            const fbUrl = getApiUrl(`/devices?siteId=${selectedSiteId}&category=ENERGY_METER&include=settings,rules,profile`);
            const fbRes = await fetch(fbUrl, { headers: getAuthHeaders() });
            if (fbRes.ok) {
              const fbJson = await fbRes.json();
              const fbItems = Array.isArray(fbJson?.data) ? fbJson.data : (Array.isArray(fbJson) ? fbJson : []);
              if (fbItems.length > 0) {
                items = fbItems.filter(d => d.category !== 'MAIN_ENERGY_METER');
              }
            }
          } catch (e) {}
        }

        if (isMounted) {
          setSiteDevices(items);
        }
      } catch (err) {
        console.warn('Error fetching sub energy meters:', err);
        if (isMounted) {
          setSiteDevices([]);
        }
      } finally {
        if (isMounted) setDevicesLoading(false);
      }
    };

    fetchSubEnergyMeters();
    return () => { isMounted = false; };
  }, [selectedSiteId]);

  // Synchronize siteDevices into the meters state model
  useEffect(() => {
    if (!siteDevices || siteDevices.length === 0) {
      setMeters([]);
      return;
    }

    setMeters(prev => {
      return siteDevices.map((dev, idx) => {
        // Use ?? so numeric id=0 isn't treated as falsy
        const rawId = dev.id ?? dev.deviceId;
        const devId = (rawId !== undefined && rawId !== null) ? String(rawId) : `SM-${idx + 1}`;
        const bmsDevId = dev.bmsDeviceId ?? dev.deviceId ?? rawId;
        const bmsDevIdStr = (bmsDevId !== undefined && bmsDevId !== null) ? String(bmsDevId) : devId;
        const label = dev.name || dev.deviceName || dev.title || dev.hardwareId || `Sub-Meter ${dev.id}`;
        const mappingSource = dev.defaultValues || dev.settings?.[0]?.meta || dev.settings || dev.mapping || {};
        const existing = prev.find(m => String(m.id) === devId || String(m.deviceId) === String(dev.deviceId) || String(m.bmsDeviceId) === String(bmsDevId));

        return {
          id: devId,
          deviceId: String(dev.id ?? dev.deviceId ?? ''),
          bmsDeviceId: bmsDevIdStr,
          templateId: devId,
          label: label,
          type: dev.category || 'Sub-Energy Meter',
          siteId: dev.siteId || selectedSiteId,
          status: existing?.status ?? (dev.status || 'Stopped'),
          isActive: dev.isActive,
          lastSeenAt: dev.lastSeenAt,
          mapping: mappingSource,
          device: dev,
          load: existing?.load ?? 0.0,
          voltage: existing?.voltage ?? 0.0,
          current: existing?.current ?? 0.0,
          pf: existing?.pf ?? 0.0,
          freq: existing?.freq ?? 50.0,
          vR: existing?.vR ?? null,
          vY: existing?.vY ?? null,
          vB: existing?.vB ?? null,
          iR: existing?.iR ?? null,
          iY: existing?.iY ?? null,
          iB: existing?.iB ?? null,
          activePower: existing?.activePower ?? null,
          reactivePower: existing?.reactivePower ?? null,
          apparentPower: existing?.apparentPower ?? null,
          telemetryValues: existing?.telemetryValues ?? {},
          lastTelemetryTimestamp: existing?.lastTelemetryTimestamp ?? null,
          moduleEvents: existing?.moduleEvents ?? { change: [], warning: [], read: [] }
        };
      });
    });
  }, [siteDevices, selectedSiteId]);

  // Batch Latest Events Fetching: POST /api/v1/devices/events/latest/batch
  const fetchBatchEvents = async () => {
    if (!siteDevices || siteDevices.length === 0) return;
    const deviceIds = siteDevices
      .map(d => {
        const id = d.bmsDeviceId ?? d.deviceId ?? d.id;
        return (id !== undefined && id !== null) ? String(id) : '';
      })
      .filter(Boolean);

    if (deviceIds.length === 0) return;

    try {
      setIsBatchFetching(true);
      const batchRes = await bmsService.getDeviceEventsLatestBatch(deviceIds);
      const results = batchRes?.data?.results || batchRes?.results || [];

      if (Array.isArray(results) && results.length > 0) {
        setLastBatchTime(Date.now());
        setMeters(prevMeters => {
          return prevMeters.map(meter => {
            const devIdStr = String(meter.id);
            const bmsDevIdStr = String(meter.bmsDeviceId || '');
            const rawDevIdStr = String(meter.deviceId || '');

            const matchResult = results.find(r => {
              // Use ?? so numeric id=0 is preserved as "0" not dropped as falsy
              const rDevId = String(r.deviceId ?? r.bmsDeviceId ?? r.id ?? '');
              const rName = String(r.name || r.deviceName || '').trim().toUpperCase();
              const meterLabel = String(meter.label || '').trim().toUpperCase();
              return (
                rDevId === devIdStr ||
                rDevId === bmsDevIdStr ||
                rDevId === rawDevIdStr ||
                (rName && meterLabel && rName === meterLabel)
              );
            });

            if (!matchResult) return meter;

            const deviceObj = meter.device || meter;
            const resObj = mapLatestEventsToTelemetry(matchResult, deviceObj);
            const updates = resObj.updates;
            const lastEventTime = resObj.lastEventTime;
            const resolvedSettings = resObj.resolvedSettings;
            // Store raw fields so the detail modal can re-resolve with full fidelity
            const rawEventFields = Array.isArray(matchResult.fields) ? matchResult.fields : [];

            if (!updates || Object.keys(updates).length === 0) {
              // Still store raw fields even if updates are empty, so the modal can resolve them
              if (rawEventFields.length > 0) {
                return { ...meter, rawEventFields };
              }
              return meter;
            }

            const telemetryValues = {
              ...(meter.telemetryValues || {}),
              ...updates
            };

            const updatedMeter = {
              ...meter,
              telemetryValues,
              rawEventFields,
              resolvedSettings: resolvedSettings && resolvedSettings.length > 0 ? resolvedSettings : (meter.resolvedSettings || [])
            };

            if (lastEventTime) {
              const tsMs = lastEventTime > 1e12 ? lastEventTime : lastEventTime * 1000;
              updatedMeter.lastTelemetryTimestamp = tsMs;
            } else {
              updatedMeter.lastTelemetryTimestamp = Date.now();
            }

            // Assign phase voltages and currents
            if (telemetryValues.vR !== undefined && telemetryValues.vR !== null) updatedMeter.vR = Number(telemetryValues.vR);
            if (telemetryValues.vY !== undefined && telemetryValues.vY !== null) updatedMeter.vY = Number(telemetryValues.vY);
            if (telemetryValues.vB !== undefined && telemetryValues.vB !== null) updatedMeter.vB = Number(telemetryValues.vB);
            if (telemetryValues.iR !== undefined && telemetryValues.iR !== null) updatedMeter.iR = Number(telemetryValues.iR);
            if (telemetryValues.iY !== undefined && telemetryValues.iY !== null) updatedMeter.iY = Number(telemetryValues.iY);
            if (telemetryValues.iB !== undefined && telemetryValues.iB !== null) updatedMeter.iB = Number(telemetryValues.iB);

            if (telemetryValues.freq !== undefined && telemetryValues.freq !== null) {
              const fNum = Number(telemetryValues.freq);
              if (fNum >= 40 && fNum <= 65) updatedMeter.freq = fNum;
            }

            if (telemetryValues.activePower !== undefined && telemetryValues.activePower !== null) {
              updatedMeter.activePower = Number(telemetryValues.activePower);
            } else if (telemetryValues.totalKw !== undefined && telemetryValues.totalKw !== null) {
              updatedMeter.activePower = Number(telemetryValues.totalKw);
            }

            if (telemetryValues.reactivePower !== undefined && telemetryValues.reactivePower !== null) {
              updatedMeter.reactivePower = Number(telemetryValues.reactivePower);
            }
            if (telemetryValues.apparentPower !== undefined && telemetryValues.apparentPower !== null) {
              updatedMeter.apparentPower = Number(telemetryValues.apparentPower);
            } else if (telemetryValues.totalKva !== undefined && telemetryValues.totalKva !== null) {
              updatedMeter.apparentPower = Number(telemetryValues.totalKva);
            }
            if (telemetryValues.pf !== undefined && telemetryValues.pf !== null) {
              updatedMeter.pf = Number(telemetryValues.pf);
            }

            // Calculate average voltage across phases
            const phaseVoltages = [updatedMeter.vR, updatedMeter.vY, updatedMeter.vB].filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
            if (phaseVoltages.length > 0) {
              updatedMeter.voltage = phaseVoltages.reduce((s, v) => s + v, 0) / phaseVoltages.length;
            } else if (telemetryValues.vLLAvg || telemetryValues.vLNAvg) {
              updatedMeter.voltage = Number(telemetryValues.vLLAvg || telemetryValues.vLNAvg) || 0.0;
            }

            // Calculate average current across phases
            const phaseCurrents = [updatedMeter.iR, updatedMeter.iY, updatedMeter.iB].filter(i => i !== null && i !== undefined && !isNaN(i) && i > 0);
            if (phaseCurrents.length > 0) {
              updatedMeter.current = phaseCurrents.reduce((s, i) => s + i, 0) / phaseCurrents.length;
            } else if (telemetryValues.iAvg) {
              updatedMeter.current = Number(telemetryValues.iAvg) || 0.0;
            }

            // Calculate operational load
            updatedMeter.load = updatedMeter.activePower ?? (telemetryValues.totalKw !== undefined ? Number(telemetryValues.totalKw) : 0.0);
            updatedMeter.status = updatedMeter.load > 0.05 ? 'Running' : 'Stopped';

            // Build moduleEvents for detail view
            const moduleEvents = { change: [], warning: [], read: [] };
            Object.keys(telemetryValues).forEach(k => {
              const meta = FIELD_LABELS[k] || { label: k, unit: '' };
              moduleEvents.change.push({ key: k, label: meta.label, value: telemetryValues[k], unit: meta.unit });
            });
            updatedMeter.moduleEvents = moduleEvents;

            return updatedMeter;
          });
        });
      }
    } catch (err) {
      console.warn('Error fetching sub meters batch latest events:', err);
    } finally {
      setIsBatchFetching(false);
    }
  };

  // Immediate fetch on site / devices change & 30-second interval polling
  useEffect(() => {
    if (!siteDevices || siteDevices.length === 0) return;
    let isMounted = true;

    fetchBatchEvents();
    const interval = setInterval(() => {
      if (isMounted) fetchBatchEvents();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [siteDevices]);

  // Online status checker
  const getMeterOnlineStatus = (meter) => {
    if (!meter) return false;
    let devId = meter.deviceId || meter.id || meter.bmsDeviceId;
    const gatewayUuid = meter.mapping?.gatewayUuid || meter.device?.gatewayUuid;
    if (devId) {
      const isOnline = getOverallStatus(devId, gatewayUuid);
      if (isOnline) return true;
    }
    if (meter.device?.status) {
      const s = String(meter.device.status).toUpperCase();
      if (s === 'ONLINE' || s === 'ACTIVE') return true;
      if (s === 'OFFLINE' || s === 'INACTIVE' || s === 'DISABLED') return false;
    }
    if (meter.device?.lastSeenAt) {
      const lastSeenMs = new Date(meter.device.lastSeenAt).getTime();
      if (Math.abs(Date.now() - lastSeenMs) < 5 * 60 * 1000) return true;
    }

    // Telemetry freshness fallback (within 24 hours)
    const lastTelemetryTs = Number(meter.lastTelemetryTimestamp);
    if (Number.isFinite(lastTelemetryTs) && lastTelemetryTs > 0 && (Date.now() - lastTelemetryTs < TELEMETRY_FRESHNESS_MS)) {
      const hasV = meter.voltage !== undefined && meter.voltage !== null && Number(meter.voltage) > 0;
      const hasI = meter.current !== undefined && meter.current !== null && Number(meter.current) > 0;
      const hasLoad = meter.load !== undefined && meter.load !== null && Number(meter.load) > 0;
      const hasTelemetry = meter.telemetryValues && Object.keys(meter.telemetryValues).length > 0;
      if (hasV || hasI || hasLoad || hasTelemetry) return true;
    }
    return false;
  };

  const getMeterMappedStatus = (meter) => {
    if (!meter) return false;
    if (meter.resolvedSettings && meter.resolvedSettings.length > 0) return true;
    if (meter.telemetryValues && Object.keys(meter.telemetryValues).length > 0) return true;
    if (Array.isArray(meter.device?.settings) && meter.device.settings.length > 0) return true;
    if (Array.isArray(meter.device?.fields) && meter.device.fields.length > 0) return true;
    return Boolean(meter?.mapping && (meter.mapping.deviceId || Object.keys(meter.mapping).length > 0));
  };

  // Group hydration
  useEffect(() => {
    let active = true;

    const hydrateGroups = async () => {
      if (meters.length === 0) {
        if (active) setMeterGroups([]);
        return;
      }

      setMeterGroups(prev => {
        if (!groupsHydratedRef.current) {
          return prev;
        }

        const normalizedCurrent = normalizeMeterGroups(prev, meters);
        const prevSerialized = JSON.stringify(prev);
        const normalizedSerialized = JSON.stringify(normalizedCurrent);
        return prevSerialized === normalizedSerialized ? prev : normalizedCurrent;
      });

      if (!groupsHydratedRef.current) {
        try {
          const { fetchSavedMeterGroups } = await import('./hooks/useMeterGroups');
          const backendGroups = await fetchSavedMeterGroups(meters);
          if (!active) return;
          groupsHydratedRef.current = true;
          setMeterGroups(backendGroups);
        } catch (error) {
          console.error('Failed to load groups from backend:', error);
          if (!active) return;
          groupsHydratedRef.current = true;
          setMeterGroups([]);
          setGroupSaveStatus('Could not load saved groups');
          setTimeout(() => setGroupSaveStatus(null), 3000);
        }
      }
    };

    hydrateGroups();
    return () => {
      active = false;
    };
  }, [meters]);

  useEffect(() => {
    let active = true;
    const syncGroups = async () => {
      try {
        const { fetchSavedMeterGroups } = await import('./hooks/useMeterGroups');
        const groups = await fetchSavedMeterGroups(meters);
        if (active) {
          groupsHydratedRef.current = true;
          setMeterGroups(groups);
        }
      } catch (error) {
        console.error('Failed to sync groups from backend:', error);
      }
    };
    window.addEventListener(GROUP_EVENT_NAME, syncGroups);
    return () => {
      active = false;
      window.removeEventListener(GROUP_EVENT_NAME, syncGroups);
    };
  }, [meters]);

  useEffect(() => {
    if (location.state?.openGroupSettings) {
      setShowGroupingSettings(true);
    }
  }, [location.state]);

  // Derive activeMeter dynamically from meters array so it updates in real-time
  const activeMeter = useMemo(() => {
    if (!selectedMeter) return null;
    return meters.find(m => m.id === selectedMeter.id) || selectedMeter;
  }, [meters, selectedMeter]);

  const assignedMeterIds = useMemo(
    () => new Set(meterGroups.flatMap(group => group.meterIds.map(id => String(id)))),
    [meterGroups]
  );

  const ungroupedMeters = useMemo(
    () => meters.filter(meter => !assignedMeterIds.has(String(meter.templateId ?? meter.id))),
    [meters, assignedMeterIds]
  );

  const getAssignedGroupForMeter = (meterId, currentGroupId = null) => {
    const targetId = String(meterId);
    return meterGroups.find(
      group => group.id !== currentGroupId && group.meterIds.includes(targetId)
    );
  };

  const getGroupMeterOptions = (groupId) =>
    [...meters].sort((left, right) => {
      const leftKey = String(left.templateId ?? left.id);
      const rightKey = String(right.templateId ?? right.id);
      const leftChecked = meterGroups.find(group => group.id === groupId)?.meterIds.includes(leftKey);
      const rightChecked = meterGroups.find(group => group.id === groupId)?.meterIds.includes(rightKey);
      const leftAssignedElsewhere = !!getAssignedGroupForMeter(leftKey, groupId);
      const rightAssignedElsewhere = !!getAssignedGroupForMeter(rightKey, groupId);

      if (leftChecked !== rightChecked) return leftChecked ? -1 : 1;
      if (leftAssignedElsewhere !== rightAssignedElsewhere) return leftAssignedElsewhere ? 1 : -1;
      return String(left.label || '').localeCompare(String(right.label || ''));
    });

  const duplicateGroupNames = useMemo(() => {
    const counts = new Map();
    meterGroups.forEach(group => {
      const normalizedName = String(group.name || '').trim().toLowerCase();
      if (!normalizedName) return;
      counts.set(normalizedName, (counts.get(normalizedName) || 0) + 1);
    });
    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name)
    );
  }, [meterGroups]);

  const addMeterGroup = () => {
    setMeterGroups(prev => [
      ...prev,
      {
        id: createGroupId(),
        name: `Group ${prev.length + 1}`,
        color: GROUP_COLORS[prev.length % GROUP_COLORS.length],
        meterIds: []
      }
    ]);
  };

  const removeMeterGroup = (groupId) => {
    setMeterGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const updateMeterGroup = (groupId, field, value) => {
    setMeterGroups(prev => prev.map(group => (group.id === groupId ? { ...group, [field]: value } : group)));
  };

  const toggleMeterAssignment = (groupId, meterId) => {
    const targetId = String(meterId);
    setMeterGroups(prev => {
      const assignedElsewhere = prev.find(
        group => group.id !== groupId && group.meterIds.includes(targetId)
      );

      if (assignedElsewhere) {
        return prev;
      }

      return prev.map(group => {
        const isSelected = group.meterIds.includes(targetId);
        if (group.id === groupId) {
          return {
            ...group,
            meterIds: isSelected
              ? group.meterIds.filter(id => id !== targetId)
              : [...group.meterIds, targetId]
          };
        }
        return group;
      });
    });
  };

  const saveMeterGroups = async () => {
    if (duplicateGroupNames.size > 0) {
      setGroupSaveStatus('Use a different group name');
      setSaveSuccessMessage('Group name already exists');
      setShowSaveSuccessPopup(true);
      setTimeout(() => setGroupSaveStatus(null), 3000);
      setTimeout(() => setShowSaveSuccessPopup(false), 2600);
      return;
    }

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const tenantId = userData?.tenantId;
    const normalized = normalizeMeterGroups(meterGroups, meters);
    try {
      const response = await fetch(`${window.process?.env?.REACT_APP_BACKEND_URL || ''}/api/templates/energy-meter-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: normalized, tenantId })
      });

      if (!response.ok) {
        throw new Error('Failed to save energy meter groups');
      }

      const data = await response.json();
      const savedGroups = normalizeMeterGroups(data?.groups || normalized, meters);
      setMeterGroups(savedGroups);
      window.dispatchEvent(new Event(GROUP_EVENT_NAME));
      setGroupSaveStatus('Group saved');
      setSaveSuccessMessage('Group saved successfully');
      setShowSaveSuccessPopup(true);
      setShowGroupingSettings(false);
    } catch (error) {
      console.error('Failed to save groups to backend:', error);
      setGroupSaveStatus('Group save failed');
      setSaveSuccessMessage('Could not save group to database');
      setShowSaveSuccessPopup(true);
    } finally {
      setTimeout(() => setGroupSaveStatus(null), 3000);
      setTimeout(() => setShowSaveSuccessPopup(false), 2600);
    }
  };

  const formatTelemetryValue = (val) => {
    if (val === null || val === undefined) return '—';
    return String(val);
  };

  // Site selector for PageContextBanner
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
        localStorage.setItem('selected_sub_meter_site_id', String(newId));
        const found = allSites?.find(s => String(s.id || s._id || s.siteId) === String(newId));
        if (found && setSelectedSite) {
          setSelectedSite(found);
        }
      },
      ariaLabel: 'Select Site'
    };
  }, [allSites, selectedSiteId, setSelectedSite]);

  const onlineCount = useMemo(() => {
    return meters.filter(m => getMeterOnlineStatus(m)).length;
  }, [meters]);

  return (
    <div className="fade-in">
      <PageContextBanner
        title="Sub-Energy Meters"
        icon={<Zap className={meters.length > 0 ? "text-info" : "text-secondary"} size={22} />}
        status={meters.length > 0 ? (onlineCount > 0 ? `${onlineCount}/${meters.length} ONLINE` : 'OFFLINE') : 'NOT CONFIGURED'}
        siteSelector={siteSelector}
        metadata={[
          {
            icon: <Layers size={15} />,
            label: `${meters.length} Sub-Meters`
          },
          {
            icon: <Clock size={15} />,
            label: 'Polling: 30s batch'
          }
        ]}
        actions={[
          <Button
            key="btn-refresh"
            variant="outline-info"
            size="sm"
            className="rounded-pill px-3 py-1 fs-12 d-flex align-items-center gap-1"
            onClick={fetchBatchEvents}
            disabled={isBatchFetching || meters.length === 0}
            title="Fetch latest batch telemetry now"
          >
            <RefreshCcw size={13} className={isBatchFetching ? "animate-spin" : ""} />
            {isBatchFetching ? 'Syncing...' : 'Refresh'}
          </Button>,
          <button
            key="btn-groups"
            onClick={() => setShowGroupingSettings(true)}
            className="btn btn-outline-info rounded-pill px-3 py-1 d-flex align-items-center gap-1 fs-12"
            style={{ borderColor: 'rgba(56,189,248,0.35)', color: '#7dd3fc', background: 'rgba(56,189,248,0.08)' }}
          >
            <Settings2 size={13} /> Group Settings
          </button>,
          <PdfButton
            key="btn-pdf"
            label=""
            title="Download Sub-Meters PDF Report"
            variant="custom"
            className="context-banner-action-btn p-1 border-0"
            disabled={meters.length === 0}
          />
        ]}
        enableFullscreen={true}
        variant="scada"
        className="sub-meters-context-banner mb-3"
      />

      {devicesLoading ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 my-5">
          <Spinner animation="border" variant="info" className="mb-3" />
          <span className="text-secondary fs-13 font-monospace">Loading sub-energy meters for site...</span>
        </div>
      ) : meters.length === 0 ? (
        <Card className="scada-card border my-4 p-5 text-center position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.7) 100%)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="d-flex flex-column align-items-center justify-content-center py-4">
            <div
              className="d-flex align-items-center justify-content-center mb-3"
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                border: '1.5px dashed rgba(56, 189, 248, 0.45)',
                background: 'rgba(56, 189, 248, 0.05)'
              }}
            >
              <Zap size={36} className="text-info opacity-75" />
            </div>
            <h5 className="text-white fw-bold mb-2">No Sub-Energy Meters Configured</h5>
            <p className="text-secondary mb-4 fs-13" style={{ maxWidth: '480px' }}>
              No sub-energy meters are mapped for this site. You can register new sub-meters in Device Management / Organization Hub or select a different site from the header.
            </p>
            <div className="d-flex gap-2">
              <Button
                variant="outline-info"
                className="rounded-pill px-4 py-2 fs-12 fw-bold d-flex align-items-center gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw size={14} /> Reload Page
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* METERS CARD GRID */}
          <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3 mb-4 justify-content-center">
            {meters.map((meter, index) => {
              const isMapped = getMeterMappedStatus(meter);
              const isOnline = getMeterOnlineStatus(meter);
              return (
                <Col key={meter.id || index} className="d-flex justify-content-center">
                  <MiniMFMMeter
                    meter={meter}
                    isMapped={isMapped}
                    isOnline={isOnline}
                    onClick={() => {
                      setSelectedMeter(meter);
                      if (refreshStatuses) refreshStatuses();
                    }}
                  />
                </Col>
              );
            })}
          </Row>

          {/* FILTER TABS & LOAD ANALYSIS */}
          <Card className="scada-card border mt-4" style={{ backgroundColor: 'var(--scada-card)', borderColor: 'var(--scada-border)', color: 'var(--scada-text)' }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h5 className="mb-0 fw-black text-white d-flex align-items-center gap-2 uppercase tracking-wide fs-11">
                  <Activity className="text-info" size={18} /> Sub-Meters Performance Diagnostics
                </h5>
                <div className="d-flex align-items-center gap-2">
                  {groupSaveStatus && <Badge bg="success" className="px-3 py-2">{groupSaveStatus}</Badge>}
                  {lastBatchTime && (
                    <span className="text-muted fs-11 font-monospace me-2">
                      Synced {new Date(lastBatchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                  <button
                    onClick={() => setShowGroupingSettings(true)}
                    className="btn btn-outline-info rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 fs-12"
                    style={{ borderColor: 'rgba(56,189,248,0.35)', color: '#7dd3fc', background: 'rgba(56,189,248,0.08)' }}
                  >
                    <Settings2 size={14} /> MFM Group Settings
                  </button>
                  <PdfButton />
                </div>
              </div>

              <Tabs defaultActiveKey="all" className="scada-tabs border-bottom border-secondary border-opacity-15 mb-4">
                <Tab eventKey="all" title="ALL FEEDS">
                  <div className="table-responsive mt-3">
                    <Table hover borderless className="align-middle scada-table text-white mb-0">
                      <thead>
                        <tr className="border-bottom border-secondary border-opacity-15 fs-13 text-secondary text-uppercase tracking-wider">
                          <th className="py-3">Meter ID</th>
                          <th className="py-3">Feed Description</th>
                          <th className="py-3 text-center">Operational Load</th>
                          <th className="py-3 text-center">Avg. Volts</th>
                          <th className="py-3 text-center">Phase Amps</th>
                          <th className="py-3 text-center">Last Updated</th>
                          <th className="py-3 text-end">Health Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meters.map((meter, idx) => {
                          const isMapped = getMeterMappedStatus(meter);
                          const isOnline = getMeterOnlineStatus(meter);
                          const hasTelemetry = Object.keys(meter.telemetryValues || {}).length > 0;
                          const showActive = isOnline || hasTelemetry;
                          const fmtNum = (v, d = 1) => { const n = Number(v); return isNaN(n) ? '0.0' : n.toFixed(d); };
                          const formatLastUpdated = (m) => {
                            const ts = m?.lastTelemetryTimestamp || m?.lastSeenAt || m?.device?.lastSeenAt || m?.device?.updatedAt || m?.updatedAt;
                            const d = ts ? new Date(ts) : new Date();
                            const dateObj = isNaN(d.getTime()) ? new Date() : d;
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const hours = String(dateObj.getHours()).padStart(2, '0');
                            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                            const seconds = String(dateObj.getSeconds()).padStart(2, '0');
                            return `${day}/${month} ${hours}:${minutes}:${seconds}`;
                          };
                          return (
                            <tr key={meter.id || idx} className="border-bottom border-secondary border-opacity-5" onClick={() => setSelectedMeter(meter)}>
                              <td className="py-3 font-monospace text-info fs-13">{meter.id}</td>
                              <td className="py-3 text-white fw-bold">{meter.label}</td>
                              <td className="py-3 text-center text-white fw-bold">{showActive ? `${fmtNum(meter.load)} kW` : '—'}</td>
                              <td className="py-3 text-center text-secondary">{showActive ? `${fmtNum(meter.voltage)} V` : '—'}</td>
                              <td className="py-3 text-center text-secondary">{showActive ? `${fmtNum(meter.current)} A` : '—'}</td>
                              <td className="py-3 text-center text-secondary font-monospace">{formatLastUpdated(meter)}</td>
                              <td className="py-3 text-end">{isMapped ? <StatusBadge status={isOnline ? (meter.load > 0.05 ? 'Running' : 'Online') : 'Offline'} /> : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </Tab>
                <Tab eventKey="critical" title="CRITICAL LOADS">
                  <div className="table-responsive mt-3">
                    <Table hover borderless className="align-middle scada-table text-white mb-0">
                      <thead>
                        <tr className="border-bottom border-secondary border-opacity-15 fs-13 text-secondary text-uppercase tracking-wider">
                          <th className="py-3">Meter ID</th>
                          <th className="py-3">Feed Description</th>
                          <th className="py-3 text-center">Operational Load</th>
                          <th className="py-3 text-center">Avg. Volts</th>
                          <th className="py-3 text-center">Last Updated</th>
                          <th className="py-3 text-end">Health Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meters.filter(m => String(m.type).toLowerCase().includes('server') || String(m.type).toLowerCase().includes('utility') || String(m.label).toLowerCase().includes('server') || String(m.label).toLowerCase().includes('critical')).map((meter, idx) => {
                          const isMapped = getMeterMappedStatus(meter);
                          const isOnline = getMeterOnlineStatus(meter);
                          const hasTelemetry = Object.keys(meter.telemetryValues || {}).length > 0;
                          const showActive = isOnline || hasTelemetry;
                          const fmtNum = (v, d = 1) => { const n = Number(v); return isNaN(n) ? '0.0' : n.toFixed(d); };
                          const formatLastUpdated = (m) => {
                            const ts = m?.lastTelemetryTimestamp || m?.lastSeenAt || m?.device?.lastSeenAt || m?.device?.updatedAt || m?.updatedAt;
                            const d = ts ? new Date(ts) : new Date();
                            const dateObj = isNaN(d.getTime()) ? new Date() : d;
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const hours = String(dateObj.getHours()).padStart(2, '0');
                            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                            const seconds = String(dateObj.getSeconds()).padStart(2, '0');
                            return `${day}/${month} ${hours}:${minutes}:${seconds}`;
                          };
                          return (
                            <tr key={meter.id || idx} className="border-bottom border-secondary border-opacity-5" onClick={() => setSelectedMeter(meter)}>
                              <td className="py-3 font-monospace text-info fs-13">{meter.id}</td>
                              <td className="py-3 text-white fw-bold">{meter.label}</td>
                              <td className="py-3 text-center text-white fw-bold">{showActive ? `${fmtNum(meter.load)} kW` : '—'}</td>
                              <td className="py-3 text-center text-secondary">{showActive ? `${fmtNum(meter.voltage)} V` : '—'}</td>
                              <td className="py-3 text-center text-secondary font-monospace">{formatLastUpdated(meter)}</td>
                              <td className="py-3 text-end">{isMapped ? <StatusBadge status={isOnline ? (meter.load > 0.05 ? 'Running' : 'Online') : 'Offline'} /> : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </>
      )}

      {/* MFM GROUP SETTINGS MODAL */}
      <Modal
        show={showGroupingSettings}
        onHide={() => setShowGroupingSettings(false)}
        size="xl"
        centered
        dialogClassName="scada-glass-modal"
        contentClassName="border-0 text-white"
      >
        <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary border-opacity-25 py-3" style={{ background: 'rgba(15, 23, 42, 0.55)' }}>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <FolderTree className="text-info" size={18} /> Sub Meter Group Settings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ background: 'rgba(15, 23, 42, 0.94)' }}>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
            <div>
              <h6 className="text-info fw-bold mb-2">Group your MFM meters from here</h6>
              <p className="text-secondary mb-0" style={{ fontSize: '0.88rem' }}>
                Organize sub-meters into custom groups for site analytics and aggregated overview displays.
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button onClick={addMeterGroup} className="btn btn-outline-info rounded-pill px-3 py-2 d-flex align-items-center gap-2">
                <Plus size={15} /> Add Group
              </button>
              <button onClick={saveMeterGroups} disabled={duplicateGroupNames.size > 0} className="btn btn-info rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2">
                <Settings2 size={15} /> Save Groups
              </button>
            </div>
          </div>

          <Row className="g-4">
            <Col lg={4}>
              <div className="grouping-panel h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="grouping-panel-title">Available MFM Meters</span>
                  <Badge bg="dark" className="border border-info border-opacity-25 text-info">{meters.length}</Badge>
                </div>
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  {meters.map(meter => {
                    const assignedGroup = meterGroups.find(group => group.meterIds.includes(String(meter.templateId ?? meter.id)));
                    return (
                      <div key={meter.id} className="group-meter-pill">
                        <div>
                          <div className="text-white fw-bold fs-13">{meter.label}</div>
                          <small className="text-secondary">{meter.type}</small>
                        </div>
                        <Badge
                          bg="none"
                          className="border"
                          style={{
                            color: assignedGroup?.color || '#94a3b8',
                            borderColor: `${assignedGroup?.color || '#94a3b8'}55`,
                            background: assignedGroup ? `${assignedGroup.color}15` : 'rgba(148,163,184,0.08)'
                          }}
                        >
                          {assignedGroup?.name || 'Ungrouped'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Col>

            <Col lg={8}>
              <div className="d-flex flex-column gap-3" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {meterGroups.length === 0 ? (
                  <div className="grouping-panel text-center py-5">
                    <h6 className="text-white mb-2">No groups created yet</h6>
                    <p className="text-secondary mb-0">Start by creating a group like VRV, Utility Block, Commercial Wing or Lighting.</p>
                  </div>
                ) : (
                  meterGroups.map((group, index) => {
                    const hasNewGroup = meterGroups.some(g => g.isNew);
                    const isGroupDisabled = hasNewGroup && !group.isNew;
                    const normalizedName = String(group.name || '').trim().toLowerCase();
                    const hasDuplicateName = normalizedName && duplicateGroupNames.has(normalizedName);
                    return (
                      <div key={group.id} className="grouping-panel" style={{ opacity: isGroupDisabled ? 0.65 : 1 }}>
                        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                          <div className="d-flex align-items-center gap-3 flex-grow-1">
                            <div className="grouping-strip" style={{ background: isGroupDisabled ? '#475569' : group.color }} />
                            <div className="d-flex gap-2 flex-wrap flex-grow-1">
                              <Form.Control
                                value={group.name}
                                onChange={(e) => updateMeterGroup(group.id, 'name', e.target.value)}
                                className={`grouping-input ${hasDuplicateName ? 'is-invalid' : ''}`}
                                placeholder={`Group ${index + 1}`}
                                disabled={isGroupDisabled}
                              />
                              <Form.Control
                                type="color"
                                value={group.color}
                                onChange={(e) => updateMeterGroup(group.id, 'color', e.target.value)}
                                className="grouping-color-input"
                                disabled={isGroupDisabled}
                              />
                              {hasDuplicateName && (
                                <div className="w-100">
                                  <small className="text-danger">This group name is already used. Choose a different name.</small>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeMeterGroup(group.id)}
                            disabled={isGroupDisabled}
                            className="btn btn-outline-danger rounded-pill px-3 py-2 d-flex align-items-center gap-2"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          {getGroupMeterOptions(group.id).map(meter => {
                            const meterKey = String(meter.templateId ?? meter.id);
                            const checked = group.meterIds.includes(meterKey);
                            const assignedElsewhere = getAssignedGroupForMeter(meterKey, group.id);
                            const disabled = (!checked && !!assignedElsewhere) || isGroupDisabled;
                            return (
                              <label
                                key={`${group.id}-${meter.id}`}
                                className={`grouping-chip ${checked ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                style={{
                                  borderColor: checked ? (isGroupDisabled ? 'rgba(148,163,184,0.12)' : `${group.color}55`) : disabled ? 'rgba(239,68,68,0.28)' : 'rgba(148,163,184,0.12)',
                                  background: checked ? (isGroupDisabled ? 'rgba(148,163,184,0.08)' : `${group.color}15`) : disabled ? 'rgba(51, 65, 85, 0.55)' : 'rgba(15,23,42,0.72)',
                                  opacity: disabled ? 0.5 : 1,
                                  pointerEvents: disabled ? 'none' : 'auto'
                                }}
                              >
                                <span
                                  className={`grouping-checkmark ${checked ? 'visible' : ''}`}
                                  style={{
                                    background: checked ? (isGroupDisabled ? '#64748b' : '#d946ef') : 'rgba(148,163,184,0.18)',
                                    borderColor: checked ? (isGroupDisabled ? '#94a3b8' : '#e879f9') : 'rgba(255,255,255,0.16)',
                                    color: checked ? '#ffffff' : 'transparent'
                                  }}
                                >
                                  <Check size={12} strokeWidth={3} />
                                </span>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={disabled}
                                  onChange={() => toggleMeterAssignment(group.id, meterKey)}
                                />
                                <span className="text-white fw-bold fs-13">{meter.label}</span>
                                <small className={disabled ? 'text-danger' : 'text-secondary'}>
                                  {disabled ? (isGroupDisabled ? 'Locked (Editing new group)' : `Locked in ${assignedElsewhere.name}`) : meter.type}
                                </small>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Col>
          </Row>

          <div className="grouping-panel mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="grouping-panel-title">Ungrouped meters still shown individually on overview</span>
              <Badge bg="dark" className="border border-warning border-opacity-25 text-warning">{ungroupedMeters.length}</Badge>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {ungroupedMeters.length === 0 ? (
                <span className="text-secondary">All sub meters are assigned to a custom group.</span>
              ) : (
                ungroupedMeters.map(meter => (
                  <div key={meter.id} className="group-ungrouped-chip">
                    <span className="text-white fw-bold fs-13">{meter.label}</span>
                    <small className="text-secondary">{meter.type}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* SAVE SUCCESS POPUP */}
      <Modal
        show={showSaveSuccessPopup}
        onHide={() => setShowSaveSuccessPopup(false)}
        centered
        dialogClassName="success-modal"
        contentClassName="border-0 text-white"
      >
        <Modal.Body className="p-4 text-center" style={{ background: 'linear-gradient(180deg, rgba(8,47,73,0.96), rgba(15,23,42,0.98))' }}>
          <div className="success-pop-wrap">
            <div className="success-pop-icon">
              <CheckCircle2 size={38} />
            </div>
            <h4 className="text-white fw-black mb-2">{saveSuccessMessage}</h4>
            <p className="text-info mb-0">Overview updated.</p>
          </div>
        </Modal.Body>
      </Modal>

      {/* DETAILED DATA MODAL */}
      <Modal show={selectedMeter !== null && activeMeter !== null} onHide={() => setSelectedMeter(null)} size="lg" centered dialogClassName="scada-glass-modal" contentClassName="border-0 text-white">
        {activeMeter && (() => {
          const isMapped = getMeterMappedStatus(activeMeter);
          const isOnline = getMeterOnlineStatus(activeMeter);
          const showActive = isOnline;
          return (
            <>
              <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary border-opacity-25 py-3" style={{ background: 'rgba(15, 23, 42, 0.4)', zIndex: 1 }}>
                <Modal.Title className="fw-bold d-flex align-items-center gap-2 w-100 justify-content-between pe-3">
                  <div className="d-flex align-items-center gap-2">
                    <Zap className={showActive ? "text-info animate-pulse glow-text-info" : "text-secondary"} />
                    <div className="d-flex flex-column">
                      <span className={`text-white fs-5 ${showActive ? 'glow-text-info' : ''} fw-black uppercase tracking-wider`}>{activeMeter?.label}</span>
                      <span className="text-muted fs-12 font-monospace mt-1">
                        {activeMeter?.telemetryValues?.meterSrno ? `Serial No: ${activeMeter.telemetryValues.meterSrno}` : activeMeter?.id} • {activeMeter?.type}
                      </span>
                    </div>
                  </div>
                  {isOnline ? (
                    <span className="badge bg-success bg-opacity-10 border border-success border-opacity-25 text-success px-2 py-1 rounded d-flex align-items-center gap-1 fs-12">
                      <span className="pulse-dot-green"></span> ONLINE
                    </span>
                  ) : (
                    <div className="d-flex flex-column align-items-end gap-1">
                      <span className="badge bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger px-2 py-1 rounded d-flex align-items-center gap-1 fs-12">
                        <span className="pulse-dot-red"></span> OFFLINE
                      </span>
                      <span className="text-warning opacity-75" style={{ fontSize: '0.55rem', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                        ⚠ LAST KNOWN DATA
                      </span>
                    </div>
                  )}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-3" style={{ maxHeight: '80vh', overflowY: 'auto', zIndex: 1, position: 'relative' }}>
                {(() => {
                  // Prefer pre-resolved settings from the last batch (already has values via settingId match)
                  // Fallback: re-run resolver with the raw fields array (not the processed telemetry map)
                  const resolvedList = (activeMeter?.resolvedSettings && activeMeter.resolvedSettings.length > 0)
                    ? activeMeter.resolvedSettings
                    : resolveDeviceTelemetry(
                        activeMeter?.device || activeMeter,
                        activeMeter?.rawEventFields?.length > 0
                          ? { fields: activeMeter.rawEventFields }
                          : activeMeter?.telemetryValues || {},
                        activeMeter?.type || 'SUB_ENERGY_METER'
                      ).resolvedSettings;

                  // Deduplicate display settings by parameter name, preferring items with live readings over null duplicates
                  const displayMap = new Map();
                  resolvedList.forEach(item => {
                    const nameKey = (item.displayName || item.settingDef?.displayName || item.settingDef?.name || '').trim().toLowerCase();
                    if (!nameKey) return;
                    const existing = displayMap.get(nameKey);
                    if (!existing) {
                      displayMap.set(nameKey, item);
                    } else if ((existing.value === null || existing.value === undefined) && (item.value !== null && item.value !== undefined)) {
                      displayMap.set(nameKey, item);
                    }
                  });
                  const displayList = Array.from(displayMap.values());

                  return (
                    <Row className="g-3">
                      <Col xs={12}>
                        <div className="p-3 rounded-4 scada-glass-section border-change h-100">
                          <h6 className="text-info glow-text-info uppercase tracking-wider fs-12 mb-3 d-flex align-items-center gap-2 fw-bold">
                            <Zap size={14} className="animate-pulse" /> Telemetry Breakdown
                          </h6>
                          {displayList.length === 0 ? (
                            <div className="text-center py-4 text-secondary fs-13 font-monospace">
                              No telemetry parameters available.
                            </div>
                          ) : (
                            <Row className="g-2">
                              {displayList.map((item, idx) => (
                                <Col sm={4} xs={6} key={item.settingId || item.fieldKey || idx} className="mb-2">
                                  <EnergyMetricCard
                                    setting={item.settingDef || { displayName: item.displayName, unit: item.unit }}
                                    telemetry={item}
                                    displayConfig={{
                                      accentColor: '#38bdf8',
                                      compact: true
                                    }}
                                    isConfigured={true}
                                  />
                                </Col>
                              ))}
                            </Row>
                          )}
                        </div>
                      </Col>
                    </Row>
                  );
                })()}
              </Modal.Body>
              <Modal.Footer className="border-top border-secondary border-opacity-25 py-2" style={{ background: 'rgba(15, 23, 42, 0.4)', zIndex: 1 }}>
                <Button variant="outline-secondary" className="px-4 py-2 text-white border-secondary border-opacity-25" onClick={() => setSelectedMeter(null)}>Close Dashboard</Button>
              </Modal.Footer>
            </>
          );
        })()}
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scada-card { background: #0f172a; border-radius: 20px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 20px -2px rgba(0,0,0,0.4); }
        .scada-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -4px rgba(0,0,0,0.5); }
        .scada-glass-card { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
        .scada-tabs .nav-link { color: #64748b; font-weight: bold; border: 0; background: transparent; padding: 12px 24px; font-size: 0.72rem; letter-spacing: 1px; }
        .scada-tabs .nav-link.active { color: #0ea5e9 !important; background: transparent !important; border-bottom: 2px solid #0ea5e9; }
        .scada-table tbody tr { transition: all 0.2s; cursor: pointer; }
        .scada-table tbody tr:hover { background: rgba(255, 255, 255, 0.02); }
        .fw-black { font-weight: 900 !important; }
        .fs-12 { font-size: 0.65rem !important; }
        .fs-13 { font-size: 0.8rem !important; }
        .fs-7 { font-size: 1.1rem !important; }
        .tracking-widest { letter-spacing: 2px !important; }
        .lcd-grid-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: 
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px);
          background-size: 10px 10px;
          pointer-events: none;
          z-index: 1;
        }

        /* Modal Backdrop blur */
        .modal-backdrop {
          backdrop-filter: blur(6px) !important;
          -webkit-backdrop-filter: blur(6px) !important;
          background-color: rgba(15, 23, 42, 0.7) !important;
        }
        /* Modal Window Entrance Animation and Glassmorphism */
        .scada-glass-modal .modal-content {
          background: rgba(15, 23, 42, 0.85) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 24px !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(14, 165, 233, 0.15) !important;
          animation: scada-modal-zoom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          overflow: hidden;
          position: relative;
        }
        @keyframes scada-modal-zoom {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        /* Glowing Titles and Badges */
        .glow-text-info { text-shadow: 0 0 10px rgba(14, 165, 233, 0.5); }
        .glow-text-warning { text-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
        .glow-text-success { text-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
        .glow-text-danger { text-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }

        /* Enhanced Glass Sections */
        .scada-glass-section {
          background: rgba(30, 41, 59, 0.4) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 1;
        }
        .scada-glass-section:hover {
          background: rgba(30, 41, 59, 0.55) !important;
          transform: translateY(-2px);
        }
        
        .border-change {
          border: 1px solid rgba(14, 165, 233, 0.35) !important;
          box-shadow: 0 8px 32px rgba(14, 165, 233, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.05);
        }
        .border-warning {
          border: 1px solid rgba(245, 158, 11, 0.35) !important;
          box-shadow: 0 8px 32px rgba(245, 158, 11, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.05);
        }
        .border-read {
          border: 1px solid rgba(34, 197, 94, 0.35) !important;
          box-shadow: 0 8px 32px rgba(34, 197, 94, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.05);
        }

        /* Telemetry Cards */
        .telemetry-card-glow {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
          border-radius: 12px !important;
          transition: all 0.25s ease;
        }
        .telemetry-card-glow:hover {
          background: rgba(15, 23, 42, 0.8) !important;
          transform: scale(1.03);
        }
        .telemetry-card-glow.card-hover-change:hover {
          border-color: rgba(14, 165, 233, 0.6) !important;
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05);
        }

        /* Live pulsating indicator dot */
        .pulse-dot-red {
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #ef4444;
          animation: pulse-dot 1.5s infinite;
        }
        .pulse-dot-green {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px #22c55e;
          animation: pulse-dot 1.5s infinite;
        }
        @keyframes pulse-dot {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        .grouping-panel {
          background: linear-gradient(180deg, rgba(15,23,42,0.78), rgba(15,23,42,0.62));
          border: 1px solid rgba(148,163,184,0.12);
          border-radius: 18px;
          padding: 18px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .grouping-panel-title {
          color: #cbd5e1;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .group-meter-pill,
        .group-ungrouped-chip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border-radius: 14px;
          padding: 12px 14px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(148,163,184,0.1);
        }
        .group-ungrouped-chip {
          flex-direction: column;
          align-items: flex-start;
          min-width: 220px;
        }
        .grouping-strip {
          width: 12px;
          height: 48px;
          border-radius: 999px;
          box-shadow: 0 0 18px rgba(255,255,255,0.12);
        }
        .grouping-input {
          min-width: 240px;
          background: rgba(15,23,42,0.92) !important;
          color: #fff !important;
          border: 1px solid rgba(148,163,184,0.18) !important;
        }
        .grouping-color-input {
          width: 54px;
          min-height: 42px;
          background: transparent !important;
          border: 1px solid rgba(148,163,184,0.18) !important;
          border-radius: 12px;
          padding: 4px;
        }
        .grouping-chip {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 220px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.12);
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }
        .grouping-chip:hover {
          transform: translateY(-2px);
        }
        .grouping-checkmark {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.16);
          margin-bottom: 10px;
          transition: all 0.18s ease;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .grouping-checkmark.visible {
          box-shadow: 0 0 14px rgba(217,70,239,0.18);
          transform: scale(1.03);
        }
        .grouping-chip input {
          display: none;
        }
        .grouping-chip.active {
          box-shadow: 0 12px 22px rgba(2,6,23,0.22);
        }
        .grouping-chip.disabled {
          cursor: not-allowed;
        }
        .grouping-chip.disabled:hover {
          transform: none;
        }
        .success-modal .modal-content {
          background: transparent !important;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.45);
        }
        .success-pop-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 12px 4px;
        }
        .success-pop-icon {
          width: 78px;
          height: 78px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          color: #86efac;
          background: radial-gradient(circle, rgba(34,197,94,0.28), rgba(34,197,94,0.08));
          box-shadow: 0 0 30px rgba(34,197,94,0.22);
        }
      `}} />
    </div>
  );
};

export default SubMeters;
