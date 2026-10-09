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
  Legend
} from 'recharts';
import { BarChart3, Clock, Calendar, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';

const FIFTEEN_MIN_DATA = [
  { time: '08:00', pumping: 1400, demand: 2100 },
  { time: '08:15', pumping: 1650, demand: 2250 },
  { time: '08:30', pumping: 1900, demand: 2300 },
  { time: '08:45', pumping: 2100, demand: 2150 },
  { time: '09:00', pumping: 2200, demand: 2050 },
  { time: '09:15', pumping: 2050, demand: 1950 },
  { time: '09:30', pumping: 1850, demand: 1800 },
  { time: '09:45', pumping: 1950, demand: 1750 },
  { time: '10:00', pumping: 2000, demand: 1900 },
  { time: '10:15', pumping: 2150, demand: 1850 },
  { time: '10:30', pumping: 1900, demand: 1800 },
  { time: '10:45', pumping: 1750, demand: 1700 }
];

const HOURLY_DISPATCH_DATA = [
  { time: '00:00', pumping: 1200, demand: 400 },
  { time: '02:00', pumping: 1800, demand: 250 },
  { time: '04:00', pumping: 1600, demand: 350 },
  { time: '06:00', pumping: 900, demand: 1600 },
  { time: '08:00', pumping: 1400, demand: 2200 },
  { time: '10:00', pumping: 2000, demand: 1900 },
  { time: '12:00', pumping: 1800, demand: 1750 },
  { time: '14:00', pumping: 1500, demand: 1400 },
  { time: '16:00', pumping: 1100, demand: 1300 },
  { time: '18:00', pumping: 2100, demand: 2300 },
  { time: '20:00', pumping: 2400, demand: 2100 },
  { time: '22:00', pumping: 1700, demand: 900 }
];

const DAILY_DISPATCH_DATA = [
  { time: 'Mon', pumping: 2150, demand: 1980 },
  { time: 'Tue', pumping: 2280, demand: 2100 },
  { time: 'Wed', pumping: 2420, demand: 2250 },
  { time: 'Thu', pumping: 2350, demand: 2180 },
  { time: 'Fri', pumping: 2490, demand: 2320 },
  { time: 'Sat', pumping: 1850, demand: 1720 },
  { time: 'Sun', pumping: 1720, demand: 1590 }
];

// Custom High-Contrast Glassmorphic SCADA Tooltip (matching reference image)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const pumpingVal = payload.find(p => p.dataKey === 'pumping')?.value || 0;
    const demandVal = payload.find(p => p.dataKey === 'demand')?.value || 0;
    const diff = pumpingVal - demandVal;
    const isSurplus = diff >= 0;

    // Format IST timestamp header
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
              background: isSurplus ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: isSurplus ? '#4ade80' : '#f87171',
              border: `1px solid ${isSurplus ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
            }}
          >
            {isSurplus ? 'SURPLUS' : 'DEFICIT'}
          </span>
        </div>

        {/* Primary Metric Highlight: Average / Transfer Supply */}
        <div className="d-flex justify-content-between align-items-baseline mb-2">
          <span style={{ color: '#00b4d8', fontSize: '13px', fontWeight: 800 }}>
            Transfer Supply:
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
            {pumpingVal.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: 700 }}>LPM</span>
          </span>
        </div>

        {/* Secondary Clean Key-Value Rows (matching layout from image) */}
        <div className="d-flex flex-column gap-1.5" style={{ fontSize: '11px' }}>
          <div className="d-flex justify-content-between align-items-center">
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Building Demand:</span>
            <span style={{ color: '#ffffff', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {demandVal.toLocaleString()} <span style={{ color: '#fbbf24', fontSize: '9.5px' }}>LPM</span>
            </span>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Net Differential:</span>
            <span style={{ color: isSurplus ? '#4ade80' : '#f87171', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {isSurplus ? `+${diff.toLocaleString()}` : `${diff.toLocaleString()}`} LPM
            </span>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>Min / Max Band:</span>
            <span style={{ color: '#ffffff', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(pumpingVal * 0.88).toLocaleString()} / {Math.round(pumpingVal * 1.08).toLocaleString()}
            </span>
          </div>

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

const HydraulicBarChart = ({
  agLevel = 55,
  masterFlow = 2450,
  isExpanded = false,
  onToggleExpand = null
}) => {
  const [timeRange, setTimeRange] = useState('hourly'); // '15m' | 'hourly' | 'daily'
  const [chartType, setChartType] = useState('bar'); // 'area' | 'line' | 'bar'

  const activeData = useMemo(() => {
    switch (timeRange) {
      case '15m':
        return FIFTEEN_MIN_DATA;
      case 'daily':
        return DAILY_DISPATCH_DATA;
      case 'hourly':
      default:
        return HOURLY_DISPATCH_DATA;
    }
  }, [timeRange]);

  return (
    <div
      className="hydraulic-bar-chart-card p-3 rounded-4 flex-grow-1 d-flex flex-column justify-content-between h-100"
      style={{
        background: 'radial-gradient(120% 120% at 50% 0%, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Sleek Top Bar: Title & Filter Controls (15 Min | Hourly | Daily) + Chart Type (Area | Line | Bar) + Expand */}
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="p-1.5 rounded-2 d-flex align-items-center justify-content-center"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)'
            }}
          >
            <BarChart3 size={16} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-1.5">
              <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '13px', letterSpacing: '0.4px' }}>
                HYDRAULIC FLOW CHART
              </span>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  fontSize: '8.5px',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}
              >
                FLOW VS DEMAND
              </span>
            </div>
            <small style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 500 }}>
              Transfer Pumping vs Building Consumption
            </small>
          </div>
        </div>

        {/* Filter Controls: Time Range + Chart Type + Expand */}
        <div className="d-flex align-items-center flex-wrap gap-2">
          {/* Time Filter Pills */}
          <div
            className="d-flex align-items-center p-1 rounded-pill"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
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
                      ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                      : 'transparent',
                    color: active ? '#ffffff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    boxShadow: active ? '0 2px 10px rgba(2, 132, 199, 0.45)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setTimeRange(btn.id)}
                >
                  <Icon size={12} style={{ color: active ? '#ffffff' : '#38bdf8' }} />
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
                background: isExpanded ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: isExpanded ? '#ffffff' : '#38bdf8',
                fontWeight: 800,
                fontSize: '11px',
                padding: '4px 11px',
                borderRadius: '6px',
                boxShadow: isExpanded ? '0 2px 10px rgba(2, 132, 199, 0.5)' : 'none',
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

      {/* Dynamic Full-Height Chart Container (Supports Area, Line, Bar) */}
      <div style={{ width: '100%', height: isExpanded ? '520px' : '360px' }} className="flex-grow-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={activeData}
            margin={{ top: 12, right: 10, left: -10, bottom: 0 }}
            barGap={4}
          >
            <defs>
              <linearGradient id="pumpingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="demandAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="pumpingBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="demandBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.85} />
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
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              fontWeight={700}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={
                chartType === 'bar'
                  ? { fill: 'rgba(56, 189, 248, 0.08)' }
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

            {/* AREA MODE */}
            {chartType === 'area' && (
              <>
                <Area
                  type="monotone"
                  name="Transfer Pumping (LPM)"
                  dataKey="pumping"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fill="url(#pumpingAreaGrad)"
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2, filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))' }}
                />
                <Area
                  type="monotone"
                  name="Building Demand (LPM)"
                  dataKey="demand"
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  fill="url(#demandAreaGrad)"
                  activeDot={{ r: 6, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2, filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' }}
                />
              </>
            )}

            {/* LINE MODE */}
            {chartType === 'line' && (
              <>
                <Line
                  type="monotone"
                  name="Transfer Pumping (LPM)"
                  dataKey="pumping"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38bdf8' }}
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2, filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))' }}
                />
                <Line
                  type="monotone"
                  name="Building Demand (LPM)"
                  dataKey="demand"
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#fbbf24' }}
                  activeDot={{ r: 6, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2, filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' }}
                />
              </>
            )}

            {/* BAR MODE */}
            {chartType === 'bar' && (
              <>
                <Bar
                  name="Transfer Pumping (LPM)"
                  dataKey="pumping"
                  fill="url(#pumpingBarGrad)"
                  stroke="#38bdf8"
                  strokeWidth={1}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={timeRange === 'daily' ? 30 : 20}
                />
                <Bar
                  name="Building Demand (LPM)"
                  dataKey="demand"
                  fill="url(#demandBarGrad)"
                  stroke="#fbbf24"
                  strokeWidth={1}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={timeRange === 'daily' ? 30 : 20}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Slim Status Footer */}
      <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top border-secondary border-opacity-15 flex-wrap gap-2 fs-10">
        <span style={{ color: '#94a3b8' }}>
          Sampling: <strong className="text-info">Dynamic SCADA Dispatch</strong>
        </span>
        <span style={{ color: '#4ade80', fontWeight: 800 }}>
          ● Hydraulic Balance: Optimal Surplus Band
        </span>
      </div>
    </div>
  );
};

export default React.memo(HydraulicBarChart);
