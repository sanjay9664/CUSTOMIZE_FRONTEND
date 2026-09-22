import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  Leaf,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  ArrowUp,
  Clock,
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle2,
  Maximize2,
  Info,
  Sliders,
  Cpu,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { io } from 'socket.io-client';
import PageContextBanner from '../../components/PageContextBanner';
import { useSiteStore } from '../../context/SiteContext';
import { useTheme } from '../../context/ThemeContext';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
import { bmsService } from '../../services/bmsService';
import { getApiUrl } from '../../utils/apiConfig';
import { getAuthHeaders, normalizeList } from '../../services/apiClient';
import './AQIOverview.css';

// ── Sensor Validation & Bounds (Prevents Malfunctioned Data) ──
const VALID_RANGES = {
  aqi: { min: 0, max: 500, label: 'AQI' },
  pm25: { min: 0, max: 1000, label: 'PM2.5' },
  pm10: { min: 0, max: 1000, label: 'PM10' },
  co2: { min: 300, max: 5000, label: 'CO2' },
  tvoc: { min: 0, max: 10000, label: 'TVOC' },
  tempC: { min: -40, max: 80, label: 'Temperature' },
  hum: { min: 0, max: 100, label: 'Humidity' }
};

/**
 * Validates whether a value is a real, non-malfunctioning sensor reading
 */
const validateSensorVal = (val, type) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (isNaN(num) || !Number.isFinite(num)) return null;

  // Check known hardware error/malfunction sentinel values (e.g. -999, 65535)
  if (num === -999 || num === 65535 || num === 32767 || num === 99999) return null;

  const range = VALID_RANGES[type];
  if (range && (num < range.min || num > range.max)) {
    // Value falls outside physically valid limits; reject as malfunction
    return null;
  }

  return num;
};

/**
 * Calculates standard US EPA AQI from raw PM2.5 (µg/m³) only if real PM2.5 is present
 */
const calculateAqiFromPm25 = (pm25) => {
  if (pm25 === null || pm25 === undefined || isNaN(pm25)) return null;
  const c = Math.max(0, Number(pm25));

  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 }
  ];

  for (const bp of breakpoints) {
    if (c >= bp.cLow && c <= bp.cHigh) {
      const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow;
      return Math.round(aqi);
    }
  }

  if (c > 500.4) return 500;
  return null;
};

/**
 * Resolves standard AQI Category strictly from a real numeric value
 */
const getAqiCategory = (val) => {
  if (val === null || val === undefined || isNaN(val)) {
    return {
      label: 'NO DATA',
      colorClass: 'text-secondary',
      capsuleClass: 'bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25',
      colorHex: '#94a3b8',
      description: 'Awaiting sensor telemetry.'
    };
  }

  const num = Number(val);
  if (num <= 50) {
    return {
      label: 'GOOD',
      colorClass: 'aqi-good',
      capsuleClass: 'aqi-capsule-good',
      colorHex: '#10b981',
      description: 'Air quality is satisfactory and poses little or no risk.'
    };
  }
  if (num <= 100) {
    return {
      label: 'MODERATE',
      colorClass: 'aqi-moderate',
      capsuleClass: 'aqi-capsule-moderate',
      colorHex: '#eab308',
      description: 'Air quality is acceptable. Elevated particles may affect sensitive individuals.'
    };
  }
  if (num <= 150) {
    return {
      label: 'UNHEALTHY FOR SENSITIVE',
      colorClass: 'aqi-unhealthy-sensitive',
      capsuleClass: 'aqi-capsule-unhealthy-sensitive',
      colorHex: '#f97316',
      description: 'Members of sensitive groups may experience health effects.'
    };
  }
  return {
    label: 'UNHEALTHY',
    colorClass: 'aqi-unhealthy',
    capsuleClass: 'aqi-capsule-unhealthy',
    colorHex: '#ef4444',
    description: 'Everyone may begin to experience health effects.'
  };
};

/**
 * Format helper for numbers (strictly returns em dash '—' if value is null/missing)
 */
const fmt = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  const n = Number(val);
  return Number.isInteger(n) ? n.toString() : n.toFixed(decimals);
};

/**
 * Radial Arc Gauge Component (Only renders progress for real valid data)
 */
const RadialArcGauge = ({ value, min = 300, max = 2000, unit = 'ppm' }) => {
  const radius = 48;
  const strokeWidth = 10;
  const hasValue = value !== null && value !== undefined && !isNaN(value);

  const normalizedVal = hasValue ? Math.min(Math.max(Number(value), min), max) : min;
  const ratio = hasValue ? (normalizedVal - min) / (max - min) : 0;

  const arcLength = Math.PI * radius;
  const strokeDashoffset = arcLength * (1 - ratio);

  let strokeColor = '#22c55e';
  if (hasValue) {
    if (value > 1200) strokeColor = '#ef4444';
    else if (value > 800) strokeColor = '#f97316';
    else if (value > 600) strokeColor = '#eab308';
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center position-relative w-100 h-100">
      <svg width="140" height="95" viewBox="0 0 120 80" className="overflow-visible">
        {/* Background Arc */}
        <path
          d={`M 12 70 A ${radius} ${radius} 0 0 1 108 70`}
          fill="none"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value Arc */}
        {hasValue && (
          <path
            d={`M 12 70 A ${radius} ${radius} 0 0 1 108 70`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
          />
        )}
      </svg>
      <div className="aqi-gauge-center" style={{ top: '68%' }}>
        <div className="aqi-gauge-center-val">{fmt(value, 0)}</div>
        <div className="aqi-gauge-center-unit">{unit}</div>
      </div>
    </div>
  );
};

// Sampling intervals supported for air quality trend analysis
const SAMPLING_INTERVALS = [
  { label: '15MIN', value: 'MIN_15' },
  { label: '30MIN', value: 'MIN_30' },
  { label: 'HOURLY', value: 'HOURLY' },
  { label: 'DAILY', value: 'DAILY' }
];

/**
 * Formats timestamps on x-axis according to active interval and time range
 */
const formatTimestampByInterval = (date, range, interval) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  if (interval === 'DAILY') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  if (range === '7d') {
    const day = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: interval?.includes('MIN') ? '2-digit' : undefined, hour12: true });
    return `${day} ${time}`;
  }

  if (interval === 'MIN_15' || interval === 'MIN_30') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

/**
 * Custom Interactive Tooltip for Historical Area Chart
 */
