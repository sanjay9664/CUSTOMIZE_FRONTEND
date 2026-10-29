import React, { useState, useEffect } from 'react';
import { Row, Col, Modal, ProgressBar } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert, Flame, Droplets, Activity, Clock, FileText, CheckCircle2, AlertOctagon,
  ShieldCheck, Zap, Volume2, Wind, Server, Power, Gauge, RefreshCw, Layers, Sliders,
  AlertTriangle, Play, ChevronDown, ChevronUp, Battery, Thermometer, Radio, Cpu,
  Check, ArrowDown, ArrowUp, BarChart3, Database, Shield, RadioTower, Sparkles,
  SlidersVertical, Maximize2, Minimize2, RotateCcw, Bell, Fan, ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import './ACMS.css';

// =========================================================
// COMPACT SCADA EQUIPMENT VISUAL ICONS (CLEAN & NON-OVERLAPPING)
// =========================================================

// =========================================================
// HIGH-DEFINITION SCADA EQUIPMENT VISUALS (PINPOINT ROTATION & METALLIC FINISH)
// =========================================================

// (i) Red Industrial Fire Pump with Pinpoint Centered Impeller
const RedPumpIcon = ({ isRunning = true }) => (
  <div className="acms-equip-icon-box red">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <defs>
        <linearGradient id="redPumpGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id="motorFinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="50%" stopColor="#B91C1C" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>
      </defs>
      {/* Base Skid */}
      <rect x="8" y="58" width="106" height="8" rx="3" fill="#1E293B" stroke="#334155" strokeWidth="1" />
      {/* Motor Body & Cooling Fins */}
      <rect x="52" y="16" width="58" height="44" rx="4" fill="url(#motorFinGrad)" stroke="#7F1D1D" strokeWidth="1" />
      <line x1="60" y1="17" x2="60" y2="59" stroke="#7F1D1D" strokeWidth="2.5" />
      <line x1="70" y1="17" x2="70" y2="59" stroke="#7F1D1D" strokeWidth="2.5" />
      <line x1="80" y1="17" x2="80" y2="59" stroke="#7F1D1D" strokeWidth="2.5" />
      <line x1="90" y1="17" x2="90" y2="59" stroke="#7F1D1D" strokeWidth="2.5" />
      <line x1="100" y1="17" x2="100" y2="59" stroke="#7F1D1D" strokeWidth="2.5" />
      {/* Terminal Box & Flange */}
      <rect x="72" y="8" width="18" height="8" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="1" />
      <rect x="108" y="24" width="8" height="28" rx="2" fill="#475569" />
      <rect x="36" y="32" width="16" height="14" fill="#334155" />
      {/* Volute Pump Casing */}
      <circle cx="28" cy="38" r="22" fill="url(#redPumpGrad)" stroke="#B91C1C" strokeWidth="2" />
      {/* Perfectly Centered Spinning Impeller */}
      <g
        className={isRunning ? "scada-spin" : ""}
        style={{ transformOrigin: '28px 38px', transformBox: 'view-box' }}
      >
        <circle cx="28" cy="38" r="9" fill="#FECACA" />
        <line x1="28" y1="23" x2="28" y2="53" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <line x1="13" y1="38" x2="43" y2="38" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <line x1="17" y1="27" x2="39" y2="49" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="17" y1="49" x2="39" y2="27" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {/* Center Shaft Cap */}
      <circle cx="28" cy="38" r="4.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
      {/* Flanges */}
      <rect x="2" y="30" width="8" height="16" rx="1.5" fill="#64748B" />
      <rect x="20" y="6" width="16" height="10" rx="1.5" fill="#64748B" />
    </svg>
  </div>
);

// (ii) Yellow Standby Diesel Engine Generator
const DieselEngineIcon = ({ isRunning = false }) => (
  <div className="acms-equip-icon-box amber">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <defs>
        <linearGradient id="engineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <rect x="8" y="60" width="106" height="7" rx="2" fill="#1E293B" stroke="#334155" strokeWidth="1" />
      <rect x="14" y="20" width="60" height="40" rx="4" fill="url(#engineGrad)" stroke="#92400E" strokeWidth="1.5" />
      <rect x="74" y="14" width="38" height="46" rx="4" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
      {/* Exhaust Muffler */}
      <path d="M22 20 L22 6 L32 6 L32 20 Z" fill="#64748B" stroke="#475569" strokeWidth="1" />
      <circle cx="27" cy="6" r="6" fill="#334155" />
      {/* Engine Details */}
      <rect x="82" y="22" width="4" height="30" rx="1" fill="#78350F" />
      <rect x="90" y="22" width="4" height="30" rx="1" fill="#78350F" />
      <rect x="98" y="22" width="4" height="30" rx="1" fill="#78350F" />
      {/* Cranking Battery Pack */}
      <rect x="18" y="34" width="20" height="18" rx="2" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />
      <circle cx="23" cy="38" r="2" fill="#EF4444" />
      <circle cx="33" cy="38" r="2" fill="#1E293B" />
      {/* Engine Control Gauge */}
      <rect x="42" y="26" width="24" height="16" rx="2" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
      <circle cx="49" cy="34" r="3" fill="#10B981" />
      <circle cx="59" cy="34" r="3" fill={isRunning ? "#EF4444" : "#475569"} />
    </svg>
  </div>
);

// (iii) Cylindrical Diesel Storage Tank with Glowing Gauge
const DieselTankIcon = ({ percentage = 88 }) => (
  <div className="acms-equip-icon-box cyan">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <defs>
        <linearGradient id="tankBodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <rect x="22" y="60" width="76" height="5" rx="2" fill="#0F172A" stroke="#334155" strokeWidth="1" />
      <rect x="25" y="16" width="70" height="44" rx="5" fill="url(#tankBodyGrad)" stroke="#0284C7" strokeWidth="2" />
      <ellipse cx="60" cy="16" rx="35" ry="8" fill="#334155" stroke="#0284C7" strokeWidth="1.5" />
      {/* Fuel Level Sight Glass */}
      <rect x="80" y="22" width="8" height="32" rx="4" fill="#070D18" stroke="#38BDF8" strokeWidth="1.5" />
      <rect
        x="82"
        y={24 + (28 * (1 - Math.min(100, Math.max(0, percentage)) / 100))}
        width="4"
        height={28 * (Math.min(100, Math.max(0, percentage)) / 100)}
        rx="2"
        fill="#06C7F5"
      />
      {/* Manhole & Breather */}
      <path d="M56 10 L56 4 L64 4 L64 10" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="42" cy="38" r="10" fill="#070D18" stroke="#334155" strokeWidth="1" />
      <text x="42" y="41" fill="#38BDF8" fontSize="8" fontWeight="bold" textAnchor="middle">{percentage}%</text>
    </svg>
  </div>
);

// (iv) Electrical Breaker / Switchgear Panel
const PowerPanelIcon = () => (
  <div className="acms-equip-icon-box purple">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <rect x="18" y="10" width="84" height="52" rx="4" fill="#111A2B" stroke="#6D5CE7" strokeWidth="2" />
      <line x1="60" y1="10" x2="60" y2="62" stroke="#334155" strokeWidth="1.5" />
      {/* Digital Voltage Display */}
      <rect x="26" y="18" width="28" height="15" rx="2" fill="#070D18" stroke="#38BDF8" strokeWidth="1" />
      <text x="40" y="29" fill="#38BDF8" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">415V</text>
      {/* 3-Phase Indicator Lights (R, Y, B) */}
      <circle cx="70" cy="22" r="4" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1" />
      <circle cx="80" cy="22" r="4" fill="#F59E0B" stroke="#78350F" strokeWidth="1" />
      <circle cx="90" cy="22" r="4" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="1" />
      {/* Main Isolator Handle */}
      <rect x="74" y="36" width="12" height="18" rx="2" fill="#10B981" />
      <line x1="80" y1="38" x2="80" y2="52" stroke="#FFFFFF" strokeWidth="2" />
      <rect x="28" y="40" width="24" height="12" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
    </svg>
  </div>
);

// (v) Hydrant Riser Pipe & Dial Gauge
const RiserPressureIcon = () => (
  <div className="acms-equip-icon-box red">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      {/* Heavy Red Riser Header Pipe */}
      <rect x="20" y="4" width="24" height="64" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
      <rect x="44" y="28" width="18" height="12" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1" />
      {/* Dial Gauge */}
      <circle cx="80" cy="34" r="22" fill="#0B1220" stroke="#EF4444" strokeWidth="2.5" />
      <circle cx="80" cy="34" r="18" fill="#111A2B" stroke="#334155" strokeWidth="1" />
      {/* Calibration Ticks */}
      <line x1="80" y1="18" x2="80" y2="21" stroke="#94A3B8" strokeWidth="1.5" />
      <line x1="64" y1="34" x2="67" y2="34" stroke="#94A3B8" strokeWidth="1.5" />
      <line x1="96" y1="34" x2="93" y2="34" stroke="#94A3B8" strokeWidth="1.5" />
      {/* Needle Pointing to 7.5 kg/cm² */}
      <line x1="80" y1="34" x2="88" y2="24" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="80" cy="34" r="4" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
    </svg>
  </div>
);

// (vi) Blue Jockey Pump with Centered Rotor
const BlueJockeyIcon = ({ isRunning = false }) => (
  <div className="acms-equip-icon-box cyan">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <rect x="12" y="56" width="94" height="7" rx="2" fill="#1E293B" stroke="#334155" strokeWidth="1" />
      <rect x="48" y="20" width="50" height="36" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" />
      <line x1="58" y1="21" x2="58" y2="55" stroke="#0369A1" strokeWidth="2" />
      <line x1="68" y1="21" x2="68" y2="55" stroke="#0369A1" strokeWidth="2" />
      <line x1="78" y1="21" x2="78" y2="55" stroke="#0369A1" strokeWidth="2" />
      <line x1="88" y1="21" x2="88" y2="55" stroke="#0369A1" strokeWidth="2" />
      {/* Jockey Pump Volute */}
      <circle cx="30" cy="38" r="19" fill="#06C7F5" stroke="#0284C7" strokeWidth="2" />
      {/* Perfectly Centered Spinning Impeller */}
      <g
        className={isRunning ? "scada-spin" : ""}
        style={{ transformOrigin: '30px 38px', transformBox: 'view-box' }}
      >
        <circle cx="30" cy="38" r="7" fill="#E0F2FE" />
        <line x1="30" y1="25" x2="30" y2="51" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="17" y1="38" x2="43" y2="38" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx="30" cy="38" r="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
    </svg>
  </div>
);

// (vii) MCB Feeder Panel
const McbPanelIcon = () => (
  <div className="acms-equip-icon-box cyan">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <rect x="18" y="12" width="84" height="48" rx="4" fill="#111A2B" stroke="#06C7F5" strokeWidth="1.5" />
      <rect x="26" y="20" width="14" height="24" rx="2" fill="#070D18" stroke="#334155" strokeWidth="1" />
      <rect x="44" y="20" width="14" height="24" rx="2" fill="#070D18" stroke="#334155" strokeWidth="1" />
      <rect x="62" y="20" width="14" height="24" rx="2" fill="#070D18" stroke="#334155" strokeWidth="1" />
      <rect x="80" y="20" width="14" height="24" rx="2" fill="#070D18" stroke="#334155" strokeWidth="1" />
      {/* Breaker Switches UP (ON) */}
      <rect x="29" y="23" width="8" height="10" rx="1.5" fill="#10B981" />
      <rect x="47" y="23" width="8" height="10" rx="1.5" fill="#10B981" />
      <rect x="65" y="23" width="8" height="10" rx="1.5" fill="#10B981" />
      <rect x="83" y="23" width="8" height="10" rx="1.5" fill="#10B981" />
    </svg>
  </div>
);

// (viii) Rooftop Booster Pump with Centered Rotor
const BoosterPumpIcon = ({ isRunning = false }) => (
  <div className="acms-equip-icon-box blue">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <rect x="20" y="56" width="80" height="7" rx="2" fill="#0F172A" stroke="#334155" strokeWidth="1" />
      <rect x="36" y="12" width="48" height="44" rx="4" fill="#1E293B" stroke="#3B82F6" strokeWidth="1.5" />
      <rect x="42" y="18" width="36" height="32" rx="2" fill="#2563EB" />
      <circle cx="60" cy="34" r="11" fill="#60A5FA" stroke="#1D4ED8" strokeWidth="1" />
      {/* Perfectly Centered Rotor */}
      <g
        className={isRunning ? "scada-spin" : ""}
        style={{ transformOrigin: '60px 34px', transformBox: 'view-box' }}
      >
        <line x1="60" y1="25" x2="60" y2="43" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="51" y1="34" x2="69" y2="34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx="60" cy="34" r="3.5" fill="#0F172A" />
    </svg>
  </div>
);

// (ix) Rooftop Distribution DB Panel
const RoofDbIcon = () => (
  <div className="acms-equip-icon-box blue">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <rect x="20" y="14" width="80" height="46" rx="4" fill="#111A2B" stroke="#60A5FA" strokeWidth="1.5" />
      <rect x="28" y="22" width="28" height="15" rx="2" fill="#070D18" stroke="#60A5FA" strokeWidth="1" />
      <text x="42" y="33" fill="#60A5FA" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">DB-2</text>
      <circle cx="70" cy="29" r="4.5" fill="#10B981" />
      <circle cx="84" cy="29" r="4.5" fill="#10B981" />
      <line x1="28" y1="46" x2="92" y2="46" stroke="#334155" strokeWidth="1.5" />
    </svg>
  </div>
);

// (c) Underground Water Sump
const UGSumpIcon = () => (
  <div className="acms-equip-icon-box blue">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <rect x="14" y="14" width="92" height="48" rx="3" fill="#111A2B" stroke="#0284C7" strokeWidth="1.5" />
      <rect x="18" y="28" width="84" height="30" fill="#0284C7" opacity="0.4" />
      <path d="M18 28 Q 40 24, 60 28 T 102 28 L 102 58 L 18 58 Z" fill="#06C7F5" opacity="0.5" />
      <rect x="34" y="8" width="20" height="8" rx="2" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
      <line x1="20" y1="36" x2="100" y2="36" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  </div>
);

// (d) Sprinkler Pump with Centered Impeller
const SprinklerPumpIcon = ({ isRunning = false }) => (
  <div className="acms-equip-icon-box cyan">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <rect x="10" y="58" width="100" height="8" rx="2" fill="#1E293B" stroke="#334155" strokeWidth="1" />
      <rect x="50" y="20" width="56" height="38" rx="4" fill="#0369A1" stroke="#0284C7" strokeWidth="1.5" />
      <line x1="60" y1="21" x2="60" y2="57" stroke="#0284C7" strokeWidth="2" />
      <line x1="72" y1="21" x2="72" y2="57" stroke="#0284C7" strokeWidth="2" />
      <line x1="84" y1="21" x2="84" y2="57" stroke="#0284C7" strokeWidth="2" />
      <line x1="96" y1="21" x2="96" y2="57" stroke="#0284C7" strokeWidth="2" />
      {/* Sprinkler Pump Casing */}
      <circle cx="28" cy="38" r="21" fill="#0EA5E9" stroke="#0284C7" strokeWidth="2" />
      {/* Perfectly Centered Spinning Impeller */}
      <g
        className={isRunning ? "scada-spin" : ""}
        style={{ transformOrigin: '28px 38px', transformBox: 'view-box' }}
      >
        <circle cx="28" cy="38" r="7.5" fill="#BAE6FD" />
        <line x1="28" y1="24" x2="28" y2="52" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="14" y1="38" x2="42" y2="38" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="18" y1="28" x2="38" y2="48" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="48" x2="38" y2="28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle cx="28" cy="38" r="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
    </svg>
  </div>
);

// (e) Fire Alarm Control Panel (FACP)
const FacpPanelIcon = () => (
  <div className="acms-equip-icon-box red">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <rect x="16" y="10" width="88" height="52" rx="5" fill="#7F1D1D" stroke="#EF4444" strokeWidth="1.5" />
      <rect x="24" y="18" width="44" height="20" rx="2" fill="#070D18" stroke="#38BDF8" strokeWidth="1" />
      <text x="46" y="31" fill="#34D399" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">NORMAL</text>
      <circle cx="78" cy="22" r="3.5" fill="#10B981" />
      <circle cx="88" cy="22" r="3.5" fill="#475569" />
      <circle cx="78" cy="32" r="3.5" fill="#10B981" />
      <circle cx="88" cy="32" r="3.5" fill="#475569" />
      <rect x="24" y="44" width="68" height="12" rx="2" fill="#0F172A" />
      <line x1="30" y1="50" x2="86" y2="50" stroke="#334155" strokeWidth="1" />
    </svg>
  </div>
);

// (g) PA 500W Amplifier Rack
const PaAmpIcon = () => (
  <div className="acms-equip-icon-box purple">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      <rect x="14" y="12" width="92" height="50" rx="4" fill="#111A2B" stroke="#A855F7" strokeWidth="1.5" />
      <rect x="22" y="20" width="50" height="14" rx="2" fill="#070D18" />
      {/* VU Meter LEDs */}
      <rect x="25" y="24" width="6" height="6" fill="#10B981" />
      <rect x="33" y="24" width="6" height="6" fill="#10B981" />
      <rect x="41" y="24" width="6" height="6" fill="#10B981" />
      <rect x="49" y="24" width="6" height="6" fill="#F59E0B" />
      <rect x="57" y="24" width="6" height="6" fill="#EF4444" />
      <circle cx="86" cy="27" r="7" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
      <line x1="86" y1="27" x2="89" y2="23" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  </div>
);

// (h) Air Pressurization Blower Fan with Centered Blades
const PressurizationFanIcon = ({ isRunning = true }) => (
  <div className="acms-equip-icon-box cyan">
    <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
      {/* Fan Housing */}
      <circle cx="50" cy="38" r="28" fill="#111A2B" stroke="#06C7F5" strokeWidth="2" />
      <path d="M50 10 L100 10 L100 38 L76 38" stroke="#06C7F5" strokeWidth="2" fill="#1E293B" />
      {/* Perfectly Centered Spinning Blades */}
      <g
        className={isRunning ? "scada-spin" : ""}
        style={{ transformOrigin: '50px 38px', transformBox: 'view-box' }}
      >
        <circle cx="50" cy="38" r="8" fill="#38BDF8" />
        <path d="M50 18 Q 59 28, 50 38 Q 41 48, 50 58" stroke="#06C7F5" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M30 38 Q 40 29, 50 38 Q 60 47, 70 38" stroke="#06C7F5" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <circle cx="50" cy="38" r="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
    </svg>
  </div>
);

// (f) Manual Call Point Break-Glass Visual Icon
const McpIcon = ({ isTriggered = false, status = 'NORMAL' }) => {
  const triggered = isTriggered || status === 'TRIGGERED';
  return (
    <div className={`acms-equip-icon-box ${triggered ? 'red' : 'amber'}`}>
      <svg width="48" height="34" viewBox="0 0 120 75" fill="none">
        <rect x="22" y="8" width="76" height="58" rx="4" fill={triggered ? "#EF4444" : "#991B1B"} stroke={triggered ? "#FCA5A5" : "#EF4444"} strokeWidth="2" />
        <rect x="32" y="16" width="56" height="42" rx="2" fill="#0F172A" stroke="#334155" strokeWidth="1" />
        <rect x="36" y="20" width="48" height="34" rx="1" fill={triggered ? "rgba(239, 68, 68, 0.3)" : "rgba(56, 189, 248, 0.15)"} stroke={triggered ? "#EF4444" : "#38BDF8"} strokeWidth="1" />
        <circle cx="60" cy="37" r="9" fill={triggered ? "#EF4444" : "#FFFFFF"} stroke="#0F172A" strokeWidth="2" />
        <circle cx="86" cy="14" r="2.5" fill={triggered ? "#EF4444" : "#10B981"} />
      </svg>
    </div>
  );
};

// Banner Backdrop
const BannerBackdropIllustration = ({ color = '#EF3340' }) => (
  <svg width="340" height="100" viewBox="0 0 340 100" fill="none" className="acms-water-backdrop">
    <defs>
      <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#06C7F5" stopOpacity="0.8" />
        <stop offset="60%" stopColor="#168CE0" stopOpacity="0.4" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M40 50 C 100 20, 180 35, 260 48" stroke={`url(#grad-${color.replace('#','')})`} strokeWidth="8" strokeLinecap="round" opacity="0.6" />
    <path d="M50 54 C 110 30, 200 45, 290 52" stroke={`url(#grad-${color.replace('#','')})`} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
    <path d="M45 46 C 90 25, 170 30, 240 40" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.7" />
    <rect x="270" y="20" width="36" height="60" rx="3" fill={color} opacity="0.85" />
    <path d="M265 20 Q 288 0 311 20 Z" fill={color} />
    <rect x="282" y="0" width="12" height="8" fill="#1E293B" />
    <circle cx="262" cy="46" r="4" fill="#06C7F5" />
  </svg>
);

