import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Container, Button, Spinner } from 'react-bootstrap';
import {
  Sun,
  Battery,
  BatteryCharging,
  Zap,
  RefreshCw,
  Building2,
  Server,
  Droplets,
  Lightbulb,
  Radio,
  Clock,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// --- CUSTOM SCADA SVG ICONS ---
const GridIconBig = () => (
  <svg width="45" height="55" viewBox="0 0 60 70" fill="none" stroke="#718096" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M30 10 L15 65 M30 10 L45 65" />
    <path d="M5 20 L55 20 M10 35 L50 35 M12 50 L48 50" />
    <path d="M15 65 L45 65" />
    <path d="M22 20 L10 35 M38 20 L50 35 M17 35 L12 50 M43 35 L48 50" />
    <path d="M22 20 L38 35 M38 20 L22 35 M17 35 L33 50 M43 35 L27 50" />
    <path d="M5 20 L5 25 M55 20 L55 25" />
    <path d="M5 25 Q 17 30 30 30 Q 43 30 55 25" stroke="#4a5568" strokeDasharray="4 4"/>
  </svg>
);

const SolarIconBig = () => (
  <svg width="55" height="50" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="20" r="12" fill="url(#sunGradOverview)" />
    <path d="M30 2 L30 5 M30 35 L30 38 M12 20 L15 20 M45 20 L48 20 M17 7 L19 9 M43 33 L41 31 M17 33 L19 31 M43 7 L41 9" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="sunGradOverview" x1="30" y1="8" x2="30" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fde047" />
        <stop offset="1" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="panelGradOverview" x1="30" y1="25" x2="30" y2="45" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#1e3a8a" />
      </linearGradient>
    </defs>
    <path d="M10 25 L50 25 L55 40 L5 40 Z" fill="url(#panelGradOverview)" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M20 25 L16 40 M30 25 L30 40 M40 25 L44 40 M10 25 L50 25 M7 32 L53 32 M5 40 L55 40" stroke="#93c5fd" strokeWidth="1"/>
    <path d="M28 40 L28 45 L32 45 L32 40 M24 45 L36 45" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BatteryIconBig = () => (
  <svg width="35" height="50" viewBox="0 0 40 55" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="2" width="16" height="4" rx="2" fill="#10b981" />
    <rect x="2" y="8" width="36" height="45" rx="4" stroke="#10b981" strokeWidth="3" />
    <rect x="7" y="13" width="26" height="35" rx="2" fill="rgba(16,185,129,0.2)" />
    <path d="M22 20 L15 28 H24 L16 40 L26 29 H18 L22 20 Z" fill="#10b981" style={{ filter: 'drop-shadow(0 0 5px #10b981)' }} />
  </svg>
);

const BuildingIcon = () => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' }}>
    <path d="M6 28 V8 L16 4 V28 M16 12 H26 V28" />
    <path d="M2 28 H28" />
    <rect x="9" y="12" width="2" height="3" fill="#a855f7"/><rect x="9" y="18" width="2" height="3" fill="#a855f7"/><rect x="9" y="24" width="2" height="3" fill="#a855f7"/>
    <rect x="12" y="8" width="2" height="3" fill="#a855f7"/><rect x="12" y="14" width="2" height="3" fill="#a855f7"/><rect x="12" y="20" width="2" height="3" fill="#a855f7"/>
    <rect x="19" y="16" width="2" height="3" fill="#a855f7"/><rect x="19" y="22" width="2" height="3" fill="#a855f7"/>
    <rect x="23" y="16" width="2" height="3" fill="#a855f7"/><rect x="23" y="22" width="2" height="3" fill="#a855f7"/>
  </svg>
);

const ServerIcon = () => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' }}>
    <rect x="4" y="4" width="22" height="6" rx="1" /><rect x="4" y="12" width="22" height="6" rx="1" /><rect x="4" y="20" width="22" height="6" rx="1" />
    <circle cx="8" cy="7" r="1" fill="#a855f7" /><circle cx="8" cy="15" r="1" fill="#a855f7" /><circle cx="8" cy="23" r="1" fill="#a855f7" />
    <path d="M22 7 H24 M22 15 H24 M22 23 H24" />
  </svg>
);

const DropIcon = () => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="rgba(168,85,247,0.3)" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' }}>
    <path d="M15 3 C15 3 6 12 6 19 A 9 9 0 0 0 24 19 C24 12 15 3 15 3 Z" />
    <path d="M11 20 A 4 4 0 0 0 15 24" stroke="#fff" strokeWidth="1.5" fill="none" />
  </svg>
);

const LightningIcon = () => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px rgba(168,85,247,1))' }}>
    <path d="M16 3 L6 16 H15 L14 27 L24 14 H15 L16 3 Z" fill="rgba(168,85,247,0.4)" strokeWidth="2" />
  </svg>
);

