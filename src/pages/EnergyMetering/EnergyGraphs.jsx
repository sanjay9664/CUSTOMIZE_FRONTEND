import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Row, Col, Card, Button, Form, Modal, Spinner, InputGroup } from 'react-bootstrap';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  Zap,
  Activity,
  Clock,
  Search,
  Maximize2,
  X,
  RefreshCw,
  Sliders,
  Cpu,
  AlertTriangle,
  Grid,
  Columns
} from 'lucide-react';
import PageContextBanner from '../../components/PageContextBanner';
import PdfButton from '../../components/PdfButton';
import { useSiteStore } from '../../context/SiteContext';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
import { bmsService } from '../../services/bmsService';
import { getApiUrl } from '../../utils/apiConfig';
import { getAuthHeaders, normalizeList } from '../../services/apiClient';
import { MAIN_METER_FIELDS_METADATA } from './utils/energyTelemetry';
import './EnergyGraphs.css';

// Sampling intervals supported by OpenAPI endpoint
const SAMPLING_INTERVALS = [
  { label: '15-Min', value: 'MIN_15' },
  { label: 'Hourly', value: 'HOURLY' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Monthly', value: 'MONTHLY' }
];

// Time range presets
const RANGE_PRESETS = [
  { id: 'last24h', label: 'Last 24 Hours', defaultInterval: 'HOURLY' },
  { id: 'today', label: 'Today', defaultInterval: 'MIN_15' },
  { id: 'last7d', label: 'Last 7 Days', defaultInterval: 'HOURLY' },
  { id: 'last30d', label: 'Last 30 Days', defaultInterval: 'DAILY' },
  { id: 'month', label: 'This Month', defaultInterval: 'DAILY' }
];

// Curated SCADA graph palette for distinct, high-visibility telemetry visualizations
const GRAPH_PALETTES = [
  { stroke: '#06b6d4', fill: '#0891b2', name: 'Cyan' },
  { stroke: '#10b981', fill: '#059669', name: 'Emerald' },
  { stroke: '#38bdf8', fill: '#0284c7', name: 'Sky' },
  { stroke: '#f59e0b', fill: '#d97706', name: 'Amber' },
  { stroke: '#8b5cf6', fill: '#7c3aed', name: 'Purple' },
  { stroke: '#ec4899', fill: '#db2777', name: 'Pink' },
  { stroke: '#6366f1', fill: '#4f46e5', name: 'Indigo' },
  { stroke: '#14b8a6', fill: '#0d9488', name: 'Teal' },
  { stroke: '#f97316', fill: '#ea580c', name: 'Orange' },
  { stroke: '#ef4444', fill: '#dc2626', name: 'Red' }
];

/**
 * Parses UTC/GMT timestamps from backend into JavaScript Date object
 * Guaranteed to interpret GMT/UTC timestamps properly
 */
const parseUtcDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;

  if (typeof dateVal === 'number') {
    const ms = dateVal < 1e11 ? dateVal * 1000 : dateVal;
    return new Date(ms);
  }

  let str = String(dateVal).trim();
  if (!str) return null;

  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    const ms = num < 1e11 ? num * 1000 : num;
    return new Date(ms);
  }

  // Normalize "YYYY-MM-DD HH:mm:ss" to "YYYY-MM-DDTHH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
  }

  // If missing timezone indicator, append 'Z' so it is treated as UTC/GMT
  if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str += 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Calculates start and end ISO 8601 UTC strings based on range preset
 * Considers Indian Standard Time (IST) calendar boundaries for "Today" and "This Month"
 */
const calculateDateRange = (presetId) => {
  const now = new Date();
  let from = new Date();

  switch (presetId) {
    case 'today': {
      // Start of day in IST (00:00:00 IST = UTC+05:30)
      const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
      from = new Date(`${istDateStr}T00:00:00+05:30`);
      break;
    }
    case 'last7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'month': {
      // Start of month in IST (00:00:00 IST of 1st day)
      const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const [year, month] = istDateStr.split('-');
      from = new Date(`${year}-${month}-01T00:00:00+05:30`);
      break;
    }
    case 'last24h':
    default:
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
  }

  return {
    from: from.toISOString(),
    to: now.toISOString()
  };
};

/**
 * Formats snapshot timestamps to Indian Standard Time (IST, UTC+05:30)
 */
const formatTimestampLabel = (dateStr, interval, rangePreset) => {
  if (!dateStr) return '';
  const date = parseUtcDate(dateStr);
  if (!date) return String(dateStr);

  const istOptions = { timeZone: 'Asia/Kolkata' };

  switch (interval) {
    case 'MIN_15':
      return date.toLocaleTimeString('en-IN', { ...istOptions, hour: '2-digit', minute: '2-digit', hour12: false });
    case 'HOURLY':
      if (rangePreset === 'last7d' || rangePreset === 'last30d') {
        const day = date.toLocaleDateString('en-IN', { ...istOptions, month: 'short', day: 'numeric' });
        const time = date.toLocaleTimeString('en-IN', { ...istOptions, hour: '2-digit', minute: '2-digit', hour12: false });
        return `${day} ${time}`;
      }
      return date.toLocaleTimeString('en-IN', { ...istOptions, hour: '2-digit', minute: '2-digit', hour12: false });
    case 'DAILY':
      return date.toLocaleDateString('en-IN', { ...istOptions, month: 'short', day: 'numeric' });
    case 'MONTHLY':
      return date.toLocaleDateString('en-IN', { ...istOptions, month: 'short', year: 'numeric' });
    default:
      return date.toLocaleTimeString('en-IN', { ...istOptions, hour: '2-digit', minute: '2-digit', hour12: false });
  }
};

/**
 * Formats full timestamp range in Indian Standard Time (IST) for custom tooltip
 */
const formatTooltipWindow = (startStr, endStr) => {
  if (!startStr) return '';
  const startDate = parseUtcDate(startStr);
  if (!startDate) return String(startStr);

  const istOptions = { timeZone: 'Asia/Kolkata' };
  const startDay = startDate.toLocaleDateString('en-IN', { ...istOptions, month: 'short', day: 'numeric' });
  const startTime = startDate.toLocaleTimeString('en-IN', { ...istOptions, hour: '2-digit', minute: '2-digit', hour12: false });
  const startFmt = `${startDay}, ${startTime}`;

  if (!endStr) return `${startFmt} IST`;
  const endDate = parseUtcDate(endStr);
  if (!endDate) return `${startFmt} – ${endStr} IST`;

  const endDay = endDate.toLocaleDateString('en-IN', { ...istOptions, month: 'short', day: 'numeric' });
  const endTime = endDate.toLocaleTimeString('en-IN', { ...istOptions, hour: '2-digit', minute: '2-digit', hour12: false });

  if (startDay === endDay) {
    return `${startDay}, ${startTime} – ${endTime} IST`;
  }
  return `${startFmt} – ${endDay}, ${endTime} IST`;
};