// 3D Isometric / Cylindrical Water Tank Visualization - Realistic Tall Animated Fluid Flow
const TankCylinderVisual = ({ capacity = 300, current = '265.5 kL', percentage = 88.5, maxVal = 300, color = '#00D4FF', isWarning = false }) => {
  const pct = Math.min(100, Math.max(0, percentage));
  const activeColor = isWarning || pct < 40 ? '#EF4444' : color;
  const isDanger = isWarning || pct < 40;
  
  // Tall cylinder height (from y=26 to y=182) = 156px
  const tankTopY = 26;
  const tankBottomY = 182;
  const totalHeight = tankBottomY - tankTopY; // 156px
  const waterHeight = Math.max(10, (pct / 100) * totalHeight);
  const waterTopY = tankBottomY - waterHeight;
  const uniqueId = `tank-flow-${Math.round(maxVal)}-${isDanger ? 'alert' : 'ok'}`;

  return (
    <div className="acms-tank-preview-box position-relative d-flex justify-content-center align-items-center py-1" style={{ minHeight: '220px' }}>
      <svg width="155" height="218" viewBox="0 0 155 218" fill="none" style={{ overflow: 'visible' }}>
        <defs>
          {/* Glass Wall Gradient */}
          <linearGradient id={`${uniqueId}-glass`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0B132B" stopOpacity="0.95" />
            <stop offset="15%" stopColor="#1C2D4F" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#0D1B2A" stopOpacity="0.4" />
            <stop offset="85%" stopColor="#1C2D4F" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0B132B" stopOpacity="0.95" />
          </linearGradient>

          {/* Deep Realistic Water Fluid Gradient */}
          <linearGradient id={`${uniqueId}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isDanger ? '#F87171' : '#38BDF8'} stopOpacity="0.95" />
            <stop offset="35%" stopColor={isDanger ? '#EF4444' : activeColor} stopOpacity="0.9" />
            <stop offset="75%" stopColor={isDanger ? '#DC2626' : '#0284C7'} stopOpacity="0.93" />
            <stop offset="100%" stopColor={isDanger ? '#991B1B' : '#075985'} stopOpacity="0.98" />
          </linearGradient>

          {/* Surface Wave Highlight Gradient */}
          <linearGradient id={`${uniqueId}-surface`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="50%" stopColor={isDanger ? '#FCA5A5' : '#E0F2FE'} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </linearGradient>

          {/* Metallic Cylinder Rims */}
          <linearGradient id={`${uniqueId}-rim`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Glass Reflection Highlight */}
          <linearGradient id={`${uniqueId}-reflect`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.02" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Clip path for water inside cylinder */}
          <clipPath id={`${uniqueId}-clip`}>
            <rect x="36" y={tankTopY} width="80" height={totalHeight} rx="2" />
          </clipPath>
        </defs>

        {/* Structural Shadows & Support Pedestals */}
        <rect x="46" y="186" width="12" height="18" rx="2" fill="#0F172A" stroke="#334155" strokeWidth="1" />
        <rect x="94" y="186" width="12" height="18" rx="2" fill="#0F172A" stroke="#334155" strokeWidth="1" />
        <ellipse cx="76" cy="204" rx="48" ry="6" fill="#000000" fillOpacity="0.5" />

        {/* Outer Cylinder Glass Shell Backing */}
        <rect x="36" y={tankTopY} width="80" height={totalHeight} rx="2" fill={`url(#${uniqueId}-glass)`} stroke="#334155" strokeWidth="1.5" />

        {/* Flowing Water Section (Inside ClipPath) */}
        <g clipPath={`url(#${uniqueId}-clip)`}>
          {/* Main Water Body Fill */}
          <rect x="36" y={waterTopY} width="80" height={waterHeight + 10} fill={`url(#${uniqueId}-water)`} />

          {/* Animated Flowing Primary Wave */}
          <path fill={`url(#${uniqueId}-water)`}>
            <animate 
              attributeName="d" 
              dur="2.8s" 
              repeatCount="indefinite" 
              values={`M 36 ${waterTopY} Q 56 ${waterTopY - 4.5} 76 ${waterTopY} T 116 ${waterTopY} L 116 ${waterTopY + 25} L 36 ${waterTopY + 25} Z; M 36 ${waterTopY} Q 56 ${waterTopY + 4} 76 ${waterTopY} T 116 ${waterTopY} L 116 ${waterTopY + 25} L 36 ${waterTopY + 25} Z; M 36 ${waterTopY} Q 56 ${waterTopY - 4.5} 76 ${waterTopY} T 116 ${waterTopY} L 116 ${waterTopY + 25} L 36 ${waterTopY + 25} Z`}
            />
          </path>

          {/* Animated Flowing Secondary Translucent Fluid Ripple */}
          <path fill={isDanger ? '#F87171' : '#7DD3FC'} fillOpacity="0.45">
            <animate 
              attributeName="d" 
              dur="2.1s" 
              repeatCount="indefinite" 
              values={`M 36 ${waterTopY} Q 56 ${waterTopY + 3.5} 76 ${waterTopY - 2.5} T 116 ${waterTopY + 2} L 116 ${waterTopY + 12} L 36 ${waterTopY + 12} Z; M 36 ${waterTopY} Q 56 ${waterTopY - 3.5} 76 ${waterTopY + 2.5} T 116 ${waterTopY - 1.5} L 116 ${waterTopY + 12} L 36 ${waterTopY + 12} Z; M 36 ${waterTopY} Q 56 ${waterTopY + 3.5} 76 ${waterTopY - 2.5} T 116 ${waterTopY + 2} L 116 ${waterTopY + 12} L 36 ${waterTopY + 12} Z`}
            />
          </path>

          {/* Animated Rising Air Bubbles for Realistic Fluid Effect */}
          <circle cx="52" cy="160" r="2.2" fill="#FFFFFF" fillOpacity="0.65">
            <animate attributeName="cy" values={`170; ${waterTopY + 5}`} dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1; 0.85; 0" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="74" cy="165" r="1.6" fill="#FFFFFF" fillOpacity="0.75">
            <animate attributeName="cy" values={`176; ${waterTopY + 6}`} dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15; 0.9; 0" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="94" cy="155" r="2.5" fill="#FFFFFF" fillOpacity="0.6">
            <animate attributeName="cy" values={`168; ${waterTopY + 4}`} dur="2.9s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2; 0.8; 0" dur="2.9s" repeatCount="indefinite" />
          </circle>
          <circle cx="64" cy="140" r="1.4" fill="#FFFFFF" fillOpacity="0.7">
            <animate attributeName="cy" values={`155; ${waterTopY + 7}`} dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2; 0.75; 0" dur="2.1s" repeatCount="indefinite" />
          </circle>
          <circle cx="104" cy="145" r="1.8" fill="#FFFFFF" fillOpacity="0.65">
            <animate attributeName="cy" values={`162; ${waterTopY + 6}`} dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1; 0.8; 0" dur="2.6s" repeatCount="indefinite" />
          </circle>

          {/* Surface Wave Meniscus Ellipse */}
          <ellipse cx="76" cy={waterTopY} rx="40" ry="6.5" fill={`url(#${uniqueId}-surface)`} fillOpacity="0.9" />
          <ellipse cx="76" cy={waterTopY} rx="40" ry="6.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1" />

          {/* Vertical Curved Glass Reflection */}
          <rect x="42" y={tankTopY} width="16" height={totalHeight} fill={`url(#${uniqueId}-reflect)`} />
        </g>

        {/* Cylinder Frame & Top/Bottom Rims */}
        {/* Top Rim */}
        <ellipse cx="76" cy={tankTopY} rx="40" ry="7.5" fill={`url(#${uniqueId}-rim)`} stroke="#64748B" strokeWidth="1.5" />
        <ellipse cx="76" cy={tankTopY} rx="35" ry="5.5" fill="#0B132B" stroke="#334155" strokeWidth="1" />
        <ellipse cx="76" cy={tankTopY} rx="12" ry="3.5" fill="#334155" stroke="#94A3B8" strokeWidth="1" />

        {/* Bottom Rim */}
        <ellipse cx="76" cy={tankBottomY} rx="40" ry="7.5" fill="none" stroke="#475569" strokeWidth="1.5" />

        {/* Volume Graduations & Depth Markers on Left */}
        <line x1="26" y1={tankTopY} x2="35" y2={tankTopY} stroke="#38BDF8" strokeWidth="1.8" />
        <text x="23" y={tankTopY + 3} fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="end" fontFamily="monospace">{maxVal}</text>

        <line x1="29" y1={tankTopY + totalHeight * 0.25} x2="35" y2={tankTopY + totalHeight * 0.25} stroke="#64748B" strokeWidth="1.2" />
        <text x="26" y={tankTopY + totalHeight * 0.25 + 3} fill="#64748B" fontSize="7.5" textAnchor="end" fontFamily="monospace">{Math.round(maxVal * 0.75)}</text>

        <line x1="27" y1={tankTopY + totalHeight * 0.5} x2="35" y2={tankTopY + totalHeight * 0.5} stroke="#38BDF8" strokeWidth="1.5" />
        <text x="24" y={tankTopY + totalHeight * 0.5 + 3} fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="end" fontFamily="monospace">{Math.round(maxVal * 0.5)}</text>

        <line x1="29" y1={tankTopY + totalHeight * 0.75} x2="35" y2={tankTopY + totalHeight * 0.75} stroke="#64748B" strokeWidth="1.2" />
        <text x="26" y={tankTopY + totalHeight * 0.75 + 3} fill="#64748B" fontSize="7.5" textAnchor="end" fontFamily="monospace">{Math.round(maxVal * 0.25)}</text>

        <line x1="26" y1={tankBottomY} x2="35" y2={tankBottomY} stroke="#38BDF8" strokeWidth="1.8" />
        <text x="23" y={tankBottomY + 3} fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="end" fontFamily="monospace">0</text>

        {/* Level Indicator Pointer & Live Floating % Badge on Right */}
        <polygon 
          points={`117,${waterTopY} 123,${waterTopY - 4} 123,${waterTopY + 4}`} 
          fill={activeColor} 
        />
        <line x1="116" y1={waterTopY} x2="136" y2={waterTopY} stroke={activeColor} strokeWidth="1.5" strokeDasharray="2 1" />
        <rect x="127" y={waterTopY - 8} width="24" height="16" rx="3" fill="#0B132B" stroke={activeColor} strokeWidth="1.2" />
        <text x="139" y={waterTopY + 3.5} fill="#FFFFFF" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{pct}%</text>
      </svg>
    </div>
  );
};

// 3D Motor Control Center / Electrical Panel Visual
const PowerPanelLargeVisual = ({ isPowered = true }) => (
  <div className="acms-tank-preview-box">
    <svg width="125" height="96" viewBox="0 0 125 96" fill="none">
      <defs>
        <linearGradient id="panelSteelGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      {/* Cabinet Shell */}
      <rect x="25" y="8" width="75" height="80" rx="4" fill="url(#panelSteelGrad)" stroke="#475569" strokeWidth="1.5" />
      {/* Top Header Door */}
      <rect x="30" y="14" width="65" height="22" rx="2" fill="#0B1220" stroke="#334155" strokeWidth="1" />
      {/* Digital Voltage Display */}
      <rect x="34" y="18" width="36" height="14" rx="1.5" fill="#070D18" stroke="#1E293B" />
      <text x="52" y="28" fill={isPowered ? "#10B981" : "#EF4444"} fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">414.8 V</text>
      {/* 3-Phase Indicator LEDs (R-Y-B) */}
      <circle cx="76" cy="25" r="2.5" fill={isPowered ? "#EF4444" : "#475569"} />
      <circle cx="82" cy="25" r="2.5" fill={isPowered ? "#F59E0B" : "#475569"} />
      <circle cx="88" cy="25" r="2.5" fill={isPowered ? "#3B82F6" : "#475569"} />
      {/* Main Rotary Breaker Switch */}
      <rect x="30" y="40" width="65" height="42" rx="2" fill="#0B1220" stroke="#334155" strokeWidth="1" />
      <circle cx="50" cy="61" r="12" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
      <rect x="48" y="51" width="4" height="20" rx="1.5" fill={isPowered ? "#10B981" : "#EF4444"} transform={isPowered ? "rotate(0 50 61)" : "rotate(90 50 61)"} />
      {/* Contactor Status Tag */}
      <rect x="68" y="55" width="23" height="14" rx="2" fill={isPowered ? "#065F46" : "#7F1D1D"} />
      <text x="79" y="65" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">{isPowered ? "CLOSED" : "OPEN"}</text>
    </svg>
  </div>
);

// 3D 24V DC Dual Battery Bank Visual
const BatteryBankVisual = ({ percentage = 99.2, voltage = '27.4 V' }) => (
  <div className="acms-tank-preview-box">
    <svg width="125" height="88" viewBox="0 0 125 88" fill="none">
      <defs>
        <linearGradient id="batteryBodyGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      {/* Battery 1 (Left 12V AGM) */}
      <rect x="14" y="26" width="44" height="48" rx="3" fill="url(#batteryBodyGrad)" stroke="#475569" strokeWidth="1.2" />
      {/* Terminals */}
      <rect x="20" y="18" width="9" height="9" rx="1.5" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
      <text x="24" y="25" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">+</text>
      <rect x="41" y="18" width="9" height="9" rx="1.5" fill="#0F172A" stroke="#475569" strokeWidth="1" />
      <text x="45" y="25" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">-</text>
      <text x="36" y="47" fill="#94A3B8" fontSize="7" fontWeight="bold" textAnchor="middle">12V 100Ah</text>
      <text x="36" y="58" fill="#10B981" fontSize="6.5" textAnchor="middle">AGM CELL 1</text>

      {/* Battery 2 (Right 12V AGM) */}
      <rect x="67" y="26" width="44" height="48" rx="3" fill="url(#batteryBodyGrad)" stroke="#475569" strokeWidth="1.2" />
      {/* Terminals */}
      <rect x="73" y="18" width="9" height="9" rx="1.5" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
      <text x="77" y="25" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">+</text>
      <rect x="94" y="18" width="9" height="9" rx="1.5" fill="#0F172A" stroke="#475569" strokeWidth="1" />
      <text x="98" y="25" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">-</text>
      <text x="89" y="47" fill="#94A3B8" fontSize="7" fontWeight="bold" textAnchor="middle">12V 100Ah</text>
      <text x="89" y="58" fill="#10B981" fontSize="6.5" textAnchor="middle">AGM CELL 2</text>

      {/* Series Jumper Cable Between Batteries (24V Bus) */}
      <path d="M45 18 C 45 8, 77 8, 77 18" stroke="#F59E0B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 24V Output Label Tag */}
      <rect x="44" y="66" width="38" height="14" rx="2" fill="#070D18" stroke="#10B981" strokeWidth="0.8" />
      <text x="63" y="76" fill="#10B981" fontSize="7.5" fontWeight="bold" textAnchor="middle">{voltage}</text>
    </svg>
  </div>
);

// 3D Addressable Fire Alarm Control Panel (FACP) Visual
const FacpLargeVisual = ({ isOnline = true }) => (
  <div className="acms-tank-preview-box">
    <svg width="125" height="96" viewBox="0 0 125 96" fill="none">
      <defs>
        <linearGradient id="facpShellGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#991B1B" />
          <stop offset="60%" stopColor="#B91C1C" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>
      </defs>
      {/* Enclosure */}
      <rect x="25" y="8" width="75" height="80" rx="4" fill="url(#facpShellGrad)" stroke="#EF4444" strokeWidth="1.5" />
      {/* Main LCD Screen */}
      <rect x="30" y="14" width="65" height="28" rx="2" fill="#070D18" stroke="#334155" strokeWidth="1" />
      <rect x="34" y="18" width="57" height="20" rx="1.5" fill="#064E3B" stroke="#047857" strokeWidth="0.8" />
      <text x="62" y="27" fill="#A7F3D0" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="monospace">FIRE ALARM SYSTEM</text>
      <text x="62" y="35" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">NORMAL</text>
      {/* Status LEDs */}
      <circle cx="35" cy="50" r="2.5" fill={isOnline ? "#10B981" : "#475569"} />
      <text x="40" y="52" fill="#E2E8F0" fontSize="5.5">POWER</text>
      <circle cx="35" cy="59" r="2.5" fill="#EF4444" opacity="0.3" />
      <text x="40" y="61" fill="#94A3B8" fontSize="5.5">ALARM</text>
      <circle cx="35" cy="68" r="2.5" fill="#F59E0B" opacity="0.3" />
      <text x="40" y="70" fill="#94A3B8" fontSize="5.5">TROUBLE</text>
      {/* Keypad Buttons */}
      <rect x="67" y="47" width="24" height="25" rx="2" fill="#0B1220" stroke="#334155" strokeWidth="0.8" />
      <circle cx="73" cy="53" r="2" fill="#475569" />
      <circle cx="79" cy="53" r="2" fill="#475569" />
      <circle cx="85" cy="53" r="2" fill="#475569" />
      <circle cx="73" cy="60" r="2" fill="#475569" />
      <circle cx="79" cy="60" r="2" fill="#475569" />
      <circle cx="85" cy="60" r="2" fill="#475569" />
      <circle cx="79" cy="67" r="2" fill="#EF4444" />
      {/* Panel Tag */}
      <rect x="36" y="76" width="53" height="9" rx="1.5" fill="#070D18" stroke="#334155" strokeWidth="0.6" />
      <text x="62" y="83" fill="#94A3B8" fontSize="5.5" fontWeight="bold" textAnchor="middle">MAIN FACP - GF</text>
    </svg>
  </div>
);

// 3D Red Horizontal Sprinkler Pump Visual
const SprinklerPumpLargeVisual = ({ isRunning = false }) => (
  <div className="acms-tank-preview-box">
    <svg width="125" height="96" viewBox="0 0 125 96" fill="none">
      <defs>
        <linearGradient id="spkPumpRedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
      </defs>
      {/* Foundation Base Skid */}
      <rect x="10" y="72" width="105" height="12" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
      {/* Motor with Cooling Fins */}
      <rect x="52" y="26" width="58" height="46" rx="4" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.5" />
      <line x1="60" y1="27" x2="60" y2="71" stroke="#991B1B" strokeWidth="2.5" />
      <line x1="70" y1="27" x2="70" y2="71" stroke="#991B1B" strokeWidth="2.5" />
      <line x1="80" y1="27" x2="80" y2="71" stroke="#991B1B" strokeWidth="2.5" />
      <line x1="90" y1="27" x2="90" y2="71" stroke="#991B1B" strokeWidth="2.5" />
      <line x1="100" y1="27" x2="100" y2="71" stroke="#991B1B" strokeWidth="2.5" />
      {/* Terminal Box */}
      <rect x="72" y="17" width="20" height="9" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="1" />
      {/* Volute Casing */}
      <circle cx="32" cy="49" r="23" fill="url(#spkPumpRedGrad)" stroke="#7F1D1D" strokeWidth="2" />
      {/* Centered Impeller */}
      <g className={isRunning ? "scada-spin" : ""} style={{ transformOrigin: '32px 49px', transformBox: 'view-box' }}>
        <circle cx="32" cy="49" r="8.5" fill="#FEE2E2" />
        <line x1="32" y1="32" x2="32" y2="66" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <line x1="15" y1="49" x2="49" y2="49" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="32" cy="49" r="4.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
    </svg>
  </div>
);

// 3D Industrial Pressurization Centrifugal Blower Visual
const PressurizationBlowerLargeVisual = ({ isRunning = false, fanCategory = 'Staircase Exit' }) => (
  <div className="acms-tank-preview-box">
    <svg width="130" height="96" viewBox="0 0 130 96" fill="none">
      <defs>
        <linearGradient id="blowerGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="50%" stopColor="#0369A1" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </linearGradient>
        <linearGradient id="motorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      {/* Foundation Base with Spring Vibration Isolators */}
      <rect x="10" y="74" width="110" height="10" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
      {/* Springs */}
      <circle cx="25" cy="74" r="4" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
      <circle cx="105" cy="74" r="4" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
      {/* Motor Housing with Cooling Fins */}
      <rect x="68" y="32" width="46" height="38" rx="3" fill="url(#motorGrad)" stroke="#475569" strokeWidth="1.2" />
      <line x1="75" y1="33" x2="75" y2="69" stroke="#1E293B" strokeWidth="2" />
      <line x1="82" y1="33" x2="82" y2="69" stroke="#1E293B" strokeWidth="2" />
      <line x1="89" y1="33" x2="89" y2="69" stroke="#1E293B" strokeWidth="2" />
      <line x1="96" y1="33" x2="96" y2="69" stroke="#1E293B" strokeWidth="2" />
      <line x1="103" y1="33" x2="103" y2="69" stroke="#1E293B" strokeWidth="2" />
      {/* Terminal Box */}
      <rect x="80" y="24" width="18" height="9" rx="1.5" fill="#070D18" stroke="#06C7F5" strokeWidth="0.8" />
      <text x="89" y="31" fill="#38BDF8" fontSize="5.5" fontWeight="bold" textAnchor="middle">415V</text>
      {/* Scroll Volute Casing */}
      <path d="M42 16 L64 16 L64 48 C 64 64, 48 70, 36 70 C 20 70, 12 56, 12 42 C 12 26, 26 16, 42 16 Z" fill="url(#blowerGrad)" stroke="#38BDF8" strokeWidth="1.5" />
      {/* Discharge Duct Flange */}
      <rect x="58" y="10" width="12" height="12" rx="1.5" fill="#0369A1" stroke="#38BDF8" strokeWidth="1" />
      {/* Dynamic Airflow Wave from Discharge */}
      {isRunning && (
        <g>
          <path d="M72 16 L92 16" stroke="#06C7F5" strokeWidth="2" strokeDasharray="4 3" className="scada-airflow-flow" />
          <path d="M72 20 L86 20" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" className="scada-airflow-flow" />
        </g>
      )}
      {/* Centered Spinning Impeller */}
      <g className={isRunning ? "scada-spin" : ""} style={{ transformOrigin: '36px 44px', transformBox: 'view-box' }}>
        <circle cx="36" cy="44" r="16" fill="#082F49" stroke="#0284C7" strokeWidth="1.2" />
        <circle cx="36" cy="44" r="6" fill="#38BDF8" />
        <line x1="36" y1="30" x2="36" y2="58" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="44" x2="50" y2="44" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="26" y1="34" x2="46" y2="54" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="54" x2="46" y2="34" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle cx="36" cy="44" r="3.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
    </svg>
  </div>
);

// Mock history
const generateMockHistory = (baseValue) => {
  const data = [];
  let current = baseValue;
  for (let i = 24; i >= 0; i--) {
    const time = new Date(Date.now() - i * 3600 * 1000);
    current = Math.max(0, current + (Math.random() * 0.4 - 0.2));
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: parseFloat(current.toFixed(2))
    });
  }
  return data;
};

// =========================================================
// MAIN ACMS OVERVIEW COMPONENT
// =========================================================
const FireOverview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── (a) System Status (Clause 3.a) ──
  const [systemHealth] = useState({
    status: 'HEALTHY',
    activeEquipment: '3 / 6',
    sensorsOnline: '9 / 9',
    activeAlarms: 0,
    notificationSummary: 'Occupier, Installer & Service-provider Supervised'
  });

  // ── Interactive Hydrant 3-Column Navigation & Real-Time Simulation State ──
  const [selectedHydrantItem, setSelectedHydrantItem] = useState(1);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [livePressure, setLivePressure] = useState(7.52);
  const [liveFlow, setLiveFlow] = useState(2850);
  const [liveTankL, setLiveTankL] = useState(440);
  const [isBuildingExpanded, setIsBuildingExpanded] = useState(false);
  const [showInlineScheme, setShowInlineScheme] = useState(false);
  const [expandedTab, setExpandedTab] = useState(null);
  const [expandedFloorSelect, setExpandedFloorSelect] = useState('5F');
  const [expandedEquipSelect, setExpandedEquipSelect] = useState(1);
  const [expandedTankSelect, setExpandedTankSelect] = useState('ug');
  const [expandedDetectionLoop, setExpandedDetectionLoop] = useState(1);
  const [expandedPaZone, setExpandedPaZone] = useState(1);
  const [expandedPressShaft, setExpandedPressShaft] = useState('stair');

  // ── Voice Synthesis & SCADA Audio Announcement System ──
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [voiceAnnouncementText, setVoiceAnnouncementText] = useState('');

  const triggerVoiceAnnouncement = (text, tone = 'on') => {
    try {
      if (typeof window !== 'undefined') {
        setIsVoiceSpeaking(true);
        setVoiceAnnouncementText(text);

        // 1. Dual-tone industrial chime via Web Audio API
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          if (tone === 'on') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.14);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
          } else if (tone === 'alarm') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
          } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(440, ctx.currentTime + 0.14);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
          }
        }

        // 2. Synthesize clear speech
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;
          utterance.pitch = 1.05;
          utterance.volume = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('David')));
          if (preferredVoice) utterance.voice = preferredVoice;

          utterance.onend = () => setIsVoiceSpeaking(false);
          utterance.onerror = () => setIsVoiceSpeaking(false);

          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 200);
        } else {
          setTimeout(() => setIsVoiceSpeaking(false), 2500);
        }
      }
    } catch (err) {
      console.warn('Voice announcement error:', err);
      setIsVoiceSpeaking(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      // Subtle realistic safe-range drift
      setLivePressure(prev => +(7.52 + Math.sin(Date.now() / 3200) * 0.05).toFixed(2));
      setLiveFlow(prev => Math.round(2850 + Math.sin(Date.now() / 2500) * 12));
      setLiveTankL(prev => Math.round(440 + Math.sin(Date.now() / 6000) * 1));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // ── (b) Hydrant Subsystem (9 Explicit Clauses from paper) ──
  const [hydrantItems, setHydrantItems] = useState({
    mainPump: {
      clause: 'Clause (i)',
      title: 'Main Hydrant Pump run status',
      runStatus: 'RUNNING',
      powerStatus: 'POWER ON',
      flowOutput: '2850 LPM (1480 RPM)',
      currentDraw: '64.2 A (55 kW)'
    },
    standbyPump: {
      clause: 'Clause (ii)',
      title: 'Standby Diesel/Electrical Pump run status',
      runStatus: 'STANDBY AUTO',
      powerStatus: 'POWER ON',
      crankingBattery: '24.8 V DC (Dual Cranking Battery Bank)',
      engineOilTemp: '4.2 bar • 62 °C'
    },
    dieselTank: {
      clause: 'Clause (iii)',
      title: 'Diesel tank level Monitoring',
      fuelLevel: '440 L / 500 L',
      percentage: 88,
      projectedRuntime: '18.5 Hours Continuous',
      lowLevelStatus: 'NORMAL (Threshold: < 30%)'
    },
    powerMainPump: {
      clause: 'Clause (iv)',
      title: 'Power to Main Hydrant Pump (On / Off)',
      powerStatus: 'POWER ON',
      gridFeed: 'Primary Grid Feeder #1 (415V 3-Phase)',
      phaseBalance: 'R: 415V | Y: 414V | B: 415V',
      breakerState: 'CLOSED / ENERGIZED'
    },
    riserPressure: {
      clause: 'Clause (v)',
      title: 'Hydrant riser low pressure monitoring',
      currentPressure: '7.52 kg/cm²',
      currentPressureNum: 7.52,
      cutInLimit: '6 kg/cm² (Auto-Trigger)',
      cutOutLimit: '8.5 kg/cm²'
    },
    jockeyPump: {
      clause: 'Clause (vi)',
      title: 'Jockey Pump run status',
      runStatus: 'STANDBY AUTO',
      powerStatus: 'POWER ON',
      startsToday: '2 Cycles',
      totalRunTime: '8 mins (7.5 kW)'
    },
    powerJockeyPump: {
      clause: 'Clause (vii)',
      title: 'Power to Jockey Pump (On / Off)',
      powerStatus: 'POWER ON',
      feederBreaker: 'Dedicated 32A MCB Feeder Supervised',
      operatingVoltage: '415.5 V (3-Phase Balanced)',
      breakerState: 'CLOSED / ENERGIZED'
    },
    boosterPump: {
      clause: 'Clause (viii)',
      title: 'Booster pump run status',
      runStatus: 'STANDBY AUTO',
      powerStatus: 'POWER ON',
      motorRating: '11.0 kW (Rooftop Delivery)',
      roofHeadPressure: '3.85 kg/cm² (Nominal)'
    },
    powerBoosterPump: {
      clause: 'Clause (ix)',
      title: 'Power to Main Booster Pump (On / Off)',
      powerStatus: 'POWER ON',
      feederDb: 'Roof Feeder Distribution Board #2',
      operatingVoltage: '414.9 V',
      breakerState: 'CLOSED / ENERGIZED'
    }
  });

  // ── (c) Fire Water Tanks (2 Clauses from paper) ──
  const [tankItems, setTankItems] = useState({
    ugTank: {
      clause: 'Clause (i)',
      title: 'Underground / Above ground Fire Tank Level Monitoring',
      tankType: 'Underground (UG) Concrete Fire Sump (300 kL)',
      currentKl: '265.5 kL',
      capacityKl: '300.0 kL',
      percentage: 88.5,
      waterDepth: '3.54 m (Max: 4.0 m)',
      minReserve: '200 kL Required',
      lowLevelAlarm: 'NORMAL (No Alarm)',
      autoMakeUp: 'AUTO-READY (Closed)'
    },
    ohtTank: {
      clause: 'Clause (ii)',
      title: 'Overhead Tank Low Level Monitoring',
      tankType: 'Overhead (OHT) Rooftop Fire Tank (50 kL)',
      currentKl: '46.0 kL',
      capacityKl: '50.0 kL',
      percentage: 92.0,
      waterDepth: '2.30 m (Max: 2.5 m)',
      minReserve: '35 kL Required',
      lowLevelAlarm: 'NORMAL (No Alarm)',
      staticHead: '3.85 kg/cm² (Gravity)'
    }
  });

  // ── (d) Sprinkler (3 Clauses from paper) ──
  const [sprinklerItems, setSprinklerItems] = useState({
    mainPump: {
      clause: 'Clause (i)',
      title: 'Main sprinkler Pump run status',
      runStatus: 'STANDBY AUTO',
      powerStatus: 'POWER ON',
      rating: '45.0 kW (75 HP • 58.6 A)',
      flowRate: '2280 LPM @ 9.4 kg/cm²',
      rpm: '1480 RPM'
    },
    powerMainPump: {
      clause: 'Clause (ii)',
      title: 'Power to main sprinkler pump (On / Off)',
      powerStatus: 'POWER ON',
      feed: 'Main LT Panel Fire Feeder #2',
      voltage: '414.8 V (3-Phase Balanced)',
      breakerState: 'CLOSED / ENERGIZED'
    },
    riserPressure: {
      clause: 'Clause (iii)',
      title: 'Sprinkler riser low pressure monitoring',
      currentPressure: '9.41 kg/cm²',
      currentPressureNum: 9.41,
      cutInLimit: '7.50 kg/cm² (Auto-Trigger)',
      cutOutLimit: '10.50 kg/cm²',
      sensorHealth: 'Supervised PT-SPK-01'
    }
  });

  // ── (e) Detection System (3 Clauses from paper) ──
  const [detectionItems, setDetectionItems] = useState({
    panelOperation: {
      clause: 'Clause (i)',
      title: 'Detection operation status (On / Off) (Fire panel status)',
      operationStatus: 'ON',
      systemHealth: 'NORMAL (0 Active Fires)',
      panelType: 'Addressable Multi-Loop FACP',
      monitoredPoints: '1016 Addressable Units',
      healthyLoops: '8 / 8 Active Loops'
    },
    repeaterPanels: {
      clause: 'Clause (ii)',
      title: 'Control Panel / Repeater Panel status (working / non-working)',
      panels: [
        { name: 'Ground Floor Security Control Room', status: 'WORKING', comms: 'RS-485 Optical' },
        { name: 'Main Lobby Entrance Area Panel', status: 'WORKING', comms: 'RS-485 Dual Bus' },
        { name: 'BMS Central Master Station', status: 'WORKING', comms: 'BACnet / IP Gateway' }
      ]
    },
    batteryStatus: {
      clause: 'Clause (iii)',
      title: 'Battery of Control Panel status (Healthy / Low, Voltage)',
      batteryHealth: 'HEALTHY',
      floatVoltage: '27.4 V DC (24V System)',
      mainsAcStatus: 'MAINS 230V AC ONLINE',
      autonomy: '24h Standby + 30m Full Alarm',
      percentage: 99.2
    }
  });

  // ── (f) Manual Call Points (Clause from paper: Manual Call Point operating Status (On / Off) (Normal / Triggered)) ──
  const [mcpFilter, setMcpFilter] = useState('all');
  const [mcpList, setMcpList] = useState([
    { id: 'MCP-B2-01', zone: 'basement', location: 'Basement B2 Exit Staircase A', status: 'NORMAL', operationStatus: 'ON', lastTest: 'Yesterday' },
    { id: 'MCP-B2-02', zone: 'basement', location: 'Basement B2 Pump Room Entry', status: 'NORMAL', operationStatus: 'ON', lastTest: 'Yesterday' },
    { id: 'MCP-B1-01', zone: 'basement', location: 'Basement B1 Exit Staircase B', status: 'NORMAL', operationStatus: 'ON', lastTest: '2 days ago' },
    { id: 'MCP-GF-01', zone: 'podium', location: 'Ground Floor Main Lobby Exit', status: 'NORMAL', operationStatus: 'ON', lastTest: 'Today' },
    { id: 'MCP-01-01', zone: 'tower', location: 'Floor 1 Lift Lobby East Exit', status: 'NORMAL', operationStatus: 'ON', lastTest: '3 days ago' },
    { id: 'MCP-02-01', zone: 'tower', location: 'Floor 2 Cafeteria Exit Route', status: 'NORMAL', operationStatus: 'ON', lastTest: '3 days ago' },
    { id: 'MCP-05-01', zone: 'tower', location: 'Floor 5 Server Room Exit', status: 'NORMAL', operationStatus: 'ON', lastTest: '4 days ago' },
    { id: 'MCP-RF-01', zone: 'tower', location: 'Rooftop Terrace Exit Door', status: 'NORMAL', operationStatus: 'ON', lastTest: '5 days ago' }
  ]);

  // ── (g) Public Address System (Clause from paper: Public Address System status (working / non-working) in 4 zones with mic / amp) ──
  const [paItems, setPaItems] = useState({
    systemStatus: 'WORKING',
    controllerStatus: 'WORKING (Auto Voice Evac Ready)',
    emergencyMic: 'WORKING (Connected & Supervised)',
    amplifiers: [
      { id: 'AMP-1', model: '500W Class-D Primary', status: 'WORKING', load: '320 W', temp: '42 °C' },
      { id: 'AMP-2', model: '500W Class-D Primary', status: 'WORKING', load: '280 W', temp: '39 °C' },
      { id: 'AMP-3', model: '500W Class-D Primary', status: 'WORKING', load: '310 W', temp: '41 °C' },
      { id: 'AMP-4', model: '500W Hot-Standby Unit', status: 'WORKING', load: '0 W (Auto-Swap Ready)', temp: '28 °C' }
    ],
    zones: [
      { name: 'Zone 1: Basement Parking B1 & B2', status: 'WORKING (45 Monitored Speakers)' },
      { name: 'Zone 2: Ground Floor & Podiums', status: 'WORKING (38 Monitored Speakers)' },
      { name: 'Zone 3: Tower Floors 1–6', status: 'WORKING (92 Monitored Speakers)' },
      { name: 'Zone 4: Tower Floors 7–12 & Rooftop', status: 'WORKING (88 Monitored Speakers)' }
    ]
  });

  // ── (h) Air Pressurization (Clause from paper: Air Pressurization Fan run status for all exits / lift lobbies / hoistways (Run / Off)) ──
  const [pressurizationFans, setPressurizationFans] = useState([
    { id: 'SPF-01', category: 'Staircase Exit', title: 'Staircase A Pressurization Fan', location: 'Staircase A Core', runStatus: 'STANDBY AUTO', powerStatus: 'POWER ON', deltaP: '50.2 Pa (Target: 50 Pa)', flowRate: '25,000 CFM', powerKw: '18.5 kW' },
    { id: 'SPF-02', category: 'Staircase Exit', title: 'Staircase B Pressurization Fan', location: 'Staircase B Core', runStatus: 'STANDBY AUTO', powerStatus: 'POWER ON', deltaP: '49.8 Pa (Target: 50 Pa)', flowRate: '25,000 CFM', powerKw: '18.5 kW' },
    { id: 'LPF-01', category: 'Lift Lobby', title: 'Firemen Lift Lobby A Fan', location: 'Lift Lobby Core A', runStatus: 'STANDBY AUTO', powerStatus: 'POWER ON', deltaP: '28.5 Pa (Target: 25–30 Pa)', flowRate: '18,500 CFM', powerKw: '15.0 kW' },
    { id: 'LPF-02', category: 'Lift Lobby', title: 'Firemen Lift Lobby B Fan', location: 'Lift Lobby Core B', runStatus: 'STANDBY AUTO', powerStatus: 'POWER ON', deltaP: '29.1 Pa (Target: 25–30 Pa)', flowRate: '18,500 CFM', powerKw: '15.0 kW' },
    { id: 'HPF-01', category: 'Hoistway', title: 'Lift Hoistway Pressurization Fan', location: 'Elevator Hoistway Top', runStatus: 'STANDBY AUTO', powerStatus: 'POWER ON', deltaP: '48.2 Pa (Target: 50 Pa)', flowRate: '15,000 CFM', powerKw: '11.0 kW' }
  ]);

  // Modal Graph State
  const [hydrantHistory] = useState(() => generateMockHistory(7.52));
  const [sprinklerHistory] = useState(() => generateMockHistory(9.41));
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [graphConfig, setGraphConfig] = useState({ title: '', color: '#EF3340', data: [] });
  const [isPaTesting, setIsPaTesting] = useState(false);
  const [selectedMcpFloor, setSelectedMcpFloor] = useState(null);
  const [selectedPressurizationFanId, setSelectedPressurizationFanId] = useState('SPF-01');
  const [isEmergencyPressurizing, setIsEmergencyPressurizing] = useState(false);

  const openPressureGraph = (type) => {
    if (type === 'sprinkler') {
      setGraphConfig({
        title: 'Sprinkler Riser Header Pressure Trend (24 Hours)',
        color: '#06C7F5',
        data: sprinklerHistory,
        unit: 'kg/cm²'
      });
    } else {
      setGraphConfig({
        title: 'Hydrant Riser Line Pressure Trend (24 Hours)',
        color: '#EF3340',
        data: hydrantHistory,
        unit: 'kg/cm²'
      });
    }
    setShowGraphModal(true);
  };

  // Navigation tabs matching the exact clause structure of the paper
  const navigationTabs = [
    { key: 'overview', label: 'System Overview', count: null, icon: Layers, theme: 'default' },
    { key: 'hydrant', label: ' Hydrant System', count: '9 Items', icon: Flame, theme: 'red' },
    { key: 'tanks', label: 'Fire Water Tanks', count: '2 Items', icon: Droplets, theme: 'blue' },
    { key: 'sprinkler', label: ' Sprinkler', count: '3 Items', icon: Gauge, theme: 'cyan' },
    { key: 'detection', label: ' Detection System', count: '3 Items', icon: ShieldAlert, theme: 'red' },
    { key: 'mcp', label: ' Manual Call Points (MCP)', count: null, icon: Radio, theme: 'red' },
    { key: 'pa', label: ' Public Address System (PA)', count: null, icon: Volume2, theme: 'purple' },
    { key: 'pressurization', label: ' Air Pressurization', count: null, icon: Wind, theme: 'cyan' }
  ];

  return (
    <div className="acms-main p-3 p-md-4">

      {/* ── STICKY TOP NAVIGATION STRIP ── */}
      <div className="acms-nav-container mb-3">
        <div className="acms-tabs-bar">
          {navigationTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`acms-tab-btn ${isActive ? `active ${tab.theme}` : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <Icon size={14} className="flex-shrink-0" />
                <span>{tab.label}</span>
                {tab.count && <span className="item-count-badge">{tab.count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB CONTENT RENDERING ── */}
      <AnimatePresence mode="wait">
        {/* ========================================================
            TAB 1: SYSTEM OVERVIEW (COCKPIT & CLAUSE 3.a SPECIFICATION)
            ======================================================== */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {/* ── 8 KPI Top Summary Tiles (Single Line Compact Row) ── */}
            <div className="acms-overview-tiles-row">
              {/* Tile 1: System Health */}
              <div className="acms-ov-tile" role="button" onClick={() => handleTabChange('overview')} title="System Health">
                <div className="acms-ov-tile-top">
                  <span className="acms-ov-tile-label">System Health</span>
                  <span className="acms-ov-tile-icon" style={{ color: '#10B981' }}><Activity size={15} /></span>
                </div>
                <div className="acms-ov-tile-bottom">
                  <div className="acms-ov-tile-val" style={{ color: '#10B981' }}>
                    99.4<span className="acms-ov-tile-unit">%</span>
                  </div>
                  <span className="acms-ov-tile-badge green">NORMAL</span>
                </div>
              </div>

              {/* Tile 2: Hydrant Riser */}
              <div className="acms-ov-tile" role="button" onClick={() => handleTabChange('hydrant')} title="Click to open Hydrant Subsystem">
                <div className="acms-ov-tile-top">
                  <span className="acms-ov-tile-label">Hydrant Riser</span>
                  <span className="acms-ov-tile-icon" style={{ color: '#06C7F5' }}><Gauge size={15} /></span>
                </div>
                <div className="acms-ov-tile-bottom">
                  <div className="acms-ov-tile-val" style={{ color: '#06C7F5' }}>
                    7.2<span className="acms-ov-tile-unit">bar</span>
                  </div>
                  <span className="acms-ov-tile-badge cyan">STABLE</span>
                </div>
              </div>

              {/* Tile 3: Sprinkler Riser */}
              <div className="acms-ov-tile" role="button" onClick={() => handleTabChange('sprinkler')} title="Click to open Sprinkler Subsystem">
                <div className="acms-ov-tile-top">
                  <span className="acms-ov-tile-label">Sprinkler Riser</span>
                  <span className="acms-ov-tile-icon" style={{ color: '#38BDF8' }}><Droplets size={15} /></span>
                </div>
                <div className="acms-ov-tile-bottom">
                  <div className="acms-ov-tile-val" style={{ color: '#38BDF8' }}>
                    6.8<span className="acms-ov-tile-unit">bar</span>
                  </div>
                  <span className="acms-ov-tile-badge cyan">STABLE</span>
                </div>
              </div>

              {/* Tile 4: Main Water Tank */}
              <div className="acms-ov-tile" role="button" onClick={() => handleTabChange('tanks')} title="Click to open Water Tanks Subsystem">
                <div className="acms-ov-tile-top">
                  <span className="acms-ov-tile-label">Water Reserves</span>
                  <span className="acms-ov-tile-icon" style={{ color: '#14B8A6' }}><Database size={15} /></span>
                </div>
                <div className="acms-ov-tile-bottom">
                  <div className="acms-ov-tile-val" style={{ color: '#14B8A6' }}>
                    311.5<span className="acms-ov-tile-unit">kL</span>
                  </div>
                  <span className="acms-ov-tile-badge dark">UG + OHT</span>
                </div>
              </div>

              {/* Tile 5: Fire Panel Battery */}
              <div className="acms-ov-tile" role="button" onClick={() => handleTabChange('detection')} title="Click to open Detection & FACP Subsystem">
                <div className="acms-ov-tile-top">
                  <span className="acms-ov-tile-label">Panel Battery</span>
                  <span className="acms-ov-tile-icon" style={{ color: '#10B981' }}><Zap size={15} /></span>
                </div>
                <div className="acms-ov-tile-bottom">
                  <div className="acms-ov-tile-val">
                    27.4<span className="acms-ov-tile-unit">V</span>
                  </div>
                  <span className="acms-ov-tile-badge green">FLOAT 94%</span>
                </div>
              </div>

              {/* Tile 6: Manual Call Points */}
              <div className="acms-ov-tile" role="button" onClick={() => handleTabChange('mcp')} title="Click to open Manual Call Points Subsystem">
                <div className="acms-ov-tile-top">
                  <span className="acms-ov-tile-label">Call Points</span>
                  <span className="acms-ov-tile-icon" style={{ color: '#EF4444' }}><Flame size={15} /></span>
                </div>
                <div className="acms-ov-tile-bottom">
                  <div className="acms-ov-tile-val">
                    42<span className="acms-ov-tile-unit" style={{ fontSize: '11px', marginLeft: '3px' }}>Units</span>
                  </div>
                  <span className="acms-ov-tile-badge green">ALL ARMED</span>
                </div>
              </div>

              {/* Tile 7: Public Address (PA) */}
              <div className="acms-ov-tile" role="button" onClick={() => handleTabChange('pa')} title="Click to open Public Address Subsystem">
                <div className="acms-ov-tile-top">
                  <span className="acms-ov-tile-label">Public Address</span>
                  <span className="acms-ov-tile-icon" style={{ color: '#8B5CF6' }}><Volume2 size={15} /></span>
                </div>
                <div className="acms-ov-tile-bottom">
                  <div className="acms-ov-tile-val">
                    4<span className="acms-ov-tile-unit" style={{ fontSize: '11px', marginLeft: '3px' }}>Zones</span>
                  </div>
                  <span className="acms-ov-tile-badge green">100V LINE OK</span>
                </div>
              </div>

              {/* Tile 8: Air Pressurization */}
              <div className="acms-ov-tile" role="button" onClick={() => handleTabChange('pressurization')} title="Click to open Air Pressurization Subsystem">
                <div className="acms-ov-tile-top">
                  <span className="acms-ov-tile-label">Pressurization ΔP</span>
                  <span className="acms-ov-tile-icon" style={{ color: '#06C7F5' }}><Wind size={15} /></span>
                </div>
                <div className="acms-ov-tile-bottom">
                  <div className="acms-ov-tile-val" style={{ color: '#06C7F5' }}>
                    50.2<span className="acms-ov-tile-unit">Pa</span>
                  </div>
                  <span className="acms-ov-tile-badge cyan">5 FANS ARMED</span>
                </div>
              </div>
            </div>

            {/* ── THE 7 SUBSYSTEM EXECUTIVE SCADA COCKPITS (BENTO GRID b to h) ── */}
            <div className="acms-ov-cockpit-grid">

              {/* CARD 1: (b) Hydrant Pumping System */}
              <div className="acms-ov-cockpit-card">
                <div>
                  <div className="acms-ov-cockpit-card-header">
                    <div className="acms-ov-cockpit-card-title">
                      <Shield size={18} style={{ color: '#EF4444' }} />
                      <h6>Hydrant System</h6>
                      <span className="acms-ov-cockpit-clause">Clause 3.b</span>
                    </div>
                    <span className="acms-ov-cockpit-badge green">Standby Ready</span>
                  </div>

                  {/* Equipment Visual Deck */}
                  <div className="acms-ov-equip-deck">
                    <div className="acms-ov-equip-item">
                      <RedPumpIcon isRunning={hydrantItems.mainPump?.runStatus === 'RUNNING'} />
                      <span className="acms-ov-equip-name">Main Pump</span>
                      <span className={`acms-ov-equip-status ${hydrantItems.mainPump?.runStatus === 'RUNNING' ? 'run' : 'standby'}`}>
                        {hydrantItems.mainPump?.runStatus || 'Running'}
                      </span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <DieselEngineIcon isRunning={false} />
                      <span className="acms-ov-equip-name">Diesel Standby</span>
                      <span className="acms-ov-equip-status standby">Auto Standby</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <BlueJockeyIcon isRunning={false} />
                      <span className="acms-ov-equip-name">Jockey Pump</span>
                      <span className="acms-ov-equip-status ready">Auto Ready</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <BoosterPumpIcon isRunning={false} />
                      <span className="acms-ov-equip-name">Roof Booster</span>
                      <span className="acms-ov-equip-status standby">Standby</span>
                    </div>
                  </div>

                  {/* Metrics List */}
                  <div className="acms-ov-metrics-list">
                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Gauge size={13} style={{ color: '#EF4444' }} /> Hydrant Riser Pressure</span>
                      <span className="m-val" style={{ color: '#10B981' }}>{hydrantItems.riserPressure?.currentPressure || '7.52 kg/cm²'}</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Zap size={13} style={{ color: '#38BDF8' }} /> Main Pump Feeder Power</span>
                      <span className="m-val" style={{ color: '#38BDF8' }}>{hydrantItems.powerMainPump?.powerStatus || 'Power: ON'}</span>
                    </div>

                    <div className="acms-ov-tank-box" style={{ margin: '4px 0 0 0', padding: '8px 10px' }}>
                      <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '11px' }}>
                        <span style={{ color: '#94A3B8' }}>Diesel Fuel Tank Level</span>
                        <strong style={{ color: '#F59E0B' }}>{hydrantItems.dieselTank?.percentage || 88}% Adequate ({hydrantItems.dieselTank?.currentLiters || 880} L)</strong>
                      </div>
                      <div className="acms-ov-tank-level-bar">
                        <div className="acms-ov-tank-level-fill amber" style={{ width: `${hydrantItems.dieselTank?.percentage || 88}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="acms-ov-card-footer">
                  <button className="acms-ov-footer-btn" onClick={() => handleTabChange('hydrant')}>
                    <span>Inspect Hydrant Subsystem</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* CARD 2: (c) Fire Water Tanks */}
              <div className="acms-ov-cockpit-card">
                <div>
                  <div className="acms-ov-cockpit-card-header">
                    <div className="acms-ov-cockpit-card-title">
                      <Database size={18} style={{ color: '#38BDF8' }} />
                      <h6>Fire Water Tanks</h6>
                      <span className="acms-ov-cockpit-clause">Clause 3.c</span>
                    </div>
                    <span className="acms-ov-cockpit-badge blue">311.5 kL Reserve</span>
                  </div>

                  {/* Dual Tank Visualizer */}
                  <div className="d-flex flex-column gap-2 mb-3">
                    <div className="acms-ov-tank-box">
                      <div className="d-flex align-items-center justify-content-between">
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#FFFFFF' }}>
                          Underground Static Sump (UG)
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>
                          {tankItems.ugTank?.currentKl || '265.5 kL'} ({tankItems.ugTank?.percentage || 88.5}%)
                        </span>
                      </div>
                      <div className="acms-ov-tank-level-bar">
                        <div className="acms-ov-tank-level-fill blue" style={{ width: `${tankItems.ugTank?.percentage || 88.5}%` }}></div>
                      </div>
                      <div className="d-flex justify-content-between text-muted" style={{ fontSize: '10.5px' }}>
                        <span>Capacity: 300 kL</span>
                        <span>Ultrasonic Supervised</span>
                      </div>
                    </div>

                    <div className="acms-ov-tank-box">
                      <div className="d-flex align-items-center justify-content-between">
                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#FFFFFF' }}>
                          Terrace Overhead Tank (OHT)
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#2DD4BF', fontFamily: 'monospace' }}>
                          {tankItems.ohtTank?.currentKl || '46.0 kL'} ({tankItems.ohtTank?.percentage || 92}%)
                        </span>
                      </div>
                      <div className="acms-ov-tank-level-bar">
                        <div className="acms-ov-tank-level-fill teal" style={{ width: `${tankItems.ohtTank?.percentage || 92}%` }}></div>
                      </div>
                      <div className="d-flex justify-content-between text-muted" style={{ fontSize: '10.5px' }}>
                        <span>Capacity: 50 kL</span>
                        <span>Positive Head: 42.5m</span>
                      </div>
                    </div>
                  </div>

                  <div className="acms-ov-metric-row">
                    <span className="m-label"><ShieldCheck size={13} style={{ color: '#10B981' }} /> Water Inflow / Outflow</span>
                    <span className="m-val" style={{ color: '#10B981' }}>All Valves Sealed Open</span>
                  </div>
                </div>

                <div className="acms-ov-card-footer">
                  <button className="acms-ov-footer-btn" onClick={() => handleTabChange('tanks')}>
                    <span>Inspect Water Storage</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* CARD 3: (d) Automatic Sprinkler System */}
              <div className="acms-ov-cockpit-card">
                <div>
                  <div className="acms-ov-cockpit-card-header">
                    <div className="acms-ov-cockpit-card-title">
                      <Droplets size={18} style={{ color: '#06C7F5' }} />
                      <h6>Sprinkler System</h6>
                      <span className="acms-ov-cockpit-clause">Clause 3.d</span>
                    </div>
                    <span className="acms-ov-cockpit-badge cyan">Active Watch</span>
                  </div>

                  {/* Equipment Visual Deck */}
                  <div className="acms-ov-equip-deck">
                    <div className="acms-ov-equip-item">
                      <SprinklerPumpIcon isRunning={false} />
                      <span className="acms-ov-equip-name">Sprinkler Pump</span>
                      <span className="acms-ov-equip-status ready">Auto Ready</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <div className="acms-equip-icon-box cyan" style={{ width: '42px', height: '32px' }}>
                        <ShieldCheck size={20} style={{ color: '#10B981' }} />
                      </div>
                      <span className="acms-ov-equip-name">Alarm Check Valve</span>
                      <span className="acms-ov-equip-status run">ACV-01 Armed</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <div className="acms-equip-icon-box blue" style={{ width: '42px', height: '32px' }}>
                        <Activity size={20} style={{ color: '#38BDF8' }} />
                      </div>
                      <span className="acms-ov-equip-name">Flow Switches</span>
                      <span className="acms-ov-equip-status run">12 / 12 Supervised</span>
                    </div>
                  </div>

                  {/* Metrics List */}
                  <div className="acms-ov-metrics-list">
                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Gauge size={13} style={{ color: '#06C7F5' }} /> Sprinkler Riser Pressure</span>
                      <span className="m-val" style={{ color: '#10B981' }}>{sprinklerItems.riserLowPressure?.pressure || '7.20'} kg/cm²</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Activity size={13} style={{ color: '#F59E0B' }} /> Auto Cut-In Threshold</span>
                      <span className="m-val">{sprinklerItems.riserLowPressure?.cutInPressure || '6.0'} kg/cm²</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Zap size={13} style={{ color: '#10B981' }} /> Pump Feeder Power</span>
                      <span className="m-val" style={{ color: '#10B981' }}>{sprinklerItems.powerMainPump?.powerStatus || 'Power: ON'}</span>
                    </div>
                  </div>
                </div>

                <div className="acms-ov-card-footer">
                  <button className="acms-ov-footer-btn" onClick={() => handleTabChange('sprinkler')}>
                    <span>Inspect Sprinkler Subsystem</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* CARD 4: (e) Fire Detection & Alarm (FACP) */}
              <div className="acms-ov-cockpit-card">
                <div>
                  <div className="acms-ov-cockpit-card-header">
                    <div className="acms-ov-cockpit-card-title">
                      <ShieldAlert size={18} style={{ color: '#EF4444' }} />
                      <h6>Fire Detection &amp; Alarm</h6>
                      <span className="acms-ov-cockpit-clause">Clause 3.e</span>
                    </div>
                    <span className="acms-ov-cockpit-badge green">Supervised</span>
                  </div>

                  {/* Equipment Visual Deck */}
                  <div className="acms-ov-equip-deck">
                    <div className="acms-ov-equip-item">
                      <FacpPanelIcon />
                      <span className="acms-ov-equip-name">FACP Panel</span>
                      <span className="acms-ov-equip-status run">Active (ON)</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <div className="acms-equip-icon-box green" style={{ width: '42px', height: '32px' }}>
                        <Flame size={20} style={{ color: '#10B981' }} />
                      </div>
                      <span className="acms-ov-equip-name">Detectors</span>
                      <span className="acms-ov-equip-status run">1,106 Online</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <div className="acms-equip-icon-box purple" style={{ width: '42px', height: '32px' }}>
                        <Zap size={20} style={{ color: '#A78BFA' }} />
                      </div>
                      <span className="acms-ov-equip-name">Standby Battery</span>
                      <span className="acms-ov-equip-status run">27.4V (94%)</span>
                    </div>
                  </div>

                  {/* Metrics List */}
                  <div className="acms-ov-metrics-list">
                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Layers size={13} style={{ color: '#10B981' }} /> Signaling Line Circuits (SLC)</span>
                      <span className="m-val" style={{ color: '#10B981' }}>8 Loops Class-A OK</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Server size={13} style={{ color: '#38BDF8' }} /> Floor Repeater Mimics</span>
                      <span className="m-val">3 / 3 Online (RS-485)</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Battery size={13} style={{ color: '#10B981' }} /> 24V Standby Float Battery</span>
                      <span className="m-val" style={{ color: '#10B981' }}>27.4 V DC Float</span>
                    </div>
                  </div>
                </div>

                <div className="acms-ov-card-footer">
                  <button className="acms-ov-footer-btn" onClick={() => handleTabChange('detection')}>
                    <span>Inspect Detection &amp; FACP</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* CARD 5: (f) Manual Call Points (MCP) */}
              <div className="acms-ov-cockpit-card">
                <div>
                  <div className="acms-ov-cockpit-card-header">
                    <div className="acms-ov-cockpit-card-title">
                      <Flame size={18} style={{ color: '#EF4444' }} />
                      <h6>Manual Call Points</h6>
                      <span className="acms-ov-cockpit-clause">Clause 3.f</span>
                    </div>
                    <span className="acms-ov-cockpit-badge green">All 42 Armed</span>
                  </div>

                  {/* Equipment Visual Deck */}
                  <div className="acms-ov-equip-deck">
                    <div className="acms-ov-equip-item">
                      <McpIcon isTriggered={false} />
                      <span className="acms-ov-equip-name">Break-Glass</span>
                      <span className="acms-ov-equip-status run">42 Armed</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <div className="acms-equip-icon-box green" style={{ width: '42px', height: '32px' }}>
                        <CheckCircle2 size={20} style={{ color: '#10B981' }} />
                      </div>
                      <span className="acms-ov-equip-name">Active Pulls</span>
                      <span className="acms-ov-equip-status run">0 Pulled (OK)</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <div className="acms-equip-icon-box cyan" style={{ width: '42px', height: '32px' }}>
                        <Clock size={20} style={{ color: '#06C7F5' }} />
                      </div>
                      <span className="acms-ov-equip-name">Response Latency</span>
                      <span className="acms-ov-equip-status ready">&lt; 1.2s</span>
                    </div>
                  </div>

                  {/* Metrics List */}
                  <div className="acms-ov-metrics-list">
                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Shield size={13} style={{ color: '#EF4444' }} /> Loop Architecture</span>
                      <span className="m-val">Class-A Dual Return Ring</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Zap size={13} style={{ color: '#38BDF8' }} /> Loop Operating Voltage</span>
                      <span className="m-val">24.2 V DC Supervised</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><CheckCircle2 size={13} style={{ color: '#10B981' }} /> Emergency Trigger State</span>
                      <span className="m-val" style={{ color: '#10B981' }}>Normal (No Active Pull)</span>
                    </div>
                  </div>
                </div>

                <div className="acms-ov-card-footer">
                  <button className="acms-ov-footer-btn" onClick={() => handleTabChange('mcp')}>
                    <span>Inspect Manual Call Points</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* CARD 6: (g) Public Address System (PA) */}
              <div className="acms-ov-cockpit-card">
                <div>
                  <div className="acms-ov-cockpit-card-header">
                    <div className="acms-ov-cockpit-card-title">
                      <Volume2 size={18} style={{ color: '#8B5CF6' }} />
                      <h6>Public Address (PA)</h6>
                      <span className="acms-ov-cockpit-clause">Clause 3.g</span>
                    </div>
                    <span className="acms-ov-cockpit-badge purple">Ready &amp; Armed</span>
                  </div>

                  {/* Equipment Visual Deck */}
                  <div className="acms-ov-equip-deck">
                    <div className="acms-ov-equip-item">
                      <PaAmpIcon />
                      <span className="acms-ov-equip-name">500W RMS Amp</span>
                      <span className="acms-ov-equip-status run">4+1 Hot-Swap</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <div className="acms-equip-icon-box purple" style={{ width: '42px', height: '32px' }}>
                        <Radio size={20} style={{ color: '#A78BFA' }} />
                      </div>
                      <span className="acms-ov-equip-name">100V Line</span>
                      <span className="acms-ov-equip-status run">20 kHz Tone OK</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <div className="acms-equip-icon-box green" style={{ width: '42px', height: '32px' }}>
                        <Volume2 size={20} style={{ color: '#10B981' }} />
                      </div>
                      <span className="acms-ov-equip-name">Broadcast Zones</span>
                      <span className="acms-ov-equip-status run">4 Zones Armed</span>
                    </div>
                  </div>

                  {/* Metrics List */}
                  <div className="acms-ov-metrics-list">
                    <div className="acms-ov-metric-row">
                      <span className="m-label"><ShieldCheck size={13} style={{ color: '#EF4444' }} /> Emergency Voice Override</span>
                      <span className="m-val" style={{ color: '#10B981' }}>Priority 1 Supervised</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Activity size={13} style={{ color: '#38BDF8' }} /> Evacuation Directives</span>
                      <span className="m-val">English &amp; Hindi Chimes Ready</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Layers size={13} style={{ color: '#8B5CF6' }} /> Zone Coverage</span>
                      <span className="m-val">Ground • Podium • Tower • Basements</span>
                    </div>
                  </div>
                </div>

                <div className="acms-ov-card-footer">
                  <button className="acms-ov-footer-btn" onClick={() => handleTabChange('pa')}>
                    <span>Inspect Public Address</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* CARD 7: (h) Air Pressurization Fans */}
              <div className="acms-ov-cockpit-card">
                <div>
                  <div className="acms-ov-cockpit-card-header">
                    <div className="acms-ov-cockpit-card-title">
                      <Wind size={18} style={{ color: '#06C7F5' }} />
                      <h6>Air Pressurization Fans</h6>
                      <span className="acms-ov-cockpit-clause"></span>
                    </div>
                    <span className="acms-ov-cockpit-badge cyan">All 5 Armed</span>
                  </div>

                  {/* Equipment Visual Deck */}
                  <div className="acms-ov-equip-deck">
                    <div className="acms-ov-equip-item">
                      <PressurizationFanIcon isRunning={true} />
                      <span className="acms-ov-equip-name">5 Blower Fans</span>
                      <span className="acms-ov-equip-status run">Armed &amp; Ready</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <div className="acms-equip-icon-box cyan" style={{ width: '42px', height: '32px' }}>
                        <Gauge size={20} style={{ color: '#06C7F5' }} />
                      </div>
                      <span className="acms-ov-equip-name">Staircase ΔP</span>
                      <span className="acms-ov-equip-status run">50.2 Pa OK</span>
                    </div>

                    <div className="acms-ov-equip-item">
                      <div className="acms-equip-icon-box blue" style={{ width: '42px', height: '32px' }}>
                        <Wind size={20} style={{ color: '#38BDF8' }} />
                      </div>
                      <span className="acms-ov-equip-name">Airflow Volume</span>
                      <span className="acms-ov-equip-status ready">82,500 CFM</span>
                    </div>
                  </div>

                  {/* Metrics List */}
                  <div className="acms-ov-metrics-list">
                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Fan size={13} style={{ color: '#06C7F5' }} /> Staircase Shafts A &amp; B</span>
                      <span className="m-val" style={{ color: '#10B981' }}>50.2 Pa (Target: 50 Pa)</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Fan size={13} style={{ color: '#38BDF8' }} /> Lift Lobby Core (LPF-01/02)</span>
                      <span className="m-val">28.4 Pa (Target: 25-30 Pa)</span>
                    </div>

                    <div className="acms-ov-metric-row">
                      <span className="m-label"><Fan size={13} style={{ color: '#38BDF8' }} /> Hoistway Shaft (HPF-01)</span>
                      <span className="m-val">26.1 Pa (Target: 25-30 Pa)</span>
                    </div>
                  </div>
                </div>

                <div className="acms-ov-card-footer">
                  <button className="acms-ov-footer-btn" onClick={() => handleTabChange('pressurization')}>
                    <span>Inspect Air Pressurization</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

            </div>


          </motion.div>
        )}

        {/* ========================================================
            TAB 2: HYDRANT SUBSYSTEM (CLAUSE 3.b - 9 ITEMS)
            INTERACTIVE 3-COLUMN SCADA DASHBOARD WITH ANIMATED 2.5D BUILDING
            ======================================================== */}
        {activeTab === 'hydrant' && (
          <motion.div key="hydrant" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>

            {/* ── Hydrant System Live Status Header Banner ── */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <Activity size={18} className="text-danger" />
                <h5 className="fw-black text-white mb-0" style={{ fontSize: '15px', letterSpacing: '0.02em' }}>
                  Hydrant System Telemetry &amp; Pump Stations
                </h5>
                <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50 ms-2">
                  IS 3844:2021 / NBC Part 4 Supervised
                </span>
              </div>
            </div>

            {/* ── Clause (v): Hydrant Riser Low Pressure Master Telemetry Hero ── */}
            <div className={`acms-hydrant-hero-deck mb-4 ${(hydrantItems.riserPressure?.currentPressureNum ?? 7.52) < 6 ? 'alert-active' : ''}`}>
              <div className="row g-3 align-items-center">
                {/* Left: Metadata & Identity */}
                <div className="col-xl-4 col-lg-5 col-md-12">
                  <div className="d-flex align-items-center gap-3">
                    <RiserPressureIcon />
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="acms-hydrant-item-num" style={{ background: '#8A2BE2', color: '#fff' }}>5</span>
                        <span className={`acms-status-chip ${(hydrantItems.riserPressure?.currentPressureNum ?? 7.52) >= 6 ? 'green' : 'red'}`}>
                          <CheckCircle2 size={11} /> {(hydrantItems.riserPressure?.currentPressureNum ?? 7.52) >= 6 ? 'NORMAL (Supervised)' : 'LOW PRESSURE ALERT'}
                        </span>
                      </div>
                      <h6 className="fw-bold text-white mb-0" style={{ fontSize: '13.5px' }}>
                        {hydrantItems.riserPressure?.title || 'Hydrant riser low pressure monitoring'}
                      </h6>
                    </div>
                  </div>
                </div>

                {/* Center: Live Pressure Readout & Interactive Gauge Track */}
                <div className="col-xl-5 col-lg-4 col-md-7">
                  <div className="acms-riser-gauge-box">
                    <div className="d-flex align-items-baseline justify-content-between">
                      <div className="d-flex align-items-baseline gap-2">
                        <span className="text-secondary small fw-medium">Live Pressure:</span>
                        <span className="fs-4 fw-bold font-monospace text-cyan" style={{ letterSpacing: '-0.02em' }}>
                          {hydrantItems.riserPressure?.currentPressure || '7.52 kg/cm²'}
                        </span>
                      </div>
                      <div className="text-muted small" style={{ fontSize: '11px' }}>
                        Head: <strong className="text-white">~{((hydrantItems.riserPressure?.currentPressureNum ?? 7.52) * 10).toFixed(0)} mWC</strong>
                      </div>
                    </div>

                    {/* Industrial Gauge Track */}
                    <div className="acms-riser-bar-track">
                      {/* Cut-in Marker Tick at 6.0 kg/cm² (60% of 10 scale) */}
                      <div className="acms-riser-bar-cutin-marker" style={{ left: '60%' }}>
                        <span>▼</span>
                      </div>
                      {/* Current Pressure Pin */}
                      <div
                        className="acms-riser-bar-pin"
                        style={{
                          left: `${Math.min(100, Math.max(0, ((hydrantItems.riserPressure?.currentPressureNum ?? 7.52) / 10) * 100))}%`
                        }}
                      />
                    </div>

                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: '9.5px', fontFamily: 'monospace' }}>
                      <span className="text-danger">0 kg/cm²</span>
                      <span className="text-warning">Cut-In: 6.0 kg/cm²</span>
                      <span className="text-success">Nominal: 7.5 - 8.5</span>
                      <span className="text-info">10 kg/cm²</span>
                    </div>
                  </div>
                </div>

                {/* Right: Technical Parameters & Simulation Trigger */}
                <div className="col-xl-3 col-lg-3 col-md-5 d-flex flex-column justify-content-center align-items-lg-end gap-2">
                  <div className="d-flex flex-column text-lg-end" style={{ fontSize: '11.5px' }}>
                    <div>
                      <span className="text-secondary">Auto Trigger Cut-In: </span>
                      <span className="font-monospace text-warning fw-bold">{hydrantItems.riserPressure?.cutInLimit || '6 kg/cm²'}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Cut-Out Limit: </span>
                      <span className="font-monospace text-info fw-bold">{hydrantItems.riserPressure?.cutOutLimit || '8.5 kg/cm²'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 4 Paired Operating Enclosures Grid (2 items per station) ── */}
            <div className="row g-3 mb-4">

              {/* ══════════════════════════════════════════════════════════════
                  STATION 1: Main Hydrant Pump & Standby Diesel/Elec
                  ══════════════════════════════════════════════════════════════ */}
              <div className="col-lg-6">
                <div className="acms-station-card border-red-glow h-100">
                  <div className="d-flex flex-column gap-3">
                    {/* Station Header */}
                    <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                      <div className="d-flex align-items-center gap-2">
                        <Flame size={16} className="text-danger" />
                        <div>
                          <div className="fw-bold text-white" style={{ fontSize: '13.5px' }}>Main &amp; Standby Pumping Station</div>
                          <div className="text-muted" style={{ fontSize: '10.5px' }}>Primary Fire Pump Room • Basement Level -1</div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-Item 1: Main Hydrant Pump (Clause i) */}
                    <div className="acms-station-subitem">
                      <div className="acms-subitem-top">
                        <div className="acms-subitem-title-group">
                          <span className="acms-hydrant-item-num" style={{ background: '#FF0055', color: '#fff' }}>1</span>
                          <RedPumpIcon isRunning={hydrantItems.mainPump?.runStatus === 'RUNNING'} />
                          <div className="acms-subitem-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                {hydrantItems.mainPump?.title || 'Main Hydrant Pump run status'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`acms-status-chip ${hydrantItems.mainPump?.runStatus === 'RUNNING' ? 'green' : 'amber'}`}>
                          <Activity size={12} className={hydrantItems.mainPump?.runStatus === 'RUNNING' ? 'acms-spin-slow' : ''} />
                          {hydrantItems.mainPump?.runStatus || 'RUNNING'}
                        </span>
                      </div>

                      {/* Telemetry 2x2 Grid */}
                      <div className="acms-telemetry-pill-grid">
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Layers size={12} /> Power Feed:</span>
                          <span className="acms-param-value highlight-green">{hydrantItems.mainPump?.powerStatus || 'POWER ON'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Droplets size={12} /> Flow Output:</span>
                          <span className="acms-param-value font-monospace highlight-cyan">{hydrantItems.mainPump?.flowOutput || '2850 LPM (1480 RPM)'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Zap size={12} /> Current Draw:</span>
                          <span className="acms-param-value font-monospace highlight-green">{hydrantItems.mainPump?.currentDraw || '64.2 A (55 kW)'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Gauge size={12} /> Discharge Head:</span>
                          <span className="acms-param-value font-monospace highlight-cyan">7.8 bar (78 mWC)</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className={`acms-station-btn ${hydrantItems.mainPump?.runStatus === 'RUNNING' ? 'active-running' : ''}`}
                          onClick={() => setHydrantItems(prev => ({
                            ...prev,
                            mainPump: { ...prev.mainPump, runStatus: prev.mainPump?.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' }
                          }))}
                        >
                          <Power size={11} /> Toggle Main Pump
                        </button>
                      </div>
                    </div>

                    {/* Sub-Item 2: Power to Main Hydrant Pump */}
                    <div className="acms-station-subitem">
                      <div className="acms-subitem-top">
                        <div className="acms-subitem-title-group">
                          <span className="acms-hydrant-item-num" style={{ background: '#FF0055', color: '#fff' }}>2</span>
                          <PowerPanelIcon />
                          <div className="acms-subitem-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                {hydrantItems.powerMainPump?.title || 'Power to Main Hydrant Pump (On / Off)'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`acms-status-chip ${hydrantItems.powerMainPump?.powerStatus === 'POWER ON' ? 'green' : 'red'}`}>
                          <Zap size={12} /> {hydrantItems.powerMainPump?.powerStatus || 'POWER ON'}
                        </span>
                      </div>

                      {/* Telemetry 2x2 Grid */}
                      <div className="acms-telemetry-pill-grid">
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Zap size={12} /> Grid Feed:</span>
                          <span className="acms-param-value highlight-cyan">{hydrantItems.powerMainPump?.gridFeed || 'Primary Grid Feeder #1'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Activity size={12} /> Phase Balance:</span>
                          <span className="acms-param-value font-monospace highlight-green">{hydrantItems.powerMainPump?.phaseBalance || 'R: 415V | Y: 414V | B: 415V'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Shield size={12} /> Breaker State:</span>
                          <span className="acms-param-value highlight-green">{hydrantItems.powerMainPump?.breakerState || 'CLOSED / ENERGIZED'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Cpu size={12} /> Line Frequency:</span>
                          <span className="acms-param-value font-monospace highlight-cyan">50.02 Hz Balanced</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className={`acms-station-btn ${hydrantItems.powerMainPump?.powerStatus === 'POWER ON' ? 'active-running' : ''}`}
                          onClick={() => setHydrantItems(prev => ({
                            ...prev,
                            powerMainPump: { ...prev.powerMainPump, powerStatus: prev.powerMainPump?.powerStatus === 'POWER ON' ? 'POWER OFF' : 'POWER ON' }
                          }))}
                        >
                          <Power size={11} /> Toggle Main Power
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  STATION 2: Diesel Tank Level & Standby Pump
                  ══════════════════════════════════════════════════════════════ */}
              <div className="col-lg-6">
                <div className="acms-station-card border-cyan-glow h-100">
                  <div className="d-flex flex-column gap-3">
                    {/* Station Header */}
                    <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                      <div className="d-flex align-items-center gap-2">
                        <Droplets size={16} className="text-info" />
                        <div>
                          <div className="fw-bold text-white" style={{ fontSize: '13.5px' }}>Diesel Reserves &amp; Main Power Substation</div>
                          <div className="text-muted" style={{ fontSize: '10.5px' }}>Fuel Reserve Enclosure &amp; Main Plant Feed</div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-Item 1: Diesel Tank Level (Clause iii) */}
                    <div className="acms-station-subitem">
                      <div className="acms-subitem-top">
                        <div className="acms-subitem-title-group">
                          <span className="acms-hydrant-item-num" style={{ background: '#00D4FF', color: '#000' }}>3</span>
                          <DieselTankIcon percentage={hydrantItems.dieselTank?.percentage ?? 88} />
                          <div className="acms-subitem-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                {hydrantItems.dieselTank?.title || 'Diesel tank level Monitoring'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`acms-status-chip ${(hydrantItems.dieselTank?.percentage ?? 88) > 30 ? 'green' : 'amber'}`}>
                          <CheckCircle2 size={12} /> {(hydrantItems.dieselTank?.percentage ?? 88) > 30 ? 'NORMAL' : 'LOW LEVEL ALARM'}
                        </span>
                      </div>

                      {/* Day Tank Progress Bar with 30% Threshold Line */}
                      <div className="px-1">
                        <div className="d-flex align-items-baseline justify-content-between mb-1">
                          <span className="text-secondary small">Day Tank Fuel Capacity:</span>
                          <div className="d-flex align-items-baseline gap-2">
                            <span className="fw-bold font-monospace text-cyan" style={{ fontSize: '13px' }}>
                              {hydrantItems.dieselTank?.fuelLevel || '440 L / 500 L'}
                            </span>
                            <span className="text-cyan small fw-bold">({hydrantItems.dieselTank?.percentage ?? 88}%)</span>
                          </div>
                        </div>
                        <div className="position-relative">
                          <div className="progress" style={{ height: '7px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${hydrantItems.dieselTank?.percentage ?? 88}%`,
                                background: (hydrantItems.dieselTank?.percentage ?? 88) > 30
                                  ? 'linear-gradient(90deg, #00D4FF, #38EF7D)'
                                  : 'linear-gradient(90deg, #EF4444, #F59E0B)'
                              }}
                            />
                          </div>
                          {/* 30% Threshold Warning Indicator */}
                          <div
                            style={{
                              position: 'absolute',
                              left: '30%',
                              top: '-3px',
                              width: '2px',
                              height: '13px',
                              background: '#EF4444',
                              opacity: 0.8
                            }}
                            title="30% Low Fuel Threshold"
                          />
                        </div>
                      </div>

                      {/* Telemetry 2x2 Grid */}
                      <div className="acms-telemetry-pill-grid">
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Activity size={12} /> Runtime Autonomy:</span>
                          <span className="acms-param-value highlight-green">{hydrantItems.dieselTank?.projectedRuntime || '18.5 Hours Continuous'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><AlertTriangle size={12} /> Low Level Status:</span>
                          <span className="acms-param-value highlight-cyan">{hydrantItems.dieselTank?.lowLevelStatus || 'NORMAL (Threshold: < 30%)'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Droplets size={12} /> Fuel Delivery:</span>
                          <span className="acms-param-value highlight-green">CIRCULATING / NORMAL</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Gauge size={12} /> Reserve Head:</span>
                          <span className="acms-param-value highlight-cyan">1.8 m Hydrostatic</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className="acms-station-btn"
                          onClick={() => setHydrantItems(prev => ({
                            ...prev,
                            dieselTank: {
                              ...prev.dieselTank,
                              percentage: prev.dieselTank?.percentage === 88 ? 24 : 88,
                              fuelLevel: prev.dieselTank?.percentage === 88 ? '120 L / 500 L' : '440 L / 500 L',
                              lowLevelStatus: prev.dieselTank?.percentage === 88 ? 'LOW LEVEL ALARM (< 30%)' : 'NORMAL (Threshold: < 30%)'
                            }
                          }))}
                        >
                          <RefreshCw size={11} /> Toggle Tank Level
                        </button>
                      </div>
                    </div>

                    {/* Sub-Item 2: Standby Diesel/Elec Pump */}
                    <div className="acms-station-subitem">
                      <div className="acms-subitem-top">
                        <div className="acms-subitem-title-group">
                          <span className="acms-hydrant-item-num" style={{ background: '#00D4FF', color: '#000' }}>4</span>
                          <DieselEngineIcon isRunning={hydrantItems.standbyPump?.runStatus === 'RUNNING'} />
                          <div className="acms-subitem-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                {hydrantItems.standbyPump?.title || 'Standby Diesel/Electrical Pump run status'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`acms-status-chip ${hydrantItems.standbyPump?.runStatus === 'RUNNING' ? 'green' : 'amber'}`}>
                          <Activity size={12} className={hydrantItems.standbyPump?.runStatus === 'RUNNING' ? 'acms-spin-slow' : ''} />
                          {hydrantItems.standbyPump?.runStatus || 'STANDBY AUTO'}
                        </span>
                      </div>

                      {/* Telemetry 2x2 Grid */}
                      <div className="acms-telemetry-pill-grid">
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Battery size={12} /> Cranking Battery:</span>
                          <span className="acms-param-value font-monospace highlight-green">{hydrantItems.standbyPump?.crankingBattery || '24.8 V DC (Dual Bank)'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Gauge size={12} /> Engine Oil &amp; Temp:</span>
                          <span className="acms-param-value font-monospace highlight-cyan">{hydrantItems.standbyPump?.engineOilTemp || '4.2 bar • 62 °C'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Layers size={12} /> Power Feed:</span>
                          <span className="acms-param-value highlight-green">{hydrantItems.standbyPump?.powerStatus || 'POWER ON'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Shield size={12} /> Fuel Solenoid:</span>
                          <span className="acms-param-value highlight-cyan">ARMED / AUTO</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className={`acms-station-btn ${hydrantItems.standbyPump?.runStatus === 'RUNNING' ? 'active-running' : ''}`}
                          onClick={() => setHydrantItems(prev => ({
                            ...prev,
                            standbyPump: { ...prev.standbyPump, runStatus: prev.standbyPump?.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' }
                          }))}
                        >
                          <Power size={11} /> Toggle Standby Pump
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  STATION 3: Jockey Pump & Power to Jockey
                  ══════════════════════════════════════════════════════════════ */}
              <div className="col-lg-6">
                <div className="acms-station-card border-purple-glow h-100">
                  <div className="d-flex flex-column gap-3">
                    {/* Station Header */}
                    <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                      <div className="d-flex align-items-center gap-2">
                        <RefreshCw size={16} style={{ color: '#BD00FF' }} />
                        <div>
                          <div className="fw-bold text-white" style={{ fontSize: '13.5px' }}>Jockey </div>
                          <div className="text-muted" style={{ fontSize: '10.5px' }}>Continuous Ring Header Pressure Maintenance</div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-Item 1: Jockey Pump (Clause vi) */}
                    <div className="acms-station-subitem">
                      <div className="acms-subitem-top">
                        <div className="acms-subitem-title-group">
                          <span className="acms-hydrant-item-num" style={{ background: '#8A2BE2', color: '#fff' }}>6</span>
                          <BlueJockeyIcon isRunning={hydrantItems.jockeyPump?.runStatus === 'RUNNING'} />
                          <div className="acms-subitem-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                {hydrantItems.jockeyPump?.title || 'Jockey Pump run status'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`acms-status-chip ${hydrantItems.jockeyPump?.runStatus === 'RUNNING' ? 'green' : 'amber'}`}>
                          <Activity size={12} className={hydrantItems.jockeyPump?.runStatus === 'RUNNING' ? 'acms-spin-slow' : ''} />
                          {hydrantItems.jockeyPump?.runStatus || 'STANDBY AUTO'}
                        </span>
                      </div>

                      {/* Telemetry 2x2 Grid */}
                      <div className="acms-telemetry-pill-grid">
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Layers size={12} /> Power Feed:</span>
                          <span className="acms-param-value highlight-purple">{hydrantItems.jockeyPump?.powerStatus || 'POWER ON'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><RefreshCw size={12} /> Daily Cycles:</span>
                          <span className="acms-param-value font-monospace highlight-green">{hydrantItems.jockeyPump?.startsToday || '2 Cycles Today'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Clock size={12} /> Total Run Time:</span>
                          <span className="acms-param-value font-monospace">{hydrantItems.jockeyPump?.totalRunTime || '8 mins (7.5 kW)'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Gauge size={12} /> Auto Cut-In:</span>
                          <span className="acms-param-value font-monospace highlight-cyan">6.8 kg/cm²</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className={`acms-station-btn ${hydrantItems.jockeyPump?.runStatus === 'RUNNING' ? 'active-running' : ''}`}
                          onClick={() => setHydrantItems(prev => ({
                            ...prev,
                            jockeyPump: { ...prev.jockeyPump, runStatus: prev.jockeyPump?.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' }
                          }))}
                        >
                          <Power size={11} /> Toggle Jockey Pump
                        </button>
                      </div>
                    </div>

                    {/* Sub-Item 2: Power to Jockey (Clause vii) */}
                    <div className="acms-station-subitem">
                      <div className="acms-subitem-top">
                        <div className="acms-subitem-title-group">
                          <span className="acms-hydrant-item-num" style={{ background: '#8A2BE2', color: '#fff' }}>7</span>
                          <McbPanelIcon />
                          <div className="acms-subitem-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                {hydrantItems.powerJockeyPump?.title || 'Power to Jockey Pump (On / Off)'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`acms-status-chip ${hydrantItems.powerJockeyPump?.powerStatus === 'POWER ON' ? 'green' : 'red'}`}>
                          <Zap size={12} /> {hydrantItems.powerJockeyPump?.powerStatus || 'POWER ON'}
                        </span>
                      </div>

                      {/* Telemetry 2x2 Grid */}
                      <div className="acms-telemetry-pill-grid">
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Shield size={12} /> Feeder Breaker:</span>
                          <span className="acms-param-value highlight-green">{hydrantItems.powerJockeyPump?.feederBreaker || 'Dedicated 32A MCB'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Zap size={12} /> Voltage:</span>
                          <span className="acms-param-value font-monospace highlight-purple">{hydrantItems.powerJockeyPump?.operatingVoltage || '415.5 V'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Layers size={12} /> Breaker State:</span>
                          <span className="acms-param-value highlight-green">{hydrantItems.powerJockeyPump?.breakerState || 'CLOSED / ENERGIZED'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Activity size={12} /> Trip Circuit:</span>
                          <span className="acms-param-value highlight-cyan">HEALTHY / SUPERVISED</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className={`acms-station-btn ${hydrantItems.powerJockeyPump?.powerStatus === 'POWER ON' ? 'active-running' : ''}`}
                          onClick={() => setHydrantItems(prev => ({
                            ...prev,
                            powerJockeyPump: { ...prev.powerJockeyPump, powerStatus: prev.powerJockeyPump?.powerStatus === 'POWER ON' ? 'POWER OFF' : 'POWER ON' }
                          }))}
                        >
                          <Power size={11} /> Toggle Jockey Power
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  STATION 4: Booster Pump & Power to Booster
                  ══════════════════════════════════════════════════════════════ */}
              <div className="col-lg-6">
                <div className="acms-station-card border-green-glow h-100">
                  <div className="d-flex flex-column gap-3">
                    {/* Station Header */}
                    <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                      <div className="d-flex align-items-center gap-2">
                        <Wind size={16} className="text-success" />
                        <div>
                          <div className="fw-bold text-white" style={{ fontSize: '13.5px' }}> Booster Pump</div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-Item 1: Booster Pump (Clause viii) */}
                    <div className="acms-station-subitem">
                      <div className="acms-subitem-top">
                        <div className="acms-subitem-title-group">
                          <span className="acms-hydrant-item-num" style={{ background: '#38EF7D', color: '#000' }}>8</span>
                          <BoosterPumpIcon isRunning={hydrantItems.boosterPump?.runStatus === 'RUNNING'} />
                          <div className="acms-subitem-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                {hydrantItems.boosterPump?.title || 'Booster pump run status'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`acms-status-chip ${hydrantItems.boosterPump?.runStatus === 'RUNNING' ? 'green' : 'amber'}`}>
                          <Activity size={12} className={hydrantItems.boosterPump?.runStatus === 'RUNNING' ? 'acms-spin-slow' : ''} />
                          {hydrantItems.boosterPump?.runStatus || 'STANDBY AUTO'}
                        </span>
                      </div>

                      {/* Telemetry 2x2 Grid */}
                      <div className="acms-telemetry-pill-grid">
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Layers size={12} /> Motor Rating:</span>
                          <span className="acms-param-value highlight-green">{hydrantItems.boosterPump?.motorRating || '11.0 kW High Head'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Gauge size={12} /> Roof Head:</span>
                          <span className="acms-param-value font-monospace highlight-cyan">{hydrantItems.boosterPump?.roofHeadPressure || '3.85 kg/cm²'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Zap size={12} /> Power Feed:</span>
                          <span className="acms-param-value highlight-green">{hydrantItems.boosterPump?.powerStatus || 'POWER ON'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Droplets size={12} /> Priming State:</span>
                          <span className="acms-param-value highlight-cyan">FLOODED / PRIMED</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className={`acms-station-btn ${hydrantItems.boosterPump?.runStatus === 'RUNNING' ? 'active-running' : ''}`}
                          onClick={() => setHydrantItems(prev => ({
                            ...prev,
                            boosterPump: { ...prev.boosterPump, runStatus: prev.boosterPump?.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' }
                          }))}
                        >
                          <Power size={11} /> Toggle Booster Pump
                        </button>
                      </div>
                    </div>

                    {/* Sub-Item 2: Power to Booster (Clause ix) */}
                    <div className="acms-station-subitem">
                      <div className="acms-subitem-top">
                        <div className="acms-subitem-title-group">
                          <span className="acms-hydrant-item-num" style={{ background: '#38EF7D', color: '#000' }}>9</span>
                          <RoofDbIcon />
                          <div className="acms-subitem-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                {hydrantItems.powerBoosterPump?.title || 'Power to Main Booster Pump (On / Off)'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`acms-status-chip ${hydrantItems.powerBoosterPump?.powerStatus === 'POWER ON' ? 'green' : 'red'}`}>
                          <Zap size={12} /> {hydrantItems.powerBoosterPump?.powerStatus || 'POWER ON'}
                        </span>
                      </div>

                      {/* Telemetry 2x2 Grid */}
                      <div className="acms-telemetry-pill-grid">
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Shield size={12} /> Feeder DB:</span>
                          <span className="acms-param-value highlight-cyan">{hydrantItems.powerBoosterPump?.feederDb || 'Roof Feeder DB #2'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Zap size={12} /> Voltage:</span>
                          <span className="acms-param-value font-monospace highlight-green">{hydrantItems.powerBoosterPump?.operatingVoltage || '414.9 V Balanced'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Layers size={12} /> Breaker State:</span>
                          <span className="acms-param-value highlight-green">{hydrantItems.powerBoosterPump?.breakerState || 'CLOSED / ENERGIZED'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><ShieldCheck size={12} /> Isolator Lock:</span>
                          <span className="acms-param-value highlight-cyan">PADLOCKED / ENGAGED</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className={`acms-station-btn ${hydrantItems.powerBoosterPump?.powerStatus === 'POWER ON' ? 'active-running' : ''}`}
                          onClick={() => setHydrantItems(prev => ({
                            ...prev,
                            powerBoosterPump: { ...prev.powerBoosterPump, powerStatus: prev.powerBoosterPump?.powerStatus === 'POWER ON' ? 'POWER OFF' : 'POWER ON' }
                          }))}
                        >
                          <Power size={11} /> Toggle Booster Power
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ── EXPANDED FULLSCREEN SCADA MODAL ── */}
            <Modal
              show={isBuildingExpanded}
              onHide={() => setIsBuildingExpanded(false)}
              size="xl"
              centered
              dialogClassName="acms-fullscreen-scada-modal"
              contentClassName="acms-scada-modal-content"
            >
              <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="acms-banner-icon-badge" style={{ width: '38px', height: '38px' }}>
                    <Flame size={20} />
                  </div>
                  <div>
                    <h5 className="fw-black text-white mb-0" style={{ letterSpacing: '-0.01em' }}>
                      Clause 3 (b) Hydrant Subsystem — Fullscreen SCADA Architecture & Diagnostics
                    </h5>
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>
                      Interactive 2.5D building isometric view with animated water flow, floor-by-floor hydrant points, and plant room telemetry.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="acms-supervision-pill danger">
                    <span className="acms-dot-pulse-red"></span>
                    9 / 9 ITEMS SUPERVISED
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-1 px-3"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setIsBuildingExpanded(false)}
                  >
                    <Minimize2 size={13} />
                    <span>Exit Expand View</span>
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="acms-modal-scada-layout">
                  {/* Left: Enlarged 2.5D Building Diagram */}
                  <div className="p-3 rounded" style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-white small fw-bold d-flex align-items-center gap-1.5">
                        <Droplets size={14} className="text-info" /> High-Resolution SCADA Isometric Model
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small" style={{ fontSize: '11px' }}>
                          Water Flow: <strong className={hydrantItems.mainPump.runStatus === 'RUNNING' ? 'text-cyan' : 'text-muted'}>
                            {hydrantItems.mainPump.runStatus === 'RUNNING' ? `${liveFlow} LPM` : '0 LPM'}
                          </strong>
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-0 px-2"
                          style={{ fontSize: '10px' }}
                          onClick={() => setHydrantItems(prev => ({
                            ...prev,
                            mainPump: { ...prev.mainPump, runStatus: prev.mainPump.runStatus === 'RUNNING' ? 'STOPPED' : 'RUNNING' }
                          }))}
                        >
                          Simulate {hydrantItems.mainPump.runStatus === 'RUNNING' ? 'Stop' : 'Start'}
                        </button>
                      </div>
                    </div>

                    <svg
                      viewBox="0 0 560 700"
                      width="100%"
                      height="auto"
                      style={{ maxHeight: '680px', display: 'block' }}
                      fill="none"
                    >
                      {/* Repeat the exact high-res SVG definitions and architecture for modal inspection */}
                      <defs>
                        <linearGradient id="modalIsoWallGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1B263B" />
                          <stop offset="100%" stopColor="#0D1527" />
                        </linearGradient>
                        <linearGradient id="modalIsoFloorSlabGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="50%" stopColor="#1E293B" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>
                        <linearGradient id="modalIsoRoofGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#25354F" />
                          <stop offset="100%" stopColor="#131D2F" />
                        </linearGradient>
                        <linearGradient id="modalTankWaterGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.95" />
                        </linearGradient>
                        <linearGradient id="modalUgSumpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06C7F5" stopOpacity="0.55" />
                          <stop offset="100%" stopColor="#0369A1" stopOpacity="0.95" />
                        </linearGradient>
                        <linearGradient id="modalSteelTankGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#64748B" />
                          <stop offset="40%" stopColor="#94A3B8" />
                          <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                        <linearGradient id="modalGlassBalconyGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.25)" />
                          <stop offset="100%" stopColor="rgba(2, 132, 199, 0.05)" />
                        </linearGradient>
                        <linearGradient id="modalPipeMetallicGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#EF4444" />
                          <stop offset="50%" stopColor="#B91C1C" />
                          <stop offset="100%" stopColor="#7F1D1D" />
                        </linearGradient>
                      </defs>

                      {/* Foundation Floor */}
                      <rect x="25" y="540" width="510" height="150" rx="4" fill="#070D18" stroke="#1E293B" strokeWidth="1.5" />
                      <line x1="25" y1="540" x2="535" y2="540" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                      {/* Landscaping */}
                      <polygon points="40,540 100,540 115,525 55,525" fill="#14532D" opacity="0.6" stroke="#166534" strokeWidth="1" />
                      <circle cx="65" cy="522" r="6" fill="#15803D" />
                      <circle cx="80" cy="520" r="8" fill="#16A34A" />
                      <circle cx="95" cy="523" r="6" fill="#15803D" />

                      {/* Left 3D Isometric Wall Facade */}
                      <polygon points="105,95 160,70 160,540 105,565" fill="url(#modalIsoWallGrad)" stroke="#334155" strokeWidth="1.2" />
                      {[105, 145, 185, 225, 265, 305, 345, 385, 425, 465, 505].map(wy => (
                        <line key={`mwslit-${wy}`} x1="120" y1={wy + 18} x2="145" y2={wy + 8} stroke="#38BDF8" strokeWidth="2" strokeOpacity="0.45" />
                      ))}

                      {/* Front Facade */}
                      <rect x="160" y="70" width="240" height="470" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

                      {/* Levels */}
                      {[
                        { label: 'Roof', y: 70 },
                        { label: '10F', y: 110 },
                        { label: '9F', y: 150 },
                        { label: '8F', y: 190 },
                        { label: '7F', y: 230 },
                        { label: '6F', y: 270 },
                        { label: '5F', y: 310 },
                        { label: '4F', y: 350 },
                        { label: '3F', y: 390 },
                        { label: '2F', y: 430 },
                        { label: '1F', y: 470 },
                        { label: 'Ground', y: 510 }
                      ].map((fl, idx) => (
                        <g
                          key={`mfl-${fl.label}`}
                          className={`acms-floor-row ${expandedFloorSelect === fl.label ? 'active' : ''}`}
                          onClick={() => setExpandedFloorSelect(fl.label)}
                        >
                          <rect x="162" y={fl.y + 2} width="236" height="36" fill="rgba(255,255,255,0.025)" className="floor-bg" rx="2" />
                          <polygon points={`105,${fl.y + 16} 160,${fl.y} 400,${fl.y} 345,${fl.y + 16}`} fill="url(#modalIsoFloorSlabGrad)" stroke="#334155" strokeWidth="0.8" />
                          <line x1="160" y1={fl.y} x2="400" y2={fl.y} stroke="#475569" strokeWidth="2.5" />
                          <polygon points={`400,${fl.y + 6} 435,${fl.y + 2} 435,${fl.y + 34} 400,${fl.y + 38}`} fill="url(#modalGlassBalconyGrad)" stroke="#0284C7" strokeWidth="1" />

                          {/* Floor label pill */}
                          <g className="cursor-pointer">
                            <rect
                              x="442"
                              y={fl.y + 9}
                              width="52"
                              height="20"
                              rx="4"
                              fill={expandedFloorSelect === fl.label ? "#EF3340" : "#0B1220"}
                              stroke={expandedFloorSelect === fl.label ? "#FF7B84" : "#334155"}
                              strokeWidth="1.2"
                            />
                            <text x="468" y={fl.y + 23} fill="#FFFFFF" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                              {fl.label}
                            </text>
                          </g>

                          {/* Fire Hydrant Cabinet */}
                          {idx > 0 && (
                            <g>
                              <line x1="190" y1={fl.y + 20} x2="215" y2={fl.y + 20} stroke="#EF4444" strokeWidth="3" />
                              <rect x="215" y={fl.y + 9} width="22" height="22" rx="3" fill="#B91C1C" stroke="#EF4444" strokeWidth="1.2" />
                              <circle cx="226" cy={fl.y + 20} r="7" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.2" />
                              <circle cx="226" cy={fl.y + 20} r="3" fill="#991B1B" />
                              <circle cx="233" cy={fl.y + 13} r="1.8" fill="#10B981" />
                            </g>
                          )}
                        </g>
                      ))}

                      {/* Roof Slab */}
                      <polygon points="105,95 160,70 400,70 345,95" fill="url(#modalIsoRoofGrad)" stroke="#475569" strokeWidth="1.5" />

                      {/* OH Tank */}
                      <rect x="270" y="24" width="95" height="42" rx="4" fill="#0F172A" stroke="#0284C7" strokeWidth="2" />
                      <rect x="273" y="32" width="89" height="32" rx="2" fill="url(#modalTankWaterGrad)" />
                      <path d="M273 34 Q 295 30, 317 34 T 362 34" stroke="#BAE6FD" strokeWidth="1.5" fill="none" />
                      <text x="317" y="47" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">OH TANK (50 kL)</text>
                      <text x="317" y="58" fill="#E0F2FE" fontSize="7.5" textAnchor="middle">Level: 92% (Normal)</text>

                      {/* Booster Pump */}
                      <circle cx="225" cy="48" r="11" fill={hydrantItems.boosterPump.runStatus === 'RUNNING' ? "#16B978" : "#F59E0B"} stroke="#FFFFFF" strokeWidth="1.8" />
                      <text x="225" y="52" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">BP</text>
                      <path d="M225 59 L 225 70 L 190 70" stroke="#DC2626" strokeWidth="4" fill="none" />

                      {/* Main Riser Pipe */}
                      <line x1="190" y1="68" x2="190" y2="550" stroke="url(#modalPipeMetallicGrad)" strokeWidth="9" strokeLinecap="round" />
                      <line
                        x1="190"
                        y1="68"
                        x2="190"
                        y2="550"
                        stroke="#06C7F5"
                        strokeWidth="4"
                        className={hydrantItems.mainPump.runStatus === 'RUNNING' ? "water-flow-active" : "water-flow-inactive"}
                      />

                      {/* Pressure Sensor Callout */}
                      <g transform="translate(45, 290)">
                        <rect x="0" y="0" width="135" height="44" rx="6" fill="#0B1220" stroke="#06C7F5" strokeWidth="1.5" />
                        <text x="10" y="14" fill="#94A3B8" fontSize="8" fontWeight="bold">Hydrant Riser Line</text>
                        <text x="10" y="28" fill="#06C7F5" fontSize="11" fontWeight="bold" fontFamily="monospace">
                          {livePressure} kg/cm²
                        </text>
                        <text x="10" y="38" fill="#10B981" fontSize="7">Cut-in: 6.0 • Cut-out: 8.5</text>
                        <circle cx="123" cy="14" r="3.5" fill="#10B981" />
                        <line x1="135" y1="22" x2="190" y2="310" stroke="#06C7F5" strokeWidth="1.2" strokeDasharray="3 2" />
                        <circle cx="190" cy="310" r="3" fill="#06C7F5" />
                      </g>

                      {/* Basement UG Tank */}
                      <g className="cursor-pointer" onClick={() => setExpandedEquipSelect(1)}>
                        <rect x="412" y="555" width="134" height="137" rx="6" fill="#0F172A" stroke="#0284C7" strokeWidth="2" />
                        <rect x="415" y="575" width="128" height="114" rx="4" fill="url(#modalUgSumpGrad)" />
                        <path d="M415 578 Q 447 572, 479 578 T 543 578 L 543 689 L 415 689 Z" fill="#06C7F5" opacity="0.3" />
                        <text x="479" y="602" fill="#FFFFFF" fontSize="10.5" fontWeight="bold" textAnchor="middle">UG FIRE TANK</text>
                        <text x="479" y="618" fill="#BAE6FD" fontSize="8.5" textAnchor="middle">(Concrete Sump)</text>
                        <rect x="424" y="628" width="110" height="22" rx="4" fill="#070D18" stroke="#0284C7" strokeWidth="1" />
                        <text x="479" y="643" fill="#38BDF8" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">265.5 kL / 300 kL</text>
                        <text x="479" y="668" fill="#6EE7B7" fontSize="8.5" fontWeight="bold" textAnchor="middle">Capacity: 88.5%</text>
                        <circle cx="534" cy="567" r="4" fill="#10B981" />
                      </g>

                      {/* Suction Pipe (Runs unobstructed above badges at y=626) */}
                      <path d="M412 626 L 65 626 L 65 595" stroke="#0284C7" strokeWidth="6" fill="none" strokeLinecap="round" />
                      <path
                        d="M412 626 L 65 626 L 65 595"
                        stroke="#38BDF8"
                        strokeWidth="2.5"
                        fill="none"
                        className={hydrantItems.mainPump.runStatus === 'RUNNING' ? "water-flow-active" : "water-flow-inactive"}
                      />

                      {/* Main Pump */}
                      <g className="cursor-pointer" onClick={() => setExpandedEquipSelect(1)}>
                        <rect x="40" y="618" width="75" height="7" rx="2" fill="#1E293B" stroke="#334155" strokeWidth="1" />
                        <rect x="76" y="572" width="36" height="46" rx="3" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1" />
                        <circle cx="65" cy="598" r="18" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
                        <g
                          className={hydrantItems.mainPump.runStatus === 'RUNNING' ? "scada-spin" : ""}
                          style={{ transformOrigin: '65px 598px', transformBox: 'view-box' }}
                        >
                          <circle cx="65" cy="598" r="7.5" fill="#FCA5A5" />
                          <line x1="65" y1="585" x2="65" y2="611" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                          <line x1="52" y1="598" x2="78" y2="598" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                        <circle cx="65" cy="598" r="3.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
                        <path d="M65 580 L 65 550 L 190 550" stroke="#DC2626" strokeWidth="7" fill="none" />
                        <rect x="20" y="650" width="90" height="44" rx="5" fill="#080E1B" stroke={expandedEquipSelect === 1 ? "#EF4444" : "#334155"} strokeWidth="1.5" />
                        <text x="65" y="665" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" textAnchor="middle">Main Hydrant Pump</text>
                        <rect x="28" y="670" width="74" height="17" rx="3" fill={hydrantItems.mainPump.runStatus === 'RUNNING' ? "#10B981" : "#EF4444"} />
                        <text x="65" y="682" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" textAnchor="middle">{hydrantItems.mainPump.runStatus}</text>
                      </g>

                      {/* Jockey Pump */}
                      <g className="cursor-pointer" onClick={() => setExpandedEquipSelect(6)}>
                        <rect x="140" y="618" width="46" height="7" rx="2" fill="#1E293B" stroke="#334155" strokeWidth="1" />
                        <circle cx="163" cy="598" r="13" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
                        <rect x="156" y="572" width="14" height="24" rx="2" fill="#0369A1" />
                        <circle cx="163" cy="598" r="4.5" fill="#38BDF8" />
                        <line x1="163" y1="572" x2="163" y2="550" stroke="#DC2626" strokeWidth="4.5" />
                        <rect x="118" y="650" width="90" height="44" rx="5" fill="#080E1B" stroke={expandedEquipSelect === 6 ? "#06C7F5" : "#334155"} strokeWidth="1.5" />
                        <text x="163" y="665" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" textAnchor="middle">Jockey Pump</text>
                        <rect x="126" y="670" width="74" height="17" rx="3" fill="#F59E0B" />
                        <text x="163" y="682" fill="#0B1220" fontSize="8.5" fontWeight="bold" textAnchor="middle">STANDBY</text>
                      </g>

                      {/* Standby Pump */}
                      <g className="cursor-pointer" onClick={() => setExpandedEquipSelect(2)}>
                        <rect x="216" y="618" width="68" height="7" rx="2" fill="#1E293B" stroke="#334155" strokeWidth="1" />
                        <circle cx="238" cy="598" r="15" fill="#D97706" stroke="#B45309" strokeWidth="2" />
                        <rect x="248" y="580" width="26" height="36" rx="3" fill="#B45309" />
                        <circle cx="238" cy="598" r="4.5" fill="#FDE68A" />
                        <line x1="260" y1="580" x2="260" y2="562" stroke="#64748B" strokeWidth="3" />
                        <path d="M238 583 L 238 550 L 190 550" stroke="#DC2626" strokeWidth="5" fill="none" />
                        <rect x="216" y="650" width="94" height="44" rx="5" fill="#080E1B" stroke={expandedEquipSelect === 2 ? "#F59E0B" : "#334155"} strokeWidth="1.5" />
                        <text x="263" y="665" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" textAnchor="middle">Standby Pump</text>
                        <rect x="223" y="670" width="80" height="17" rx="3" fill="#F59E0B" />
                        <text x="263" y="682" fill="#0B1220" fontSize="7.5" fontWeight="bold" textAnchor="middle">STANDBY AUTO</text>
                      </g>

                      {/* Diesel Tank */}
                      <g className="cursor-pointer" onClick={() => setExpandedEquipSelect(3)}>
                        <rect x="320" y="578" width="58" height="40" rx="12" fill="url(#modalSteelTankGrad)" stroke="#334155" strokeWidth="1.5" />
                        <rect x="326" y="618" width="8" height="7" fill="#1E293B" />
                        <rect x="362" y="618" width="8" height="7" fill="#1E293B" />
                        <line x1="326" y1="598" x2="372" y2="598" stroke="#06C7F5" strokeWidth="2.5" strokeDasharray="4 2" />
                        <path d="M320 606 L 274 606" stroke="#F59E0B" strokeWidth="2" strokeDasharray="2 2" fill="none" />
                        <rect x="318" y="650" width="88" height="44" rx="5" fill="#080E1B" stroke={expandedEquipSelect === 3 ? "#06C7F5" : "#334155"} strokeWidth="1.5" />
                        <text x="362" y="665" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" textAnchor="middle">Diesel Tank</text>
                        <rect x="325" y="670" width="74" height="17" rx="3" fill="#0284C7" />
                        <text x="362" y="682" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">{liveTankL} L (88%)</text>
                      </g>
                    </svg>
                  </div>

                  {/* Right: Comprehensive SCADA Diagnostic Center */}
                  <div className="d-flex flex-column gap-3">
                    {/* Floor Inspector Module */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <Layers size={14} className="text-danger" /> Floor Hydrant Diagnostics ({expandedFloorSelect})
                        </span>
                        <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '10px' }}>
                          Supervised &amp; Ready
                        </span>
                      </div>

                      <div className="acms-floor-nav-grid">
                        {['Roof', '10F', '9F', '8F', '7F', '6F', '5F', '4F', '3F', '2F', '1F', 'Ground'].map(fl => (
                          <button
                            key={`btn-${fl}`}
                            type="button"
                            className={`acms-floor-nav-btn ${expandedFloorSelect === fl ? 'active' : ''}`}
                            onClick={() => setExpandedFloorSelect(fl)}
                          >
                            {fl}
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="row g-2" style={{ fontSize: '11px' }}>
                          <div className="col-6">
                            <span className="text-muted">Floor Pressure:</span>
                            <div className="fw-bold text-cyan font-monospace">{livePressure} kg/cm²</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Landing Valve:</span>
                            <div className="fw-bold text-success">OPEN &amp; SUPERVISED</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Hose Reel Spec:</span>
                            <div className="fw-bold text-white">30m Semi-Rigid Canvas</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Water Availability:</span>
                            <div className="fw-bold text-info">ENERGIZED / AVAILABLE</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Equipment Telemetry & Clause 3(b) Compliance Checklist */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-success" /> Clause 3 (b) 9 Items Compliance Status
                        </span>
                        <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                          9 / 9 Active
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-1.5">
                        {[
                          { num: '1', title: 'Main Hydrant Pump Run Status', val: hydrantItems.mainPump.runStatus, state: 'success' },
                          { num: '2', title: 'Standby Diesel/Elec Pump Run Status', val: hydrantItems.standbyPump.runStatus, state: 'warning' },
                          { num: '3', title: 'Diesel Tank Level Monitoring', val: `${liveTankL} L (88%)`, state: 'info' },
                          { num: '4', title: 'Power to Main Hydrant Pump', val: hydrantItems.powerMainPump.powerStatus, state: 'success' },
                          { num: '5', title: 'Hydrant Riser Low Pressure Monitoring', val: `${livePressure} kg/cm² (Cut-in: 6.0)`, state: 'danger' },
                          { num: '6', title: 'Jockey Pump Run Status', val: hydrantItems.jockeyPump.runStatus, state: 'warning' },
                          { num: '7', title: 'Power to Jockey Pump', val: hydrantItems.powerJockeyPump.powerStatus, state: 'success' },
                          { num: '8', title: 'Booster Pump Run Status', val: hydrantItems.boosterPump.runStatus, state: 'success' },
                          { num: '9', title: 'Power to Main Booster Pump', val: hydrantItems.powerBoosterPump.powerStatus, state: 'success' },
                        ].map(chk => (
                          <div key={chk.num} className="d-flex align-items-center justify-content-between p-1.5 rounded" style={{ background: 'rgba(255,255,255,0.02)', fontSize: '11px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-secondary bg-opacity-25 text-white" style={{ fontSize: '9.5px', width: '18px' }}>{chk.num}</span>
                              <span className="text-white fw-medium">{chk.title}</span>
                            </div>
                            <span className={`badge bg-${chk.state} bg-opacity-25 text-${chk.state}`} style={{ fontSize: '10px' }}>
                              {chk.val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  System Health: <strong className="text-success">NORMAL</strong> • Water Reservoir Reserve: <strong className="text-cyan">265.5 kL</strong> • Operating Head: <strong className="text-white font-monospace">{livePressure} kg/cm²</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary px-3 py-1"
                  style={{ fontSize: '11.5px', borderRadius: '6px' }}
                  onClick={() => setIsBuildingExpanded(false)}
                >
                  Close Inspection
                </button>
              </div>
            </Modal>
          </motion.div>
        )}

        {/* ========================================================
            TAB 3: FIRE WATER TANKS (CLAUSE 3.c - 2 ITEMS)
            ======================================================== */}
        {activeTab === 'tanks' && (
          <motion.div key="tanks" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>

            {/* ── Fire Water Tanks Dual Reservoir Monitoring: Underground & Above Ground / Overhead ── */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <Droplets size={18} className="text-info" />
                <h5 className="fw-black text-white mb-0" style={{ fontSize: '15px', letterSpacing: '0.02em' }}>
                  Dedicated Fire Water Reservoirs & Sump Supervisory
                </h5>
              </div>
              <span className="text-muted small" style={{ fontSize: '11px' }}>
                Continuous Hydrostatic & Ultrasonic Level Tracking
              </span>
            </div>

            <div className="row g-3 mb-4">
              {/* ────────────────────────────────────────────────────────
                  LEFT COLUMN: Underground Fire Tank (UG Reservoir)
                  ──────────────────────────────────────────────────────── */}
              <div className="col-lg-6">
                <div className="acms-scada-card border-blue-glow h-100 p-3">
                  {/* Card Header */}
                  <div className="acms-card-top-row mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#00D4FF', color: '#000' }}>1</span>
                      <h5 className="acms-card-title mb-0">{tankItems.ugTank?.title || 'Underground Fire Tank Level Monitoring'}</h5>
                    </div>
                    <span className={`acms-status-chip ${(tankItems.ugTank?.lowLevelAlarm || '').includes('NORMAL') ? 'green' : 'red'}`}>
                      <CheckCircle2 size={12} /> {(tankItems.ugTank?.lowLevelAlarm || '').includes('NORMAL') ? 'NORMAL' : 'ALARM'}
                    </span>
                  </div>

                  {/* 2-Column Split: Tank Visual on Left, Information & Level on Right */}
                  <div className="row g-3 align-items-center">
                    {/* Left: 3D Tank Visual & Real-time Level */}
                    <div className="col-sm-5 d-flex flex-column align-items-center justify-content-center p-3 rounded" style={{ background: 'rgba(0, 212, 255, 0.03)', border: '1px solid rgba(0, 212, 255, 0.15)' }}>
                      <TankCylinderVisual 
                        percentage={tankItems.ugTank?.percentage ?? 88.5} 
                        capacity={300} 
                        maxVal={300}
                        color={(tankItems.ugTank?.percentage ?? 88.5) < 40 ? '#EF4444' : '#00D4FF'} 
                      />
                      <div className="mt-2 text-center w-100">
                        <div className="fw-bold font-monospace" style={{ fontSize: '15px', color: (tankItems.ugTank?.percentage ?? 88.5) < 40 ? '#EF4444' : '#00D4FF' }}>
                          {tankItems.ugTank?.currentKl || '265.5 kL'}
                        </div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          Total: {tankItems.ugTank?.capacityKl || '300.0 kL'} ({tankItems.ugTank?.percentage ?? 88.5}%)
                        </div>
                      </div>
                    </div>

                    {/* Right: Information, Level Fill Bar & Parameters */}
                    <div className="col-sm-7 d-flex flex-column justify-content-between">
                      {/* Tank Level Fill Progress Bar */}
                      <div className="p-2 mb-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div className="d-flex align-items-baseline justify-content-between mb-1">
                          <span className="text-secondary small fw-medium">Tank Level Fill:</span>
                          <span className="fw-bold font-monospace" style={{ fontSize: '13px', color: (tankItems.ugTank?.percentage ?? 88.5) < 40 ? '#EF4444' : '#00D4FF' }}>
                            {tankItems.ugTank?.percentage ?? 88.5}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: '7px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '999px' }}>
                          <div 
                            className="progress-bar" 
                            role="progressbar" 
                            style={{ 
                              width: `${tankItems.ugTank?.percentage ?? 88.5}%`,
                              background: (tankItems.ugTank?.percentage ?? 88.5) < 40 
                                ? 'linear-gradient(90deg, #EF4444, #F59E0B)' 
                                : 'linear-gradient(90deg, #00D4FF, #00E5FF)'
                            }} 
                          />
                        </div>
                      </div>

                      {/* Parameters List */}
                      <div className="acms-param-list">
                        <div className="acms-param-row py-1">
                          <span className="acms-param-label"><Activity size={13} /> Water Depth:</span>
                          <span className="acms-param-value font-monospace">{tankItems.ugTank?.waterDepth || '3.54 m (Max: 4.0 m)'}</span>
                        </div>
                        <div className="acms-param-row py-1">
                          <span className="acms-param-label"><Shield size={13} /> Minimum Reserve:</span>
                          <span className="acms-param-value highlight-green">{tankItems.ugTank?.minReserve || '200 kL Required'}</span>
                        </div>
                        <div className="acms-param-row py-1">
                          <span className="acms-param-label"><AlertTriangle size={13} /> Low Level Alarm:</span>
                          <span className={`acms-param-value ${(tankItems.ugTank?.lowLevelAlarm || '').includes('NORMAL') ? 'highlight-green' : 'highlight-red'}`}>
                            {tankItems.ugTank?.lowLevelAlarm || 'NORMAL (No Alarm)'}
                          </span>
                        </div>
                        <div className="acms-param-row py-1">
                          <span className="acms-param-label"><RefreshCw size={13} /> Auto Makeup Valve:</span>
                          <span className="acms-param-value highlight-cyan">{tankItems.ugTank?.autoMakeUp || 'AUTO-READY (Closed)'}</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end mt-2 pt-1">
                        <button
                          type="button"
                          className="acms-station-btn"
                          onClick={() => setTankItems(prev => ({
                            ...prev,
                            ugTank: {
                              ...prev.ugTank,
                              percentage: prev.ugTank?.percentage === 88.5 ? 35 : 88.5,
                              currentKl: prev.ugTank?.percentage === 88.5 ? '105.0 kL' : '265.5 kL',
                              waterDepth: prev.ugTank?.percentage === 88.5 ? '1.40 m (Low)' : '3.54 m (Max: 4.0 m)',
                              lowLevelAlarm: prev.ugTank?.percentage === 88.5 ? 'CRITICAL LOW LEVEL ALARM' : 'NORMAL (No Alarm)'
                            }
                          }))}
                        >
                          <RefreshCw size={11} /> Toggle UG Tank Level
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  RIGHT COLUMN: Overhead / Above Ground Fire Tank
                  ──────────────────────────────────────────────────────── */}
              <div className="col-lg-6">
                <div className="acms-scada-card border-blue-glow h-100 p-3">
                  {/* Card Header */}
                  <div className="acms-card-top-row mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#06C7F5', color: '#000' }}>2</span>
                      <h5 className="acms-card-title mb-0">{tankItems.ohtTank?.title || 'Overhead Tank Low Level Monitoring'}</h5>
                    </div>
                    <span className={`acms-status-chip ${(tankItems.ohtTank?.lowLevelAlarm || '').includes('NORMAL') ? 'green' : 'red'}`}>
                      <CheckCircle2 size={12} /> {(tankItems.ohtTank?.lowLevelAlarm || '').includes('NORMAL') ? 'NORMAL' : 'ALARM'}
                    </span>
                  </div>

                  {/* 2-Column Split: Tank Visual on Left, Information & Level on Right */}
                  <div className="row g-3 align-items-center">
                    {/* Left: 3D Tank Visual & Real-time Level */}
                    <div className="col-sm-5 d-flex flex-column align-items-center justify-content-center p-3 rounded" style={{ background: 'rgba(6, 199, 245, 0.03)', border: '1px solid rgba(6, 199, 245, 0.15)' }}>
                      <TankCylinderVisual 
                        percentage={tankItems.ohtTank?.percentage ?? 92.0} 
                        capacity={50} 
                        maxVal={50}
                        color={(tankItems.ohtTank?.percentage ?? 92.0) < 40 ? '#EF4444' : '#06C7F5'} 
                      />
                      <div className="mt-2 text-center w-100">
                        <div className="fw-bold font-monospace" style={{ fontSize: '15px', color: (tankItems.ohtTank?.percentage ?? 92.0) < 40 ? '#EF4444' : '#06C7F5' }}>
                          {tankItems.ohtTank?.currentKl || '46.0 kL'}
                        </div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          Total: {tankItems.ohtTank?.capacityKl || '50.0 kL'} ({tankItems.ohtTank?.percentage ?? 92.0}%)
                        </div>
                      </div>
                    </div>

                    {/* Right: Information, Level Fill Bar & Parameters */}
                    <div className="col-sm-7 d-flex flex-column justify-content-between">
                      {/* Tank Level Fill Progress Bar */}
                      <div className="p-2 mb-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div className="d-flex align-items-baseline justify-content-between mb-1">
                          <span className="text-secondary small fw-medium">Tank Level Fill:</span>
                          <span className="fw-bold font-monospace" style={{ fontSize: '13px', color: (tankItems.ohtTank?.percentage ?? 92.0) < 40 ? '#EF4444' : '#06C7F5' }}>
                            {tankItems.ohtTank?.percentage ?? 92.0}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: '7px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '999px' }}>
                          <div 
                            className="progress-bar" 
                            role="progressbar" 
                            style={{ 
                              width: `${tankItems.ohtTank?.percentage ?? 92.0}%`,
                              background: (tankItems.ohtTank?.percentage ?? 92.0) < 40 
                                ? 'linear-gradient(90deg, #EF4444, #F59E0B)' 
                                : 'linear-gradient(90deg, #06C7F5, #38EF7D)'
                            }} 
                          />
                        </div>
                      </div>

                      {/* Parameters List */}
                      <div className="acms-param-list">
                        <div className="acms-param-row py-1">
                          <span className="acms-param-label"><Activity size={13} /> Water Depth:</span>
                          <span className="acms-param-value font-monospace">{tankItems.ohtTank?.waterDepth || '2.30 m (Max: 2.5 m)'}</span>
                        </div>
                        <div className="acms-param-row py-1">
                          <span className="acms-param-label"><Shield size={13} /> Minimum Reserve:</span>
                          <span className="acms-param-value highlight-green">{tankItems.ohtTank?.minReserve || '35 kL Required'}</span>
                        </div>
                        <div className="acms-param-row py-1">
                          <span className="acms-param-label"><AlertTriangle size={13} /> Low Level Alarm:</span>
                          <span className={`acms-param-value ${(tankItems.ohtTank?.lowLevelAlarm || '').includes('NORMAL') ? 'highlight-green' : 'highlight-red'}`}>
                            {tankItems.ohtTank?.lowLevelAlarm || 'NORMAL (No Alarm)'}
                          </span>
                        </div>
                        <div className="acms-param-row py-1">
                          <span className="acms-param-label"><Gauge size={13} /> Static Head:</span>
                          <span className="acms-param-value highlight-cyan">{tankItems.ohtTank?.staticHead || '3.85 kg/cm² (Gravity)'}</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end mt-2 pt-1">
                        <button
                          type="button"
                          className="acms-station-btn"
                          onClick={() => setTankItems(prev => ({
                            ...prev,
                            ohtTank: {
                              ...prev.ohtTank,
                              percentage: prev.ohtTank?.percentage === 92.0 ? 28 : 92.0,
                              currentKl: prev.ohtTank?.percentage === 92.0 ? '14.0 kL' : '46.0 kL',
                              waterDepth: prev.ohtTank?.percentage === 92.0 ? '0.70 m (Low)' : '2.30 m (Max: 2.5 m)',
                              lowLevelAlarm: prev.ohtTank?.percentage === 92.0 ? 'CRITICAL LOW LEVEL ALARM' : 'NORMAL (No Alarm)'
                            }
                          }))}
                        >
                          <RefreshCw size={11} /> Toggle OHT Tank Level
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── EXPANDED FULLSCREEN SCADA MODAL FOR FIRE WATER TANKS (CLAUSE 3.c) ── */}
            <Modal
              show={expandedTab === 'tanks'}
              onHide={() => setExpandedTab(null)}
              size="xl"
              centered
              dialogClassName="acms-fullscreen-scada-modal"
              contentClassName="acms-scada-modal-content"
            >
              <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="acms-banner-icon-badge cyan" style={{ width: '38px', height: '38px' }}>
                    <Droplets size={20} />
                  </div>
                  <div>
                    <h5 className="fw-black text-white mb-0" style={{ letterSpacing: '-0.01em' }}>
                       Fire Water Tanks — Fullscreen SCADA Architecture & Diagnostics
                    </h5>
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>
                      Dual reservoir real-time hydrostatic depth telemetry, suction cross-connect manifolds, and NBC Part 4 minimum reserve supervision.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="acms-supervision-pill cyan">
                    <span className="acms-dot-pulse-green"></span>
                    2 / 2 RESERVOIRS SUPERVISED
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-1 px-3"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setExpandedTab(null)}
                  >
                    <Minimize2 size={13} />
                    <span>Exit Expand View</span>
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="acms-modal-scada-layout">
                  {/* Left: Enlarged 2.5D Building Diagram */}
                  <div className="p-3 rounded" style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-white small fw-bold d-flex align-items-center gap-1.5">
                        <Droplets size={14} className="text-info" /> High-Resolution Dual Reservoir Isometric Model
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small" style={{ fontSize: '11px' }}>
                          Total Fire Reserve: <strong className="text-cyan font-monospace">311.5 kL</strong> (UG + OHT)
                        </span>
                        <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '10px' }}>
                          ● 100% NBC Compliant
                        </span>
                      </div>
                    </div>

                    <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '640px', display: 'block' }} fill="none">
                      <defs>
                        <linearGradient id="mTankWallGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1B263B" />
                          <stop offset="100%" stopColor="#0D1527" />
                        </linearGradient>
                        <linearGradient id="mTankFloorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="50%" stopColor="#1E293B" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>
                        <linearGradient id="mTankWaterGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.95" />
                        </linearGradient>
                        <linearGradient id="mTankUgSumpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06C7F5" stopOpacity="0.55" />
                          <stop offset="100%" stopColor="#0369A1" stopOpacity="0.95" />
                        </linearGradient>
                      </defs>

                      {/* Plant Room Floor Foundation */}
                      <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                      <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                      {/* 3D Isometric Wall Facade */}
                      <polygon points="100,90 150,68 150,520 100,542" fill="url(#mTankWallGrad)" stroke="#334155" strokeWidth="1.2" />

                      {/* Window slits */}
                      {[100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map(wy => (
                        <line key={`mw-${wy}`} x1="112" y1={wy + 16} x2="138" y2={wy + 6} stroke="#38BDF8" strokeWidth="1.8" strokeOpacity="0.45" />
                      ))}

                      {/* Front Interior Building Facade */}
                      <rect x="150" y="68" width="220" height="452" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

                      {/* 11 Building Floors (Roof down to Ground) */}
                      {[
                        { label: 'Roof', y: 68 },
                        { label: '10F', y: 108 },
                        { label: '9F', y: 148 },
                        { label: '8F', y: 188 },
                        { label: '7F', y: 228 },
                        { label: '6F', y: 268 },
                        { label: '5F', y: 308 },
                        { label: '4F', y: 348 },
                        { label: '3F', y: 388 },
                        { label: '2F', y: 428 },
                        { label: '1F', y: 468 },
                        { label: 'Ground', y: 508 }
                      ].map((fl) => (
                        <g key={`mfl-${fl.label}`}>
                          <rect x="152" y={fl.y + 2} width="216" height="36" fill="rgba(255,255,255,0.02)" rx="2" />
                          <polygon points={`100,${fl.y + 14} 150,${fl.y} 370,${fl.y} 320,${fl.y + 14}`} fill="url(#mTankFloorGrad)" stroke="#334155" strokeWidth="0.8" />
                          <line x1="150" y1={fl.y} x2="370" y2={fl.y} stroke="#475569" strokeWidth="2" />
                          <rect x="375" y={fl.y + 8} width="38" height="17" rx="3" fill="#0B1220" stroke="#334155" strokeWidth="1" />
                          <text x="394" y={fl.y + 20} fill="#94A3B8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>
                        </g>
                      ))}

                      {/* ── Rooftop Overhead Fire Tank (46.0 kL / 50 kL - 92%) ── */}
                      <g className="cursor-pointer" onClick={() => setExpandedTankSelect('oht')}>
                        <rect x="230" y="20" width="105" height="48" rx="5" fill="#0B1220" stroke={expandedTankSelect === 'oht' ? "#38BDF8" : "#0284C7"} strokeWidth={expandedTankSelect === 'oht' ? "2.5" : "2"} />
                        <rect x="234" y="28" width="97" height="38" rx="3" fill="url(#mTankWaterGrad)" />
                        <ellipse cx="282" cy="28" rx="48" ry="5" fill="#38BDF8" fillOpacity="0.8" />
                        <path d="M234 30 Q 258 26, 282 30 T 331 30" stroke="#BAE6FD" strokeWidth="1.5" fill="none" opacity="0.8" />
                        <text x="282" y="44" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">OVERHEAD TANK</text>
                        <text x="282" y="56" fill="#E0F2FE" fontSize="8" fontWeight="bold" textAnchor="middle">46.0 kL (92%)</text>

                        <g transform="translate(145, 12)">
                          <rect x="0" y="0" width="135" height="24" rx="4" fill="#070D18" stroke="#06C7F5" strokeWidth="1.2" />
                          <circle cx="10" cy="12" r="3.5" fill="#10B981" />
                          <text x="20" y="15" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">Overhead Tank: 46.0 kL (92%)</text>
                        </g>

                        <path d="M230 44 L 180 44 L 180 520" stroke="#0284C7" strokeWidth="7" fill="none" />
                        <path d="M230 44 L 180 44 L 180 520" stroke="#38BDF8" strokeWidth="3" fill="none" className="water-flow-active" />
                      </g>

                      {/* ── Vertical Main Riser (Red Heavy Industrial) ── */}
                      <line x1="180" y1="44" x2="180" y2="530" stroke="#DC2626" strokeWidth="8" strokeLinecap="round" />
                      <line x1="180" y1="44" x2="180" y2="530" stroke="#EF4444" strokeWidth="3" />

                      {/* Floor Valves */}
                      {[108, 148, 188, 228, 268, 308, 348, 388, 428, 468, 508].map(fy => (
                        <g key={`mval-${fy}`}>
                          <line x1="180" y1={fy + 18} x2="202" y2={fy + 18} stroke="#DC2626" strokeWidth="3" />
                          <rect x="202" y={fy + 10} width="16" height="16" rx="2" fill="#B91C1C" stroke="#EF4444" strokeWidth="1" />
                          <circle cx="210" cy={fy + 18} r="4" fill="#FEE2E2" />
                        </g>
                      ))}

                      {/* ── Underground Fire Water Tank (Large Sump Cutaway on Right) ── */}
                      <g className="cursor-pointer" onClick={() => setExpandedTankSelect('ug')}>
                        <rect x="340" y="535" width="170" height="130" rx="5" fill="#0B1220" stroke={expandedTankSelect === 'ug' ? "#10B981" : "#0284C7"} strokeWidth={expandedTankSelect === 'ug' ? "2.8" : "2.5"} />
                        <rect x="345" y="552" width="160" height="110" rx="3" fill="url(#mTankUgSumpGrad)" />
                        <path d="M345 556 Q 380 550, 425 556 T 505 556 L 505 662 L 345 662 Z" fill="#06C7F5" opacity="0.3" />
                        <line x1="352" y1="560" x2="358" y2="560" stroke="#FFF" strokeWidth="1" opacity="0.7" />
                        <text x="362" y="563" fill="#BAE6FD" fontSize="6.5">3.54m</text>
                        <line x1="352" y1="605" x2="358" y2="605" stroke="#FFF" strokeWidth="1" opacity="0.5" />
                        <text x="362" y="608" fill="#BAE6FD" fontSize="6.5">2.0m</text>
                        <line x1="352" y1="650" x2="358" y2="650" stroke="#FFF" strokeWidth="1" opacity="0.5" />
                        <text x="362" y="653" fill="#BAE6FD" fontSize="6.5">0m</text>

                        <g transform="translate(345, 508)">
                          <rect x="0" y="0" width="155" height="24" rx="4" fill="#070D18" stroke="#10B981" strokeWidth="1.2" />
                          <circle cx="10" cy="12" r="3.5" fill="#10B981" />
                          <text x="20" y="15" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">UG Fire Sump: 265.5 kL (88.5%)</text>
                        </g>
                      </g>

                      {/* ── Suction Pipe from UG Tank to Basement Pumps ── */}
                      <path d="M345 615 L 75 615 L 75 585" stroke="#0284C7" strokeWidth="6" fill="none" strokeLinecap="round" />
                      <path d="M345 615 L 75 615 L 75 585" stroke="#38BDF8" strokeWidth="2.5" fill="none" className="water-flow-active" />

                      {/* Pumps */}
                      <g>
                        <rect x="50" y="605" width="115" height="10" rx="2" fill="#334155" stroke="#475569" strokeWidth="0.8" />
                        <rect x="55" y="565" width="45" height="40" rx="3" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.2" />
                        <circle cx="77" cy="585" r="14" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
                        <circle cx="77" cy="585" r="5" fill="#FEE2E2" />
                        <rect x="110" y="565" width="45" height="40" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="1.2" />
                        <circle cx="132" cy="585" r="14" fill="#D97706" stroke="#B45309" strokeWidth="1" />
                        <circle cx="132" cy="585" r="5" fill="#FEF3C7" />
                        <path d="M77 565 L 77 545 L 180 545" stroke="#DC2626" strokeWidth="5" fill="none" />
                        <path d="M132 565 L 132 545" stroke="#DC2626" strokeWidth="5" fill="none" />
                      </g>
                    </svg>
                  </div>

                  {/* Right: Reservoir Inspector & 2 Items Checklist */}
                  <div className="d-flex flex-column gap-3">
                    {/* Tank Selector Module */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <Database size={14} className="text-info" /> Reservoir Telemetry ({expandedTankSelect === 'ug' ? 'UG Sump' : 'Terrace OHT'})
                        </span>
                        <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '10px' }}>
                          Supervised Normal
                        </span>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className={`btn btn-sm flex-fill fw-bold ${expandedTankSelect === 'ug' ? 'btn-info text-dark' : 'btn-outline-secondary'}`}
                          style={{ fontSize: '11px', borderRadius: '6px' }}
                          onClick={() => setExpandedTankSelect('ug')}
                        >
                          [1] UG Sump (265.5 kL)
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm flex-fill fw-bold ${expandedTankSelect === 'oht' ? 'btn-info text-dark' : 'btn-outline-secondary'}`}
                          style={{ fontSize: '11px', borderRadius: '6px' }}
                          onClick={() => setExpandedTankSelect('oht')}
                        >
                          [2] Terrace OHT (46 kL)
                        </button>
                      </div>

                      {expandedTankSelect === 'ug' ? (
                        <div className="p-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="row g-2" style={{ fontSize: '11px' }}>
                            <div className="col-6">
                              <span className="text-muted">Total Gross Capacity:</span>
                              <div className="fw-bold text-white font-monospace">300.0 kL</div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Current Fire Reserve:</span>
                              <div className="fw-bold text-cyan font-monospace">{tankItems.ugTank?.currentKl || '265.5 kL'} ({tankItems.ugTank?.percentage || 88.5}%)</div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Measured Water Depth:</span>
                              <div className="fw-bold text-white font-monospace">{tankItems.ugTank?.waterDepth || '3.54 m (Max: 4.0 m)'}</div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Ultrasonic Level Sensor:</span>
                              <div className="fw-bold text-success">ONLINE (4-20mA Loop)</div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Auto Refill Ball Valve:</span>
                              <div className="fw-bold text-white">READY (Municipal Line)</div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Low Water Level Alarm:</span>
                              <div className="fw-bold text-success">NORMAL (Set @ 50 kL)</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="row g-2" style={{ fontSize: '11px' }}>
                            <div className="col-6">
                              <span className="text-muted">Total Gross Capacity:</span>
                              <div className="fw-bold text-white font-monospace">50.0 kL</div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Current Fire Reserve:</span>
                              <div className="fw-bold text-cyan font-monospace">{tankItems.ohtTank?.currentKl || '46.0 kL'} ({tankItems.ohtTank?.percentage || 92}%)</div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Measured Water Depth:</span>
                              <div className="fw-bold text-white font-monospace">{tankItems.ohtTank?.waterDepth || '2.30 m (Max: 2.5 m)'}</div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Static Head to Base:</span>
                              <div className="fw-bold text-info font-monospace">{tankItems.ohtTank?.staticHead || '3.85 kg/cm²'}</div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Downcomer Supervised Valve:</span>
                              <div className="fw-bold text-success">LOCKED OPEN</div>
                            </div>
                            <div className="col-6">
                              <span className="text-muted">Low Water Level Alarm:</span>
                              <div className="fw-bold text-success">NORMAL (Set @ 10 kL)</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clause 3 (c) 2 Items Compliance Checklist */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-success" /> Clause 3 (c) 2 Items Compliance Status
                        </span>
                        <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                          2 / 2 Monitored
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        {[
                          { num: '1', title: 'Underground Static Water Tank (Clause 3.c.i)', val: `${tankItems.ugTank?.currentKl || '265.5 kL'} (${tankItems.ugTank?.percentage || 88.5}%)`, state: 'success', desc: 'Continuous ultrasonic level telemetry directly routed to BMS & Fire Alarm panel.' },
                          { num: '2', title: 'Terrace Tank (Overhead Tank - Clause 3.c.ii)', val: `${tankItems.ohtTank?.currentKl || '46.0 kL'} (${tankItems.ohtTank?.percentage || 92}%)`, state: 'info', desc: 'Maintains static positive head to top-floor hydrants with low level switch supervisory.' },
                        ].map(chk => (
                          <div key={chk.num} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-secondary bg-opacity-25 text-white" style={{ fontSize: '9.5px', width: '20px' }}>{chk.num}</span>
                                <span className="text-white fw-bold">{chk.title}</span>
                              </div>
                              <span className={`badge bg-${chk.state} bg-opacity-25 text-${chk.state}`} style={{ fontSize: '10px' }}>
                                {chk.val}
                              </span>
                            </div>
                            <div className="text-muted" style={{ fontSize: '10.5px', paddingLeft: '28px' }}>
                              {chk.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  Total Building Reserve: <strong className="text-cyan">311.5 kL</strong> • NBC 2016 Compliant: <strong className="text-success">YES</strong> • Head: <strong className="text-white font-monospace">{tankItems.ohtTank.staticHead}</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary px-3 py-1"
                  style={{ fontSize: '11.5px', borderRadius: '6px' }}
                  onClick={() => setExpandedTab(null)}
                >
                  Close Inspection
                </button>
              </div>
            </Modal>
          </motion.div>
        )}

        {/* ========================================================
            TAB 4: SPRINKLER (CLAUSE 3.d - 3 ITEMS)
            ======================================================== */}
        {activeTab === 'sprinkler' && (
          <motion.div key="sprinkler" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>

            {/* ── Sprinkler System Live SCADA Header Bar ── */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2.5">
                <div className="acms-banner-icon-badge cyan" style={{ width: '36px', height: '36px' }}>
                  <Droplets size={18} />
                </div>
                <div>
                  <h6 className="fw-black text-white mb-0" style={{ fontSize: '13.5px', letterSpacing: '0.01em' }}>
                    Automatic Sprinkler System
                  </h6>
                </div>
              </div>
            </div>

            {/* ── Sprinkler Riser Low Pressure Hero Telemetry Deck ── */}
            <div className="acms-hydrant-hero-deck mb-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <span className="acms-hydrant-item-num" style={{ background: '#06C7F5', color: '#000' }}>3</span>
                  <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                    {sprinklerItems.riserLowPressure?.title || 'Sprinkler Riser Low Pressure Monitoring'}
                  </span>
                </div>
              </div>

              <div className="row g-3 align-items-center">
                <div className="col-lg-3 col-md-4 d-flex align-items-center justify-content-center">
                  <div className="acms-riser-gauge-box text-center p-2 rounded" style={{ background: 'rgba(6,199,245,0.04)', border: '1px solid rgba(6,199,245,0.2)', width: '100%' }}>
                    <RiserPressureIcon />
                    <div className="mt-1">
                      <div className="text-muted" style={{ fontSize: '10px', letterSpacing: '0.04em' }}>WET-PIPE RISER PRESSURE</div>
                      <div className="fw-black text-cyan font-monospace" style={{ fontSize: '24px', lineHeight: 1.1 }}>
                        {sprinklerItems.riserLowPressure?.pressure || '7.20'} <span style={{ fontSize: '12px', color: '#94A3B8' }}>kg/cm²</span>
                      </div>
                      <div className="text-success fw-bold font-monospace" style={{ fontSize: '10px' }}>
                        Nominal Operating Range
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 col-md-8">
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center justify-content-end text-muted" style={{ fontSize: '11px' }}>
                      <span className="text-cyan font-monospace fw-bold">Live: {sprinklerItems.riserLowPressure?.pressure || '7.20'} kg/cm² (~7.06 bar)</span>
                    </div>

                    <div className="acms-riser-bar-track">
                      {/* Alarm zone */}
                      <div style={{ position: 'absolute', left: 0, width: '42.8%', height: '100%', background: 'rgba(239, 68, 68, 0.35)', borderRight: '1px dashed #EF4444' }}></div>
                      {/* Normal zone */}
                      <div style={{ position: 'absolute', left: '42.8%', width: '35.7%', height: '100%', background: 'rgba(16, 185, 129, 0.3)' }}></div>
                      {/* Live needle pin */}
                      <div className="acms-riser-bar-pin" style={{ left: '51.4%' }}></div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '9.5px', color: '#64748B' }}>
                      <span className="text-danger fw-bold">0 kg/cm² (Discharged)</span>
                      <span className="text-danger">Low Cut-in: 6.0</span>
                      <span className="text-success fw-bold">Target: 7.0 - 8.5 kg/cm²</span>
                      <span>14.0 kg/cm² (Max)</span>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-12">
                  <div className="d-flex flex-column gap-1.5 p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '10.5px' }}>
                      <span className="text-muted">Alarm Check Valve:</span>
                      <span className="text-success fw-bold">ACV-01 READY</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '10.5px' }}>
                      <span className="text-muted">Waterflow Switch:</span>
                      <span className="text-cyan font-monospace">MONITORED (NORMAL)</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between" style={{ fontSize: '10.5px' }}>
                      <span className="text-muted">Floor Branch Isolators:</span>
                      <span className="text-success font-monospace">12 / 12 OPEN &amp; LOCKED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2 SCADA Station Cards (Clause i & Clause ii) ── */}
            <div className="row g-3 mb-4">
              {/* Station Card 1: Main Sprinkler Pump */}
              <div className="col-lg-6">
                <div className="acms-station-card border-cyan-glow">
                  <div className="acms-station-header">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-station-badge cyan">STATION 01</span>
                      <span className="acms-station-title">Centrifugal Wet Sprinkler Pump</span>
                    </div>
                  </div>

                  <div className="acms-station-body">
                    <div className="acms-station-subitem">
                      <div className="acms-subitem-top">
                        <div className="acms-subitem-title-group">
                          <span className="acms-hydrant-item-num" style={{ background: '#EF4444', color: '#FFF' }}>1</span>
                          <SprinklerPumpIcon isRunning={sprinklerItems.mainPump.runStatus === 'RUNNING'} />
                          <div className="acms-subitem-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                {sprinklerItems.mainPump.title}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`acms-status-chip ${sprinklerItems.mainPump.runStatus === 'RUNNING' ? 'green' : 'amber'}`}>
                          <Activity size={12} className={sprinklerItems.mainPump.runStatus === 'RUNNING' ? 'acms-spin-slow' : ''} />
                          {sprinklerItems.mainPump.runStatus}
                        </span>
                      </div>

                      {/* Telemetry 2x2 Grid */}
                      <div className="acms-telemetry-pill-grid">
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Cpu size={12} /> Motor Rating:</span>
                          <span className="acms-param-value highlight-green">{sprinklerItems.mainPump.rating || '45 kW / 60 HP'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Activity size={12} /> Flow Capacity:</span>
                          <span className="acms-param-value highlight-cyan font-monospace">{sprinklerItems.mainPump.flowRate || '2280 LPM'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Gauge size={12} /> Head Pressure:</span>
                          <span className="acms-param-value highlight-cyan font-monospace">7.5 kg/cm²</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Power size={12} /> Run / Feed Mode:</span>
                          <span className="acms-param-value highlight-green">AUTOMATIC BMS SCADA</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className={`acms-station-btn ${sprinklerItems.mainPump.runStatus === 'RUNNING' ? 'active-running' : ''}`}
                          onClick={() => setSprinklerItems(prev => ({
                            ...prev,
                            mainPump: { ...prev.mainPump, runStatus: prev.mainPump.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' }
                          }))}
                        >
                          <Power size={11} /> {sprinklerItems.mainPump.runStatus === 'RUNNING' ? 'Stop Sprinkler Pump' : 'Start Sprinkler Pump'}
                        </button>
                      </div>
                    </div>
                  </div>


                </div>
              </div>

              {/* Station Card 2: Dedicated Power to Sprinkler Pump */}
              <div className="col-lg-6">
                <div className="acms-station-card border-purple-glow">
                  <div className="acms-station-header">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-station-badge purple">STATION 02</span>
                      <span className="acms-station-title">Dedicated Sprinkler Electrical Substation</span>
                    </div>
                  </div>

                  <div className="acms-station-body">
                    <div className="acms-station-subitem">
                      <div className="acms-subitem-top">
                        <div className="acms-subitem-title-group">
                          <span className="acms-hydrant-item-num" style={{ background: '#06C7F5', color: '#000' }}>2</span>
                          <PowerPanelIcon />
                          <div className="acms-subitem-meta">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                                {sprinklerItems.powerMainPump.title}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`acms-status-chip ${sprinklerItems.powerMainPump.powerStatus === 'POWER ON' ? 'green' : 'red'}`}>
                          <Zap size={12} /> {sprinklerItems.powerMainPump.powerStatus}
                        </span>
                      </div>

                      {/* Telemetry 2x2 Grid */}
                      <div className="acms-telemetry-pill-grid">
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Server size={12} /> Feeder Breaker:</span>
                          <span className="acms-param-value highlight-cyan">{sprinklerItems.powerMainPump.feed || 'MCCB-SPK-01 (400A)'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Activity size={12} /> Supply Voltage:</span>
                          <span className="acms-param-value font-monospace highlight-green">{sprinklerItems.powerMainPump.voltage || '414.8 V Balanced'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><Power size={12} /> Contactor State:</span>
                          <span className="acms-param-value highlight-green">{sprinklerItems.powerMainPump.breakerState || 'CLOSED / ENERGIZED'}</span>
                        </div>
                        <div className="acms-telemetry-pill-row">
                          <span className="acms-param-label"><ShieldCheck size={12} /> Phase Balance:</span>
                          <span className="acms-param-value highlight-cyan">R-Y-B HEALTHY (50.0 Hz)</span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end">
                        <button
                          type="button"
                          className={`acms-station-btn ${sprinklerItems.powerMainPump.powerStatus === 'POWER ON' ? 'active-running' : ''}`}
                          onClick={() => setSprinklerItems(prev => ({
                            ...prev,
                            powerMainPump: { ...prev.powerMainPump, powerStatus: prev.powerMainPump.powerStatus === 'POWER ON' ? 'POWER OFF' : 'POWER ON' }
                          }))}
                        >
                          <Zap size={11} /> Toggle Sprinkler Power Feed
                        </button>
                      </div>
                    </div>
                  </div>


                </div>
              </div>
            </div>


            {/* ── EXPANDED FULLSCREEN SCADA MODAL FOR SPRINKLER (CLAUSE 3.d) ── */}
            <Modal
              show={expandedTab === 'sprinkler'}
              onHide={() => setExpandedTab(null)}
              size="xl"
              centered
              dialogClassName="acms-fullscreen-scada-modal"
              contentClassName="acms-scada-modal-content"
            >
              <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="acms-banner-icon-badge cyan" style={{ width: '38px', height: '38px' }}>
                    <Gauge size={20} />
                  </div>
                  <div>
                    <h5 className="fw-black text-white mb-0" style={{ letterSpacing: '-0.01em' }}>
                      Clause 3 (d) Sprinkler Subsystem — Fullscreen SCADA Architecture & Diagnostics
                    </h5>
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>
                      Full-height wet-pipe riser, alarm check valves, floor flow switch telemetry, and 3-item supervision compliance.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="acms-supervision-pill cyan">
                    <span className="acms-dot-pulse-green"></span>
                    3 / 3 ITEMS SUPERVISED
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-1 px-3"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setExpandedTab(null)}
                  >
                    <Minimize2 size={13} />
                    <span>Exit Expand View</span>
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="acms-modal-scada-layout">
                  {/* Left: Enlarged 2.5D Building Diagram */}
                  <div className="p-3 rounded" style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-white small fw-bold d-flex align-items-center gap-1.5">
                        <Gauge size={14} className="text-info" /> High-Resolution Sprinkler Grid Isometric Model
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small" style={{ fontSize: '11px' }}>
                          Sprinkler Riser: <strong className="text-cyan font-monospace">{sprinklerItems.riserPressure.currentPressure}</strong>
                        </span>
                        <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '10px' }}>
                          ● Automatic Wet Pipe Armed
                        </span>
                      </div>
                    </div>

                    <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '640px', display: 'block' }} fill="none">
                      <defs>
                        <linearGradient id="mSpkWallGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1B263B" />
                          <stop offset="100%" stopColor="#0D1527" />
                        </linearGradient>
                        <linearGradient id="mSpkFloorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="50%" stopColor="#1E293B" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>
                        <linearGradient id="mSprayGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                          <stop offset="60%" stopColor="#06C7F5" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Basement Foundation */}
                      <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                      <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                      {/* 3D Isometric Wall Facade */}
                      <polygon points="100,90 150,68 150,520 100,542" fill="url(#mSpkWallGrad)" stroke="#334155" strokeWidth="1.2" />

                      {/* Window slits */}
                      {[100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map(wy => (
                        <line key={`msw-${wy}`} x1="112" y1={wy + 16} x2="138" y2={wy + 6} stroke="#38BDF8" strokeWidth="1.8" strokeOpacity="0.45" />
                      ))}

                      {/* Front Interior Building Facade */}
                      <rect x="150" y="68" width="220" height="452" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

                      {/* 11 Building Floors */}
                      {[
                        { label: 'Roof', y: 68 },
                        { label: '10F', y: 108 },
                        { label: '9F', y: 148 },
                        { label: '8F', y: 188 },
                        { label: '7F', y: 228 },
                        { label: '6F', y: 268 },
                        { label: '5F', y: 308 },
                        { label: '4F', y: 348 },
                        { label: '3F', y: 388 },
                        { label: '2F', y: 428 },
                        { label: '1F', y: 468 },
                        { label: 'Ground', y: 508 }
                      ].map((fl) => (
                        <g key={`msfl-${fl.label}`} className="cursor-pointer" onClick={() => setExpandedFloorSelect(fl.label)}>
                          <rect x="152" y={fl.y + 2} width="216" height="36" fill={expandedFloorSelect === fl.label ? "rgba(6, 199, 245, 0.12)" : "rgba(255,255,255,0.02)"} rx="2" />
                          <polygon points={`100,${fl.y + 14} 150,${fl.y} 370,${fl.y} 320,${fl.y + 14}`} fill="url(#mSpkFloorGrad)" stroke="#334155" strokeWidth="0.8" />
                          <line x1="150" y1={fl.y} x2="370" y2={fl.y} stroke="#475569" strokeWidth="2" />
                          <rect x="375" y={fl.y + 8} width="38" height="17" rx="3" fill="#0B1220" stroke={expandedFloorSelect === fl.label ? "#06C7F5" : "#334155"} strokeWidth="1" />
                          <text x="394" y={fl.y + 20} fill={expandedFloorSelect === fl.label ? "#06C7F5" : "#94A3B8"} fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>
                        </g>
                      ))}

                      {/* Main Sprinkler Riser (Wet Pipe - Cyan/Teal) */}
                      <line x1="200" y1="70" x2="200" y2="530" stroke="#0284C7" strokeWidth="7" strokeLinecap="round" />
                      <line x1="200" y1="70" x2="200" y2="530" stroke="#38BDF8" strokeWidth="2.5" />

                      {/* Floor Sprinkler Branches & Sprinkler Heads */}
                      {[108, 148, 188, 228, 268, 308, 348, 388, 428, 468].map(fy => (
                        <g key={`mspk-${fy}`}>
                          <line x1="200" y1={fy + 14} x2="340" y2={fy + 14} stroke="#0284C7" strokeWidth="3" />
                          <rect x="215" y={fy + 9} width="10" height="10" rx="1.5" fill="#047857" stroke="#10B981" strokeWidth="0.8" />
                          <circle cx="220" cy={fy + 14} r="2.5" fill="#34D399" />

                          {[255, 290, 325].map(hx => (
                            <g key={`mh-${fy}-${hx}`}>
                              <line x1={hx} y1={fy + 14} x2={hx} y2={fy + 20} stroke="#0284C7" strokeWidth="2" />
                              <circle cx={hx} cy={fy + 22} r="3" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.8" />
                              <line x1={hx - 4} y1={fy + 25} x2={hx + 4} y2={fy + 25} stroke="#64748B" strokeWidth="1.5" />
                              <polygon points={`${hx},${fy + 25} ${hx - 12},${fy + 36} ${hx + 12},${fy + 36}`} fill="url(#mSprayGrad)" opacity="0.85" />
                            </g>
                          ))}
                        </g>
                      ))}

                      {/* Riser Pressure Callout Badge */}
                      <g transform="translate(45, 260)">
                        <rect x="0" y="0" width="145" height="38" rx="4" fill="#070D18" stroke="#06C7F5" strokeWidth="1.2" />
                        <circle cx="12" cy="14" r="4" fill="#10B981" />
                        <text x="22" y="16" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">Sprinkler Wet Riser</text>
                        <text x="22" y="29" fill="#38BDF8" fontSize="8" fontFamily="monospace">Pressure: {sprinklerItems.riserPressure.currentPressure}</text>
                      </g>

                      {/* Main Sprinkler Pump in Basement */}
                      <g>
                        <rect x="50" y="605" width="130" height="10" rx="2" fill="#334155" stroke="#475569" strokeWidth="0.8" />
                        <rect x="60" y="565" width="55" height="40" rx="3" fill="#0369A1" stroke="#0284C7" strokeWidth="1.2" />
                        <circle cx="87" cy="585" r="15" fill="#0284C7" stroke="#0369A1" strokeWidth="1" />
                        <circle cx="87" cy="585" r="6" fill="#38BDF8" />
                        <path d="M87 565 L 87 545 L 200 545" stroke="#0284C7" strokeWidth="6" fill="none" />
                        <path d="M87 565 L 87 545 L 200 545" stroke="#38BDF8" strokeWidth="2.5" fill="none" className="water-flow-active" />

                        <g transform="translate(55, 625)">
                          <rect x="0" y="0" width="150" height="20" rx="3" fill="#070D18" stroke="#0284C7" strokeWidth="1" />
                          <text x="75" y="13" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle">Main Sprinkler Pump (75 kW)</text>
                        </g>
                      </g>
                    </svg>
                  </div>

                  {/* Right: Floor Inspector & 3 Items Checklist */}
                  <div className="d-flex flex-column gap-3">
                    {/* Floor Inspector Module */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <Layers size={14} className="text-info" /> Floor Sprinkler Diagnostics ({expandedFloorSelect})
                        </span>
                        <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '10px' }}>
                          Armed &amp; Supervised
                        </span>
                      </div>

                      <div className="acms-floor-nav-grid">
                        {['Roof', '10F', '9F', '8F', '7F', '6F', '5F', '4F', '3F', '2F', '1F', 'Ground'].map(fl => (
                          <button
                            key={`btn-spk-${fl}`}
                            type="button"
                            className={`acms-floor-nav-btn ${expandedFloorSelect === fl ? 'active' : ''}`}
                            onClick={() => setExpandedFloorSelect(fl)}
                          >
                            {fl}
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="row g-2" style={{ fontSize: '11px' }}>
                          <div className="col-6">
                            <span className="text-muted">Floor Control Valve:</span>
                            <div className="fw-bold text-success">LOCKED OPEN &amp; SUPERVISED</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Water Flow Switch:</span>
                            <div className="fw-bold text-cyan font-monospace">FS-{expandedFloorSelect} (ARMED)</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Pendant Sprinkler Head:</span>
                            <div className="fw-bold text-white">68°C Red Bulb / 15mm Orifice</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Water Motor Gong:</span>
                            <div className="fw-bold text-info">READY TO SOUND</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Clause 3 (d) 3 Items Compliance Checklist */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-success" /> Clause 3 (d) 3 Items Compliance Status
                        </span>
                        <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                          3 / 3 Active
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        {[
                          { num: '1', title: sprinklerItems.mainPump.title, val: sprinklerItems.mainPump.runStatus, state: 'success', desc: 'Main centrifugal electric sprinkler pump delivering 2850 LPM @ 7.0 bar head.' },
                          { num: '2', title: sprinklerItems.powerMainPump.title, val: sprinklerItems.powerMainPump.powerStatus, state: 'success', desc: 'Dual-source MCC panel feed (Grid Transformer A + Auto DG Synced) monitored.' },
                          { num: '3', title: sprinklerItems.riserPressure.title, val: sprinklerItems.riserPressure.currentPressure, state: 'info', desc: `Riser pressure monitored via PS-SPK-01 (Cut-in: ${sprinklerItems.riserPressure.cutInLimit} / Cut-out: ${sprinklerItems.riserPressure.cutOutLimit}).` },
                        ].map(chk => (
                          <div key={chk.num} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-secondary bg-opacity-25 text-white" style={{ fontSize: '9.5px', width: '20px' }}>{chk.num}</span>
                                <span className="text-white fw-bold">{chk.title}</span>
                              </div>
                              <span className={`badge bg-${chk.state} bg-opacity-25 text-${chk.state}`} style={{ fontSize: '10px' }}>
                                {chk.val}
                              </span>
                            </div>
                            <div className="text-muted" style={{ fontSize: '10.5px', paddingLeft: '28px' }}>
                              {chk.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  System Health: <strong className="text-success">NORMAL</strong> • Sprinkler Head Coverage: <strong className="text-cyan">100% Floor Area</strong> • Riser Pressure: <strong className="text-white font-monospace">{sprinklerItems.riserPressure.currentPressure}</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary px-3 py-1"
                  style={{ fontSize: '11.5px', borderRadius: '6px' }}
                  onClick={() => setExpandedTab(null)}
                >
                  Close Inspection
                </button>
              </div>
            </Modal>
          </motion.div>
        )}

        {/* ========================================================
            TAB 5: DETECTION SYSTEM (CLAUSE 3.e - 3 ITEMS)
            ======================================================== */}
        {activeTab === 'detection' && (
          <motion.div key="detection" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>

            {/* ── Clause 3(e) Fire Detection Live SCADA Header ── */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2.5">
                <div className="acms-banner-icon-badge danger" style={{ width: '36px', height: '36px' }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h6 className="fw-black text-white mb-0" style={{ fontSize: '13.5px', letterSpacing: '0.01em' }}>
                    Fire Detection &amp; Alarm System
                  </h6>
                </div>
              </div>
            </div>

            {/* ── UNIFIED MASTER FACP ARCHITECTURE & TELEMETRY DECK ── */}
            <div className="acms-console-deck mb-3 border-red-glow">
              <div className="acms-console-top-strip">
                <div className="d-flex align-items-center gap-2.5 flex-wrap">
                  <span className="acms-station-badge danger">STATION 01</span>
                  <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                    {detectionItems.panelOperation.title || 'Detection operation status (Fire panel status)'}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className={`acms-status-chip ${detectionItems.panelOperation.operationStatus === 'ON' ? 'green' : 'red'}`}>
                    <Activity size={11} className={detectionItems.panelOperation.operationStatus === 'ON' ? 'acms-spin-slow' : ''} />
                    {detectionItems.panelOperation.operationStatus === 'ON' ? 'NORMAL' : 'OFFLINE'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 py-1 px-2.5"
                    style={{ fontSize: '11px', borderRadius: '6px' }}
                    onClick={() => {
                      const nextState = detectionItems.panelOperation.operationStatus === 'ON' ? 'OFF' : 'ON';
                      setDetectionItems(prev => ({
                        ...prev,
                        panelOperation: { ...prev.panelOperation, operationStatus: nextState }
                      }));
                      if (nextState === 'ON') {
                        triggerVoiceAnnouncement('Attention: Fire Detection System is now ON. All 8 loops are active and normal.', 'on');
                      } else {
                        triggerVoiceAnnouncement('Warning: Fire Detection System has been switched OFF.', 'off');
                      }
                    }}
                  >
                    <Power size={12} className={detectionItems.panelOperation.operationStatus === 'ON' ? 'text-success' : 'text-danger'} />
                    <span>{detectionItems.panelOperation.operationStatus === 'ON' ? 'Power OFF' : 'Power ON'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1.5 py-1 px-2.5"
                    style={{ fontSize: '11px', borderRadius: '6px' }}
                    onClick={() => {
                      triggerVoiceAnnouncement('Emergency Voice Alarm: Attention please. A fire condition has been detected. Please evacuate immediately using exit stairways.', 'alarm');
                    }}
                  >
                    <Volume2 size={12} />
                    <span>Broadcast Siren</span>
                  </button>
                </div>
              </div>

              {/* 4-Item Telemetry Ribbon */}
              <div className="acms-metric-ribbon mt-3">
                <div className="acms-metric-tile">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted" style={{ fontSize: '10.5px' }}>Optical Smoke Detectors</span>
                    <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '9px' }}>100% OK</span>
                  </div>
                  <div className="fw-black text-white font-monospace" style={{ fontSize: '20px', lineHeight: 1.1 }}>
                    986 <span style={{ fontSize: '11px', color: '#94A3B8' }}>/ 986 Normal</span>
                  </div>
                  <div className="text-success small mt-1" style={{ fontSize: '10px' }}>
                    ● Zero Drift • Zero Contamination
                  </div>
                </div>

                <div className="acms-metric-tile">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted" style={{ fontSize: '10.5px' }}>Thermal Heat Detectors</span>
                    <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '9px' }}>100% OK</span>
                  </div>
                  <div className="fw-black text-white font-monospace" style={{ fontSize: '20px', lineHeight: 1.1 }}>
                    120 <span style={{ fontSize: '11px', color: '#94A3B8' }}>/ 120 Normal</span>
                  </div>
                  <div className="text-success small mt-1" style={{ fontSize: '10px' }}>
                    ● Rate-of-Rise &amp; Fixed Temp Supervised
                  </div>
                </div>

                <div className="acms-metric-tile">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted" style={{ fontSize: '10.5px' }}>Manual Call Points</span>
                    <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '9px' }}>100% OK</span>
                  </div>
                  <div className="fw-black text-white font-monospace" style={{ fontSize: '20px', lineHeight: 1.1 }}>
                    48 <span style={{ fontSize: '11px', color: '#94A3B8' }}>/ 48 Armed</span>
                  </div>
                  <div className="text-success small mt-1" style={{ fontSize: '10px' }}>
                    ● Class-A Loop Supervised
                  </div>
                </div>

                <div className="acms-metric-tile">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted" style={{ fontSize: '10.5px' }}>BMS SCADA Interface</span>
                    <span className="badge bg-info bg-opacity-25 text-info" style={{ fontSize: '9px' }}>ONLINE</span>
                  </div>
                  <div className="fw-black text-cyan font-monospace" style={{ fontSize: '17px', lineHeight: 1.3 }}>
                    Modbus-TCP / IP
                  </div>
                  <div className="text-muted small mt-1" style={{ fontSize: '10px' }}>
                    Latency: &lt; 85ms • 0 Packet Loss
                  </div>
                </div>
              </div>

              {/* 8-Loop Supervision Strip */}
              <div className="mt-3 pt-2.5 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="text-muted small d-flex align-items-center gap-2" style={{ fontSize: '11px' }}>
                  <Radio size={13} className="text-danger" /> 8 Class-A Signaling Line Circuits (SLC):
                </span>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(lp => (
                    <span key={lp} className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 font-monospace" style={{ fontSize: '10px', padding: '3px 8px' }}>
                      Loop {lp}: OK
                    </span>
                  ))}
                </div>
              </div>

              {isVoiceSpeaking && (
                <div className="mt-2.5 p-2 rounded bg-danger bg-opacity-20 border border-danger border-opacity-40 d-flex align-items-center gap-2">
                  <Volume2 size={16} className="text-danger flex-shrink-0" />
                  <span className="text-danger fw-bold text-truncate" style={{ fontSize: '11px' }}>
                    Voice Active: "{voiceAnnouncementText}"
                  </span>
                </div>
              )}
            </div>

            {/* ── 2 EQUAL-HEIGHT SCADA STATIONS (REPEATERS & 24V BATTERY) ── */}
            <div className="row g-3 mb-4">
              {/* Station 02: Floor Repeater Panels */}
              <div className="col-lg-6">
                <div className="acms-console-deck h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25 flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="acms-station-badge purple">STATION 02</span>
                        <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                          Floor Repeater Mimic Panels
                        </span>
                      </div>
                      <span className="badge bg-success bg-opacity-25 text-success font-monospace" style={{ fontSize: '10.5px' }}>
                        ● 3 / 3 WORKING
                      </span>
                    </div>

                    {/* 3 Repeater Rows */}
                    <div className="d-flex flex-column gap-2 mb-3">
                      {detectionItems.repeaterPanels.panels.map((p, i) => (
                        <div key={i} className="acms-clean-repeater-row">
                          <div className="d-flex align-items-center gap-2.5">
                            <span className="badge bg-secondary bg-opacity-25 text-white font-monospace" style={{ fontSize: '10px' }}>
                              RP-0{i+1}
                            </span>
                            <div>
                              <strong className="text-white small d-block" style={{ fontSize: '12px' }}>{p.name}</strong>
                              <span className="text-muted" style={{ fontSize: '10.5px' }}>Bus: <span className="text-cyan font-monospace">{p.comms}</span></span>
                            </div>
                          </div>
                          <span className="badge bg-success bg-opacity-25 text-success font-monospace" style={{ fontSize: '10px' }}>
                            ● {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-top border-secondary border-opacity-20 d-flex align-items-center justify-content-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info py-1 px-3"
                      style={{ fontSize: '11px', borderRadius: '6px' }}
                      onClick={() => triggerVoiceAnnouncement('Repeater Panels polling complete. All 3 nodes are active.', 'repeater')}
                    >
                      <RefreshCw size={11} className="me-1" /> Poll Repeaters
                    </button>
                  </div>
                </div>
              </div>

              {/* Station 03: 24V DC Standby Battery Power Plant */}
              <div className="col-lg-6">
                <div className="acms-console-deck h-100 d-flex flex-column justify-content-between border-cyan-glow">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25 flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="acms-station-badge cyan">STATION 03</span>
                        <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                          24V DC Standby Battery Power Plant
                        </span>
                      </div>
                      <span className="badge bg-success bg-opacity-25 text-success font-monospace" style={{ fontSize: '10.5px' }}>
                        ● {detectionItems.batteryStatus.batteryHealth}
                      </span>
                    </div>

                    {/* Battery Visual & State */}
                    <div className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-20 mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted small">Dual 12V 65Ah Sealed Lead-Acid (VRLA):</span>
                        <span className="text-success fw-bold font-monospace" style={{ fontSize: '13px' }}>
                          {detectionItems.batteryStatus.percentage}% ({detectionItems.batteryStatus.floatVoltage})
                        </span>
                      </div>
                      <div className="acms-riser-bar-track" style={{ height: '8px' }}>
                        <div style={{ position: 'absolute', left: 0, width: `${detectionItems.batteryStatus.percentage}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #06C7F5)', borderRadius: '4px' }}></div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between text-muted mt-1" style={{ fontSize: '9.5px' }}>
                        <span>20.4V Cut-off</span>
                        <span>Nominal: 24.0V</span>
                        <span className="text-success">Float: 27.4V - 27.6V</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-top border-secondary border-opacity-20 d-flex align-items-center justify-content-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success py-1 px-3"
                      style={{ fontSize: '11px', borderRadius: '6px' }}
                      onClick={() => {
                        setDetectionItems(prev => ({
                          ...prev,
                          batteryStatus: { ...prev.batteryStatus, percentage: 98, floatVoltage: '27.6 V DC' }
                        }));
                        triggerVoiceAnnouncement('Battery health diagnostic complete: VRLA cells healthy, float voltage 27.6V.', 'battery');
                      }}
                    >
                      <Battery size={11} className="me-1" /> Test Battery
                    </button>
                  </div>
                </div>
              </div>
            </div>


            {/* ── EXPANDED FULLSCREEN SCADA MODAL FOR DETECTION SYSTEM (CLAUSE 3.e) ── */}
            <Modal
              show={expandedTab === 'detection'}
              onHide={() => setExpandedTab(null)}
              size="xl"
              centered
              dialogClassName="acms-fullscreen-scada-modal"
              contentClassName="acms-scada-modal-content"
            >
              <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="acms-banner-icon-badge" style={{ width: '38px', height: '38px' }}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h5 className="fw-black text-white mb-0" style={{ letterSpacing: '-0.01em' }}>
                      Clause 3 (e) Detection System — Fullscreen SCADA Architecture & Diagnostics
                    </h5>
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>
                      Main Fire Alarm Control Panel (FACP), Addressable Loop Networks (SLC), Floor Repeater Panels, and Standby Battery Telemetry.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="acms-supervision-pill danger">
                    <span className="acms-dot-pulse-red"></span>
                    3 / 3 ITEMS SUPERVISED
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-1 px-3"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setExpandedTab(null)}
                  >
                    <Minimize2 size={13} />
                    <span>Exit Expand View</span>
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="acms-modal-scada-layout">
                  {/* Left: Enlarged 2.5D Building Diagram */}
                  <div className="p-3 rounded" style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-white small fw-bold d-flex align-items-center gap-1.5">
                        <ShieldAlert size={14} className="text-danger" /> High-Resolution Addressable SLC Network Isometric Model
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small" style={{ fontSize: '11px' }}>
                          Supervised Sensors: <strong className="text-cyan font-monospace">1,016 Units</strong> across 8 Loops
                        </span>
                        <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '10px' }}>
                          ● 0 Open / 0 Short Faults
                        </span>
                      </div>
                    </div>

                    <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '640px', display: 'block' }} fill="none">
                      <defs>
                        <linearGradient id="mDetWallGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1B263B" />
                          <stop offset="100%" stopColor="#0D1527" />
                        </linearGradient>
                        <linearGradient id="mDetFloorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="50%" stopColor="#1E293B" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>
                      </defs>

                      {/* Foundation Floor */}
                      <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                      <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                      {/* 3D Isometric Wall Facade */}
                      <polygon points="100,90 150,68 150,520 100,542" fill="url(#mDetWallGrad)" stroke="#334155" strokeWidth="1.2" />

                      {/* Window slits */}
                      {[100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map(wy => (
                        <line key={`mdw-${wy}`} x1="112" y1={wy + 16} x2="138" y2={wy + 6} stroke="#38BDF8" strokeWidth="1.8" strokeOpacity="0.45" />
                      ))}

                      {/* Front Interior Building Facade */}
                      <rect x="150" y="68" width="230" height="452" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

                      {/* 11 Floors */}
                      {[
                        { label: 'Roof', y: 68 },
                        { label: '10F', y: 108 },
                        { label: '9F', y: 148 },
                        { label: '8F', y: 188 },
                        { label: '7F', y: 228 },
                        { label: '6F', y: 268 },
                        { label: '5F', y: 308 },
                        { label: '4F', y: 348 },
                        { label: '3F', y: 388 },
                        { label: '2F', y: 428 },
                        { label: '1F', y: 468 },
                        { label: 'Ground', y: 508 }
                      ].map((fl, idx) => (
                        <g key={`mdet-${fl.label}`}>
                          <rect x="152" y={fl.y + 2} width="226" height="36" fill="rgba(255,255,255,0.02)" rx="2" />
                          <polygon points={`100,${fl.y + 14} 150,${fl.y} 380,${fl.y} 330,${fl.y + 14}`} fill="url(#mDetFloorGrad)" stroke="#334155" strokeWidth="0.8" />
                          <line x1="150" y1={fl.y} x2="380" y2={fl.y} stroke="#475569" strokeWidth="2" />

                          <rect x="52" y={fl.y + 7} width="42" height="18" rx="3" fill="#0B1220" stroke="#334155" strokeWidth="1" />
                          <circle cx="60" cy={fl.y + 16} r="2.5" fill="#10B981" />
                          <text x="76" y={fl.y + 19} fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>

                          {idx > 0 && (
                            <g>
                              {/* 3 Detectors per floor */}
                              <g transform={`translate(200, ${fl.y + 6})`}>
                                <path d="M-6 0 L6 0 L4 4 L-4 4 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.5" />
                                <circle cx="0" cy="2" r="1.5" fill="#10B981" />
                              </g>
                              <g transform={`translate(260, ${fl.y + 6})`}>
                                <path d="M-6 0 L6 0 L4 4 L-4 4 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.5" />
                                <circle cx="0" cy="2" r="1.5" fill="#10B981" />
                              </g>
                              <g transform={`translate(320, ${fl.y + 6})`}>
                                <path d="M-6 0 L6 0 L4 4 L-4 4 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.5" />
                                <circle cx="0" cy="2" r="1.5" fill="#10B981" />
                              </g>
                            </g>
                          )}
                        </g>
                      ))}

                      {/* Addressable Red Twisted-Pair Loop Cable */}
                      <path d="M190 535 L 190 75 L 340 75 L 340 535" stroke="#EF4444" strokeWidth="2.5" fill="none" strokeDasharray="5 3" />

                      {/* Main FACP Master Panel in Basement/Ground Control Room */}
                      <g transform="translate(60, 550)">
                        <rect x="0" y="0" width="130" height="95" rx="5" fill="#1E293B" stroke="#EF4444" strokeWidth="2" />
                        <rect x="10" y="10" width="110" height="30" rx="3" fill="#0284C7" />
                        <text x="65" y="22" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">FIRE ALARM SYSTEM</text>
                        <text x="65" y="33" fill="#A7F3D0" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">STATUS: ALL NORMAL</text>

                        <circle cx="25" cy="52" r="4.5" fill="#10B981" />
                        <text x="35" y="55" fill="#CBD5E1" fontSize="7">Power</text>

                        <circle cx="70" cy="52" r="4.5" fill="#EF4444" opacity="0.3" />
                        <text x="80" y="55" fill="#CBD5E1" fontSize="7">Alarm</text>

                        <rect x="10" y="66" width="110" height="20" rx="3" fill="#0F172A" />
                        <text x="65" y="79" fill="#94A3B8" fontSize="7" textAnchor="middle">Clause 3.e.i: {detectionItems.panelOperation.operationStatus}</text>
                      </g>

                      {/* Repeater Panels on Floor 5 and Floor 10 */}
                      <g transform="translate(385, 310)">
                        <rect x="0" y="0" width="85" height="32" rx="3" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
                        <circle cx="10" cy="16" r="3.5" fill="#10B981" />
                        <text x="20" y="14" fill="#FFFFFF" fontSize="7" fontWeight="bold">Repeater 5F</text>
                        <text x="20" y="24" fill="#38BDF8" fontSize="6.5" fontFamily="monospace">ONLINE (RS485)</text>
                      </g>
                      <g transform="translate(385, 110)">
                        <rect x="0" y="0" width="85" height="32" rx="3" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
                        <circle cx="10" cy="16" r="3.5" fill="#10B981" />
                        <text x="20" y="14" fill="#FFFFFF" fontSize="7" fontWeight="bold">Repeater 10F</text>
                        <text x="20" y="24" fill="#38BDF8" fontSize="6.5" fontFamily="monospace">ONLINE (RS485)</text>
                      </g>

                      {/* 24V Standby Battery Bank */}
                      <g transform="translate(210, 565)">
                        <rect x="0" y="0" width="105" height="60" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
                        <rect x="10" y="8" width="85" height="24" rx="2" fill="#0284C7" fillOpacity="0.2" stroke="#0284C7" strokeWidth="0.8" />
                        <text x="52" y="22" fill="#38BDF8" fontSize="8" fontWeight="bold" textAnchor="middle">24V DC Float Battery</text>
                        <text x="52" y="44" fill="#10B981" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{detectionItems.batteryStatus.floatVoltage}</text>
                        <text x="52" y="54" fill="#94A3B8" fontSize="6.5" textAnchor="middle">Autonomy: 48h Standby</text>
                      </g>
                    </svg>
                  </div>

                  {/* Right: Loop Interrogation & 3 Items Checklist */}
                  <div className="d-flex flex-column gap-3">
                    {/* Loop Interrogation Module */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <Cpu size={14} className="text-danger" /> Signaling Line Circuit Loop Interrogation
                        </span>
                        <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '10px' }}>
                          Polling Active
                        </span>
                      </div>

                      <div className="d-flex flex-wrap gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(lp => (
                          <button
                            key={`btn-lp-${lp}`}
                            type="button"
                            className={`btn btn-sm py-1 px-2.5 fw-bold ${expandedDetectionLoop === lp ? 'btn-danger' : 'btn-outline-secondary'}`}
                            style={{ fontSize: '10.5px', borderRadius: '5px' }}
                            onClick={() => setExpandedDetectionLoop(lp)}
                          >
                            Loop {lp}
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="row g-2" style={{ fontSize: '11px' }}>
                          <div className="col-6">
                            <span className="text-muted">Loop Polling Latency:</span>
                            <div className="fw-bold text-cyan font-monospace">&lt; 210 ms (Super Fast)</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Addressable Devices:</span>
                            <div className="fw-bold text-success font-monospace">127 / 127 Supervised</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Circuit Integrity:</span>
                            <div className="fw-bold text-white">Class A (Return Verified)</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Drift Compensation:</span>
                            <div className="fw-bold text-info">CLEAN (0.8% Obscuration)</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Clause 3 (e) 3 Items Compliance Checklist */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-success" /> Clause 3 (e) 3 Items Compliance Status
                        </span>
                        <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                          3 / 3 Active
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        {[
                          { num: '1', title: detectionItems.panelOperation?.title || 'Detection operation status (Fire panel status)', val: detectionItems.panelOperation?.operationStatus || 'ON', state: 'success', desc: 'Central Fire Alarm Control Panel microprocessors fully online with zero active faults.' },
                          { num: '2', title: detectionItems.repeaterPanels?.title || 'Control Panel / Repeater Panel status', val: 'WORKING (3/3)', state: 'success', desc: 'Floor repeaters on 5F & 10F synced over isolated dual-redundant RS485 network.' },
                          { num: '3', title: detectionItems.batteryStatus?.title || 'Battery of Control Panel status', val: `${detectionItems.batteryStatus?.floatVoltage || '27.4 V DC'} (${detectionItems.batteryStatus?.batteryHealth || 'HEALTHY'})`, state: 'info', desc: '2 x 65Ah Sealed Lead-Acid batteries with automatic float trickle charger and 48h autonomy.' },
                        ].map(chk => (
                          <div key={chk.num} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-secondary bg-opacity-25 text-white" style={{ fontSize: '9.5px', width: '20px' }}>{chk.num}</span>
                                <span className="text-white fw-bold">{chk.title}</span>
                              </div>
                              <span className={`badge bg-${chk.state} bg-opacity-25 text-${chk.state}`} style={{ fontSize: '10px' }}>
                                {chk.val}
                              </span>
                            </div>
                            <div className="text-muted" style={{ fontSize: '10.5px', paddingLeft: '28px' }}>
                              {chk.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  FACP Operation: <strong className="text-success">{detectionItems.panelOperation.operationStatus}</strong> • Battery Float: <strong className="text-cyan font-monospace">{detectionItems.batteryStatus.floatVoltage}</strong> • Repeaters: <strong className="text-white">ONLINE</strong>
                </span>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1.5 px-3 py-1"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => {
                      triggerVoiceAnnouncement('Attention: Fire detection system test broadcast. All addressable sensors, smoke detectors, and repeater panels are functioning normally.', 'on');
                    }}
                  >
                    <Volume2 size={13} />
                    <span>Test Voice Announcement</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary px-3 py-1"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setExpandedTab(null)}
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            </Modal>
          </motion.div>
        )}

        {/* ========================================================
            TAB 6: MANUAL CALL POINTS (CLAUSE 3.f)
            ======================================================== */}
        {activeTab === 'mcp' && (
          <motion.div key="mcp" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>

            {/* ── Manual Call Points Live SCADA Header Bar ── */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2.5">
                <div className="acms-banner-icon-badge danger" style={{ width: '36px', height: '36px' }}>
                  <Flame size={18} />
                </div>
                <div>
                  <h6 className="fw-black text-white mb-0" style={{ fontSize: '13.5px', letterSpacing: '0.01em' }}>
                    Manual Call Points (MCP)
                  </h6>
                </div>
              </div>
            </div>

            {/* ── Clause 3(f) Supervised Break Glass Loop Hero Deck ── */}
            <div className="acms-hydrant-hero-deck mb-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                  <span className="acms-hydrant-item-num" style={{ background: '#EF4444', color: '#FFF' }}>1</span>
                  <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                    Addressable Manual Call Point Supervised Network (Class-A Dual Return)
                  </span>
                </div>
              </div>

              <div className="row g-3 align-items-center">
                <div className="col-lg-3 col-md-4 d-flex align-items-center justify-content-center">
                  <div className="acms-riser-gauge-box text-center p-2 rounded" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.25)', width: '100%' }}>
                    <McpIcon status={mcpList.some(m => m.status === 'TRIGGERED') ? 'TRIGGERED' : 'NORMAL'} />
                    <div className="mt-1">
                      <div className="text-muted" style={{ fontSize: '10px', letterSpacing: '0.04em' }}>BREAK GLASS LOOP</div>
                      <div className={`fw-black font-monospace ${mcpList.some(m => m.status === 'TRIGGERED') ? 'text-danger' : 'text-success'}`} style={{ fontSize: '20px', lineHeight: 1.1 }}>
                        {mcpList.filter(m => m.status === 'TRIGGERED').length} ALARMS
                      </div>
                      <div className="text-muted small" style={{ fontSize: '10px' }}>
                        42 Addressable Units Supervised
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-5 col-md-8">
                  <div className="d-flex flex-column gap-2">


                    <div className="row g-2">
                      <div className="col-6">
                        <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                          <div className="text-muted" style={{ fontSize: '10px' }}>Supervised Units</div>
                          <div className="text-cyan fw-bold font-monospace" style={{ fontSize: '12px' }}>42 / 42 Monitored</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                          <div className="text-muted" style={{ fontSize: '10px' }}>Loop Supply Voltage</div>
                          <div className="text-success fw-bold font-monospace" style={{ fontSize: '12px' }}>24.2 V DC Supervised</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                          <div className="text-muted" style={{ fontSize: '10px' }}>Network Protocol</div>
                          <div className="text-white fw-bold font-monospace" style={{ fontSize: '12px' }}>Class-A Dual Return</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                          <div className="text-muted" style={{ fontSize: '10px' }}>Loop Faults</div>
                          <div className="text-success fw-bold font-monospace" style={{ fontSize: '12px' }}>0 Open / 0 Short</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4 col-12">
                  <div className="d-flex flex-column gap-2">
                    <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.04em' }}>
                      Filter by Building Zone:
                    </div>
                    <div className="d-flex flex-wrap gap-1.5">
                      {[
                        { key: 'all', label: 'All 42 MCPs', count: '42' },
                        { key: 'basement', label: 'Basement B1/B2', count: '3' },
                        { key: 'podium', label: 'Ground & Lobby', count: '1' },
                        { key: 'tower', label: 'Tower Floors', count: '4' }
                      ].map(f => (
                        <button
                          key={f.key}
                          type="button"
                          className={`btn btn-sm d-flex align-items-center gap-1.5 ${mcpFilter === f.key ? 'btn-danger' : 'btn-outline-secondary'}`}
                          style={{ borderRadius: '6px', fontSize: '10.5px', padding: '4px 8px' }}
                          onClick={() => setMcpFilter(f.key)}
                        >
                          <span>{f.label}</span>
                          <span className={`badge ${mcpFilter === f.key ? 'bg-white text-danger' : 'bg-secondary bg-opacity-25 text-white'}`} style={{ fontSize: '9px' }}>
                            {f.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 py-1.5 mt-1"
                      style={{ borderRadius: '6px', fontSize: '11px' }}
                      onClick={() => {
                        setMcpList(prev => prev.map(m => ({ ...m, status: 'NORMAL', operationStatus: 'ON' })));
                        setSelectedMcpFloor(null);
                        triggerVoiceAnnouncement('All manual call points reset to normal supervisory state.', 'reset');
                      }}
                    >
                      <RotateCcw size={12} /> Reset All MCP Alarms to Normal
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Addressable Break Glass Stations Grid ── */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between px-2 py-1 border-bottom border-secondary border-opacity-25 mb-2">
                <span className="text-white fw-bold small">Break Glass Devices (On / Off)</span>
                <span className="badge bg-danger bg-opacity-25 text-danger font-monospace" style={{ fontSize: '10px' }}>
                  {mcpList.filter(m => mcpFilter === 'all' || m.zone === mcpFilter).length} Station(s) in Zone
                </span>
              </div>

              <div className="acms-mcp-grid">
                {mcpList
                  .filter(m => mcpFilter === 'all' || m.zone === mcpFilter)
                  .map((mcp) => {
                    const isAlarm = mcp.status === 'TRIGGERED';
                    return (
                      <div
                        key={mcp.id}
                        className={`acms-station-card ${isAlarm ? 'border-red-glow' : 'border-secondary'}`}
                        style={{ background: isAlarm ? 'rgba(239,68,68,0.06)' : undefined }}
                      >
                        <div className="acms-station-body p-2.5">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="fw-black font-monospace text-danger small" style={{ fontSize: '12px' }}>{mcp.id}</span>
                            <div className="d-flex gap-1">
                              <span className={`acms-status-chip ${mcp.operationStatus === 'ON' ? 'green' : 'amber'}`} style={{ padding: '2px 7px', fontSize: '9px' }}>
                                {mcp.operationStatus}
                              </span>
                              <span className={`acms-status-chip ${isAlarm ? 'red' : 'green'}`} style={{ padding: '2px 7px', fontSize: '9px' }}>
                                {mcp.status}
                              </span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <McpIcon status={mcp.status} />
                            <div>
                              <div className="fw-bold text-white" style={{ fontSize: '12px' }}>{mcp.location}</div>
                              <div className="text-muted" style={{ fontSize: '10px' }}>Last Tested: {mcp.lastTest}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>


            {/* ── EXPANDED FULLSCREEN SCADA MODAL FOR MANUAL CALL POINTS (CLAUSE 3.f) ── */}
            <Modal
              show={expandedTab === 'mcp'}
              onHide={() => setExpandedTab(null)}
              size="xl"
              centered
              dialogClassName="acms-fullscreen-scada-modal"
              contentClassName="acms-scada-modal-content"
            >
              <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="acms-banner-icon-badge" style={{ width: '38px', height: '38px' }}>
                    <AlertOctagon size={20} />
                  </div>
                  <div>
                    <h5 className="fw-black text-white mb-0" style={{ letterSpacing: '-0.01em' }}>
                      Clause 3 (f) Manual Call Points (MCP) — Fullscreen SCADA Architecture & Diagnostics
                    </h5>
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>
                      Dual-action addressable break-glass call points along egress corridors, fire escape stairways, and lift lobbies.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="acms-supervision-pill danger">
                    <span className="acms-dot-pulse-red"></span>
                    42 / 42 MCP UNITS SUPERVISED
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-1 px-3"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setExpandedTab(null)}
                  >
                    <Minimize2 size={13} />
                    <span>Exit Expand View</span>
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="acms-modal-scada-layout">
                  {/* Left: Enlarged 2.5D Building Diagram */}
                  <div className="p-3 rounded" style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-white small fw-bold d-flex align-items-center gap-1.5">
                        <AlertOctagon size={14} className="text-danger" /> High-Resolution MCP Station Isometric Model
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small" style={{ fontSize: '11px' }}>
                          Addressable Loop: <strong className="text-success font-monospace">Class A Loop Continuity Healthy</strong>
                        </span>
                      </div>
                    </div>

                    <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '640px', display: 'block' }} fill="none">
                      <defs>
                        <linearGradient id="mMcpWallGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1B263B" />
                          <stop offset="100%" stopColor="#0D1527" />
                        </linearGradient>
                        <linearGradient id="mMcpFloorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="50%" stopColor="#1E293B" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>
                      </defs>

                      {/* Foundation Floor */}
                      <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                      <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                      {/* 3D Isometric Wall Facade */}
                      <polygon points="100,90 150,68 150,520 100,542" fill="url(#mMcpWallGrad)" stroke="#334155" strokeWidth="1.2" />

                      {/* Window slits */}
                      {[100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map(wy => (
                        <line key={`mmw-${wy}`} x1="112" y1={wy + 16} x2="138" y2={wy + 6} stroke="#38BDF8" strokeWidth="1.8" strokeOpacity="0.45" />
                      ))}

                      {/* Front Interior Building Facade */}
                      <rect x="150" y="68" width="220" height="452" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

                      {/* 11 Floors */}
                      {[
                        { label: 'Roof', y: 68 },
                        { label: '10F', y: 108 },
                        { label: '9F', y: 148 },
                        { label: '8F', y: 188 },
                        { label: '7F', y: 228 },
                        { label: '6F', y: 268 },
                        { label: '5F', y: 308 },
                        { label: '4F', y: 348 },
                        { label: '3F', y: 388 },
                        { label: '2F', y: 428 },
                        { label: '1F', y: 468 },
                        { label: 'Ground', y: 508 }
                      ].map((fl) => (
                        <g key={`mmcp-${fl.label}`} className="cursor-pointer" onClick={() => setSelectedMcpFloor(fl.label)}>
                          <rect x="152" y={fl.y + 2} width="216" height="36" fill={selectedMcpFloor === fl.label ? "rgba(239, 51, 64, 0.15)" : "rgba(255,255,255,0.02)"} rx="2" />
                          <polygon points={`100,${fl.y + 14} 150,${fl.y} 370,${fl.y} 320,${fl.y + 14}`} fill="url(#mMcpFloorGrad)" stroke="#334155" strokeWidth="0.8" />
                          <line x1="150" y1={fl.y} x2="370" y2={fl.y} stroke="#475569" strokeWidth="2" />

                          <rect x="375" y={fl.y + 8} width="38" height="17" rx="3" fill="#0B1220" stroke={selectedMcpFloor === fl.label ? "#EF3340" : "#334155"} strokeWidth="1" />
                          <text x="394" y={fl.y + 20} fill={selectedMcpFloor === fl.label ? "#EF3340" : "#94A3B8"} fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>

                          {/* Break-glass Station Graphic at Staircase Exit */}
                          <g transform={`translate(180, ${fl.y + 12})`}>
                            <rect x="0" y="0" width="18" height="18" rx="3" fill="#DC2626" stroke="#EF4444" strokeWidth="1.2" />
                            <rect x="3" y="3" width="12" height="12" rx="1.5" fill="#FFFFFF" />
                            <circle cx="9" cy="9" r="3" fill="#DC2626" />
                            <circle cx="15" cy="3" r="1.5" fill="#10B981" />
                          </g>

                          {/* Break-glass Station Graphic at Lift Lobby Exit */}
                          <g transform={`translate(280, ${fl.y + 12})`}>
                            <rect x="0" y="0" width="18" height="18" rx="3" fill="#DC2626" stroke="#EF4444" strokeWidth="1.2" />
                            <rect x="3" y="3" width="12" height="12" rx="1.5" fill="#FFFFFF" />
                            <circle cx="9" cy="9" r="3" fill="#DC2626" />
                            <circle cx="15" cy="3" r="1.5" fill="#10B981" />
                          </g>
                        </g>
                      ))}

                      {/* Main Addressable Loop Cable */}
                      <path d="M189 530 L 189 75 L 289 75 L 289 530" stroke="#EF4444" strokeWidth="2.5" fill="none" strokeDasharray="4 2" />

                      {/* Central Station Panel Callout */}
                      <g transform="translate(60, 555)">
                        <rect x="0" y="0" width="160" height="85" rx="5" fill="#1E293B" stroke="#EF4444" strokeWidth="1.5" />
                        <rect x="10" y="10" width="140" height="28" rx="3" fill="#0B1220" />
                        <text x="80" y="24" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">MCP ADDRESSABLE LOOP</text>
                        <text x="80" y="34" fill="#34D399" fontSize="7" fontFamily="monospace" textAnchor="middle">42 STATIONS INTACT</text>

                        <rect x="10" y="48" width="140" height="26" rx="3" fill="#0F172A" />
                        <text x="80" y="60" fill="#E2E8F0" fontSize="7" textAnchor="middle">NBC Part 4 Travel Distance</text>
                        <text x="80" y="70" fill="#38BDF8" fontSize="7" fontWeight="bold" textAnchor="middle">&lt; 30m Compliant</text>
                      </g>
                    </svg>
                  </div>

                  {/* Right: Station Inspector & Checklist */}
                  <div className="d-flex flex-column gap-3">
                    {/* Station Inspector Module */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <Radio size={14} className="text-danger" /> Station Diagnostics ({selectedMcpFloor || '5F'})
                        </span>
                        <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '10px' }}>
                          Glass Seal Intact
                        </span>
                      </div>

                      <div className="acms-floor-nav-grid">
                        {['Roof', '10F', '9F', '8F', '7F', '6F', '5F', '4F', '3F', '2F', '1F', 'Ground'].map(fl => (
                          <button
                            key={`btn-mcp-${fl}`}
                            type="button"
                            className={`acms-floor-nav-btn ${selectedMcpFloor === fl ? 'active' : ''}`}
                            onClick={() => setSelectedMcpFloor(fl)}
                          >
                            {fl}
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="row g-2" style={{ fontSize: '11px' }}>
                          <div className="col-6">
                            <span className="text-muted">Station Address:</span>
                            <div className="fw-bold text-cyan font-monospace">MCP-{selectedMcpFloor || '5F'}-01</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Break-Glass State:</span>
                            <div className="fw-bold text-success">SUPERVISED NORMAL</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Loop Continuity:</span>
                            <div className="fw-bold text-white">Class A Verified (24V DC)</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Physical Location:</span>
                            <div className="fw-bold text-info">Fire Staircase A Exit</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Clause 3 (f) MCP Checklist */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-success" /> Clause 3 (f) MCP Network Checklist
                        </span>
                        <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                          42 / 42 Supervised
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        {[
                          { num: '1', title: 'Class-A Addressable Dual Loop Network', val: 'Loop OK', state: 'success', desc: 'Continuous return loop ensures unbroken communication even in single wire sever.' },
                          { num: '2', title: 'Physical Break Glass Stations', val: '42 / 42 Intact', state: 'success', desc: 'Dual action push-and-pull mechanism with high-visibility red polycarbonate housing.' },
                          { num: '3', title: 'Integrated LED Status Indicators', val: 'Polling Blink OK', state: 'info', desc: 'Green LED blinks on every interrogation cycle (200ms) with red latching alarm LED.' },
                          { num: '4', title: 'NBC 2016 Part 4 Distance Compliance', val: '< 30m Compliant', state: 'success', desc: 'All building occupant egress travel routes are within 30 meters of a manual station.' },
                        ].map(chk => (
                          <div key={chk.num} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-secondary bg-opacity-25 text-white" style={{ fontSize: '9.5px', width: '20px' }}>{chk.num}</span>
                                <span className="text-white fw-bold">{chk.title}</span>
                              </div>
                              <span className={`badge bg-${chk.state} bg-opacity-25 text-${chk.state}`} style={{ fontSize: '10px' }}>
                                {chk.val}
                              </span>
                            </div>
                            <div className="text-muted" style={{ fontSize: '10.5px', paddingLeft: '28px' }}>
                              {chk.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  Total Stations: <strong className="text-white">42 Units</strong> • Active Alarms: <strong className="text-success">0 Alarms</strong> • Loop Status: <strong className="text-cyan">NORMAL</strong>
                </span>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success px-3 py-1"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setMcpList(prev => prev.map(m => ({ ...m, status: 'NORMAL', operationStatus: 'ON' })))}
                  >
                    Reset All MCPs to Normal
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary px-3 py-1"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setExpandedTab(null)}
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            </Modal>
          </motion.div>
        )}

        {/* ========================================================
            TAB 7: PUBLIC ADDRESS SYSTEM (CLAUSE 3.g)
            ======================================================== */}
        {activeTab === 'pa' && (
          <motion.div key="pa" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>

            {/* ── Public Address System Subsystem Header ── */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2.5">
                <Volume2 size={18} className="text-purple" />
                <div>
                  <h6 className="fw-black text-white mb-0" style={{ fontSize: '13.5px', letterSpacing: '0.01em' }}>
                    Public Address System (PA)
                  </h6>
                </div>
              </div>
            </div>

            {/* 2-Column SCADA Layout: Amplifiers & Broadcast Zones */}
            <div className="row g-3 mb-4">
              <div className="col-lg-6">
              {/* ────────────────────────────────────────────────────────
                  LEFT COLUMN: Amplifier Bank & Equipment Rack
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-scada-card border-purple-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#8B5CF6', color: '#FFF' }}>1</span>
                    </div>
                    <span className="acms-status-chip running">
                      <Check size={11} /> 4 / 4 WORKING
                    </span>
                  </div>
                  <div className="acms-card-title mb-1">500W Class-D Voice Evac Amplifiers</div>

                  {/* Amplifier 3D Rack Icon Box */}
                  <div className="d-flex justify-content-center my-2">
                    <PaAmpIcon />
                  </div>

                  {/* Amplifier List */}
                  <div className="acms-param-list mt-2">
                    {paItems.amplifiers.map(amp => (
                      <div key={amp.id} className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 mb-1.5">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <strong className="text-white small" style={{ fontSize: '11.5px' }}>
                            <Server size={13} className="text-purple me-2" />
                            {amp.id} ({amp.model})
                          </strong>
                          <span className="badge bg-success bg-opacity-25 text-success fw-bold" style={{ fontSize: '9.5px' }}>{amp.status}</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '10.5px' }}>
                          <span>Load: <span className="text-info">{amp.load}</span></span>
                          <span>Temp: <span className="text-warning">{amp.temp}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Master Console Supervisory */}
                  <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 mt-2">
                    <div className="d-flex align-items-center justify-content-between mb-1 text-muted small" style={{ fontSize: '11px' }}>
                      <span>Emergency Mic:</span>
                      <strong className="text-success">{paItems.emergencyMic}</strong>
                    </div>
                    <div className="d-flex align-items-center justify-content-between text-muted small" style={{ fontSize: '11px' }}>
                      <span>Controller:</span>
                      <strong className="text-success">{paItems.controllerStatus}</strong>
                    </div>
                  </div>
                </div>


              </div>

              </div>

              {/* ────────────────────────────────────────────────────────
                  RIGHT COLUMN: Broadcast Zones & Controls
                  ──────────────────────────────────────────────────────── */}
              <div className="col-lg-6">
              <div className="acms-scada-card border-purple-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#06C7F5', color: '#000' }}>2</span>
                    </div>
                    <span className="acms-status-chip running">
                      <Check size={11} /> 4 / 4 WORKING
                    </span>
                  </div>
                  <div className="acms-card-title mb-1">Monitored Speaker Broadcast Zones</div>

                  {/* Broadcast Zones List */}
                  <div className="acms-param-list mt-2">
                    {paItems.zones.map((z, idx) => (
                      <div key={idx} className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 mb-1.5">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <strong className="text-white small" style={{ fontSize: '11.5px' }}>
                            <Radio size={13} className="text-purple me-2" />
                            {z.name}
                          </strong>
                          <span className="badge bg-success bg-opacity-25 text-success fw-bold" style={{ fontSize: '9.5px' }}>WORKING</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '10.5px' }}>
                          <span>Status: <span className="text-info">{z.status}</span></span>
                          <span className="text-success font-monospace">100V LINE OK</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pre-recorded EVAC message status */}
                  <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 mt-3">
                    <div className="text-muted small fw-bold text-uppercase mb-1.5" style={{ fontSize: '10px' }}>
                      Digital Voice Evacuation Player
                    </div>
                    <div className="d-flex align-items-center justify-content-between text-muted small" style={{ fontSize: '11px' }}>
                      <span>Pre-recorded Messages:</span>
                      <strong className="text-info">Ready (3 Tracks)</strong>
                    </div>
                    <div className="d-flex align-items-center justify-content-between text-muted small mt-1" style={{ fontSize: '11px' }}>
                      <span>Automated Evac Chime:</span>
                      <strong className="text-success">Supervised</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    className={`btn btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2 ${isPaTesting ? 'btn-warning text-dark' : 'btn-danger'}`}
                    style={{ borderRadius: '6px', fontSize: '12px' }}
                    onClick={() => {
                      setIsPaTesting(true);
                      triggerVoiceAnnouncement('Attention please, attention please: This is an emergency voice evacuation test across all building zones. Please evacuate immediately.', 'alarm');
                      setTimeout(() => setIsPaTesting(false), 5000);
                    }}
                  >
                    <Volume2 size={16} />
                    {isPaTesting ? 'Broadcasting 5-Sec Test Chime (Pulsing)...' : 'Broadcast Test Evacuation Chime'}
                  </button>
                  <div className="text-muted text-center small mt-1" style={{ fontSize: '10.5px' }}>
                    Sends audio chime & animates speaker soundwaves across building.
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* ── EXPANDED FULLSCREEN SCADA MODAL FOR PUBLIC ADDRESS SYSTEM (CLAUSE 3.g) ── */}
            <Modal
              show={expandedTab === 'pa'}
              onHide={() => setExpandedTab(null)}
              size="xl"
              centered
              dialogClassName="acms-fullscreen-scada-modal"
              contentClassName="acms-scada-modal-content"
            >
              <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="acms-banner-icon-badge purple" style={{ width: '38px', height: '38px' }}>
                    <Volume2 size={20} />
                  </div>
                  <div>
                    <h5 className="fw-black text-white mb-0" style={{ letterSpacing: '-0.01em' }}>
                      Clause 3 (g) Public Address System (PA) — Fullscreen SCADA Architecture & Voice Evac Diagnostics
                    </h5>
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>
                      100V line voice alarm speakers, 4 broadcast emergency evacuation zones, 500W redundant Class-D amplifiers, and priority mic console.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="acms-supervision-pill purple">
                    <span className="acms-dot-pulse-green"></span>
                    4 / 4 ZONES SUPERVISED
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-1 px-3"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setExpandedTab(null)}
                  >
                    <Minimize2 size={13} />
                    <span>Exit Expand View</span>
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="acms-modal-scada-layout">
                  {/* Left: Enlarged 2.5D Building Diagram */}
                  <div className="p-3 rounded" style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-white small fw-bold d-flex align-items-center gap-1.5">
                        <Volume2 size={14} className="text-info" /> High-Resolution Constant-Voltage PA Network Isometric Model
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small" style={{ fontSize: '11px' }}>
                          Broadcast Status: {isPaTesting ? <strong className="text-warning">● Voice Evac Active</strong> : <strong className="text-success">Supervised Standby</strong>}
                        </span>
                      </div>
                    </div>

                    <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '640px', display: 'block' }} fill="none">
                      <defs>
                        <linearGradient id="mPaWallGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1B263B" />
                          <stop offset="100%" stopColor="#0D1527" />
                        </linearGradient>
                        <linearGradient id="mPaFloorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="50%" stopColor="#1E293B" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>
                      </defs>

                      {/* Foundation Floor */}
                      <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                      <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                      {/* 3D Isometric Wall Facade */}
                      <polygon points="100,90 150,68 150,520 100,542" fill="url(#mPaWallGrad)" stroke="#334155" strokeWidth="1.2" />

                      {/* Window slits */}
                      {[100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map(wy => (
                        <line key={`mpaw-${wy}`} x1="112" y1={wy + 16} x2="138" y2={wy + 6} stroke="#38BDF8" strokeWidth="1.8" strokeOpacity="0.45" />
                      ))}

                      {/* Front Interior Building Facade */}
                      <rect x="150" y="68" width="220" height="452" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

                      {/* 11 Floors */}
                      {[
                        { label: 'Roof', y: 68 },
                        { label: '10F', y: 108 },
                        { label: '9F', y: 148 },
                        { label: '8F', y: 188 },
                        { label: '7F', y: 228 },
                        { label: '6F', y: 268 },
                        { label: '5F', y: 308 },
                        { label: '4F', y: 348 },
                        { label: '3F', y: 388 },
                        { label: '2F', y: 428 },
                        { label: '1F', y: 468 },
                        { label: 'Ground', y: 508 }
                      ].map((fl) => (
                        <g key={`mpafl-${fl.label}`}>
                          <rect x="152" y={fl.y + 2} width="216" height="36" fill="rgba(255,255,255,0.02)" rx="2" />
                          <polygon points={`100,${fl.y + 14} 150,${fl.y} 370,${fl.y} 320,${fl.y + 14}`} fill="url(#mPaFloorGrad)" stroke="#334155" strokeWidth="0.8" />
                          <line x1="150" y1={fl.y} x2="370" y2={fl.y} stroke="#475569" strokeWidth="2" />

                          <rect x="375" y={fl.y + 8} width="38" height="17" rx="3" fill="#0B1220" stroke="#334155" strokeWidth="1" />
                          <text x="394" y={fl.y + 20} fill="#94A3B8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>

                          {/* Ceiling Mounted PA Horn/Cone Speakers */}
                          {[210, 275, 335].map((sx) => (
                            <g key={`mpaspk-${fl.label}-${sx}`}>
                              <path d={`M${sx - 8} ${fl.y + 2} L${sx + 8} ${fl.y + 2} L${sx + 5} ${fl.y + 8} L${sx - 5} ${fl.y + 8} Z`} fill="#A855F7" stroke="#9333EA" strokeWidth="0.6" />
                              <circle cx={sx} cy={fl.y + 8} r="3" fill="#C084FC" />
                              {/* Soundwaves if testing */}
                              {isPaTesting && (
                                <g>
                                  <path d={`M${sx - 6} ${fl.y + 12} Q${sx} ${fl.y + 16} ${sx + 6} ${fl.y + 12}`} stroke="#E879F9" strokeWidth="1.2" fill="none" className="scada-pulse" />
                                  <path d={`M${sx - 10} ${fl.y + 16} Q${sx} ${fl.y + 22} ${sx + 10} ${fl.y + 16}`} stroke="#C084FC" strokeWidth="1" fill="none" opacity="0.7" />
                                </g>
                              )}
                            </g>
                          ))}
                        </g>
                      ))}

                      {/* 100V Speaker Line Distribution Riser */}
                      <line x1="190" y1="70" x2="190" y2="530" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
                      <line x1="190" y1="70" x2="190" y2="530" stroke="#C084FC" strokeWidth="1.5" />

                      {/* Floor Taps */}
                      {[108, 148, 188, 228, 268, 308, 348, 388, 428, 468, 508].map(fy => (
                        <line key={`mtap-${fy}`} x1="190" y1={fy + 6} x2="205" y2={fy + 6} stroke="#C084FC" strokeWidth="2" />
                      ))}

                      {/* Central Amplifier Rack in Control Room */}
                      <g transform="translate(60, 545)">
                        <rect x="0" y="0" width="150" height="95" rx="5" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="1.8" />
                        <rect x="10" y="10" width="130" height="25" rx="3" fill="#0B1220" />
                        <text x="75" y="23" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">PA AMPLIFIER BANK</text>
                        <text x="75" y="32" fill="#C084FC" fontSize="6.8" fontFamily="monospace" textAnchor="middle">4 x 500W RMS (CLASS-D)</text>

                        {/* 4 Amp Channels */}
                        {[0, 1, 2, 3].map(ci => (
                          <g key={`mamp-${ci}`} transform={`translate(10, ${42 + ci * 12})`}>
                            <rect x="0" y="0" width="130" height="9" rx="1.5" fill="#0F172A" />
                            <circle cx="8" cy="4.5" r="2" fill="#10B981" />
                            <text x="16" y="7" fill="#E2E8F0" fontSize="6">CH-{ci + 1} (Zone {ci + 1})</text>
                            <text x="122" y="7" fill="#38BDF8" fontSize="6" fontFamily="monospace" textAnchor="end">100V OK</text>
                          </g>
                        ))}
                      </g>
                    </svg>
                  </div>

                  {/* Right: Zone Matrix & Checklist */}
                  <div className="d-flex flex-column gap-3">
                    {/* Zone Selector Module */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <Volume2 size={14} className="text-info" /> Broadcast Zone Diagnostics (Zone {expandedPaZone})
                        </span>
                        <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '10px' }}>
                          Pilot Tone Supervised
                        </span>
                      </div>

                      <div className="d-flex gap-1.5">
                        {[1, 2, 3, 4].map(zn => (
                          <button
                            key={`btn-pa-zn-${zn}`}
                            type="button"
                            className={`btn btn-sm flex-fill fw-bold ${expandedPaZone === zn ? 'btn-info text-dark' : 'btn-outline-secondary'}`}
                            style={{ fontSize: '10.5px', borderRadius: '5px' }}
                            onClick={() => setExpandedPaZone(zn)}
                          >
                            Zone {zn}
                          </button>
                        ))}
                      </div>

                      <div className="p-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="row g-2" style={{ fontSize: '11px' }}>
                          <div className="col-6">
                            <span className="text-muted">Assigned Amplifier:</span>
                            <div className="fw-bold text-cyan font-monospace">Amp-CH{expandedPaZone} (500W RMS)</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Line Impedance:</span>
                            <div className="fw-bold text-success font-monospace">48.2 Ω (Supervised)</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Voice Evacuation SPL:</span>
                            <div className="fw-bold text-white">78.5 dB(A) Standard</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Fire Override:</span>
                            <div className="fw-bold text-warning">HIGHEST PRIORITY (1)</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Clause 3 (g) PA System Checklist */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-success" /> Clause 3 (g) PA System Compliance Checklist
                        </span>
                        <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                          4 / 4 Monitored
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        {[
                          { num: '1', title: '500W Class-D Amplifiers Bank', val: '4 Active + 1 Standby', state: 'success', desc: '100% duty cycle, high efficiency Class-D amplifiers with automatic standby hot-swap.' },
                          { num: '2', title: '100V Loudspeaker Line Monitoring', val: '20 kHz Tone OK', state: 'success', desc: 'Continuous sub-audible pilot-tone monitoring verifies zero open circuits, shorts, or ground faults.' },
                          { num: '3', title: 'Fire Alarm Emergency Override', val: 'Priority 1 Armed', state: 'warning', desc: 'Instantly silences commercial background audio and unlocks maximum evacuation gain.' },
                          { num: '4', title: 'Automated Multi-Lingual Evac Chime', val: 'Pre-recorded Ready', state: 'info', desc: 'NFPA 72 compliant temporal-3 alert chime followed by English & Hindi evacuation directives.' },
                        ].map(chk => (
                          <div key={chk.num} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-secondary bg-opacity-25 text-white" style={{ fontSize: '9.5px', width: '20px' }}>{chk.num}</span>
                                <span className="text-white fw-bold">{chk.title}</span>
                              </div>
                              <span className={`badge bg-${chk.state} bg-opacity-25 text-${chk.state}`} style={{ fontSize: '10px' }}>
                                {chk.val}
                              </span>
                            </div>
                            <div className="text-muted" style={{ fontSize: '10.5px', paddingLeft: '28px' }}>
                              {chk.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  Coverage: <strong className="text-white">All Escape Stairways & Floors</strong> • Audio Readiness: <strong className="text-success">READY</strong>
                </span>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-warning px-3 py-1"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => {
                      setIsPaTesting(true);
                      triggerVoiceAnnouncement('Attention please: This is an emergency evacuation broadcast test for all building floors. Please follow illuminated exit signs to safety.', 'alarm');
                      setTimeout(() => setIsPaTesting(false), 5000);
                    }}
                  >
                    {isPaTesting ? 'Pulsing 5-Sec Chime...' : 'Test Evacuation Chime'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary px-3 py-1"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setExpandedTab(null)}
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            </Modal>
          </motion.div>
        )}

        {/* ========================================================
            TAB 8: AIR PRESSURIZATION (CLAUSE 3.h)
            ======================================================== */}
        {/* ========================================================
            TAB 8: AIR PRESSURIZATION (CLAUSE 3.h - 5 FANS MONITORED)
            ======================================================== */}
        {activeTab === 'pressurization' && (
          <motion.div key="pressurization" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>

            {/* ── Clause 3(h) Air Pressurization Live SCADA Header ── */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2.5">
            
            
              </div>
            </div>

            {/* ── UNIFIED DIFFERENTIAL PRESSURE (ΔP) & SMOKE BARRIER HERO DECK ── */}
            <div className="acms-console-deck mb-3 border-cyan-glow">
              <div className="acms-console-top-strip">
                <div className="d-flex align-items-center gap-2.5 flex-wrap">
                  <span className="acms-station-badge info">PRESSURE BARRIER SCADA</span>
                  <span className="fw-bold text-white" style={{ fontSize: '13px' }}>
                    Emergency Egress Differential Pressure (ΔP) Core Monitoring
                  </span>
                  <span className="badge bg-secondary bg-opacity-25 text-white font-monospace" style={{ fontSize: '10px' }}>
                    
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
              
                  <button
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1.5 py-1 px-3 ${isEmergencyPressurizing ? 'btn-danger' : 'btn-outline-warning'}`}
                    style={{ fontSize: '11px', borderRadius: '6px' }}
                    onClick={() => {
                      const nextState = !isEmergencyPressurizing;
                      setIsEmergencyPressurizing(nextState);
                      setPressurizationFans(prev => prev.map(f => ({ ...f, runStatus: nextState ? 'RUNNING' : 'STANDBY AUTO' })));
                      if (nextState) {
                        triggerVoiceAnnouncement('Emergency Pressurization Activated! All 5 fans running at 100% capacity.', 'alarm');
                      } else {
                        triggerVoiceAnnouncement('Emergency Pressurization deactivated. Fans returned to standby auto.', 'reset');
                      }
                    }}
                  >
                    <Wind size={12} />
                    <span>{isEmergencyPressurizing ? 'Stop Emergency Pressurization' : 'Test Emergency Pressurization'}</span>
                  </button>
                </div>
              </div>

              {/* 2 Big Pressure Telemetry Tiles + System Overview Strip */}
              <div className="row g-3 mt-1 align-items-center">
                {/* Stairwell Gauge Tile */}
                <div className="col-md-4">
                  <div className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="text-muted small" style={{ fontSize: '11px' }}>STAIRWELL SHAFTS A &amp; B</span>
                      <span className="badge bg-info bg-opacity-25 text-cyan" style={{ fontSize: '9px' }}>TARGET: 50 Pa</span>
                    </div>
                    <div className="fw-black text-cyan font-monospace" style={{ fontSize: '26px', lineHeight: 1.1 }}>
                      {pressurizationFans[0].deltaP || '50.2 Pa'}
                    </div>
                    <div className="acms-riser-bar-track mt-2" style={{ height: '6px' }}>
                      <div style={{ position: 'absolute', left: 0, width: '84%', height: '100%', background: 'linear-gradient(90deg, #0284C7, #06C7F5)', borderRadius: '3px' }}></div>
                    </div>
                    <div className="text-success small mt-1.5" style={{ fontSize: '10px' }}>
                      ● Continuous Smoke Ingress Barrier Active
                    </div>
                  </div>
                </div>

                {/* Lift Lobby Gauge Tile */}
                <div className="col-md-4">
                  <div className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="text-muted small" style={{ fontSize: '11px' }}>PROTECTED LIFT LOBBIES</span>
                      <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '9px' }}>TARGET: 25-30 Pa</span>
                    </div>
                    <div className="fw-black text-success font-monospace" style={{ fontSize: '26px', lineHeight: 1.1 }}>
                      {pressurizationFans[2].deltaP || '28.4 Pa'}
                    </div>
                    <div className="acms-riser-bar-track mt-2" style={{ height: '6px' }}>
                      <div style={{ position: 'absolute', left: 0, width: '75%', height: '100%', background: 'linear-gradient(90deg, #059669, #10B981)', borderRadius: '3px' }}></div>
                    </div>
                    <div className="text-success small mt-1.5" style={{ fontSize: '10px' }}>
                      ● Safe Egress Door Opening Force &lt; 100 N
                    </div>
                  </div>
                </div>

                {/* Building Delivery Overview Tile */}
                <div className="col-md-4">
                  <div className="p-3 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 d-flex flex-column gap-2" style={{ fontSize: '11px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">Total Air Delivery:</span>
                      <strong className="text-white font-monospace">82,500 CFM</strong>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">Motorized Dampers:</span>
                      <strong className="text-success font-monospace">100% Modulating OK</strong>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">VFD Controllers:</span>
                      <strong className="text-cyan font-monospace">5 / 5 Variable Drives Healthy</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 4 FAN UNITS IN A BALANCED 4-COLUMN SCADA GRID (NO NESTED BOXES) ── */}
            <div className="row g-3 mb-4">
              {[
                {
                  id: 'SPF-01',
                  name: 'Staircase A Fan',
                  shaft: 'Core A Egress Shaft',
                  clause: 'Clause 3(h)(i)',
                  fanIndex: 0,
                  rating: '22 kW IE3',
                  flow: '28,500 CFM',
                  dp: pressurizationFans[0].deltaP || '50.2 Pa',
                  color: 'cyan'
                },
                {
                  id: 'SPF-02',
                  name: 'Staircase B Fan',
                  shaft: 'Core B Egress Shaft',
                  clause: 'Clause 3(h)(i)',
                  fanIndex: 1,
                  rating: '18.5 kW IE3',
                  flow: '25,000 CFM',
                  dp: pressurizationFans[1].deltaP || '49.8 Pa',
                  color: 'cyan'
                },
                {
                  id: 'LPF-01/02',
                  name: 'Lift Lobby Fans',
                  shaft: 'Protected Core Lobbies',
                  clause: 'Clause 3(h)(ii)',
                  fanIndex: 2,
                  rating: '11 kW IE3',
                  flow: '16,200 CFM',
                  dp: pressurizationFans[2].deltaP || '28.4 Pa',
                  color: 'purple'
                },
                {
                  id: 'HPF-01',
                  name: 'Hoistway Fan',
                  shaft: 'Vertical Lift Shaft',
                  clause: 'Clause 3(h)(iii)',
                  fanIndex: 4,
                  rating: '7.5 kW IE3',
                  flow: '12,800 CFM',
                  dp: pressurizationFans[4].deltaP || '26.1 Pa',
                  color: 'purple'
                }
              ].map(f => {
                const fanState = pressurizationFans[f.fanIndex];
                const isRunning = fanState.runStatus === 'RUNNING' || isEmergencyPressurizing;
                return (
                  <div key={f.id} className="col-xl-3 col-md-6">
                    <div className={`acms-fan-unit-card h-100 ${f.color === 'cyan' ? 'border-cyan-glow' : 'border-purple-glow'}`}>
                      <div>
                        {/* Unit Top */}
                        <div className="d-flex align-items-center justify-content-between mb-2 pb-1.5 border-bottom border-secondary border-opacity-20">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-secondary bg-opacity-25 text-white font-monospace" style={{ fontSize: '10px' }}>
                              {f.id}
                            </span>
                            <span className="text-white fw-bold small">{f.name}</span>
                          </div>
                          <span className={`acms-status-chip ${isRunning ? 'green' : 'amber'}`} style={{ fontSize: '9px', padding: '2px 7px' }}>
                            {isRunning ? 'RUNNING' : 'STANDBY'}
                          </span>
                        </div>

                        {/* Animated Blower Center */}
                        <div className="d-flex flex-column align-items-center justify-content-center py-2">
                          <PressurizationFanIcon isRunning={isRunning} />
                          <span className="text-muted mt-1 font-monospace" style={{ fontSize: '10px' }}>
                            {f.shaft}
                          </span>
                        </div>

                        {/* 4 Telemetry Rows */}
                        <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-20 d-flex flex-column gap-1 my-2" style={{ fontSize: '10.5px' }}>
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="text-muted">Airflow:</span>
                            <strong className="text-white font-monospace">{f.flow}</strong>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="text-muted">Shaft ΔP:</span>
                            <strong className="text-success font-monospace">{f.dp}</strong>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="text-muted">Motor:</span>
                            <span className="text-cyan font-monospace">{f.rating}</span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="text-muted">Power Feed:</span>
                            <span className="text-success">{fanState.powerStatus}</span>
                          </div>
                        </div>
                      </div>

                      {/* Single Action Button */}
                      <button
                        type="button"
                        className={`acms-station-btn w-100 justify-content-center mt-2 ${isRunning ? 'active-running' : ''}`}
                        onClick={() => setPressurizationFans(prev => prev.map((item, i) => i === f.fanIndex ? { ...item, runStatus: isRunning ? 'STANDBY AUTO' : 'RUNNING' } : item))}
                      >
                        <Power size={11} /> {isRunning ? 'Stop Fan' : 'Start Fan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>


            {/* ── EXPANDED FULLSCREEN SCADA MODAL FOR AIR PRESSURIZATION (CLAUSE 3.h) ── */}
            <Modal
              show={expandedTab === 'pressurization'}
              onHide={() => setExpandedTab(null)}
              size="xl"
              centered
              dialogClassName="acms-fullscreen-scada-modal"
              contentClassName="acms-scada-modal-content"
            >
              <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="acms-banner-icon-badge cyan" style={{ width: '38px', height: '38px' }}>
                    <Wind size={20} />
                  </div>
                  <div>
            
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>
                      Multi-shaft positive pressure envelope (+50 Pa Staircase / +28 Pa Lobby), barometric relief modulation, and 5-fan run status telemetry.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="acms-supervision-pill cyan">
                    <span className="acms-dot-pulse-green"></span>
                    5 / 5 BLOWERS SUPERVISED
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-1 px-3"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setExpandedTab(null)}
                  >
                    <Minimize2 size={13} />
                    <span>Exit Expand View</span>
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="acms-modal-scada-layout">
                  {/* Left: Enlarged 2.5D Building Diagram */}
                  <div className="p-3 rounded" style={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-white small fw-bold d-flex align-items-center gap-1.5">
                        <Wind size={14} className="text-info" /> High-Resolution Multi-Core Pressurization Isometric Model
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small" style={{ fontSize: '11px' }}>
                          Cascade: <strong className="text-cyan font-monospace">Stair +50.2 Pa &gt; Lobby +28.5 Pa &gt; Corridor 0 Pa</strong>
                        </span>
                      </div>
                    </div>

                    <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '640px', display: 'block' }} fill="none">
                      <defs>
                        <linearGradient id="mPressWallGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1B263B" />
                          <stop offset="100%" stopColor="#0D1527" />
                        </linearGradient>
                        <linearGradient id="mPressShaftGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#0369A1" stopOpacity="0.45" />
                          <stop offset="50%" stopColor="#0284C7" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#0C4A6E" stopOpacity="0.45" />
                        </linearGradient>
                        <linearGradient id="mLiftShaftGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.8" />
                        </linearGradient>
                        <linearGradient id="mSmokeCloudGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#F97316" stopOpacity="0.75" />
                          <stop offset="60%" stopColor="#475569" stopOpacity="0.65" />
                          <stop offset="100%" stopColor="#1E293B" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Plant Room & Basement Foundation */}
                      <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                      <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                      {/* 3D Isometric Wall Facade */}
                      <polygon points="50,90 90,68 90,520 50,542" fill="url(#mPressWallGrad)" stroke="#334155" strokeWidth="1.2" />

                      {/* Front Interior Building Facade */}
                      <rect x="90" y="68" width="410" height="452" fill="#0A101D" stroke="#334155" strokeWidth="1.5" />

                      {/* 11 Floors (Roof down to Ground) */}
                      {[
                        { label: 'Roof', y: 68 },
                        { label: '10F', y: 108 },
                        { label: '9F', y: 148 },
                        { label: '8F', y: 188 },
                        { label: '7F', y: 228 },
                        { label: '6F', y: 268 },
                        { label: '5F', y: 308 },
                        { label: '4F', y: 348 },
                        { label: '3F', y: 388 },
                        { label: '2F', y: 428 },
                        { label: '1F', y: 468 },
                        { label: 'Ground', y: 508 }
                      ].map((fl) => (
                        <g key={`mpress-${fl.label}`}>
                          <line x1="90" y1={fl.y} x2="500" y2={fl.y} stroke="#1E293B" strokeWidth="1.5" />
                          <rect x="468" y={fl.y + 10} width="30" height="16" rx="2.5" fill="#0B1220" stroke="#334155" strokeWidth="0.8" />
                          <text x="483" y={fl.y + 21} fill="#64748B" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>
                        </g>
                      ))}

                      {/* ── CORE 1: FIRE ESCAPE STAIRCASE SHAFT (+50.2 Pa) ── */}
                      <g className="cursor-pointer" onClick={() => setExpandedPressShaft('stair')}>
                        <rect x="105" y="70" width="105" height="448" fill="url(#mPressShaftGrad)" stroke="#0284C7" strokeWidth="1.5" />
                        <line x1="105" y1="70" x2="105" y2="518" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="210" y1="70" x2="210" y2="518" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" />

                        {/* Animated Downward Positive Airflow Vectors */}
                        {[100, 150, 200, 250, 300, 350, 400, 450, 490].map(yPos => (
                          <g key={`mdown-arrow-${yPos}`} className="scada-airflow-flow">
                            <line x1="157" y1={yPos} x2="157" y2={yPos + 18} stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                            <polygon points={`153,${yPos + 16} 157,${yPos + 22} 161,${yPos + 16}`} fill="#38BDF8" />
                          </g>
                        ))}

                        {/* Staircase Steps Illustration */}
                        {[108, 148, 188, 228, 268, 308, 348, 388, 428, 468].map(sy => (
                          <path key={`mstair-step-${sy}`} d={`M115 ${sy + 28} L135 ${sy + 20} L135 ${sy + 10} L155 ${sy + 2} L175 ${sy + 10} L195 ${sy + 20}`} stroke="#334155" strokeWidth="1.5" fill="none" opacity="0.6" />
                        ))}

                        {/* Stair Core Callout Badge */}
                        <g transform="translate(108, 215)">
                          <rect x="0" y="0" width="100" height="42" rx="4" fill="#070D18" stroke="#06C7F5" strokeWidth="1.5" />
                          <circle cx="10" cy="14" r="3.5" fill="#10B981" />
                          <text x="20" y="16" fill="#FFFFFF" fontSize="8" fontWeight="bold">Staircase Core</text>
                          <text x="50" y="32" fill="#38BDF8" fontSize="12" fontWeight="black" fontFamily="monospace" textAnchor="middle">+50.2 Pa</text>
                        </g>
                      </g>

                      {/* ── CORE 2: LIFT HOISTWAY SHAFT (+48.2 Pa) ── */}
                      <g className="cursor-pointer" onClick={() => setExpandedPressShaft('lift')}>
                        <rect x="220" y="70" width="95" height="448" fill="url(#mLiftShaftGrad)" stroke="#1E40AF" strokeWidth="1.5" />

                        {/* Elevator Car at 6F */}
                        <rect x="230" y="275" width="75" height="48" rx="3" fill="#1E293B" stroke="#3B82F6" strokeWidth="1.5" />
                        <line x1="230" y1="299" x2="305" y2="299" stroke="#0284C7" strokeWidth="1" />
                        <text x="267" y="303" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle">CAR 01</text>
                        <line x1="267" y1="70" x2="267" y2="275" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 2" />

                        {/* Lift Hoistway Callout Badge */}
                        <g transform="translate(225, 140)">
                          <rect x="0" y="0" width="85" height="38" rx="4" fill="#070D18" stroke="#3B82F6" strokeWidth="1.2" />
                          <text x="42" y="14" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">Lift Hoistway</text>
                          <text x="42" y="30" fill="#60A5FA" fontSize="11" fontWeight="black" fontFamily="monospace" textAnchor="middle">+48.2 Pa</text>
                        </g>
                      </g>

                      {/* ── CORE 3: LIFT LOBBY SHAFT (+28.5 Pa) ── */}
                      <g className="cursor-pointer" onClick={() => setExpandedPressShaft('lobby')}>
                        <rect x="325" y="70" width="90" height="448" fill="url(#mPressShaftGrad)" stroke="#0284C7" strokeWidth="1.2" />

                        {/* Fire Doors separating Lobby from Corridor */}
                        {[108, 148, 188, 228, 268, 308, 348, 388, 428, 468].map(dy => (
                          <g key={`mdoor-${dy}`}>
                            <rect x="410" y={dy + 6} width="8" height="26" rx="1.5" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
                            <circle cx="414" cy={dy + 19} r="1.5" fill="#FFFFFF" />
                          </g>
                        ))}

                        {/* Lift Lobby Callout Badge */}
                        <g transform="translate(328, 335)">
                          <rect x="0" y="0" width="84" height="38" rx="4" fill="#070D18" stroke="#06C7F5" strokeWidth="1.2" />
                          <text x="42" y="14" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">Lift Lobby Core</text>
                          <text x="42" y="30" fill="#38BDF8" fontSize="11" fontWeight="black" fontFamily="monospace" textAnchor="middle">+28.5 Pa</text>
                        </g>
                      </g>

                      {/* ── CORRIDOR AREA WITH SIMULATED SMOKE BARRIER ── */}
                      <g>
                        <rect x="420" y="270" width="75" height="36" fill="url(#mSmokeCloudGrad)" />
                        <text x="455" y="284" fill="#F97316" fontSize="6.5" fontWeight="bold" textAnchor="middle">Simulated Smoke</text>
                        <text x="455" y="295" fill="#CBD5E1" fontSize="5.8" textAnchor="middle">Corridor 0 Pa</text>

                        {/* Pressure Curtain Blocking Arrow */}
                        <path d="M410 288 L385 288" stroke="#38BDF8" strokeWidth="2.5" />
                        <rect x="375" y="277" width="30" height="22" rx="2" fill="#070D18" stroke="#10B981" strokeWidth="0.8" />
                        <text x="390" y="287" fill="#10B981" fontSize="5.5" fontWeight="bold" textAnchor="middle">BLOCKED</text>
                        <text x="390" y="295" fill="#FFFFFF" fontSize="5" textAnchor="middle">BY +28Pa</text>
                      </g>

                      {/* ── ROOFTOP PRESSURIZATION FANS ── */}
                      {/* Rooftop SPF-01 */}
                      <g transform="translate(130, 20)">
                        <rect x="0" y="0" width="60" height="42" rx="4" fill="#0B1220" stroke="#0284C7" strokeWidth="1.5" />
                        <circle cx="30" cy="21" r="14" fill="#0369A1" stroke="#38BDF8" strokeWidth="1.2" />
                        <g className="scada-spin" style={{ transformOrigin: '30px 21px' }}>
                          <line x1="30" y1="9" x2="30" y2="33" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                          <line x1="18" y1="21" x2="42" y2="21" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                        </g>
                        <text x="30" y="10" fill="#38BDF8" fontSize="6" fontWeight="bold" textAnchor="middle">SPF-01</text>
                        <text x="30" y="38" fill="#10B981" fontSize="6" fontWeight="bold" textAnchor="middle">RUNNING</text>
                      </g>

                      {/* Rooftop LHF-01 */}
                      <g transform="translate(240, 20)">
                        <rect x="0" y="0" width="55" height="42" rx="4" fill="#0B1220" stroke="#1E40AF" strokeWidth="1.5" />
                        <circle cx="27" cy="21" r="14" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="1.2" />
                        <g className="scada-spin" style={{ transformOrigin: '27px 21px' }}>
                          <line x1="27" y1="9" x2="27" y2="33" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                          <line x1="15" y1="21" x2="39" y2="21" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                        </g>
                        <text x="27" y="10" fill="#60A5FA" fontSize="6" fontWeight="bold" textAnchor="middle">LHF-01</text>
                        <text x="27" y="38" fill="#10B981" fontSize="6" fontWeight="bold" textAnchor="middle">RUNNING</text>
                      </g>

                      {/* Rooftop LLF-01 */}
                      <g transform="translate(340, 20)">
                        <rect x="0" y="0" width="55" height="42" rx="4" fill="#0B1220" stroke="#0284C7" strokeWidth="1.5" />
                        <circle cx="27" cy="21" r="14" fill="#0369A1" stroke="#38BDF8" strokeWidth="1.2" />
                        <g className="scada-spin" style={{ transformOrigin: '27px 21px' }}>
                          <line x1="27" y1="9" x2="27" y2="33" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                          <line x1="15" y1="21" x2="39" y2="21" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
                        </g>
                        <text x="27" y="10" fill="#38BDF8" fontSize="6" fontWeight="bold" textAnchor="middle">LLF-01</text>
                        <text x="27" y="38" fill="#10B981" fontSize="6" fontWeight="bold" textAnchor="middle">RUNNING</text>
                      </g>

                      {/* ── BASEMENT PRESSURIZATION FANS ── */}
                      {/* Basement SPF-02 */}
                      <g transform="translate(130, 560)">
                        <rect x="0" y="0" width="60" height="45" rx="4" fill="#0B1220" stroke="#334155" strokeWidth="1.2" />
                        <circle cx="30" cy="22" r="14" fill="#1E293B" stroke="#64748B" strokeWidth="1" />
                        <text x="30" y="10" fill="#94A3B8" fontSize="6.5" fontWeight="bold" textAnchor="middle">SPF-02</text>
                        <text x="30" y="40" fill="#F59E0B" fontSize="6" fontWeight="bold" textAnchor="middle">STANDBY</text>
                      </g>

                      {/* Basement LLF-02 */}
                      <g transform="translate(340, 560)">
                        <rect x="0" y="0" width="55" height="45" rx="4" fill="#0B1220" stroke="#334155" strokeWidth="1.2" />
                        <circle cx="27" cy="22" r="14" fill="#1E293B" stroke="#64748B" strokeWidth="1" />
                        <text x="27" y="10" fill="#94A3B8" fontSize="6.5" fontWeight="bold" textAnchor="middle">LLF-02</text>
                        <text x="27" y="40" fill="#F59E0B" fontSize="6" fontWeight="bold" textAnchor="middle">STANDBY</text>
                      </g>
                    </svg>
                  </div>

                  {/* Right: Shaft Matrix & 5-Fan Checklist */}
                  <div className="d-flex flex-column gap-3">
                    {/* Shaft Selector Module */}
                    <div className="acms-modal-inspector-card">
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <Wind size={14} className="text-info" /> Shaft Diagnostics ({expandedPressShaft === 'stair' ? 'Staircase Core' : expandedPressShaft === 'lobby' ? 'Lift Lobby Core' : 'Lift Hoistway'})
                        </span>
                        <span className="badge bg-success bg-opacity-25 text-success" style={{ fontSize: '10px' }}>
                          Supervised Normal
                        </span>
                      </div>

                      <div className="d-flex gap-1.5">
                        <button
                          type="button"
                          className={`btn btn-sm flex-fill fw-bold ${expandedPressShaft === 'stair' ? 'btn-info text-dark' : 'btn-outline-secondary'}`}
                          style={{ fontSize: '10px', borderRadius: '5px' }}
                          onClick={() => setExpandedPressShaft('stair')}
                        >
                          Stair (+50 Pa)
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm flex-fill fw-bold ${expandedPressShaft === 'lobby' ? 'btn-info text-dark' : 'btn-outline-secondary'}`}
                          style={{ fontSize: '10px', borderRadius: '5px' }}
                          onClick={() => setExpandedPressShaft('lobby')}
                        >
                          Lobby (+28 Pa)
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm flex-fill fw-bold ${expandedPressShaft === 'lift' ? 'btn-info text-dark' : 'btn-outline-secondary'}`}
                          style={{ fontSize: '10px', borderRadius: '5px' }}
                          onClick={() => setExpandedPressShaft('lift')}
                        >
                          Hoistway (+48 Pa)
                        </button>
                      </div>

                      <div className="p-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="row g-2" style={{ fontSize: '11px' }}>
                          <div className="col-6">
                            <span className="text-muted">Differential Pressure:</span>
                            <div className="fw-bold text-cyan font-monospace">
                              {expandedPressShaft === 'stair' ? '+50.2 Pa' : expandedPressShaft === 'lobby' ? '+28.5 Pa' : '+48.2 Pa'}
                            </div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Assigned Blower Fans:</span>
                            <div className="fw-bold text-white">
                              {expandedPressShaft === 'stair' ? 'SPF-01 & SPF-02' : expandedPressShaft === 'lobby' ? 'LLF-01 & LLF-02' : 'LHF-01 Rooftop'}
                            </div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Door Opening Force:</span>
                            <div className="fw-bold text-success font-monospace">68 N (&lt; 100 N NBC Limit)</div>
                          </div>
                          <div className="col-6">
                            <span className="text-muted">Relief Damper Modulation:</span>
                            <div className="fw-bold text-info">15% Open (Auto-Balancing)</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Clause 3 (h) 5 Fans Monitored Checklist */}
                    <div className="acms-modal-inspector-card">
                      

                      <div className="d-flex flex-column gap-2">
                        {[
                          { num: '1', title: 'Staircase Pressurization Fans (SPF-01 & SPF-02)', val: 'SPF-01 RUN / SPF-02 AUTO', state: 'success', desc: 'Maintains 50 Pa positive air pressure throughout fire escape staircases to prevent smoke entry.' },
                          { num: '2', title: 'Lift Lobby Pressurization Fans (LLF-01 & LLF-02)', val: 'LLF-01 RUN / LLF-02 AUTO', state: 'success', desc: 'Maintains 28-30 Pa positive air curtain in elevator lobbies across all floors.' },
                          { num: '3', title: 'Lift Hoistway Pressurization Fan (LHF-01)', val: 'RUNNING (48.2 Pa)', state: 'info', desc: 'Prevents vertical piston and chimney smoke stack effect in elevator shafts.' },
                          { num: '4', title: 'Pressure Cascade & Barometric Relief Dampers', val: 'Balanced & Modulating', state: 'success', desc: 'Prevents over-pressurization above 55 Pa ensuring doors can be easily opened by occupants during egress.' },
                        ].map(chk => (
                          <div key={chk.num} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px' }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-secondary bg-opacity-25 text-white" style={{ fontSize: '9.5px', width: '20px' }}>{chk.num}</span>
                                <span className="text-white fw-bold">{chk.title}</span>
                              </div>
                              <span className={`badge bg-${chk.state} bg-opacity-25 text-${chk.state}`} style={{ fontSize: '10px' }}>
                                {chk.val}
                              </span>
                            </div>
                            <div className="text-muted" style={{ fontSize: '10.5px', paddingLeft: '28px' }}>
                              {chk.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  Stair Core: <strong className="text-cyan font-monospace">+50.2 Pa</strong> • Lobby: <strong className="text-info font-monospace">+28.5 Pa</strong> • Smoke Mode: <strong className={isEmergencyPressurizing ? "text-warning" : "text-white"}>{isEmergencyPressurizing ? "ACTIVE (ALL FANS ON)" : "STANDBY AUTO"}</strong>
                </span>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className={`btn btn-sm px-3 py-1 ${isEmergencyPressurizing ? 'btn-warning text-dark' : 'btn-outline-danger'}`}
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => {
                      const nextState = !isEmergencyPressurizing;
                      setIsEmergencyPressurizing(nextState);
                      setPressurizationFans(prev => prev.map(f => ({ ...f, runStatus: nextState ? 'RUNNING' : 'STANDBY AUTO' })));
                    }}
                  >
                    {isEmergencyPressurizing ? 'Stop Smoke Test' : 'Test Smoke Mode'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary px-3 py-1"
                    style={{ fontSize: '11.5px', borderRadius: '6px' }}
                    onClick={() => setExpandedTab(null)}
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            </Modal>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PRESSURE TREND MODAL ── */}
      <Modal show={showGraphModal} onHide={() => setShowGraphModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ background: '#111A2B', color: '#FFF', borderColor: 'rgba(255,255,255,0.1)' }}>
          <Modal.Title className="fw-bold fs-5">{graphConfig.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#0B1220' }}>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphConfig.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pressureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={graphConfig.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={graphConfig.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="time" stroke="#64748B" />
                <YAxis domain={['auto', 'auto']} unit=" kg/cm²" stroke="#64748B" />
                <RechartsTooltip contentStyle={{ background: '#111A2B', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF' }} />
                <Area type="monotone" dataKey="value" stroke={graphConfig.color} strokeWidth={2.5} fillOpacity={1} fill="url(#pressureGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ background: '#111A2B', borderColor: 'rgba(255,255,255,0.1)' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowGraphModal(false)}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FireOverview;