const LampIcon = () => (
  <svg width="28" height="28" viewBox="0 0 30 30" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' }}>
    <path d="M12 28 H22 M17 28 V12 C17 6 12 5 7 5 H3" />
    <path d="M3 3 L9 7 L8 9 H2 Z" fill="rgba(168,85,247,0.3)" />
    <circle cx="5" cy="9" r="2" fill="#fff" stroke="none" style={{ filter: 'drop-shadow(0 0 6px #fff)' }}/>
  </svg>
);

const MiniWave = ({ color }) => (
  <svg width="100%" height="24" viewBox="0 0 200 24" preserveAspectRatio="none" className="mt-1" style={{ overflow: 'hidden' }}>
    <defs>
      <linearGradient id={`gradOverview-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
        <stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient>
    </defs>
    <g style={{ animation: 'waveMove 5s linear infinite' }}>
      <path d="M0,14 Q10,4 20,14 T40,14 T60,14 T80,14 T100,14 T120,14 T140,14 T160,14 T180,14 T200,14 T220,14 T240,14 T260,14 L260,28 L0,28 Z" fill={`url(#gradOverview-${color.replace('#','')})`} />
      <path d="M0,14 Q10,4 20,14 T40,14 T60,14 T80,14 T100,14 T120,14 T140,14 T160,14 T180,14 T200,14 T220,14 T240,14 T260,14" fill="none" stroke={color} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </g>
  </svg>
);

const FlowLine = ({ path, color, flowing = true, reverse = false }) => {
  const markerId = `arrow-${color.replace('#', '')}`;
  return (
    <>
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill={color} />
        </marker>
      </defs>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.35" markerEnd={`url(#${markerId})`} />
      {flowing && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray="8 8"
          style={{
            filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.3))',
            animation: `dashFlow ${reverse ? 'reverse' : 'normal'} 1.5s linear infinite`
          }}
        />
      )}
    </>
  );
};

// Helper to pick category icon for submeter
const resolveSubmeterIcon = (name = '', category = '') => {
  const text = `${name} ${category}`.toUpperCase();
  if (text.includes('COMMERCIAL') || text.includes('WING') || text.includes('OFFICE') || text.includes('BUILDING') || text.includes('ROOM')) {
    return BuildingIcon;
  }
  if (text.includes('SERVER') || text.includes('DATA') || text.includes('UPS') || text.includes('IT') || text.includes('RACK')) {
    return ServerIcon;
  }
  if (text.includes('WATER') || text.includes('PLANT') || text.includes('PUMP') || text.includes('TANK') || text.includes('MOTOR')) {
    return DropIcon;
  }
  if (text.includes('LIGHT') || text.includes('LAMP') || text.includes('STREET') || text.includes('PARKING')) {
    return LampIcon;
  }
  return LightningIcon;
};

