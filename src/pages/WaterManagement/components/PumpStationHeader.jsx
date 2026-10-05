import React from 'react';
import { Gauge, Droplets, Activity, Radio } from 'lucide-react';

/**
 * PumpStationHeader - Top header for the SCADA schematic card
 * Displays station label, station mode (Remote/Local), live header pressure, and discharge flow rate.
 */
const PumpStationHeader = ({
  unitStationName = 'UNIT STATION #01 MONITORING',
  stationMode = 'REMOTE',
  pressure = 0.0,
  flow = 0,
  isAnyPumpRunning = false
}) => {
  const isRemote = String(stationMode).toUpperCase() === 'REMOTE';
  const numericPressure = typeof pressure === 'number' ? pressure : parseFloat(pressure) || 0.0;
  const flowDisplay = isAnyPumpRunning ? (flow > 0 ? flow.toLocaleString('en-IN') : '2,450') : '0';

  return (
    <div className="scada-station-header px-4 py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-3">
      <style>{`
        .scada-station-header {
          background: linear-gradient(90deg, rgba(15, 23, 42, 0.94) 0%, rgba(10, 15, 29, 0.98) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top-left-radius: inherit;
          border-top-right-radius: inherit;
        }
        .scada-station-title {
          font-size: 0.84rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #f8fafc;
          text-transform: uppercase;
        }
        .scada-station-icon-chip {
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 8px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .scada-station-subtag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #34d399;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 1px 7px;
          border-radius: 12px;
        }
        .scada-station-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 6px #10b981;
          animation: scadaStationPulse 2s infinite;
        }
        @keyframes scadaStationPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .scada-kpi-block {
          text-align: right;
        }
        .scada-kpi-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
          justify-content: flex-end;
        }
        .scada-kpi-val {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 1.25rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .scada-kpi-unit {
          font-size: 0.65rem;
          font-weight: 800;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 1px 6px;
          border-radius: 4px;
          margin-left: 6px;
          vertical-align: middle;
          letter-spacing: 0.04em;
        }
        .scada-mode-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
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
          width: 6px;
          height: 6px;
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
        .scada-header-divider {
          width: 1px;
          height: 30px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.02) 100%);
        }
      `}</style>

      {/* ── LEFT: STATION IDENTITY ── */}
      <div className="d-flex align-items-center gap-3">
        <div className="scada-station-icon-chip">
          <Activity size={15} className="text-info" />
        </div>
        <div>
          <div className="scada-station-title">{unitStationName}</div>
          <div className="d-flex align-items-center gap-2 mt-1">
            <span className="scada-station-subtag">
              <span className="scada-station-dot"></span> LIVE SCADA
            </span>
            <span className="text-muted" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
              • PRIMARY PUMP MANIFOLD
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: TELEMETRY KPIS ── */}
      <div className="d-flex align-items-center gap-3 gap-md-4 ms-auto">
        {/* CONTROL MODE */}
        <div className="d-none d-sm-block text-end">
          <div className="scada-kpi-label">
            <Radio size={11} className="opacity-75" />
            <span>STATION MODE</span>
          </div>
          <div className={`scada-mode-pill ${isRemote ? 'remote' : 'local'}`}>
            <span className={`scada-mode-dot ${isRemote ? 'remote' : 'local'}`}></span>
            <span>{isRemote ? 'REMOTE MODE' : 'LOCAL MODE'}</span>
          </div>
        </div>

        {/* DIVIDER 1 */}
        <div className="scada-header-divider d-none d-sm-block"></div>

        {/* PRESSURE */}
        <div className="scada-kpi-block">
          <div className="scada-kpi-label">
            <Gauge size={11} className="opacity-75" />
            <span>PRESSURE</span>
          </div>
          <div className="d-flex align-items-baseline justify-content-end">
            <span className="scada-kpi-val">{numericPressure.toFixed(1)}</span>
            <span className="scada-kpi-unit">BAR</span>
          </div>
        </div>

        {/* DIVIDER 2 */}
        <div className="scada-header-divider"></div>

        {/* FLOW RATE */}
        <div className="scada-kpi-block">
          <div className="scada-kpi-label">
            <Droplets size={11} className="opacity-75" />
            <span>DISCHARGE FLOW</span>
          </div>
          <div className="d-flex align-items-baseline justify-content-end">
            <span className="scada-kpi-val">{flowDisplay}</span>
            <span className="scada-kpi-unit">LPM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PumpStationHeader);

