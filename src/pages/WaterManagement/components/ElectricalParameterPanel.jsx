import React from 'react';
import { Layers, Zap, Activity, Cpu, Clock, ShieldCheck, Gauge, Droplets, Radio } from 'lucide-react';

/**
 * ElectricalParameterPanel - Right-side SCADA telemetry panel
 * Displays station parameters (pressure, flow, mode), 3-phase electrical analysis,
 * power/billing, safety monitor alarms, and system controller.
 */
const ElectricalParameterPanel = ({
  electrical = {},
  isOnline = false,
  isFullscreen = false,
  stationMode = 'REMOTE',
  pressure = 0.0,
  flow = 0,
  isAnyPumpRunning = false
}) => {
  const {
    voltage_ry = '--',
    voltage_yb = '--',
    voltage_br = '--',
    current_phase_r = '--',
    current_phase_y = '--',
    current_phase_b = '--',
    power_factor = '--',
    frequency = '--',
    total_kw = '--',
    grid_kw = '--',
    total_kva = '--',
    kwh = '--',
    kvah = '--',
    overload_trip = 'OK',
    low_balance_cut = 'OFF',
    overload_limit_reached = 'NO',
    controller = 'Schneider Modicon',
    updated_at = 'Active'
  } = electrical;

  // Station Parameter Helpers
  const currentStationMode = stationMode || electrical.stationMode || 'REMOTE';
  const currentPressure = pressure ?? electrical.pressure ?? electrical.masterPressure ?? 0.0;
  const currentFlow = flow ?? electrical.flow ?? electrical.masterFlow ?? 0;
  const isRunning = isAnyPumpRunning ?? electrical.isAnyPumpRunning ?? false;

  const isRemote = String(currentStationMode).toUpperCase() === 'REMOTE';
  const numericPressure = typeof currentPressure === 'number' ? currentPressure : parseFloat(currentPressure) || 0.0;
  const flowDisplay = isRunning 
    ? (currentFlow > 0 ? currentFlow.toLocaleString('en-IN') : '2,450') 
    : (currentFlow > 0 ? currentFlow.toLocaleString('en-IN') : '0');

  // Formatting helpers
  const displayFreq = frequency !== '--' 
    ? (String(frequency).toLowerCase().includes('hz') ? frequency : `${frequency} Hz`) 
    : '--';

  const displayTotalLoad = total_kw !== '--'
    ? (String(total_kw).toLowerCase().includes('kw') ? total_kw : `${total_kw} kW`)
    : '--';

  const heroDemandValue = grid_kw !== '--' ? grid_kw : (total_kva !== '--' ? total_kva : '--');

  const isTrip = String(overload_trip).toUpperCase() === 'TRIP';
  const isCut = String(low_balance_cut).toUpperCase() === 'CUT' || String(low_balance_cut).toUpperCase() === 'ON';
  const isLimitReached = String(overload_limit_reached).toUpperCase() === 'YES';

  return (
    <div className="scada-elec-panel rounded-4 h-100 overflow-hidden d-flex flex-column shadow-lg">

      <style>{`
        .scada-elec-panel {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.88) 0%, rgba(10, 15, 29, 0.96) 100%);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .scada-elec-header {
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.35);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .scada-elec-title {
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #f1f5f9;
          text-transform: uppercase;
        }
        .scada-elec-time {
          font-size: 0.7rem;
          color: #94a3b8;
        }
        .scada-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
        }
        .scada-status-pill.online {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #34d399;
        }
        .scada-status-pill.offline {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
        }
        .scada-led-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .scada-led-dot.online {
          background-color: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: scadaPulseGlow 2s infinite;
        }
        .scada-led-dot.offline {
          background-color: #ef4444;
        }
        @keyframes scadaPulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .scada-section-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        .scada-telemetry-card {
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 10px;
          transition: all 0.2s ease;
        }
        .scada-telemetry-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.4);
        }
        .scada-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .scada-card-title {
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .scada-card-tag {
          font-size: 0.6rem;
          font-weight: 700;
          color: #64748b;
          background: rgba(255, 255, 255, 0.04);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .scada-phase-cell {
          text-align: center;
          flex: 1;
        }
        .scada-phase-tag {
          font-size: 0.65rem;
          font-weight: 800;
          display: inline-block;
          margin-bottom: 3px;
        }
        .scada-phase-tag.r { color: #f43f5e; }
        .scada-phase-tag.y { color: #fbbf24; }
        .scada-phase-tag.b { color: #38bdf8; }
        .scada-phase-tag.neutral { color: #94a3b8; }
        .scada-phase-val {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 1.02rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .scada-phase-unit {
          font-size: 0.62rem;
          color: #64748b;
          font-weight: 600;
          margin-left: 2px;
        }
        .scada-mini-tile {
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 8px 10px;
        }
        .scada-hero-demand {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%);
          border: 1px solid rgba(245, 158, 11, 0.22);
          border-radius: 10px;
          padding: 10px 12px;
          position: relative;
          overflow: hidden;
        }
        .scada-hero-demand::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: #f59e0b;
        }
        .scada-hero-val {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 1.35rem;
          font-weight: 900;
          color: #fbbf24;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .scada-energy-box {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 7px 10px;
          flex: 1;
        }
        .scada-safety-chip {
          flex: 1;
          min-width: 82px;
          padding: 6px 8px;
          border-radius: 8px;
          font-size: 0.68rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          text-align: center;
          border: 1px solid transparent;
        }
        .scada-safety-chip.ok {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.25);
          color: #34d399;
        }
        .scada-safety-chip.neutral {
          background: rgba(148, 163, 184, 0.08);
          border-color: rgba(148, 163, 184, 0.18);
          color: #94a3b8;
        }
        .scada-safety-chip.alert {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.45);
          color: #f87171;
          animation: scadaPulseAlert 1.5s infinite;
        }
        @keyframes scadaPulseAlert {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .scada-mode-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .scada-mode-pill.remote {
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #38bdf8;
        }
        .scada-mode-pill.local {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fbbf24;
        }
        .scada-mode-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .scada-mode-dot.remote {
          background-color: #38bdf8;
          box-shadow: 0 0 6px #38bdf8;
        }
        .scada-mode-dot.local {
          background-color: #fbbf24;
          box-shadow: 0 0 6px #fbbf24;
        }
        .scada-kpi-unit {
          font-size: 0.65rem;
          font-weight: 800;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 1px 6px;
          border-radius: 4px;
          letter-spacing: 0.04em;
        }
        .scada-footer {
          padding: 9px 14px;
          background: rgba(0, 0, 0, 0.45);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.68rem;
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="scada-elec-header d-flex justify-content-between align-items-center">
        <div>
          <div className="d-flex align-items-center gap-2">
            <div className="p-1 rounded bg-info bg-opacity-10 text-info">
              <Zap size={13} />
            </div>
            <span className="scada-elec-title">PARAMETERS & TELEMETRY</span>
          </div>
          <div className="scada-elec-time d-flex align-items-center gap-1 mt-1">
            <Clock size={11} className="opacity-75" />
            <span>{updated_at}</span>
          </div>
        </div>

        <div className={`scada-status-pill ${isOnline ? 'online' : 'offline'}`}>
          <div className={`scada-led-dot ${isOnline ? 'online' : 'offline'}`}></div>
          <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div
        className="flex-grow-1 p-3 overflow-y-auto custom-scrollbar"
        style={{ maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '620px' }}
      >
        {/* SECTION: STATION PARAMETERS (PRESSURE, FLOW, MODE) */}
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="scada-section-badge text-info">
              <div className="p-1 rounded bg-info bg-opacity-10">
                <Gauge size={12} />
              </div>
              <span>Station Parameters</span>
            </div>

            {/* STATION MODE PILL */}
            <div className={`scada-mode-pill ${isRemote ? 'remote' : 'local'}`}>
              <span className={`scada-mode-dot ${isRemote ? 'remote' : 'local'}`}></span>
              <span>{isRemote ? 'REMOTE MODE' : 'LOCAL MODE'}</span>
            </div>
          </div>

          {/* DUAL KPI TILES: PRESSURE & FLOW */}
          <div className="d-flex gap-2">
            {/* PRESSURE */}
            <div className="scada-telemetry-card flex-fill p-2">
              <div className="scada-card-head mb-1">
                <span className="scada-card-title d-flex align-items-center gap-1">
                  <Gauge size={11} className="text-info" />
                  PRESSURE
                </span>
                <span className="scada-card-tag">MANIFOLD</span>
              </div>
              <div className="d-flex align-items-baseline justify-content-between">
                <span className="scada-phase-val text-white" style={{ fontSize: '1.25rem' }}>
                  {numericPressure.toFixed(1)}
                </span>
                <span className="scada-kpi-unit">BAR</span>
              </div>
            </div>

            {/* FLOW */}
            <div className="scada-telemetry-card flex-fill p-2">
              <div className="scada-card-head mb-1">
                <span className="scada-card-title d-flex align-items-center gap-1">
                  <Droplets size={11} className="text-info" />
                  FLOW
                </span>
                <span className="scada-card-tag">DISCHARGE</span>
              </div>
              <div className="d-flex align-items-baseline justify-content-between">
                <span className="scada-phase-val text-white" style={{ fontSize: '1.25rem' }}>
                  {flowDisplay}
                </span>
                <span className="scada-kpi-unit">LPM</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: PHASE ANALYSIS */}
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="scada-section-badge text-info">
              <div className="p-1 rounded bg-info bg-opacity-10">
                <Layers size={12} />
              </div>
              <span>Phase Analysis</span>
            </div>
          </div>

          {/* AVG VOLTAGE CARD */}
          <div className="scada-telemetry-card mb-2">
            <div className="scada-card-head">
              <span className="scada-card-title">AVG LINE VOLTAGE</span>
              <span className="scada-card-tag">L-L (V)</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <div className="scada-phase-cell">
                <span className="scada-phase-tag neutral">RY</span>
                <div className="scada-phase-val">
                  {voltage_ry}
                  {voltage_ry !== '--' && <span className="scada-phase-unit">V</span>}
                </div>
              </div>
              <div className="border-end border-secondary border-opacity-20" style={{ height: '24px' }}></div>
              <div className="scada-phase-cell">
                <span className="scada-phase-tag neutral">YB</span>
                <div className="scada-phase-val">
                  {voltage_yb}
                  {voltage_yb !== '--' && <span className="scada-phase-unit">V</span>}
                </div>
              </div>
              <div className="border-end border-secondary border-opacity-20" style={{ height: '24px' }}></div>
              <div className="scada-phase-cell">
                <span className="scada-phase-tag neutral">BR</span>
                <div className="scada-phase-val">
                  {voltage_br}
                  {voltage_br !== '--' && <span className="scada-phase-unit">V</span>}
                </div>
              </div>
            </div>
          </div>

          {/* CURRENT PER PHASE CARD */}
          <div className="scada-telemetry-card mb-2">
            <div className="scada-card-head">
              <span className="scada-card-title">CURRENT PER PHASE</span>
              <span className="scada-card-tag">RMS (A)</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <div className="scada-phase-cell">
                <span className="scada-phase-tag r">PHASE R</span>
                <div className="scada-phase-val">
                  {current_phase_r}
                  {current_phase_r !== '--' && <span className="scada-phase-unit">A</span>}
                </div>
              </div>
              <div className="border-end border-secondary border-opacity-20" style={{ height: '24px' }}></div>
              <div className="scada-phase-cell">
                <span className="scada-phase-tag y">PHASE Y</span>
                <div className="scada-phase-val">
                  {current_phase_y}
                  {current_phase_y !== '--' && <span className="scada-phase-unit">A</span>}
                </div>
              </div>
              <div className="border-end border-secondary border-opacity-20" style={{ height: '24px' }}></div>
              <div className="scada-phase-cell">
                <span className="scada-phase-tag b">PHASE B</span>
                <div className="scada-phase-val">
                  {current_phase_b}
                  {current_phase_b !== '--' && <span className="scada-phase-unit">A</span>}
                </div>
              </div>
            </div>
          </div>

          {/* POWER QUALITY MINI TILES */}
          <div className="d-flex gap-2 mb-2">
            <div className="scada-mini-tile flex-fill">
              <div className="text-secondary mb-1" style={{ fontSize: '0.64rem', fontWeight: 700 }}>
                POWER FACTOR
              </div>
              <div className="d-flex justify-content-between align-items-baseline">
                <span className="text-white fw-bold" style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>
                  {power_factor}
                </span>
                <span className="text-muted" style={{ fontSize: '0.62rem' }}>cos φ</span>
              </div>
            </div>

            <div className="scada-mini-tile flex-fill">
              <div className="text-secondary mb-1" style={{ fontSize: '0.64rem', fontWeight: 700 }}>
                FREQUENCY
              </div>
              <div className="d-flex justify-content-between align-items-baseline">
                <span className="text-white fw-bold" style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>
                  {displayFreq}
                </span>
              </div>
            </div>
          </div>

          {/* TOTAL LOAD BAR */}
          <div className="scada-mini-tile d-flex justify-content-between align-items-center">
            <span className="text-secondary" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
              TOTAL LOAD
            </span>
            <span className="text-info fw-black" style={{ fontSize: '0.95rem', fontFamily: 'monospace' }}>
              {displayTotalLoad}
            </span>
          </div>
        </div>

        {/* SECTION 2: POWER & BILLING */}
        <div className="mb-3">
          <div className="scada-section-badge text-warning mb-2">
            <div className="p-1 rounded bg-warning bg-opacity-10">
              <Zap size={12} />
            </div>
            <span>Power & Billing</span>
          </div>

          {/* HERO POWER CONSUMPTION (kVA) */}
          <div className="scada-hero-demand mb-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-warning fw-bold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Power Consumption
              </small>
              <span className="badge bg-warning bg-opacity-20 text-warning" style={{ fontSize: '0.6rem' }}>
                DEMAND
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <span className="scada-hero-val">{heroDemandValue}</span>
              <span className="text-warning fw-bold" style={{ fontSize: '0.75rem' }}>kVA</span>
            </div>
          </div>

          {/* DUAL ENERGY METERS (KWH / KVAH) */}
          <div className="d-flex gap-2">
            <div className="scada-energy-box">
              <div className="text-secondary mb-1" style={{ fontSize: '0.64rem', fontWeight: 700 }}>
                KWH (ACTIVE)
              </div>
              <div className="text-info fw-bold" style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
                {kwh}
              </div>
            </div>

            <div className="scada-energy-box">
              <div className="text-secondary mb-1" style={{ fontSize: '0.64rem', fontWeight: 700 }}>
                KVAH (APPARENT)
              </div>
              <div className="text-info fw-bold" style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
                {kvah}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: SAFETY MONITORS */}
        <div className="mb-2">
          <div className="scada-section-badge text-danger mb-2">
            <div className="p-1 rounded bg-danger bg-opacity-10">
              <Activity size={12} />
            </div>
            <span>Safety Monitors</span>
          </div>

          <div className="d-flex gap-2">
            {/* OVERLOAD */}
            <div className={`scada-safety-chip ${isTrip ? 'alert' : 'ok'}`}>
              <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>OVERLOAD:</span>
              <span>{overload_trip}</span>
            </div>

            {/* LOW BALANCE */}
            <div className={`scada-safety-chip ${isCut ? 'alert' : 'neutral'}`}>
              <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>LOW BAL:</span>
              <span>{low_balance_cut}</span>
            </div>

            {/* LIMIT */}
            <div className={`scada-safety-chip ${isLimitReached ? 'alert' : 'neutral'}`}>
              <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>LIMIT:</span>
              <span>{overload_limit_reached}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="scada-footer d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-1 text-secondary">
          <Cpu size={12} className="text-info" />
          <span style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.04em' }}>CONTROLLER:</span>
          <span className="text-white fw-bold" style={{ fontSize: '0.68rem' }}>
            {String(controller).toUpperCase()}
          </span>
        </div>
        <div className="d-flex align-items-center gap-1">
          <div className="scada-led-dot online" style={{ width: '5px', height: '5px' }}></div>
          <span className="text-secondary" style={{ fontSize: '0.6rem', fontWeight: 700 }}>PLC RTU</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ElectricalParameterPanel);

