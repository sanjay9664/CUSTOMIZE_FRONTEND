import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { Activity, Gauge, Droplets, Zap, ShieldCheck } from 'lucide-react';

const UG_24H_DATA = [
  { time: '00:00', pressure: 12.1, flow: 1600, powerKw: 16.8, pumps: 2 },
  { time: '02:00', pressure: 12.4, flow: 2100, powerKw: 22.6, pumps: 3 },
  { time: '04:00', pressure: 12.3, flow: 1950, powerKw: 22.6, pumps: 3 },
  { time: '06:00', pressure: 12.0, flow: 1800, powerKw: 16.8, pumps: 2 },
  { time: '08:00', pressure: 12.5, flow: 2450, powerKw: 22.6, pumps: 3 },
  { time: '10:00', pressure: 12.4, flow: 2406, powerKw: 22.6, pumps: 3 },
  { time: '12:00', pressure: 12.2, flow: 2350, powerKw: 22.6, pumps: 3 },
  { time: '14:00', pressure: 12.3, flow: 2400, powerKw: 22.6, pumps: 3 },
  { time: '16:00', pressure: 12.1, flow: 2150, powerKw: 16.8, pumps: 2 },
  { time: '18:00', pressure: 12.6, flow: 2467, powerKw: 22.6, pumps: 3 },
  { time: '20:00', pressure: 12.5, flow: 2400, powerKw: 22.6, pumps: 3 },
  { time: '22:00', pressure: 12.2, flow: 1900, powerKw: 16.8, pumps: 2 }
];

const PUMP_DUTY_DATA = [
  { pump: 'Pump P1', hours: 14.8, starts: 6, dutyPct: 74, energyKwh: 248, status: 'Running', color: '#22c55e' },
  { pump: 'Pump P2', hours: 18.2, starts: 8, dutyPct: 91, energyKwh: 340, status: 'Running', color: '#22c55e' },
  { pump: 'Pump P3', hours: 0.0, starts: 0, dutyPct: 0, energyKwh: 0, status: 'Standby', color: '#64748b' },
  { pump: 'Pump P4', hours: 15.1, starts: 5, dutyPct: 75, energyKwh: 255, status: 'Running', color: '#22c55e' }
];

