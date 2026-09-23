import React, { useState, useMemo } from 'react';
import { Card, Button } from 'react-bootstrap';
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
import { Activity, Maximize2 } from 'lucide-react';
import {
  parseUtcDate,
  formatTimestampLabel,
  formatTooltipWindow,
  formatVal,
  isCumulativeSetting,
  downsampleForBarChart
} from '../../utils/scadaGraphUtils';

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
  height = 250
}) => {
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

  // For Bar Chart, adaptively downsample if data exceeds maximum bar density for card/modal
  const barChartData = useMemo(() => {
    if (activeChartType !== 'bar' || !chartData || chartData.length === 0) return null;
    const maxBars = isExpanded ? 120 : 60;
    return downsampleForBarChart(chartData, maxBars);
  }, [chartData, activeChartType, isExpanded]);

  const activeData = activeChartType === 'bar' ? (barChartData || chartData) : chartData;
  const hasData = activeData.length > 0;
  const gradientId = `grad_${(setting?.settingId || setting?.fieldKey || 'card').toString().replace(/[^a-zA-Z0-9]/g, '_')}`;

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
      <ResponsiveContainer width="100%" height={chartHeight} debounce={150}>
        <ChartComp data={activeData} margin={{ top: 12, right: 16, left: -10, bottom: 4 }}>
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
              <h5 className="scada-graph-title" title={setting?.displayName}>
                {setting?.displayName || 'Telemetry Parameter'}
              </h5>
              <div className="d-flex align-items-center gap-1.5 mt-0.5">
                {setting?.fieldKey && (
                  <span className="scada-graph-tag">{setting.fieldKey}</span>
                )}
                {setting?.unit && (
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
              <span className="scada-stat-value text-warning">{formatVal(stats.totalDelta)} {setting?.unit || ''}</span>
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
