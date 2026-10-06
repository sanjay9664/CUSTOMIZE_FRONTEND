import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import { Badge } from 'react-bootstrap';
import { BarChart3, TrendingUp, Layers, Activity } from 'lucide-react';

const HOURLY_DISPATCH_DATA = [
  { time: '00:00', pumping: 1200, demand: 400, fill: 85 },
  { time: '02:00', pumping: 1800, demand: 250, fill: 92 },
  { time: '04:00', pumping: 1600, demand: 350, fill: 95 },
  { time: '06:00', pumping: 900, demand: 1600, fill: 88 },
  { time: '08:00', pumping: 1400, demand: 2200, fill: 75 },
  { time: '10:00', pumping: 2000, demand: 1900, fill: 72 },
  { time: '12:00', pumping: 1800, demand: 1750, fill: 70 },
  { time: '14:00', pumping: 1500, demand: 1400, fill: 71 },
  { time: '16:00', pumping: 1100, demand: 1300, fill: 69 },
  { time: '18:00', pumping: 2100, demand: 2300, fill: 64 },
  { time: '20:00', pumping: 2400, demand: 2100, fill: 68 },
  { time: '22:00', pumping: 1700, demand: 900, fill: 79 }
];

const TANK_LEVEL_COMPARISON_DATA = [
  { name: 'AG Domestic', level: 55, capacity: 50000, type: 'AG', color: '#38bdf8' },
  { name: 'AG Flushing', level: 78, capacity: 35000, type: 'AG', color: '#818cf8' },
  { name: 'UG Domestic Sump', level: 68, capacity: 200000, type: 'UG', color: '#0284c7' },
  { name: 'UG Fire Reserve', level: 95, capacity: 350000, type: 'UG', color: '#ef4444' },
  { name: 'UG Process Tank', level: 58, capacity: 100000, type: 'UG', color: '#22c55e' }
];

// Custom High-Contrast Glassmorphic Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-2.5 rounded-3 border border-secondary border-opacity-25 shadow-2xl"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          minWidth: '160px'
        }}
      >
        <div className="text-white fw-bold fs-9 mb-1.5 border-bottom border-secondary border-opacity-20 pb-1">
          {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="d-flex justify-content-between align-items-center fs-10 mb-1">
            <span style={{ color: entry.color, fontWeight: 700 }}>
              {entry.name}:
            </span>
            <span className="text-white fw-black ms-2">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              {entry.unit || (entry.dataKey === 'fill' || entry.dataKey === 'level' ? '%' : ' LPM')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const HydraulicBarChart = ({ agLevel = 55, masterFlow = 2450 }) => {
  const [chartMode, setChartMode] = useState('hourly'); // 'hourly' | 'tanks'

  return (
    <div
      className="hydraulic-bar-chart-card p-3 rounded-4 mt-3"
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Chart Top Header & Mode Switcher */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="p-2 rounded-3"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8'
            }}
          >
            <BarChart3 size={18} />
          </div>
          <div>
            <h5 style={{ color: '#ffffff', fontWeight: 900, margin: 0, fontSize: '14px', letterSpacing: '0.5px' }}>
              {chartMode === 'hourly' ? '24-HR PUMPING VS DEMAND DISPATCH' : 'RESERVOIR STORAGE LEVEL COMPARISON'}
            </h5>
            <small style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 500 }}>
              {chartMode === 'hourly' ? 'Hourly Supply Flow (LPM) vs Building Consumption' : 'Real-time liquid depth across all AG & UG storage tanks'}
            </small>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div
          className="d-flex align-items-center p-1 rounded-3"
          style={{ background: '#0b1329', border: '1px solid #1e293b' }}
        >
          <button
            type="button"
            className="btn btn-sm border-0"
            style={{
              background: chartMode === 'hourly' ? '#38bdf8' : 'transparent',
              color: chartMode === 'hourly' ? '#0f172a' : '#cbd5e1',
              fontWeight: 800,
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px'
            }}
            onClick={() => setChartMode('hourly')}
          >
            Hourly Flow
          </button>
          <button
            type="button"
            className="btn btn-sm border-0"
            style={{
              background: chartMode === 'tanks' ? '#38bdf8' : 'transparent',
              color: chartMode === 'tanks' ? '#0f172a' : '#cbd5e1',
              fontWeight: 800,
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px'
            }}
            onClick={() => setChartMode('tanks')}
          >
            Tank Levels (%)
          </button>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div style={{ width: '100%', height: '230px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'hourly' ? (
            <BarChart
              data={HOURLY_DISPATCH_DATA}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#cbd5e1"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              />
              <YAxis
                stroke="#cbd5e1"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontWeight: 700, color: '#ffffff' }}
              />
              <Bar
                name="Transfer Pumping (LPM)"
                dataKey="pumping"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth={1.5}
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
              <Bar
                name="Building Demand (LPM)"
                dataKey="demand"
                fill="#fbbf24"
                stroke="#d97706"
                strokeWidth={1.5}
                radius={[4, 4, 0, 0]}
                maxBarSize={18}
              />
            </BarChart>
          ) : (
            <BarChart
              data={TANK_LEVEL_COMPARISON_DATA}
              margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#cbd5e1"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              />
              <YAxis
                stroke="#cbd5e1"
                fontSize={11}
                fontWeight={700}
                domain={[0, 100]}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                name="Liquid Depth (%)"
                dataKey="level"
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              >
                {TANK_LEVEL_COMPARISON_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={1} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom Summary Tags */}
      <div className="d-flex justify-content-between align-items-center pt-2 mt-1 border-top border-secondary border-opacity-15 text-light fs-10 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <span style={{ width: '8px', height: '8px', background: '#38bdf8', borderRadius: '2px', display: 'inline-block' }}></span>
          <span className="text-secondary">Morning Peak: <strong className="text-white">08:00 (2,200 LPM)</strong></span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '2px', display: 'inline-block' }}></span>
          <span className="text-secondary">Evening Peak: <strong className="text-white">18:00 (2,300 LPM)</strong></span>
        </div>
        <span className="text-success fw-bold">Hydraulic Balance: +12% Surplus</span>
      </div>
    </div>
  );
};

export default React.memo(HydraulicBarChart);