const HistoricalChartTooltip = ({ active, payload, label, useFahrenheit = false }) => {
  if (!active || !payload || !payload.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  const aqiInfo = getAqiCategory(pt.aqi);

  // Format temperature based on user preference and available data
  const displayTemp = pt.tempC !== null && pt.tempC !== undefined
    ? (useFahrenheit
        ? (pt.tempF !== null && pt.tempF !== undefined ? `${fmt(pt.tempF, 1)}°F` : `${fmt(pt.tempC * 1.8 + 32, 1)}°F`)
        : `${fmt(pt.tempC, 1)}°C`)
    : (pt.tempF !== null && pt.tempF !== undefined ? `${fmt(pt.tempF, 1)}°F` : null);

  return (
    <div className="aqi-chart-tooltip">
      <div className="aqi-chart-tooltip-header">
        {pt.fullDate || label}
      </div>
      <div className="aqi-chart-tooltip-row fw-bold" style={{ color: aqiInfo.colorHex }}>
        <span>AQI Index:</span>
        <span className="font-monospace fs-7">{fmt(pt.aqi, 0)} ({aqiInfo.label})</span>
      </div>
      {pt.pm25 !== null && pt.pm25 !== undefined && (
        <div className="aqi-chart-tooltip-row text-secondary">
          <span>PM2.5:</span>
          <span className="text-light font-monospace">{fmt(pt.pm25, 1)} µg/m³</span>
        </div>
      )}
      {pt.pm10 !== null && pt.pm10 !== undefined && (
        <div className="aqi-chart-tooltip-row text-secondary">
          <span>PM10:</span>
          <span className="text-light font-monospace">{fmt(pt.pm10, 1)} µg/m³</span>
        </div>
      )}
      {pt.co2 !== null && pt.co2 !== undefined && (
        <div className="aqi-chart-tooltip-row text-secondary">
          <span>CO₂:</span>
          <span className="text-light font-monospace">{fmt(pt.co2, 0)} ppm</span>
        </div>
      )}
      {pt.tvoc !== null && pt.tvoc !== undefined && (
        <div className="aqi-chart-tooltip-row text-secondary">
          <span>TVOC:</span>
          <span className="text-light font-monospace">{fmt(pt.tvoc, 0)} ppb</span>
        </div>
      )}
      {(displayTemp !== null || (pt.hum !== null && pt.hum !== undefined)) && (
        <div className="aqi-chart-tooltip-row text-secondary">
          <span>Temp & Humidity:</span>
          <span className="text-info font-monospace">
            {displayTemp !== null ? displayTemp : '—'} • {pt.hum !== null && pt.hum !== undefined ? `${fmt(pt.hum, 0)}%` : '—'}
          </span>
        </div>
      )}
    </div>
  );
};

const AQIOverview = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { sites, selectedSite, setSelectedSite } = useSiteStore();
  const { getOverallStatus } = useDeviceStatus();

  // Devices & channels state
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return localStorage.getItem('selected_aqi_device_id') || '';
  });

  // Real-time sensor state strictly parsed from API/WebSocket response
  const [liveTelemetry, setLiveTelemetry] = useState({
    aqi: null,
    pm25: null,
    pm10: null,
    co2: null,
    tvoc: null,
    tempC: null,
    tempF: null,
    hum: null,
    tvocUnit: 'PPM',
    co2Unit: 'ppm',
    tempUnit: 'Deg.C',
    humUnit: '%',
    lastEventTime: null,
    alarmState: null
  });

  // Historical telemetry snapshots state
  const [historicalData, setHistoricalData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d'); // '12h' | '24h' | '7d'
  const [samplingInterval, setSamplingInterval] = useState('DAILY'); // 'MIN_15' | 'MIN_30' | 'HOURLY' | 'DAILY'

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    if (newRange === '7d') {
      setSamplingInterval('DAILY');
    } else {
      setSamplingInterval('HOURLY');
    }
  };

  // View settings
  const [useFahrenheit, setUseFahrenheit] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const requestIdRef = useRef(0);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedSiteId = useMemo(() => {
    return selectedSite?.id || sites?.[0]?.id || '1';
  }, [selectedSite, sites]);

  // 1. Fetch real AQI devices for the site (strictly category=AQI_SENSOR)
  useEffect(() => {
    if (!selectedSiteId) {
      setDevices([]);
      setSelectedDeviceId('');
      return;
    }

    let isMounted = true;
    const fetchAqiDevices = async () => {
      setDevicesLoading(true);
      try {
        const queryParams = new URLSearchParams({
          siteId: String(selectedSiteId),
          category: 'AQI_SENSOR',
          include: 'settings,rules,profile'
        });

        const res = await fetch(getApiUrl(`/devices?${queryParams.toString()}`), {
          headers: getAuthHeaders()
        }).catch(() => null);

        let items = [];
        if (res && res.ok) {
          const json = await res.json();
          items = normalizeList(json, 'devices');
        }

        if (isMounted) {
          // Strictly filter for AQI_SENSOR category as requested
          // Also accommodates legacy or profile-embedded category mappings
          const aqiDevices = items.filter(d => {
            const cat = String(d.category || d.profile?.category || '').toUpperCase();
            return cat === 'AQI_SENSOR';
          });

          setDevices(aqiDevices);

          if (aqiDevices.length > 0) {
            const currentInList = aqiDevices.some(d => String(d.id || d.deviceId) === String(selectedDeviceId));
            if (!currentInList) {
              const firstId = String(aqiDevices[0].id || aqiDevices[0].deviceId);
              setSelectedDeviceId(firstId);
              localStorage.setItem('selected_aqi_device_id', firstId);
            }
          } else {
            setSelectedDeviceId('');
            localStorage.removeItem('selected_aqi_device_id');
          }
        }
      } catch (err) {
        console.warn('Error fetching AQI devices:', err);
        if (isMounted) setDevices([]);
      } finally {
        if (isMounted) setDevicesLoading(false);
      }
    };

    fetchAqiDevices();
    return () => { isMounted = false; };
  }, [selectedSiteId]);

  const selectedDevice = useMemo(() => {
    if (!devices || devices.length === 0) return null;
    return devices.find(d => String(d.id || d.deviceId) === String(selectedDeviceId)) || devices[0];
  }, [devices, selectedDeviceId]);

  // Online check
  const isDeviceOnline = useMemo(() => {
    if (!selectedDevice) return false;
    const devId = selectedDevice.id || selectedDevice.deviceId;
    const gatewayUuid = selectedDevice.gatewayUuid || selectedDevice.device?.gatewayUuid;

    if (devId && getOverallStatus) {
      const isOnline = getOverallStatus(devId, gatewayUuid);
      if (isOnline) return true;
    }

    if (selectedDevice.status) {
      const s = String(selectedDevice.status).toUpperCase();
      if (s === 'ONLINE' || s === 'ACTIVE') return true;
      if (s === 'OFFLINE' || s === 'INACTIVE' || s === 'DISABLED') return false;
    }

    if (selectedDevice.lastSeenAt) {
      const lastSeenMs = new Date(selectedDevice.lastSeenAt).getTime();
      if (Math.abs(Date.now() - lastSeenMs) < 5 * 60 * 1000) return true;
    }

    return false;
  }, [selectedDevice, getOverallStatus]);

  // 2. Parse Raw Telemetry Fields from Real Response with Device Settings Mapping
  const parseFieldsToTelemetry = useCallback((fields = [], defaultAlarmState = null) => {
    if (!Array.isArray(fields) || fields.length === 0) return null;

    // Build lookup from selectedDevice settings if available
    const settings = selectedDevice?.settings || [];
    const settingMetricMap = new Map();
    const unitsMap = {
      tvoc: 'PPM',
      co2: 'ppm',
      tempC: 'Deg.C',
      hum: '%'
    };

    settings.forEach(s => {
      const name = String(s.displayName || '').toLowerCase();
      const fieldName = String(s.sochiotFieldName || s.fieldKey || s.fieldName || '').trim();
      const sId = String(s.settingId !== undefined && s.settingId !== null ? s.settingId : (s.id !== undefined && s.id !== null ? s.id : '')).trim();
      let metricType = null;

      if (/aqi|iaq|air\s*quality/i.test(name) || fieldName === '3,104') metricType = 'aqi';
      else if (/pm\s*2\.?5/i.test(name)) metricType = 'pm25';
      else if (/pm\s*10/i.test(name)) metricType = 'pm10';
      else if (/co\s*2|carbon/i.test(name) || fieldName === '3,102') metricType = 'co2';
      else if (/tvoc|voc/i.test(name) || fieldName === '3,103') metricType = 'tvoc';
      else if (sId === '27' || fieldName === '3,100' || /temp|temperature/i.test(name)) metricType = 'tempC';
      else if (sId === '28' || fieldName === '3,101' || /hum|humidity|rh/i.test(name)) metricType = 'hum';

      if (metricType) {
        if (s.id) settingMetricMap.set(String(s.id), metricType);
        if (s.settingId) settingMetricMap.set(String(s.settingId), metricType);
        if (s.fieldKey) settingMetricMap.set(String(s.fieldKey).trim().toLowerCase(), metricType);
        if (s.sochiotFieldId) settingMetricMap.set(String(s.sochiotFieldId), metricType);
        if (s.sochiotFieldName) settingMetricMap.set(String(s.sochiotFieldName).trim().toLowerCase(), metricType);
        if (s.fieldName) settingMetricMap.set(String(s.fieldName).trim().toLowerCase(), metricType);
        if (s.displayName) settingMetricMap.set(String(s.displayName).trim().toLowerCase(), metricType);
        if (s.unit) unitsMap[metricType] = s.unit;
      }
    });

    let parsedAqi = null;
    let parsedPm25 = null;
    let parsedPm10 = null;
    let parsedCo2 = null;
    let parsedTvoc = null;
    let parsedTempC = null;
    let parsedHum = null;
    let latestTime = null;

    for (const f of fields) {
      if (!f) continue;
      const val = f.currentValue !== undefined ? f.currentValue : (f.value !== undefined ? f.value : (f.lastValue !== undefined ? f.lastValue : (f.avgValue !== undefined ? f.avgValue : null)));
      if (val === null || val === undefined) continue;

      if (f.time && (!latestTime || f.time > latestTime)) latestTime = f.time;

      let metricType = null;
      const fId = f.settingId !== undefined && f.settingId !== null ? String(f.settingId) : (f.id !== undefined && f.id !== null ? String(f.id) : null);
      const fKey = String(f.fieldKey || f.sochiotFieldName || f.fieldName || '').trim().toLowerCase();
      const fName = String(f.displayName || f.name || '').trim().toLowerCase();

      if (fId && settingMetricMap.has(fId)) {
        metricType = settingMetricMap.get(fId);
      } else if (f.sochiotFieldId && settingMetricMap.has(String(f.sochiotFieldId))) {
        metricType = settingMetricMap.get(String(f.sochiotFieldId));
      } else if (fKey && settingMetricMap.has(fKey)) {
        metricType = settingMetricMap.get(fKey);
      } else if (fName && settingMetricMap.has(fName)) {
        metricType = settingMetricMap.get(fName);
      }

      if (!metricType) {
        if (/aqi|iaq|air\s*quality/i.test(fName) || fKey === '3,104') metricType = 'aqi';
        else if (/pm\s*2\.?5/i.test(fName)) metricType = 'pm25';
        else if (/pm\s*10/i.test(fName)) metricType = 'pm10';
        else if (/co\s*2|carbon\s*dioxide/i.test(fName) || fKey === '3,102') metricType = 'co2';
        else if (/tvoc|voc/i.test(fName) || fKey === '3,103') metricType = 'tvoc';
        else if (fId === '27' || fKey === '3,100' || /temp|temperature/i.test(fName)) metricType = 'tempC';
        else if (fId === '28' || fKey === '3,101' || /hum|humidity|rh/i.test(fName)) metricType = 'hum';
      }

      if (!metricType) continue;

      if (f.unit) unitsMap[metricType] = f.unit;

      const v = validateSensorVal(val, metricType);
      if (v !== null) {
        if (metricType === 'aqi') parsedAqi = v;
        else if (metricType === 'pm25') parsedPm25 = v;
        else if (metricType === 'pm10') parsedPm10 = v;
        else if (metricType === 'co2') parsedCo2 = v;
        else if (metricType === 'tvoc') parsedTvoc = v;
        else if (metricType === 'tempC') parsedTempC = v;
        else if (metricType === 'hum') parsedHum = v;
      }
    }

    // If AQI was not reported directly, but real PM2.5 is present, calculate official EPA AQI
    if (parsedAqi === null && parsedPm25 !== null) {
      parsedAqi = calculateAqiFromPm25(parsedPm25);
    }

    const parsedTempF = parsedTempC !== null ? +(parsedTempC * 1.8 + 32).toFixed(1) : null;

    return {
      aqi: parsedAqi,
      pm25: parsedPm25,
      pm10: parsedPm10,
      co2: parsedCo2,
      tvoc: parsedTvoc,
      tempC: parsedTempC,
      tempF: parsedTempF,
      hum: parsedHum,
      tvocUnit: unitsMap.tvoc || 'PPM',
      co2Unit: unitsMap.co2 || 'ppm',
      tempUnit: unitsMap.tempC || 'Deg.C',
      humUnit: unitsMap.hum || '%',
      lastEventTime: latestTime,
      alarmState: defaultAlarmState
    };
  }, [selectedDevice]);

  // 3. Fetch Real-Time Latest Device Events (GET /devices/:id/events/latest)
  const fetchLatestRealTelemetry = useCallback(async () => {
    if (!selectedDeviceId) {
      setLiveTelemetry({
        aqi: null, pm25: null, pm10: null, co2: null,
        tvoc: null, tempC: null, tempF: null, hum: null,
        tvocUnit: 'PPM', co2Unit: 'ppm', tempUnit: 'Deg.C', humUnit: '%',
        lastEventTime: null, alarmState: null
      });
      return;
    }

    try {
      const res = await bmsService.getDeviceEventsLatest(selectedDeviceId, selectedSiteId).catch(() => null);
      if (res && res.data) {
        const fields = res.data.fields || [];
        const parsed = parseFieldsToTelemetry(fields, res.data.alarmState);
        if (parsed) {
          setLiveTelemetry(prev => ({
            ...prev,
            ...parsed
          }));

          // Add and show as per the data: update or append to historical timeline
          if (parsed.aqi !== null || parsed.co2 !== null || parsed.tvoc !== null) {
            const pointTime = new Date(parsed.lastEventTime || Date.now());
            const timeStr = formatTimestampByInterval(pointTime, timeRange, samplingInterval);
            const fullDate = pointTime.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

            setHistoricalData(prev => {
              const newPoint = {
                time: timeStr,
                fullDate,
                aqi: parsed.aqi,
                pm25: parsed.pm25,
                pm10: parsed.pm10,
                co2: parsed.co2,
                tvoc: parsed.tvoc,
                tempC: parsed.tempC,
                tempF: parsed.tempF,
                hum: parsed.hum,
                rawTimestamp: pointTime.getTime()
              };

              if (prev.length === 0) return [newPoint];
              const last = prev[prev.length - 1];
              // If last point was within 60s, update it
              if (Math.abs(last.rawTimestamp - newPoint.rawTimestamp) < 60000) {
                const next = [...prev];
                next[next.length - 1] = newPoint;
                return next;
              }
              const next = [...prev, newPoint];
              return next.length > 500 ? next.slice(next.length - 500) : next;
            });
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch latest real device telemetry:', err);
    }
  }, [selectedDeviceId, selectedSiteId, parseFieldsToTelemetry, timeRange, samplingInterval]);

  // 4. Fetch Real Historical Snapshots (GET /telemetry/snapshots)
  const fetchHistoricalSnapshots = useCallback(async () => {
    if (!selectedDeviceId || !selectedSiteId) {
      setHistoricalData([]);
      return;
    }

    requestIdRef.current += 1;
    const curRequestId = requestIdRef.current;
    setHistoryLoading(true);

    try {
      const now = new Date();
      let from = new Date();

      if (timeRange === '12h') {
        from = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      } else if (timeRange === '24h') {
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else {
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Backend validates interval to: "MIN_15" | "HOURLY" | "DAILY" | "MONTHLY"
      // When "MIN_30" is chosen in the UI, directly request "MIN_15" from backend (never send MIN_30)
      // to avoid 400 VALIDATION_ERROR, and aggregate into 30-min buckets on the client.
      const backendInterval = samplingInterval === 'MIN_30' ? 'MIN_15' : samplingInterval;
      const shouldDownsample30Min = samplingInterval === 'MIN_30';

      const res = await bmsService.getDeviceTelemetrySnapshots(selectedSiteId, selectedDeviceId, {
        interval: backendInterval,
        from: from.toISOString(),
        to: now.toISOString(),
        limit: 1000
      }).catch(() => null);

      if (curRequestId !== requestIdRef.current) return;

      const settings = res?.data?.settings || [];
      if (!Array.isArray(settings) || settings.length === 0) {
        setHistoricalData([]);
        return;
      }

      // Find real settings in response (matching explicit settingId: 27, fieldKey: "3,100", displayName: "Temperature")
      let aqiSetting = settings.find(s =>
        s.settingId === 29 ||
        s.fieldKey === '3,104' ||
        s.sochiotFieldName === '3,104' ||
        /aqi|iaq/i.test(s.displayName || s.fieldKey || '')
      );
      let pm25Setting = settings.find(s =>
        /pm\s*2\.?5/i.test(s.displayName || s.fieldKey || '')
      );
      let pm10Setting = settings.find(s =>
        /pm\s*10/i.test(s.displayName || s.fieldKey || '')
      );
      let co2Setting = settings.find(s =>
        s.settingId === 25 ||
        s.fieldKey === '3,102' ||
        s.sochiotFieldName === '3,102' ||
        /co\s*2|carbon/i.test(s.displayName || s.fieldKey || '')
      );
      let tvocSetting = settings.find(s =>
        s.settingId === 26 ||
        s.fieldKey === '3,103' ||
        s.sochiotFieldName === '3,103' ||
        /tvoc|voc/i.test(s.displayName || s.fieldKey || '')
      );
      let tempSetting = settings.find(s =>
        s.settingId === 27 ||
        String(s.settingId) === '27' ||
        s.id === 27 ||
        String(s.id) === '27' ||
        s.fieldKey === '3,100' ||
        s.sochiotFieldName === '3,100' ||
        /temp|temperature/i.test(s.displayName || s.fieldKey || '')
      );
      let humSetting = settings.find(s =>
        s.settingId === 28 ||
        String(s.settingId) === '28' ||
        s.id === 28 ||
        String(s.id) === '28' ||
        s.fieldKey === '3,101' ||
        s.sochiotFieldName === '3,101' ||
        /hum|humidity|rh/i.test(s.displayName || s.fieldKey || '')
      );

      // Populate latest live values from snapshots if live telemetry hasn't arrived yet
      if (tempSetting && Array.isArray(tempSetting.snapshots) && tempSetting.snapshots.length > 0) {
        const sortedTempSnaps = [...tempSetting.snapshots].sort((a, b) => new Date(b.windowStart || b.windowEnd || 0) - new Date(a.windowStart || a.windowEnd || 0));
        const latestSnap = sortedTempSnaps[0];
        const val = latestSnap.lastValue !== null && latestSnap.lastValue !== undefined ? latestSnap.lastValue : latestSnap.avgValue;
        const validT = validateSensorVal(val, 'tempC');
        if (validT !== null) {
          setLiveTelemetry(prev => {
            if (prev.tempC === null) {
              return {
                ...prev,
                tempC: validT,
                tempF: +(validT * 1.8 + 32).toFixed(1)
              };
            }
            return prev;
          });
        }
      }

      if (humSetting && Array.isArray(humSetting.snapshots) && humSetting.snapshots.length > 0) {
        const sortedHumSnaps = [...humSetting.snapshots].sort((a, b) => new Date(b.windowStart || b.windowEnd || 0) - new Date(a.windowStart || a.windowEnd || 0));
        const latestSnap = sortedHumSnaps[0];
        const val = latestSnap.lastValue !== null && latestSnap.lastValue !== undefined ? latestSnap.lastValue : latestSnap.avgValue;
        const validH = validateSensorVal(val, 'hum');
        if (validH !== null) {
          setLiveTelemetry(prev => {
            if (prev.hum === null) {
              return {
                ...prev,
                hum: validH
              };
            }
            return prev;
          });
        }
      }

      // Use snapshots from AQI or PM2.5 or CO2 or Temperature as the primary chronological timeline
      const primarySetting = aqiSetting || pm25Setting || co2Setting || tempSetting || settings[0];
      let rawSnaps = primarySetting?.snapshots || [];

      if (!Array.isArray(rawSnaps) || rawSnaps.length === 0) {
        setHistoricalData([]);
        return;
      }

      // Helper function to build fast tolerance-based timestamp lookup for companion settings
      const createSnapshotLookup = (setting) => {
        if (!setting || !Array.isArray(setting.snapshots) || setting.snapshots.length === 0) {
          return () => null;
        }
        const map = new Map();
        const sortedTimes = [];
        setting.snapshots.forEach(s => {
          const t = new Date(s.windowStart || s.windowEnd || 0).getTime();
          if (!isNaN(t) && t > 0) {
            const v = s.avgValue !== null && s.avgValue !== undefined ? s.avgValue : s.lastValue;
            map.set(t, v);
            sortedTimes.push(t);
          }
        });
        sortedTimes.sort((a, b) => a - b);

        return (targetTime, toleranceMs = 30 * 60 * 1000) => {
          if (map.has(targetTime)) return map.get(targetTime);
          let closestTime = null;
          let minDiff = Infinity;
          for (const t of sortedTimes) {
            const diff = Math.abs(t - targetTime);
            if (diff < minDiff) {
              minDiff = diff;
              closestTime = t;
            }
          }
          if (closestTime !== null && minDiff <= toleranceMs) {
            return map.get(closestTime);
          }
          return null;
        };
      };

      // Helper function to aggregate 15-min snapshots into 30-min buckets
      const downsampleSnapsTo30Min = (snaps) => {
        if (!Array.isArray(snaps) || snaps.length === 0) return [];
        const buckets = new Map();
        snaps.forEach(snap => {
          const t = new Date(snap.windowStart || snap.windowEnd || 0).getTime();
          if (isNaN(t) || t <= 0) return;
          const bucketKey = Math.floor(t / (30 * 60 * 1000)) * (30 * 60 * 1000);
          if (!buckets.has(bucketKey)) {
            buckets.set(bucketKey, {
              ...snap,
              windowStart: new Date(bucketKey).toISOString(),
              windowEnd: new Date(bucketKey + 30 * 60 * 1000).toISOString(),
              _values: []
            });
          }
          const v = snap.avgValue !== null && snap.avgValue !== undefined ? snap.avgValue : snap.lastValue;
          if (v !== null && v !== undefined && !isNaN(Number(v))) {
            buckets.get(bucketKey)._values.push(Number(v));
          }
        });
        return Array.from(buckets.values()).map(b => {
          const sum = b._values.reduce((acc, c) => acc + c, 0);
          const avg = b._values.length > 0 ? +(sum / b._values.length).toFixed(2) : b.avgValue;
          return {
            ...b,
            avgValue: avg,
            lastValue: b._values.length > 0 ? b._values[b._values.length - 1] : b.lastValue
          };
        });
      };

      // If client-side downsampling from 15-min to 30-min buckets
      if (shouldDownsample30Min) {
        rawSnaps = downsampleSnapsTo30Min(rawSnaps);
        if (tempSetting && Array.isArray(tempSetting.snapshots)) {
          tempSetting = { ...tempSetting, snapshots: downsampleSnapsTo30Min(tempSetting.snapshots) };
        }
        if (humSetting && Array.isArray(humSetting.snapshots)) {
          humSetting = { ...humSetting, snapshots: downsampleSnapsTo30Min(humSetting.snapshots) };
        }
        if (pm25Setting && Array.isArray(pm25Setting.snapshots)) {
          pm25Setting = { ...pm25Setting, snapshots: downsampleSnapsTo30Min(pm25Setting.snapshots) };
        }
        if (pm10Setting && Array.isArray(pm10Setting.snapshots)) {
          pm10Setting = { ...pm10Setting, snapshots: downsampleSnapsTo30Min(pm10Setting.snapshots) };
        }
        if (co2Setting && Array.isArray(co2Setting.snapshots)) {
          co2Setting = { ...co2Setting, snapshots: downsampleSnapsTo30Min(co2Setting.snapshots) };
        }
        if (tvocSetting && Array.isArray(tvocSetting.snapshots)) {
          tvocSetting = { ...tvocSetting, snapshots: downsampleSnapsTo30Min(tvocSetting.snapshots) };
        }
      }

      const lookupTemp = createSnapshotLookup(tempSetting);
      const lookupHum = createSnapshotLookup(humSetting);
      const lookupPm25 = createSnapshotLookup(pm25Setting);
      const lookupPm10 = createSnapshotLookup(pm10Setting);
      const lookupCo2 = createSnapshotLookup(co2Setting);
      const lookupTvoc = createSnapshotLookup(tvocSetting);

      // Sort chronologically ascending
      const sorted = [...rawSnaps].sort((a, b) => new Date(a.windowStart || 0) - new Date(b.windowStart || 0));

      const points = sorted.map(snap => {
        const d = new Date(snap.windowStart || snap.windowEnd);
        const targetMs = d.getTime();
        let val = validateSensorVal(snap.avgValue !== null ? snap.avgValue : snap.lastValue, 'aqi');

        const pointPm25 = validateSensorVal(lookupPm25(targetMs), 'pm25');

        // Fallback: If primary was PM2.5 or AQI was not reported, calculate real AQI from PM2.5 snapshot
        if (val === null && pointPm25 !== null) {
          val = calculateAqiFromPm25(pointPm25);
        }

        const pointTempC = validateSensorVal(lookupTemp(targetMs), 'tempC');
        const pointTempF = pointTempC !== null ? +(pointTempC * 1.8 + 32).toFixed(1) : null;
        const pointHum = validateSensorVal(lookupHum(targetMs), 'hum');
        const pointPm10 = validateSensorVal(lookupPm10(targetMs), 'pm10');
        const pointCo2 = validateSensorVal(lookupCo2(targetMs), 'co2');
        const pointTvoc = validateSensorVal(lookupTvoc(targetMs), 'tvoc');

        const timeStr = formatTimestampByInterval(d, timeRange, samplingInterval);

        return {
          time: timeStr,
          fullDate: d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
          aqi: val,
          pm25: pointPm25,
          pm10: pointPm10,
          co2: pointCo2,
          tvoc: pointTvoc,
          tempC: pointTempC,
          tempF: pointTempF,
          hum: pointHum,
          rawTimestamp: targetMs
        };
      }).filter(p => p.aqi !== null); // Discard any points with no real data

      setHistoricalData(points);
    } catch (err) {
      console.warn('Error fetching historical snapshots:', err);
      if (curRequestId === requestIdRef.current) setHistoricalData([]);
    } finally {
      if (curRequestId === requestIdRef.current) setHistoryLoading(false);
    }
  }, [selectedDeviceId, selectedSiteId, timeRange, samplingInterval]);

  // 5. Polling for Latest Device Events every 30 seconds
  useEffect(() => {
    if (!selectedDeviceId) return;

    fetchLatestRealTelemetry();

    const interval = setInterval(() => {
      fetchLatestRealTelemetry();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedDeviceId, fetchLatestRealTelemetry]);

  // Historical snapshots fetch on device or filter change
  useEffect(() => {
    fetchHistoricalSnapshots();
  }, [fetchHistoricalSnapshots]);

  // 5. WebSocket Live Telemetry Listener
  useEffect(() => {
    const backendUrl = window.process?.env?.REACT_APP_BACKEND_URL || '';
    const socket = io(backendUrl, { path: '/socket.io', transports: ['websocket', 'polling'], autoConnect: false });

    socket.on('connect', () => {
      setIsLiveConnected(true);
      console.log('AQI Sensor WebSocket Connected');
    });

    socket.on('disconnect', () => {
      setIsLiveConnected(false);
    });

    socket.on('telemetry_update', (stats) => {
      if (!Array.isArray(stats) || !selectedDeviceId) return;

      // Filter stats for currently selected device
      const relevant = stats.filter(s =>
        String(s.deviceId) === String(selectedDeviceId) ||
        String(s.moduleId) === String(selectedDeviceId) ||
        String(s.meta?.device_id) === String(selectedDeviceId)
      );

      if (relevant.length > 0) {
        // Collect fields from stat items
        const incomingFields = [];
        relevant.forEach(s => {
          if (s.fields && Array.isArray(s.fields)) incomingFields.push(...s.fields);
          if (s.meta && typeof s.meta === 'object') {
            Object.entries(s.meta).forEach(([k, v]) => {
              incomingFields.push({ displayName: k, currentValue: v });
            });
          }
        });

        const parsed = parseFieldsToTelemetry(incomingFields);
        if (parsed) {
          setLiveTelemetry(prev => ({
            ...prev,
            ...parsed
          }));
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedDeviceId, parseFieldsToTelemetry]);

  // 6. Calculate Real Forecast strictly from real historical points
  // Requires at least 4 real data points to compute regression slope; otherwise returns null
  const forecastData = useMemo(() => {
    if (!historicalData || historicalData.length < 4) return null;

    // Use last 6 points to compute linear slope
    const recent = historicalData.slice(-6);
    const n = recent.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    recent.forEach((p, idx) => {
      sumX += idx;
      sumY += p.aqi;
      sumXY += idx * p.aqi;
      sumX2 += idx * idx;
    });

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const currentVal = recent[recent.length - 1].aqi;

    const points = [
      { label: 'Current', aqi: currentVal },
      { label: '+1 Hr', aqi: Math.max(0, Math.min(500, Math.round(currentVal + slope * 1))) },
      { label: '+2 Hr', aqi: Math.max(0, Math.min(500, Math.round(currentVal + slope * 2))) },
      { label: '+3 Hr', aqi: Math.max(0, Math.min(500, Math.round(currentVal + slope * 3))) },
      { label: '+4 Hr', aqi: Math.max(0, Math.min(500, Math.round(currentVal + slope * 4))) },
      { label: '+5 Hr', aqi: Math.max(0, Math.min(500, Math.round(currentVal + slope * 5))) },
      { label: '6 Hr', aqi: Math.max(0, Math.min(500, Math.round(currentVal + slope * 6))) }
    ];

    return points;
  }, [historicalData]);

  // 7. Calculate Real Sustainability Performance Score (Only from real data)
  const sustainability = useMemo(() => {
    const aqi = liveTelemetry.aqi;
    const co2 = liveTelemetry.co2;

    if (aqi === null && co2 === null) {
      return { score: null, impact: 'Pending Data' };
    }

    let penalty = 0;
    if (aqi !== null) penalty += aqi * 0.4;
    if (co2 !== null && co2 > 400) penalty += (co2 - 400) * 0.03;

    const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
    const impact = score >= 80 ? 'Low' : (score >= 60 ? 'Medium' : 'High');

    return { score, impact };
  }, [liveTelemetry.aqi, liveTelemetry.co2]);

  // 8. Generate Alerts strictly from real incoming telemetry
  const activeAlerts = useMemo(() => {
    const list = [];
    const { aqi, pm25, pm10, co2, tvoc } = liveTelemetry;

    if (pm25 !== null && pm25 > 35) {
      list.push(`PM2.5 elevated (${pm25} µg/m³), check ventilation`);
    }
    if (pm10 !== null && pm10 > 50) {
      list.push(`PM10 above threshold (${pm10} µg/m³)`);
    }
    if (co2 !== null && co2 > 1000) {
      list.push(`High CO₂ concentration (${co2} ppm), increase fresh air`);
    }
    if (tvoc !== null && tvoc > 500) {
      list.push(`High TVOC detected (${tvoc} ppb)`);
    }
    if (aqi !== null && aqi > 100) {
      list.push(`AQI index is ${aqi} (Unhealthy range)`);
    }

    return list;
  }, [liveTelemetry]);

  const aqiCategory = useMemo(() => {
    return getAqiCategory(liveTelemetry.aqi);
  }, [liveTelemetry.aqi]);

  // Header Selectors
  const siteSelector = useMemo(() => {
    const siteOptions = (sites && sites.length > 0)
      ? sites.map(s => ({
          value: String(s.id || s._id || s.siteId),
          label: s.name || s.siteName || `Site ${s.id}`
        }))
      : [{ value: '1', label: 'Main Facility Site' }];

    return {
      value: String(selectedSite?.id || '1'),
      options: siteOptions,
      onChange: (newId) => {
        const match = sites?.find(s => String(s.id || s._id || s.siteId) === String(newId));
        if (match && setSelectedSite) setSelectedSite(match);
      },
      ariaLabel: 'Select Facility Site'
    };
  }, [sites, selectedSite, setSelectedSite]);

  const deviceSelector = useMemo(() => {
    if (devicesLoading) {
      return {
        value: '',
        options: [{ value: '', label: 'Loading sensors...' }],
        disabled: true,
        ariaLabel: 'Loading sensors'
      };
    }

    if (!devices || devices.length === 0) {
      return {
        value: '',
        options: [{ value: '', label: 'No AQI sensors configured' }],
        disabled: true,
        ariaLabel: 'No sensors'
      };
    }

    return {
      value: selectedDeviceId,
      options: devices.map(d => ({
        value: String(d.id || d.deviceId),
        label: d.name || d.deviceName || `Sensor (${d.id})`
      })),
      onChange: (newId) => {
        setSelectedDeviceId(newId);
        localStorage.setItem('selected_aqi_device_id', String(newId));
      },
      ariaLabel: 'Select Sensor Device',
      disabled: false
    };
  }, [devices, devicesLoading, selectedDeviceId]);

  const isDeviceConfigured = Boolean(devices && devices.length > 0);

  return (
    <div className="fade-in aqi-overview-workspace">
      {/* ── PageContextBanner ── */}
      <PageContextBanner
        title={selectedDevice ? (selectedDevice.name || 'AQI Sensor') : 'Environmental Sensor Dashboard'}
        icon={<Leaf className={isDeviceConfigured ? "text-success" : "text-secondary"} size={22} />}
        status={isDeviceConfigured ? (isDeviceOnline ? 'ONLINE' : 'OFFLINE') : 'NOT CONFIGURED'}
        siteSelector={siteSelector}
        deviceSelector={deviceSelector}
        metadata={[
          {
            icon: <Clock size={15} />,
            label: `Live ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
          },
          ...(devices.length > 0 ? [{
            icon: <Activity size={15} />,
            label: `${devices.length} ${devices.length === 1 ? 'Sensor' : 'Sensors'}`
          }] : [])
        ]}
        actions={[
          <Button
            key="temp-toggle"
            variant="outline-secondary"
            size="sm"
            className="context-banner-action-btn d-flex align-items-center gap-1 py-1 px-2.5 rounded-pill fs-8 fw-bold"
            onClick={() => setUseFahrenheit(!useFahrenheit)}
            title="Toggle Temperature Unit (°F / °C)"
          >
            <Thermometer size={14} className="text-info" />
            <span>{useFahrenheit ? '°F' : '°C'}</span>
          </Button>,
          <Button
            key="refresh-btn"
            variant="outline-info"
            size="sm"
            className="context-banner-action-btn d-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill fs-8 fw-semibold"
            onClick={() => {
              fetchLatestRealTelemetry();
              fetchHistoricalSnapshots();
            }}
            disabled={!selectedDeviceId}
            title="Refresh Real Sensor Readings"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </Button>
        ]}
        enableFullscreen={true}
        variant="scada"
        className="aqi-context-banner"
      />

      {/* ── Empty State: No Devices Configured for Site ── */}
      {!devicesLoading && !isDeviceConfigured && (
        <div className="energy-empty-state-card energy-empty-state-darkened text-center py-5">
          <Cpu className="text-secondary opacity-50 mb-3" size={56} />
          <h4 className="text-white fw-bold mb-2">No AQI sensors configured for this site</h4>
          <p className="text-secondary fs-7 mx-auto" style={{ maxWidth: '520px' }}>
            There are currently no environmental or AQI sensors provisioned under the selected site.
            Please add or map an AQI sensor in Device Management or select a different site.
          </p>
        </div>
      )}

      {/* ── Main Dashboard Content (Only when device is configured) ── */}
      {isDeviceConfigured && (
        <>
          <Row className="g-3 mb-3">
            {/* ── 1. AQI Hero Card ── */}
            <Col xl={3} lg={4} md={12}>
              <Card className="aqi-card aqi-hero-card">
                <span className="aqi-hero-label">AQI</span>
                <div className={`aqi-hero-value ${aqiCategory.colorClass}`}>
                  {fmt(liveTelemetry.aqi, 0)}
                </div>
                <div className={`aqi-status-capsule ${aqiCategory.capsuleClass}`}>
                  {aqiCategory.label}
                </div>
                <div className="aqi-hero-alert-box">
                  {liveTelemetry.aqi !== null ? (
                    <>
                      {liveTelemetry.aqi > 100 ? (
                        <AlertTriangle size={16} className="text-warning flex-shrink-0" />
                      ) : (
                        <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                      )}
                      <span className="text-truncate">{aqiCategory.description}</span>
                    </>
                  ) : (
                    <>
                      <Info size={16} className="text-secondary flex-shrink-0" />
                      <span>Awaiting sensor telemetry</span>
                    </>
                  )}
                </div>
              </Card>
            </Col>

            {/* ── 2. Metric Grid Cards (6 Cards) ── */}
            <Col xl={6} lg={8} md={12}>
              <Row className="g-3 h-100">
                {/* Card 1: PM2.5 */}
                <Col sm={4} xs={6}>
                  <Card className="aqi-card aqi-metric-card">
                    <div className="d-flex align-items-center gap-2">
                      <span className="aqi-badge aqi-badge-pm">pm</span>
                      <span className="aqi-metric-title">PM2.5</span>
                    </div>
                    <div className="aqi-metric-value-row">
                      <span className="aqi-metric-value">{fmt(liveTelemetry.pm25, 1)}</span>
                      <span className="aqi-metric-unit">µg/m³</span>
                    </div>
                    <div className="aqi-metric-sublabel text-truncate">Fine Particulates</div>
                  </Card>
                </Col>

                {/* Card 2: PM10 */}
                <Col sm={4} xs={6}>
                  <Card className="aqi-card aqi-metric-card">
                    <div className="d-flex align-items-center gap-2">
                      <span className="aqi-badge aqi-badge-pm">pm</span>
                      <span className="aqi-metric-title">PM10</span>
                    </div>
                    <div className="aqi-metric-value-row">
                      <span className="aqi-metric-value">{fmt(liveTelemetry.pm10, 1)}</span>
                      <span className="aqi-metric-unit">µg/m³</span>
                    </div>
                    <div className="aqi-metric-sublabel text-truncate">Coarse Dust</div>
                  </Card>
                </Col>

                {/* Card 3: Radial Arc Gauge for CO2 */}
                <Col sm={4} xs={12}>
                  <Card className="aqi-card aqi-gauge-card">
                    <RadialArcGauge
                      value={liveTelemetry.co2}
                      min={300}
                      max={2000}
                      unit={liveTelemetry.co2Unit || 'ppm'}
                    />
                  </Card>
                </Col>

                {/* Card 4: CO2 */}
                <Col sm={4} xs={6}>
                  <Card className="aqi-card aqi-metric-card">
                    <div className="d-flex align-items-center gap-2">
                      <span className="aqi-badge aqi-badge-co2">co₂</span>
                      <span className="aqi-metric-title">CO₂</span>
                    </div>
                    <div className="aqi-metric-value-row">
                      <span className="aqi-metric-value">{fmt(liveTelemetry.co2, 0)}</span>
                      <span className="aqi-metric-unit">{liveTelemetry.co2Unit || 'ppm'}</span>
                    </div>
                    <div className="aqi-metric-sublabel">CO2 Concentration</div>
                  </Card>
                </Col>

                {/* Card 5: TVOC */}
                <Col sm={4} xs={6}>
                  <Card className="aqi-card aqi-metric-card">
                    <div className="d-flex align-items-center gap-2">
                      <span className="aqi-badge aqi-badge-tvoc">
                        <ArrowUp size={12} className="me-0.5" /> TVOC
                      </span>
                      <span className="aqi-metric-title">TVOC</span>
                    </div>
                    <div className="aqi-metric-value-row">
                      <span className="aqi-metric-value">{fmt(liveTelemetry.tvoc, 0)}</span>
                      <span className="aqi-metric-unit">{liveTelemetry.tvocUnit || 'ppb'}</span>
                    </div>
                    <div className="aqi-metric-sublabel">Volatile Compounds</div>
                  </Card>
                </Col>

                {/* Card 6: Temperature & Humidity */}
                <Col sm={4} xs={12}>
                  <Card className="aqi-card aqi-metric-card">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5 text-info">
                        <Thermometer size={17} />
                        <span className="fw-black fs-5" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                          {useFahrenheit
                            ? (liveTelemetry.tempF !== null ? `${fmt(liveTelemetry.tempF, 1)}°F` : '—')
                            : (liveTelemetry.tempC !== null ? `${fmt(liveTelemetry.tempC, 1)}°C` : '—')}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <span className="fs-5 fw-black" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                        {liveTelemetry.hum !== null ? `${fmt(liveTelemetry.hum, 0)}%` : '—'}
                      </span>
                    </div>
                    <div className="aqi-metric-sublabel d-flex align-items-center gap-1 text-info">
                      <Droplets size={13} /> Humidity
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>

            {/* ── 3. Right Column Widgets ── */}
            <Col xl={3} lg={12} md={12}>
              <div className="d-flex flex-column gap-3 h-100">
                {/* Widget 1: Sustainability Performance */}
                <Card className="aqi-card aqi-sustainability-card">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="d-flex align-items-center gap-1.5 text-success fw-bold fs-7 mb-1">
                        <Leaf size={16} /> Sustainability
                      </div>
                      <div className="fw-bold fs-6" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                        Performance
                      </div>
                    </div>
                    <div className="aqi-score-ring">
                      {fmt(sustainability.score, 0)}
                    </div>
                  </div>
                  <div className="text-secondary fs-8 mt-2">
                    Carbon Impact: <span className="text-success fw-bold">{sustainability.impact}</span>
                  </div>
                </Card>

                {/* Widget 2: Alerts Panel */}
                <Card className="aqi-card aqi-alerts-card">
                  <div className="d-flex align-items-center gap-2 text-danger fw-bold fs-7 mb-2">
                    <AlertTriangle size={16} /> Alerts
                  </div>
                  {activeAlerts.length > 0 ? (
                    <div className="fs-8 fw-semibold text-warning mb-2.5">
                      {activeAlerts[0]}
                    </div>
                  ) : (
                    <div className="fs-8 fw-semibold text-success mb-2.5 d-flex align-items-center gap-1">
                      <CheckCircle2 size={14} /> Normal operational range
                    </div>
                  )}
                  <div className="aqi-alert-list-item">
                    <span className="text-secondary fs-8">CO₂</span>
                    <span className="font-monospace fw-bold">{fmt(liveTelemetry.co2, 0)} {liveTelemetry.co2Unit ? liveTelemetry.co2Unit.toUpperCase() : 'PPM'}</span>
                  </div>
                  <div className="aqi-alert-list-item">
                    <span className="text-secondary fs-8">TVOC</span>
                    <span className="font-monospace fw-bold">{fmt(liveTelemetry.tvoc, 0)} {liveTelemetry.tvocUnit || 'PPM'}</span>
                  </div>
                  <div className="aqi-alert-list-item">
                    <span className="text-secondary fs-8 d-flex align-items-center gap-1">
                      <Droplets size={13} className="text-info" /> Humidity
                    </span>
                    <span className="font-monospace fw-bold">{fmt(liveTelemetry.hum, 0)}%</span>
                  </div>
                </Card>

                {/* Widget 3: AQI Forecast (Next 6 Hours) */}
                <Card className="aqi-card aqi-forecast-card">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold fs-8" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                      AQI Forecast (Next 6 Hours)
                    </span>
                  </div>
                  {forecastData ? (
                    <>
                      <div className="d-flex align-items-center justify-content-between text-secondary fs-8 mb-1">
                        <span>Current: {forecastData[0].aqi}</span>
                        <span>6 Hr: {forecastData[forecastData.length - 1].aqi}</span>
                      </div>
                      <div style={{ height: '75px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecastData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="label" hide />
                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                            <Area
                              type="monotone"
                              dataKey="aqi"
                              stroke="#f59e0b"
                              strokeWidth={2.5}
                              fill="url(#forecastGrad)"
                              dot={(props) => {
                                const { cx, cy, index } = props;
                                if (index === forecastData.length - 1) {
                                  return (
                                    <circle
                                      key="forecast-peak"
                                      cx={cx}
                                      cy={cy}
                                      r={4.5}
                                      fill="#f59e0b"
                                      stroke="#ffffff"
                                      strokeWidth={2}
                                    />
                                  );
                                }
                                return null;
                              }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="d-flex align-items-center gap-1.5 mt-1 text-secondary fs-8">
                        <span style={{ color: '#f59e0b', fontSize: '12px' }}>●</span> Calculated Forecast
                      </div>
                    </>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center text-center py-3" style={{ height: '95px' }}>
                      <Clock size={20} className="text-secondary opacity-40 mb-1" />
                      <span className="text-secondary fs-8">Forecast pending historical snapshots</span>
                    </div>
                  )}
                </Card>
              </div>
            </Col>
          </Row>

          {/* ── 4. Main Air Quality Over Time Historical Chart ── */}
          <Row className="g-3">
            <Col xs={12}>
              <Card className="aqi-card aqi-main-chart-card">
                <div className="aqi-chart-header">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                      Air Quality Over Time (Past {timeRange === '12h' ? '12 Hours' : (timeRange === '24h' ? '24 Hours' : '7 Days')})
                    </h5>
                    <span className="text-secondary fs-8">
                      {selectedDevice ? `Real telemetry trend for ${selectedDevice.name}` : 'Continuous multi-parameter air quality record'} • {SAMPLING_INTERVALS.find(i => i.value === samplingInterval)?.label || samplingInterval}
                    </span>
                  </div>

                  {/* Range & Sampling Interval Filter Controls */}
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    {/* Time Range Filter Tabs */}
                    <div className="aqi-filter-group">
                      <span className="aqi-filter-label">Range:</span>
                      <button
                        type="button"
                        className={`aqi-time-filter-btn ${timeRange === '12h' ? 'active' : ''}`}
                        onClick={() => handleTimeRangeChange('12h')}
                      >
                        12 Hours
                      </button>
                      <button
                        type="button"
                        className={`aqi-time-filter-btn ${timeRange === '24h' ? 'active' : ''}`}
                        onClick={() => handleTimeRangeChange('24h')}
                      >
                        24 Hours
                      </button>
                      <button
                        type="button"
                        className={`aqi-time-filter-btn ${timeRange === '7d' ? 'active' : ''}`}
                        onClick={() => handleTimeRangeChange('7d')}
                      >
                        7 Days
                      </button>
                    </div>

                    {/* Sampling Interval Filter Tabs */}
                    <div className="aqi-filter-group">
                      <span className="aqi-filter-label">Interval:</span>
                      {SAMPLING_INTERVALS.map(int => (
                        <button
                          key={int.value}
                          type="button"
                          className={`aqi-time-filter-btn ${samplingInterval === int.value ? 'active' : ''}`}
                          onClick={() => setSamplingInterval(int.value)}
                        >
                          {int.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Historical Area Chart */}
                <div style={{ height: '260px', width: '100%' }}>
                  {historyLoading ? (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100">
                      <Spinner animation="border" variant="info" size="sm" className="mb-2" />
                      <span className="text-secondary fs-8">Loading historical snapshots...</span>
                    </div>
                  ) : historicalData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                      <AreaChart data={historicalData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                        <defs>
                          <linearGradient id="aqiZoneGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.65} />
                            <stop offset="45%" stopColor="#eab308" stopOpacity={0.4} />
                            <stop offset="85%" stopColor="#22c55e" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(148, 163, 184, 0.2)'} vertical={false} />
                        <XAxis
                          dataKey="time"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(148, 163, 184, 0.25)' }}
                          dy={6}
                          minTickGap={35}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(148, 163, 184, 0.25)' }}
                          ticks={[0, 50, 100, 150]}
                          domain={[0, 'auto']}
                        />
                        <Tooltip content={<HistoricalChartTooltip useFahrenheit={useFahrenheit} />} />
                        <Area
                          type="monotone"
                          dataKey="aqi"
                          stroke="#f59e0b"
                          strokeWidth={2.8}
                          fill="url(#aqiZoneGradient)"
                          dot={false}
                          activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                          isAnimationActive={true}
                          animationDuration={600}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center text-center h-100 bg-dark bg-opacity-25 rounded-3 border border-secondary border-opacity-10 m-2">
                      <Activity size={36} className="text-secondary opacity-40 mb-2" />
                      <h6 className="text-secondary fs-7 fw-bold mb-1">No historical telemetry recorded</h6>
                      <span className="text-secondary opacity-60 fs-8">
                        No periodic snapshots have been logged for this sensor yet.
                      </span>
                    </div>
                  )}
                </div>

                {/* Threshold Legend Bar */}
                <div className="aqi-threshold-legend">
                  <div className="aqi-legend-segment good">
                    <span className="aqi-legend-dot" style={{ background: '#10b981' }} />
                    <span>Good (0–50)</span>
                  </div>
                  <div className="aqi-legend-segment moderate">
                    <span className="aqi-legend-dot" style={{ background: '#eab308' }} />
                    <span>Moderate (51–100)</span>
                  </div>
                  <div className="aqi-legend-segment unhealthy-sensitive">
                    <span className="aqi-legend-dot" style={{ background: '#f97316' }} />
                    <span>Unhealthy for Sensitive (101–150)</span>
                  </div>
                  <div className="aqi-legend-segment unhealthy">
                    <span className="aqi-legend-dot" style={{ background: '#ef4444' }} />
                    <span>Unhealthy (151+)</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default AQIOverview;