// High-Contrast Tooltip for UG Trend
const UgCustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-3 shadow-2xl"
        style={{
          background: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          minWidth: '180px'
        }}
      >
        <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '6px' }}>
          Time: {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`ug-item-${index}`} className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px', marginBottom: '3px' }}>
            <span style={{ color: entry.color || '#38bdf8', fontWeight: 700 }}>
              {entry.name}:
            </span>
            <span style={{ color: '#ffffff', fontWeight: 900, marginLeft: '8px' }}>
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const UgStationTrendChart = ({ masterPressure = 12.3, masterFlow = 2406, height = 240 }) => {
  const [metricTab, setMetricTab] = useState('pressure_flow'); // 'pressure_flow' | 'duty_cycle'

  return (
    <div
      className="ug-trend-chart-card p-3 rounded-4"
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header with high contrast labels and mode toggle */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="p-2 rounded-3"
            style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#22c55e'
            }}
          >
            <Activity size={18} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 style={{ color: '#ffffff', fontWeight: 900, margin: 0, fontSize: '14px', letterSpacing: '0.5px' }}>
                {metricTab === 'pressure_flow' ? 'UG STATION DISCHARGE PRESSURE & FLOW TREND' : 'PUMP STATION DUTY & RUN-TIME DISTRIBUTION'}
              </h5>
              <span
                style={{
                  background: '#22c55e',
                  color: '#064e3b',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                LIVE SCADA
              </span>
            </div>
            <small style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 500 }}>
              {metricTab === 'pressure_flow'
                ? '24-Hour telemetry curve of Main Manifold Pressure (BAR) vs Water Flow Rate (LPM)'
                : 'Individual running hours, active duty cycle (%), and energy consumption per pump'}
            </small>
          </div>
        </div>

        {/* Tab Controls with clear high-contrast states */}
        <div
          className="d-flex align-items-center p-1 rounded-3"
          style={{ background: '#0b1329', border: '1px solid #1e293b' }}
        >
          <button
            type="button"
            className="btn btn-sm border-0"
            style={{
              background: metricTab === 'pressure_flow' ? '#22c55e' : 'transparent',
              color: metricTab === 'pressure_flow' ? '#042f2e' : '#cbd5e1',
              fontWeight: 800,
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setMetricTab('pressure_flow')}
          >
            Pressure & Flow (24h)
          </button>
          <button
            type="button"
            className="btn btn-sm border-0"
            style={{
              background: metricTab === 'duty_cycle' ? '#22c55e' : 'transparent',
              color: metricTab === 'duty_cycle' ? '#042f2e' : '#cbd5e1',
              fontWeight: 800,
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setMetricTab('duty_cycle')}
          >
            Pump Duty (Hours)
          </button>
        </div>
      </div>

      {/* Mini KPI Highlights Row */}
      <div
        className="p-2.5 rounded-3 mb-3 d-flex justify-content-around text-center flex-wrap gap-2"
        style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div>
          <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, display: 'block' }}>CURRENT PRESSURE</span>
          <span style={{ color: '#facc15', fontSize: '15px', fontWeight: 900 }}>{masterPressure.toFixed(1)} BAR</span>
          <small style={{ color: '#22c55e', fontSize: '10px', display: 'block', fontWeight: 600 }}>Normal Band (10-14)</small>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
          <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, display: 'block' }}>STATION DISCHARGE</span>
          <span style={{ color: '#38bdf8', fontSize: '15px', fontWeight: 900 }}>{masterFlow.toLocaleString()} LPM</span>
          <small style={{ color: '#94a3b8', fontSize: '10px', display: 'block', fontWeight: 600 }}>3 Pumps On-Line</small>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
          <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, display: 'block' }}>STATION STABILITY</span>
          <span style={{ color: '#4ade80', fontSize: '15px', fontWeight: 900 }}>99.8%</span>
          <small style={{ color: '#4ade80', fontSize: '10px', display: 'block', fontWeight: 600 }}>Zero Cavitation</small>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
          <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, display: 'block' }}>ROOFTOP HEAD</span>
          <span style={{ color: '#ffffff', fontSize: '15px', fontWeight: 900 }}>4.2 BAR</span>
          <small style={{ color: '#94a3b8', fontSize: '10px', display: 'block', fontWeight: 600 }}>Target Met</small>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: '100%', height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {metricTab === 'pressure_flow' ? (
            <AreaChart
              data={UG_24H_DATA}
              margin={{ top: 15, right: 15, left: -5, bottom: 0 }}
            >
              <defs>
                <linearGradient id="ugPressureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="ugFlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />

              <XAxis
                dataKey="time"
                stroke="#cbd5e1"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
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

              <Tooltip content={<UgCustomTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#ffffff' }}
              />

              {/* Safe Operational Band Line */}
              <ReferenceLine
                yAxisId="pressureAxis"
                y={12.5}
                stroke="#facc15"
                strokeDasharray="4 4"
                strokeOpacity={0.8}
                label={{ value: 'Setpoint (12.5 BAR)', fill: '#facc15', fontSize: 10, position: 'insideTopLeft' }}
              />

              <Area
                yAxisId="pressureAxis"
                type="monotone"
                name="Discharge Pressure (BAR)"
                dataKey="pressure"
                stroke="#facc15"
                strokeWidth={2.5}
                fill="url(#ugPressureGrad)"
                activeDot={{ r: 6, fill: '#facc15', stroke: '#ffffff', strokeWidth: 2 }}
                unit=" BAR"
              />

              <Area
                yAxisId="flowAxis"
                type="monotone"
                name="Discharge Flow (LPM)"
                dataKey="flow"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#ugFlowGrad)"
                activeDot={{ r: 5, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                unit=" LPM"
              />
            </AreaChart>
          ) : (
            <BarChart
              data={PUMP_DUTY_DATA}
              margin={{ top: 15, right: 15, left: -5, bottom: 0 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />

              <XAxis
                dataKey="pump"
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
                domain={[0, 24]}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                tickFormatter={(v) => `${v} hrs`}
              />

              <Tooltip content={<UgCustomTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#ffffff' }}
              />

              <Bar
                name="Active Run Time (Hours)"
                dataKey="hours"
                fill="#22c55e"
                stroke="#15803d"
                strokeWidth={1}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                unit=" hrs"
              />

              <Bar
                name="Duty Factor (%)"
                dataKey="dutyPct"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth={1}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                unit="%"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom Status strip */}
      <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top border-secondary border-opacity-15 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <ShieldCheck size={14} style={{ color: '#22c55e' }} />
          <span style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 600 }}>
            PLC Pressure Transducer: <strong style={{ color: '#ffffff' }}>4-20mA Loop Calibrated</strong>
          </span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '11px' }}>
          Sampling Rate: <span style={{ color: '#38bdf8', fontWeight: 700 }}>100 ms Telemetry Pulse</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(UgStationTrendChart);
