import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { Activity, Clock, Calendar, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';

const UG_15M_DATA = [
  { time: '08:00', pressure: 12.2, flow: 2150 },
  { time: '08:15', pressure: 12.4, flow: 2300 },
  { time: '08:30', pressure: 12.6, flow: 2480 },
  { time: '08:45', pressure: 12.5, flow: 2420 },
  { time: '09:00', pressure: 12.5, flow: 2450 },
  { time: '09:15', pressure: 12.3, flow: 2380 },
  { time: '09:30', pressure: 12.2, flow: 2250 },
  { time: '09:45', pressure: 12.4, flow: 2390 },
  { time: '10:00', pressure: 12.5, flow: 2410 },
  { time: '10:15', pressure: 12.6, flow: 2460 },
  { time: '10:30', pressure: 12.3, flow: 2320 },
  { time: '10:45', pressure: 12.2, flow: 2200 }
];

const UG_24H_DATA = [
  { time: '00:00', pressure: 12.1, flow: 1600 },
  { time: '02:00', pressure: 12.4, flow: 2100 },
  { time: '04:00', pressure: 12.3, flow: 1950 },
  { time: '06:00', pressure: 12.0, flow: 1800 },
  { time: '08:00', pressure: 12.5, flow: 2450 },
  { time: '10:00', pressure: 12.4, flow: 2406 },
  { time: '12:00', pressure: 12.2, flow: 2350 },
  { time: '14:00', pressure: 12.3, flow: 2400 },
  { time: '16:00', pressure: 12.1, flow: 2150 },
  { time: '18:00', pressure: 12.6, flow: 2467 },
  { time: '20:00', pressure: 12.5, flow: 2400 },
  { time: '22:00', pressure: 12.2, flow: 1900 }
];

const UG_DAILY_DATA = [
  { time: 'Mon', pressure: 12.4, flow: 2380 },
  { time: 'Tue', pressure: 12.5, flow: 2420 },
  { time: 'Wed', pressure: 12.6, flow: 2490 },
  { time: 'Thu', pressure: 12.4, flow: 2390 },
  { time: 'Fri', pressure: 12.5, flow: 2460 },
  { time: 'Sat', pressure: 12.1, flow: 1890 },
  { time: 'Sun', pressure: 12.0, flow: 1780 }
];

// High-Contrast Glassmorphic SCADA Tooltip (matching reference image)
const UgCustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const pressureVal = payload.find(p => p.dataKey === 'pressure')?.value;
    const flowVal = payload.find(p => p.dataKey === 'flow')?.value;

    const formatHeader = (val) => {
      if (!val) return '09 Oct, Live IST';
      if (val.includes(':')) {
        const [hh, mm] = val.split(':');
        const nextHh = String((parseInt(hh, 10) + 1) % 24).padStart(2, '0');
        return `9 Oct, ${hh}:${mm} – ${nextHh}:${mm} IST`;
      }
      return `${val}, 9 Oct 2026 IST`;
    };

    return (
      <div
        className="p-3 rounded-3 shadow-2xl"
        style={{
          background: 'rgba(6, 12, 24, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          minWidth: '225px',
          boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.85), 0 0 16px rgba(56, 189, 248, 0.2)',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Header: Date & Time range (e.g., "8 Oct, 22:00 – 23:00 IST") */}
        <div
          className="pb-2 mb-2 d-flex justify-content-between align-items-center"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}
        >
          <span style={{ color: '#cbd5e1', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.2px' }}>
            {formatHeader(label)}
          </span>
          <span
            className="badge rounded-pill px-1.5 py-0.5"
            style={{
              fontSize: '8.5px',
              fontWeight: 800,
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#4ade80',
              border: '1px solid rgba(34, 197, 94, 0.4)'
            }}
          >
            ● OPTIMAL
          </span>
        </div>

        {/* Primary Metric Highlight: Average Value / Header Pressure (cyan large font) */}
        {pressureVal !== undefined && (
          <div className="d-flex justify-content-between align-items-baseline mb-2">
            <span style={{ color: '#00b4d8', fontSize: '13px', fontWeight: 800 }}>
              Average Value:
            </span>
            <span
              style={{
                color: '#00b4d8',
                fontSize: '17px',
                fontWeight: 900,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.3px'
              }}
            >
              {pressureVal.toFixed(2)} <span style={{ fontSize: '10px', fontWeight: 700 }}>BAR</span>
            </span>
          </div>
        )}

        {/* Secondary Clean Key-Value Rows (matching reference layout) */}
        <div className="d-flex flex-column gap-1.5" style={{ fontSize: '11px' }}>
          {flowVal !== undefined && (
            <div className="d-flex justify-content-between align-items-center">
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Discharge Flow:</span>
              <span style={{ color: '#ffffff', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                {typeof flowVal === 'number' ? flowVal.toLocaleString() : flowVal} <span style={{ color: '#38bdf8', fontSize: '9.5px' }}>LPM</span>
              </span>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center">
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Setpoint (12.5):</span>
            <span style={{ color: '#4ade80', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {pressureVal ? `${pressureVal >= 12.5 ? '+' : ''}${(pressureVal - 12.5).toFixed(2)} BAR` : '0.00 BAR'}
            </span>
          </div>

          {pressureVal !== undefined && (
            <div className="d-flex justify-content-between align-items-center">
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Min / Max:</span>
              <span style={{ color: '#ffffff', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {(pressureVal - 0.32).toFixed(2)} / {(pressureVal + 0.28).toFixed(2)}
              </span>
            </div>
          )}

          <div
            className="d-flex justify-content-between align-items-center pt-1 mt-0.5"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <span style={{ color: '#64748b', fontWeight: 600 }}>Readings:</span>
            <span style={{ color: '#00b4d8', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              381
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const UgStationTrendChart = ({
  masterPressure = 12.3,
  masterFlow = 2406,
  isExpanded = false,
  onToggleExpand = null,
  height = 360
}) => {
  const [timeRange, setTimeRange] = useState('hourly'); // '15m' | 'hourly' | 'daily'
  const [chartType, setChartType] = useState('area'); // 'area' | 'line' | 'bar'

  const activeData = useMemo(() => {
    switch (timeRange) {
      case '15m':
        return UG_15M_DATA;
      case 'daily':
        return UG_DAILY_DATA;
      case 'hourly':
      default:
        return UG_24H_DATA;
    }
  }, [timeRange]);

  return (
    <div
      className="ug-trend-chart-card p-3 rounded-4 flex-grow-1 d-flex flex-column justify-content-between h-100"
      style={{
        background: 'radial-gradient(120% 120% at 50% 0%, rgba(8, 14, 28, 0.98) 0%, rgba(4, 9, 20, 0.99) 100%)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Sleek Top Bar: Title & Filter Controls (15 Min | Hourly | Daily) + Chart Type (Area | Line | Bar) + Expand */}
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="p-1.5 rounded-2 d-flex align-items-center justify-content-center"
            style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#4ade80',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.2)'
            }}
          >
            <Activity size={16} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-1.5">
              <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '13px', letterSpacing: '0.4px' }}>
                STATION GRAPH
              </span>
              <span
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  fontSize: '8.5px',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}
              >
                LIVE SCADA
              </span>
            </div>
            <small style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 500 }}>
              Manifold Pressure (BAR) &amp; Discharge Flow (LPM)
            </small>
          </div>
        </div>

        {/* Filter Controls: Time Range + Chart Type + Expand */}
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Time Filter Pills */}
          <div
            className="d-flex align-items-center p-1 rounded-pill"
            style={{
              background: 'rgba(11, 20, 38, 0.95)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)'
            }}
          >
            {[
              { id: '15m', label: '15 Min', icon: Clock },
              { id: 'hourly', label: 'Hourly', icon: TrendingUp },
              { id: 'daily', label: 'Daily', icon: Calendar }
            ].map((btn) => {
              const active = timeRange === btn.id;
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  type="button"
                  className="btn btn-sm border-0 d-flex align-items-center gap-1.5"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                      : 'transparent',
                    color: active ? '#ffffff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    boxShadow: active ? '0 2px 10px rgba(22, 163, 74, 0.45)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setTimeRange(btn.id)}
                >
                  <Icon size={12} style={{ color: active ? '#ffffff' : '#4ade80' }} />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>

          {/* Chart Type Segmented Switch: Area | Line | Bar (User screenshot style) */}
          <div
            className="d-inline-flex align-items-center"
            style={{
              background: '#081020',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '6px',
              padding: '2px'
            }}
          >
            {[
              { id: 'area', label: 'Area' },
              { id: 'line', label: 'Line' },
              { id: 'bar', label: 'Bar' }
            ].map((t, idx) => {
              const active = chartType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className="btn btn-sm border-0"
                  style={{
                    background: active ? '#00b4d8' : 'transparent',
                    color: active ? '#ffffff' : '#94a3b8',
                    fontWeight: active ? 800 : 600,
                    fontSize: '11px',
                    padding: '3px 12px',
                    borderRadius: '4px',
                    borderLeft: idx > 0 && !active && chartType !== (idx === 1 ? 'area' : 'line')
                      ? '1px solid rgba(255,255,255,0.2)'
                      : (idx > 0 && !active ? '1px solid rgba(255,255,255,0.12)' : 'none'),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setChartType(t.id)}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Expand / Collapse Button */}
          {onToggleExpand && (
            <button
              type="button"
              className="btn btn-sm border-0 d-flex align-items-center gap-1"
              style={{
                background: isExpanded ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: isExpanded ? '#ffffff' : '#4ade80',
                fontWeight: 800,
                fontSize: '11px',
                padding: '4px 11px',
                borderRadius: '6px',
                boxShadow: isExpanded ? '0 2px 10px rgba(22, 163, 74, 0.5)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={onToggleExpand}
              title={isExpanded ? 'Collapse to Split View' : 'Expand to Fullscreen'}
            >
              {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Full-Height Chart Canvas (Supports Area, Line, Bar) */}
      <div style={{ width: '100%', height: isExpanded ? '520px' : `${height}px` }} className="flex-grow-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={activeData}
            margin={{ top: 12, right: 15, left: -5, bottom: 0 }}
            barGap={4}
          >
            <defs>
              <linearGradient id="ugPressureAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#facc15" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#facc15" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="ugFlowAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="ugPressureBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#facc15" stopOpacity={1} />
                <stop offset="100%" stopColor="#ca8a04" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="ugFlowBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.85} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              fontWeight={700}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
            />

            {/* Left Axis: Pressure (BAR) */}
            <YAxis
              yAxisId="pressureAxis"
              stroke="#facc15"
              fontSize={11}
              fontWeight={700}
              domain={[8, 16]}
              tickLine={false}
              axisLine={{ stroke: 'rgba(250, 204, 21, 0.4)' }}
              tickFormatter={(v) => `${v} BAR`}
            />

            {/* Right Axis: Flow (LPM) */}
            <YAxis
              yAxisId="flowAxis"
              orientation="right"
              stroke="#38bdf8"
              fontSize={11}
              fontWeight={700}
              domain={[1000, 3000]}
              tickLine={false}
              axisLine={{ stroke: 'rgba(56, 189, 248, 0.4)' }}
              tickFormatter={(v) => `${v}`}
            />

            <Tooltip
              content={<UgCustomTooltip />}
              cursor={
                chartType === 'bar'
                  ? { fill: 'rgba(34, 197, 94, 0.08)' }
                  : { stroke: 'rgba(56, 189, 248, 0.45)', strokeWidth: 1.5, strokeDasharray: '4 4' }
              }
              wrapperStyle={{ outline: 'none', zIndex: 1000 }}
              animationDuration={150}
            />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#ffffff' }}
            />

            <ReferenceLine
              yAxisId="pressureAxis"
              y={12.5}
              stroke="#facc15"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              label={{ value: 'Setpoint (12.5 BAR)', fill: '#facc15', fontSize: 10, position: 'insideTopLeft' }}
            />

            {/* AREA MODE */}
            {chartType === 'area' && (
              <>
                <Area
                  yAxisId="pressureAxis"
                  type="monotone"
                  name="Discharge Pressure (BAR)"
                  dataKey="pressure"
                  stroke="#facc15"
                  strokeWidth={2.5}
                  fill="url(#ugPressureAreaGrad)"
                  activeDot={{ r: 6, fill: '#facc15', stroke: '#ffffff', strokeWidth: 2, filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))' }}
                  unit=" BAR"
                />
                <Area
                  yAxisId="flowAxis"
                  type="monotone"
                  name="Discharge Flow (LPM)"
                  dataKey="flow"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#ugFlowAreaGrad)"
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2, filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))' }}
                  unit=" LPM"
                />
              </>
            )}

            {/* LINE MODE */}
            {chartType === 'line' && (
              <>
                <Line
                  yAxisId="pressureAxis"
                  type="monotone"
                  name="Discharge Pressure (BAR)"
                  dataKey="pressure"
                  stroke="#facc15"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#facc15' }}
                  activeDot={{ r: 6, fill: '#facc15', stroke: '#ffffff', strokeWidth: 2, filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))' }}
                  unit=" BAR"
                />
                <Line
                  yAxisId="flowAxis"
                  type="monotone"
                  name="Discharge Flow (LPM)"
                  dataKey="flow"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38bdf8' }}
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2, filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))' }}
                  unit=" LPM"
                />
              </>
            )}

            {/* BAR MODE */}
            {chartType === 'bar' && (
              <>
                <Bar
                  yAxisId="pressureAxis"
                  name="Discharge Pressure (BAR)"
                  dataKey="pressure"
                  fill="url(#ugPressureBarGrad)"
                  stroke="#facc15"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={timeRange === 'daily' ? 24 : 16}
                  unit=" BAR"
                />
                <Bar
                  yAxisId="flowAxis"
                  name="Discharge Flow (LPM)"
                  dataKey="flow"
                  fill="url(#ugFlowBarGrad)"
                  stroke="#38bdf8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={timeRange === 'daily' ? 24 : 16}
                  unit=" LPM"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Slim Status Footer */}
      <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top border-secondary border-opacity-15 flex-wrap gap-2 fs-10">
        <span style={{ color: '#94a3b8' }}>
          PLC Transducer: <strong className="text-white">4-20mA Loop Calibrated</strong>
        </span>
        <span style={{ color: '#94a3b8' }}>
          Sampling: <strong className="text-info">100ms Pulse</strong> • Active Setpoint: <strong className="text-warning">{masterPressure.toFixed(1)} BAR</strong>
        </span>
      </div>
    </div>
  );
};

export default React.memo(UgStationTrendChart);
