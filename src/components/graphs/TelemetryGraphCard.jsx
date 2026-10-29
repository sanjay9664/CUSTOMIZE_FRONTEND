import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';
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
import { Activity, Maximize2, Thermometer, Droplets, Wind, Leaf } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import {
  parseUtcDate,
  formatTimestampLabel,
  formatTooltipWindow,
  formatVal,
  isCumulativeSetting,
  downsampleForBarChart
} from '../../utils/scadaGraphUtils';

const getMetricIcon = (fieldKey = '', displayName = '') => {
  const str = `${fieldKey} ${displayName}`.toLowerCase();
  if (str.includes('temp')) return Thermometer;
  if (str.includes('hum') || str.includes('rh')) return Droplets;
  if (str.includes('co2')) return Wind;
  if (str.includes('tvoc') || str.includes('voc')) return Leaf;
  return Activity;
};

/**
 * Custom SCADA Glassmorphic Tooltip (with IST Time Window)
 */
export const ScadaTooltip = ({ active, payload, unit, isCumulative, color }) => {
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
 * Pure, props-driven SCADA visualization component
 */
export const TelemetryGraphCard = React.memo(({
  setting,
  interval,
  rangePreset,
  colorScheme = { stroke: '#06b6d4', fill: '#0891b2' },
  onExpand,
  initialChartType = null,
  isExpanded = false,
  height = 250,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore = null
}) => {
  const { isDark } = useTheme();
  const MetricIcon = useMemo(() => getMetricIcon(setting?.fieldKey, setting?.displayName), [setting?.fieldKey, setting?.displayName]);

  const isCumulative = useMemo(() => isCumulativeSetting(setting), [setting]);
  const defaultChartType = isCumulative ? 'bar' : 'area';
  const [chartType, setChartType] = useState(initialChartType || defaultChartType);

  // In expanded modal mode, the parent modal controls chartType directly
  const activeChartType = isExpanded ? (initialChartType || defaultChartType) : chartType;

  // Transform raw snapshots into recharts data points
  const { chartData, stats } = useMemo(() => {
    const rawSnapshots = setting?.snapshots || [];
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
      // For continuous analog signals (AQI, Temp, Humidity, CO2, etc.), use avgValue, fallback to lastValue
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
      // Suppress total delta for non-cumulative environmental measurements
      totalDelta: isCumulative ? cumulativeSum : null
    } : null;

    return { chartData: data, stats: computedStats };
  }, [setting?.snapshots, interval, rangePreset, isCumulative]);

  // In expanded modal mode, if horizontal scroll is enabled, allow full density up to 3500 points
  const barChartData = useMemo(() => {
    if (activeChartType !== 'bar' || !chartData || chartData.length === 0) return null;
    if (isExpanded) {
      return chartData.length > 3500 ? downsampleForBarChart(chartData, 1500) : chartData;
    }
    const maxBars = 60;
    return downsampleForBarChart(chartData, maxBars);
  }, [chartData, activeChartType, isExpanded]);

  const activeData = activeChartType === 'bar' ? (barChartData || chartData) : chartData;
  const hasData = activeData.length > 0;
  const gradientId = `grad_${(setting?.settingId || setting?.fieldKey || 'card').toString().replace(/[^a-zA-Z0-9]/g, '_')}`;

  const scrollContainerRef = useRef(null);

  // In expanded mode, calculate dynamic width so bars and points have comfortable spacing
  // and user can scroll smoothly across the entire month without squishing!
  const minPointWidth = activeChartType === 'bar' ? 18 : 12;
  const isScrollable = isExpanded && activeData.length > 35;
  const contentWidth = isScrollable ? Math.max(activeData.length * minPointWidth, 900) : '100%';

  const handleScroll = useCallback((e) => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    // When within 350px of the right edge, fetch next page
    if (scrollWidth - (scrollLeft + clientWidth) < 350) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  const handleWheel = useCallback((e) => {
    if (!isScrollable || !scrollContainerRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  }, [isScrollable]);

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
      <div className="position-relative h-100">
        {isLoadingMore && (
          <div style={{
            position: 'absolute',
            top: 8,
            right: 16,
            zIndex: 10,
            background: 'rgba(8, 13, 25, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '3px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: '#38bdf8'
          }}>
            <span className="spinner-border spinner-border-sm" style={{ width: '10px', height: '10px' }} />
            <span>Loading more...</span>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className="scada-graph-scroll-viewport position-relative h-100"
          style={{
            width: '100%',
            overflowX: isScrollable ? 'auto' : 'hidden',
            overflowY: 'hidden',
            borderRadius: '6px'
          }}
          onScroll={handleScroll}
          onWheel={handleWheel}
        >
          <div style={{ width: isScrollable ? `${contentWidth}px` : '100%', minWidth: '100%', height: chartHeight }}>
            <ResponsiveContainer width="100%" height={chartHeight} debounce={isScrollable ? 0 : 150}>
              <ChartComp data={activeData} margin={{ top: 12, right: 16, left: -10, bottom: 4 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorScheme.stroke} stopOpacity={0.65} />
                    <stop offset="95%" stopColor={colorScheme.stroke} stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "rgba(148, 163, 184, 0.12)" : "#E2E8F0"}
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke={isDark ? "#94a3b8" : "#64748B"}
                  fontSize={11}
                  tickLine={{ stroke: isDark ? '#475569' : '#CBD5E1' }}
                  axisLine={{ stroke: isDark ? 'rgba(148, 163, 184, 0.2)' : '#E2E8F0' }}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748B' }}
                  dy={6}
                  minTickGap={25}
                />
                <YAxis
                  stroke={isDark ? "#94a3b8" : "#64748B"}
                  fontSize={11}
                  tickLine={{ stroke: isDark ? '#475569' : '#CBD5E1' }}
                  axisLine={{ stroke: isDark ? 'rgba(148, 163, 184, 0.2)' : '#E2E8F0' }}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748B' }}
                  dx={-4}
                  width={55}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={<ScadaTooltip unit={setting?.unit} isCumulative={isCumulative} color={colorScheme.stroke} />}
                  cursor={activeChartType === 'bar' ? { fill: 'rgba(255, 255, 255, 0.04)' } : { stroke: colorScheme.stroke, strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                {activeChartType === 'bar' && (
                  <Bar
                    dataKey="plotValue"
                    name={setting?.displayName}
                    fill={colorScheme.stroke}
                    radius={activeData.length <= 60 ? [3, 3, 0, 0] : 0}
                    maxBarSize={40}
                    isAnimationActive={activeData.length <= 50}
                    animationDuration={activeData.length <= 30 ? 250 : 150}
                  />
                )}
                {activeChartType === 'line' && (
                  <Line
                    type="monotone"
                    dataKey="plotValue"
                    name={setting?.displayName}
                    stroke={colorScheme.stroke}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: colorScheme.stroke, stroke: '#ffffff', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={350}
                  />
                )}
                {activeChartType === 'area' && (
                  <Area
                    type="monotone"
                    dataKey="plotValue"
                    name={setting?.displayName}
                    stroke={colorScheme.stroke}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    fillOpacity={1}
                    dot={false}
                    activeDot={{ r: 5, fill: colorScheme.stroke, stroke: '#ffffff', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={350}
                  />
                )}
              </ChartComp>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
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
        <div className="scada-graph-header d-flex align-items-center justify-content-between p-3">
          <div className="scada-graph-title-group d-flex align-items-center gap-2.5">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: `${colorScheme.stroke}18`,
                border: `1.5px solid ${colorScheme.stroke}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colorScheme.stroke,
                flexShrink: 0
              }}
            >
              <MetricIcon size={20} strokeWidth={2.2} />
            </div>
            <div className="d-flex flex-column">
              <h5
                className="scada-graph-title mb-0"
                style={{
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '1rem',
                  lineHeight: 1.2
                }}
                title={setting?.displayName}
              >
                {setting?.displayName || 'Telemetry Parameter'}
              </h5>
              <div className="d-flex align-items-center gap-1.5 mt-1">
                {setting?.fieldKey && (
                  <span
                    className="scada-graph-tag"
                    style={{
                      backgroundColor: `${colorScheme.stroke}14`,
                      color: colorScheme.stroke,
                      border: `1px solid ${colorScheme.stroke}28`,
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      padding: '1px 7px',
                      borderRadius: '5px'
                    }}
                  >
                    {setting.fieldKey}
                  </span>
                )}
                {setting?.unit && (
                  <span
                    className="scada-graph-unit"
                    style={{
                      backgroundColor: `${colorScheme.stroke}18`,
                      color: colorScheme.stroke,
                      border: `1px solid ${colorScheme.stroke}35`,
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      padding: '1px 7px',
                      borderRadius: '5px'
                    }}
                  >
                    {setting.unit}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-inline-flex align-items-center"
              style={{
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F1F5F9',
                border: isDark ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '2px',
                gap: '2px'
              }}
              role="group"
              aria-label="Chart Type Switcher"
            >
              {['area', 'line', 'bar'].map((type) => {
                const isActive = chartType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    style={{
                      backgroundColor: isActive ? colorScheme.stroke : 'transparent',
                      color: isActive ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                      border: 'none',
                      borderRadius: '6px',
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 600 : 500,
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setChartType(type)}
                    title={`${type.charAt(0).toUpperCase() + type.slice(1)} Chart`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                );
              })}
            </div>

            {onExpand && (
              <button
                type="button"
                className="btn btn-link p-1 border-0"
                style={{
                  color: isDark ? '#38bdf8' : '#64748B',
                  opacity: hasData ? 1 : 0.4,
                  cursor: hasData ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
                onClick={() => onExpand(setting, chartType, colorScheme)}
                title="Expand Graph"
                disabled={!hasData}
              >
                <Maximize2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats Ribbon */}
      {stats && (
        <div
          className="scada-graph-stats px-3 py-2 d-flex align-items-center gap-3"
          style={{
            borderBottom: isDark ? '1px solid rgba(148, 163, 184, 0.1)' : '1px solid #F1F5F9',
            backgroundColor: isDark ? 'transparent' : '#FFFFFF'
          }}
        >
          <div className="scada-stat-item d-flex align-items-center gap-1.5">
            <span className="scada-stat-label" style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>LATEST:</span>
            <span className="scada-stat-value font-monospace" style={{ color: colorScheme.stroke, fontSize: '0.85rem', fontWeight: 700 }}>
              {formatVal(stats.latest)}
            </span>
          </div>
          <div className="scada-stat-item d-flex align-items-center gap-1.5">
            <span className="scada-stat-label" style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>MIN:</span>
            <span className="scada-stat-value font-monospace" style={{ color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '0.85rem', fontWeight: 700 }}>
              {formatVal(stats.min)}
            </span>
          </div>
          <div className="scada-stat-item d-flex align-items-center gap-1.5">
            <span className="scada-stat-label" style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>MAX:</span>
            <span className="scada-stat-value font-monospace" style={{ color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '0.85rem', fontWeight: 700 }}>
              {formatVal(stats.max)}
            </span>
          </div>
          <div className="scada-stat-item d-flex align-items-center gap-1.5">
            <span className="scada-stat-label" style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>AVG:</span>
            <span className="scada-stat-value font-monospace" style={{ color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '0.85rem', fontWeight: 700 }}>
              {formatVal(stats.avg)}
            </span>
          </div>
          {isCumulative && stats.totalDelta !== null && (
            <div className="scada-stat-item ms-auto d-flex align-items-center gap-1.5">
              <span className="scada-stat-label text-warning" style={{ fontSize: '0.75rem', fontWeight: 600 }}>TOTAL DELTA:</span>
              <span className="scada-stat-value text-warning font-monospace" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {formatVal(stats.totalDelta)} {setting?.unit || ''}
              </span>
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
});

TelemetryGraphCard.displayName = 'TelemetryGraphCard';

export default TelemetryGraphCard;
