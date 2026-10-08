import React, { useMemo } from 'react';
import { Droplets } from 'lucide-react';

/**
 * PumpStationSchematic - SVG SCADA Digital Twin Visualization
 * 3D Industrial SCADA Schematic matching enterprise reference design:
 * - 3 Rounded Inlet Reservoirs with clear subtitles
 * - 3D Cylindrical Metallic Blue Piping with Flanges
 * - 4 Animated Pump Stations with Mini Power Gauges
 * - High-Contrast Master Analog Pressure Gauge
 * - Animated Flow to Rooftop Network
 */
const PumpStationSchematic = ({
  tanks = [],
  pumps = [],
  isAnyPumpRunning = false,
  masterPressure = 0.0,
  isFullscreen = false,
  minHeight = '420px',
  onOpenPumpSettings,
  onOpenLimitSettings
}) => {
  const masterPressureNum = typeof masterPressure === 'number' ? masterPressure : parseFloat(masterPressure) || 0.0;

  const masterRotation = useMemo(() => {
    const angle = (masterPressureNum / 16) * 270 - 135;
    return Math.min(Math.max(angle, -135), 135);
  }, [masterPressureNum]);

  return (
    <div
      className="scada-schematic-wrapper"
      style={{
        width: '100%',
        height: isFullscreen ? '850px' : (minHeight === '100%' ? '100%' : 'auto'),
        minHeight: isFullscreen ? '850px' : (minHeight === '100%' ? '0' : minHeight),
        maxHeight: isFullscreen ? '850px' : '100%',
        padding: isFullscreen ? '30px' : '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1180 500"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: '1180px', transition: 'all 0.4s ease' }}
      >
        <defs>
          {/* Subtle SCADA Grid Pattern */}
          <pattern id="scadaGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          </pattern>

          {/* 3D Vertical Cylindrical Blue Pipe */}
          <linearGradient id="pipeVert3D" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#082f49" />
            <stop offset="15%" stopColor="#0284c7" />
            <stop offset="40%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#034574" />
          </linearGradient>

          {/* 3D Horizontal Cylindrical Blue Pipe */}
          <linearGradient id="pipeHoriz3D" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#082f49" />
            <stop offset="15%" stopColor="#0284c7" />
            <stop offset="40%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#034574" />
          </linearGradient>

          {/* Metallic Top Rim & Flanges */}
          <linearGradient id="flangeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Deep Water Fluid Gradient */}
          <linearGradient id="fluidGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Glowing Filter for SCADA Active Lines */}
          <filter id="liquidGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Continuous Wave Surface Animation */}
          <pattern id="wavePattern" x="0" y="0" width="80" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 12 Q20 0 40 12 T80 12 V20 H0 Z" fill="#38bdf8" opacity="0.9" />
            <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="80 0" dur="3s" repeatCount="indefinite" />
          </pattern>

          {/* Clip Paths for 3 Reservoirs */}
          <clipPath id="clipTank0"><rect x="0" y="0" width="168" height="86" rx="8" /></clipPath>
          <clipPath id="clipTank1"><rect x="0" y="0" width="168" height="86" rx="8" /></clipPath>
          <clipPath id="clipTank2"><rect x="0" y="0" width="168" height="86" rx="8" /></clipPath>
        </defs>

        {/* Canvas Background Grid */}
        <rect width="100%" height="100%" fill="url(#scadaGrid)" />

        {/* Top Header Labels */}
        <text x="60" y="26" fill="#f59e0b" fontSize="12" fontWeight="900" letterSpacing="0.8">
          INLET RESERVOIRS
        </text>
        <text x="560" y="26" fill="#94a3b8" fontSize="12" fontWeight="900" letterSpacing="0.8">
          MAIN MANIFOLD SYSTEM
        </text>

        {/* ── 1. THREE INLET RESERVOIRS (COLLISION FREE, MATCHING REFERENCE) ── */}
        {[
          { y: 38,  defaultName: 'FIRE RESERVOIR' },
          { y: 162, defaultName: 'DOMESTIC SUMP' },
          { y: 286, defaultName: 'PROCESS TANK' }
        ].map((cfg, idx) => {
          const tank = tanks[idx] || {};
          const isDeviceMapped = Boolean(tanks[idx] && tanks[idx].isMapped !== false);
          const hasLevel = isDeviceMapped && tank.level !== null && tank.level !== undefined && !isNaN(Number(tank.level));
          let rawLevelNum = hasLevel ? Number(tank.level) : 0;
          if (rawLevelNum > 0 && rawLevelNum <= 1) rawLevelNum = rawLevelNum * 100;
          else if (rawLevelNum > 100 && rawLevelNum <= 10000) rawLevelNum = rawLevelNum / 100;
          const levelVal = Math.min(100, Math.max(0, Math.round(rawLevelNum)));
          const tankName = (isDeviceMapped && (tank.name || tank.deviceName)) ? (tank.name || tank.deviceName) : cfg.defaultName;

          return (
            <g key={idx} transform={`translate(60, ${cfg.y})`}>
              {/* Outer Tank Body */}
              <rect
                width="168"
                height="86"
                rx="8"
                fill="#07111e"
                stroke={hasLevel ? "#0284c7" : "#1e293b"}
                strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))' }}
              />

              {/* Metallic Top Lip */}
              <rect x="0" y="0" width="168" height="5" rx="2.5" fill="url(#flangeGrad)" />

              {/* Liquid Wave & Level Fill — only when level > 0 */}
              <g clipPath={`url(#clipTank${idx})`}>
                {levelVal > 0 && (
                  <>
                    <rect
                      x="0"
                      y={86 - (levelVal * 0.86)}
                      width="168"
                      height={levelVal * 0.86}
                      fill="url(#fluidGrad)"
                      opacity="0.88"
                    />
                    <rect
                      x="0"
                      y={80 - (levelVal * 0.86)}
                      width="168"
                      height="16"
                      fill="url(#wavePattern)"
                    />
                  </>
                )}
                {/* Center Display: % when filled, empty label when not */}
                {levelVal > 0 ? (
                  <text
                    x="84"
                    y="52"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="28"
                    fontWeight="900"
                    filter="url(#liquidGlow)"
                  >
                    {levelVal}%
                  </text>
                ) : (
                  <>
                    <text
                      x="84"
                      y="45"
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="11"
                      fontWeight="800"
                      letterSpacing="1.5"
                    >
                      {hasLevel ? 'EMPTY' : 'NOT MAPPED'}
                    </text>
                    <text
                      x="84"
                      y="62"
                      textAnchor="middle"
                      fill="#334155"
                      fontSize="9"
                      fontWeight="700"
                    >
                      {hasLevel ? '0 L — Awaiting Fill' : '-- No Device --'}
                    </text>
                  </>
                )}
              </g>

              {/* Subtitle Underneath Tank (Zero Collision) */}
              <text
                x="84"
                y="104"
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="10"
                fontWeight="800"
                letterSpacing="0.5"
                textLength={tankName.length > 20 ? 154 : undefined}
                lengthAdjust={tankName.length > 20 ? "spacingAndGlyphs" : undefined}
              >
                {tankName}
              </text>
            </g>
          );
        })}

        {/* ── 2. 3D INDUSTRIAL PIPING (RESERVOIRS TO INTAKE MANIFOLD) ── */}
        {/* Horizontal Tank Outlet Pipes */}
        {[81, 205, 329].map((y, i) => (
          <g key={i}>
            {/* 3D Blue Pipe */}
            <rect x="228" y={y - 9} width="42" height="18" fill="url(#pipeHoriz3D)" rx="2" />
            {/* Flange Collar at Tank Outlet */}
            <rect x="226" y={y - 12} width="4" height="24" fill="url(#flangeGrad)" rx="1" />
            <rect x="266" y={y - 12} width="4" height="24" fill="url(#flangeGrad)" rx="1" />
            {/* Flow stream */}
            {isAnyPumpRunning && (
              <path d={`M228 ${y} L270 ${y}`} stroke="#38bdf8" strokeWidth="6" strokeDasharray="14,10" filter="url(#liquidGlow)">
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.8s" repeatCount="indefinite" />
              </path>
            )}
          </g>
        ))}

        {/* Vertical Intake Manifold Pipe */}
        <rect x="264" y="72" width="20" height="268" fill="url(#pipeVert3D)" rx="4" />
        {isAnyPumpRunning && (
          <path d="M274 72 L274 340" stroke="#38bdf8" strokeWidth="8" strokeDasharray="20,15" filter="url(#liquidGlow)">
            <animate attributeName="stroke-dashoffset" from="35" to="0" dur="1s" repeatCount="indefinite" />
          </path>
        )}

        {/* Cross Connection to Distribution Manifold */}
        <rect x="284" y="200" width="46" height="18" fill="url(#pipeHoriz3D)" rx="2" />
        <rect x="326" y="197" width="4" height="24" fill="url(#flangeGrad)" rx="1" />
        {isAnyPumpRunning && (
          <path d="M284 209 L330 209" stroke="#38bdf8" strokeWidth="6" strokeDasharray="14,10" filter="url(#liquidGlow)">
            <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.8s" repeatCount="indefinite" />
          </path>
        )}

        {/* Vertical Distribution Manifold Pipe */}
        <rect x="326" y="55" width="20" height="330" fill="url(#pipeVert3D)" rx="4" />
        {isAnyPumpRunning && (
          <path d="M336 55 L336 385" stroke="#38bdf8" strokeWidth="8" strokeDasharray="20,15" filter="url(#liquidGlow)">
            <animate attributeName="stroke-dashoffset" from="35" to="0" dur="1.1s" repeatCount="indefinite" />
          </path>
        )}

        {/* ── 3. FOUR PUMP BRANCHES WITH ANIMATED IMPELLERS & GAUGES ── */}
        {[65, 168, 272, 375].map((y, i) => {
          const p = pumps[i] || {
            id: i + 1,
            name: `PUMP P${i + 1}`,
            status: i === 2 ? 'Stopped' : 'Running',
            mode: 'AUTO',
            amp: i === 0 ? '13.6' : (i === 1 ? '10.0' : (i === 2 ? '0.0' : '13.4')),
            pressure: 12.2,
            isOnline: true,
            isMapped: true
          };

          const active = p.status === 'Running' || p.status === 'RUNNING';
          const ampVal = p.amp ? Number(p.amp).toFixed(1) : (active ? '13.5' : '0.0');

          return (
            <g key={i} onClick={() => onOpenPumpSettings && onOpenPumpSettings(p)} style={{ cursor: 'pointer' }}>
              {/* Branch Intake Pipe (Distribution Manifold to Impeller) */}
              <rect x="346" y={y - 8} width="58" height="16" fill="url(#pipeHoriz3D)" rx="2" />
              {active && (
                <path d={`M346 ${y} L404 ${y}`} stroke="#38bdf8" strokeWidth="5" strokeDasharray="12,8">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.6s" repeatCount="indefinite" />
                </path>
              )}

              {/* Pump Circular Impeller */}
              <g transform={`translate(424, ${y})`}>
                <circle r="24" fill="#0b1322" stroke={active ? "#22c55e" : "#334155"} strokeWidth="3" />
                {active && (
                  <circle r="29" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="8,6" opacity="0.9">
                    <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="3s" repeatCount="indefinite" />
                  </circle>
                )}
                <Droplets
                  size={20}
                  x="-10"
                  y="-10"
                  className={active ? "text-success" : "text-secondary"}
                  style={{ color: active ? '#4ade80' : '#64748b' }}
                />
              </g>

              {/* Short Pipe to Status Card */}
              <rect x="450" y={y - 8} width="36" height="16" fill="url(#pipeHoriz3D)" rx="2" />
              <rect x="482" y={y - 10} width="4" height="20" fill="url(#flangeGrad)" rx="1" />

              {/* Pump Status Card */}
              <g transform={`translate(486, ${y - 27})`}>
                <rect
                  width="196"
                  height="54"
                  rx="7"
                  fill="#0c1527"
                  stroke={active ? "#22c55e" : "#1e293b"}
                  strokeWidth="1.8"
                  style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))' }}
                />

                {/* Floating Online/Offline Pill */}
                <g transform="translate(10, -7)">
                  <rect width="46" height="14" rx="4" fill="#0f172a" stroke={p.isOnline ? "#22c55e" : "#ef4444"} strokeWidth="1" />
                  <circle cx="7" cy="7" r="2.5" fill={p.isOnline ? "#22c55e" : "#ef4444"} />
                  <text x="14" y="10" fill={p.isOnline ? "#22c55e" : "#ef4444"} fontSize="7.5" fontWeight="900" letterSpacing="0.3">
                    {p.isOnline ? "ONLINE" : "OFFLINE"}
                  </text>
                </g>

                {/* Pump Label & Amps */}
                <text x="12" y="22" fill="#ffffff" fontSize="12" fontWeight="bold">
                  {p.name || `PUMP P${i + 1}`}
                  <tspan fill="#f59e0b" fontSize="12.5" fontWeight="900" dx="6">
                    | {ampVal} A
                  </tspan>
                </text>

                {/* Operating State & Mode */}
                <text
                  x="12"
                  y="42"
                  fill={active ? "#22c55e" : "#64748b"}
                  fontSize={active ? "13.5" : "12.5"}
                  fontWeight="900"
                  filter={active ? "url(#liquidGlow)" : "none"}
                >
                  {active ? "RUNNING" : "STOPPED"}
                  <tspan fill="#38bdf8" fontSize="10.5" fontWeight="800" dx="6">
                    | {p.mode || 'AUTO'}
                  </tspan>
                </text>

                {/* Mini Analog Pressure/Power Gauge */}
                <g transform="translate(162, 23)">
                  <circle r="15" fill="#111827" stroke="#334155" strokeWidth="1.2" />
                  {/* Tick Marks */}
                  {[0, 1, 2, 3, 4, 5, 6].map(t => (
                    <line
                      key={t}
                      x1="0"
                      y1="-14"
                      x2="0"
                      y2="-11"
                      stroke={t > 4 ? "#ef4444" : "#94a3b8"}
                      strokeWidth="1"
                      transform={`rotate(${t * 45 - 135})`}
                    />
                  ))}
                  {/* Needle */}
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="-11"
                    stroke={active ? "#facc15" : "#64748b"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    transform={`rotate(${active ? '45' : '-135'})`}
                  />
                  <circle r="2" fill="#fff" />
                  <text y="24" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="900">
                    {active ? '12.2 kW' : '0.0 kW'}
                  </text>
                </g>
              </g>

              {/* Branch Discharge Pipe (Status Card to Discharge Manifold) */}
              <rect x="682" y={y - 8} width="66" height="16" fill="url(#pipeHoriz3D)" rx="2" />
              <rect x="682" y={y - 10} width="4" height="20" fill="url(#flangeGrad)" rx="1" />
              {active && (
                <path d={`M682 ${y} L748 ${y}`} stroke="#38bdf8" strokeWidth="5" strokeDasharray="12,8">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.6s" repeatCount="indefinite" />
                </path>
              )}
            </g>
          );
        })}

        {/* ── 4. VERTICAL DISCHARGE MANIFOLD & ROOFTOP NETWORK PIPELINE ── */}
        <rect x="748" y="55" width="20" height="375" fill="url(#pipeVert3D)" rx="4" />
        {/* Flange Collar at Elbow */}
        <rect x="746" y="420" width="24" height="4" fill="url(#flangeGrad)" rx="1" />
        {/* Horizontal Rooftop Network Delivery Pipe */}
        <rect x="748" y="420" width="280" height="20" fill="url(#pipeHoriz3D)" rx="4" />

        {isAnyPumpRunning && (
          <g>
            <path d="M758 55 L758 430 L1028 430" fill="none" stroke="#38bdf8" strokeWidth="9" strokeDasharray="30,20" filter="url(#liquidGlow)">
              <animate attributeName="stroke-dashoffset" from="50" to="0" dur="1s" repeatCount="indefinite" />
            </path>
          </g>
        )}

        {/* ── 5. MASTER ANALOG PRESSURE GAUGE (WHITE DIAL, CRISP VISIBILITY) ── */}
        <g transform="translate(915, 215)">
          {/* Dial Outer Metallic Bezel */}
          <circle r="66" fill="#f8fafc" stroke="#94a3b8" strokeWidth="6" style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.6))' }} />
          <circle r="60" fill="none" stroke="#334155" strokeWidth="1" />

          {/* Dial Ticks (0 to 16 BAR) */}
          {[...Array(17)].map((_, t) => (
            <line
              key={t}
              x1="0"
              y1="-58"
              x2="0"
              y2={t % 2 === 0 ? "-44" : "-50"}
              stroke={t >= 13 ? "#ef4444" : "#1e293b"}
              strokeWidth={t % 2 === 0 ? "3" : "1.5"}
              transform={`rotate(${t * 16.875 - 135})`}
            />
          ))}

          {/* Pivot & Needle */}
          <circle r="7" fill="#1e293b" />
          <g transform={`rotate(${masterRotation})`} style={{ transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <path d="M-4 0 L0 -54 L4 0 Z" fill="#ef4444" />
          </g>
          <circle r="3" fill="#ffffff" />

          {/* Master Pressure Large Bold Readout */}
          <text
            x="0"
            y="94"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="24"
            fontWeight="900"
            filter="url(#liquidGlow)"
          >
            {masterPressureNum.toFixed(1)} BAR
          </text>
          <text
            x="0"
            y="112"
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="10"
            fontWeight="800"
            letterSpacing="0.8"
          >
            HEADER PRESSURE
          </text>
        </g>

        {/* ── 6. DIRECT TO ROOFTOP NETWORK ARROW BANNER ── */}
        <text
          x="1028"
          y="462"
          textAnchor="end"
          fill="#38bdf8"
          fontSize="17"
          fontWeight="900"
          filter="url(#liquidGlow)"
          letterSpacing="0.6"
        >
          ➤ DIRECT TO ROOFTOP NETWORK
        </text>
      </svg>
    </div>
  );
};

export default React.memo(PumpStationSchematic);
