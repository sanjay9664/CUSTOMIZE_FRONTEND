import React, { useMemo } from 'react';
import { Droplets } from 'lucide-react';

/**
 * PumpStationSchematic - SVG SCADA Digital Twin Visualization
 * Dynamic 3D Industrial SCADA Schematic:
 * - Dynamically renders only mapped Inlet Reservoirs (2 or 3 tanks)
 * - 3D Cylindrical Metallic Blue Piping with Flanges
 * - Dynamically renders only mapped Pump Stations (e.g. P1, P2, P3 — P4 hidden when unmapped)
 * - Dedicated Analog Pressure Gauge for EVERY mapped pump in its own row ("kaun kiska gauge hai")
 * - Dynamic animated flow to Rooftop Network
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

  // 1. FILTER ONLY MAPPED RESERVOIRS
  const mappedTanks = useMemo(() => {
    const list = (tanks || []).filter(t => t && t.isMapped !== false && (t.level !== null && t.level !== undefined || (t.name && t.name !== 'PROCESS TANK')));
    return list.length > 0 ? list : (tanks || []).slice(0, 2);
  }, [tanks]);

  // 2. FILTER ONLY MAPPED PUMPS (Strictly exclude unmapped Pump P4)
  const mappedPumps = useMemo(() => {
    const list = (pumps || []).filter(p => {
      if (!p) return false;
      if (p.isMapped === false) return false;
      // Pump 4 is unmapped unless an explicit 4th pump device is connected
      if (p.id === 4) {
        if (!p.deviceId || p.isMapped !== true) return false;
        const name = String(p.deviceName || p.name || '').toLowerCase();
        if (name.includes('tank') || name.includes('sump') || name.includes('reservoir')) return false;
        if (!name.includes('p4') && !name.includes('pump4') && !name.endsWith('4')) return false;
      }
      return true;
    });
    return list.length > 0 ? list : (pumps || []).filter(p => p && p.id !== 4).slice(0, 3);
  }, [pumps]);

  // 3. DYNAMIC Y POSITIONS FOR TANKS
  const tankConfigs = useMemo(() => {
    const count = mappedTanks.length;
    if (count === 1) {
      return [{ y: 175, defaultName: 'WATER RESERVOIR' }];
    }
    if (count === 2) {
      return [
        { y: 95, defaultName: 'DOMESTIC SUMP' },
        { y: 255, defaultName: 'RAW WATER TANK' }
      ];
    }
    return [
      { y: 38, defaultName: 'FIRE RESERVOIR' },
      { y: 162, defaultName: 'DOMESTIC SUMP' },
      { y: 286, defaultName: 'PROCESS TANK' }
    ];
  }, [mappedTanks.length]);

  const tankOutletYs = useMemo(() => {
    return tankConfigs.map(c => c.y + 43);
  }, [tankConfigs]);

  const intakeManifoldTop = useMemo(() => Math.min(...tankOutletYs) - 10, [tankOutletYs]);
  const intakeManifoldBottom = useMemo(() => Math.max(...tankOutletYs) + 10, [tankOutletYs]);
  const intakeMidY = useMemo(() => Math.round((intakeManifoldTop + intakeManifoldBottom) / 2), [intakeManifoldTop, intakeManifoldBottom]);

  // 4. DYNAMIC Y POSITIONS FOR PUMPS
  const pumpYs = useMemo(() => {
    const count = mappedPumps.length;
    if (count === 1) return [215];
    if (count === 2) return [145, 295];
    if (count === 3) return [90, 215, 340];
    if (count === 4) return [65, 168, 272, 375];
    return mappedPumps.map((_, i) => Math.round(55 + i * (350 / (count - 1))));
  }, [mappedPumps.length]);

  const distManifoldTop = useMemo(() => Math.min(...pumpYs) - 15, [pumpYs]);
  const distManifoldBottom = useMemo(() => Math.max(...pumpYs) + 15, [pumpYs]);
  const dischargeManifoldTop = useMemo(() => Math.min(...pumpYs) - 15, [pumpYs]);

  const gaugeRadius = mappedPumps.length <= 3 ? 38 : 31;

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

          {/* Clip Paths for Reservoirs */}
          {mappedTanks.map((_, idx) => (
            <clipPath key={`clipTank${idx}`} id={`clipTank${idx}`}>
              <rect x="0" y="0" width="168" height="86" rx="8" />
            </clipPath>
          ))}
        </defs>

        {/* Canvas Background Grid */}
        <rect width="100%" height="100%" fill="url(#scadaGrid)" />

        {/* Top Header Labels */}
        <text x="60" y="26" fill="#f59e0b" fontSize="12" fontWeight="900" letterSpacing="0.8">
          INLET RESERVOIRS ({mappedTanks.length})
        </text>
        <text x="560" y="26" fill="#94a3b8" fontSize="12" fontWeight="900" letterSpacing="0.8">
          MAIN MANIFOLD SYSTEM ({mappedPumps.length} PUMPS)
        </text>
        <text x="950" y="26" fill="#38bdf8" fontSize="12" fontWeight="900" letterSpacing="0.8">
          PUMP PRESSURE GAUGES
        </text>

        {/* ── 1. DYNAMIC MAPPED INLET RESERVOIRS ── */}
        {mappedTanks.map((tank, idx) => {
          const cfg = tankConfigs[idx] || { y: 100 + idx * 150, defaultName: `RESERVOIR #${idx + 1}` };
          const hasLevel = tank.level !== null && tank.level !== undefined && !isNaN(Number(tank.level));
          let rawLevelNum = hasLevel ? Number(tank.level) : 0;
          if (rawLevelNum > 0 && rawLevelNum <= 1) rawLevelNum = rawLevelNum * 100;
          else if (rawLevelNum > 100 && rawLevelNum <= 10000) rawLevelNum = rawLevelNum / 100;
          const levelVal = Math.min(100, Math.max(0, Math.round(rawLevelNum)));
          const tankName = (tank.name || tank.deviceName) ? (tank.name || tank.deviceName) : cfg.defaultName;

          return (
            <g key={tank.id || idx} transform={`translate(60, ${cfg.y})`}>
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

              {/* Liquid Wave & Level Fill */}
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
                      {hasLevel ? 'EMPTY' : '0 L'}
                    </text>
                    <text
                      x="84"
                      y="62"
                      textAnchor="middle"
                      fill="#334155"
                      fontSize="9"
                      fontWeight="700"
                    >
                      Awaiting Fill
                    </text>
                  </>
                )}
              </g>

              {/* Subtitle Underneath Tank */}
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
        {/* Horizontal Tank Outlet Pipes (Only for mapped tanks) */}
        {tankOutletYs.map((y, i) => (
          <g key={i}>
            {/* 3D Blue Pipe */}
            <rect x="228" y={y - 9} width="42" height="18" fill="url(#pipeHoriz3D)" rx="2" />
            {/* Flange Collars */}
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

        {/* Vertical Intake Manifold Pipe (Dynamic height matching mapped tanks) */}
        <rect
          x="264"
          y={intakeManifoldTop}
          width="20"
          height={Math.max(20, intakeManifoldBottom - intakeManifoldTop)}
          fill="url(#pipeVert3D)"
          rx="4"
        />
        {isAnyPumpRunning && (
          <path
            d={`M274 ${intakeManifoldTop} L274 ${intakeManifoldBottom}`}
            stroke="#38bdf8"
            strokeWidth="8"
            strokeDasharray="20,15"
            filter="url(#liquidGlow)"
          >
            <animate attributeName="stroke-dashoffset" from="35" to="0" dur="1s" repeatCount="indefinite" />
          </path>
        )}

        {/* Cross Connection to Distribution Manifold */}
        <rect x="284" y={intakeMidY - 9} width="46" height="18" fill="url(#pipeHoriz3D)" rx="2" />
        <rect x="326" y={intakeMidY - 12} width="4" height="24" fill="url(#flangeGrad)" rx="1" />
        {isAnyPumpRunning && (
          <path d={`M284 ${intakeMidY} L330 ${intakeMidY}`} stroke="#38bdf8" strokeWidth="6" strokeDasharray="14,10" filter="url(#liquidGlow)">
            <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.8s" repeatCount="indefinite" />
          </path>
        )}

        {/* Vertical Distribution Manifold Pipe (Dynamic height matching mapped pumps) */}
        <rect
          x="326"
          y={distManifoldTop}
          width="20"
          height={Math.max(30, distManifoldBottom - distManifoldTop)}
          fill="url(#pipeVert3D)"
          rx="4"
        />
        {isAnyPumpRunning && (
          <path
            d={`M336 ${distManifoldTop} L336 ${distManifoldBottom}`}
            stroke="#38bdf8"
            strokeWidth="8"
            strokeDasharray="20,15"
            filter="url(#liquidGlow)"
          >
            <animate attributeName="stroke-dashoffset" from="35" to="0" dur="1.1s" repeatCount="indefinite" />
          </path>
        )}

        {/* ── 3. DYNAMIC PUMP BRANCHES WITH ANIMATED IMPELLERS & PRESSURE GAUGES ── */}
        {mappedPumps.map((p, i) => {
          const y = pumpYs[i];
          const active = p.status === 'Running' || p.status === 'RUNNING';
          const ampVal = p.amp ? Number(p.amp).toFixed(1) : (active ? '13.5' : '0.0');

          // Dedicated Pressure for this Pump
          const pumpPressure = (p.pressure !== undefined && p.pressure !== null && !isNaN(Number(p.pressure)) && Number(p.pressure) > 0)
            ? Number(p.pressure)
            : (active ? (masterPressureNum > 0 ? masterPressureNum : 1.2) : 0.0);

          const pumpRotation = (Math.min(Math.max(pumpPressure, 0), 16) / 16) * 270 - 135;

          return (
            <g key={p.id || p.deviceId || i}>
              {/* Branch Intake Pipe (Distribution Manifold to Impeller) */}
              <rect x="346" y={y - 8} width="58" height="16" fill="url(#pipeHoriz3D)" rx="2" />
              {active && (
                <path d={`M346 ${y} L404 ${y}`} stroke="#38bdf8" strokeWidth="5" strokeDasharray="12,8">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.6s" repeatCount="indefinite" />
                </path>
              )}

              {/* Pump Circular Impeller */}
              <g
                transform={`translate(424, ${y})`}
                onClick={() => onOpenPumpSettings && onOpenPumpSettings(p)}
                style={{ cursor: 'pointer' }}
                title={`Click to inspect ${p.name || `PUMP P${i + 1}`}`}
              >
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
              <g
                transform={`translate(486, ${y - 27})`}
                onClick={() => onOpenPumpSettings && onOpenPumpSettings(p)}
                style={{ cursor: 'pointer' }}
                title={`Click to inspect ${p.name || `PUMP P${i + 1}`}`}
              >
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

                {/* Mini Power Load Indicator */}
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

              {/* Pipe Connecting Discharge Manifold to THIS PUMP'S DEDICATED PRESSURE GAUGE */}
              <rect x="768" y={y - 7} width="78" height="14" fill="url(#pipeHoriz3D)" rx="2" />
              <rect x="842" y={y - 10} width="4" height="20" fill="url(#flangeGrad)" rx="1" />
              {active && (
                <path d={`M768 ${y} L846 ${y}`} stroke="#38bdf8" strokeWidth="5" strokeDasharray="12,8" filter="url(#liquidGlow)">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.6s" repeatCount="indefinite" />
                </path>
              )}

              {/* ── DEDICATED ANALOG PRESSURE GAUGE FOR THIS SPECIFIC PUMP ── */}
              <g
                transform={`translate(892, ${y})`}
                onClick={() => onOpenPumpSettings && onOpenPumpSettings(p)}
                style={{ cursor: 'pointer' }}
                title={`${p.name || `PUMP P${i + 1}`} Discharge Pressure: ${pumpPressure.toFixed(1)} BAR`}
              >
                {/* Dial Outer Metallic Bezel */}
                <circle
                  r={gaugeRadius}
                  fill="#f8fafc"
                  stroke={active ? "#38bdf8" : "#94a3b8"}
                  strokeWidth="4.5"
                  style={{ filter: active ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))' }}
                />
                <circle r={gaugeRadius - 4} fill="none" stroke="#334155" strokeWidth="0.8" />

                {/* Dial Ticks (0 to 16 BAR) */}
                {[...Array(13)].map((_, t) => (
                  <line
                    key={t}
                    x1="0"
                    y1={-(gaugeRadius - 5)}
                    x2="0"
                    y2={t % 2 === 0 ? -(gaugeRadius - 12) : -(gaugeRadius - 8)}
                    stroke={t >= 10 ? "#ef4444" : "#1e293b"}
                    strokeWidth={t % 2 === 0 ? "2" : "1"}
                    transform={`rotate(${t * 22.5 - 135})`}
                  />
                ))}

                {/* Pivot & Needle */}
                <circle r="4.5" fill="#1e293b" />
                <g transform={`rotate(${pumpRotation})`} style={{ transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                  <path d={`M-2.5 0 L0 ${-(gaugeRadius - 7)} L2.5 0 Z`} fill="#ef4444" />
                </g>
                <circle r="2" fill="#ffffff" />
              </g>

              {/* Digital Telemetry Readout for This Pump's Gauge */}
              <g
                transform={`translate(948, ${y})`}
                onClick={() => onOpenPumpSettings && onOpenPumpSettings(p)}
                style={{ cursor: 'pointer' }}
              >
                {/* Digital Pressure Number */}
                <text
                  x="0"
                  y="-5"
                  fill="#ffffff"
                  fontSize={mappedPumps.length <= 3 ? "18" : "15"}
                  fontWeight="900"
                  filter="url(#liquidGlow)"
                >
                  {pumpPressure.toFixed(1)} BAR
                </text>

                {/* Pump Specific Gauge Label */}
                <text
                  x="0"
                  y="12"
                  fill="#38bdf8"
                  fontSize={mappedPumps.length <= 3 ? "11" : "9.5"}
                  fontWeight="800"
                  letterSpacing="0.4"
                >
                  {p.name || `PUMP P${i + 1}`} PRESSURE
                </text>

                {/* Active / Standby Status Dot */}
                <text
                  x="0"
                  y="26"
                  fill={active ? "#4ade80" : "#64748b"}
                  fontSize="9"
                  fontWeight="800"
                >
                  ● {active ? 'DISCHARGE LIVE' : 'LINE STANDBY'}
                </text>
              </g>
            </g>
          );
        })}

        {/* ── 4. VERTICAL DISCHARGE MANIFOLD & ROOFTOP NETWORK PIPELINE ── */}
        <rect
          x="748"
          y={dischargeManifoldTop}
          width="20"
          height={Math.max(40, 420 - dischargeManifoldTop)}
          fill="url(#pipeVert3D)"
          rx="4"
        />

        {/* Flange Collar at Elbow */}
        <rect x="746" y="420" width="24" height="4" fill="url(#flangeGrad)" rx="1" />

        {/* Horizontal Rooftop Network Delivery Pipe */}
        <rect x="748" y="420" width="380" height="20" fill="url(#pipeHoriz3D)" rx="4" />

        {isAnyPumpRunning && (
          <path
            d={`M758 ${dischargeManifoldTop} L758 430 L1128 430`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="9"
            strokeDasharray="30,20"
            filter="url(#liquidGlow)"
          >
            <animate attributeName="stroke-dashoffset" from="50" to="0" dur="1s" repeatCount="indefinite" />
          </path>
        )}

        {/* ── 5. SYSTEM HEADER PRESSURE SUMMARY BADGE & ROOFTOP NETWORK BANNER ── */}
        <g transform="translate(770, 468)">
          <rect width="170" height="24" rx="5" fill="#0f172a" stroke="#0284c7" strokeWidth="1.2" opacity="0.9" />
          <text x="10" y="16" fill="#94a3b8" fontSize="10" fontWeight="800">
            MAIN HEADER:
            <tspan fill="#38bdf8" fontSize="12" fontWeight="900" dx="6">
              {masterPressureNum.toFixed(1)} BAR
            </tspan>
          </text>
        </g>

        <text
          x="1128"
          y="468"
          textAnchor="end"
          fill="#38bdf8"
          fontSize="16"
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
