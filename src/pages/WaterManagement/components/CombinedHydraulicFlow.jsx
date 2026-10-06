import React, { useState, useMemo } from 'react';
import { Badge } from 'react-bootstrap';
import { Droplets, Waves, Gauge, Zap, ArrowRight, ShieldCheck, Activity, Maximize2, Minimize2, Info } from 'lucide-react';

/**
 * CombinedHydraulicFlow - End-to-End Dynamic Digital Twin Schematic
 * Visualizes the complete hydraulic loop:
 * Underground Reservoirs (UG) ➔ Transfer & Booster Pumps ➔ Main Risers ➔ Overhead Tanks (AG) ➔ Floor Distribution
 */
const CombinedHydraulicFlow = ({
  agTanks = [],
  ugTanks = [],
  pumps = [],
  masterPressure = 12.2,
  masterFlow = 2450,
  isLive = true,
  onSelectAsset,
  selectedAssetId = null
}) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const numPressure = typeof masterPressure === 'number' ? masterPressure : parseFloat(masterPressure) || 12.2;
  const numFlow = typeof masterFlow === 'number' ? masterFlow : parseFloat(masterFlow) || 2450;

  // Check if any pump is running
  const isAnyPumpRunning = useMemo(() => {
    return pumps.some(p => p.status === 'Running' || p.status === 'running' || p.isRunning);
  }, [pumps]);

  // Master pressure gauge needle rotation (-135 to +135 deg for 0-16 BAR)
  const pressureRotation = useMemo(() => {
    const angle = (numPressure / 16) * 270 - 135;
    return Math.min(Math.max(angle, -135), 135);
  }, [numPressure]);

  // Format volume
  const formatVol = (val) => {
    if (!val) return '--';
    if (val >= 1000) return `${(val / 1000).toFixed(1)} kL`;
    return `${val} L`;
  };

  return (
    <div
      className={`combined-hydraulic-wrapper position-relative rounded-4 overflow-hidden border border-secondary border-opacity-10 ${
        isFullscreen ? 'fixed-fullscreen-scada' : ''
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #0d1627 0%, #060b14 100%)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Schematic Top Bar Controls */}
      <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-secondary border-opacity-10 bg-dark bg-opacity-40">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info border border-info border-opacity-20">
            <Waves size={18} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-white fw-black fs-8 letter-spacing-1">SYNOPTIC DIGITAL TWIN</span>
              <Badge bg="info" className="bg-opacity-20 text-info border border-info border-opacity-30 fs-10 px-2 py-0.5">
                END-TO-END FLOW
              </Badge>
              {isAnyPumpRunning ? (
                <Badge bg="success" className="bg-opacity-20 text-success border border-success border-opacity-30 fs-10 px-2 py-0.5 d-flex align-items-center gap-1">
                  <span className="pulse-indicator"></span>
                  PUMPING ACTIVE
                </Badge>
              ) : (
                <Badge bg="secondary" className="bg-opacity-20 text-secondary border border-secondary border-opacity-30 fs-10 px-2 py-0.5">
                  STANDBY
                </Badge>
              )}
            </div>
            <small className="text-secondary fs-10">
              Underground Storage ➔ High-Pressure Booster Station ➔ Riser Line ➔ Rooftop AG Reservoirs ➔ Gravity Distribution
            </small>
          </div>
        </div>

        {/* Telemetry Snapshot Pill */}
        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center gap-3 text-secondary fs-9">
            <div className="d-flex align-items-center gap-1">
              <span className="legend-dot bg-cyan"></span>
              <span>Potable Supply</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <span className="legend-dot bg-green"></span>
              <span>Active Transfer</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <span className="legend-dot bg-purple"></span>
              <span>Flushing / Recycled</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <span className="legend-dot bg-red"></span>
              <span>Fire Safety</span>
            </div>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-sm btn-outline-secondary border-secondary border-opacity-20 text-secondary px-2 py-1 d-flex align-items-center gap-1 fs-9 rounded-3 hover-info"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Exit' : 'Expand'}</span>
          </button>
        </div>
      </div>

      {/* Main SVG Schematic Canvas */}
      <div
        className="schematic-canvas-area position-relative"
        style={{
          width: '100%',
          height: isFullscreen ? 'calc(100vh - 80px)' : '620px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px'
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1280 620"
          preserveAspectRatio="xMidYMid meet"
          className="hydraulic-svg-canvas"
        >
          <defs>
            {/* Background Grid */}
            <pattern id="scadaGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            </pattern>

            {/* Glowing Pipeline Filters */}
            <filter id="waterGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="pulseGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Linear Gradients */}
            <linearGradient id="ugWaterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="60%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>

            <linearGradient id="agWaterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </linearGradient>

            <linearGradient id="fireWaterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="60%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>

            <linearGradient id="flushingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="60%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>

            <linearGradient id="riserPipeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="35%" stopColor="#1e293b" />
              <stop offset="65%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Wave Pattern */}
            <pattern id="cyanWave" x="0" y="0" width="60" height="15" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q15 0 30 10 T60 10 V15 H0 Z" fill="#38bdf8" opacity="0.75" />
              <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="60 0" dur="3s" repeatCount="indefinite" />
            </pattern>

            <pattern id="fireWave" x="0" y="0" width="60" height="15" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q15 0 30 10 T60 10 V15 H0 Z" fill="#ef4444" opacity="0.75" />
              <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="60 0" dur="3s" repeatCount="indefinite" />
            </pattern>

            <pattern id="flushWave" x="0" y="0" width="60" height="15" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q15 0 30 10 T60 10 V15 H0 Z" fill="#818cf8" opacity="0.75" />
              <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="60 0" dur="3s" repeatCount="indefinite" />
            </pattern>

            {/* Tank Inner Rounded Clip Paths */}
            <clipPath id="ugTankClip1"><rect width="180" height="120" rx="10" /></clipPath>
            <clipPath id="ugTankClip2"><rect width="180" height="120" rx="10" /></clipPath>
            <clipPath id="ugTankClip3"><rect width="180" height="120" rx="10" /></clipPath>
            <clipPath id="agTankClip1"><rect width="170" height="120" rx="10" /></clipPath>
            <clipPath id="agTankClip2"><rect width="170" height="120" rx="10" /></clipPath>
            <clipPath id="agTankClip3"><rect width="170" height="120" rx="10" /></clipPath>
          </defs>

          {/* Background Grid Surface */}
          <rect width="100%" height="100%" fill="url(#scadaGrid)" />

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION HEADERS & STRUCTURAL LABELS
             ═══════════════════════════════════════════════════════════════════ */}
          <g transform="translate(40, 32)">
            <rect width="190" height="24" rx="6" fill="#0f172a" stroke="#0284c7" strokeWidth="1" strokeOpacity="0.4" />
            <text x="14" y="16" fill="#38bdf8" fontSize="10" fontWeight="900" letterSpacing="1">
              ① UNDERGROUND SUMPS (UG)
            </text>
          </g>

          <g transform="translate(300, 32)">
            <rect width="210" height="24" rx="6" fill="#0f172a" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.4" />
            <text x="14" y="16" fill="#4ade80" fontSize="10" fontWeight="900" letterSpacing="1">
              ② TRANSFER PUMP STATION
            </text>
          </g>

          <g transform="translate(600, 32)">
            <rect width="180" height="24" rx="6" fill="#0f172a" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.4" />
            <text x="14" y="16" fill="#c084fc" fontSize="10" fontWeight="900" letterSpacing="1">
              ③ VERTICAL RISER HEAD
            </text>
          </g>

          <g transform="translate(860, 32)">
            <rect width="200" height="24" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
            <text x="14" y="16" fill="#38bdf8" fontSize="10" fontWeight="900" letterSpacing="1">
              ④ ROOFTOP AG TANKS (OHT)
            </text>
          </g>

          <g transform="translate(1110, 32)">
            <rect width="130" height="24" rx="6" fill="#0f172a" stroke="#64748b" strokeWidth="1" strokeOpacity="0.4" />
            <text x="14" y="16" fill="#94a3b8" fontSize="10" fontWeight="900" letterSpacing="1">
              ⑤ DISTRIBUTION
            </text>
          </g>

          {/* ═══════════════════════════════════════════════════════════════════
              UNDERGROUND WATER RESERVOIRS (LEFT SIDE: x=40, y=70, 245, 420)
             ═══════════════════════════════════════════════════════════════════ */}
          {ugTanks.map((tank, idx) => {
            const yPos = 70 + (idx * 175);
            const levelVal = typeof tank.level === 'number' ? tank.level : parseFloat(tank.level) || 60;
            const fillHeight = (levelVal / 100) * 120;
            const isFire = tank.name.toUpperCase().includes('FIRE');
            const isProcess = tank.name.toUpperCase().includes('PROCESS') || tank.name.toUpperCase().includes('RAW') || tank.name.toUpperCase().includes('STP');
            const gradId = isFire ? 'fireWaterGrad' : (isProcess ? 'flushingGrad' : 'ugWaterGrad');
            const waveId = isFire ? 'fireWave' : (isProcess ? 'flushWave' : 'cyanWave');
            const strokeColor = isFire ? '#ef4444' : (isProcess ? '#818cf8' : '#0284c7');
            const isSelected = selectedAssetId === tank.id;

            return (
              <g
                key={tank.id || idx}
                transform={`translate(45, ${yPos})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectAsset && onSelectAsset({ ...tank, type: 'UG_TANK' })}
                onMouseEnter={() => setHoveredNode(tank)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Tank Outer Shell */}
                <rect
                  width="180"
                  height="120"
                  rx="10"
                  fill="#0b1322"
                  stroke={isSelected ? '#38bdf8' : (tank.isOnline !== false ? strokeColor : '#334155')}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeOpacity={isSelected ? 1 : 0.6}
                  style={{ transition: 'all 0.3s ease' }}
                />

                {/* Subterranean Depth Level Graduation Lines */}
                <line x1="10" y1="30" x2="22" y2="30" stroke="#475569" strokeWidth="1" />
                <line x1="10" y1="60" x2="28" y2="60" stroke="#475569" strokeWidth="1.5" />
                <line x1="10" y1="90" x2="22" y2="90" stroke="#475569" strokeWidth="1" />

                {/* Liquid Fill with Wave */}
                <g clipPath={`url(#ugTankClip${idx + 1})`}>
                  <rect
                    x="0"
                    y={120 - fillHeight}
                    width="180"
                    height={fillHeight}
                    fill={`url(#${gradId})`}
                    fillOpacity="0.85"
                  />
                  {fillHeight > 10 && (
                    <rect
                      x="0"
                      y={115 - fillHeight}
                      width="180"
                      height="15"
                      fill={`url(#${waveId})`}
                    />
                  )}

                  {/* Level percentage large watermark text */}
                  <text
                    x="90"
                    y="72"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="32"
                    fontWeight="900"
                    filter="url(#waterGlow)"
                    opacity="0.9"
                  >
                    {levelVal > 0 ? `${Math.round(levelVal)}%` : '--%'}
                  </text>
                </g>

                {/* Status & Name Badges */}
                <text x="90" y="142" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="800">
                  {tank.name}
                </text>
                <text x="90" y="156" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">
                  {tank.capacity ? `CAPACITY: ${formatVol(tank.capacity)}` : 'PRIMARY RESERVOIR'}
                </text>

                {/* Online Tag */}
                <g transform="translate(12, -8)">
                  <rect
                    width="54"
                    height="16"
                    rx="4"
                    fill="#0f172a"
                    stroke={tank.isOnline !== false ? '#22c55e' : '#ef4444'}
                    strokeWidth="1"
                  />
                  <circle cx="8" cy="8" r="2.5" fill={tank.isOnline !== false ? '#22c55e' : '#ef4444'} />
                  <text x="15" y="11" fill={tank.isOnline !== false ? '#22c55e' : '#ef4444'} fontSize="7" fontWeight="900">
                    {tank.isOnline !== false ? 'ONLINE' : 'OFFLINE'}
                  </text>
                </g>

                {/* Outlet Pipe connection nozzle */}
                <path d="M180 60 L210 60" fill="none" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
                {isAnyPumpRunning && (
                  <path d="M180 60 L210 60" fill="none" stroke="#38bdf8" strokeWidth="10" strokeDasharray="12,8">
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                  </path>
                )}
              </g>
            );
          })}

          {/* ═══════════════════════════════════════════════════════════════════
              MANIFOLD SUCTION COLLECTOR PIPES (Connecting 3 Sumps ➔ Common Rail)
             ═══════════════════════════════════════════════════════════════════ */}
          <path d="M255 130 L285 130" fill="none" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />
          <path d="M255 305 L285 305" fill="none" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />
          <path d="M255 480 L285 480" fill="none" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />

          {/* Suction Vertical Manifold Header */}
          <path d="M285 110 L285 500" fill="none" stroke="#1e293b" strokeWidth="24" strokeLinecap="round" />

          {isAnyPumpRunning && (
            <g>
              <path d="M255 130 L285 130" fill="none" stroke="#38bdf8" strokeWidth="12" strokeDasharray="14,10">
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.9s" repeatCount="indefinite" />
              </path>
              <path d="M255 305 L285 305" fill="none" stroke="#38bdf8" strokeWidth="12" strokeDasharray="14,10">
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.9s" repeatCount="indefinite" />
              </path>
              <path d="M255 480 L285 480" fill="none" stroke="#38bdf8" strokeWidth="12" strokeDasharray="14,10">
                <animate attributeName="stroke-dashoffset" from="24" to="0" dur="0.9s" repeatCount="indefinite" />
              </path>
              <path d="M285 110 L285 500" fill="none" stroke="#38bdf8" strokeWidth="14" strokeDasharray="24,14" filter="url(#waterGlow)">
                <animate attributeName="stroke-dashoffset" from="38" to="0" dur="1.2s" repeatCount="indefinite" />
              </path>
            </g>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              4 PUMP BRANCHES (P1, P2, P3, P4) (x: 285 to 540)
             ═══════════════════════════════════════════════════════════════════ */}
          {[100, 215, 330, 445].map((yBranch, pIdx) => {
            const pump = pumps[pIdx] || {
              id: pIdx + 1,
              name: `PUMP P${pIdx + 1}`,
              status: pIdx === 2 ? 'Stopped' : 'Running',
              amp: pIdx === 2 ? '0.0' : (13.5 + pIdx * 1.8).toFixed(1),
              pressure: pIdx === 2 ? 0.0 : 12.2,
              mode: 'AUTO',
              isOnline: true
            };

            const isRunning = pump.status === 'Running' || pump.status === 'running';
            const isSelected = selectedAssetId === pump.id;

            return (
              <g
                key={pump.id || pIdx}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectAsset && onSelectAsset({ ...pump, type: 'PUMP' })}
                onMouseEnter={() => setHoveredNode(pump)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Intake Pipe from Manifold */}
                <path d={`M285 ${yBranch + 25} L345 ${yBranch + 25}`} fill="none" stroke="#1e293b" strokeWidth="16" />
                {isRunning && (
                  <path d={`M285 ${yBranch + 25} L345 ${yBranch + 25}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,8">
                    <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.8s" repeatCount="indefinite" />
                  </path>
                )}

                {/* Pump Impeller Housing */}
                <g transform={`translate(365, ${yBranch + 25})`}>
                  <circle
                    r="28"
                    fill="#0f172a"
                    stroke={isSelected ? '#38bdf8' : (isRunning ? '#22c55e' : '#334155')}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  {/* Rotating Impeller animation when running */}
                  {isRunning ? (
                    <g>
                      <circle r="22" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="8,6" opacity="0.8">
                        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                      <circle r="4" fill="#22c55e" />
                      <path d="M-12 0 L12 0 M0 -12 L0 12" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.8s" repeatCount="indefinite" />
                      </path>
                    </g>
                  ) : (
                    <g>
                      <circle r="4" fill="#64748b" />
                      <path d="M-10 0 L10 0 M0 -10 L0 10" stroke="#475569" strokeWidth="1.5" />
                    </g>
                  )}
                </g>

                {/* Pipe between Impeller & Pump Status Card */}
                <path d={`M393 ${yBranch + 25} L425 ${yBranch + 25}`} fill="none" stroke="#1e293b" strokeWidth="16" />
                {isRunning && (
                  <path d={`M393 ${yBranch + 25} L425 ${yBranch + 25}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,8">
                    <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.8s" repeatCount="indefinite" />
                  </path>
                )}

                {/* Compact SCADA Pump HUD Card */}
                <g transform={`translate(425, ${yBranch})`}>
                  <rect
                    width="125"
                    height="50"
                    rx="8"
                    fill="#0f172a"
                    stroke={isSelected ? '#38bdf8' : (isRunning ? '#22c55e' : '#1e293b')}
                    strokeWidth={isSelected ? 2 : 1.5}
                    strokeOpacity={isRunning ? 0.9 : 0.4}
                  />

                  {/* Pump Name & Status */}
                  <text x="10" y="18" fill="#e2e8f0" fontSize="10" fontWeight="900">
                    {pump.name}
                  </text>
                  <text
                    x="10"
                    y="36"
                    fill={isRunning ? '#22c55e' : '#64748b'}
                    fontSize="11"
                    fontWeight="900"
                    filter={isRunning ? 'url(#waterGlow)' : 'none'}
                  >
                    {isRunning ? 'RUNNING' : 'STOPPED'}
                  </text>

                  {/* Current Amps Badge */}
                  <g transform="translate(76, 10)">
                    <rect width="40" height="15" rx="3" fill="#1e293b" />
                    <text x="20" y="11" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="bold">
                      {pump.amp ? `${Number(pump.amp).toFixed(1)} A` : '-- A'}
                    </text>
                  </g>

                  {/* Mode Badge */}
                  <g transform="translate(76, 28)">
                    <rect width="40" height="14" rx="3" fill="#1e293b" />
                    <text x="20" y="10" textAnchor="middle" fill="#38bdf8" fontSize="7" fontWeight="bold">
                      {pump.mode || 'AUTO'}
                    </text>
                  </g>
                </g>

                {/* Branch Discharge Pipe to High-Pressure Manifold */}
                <path d={`M550 ${yBranch + 25} L590 ${yBranch + 25}`} fill="none" stroke="#1e293b" strokeWidth="16" />
                {isRunning && (
                  <path d={`M550 ${yBranch + 25} L590 ${yBranch + 25}`} fill="none" stroke="#38bdf8" strokeWidth="8" strokeDasharray="10,8">
                    <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.8s" repeatCount="indefinite" />
                  </path>
                )}
              </g>
            );
          })}

          {/* ═══════════════════════════════════════════════════════════════════
              HIGH-PRESSURE DISCHARGE MANIFOLD & MASTER PRESSURE GAUGE (x: 590 to 760)
             ═══════════════════════════════════════════════════════════════════ */}
          <path d="M590 100 L590 495" fill="none" stroke="#1e293b" strokeWidth="24" strokeLinecap="round" />
          <path d="M590 280 L670 280" fill="none" stroke="#1e293b" strokeWidth="24" strokeLinecap="round" />

          {isAnyPumpRunning && (
            <g>
              <path d="M590 100 L590 495" fill="none" stroke="#38bdf8" strokeWidth="14" strokeDasharray="24,14" filter="url(#waterGlow)">
                <animate attributeName="stroke-dashoffset" from="38" to="0" dur="1s" repeatCount="indefinite" />
              </path>
              <path d="M590 280 L670 280" fill="none" stroke="#38bdf8" strokeWidth="14" strokeDasharray="24,14" filter="url(#waterGlow)">
                <animate attributeName="stroke-dashoffset" from="38" to="0" dur="1s" repeatCount="indefinite" />
              </path>
            </g>
          )}

          {/* Master Pressure Gauge Node (x: 670, y: 190) */}
          <g transform="translate(670, 190)">
            <circle r="48" fill="#f8fafc" stroke="#94a3b8" strokeWidth="5" />
            <circle r="42" fill="none" stroke="#334155" strokeWidth="1" />

            {/* Dial Tick Marks */}
            {[...Array(9)].map((_, t) => (
              <line
                key={t}
                x1="0"
                y1="-40"
                x2="0"
                y2={t % 2 === 0 ? "-30" : "-35"}
                stroke={t > 6 ? "#ef4444" : "#1e293b"}
                strokeWidth={t % 2 === 0 ? "2.5" : "1.5"}
                transform={`rotate(${t * 33.75 - 135})`}
              />
            ))}

            {/* Dial Numbers */}
            <text x="-24" y="20" fill="#64748b" fontSize="7" fontWeight="bold">0</text>
            <text x="0" y="-24" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">8</text>
            <text x="24" y="20" fill="#ef4444" fontSize="7" fontWeight="bold">16</text>

            <circle r="6" fill="#1e293b" />
            <g transform={`rotate(${pressureRotation})`} style={{ transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              <path d="M-3 0 L0 -38 L3 0 Z" fill="#ef4444" />
            </g>

            {/* Pressure Output Text */}
            <rect x="-38" y="55" width="76" height="22" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <text x="0" y="70" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="900">
              {numPressure.toFixed(1)} <tspan fontSize="8">BAR</tspan>
            </text>
          </g>

          {/* Flowmeter Display Badge Node (x: 670, y: 350) */}
          <g transform="translate(670, 350)">
            <rect x="-45" y="-18" width="90" height="36" rx="6" fill="#0f172a" stroke="#22c55e" strokeWidth="1.5" />
            <text x="0" y="-3" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
              DISCHARGE FLOW
            </text>
            <text x="0" y="12" textAnchor="middle" fill="#22c55e" fontSize="13" fontWeight="900" filter="url(#waterGlow)">
              {isAnyPumpRunning ? numFlow.toLocaleString('en-IN') : '0'} <tspan fontSize="8">LPM</tspan>
            </text>
          </g>

          {/* ═══════════════════════════════════════════════════════════════════
              VERTICAL RISER LINE (HIGH RISE BUILDING SUPPLY) (x: 670 to 860)
             ═══════════════════════════════════════════════════════════════════ */}
          <path d="M670 280 L740 280 L740 100 L860 100" fill="none" stroke="#1e293b" strokeWidth="22" strokeLinecap="round" />
          <path d="M740 275 L860 275" fill="none" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />
          <path d="M740 450 L860 450" fill="none" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />

          {/* Glowing Animated Water up the Riser */}
          {isAnyPumpRunning && (
            <g>
              <path d="M670 280 L740 280 L740 100 L860 100" fill="none" stroke="#38bdf8" strokeWidth="12" strokeDasharray="24,14" filter="url(#waterGlow)">
                <animate attributeName="stroke-dashoffset" from="38" to="0" dur="0.9s" repeatCount="indefinite" />
              </path>
              <path d="M740 275 L860 275" fill="none" stroke="#818cf8" strokeWidth="10" strokeDasharray="18,12">
                <animate attributeName="stroke-dashoffset" from="30" to="0" dur="0.9s" repeatCount="indefinite" />
              </path>
              <path d="M740 450 L860 450" fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray="18,12">
                <animate attributeName="stroke-dashoffset" from="30" to="0" dur="0.9s" repeatCount="indefinite" />
              </path>
            </g>
          )}

          {/* Riser Label Pill */}
          <g transform="translate(740, 190)">
            <rect x="-40" y="-12" width="80" height="24" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <text x="0" y="4" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">
              ▲ 24F RISER
            </text>
          </g>

          {/* ═══════════════════════════════════════════════════════════════════
              ROOFTOP AG TANKS (x: 860, y: 70, 245, 420)
             ═══════════════════════════════════════════════════════════════════ */}
          {agTanks.map((tank, idx) => {
            const yPos = 70 + (idx * 175);
            const levelVal = typeof tank.level === 'number' ? tank.level : parseFloat(tank.level) || 55;
            const fillHeight = (levelVal / 100) * 120;
            const isFlushing = tank.sectorType === 'FLUSHING' || tank.name.toUpperCase().includes('FLUSH');
            const isFire = tank.sectorType === 'UTILITY' || tank.name.toUpperCase().includes('FIRE');
            const gradId = isFire ? 'fireWaterGrad' : (isFlushing ? 'flushingGrad' : 'agWaterGrad');
            const waveId = isFire ? 'fireWave' : (isFlushing ? 'flushWave' : 'cyanWave');
            const strokeColor = isFire ? '#ef4444' : (isFlushing ? '#818cf8' : '#38bdf8');
            const isSelected = selectedAssetId === tank.id;
            const isValveOpen = tank.valveStatus === 'OPEN' || isAnyPumpRunning;

            return (
              <g
                key={tank.id || idx}
                transform={`translate(860, ${yPos})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectAsset && onSelectAsset({ ...tank, type: 'AG_TANK' })}
                onMouseEnter={() => setHoveredNode(tank)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Motorized Inlet Valve on Tank top */}
                <g transform="translate(-25, 20)">
                  <polygon points="0,0 20,10 0,20" fill={isValveOpen ? '#22c55e' : '#ef4444'} />
                  <polygon points="20,0 0,10 20,20" fill={isValveOpen ? '#22c55e' : '#ef4444'} />
                  <circle cx="10" cy="10" r="3" fill="#ffffff" />
                  <text x="10" y="32" textAnchor="middle" fill={isValveOpen ? '#22c55e' : '#ef4444'} fontSize="7" fontWeight="bold">
                    {isValveOpen ? 'VALVE OPEN' : 'CLOSED'}
                  </text>
                </g>

                {/* Tank Outer Shell */}
                <rect
                  width="170"
                  height="120"
                  rx="10"
                  fill="#0b1322"
                  stroke={isSelected ? '#38bdf8' : strokeColor}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeOpacity={isSelected ? 1 : 0.7}
                  style={{ transition: 'all 0.3s ease' }}
                />

                {/* Tank Level Graduation Lines */}
                <line x1="150" y1="30" x2="162" y2="30" stroke="#475569" strokeWidth="1" />
                <line x1="145" y1="60" x2="162" y2="60" stroke="#475569" strokeWidth="1.5" />
                <line x1="150" y1="90" x2="162" y2="90" stroke="#475569" strokeWidth="1" />

                {/* Liquid Fill */}
                <g clipPath={`url(#agTankClip${idx + 1})`}>
                  <rect
                    x="0"
                    y={120 - fillHeight}
                    width="170"
                    height={fillHeight}
                    fill={`url(#${gradId})`}
                    fillOpacity="0.85"
                  />
                  {fillHeight > 10 && (
                    <rect
                      x="0"
                      y={115 - fillHeight}
                      width="170"
                      height="15"
                      fill={`url(#${waveId})`}
                    />
                  )}

                  {/* Level percentage large watermark text */}
                  <text
                    x="85"
                    y="72"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="32"
                    fontWeight="900"
                    filter="url(#waterGlow)"
                    opacity="0.95"
                  >
                    {levelVal > 0 ? `${Math.round(levelVal)}%` : '--%'}
                  </text>
                </g>

                {/* Tank Name & Sector Badges */}
                <text x="85" y="142" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="800">
                  {tank.name}
                </text>
                <text x="85" y="156" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold">
                  {tank.sectorType || 'ROOFTOP OHT'} {tank.capacity ? `(${formatVol(tank.capacity)})` : ''}
                </text>

                {/* Online Tag */}
                <g transform="translate(10, -8)">
                  <rect
                    width="54"
                    height="16"
                    rx="4"
                    fill="#0f172a"
                    stroke={tank.isOnline !== false ? '#22c55e' : '#ef4444'}
                    strokeWidth="1"
                  />
                  <circle cx="8" cy="8" r="2.5" fill={tank.isOnline !== false ? '#22c55e' : '#ef4444'} />
                  <text x="15" y="11" fill={tank.isOnline !== false ? '#22c55e' : '#ef4444'} fontSize="7" fontWeight="900">
                    {tank.isOnline !== false ? 'ONLINE' : 'OFFLINE'}
                  </text>
                </g>

                {/* Downcomer Gravity Delivery Pipe to Floor Zones */}
                <path d="M170 85 L230 85" fill="none" stroke="#1e293b" strokeWidth="16" strokeLinecap="round" />
                <path d="M170 85 L230 85" fill="none" stroke={strokeColor} strokeWidth="8" strokeDasharray="10,8">
                  <animate attributeName="stroke-dashoffset" from="18" to="0" dur="0.9s" repeatCount="indefinite" />
                </path>
              </g>
            );
          })}

          {/* ═══════════════════════════════════════════════════════════════════
              GRAVITY DOWNCOMERS & BUILDING ZONE DISTRIBUTION (x: 1090 to 1250)
             ═══════════════════════════════════════════════════════════════════ */}
          <g transform="translate(1100, 110)">
            <rect width="140" height="60" rx="8" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
            <text x="12" y="20" fill="#38bdf8" fontSize="9" fontWeight="900">ZONE 1: FLOORS 16-24</text>
            <text x="12" y="38" fill="#22c55e" fontSize="12" fontWeight="900">3.8 BAR</text>
            <text x="12" y="50" fill="#94a3b8" fontSize="8">GRAVITY HEAD STABLE</text>
          </g>

          <g transform="translate(1100, 285)">
            <rect width="140" height="60" rx="8" fill="#0f172a" stroke="#818cf8" strokeWidth="1" />
            <text x="12" y="20" fill="#818cf8" fontSize="9" fontWeight="900">ZONE 2: FLOORS 8-15</text>
            <text x="12" y="38" fill="#38bdf8" fontSize="12" fontWeight="900">4.2 BAR</text>
            <text x="12" y="50" fill="#94a3b8" fontSize="8">PRV BALANCED (45% LOSS)</text>
          </g>

          <g transform="translate(1100, 460)">
            <rect width="140" height="60" rx="8" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
            <text x="12" y="20" fill="#f87171" fontSize="9" fontWeight="900">ZONE 3: FLOORS 1-7</text>
            <text x="12" y="38" fill="#22c55e" fontSize="12" fontWeight="900">4.5 BAR</text>
            <text x="12" y="50" fill="#94a3b8" fontSize="8">DUAL PRV STATION ACTIVE</text>
          </g>
        </svg>
      </div>

      {/* Interactive Node Telemetry HUD / Tooltip Strip at Bottom */}
      {hoveredNode && (
        <div className="telemetry-hud-drawer px-4 py-2 bg-dark bg-opacity-90 border-top border-secondary border-opacity-15 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 rounded-circle bg-info bg-opacity-10 text-info">
              <Activity size={16} />
            </div>
            <div>
              <span className="text-white fw-bold fs-9 me-2">{hoveredNode.name}</span>
              <Badge bg="info" className="bg-opacity-20 text-info fs-11">
                {hoveredNode.sectorType || (hoveredNode.status === 'Running' ? 'PUMP ACTIVE' : 'RESERVOIR')}
              </Badge>
            </div>
          </div>

          <div className="d-flex align-items-center gap-4 fs-9">
            {hoveredNode.level !== undefined && (
              <div>
                <span className="text-secondary me-1">Water Level:</span>
                <span className="text-white fw-black">{hoveredNode.level}%</span>
              </div>
            )}
            {hoveredNode.capacity && (
              <div>
                <span className="text-secondary me-1">Capacity:</span>
                <span className="text-info fw-bold">{formatVol(hoveredNode.capacity)}</span>
              </div>
            )}
            {hoveredNode.amp !== undefined && (
              <div>
                <span className="text-secondary me-1">Motor Draw:</span>
                <span className="text-warning fw-bold">{hoveredNode.amp} A</span>
              </div>
            )}
            {hoveredNode.valveStatus && (
              <div>
                <span className="text-secondary me-1">Inlet Valve:</span>
                <span className={hoveredNode.valveStatus === 'OPEN' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                  {hoveredNode.valveStatus}
                </span>
              </div>
            )}
            <small className="text-secondary opacity-75">Click node to inspect controls</small>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .combined-hydraulic-wrapper {
          position: relative;
        }
        .fixed-fullscreen-scada {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 9999 !important;
          border-radius: 0 !important;
        }
        .pulse-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          display: inline-block;
          animation: pulseLed 1.5s infinite;
        }
        @keyframes pulseLed {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .legend-dot.bg-cyan { background: #38bdf8; box-shadow: 0 0 8px rgba(56, 189, 248, 0.6); }
        .legend-dot.bg-green { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.6); }
        .legend-dot.bg-purple { background: #818cf8; box-shadow: 0 0 8px rgba(129, 140, 248, 0.6); }
        .legend-dot.bg-red { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.6); }
        .hover-info:hover {
          background: rgba(56, 189, 248, 0.15) !important;
          color: #38bdf8 !important;
          border-color: rgba(56, 189, 248, 0.4) !important;
        }
      `}} />
    </div>
  );
};

export default React.memo(CombinedHydraulicFlow);