const SolarDashboard = ({
  mainMeter = null,
  solarDevice = null,
  upsDevice = null,
  dgDevice = null,
  subMeters = []
}) => {
  const { isDark } = useTheme();
  const currentTheme = isDark
    ? {
        bg: '#0a101d',
        panelBg: '#131b2c',
        cardBg: '#1b2436',
        border: 'rgba(255, 255, 255, 0.08)',
        text: '#e2e8f0',
        muted: '#94a3b8',
        accent: '#f97316',
        green: '#10b981',
        blue: '#0ea5e9',
        red: '#ef4444',
        purple: '#a855f7',
        yellow: '#f59e0b',
        shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        progressGrad: 'linear-gradient(90deg, #a855f7, #d946ef)'
      }
    : {
        bg: '#f1f5f9',
        panelBg: '#ffffff',
        cardBg: '#ffffff',
        border: '#e2e8f0',
        text: '#1e293b',
        muted: '#64748b',
        accent: '#ea580c',
        green: '#059669',
        blue: '#0284c7',
        red: '#dc2626',
        purple: '#9333ea',
        yellow: '#d97706',
        shadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        progressGrad: 'linear-gradient(90deg, #9333ea, #c026d3)'
      };

  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  // Responsive scale transform to fit SCADA canvas precisely
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        if (width > 0) {
          const widthScale = width / 1150;
          const availableHeight = window.innerHeight - 150;
          const heightScale = Math.max(0.65, availableHeight / 720);
          setScale(Math.min(widthScale, heightScale));
        }
      }
    };

    const observer = new ResizeObserver(handleResize);
    window.addEventListener('resize', handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
      handleResize();
    }
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // --- DYNAMIC TELEMETRY COMPUTATIONS ---
  // 1. Grid (Main Meter)
  const isMainConfigured = Boolean(mainMeter?.isConfigured);
  const isMainOnline = Boolean(mainMeter?.isOnline);
  const gridW = isMainConfigured ? Math.round(Number(mainMeter.powerW) || 0) : 0;
  const gridV = isMainConfigured && mainMeter.vR !== undefined && mainMeter.vR !== null ? Number(mainMeter.vR).toFixed(1) : (isMainConfigured ? '0.0' : '—');
  const gridA = isMainConfigured && mainMeter.iR !== undefined && mainMeter.iR !== null ? Number(mainMeter.iR).toFixed(2) : (isMainConfigured ? '0.00' : '—');
  const gridHz = isMainConfigured && mainMeter.freq !== undefined && mainMeter.freq !== null ? Number(mainMeter.freq).toFixed(1) : (isMainConfigured ? '50.0' : '—');
  const gridKwh = isMainConfigured && mainMeter.todayKwh !== undefined && mainMeter.todayKwh !== null ? Number(mainMeter.todayKwh).toFixed(2) : '0.00';

  // 2. Solar (PV)
  const isSolarConfigured = Boolean(solarDevice?.isConfigured);
  const isSolarOnline = Boolean(solarDevice?.isOnline);
  const solarW = isSolarConfigured ? Math.round(Number(solarDevice.powerW) || 0) : 0;
  const solarV = isSolarConfigured && solarDevice.voltage !== undefined && solarDevice.voltage !== null ? Number(solarDevice.voltage).toFixed(1) : (isSolarConfigured ? '0.0' : '—');
  const solarA = isSolarConfigured && solarDevice.current !== undefined && solarDevice.current !== null ? Number(solarDevice.current).toFixed(2) : (isSolarConfigured ? '0.00' : '—');
  const solarKwh = isSolarConfigured && solarDevice.todayKwh !== undefined && solarDevice.todayKwh !== null ? Number(solarDevice.todayKwh).toFixed(2) : '0.00';

  // 3. UPS
  const isUpsConfigured = Boolean(upsDevice?.isConfigured);
  const isUpsOnline = Boolean(upsDevice?.isOnline);
  const upsSoc = isUpsConfigured && upsDevice.soc !== undefined && upsDevice.soc !== null ? Math.min(100, Math.max(0, Number(upsDevice.soc))) : 0;
  const upsV = isUpsConfigured && upsDevice.voltage !== undefined && upsDevice.voltage !== null ? Number(upsDevice.voltage).toFixed(1) : (isUpsConfigured ? '0.0' : '—');
  const upsA = isUpsConfigured && upsDevice.current !== undefined && upsDevice.current !== null ? Number(upsDevice.current).toFixed(2) : (isUpsConfigured ? '0.00' : '—');
  const upsStatus = isUpsConfigured ? (upsDevice.chargingStatus || (isUpsOnline ? 'Normal' : 'Offline')) : 'Not Configured';
  const upsCharge = isUpsConfigured && upsDevice.todayCharge ? upsDevice.todayCharge : (isUpsConfigured ? '0.00 kWh' : '—');

  // 4. DG Set
  const isDgConfigured = Boolean(dgDevice?.isConfigured);
  const isDgOnline = Boolean(dgDevice?.isOnline);
  const dgW = isDgConfigured ? Math.round(Number(dgDevice.powerW) || 0) : 0;
  const dgV = isDgConfigured && dgDevice.voltage !== undefined && dgDevice.voltage !== null ? Number(dgDevice.voltage).toFixed(1) : (isDgConfigured ? '0.0' : '—');
  const dgA = isDgConfigured && dgDevice.current !== undefined && dgDevice.current !== null ? Number(dgDevice.current).toFixed(2) : (isDgConfigured ? '0.00' : '—');
  const dgKwh = isDgConfigured && dgDevice.todayKwh !== undefined && dgDevice.todayKwh !== null ? Number(dgDevice.todayKwh).toFixed(2) : '0.00';
  const dgStatus = isDgConfigured ? (dgDevice.status || (dgW > 50 ? 'RUNNING' : 'STANDBY')) : 'Not Configured';

  // 5. Inflow Totals & Outgoing Distribution Totals
  const totalInflowW = gridW + solarW + dgW;
  const totalOutgoingW = subMeters.reduce((sum, sm) => sum + (Math.round(Number(sm.powerW) || 0)), 0);

  // Central combiner throughput
  const centerDisplayW = totalInflowW > 0 ? totalInflowW : totalOutgoingW;
  const totalOutputW = totalOutgoingW > 0 ? totalOutgoingW : centerDisplayW;

  // Calculated efficiency
  const invEff = useMemo(() => {
    if (solarDevice?.efficiency !== undefined && solarDevice.efficiency !== null) {
      return Number(solarDevice.efficiency).toFixed(1);
    }
    if (centerDisplayW > 0 && totalOutputW > 0) {
      const calc = (totalOutputW / centerDisplayW) * 100;
      return Math.min(99.9, Math.max(88.0, calc)).toFixed(1);
    }
    return isSolarConfigured || isMainConfigured ? '98.5' : '—';
  }, [solarDevice, centerDisplayW, totalOutputW, isSolarConfigured, isMainConfigured]);

  // Combiner / Inverter Temperature
  const invTemp = useMemo(() => {
    if (solarDevice?.temperature !== undefined && solarDevice.temperature !== null) {
      return Number(solarDevice.temperature).toFixed(1);
    }
    return isSolarConfigured || isMainConfigured ? '42.2' : '—';
  }, [solarDevice, isSolarConfigured, isMainConfigured]);

  // Today's Consumption on Total Output
  const todayConsumptionKwh = useMemo(() => {
    if (isMainConfigured && parseFloat(gridKwh) > 0) {
      return `${gridKwh} kWh`;
    }
    const sumSubKwh = subMeters.reduce((acc, sm) => acc + (parseFloat(sm.todayKwh) || 0), 0);
    if (sumSubKwh > 0) {
      return `${sumSubKwh.toFixed(2)} kWh`;
    }
    return isMainConfigured || subMeters.length > 0 ? '0.00 kWh' : '—';
  }, [isMainConfigured, gridKwh, subMeters]);

  // Prepare outgoing distribution items
  const processedSubmeters = useMemo(() => {
    return subMeters.map((sm, idx) => {
      const w = Math.round(Number(sm.powerW) || 0);
      const pct = totalOutputW > 0 ? ((w / totalOutputW) * 100).toFixed(1) : '0.0';
      const kwh = sm.todayKwh !== undefined && sm.todayKwh !== null ? Number(sm.todayKwh).toFixed(2) : '0.00';
      const IconComp = resolveSubmeterIcon(sm.name, sm.category);
      return {
        id: sm.id || `sm-${idx}`,
        title: sm.name || `Sub-Meter ${idx + 1}`,
        w,
        pct,
        kwh,
        IconComp,
        isOnline: sm.isOnline !== false
      };
    });
  }, [subMeters, totalOutputW]);

  // Flow animation booleans
  const gridFlowing = isMainOnline && gridW > 0;
  const solarFlowing = isSolarOnline && solarW > 0;
  const upsFlowing = isUpsOnline && upsSoc > 0;
  const dgFlowing = isDgOnline && dgW > 0;
  const centerFlowing = centerDisplayW > 0;
  const outputFlowing = totalOutputW > 0;

  return (
    <div className="theme-transition" style={{ background: currentTheme.bg, color: currentTheme.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .theme-transition, .theme-transition * {
          transition: background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease;
        }
        @keyframes dashFlow { from { stroke-dashoffset: 16; } to { stroke-dashoffset: 0; } }
        @keyframes waveMove { from { transform: translateX(0); } to { transform: translateX(-40px); } }
        .submeter-card:hover {
          border-color: rgba(168, 85, 247, 0.45) !important;
          transform: translateY(-1px);
        }
        .scada-submeters-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .scada-submeters-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .scada-submeters-scroll::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.35);
          border-radius: 4px;
        }
        .scada-submeters-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.6);
        }
      `}</style>

      <Container fluid className="px-0 pb-3">
        <Row className="g-0">
          <Col xl={12} lg={12} className="position-relative">
            <Card
              className="border-0"
              style={{
                background: currentTheme.panelBg,
                borderRadius: '16px',
                border: `1px solid ${currentTheme.border}`,
                boxShadow: currentTheme.shadow,
                minHeight: '700px',
                overflow: 'hidden'
              }}
            >
              <div
                ref={containerRef}
                style={{
                  width: '100%',
                  height: `${700 * scale}px`,
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: '1150px',
                    height: '700px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center'
                  }}
                >
                  {/* SVG Connecting Flow Lines */}
                  <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                    {/* Source 1 (Grid) -> Central Combiner */}
                    <FlowLine path="M 300 88 L 340 88 L 340 140 L 380 140" color={currentTheme.blue} flowing={gridFlowing} />
                    
                    {/* Source 2 (Solar) -> Central Combiner */}
                    <FlowLine path="M 300 258 L 340 258 L 340 200 L 380 200" color={currentTheme.yellow} flowing={solarFlowing} />
                    
                    {/* Source 3 (UPS) -> Central Combiner */}
                    <FlowLine path="M 300 428 L 340 428 L 340 260 L 380 260" color={currentTheme.green} flowing={upsFlowing} />
                    
                    {/* Source 4 (DG Set) -> Central Combiner */}
                    <FlowLine path="M 300 598 L 340 598 L 340 320 L 380 320" color={currentTheme.red} flowing={dgFlowing} />
                    
                    {/* Central Combiner -> Total Output */}
                    <FlowLine path="M 510 380 L 510 430" color={currentTheme.purple} flowing={centerFlowing} />
                    
                    {/* Total Output -> Outgoing Distribution Bus */}
                    <FlowLine path="M 640 500 L 700 500 L 700 25 L 735 25" color={currentTheme.purple} flowing={outputFlowing} />

                    {/* Outgoing feeder tap lines into submeter cards */}
                    {processedSubmeters.slice(0, 6).map((sm, i) => {
                      const tapY = 56 + (i * 96);
                      return (
                        <FlowLine
                          key={`tap-${sm.id || i}`}
                          path={`M 700 ${tapY} L 735 ${tapY}`}
                          color={currentTheme.purple}
                          flowing={outputFlowing && sm.w > 0}
                        />
                      );
                    })}
                  </svg>

                  {/* ── COL 1: INCOMING / SOURCES ── */}

                  {/* 1.1 GRID (UTILITY) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '20px',
                      top: '10px',
                      background: currentTheme.cardBg,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      width: '280px',
                      height: '155px',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: currentTheme.shadow,
                      opacity: isMainConfigured ? 1 : 0.7
                    }}
                  >
                    <div className="d-flex w-100">
                      <div className="me-3 d-flex align-items-start justify-content-center" style={{ width: '48px' }}>
                        <GridIconBig />
                      </div>
                      <div className="overflow-hidden">
                        <div className="d-flex align-items-center gap-1.5 mb-1">
                          <span className={`fw-bold text-${isDark ? 'white' : 'dark'} text-truncate`} style={{ fontSize: '12.5px', letterSpacing: '0.4px' }}>
                            {mainMeter?.name || 'GRID (UTILITY)'}
                          </span>
                          {!isMainConfigured && (
                            <span className="badge bg-secondary text-dark" style={{ fontSize: '9px' }}>UNMAPPED</span>
                          )}
                        </div>
                        <div style={{ color: currentTheme.blue, fontSize: '28px', fontWeight: 'bold', lineHeight: '1.2' }}>
                          {gridW} W
                        </div>
                        <div className={`mt-1 text-${isDark ? 'white' : 'dark'}`} style={{ fontSize: '11.5px', fontWeight: 600 }}>
                          {gridV} V <span className="text-muted mx-0.5">|</span> {gridA} A <span className="text-muted mx-0.5">|</span> {gridHz} Hz
                        </div>
                      </div>
                    </div>
                    <MiniWave color={currentTheme.blue} />
                    <div className="d-flex justify-content-between align-items-end mt-1">
                      <span className="text-muted" style={{ fontSize: '11px' }}>Today's Energy</span>
                      <span className={`fw-bold text-${isDark ? 'white' : 'dark'}`} style={{ fontSize: '13px' }}>
                        {gridKwh} kWh
                      </span>
                    </div>
                  </div>

                  {/* 1.2 SOLAR (PV) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '20px',
                      top: '180px',
                      background: currentTheme.cardBg,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      width: '280px',
                      height: '155px',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: currentTheme.shadow,
                      opacity: isSolarConfigured ? 1 : 0.7
                    }}
                  >
                    <div className="d-flex w-100">
                      <div className="me-3 d-flex align-items-start justify-content-center" style={{ width: '48px' }}>
                        <SolarIconBig />
                      </div>
                      <div className="overflow-hidden">
                        <div className="d-flex align-items-center gap-1.5 mb-1">
                          <span className={`fw-bold text-${isDark ? 'white' : 'dark'} text-truncate`} style={{ fontSize: '12.5px', letterSpacing: '0.4px' }}>
                            {solarDevice?.name || 'SOLAR (PV)'}
                          </span>
                          {!isSolarConfigured && (
                            <span className="badge bg-secondary text-dark" style={{ fontSize: '9px' }}>UNMAPPED</span>
                          )}
                        </div>
                        <div style={{ color: currentTheme.yellow, fontSize: '28px', fontWeight: 'bold', lineHeight: '1.2' }}>
                          {solarW} W
                        </div>
                        <div className={`mt-1 text-${isDark ? 'white' : 'dark'}`} style={{ fontSize: '11.5px', fontWeight: 600 }}>
                          {solarV} V <span className="text-muted mx-0.5">|</span> {solarA} A
                        </div>
                      </div>
                    </div>
                    <MiniWave color={currentTheme.yellow} />
                    <div className="d-flex justify-content-between align-items-end mt-1">
                      <span className="text-muted" style={{ fontSize: '11px' }}>Today's Energy</span>
                      <span className="fw-bold" style={{ color: currentTheme.yellow, fontSize: '13px' }}>
                        {solarKwh} kWh
                      </span>
                    </div>
                  </div>

                  {/* 1.3 UPS */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '20px',
                      top: '350px',
                      background: currentTheme.cardBg,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      width: '280px',
                      height: '155px',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: currentTheme.shadow,
                      opacity: isUpsConfigured ? 1 : 0.7
                    }}
                  >
                    <div className="d-flex w-100">
                      <div className="me-3 d-flex align-items-start justify-content-center" style={{ width: '48px' }}>
                        <BatteryIconBig />
                      </div>
                      <div className="overflow-hidden">
                        <div className="d-flex align-items-center gap-1.5 mb-1">
                          <span className={`fw-bold text-${isDark ? 'white' : 'dark'} text-truncate`} style={{ fontSize: '12.5px', letterSpacing: '0.4px' }}>
                            {upsDevice?.name || 'UPS'}
                          </span>
                          {!isUpsConfigured && (
                            <span className="badge bg-secondary text-dark" style={{ fontSize: '9px' }}>UNMAPPED</span>
                          )}
                        </div>
                        <div style={{ color: currentTheme.green, fontSize: '28px', fontWeight: 'bold', lineHeight: '1.2' }}>
                          {upsSoc.toFixed(1)}%
                        </div>
                        <div className={`mt-1 text-${isDark ? 'white' : 'dark'}`} style={{ fontSize: '11.5px', fontWeight: 600 }}>
                          {upsV} V <span className="text-muted mx-0.5">|</span> {upsA} A
                        </div>
                      </div>
                    </div>
                    <div className="w-100 mt-2">
                      <div style={{ background: isDark ? '#2e3238' : '#cbd5e1', height: '8px', borderRadius: '4px', width: '100%' }}>
                        <div
                          style={{
                            background: currentTheme.green,
                            height: '100%',
                            borderRadius: '4px',
                            width: `${upsSoc}%`,
                            boxShadow: isDark ? `0 0 8px ${currentTheme.green}` : 'none',
                            transition: 'width 1.5s ease-in-out'
                          }}
                        />
                      </div>
                      <div className="d-flex justify-content-end fw-bold mt-1" style={{ fontSize: '11px', color: currentTheme.green }}>
                        {upsStatus}
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-end mt-1">
                      <span className="text-muted" style={{ fontSize: '11px' }}>Today's Charge</span>
                      <span className={`fw-bold text-${isDark ? 'white' : 'dark'}`} style={{ fontSize: '13px' }}>
                        {upsCharge}
                      </span>
                    </div>
                  </div>

                  {/* 1.4 DG SET */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '20px',
                      top: '520px',
                      background: currentTheme.cardBg,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      width: '280px',
                      height: '155px',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: currentTheme.shadow,
                      opacity: isDgConfigured ? 1 : 0.7
                    }}
                  >
                    <div className="d-flex w-100">
                      <div className="me-3 d-flex align-items-start justify-content-center" style={{ width: '48px' }}>
                        <Zap color={currentTheme.red} size={42} strokeWidth={1.5} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="d-flex align-items-center gap-1.5 mb-1">
                          <span className={`fw-bold text-${isDark ? 'white' : 'dark'} text-truncate`} style={{ fontSize: '12.5px', letterSpacing: '0.4px' }}>
                            {dgDevice?.name || 'DG SET'}
                          </span>
                          {!isDgConfigured && (
                            <span className="badge bg-secondary text-dark" style={{ fontSize: '9px' }}>UNMAPPED</span>
                          )}
                        </div>
                        <div style={{ color: currentTheme.red, fontSize: '28px', fontWeight: 'bold', lineHeight: '1.2' }}>
                          {dgW} W
                        </div>
                        <div className={`mt-1 text-${isDark ? 'white' : 'dark'}`} style={{ fontSize: '11.5px', fontWeight: 600 }}>
                          {dgV} V <span className="text-muted mx-0.5">|</span> {dgA} A
                        </div>
                      </div>
                    </div>
                    <MiniWave color={currentTheme.red} />
                    <div className="d-flex justify-content-between align-items-end mt-1">
                      <div className="d-flex flex-column">
                        <span className="text-muted" style={{ fontSize: '11px' }}>Today's Energy</span>
                        <span className={`fw-bold text-${isDark ? 'white' : 'dark'}`} style={{ fontSize: '13px' }}>
                          {dgKwh} kWh
                        </span>
                      </div>
                      <span className="badge" style={{ background: dgW > 50 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.15)', color: dgW > 50 ? '#4ade80' : '#f87171', border: `1px solid ${dgW > 50 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, fontSize: '10px' }}>
                        {dgStatus}
                      </span>
                    </div>
                  </div>

                  {/* ── COL 2: INVERTER & TOTAL OUTPUT ── */}

                  {/* 2.1 SOCHIOT COMBINER UNIT */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '380px',
                      top: '100px',
                      background: currentTheme.cardBg,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '16px',
                      padding: '24px 20px',
                      width: '260px',
                      height: '280px',
                      zIndex: 10,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      boxShadow: currentTheme.shadow
                    }}
                  >
                    <div className="w-100 d-flex justify-content-center position-relative mb-2">
                      <span className={`fw-bold text-${isDark ? 'white' : 'dark'}`} style={{ fontSize: '16px', letterSpacing: '1px' }}>
                        SOCHIOT
                      </span>
                      <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: centerFlowing ? '#10b981' : '#64748b' }} />
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: centerFlowing ? '#10b981' : '#64748b' }} />
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: centerFlowing ? '#10b981' : '#64748b' }} />
                      </div>
                    </div>

                    {/* 3D Inverter Graphic */}
                    <div className="mb-3">
                      <svg width="100" height="90" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: isDark ? 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>
                        <defs>
                          <linearGradient id="bodyGradOverview" x1="0" y1="0" x2="0" y2="100">
                            <stop offset="0%" stopColor="#e2e8f0" />
                            <stop offset="100%" stopColor="#cbd5e1" />
                          </linearGradient>
                          <linearGradient id="baseGradOverview" x1="0" y1="0" x2="0" y2="100">
                            <stop offset="0%" stopColor="#1e293b" />
                            <stop offset="100%" stopColor="#0f172a" />
                          </linearGradient>
                        </defs>
                        <rect x="10" y="10" width="80" height="60" rx="6" fill="url(#bodyGradOverview)" />
                        <path d="M10 16 L20 10 L80 10 L90 16 L90 70 L10 70 Z" fill="#f8fafc" opacity="0.5" />
                        <path d="M10 16 L20 10 L20 70 L10 70 Z" fill="#94a3b8" opacity="0.3" />
                        <path d="M90 16 L80 10 L80 70 L90 70 Z" fill="#475569" opacity="0.2" />
                        <rect x="35" y="30" width="30" height="12" rx="3" fill="#0f172a" />
                        <rect x="38" y="34" width="8" height="4" rx="1" fill="#10b981" />
                        <circle cx="60" cy="36" r="1.5" fill="#10b981" />
                        <path d="M10 70 L90 70 L85 85 L15 85 Z" fill="url(#baseGradOverview)" />
                        <rect x="25" y="85" width="8" height="4" rx="1" fill="#475569" />
                        <rect x="67" y="85" width="8" height="4" rx="1" fill="#475569" />
                      </svg>
                    </div>

                    <div className="text-center w-100" style={{ color: currentTheme.green, fontSize: '36px', fontWeight: 'bold', textShadow: isDark ? '0 0 15px rgba(16,185,129,0.4)' : 'none', lineHeight: '1' }}>
                      {centerDisplayW} W
                    </div>

                    <div className={`d-flex justify-content-between w-100 mt-4 px-2 text-${isDark ? 'white' : 'dark'}`} style={{ fontSize: '13px' }}>
                      <div className="text-start">
                        <div className="text-muted mb-1" style={{ fontSize: '11px' }}>Efficiency</div>
                        <b style={{ fontSize: '14px', color: currentTheme.text }}>{invEff} %</b>
                      </div>
                      <div style={{ width: '1px', background: currentTheme.border, height: '30px' }} />
                      <div className="text-start" style={{ width: '80px' }}>
                        <div className="text-muted mb-1" style={{ fontSize: '11px' }}>Temperature</div>
                        <b style={{ fontSize: '14px', color: currentTheme.text }}>{invTemp} °C</b>
                      </div>
                    </div>

                    <svg width="100%" height="30" style={{ position: 'absolute', bottom: 10, left: 0, overflow: 'hidden' }}>
                      <g style={{ animation: 'waveMove 4s linear infinite' }}>
                        <path d="M 0 15 Q 20 5 40 15 T 80 15 T 120 15 T 160 15 T 200 15 T 240 15 T 280 15 T 320 15 L 320 30 L 0 30 Z" fill={isDark ? "rgba(16,185,129,0.05)" : "rgba(5,150,105,0.05)"} />
                        <path d="M 0 15 Q 20 5 40 15 T 80 15 T 120 15 T 160 15 T 200 15 T 240 15 T 280 15 T 320 15" fill="none" stroke={currentTheme.green} strokeWidth="1.5" style={{ filter: isDark ? 'drop-shadow(0 0 4px rgba(168,85,247,0.6))' : 'none' }} />
                      </g>
                    </svg>
                  </div>

                  {/* 2.2 TOTAL OUTPUT */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '380px',
                      top: '430px',
                      background: currentTheme.cardBg,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: '16px',
                      padding: '24px 20px',
                      width: '260px',
                      height: '140px',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: currentTheme.shadow
                    }}
                  >
                    <div className={`text-center fw-bold mb-2 text-${isDark ? 'white' : 'dark'}`} style={{ fontSize: '13.5px', letterSpacing: '0.5px' }}>
                      TOTAL OUTPUT
                    </div>
                    <div className="text-center mb-3" style={{ color: currentTheme.purple, fontSize: '38px', fontWeight: 'bold', textShadow: isDark ? '0 0 15px rgba(168,85,247,0.4)' : 'none', lineHeight: '1' }}>
                      {totalOutputW} W
                    </div>
                    <div className="w-100" style={{ height: '1px', background: currentTheme.border, marginBottom: '12px' }} />
                    <div className="d-flex justify-content-between w-100 text-muted" style={{ fontSize: '11.5px' }}>
                      <span>Today's Consumption</span>
                      <span className={`fw-bold text-${isDark ? 'white' : 'dark'}`}>
                        {todayConsumptionKwh}
                      </span>
                    </div>
                  </div>

                  <div style={{ position: 'absolute', left: '652px', top: '465px', color: currentTheme.purple, fontSize: '10px', fontWeight: 'bold', zIndex: 10, letterSpacing: '0.4px', lineHeight: '1.2' }}>
                    POWER<br/>FLOW
                  </div>

                  {/* ── COL 3: OUTGOING (DISTRIBUTION) ── */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '735px',
                      top: '5px',
                      width: '395px',
                      display: 'flex',
                      flexDirection: 'column',
                      zIndex: 10
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                      <span style={{ color: currentTheme.purple, fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                        OUTGOING (DISTRIBUTION)
                      </span>
                      <span className="badge rounded-pill" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '10px', fontWeight: 600 }}>
                        {processedSubmeters.length} Submeters
                      </span>
                    </div>

                    {/* Dynamic Submeter Cards Container */}
                    <div
                      className="scada-submeters-scroll"
                      style={{
                        maxHeight: '595px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        paddingRight: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '11px'
                      }}
                    >
                      {processedSubmeters.length === 0 ? (
                        <div
                          className="d-flex flex-column align-items-center justify-content-center p-4 text-center rounded-3"
                          style={{
                            background: currentTheme.cardBg,
                            border: `1px dashed ${currentTheme.border}`,
                            minHeight: '260px'
                          }}
                        >
                          <Zap size={36} className="text-secondary mb-2 opacity-50" />
                          <div className={`fw-bold text-${isDark ? 'white' : 'dark'} fs-14 mb-1`}>No Sub-Meters Configured</div>
                          <p className="text-secondary fs-12 mb-0" style={{ maxWidth: '280px' }}>
                            Outgoing distribution feeders will appear here dynamically once sub-meters are mapped to this site.
                          </p>
                        </div>
                      ) : (
                        processedSubmeters.map((load) => {
                          const IconComp = load.IconComp;
                          return (
                            <div
                              key={load.id}
                              className="submeter-card transition-all"
                              style={{
                                background: currentTheme.cardBg,
                                border: `1px solid ${currentTheme.border}`,
                                borderRadius: '12px',
                                padding: '11px 14px',
                                width: '100%',
                                minHeight: '74px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                boxShadow: currentTheme.shadow,
                                opacity: load.isOnline ? 1 : 0.65
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', minWidth: '38px' }}>
                                <IconComp />
                              </div>
                              <div className="flex-grow-1 overflow-hidden">
                                <div className="d-flex align-items-center gap-1.5 mb-1.5">
                                  <div
                                    className={`fw-bold text-truncate text-${isDark ? 'white' : 'dark'}`}
                                    style={{ fontSize: '10.5px', letterSpacing: '0.3px', lineHeight: '1.2' }}
                                    title={load.title}
                                  >
                                    {load.title}
                                  </div>
                                  {!load.isOnline && (
                                    <span className="badge bg-secondary text-dark px-1.5 py-0.5" style={{ fontSize: '8px' }}>OFFLINE</span>
                                  )}
                                </div>
                                <div style={{ background: isDark ? '#2e3238' : '#cbd5e1', height: '6px', borderRadius: '3px', width: '80%' }}>
                                  <div
                                    style={{
                                      background: currentTheme.progressGrad,
                                      height: '100%',
                                      borderRadius: '3px',
                                      width: `${Math.max(2, Math.min(100, parseFloat(load.pct) || 0))}%`,
                                      boxShadow: isDark ? '0 0 8px rgba(168,85,247,0.6)' : 'none',
                                      transition: 'width 1.5s ease-in-out'
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-end" style={{ minWidth: '85px' }}>
                                <div style={{ color: currentTheme.purple, fontSize: '17px', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                                  {load.w} W
                                </div>
                                <div className="text-muted mt-0.5" style={{ fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
                                  {load.pct} %
                                </div>
                                <div className="text-muted" style={{ fontSize: '10px', fontVariantNumeric: 'tabular-nums' }}>
                                  Today: {load.kwh} kWh
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                     {/* Total Outgoing Load Footer */}
                    <div
                      className="d-flex justify-content-between align-items-center mt-2 px-2.5 py-1.5 rounded-2"
                      style={{
                        background: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                        border: `1px solid ${currentTheme.border}`,
                        fontSize: '11.5px'
                      }}
                    >
                      <span className={`fw-bold text-${isDark ? 'white' : 'dark'}`}>Total Outgoing Load</span>
                      <span style={{ color: currentTheme.purple, fontWeight: 'bold' }}>
                        {totalOutputW} W (100%)
                      </span>
                    </div>

                    {/* System Loss Row */}
                    {(() => {
                      const lossW = totalInflowW - totalOutgoingW;
                      const lossColor = lossW > 0 ? currentTheme.red : currentTheme.green;
                      return (
                        <div
                          className="d-flex justify-content-between align-items-center mt-1 px-2.5 py-1.5 rounded-2"
                          style={{
                            background: lossW > 0
                              ? (isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.06)')
                              : (isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)'),
                            border: `1px solid ${lossW > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                            fontSize: '11.5px'
                          }}
                        >
                          <span className="text-muted" style={{ fontSize: '11px' }}>
                            ⚡ System Loss (Unaccounted)
                          </span>
                          <span style={{ color: lossColor, fontWeight: 'bold' }}>
                            {lossW > 0 ? lossW : 0} W
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SolarDashboard;
