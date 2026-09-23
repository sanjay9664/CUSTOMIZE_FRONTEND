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

import {
  resolveAqiDeviceTelemetry,
  resolveAqiSnapshots,
  getAqiCategory,
  getThresholdStatusFromSetting,
  formatTimestampByInterval,
  validateSensorVal,
  CANONICAL_AQI_METRICS
} from './utils/aqiTelemetryAdapter.js';
import AqiMetricCard from './components/AqiMetricCard.jsx';

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

// Multi-metric chart display configuration
const CHART_METRIC_CONFIGS = {
  aqi: {
    key: 'aqi',
    label: 'AQI',
    unit: '',
    gradientId: 'aqiZoneGrad',
    strokeColor: '#f59e0b',
    stop0: '#f59e0b',
    stop1: '#10b981',
    domain: [0, 'auto'],
    ticks: [0, 50, 100, 150]
  },
  tempC: {
    key: 'tempC',
    label: 'Temperature',
    unit: '°C',
    altUnit: '°F',
    gradientId: 'tempZoneGrad',
    strokeColor: '#38bdf8',
    stop0: '#38bdf8',
    stop1: '#0284c7',
    domain: ['auto', 'auto'],
    ticks: undefined
  },
  hum: {
    key: 'hum',
    label: 'Humidity',
    unit: '%',
    gradientId: 'humZoneGrad',
    strokeColor: '#06b6d4',
    stop0: '#06b6d4',
    stop1: '#0891b2',
    domain: [0, 100],
    ticks: [0, 25, 50, 75, 100]
  },
  co2: {
    key: 'co2',
    label: 'CO₂',
    unit: 'ppm',
    gradientId: 'co2ZoneGrad',
    strokeColor: '#a855f7',
    stop0: '#a855f7',
    stop1: '#7c3aed',
    domain: [300, 'auto'],
    ticks: undefined
  },
  tvoc: {
    key: 'tvoc',
    label: 'TVOC',
    unit: 'ppb',
    gradientId: 'tvocZoneGrad',
    strokeColor: '#ec4899',
    stop0: '#ec4899',
    stop1: '#be185d',
    domain: [0, 'auto'],
    ticks: undefined
  },
  pm25: {
    key: 'pm25',
    label: 'PM2.5',
    unit: 'µg/m³',
    gradientId: 'pm25ZoneGrad',
    strokeColor: '#eab308',
    stop0: '#eab308',
    stop1: '#ca8a04',
    domain: [0, 'auto'],
    ticks: undefined
  }
};

/**
 * Custom Interactive Tooltip for Historical Area Chart (Multi-Metric Aware)
 */
