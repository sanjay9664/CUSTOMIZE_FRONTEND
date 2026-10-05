import React, { useMemo } from 'react';
import { Droplets } from 'lucide-react';

/**
 * PumpStationSchematic - SVG SCADA Digital Twin Visualization
 * Renders the inlet reservoirs, manifolds, 4 pump nodes, pressure dials, and rooftop pipeline.
 */
const PumpStationSchematic = ({
  tanks = [],
  pumps = [],
  isAnyPumpRunning = false,
  masterPressure = 0.0,
  isFullscreen = false,
  onOpenPumpSettings,
  onOpenLimitSettings
}) => {
  const masterPressureNum = typeof masterPressure === 'number' ? masterPressure : parseFloat(masterPressure) || 0.0;

  const masterRotation = useMemo(() => {
    const angle = (masterPressureNum / 10) * 270 - 135;
    return Math.min(Math.max(angle, -135), 135);
  }, [masterPressureNum]);

  return (
    <div
      className="scada-schematic-wrapper"
      style={{
        width: '100%',
        height: isFullscreen ? '850px' : 'auto',
        minHeight: '520px',
        padding: isFullscreen ? '40px' : '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 540"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: '1200px', transition: 'all 0.5s ease' }}
      >
        <defs>
          <pattern id="thickGrid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="1" />
          </pattern>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <filter id="liquidGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="wavePattern" x="0" y="0" width="80" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 15 Q20 0 40 15 T80 15 V20 H0 Z" fill="#38bdf8" />
            <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="80 0" dur="4s" repeatCount="indefinite" />
          </pattern>
          <clipPath id="tankInnerClip">
            <rect x="0" y="0" width="180" height="130" rx="8" />
          </clipPath>
        </defs>

        <rect width="100%" height="100%" fill="url(#thickGrid)" />
        <text x="60" y="30" fill="#f59e0b" fontSize="11" fontWeight="900">INLET RESERVOIRS</text>
        <text x="320" y="30" fill="#64748b" fontSize="11" fontWeight="900">MAIN MANIFOLD SYSTEM</text>

        {/* ── INLET RESERVOIRS ── */}
        {tanks.map((tank, idx) => {
          const yPos = 40 + (idx * 160);
          const hasLevel = tank.level !== null && tank.level !== undefined && !isNaN(Number(tank.level));
          const levelVal = hasLevel ? Number(tank.level) : 0;

          return (
            <g key={tank.id || idx} transform={`translate(60, ${yPos})`}>
              <rect
                width="180"
                height="130"
                rx="10"
                className="scada-tank-rect"
                fill="#0c121e"
                stroke={!tank.isOnline ? "#334155" : "#1e293b"}
                strokeWidth={isFullscreen ? 4 : 3}
              />

              {/* Floating Status Badge for Tank */}
              {tank.isMapped && !tank.isOnline && (
                <g transform="translate(12, -8)">
                  <rect width="52" height="15" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
                  <circle cx="8" cy="7.5" r="2.5" fill="#ef4444" />
                  <text x="16" y="10.5" fill="#ef4444" fontSize="7" fontWeight="black" letterSpacing="0.3">
                    OFFLINE
                  </text>
                </g>
              )}

              <g clipPath="url(#tankInnerClip)">
                <rect
                  x="0"
                  y={130 - (levelVal * 1.3)}
                  width="180"
                  height={levelVal * 1.3}
                  fill={tank.isOnline ? "url(#waterGrad)" : "#475569"}
                  fillOpacity={tank.isOnline ? "0.7" : "0.3"}
                />
                {tank.isOnline && levelVal > 0 && (
                  <rect
                    x="0"
                    y={125 - (levelVal * 1.3)}
                    width="180"
                    height="20"
                    fill="url(#wavePattern)"
                    fillOpacity="0.8"
                  />
                )}
                <text
                  x="90"
                  y="75"
                  textAnchor="middle"
                  fill={tank.isOnline && tank.isMapped ? "#fff" : "#64748b"}
                  fontSize="42"
                  fontWeight="900"
                  filter={tank.isOnline && tank.isMapped ? "url(#liquidGlow)" : "none"}
                >
                  {tank.isMapped && tank.isOnline && levelVal > 0 ? `${levelVal}%` : "--%"}
                </text>
              </g>
              <text x="90" y="152" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900">
                {tank.name}
              </text>
              <path d="M180 65 L220 65" fill="none" stroke="#1e293b" strokeWidth="18" />
            </g>
          );
        })}

        {/* ── TANK TO MANIFOLD PIPES ── */}
        {[105, 265, 425].map((y) => (
          <g key={y}>
            <path d={`M240 ${y} L280 ${y}`} fill="none" stroke="#1e293b" strokeWidth="26" strokeLinecap="round" />
            {isAnyPumpRunning && (
              <g>
                <path d={`M240 ${y} L280 ${y}`} fill="none" stroke="#0077be" strokeWidth="18" strokeOpacity="0.4" />
                <path d={`M240 ${y} L280 ${y}`} fill="none" stroke="#38bdf8" strokeWidth="18" strokeDasharray="30,20">
                  <animate attributeName="stroke-dashoffset" from="50" to="0" dur="0.8s" repeatCount="indefinite" />
                </path>
              </g>
            )}
          </g>
        ))}

        {/* ── MANIFOLD SYSTEM ── */}
        <path d="M280 100 L280 435" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />
        <path d="M280 270 L360 270" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />
        {isAnyPumpRunning && (
          <g>
            <path d="M280 270 L360 270" fill="none" stroke="#0077be" strokeWidth="20" strokeOpacity="0.4" />
            <path d="M280 270 L360 270" fill="none" stroke="#38bdf8" strokeWidth="20" strokeDasharray="40,30">
              <animate attributeName="stroke-dashoffset" from="70" to="0" dur="1s" repeatCount="indefinite" />
            </path>
          </g>
        )}
        <path d="M360 80 L360 450" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />

        {isAnyPumpRunning && (
          <g>
            <path d="M280 100 L280 435" fill="none" stroke="#0077be" strokeWidth="20" strokeOpacity="0.4" />
            <path d="M280 100 L280 435" fill="none" stroke="#38bdf8" strokeWidth="20" strokeDasharray="40,30">
              <animate attributeName="stroke-dashoffset" from="70" to="0" dur="1.2s" repeatCount="indefinite" />
            </path>
            <path d="M360 80 L360 450" fill="none" stroke="#0077be" strokeWidth="20" strokeOpacity="0.4" />
            <path d="M360 80 L360 450" fill="none" stroke="#38bdf8" strokeWidth="20" strokeDasharray="40,30">
              <animate attributeName="stroke-dashoffset" from="70" to="0" dur="1.2s" repeatCount="indefinite" />
            </path>
          </g>
        )}

        {/* ── 4 PUMP BRANCHES ── */}
        {[80, 180, 280, 380].map((y, i) => {
          const p = pumps[i] || {
            id: i + 1,
            name: `PUMP P${i + 1}`,
            status: 'Stopped',
            mode: 'AUTO',
            amp: '0.0',
            pressure: 0.0,
            startLimit: 1.5,
            stopLimit: 4.5,
            isOnline: false,
            isMapped: false
          };

          const active = p.status === 'Running';
          const pPressure = typeof p.pressure === 'number' ? p.pressure : parseFloat(p.pressure) || 0.0;
          const pStart = typeof p.startLimit === 'number' ? p.startLimit : parseFloat(p.startLimit) || 1.5;
          const pStop = typeof p.stopLimit === 'number' ? p.stopLimit : parseFloat(p.stopLimit) || 4.5;

          return (
            <g key={p.id || i} onClick={() => onOpenPumpSettings && onOpenPumpSettings(p)} style={{ cursor: 'pointer' }}>
              {/* Branch Intake Pipe */}
              <path d={`M360 ${y + 35} L440 ${y + 35}`} fill="none" stroke="#1e293b" strokeWidth="16" />
              {active && (
                <path d={`M360 ${y + 35} L440 ${y + 35}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,10">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                </path>
              )}

              {/* Pump Circular Impeller Icon */}
              <g transform={`translate(460, ${y + 35})`}>
                <circle
                  r="38"
                  fill="#111827"
                  stroke={!p.isOnline ? "#475569" : (active ? "#22c55e" : "#334155")}
                  strokeWidth="4"
                />
                {active && p.isOnline && (
                  <circle
                    r="46"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeDasharray="8,6"
                    opacity="0.8"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 0 0"
                      to="360 0 0"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <Droplets
                  size={32}
                  x="-16"
                  y="-16"
                  className={!p.isOnline ? "text-secondary opacity-25" : (active ? "text-success" : "text-muted")}
                />
              </g>

              {/* Connection to Card */}
              <path d={`M498 ${y + 35} L540 ${y + 35}`} fill="none" stroke="#1e293b" strokeWidth="16" />
              {active && (
                <path d={`M498 ${y + 35} L540 ${y + 35}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,10">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                </path>
              )}

              {/* Pump Status Card */}
              <g
                transform={`translate(540, ${y + 5})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onOpenPumpSettings && onOpenPumpSettings(p)}
              >
                <title>{p.deviceName ? `${p.name || `PUMP P${p.id}`} (${p.deviceName})` : (p.name || `PUMP P${p.id}`)}</title>
                <rect
                  width="200"
                  height="60"
                  rx="8"
                  fill="#0f172a"
                  fillOpacity="0.9"
                  stroke={!p.isOnline ? "#334155" : (active ? "#22c55e" : "#1e293b")}
                  strokeWidth="2"
                />

                {/* Floating Online/Offline Status Badge */}
                {p.isMapped && (
                  <g transform="translate(12, -8)">
                    <rect width="52" height="15" rx="4" fill="#0f172a" stroke={p.isOnline ? "#22c55e" : "#ef4444"} strokeWidth="1" />
                    <circle cx="8" cy="7.5" r="2.5" fill={p.isOnline ? "#22c55e" : "#ef4444"} />
                    {p.isOnline && (
                      <circle cx="8" cy="7.5" r="4.5" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.6">
                        <animate attributeName="r" values="2.5;6" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <text x="16" y="10.5" fill={p.isOnline ? "#22c55e" : "#ef4444"} fontSize="7" fontWeight="black" letterSpacing="0.3">
                      {p.isOnline ? "ONLINE" : "OFFLINE"}
                    </text>
                  </g>
                )}

                {/* Pump Label & Dynamic Current */}
                <text x="14" y="21" fill="#94a3b8" fontSize="11" fontWeight="bold">
                  {p.name || `PUMP P${p.id}`}
                  {p.isMapped && p.isOnline && p.amp !== undefined && (
                    <tspan fill="#f59e0b" fontSize="12" fontWeight="900" dx="6">
                      | {Number(p.amp).toFixed(1)} A
                    </tspan>
                  )}
                </text>

                {/* Pump Operating State & Mode */}
                <text
                  x="14"
                  y="44"
                  fill={!p.isMapped ? "#64748b" : (!p.isOnline ? "#64748b" : (active ? "#22c55e" : "#64748b"))}
                  fontSize={active ? "15" : "13"}
                  fontWeight="900"
                >
                  {!p.isMapped ? "STOPPED" : (!p.isOnline ? "STOPPED" : p.status.toUpperCase())}
                  {p.isMapped && (
                    <tspan fill={!p.isOnline ? '#475569' : (p.mode === 'AUTO' ? '#38bdf8' : '#f59e0b')} fontSize="10" dy="-1" dx="4">
                      | {p.mode}
                    </tspan>
                  )}
                </text>

                {/* Individual Pump Pressure Gauge */}
                <g
                  transform="translate(165, 30)"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => onOpenLimitSettings && onOpenLimitSettings(e, p)}
                >
                  <circle r="22" fill="#111827" stroke="#334155" strokeWidth="1.5" />

                  {/* Numeric Scale */}
                  {[0, 2.5, 5, 7.5, 10].map(v => {
                    const angle = (v / 10) * 270 - 135;
                    const x = Math.sin(angle * Math.PI / 180) * 16;
                    const y = -Math.cos(angle * Math.PI / 180) * 16;
                    return (
                      <text key={v} x={x} y={y + 3} textAnchor="middle" fill="#94a3b8" fontSize="5" fontWeight="bold">
                        {v}
                      </text>
                    );
                  })}

                  {/* Tick Marks */}
                  {[...Array(21)].map((_, tickIdx) => {
                    const val = tickIdx * 0.5;
                    const angle = (val / 10) * 270 - 135;
                    return (
                      <line
                        key={tickIdx}
                        x1="0"
                        y1="-21"
                        x2="0"
                        y2={tickIdx % 2 === 0 ? "-17" : "-19"}
                        stroke="#334155"
                        strokeWidth="0.5"
                        transform={`rotate(${angle})`}
                      />
                    );
                  })}

                  {/* Start Limit (Green) & Stop Limit (Red) */}
                  <line
                    x1="0"
                    y1="-22"
                    x2="0"
                    y2="-15"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    transform={`rotate(${(pStart / 10) * 270 - 135})`}
                    style={{ transition: 'all 0.5s ease' }}
                  />
                  <line
                    x1="0"
                    y1="-22"
                    x2="0"
                    y2="-15"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    transform={`rotate(${(pStop / 10) * 270 - 135})`}
                    style={{ transition: 'all 0.5s ease' }}
                  />

                  {/* Gauge Needle */}
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="-19"
                    stroke={active && p.isOnline ? "#ef4444" : "#475569"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    transform={`rotate(${(pPressure / 10) * 270 - 135})`}
                    style={{ transition: 'transform 0.8s ease-out' }}
                  />
                  <circle r="2.5" fill="#fff" />

                  <text y="24" textAnchor="middle" fill={p.isOnline ? "#38bdf8" : "#475569"} fontSize="9" fontWeight="900">
                    {active && p.isOnline ? pPressure.toFixed(1) : "0.0"} <tspan fontSize="6" dy="-1">BAR</tspan>
                  </text>
                </g>
              </g>

              {/* Discharge Pipe from Pump to Final Manifold */}
              <path d={`M740 ${y + 35} L820 ${y + 35}`} fill="none" stroke="#1e293b" strokeWidth="16" />
              {active && (
                <path d={`M740 ${y + 35} L820 ${y + 35}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,10">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                </path>
              )}
            </g>
          );
        })}

        {/* ── FINAL MANIFOLD & DISCHARGE PIPELINE ── */}
        <path d="M820 70 L820 460 L1040 460" fill="none" stroke="#1e293b" strokeWidth="28" strokeLinecap="round" />
        {isAnyPumpRunning && (
          <path
            d="M820 75 L820 460 L1050 460"
            fill="none"
            stroke="#38bdf8"
            strokeWidth={isFullscreen ? 18 : 14}
            strokeOpacity="0.8"
            strokeDasharray="30,20"
            filter="url(#liquidGlow)"
          >
            <animate attributeName="stroke-dashoffset" from="50" to="0" dur="1s" repeatCount="indefinite" />
          </path>
        )}

        {/* ── MASTER PRESSURE GAUGE ── */}
        <g transform="translate(935, 230)">
          <circle r={isFullscreen ? 95 : 75} fill="#f8fafc" stroke="#94a3b8" strokeWidth={isFullscreen ? 8 : 6} />
          <circle r={isFullscreen ? 88 : 70} fill="none" stroke="#334155" strokeWidth="1" />
          {[...Array(11)].map((_, t) => (
            <line
              key={t}
              x1="0"
              y1={isFullscreen ? "-85" : "-65"}
              x2="0"
              y2={t % 2 === 0 ? (isFullscreen ? "-65" : "-48") : (isFullscreen ? "-75" : "-55")}
              stroke={t > 7 ? "#ef4444" : "#1e293b"}
              strokeWidth={t % 2 === 0 ? "4" : "2"}
              transform={`rotate(${t * 27 - 135})`}
            />
          ))}
          <circle r="10" fill="#1e293b" />
          <g transform={`rotate(${masterRotation})`} style={{ transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <path d="M-6 0 L0 -85 L6 0 Z" fill="#1e293b" />
          </g>
          <text
            x="0"
            y={isFullscreen ? 120 : 98}
            textAnchor="middle"
            fill="#fff"
            fontSize={isFullscreen ? 26 : 19}
            fontWeight="900"
            filter="url(#liquidGlow)"
          >
            {masterPressureNum.toFixed(1)} BAR
          </text>
        </g>

        <text x="1040" y="495" textAnchor="end" fill="#38bdf8" fontSize={isFullscreen ? 28 : 20} fontWeight="900">
          {'➤ DIRECT TO ROOFTOP NETWORK'}
        </text>
      </svg>
    </div>
  );
};

export default React.memo(PumpStationSchematic);