/**
 * Format numeric value cleanly with max decimals
 */
const formatVal = (val, maxDecimals = 2) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  const num = Number(val);
  return Number.isInteger(num) ? num.toString() : num.toFixed(maxDecimals);
};

/**
 * Determines whether a setting is cumulative (energy consumption)
 */
const isCumulativeSetting = (setting) => {
  if (setting.isCumulative === true) return true;
  const unit = String(setting.unit || '').toUpperCase();
  if (unit === 'KWH' || unit === 'KVAH' || unit === 'KVARH') return true;
  const name = String(setting.displayName || setting.name || '').toUpperCase();
  return name.includes('ENERGY') || name.includes('CONSUMPTION') || name.includes('CUMULATIVE') || name.includes('KWH') || name.includes('KVAH');
};

/**
 * Custom SCADA Glassmorphic Tooltip (with IST Time Window)
 */
const ScadaTooltip = ({ active, payload, unit, isCumulative, color }) => {
  if (!active || !payload || !payload.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  return (
    <div className="scada-custom-tooltip">
      <div className="scada-tooltip-time">
        {formatTooltipWindow(pt.rawStart, pt.rawEnd)}
      </div>
      <div className="scada-tooltip-row mb-1" style={{ color: color || '#38bdf8' }}>
        <span>{isCumulative ? 'Delta (Consumption)' : 'Average Value'}:</span>
        <span className="ms-2 font-monospace">{formatVal(pt.plotValue)} {unit || ''}</span>
      </div>
      {pt.lastValue !== null && pt.lastValue !== undefined && (
        <div className="d-flex justify-content-between text-secondary fs-8 mb-0.5">
          <span>Last Reading:</span>
          <span className="text-light ms-2 font-monospace">{formatVal(pt.lastValue)} {unit || ''}</span>
        </div>
      )}
      {pt.minValue !== null && pt.minValue !== undefined && pt.maxValue !== null && pt.maxValue !== undefined && (
        <div className="d-flex justify-content-between text-secondary fs-8 mb-0.5">
          <span>Min / Max:</span>
          <span className="text-light ms-2 font-monospace">{formatVal(pt.minValue)} / {formatVal(pt.maxValue)}</span>
        </div>
      )}
      {pt.readingCount !== null && pt.readingCount !== undefined && (
        <div className="d-flex justify-content-between text-secondary fs-8">
          <span>Readings:</span>
          <span className="text-info ms-2 font-monospace">{pt.readingCount}</span>
        </div>
      )}
      {pt.alarmState && pt.alarmState !== 'NORMAL' && (
        <div className="mt-1 pt-1 border-top border-secondary border-opacity-25 text-warning fs-8 fw-bold">
          Status: {pt.alarmState}
        </div>
      )}
    </div>
  );
};

/**
 * Individual Telemetry Graph Card
 */
const TelemetryGraphCard = ({
  setting,
  interval,
  rangePreset,
  colorScheme,
  onExpand,
  initialChartType = null,
  isExpanded = false,
  height = 250
}) => {
  const isCumulative = useMemo(() => isCumulativeSetting(setting), [setting]);
  const defaultChartType = isCumulative ? 'bar' : 'area';
  const [chartType, setChartType] = useState(initialChartType || defaultChartType);

  // In expanded modal mode, the parent modal controls chartType directly
  const activeChartType = isExpanded ? (initialChartType || defaultChartType) : chartType;

  // Transform raw snapshots into recharts data points
  const { chartData, stats } = useMemo(() => {
    const rawSnapshots = setting.snapshots || [];
    if (!Array.isArray(rawSnapshots) || rawSnapshots.length === 0) {
      return { chartData: [], stats: null };
    }

    // Sort snapshots chronologically ascending by windowStart
    const sorted = [...rawSnapshots].sort((a, b) => {
      const timeA = (parseUtcDate(a.windowStart || a.time) || new Date(0)).getTime();
      const timeB = (parseUtcDate(b.windowStart || b.time) || new Date(0)).getTime();
      return timeA - timeB;
    });

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let validCount = 0;
    let cumulativeSum = 0;

    const data = sorted.map((snap) => {
      // For cumulative energy, use delta (consumption in period), fallback to sumValue, lastValue, or avgValue
      // For continuous analog signals (voltage, current, etc.), use avgValue, fallback to lastValue
      let val = null;
      if (isCumulative) {
        val = snap.delta !== null && snap.delta !== undefined
          ? Number(snap.delta)
          : (snap.sumValue !== null && snap.sumValue !== undefined
              ? Number(snap.sumValue)
              : (snap.lastValue !== null && snap.lastValue !== undefined ? Number(snap.lastValue) : Number(snap.avgValue)));
      } else {
        val = snap.avgValue !== null && snap.avgValue !== undefined
          ? Number(snap.avgValue)
          : (snap.lastValue !== null && snap.lastValue !== undefined
              ? Number(snap.lastValue)
              : Number(snap.firstValue));
      }

      if (val !== null && !isNaN(val)) {
        if (val < min) min = val;
        if (val > max) max = val;
        sum += val;
        validCount += 1;
        cumulativeSum += val;
      }

      return {
        time: formatTimestampLabel(snap.windowStart, interval, rangePreset),
        plotValue: val !== null && !isNaN(val) ? Number(val.toFixed(3)) : null,
        rawStart: snap.windowStart,
        rawEnd: snap.windowEnd,
        avgValue: snap.avgValue,
        minValue: snap.minValue,
        maxValue: snap.maxValue,
        lastValue: snap.lastValue,
        firstValue: snap.firstValue,
        delta: snap.delta,
        readingCount: snap.readingCount,
        alarmState: snap.alarmState
      };
    });

    const lastPoint = data[data.length - 1];
    const computedStats = validCount > 0 ? {
      latest: lastPoint?.plotValue,
      min: min !== Infinity ? min : null,
      max: max !== -Infinity ? max : null,
      avg: validCount > 0 ? sum / validCount : null,
      totalDelta: isCumulative ? cumulativeSum : null
    } : null;

    return { chartData: data, stats: computedStats };
  }, [setting.snapshots, interval, rangePreset, isCumulative]);

  const hasData = chartData.length > 0;
  const gradientId = `grad_${(setting.settingId || setting.fieldKey || 'card').toString().replace(/[^a-zA-Z0-9]/g, '_')}`;

  const renderChart = (chartHeight) => {
    if (!hasData) {
      return (
        <div className="scada-graph-empty" style={{ height: `${chartHeight}px` }}>
          <Activity size={32} className="text-secondary opacity-40 mb-2" />
          <h6 className="text-secondary fs-7 fw-bold mb-1">No telemetry data available</h6>
          <span className="text-secondary opacity-60 fs-8">
            No snapshots recorded for this setting in the selected interval.
          </span>
        </div>
      );
    }

    const ChartComp = activeChartType === 'bar' ? BarChart : (activeChartType === 'line' ? LineChart : AreaChart);

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ChartComp data={chartData} margin={{ top: 12, right: 16, left: -10, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorScheme.stroke} stopOpacity={0.65} />
              <stop offset="95%" stopColor={colorScheme.stroke} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
            tick={{ fill: '#94a3b8' }}
            dy={6}
            minTickGap={25}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
            tick={{ fill: '#94a3b8' }}
            dx={-4}
            width={55}
            domain={['auto', 'auto']}
          />
          <Tooltip
            content={<ScadaTooltip unit={setting.unit} isCumulative={isCumulative} color={colorScheme.stroke} />}
            cursor={activeChartType === 'bar' ? { fill: 'rgba(255, 255, 255, 0.04)' } : { stroke: colorScheme.stroke, strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          {activeChartType === 'bar' && (
            <Bar
              dataKey="plotValue"
              name={setting.displayName}
              fill={colorScheme.stroke}
              radius={[3, 3, 0, 0]}
              maxBarSize={40}
              isAnimationActive={true}
              animationDuration={800}
            />
          )}
          {activeChartType === 'line' && (
            <Line
              type="monotone"
              dataKey="plotValue"
              name={setting.displayName}
              stroke={colorScheme.stroke}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: colorScheme.stroke, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={800}
            />
          )}
          {activeChartType === 'area' && (
            <Area
              type="monotone"
              dataKey="plotValue"
              name={setting.displayName}
              stroke={colorScheme.stroke}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 5, fill: colorScheme.stroke, stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={800}
            />
          )}
        </ChartComp>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={`scada-graph-card h-100 ${isExpanded ? 'scada-graph-card-expanded' : ''}`}>
      {/* Top accent line (only in card mode) */}
      {!isExpanded && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px',
          background: `linear-gradient(90deg, transparent, ${colorScheme.stroke}, transparent)`,
          opacity: 0.85
        }} />
      )}

      {/* Card Header (only rendered in regular card mode; omitted in modal to eliminate duplicate heading bar) */}
      {!isExpanded && (
        <div className="scada-graph-header">
          <div className="scada-graph-title-group">
            <div className="scada-graph-color-bar" style={{ background: colorScheme.stroke, boxShadow: `0 0 8px ${colorScheme.stroke}88` }} />
            <div className="d-flex flex-column">
              <h5 className="scada-graph-title" title={setting.displayName}>
                {setting.displayName}
              </h5>
              <div className="d-flex align-items-center gap-1.5 mt-0.5">
                {setting.fieldKey && (
                  <span className="scada-graph-tag">{setting.fieldKey}</span>
                )}
                {setting.unit && (
                  <span className="scada-graph-unit">{setting.unit}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="d-flex align-items-center gap-1.5">
            <div className="btn-group btn-group-sm" role="group" aria-label="Chart Type Switcher">
              <Button
                variant={chartType === 'area' ? 'info' : 'outline-secondary'}
                size="sm"
                className="py-0.5 px-2 fs-8"
                onClick={() => setChartType('area')}
                title="Area Chart"
              >
                Area
              </Button>
              <Button
                variant={chartType === 'line' ? 'info' : 'outline-secondary'}
                size="sm"
                className="py-0.5 px-2 fs-8"
                onClick={() => setChartType('line')}
                title="Line Chart"
              >
                Line
              </Button>
              <Button
                variant={chartType === 'bar' ? 'info' : 'outline-secondary'}
                size="sm"
                className="py-0.5 px-2 fs-8"
                onClick={() => setChartType('bar')}
                title="Bar Chart"
              >
                Bar
              </Button>
            </div>

            {onExpand && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="p-1 border-0 text-info hover-glow ms-1"
                onClick={() => onExpand(setting, chartType, colorScheme)}
                title="Expand Graph"
                disabled={!hasData}
              >
                <Maximize2 size={15} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Stats Ribbon */}
      {stats && (
        <div className="scada-graph-stats">
          <div className="scada-stat-item">
            <span className="scada-stat-label">Latest:</span>
            <span className="scada-stat-value text-info">{formatVal(stats.latest)}</span>
          </div>
          <div className="scada-stat-item">
            <span className="scada-stat-label">Min:</span>
            <span className="scada-stat-value">{formatVal(stats.min)}</span>
          </div>
          <div className="scada-stat-item">
            <span className="scada-stat-label">Max:</span>
            <span className="scada-stat-value">{formatVal(stats.max)}</span>
          </div>
          <div className="scada-stat-item">
            <span className="scada-stat-label">Avg:</span>
            <span className="scada-stat-value">{formatVal(stats.avg)}</span>
          </div>
          {isCumulative && stats.totalDelta !== null && (
            <div className="scada-stat-item ms-auto">
              <span className="scada-stat-label text-warning">Total Delta:</span>
              <span className="scada-stat-value text-warning">{formatVal(stats.totalDelta)} {setting.unit || ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Graph Body */}
      <div className="scada-graph-body">
        {renderChart(height)}
      </div>
    </Card>
  );
};

/**
 * Main EnergyGraphs Component
 */
const EnergyGraphs = () => {
  const { sites, selectedSite, setSelectedSite } = useSiteStore();
  const { getOverallStatus } = useDeviceStatus();

  // Sites state
  const [routeSites, setRouteSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    return localStorage.getItem('selected_main_meter_site_id') || '';
  });

  // Devices state
  const [siteDevices, setSiteDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return localStorage.getItem('selected_main_meter_id') || '';
  });

  // Filter and view states
  const [activeInterval, setActiveInterval] = useState('HOURLY');
  const [rangePreset, setRangePreset] = useState('last24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [gridColumns, setGridColumns] = useState(2); // 1 = wide, 2 = grid

  // Telemetry API state
  const [telemetryData, setTelemetryData] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  const [telemetryError, setTelemetryError] = useState(null);

  // Per-setting individual overrides (allows updating only selected event without whole-page refresh)
  const [settingOverrides, setSettingOverrides] = useState({});

  // Modal Expand state: track setting object and setting key
  const [expandedSetting, setExpandedSetting] = useState(null);
  const [expandedSettingKey, setExpandedSettingKey] = useState(null);
  const [expandedChartType, setExpandedChartType] = useState('area');
  const [expandedColorScheme, setExpandedColorScheme] = useState(GRAPH_PALETTES[0]);

  // Dedicated modal controls state (independent of main page)
  const [modalInterval, setModalInterval] = useState('HOURLY');
  const [modalRangePreset, setModalRangePreset] = useState('last24h');
  const [modalSnapshots, setModalSnapshots] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Stale request race condition prevention token
  const requestIdRef = useRef(0);

  // 1. Fetch available sites
  useEffect(() => {
    let isMounted = true;
    const fetchSites = async () => {
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
        console.warn('bmsService.getSites notice in EnergyGraphs:', err);
      }

      // Fallback direct proxy fetch
      try {
        const url = getApiUrl('/sites');
        const res = await fetch(url, { headers: getAuthHeaders() }).catch(() => null);
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
        console.warn('Could not fetch sites in EnergyGraphs:', err);
      }

      if (isMounted && sites && sites.length > 0) {
        setRouteSites(sites);
      }
    };

    fetchSites();
    return () => { isMounted = false; };
  }, [sites]);

  const allSites = useMemo(() => {
    if (routeSites && routeSites.length > 0) return routeSites;
    if (sites && sites.length > 0) return sites;
    return [];
  }, [routeSites, sites]);

  // Synchronize initial selected site
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

  // 2. Fetch devices for selected site
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDevices([]);
      setSelectedDeviceId('');
      setTelemetryData(null);
      setTelemetryError(null);
      setSettingOverrides({});
      return;
    }

    let isMounted = true;
    const fetchSiteDevices = async () => {
      setDevicesLoading(true);
      setTelemetryData(null);
      setTelemetryError(null);
      setSettingOverrides({});

      try {
        let items = [];

        // Try site-scoped device listing
        try {
          const siteDevRes = await bmsService.getSiteDevices(selectedSiteId, {
            include: 'settings,rules,profile',
            limit: 100
          });
          items = normalizeList(siteDevRes, 'devices');
        } catch (err) {
          console.warn('getSiteDevices notice:', err);
        }

        // Fallback to cross-site endpoint with siteId filter if needed
        if (!items || items.length === 0) {
          try {
            const queryParams = new URLSearchParams({
              siteId: String(selectedSiteId),
              include: 'settings,rules,profile',
              limit: '100'
            });
            const url = getApiUrl(`/devices?${queryParams.toString()}`);
            const res = await fetch(url, {
              method: 'GET',
              headers: getAuthHeaders()
            });
            if (res && res.ok) {
              const json = await res.json();
              items = normalizeList(json, 'devices');
            }
          } catch (fallbackErr) {
            console.warn('Fallback /devices query error:', fallbackErr);
          }
        }

        if (isMounted) {
          // Filter for Energy Meter devices
          const energyCategories = ['MAIN_ENERGY_METER', 'SUB_ENERGY_METER', 'ENERGY_METER'];
          const filtered = items.filter(d => {
            const cat = String(d.category || '').toUpperCase();
            const tmpl = String(d.templateName || '').toUpperCase();
            const name = String(d.name || '').toUpperCase();
            return energyCategories.includes(cat) || tmpl.includes('METER') || name.includes('METER') || cat.includes('METER');
          });

          const finalDevices = filtered.length > 0 ? filtered : items;
          setSiteDevices(finalDevices);

          if (finalDevices.length > 0) {
            const savedId = localStorage.getItem('selected_main_meter_id');
            const existsInList = finalDevices.some(d => String(d.id || d.deviceId) === String(savedId));
            const chosenId = existsInList ? String(savedId) : String(finalDevices[0].id || finalDevices[0].deviceId);
            setSelectedDeviceId(chosenId);
            localStorage.setItem('selected_main_meter_id', chosenId);
          } else {
            setSelectedDeviceId('');
            localStorage.removeItem('selected_main_meter_id');
          }
        }
      } catch (err) {
        console.warn('Error fetching devices in EnergyGraphs:', err);
        if (isMounted) {
          setSiteDevices([]);
          setSelectedDeviceId('');
        }
      } finally {
        if (isMounted) setDevicesLoading(false);
      }
    };

    fetchSiteDevices();
    return () => { isMounted = false; };
  }, [selectedSiteId]);

  // Selected device object
  const selectedDevice = useMemo(() => {
    if (!siteDevices || siteDevices.length === 0) return null;
    return siteDevices.find(d => String(d.id || d.deviceId) === String(selectedDeviceId)) || siteDevices[0];
  }, [siteDevices, selectedDeviceId]);

  // Check online status of selected device
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
      const lastSeenMs = (parseUtcDate(selectedDevice.lastSeenAt) || new Date(0)).getTime();
      if (Math.abs(Date.now() - lastSeenMs) < 5 * 60 * 1000) return true;
    }

    return false;
  }, [selectedDevice, getOverallStatus]);

  // 3a. Device-Wide Telemetry Snapshots Fetch (Page level)
  const fetchTelemetrySnapshots = useCallback(async () => {
    if (!selectedSiteId || !selectedDeviceId) {
      setTelemetryData(null);
      setTelemetryLoading(false);
      setIsBackgroundFetching(false);
      return;
    }

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    // If initial load, show full loading. If range change, do background refresh without wiping existing cards
    if (!telemetryData) {
      setTelemetryLoading(true);
    } else {
      setIsBackgroundFetching(true);
    }
    setTelemetryError(null);

    try {
      const { from, to } = calculateDateRange(rangePreset);
      const params = {
        interval: activeInterval,
        from,
        to,
        limit: 1000
      };

      const res = await bmsService.getDeviceTelemetrySnapshots(selectedSiteId, selectedDeviceId, params);

      // Guard against stale responses from previous device or site
      if (requestIdRef.current !== currentRequestId) return;

      if (res && (res.success || res.data)) {
        setTelemetryData(res.data || res);
        // Clear individual overrides on page-wide interval/range change
        setSettingOverrides({});
      } else {
        setTelemetryData({ settings: [], settingsCount: 0 });
      }
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;
      console.error('Error retrieving telemetry snapshots:', err);
      setTelemetryError(err?.message || 'Failed to fetch device telemetry snapshots. Please try again.');
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setTelemetryLoading(false);
        setIsBackgroundFetching(false);
      }
    }
  }, [selectedSiteId, selectedDeviceId, activeInterval, rangePreset, telemetryData]);

  // Trigger telemetry fetch on site or device changes
  useEffect(() => {
    fetchTelemetrySnapshots();
  }, [selectedSiteId, selectedDeviceId]);

  // 3b. Individual fetch for a single setting (event) using settingId
  // Only the selected event data changes without refreshing the whole page
  const fetchIndividualSettingSnapshots = useCallback(async (targetSetting, targetInterval, targetRange) => {
    if (!selectedSiteId || !selectedDeviceId || !targetSetting) return;

    setModalLoading(true);
    setModalError(null);

    try {
      const { from, to } = calculateDateRange(targetRange);
      const params = {
        interval: targetInterval,
        from,
        to,
        limit: 1000
      };

      // Supply settingId (numeric ID) OR fieldKey as per OpenAPI spec
      if (targetSetting.settingId && !isNaN(Number(targetSetting.settingId))) {
        params.settingId = Number(targetSetting.settingId);
      } else if (targetSetting.fieldKey) {
        params.fieldKey = targetSetting.fieldKey;
      }

      const res = await bmsService.getDeviceTelemetrySnapshots(selectedSiteId, selectedDeviceId, params);
      const dataObj = res?.data || res || {};
      const newSnapshots = dataObj.snapshots || (Array.isArray(dataObj.settings) && dataObj.settings[0]?.snapshots) || [];

      setModalSnapshots(newSnapshots);

      // Save into settingOverrides so the card on the grid also updates without full page refresh
      const sKey = targetSetting.settingId ? `id:${targetSetting.settingId}` : (targetSetting.fieldKey ? `key:${targetSetting.fieldKey}` : `name:${targetSetting.displayName}`);
      setSettingOverrides(prev => ({
        ...prev,
        [sKey]: {
          snapshots: newSnapshots,
          interval: targetInterval,
          rangePreset: targetRange
        }
      }));
    } catch (err) {
      console.error('Error fetching individual setting telemetry:', err);
      setModalError(err?.message || 'Failed to fetch telemetry for this parameter.');
    } finally {
      setModalLoading(false);
    }
  }, [selectedSiteId, selectedDeviceId]);

  // 4. Resolve Eligible Configured Settings and Map Snapshots
  const eligibleSettings = useMemo(() => {
    if (!selectedDevice) return [];

    // Create telemetry lookup map by settingId and by fieldKey
    const telemetryMap = new Map();
    const apiSettings = telemetryData?.settings || [];
    if (Array.isArray(apiSettings)) {
      apiSettings.forEach(s => {
        if (s.settingId !== undefined && s.settingId !== null) {
          telemetryMap.set(`id:${s.settingId}`, s);
        }
        if (s.fieldKey) {
          telemetryMap.set(`key:${s.fieldKey}`, s);
        }
      });
    }

    // A. Gather settings configured on device (filtering out command-only settings)
    const configuredSettings = (selectedDevice.settings || []).filter(s => {
      if (s.isCommand === true && s.isTelemetry === false) return false;
      return true;
    });

    const settingsMap = new Map();

    // Add device configured settings
    configuredSettings.forEach(s => {
      const sId = s.id || s.settingId;
      const stableKey = sId ? `id:${sId}` : (s.sochiotFieldName ? `key:${s.sochiotFieldName}` : `name:${s.displayName}`);
      
      // Look up telemetry snapshots using stable identifiers
      const tel = (sId ? telemetryMap.get(`id:${sId}`) : null) ||
                  (s.sochiotFieldName ? telemetryMap.get(`key:${s.sochiotFieldName}`) : null) ||
                  (s.displayName ? apiSettings.find(a => a.displayName?.toLowerCase() === s.displayName?.toLowerCase()) : null);

      // Check metadata for friendly default units if missing
      const meta = MAIN_METER_FIELDS_METADATA.find(m =>
        m.key === s.sochiotFieldName ||
        m.label.toLowerCase() === s.displayName?.toLowerCase()
      );

      settingsMap.set(stableKey, {
        settingId: sId,
        fieldKey: s.sochiotFieldName || s.fieldName || (tel?.fieldKey) || '',
        displayName: s.displayName || s.name || (tel?.displayName) || 'Telemetry Parameter',
        unit: s.unit || (tel?.unit) || (meta?.unit) || '',
        isCumulative: tel?.isCumulative !== undefined ? tel.isCumulative : isCumulativeSetting(s),
        snapshots: tel?.snapshots || []
      });
    });

    // B. Also include any settings present in telemetry response not already captured
    apiSettings.forEach(apiS => {
      const stableKey = apiS.settingId ? `id:${apiS.settingId}` : (apiS.fieldKey ? `key:${apiS.fieldKey}` : `name:${apiS.displayName}`);
      if (!settingsMap.has(stableKey)) {
        settingsMap.set(stableKey, {
          settingId: apiS.settingId,
          fieldKey: apiS.fieldKey || '',
          displayName: apiS.displayName || 'Telemetry Parameter',
          unit: apiS.unit || '',
          isCumulative: apiS.isCumulative || false,
          snapshots: apiS.snapshots || []
        });
      }
    });

    return Array.from(settingsMap.values());
  }, [selectedDevice, telemetryData]);

  // Derive active expanded setting dynamically from eligibleSettings
  const activeExpandedSetting = useMemo(() => {
    if (!expandedSettingKey) return expandedSetting;
    return eligibleSettings.find(s => {
      const key = s.settingId ? `id:${s.settingId}` : (s.fieldKey ? `key:${s.fieldKey}` : `name:${s.displayName}`);
      return key === expandedSettingKey;
    }) || expandedSetting;
  }, [eligibleSettings, expandedSettingKey, expandedSetting]);

  // Modal setting data combining active setting and latest modal snapshots
  const modalSettingData = useMemo(() => {
    if (!activeExpandedSetting) return null;
    return {
      ...activeExpandedSetting,
      snapshots: modalSnapshots,
      interval: modalInterval,
      rangePreset: modalRangePreset
    };
  }, [activeExpandedSetting, modalSnapshots, modalInterval, modalRangePreset]);

  // Filter settings by user search input
  const filteredSettings = useMemo(() => {
    if (!searchTerm.trim()) return eligibleSettings;
    const query = searchTerm.toLowerCase().trim();
    return eligibleSettings.filter(s =>
      s.displayName.toLowerCase().includes(query) ||
      (s.fieldKey && s.fieldKey.toLowerCase().includes(query)) ||
      (s.unit && s.unit.toLowerCase().includes(query))
    );
  }, [eligibleSettings, searchTerm]);

  // Header Ribbon Selectors
  const siteSelector = useMemo(() => {
    const siteOptions = (allSites && allSites.length > 0)
      ? allSites.map(s => ({
          value: String(s.id || s._id || s.siteId),
          label: s.name || s.siteName || s.title || `Site ${s.id}`
        }))
      : [{ value: '1', label: 'Main Facility Site' }];

    const currentVal = selectedSiteId || siteOptions[0]?.value;

    return {
      value: currentVal,
      options: siteOptions,
      onChange: (newId) => {
        if (!newId || newId === selectedSiteId) return;
        setSelectedSiteId(newId);
        localStorage.setItem('selected_main_meter_site_id', String(newId));
        const found = allSites?.find(s => String(s.id || s._id || s.siteId) === String(newId));
        if (found && setSelectedSite) setSelectedSite(found);
      },
      ariaLabel: 'Select Site'
    };
  }, [allSites, selectedSiteId, setSelectedSite]);

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
        options: [{ value: '', label: 'No devices configured' }],
        disabled: true,
        ariaLabel: 'No devices configured'
      };
    }

    // Deduplicate devices by ID
    const uniqueDevices = [];
    const seen = new Set();
    for (const d of siteDevices) {
      const id = String(d.id || d.deviceId || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const name = d.name || d.deviceName || d.title || d.serialNumber || `Meter (${id})`;
      uniqueDevices.push({ id, name });
    }

    const meterOptions = uniqueDevices.map(d => ({
      value: d.id,
      label: d.name
    }));

    const currentVal = (selectedDeviceId && meterOptions.some(m => String(m.value) === String(selectedDeviceId)))
      ? String(selectedDeviceId)
      : (meterOptions[0]?.value || '');

    return {
      value: currentVal,
      options: meterOptions,
      onChange: (newId) => {
        if (!newId || newId === selectedDeviceId) return;
        setSelectedDeviceId(newId);
        localStorage.setItem('selected_main_meter_id', String(newId));
      },
      ariaLabel: 'Select Meter Device',
      disabled: false
    };
  }, [siteDevices, devicesLoading, selectedDeviceId]);

  const isDeviceConfigured = Boolean(siteDevices && siteDevices.length > 0);

  // Range preset and active interval labels for banner metadata
  const currentRangeLabel = useMemo(() => {
    return RANGE_PRESETS.find(p => p.id === rangePreset)?.label || 'Last 24 Hours';
  }, [rangePreset]);

  const activeIntervalLabel = useMemo(() => {
    return SAMPLING_INTERVALS.find(i => i.value === activeInterval)?.label || activeInterval;
  }, [activeInterval]);

  // Handle expand graph modal
  const handleOpenExpandModal = (setting, type, color) => {
    const key = setting.settingId ? `id:${setting.settingId}` : (setting.fieldKey ? `key:${setting.fieldKey}` : `name:${setting.displayName}`);
    const override = settingOverrides[key];
    const initialInterval = override?.interval || activeInterval;
    const initialRange = override?.rangePreset || rangePreset;
    const initialSnaps = override?.snapshots || setting.snapshots || [];

    setExpandedSettingKey(key);
    setExpandedSetting(setting);
    setExpandedChartType(type);
    setExpandedColorScheme(color);
    setModalInterval(initialInterval);
    setModalRangePreset(initialRange);
    setModalSnapshots(initialSnaps);
    setModalError(null);
  };

  const handleCloseExpandModal = () => {
    setExpandedSetting(null);
    setExpandedSettingKey(null);
    setModalError(null);
  };

  // Modal Range Selector change: individual fetch by settingId
  const handleModalRangeChange = (newPreset) => {
    setModalRangePreset(newPreset);
    const p = RANGE_PRESETS.find(x => x.id === newPreset);
    const newInterval = p?.defaultInterval || modalInterval;
    if (p?.defaultInterval) {
      setModalInterval(newInterval);
    }
    if (activeExpandedSetting) {
      fetchIndividualSettingSnapshots(activeExpandedSetting, newInterval, newPreset);
    }
  };

  // Modal Interval Selector change: individual fetch by settingId
  const handleModalIntervalChange = (newInterval) => {
    setModalInterval(newInterval);
    if (activeExpandedSetting) {
      fetchIndividualSettingSnapshots(activeExpandedSetting, newInterval, modalRangePreset);
    }
  };

  return (
    <div className="fade-in energy-graphs-workspace">
      {/* ── 1. Reusable PageContextBanner ── */}
      <PageContextBanner
        title={selectedDevice ? (selectedDevice.name || selectedDevice.deviceName || 'Energy Meter') : 'Energy Meter Graphs'}
        icon={<Zap className={isDeviceConfigured ? "text-warning" : "text-secondary"} size={22} />}
        status={isDeviceConfigured ? (isDeviceOnline ? 'ONLINE' : 'OFFLINE') : 'NOT CONFIGURED'}
        siteSelector={siteSelector}
        deviceSelector={deviceSelector}
        metadata={[
          {
            icon: <Clock size={15} />,
            label: `${activeIntervalLabel} • ${currentRangeLabel} (IST)`
          },
          ...(eligibleSettings.length > 0 ? [{
            icon: <Activity size={15} />,
            label: `${eligibleSettings.length} ${eligibleSettings.length === 1 ? 'Graph' : 'Graphs'}`
          }] : [])
        ]}
        actions={[
          <Button
            key="refresh-btn"
            variant="outline-info"
            size="sm"
            className="context-banner-action-btn d-flex align-items-center gap-1.5 py-1 px-2.5 rounded-pill fs-8 fw-semibold"
            onClick={fetchTelemetrySnapshots}
            disabled={telemetryLoading || isBackgroundFetching || !selectedDeviceId}
            title="Refresh Snapshots"
          >
            <RefreshCw size={14} className={(telemetryLoading || isBackgroundFetching) ? "spin-animation" : ""} />
            <span>{(telemetryLoading || isBackgroundFetching) ? 'Refreshing...' : 'Refresh'}</span>
          </Button>,
          <PdfButton
            key="pdf-export"
            label=""
            title="Download PDF Report"
            variant="custom"
            className="context-banner-action-btn p-1 border-0"
            disabled={!isDeviceConfigured}
          />
        ]}
        enableFullscreen={true}
        variant="scada"
        className="energy-graphs-context-banner"
      />

      {/* ── 2. Filter & Controls Toolbar ── */}
      {isDeviceConfigured && (
        <div className="energy-graphs-toolbar d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Left: Range Presets */}
          <div className="energy-toolbar-group">
            <span className="text-secondary fs-8 fw-bold uppercase tracking-wider me-1">Range:</span>
            {RANGE_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                className={`energy-filter-btn ${rangePreset === preset.id ? 'active' : ''}`}
                onClick={() => {
                  setRangePreset(preset.id);
                  if (preset.defaultInterval) {
                    setActiveInterval(preset.defaultInterval);
                  }
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Middle: Sampling Interval Buttons */}
          <div className="energy-toolbar-group">
            <span className="text-secondary fs-8 fw-bold uppercase tracking-wider me-1">Interval:</span>
            {SAMPLING_INTERVALS.map(int => (
              <button
                key={int.value}
                type="button"
                className={`energy-filter-btn ${activeInterval === int.value ? 'active' : ''}`}
                onClick={() => setActiveInterval(int.value)}
              >
                {int.label}
              </button>
            ))}
          </div>

          {/* Right: Quick Search Filter & Layout Toggle */}
          <div className="energy-toolbar-group ms-auto">
            <div style={{ width: '220px' }}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-dark border-secondary border-opacity-25 text-secondary pe-1">
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Filter parameters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="energy-search-input"
                />
                {searchTerm && (
                  <Button
                    variant="dark"
                    className="border-secondary border-opacity-25 text-secondary p-1"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={14} />
                  </Button>
                )}
              </InputGroup>
            </div>

            {/* Grid Columns Toggle */}
            <div className="btn-group btn-group-sm ms-1" role="group" aria-label="Layout Grid Toggle">
              <Button
                variant={gridColumns === 2 ? 'info' : 'outline-secondary'}
                className="py-1 px-2"
                onClick={() => setGridColumns(2)}
                title="2-Column Grid"
              >
                <Grid size={15} />
              </Button>
              <Button
                variant={gridColumns === 1 ? 'info' : 'outline-secondary'}
                className="py-1 px-2"
                onClick={() => setGridColumns(1)}
                title="1-Column Full Width"
              >
                <Columns size={15} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Main Content / Empty & Error State Handling ── */}

      {/* Case A: No devices configured for selected site */}
      {!devicesLoading && !isDeviceConfigured && (
        <div className="energy-empty-state-card energy-empty-state-darkened">
          <Cpu className="text-secondary opacity-50 mb-3" size={56} />
          <h4 className="text-white fw-bold mb-2">No devices configured for this site</h4>
          <p className="text-secondary fs-7 mx-auto" style={{ maxWidth: '520px' }}>
            There are currently no energy meters configured for the selected site.
            Please configure or provision energy devices under Site Management or select a different site.
          </p>
        </div>
      )}

      {/* Case D: API Error State */}
      {isDeviceConfigured && telemetryError && !telemetryData && (
        <Card className="border-danger border-opacity-25 bg-danger bg-opacity-10 p-4 mb-4 text-center">
          <div className="d-flex flex-column align-items-center gap-2">
            <AlertTriangle className="text-danger" size={40} />
            <h5 className="text-danger fw-bold mb-1">Failed to load telemetry snapshots</h5>
            <p className="text-secondary fs-7 mb-3">{telemetryError}</p>
            <Button variant="outline-danger" size="sm" onClick={fetchTelemetrySnapshots} className="rounded-pill px-3 py-1.5 fw-bold">
              <RefreshCw size={14} className="me-2" /> Retry Request
            </Button>
          </div>
        </Card>
      )}

      {/* Case D: Initial Loading State */}
      {isDeviceConfigured && telemetryLoading && !telemetryData && (
        <div className="d-flex flex-column justify-content-center align-items-center py-5 my-5">
          <Spinner animation="border" variant="info" style={{ width: '3.2rem', height: '3.2rem' }} className="mb-3" />
          <h5 className="text-info fw-bold tracking-widest uppercase fs-6" style={{ letterSpacing: '2px' }}>
            Retrieving Device Snapshots...
          </h5>
          <small className="text-secondary opacity-60">
            Querying periodic telemetry snapshots for {selectedDevice?.name || 'device'}
          </small>
        </div>
      )}

      {/* Case B: Device exists, but has no settings/events configured */}
      {isDeviceConfigured && !telemetryLoading && !telemetryError && eligibleSettings.length === 0 && (
        <div className="energy-empty-state-card">
          <Sliders className="text-secondary opacity-50 mb-3" size={56} />
          <h4 className="text-white fw-bold mb-2">No settings/events configured for this device</h4>
          <p className="text-secondary fs-7 mx-auto" style={{ maxWidth: '520px' }}>
            {selectedDevice?.name || 'The selected meter'} has no active telemetry parameters or event mappings configured.
            Please map telemetry settings to view dynamic graphs.
          </p>
        </div>
      )}

      {/* Case C: Dynamic Telemetry Graphs Grid (Settings exist) */}
      {isDeviceConfigured && eligibleSettings.length > 0 && (
        <>
          {filteredSettings.length === 0 ? (
            <div className="energy-empty-state-card py-5">
              <Search className="text-secondary opacity-40 mb-2" size={36} />
              <h5 className="text-white fs-6 fw-bold mb-1">No matching parameters found</h5>
              <p className="text-secondary fs-8 mb-2">No graphs match &quot;{searchTerm}&quot;.</p>
              <Button variant="outline-info" size="sm" onClick={() => setSearchTerm('')} className="rounded-pill px-3 py-1 fs-8">
                Clear Filter
              </Button>
            </div>
          ) : (
            <Row className="g-3">
              {filteredSettings.map((setting, idx) => {
                const palette = GRAPH_PALETTES[idx % GRAPH_PALETTES.length];
                const key = setting.settingId ? `set-${setting.settingId}` : `fld-${setting.fieldKey || idx}`;
                const sKey = setting.settingId ? `id:${setting.settingId}` : (setting.fieldKey ? `key:${setting.fieldKey}` : `name:${setting.displayName}`);
                const override = settingOverrides[sKey];
                const cardSetting = override ? { ...setting, snapshots: override.snapshots } : setting;
                const cardInterval = override?.interval || activeInterval;
                const cardRange = override?.rangePreset || rangePreset;

                return (
                  <Col
                    key={key}
                    xs={12}
                    lg={gridColumns === 1 ? 12 : 6}
                    className="fade-in-slide"
                    style={{ animationDelay: `${Math.min(idx * 0.05, 0.4)}s` }}
                  >
                    <TelemetryGraphCard
                      setting={cardSetting}
                      interval={cardInterval}
                      rangePreset={cardRange}
                      colorScheme={palette}
                      onExpand={handleOpenExpandModal}
                      height={250}
                    />
                  </Col>
                );
              })}
            </Row>
          )}
        </>
      )}

      {/* ── 4. Expand Graph Modal ── */}
      {modalSettingData && (
        <Modal
          show={Boolean(modalSettingData)}
          onHide={handleCloseExpandModal}
          size="xl"
          centered
          dialogClassName="modal-95w scada-expanded-modal"
        >
          <Modal.Header
            className="border-secondary border-opacity-25 p-3 px-4"
            style={{ background: '#0b1120' }}
          >
            <Modal.Title className="text-white w-100 d-flex flex-wrap justify-content-between align-items-center gap-3">
              {/* Left: Title & Identifiers */}
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: '5px', height: '26px', background: expandedColorScheme.stroke, borderRadius: '3px', boxShadow: `0 0 10px ${expandedColorScheme.stroke}88` }} />
                <div>
                  <h5 className="mb-0 fw-bold text-white fs-5">
                    {modalSettingData.displayName}
                  </h5>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    {modalSettingData.fieldKey && (
                      <span className="scada-graph-tag">{modalSettingData.fieldKey}</span>
                    )}
                    {modalSettingData.unit && (
                      <span className="scada-graph-unit">{modalSettingData.unit}</span>
                    )}
                    <span className="scada-graph-tag text-info border-info border-opacity-25" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                      IST (UTC+5:30)
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Interactive Range & Interval Selectors (Individual Fetch by settingId), Chart Type Switcher, and Close Button */}
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* Interactive Range Selector for this individual event */}
                <div className="d-flex align-items-center gap-1.5">
                  <span className="text-secondary fs-8 fw-bold text-uppercase tracking-wider">Range:</span>
                  <Form.Select
                    size="sm"
                    className="energy-modal-select"
                    value={modalRangePreset}
                    onChange={(e) => handleModalRangeChange(e.target.value)}
                    disabled={modalLoading}
                    style={{ width: '130px' }}
                  >
                    {RANGE_PRESETS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </Form.Select>
                </div>

                {/* Interactive Time-Interval Selector for this individual event */}
                <div className="d-flex align-items-center gap-1.5">
                  <span className="text-secondary fs-8 fw-bold text-uppercase tracking-wider">Interval:</span>
                  <Form.Select
                    size="sm"
                    className="energy-modal-select"
                    value={modalInterval}
                    onChange={(e) => handleModalIntervalChange(e.target.value)}
                    disabled={modalLoading}
                    style={{ width: '105px' }}
                  >
                    {SAMPLING_INTERVALS.map(int => (
                      <option key={int.value} value={int.value}>{int.label}</option>
                    ))}
                  </Form.Select>
                </div>

                {/* Chart Type Switcher */}
                <div className="btn-group btn-group-sm" role="group" aria-label="Modal Chart Switcher">
                  <Button
                    variant={expandedChartType === 'area' ? 'info' : 'outline-secondary'}
                    size="sm"
                    className="py-1 px-2.5 fs-8"
                    onClick={() => setExpandedChartType('area')}
                  >
                    Area
                  </Button>
                  <Button
                    variant={expandedChartType === 'line' ? 'info' : 'outline-secondary'}
                    size="sm"
                    className="py-1 px-2.5 fs-8"
                    onClick={() => setExpandedChartType('line')}
                  >
                    Line
                  </Button>
                  <Button
                    variant={expandedChartType === 'bar' ? 'info' : 'outline-secondary'}
                    size="sm"
                    className="py-1 px-2.5 fs-8"
                    onClick={() => setExpandedChartType('bar')}
                  >
                    Bar
                  </Button>
                </div>

                {/* Modal Close Button */}
                <Button
                  variant="link"
                  className="text-white p-0 opacity-75 hover-opacity-100 ms-1"
                  onClick={handleCloseExpandModal}
                  title="Close modal"
                >
                  <X size={24} />
                </Button>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ background: '#080d19', minHeight: '520px', padding: '24px', position: 'relative' }}>
            {/* Live Loading Overlay inside modal when re-fetching individual setting by settingId */}
            {modalLoading && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(8, 13, 25, 0.75)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}>
                <Spinner animation="border" variant="info" style={{ width: '2.5rem', height: '2.5rem' }} className="mb-2" />
                <span className="text-info fs-8 fw-semibold tracking-wider text-uppercase">Updating Parameter Telemetry (IST)...</span>
              </div>
            )}

            {modalError && (
              <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center justify-content-between fs-8">
                <span>{modalError}</span>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="py-0.5 px-2 fs-9 fw-bold"
                  onClick={() => fetchIndividualSettingSnapshots(activeExpandedSetting, modalInterval, modalRangePreset)}
                >
                  Retry
                </Button>
              </div>
            )}

            <TelemetryGraphCard
              setting={modalSettingData}
              interval={modalInterval}
              rangePreset={modalRangePreset}
              colorScheme={expandedColorScheme}
              onExpand={() => {}}
              initialChartType={expandedChartType}
              isExpanded={true}
              height={460}
            />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default EnergyGraphs;