const HistoricalChartTooltip = ({ active, payload, label, useFahrenheit = false, activeMetric = 'aqi' }) => {
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

  let activeTitle = 'AQI Index:';
  let activeVal = pt.aqi !== null ? `${fmt(pt.aqi, 0)} (${aqiInfo.label})` : '—';
  let activeColor = aqiInfo.colorHex;

  if (activeMetric === 'tempC') {
    activeTitle = 'Temperature:';
    activeVal = displayTemp !== null ? displayTemp : '—';
    activeColor = '#38bdf8';
  } else if (activeMetric === 'hum') {
    activeTitle = 'Humidity:';
    activeVal = pt.hum !== null && pt.hum !== undefined ? `${fmt(pt.hum, 0)}%` : '—';
    activeColor = '#06b6d4';
  } else if (activeMetric === 'co2') {
    activeTitle = 'CO₂:';
    activeVal = pt.co2 !== null && pt.co2 !== undefined ? `${fmt(pt.co2, 0)} ppm` : '—';
    activeColor = '#a855f7';
  } else if (activeMetric === 'tvoc') {
    activeTitle = 'TVOC:';
    activeVal = pt.tvoc !== null && pt.tvoc !== undefined ? `${fmt(pt.tvoc, 0)} ppb` : '—';
    activeColor = '#ec4899';
  } else if (activeMetric === 'pm25') {
    activeTitle = 'PM2.5:';
    activeVal = pt.pm25 !== null && pt.pm25 !== undefined ? `${fmt(pt.pm25, 1)} µg/m³` : '—';
    activeColor = '#eab308';
  }

  return (
    <div className="aqi-chart-tooltip">
      <div className="aqi-chart-tooltip-header">
        {pt.fullDate || label}
      </div>

      <div className="aqi-chart-tooltip-row fw-bold" style={{ color: activeColor }}>
        <span>{activeTitle}</span>
        <span className="font-monospace fs-7">{activeVal}</span>
      </div>

      {activeMetric !== 'aqi' && pt.aqi !== null && pt.aqi !== undefined && (
        <div className="aqi-chart-tooltip-row text-secondary">
          <span>AQI:</span>
          <span className="font-monospace" style={{ color: aqiInfo.colorHex }}>{fmt(pt.aqi, 0)} ({aqiInfo.label})</span>
        </div>
      )}
      {activeMetric !== 'tempC' && displayTemp !== null && (
        <div className="aqi-chart-tooltip-row text-secondary">
          <span>Temperature:</span>
          <span className="text-light font-monospace">{displayTemp}</span>
        </div>
      )}
      {activeMetric !== 'hum' && pt.hum !== null && pt.hum !== undefined && (
        <div className="aqi-chart-tooltip-row text-secondary">
          <span>Humidity:</span>
          <span className="text-light font-monospace">{fmt(pt.hum, 0)}%</span>
        </div>
      )}
      {activeMetric !== 'co2' && pt.co2 !== null && pt.co2 !== undefined && (
        <div className="aqi-chart-tooltip-row text-secondary">
          <span>CO₂:</span>
          <span className="text-light font-monospace">{fmt(pt.co2, 0)} ppm</span>
        </div>
      )}
      {activeMetric !== 'tvoc' && pt.tvoc !== null && pt.tvoc !== undefined && (
        <div className="aqi-chart-tooltip-row text-secondary">
          <span>TVOC:</span>
          <span className="text-light font-monospace">{fmt(pt.tvoc, 0)} ppb</span>
        </div>
      )}
      {activeMetric !== 'pm25' && pt.pm25 !== null && pt.pm25 !== undefined && (
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
    </div>
  );
};

const AQIOverview = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { sites, selectedSite, setSelectedSite } = useSiteStore();
  const { getOverallStatus } = useDeviceStatus();

  const selectedSiteId = useMemo(() => {
    return selectedSite?.id || sites?.[0]?.id || '1';
  }, [selectedSite, sites]);

  const requestIdRef = useRef(0);

  // Devices & channels state
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    const initialSiteId = selectedSite?.id || sites?.[0]?.id || '1';
    return localStorage.getItem(`selected_aqi_device_id_${initialSiteId}`) || '';
  });

  // Configuration-driven live telemetry state
  const [resolvedMetrics, setResolvedMetrics] = useState(() => {
    return resolveAqiDeviceTelemetry(null, {}).resolvedMetrics;
  });
  const [liveTelemetry, setLiveTelemetry] = useState(() => {
    return resolveAqiDeviceTelemetry(null, {}).parsedTelemetry;
  });
  const [availableMetrics, setAvailableMetrics] = useState(['aqi']);
  const [selectedChartMetric, setSelectedChartMetric] = useState('aqi');

  // Historical telemetry snapshots state
  const [historicalData, setHistoricalData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d'); // '12h' | '24h' | '7d'
  const [samplingInterval, setSamplingInterval] = useState('DAILY'); // 'MIN_15' | 'MIN_30' | 'HOURLY' | 'DAILY'

  // View settings
  const [useFahrenheit, setUseFahrenheit] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch real AQI devices for the site (strictly category=AQI_SENSOR)
  useEffect(() => {
    if (!selectedSiteId) {
      setDevices([]);
      setSelectedDeviceId('');
      setDevicesLoading(false);
      return;
    }

    // Synchronously clear stale device state as soon as the site changes
    requestIdRef.current += 1;
    setSelectedDeviceId('');
    setDevices([]);
    setHistoricalData([]);

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
            const savedSiteDeviceId = localStorage.getItem(`selected_aqi_device_id_${selectedSiteId}`);
            const currentInList = aqiDevices.find(d => String(d.id || d.deviceId) === String(savedSiteDeviceId));
            const chosenId = currentInList
              ? String(currentInList.id || currentInList.deviceId)
              : String(aqiDevices[0].id || aqiDevices[0].deviceId);

            setSelectedDeviceId(chosenId);
            localStorage.setItem(`selected_aqi_device_id_${selectedSiteId}`, chosenId);
            localStorage.setItem('selected_aqi_device_id', chosenId);
          } else {
            setSelectedDeviceId('');
            localStorage.removeItem(`selected_aqi_device_id_${selectedSiteId}`);
            localStorage.removeItem('selected_aqi_device_id');
          }
        }
      } catch (err) {
        console.warn('Error fetching AQI devices:', err);
        if (isMounted) {
          setDevices([]);
          setSelectedDeviceId('');
        }
      } finally {
        if (isMounted) setDevicesLoading(false);
      }
    };

    fetchAqiDevices();
    return () => { isMounted = false; };
  }, [selectedSiteId]);

  const selectedDevice = useMemo(() => {
    if (!devices || devices.length === 0 || !selectedDeviceId) return null;
    return devices.find(d => String(d.id || d.deviceId) === String(selectedDeviceId)) || null;
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

  // Synchronize resolved metrics whenever the selected device changes
  useEffect(() => {
    const initial = resolveAqiDeviceTelemetry(selectedDevice, {});
    setResolvedMetrics(initial.resolvedMetrics);
    setLiveTelemetry(initial.parsedTelemetry);

    if (initial.availableMetrics && initial.availableMetrics.length > 0) {
      setAvailableMetrics(initial.availableMetrics);
      setSelectedChartMetric(curr => {
        if (initial.availableMetrics.includes(curr)) return curr;
        return initial.availableMetrics[0] || 'aqi';
      });
    }
  }, [selectedDevice]);

  // 2. Fetch Real-Time Latest Device Events (GET /devices/:id/events/latest)
  const fetchLatestRealTelemetry = useCallback(async () => {
    if (!selectedDeviceId || !selectedSiteId || devicesLoading) {
      const reset = resolveAqiDeviceTelemetry(null, {});
      setLiveTelemetry(reset.parsedTelemetry);
      setResolvedMetrics(reset.resolvedMetrics);
      return;
    }

    // Safety guard: ensure the device belongs to current site's device list
    const currentDevice = devices.find(d => String(d.id || d.deviceId) === String(selectedDeviceId));
    if (!currentDevice) {
      const reset = resolveAqiDeviceTelemetry(null, {});
      setLiveTelemetry(reset.parsedTelemetry);
      setResolvedMetrics(reset.resolvedMetrics);
      return;
    }
    const devSiteId = currentDevice.siteId || currentDevice.site_id || currentDevice.site?.id;
    if (devSiteId && String(devSiteId) !== String(selectedSiteId)) {
      return;
    }

    try {
      const res = await bmsService.getDeviceEventsLatest(selectedDeviceId, selectedSiteId).catch(() => null);
      if (res && res.data) {
        const { parsedTelemetry, resolvedMetrics: updatedSettings, availableMetrics: avail } = resolveAqiDeviceTelemetry(
          selectedDevice,
          res.data
        );

        setLiveTelemetry(prev => ({
          ...prev,
          ...parsedTelemetry
        }));
        setResolvedMetrics(updatedSettings);

        if (avail && avail.length > 0) {
          setAvailableMetrics(prev => {
            const merged = Array.from(new Set([...prev, ...avail]));
            return merged;
          });
        }

        // Add or update latest historical point if real data is available
        const hasAnyVal = parsedTelemetry.aqi !== null || parsedTelemetry.tempC !== null ||
          parsedTelemetry.hum !== null || parsedTelemetry.co2 !== null ||
          parsedTelemetry.tvoc !== null || parsedTelemetry.pm25 !== null;

        if (hasAnyVal) {
          const pointTime = new Date(parsedTelemetry.lastEventTime || Date.now());
          const timeStr = formatTimestampByInterval(pointTime, timeRange, samplingInterval);
          const fullDate = pointTime.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

          setHistoricalData(prev => {
            const newPoint = {
              time: timeStr,
              fullDate,
              aqi: parsedTelemetry.aqi,
              pm25: parsedTelemetry.pm25,
              pm10: parsedTelemetry.pm10,
              co2: parsedTelemetry.co2,
              tvoc: parsedTelemetry.tvoc,
              tempC: parsedTelemetry.tempC,
              tempF: parsedTelemetry.tempF,
              hum: parsedTelemetry.hum,
              rawTimestamp: pointTime.getTime()
            };

            if (prev.length === 0) return [newPoint];
            const last = prev[prev.length - 1];
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
    } catch (err) {
      console.warn('Could not fetch latest real device telemetry:', err);
    }
  }, [selectedDeviceId, selectedSiteId, selectedDevice, devices, devicesLoading, timeRange, samplingInterval]);

  // 3. Fetch Real Historical Snapshots (GET /telemetry/snapshots)
  const fetchHistoricalSnapshots = useCallback(async (overrideRange, overrideInterval) => {
    if (!selectedDeviceId || !selectedSiteId || devicesLoading) {
      setHistoricalData([]);
      return;
    }

    // Safety guard: ensure the device belongs to current site's device list
    const currentDevice = devices.find(d => String(d.id || d.deviceId) === String(selectedDeviceId));
    if (!currentDevice) {
      setHistoricalData([]);
      return;
    }
    const devSiteId = currentDevice.siteId || currentDevice.site_id || currentDevice.site?.id;
    if (devSiteId && String(devSiteId) !== String(selectedSiteId)) {
      setHistoricalData([]);
      return;
    }

    const effectiveRange = overrideRange || timeRange;
    const effectiveInterval = overrideInterval || samplingInterval;

    requestIdRef.current += 1;
    const curRequestId = requestIdRef.current;
    setHistoryLoading(true);

    try {
      const now = new Date();
      let from = new Date();

      if (effectiveRange === '12h') {
        from = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      } else if (effectiveRange === '24h') {
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else {
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Backend validates interval to: "MIN_15" | "HOURLY" | "DAILY" | "MONTHLY"
      // When "MIN_30" is chosen in the UI, request "MIN_15" from backend (never send MIN_30)
      // to avoid 400 VALIDATION_ERROR, and aggregate into 30-min buckets on the client.
      const backendInterval = effectiveInterval === 'MIN_30' ? 'MIN_15' : effectiveInterval;

      const res = await bmsService.getDeviceTelemetrySnapshots(selectedSiteId, selectedDeviceId, {
        interval: backendInterval,
        from: from.toISOString(),
        to: now.toISOString(),
        limit: 1000
      }).catch(() => null);

      if (curRequestId !== requestIdRef.current) return;

      const settings = res?.data?.settings || [];
      const { points, availableMetrics: avail } = resolveAqiSnapshots(
        selectedDevice,
        settings,
        effectiveRange,
        effectiveInterval
      );

      setHistoricalData(points);

      // Populate live telemetry fallback from latest snapshot if live is currently empty
      if (points.length > 0) {
        const latestPoint = points[points.length - 1];
        setLiveTelemetry(prev => ({
          ...prev,
          aqi: prev.aqi !== null ? prev.aqi : latestPoint.aqi,
          pm25: prev.pm25 !== null ? prev.pm25 : latestPoint.pm25,
          pm10: prev.pm10 !== null ? prev.pm10 : latestPoint.pm10,
          co2: prev.co2 !== null ? prev.co2 : latestPoint.co2,
          tvoc: prev.tvoc !== null ? prev.tvoc : latestPoint.tvoc,
          tempC: prev.tempC !== null ? prev.tempC : latestPoint.tempC,
          tempF: prev.tempF !== null ? prev.tempF : latestPoint.tempF,
          hum: prev.hum !== null ? prev.hum : latestPoint.hum
        }));
      }

      if (avail && avail.length > 0) {
        setAvailableMetrics(prev => {
          const merged = Array.from(new Set([...prev, ...avail]));
          return merged;
        });

        // Ensure selected chart metric is valid for this device
        setSelectedChartMetric(curr => {
          if (avail.includes(curr)) return curr;
          return avail[0] || 'aqi';
        });
      }
    } catch (err) {
      console.warn('Error fetching historical snapshots:', err);
      if (curRequestId === requestIdRef.current) setHistoricalData([]);
    } finally {
      if (curRequestId === requestIdRef.current) setHistoryLoading(false);
    }
  }, [selectedDeviceId, selectedSiteId, selectedDevice, devices, devicesLoading, timeRange, samplingInterval]);

  // Immediate filter change handlers
  const handleTimeRangeChange = (newRange) => {
    if (newRange === timeRange) return;
    setTimeRange(newRange);
    fetchHistoricalSnapshots(newRange, samplingInterval);
  };

  const handleIntervalChange = (newInterval) => {
    if (newInterval === samplingInterval) return;
    setSamplingInterval(newInterval);
    fetchHistoricalSnapshots(timeRange, newInterval);
  };

  // 4. Polling for Latest Device Events every 30 seconds
  useEffect(() => {
    if (!selectedDeviceId || !selectedDevice || devicesLoading) return;

    fetchLatestRealTelemetry();

    const interval = setInterval(() => {
      fetchLatestRealTelemetry();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedDeviceId, selectedDevice, devicesLoading, fetchLatestRealTelemetry]);

  // Historical snapshots fetch on device or filter change
  useEffect(() => {
    if (!selectedDeviceId || !selectedDevice || devicesLoading) {
      setHistoricalData([]);
      return;
    }

    fetchHistoricalSnapshots();
  }, [selectedDeviceId, selectedDevice, devicesLoading, fetchHistoricalSnapshots]);

  // 5. WebSocket Live Telemetry Listener
  useEffect(() => {
    if (!selectedDeviceId || !selectedDevice || devicesLoading) return;
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

        const { parsedTelemetry, resolvedMetrics: updatedSettings, availableMetrics: avail } = resolveAqiDeviceTelemetry(
          selectedDevice,
          { fields: incomingFields }
        );

        setLiveTelemetry(prev => ({
          ...prev,
          ...parsedTelemetry
        }));
        setResolvedMetrics(updatedSettings);

        if (avail && avail.length > 0) {
          setAvailableMetrics(prev => Array.from(new Set([...prev, ...avail])));
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedDeviceId, selectedDevice]);

  // 6. Calculate Real Forecast strictly from real historical points
  // Requires at least 4 real data points to compute regression slope; otherwise returns null
  const forecastData = useMemo(() => {
    if (!historicalData || historicalData.length < 4) return null;
    const aqiPoints = historicalData.filter(p => p.aqi !== null && p.aqi !== undefined);
    if (aqiPoints.length < 4) return null;

    // Use last 6 points to compute linear slope
    const recent = aqiPoints.slice(-6);
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
        if (match && setSelectedSite) {
          requestIdRef.current += 1;
          setSelectedDeviceId('');
          setDevices([]);
          setHistoricalData([]);
          setDevicesLoading(true);
          setSelectedSite(match);
        }
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
        if (selectedSiteId) {
          localStorage.setItem(`selected_aqi_device_id_${selectedSiteId}`, String(newId));
        }
        localStorage.setItem('selected_aqi_device_id', String(newId));
      },
      ariaLabel: 'Select Sensor Device',
      disabled: false
    };
  }, [devices, devicesLoading, selectedDeviceId, selectedSiteId]);

  const isDeviceConfigured = Boolean(!devicesLoading && devices && devices.length > 0 && selectedDevice);

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
            disabled={!selectedDeviceId || !isDeviceConfigured || devicesLoading}
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

      {/* ── Loading State ── */}
      {devicesLoading && (
        <div className="energy-empty-state-card energy-empty-state-darkened text-center py-5">
          <Spinner animation="border" variant="info" className="mb-3" />
          <h4 className="text-white fw-bold mb-2">Loading AQI Sensors...</h4>
          <p className="text-secondary fs-7 mx-auto" style={{ maxWidth: '450px' }}>
            Fetching configured environmental sensors for this site.
          </p>
        </div>
      )}

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
            {/* ── 1. AQI / Primary Hero Card ── */}
            <Col xl={3} lg={4} md={12}>
              <Card className="aqi-card aqi-hero-card">
                {resolvedMetrics.aqi?.isConfigured !== false ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <span className="aqi-hero-label">Temperature & Humidity</span>
                    <div className="aqi-hero-value text-info">
                      {useFahrenheit
                        ? (liveTelemetry.tempF !== null ? `${fmt(liveTelemetry.tempF, 1)}°F` : '—')
                        : (liveTelemetry.tempC !== null ? `${fmt(liveTelemetry.tempC, 1)}°C` : '—')}
                    </div>
                    <div className="aqi-status-capsule bg-info bg-opacity-20 text-info">
                      Humidity: {liveTelemetry.hum !== null ? `${fmt(liveTelemetry.hum, 0)}%` : '—'}
                    </div>
                    <div className="aqi-hero-alert-box">
                      <Thermometer size={16} className="text-info flex-shrink-0" />
                      <span className="text-truncate">Environmental Climate Monitor</span>
                    </div>
                  </>
                )}
              </Card>
            </Col>

            {/* ── 2. Metric Grid Cards (6 Cards) ── */}
            <Col xl={6} lg={8} md={12}>
              <Row className="g-3 h-100">
                {/* Card 1: PM2.5 */}
                <Col sm={4} xs={6}>
                  <AqiMetricCard
                    setting={resolvedMetrics.pm25}
                    telemetry={{
                      value: liveTelemetry.pm25,
                      unit: resolvedMetrics.pm25?.unit || 'µg/m³',
                      status: getThresholdStatusFromSetting(liveTelemetry.pm25, resolvedMetrics.pm25)
                    }}
                    displayConfig={{
                      badgeText: 'pm',
                      badgeClass: 'aqi-badge-pm',
                      sublabel: 'Fine Particulates',
                      decimals: 1
                    }}
                    isConfigured={resolvedMetrics.pm25?.isConfigured !== false}
                    onClick={() => availableMetrics.includes('pm25') && setSelectedChartMetric('pm25')}
                  />
                </Col>

                {/* Card 2: PM10 */}
                <Col sm={4} xs={6}>
                  <AqiMetricCard
                    setting={resolvedMetrics.pm10}
                    telemetry={{
                      value: liveTelemetry.pm10,
                      unit: resolvedMetrics.pm10?.unit || 'µg/m³',
                      status: getThresholdStatusFromSetting(liveTelemetry.pm10, resolvedMetrics.pm10)
                    }}
                    displayConfig={{
                      badgeText: 'pm',
                      badgeClass: 'aqi-badge-pm',
                      sublabel: 'Coarse Dust',
                      decimals: 1
                    }}
                    isConfigured={resolvedMetrics.pm10?.isConfigured !== false}
                  />
                </Col>

                {/* Card 3: Radial Arc Gauge for CO2 */}
                <Col sm={4} xs={12}>
                  <Card className="aqi-card aqi-gauge-card h-100">
                    <RadialArcGauge
                      value={liveTelemetry.co2}
                      min={300}
                      max={2000}
                      unit={liveTelemetry.co2Unit || resolvedMetrics.co2?.unit || 'ppm'}
                    />
                  </Card>
                </Col>

                {/* Card 4: CO2 */}
                <Col sm={4} xs={6}>
                  <AqiMetricCard
                    setting={resolvedMetrics.co2}
                    telemetry={{
                      value: liveTelemetry.co2,
                      unit: liveTelemetry.co2Unit || resolvedMetrics.co2?.unit || 'ppm',
                      status: getThresholdStatusFromSetting(liveTelemetry.co2, resolvedMetrics.co2)
                    }}
                    displayConfig={{
                      badgeText: 'co₂',
                      badgeClass: 'aqi-badge-co2',
                      sublabel: 'CO2 Concentration',
                      decimals: 0
                    }}
                    isConfigured={resolvedMetrics.co2?.isConfigured !== false}
                    onClick={() => availableMetrics.includes('co2') && setSelectedChartMetric('co2')}
                  />
                </Col>

                {/* Card 5: TVOC */}
                <Col sm={4} xs={6}>
                  <AqiMetricCard
                    setting={resolvedMetrics.tvoc}
                    telemetry={{
                      value: liveTelemetry.tvoc,
                      unit: liveTelemetry.tvocUnit || resolvedMetrics.tvoc?.unit || 'ppb',
                      status: getThresholdStatusFromSetting(liveTelemetry.tvoc, resolvedMetrics.tvoc)
                    }}
                    displayConfig={{
                      badgeText: 'TVOC',
                      badgeClass: 'aqi-badge-tvoc',
                      sublabel: 'Volatile Compounds',
                      decimals: 0
                    }}
                    isConfigured={resolvedMetrics.tvoc?.isConfigured !== false}
                    onClick={() => availableMetrics.includes('tvoc') && setSelectedChartMetric('tvoc')}
                  />
                </Col>

                {/* Card 6: Temperature & Humidity */}
                <Col sm={4} xs={12}>
                  <Card className="aqi-card aqi-metric-card h-100">
                    <div
                      className="d-flex align-items-center justify-content-between cursor-pointer"
                      onClick={() => availableMetrics.includes('tempC') && setSelectedChartMetric('tempC')}
                      title="Click to view Temperature trend"
                    >
                      <div className="d-flex align-items-center gap-1.5 text-info">
                        <Thermometer size={17} />
                        <span className="aqi-metric-title">
                          {resolvedMetrics.tempC?.displayName || 'Temperature'}
                        </span>
                      </div>
                      <span className="fw-black fs-5" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                        {useFahrenheit
                          ? (liveTelemetry.tempF !== null ? `${fmt(liveTelemetry.tempF, 1)}°F` : '—')
                          : (liveTelemetry.tempC !== null ? `${fmt(liveTelemetry.tempC, 1)}°C` : '—')}
                      </span>
                    </div>
                    <div
                      className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-secondary border-opacity-10 cursor-pointer"
                      onClick={() => availableMetrics.includes('hum') && setSelectedChartMetric('hum')}
                      title="Click to view Humidity trend"
                    >
                      <div className="d-flex align-items-center gap-1.5 text-info">
                        <Droplets size={16} />
                        <span className="aqi-metric-title">
                          {resolvedMetrics.hum?.displayName || 'Humidity'}
                        </span>
                      </div>
                      <span className="fs-5 fw-black" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                        {liveTelemetry.hum !== null ? `${fmt(liveTelemetry.hum, 0)}%` : '—'}
                      </span>
                    </div>
                    <div className="aqi-metric-sublabel d-flex align-items-center justify-content-between mt-auto pt-1">
                      <span>Ambient Climate</span>
                      <span className="text-secondary fs-9">{useFahrenheit ? '°F' : '°C'}</span>
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

          {/* ── 4. Main Environmental Trend Historical Chart ── */}
          <Row className="g-3">
            <Col xs={12}>
              <Card className="aqi-card aqi-main-chart-card">
                <div className="aqi-chart-header">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
                      {CHART_METRIC_CONFIGS[selectedChartMetric]?.label || 'Air Quality'} Over Time (Past {timeRange === '12h' ? '12 Hours' : (timeRange === '24h' ? '24 Hours' : '7 Days')})
                    </h5>
                    <span className="text-secondary fs-8">
                      {selectedDevice ? `Real telemetry trend for ${selectedDevice.name}` : 'Continuous multi-parameter environmental record'} • {SAMPLING_INTERVALS.find(i => i.value === samplingInterval)?.label || samplingInterval}
                    </span>
                  </div>

                  {/* Range, Interval & Metric Filter Controls */}
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    {/* Multi-Metric Selector Tabs */}
                    <div className="aqi-filter-group">
                      <span className="aqi-filter-label">Metric:</span>
                      {['aqi', 'tempC', 'hum', 'co2', 'tvoc', 'pm25']
                        .filter(m => availableMetrics.includes(m))
                        .map(m => {
                          const cfg = CHART_METRIC_CONFIGS[m];
                          if (!cfg) return null;
                          return (
                            <button
                              key={m}
                              type="button"
                              className={`aqi-time-filter-btn ${selectedChartMetric === m ? 'active' : ''}`}
                              onClick={() => setSelectedChartMetric(m)}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                    </div>

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
                          onClick={() => handleIntervalChange(int.value)}
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
                  ) : (() => {
                    const metricCfg = CHART_METRIC_CONFIGS[selectedChartMetric] || CHART_METRIC_CONFIGS.aqi;
                    const chartDataKey = selectedChartMetric === 'tempC' && useFahrenheit ? 'tempF' : selectedChartMetric;
                    const hasMetricData = historicalData.some(p => p[chartDataKey] !== null && p[chartDataKey] !== undefined);

                    if (!hasMetricData) {
                      return (
                        <div className="d-flex flex-column align-items-center justify-content-center text-center h-100 bg-dark bg-opacity-25 rounded-3 border border-secondary border-opacity-10 m-2">
                          <Activity size={36} className="text-secondary opacity-40 mb-2" />
                          <h6 className="text-secondary fs-7 fw-bold mb-1">No historical {metricCfg.label} telemetry recorded</h6>
                          <span className="text-secondary opacity-60 fs-8">
                            No periodic snapshots have been logged for this parameter yet.
                          </span>
                        </div>
                      );
                    }

                    return (
                      <ResponsiveContainer width="100%" height="100%" debounce={100}>
                        <AreaChart data={historicalData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                          <defs>
                            <linearGradient id={metricCfg.gradientId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={metricCfg.stop0} stopOpacity={0.65} />
                              <stop offset="45%" stopColor={metricCfg.stop1} stopOpacity={0.35} />
                              <stop offset="85%" stopColor={metricCfg.stop1} stopOpacity={0.12} />
                              <stop offset="100%" stopColor={metricCfg.stop1} stopOpacity={0.02} />
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
                            ticks={metricCfg.ticks}
                            domain={metricCfg.domain}
                            unit={selectedChartMetric === 'tempC' ? (useFahrenheit ? '°F' : '°C') : (metricCfg.unit ? ` ${metricCfg.unit}` : '')}
                          />
                          <Tooltip content={<HistoricalChartTooltip useFahrenheit={useFahrenheit} activeMetric={selectedChartMetric} />} />
                          <Area
                            type="monotone"
                            dataKey={chartDataKey}
                            stroke={metricCfg.strokeColor}
                            strokeWidth={2.8}
                            fill={`url(#${metricCfg.gradientId})`}
                            dot={false}
                            activeDot={{ r: 6, fill: metricCfg.strokeColor, stroke: '#ffffff', strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={600}
                            connectNulls={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>

                {/* Dynamic Threshold Legend Bar */}
                {selectedChartMetric === 'tempC' ? (
                  <div className="aqi-threshold-legend">
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#38bdf8' }} />
                      <span>Cool ({useFahrenheit ? '< 68°F' : '< 20°C'})</span>
                    </div>
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#10b981' }} />
                      <span>Comfort ({useFahrenheit ? '68–79°F' : '20–26°C'})</span>
                    </div>
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#f97316' }} />
                      <span>Warm ({useFahrenheit ? '> 79°F' : '> 26°C'})</span>
                    </div>
                  </div>
                ) : selectedChartMetric === 'hum' ? (
                  <div className="aqi-threshold-legend">
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#f59e0b' }} />
                      <span>Dry (&lt; 30%)</span>
                    </div>
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#10b981' }} />
                      <span>Optimal (30–60%)</span>
                    </div>
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#06b6d4' }} />
                      <span>Humid (&gt; 60%)</span>
                    </div>
                  </div>
                ) : selectedChartMetric === 'co2' ? (
                  <div className="aqi-threshold-legend">
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#10b981' }} />
                      <span>Good (&lt; 800 ppm)</span>
                    </div>
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#f59e0b' }} />
                      <span>Moderate (800–1200 ppm)</span>
                    </div>
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#ef4444' }} />
                      <span>Elevated (&gt; 1200 ppm)</span>
                    </div>
                  </div>
                ) : selectedChartMetric === 'tvoc' ? (
                  <div className="aqi-threshold-legend">
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#10b981' }} />
                      <span>Good (&lt; 300 ppb)</span>
                    </div>
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#f59e0b' }} />
                      <span>Moderate (300–1000 ppb)</span>
                    </div>
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#ef4444' }} />
                      <span>Elevated (&gt; 1000 ppb)</span>
                    </div>
                  </div>
                ) : selectedChartMetric === 'pm25' ? (
                  <div className="aqi-threshold-legend">
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#10b981' }} />
                      <span>Good (0–12 µg/m³)</span>
                    </div>
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#eab308' }} />
                      <span>Moderate (12.1–35.4 µg/m³)</span>
                    </div>
                    <div className="aqi-legend-segment">
                      <span className="aqi-legend-dot" style={{ background: '#ef4444' }} />
                      <span>Unhealthy (&gt; 35.4 µg/m³)</span>
                    </div>
                  </div>
                ) : (
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
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default AQIOverview;
