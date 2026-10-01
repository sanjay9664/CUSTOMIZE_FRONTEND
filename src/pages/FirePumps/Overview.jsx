import React, { useState, useEffect } from 'react';
import { Row, Col, Modal, ProgressBar } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert, Flame, Droplets, Activity, Clock, FileText, CheckCircle2, AlertOctagon,
  ShieldCheck, Zap, Volume2, Wind, Server, Power, Gauge, RefreshCw, Layers, Sliders,
  AlertTriangle, Play, ChevronDown, ChevronUp, Battery, Thermometer, Radio, Cpu,
  Check, ArrowDown, ArrowUp, BarChart3, Database, Shield, RadioTower, Sparkles,
  SlidersVertical, Maximize2, Minimize2, RotateCcw
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

// 3D Isometric / Cylindrical Water Tank Visualization for Tank Cards
const TankCylinderVisual = ({ capacity = 300, current = '265.5 kL', percentage = 88.5, maxVal = 300, color = '#06C7F5' }) => (
  <div className="acms-tank-preview-box">
    <svg width="125" height="96" viewBox="0 0 125 96" fill="none">
      <defs>
        <linearGradient id={`tankGrad-${color.replace('#','')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0B1220" />
          <stop offset="30%" stopColor={color} stopOpacity="0.45" />
          <stop offset="70%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="tankRimGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>
      {/* Tank Body Shell */}
      <rect x="26" y="20" width="72" height="62" rx="4" fill="#0B1220" stroke="#334155" strokeWidth="1.5" />
      {/* Water Fill */}
      {(() => {
        const fillHeight = Math.min(58, (percentage / 100) * 58);
        const fillY = 20 + (62 - fillHeight);
        return (
          <g>
            <rect x="27" y={fillY} width="70" height={fillHeight} fill={`url(#tankGrad-${color.replace('#','')})`} />
            <ellipse cx="62" cy={fillY} rx="35" ry="6.5" fill={color} fillOpacity="0.85" />
          </g>
        );
      })()}
      {/* Volume Graduations */}
      <line x1="18" y1="22" x2="25" y2="22" stroke="#64748B" strokeWidth="1.5" />
      <text x="14" y="25" fill="#94A3B8" fontSize="7.5" fontWeight="bold" textAnchor="end">{maxVal}</text>
      <line x1="20" y1="51" x2="25" y2="51" stroke="#64748B" strokeWidth="1" />
      <text x="14" y="54" fill="#94A3B8" fontSize="7.5" fontWeight="bold" textAnchor="end">{Math.round(maxVal / 2)}</text>
      <line x1="18" y1="80" x2="25" y2="80" stroke="#64748B" strokeWidth="1.5" />
      <text x="14" y="83" fill="#94A3B8" fontSize="7.5" fontWeight="bold" textAnchor="end">0</text>
      {/* Rims */}
      <ellipse cx="62" cy="20" rx="36" ry="7.5" fill="url(#tankRimGrad)" stroke="#475569" strokeWidth="1.5" />
      <ellipse cx="62" cy="82" rx="36" ry="7.5" fill="none" stroke="#334155" strokeWidth="1.5" />
      {/* Percentage Tag */}
      <rect x="44" y="3" width="38" height="15" rx="3" fill="#070D18" stroke={color} strokeWidth="1" />
      <text x="63" y="14" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" textAnchor="middle">{percentage}%</text>
    </svg>
  </div>
);

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
  const initialTab = searchParams.get('tab') || 'hydrant';
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
    { key: 'hydrant', label: '(b) Hydrant System', count: '9 Items', icon: Flame, theme: 'red' },
    { key: 'tanks', label: '(c) Fire Water Tanks', count: '2 Items', icon: Droplets, theme: 'blue' },
    { key: 'sprinkler', label: '(d) Sprinkler', count: '3 Items', icon: Gauge, theme: 'cyan' },
    { key: 'detection', label: '(e) Detection System', count: '3 Items', icon: ShieldAlert, theme: 'red' },
    { key: 'mcp', label: '(f) Manual Call Points (MCP)', count: null, icon: Radio, theme: 'red' },
    { key: 'pa', label: '(g) Public Address System (PA)', count: null, icon: Volume2, theme: 'purple' },
    { key: 'pressurization', label: '(h) Air Pressurization', count: null, icon: Wind, theme: 'cyan' }
  ];

  return (
    <div className="acms-main p-3 p-md-4">
      {/* ── TOP KPI HEALTH CHIPS & HEADER ── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div className="acms-health-chips-bar">
          <div className="acms-kpi-chip">
            <Shield size={14} className="text-danger" />
            <span>SYSTEM HEALTH:</span>
            <strong className="text-success d-inline-flex align-items-center gap-1.5">
              <span className="acms-dot-pulse-green"></span>
              {systemHealth.status}
            </strong>
          </div>
          <div className="acms-kpi-chip">
            <Cpu size={14} className="text-primary" />
            <span>ACTIVE EQUIPMENT:</span>
            <strong>{systemHealth.activeEquipment}</strong>
          </div>
          <div className="acms-kpi-chip">
            <Radio size={14} className="text-cyan" style={{ color: '#06C7F5' }} />
            <span>SENSORS ONLINE:</span>
            <strong style={{ color: '#06C7F5' }}>{systemHealth.sensorsOnline}</strong>
          </div>
          <div className="acms-kpi-chip">
            <AlertTriangle size={14} className="text-muted" />
            <span>ACTIVE ALARMS:</span>
            <strong className="text-success">{systemHealth.activeAlarms}</strong>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 text-muted small" style={{ fontSize: '11.5px' }}>
          <Clock size={13} className="text-primary" />
          <span>Telemetry Clock: <strong className="text-white font-monospace">{currentTime}</strong></span>
        </div>
      </div>

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
                <Icon size={15} />
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
            {/* Clause (a) Top Banner */}
            <div className="acms-clause-banner mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3.5 z-2 position-relative">
                <div className="acms-banner-icon-badge">
                  <Layers size={26} />
                </div>
                <div>
                  <h4 className="fw-black mb-1 text-white" style={{ letterSpacing: '-0.01em' }}>
                    Clause (a) System Status Monitoring
                  </h4>
                  <div className="text-muted" style={{ fontSize: '12px', maxWidth: '820px', lineHeight: '1.45' }}>
                    To ensure real-time 24x7 basis physical checking to know the status of each system reported & displayed on Central IoT software. Status transmitted to <strong>Occupier</strong>, <strong>Installer</strong> & <strong>Service Provider</strong>. Verified condition: On/Off, Working / Not Working & Health condition across all plant sections.
                  </div>
                </div>
              </div>
              <span className="acms-supervision-pill">
                <span className="acms-dot-pulse-green"></span>
                ALL 8 SUBSYSTEMS ONLINE & SUPERVISED
              </span>
              <BannerBackdropIllustration color="#EF3340" />
            </div>

            {/* Stakeholder Supervised Telemetry Dispatch Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="acms-scada-card border-red-glow p-3" style={{ minHeight: 'auto' }}>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted small fw-bold text-uppercase">1. Occupier Monitoring</span>
                    <span className="acms-status-chip running" style={{ padding: '2px 8px', fontSize: '10px' }}>
                      <span className="acms-dot-pulse-green"></span> CONNECTED
                    </span>
                  </div>
                  <div className="fw-bold text-white small">Building Fire Safety Cockpit</div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>Real-time physical health & on/off alert broadcast active</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="acms-scada-card border-cyan-glow p-3" style={{ minHeight: 'auto' }}>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted small fw-bold text-uppercase">2. Installer Master Station</span>
                    <span className="acms-status-chip running" style={{ padding: '2px 8px', fontSize: '10px' }}>
                      <span className="acms-dot-pulse-green"></span> 24x7 SUPERVISED
                    </span>
                  </div>
                  <div className="fw-bold text-white small">Commissioning & Loop Health Hub</div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>1016 Addressable points & riser sensors verified</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="acms-scada-card border-purple-glow p-3" style={{ minHeight: 'auto' }}>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted small fw-bold text-uppercase">3. Service-Provider NOC</span>
                    <span className="acms-status-chip running" style={{ padding: '2px 8px', fontSize: '10px' }}>
                      <span className="acms-dot-pulse-green"></span> ACTIVE NOC
                    </span>
                  </div>
                  <div className="fw-bold text-white small">Preventive AMC & SLA Management</div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>Auto-dispatch telemetry on low pressure or pump trips</div>
                </div>
              </div>
            </div>

            {/* 7 All-Subsystem Interactive SCADA Cards (b to h) */}
            <div className="acms-grid-container mb-4">
              {/* (b) Hydrant */}
              <div className="acms-scada-card border-red-glow" role="button" onClick={() => handleTabChange('hydrant')}>
                <div className="acms-card-top-row">
                  <span className="acms-clause-badge red">(b) Hydrant</span>
                  <div className="acms-card-header-right">
                    <RedPumpIcon isRunning={hydrantItems.mainPump.runStatus === 'RUNNING'} />
                    <span className="acms-status-chip running">9 / 9 Items</span>
                  </div>
                </div>
                <div className="acms-card-title">Hydrant Riser Line Pressure</div>
                <div className="h2 fw-black text-danger mb-1 font-monospace">
                  {hydrantItems.riserPressure.currentPressure}
                </div>
                <div className="text-muted small">
                  Auto Cut-in: 6.0 kg/cm² • Main Pump: <strong className="text-success">{hydrantItems.mainPump.runStatus}</strong>
                </div>
                <div className="acms-footer-pill mt-3">Open (b) Hydrant System (9 Items) ➔</div>
              </div>

              {/* (c) Fire Water Tanks */}
              <div className="acms-scada-card border-blue-glow" role="button" onClick={() => handleTabChange('tanks')}>
                <div className="acms-card-top-row">
                  <span className="acms-clause-badge blue">(c) Fire Water Tanks</span>
                  <div className="acms-card-header-right">
                    <UGSumpIcon />
                    <span className="acms-status-chip running">2 / 2 Tanks</span>
                  </div>
                </div>
                <div className="acms-card-title">Underground & Overhead Sump</div>
                <div className="h2 fw-black text-primary mb-1 font-monospace">
                  {tankItems.ugTank.currentKl} <span className="fs-6 text-muted">({tankItems.ugTank.percentage}%)</span>
                </div>
                <div className="text-muted small">
                  UG Reserve: {tankItems.ugTank.capacityKl} • OHT Reserve: {tankItems.ohtTank.capacityKl}
                </div>
                <div className="acms-footer-pill mt-3">Open (c) Fire Water Tanks (2 Items) ➔</div>
              </div>

              {/* (d) Sprinkler System */}
              <div className="acms-scada-card border-cyan-glow" role="button" onClick={() => handleTabChange('sprinkler')}>
                <div className="acms-card-top-row">
                  <span className="acms-clause-badge cyan">(d) Sprinkler</span>
                  <div className="acms-card-header-right">
                    <SprinklerPumpIcon isRunning={sprinklerItems.mainPump.runStatus === 'RUNNING'} />
                    <span className="acms-status-chip running">3 / 3 Items</span>
                  </div>
                </div>
                <div className="acms-card-title">Sprinkler Header Pressure</div>
                <div className="h2 fw-black text-cyan mb-1 font-monospace" style={{ color: '#06C7F5' }}>
                  {sprinklerItems.riserPressure.currentPressure}
                </div>
                <div className="text-muted small">
                  Auto Cut-in: 7.5 kg/cm² • Pump Power: <strong className="text-success">{sprinklerItems.powerMainPump.powerStatus}</strong>
                </div>
                <div className="acms-footer-pill mt-3">Open (d) Sprinkler System (3 Items) ➔</div>
              </div>

              {/* (e) Detection System */}
              <div className="acms-scada-card border-red-glow" role="button" onClick={() => handleTabChange('detection')}>
                <div className="acms-card-top-row">
                  <span className="acms-clause-badge red">(e) Detection System</span>
                  <div className="acms-card-header-right">
                    <FacpPanelIcon />
                    <span className="acms-status-chip running">3 / 3 Items</span>
                  </div>
                </div>
                <div className="acms-card-title">FACP Fire Panel & Battery</div>
                <div className="h2 fw-black text-success mb-1 font-monospace">
                  NORMAL <span className="fs-6 text-muted">(0 Alarms)</span>
                </div>
                <div className="text-muted small">
                  Panel: <strong className="text-success">ON</strong> • Batt: <strong>27.4V DC</strong> • 3 Repeaters: <strong>WORKING</strong>
                </div>
                <div className="acms-footer-pill mt-3">Open (e) Detection & Panels (3 Items) ➔</div>
              </div>

              {/* (f) Manual Call Points */}
              <div className="acms-scada-card border-red-glow" role="button" onClick={() => handleTabChange('mcp')}>
                <div className="acms-card-top-row">
                  <span className="acms-clause-badge red">(f) Manual Call Points</span>
                  <div className="acms-card-header-right">
                    <AlertOctagon size={28} className="text-danger" />
                    <span className="acms-status-chip running">42 Units ON</span>
                  </div>
                </div>
                <div className="acms-card-title">MCP Operating Status</div>
                <div className="h2 fw-black text-success mb-1 font-monospace">
                  NORMAL <span className="fs-6 text-muted">(0 Triggered)</span>
                </div>
                <div className="text-muted small">
                  Operating Status: <strong className="text-success">ON</strong> • Break Glass Supervised
                </div>
                <div className="acms-footer-pill mt-3">Open (f) Manual Call Points (MCP) ➔</div>
              </div>

              {/* (g) Public Address System */}
              <div className="acms-scada-card border-purple-glow" role="button" onClick={() => handleTabChange('pa')}>
                <div className="acms-card-top-row">
                  <span className="acms-clause-badge purple">(g) Public Address</span>
                  <div className="acms-card-header-right">
                    <PaAmpIcon />
                    <span className="acms-status-chip running">4 Zones</span>
                  </div>
                </div>
                <div className="acms-card-title">PA 4-Zone Voice Evacuation</div>
                <div className="h2 fw-black text-purple mb-1 font-monospace" style={{ color: '#A855F7' }}>
                  WORKING <span className="fs-6 text-muted">(4 Amps)</span>
                </div>
                <div className="text-muted small">
                  Emergency Mic: <strong className="text-success">WORKING</strong> • 4x 500W Amps Ready
                </div>
                <div className="acms-footer-pill mt-3">Open (g) Public Address System (PA) ➔</div>
              </div>

              {/* (h) Air Pressurization */}
              <div className="acms-scada-card border-cyan-glow" role="button" onClick={() => handleTabChange('pressurization')}>
                <div className="acms-card-top-row">
                  <span className="acms-clause-badge cyan">(h) Air Pressurization</span>
                  <div className="acms-card-header-right">
                    <PressurizationFanIcon isRunning={false} />
                    <span className="acms-status-chip running">5 Fans</span>
                  </div>
                </div>
                <div className="acms-card-title">Exits, Lobbies & Hoistways</div>
                <div className="h2 fw-black text-cyan mb-1 font-monospace" style={{ color: '#06C7F5' }}>
                  AUTO <span className="fs-6 text-muted">(50 Pa Supervised)</span>
                </div>
                <div className="text-muted small">
                  2 Staircase Fans • 2 Lobby Fans • 1 Hoistway Fan
                </div>
                <div className="acms-footer-pill mt-3">Open (h) Air Pressurization ➔</div>
              </div>
            </div>

            {/* 24x7 Real-Time Physical Verification Master Matrix (Clause 3.a) */}
            <div className="acms-scada-card p-3 p-md-4 mb-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle2 size={18} className="text-success" />
                  <h6 className="fw-bold text-white mb-0">
                    24x7 Physical Checking & Condition Verification Matrix (Clause 3.a)
                  </h6>
                </div>
                <span className="text-muted small" style={{ fontSize: '11.5px' }}>
                  Occupier, Installer & Service-Provider Synced
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0" style={{ fontSize: '12.5px', background: 'transparent' }}>
                  <thead>
                    <tr style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                      <th>Clause</th>
                      <th>Head / Section</th>
                      <th>Items Monitored</th>
                      <th>Operating State</th>
                      <th>Physical Checking Health</th>
                      <th>Supervision Transmitted To</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <td><span className="acms-clause-badge red small">(b)</span></td>
                      <td className="fw-semibold text-white">Hydrant System</td>
                      <td>9 Parameters (Pumps, Diesel, Pressures, Powers)</td>
                      <td><span className="badge bg-success">RUN / STANDBY AUTO</span></td>
                      <td><span className="text-success fw-bold">✓ HEALTHY (7.52 kg/cm²)</span></td>
                      <td className="text-muted">Occupier • Installer • Service Provider</td>
                    </tr>
                    <tr style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <td><span className="acms-clause-badge blue small">(c)</span></td>
                      <td className="fw-semibold text-white">Fire Water Tanks</td>
                      <td>2 Tanks (UG Concrete Sump & Rooftop OHT)</td>
                      <td><span className="badge bg-primary">MONITORED</span></td>
                      <td><span className="text-success fw-bold">✓ HEALTHY (265.5 kL & 46 kL)</span></td>
                      <td className="text-muted">Occupier • Installer • Service Provider</td>
                    </tr>
                    <tr style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <td><span className="acms-clause-badge cyan small">(d)</span></td>
                      <td className="fw-semibold text-white">Sprinkler System</td>
                      <td>3 Items (Pump, Power Feeder, Header Pressure)</td>
                      <td><span className="badge bg-info text-dark">STANDBY AUTO</span></td>
                      <td><span className="text-success fw-bold">✓ HEALTHY (9.41 kg/cm²)</span></td>
                      <td className="text-muted">Occupier • Installer • Service Provider</td>
                    </tr>
                    <tr style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <td><span className="acms-clause-badge red small">(e)</span></td>
                      <td className="fw-semibold text-white">Detection System</td>
                      <td>3 Items (Fire Panel, 3 Repeaters, Battery 27.4V)</td>
                      <td><span className="badge bg-success">ON / WORKING</span></td>
                      <td><span className="text-success fw-bold">✓ HEALTHY (0 Alarms)</span></td>
                      <td className="text-muted">Occupier • Installer • Service Provider</td>
                    </tr>
                    <tr style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <td><span className="acms-clause-badge red small">(f)</span></td>
                      <td className="fw-semibold text-white">Manual Call Points (MCP)</td>
                      <td>42 Supervised Break Glass Stations</td>
                      <td><span className="badge bg-success">ON</span></td>
                      <td><span className="text-success fw-bold">✓ NORMAL (0 Triggered)</span></td>
                      <td className="text-muted">Occupier • Installer • Service Provider</td>
                    </tr>
                    <tr style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <td><span className="acms-clause-badge purple small">(g)</span></td>
                      <td className="fw-semibold text-white">Public Address System (PA)</td>
                      <td>4 Monitored Zones, Mic & 4x 500W Amps</td>
                      <td><span className="badge bg-purple" style={{ background: '#6D5CE7' }}>WORKING</span></td>
                      <td><span className="text-success fw-bold">✓ HEALTHY (Line Return Supervised)</span></td>
                      <td className="text-muted">Occupier • Installer • Service Provider</td>
                    </tr>
                    <tr style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <td><span className="acms-clause-badge cyan small">(h)</span></td>
                      <td className="fw-semibold text-white">Air Pressurization</td>
                      <td>5 Fans (Exits, Lift Lobbies, Hoistways)</td>
                      <td><span className="badge bg-info text-dark">STANDBY AUTO / ON</span></td>
                      <td><span className="text-success fw-bold">✓ HEALTHY (ΔP 50 Pa Supervised)</span></td>
                      <td className="text-muted">Occupier • Installer • Service Provider</td>
                    </tr>
                  </tbody>
                </table>
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
            {/* ── Clause 3 (b) Page Header ── */}
            <div className="acms-clause-banner mb-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3 z-2 position-relative">
                <div className="acms-banner-icon-badge">
                  <Flame size={26} />
                </div>
                <div>
                  <h4 className="fw-black mb-1 text-white" style={{ letterSpacing: '-0.01em' }}>
                    Clause 3 (b) Hydrant Subsystem
                  </h4>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    All 9 specified monitored parameters with real-time status, run status, power status and telemetry.
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column align-items-end z-2 position-relative">
                <span className="acms-supervision-pill danger mb-1">
                  <span className="acms-dot-pulse-red"></span>
                  9 / 9 ITEMS SUPERVISED
                </span>
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  <span className="text-success fw-bold">● System Online</span> | Last Updated: {currentTime}
                </span>
              </div>
              <BannerBackdropIllustration color="#EF3340" />
            </div>

            {/* ── 3-Column Interactive Layout ── */}
            <div className="acms-hydrant-layout">
              {/* ────────────────────────────────────────────────────────
                  LEFT COLUMN: Compact Navigation List of All 9 Items
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-hydrant-nav-card">
                <div className="d-flex align-items-center justify-content-between px-2 py-1 mb-1 border-bottom border-secondary border-opacity-25">
                  <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: '10.5px', letterSpacing: '0.04em' }}>
                    Clause 3(b) Items
                  </span>
                  <span className="badge bg-danger bg-opacity-25 text-danger" style={{ fontSize: '9.5px' }}>
                    9 Parameters
                  </span>
                </div>

                {[
                  { id: 1, num: '01', icon: '🔥', label: 'Main Hydrant Pump', status: hydrantItems.mainPump.runStatus, theme: hydrantItems.mainPump.runStatus === 'RUNNING' ? 'running' : 'stopped' },
                  { id: 2, num: '02', icon: '⚙', label: 'Standby Pump', status: hydrantItems.standbyPump.runStatus === 'RUNNING' ? 'RUNNING' : 'STANDBY AUTO', theme: 'standby' },
                  { id: 3, num: '03', icon: '🛢', label: 'Diesel Tank Level', status: `${hydrantItems.dieselTank.percentage}%`, theme: 'cyan' },
                  { id: 4, num: '04', icon: '⚡', label: 'Power to Main Pump', status: hydrantItems.powerMainPump.powerStatus, theme: hydrantItems.powerMainPump.powerStatus === 'POWER ON' ? 'power-on' : 'power-off' },
                  { id: 5, num: '05', icon: '📊', label: 'Riser Low Pressure', status: `${livePressure} kg/cm²`, theme: 'pressure' },
                  { id: 6, num: '06', icon: '🔄', label: 'Jockey Pump', status: hydrantItems.jockeyPump.runStatus === 'RUNNING' ? 'RUNNING' : 'STANDBY AUTO', theme: 'standby' },
                  { id: 7, num: '07', icon: '⚡', label: 'Power to Jockey Pump', status: hydrantItems.powerJockeyPump.powerStatus, theme: hydrantItems.powerJockeyPump.powerStatus === 'POWER ON' ? 'power-on' : 'power-off' },
                  { id: 8, num: '08', icon: '🔥', label: 'Booster Pump', status: hydrantItems.boosterPump.runStatus === 'RUNNING' ? 'RUNNING' : 'STANDBY AUTO', theme: hydrantItems.boosterPump.runStatus === 'RUNNING' ? 'running' : 'standby' },
                  { id: 9, num: '09', icon: '⚡', label: 'Power to Booster Pump', status: hydrantItems.powerBoosterPump.powerStatus, theme: hydrantItems.powerBoosterPump.powerStatus === 'POWER ON' ? 'power-on' : 'power-off' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={`acms-hydrant-nav-item ${selectedHydrantItem === item.id ? 'active' : ''}`}
                    onClick={() => setSelectedHydrantItem(item.id)}
                  >
                    <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, overflow: 'hidden' }}>
                      <span className="acms-hydrant-item-num">{item.num}</span>
                      <span style={{ fontSize: '13px', flexShrink: 0 }}>{item.icon}</span>
                      <span className="fw-semibold text-white text-truncate" style={{ fontSize: '11px', whiteSpace: 'nowrap' }} title={item.label}>
                        {item.label}
                      </span>
                    </div>
                    <span className={`acms-status-chip ${item.theme}`}>
                      {item.status}
                    </span>
                  </button>
                ))}

                {/* Redesigned Pipeline Water Flow Card with Breathing Room */}
                <div className="p-3 mt-2 rounded-3" style={{ background: 'linear-gradient(180deg, rgba(6, 199, 245, 0.08) 0%, rgba(15, 23, 42, 0.75) 100%)', border: '1px solid rgba(6, 199, 245, 0.25)' }}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-white fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: '11.5px' }}>
                      <Droplets size={13} className="text-info" /> Pipeline Water Flow
                    </span>
                    <span className={`acms-status-chip ${hydrantItems.mainPump.runStatus === 'RUNNING' ? 'running' : 'stopped'}`} style={{ fontSize: '9px', padding: '2px 7px' }}>
                      {hydrantItems.mainPump.runStatus === 'RUNNING' ? 'ACTIVE FLOW' : 'IDLE / STATIC'}
                    </span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between text-muted mb-1.5" style={{ fontSize: '11px' }}>
                    <span>Discharge Rate:</span>
                    <strong className="text-cyan font-monospace fs-6">
                      {hydrantItems.mainPump.runStatus === 'RUNNING' ? `${liveFlow} LPM` : '0 LPM'}
                    </strong>
                  </div>

                  <div className="progress rounded-pill bg-dark mb-2" style={{ height: '7px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div
                      className={`progress-bar ${hydrantItems.mainPump.runStatus === 'RUNNING' ? 'bg-info progress-bar-striped progress-bar-animated' : 'bg-secondary'}`}
                      style={{ width: hydrantItems.mainPump.runStatus === 'RUNNING' ? '82%' : '0%' }}
                    />
                  </div>

                  <div className="d-flex align-items-center justify-content-between text-muted pt-1 border-top border-secondary border-opacity-25" style={{ fontSize: '10px' }}>
                    <span>Motor Speed: <strong className="text-white font-monospace">{hydrantItems.mainPump.runStatus === 'RUNNING' ? '1,480 RPM' : '0 RPM'}</strong></span>
                    <span>Line: <strong className="text-success">PRESSURIZED</strong></span>
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  CENTER COLUMN: High-Definition 2.5D Isometric Building SCADA
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-building-card">
                {/* Visual Flow Breadcrumb Header & Expand View Trigger */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                  <div className="d-flex align-items-center gap-1.5 text-muted small" style={{ fontSize: '11px' }}>
                    <Droplets size={13} className="text-info" />
                    <span>Flow:</span>
                    <span className="text-white fw-bold">UG Tank</span>
                    <span>→</span>
                    <span className="text-danger fw-bold">Pump</span>
                    <span>→</span>
                    <span className="text-cyan fw-bold">Riser</span>
                    <span>→</span>
                    <span className="text-white fw-bold">Floors (1F–10F)</span>
                    <span>→</span>
                    <span className="text-danger fw-bold">Hydrants</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-0.5 px-2"
                      style={{ fontSize: '11px', borderRadius: '5px', backdropFilter: 'blur(4px)' }}
                      onClick={() => setIsBuildingExpanded(true)}
                      title="Open Fullscreen SCADA Architecture & Diagnostics"
                    >
                      <Maximize2 size={12} />
                      <span className="fw-bold">Expand View</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0.5 px-2"
                      style={{ fontSize: '10.5px', borderRadius: '5px' }}
                      onClick={() => { setSelectedHydrantItem(1); setSelectedFloor(null); }}
                    >
                      Reset Focus
                    </button>
                  </div>
                </div>

                {/* Interactive Floor Popover */}
                {selectedFloor && (
                  <div className="acms-floor-popup">
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <strong className="text-white small d-flex align-items-center gap-1.5">
                        <Flame size={13} className="text-danger" /> {selectedFloor} Hydrant Point
                      </strong>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        style={{ width: '8px', height: '8px' }}
                        onClick={() => setSelectedFloor(null)}
                      />
                    </div>
                    <div className="text-muted small" style={{ fontSize: '11px' }}>
                      <div>Status: <strong className="text-success">NORMAL (Supervised)</strong></div>
                      <div>Riser Pressure: <strong className="text-danger font-monospace">{livePressure} kg/cm²</strong></div>
                      <div>Water Supply: <strong className="text-cyan">AVAILABLE (Active Head)</strong></div>
                      <div>Landing Valve: <strong className="text-success">OPEN & HEALTHY</strong></div>
                      <div>Hose Reel: <strong className="text-white">30m Canvas (Tested)</strong></div>
                    </div>
                  </div>
                )}

                {/* 2.5D Isometric Architectural Building SCADA Illustration */}
                <svg
                  viewBox="0 0 560 740"
                  width="100%"
                  height="auto"
                  style={{ maxHeight: '720px', display: 'block' }}
                  fill="none"
                >
                  <defs>
                    {/* Gradients for 2.5D architectural lighting */}
                    <linearGradient id="isoWallGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1B263B" />
                      <stop offset="100%" stopColor="#0D1527" />
                    </linearGradient>
                    <linearGradient id="isoFloorSlabGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#1E293B" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                    <linearGradient id="isoRoofGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#25354F" />
                      <stop offset="100%" stopColor="#131D2F" />
                    </linearGradient>
                    <linearGradient id="tankWaterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity="0.95" />
                    </linearGradient>
                    <linearGradient id="ugSumpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06C7F5" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#0369A1" stopOpacity="0.95" />
                    </linearGradient>
                    <linearGradient id="steelTankGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#64748B" />
                      <stop offset="40%" stopColor="#94A3B8" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                    <linearGradient id="glassBalconyGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="rgba(56, 189, 248, 0.25)" />
                      <stop offset="100%" stopColor="rgba(2, 132, 199, 0.05)" />
                    </linearGradient>
                    <linearGradient id="pipeMetallicGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="50%" stopColor="#B91C1C" />
                      <stop offset="100%" stopColor="#7F1D1D" />
                    </linearGradient>
                    {/* Concrete pad gradient for pump skids */}
                    <linearGradient id="concretePadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#475569" />
                      <stop offset="50%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#1E293B" />
                    </linearGradient>
                    {/* Basement floor tile gradient */}
                    <linearGradient id="basementFloorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D1527" />
                      <stop offset="100%" stopColor="#060B15" />
                    </linearGradient>
                    {/* Diesel tank enhanced gradient */}
                    <linearGradient id="dieselTankGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="40%" stopColor="#D97706" />
                      <stop offset="100%" stopColor="#B45309" />
                    </linearGradient>
                    {/* SCADA Equipment Inspector Card Gradients */}
                    <linearGradient id="scadaCardBg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0B1322" />
                      <stop offset="100%" stopColor="#050912" />
                    </linearGradient>
                    <linearGradient id="scadaCardActiveBg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14243B" />
                      <stop offset="100%" stopColor="#091220" />
                    </linearGradient>
                  </defs>

                  {/* ── Basement Plant Room Foundation Floor ── */}
                  <rect x="25" y="540" width="520" height="195" rx="4" fill="url(#basementFloorGrad)" stroke="#1E293B" strokeWidth="1.5" />
                  {/* Plant Room Floor Grid Lines */}
                  <line x1="25" y1="540" x2="545" y2="540" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                  {/* Plant Room "Basement" label */}
                  <rect x="30" y="543" width="85" height="16" rx="3" fill="#111A2B" stroke="#334155" strokeWidth="0.8" />
                  <text x="72" y="554" fill="#64748B" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.08em">PLANT ROOM</text>

                  {/* Ground Level Landscaping/Planter (Left Side) */}
                  <polygon points="40,540 100,540 115,525 55,525" fill="#14532D" opacity="0.6" stroke="#166534" strokeWidth="1" />
                  <circle cx="65" cy="522" r="6" fill="#15803D" />
                  <circle cx="80" cy="520" r="8" fill="#16A34A" />
                  <circle cx="95" cy="523" r="6" fill="#15803D" />

                  {/* ── Multi-Floor Building Structure (Roof to Ground) ── */}
                  {/* Left 3D Isometric Wall Facade */}
                  <polygon points="105,95 160,70 160,540 105,565" fill="url(#isoWallGrad)" stroke="#334155" strokeWidth="1.2" />

                  {/* Architectural Window Slits on Left 3D Wall */}
                  {[105, 145, 185, 225, 265, 305, 345, 385, 425, 465, 505].map(wy => (
                    <line key={`wslit-${wy}`} x1="120" y1={wy + 18} x2="145" y2={wy + 8} stroke="#38BDF8" strokeWidth="2" strokeOpacity="0.45" />
                  ))}

                  {/* Front Interior Cutaway Facade */}
                  <rect x="160" y="70" width="240" height="470" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

                  {/* ── 12 Building Levels (Roof down to Ground) ── */}
                  {[
                    { label: 'Roof', y: 70, isRoof: true },
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
                      key={fl.label}
                      className={`acms-floor-row ${selectedFloor === fl.label ? 'active' : ''}`}
                      onClick={() => setSelectedFloor(fl.label)}
                    >
                      {/* Floor Interior Soft Ambient Light */}
                      <rect
                        x="162"
                        y={fl.y + 2}
                        width="236"
                        height="36"
                        fill="rgba(255,255,255,0.025)"
                        className="floor-bg"
                        rx="2"
                      />

                      {/* Structural Concrete Floor Slab with 3D Beveled Top Edge */}
                      <polygon points={`105,${fl.y + 16} 160,${fl.y} 400,${fl.y} 345,${fl.y + 16}`} fill="url(#isoFloorSlabGrad)" stroke="#334155" strokeWidth="0.8" />
                      <line x1="160" y1={fl.y} x2="400" y2={fl.y} stroke="#475569" strokeWidth="2.5" />

                      {/* Architectural Support Column Grid */}
                      <line x1="250" y1={fl.y} x2="250" y2={fl.y + 38} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                      <line x1="330" y1={fl.y} x2="330" y2={fl.y + 38} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

                      {/* Right Balcony Exterior with Structural Glass Railing */}
                      <polygon points={`400,${fl.y + 6} 435,${fl.y + 2} 435,${fl.y + 34} 400,${fl.y + 38}`} fill="url(#glassBalconyGrad)" stroke="#0284C7" strokeWidth="1" />
                      <line x1="400" y1={fl.y + 8} x2="435" y2={fl.y + 4} stroke="#38BDF8" strokeWidth="1.5" />

                      {/* Interactive Floor Callout Tag on Right */}
                      <g className="cursor-pointer">
                        <rect
                          x="442"
                          y={fl.y + 9}
                          width="52"
                          height="20"
                          rx="4"
                          fill={selectedFloor === fl.label ? "#EF3340" : "#0B1220"}
                          stroke={selectedFloor === fl.label ? "#FF7B84" : "#334155"}
                          strokeWidth="1.2"
                        />
                        <text
                          x="468"
                          y={fl.y + 23}
                          fill="#FFFFFF"
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {fl.label}
                        </text>
                      </g>

                      {/* Red Fire Hydrant Cabinet Box on each occupied floor */}
                      {idx > 0 && (
                        <g>
                          {/* Branch Pipe from Riser to Cabinet */}
                          <line x1="190" y1={fl.y + 20} x2="215" y2={fl.y + 20} stroke="#EF4444" strokeWidth="3" />
                          <circle cx="202" cy={fl.y + 20} r="2" fill="#B91C1C" />
                          {/* Cabinet Shell */}
                          <rect x="215" y={fl.y + 9} width="22" height="22" rx="3" fill="#B91C1C" stroke="#EF4444" strokeWidth="1.2" />
                          {/* Internal Hose Reel Coil */}
                          <circle cx="226" cy={fl.y + 20} r="7" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.2" />
                          <circle cx="226" cy={fl.y + 20} r="3" fill="#991B1B" />
                          {/* Supervised Green Health LED Indicator */}
                          <circle cx="233" cy={fl.y + 13} r="1.8" fill="#10B981" />
                          <circle cx="233" cy={fl.y + 13} r="3.2" fill="none" stroke="#10B981" strokeWidth="0.8" opacity="0.7" />
                        </g>
                      )}
                    </g>
                  ))}

                  {/* ── Rooftop Isometric Slab & Parapet Railings ── */}
                  <polygon points="105,95 160,70 400,70 345,95" fill="url(#isoRoofGrad)" stroke="#475569" strokeWidth="1.5" />
                  <line x1="160" y1="56" x2="400" y2="56" stroke="#64748B" strokeWidth="1.5" strokeDasharray="6 3" />
                  <line x1="160" y1="56" x2="160" y2="70" stroke="#64748B" strokeWidth="1.5" />
                  <line x1="280" y1="56" x2="280" y2="70" stroke="#64748B" strokeWidth="1.5" />
                  <line x1="400" y1="56" x2="400" y2="70" stroke="#64748B" strokeWidth="1.5" />

                  {/* ── Rooftop OH TANK (50 kL Overhead Fire Water Tank) ── */}
                  <g>
                    {/* Tank Shell */}
                    <rect x="270" y="24" width="95" height="42" rx="4" fill="#0F172A" stroke="#0284C7" strokeWidth="2" />
                    {/* Water Level Fill (92%) */}
                    <rect x="273" y="32" width="89" height="32" rx="2" fill="url(#tankWaterGrad)" />
                    {/* Tank Animated Water Wave Pattern */}
                    <path d="M273 34 Q 295 30, 317 34 T 362 34" stroke="#BAE6FD" strokeWidth="1.5" fill="none" opacity="0.8" />
                    <text x="317" y="47" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">OH TANK (50 kL)</text>
                    <text x="317" y="58" fill="#E0F2FE" fontSize="7.5" textAnchor="middle">Level: 92% (Normal)</text>

                    {/* Rooftop Booster Pump (Item 8 & 9) */}
                    <g
                      className="cursor-pointer"
                      onClick={() => setSelectedHydrantItem(8)}
                    >
                      <circle cx="225" cy="48" r="11" fill={hydrantItems.boosterPump.runStatus === 'RUNNING' ? "#16B978" : "#F59E0B"} stroke="#FFFFFF" strokeWidth="1.8" />
                      <text x="225" y="52" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">BP</text>
                      {/* Connection Pipe to Riser */}
                      <path d="M225 59 L 225 70 L 190 70" stroke="#DC2626" strokeWidth="4" fill="none" />
                      {/* Callout Badge */}
                      <rect x="185" y="24" width="75" height="18" rx="3" fill="#0B1220" stroke={selectedHydrantItem === 8 || selectedHydrantItem === 9 ? "#06C7F5" : "#334155"} strokeWidth="1.2" />
                      <text x="222" y="36" fill="#A7F3D0" fontSize="7.5" fontWeight="bold" textAnchor="middle">Booster Pump</text>
                      {(selectedHydrantItem === 8 || selectedHydrantItem === 9) && (
                        <circle cx="225" cy="48" r="16" stroke="#06C7F5" strokeWidth="2" fill="none" strokeDasharray="3 3" />
                      )}
                    </g>
                  </g>

                  {/* ── Main Vertical Hydrant Riser Pipe ── */}
                  <g>
                    {/* Outer Heavy Red Industrial Pipe */}
                    <line x1="190" y1="68" x2="190" y2="550" stroke="url(#pipeMetallicGrad)" strokeWidth="9" strokeLinecap="round" />
                    {/* Animated Flowing Water Core */}
                    <line
                      x1="190"
                      y1="68"
                      x2="190"
                      y2="550"
                      stroke="#06C7F5"
                      strokeWidth="4"
                      className={hydrantItems.mainPump.runStatus === 'RUNNING' ? "water-flow-active" : "water-flow-inactive"}
                    />

                    {/* Riser Pressure Sensor Callout Badge */}
                    <g
                      transform="translate(45, 290)"
                      className="cursor-pointer"
                      onClick={() => setSelectedHydrantItem(5)}
                    >
                      <rect
                        x="0"
                        y="0"
                        width="135"
                        height="44"
                        rx="6"
                        fill="#0B1220"
                        stroke={selectedHydrantItem === 5 ? "#EF3340" : "#06C7F5"}
                        strokeWidth={selectedHydrantItem === 5 ? "2" : "1.2"}
                      />
                      <text x="10" y="14" fill="#94A3B8" fontSize="8" fontWeight="bold">Hydrant Riser Line</text>
                      <text x="10" y="28" fill="#06C7F5" fontSize="11" fontWeight="bold" fontFamily="monospace">
                        {livePressure} kg/cm²
                      </text>
                      <text x="10" y="38" fill="#10B981" fontSize="7">Cut-in: 6.0 • Cut-out: 8.5</text>
                      <circle cx="123" cy="14" r="3.5" fill="#10B981" />
                      {/* Pointer line connecting to Riser pipe */}
                      <line x1="135" y1="22" x2="190" y2="310" stroke="#06C7F5" strokeWidth="1.2" strokeDasharray="3 2" />
                      <circle cx="190" cy="310" r="3" fill="#06C7F5" />
                    </g>
                  </g>

                  {/* ────────────────────────────────────────────────────────
                      LOWER SECTION: Basement Cutaway & Plant Room Equipment
                      ──────────────────────────────────────────────────────── */}

                  {/* ────────────────────────────────────────────────────────
                      LOWER SECTION: Ultra-Professional SCADA B2 Pump House & Reservoir
                      ──────────────────────────────────────────────────────── */}

                  {/* Plant Room Boundary Bay Frame */}
                  <rect x="12" y="538" width="536" height="194" rx="6" fill="#070E1A" stroke="#1E293B" strokeWidth="1.2" />
                  
                  {/* Plant Room Architectural Header Strip (3 Cleanly Spaced Non-Colliding SCADA Badges) */}
                  <rect x="16" y="541" width="148" height="15" rx="3.5" fill="#0B1528" stroke="#334155" strokeWidth="0.8" />
                  <circle cx="25" cy="548.5" r="3" fill="#10B981" />
                  <circle cx="25" cy="548.5" r="5" fill="#10B981" opacity="0.25" className="scada-blink" />
                  <text x="34" y="551.8" fill="#F8FAFC" fontSize="8" fontWeight="800" letterSpacing="0.04em">
                    B2 PUMP ROOM • SCADA
                  </text>
                  
                  <rect x="204" y="541" width="76" height="15" rx="3.5" fill="#1C1917" stroke="#DC2626" strokeWidth="0.8" />
                  <text x="242" y="551.8" fill="#FCA5A5" fontSize="7.2" fontWeight="bold" textAnchor="middle" letterSpacing="0.03em">
                    7.5 BAR HEADER
                  </text>

                  <rect x="444" y="541" width="100" height="15" rx="3.5" fill="#0B1324" stroke="#0284C7" strokeWidth="0.8" />
                  <text x="494" y="551.8" fill="#38BDF8" fontSize="7.2" fontWeight="bold" textAnchor="middle" letterSpacing="0.04em">
                    NBC-2016 COMPLIANT
                  </text>

                  {/* Floor Level Divider Dotted Line */}
                  <line x1="12" y1="646" x2="548" y2="646" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 3" />

                  {/* ── OVERHEAD DISCHARGE HEADER (FIRE RED, y = 562) ── */}
                  {/* Vertical Riser link to main building */}
                  <line x1="190" y1="520" x2="190" y2="562" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" />
                  <line x1="190" y1="520" x2="190" y2="562" stroke="#FCA5A5" strokeWidth="1.8" opacity="0.4" />
                  
                  {/* Horizontal High-Pressure Discharge Manifold */}
                  <path d="M 48 562 L 272 562" stroke="#DC2626" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <path d="M 48 562 L 272 562" stroke="#FCA5A5" strokeWidth="1.8" fill="none" opacity="0.4" />
                  
                  {/* Discharge Pressure Transmitter (PT-01) on Header */}
                  <circle cx="190" cy="562" r="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                  <circle cx="190" cy="562" r="2" fill="#38BDF8" />

                  {/* ── LOWER SUCTION HEADER (DEEP WATER BLUE, y = 638) ── */}
                  {/* Suction Pipe from UG Sump (x=490) running Left to Pumps */}
                  <path d="M 490 610 L 444 610 L 444 638 L 46 638" stroke="#0284C7" strokeWidth="6" fill="none" strokeLinecap="round" />
                  <path d="M 490 610 L 444 610 L 444 638 L 46 638" stroke="#38BDF8" strokeWidth="2.2" fill="none" className={hydrantItems.mainPump.runStatus === 'RUNNING' ? "water-flow-active" : "water-flow-inactive"} />
                  
                  {/* Directional Flow Chevrons (Pointing RIGHT-TO-LEFT towards pumps) */}
                  <polygon points="415,635 407,638 415,641" fill="#38BDF8" opacity="0.9" />
                  <polygon points="315,635 307,638 315,641" fill="#38BDF8" opacity="0.75" />
                  <polygon points="210,635 202,638 210,641" fill="#38BDF8" opacity="0.75" />
                  <polygon points="105,635 97,638 105,641" fill="#38BDF8" opacity="0.9" />

                  {/* ========================================================
                      EQUIPMENT 1: MAIN HYDRANT CENTRIFUGAL PUMP (Center x = 62)
                      ======================================================== */}
                  <g className="cursor-pointer" onClick={() => setSelectedHydrantItem(1)}>
                    {/* Concrete Inertia Foundation */}
                    <rect x="22" y="626" width="82" height="10" rx="2" fill="url(#concretePadGrad)" stroke="#475569" strokeWidth="0.8" />
                    <line x1="30" y1="636" x2="30" y2="640" stroke="#94A3B8" strokeWidth="2.5" />
                    <line x1="96" y1="636" x2="96" y2="640" stroke="#94A3B8" strokeWidth="2.5" />

                    {/* Suction Branch Pipe (Rising from blue suction header) */}
                    <path d="M 46 638 L 46 605" stroke="#0284C7" strokeWidth="5" fill="none" />
                    <rect x="42" y="618" width="8" height="4" rx="1" fill="#64748B" stroke="#334155" strokeWidth="0.5" />

                    {/* Discharge Branch Pipe (Rising to red discharge header) with Check Valve & Gate Valve */}
                    <path d="M 46 590 L 46 562" stroke="#DC2626" strokeWidth="5.5" fill="none" />
                    {/* Non-Return Valve (NRV) */}
                    <polygon points="42,580 50,580 46,574" fill="#0F172A" stroke="#EF4444" strokeWidth="0.8" />
                    {/* Gate Valve with Handwheel */}
                    <rect x="42" y="567" width="8" height="3" rx="0.5" fill="#475569" />
                    <ellipse cx="46" cy="565" rx="5" ry="1.5" fill="#E2E8F0" stroke="#475569" strokeWidth="0.6" />

                    {/* 75kW TEFC Electric Motor (Red Cast Iron) */}
                    <rect x="58" y="582" width="44" height="44" rx="3" fill="#991B1B" stroke="#7F1D1D" strokeWidth="1.5" />
                    {/* Horizontal Stator Cooling Fins */}
                    {[587, 593, 599, 605, 611, 617, 623].map(fy => (
                      <line key={`fin-${fy}`} x1="62" y1={fy} x2="100" y2={fy} stroke="#7F1D1D" strokeWidth="1.8" />
                    ))}
                    {/* Motor Terminal Junction Box with High Voltage Indicator */}
                    <rect x="70" y="574" width="18" height="8" rx="1.5" fill="#0F172A" stroke="#475569" strokeWidth="0.8" />
                    <polygon points="78,576 81,579 79,580 82,582 77,582" fill="#FBBF24" />

                    {/* Chrome Drive Shaft Coupling Guard */}
                    <rect x="50" y="594" width="8" height="18" rx="1" fill="#64748B" stroke="#475569" strokeWidth="0.8" />

                    {/* Pump Volute Casing (Heavy Shaded Red Spiral) */}
                    <circle cx="44" cy="603" r="19" fill="#DC2626" stroke="#991B1B" strokeWidth="2.2" />
                    <circle cx="44" cy="603" r="19" fill="none" stroke="#FCA5A5" strokeWidth="0.8" opacity="0.4" />

                    {/* Rotating 6-Blade Impeller */}
                    <g
                      className={hydrantItems.mainPump.runStatus === 'RUNNING' ? "scada-spin" : ""}
                      style={{ transformOrigin: '44px 603px', transformBox: 'view-box' }}
                    >
                      <circle cx="44" cy="603" r="7.5" fill="#FCA5A5" />
                      <circle cx="44" cy="603" r="3.2" fill="#7F1D1D" />
                      {[0, 60, 120, 180, 240, 300].map(deg => (
                        <line
                          key={`main-imp-${deg}`}
                          x1="44"
                          y1="603"
                          x2={44 + 13 * Math.cos(deg * Math.PI / 180)}
                          y2={603 + 13 * Math.sin(deg * Math.PI / 180)}
                          stroke="#FFFFFF"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                      ))}
                    </g>

                    {/* Active Focus Highlight */}
                    {selectedHydrantItem === 1 && (
                      <circle cx="44" cy="603" r="25" stroke="#EF4444" strokeWidth="1.8" fill="none" strokeDasharray="3 3" />
                    )}
                  </g>

                  {/* ========================================================
                      EQUIPMENT 2: JOCKEY PUMP (Vertical Multistage, Center x = 168)
                      ======================================================== */}
                  <g className="cursor-pointer" onClick={() => setSelectedHydrantItem(6)}>
                    {/* Mounting Foundation Base */}
                    <rect x="150" y="626" width="36" height="10" rx="2" fill="url(#concretePadGrad)" stroke="#475569" strokeWidth="0.8" />

                    {/* Suction Take-off (Blue) */}
                    <path d="M 160 638 L 160 622 L 164 622" stroke="#0284C7" strokeWidth="4" fill="none" />

                    {/* Vertical Multistage Stainless Cylinder Barrel */}
                    <rect x="162" y="588" width="14" height="38" rx="2" fill="#0284C7" stroke="#0369A1" strokeWidth="1.2" />
                    {/* Stage clamp rings */}
                    {[594, 600, 606, 612, 618].map(sy => (
                      <line key={`jock-ring-${sy}`} x1="162" y1={sy} x2="176" y2={sy} stroke="#38BDF8" strokeWidth="1" />
                    ))}

                    {/* Vertical TEFC Motor (Top Mounted) */}
                    <rect x="158" y="570" width="22" height="18" rx="2" fill="#0369A1" stroke="#075985" strokeWidth="1.2" />
                    {/* Air Fan Cowl Top */}
                    <rect x="162" y="565" width="14" height="5" rx="1.5" fill="#0F172A" stroke="#334155" strokeWidth="0.6" />

                    {/* Discharge connection to overhead header */}
                    <path d="M 172 600 L 178 600 L 178 562" stroke="#DC2626" strokeWidth="3.5" fill="none" />
                    <circle cx="178" cy="578" r="2.5" fill="#0F172A" stroke="#EF4444" strokeWidth="0.8" />

                    {/* Active Focus Highlight */}
                    {selectedHydrantItem === 6 && (
                      <rect x="150" y="563" width="38" height="73" rx="4" stroke="#06C7F5" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                    )}
                  </g>

                  {/* ========================================================
                      EQUIPMENT 3: STANDBY DIESEL FIRE PUMP PACKAGE (Center x = 276)
                      ======================================================== */}
                  <g className="cursor-pointer" onClick={() => setSelectedHydrantItem(2)}>
                    {/* Heavy Dual Skid Base */}
                    <rect x="226" y="626" width="94" height="10" rx="2" fill="url(#concretePadGrad)" stroke="#475569" strokeWidth="0.8" />

                    {/* Suction Pipe (from header to pump volute) */}
                    <path d="M 238 638 L 238 604" stroke="#0284C7" strokeWidth="5" fill="none" />

                    {/* Discharge Pipe (from pump volute to overhead header) */}
                    <path d="M 238 590 L 238 562" stroke="#DC2626" strokeWidth="5" fill="none" />
                    <polygon points="234,578 242,578 238,572" fill="#0F172A" stroke="#EF4444" strokeWidth="0.8" />

                    {/* Heavy Red/Amber Centrifugal Pump Volute */}
                    <circle cx="238" cy="603" r="18" fill="#D97706" stroke="#B45309" strokeWidth="2" />
                    <circle cx="238" cy="603" r="6" fill="#FDE68A" />

                    {/* Flexible Coupling */}
                    <rect x="250" y="597" width="8" height="12" rx="1" fill="#475569" />

                    {/* Industrial Diesel Engine Block (Gunmetal & Metallic) */}
                    <rect x="258" y="580" width="50" height="46" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                    {/* Cylinder Head */}
                    <rect x="258" y="574" width="50" height="6" rx="1.5" fill="#334155" stroke="#475569" strokeWidth="0.8" />
                    {/* Engine Heat Exchanger & Radiator Slots */}
                    {[586, 592, 598, 604, 610, 616, 622].map(ey => (
                      <line key={`eng-slot-${ey}`} x1="264" y1={ey} x2="302" y2={ey} stroke="#475569" strokeWidth="1.5" />
                    ))}

                    {/* Heavy Chrome Exhaust Silencer Stack */}
                    <line x1="298" y1="574" x2="298" y2="548" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
                    {/* Exhaust Rain Flap */}
                    <path d="M 294 547 L 304 544" stroke="#E2E8F0" strokeWidth="1.8" />

                    {/* Dual 24V Cranking Battery Unit (Under Engine) */}
                    <rect x="268" y="618" width="16" height="7" rx="1" fill="#070D18" stroke="#F59E0B" strokeWidth="0.6" />
                    <circle cx="272" cy="621.5" r="1" fill="#EF4444" />
                    <circle cx="280" cy="621.5" r="1" fill="#3B82F6" />

                    {/* Active Focus Highlight */}
                    {selectedHydrantItem === 2 && (
                      <rect x="222" y="546" width="102" height="90" rx="4" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                    )}
                  </g>

                  {/* ========================================================
                      EQUIPMENT 4: DIESEL FUEL DAY TANK (500L, Center x = 388)
                      ======================================================== */}
                  <g className="cursor-pointer" onClick={() => setSelectedHydrantItem(3)}>
                    {/* Steel Cradle Saddles */}
                    <rect x="358" y="622" width="7" height="14" rx="1" fill="#334155" />
                    <rect x="410" y="622" width="7" height="14" rx="1" fill="#334155" />

                    {/* Cylindrical Horizontal Tank Body */}
                    <rect x="350" y="580" width="75" height="42" rx="16" fill="url(#dieselTankGrad)" stroke="#B45309" strokeWidth="1.5" />
                    {/* Metallic Highlight Ribbon */}
                    <rect x="350" y="596" width="75" height="3" rx="1" fill="#FDE68A" opacity="0.35" />

                    {/* Calibrated Sight Level Glass */}
                    <rect x="414" y="586" width="5" height="28" rx="2" fill="#070D18" stroke="#F59E0B" strokeWidth="0.8" />
                    <rect x="415" y={588 + (24 * 0.12)} width="3" height={24 * 0.88} rx="1" fill="#F59E0B" />

                    {/* Top Manhole Hatch & Gooseneck Breather */}
                    <rect x="382" y="574" width="12" height="6" rx="1.5" fill="#475569" />
                    <path d="M 398 580 L 398 568 Q 398 564 402 564 Q 406 564 406 570" stroke="#94A3B8" strokeWidth="1.8" fill="none" />

                    {/* Braided Yellow Fuel Supply Line to Diesel Engine */}
                    <path d="M 350 610 L 308 610" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="3 2" fill="none" />
                    {/* Fuel Shut-Off Valve */}
                    <polygon points="326,607 332,613 326,613" fill="#F59E0B" />
                    <rect x="321" y="596" width="22" height="9" rx="1.5" fill="#0B1220" stroke="#F59E0B" strokeWidth="0.7" />
                    <text x="332" y="603" fill="#F59E0B" fontSize="6.2" fontWeight="bold" textAnchor="middle">FUEL</text>

                    {/* Active Focus Highlight */}
                    {selectedHydrantItem === 3 && (
                      <rect x="346" y="563" width="83" height="73" rx="4" stroke="#06C7F5" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                    )}
                  </g>

                  {/* ========================================================
                      EQUIPMENT 5: UG FIRE WATER SUMP RESERVOIR (Center x = 496)
                      ======================================================== */}
                  <g className="cursor-pointer" onClick={() => setSelectedHydrantItem(1)}>
                    {/* Concrete Bunker Wall Cutaway */}
                    <rect x="444" y="552" width="100" height="94" rx="4" fill="#0B1324" stroke="#0284C7" strokeWidth="1.8" />

                    {/* Translucent Water Reservoir */}
                    <rect x="448" y="568" width="92" height="74" rx="2" fill="url(#ugSumpGrad)" />
                    {/* Fluid Surface Wave Pattern */}
                    <path d="M 448 572 Q 471 567 494 572 T 540 572 L 540 642 L 448 642 Z" fill="#06C7F5" opacity="0.3" />

                    {/* Concrete Depth Ruler Graduations (Crisp, High Visibility) */}
                    <text x="451" y="578" fill="#CBD5E1" fontSize="7.8" fontWeight="bold" fontFamily="monospace">4m-</text>
                    <text x="451" y="598" fill="#CBD5E1" fontSize="7.8" fontWeight="bold" fontFamily="monospace">3m-</text>
                    <text x="451" y="618" fill="#CBD5E1" fontSize="7.8" fontWeight="bold" fontFamily="monospace">2m-</text>
                    <text x="451" y="636" fill="#CBD5E1" fontSize="7.8" fontWeight="bold" fontFamily="monospace">1m-</text>

                    {/* Ultrasonic Level Sensor (LT-01) on Ceiling */}
                    <rect x="506" y="552" width="14" height="6" rx="1" fill="#1E293B" stroke="#0284C7" strokeWidth="0.8" />
                    {/* Subtle Telemetry Radar Cone */}
                    <path d="M 513 558 L 498 572 L 528 572 Z" fill="#38BDF8" opacity="0.15" />

                    {/* Submerged Suction Bellmouth Strainer Foot Valve */}
                    <ellipse cx="490" cy="624" rx="10" ry="3.5" fill="#0369A1" stroke="#38BDF8" strokeWidth="1" />
                    <line x1="480" y1="624" x2="500" y2="624" stroke="#7DD3FC" strokeWidth="0.8" />

                    {/* Floating HUD Pill inside Reservoir (Top Right) */}
                    <rect x="464" y="555" width="76" height="15" rx="3" fill="#070D18" fillOpacity="0.9" stroke="#0284C7" strokeWidth="0.8" />
                    <circle cx="472" cy="562.5" r="2.8" fill="#10B981" />
                    <text x="479" y="565.5" fill="#FFFFFF" fontSize="8.2" fontWeight="bold">UG SUMP 88.5%</text>

                    {/* Active Focus Highlight */}
                    {(selectedHydrantItem === 5 || selectedHydrantItem === 1) && (
                      <rect x="442" y="550" width="104" height="98" rx="5" stroke="#10B981" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                    )}
                  </g>

                  {/* ========================================================
                      FIVE SYMMETRICAL BOTTOM SCADA EQUIPMENT INSPECTOR BAYS
                      (y = 650 to 728, height = 78px, equal width = 102px each)
                      ======================================================== */}

                  {/* ── BAY 1: MAIN HYDRANT PUMP (x = 15) ── */}
                  <g className="cursor-pointer" onClick={() => setSelectedHydrantItem(1)}>
                    {/* Card Frame with SCADA Gradient */}
                    <rect
                      x="15"
                      y="650"
                      width="102"
                      height="78"
                      rx="5"
                      fill={selectedHydrantItem === 1 ? "url(#scadaCardActiveBg)" : "url(#scadaCardBg)"}
                      stroke={selectedHydrantItem === 1 ? "#EF4444" : "#1E293B"}
                      strokeWidth={selectedHydrantItem === 1 ? "1.8" : "1"}
                    />
                    {/* Top Vibrant Red Accent Bar */}
                    <rect x="15" y="650" width="102" height="2.5" rx="1.2" fill="#EF4444" />

                    {/* Equipment Tag Badge */}
                    <rect x="23" y="656" width="86" height="14" rx="3" fill="#EF4444" fillOpacity="0.16" stroke="#EF4444" strokeWidth="0.6" />
                    <text x="66" y="666.2" fill="#FCA5A5" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.04em">
                      HYDRANT PUMP 1
                    </text>
                    
                    {/* Specifications */}
                    <text x="66" y="681" fill="#FFFFFF" fontSize="9.8" fontWeight="800" textAnchor="middle">Centrifugal 75 kW</text>
                    <text x="66" y="693" fill="#94A3B8" fontSize="8" fontWeight="600" textAnchor="middle">2850 LPM @ 7.5 Bar</text>
                    
                    {/* Status Pill */}
                    <rect x="22" y="701" width="88" height="20" rx="4" fill="#059669" stroke="#10B981" strokeWidth="0.8" />
                    <text x="66" y="714.5" textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="0.04em">
                      <tspan fill="#FFFFFF">● </tspan>
                      <tspan fill="#FFFFFF">{hydrantItems.mainPump.runStatus}</tspan>
                    </text>
                  </g>

                  {/* ── BAY 2: JOCKEY PUMP (x = 122) ── */}
                  <g className="cursor-pointer" onClick={() => setSelectedHydrantItem(6)}>
                    {/* Card Frame with SCADA Gradient */}
                    <rect
                      x="122"
                      y="650"
                      width="102"
                      height="78"
                      rx="5"
                      fill={selectedHydrantItem === 6 ? "url(#scadaCardActiveBg)" : "url(#scadaCardBg)"}
                      stroke={selectedHydrantItem === 6 ? "#06C7F5" : "#1E293B"}
                      strokeWidth={selectedHydrantItem === 6 ? "1.8" : "1"}
                    />
                    {/* Top Vibrant Cyan Accent Bar */}
                    <rect x="122" y="650" width="102" height="2.5" rx="1.2" fill="#06C7F5" />

                    {/* Equipment Tag Badge */}
                    <rect x="130" y="656" width="86" height="14" rx="3" fill="#0284C7" fillOpacity="0.16" stroke="#0284C7" strokeWidth="0.6" />
                    <text x="173" y="666.2" fill="#7DD3FC" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.04em">
                      JOCKEY PUMP 6
                    </text>
                    
                    {/* Specifications */}
                    <text x="173" y="681" fill="#FFFFFF" fontSize="9.8" fontWeight="800" textAnchor="middle">Vertical Multistage</text>
                    <text x="173" y="693" fill="#94A3B8" fontSize="8" fontWeight="600" textAnchor="middle">Pressure Maintain</text>
                    
                    {/* Status Pill */}
                    <rect x="129" y="701" width="88" height="20" rx="4" fill="#78350F" fillOpacity="0.32" stroke="#F59E0B" strokeWidth="1" />
                    <text x="173" y="714.5" textAnchor="middle" fontSize="8.8" fontWeight="800" letterSpacing="0.03em">
                      <tspan fill="#F59E0B">● </tspan>
                      <tspan fill="#FDE68A">{hydrantItems.jockeyPump.runStatus}</tspan>
                    </text>
                  </g>

                  {/* ── BAY 3: STANDBY DIESEL/ELECTRICAL PUMP (x = 229) ── */}
                  <g className="cursor-pointer" onClick={() => setSelectedHydrantItem(2)}>
                    {/* Card Frame with SCADA Gradient */}
                    <rect
                      x="229"
                      y="650"
                      width="102"
                      height="78"
                      rx="5"
                      fill={selectedHydrantItem === 2 ? "url(#scadaCardActiveBg)" : "url(#scadaCardBg)"}
                      stroke={selectedHydrantItem === 2 ? "#F59E0B" : "#1E293B"}
                      strokeWidth={selectedHydrantItem === 2 ? "1.8" : "1"}
                    />
                    {/* Top Vibrant Amber Accent Bar */}
                    <rect x="229" y="650" width="102" height="2.5" rx="1.2" fill="#F59E0B" />

                    {/* Equipment Tag Badge */}
                    <rect x="237" y="656" width="86" height="14" rx="3" fill="#D97706" fillOpacity="0.16" stroke="#D97706" strokeWidth="0.6" />
                    <text x="280" y="666.2" fill="#FDE68A" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.04em">
                      DIESEL PUMP 2
                    </text>
                    
                    {/* Specifications */}
                    <text x="280" y="681" fill="#FFFFFF" fontSize="9.8" fontWeight="800" textAnchor="middle">Engine Driven Pump</text>
                    <text x="280" y="693" fill="#94A3B8" fontSize="8" fontWeight="600" textAnchor="middle">2850 LPM Centrifugal</text>
                    
                    {/* Status Pill */}
                    <rect x="236" y="701" width="88" height="20" rx="4" fill="#78350F" fillOpacity="0.32" stroke="#F59E0B" strokeWidth="1" />
                    <text x="280" y="714.5" textAnchor="middle" fontSize="8.8" fontWeight="800" letterSpacing="0.03em">
                      <tspan fill="#F59E0B">● </tspan>
                      <tspan fill="#FDE68A">STANDBY AUTO</tspan>
                    </text>
                  </g>

                  {/* ── BAY 4: DIESEL FUEL DAY TANK (x = 336) ── */}
                  <g className="cursor-pointer" onClick={() => setSelectedHydrantItem(3)}>
                    {/* Card Frame with SCADA Gradient */}
                    <rect
                      x="336"
                      y="650"
                      width="102"
                      height="78"
                      rx="5"
                      fill={selectedHydrantItem === 3 ? "url(#scadaCardActiveBg)" : "url(#scadaCardBg)"}
                      stroke={selectedHydrantItem === 3 ? "#06C7F5" : "#1E293B"}
                      strokeWidth={selectedHydrantItem === 3 ? "1.8" : "1"}
                    />
                    {/* Top Vibrant Blue Accent Bar */}
                    <rect x="336" y="650" width="102" height="2.5" rx="1.2" fill="#3B82F6" />

                    {/* Equipment Tag Badge */}
                    <rect x="344" y="656" width="86" height="14" rx="3" fill="#3B82F6" fillOpacity="0.16" stroke="#3B82F6" strokeWidth="0.6" />
                    <text x="387" y="666.2" fill="#93C5FD" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.04em">
                      DAY FUEL TANK
                    </text>
                    
                    {/* Specifications */}
                    <text x="387" y="681" fill="#FFFFFF" fontSize="9.8" fontWeight="800" textAnchor="middle">500 L Fuel Storage</text>
                    <text x="387" y="693" fill="#94A3B8" fontSize="8" fontWeight="600" textAnchor="middle">{liveTankL} L Capacity</text>
                    
                    {/* Status Pill */}
                    <rect x="343" y="701" width="88" height="20" rx="4" fill="#0C4A6E" fillOpacity="0.32" stroke="#0284C7" strokeWidth="1" />
                    <text x="387" y="714.5" textAnchor="middle" fontSize="8.8" fontWeight="800" letterSpacing="0.03em">
                      <tspan fill="#38BDF8">● </tspan>
                      <tspan fill="#7DD3FC">88% FUEL OK</tspan>
                    </text>
                  </g>

                  {/* ── BAY 5: UG FIRE WATER SUMP RESERVOIR (x = 443) ── */}
                  <g className="cursor-pointer" onClick={() => setSelectedHydrantItem(1)}>
                    {/* Card Frame with SCADA Gradient */}
                    <rect
                      x="443"
                      y="650"
                      width="102"
                      height="78"
                      rx="5"
                      fill={selectedHydrantItem === 5 || selectedHydrantItem === 1 ? "url(#scadaCardActiveBg)" : "url(#scadaCardBg)"}
                      stroke={selectedHydrantItem === 5 || selectedHydrantItem === 1 ? "#10B981" : "#1E293B"}
                      strokeWidth={selectedHydrantItem === 5 || selectedHydrantItem === 1 ? "1.8" : "1"}
                    />
                    {/* Top Vibrant Emerald Accent Bar */}
                    <rect x="443" y="650" width="102" height="2.5" rx="1.2" fill="#10B981" />

                    {/* Equipment Tag Badge */}
                    <rect x="451" y="656" width="86" height="14" rx="3" fill="#059669" fillOpacity="0.16" stroke="#059669" strokeWidth="0.6" />
                    <text x="494" y="666.2" fill="#6EE7B7" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.04em">
                      UG WATER SUMP
                    </text>
                    
                    {/* Specifications */}
                    <text x="494" y="681" fill="#FFFFFF" fontSize="9.8" fontWeight="800" textAnchor="middle">300 kL Reservoir</text>
                    <text x="494" y="693" fill="#94A3B8" fontSize="8" fontWeight="600" textAnchor="middle">{tankItems.ugTank?.currentKl || '265.5 kL'} Storage</text>
                    
                    {/* Status Pill */}
                    <rect x="450" y="701" width="88" height="20" rx="4" fill="#064E3B" fillOpacity="0.32" stroke="#10B981" strokeWidth="1" />
                    <text x="494" y="714.5" textAnchor="middle" fontSize="8.8" fontWeight="800" letterSpacing="0.03em">
                      <tspan fill="#10B981">● </tspan>
                      <tspan fill="#6EE7B7">88.5% LEVEL OK</tspan>
                    </text>
                  </g>
                </svg>
              </div>

              {/* ────────────────────────────────────────────────────────
                  RIGHT COLUMN: Hydrant System Live Status Cards Grid
                  ──────────────────────────────────────────────────────── */}
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center justify-content-between px-2 py-1 border-bottom border-secondary border-opacity-25 mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <Activity size={16} className="text-danger" />
                    <h6 className="fw-black text-white mb-0" style={{ fontSize: '13px', letterSpacing: '0.02em' }}>
                      Hydrant System Live Status
                    </h6>
                  </div>
                  <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                    Active Telemetry Feed
                  </span>
                </div>

                {/* 2-Column Grid of High-Density Status Cards */}
                <div className="acms-hydrant-status-grid">
                  {/* Card 1: Main Hydrant Pump Run Status */}
                  <div className={`acms-compact-status-card ${selectedHydrantItem === 1 ? 'highlighted' : ''}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="acms-hydrant-item-num" style={{ background: '#EF4444', color: '#FFF' }}>1</span>
                        <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Main Hydrant Pump</span>
                      </div>
                      <span className={`acms-status-chip ${hydrantItems.mainPump.runStatus === 'RUNNING' ? 'running' : 'stopped'}`} style={{ fontSize: '9px', padding: '2px 7px' }}>
                        {hydrantItems.mainPump.runStatus}
                      </span>
                    </div>

                    <div className="acms-card-telemetry-grid">
                      <div className="acms-telemetry-item">
                        <span className="label">Run Status:</span>
                        <span className={`value ${hydrantItems.mainPump.runStatus === 'RUNNING' ? 'text-success' : 'text-danger'}`}>
                          {hydrantItems.mainPump.runStatus}
                        </span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Power Status:</span>
                        <span className="value text-success">{hydrantItems.mainPump.powerStatus}</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Flow Output:</span>
                        <span className="value text-white font-monospace">{liveFlow} LPM</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Current Draw:</span>
                        <span className="value text-white font-monospace">64.2 A (55 kW)</span>
                      </div>
                    </div>

                    <div className="acms-card-action-bar">
                      <span className="text-muted" style={{ fontSize: '10px' }}>● Duty Pump #1</span>
                      <button
                        type="button"
                        className="acms-micro-toggle-btn danger"
                        onClick={() => setHydrantItems(prev => ({
                          ...prev,
                          mainPump: { ...prev.mainPump, runStatus: prev.mainPump.runStatus === 'RUNNING' ? 'STOPPED' : 'RUNNING' }
                        }))}
                      >
                        {hydrantItems.mainPump.runStatus === 'RUNNING' ? 'Stop Pump' : 'Start Pump'}
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Standby Diesel/Electrical Pump Run Status */}
                  <div className={`acms-compact-status-card ${selectedHydrantItem === 2 ? 'highlighted' : ''}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="acms-hydrant-item-num" style={{ background: '#F59E0B', color: '#FFF' }}>2</span>
                        <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Standby Diesel/Elec</span>
                      </div>
                      <span className="acms-status-chip standby" style={{ fontSize: '9px', padding: '2px 7px' }}>
                        {hydrantItems.standbyPump.runStatus === 'RUNNING' ? 'RUNNING' : 'STANDBY AUTO'}
                      </span>
                    </div>

                    <div className="acms-card-telemetry-grid">
                      <div className="acms-telemetry-item">
                        <span className="label">Engine State:</span>
                        <span className="value text-warning">{hydrantItems.standbyPump.runStatus}</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Power Status:</span>
                        <span className="value text-success">{hydrantItems.standbyPump.powerStatus}</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Cranking Battery:</span>
                        <span className="value text-cyan font-monospace">24.8 V DC</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Engine Oil & Temp:</span>
                        <span className="value text-white font-monospace">4.2 bar • 62 °C</span>
                      </div>
                    </div>

                    <div className="acms-card-action-bar">
                      <span className="text-muted" style={{ fontSize: '10px' }}>● Auto Failover Ready</span>
                      <button
                        type="button"
                        className="acms-micro-toggle-btn warning"
                        onClick={() => setHydrantItems(prev => ({
                          ...prev,
                          standbyPump: { ...prev.standbyPump, runStatus: prev.standbyPump.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' }
                        }))}
                      >
                        {hydrantItems.standbyPump.runStatus === 'RUNNING' ? 'Set Standby' : 'Start Diesel'}
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Diesel Tank Level Monitoring */}
                  <div className={`acms-compact-status-card ${selectedHydrantItem === 3 ? 'highlighted' : ''}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="acms-hydrant-item-num" style={{ background: '#06C7F5', color: '#0B1220' }}>3</span>
                        <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Diesel Tank Level</span>
                      </div>
                      <span className="acms-status-chip cyan" style={{ fontSize: '9px', padding: '2px 7px' }}>
                        88% (NORMAL)
                      </span>
                    </div>

                    <div className="my-2">
                      <div className="d-flex align-items-center justify-content-between mb-1" style={{ fontSize: '10.5px' }}>
                        <span className="text-muted">Usable Fuel Reserve:</span>
                        <strong className="text-cyan font-monospace">{liveTankL} L / 500 L</strong>
                      </div>
                      <div className="acms-tank-bar-track" style={{ height: '7px' }}>
                        <div className="acms-tank-bar-fill" style={{ width: '88%' }}></div>
                      </div>
                    </div>

                    <div className="acms-card-telemetry-grid mt-1">
                      <div className="acms-telemetry-item">
                        <span className="label">Projected Runtime:</span>
                        <span className="value text-success font-monospace">18.5 Hours</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Low Level Status:</span>
                        <span className="value text-success">NORMAL (&gt; 30%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Power to Main Hydrant Pump */}
                  <div className={`acms-compact-status-card ${selectedHydrantItem === 4 ? 'highlighted' : ''}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="acms-hydrant-item-num" style={{ background: '#10B981', color: '#FFF' }}>4</span>
                        <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Power to Main Pump</span>
                      </div>
                      <span className={`acms-status-chip ${hydrantItems.powerMainPump.powerStatus === 'POWER ON' ? 'power-on' : 'power-off'}`} style={{ fontSize: '9px', padding: '2px 7px' }}>
                        {hydrantItems.powerMainPump.powerStatus}
                      </span>
                    </div>

                    <div className="acms-card-telemetry-grid">
                      <div className="acms-telemetry-item">
                        <span className="label">Grid Feed:</span>
                        <span className="value text-white" style={{ fontSize: '10.5px' }}>Primary Grid Feeder #1</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Phase Balance:</span>
                        <span className="value text-cyan font-monospace" style={{ fontSize: '10px' }}>R:415V | Y:414V | B:415V</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Breaker State:</span>
                        <span className="value text-success">CLOSED / ENERGIZED</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Frequency:</span>
                        <span className="value text-white font-monospace">50.0 Hz</span>
                      </div>
                    </div>

                    <div className="acms-card-action-bar">
                      <span className="text-muted" style={{ fontSize: '10px' }}>● 415V 3-Phase</span>
                      <button
                        type="button"
                        className="acms-micro-toggle-btn"
                        onClick={() => setHydrantItems(prev => ({
                          ...prev,
                          powerMainPump: { ...prev.powerMainPump, powerStatus: prev.powerMainPump.powerStatus === 'POWER ON' ? 'POWER OFF' : 'POWER ON' }
                        }))}
                      >
                        Toggle Power
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 5: Hydrant Riser Low Pressure Monitoring (Full Width Span) */}
                <div className={`acms-compact-status-card ${selectedHydrantItem === 5 ? 'highlighted' : ''}`} style={{ gridColumn: 'span 2' }}>
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="acms-hydrant-item-num" style={{ background: '#EF4444', color: '#FFF' }}>5</span>
                      <span className="fw-bold text-white" style={{ fontSize: '12px' }}>Hydrant Riser Low Pressure Monitoring</span>
                    </div>
                    <span className="badge bg-danger bg-opacity-25 text-danger font-monospace fs-6 px-2.5 py-1">
                      {livePressure} kg/cm²
                    </span>
                  </div>

                  {/* Horizontal Colored Pressure Gauge */}
                  <div className="acms-pressure-horizontal-gauge">
                    <div className="d-flex align-items-center justify-content-between small text-muted font-monospace" style={{ fontSize: '10px' }}>
                      <span>0 kg/cm²</span>
                      <span className="text-warning fw-bold">6.0 kg/cm² (Cut-In)</span>
                      <span className="text-cyan fw-bold">Current: {livePressure} kg/cm²</span>
                      <span className="text-success fw-bold">8.5 kg/cm² (Cut-Out)</span>
                      <span>10.0 kg/cm²</span>
                    </div>

                    <div className="acms-gauge-track">
                      {/* Animated Indicator Pin */}
                      <div
                        className="acms-gauge-needle"
                        style={{ left: `${Math.min(100, Math.max(0, (livePressure / 10) * 100))}%` }}
                      >
                        <div className="acms-gauge-needle-head"></div>
                        <div className="acms-gauge-needle-pin"></div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between mt-2 pt-1 border-top border-secondary border-opacity-25">
                    <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                      Status: <strong className="text-success">NORMAL (Within safe operating window 6.0 – 8.5 kg/cm²)</strong>
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0 px-2"
                      style={{ fontSize: '10.5px' }}
                      onClick={() => openPressureGraph('hydrant')}
                    >
                      <BarChart3 size={11} className="me-1" /> View Trend Graph
                    </button>
                  </div>
                </div>

                {/* 2-Column Grid: Card 6 & 7 */}
                <div className="acms-hydrant-status-grid">
                  {/* Card 6: Jockey Pump Run Status */}
                  <div className={`acms-compact-status-card ${selectedHydrantItem === 6 ? 'highlighted' : ''}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="acms-hydrant-item-num" style={{ background: '#0284C7', color: '#FFF' }}>6</span>
                        <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Jockey Pump</span>
                      </div>
                      <span className="acms-status-chip standby" style={{ fontSize: '9px', padding: '2px 7px' }}>
                        {hydrantItems.jockeyPump.runStatus === 'RUNNING' ? 'RUNNING' : 'STANDBY AUTO'}
                      </span>
                    </div>

                    <div className="acms-card-telemetry-grid">
                      <div className="acms-telemetry-item">
                        <span className="label">Run Status:</span>
                        <span className="value text-warning">{hydrantItems.jockeyPump.runStatus}</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Power Status:</span>
                        <span className="value text-success">{hydrantItems.jockeyPump.powerStatus}</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Starts Today:</span>
                        <span className="value text-white">2 Cycles</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Total Run Time:</span>
                        <span className="value text-white font-monospace">8 mins (7.5 kW)</span>
                      </div>
                    </div>

                    <div className="acms-card-action-bar">
                      <span className="text-muted" style={{ fontSize: '10px' }}>● Auto Pressure Maintain</span>
                      <button
                        type="button"
                        className="acms-micro-toggle-btn"
                        onClick={() => setHydrantItems(prev => ({
                          ...prev,
                          jockeyPump: { ...prev.jockeyPump, runStatus: prev.jockeyPump.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' }
                        }))}
                      >
                        {hydrantItems.jockeyPump.runStatus === 'RUNNING' ? 'Stop Jockey' : 'Start Jockey'}
                      </button>
                    </div>
                  </div>

                  {/* Card 7: Power to Jockey Pump */}
                  <div className={`acms-compact-status-card ${selectedHydrantItem === 7 ? 'highlighted' : ''}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="acms-hydrant-item-num" style={{ background: '#10B981', color: '#FFF' }}>7</span>
                        <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Power to Jockey</span>
                      </div>
                      <span className="acms-status-chip power-on" style={{ fontSize: '9px', padding: '2px 7px' }}>
                        POWER ON
                      </span>
                    </div>

                    <div className="acms-card-telemetry-grid">
                      <div className="acms-telemetry-item">
                        <span className="label">Grid Feed:</span>
                        <span className="value text-white" style={{ fontSize: '10.5px' }}>Jockey Feeder (32A MCB)</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Phase Balance:</span>
                        <span className="value text-cyan font-monospace" style={{ fontSize: '10px' }}>R:415V | Y:414V | B:415V</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Breaker State:</span>
                        <span className="value text-success">CLOSED / ENERGIZED</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Earth Leakage:</span>
                        <span className="value text-white font-monospace">12 mA (Safe)</span>
                      </div>
                    </div>

                    <div className="acms-card-action-bar">
                      <span className="text-muted" style={{ fontSize: '10px' }}>● Feeder Energized</span>
                      <button
                        type="button"
                        className="acms-micro-toggle-btn"
                        onClick={() => setHydrantItems(prev => ({
                          ...prev,
                          powerJockeyPump: { ...prev.powerJockeyPump, powerStatus: prev.powerJockeyPump.powerStatus === 'POWER ON' ? 'POWER OFF' : 'POWER ON' }
                        }))}
                      >
                        Toggle Power
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid: Card 8 & 9 (Booster Pump & Booster Power) */}
                <div className="acms-hydrant-status-grid">
                  {/* Card 8: Booster Pump Run Status */}
                  <div className={`acms-compact-status-card ${selectedHydrantItem === 8 ? 'highlighted' : ''}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="acms-hydrant-item-num" style={{ background: '#16B978', color: '#FFF' }}>8</span>
                        <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Booster Pump</span>
                      </div>
                      <span className="acms-status-chip running" style={{ fontSize: '9px', padding: '2px 7px' }}>
                        RUNNING
                      </span>
                    </div>

                    <div className="acms-card-telemetry-grid">
                      <div className="acms-telemetry-item">
                        <span className="label">Location:</span>
                        <span className="value text-white" style={{ fontSize: '10.5px' }}>Terrace / Rooftop</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Power Status:</span>
                        <span className="value text-success">{hydrantItems.boosterPump.powerStatus}</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Flow Output:</span>
                        <span className="value text-white font-monospace">1650 LPM</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Current Draw:</span>
                        <span className="value text-white font-monospace">38.5 A (32 kW)</span>
                      </div>
                    </div>

                    <div className="acms-card-action-bar">
                      <span className="text-muted" style={{ fontSize: '10px' }}>● Rooftop Boost Active</span>
                      <button
                        type="button"
                        className="acms-micro-toggle-btn danger"
                        onClick={() => setHydrantItems(prev => ({
                          ...prev,
                          boosterPump: { ...prev.boosterPump, runStatus: prev.boosterPump.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' }
                        }))}
                      >
                        {hydrantItems.boosterPump.runStatus === 'RUNNING' ? 'Stop Booster' : 'Start Booster'}
                      </button>
                    </div>
                  </div>

                  {/* Card 9: Power to Main Booster Pump */}
                  <div className={`acms-compact-status-card ${selectedHydrantItem === 9 ? 'highlighted' : ''}`}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="acms-hydrant-item-num" style={{ background: '#10B981', color: '#FFF' }}>9</span>
                        <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Power to Booster</span>
                      </div>
                      <span className="acms-status-chip power-on" style={{ fontSize: '9px', padding: '2px 7px' }}>
                        POWER ON
                      </span>
                    </div>

                    <div className="acms-card-telemetry-grid">
                      <div className="acms-telemetry-item">
                        <span className="label">Grid Feed:</span>
                        <span className="value text-white" style={{ fontSize: '10.5px' }}>Booster Feeder (DB-2)</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Phase Balance:</span>
                        <span className="value text-cyan font-monospace" style={{ fontSize: '10px' }}>R:415V | Y:414V | B:415V</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Breaker State:</span>
                        <span className="value text-success">CLOSED / ENERGIZED</span>
                      </div>
                      <div className="acms-telemetry-item">
                        <span className="label">Control Feed:</span>
                        <span className="value text-white font-monospace">24V DC Auto</span>
                      </div>
                    </div>

                    <div className="acms-card-action-bar">
                      <span className="text-muted" style={{ fontSize: '10px' }}>● Feeder Healthy</span>
                      <button
                        type="button"
                        className="acms-micro-toggle-btn"
                        onClick={() => setHydrantItems(prev => ({
                          ...prev,
                          powerBoosterPump: { ...prev.powerBoosterPump, powerStatus: prev.powerBoosterPump.powerStatus === 'POWER ON' ? 'POWER OFF' : 'POWER ON' }
                        }))}
                      >
                        Toggle Power
                      </button>
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
            <div className="acms-clause-banner blue-theme mb-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3.5 z-2 position-relative">
                <div className="acms-banner-icon-badge blue">
                  <Droplets size={26} />
                </div>
                <div>
                  <h4 className="fw-black mb-1 text-white" style={{ letterSpacing: '-0.01em' }}>
                    Clause 3 (c) Fire Water Tanks
                  </h4>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    (i) Underground / Above ground Fire Tank Level Monitoring & (ii) Overhead Tank Low Level Monitoring.
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column align-items-end z-2 position-relative">
                <span className="acms-supervision-pill blue mb-1">
                  <span className="acms-dot-pulse-green"></span>
                  2 / 2 TANKS MONITORED
                </span>
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  <span className="text-success fw-bold">● System Online</span> | Last Updated: {currentTime}
                </span>
              </div>
              <BannerBackdropIllustration color="#168CE0" />
            </div>

            {/* 3-Column SCADA Dashboard: Left Tank 1, Center Building SVG, Right Tank 2 */}
            <div className="acms-scada-3col-layout">
              {/* ────────────────────────────────────────────────────────
                  LEFT COLUMN: Clause (i) Underground Fire Tank
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-scada-card border-blue-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#0284C7', color: '#FFF' }}>1</span>
                      <span className="acms-clause-badge blue">{tankItems.ugTank.clause}</span>
                    </div>
                    <span className="acms-status-chip running">
                      <Check size={12} /> NORMAL
                    </span>
                  </div>
                  <div className="acms-card-title mb-1">{tankItems.ugTank.title}</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11.5px' }}>
                    Monitoring hydrostatic reserve level of dedicated concrete fire sump.
                  </div>

                  {/* Level Progress Bar & Numerical Readout */}
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-baseline mb-1">
                      <span className="text-muted small">Tank Level:</span>
                      <strong className="text-cyan font-monospace fs-5">{tankItems.ugTank.currentKl} / {tankItems.ugTank.capacityKl}</strong>
                      <span className="text-success fw-bold">({tankItems.ugTank.percentage}%)</span>
                    </div>
                    <div className="acms-tank-bar-track" style={{ height: '8px', borderRadius: '4px' }}>
                      <div className="acms-tank-bar-fill" style={{ width: `${tankItems.ugTank.percentage}%`, background: 'linear-gradient(90deg, #0284C7, #06C7F5)' }}></div>
                    </div>
                  </div>

                  {/* 3D Visual Graphic */}
                  <TankCylinderVisual
                    capacity={300}
                    current={tankItems.ugTank.currentKl}
                    percentage={tankItems.ugTank.percentage}
                    maxVal={300}
                    color="#06C7F5"
                  />

                  {/* Detailed Parameters List */}
                  <div className="acms-param-list mt-2">
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Database size={13} className="text-primary" /> Dedicated Sump:</span>
                      <span className="acms-param-value highlight-blue">{tankItems.ugTank.currentKl} ({tankItems.ugTank.percentage}%)</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Activity size={13} /> Water Depth:</span>
                      <span className="acms-param-value font-monospace">{tankItems.ugTank.waterDepth}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Shield size={13} /> Minimum Reserve:</span>
                      <span className="acms-param-value highlight-green">{tankItems.ugTank.minReserve}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><AlertTriangle size={13} /> Low Level Alarm:</span>
                      <span className="acms-param-value highlight-green">{tankItems.ugTank.lowLevelAlarm}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><RotateCcw size={13} /> Auto Makeup Valve:</span>
                      <span className="acms-param-value highlight-green">{tankItems.ugTank.autoMakeUp}</span>
                    </div>
                  </div>
                </div>

                <div className="acms-footer-pill green mt-3">
                  <CheckCircle2 size={14} /> Dedicated UG Fire Sump Level Supervised & Normal
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  CENTER COLUMN: 2.5D Isometric Building SCADA Architecture
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-building-canvas-card">
                {/* Header Strip */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                  <div className="d-flex align-items-center gap-2">
                    <span className="acms-status-chip running" style={{ fontSize: '10.5px' }}>
                      <Check size={11} /> 2 Tanks Supervised
                    </span>
                    <span className="text-white small fw-bold">Dual Storage SCADA Architecture</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-0.5 px-2"
                      style={{ fontSize: '11px', borderRadius: '5px', backdropFilter: 'blur(4px)' }}
                      onClick={() => setExpandedTab('tanks')}
                      title="Open Fullscreen SCADA Architecture & Diagnostics"
                    >
                      <Maximize2 size={12} />
                      <span className="fw-bold">Expand View</span>
                    </button>
                    <div className="text-muted small" style={{ fontSize: '11px' }}>
                      Static Head: <strong className="text-cyan font-monospace">3.85 kg/cm²</strong>
                    </div>
                  </div>
                </div>

                {/* 2.5D Building SVG with Roof OHT and Ground UG Sump */}
                <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '580px', display: 'block' }} fill="none">
                  <defs>
                    <linearGradient id="tanksWallGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1B263B" />
                      <stop offset="100%" stopColor="#0D1527" />
                    </linearGradient>
                    <linearGradient id="tanksFloorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#1E293B" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                    <linearGradient id="tanksWaterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity="0.95" />
                    </linearGradient>
                    <linearGradient id="tanksUgSumpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06C7F5" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#0369A1" stopOpacity="0.95" />
                    </linearGradient>
                  </defs>

                  {/* Plant Room Floor Foundation */}
                  <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                  <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                  {/* 3D Isometric Wall Facade */}
                  <polygon points="100,90 150,68 150,520 100,542" fill="url(#tanksWallGrad)" stroke="#334155" strokeWidth="1.2" />

                  {/* Window slits */}
                  {[100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map(wy => (
                    <line key={`w-${wy}`} x1="112" y1={wy + 16} x2="138" y2={wy + 6} stroke="#38BDF8" strokeWidth="1.8" strokeOpacity="0.45" />
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
                  ].map((fl, idx) => (
                    <g key={fl.label}>
                      {/* Floor Ambient */}
                      <rect x="152" y={fl.y + 2} width="216" height="36" fill="rgba(255,255,255,0.02)" rx="2" />
                      {/* Slab */}
                      <polygon points={`100,${fl.y + 14} 150,${fl.y} 370,${fl.y} 320,${fl.y + 14}`} fill="url(#tanksFloorGrad)" stroke="#334155" strokeWidth="0.8" />
                      <line x1="150" y1={fl.y} x2="370" y2={fl.y} stroke="#475569" strokeWidth="2" />
                      {/* Floor Tag */}
                      <rect x="375" y={fl.y + 8} width="38" height="17" rx="3" fill="#0B1220" stroke="#334155" strokeWidth="1" />
                      <text x="394" y={fl.y + 20} fill="#94A3B8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>
                    </g>
                  ))}

                  {/* ── Rooftop Overhead Fire Tank (46.0 kL / 50 kL - 92%) ── */}
                  <g>
                    {/* Tank Shell */}
                    <rect x="230" y="20" width="105" height="48" rx="5" fill="#0B1220" stroke="#0284C7" strokeWidth="2" />
                    {/* Water Level (92%) */}
                    <rect x="234" y="28" width="97" height="38" rx="3" fill="url(#tanksWaterGrad)" />
                    <ellipse cx="282" cy="28" rx="48" ry="5" fill="#38BDF8" fillOpacity="0.8" />
                    {/* Level Wave */}
                    <path d="M234 30 Q 258 26, 282 30 T 331 30" stroke="#BAE6FD" strokeWidth="1.5" fill="none" opacity="0.8" />
                    {/* Tank Text */}
                    <text x="282" y="44" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">OVERHEAD TANK</text>
                    <text x="282" y="56" fill="#E0F2FE" fontSize="8" fontWeight="bold" textAnchor="middle">46.0 kL (92%)</text>

                    {/* Floating Callout Badge Top */}
                    <g transform="translate(145, 12)">
                      <rect x="0" y="0" width="135" height="24" rx="4" fill="#070D18" stroke="#06C7F5" strokeWidth="1.2" />
                      <circle cx="10" cy="12" r="3.5" fill="#10B981" />
                      <text x="20" y="15" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">Overhead Fire Tank: 46.0 kL (92%)</text>
                    </g>

                    {/* Gravity Downfeed Pipe to Riser */}
                    <path d="M230 44 L 180 44 L 180 520" stroke="#0284C7" strokeWidth="7" fill="none" />
                    <path d="M230 44 L 180 44 L 180 520" stroke="#38BDF8" strokeWidth="3" fill="none" className="water-flow-active" />
                  </g>

                  {/* ── Vertical Main Riser (Red Heavy Industrial) ── */}
                  <line x1="180" y1="44" x2="180" y2="530" stroke="#DC2626" strokeWidth="8" strokeLinecap="round" />
                  <line x1="180" y1="44" x2="180" y2="530" stroke="#EF4444" strokeWidth="3" />

                  {/* ── Floor Landing Valves on each floor ── */}
                  {[108, 148, 188, 228, 268, 308, 348, 388, 428, 468, 508].map(fy => (
                    <g key={`valve-${fy}`}>
                      <line x1="180" y1={fy + 18} x2="202" y2={fy + 18} stroke="#DC2626" strokeWidth="3" />
                      <rect x="202" y={fy + 10} width="16" height="16" rx="2" fill="#B91C1C" stroke="#EF4444" strokeWidth="1" />
                      <circle cx="210" cy={fy + 18} r="4" fill="#FEE2E2" />
                      <circle cx="210" cy={fy + 18} r="1.5" fill="#991B1B" />
                    </g>
                  ))}

                  {/* Riser Pressure Callout Badge */}
                  <g transform="translate(195, 230)">
                    <rect x="0" y="0" width="125" height="34" rx="4" fill="#070D18" stroke="#EF4444" strokeWidth="1.2" />
                    <circle cx="10" cy="12" r="3.5" fill="#EF4444" />
                    <text x="20" y="15" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">Hydrant Riser (Pressurized)</text>
                    <text x="20" y="27" fill="#38BDF8" fontSize="7.5" fontFamily="monospace">Active Head: 3.85 kg/cm²</text>
                  </g>

                  {/* ── Underground Fire Water Tank (Large Sump Cutaway on Right) ── */}
                  <g>
                    {/* Sump Enclosure */}
                    <rect x="340" y="535" width="170" height="130" rx="5" fill="#0B1220" stroke="#0284C7" strokeWidth="2.5" />
                    {/* Water Mass (88.5%) */}
                    <rect x="345" y="552" width="160" height="110" rx="3" fill="url(#tanksUgSumpGrad)" />
                    {/* Animated Waves */}
                    <path d="M345 556 Q 380 550, 425 556 T 505 556 L 505 662 L 345 662 Z" fill="#06C7F5" opacity="0.3" />
                    {/* Depth Gauge Lines */}
                    <line x1="352" y1="560" x2="358" y2="560" stroke="#FFF" strokeWidth="1" opacity="0.7" />
                    <text x="362" y="563" fill="#BAE6FD" fontSize="6.5">3.54m</text>
                    <line x1="352" y1="605" x2="358" y2="605" stroke="#FFF" strokeWidth="1" opacity="0.5" />
                    <text x="362" y="608" fill="#BAE6FD" fontSize="6.5">2.0m</text>
                    <line x1="352" y1="650" x2="358" y2="650" stroke="#FFF" strokeWidth="1" opacity="0.5" />
                    <text x="362" y="653" fill="#BAE6FD" fontSize="6.5">0m</text>

                    {/* Tank Floating Callout Tag */}
                    <g transform="translate(350, 508)">
                      <rect x="0" y="0" width="150" height="24" rx="4" fill="#070D18" stroke="#10B981" strokeWidth="1.2" />
                      <circle cx="10" cy="12" r="3.5" fill="#10B981" />
                      <text x="20" y="15" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">UG Fire Water Tank: 265.5 kL (88.5%)</text>
                    </g>
                  </g>

                  {/* ── Suction Pipe from UG Tank to Basement Pumps ── */}
                  <path d="M345 615 L 75 615 L 75 585" stroke="#0284C7" strokeWidth="6" fill="none" strokeLinecap="round" />
                  <path d="M345 615 L 75 615 L 75 585" stroke="#38BDF8" strokeWidth="2.5" fill="none" className="water-flow-active" />
                  <polygon points="150,612 155,615 150,618" fill="#38BDF8" />
                  <polygon points="230,612 235,615 230,618" fill="#38BDF8" />

                  {/* ── Fire Pumps in Basement ── */}
                  <g>
                    {/* Concrete Foundation */}
                    <rect x="50" y="605" width="115" height="10" rx="2" fill="#334155" stroke="#475569" strokeWidth="0.8" />
                    {/* Pump 1: Electric Hydrant Pump */}
                    <rect x="55" y="565" width="45" height="40" rx="3" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.2" />
                    <circle cx="77" cy="585" r="14" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
                    <circle cx="77" cy="585" r="5" fill="#FEE2E2" />
                    {/* Pump 2: Diesel Standby Pump */}
                    <rect x="110" y="565" width="45" height="40" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="1.2" />
                    <circle cx="132" cy="585" r="14" fill="#D97706" stroke="#B45309" strokeWidth="1" />
                    <circle cx="132" cy="585" r="5" fill="#FEF3C7" />

                    {/* Discharge Header to Building Riser */}
                    <path d="M77 565 L 77 545 L 180 545" stroke="#DC2626" strokeWidth="5" fill="none" />
                    <path d="M132 565 L 132 545" stroke="#DC2626" strokeWidth="5" fill="none" />
                    <circle cx="180" cy="545" r="4" fill="#B91C1C" />

                    {/* Callout: Fire Pumps */}
                    <g transform="translate(50, 625)">
                      <rect x="0" y="0" width="135" height="20" rx="3" fill="#070D18" stroke="#334155" strokeWidth="1" />
                      <text x="67" y="13" fill="#E2E8F0" fontSize="7.5" fontWeight="bold" textAnchor="middle">Fire Pumps (To Hydrant System)</text>
                    </g>

                    {/* Callout: Discharge to Hydrants */}
                    <g transform="translate(190, 540)">
                      <text x="0" y="0" fill="#38BDF8" fontSize="7.5" fontWeight="bold">→ To Hydrants (Building Riser)</text>
                    </g>
                  </g>
                </svg>

                {/* Footer Info Pill */}
                <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25 text-muted small" style={{ fontSize: '11px' }}>
                  <span>Dedicated UG Sump: <strong className="text-cyan">265.5 kL</strong></span>
                  <span>Overhead Tank: <strong className="text-white">46.0 kL</strong></span>
                  <span>Makeup Valve: <strong className="text-success">Auto-Ready</strong></span>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  RIGHT COLUMN: Clause (ii) Overhead Tank Low Level
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-scada-card border-cyan-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#06C7F5', color: '#000' }}>2</span>
                      <span className="acms-clause-badge cyan">{tankItems.ohtTank.clause}</span>
                    </div>
                    <span className="acms-status-chip running">
                      <Check size={12} /> NORMAL
                    </span>
                  </div>
                  <div className="acms-card-title mb-1">{tankItems.ohtTank.title}</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11.5px' }}>
                    Monitoring rooftop gravity fire reserve head with low level alarm supervisory.
                  </div>

                  {/* Level Progress Bar & Numerical Readout */}
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-baseline mb-1">
                      <span className="text-muted small">Tank Level:</span>
                      <strong className="text-cyan font-monospace fs-5">{tankItems.ohtTank.currentKl} / {tankItems.ohtTank.capacityKl}</strong>
                      <span className="text-success fw-bold">({tankItems.ohtTank.percentage}%)</span>
                    </div>
                    <div className="acms-tank-bar-track" style={{ height: '8px', borderRadius: '4px' }}>
                      <div className="acms-tank-bar-fill" style={{ width: `${tankItems.ohtTank.percentage}%`, background: 'linear-gradient(90deg, #06C7F5, #38BDF8)' }}></div>
                    </div>
                  </div>

                  {/* 3D Visual Graphic */}
                  <TankCylinderVisual
                    capacity={50}
                    current={tankItems.ohtTank.currentKl}
                    percentage={tankItems.ohtTank.percentage}
                    maxVal={50}
                    color="#38BDF8"
                  />

                  {/* Detailed Parameters List */}
                  <div className="acms-param-list mt-2">
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Database size={13} className="text-cyan" /> Roof Tank Volume:</span>
                      <span className="acms-param-value highlight-cyan">{tankItems.ohtTank.currentKl} ({tankItems.ohtTank.percentage}%)</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Activity size={13} /> Water Depth:</span>
                      <span className="acms-param-value font-monospace">{tankItems.ohtTank.waterDepth}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Shield size={13} /> Minimum Reserve:</span>
                      <span className="acms-param-value highlight-green">{tankItems.ohtTank.minReserve}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Gauge size={13} /> Static Head:</span>
                      <span className="acms-param-value highlight-green">{tankItems.ohtTank.staticHead}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><AlertTriangle size={13} /> Low Level Alarm:</span>
                      <span className="acms-param-value highlight-green">{tankItems.ohtTank.lowLevelAlarm}</span>
                    </div>
                  </div>
                </div>

                <div className="acms-footer-pill mt-3">
                  <CheckCircle2 size={14} /> Gravity Fire Head Pressure Monitored & Normal
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
                      Clause 3 (c) Fire Water Tanks — Fullscreen SCADA Architecture & Diagnostics
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
            <div className="acms-clause-banner cyan-theme mb-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3.5 z-2 position-relative">
                <div className="acms-banner-icon-badge cyan">
                  <Gauge size={26} />
                </div>
                <div>
                  <h4 className="fw-black mb-1 text-white" style={{ letterSpacing: '-0.01em' }}>
                    Clause 3 (d) Sprinkler
                  </h4>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    Three monitored parameters: (i) Main sprinkler Pump run status, (ii) Power to main sprinkler pump (On / Off), (iii) Sprinkler riser low pressure monitoring.
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column align-items-end z-2 position-relative">
                <span className="acms-supervision-pill cyan mb-1">
                  <span className="acms-dot-pulse-green"></span>
                  3 / 3 ITEMS SUPERVISED
                </span>
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  <span className="text-success fw-bold">● System Online</span> | Last Updated: {currentTime}
                </span>
              </div>
              <BannerBackdropIllustration color="#06C7F5" />
            </div>

            {/* Top 3-Column SCADA Layout: Pump Status, Center Building SVG, Power Status */}
            <div className="acms-scada-3col-layout">
              {/* ────────────────────────────────────────────────────────
                  LEFT COLUMN: Clause (i) Main Sprinkler Pump Run Status
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-scada-card border-cyan-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#EF4444', color: '#FFF' }}>1</span>
                      <span className="acms-clause-badge red">{sprinklerItems.mainPump.clause}</span>
                    </div>
                    <span className={`acms-status-chip ${sprinklerItems.mainPump.runStatus === 'RUNNING' ? 'running' : 'standby'}`}>
                      {sprinklerItems.mainPump.runStatus === 'RUNNING' ? <Play size={11} fill="currentColor" /> : <Sliders size={11} />}
                      {sprinklerItems.mainPump.runStatus}
                    </span>
                  </div>
                  <div className="acms-card-title mb-1">{sprinklerItems.mainPump.title}</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11.5px' }}>
                    Monitoring run status and key parameters of main sprinkler pump.
                  </div>

                  {/* 3D Sprinkler Pump Graphic */}
                  <SprinklerPumpLargeVisual isRunning={sprinklerItems.mainPump.runStatus === 'RUNNING'} />

                  {/* Pump Status Quick Badges */}
                  <div className="d-flex align-items-center justify-content-between p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 mb-2 mt-2">
                    <div className="d-flex align-items-center gap-2">
                      <Sliders size={14} className="text-muted" />
                      <span className="text-muted small">Run Status:</span>
                    </div>
                    <span className={`badge ${sprinklerItems.mainPump.runStatus === 'RUNNING' ? 'bg-success text-white' : 'bg-warning bg-opacity-25 text-warning fw-bold'}`}>
                      {sprinklerItems.mainPump.runStatus}
                    </span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <Power size={14} className="text-muted" />
                      <span className="text-muted small">Power Status:</span>
                    </div>
                    <span className="badge bg-success bg-opacity-25 text-success fw-bold">
                      {sprinklerItems.mainPump.powerStatus}
                    </span>
                  </div>

                  {/* Parameters List */}
                  <div className="acms-param-list mt-2">
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Cpu size={13} className="text-cyan" /> Pump Rating:</span>
                      <span className="acms-param-value">{sprinklerItems.mainPump.rating}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Activity size={13} className="text-cyan" /> Flow Capacity:</span>
                      <span className="acms-param-value highlight-cyan">{sprinklerItems.mainPump.flowRate}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="acms-action-btn-dark mt-3"
                  onClick={() => setSprinklerItems(prev => ({
                    ...prev,
                    mainPump: { ...prev.mainPump, runStatus: prev.mainPump.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' }
                  }))}
                >
                  <Power size={14} /> Toggle Sprinkler Run / Stop
                </button>
              </div>

              {/* ────────────────────────────────────────────────────────
                  CENTER COLUMN: 2.5D Isometric Building SCADA Architecture
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-building-canvas-card">
                {/* Header Strip */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                  <div className="d-flex align-items-center gap-2">
                    <span className="acms-status-chip running" style={{ fontSize: '10.5px' }}>
                      <Check size={11} /> Sprinkler Heads Active
                    </span>
                    <span className="text-white small fw-bold">Floors (1F – 10F) Automatic Fire Suppression</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-0.5 px-2"
                      style={{ fontSize: '11px', borderRadius: '5px', backdropFilter: 'blur(4px)' }}
                      onClick={() => setExpandedTab('sprinkler')}
                      title="Open Fullscreen SCADA Architecture & Diagnostics"
                    >
                      <Maximize2 size={12} />
                      <span className="fw-bold">Expand View</span>
                    </button>
                    <div className="text-muted small" style={{ fontSize: '11px' }}>
                      Header: <strong className="text-cyan font-monospace">{sprinklerItems.riserPressure.currentPressure}</strong>
                    </div>
                  </div>
                </div>

                {/* 2.5D Building SVG with Sprinkler Heads & Spray */}
                <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '580px', display: 'block' }} fill="none">
                  <defs>
                    <linearGradient id="spkWallGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1B263B" />
                      <stop offset="100%" stopColor="#0D1527" />
                    </linearGradient>
                    <linearGradient id="spkFloorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#1E293B" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                    <linearGradient id="sprayGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                      <stop offset="60%" stopColor="#06C7F5" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Basement Plant Room Foundation Floor */}
                  <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                  <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                  {/* 3D Isometric Wall Facade */}
                  <polygon points="100,90 150,68 150,520 100,542" fill="url(#spkWallGrad)" stroke="#334155" strokeWidth="1.2" />

                  {/* Window slits */}
                  {[100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map(wy => (
                    <line key={`sw-${wy}`} x1="112" y1={wy + 16} x2="138" y2={wy + 6} stroke="#38BDF8" strokeWidth="1.8" strokeOpacity="0.45" />
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
                  ].map((fl, idx) => (
                    <g key={fl.label}>
                      {/* Floor Ambient */}
                      <rect x="152" y={fl.y + 2} width="216" height="36" fill="rgba(255,255,255,0.02)" rx="2" />
                      {/* Slab */}
                      <polygon points={`100,${fl.y + 14} 150,${fl.y} 370,${fl.y} 320,${fl.y + 14}`} fill="url(#spkFloorGrad)" stroke="#334155" strokeWidth="0.8" />
                      <line x1="150" y1={fl.y} x2="370" y2={fl.y} stroke="#475569" strokeWidth="2" />
                      {/* Floor Tag */}
                      <rect x="375" y={fl.y + 8} width="38" height="17" rx="3" fill="#0B1220" stroke="#334155" strokeWidth="1" />
                      <text x="394" y={fl.y + 20} fill="#94A3B8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>

                      {/* Floor Sprinkler System (Branch Pipe, Pendant Heads, and Spray Mist) */}
                      {idx > 0 && (
                        <g>
                          {/* Ceiling Branch Pipe */}
                          <line x1="190" y1={fl.y + 6} x2="350" y2={fl.y + 6} stroke="#0284C7" strokeWidth="2.5" />
                          <circle cx="190" cy={fl.y + 6} r="2.5" fill="#38BDF8" />

                          {/* Sprinkler Head 1 */}
                          <g transform={`translate(230, ${fl.y + 6})`}>
                            <line x1="0" y1="0" x2="0" y2="4" stroke="#DC2626" strokeWidth="2" />
                            <circle cx="0" cy="5" r="2" fill="#F59E0B" />
                            {/* Water Spray Cone */}
                            <polygon points="-8,18 0,6 8,18" fill="url(#sprayGrad)" className="scada-spray-mist" />
                            <circle cx="0" cy="6" r="1.2" fill="#FFF" />
                          </g>

                          {/* Sprinkler Head 2 */}
                          <g transform={`translate(285, ${fl.y + 6})`}>
                            <line x1="0" y1="0" x2="0" y2="4" stroke="#DC2626" strokeWidth="2" />
                            <circle cx="0" cy="5" r="2" fill="#F59E0B" />
                            {/* Water Spray Cone */}
                            <polygon points="-8,18 0,6 8,18" fill="url(#sprayGrad)" className="scada-spray-mist" />
                            <circle cx="0" cy="6" r="1.2" fill="#FFF" />
                          </g>

                          {/* Sprinkler Head 3 */}
                          <g transform={`translate(335, ${fl.y + 6})`}>
                            <line x1="0" y1="0" x2="0" y2="4" stroke="#DC2626" strokeWidth="2" />
                            <circle cx="0" cy="5" r="2" fill="#F59E0B" />
                            {/* Water Spray Cone */}
                            <polygon points="-8,18 0,6 8,18" fill="url(#sprayGrad)" className="scada-spray-mist" />
                            <circle cx="0" cy="6" r="1.2" fill="#FFF" />
                          </g>
                        </g>
                      )}
                    </g>
                  ))}

                  {/* ── Rooftop Fire Water Storage Tank ── */}
                  <g>
                    <rect x="230" y="22" width="105" height="46" rx="4" fill="#0B1220" stroke="#0284C7" strokeWidth="2" />
                    <rect x="234" y="30" width="97" height="36" rx="2" fill="#0284C7" fillOpacity="0.75" />
                    <text x="282" y="44" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" textAnchor="middle">FIRE WATER TANK</text>
                    <text x="282" y="55" fill="#BAE6FD" fontSize="7.5" textAnchor="middle">Supervised Reserve</text>
                  </g>

                  {/* ── Main Sprinkler Riser (Cyan & Red Metallic Heavy Pipe) ── */}
                  <line x1="190" y1="46" x2="190" y2="530" stroke="#0284C7" strokeWidth="8" strokeLinecap="round" />
                  <line x1="190" y1="46" x2="190" y2="530" stroke="#38BDF8" strokeWidth="3" className="water-flow-active" />

                  {/* Top Tag: Sprinkler Riser */}
                  <g transform="translate(195, 78)">
                    <rect x="0" y="0" width="85" height="18" rx="3" fill="#070D18" stroke="#06C7F5" strokeWidth="1" />
                    <text x="42" y="12" fill="#BAE6FD" fontSize="7.5" fontWeight="bold" textAnchor="middle">Sprinkler Riser</text>
                  </g>

                  {/* Inset Callout Badge: Floors (1F - 10F) Sprinkler Heads */}
                  <g transform="translate(195, 235)">
                    <rect x="0" y="0" width="145" height="42" rx="4" fill="#070D18" stroke="#06C7F5" strokeWidth="1.2" />
                    <text x="72" y="14" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" textAnchor="middle">Floors (1F – 10F)</text>
                    <text x="72" y="26" fill="#38BDF8" fontSize="8" textAnchor="middle">Sprinkler Heads</text>
                    <circle cx="16" cy="33" r="3" fill="#10B981" />
                    <text x="24" y="36" fill="#A7F3D0" fontSize="7">Pendant Bulbs Supervised</text>
                  </g>

                  {/* ── Basement Plant Room: Main Sprinkler Pump & Piping ── */}
                  <g>
                    {/* Concrete Foundation Pad */}
                    <rect x="60" y="605" width="110" height="12" rx="2" fill="#334155" stroke="#475569" strokeWidth="0.8" />
                    {/* Red Centrifugal Sprinkler Pump */}
                    <rect x="65" y="560" width="50" height="45" rx="3" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.5" />
                    <line x1="73" y1="562" x2="73" y2="603" stroke="#991B1B" strokeWidth="2.5" />
                    <line x1="83" y1="562" x2="83" y2="603" stroke="#991B1B" strokeWidth="2.5" />
                    <line x1="93" y1="562" x2="93" y2="603" stroke="#991B1B" strokeWidth="2.5" />
                    <line x1="103" y1="562" x2="103" y2="603" stroke="#991B1B" strokeWidth="2.5" />

                    {/* Volute Casing */}
                    <circle cx="135" cy="582" r="18" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
                    <g className={sprinklerItems.mainPump.runStatus === 'RUNNING' ? "scada-spin" : ""} style={{ transformOrigin: '135px 582px', transformBox: 'view-box' }}>
                      <circle cx="135" cy="582" r="6" fill="#FEE2E2" />
                      <line x1="135" y1="568" x2="135" y2="596" stroke="#FFFFFF" strokeWidth="2.5" />
                      <line x1="121" y1="582" x2="149" y2="582" stroke="#FFFFFF" strokeWidth="2.5" />
                    </g>

                    {/* Pipe Connection from Water Tank to Pump */}
                    <path d="M25 582 L 65 582" stroke="#0284C7" strokeWidth="6" fill="none" />
                    <path d="M25 582 L 65 582" stroke="#38BDF8" strokeWidth="2.5" fill="none" className="water-flow-active" />
                    <text x="25" y="572" fill="#38BDF8" fontSize="7.5" fontWeight="bold">From Fire Water Tank</text>

                    {/* Pipe Connection from Pump to Sprinkler Riser */}
                    <path d="M153 582 L 190 582 L 190 530" stroke="#0284C7" strokeWidth="6" fill="none" />
                    <path d="M153 582 L 190 582 L 190 530" stroke="#38BDF8" strokeWidth="2.5" fill="none" className="water-flow-active" />
                    <text x="195" y="572" fill="#38BDF8" fontSize="7.5" fontWeight="bold">To Sprinkler Riser</text>

                    {/* Callout Badge: Main Sprinkler Pump */}
                    <g transform="translate(60, 624)">
                      <rect x="0" y="0" width="135" height="26" rx="4" fill="#070D18" stroke="#06C7F5" strokeWidth="1" />
                      <text x="67" y="12" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">Main Sprinkler Pump</text>
                      <rect x="28" y="15" width="80" height="9" rx="2" fill="#F59E0B" fillOpacity="0.25" />
                      <text x="68" y="22" fill="#FBBF24" fontSize="6.5" fontWeight="bold" textAnchor="middle">STANDBY AUTO</text>
                    </g>
                  </g>
                </svg>

                {/* Footer Info Pill */}
                <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25 text-muted small" style={{ fontSize: '11px' }}>
                  <span>Floors Monitored: <strong className="text-white">10 Floors (Pendant Glass Bulb)</strong></span>
                  <span>Header Supervised: <strong className="text-cyan">9.41 kg/cm²</strong></span>
                  <span>Auto Cut-In: <strong className="text-warning">7.50 kg/cm²</strong></span>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  RIGHT COLUMN: Clause (ii) Power to Main Sprinkler Pump
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-scada-card border-purple-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#06C7F5', color: '#000' }}>2</span>
                      <span className="acms-clause-badge cyan">{sprinklerItems.powerMainPump.clause}</span>
                    </div>
                    <span className="acms-status-chip power-on">
                      <Zap size={11} /> {sprinklerItems.powerMainPump.powerStatus}
                    </span>
                  </div>
                  <div className="acms-card-title mb-1">{sprinklerItems.powerMainPump.title}</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11.5px' }}>
                    Monitoring electrical supply and feeder status.
                  </div>

                  {/* 3D Electrical Panel Visual */}
                  <PowerPanelLargeVisual isPowered={sprinklerItems.powerMainPump.powerStatus === 'POWER ON'} />

                  {/* Power Parameters List */}
                  <div className="acms-param-list mt-2">
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Zap size={13} className="text-warning" /> Power Status:</span>
                      <span className="acms-param-value highlight-green">{sprinklerItems.powerMainPump.powerStatus}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Server size={13} /> Feeder Breaker:</span>
                      <span className="acms-param-value" style={{ fontSize: '11px' }}>{sprinklerItems.powerMainPump.feed}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Activity size={13} /> Supply Voltage:</span>
                      <span className="acms-param-value font-monospace">{sprinklerItems.powerMainPump.voltage}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Power size={13} /> Contactor State:</span>
                      <span className="acms-param-value highlight-green">{sprinklerItems.powerMainPump.breakerState}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="acms-action-btn-dark mt-3"
                  onClick={() => setSprinklerItems(prev => ({
                    ...prev,
                    powerMainPump: { ...prev.powerMainPump, powerStatus: prev.powerMainPump.powerStatus === 'POWER ON' ? 'POWER OFF' : 'POWER ON' }
                  }))}
                >
                  <Zap size={14} /> Toggle Sprinkler Power
                </button>
              </div>
            </div>

            {/* ────────────────────────────────────────────────────────
                BOTTOM CARD: Clause (iii) Sprinkler Riser Low Pressure Monitoring
                ──────────────────────────────────────────────────────── */}
            <div className="acms-pressure-range-wrapper mt-3">
              <div style={{ flex: '1 1 280px' }}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="acms-hydrant-item-num" style={{ background: '#8B5CF6', color: '#FFF' }}>3</span>
                  <span className="acms-clause-badge purple">{sprinklerItems.riserPressure.clause}</span>
                  <strong className="text-white fs-6">{sprinklerItems.riserPressure.title}</strong>
                </div>
                <div className="text-muted small" style={{ fontSize: '12px' }}>
                  Monitoring sprinkler header pressure with cut-in and cut-out limits.
                </div>

                <div className="d-flex align-items-center gap-3 mt-3">
                  <div className="acms-equip-icon-box cyan" style={{ width: '42px', height: '42px' }}>
                    <Gauge size={22} className="text-cyan" />
                  </div>
                  <div>
                    <div className="text-muted small" style={{ fontSize: '11px' }}>Header Pressure</div>
                    <div className="text-cyan fw-black font-monospace fs-4" style={{ letterSpacing: '-0.02em' }}>
                      {sprinklerItems.riserPressure.currentPressure}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pressure Range Bar with Markers */}
              <div style={{ flex: '2 1 380px' }}>
                <div className="d-flex justify-content-between text-muted small mb-1" style={{ fontSize: '11px' }}>
                  <span>0 kg/cm²</span>
                  <span>Pressure Range (0 – 15 kg/cm²)</span>
                  <span>15 kg/cm²</span>
                </div>

                <div className="acms-pressure-range-bar">
                  {/* Cut-In Marker (7.50) -> 50% */}
                  <div className="acms-range-marker" style={{ left: '50%' }}>
                    <span className="text-warning">7.50 kg/cm²</span>
                    <span className="text-muted" style={{ fontSize: '9px' }}>(Cut-In)</span>
                    <div className="acms-range-marker-pin" style={{ background: '#F59E0B' }}></div>
                  </div>

                  {/* Current Marker (9.41) -> 62.7% */}
                  <div className="acms-range-marker current" style={{ left: '62.7%' }}>
                    <span className="text-white fw-bold">Current</span>
                    <span className="text-cyan font-monospace fw-bold">9.41 kg/cm²</span>
                    <div className="acms-range-marker-pin" style={{ background: '#06C7F5', width: '16px', height: '16px' }}></div>
                  </div>

                  {/* Cut-Out Marker (10.50) -> 70% */}
                  <div className="acms-range-marker" style={{ left: '70%' }}>
                    <span className="text-danger">10.50 kg/cm²</span>
                    <span className="text-muted" style={{ fontSize: '9px' }}>(Cut-Out)</span>
                    <div className="acms-range-marker-pin" style={{ background: '#EF4444' }}></div>
                  </div>
                </div>
              </div>

              {/* Right Settings and Trend Graph Button */}
              <div style={{ flex: '1 1 240px' }} className="d-flex flex-column align-items-end justify-content-between gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 px-3 py-1.5"
                  style={{ borderRadius: '6px' }}
                  onClick={() => openPressureGraph('sprinkler')}
                >
                  <BarChart3 size={14} />
                  <span className="fw-bold">View Trend Graph</span>
                </button>

                <div className="text-end small">
                  <div>Cut-In Limit: <strong className="text-warning">{sprinklerItems.riserPressure.cutInLimit}</strong></div>
                  <div>Cut-Out Limit: <strong className="text-danger">{sprinklerItems.riserPressure.cutOutLimit}</strong></div>
                  <div className="text-success fw-bold mt-1">
                    <CheckCircle2 size={13} className="d-inline me-1" />
                    Status: NORMAL (Within Cut-In / Cut-Out window)
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
            <div className="acms-clause-banner mb-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3.5 z-2 position-relative">
                <div className="acms-banner-icon-badge">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <h4 className="fw-black mb-1 text-white" style={{ letterSpacing: '-0.01em' }}>
                    Clause 3 (e) Detection System
                  </h4>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    (i) Detection operation status (On / Off) (Fire panel status), (ii) Control Panel / Repeater Panel status & (iii) Battery of Control Panel status.
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column align-items-end z-2 position-relative">
                <span className="acms-supervision-pill danger mb-1">
                  <span className="acms-dot-pulse-green"></span>
                  3 / 3 ITEMS SUPERVISED
                </span>
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  <span className="text-success fw-bold">● System Online</span> | Last Updated: {currentTime}
                </span>
              </div>
              <BannerBackdropIllustration color="#EF3340" />
            </div>

            {/* 3-Column SCADA Layout: Panel Operation, Center Building SVG, Panels & Battery Status */}
            <div className="acms-scada-3col-layout">
              {/* ────────────────────────────────────────────────────────
                  LEFT COLUMN: Clause (i) Detection Operation Status
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-scada-card border-red-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#EF4444', color: '#FFF' }}>1</span>
                      <span className="acms-clause-badge red">{detectionItems.panelOperation.clause}</span>
                    </div>
                    <span className={`acms-status-chip ${detectionItems.panelOperation.operationStatus === 'ON' ? 'running' : 'stopped'}`}>
                      {detectionItems.panelOperation.operationStatus === 'ON' ? <Play size={10} fill="currentColor" /> : <Power size={10} />}
                      {detectionItems.panelOperation.operationStatus} (ACTIVE)
                    </span>
                  </div>
                  <div className="acms-card-title mb-1">{detectionItems.panelOperation.title}</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11.5px' }}>
                    Fire alarm control panel operation status and network health.
                  </div>

                  {/* 3D FACP Panel Visual */}
                  <FacpLargeVisual isOnline={detectionItems.panelOperation.operationStatus === 'ON'} />

                  {/* Panel Parameters List */}
                  <div className="acms-param-list mt-2">
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Power size={13} className="text-success" /> Operation State:</span>
                      <span className="acms-param-value highlight-green">{detectionItems.panelOperation.operationStatus} (Active)</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><ShieldCheck size={13} className="text-success" /> System Health:</span>
                      <span className="acms-param-value highlight-green">{detectionItems.panelOperation.systemHealth}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Radio size={13} /> Monitored Points:</span>
                      <span className="acms-param-value font-monospace">{detectionItems.panelOperation.monitoredPoints}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Activity size={13} /> Active Loops:</span>
                      <span className="acms-param-value highlight-green">{detectionItems.panelOperation.healthyLoops}</span>
                    </div>
                  </div>

                  {/* Device Status Overview Grid Box */}
                  <div className="p-2 rounded bg-dark bg-opacity-60 border border-secondary border-opacity-25 mt-3">
                    <div className="text-muted small fw-bold text-uppercase mb-2" style={{ fontSize: '10px', letterSpacing: '0.04em' }}>
                      Device Status Overview
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="p-2 rounded bg-secondary bg-opacity-10 border border-secondary border-opacity-15">
                          <div className="text-muted" style={{ fontSize: '10px' }}>Smoke Detectors</div>
                          <div className="text-success fw-bold font-monospace" style={{ fontSize: '12px' }}>Normal 986/986</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-secondary bg-opacity-10 border border-secondary border-opacity-15">
                          <div className="text-muted" style={{ fontSize: '10px' }}>Heat Detectors</div>
                          <div className="text-success fw-bold font-monospace" style={{ fontSize: '12px' }}>Normal 120/120</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-secondary bg-opacity-10 border border-secondary border-opacity-15">
                          <div className="text-muted" style={{ fontSize: '10px' }}>Manual Call Points</div>
                          <div className="text-success fw-bold font-monospace" style={{ fontSize: '12px' }}>Normal 48/48</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-secondary bg-opacity-10 border border-secondary border-opacity-15">
                          <div className="text-muted" style={{ fontSize: '10px' }}>BMS Interface</div>
                          <div className="text-info fw-bold font-monospace" style={{ fontSize: '12px' }}>Online 1/1</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2 mt-3">
                  <button
                    type="button"
                    className="acms-action-btn-red d-flex align-items-center justify-content-center gap-2"
                    onClick={() => {
                      const nextState = detectionItems.panelOperation.operationStatus === 'ON' ? 'OFF' : 'ON';
                      setDetectionItems(prev => ({
                        ...prev,
                        panelOperation: { ...prev.panelOperation, operationStatus: nextState }
                      }));
                      if (nextState === 'ON') {
                        triggerVoiceAnnouncement('Attention: Fire Detection System is now ON. All addressable sensors, smoke detectors, and control panels are active and healthy.', 'on');
                      } else {
                        triggerVoiceAnnouncement('Warning: Fire Detection System has been switched OFF.', 'off');
                      }
                    }}
                  >
                    <Power size={14} />
                    <span>{detectionItems.panelOperation.operationStatus === 'ON' ? 'Switch Detection OFF' : 'Switch Detection ON'}</span>
                    {isVoiceSpeaking && <Volume2 size={14} className="text-warning scada-pulse" />}
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-warning w-100 d-flex align-items-center justify-content-center gap-2 py-1.5"
                    style={{ fontSize: '11px', borderRadius: '6px', backdropFilter: 'blur(4px)' }}
                    onClick={() => {
                      triggerVoiceAnnouncement('Emergency Voice Alarm: Attention please, attention please. A fire condition has been detected. Please evacuate the building immediately using the nearest exit stairways. Do not use the lifts.', 'alarm');
                    }}
                  >
                    <Volume2 size={13} />
                    <span>Broadcast Voice Evacuation Alert</span>
                  </button>

                  {isVoiceSpeaking && (
                    <div className="p-2 rounded bg-danger bg-opacity-20 border border-danger border-opacity-40 d-flex align-items-center gap-2">
                      <Volume2 size={16} className="text-danger scada-pulse flex-shrink-0" />
                      <div className="text-danger fw-bold" style={{ fontSize: '10.5px', lineHeight: 1.3 }}>
                        Voice Playing: <span className="text-white fw-normal font-monospace">"{voiceAnnouncementText}"</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  CENTER COLUMN: 2.5D Isometric Building SCADA Architecture
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-building-canvas-card">
                {/* Header Strip */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                  <div className="d-flex align-items-center gap-2">
                    <span className="acms-status-chip running" style={{ fontSize: '10.5px' }}>
                      <Check size={11} /> 8 SLC Loops Supervised
                    </span>
                    <span className="text-white small fw-bold">Signaling Line Circuit (SLC) Addressable Network</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-0.5 px-2"
                      style={{ fontSize: '11px', borderRadius: '5px', backdropFilter: 'blur(4px)' }}
                      onClick={() => setExpandedTab('detection')}
                      title="Open Fullscreen SCADA Architecture & Diagnostics"
                    >
                      <Maximize2 size={12} />
                      <span className="fw-bold">Expand View</span>
                    </button>
                    <div className="text-muted small" style={{ fontSize: '11px' }}>
                      Active Units: <strong className="text-cyan font-monospace">1016</strong>
                    </div>
                  </div>
                </div>

                {/* 2.5D Building SVG with Smoke Detectors & SLC Cable */}
                <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '580px', display: 'block' }} fill="none">
                  <defs>
                    <linearGradient id="detWallGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1B263B" />
                      <stop offset="100%" stopColor="#0D1527" />
                    </linearGradient>
                    <linearGradient id="detFloorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#1E293B" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                  </defs>

                  {/* Foundation Floor */}
                  <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                  <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                  {/* 3D Isometric Wall Facade */}
                  <polygon points="100,90 150,68 150,520 100,542" fill="url(#detWallGrad)" stroke="#334155" strokeWidth="1.2" />

                  {/* Window slits */}
                  {[100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map(wy => (
                    <line key={`dw-${wy}`} x1="112" y1={wy + 16} x2="138" y2={wy + 6} stroke="#38BDF8" strokeWidth="1.8" strokeOpacity="0.45" />
                  ))}

                  {/* Front Interior Building Facade */}
                  <rect x="150" y="68" width="230" height="452" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

                  {/* Left-Side Floor Indicators (Roof down to Ground) with Green LED */}
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
                    <g key={`det-${fl.label}`}>
                      {/* Floor Ambient */}
                      <rect x="152" y={fl.y + 2} width="226" height="36" fill="rgba(255,255,255,0.02)" rx="2" />
                      {/* Slab */}
                      <polygon points={`100,${fl.y + 14} 150,${fl.y} 380,${fl.y} 330,${fl.y + 14}`} fill="url(#detFloorGrad)" stroke="#334155" strokeWidth="0.8" />
                      <line x1="150" y1={fl.y} x2="380" y2={fl.y} stroke="#475569" strokeWidth="2" />

                      {/* Left Badge with Green Status LED */}
                      <rect x="52" y={fl.y + 7} width="42" height="18" rx="3" fill="#0B1220" stroke="#334155" strokeWidth="1" />
                      <circle cx="60" cy={fl.y + 16} r="2.5" fill="#10B981" />
                      <text x="76" y={fl.y + 19} fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>

                      {/* Ceiling Mounted Optical Smoke Detectors */}
                      {idx > 0 && (
                        <g>
                          {/* Smoke Detector 1 */}
                          <g transform={`translate(225, ${fl.y + 5})`}>
                            <ellipse cx="0" cy="2" rx="9" ry="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
                            <circle cx="0" cy="3" r="1.5" fill="#EF4444" className="scada-blink" />
                          </g>

                          {/* Smoke Detector 2 */}
                          <g transform={`translate(295, ${fl.y + 5})`}>
                            <ellipse cx="0" cy="2" rx="9" ry="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
                            <circle cx="0" cy="3" r="1.5" fill="#EF4444" className="scada-blink" />
                          </g>

                          {/* Wall Manual Call Point on Floor */}
                          <rect x="350" y={fl.y + 12} width="10" height="12" rx="1.5" fill="#DC2626" stroke="#EF4444" strokeWidth="0.8" />
                          <circle cx="355" cy={fl.y + 17} r="2" fill="#FEE2E2" />
                        </g>
                      )}
                    </g>
                  ))}

                  {/* ── Glowing Red Addressable Fire Alarm Loop (SLC) ── */}
                  {/* Vertical Trunk Line */}
                  <line x1="190" y1="76" x2="190" y2="520" stroke="#EF4444" strokeWidth="2.5" />
                  <line x1="190" y1="76" x2="190" y2="520" stroke="#FCA5A5" strokeWidth="1" strokeDasharray="4 3" />

                  {/* Horizontal Branch Loops to Detectors on Floors */}
                  {[108, 148, 188, 228, 268, 308, 348, 388, 428, 468, 508].map(fy => (
                    <g key={`loop-${fy}`}>
                      <path d={`M190 ${fy + 6} L 350 ${fy + 6} L 350 ${fy + 14}`} stroke="#EF4444" strokeWidth="1.2" strokeDasharray="3 2" fill="none" opacity="0.85" />
                    </g>
                  ))}

                  {/* Callout Badge: Smoke Detector Normal on Top Floor */}
                  <g transform="translate(250, 112)">
                    <rect x="0" y="0" width="130" height="28" rx="4" fill="#070D18" stroke="#EF4444" strokeWidth="1.2" />
                    <circle cx="12" cy="14" r="3.5" fill="#10B981" />
                    <text x="22" y="14" fill="#FFFFFF" fontSize="8" fontWeight="bold">Smoke Detector</text>
                    <text x="22" y="23" fill="#10B981" fontSize="7" fontWeight="bold">Normal</text>
                  </g>

                  {/* Callout Badge: Manual Call Point Normal on Floor 6 */}
                  <g transform="translate(250, 272)">
                    <rect x="0" y="0" width="130" height="28" rx="4" fill="#070D18" stroke="#EF4444" strokeWidth="1.2" />
                    <circle cx="12" cy="14" r="3.5" fill="#10B981" />
                    <text x="22" y="14" fill="#FFFFFF" fontSize="8" fontWeight="bold">Manual Call Point</text>
                    <text x="22" y="23" fill="#10B981" fontSize="7" fontWeight="bold">Normal</text>
                  </g>

                  {/* Loop Identification Tag */}
                  <g transform="translate(200, 480)">
                    <rect x="0" y="0" width="130" height="18" rx="3" fill="#B91C1C" />
                    <text x="65" y="12" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">Fire Alarm Loop (SLC)</text>
                  </g>

                  {/* ── Ground Floor / Plant Room Control Panels ── */}
                  <g>
                    {/* Main Fire Alarm Panel (FACP) */}
                    <g transform="translate(195, 545)">
                      <rect x="0" y="0" width="85" height="58" rx="3" fill="#7F1D1D" stroke="#EF4444" strokeWidth="1.5" />
                      <rect x="8" y="8" width="69" height="18" rx="1.5" fill="#070D18" stroke="#334155" strokeWidth="0.8" />
                      <text x="42" y="19" fill="#10B981" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">FACP NORMAL</text>
                      <circle cx="16" cy="36" r="3" fill="#10B981" />
                      <circle cx="28" cy="36" r="3" fill="#475569" />
                      <rect x="42" y="32" width="35" height="18" rx="1.5" fill="#0B1220" />
                      {/* Connection to SLC vertical trunk */}
                      <line x1="0" y1="20" x2="-5" y2="20" stroke="#EF4444" strokeWidth="2.5" />
                    </g>
                    <rect x="180" y="608" width="115" height="24" rx="3" fill="#070D18" stroke="#EF4444" strokeWidth="1" />
                    <text x="237" y="620" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">Fire Panel</text>
                    <text x="237" y="628" fill="#94A3B8" fontSize="6.5" textAnchor="middle">(Main Control Panel)</text>

                    {/* Repeater Panel (Lobby) */}
                    <g transform="translate(345, 555)">
                      <rect x="0" y="0" width="70" height="48" rx="3" fill="#1E293B" stroke="#06C7F5" strokeWidth="1.5" />
                      <rect x="8" y="8" width="54" height="14" rx="1.5" fill="#070D18" stroke="#334155" strokeWidth="0.8" />
                      <text x="35" y="18" fill="#06C7F5" fontSize="6" fontWeight="bold" fontFamily="monospace" textAnchor="middle">REPEATER</text>
                      <circle cx="16" cy="32" r="2.5" fill="#10B981" />
                      <circle cx="26" cy="32" r="2.5" fill="#10B981" />
                    </g>
                    <rect x="330" y="608" width="100" height="24" rx="3" fill="#070D18" stroke="#06C7F5" strokeWidth="1" />
                    <text x="380" y="620" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">Repeater Panel</text>
                    <text x="380" y="628" fill="#94A3B8" fontSize="6.5" textAnchor="middle">(Lobby Area)</text>

                    {/* RS-485 Interconnecting Cable between FACP and Repeater */}
                    <path d="M280 575 L 345 575" stroke="#06C7F5" strokeWidth="2" strokeDasharray="3 2" fill="none" />
                  </g>
                </svg>

                {/* Footer Info Pill */}
                <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25 text-muted small" style={{ fontSize: '11px' }}>
                  <span>Monitored Units: <strong className="text-white">1016 Addressable Points</strong></span>
                  <span>Loops: <strong className="text-success">8 / 8 Active & Polling</strong></span>
                  <span>Communication: <strong className="text-cyan">BACnet / IP & RS-485</strong></span>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  RIGHT COLUMN: Clause (ii) Repeater Panels + Clause (iii) Battery
                  ──────────────────────────────────────────────────────── */}
              <div className="d-flex flex-column gap-3">
                {/* Clause (ii) Control Panel / Repeater Panel Status */}
                <div className="acms-scada-card border-purple-glow p-3">
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#8B5CF6', color: '#FFF' }}>2</span>
                      <span className="acms-clause-badge purple">{detectionItems.repeaterPanels.clause}</span>
                    </div>
                    <span className="acms-status-chip running">
                      <Check size={11} /> ALL WORKING
                    </span>
                  </div>
                  <div className="acms-card-title mb-1" style={{ fontSize: '13px' }}>{detectionItems.repeaterPanels.title}</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                    (working / non-working)
                  </div>

                  {/* Panel Detailed Status List */}
                  <div className="acms-param-list">
                    {detectionItems.repeaterPanels.panels.map((p, i) => (
                      <div key={i} className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 mb-1.5">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <strong className="text-white small" style={{ fontSize: '11.5px' }}>{p.name}</strong>
                          <span className="badge bg-success bg-opacity-25 text-success fw-bold" style={{ fontSize: '9.5px' }}>{p.status}</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '10.5px' }}>
                          <span>Comms: <span className="text-info">{p.comms}</span></span>
                          <span className="text-success">● ONLINE</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="acms-footer-pill mt-2">
                    <CheckCircle2 size={13} /> All 3 Repeater Panels Polling Normal
                  </div>
                </div>

                {/* Clause (iii) Battery of Control Panel Status */}
                <div className="acms-scada-card border-cyan-glow p-3">
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#06C7F5', color: '#000' }}>3</span>
                      <span className="acms-clause-badge cyan">{detectionItems.batteryStatus.clause}</span>
                    </div>
                    <span className="acms-status-chip running">
                      <Check size={11} /> {detectionItems.batteryStatus.batteryHealth}
                    </span>
                  </div>
                  <div className="acms-card-title mb-1" style={{ fontSize: '13px' }}>{detectionItems.batteryStatus.title}</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                    (Healthy / Low, Voltage)
                  </div>

                  {/* 3D Dual Battery Bank Graphic */}
                  <BatteryBankVisual percentage={detectionItems.batteryStatus.percentage} voltage={detectionItems.batteryStatus.floatVoltage} />

                  {/* Battery Parameters */}
                  <div className="acms-param-list mt-2">
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Battery size={13} className="text-cyan" /> Battery Capacity:</span>
                      <div className="d-flex align-items-center gap-2">
                        <div className="acms-tank-bar-track" style={{ width: '80px', height: '6px' }}>
                          <div className="acms-tank-bar-fill" style={{ width: `${detectionItems.batteryStatus.percentage}%`, background: '#10B981' }}></div>
                        </div>
                        <span className="acms-param-value highlight-green">{detectionItems.batteryStatus.percentage}%</span>
                      </div>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Zap size={13} className="text-warning" /> Voltage:</span>
                      <span className="acms-param-value highlight-green font-monospace">{detectionItems.batteryStatus.floatVoltage}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Server size={13} /> Mains Status:</span>
                      <span className="acms-param-value highlight-green">{detectionItems.batteryStatus.mainsAcStatus}</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Clock size={13} /> Autonomy:</span>
                      <span className="acms-param-value" style={{ fontSize: '11px' }}>{detectionItems.batteryStatus.autonomy}</span>
                    </div>
                  </div>

                  <div className="acms-footer-pill green mt-2">
                    <CheckCircle2 size={13} /> 24V DC Float Battery Charger Supervised
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
            <div className="acms-clause-banner mb-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3.5 z-2 position-relative">
                <div className="acms-banner-icon-badge">
                  <AlertOctagon size={26} />
                </div>
                <div>
                  <h4 className="fw-black mb-1 text-white" style={{ letterSpacing: '-0.01em' }}>
                    Clause 3 (f) Manual Call Points
                  </h4>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    Manual Call Point operating Status (On / Off) (Normal / Triggered).
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column align-items-end z-2 position-relative">
                <span className="acms-supervision-pill danger mb-1">
                  <span className="acms-dot-pulse-green"></span>
                  ALL 42 MCP UNITS SUPERVISED
                </span>
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  <span className="text-success fw-bold">● System Online</span> | Last Updated: {currentTime}
                </span>
              </div>
              <BannerBackdropIllustration color="#EF3340" />
            </div>

            {/* 3-Column SCADA Layout: Network Overview & Filters, Center Building SVG, MCP Device Cards */}
            <div className="acms-scada-3col-layout">
              {/* ────────────────────────────────────────────────────────
                  LEFT COLUMN: MCP Network Overview & Zone Filters
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-scada-card border-red-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#EF4444', color: '#FFF' }}>1</span>
                      <span className="acms-clause-badge red">Clause 3(f)</span>
                    </div>
                    <span className="acms-status-chip running">
                      <Check size={11} /> LOOP HEALTHY
                    </span>
                  </div>
                  <div className="acms-card-title mb-1">Supervised Break Glass Network</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11.5px' }}>
                    Class-A dual return addressable circuit supervising all emergency manual call points.
                  </div>

                  {/* Network Parameters */}
                  <div className="acms-param-list mt-2">
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Radio size={13} /> Monitored Units:</span>
                      <span className="acms-param-value highlight-cyan">42 Addressable MCPs</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Zap size={13} className="text-warning" /> Loop Voltage:</span>
                      <span className="acms-param-value highlight-green font-monospace">24.2 V DC Supervised</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Activity size={13} /> Response Time:</span>
                      <span className="acms-param-value highlight-green">&lt; 1.2 Seconds</span>
                    </div>
                    <div className="acms-param-row">
                      <span className="acms-param-label"><Shield size={13} /> Network Protocol:</span>
                      <span className="acms-param-value font-monospace">Class-A Dual Return</span>
                    </div>
                  </div>

                  {/* Zone Filter Chips */}
                  <div className="mt-3">
                    <div className="text-muted small fw-bold text-uppercase mb-2" style={{ fontSize: '10.5px', letterSpacing: '0.04em' }}>
                      Filter by Building Zone:
                    </div>
                    <div className="d-flex flex-column gap-1.5">
                      {[
                        { key: 'all', label: 'All 42 MCPs Grid', count: '42' },
                        { key: 'basement', label: 'Basement Levels (B1, B2)', count: '3' },
                        { key: 'podium', label: 'Ground Floor & Lobby', count: '1' },
                        { key: 'tower', label: 'Tower Floors & Roof', count: '4' }
                      ].map(f => (
                        <button
                          key={f.key}
                          type="button"
                          className={`btn btn-sm d-flex align-items-center justify-content-between text-start ${mcpFilter === f.key ? 'btn-danger' : 'btn-outline-secondary'}`}
                          style={{ borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', padding: '6px 10px' }}
                          onClick={() => setMcpFilter(f.key)}
                        >
                          <span>{f.label}</span>
                          <span className={`badge ${mcpFilter === f.key ? 'bg-white text-danger' : 'bg-secondary bg-opacity-25 text-white'}`} style={{ fontSize: '9.5px' }}>
                            {f.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-top border-secondary border-opacity-25">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 py-1.5"
                    style={{ borderRadius: '6px', fontSize: '11.5px' }}
                    onClick={() => {
                      setMcpList(prev => prev.map(m => ({ ...m, status: 'NORMAL', operationStatus: 'ON' })));
                      setSelectedMcpFloor(null);
                    }}
                  >
                    <CheckCircle2 size={13} /> Reset All MCP Alarms to Normal
                  </button>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  CENTER COLUMN: 2.5D Isometric Building SCADA Architecture
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-building-canvas-card">
                {/* Header Strip */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                  <div className="d-flex align-items-center gap-2">
                    <span className="acms-status-chip running" style={{ fontSize: '10.5px' }}>
                      <Check size={11} /> Break Glass Supervised
                    </span>
                    <span className="text-white small fw-bold">Manual Call Point Floor Mapping</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-0.5 px-2"
                      style={{ fontSize: '11px', borderRadius: '5px', backdropFilter: 'blur(4px)' }}
                      onClick={() => setExpandedTab('mcp')}
                      title="Open Fullscreen SCADA Architecture & Diagnostics"
                    >
                      <Maximize2 size={12} />
                      <span className="fw-bold">Expand View</span>
                    </button>
                    <div className="text-muted small" style={{ fontSize: '11px' }}>
                      Click floor to inspect
                    </div>
                  </div>
                </div>

                {/* 2.5D Building SVG with MCPs on Each Floor */}
                <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '580px', display: 'block' }} fill="none">
                  <defs>
                    <linearGradient id="mcpWallGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1B263B" />
                      <stop offset="100%" stopColor="#0D1527" />
                    </linearGradient>
                    <linearGradient id="mcpFloorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#1E293B" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                  </defs>

                  {/* Basement Plant Room Floor Foundation */}
                  <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                  <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                  {/* 3D Isometric Wall Facade */}
                  <polygon points="100,90 150,68 150,520 100,542" fill="url(#mcpWallGrad)" stroke="#334155" strokeWidth="1.2" />

                  {/* Window slits */}
                  {[100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map(wy => (
                    <line key={`mw-${wy}`} x1="112" y1={wy + 16} x2="138" y2={wy + 6} stroke="#38BDF8" strokeWidth="1.8" strokeOpacity="0.45" />
                  ))}

                  {/* Front Interior Building Facade */}
                  <rect x="150" y="68" width="230" height="452" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

                  {/* 11 Building Floors (Roof down to Ground) */}
                  {[
                    { label: 'Roof', y: 68, mcpId: 'MCP-RF-01' },
                    { label: '10F', y: 108, mcpId: 'MCP-10-01' },
                    { label: '9F', y: 148, mcpId: 'MCP-09-01' },
                    { label: '8F', y: 188, mcpId: 'MCP-08-01' },
                    { label: '7F', y: 228, mcpId: 'MCP-07-01' },
                    { label: '6F', y: 268, mcpId: 'MCP-06-01' },
                    { label: '5F', y: 308, mcpId: 'MCP-05-01' },
                    { label: '4F', y: 348, mcpId: 'MCP-04-01' },
                    { label: '3F', y: 388, mcpId: 'MCP-03-01' },
                    { label: '2F', y: 428, mcpId: 'MCP-02-01' },
                    { label: '1F', y: 468, mcpId: 'MCP-01-01' },
                    { label: 'Ground', y: 508, mcpId: 'MCP-GF-01' }
                  ].map((fl, idx) => {
                    const isSelected = selectedMcpFloor === fl.label;
                    return (
                      <g
                        key={`mcp-${fl.label}`}
                        className="cursor-pointer"
                        onClick={() => setSelectedMcpFloor(fl.label)}
                      >
                        {/* Floor Ambient */}
                        <rect
                          x="152"
                          y={fl.y + 2}
                          width="226"
                          height="36"
                          fill={isSelected ? "rgba(239, 51, 64, 0.15)" : "rgba(255,255,255,0.02)"}
                          rx="2"
                        />
                        {/* Slab */}
                        <polygon points={`100,${fl.y + 14} 150,${fl.y} 380,${fl.y} 330,${fl.y + 14}`} fill="url(#mcpFloorGrad)" stroke="#334155" strokeWidth="0.8" />
                        <line x1="150" y1={fl.y} x2="380" y2={fl.y} stroke="#475569" strokeWidth="2" />

                        {/* Floor Tag */}
                        <rect
                          x="385"
                          y={fl.y + 8}
                          width="38"
                          height="18"
                          rx="3"
                          fill={isSelected ? "#EF3340" : "#0B1220"}
                          stroke={isSelected ? "#FF7B84" : "#334155"}
                          strokeWidth="1"
                        />
                        <text x="404" y={fl.y + 20} fill="#FFFFFF" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>

                        {/* Red Addressable MCP Break Glass Unit Mounted by Stairwell */}
                        <g transform={`translate(280, ${fl.y + 10})`}>
                          {/* Unit Backplate */}
                          <rect x="0" y="0" width="18" height="20" rx="3" fill="#DC2626" stroke="#EF4444" strokeWidth="1.2" />
                          {/* Glass Window */}
                          <rect x="3" y="3" width="12" height="10" rx="1.5" fill="#FEF2F2" stroke="#991B1B" strokeWidth="0.8" />
                          {/* Central Operating Element / Push Glass */}
                          <circle cx="9" cy="8" r="2.5" fill="#EF4444" />
                          {/* Supervisory LED Indicator */}
                          <circle cx="9" cy="16" r="1.5" fill="#10B981" />
                        </g>

                        {/* Connection from vertical loop */}
                        <line x1="200" y1={fl.y + 20} x2="280" y2={fl.y + 20} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
                      </g>
                    );
                  })}

                  {/* ── Vertical Red Class-A SLC Loop Line ── */}
                  <line x1="200" y1="76" x2="200" y2="520" stroke="#EF4444" strokeWidth="2.5" />
                  <line x1="200" y1="76" x2="200" y2="520" stroke="#FCA5A5" strokeWidth="1" strokeDasharray="4 3" />

                  {/* Callout Badge: Addressable MCP Network Normal */}
                  <g transform="translate(210, 240)">
                    <rect x="0" y="0" width="155" height="42" rx="4" fill="#070D18" stroke="#EF4444" strokeWidth="1.2" />
                    <circle cx="14" cy="14" r="3.5" fill="#10B981" />
                    <text x="24" y="14" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">Manual Call Points (42)</text>
                    <text x="24" y="26" fill="#A7F3D0" fontSize="8">Loop 1 & 2 Supervised</text>
                    <text x="24" y="36" fill="#94A3B8" fontSize="7">Push/Pull Break-Glass Ready</text>
                  </g>

                  {/* ── Basement Levels (B1, B2) Cutaway ── */}
                  <g transform="translate(60, 545)">
                    {/* B1 Level */}
                    <rect x="0" y="0" width="400" height="50" rx="3" fill="#0B1220" stroke="#334155" strokeWidth="1" />
                    <rect x="10" y="8" width="55" height="16" rx="2" fill="#1E293B" />
                    <text x="37" y="19" fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="middle">Basement B1</text>
                    {/* MCP on B1 */}
                    <g transform="translate(180, 15)">
                      <rect x="0" y="0" width="18" height="20" rx="3" fill="#DC2626" stroke="#EF4444" strokeWidth="1.2" />
                      <rect x="3" y="3" width="12" height="10" rx="1.5" fill="#FEF2F2" />
                      <circle cx="9" cy="8" r="2.5" fill="#EF4444" />
                      <circle cx="9" cy="16" r="1.5" fill="#10B981" />
                    </g>
                    <text x="205" y="27" fill="#E2E8F0" fontSize="7.5" fontWeight="bold">MCP-B1-01 (Exit Stair B)</text>

                    {/* B2 Level */}
                    <rect x="0" y="58" width="400" height="50" rx="3" fill="#0B1220" stroke="#334155" strokeWidth="1" />
                    <rect x="10" y="66" width="55" height="16" rx="2" fill="#1E293B" />
                    <text x="37" y="77" fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="middle">Basement B2</text>
                    {/* MCP on B2 */}
                    <g transform="translate(180, 73)">
                      <rect x="0" y="0" width="18" height="20" rx="3" fill="#DC2626" stroke="#EF4444" strokeWidth="1.2" />
                      <rect x="3" y="3" width="12" height="10" rx="1.5" fill="#FEF2F2" />
                      <circle cx="9" cy="8" r="2.5" fill="#EF4444" />
                      <circle cx="9" cy="16" r="1.5" fill="#10B981" />
                    </g>
                    <text x="205" y="85" fill="#E2E8F0" fontSize="7.5" fontWeight="bold">MCP-B2-01 (Pump Room Entry)</text>
                  </g>
                </svg>

                {/* Footer Info Pill */}
                <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25 text-muted small" style={{ fontSize: '11px' }}>
                  <span>Class-A Loop: <strong className="text-success">Supervised Normal</strong></span>
                  <span>Active Zone: <strong className="text-white text-capitalize">{mcpFilter}</strong></span>
                  <span>Tested Status: <strong className="text-cyan">100% Certified</strong></span>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  RIGHT COLUMN: Interactive MCP Device Cards for Selected Zone
                  ──────────────────────────────────────────────────────── */}
              <div className="d-flex flex-column gap-2" style={{ maxHeight: '680px', overflowY: 'auto' }}>
                <div className="p-2 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-25 mb-1 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="acms-hydrant-item-num" style={{ background: '#F59E0B', color: '#000' }}>2</span>
                    <span className="text-white small fw-bold">Clause 3(f) Addressable Break Glass Stations (On / Off)</span>
                  </div>
                  <span className="badge bg-danger bg-opacity-25 text-danger" style={{ fontSize: '10px' }}>
                    {mcpList.filter(m => mcpFilter === 'all' || m.zone === mcpFilter).length} Station(s)
                  </span>
                </div>

                {mcpList
                  .filter(m => mcpFilter === 'all' || m.zone === mcpFilter)
                  .map((mcp, idx) => (
                    <div key={mcp.id} className="acms-scada-card border-red-glow p-3">
                      <div>
                        <div className="acms-card-top-row mb-1">
                          <span className="fw-bold font-monospace text-danger small">{mcp.id}</span>
                          <div className="d-flex gap-1">
                            <span className={`acms-status-chip ${mcp.operationStatus === 'ON' ? 'running' : 'stopped'}`} style={{ padding: '2px 7px', fontSize: '9.5px' }}>
                              {mcp.operationStatus}
                            </span>
                            <span className={`acms-status-chip ${mcp.status === 'NORMAL' ? 'running' : 'stopped'}`} style={{ padding: '2px 7px', fontSize: '9.5px' }}>
                              {mcp.status}
                            </span>
                          </div>
                        </div>
                        <div className="fw-bold text-white small mb-1">{mcp.location}</div>
                        <div className="text-muted small" style={{ fontSize: '11px' }}>Tested: {mcp.lastTest}</div>
                      </div>

                      <div className="pt-2 border-top border-secondary border-opacity-25 d-flex gap-1.5 mt-2">
                        <button
                          type="button"
                          className={`btn btn-sm flex-grow-1 ${mcp.status === 'NORMAL' ? 'btn-outline-danger' : 'btn-success'}`}
                          style={{ fontSize: '11px', fontWeight: '700', padding: '4px 6px' }}
                          onClick={() => setMcpList(prev => prev.map((item, i) => item.id === mcp.id ? { ...item, status: item.status === 'NORMAL' ? 'TRIGGERED' : 'NORMAL' } : item))}
                        >
                          {mcp.status === 'NORMAL' ? 'Simulate Pull' : 'Reset Alarm'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          style={{ fontSize: '11px', padding: '4px 6px' }}
                          onClick={() => setMcpList(prev => prev.map((item, i) => item.id === mcp.id ? { ...item, operationStatus: item.operationStatus === 'ON' ? 'OFF' : 'ON' } : item))}
                        >
                          {mcp.operationStatus === 'ON' ? 'Turn Off' : 'Turn On'}
                        </button>
                      </div>
                    </div>
                  ))}
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
            <div className="acms-clause-banner purple-theme mb-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3.5 z-2 position-relative">
                <div className="acms-banner-icon-badge purple">
                  <Volume2 size={26} />
                </div>
                <div>
                  <h4 className="fw-black mb-1 text-white" style={{ letterSpacing: '-0.01em' }}>
                    Clause 3 (g) Public Address System
                  </h4>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    Public Address System status (working / non-working) in 4 zones with mic / amplifier bank.
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column align-items-end z-2 position-relative">
                <span className="acms-supervision-pill purple mb-1">
                  <span className="acms-dot-pulse-green"></span>
                  ALL 4 ZONES & 4 AMPS WORKING
                </span>
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  <span className="text-success fw-bold">● System Online</span> | Last Updated: {currentTime}
                </span>
              </div>
              <BannerBackdropIllustration color="#6D5CE7" />
            </div>

            {/* 3-Column SCADA Layout: Amplifier Bank, Center Building SVG, Broadcast Zones */}
            <div className="acms-scada-3col-layout">
              {/* ────────────────────────────────────────────────────────
                  LEFT COLUMN: Amplifier Bank & Equipment Rack
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-scada-card border-purple-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#8B5CF6', color: '#FFF' }}>1</span>
                      <span className="acms-clause-badge purple">Clause 3(g) Amplifiers</span>
                    </div>
                    <span className="acms-status-chip running">
                      <Check size={11} /> 4 / 4 WORKING
                    </span>
                  </div>
                  <div className="acms-card-title mb-1">500W Class-D Voice Evac Amplifiers</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11.5px' }}>
                    Supervised multi-channel audio amplification and emergency mic console.
                  </div>

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
                            <Server size={12} className="text-purple me-1.5" />
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

                <div className="acms-footer-pill mt-3">
                  <CheckCircle2 size={13} /> Hot-Standby Amplifier Ready for Auto-Swap
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  CENTER COLUMN: 2.5D Isometric Building SCADA Architecture
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-building-canvas-card">
                {/* Header Strip */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                  <div className="d-flex align-items-center gap-2">
                    <span className="acms-status-chip running" style={{ fontSize: '10.5px' }}>
                      <Check size={11} /> 4 Audio Zones Active
                    </span>
                    <span className="text-white small fw-bold">100V Constant-Voltage Speaker Network</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-0.5 px-2"
                      style={{ fontSize: '11px', borderRadius: '5px', backdropFilter: 'blur(4px)' }}
                      onClick={() => setExpandedTab('pa')}
                      title="Open Fullscreen SCADA Architecture & Diagnostics"
                    >
                      <Maximize2 size={12} />
                      <span className="fw-bold">Expand View</span>
                    </button>
                    <div className="text-muted small" style={{ fontSize: '11px' }}>
                      {isPaTesting ? <span className="text-warning fw-bold">● Broadcast Audio Active</span> : <span>Standby Supervised</span>}
                    </div>
                  </div>
                </div>

                {/* 2.5D Building SVG with PA Speakers and Soundwave Rings */}
                <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '580px', display: 'block' }} fill="none">
                  <defs>
                    <linearGradient id="paWallGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1B263B" />
                      <stop offset="100%" stopColor="#0D1527" />
                    </linearGradient>
                    <linearGradient id="paFloorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="50%" stopColor="#1E293B" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                  </defs>

                  {/* Basement Plant Room Foundation Floor */}
                  <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                  <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                  {/* 3D Isometric Wall Facade */}
                  <polygon points="100,90 150,68 150,520 100,542" fill="url(#paWallGrad)" stroke="#334155" strokeWidth="1.2" />

                  {/* Window slits */}
                  {[100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map(wy => (
                    <line key={`pw-${wy}`} x1="112" y1={wy + 16} x2="138" y2={wy + 6} stroke="#A855F7" strokeWidth="1.8" strokeOpacity="0.45" />
                  ))}

                  {/* Front Interior Building Facade */}
                  <rect x="150" y="68" width="230" height="452" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />

                  {/* 11 Building Floors grouped into Zone 4, Zone 3, Zone 2 */}
                  {[
                    { label: 'Roof', y: 68, zone: 'Zone 4', zColor: '#F59E0B' },
                    { label: '10F', y: 108, zone: 'Zone 4', zColor: '#F59E0B' },
                    { label: '9F', y: 148, zone: 'Zone 4', zColor: '#F59E0B' },
                    { label: '8F', y: 188, zone: 'Zone 4', zColor: '#F59E0B' },
                    { label: '7F', y: 228, zone: 'Zone 4', zColor: '#F59E0B' },
                    { label: '6F', y: 268, zone: 'Zone 3', zColor: '#06C7F5' },
                    { label: '5F', y: 308, zone: 'Zone 3', zColor: '#06C7F5' },
                    { label: '4F', y: 348, zone: 'Zone 3', zColor: '#06C7F5' },
                    { label: '3F', y: 388, zone: 'Zone 3', zColor: '#06C7F5' },
                    { label: '2F', y: 428, zone: 'Zone 3', zColor: '#06C7F5' },
                    { label: '1F', y: 468, zone: 'Zone 3', zColor: '#06C7F5' },
                    { label: 'Ground', y: 508, zone: 'Zone 2', zColor: '#3B82F6' }
                  ].map((fl, idx) => (
                    <g key={`pa-${fl.label}`}>
                      {/* Floor Ambient */}
                      <rect x="152" y={fl.y + 2} width="226" height="36" fill="rgba(255,255,255,0.02)" rx="2" />
                      {/* Slab */}
                      <polygon points={`100,${fl.y + 14} 150,${fl.y} 380,${fl.y} 330,${fl.y + 14}`} fill="url(#paFloorGrad)" stroke="#334155" strokeWidth="0.8" />
                      <line x1="150" y1={fl.y} x2="380" y2={fl.y} stroke="#475569" strokeWidth="2" />

                      {/* Floor Tag */}
                      <rect x="385" y={fl.y + 8} width="38" height="18" rx="3" fill="#0B1220" stroke="#334155" strokeWidth="1" />
                      <text x="404" y={fl.y + 20} fill="#FFFFFF" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{fl.label}</text>

                      {/* PA Ceiling Speakers & Radiating Sound Waves on Floor */}
                      {idx > 0 && (
                        <g>
                          {/* Ceiling Speaker 1 */}
                          <g transform={`translate(240, ${fl.y + 6})`}>
                            <rect x="-8" y="0" width="16" height="6" rx="1.5" fill="#334155" stroke="#64748B" strokeWidth="0.8" />
                            <circle cx="0" cy="5" r="2.5" fill="#F8FAFC" />
                            {isPaTesting && (
                              <circle cx="0" cy="5" r="8" fill="none" stroke={fl.zColor} strokeWidth="1.5" className="scada-soundwave-ring" />
                            )}
                          </g>

                          {/* Ceiling Speaker 2 */}
                          <g transform={`translate(310, ${fl.y + 6})`}>
                            <rect x="-8" y="0" width="16" height="6" rx="1.5" fill="#334155" stroke="#64748B" strokeWidth="0.8" />
                            <circle cx="0" cy="5" r="2.5" fill="#F8FAFC" />
                            {isPaTesting && (
                              <circle cx="0" cy="5" r="8" fill="none" stroke={fl.zColor} strokeWidth="1.5" className="scada-soundwave-ring" />
                            )}
                          </g>
                        </g>
                      )}
                    </g>
                  ))}

                  {/* ── 100V Supervised Audio Bus Cable (Purple Line) ── */}
                  <line x1="185" y1="76" x2="185" y2="520" stroke="#8B5CF6" strokeWidth="3" />
                  <line x1="185" y1="76" x2="185" y2="520" stroke="#C4B5FD" strokeWidth="1" strokeDasharray="5 3" />

                  {/* Zone Overlay Brackets on Left */}
                  {/* Zone 4 Bracket (Floors 7–12 & Roof) */}
                  <line x1="75" y1="76" x2="75" y2="250" stroke="#F59E0B" strokeWidth="2.5" />
                  <rect x="25" y="150" width="60" height="20" rx="3" fill="#0B1220" stroke="#F59E0B" strokeWidth="1" />
                  <text x="55" y="163" fill="#F59E0B" fontSize="8" fontWeight="bold" textAnchor="middle">Zone 4 (88 spk)</text>

                  {/* Zone 3 Bracket (Floors 1–6) */}
                  <line x1="75" y1="260" x2="75" y2="490" stroke="#06C7F5" strokeWidth="2.5" />
                  <rect x="25" y="365" width="60" height="20" rx="3" fill="#0B1220" stroke="#06C7F5" strokeWidth="1" />
                  <text x="55" y="378" fill="#06C7F5" fontSize="8" fontWeight="bold" textAnchor="middle">Zone 3 (92 spk)</text>

                  {/* Zone 2 Tag (Ground Floor) */}
                  <rect x="25" y="505" width="60" height="20" rx="3" fill="#0B1220" stroke="#3B82F6" strokeWidth="1" />
                  <text x="55" y="518" fill="#3B82F6" fontSize="8" fontWeight="bold" textAnchor="middle">Zone 2 (38 spk)</text>

                  {/* Callout Badge: 100V Constant-Voltage Audio Bus Supervised */}
                  <g transform="translate(200, 230)">
                    <rect x="0" y="0" width="165" height="42" rx="4" fill="#070D18" stroke="#8B5CF6" strokeWidth="1.2" />
                    <circle cx="14" cy="14" r="3.5" fill="#10B981" />
                    <text x="24" y="14" fill="#FFFFFF" fontSize="8.5" fontWeight="bold">100V Audio Distribution</text>
                    <text x="24" y="26" fill="#C4B5FD" fontSize="8">Supervised Line Return (4 Zones)</text>
                    <text x="24" y="36" fill="#94A3B8" fontSize="7">Impedance Supervised: Healthy</text>
                  </g>

                  {/* ── Basement Levels (Zone 1: Parking B1 & B2) ── */}
                  <g transform="translate(60, 545)">
                    {/* B1 & B2 Combined Horn Speakers */}
                    <rect x="0" y="0" width="400" height="110" rx="4" fill="#0B1220" stroke="#8B5CF6" strokeWidth="1.5" />
                    <rect x="12" y="10" width="70" height="20" rx="2" fill="#1E293B" stroke="#A855F7" strokeWidth="0.8" />
                    <text x="47" y="23" fill="#C4B5FD" fontSize="8" fontWeight="bold" textAnchor="middle">Zone 1 (45 spk)</text>
                    <text x="12" y="42" fill="#94A3B8" fontSize="7.5">Basement Parking B1 & B2 (Re-entrant Horns)</text>

                    {/* Industrial Horn Speakers on B1 */}
                    <g transform="translate(180, 30)">
                      <polygon points="0,0 20,-10 20,10" fill="#6D5CE7" stroke="#A855F7" strokeWidth="1" />
                      <rect x="-8" y="-4" width="8" height="8" rx="1" fill="#334155" />
                      {isPaTesting && (
                        <circle cx="20" cy="0" r="12" fill="none" stroke="#A855F7" strokeWidth="1.5" className="scada-soundwave-ring" />
                      )}
                    </g>
                    <g transform="translate(260, 30)">
                      <polygon points="0,0 20,-10 20,10" fill="#6D5CE7" stroke="#A855F7" strokeWidth="1" />
                      <rect x="-8" y="-4" width="8" height="8" rx="1" fill="#334155" />
                      {isPaTesting && (
                        <circle cx="20" cy="0" r="12" fill="none" stroke="#A855F7" strokeWidth="1.5" className="scada-soundwave-ring" />
                      )}
                    </g>

                    {/* Master Control Rack & Fireman Microphone in Basement */}
                    <g transform="translate(120, 68)">
                      <rect x="0" y="0" width="180" height="32" rx="3" fill="#111A2B" stroke="#6D5CE7" strokeWidth="1" />
                      <text x="90" y="14" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">PA Master Rack & Amp Bank</text>
                      <text x="90" y="24" fill="#10B981" fontSize="7" textAnchor="middle">● 4 Amps Online • Mic Connected</text>
                    </g>
                  </g>
                </svg>

                {/* Footer Info Pill */}
                <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25 text-muted small" style={{ fontSize: '11px' }}>
                  <span>Monitored Speakers: <strong className="text-white">263 Units Total</strong></span>
                  <span>Audio Bus: <strong className="text-purple">100V Constant Voltage</strong></span>
                  <span>Standby Swap: <strong className="text-success">Auto Ready</strong></span>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  RIGHT COLUMN: Broadcast Zones & Controls
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-scada-card border-purple-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#06C7F5', color: '#000' }}>2</span>
                      <span className="acms-clause-badge cyan">Clause 3(g) Broadcast Zones</span>
                    </div>
                    <span className="acms-status-chip running">
                      <Check size={11} /> 4 / 4 WORKING
                    </span>
                  </div>
                  <div className="acms-card-title mb-1">Monitored Speaker Broadcast Zones</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11.5px' }}>
                    Supervised line return impedance and volume control per zone.
                  </div>

                  {/* Broadcast Zones List */}
                  <div className="acms-param-list mt-2">
                    {paItems.zones.map((z, idx) => (
                      <div key={idx} className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 mb-1.5">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <strong className="text-white small" style={{ fontSize: '11.5px' }}>
                            <Radio size={12} className="text-purple me-1.5" />
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
            {/* Clause Banner */}
            <div className="acms-clause-banner cyan-theme mb-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3.5 z-2 position-relative">
                <div className="acms-banner-icon-badge cyan">
                  <Wind size={26} />
                </div>
                <div>
                  <h4 className="fw-black mb-1 text-white" style={{ letterSpacing: '-0.01em' }}>
                    Clause 3 (h) Air Pressurization
                  </h4>
                  <div className="text-muted" style={{ fontSize: '12px' }}>
                    (i) Staircase Pressurization Fan run status for all exits / Lift Lobby / Hoistways.
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column align-items-end z-2 position-relative">
                <span className="acms-supervision-pill cyan mb-1">
                  <span className="acms-dot-pulse-green"></span>
                  ALL 5 FANS MONITORED
                </span>
                <span className="text-muted small" style={{ fontSize: '11px' }}>
                  <span className="text-success fw-bold">● System Online</span> | Last Updated: {currentTime}
                </span>
              </div>
              <BannerBackdropIllustration color="#06C7F5" />
            </div>

            {/* 3-Column SCADA Layout: Left Stair Fan & Selector, Center Building SCADA, Right Lobby & Hoistway Fans */}
            <div className="acms-scada-3col-layout mb-4">
              {/* ────────────────────────────────────────────────────────
                  LEFT COLUMN: Card 1 - Staircase Pressurization Fans (All Exits)
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-scada-card border-cyan-glow d-flex flex-column justify-content-between">
                <div>
                  <div className="acms-card-top-row mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="acms-hydrant-item-num" style={{ background: '#06C7F5', color: '#000' }}>1</span>
                      <span className="acms-clause-badge cyan">Clause 3(h)(i) Staircase</span>
                    </div>
                    <span className={`acms-status-chip ${pressurizationFans[0].runStatus === 'RUNNING' ? 'running' : 'standby'}`}>
                      {pressurizationFans[0].runStatus === 'RUNNING' ? <Play size={11} fill="currentColor" /> : <Wind size={11} />}
                      {pressurizationFans[0].runStatus}
                    </span>
                  </div>

                  <div className="acms-card-title mb-1">Staircase Pressurization Fans (All Exits)</div>
                  <div className="text-muted small mb-2" style={{ fontSize: '11.5px' }}>
                    Supervising Staircase A & B emergency egress shafts (+50 Pa barrier).
                  </div>

                  {/* 3D Visual Blower Graphic */}
                  <PressurizationBlowerLargeVisual
                    isRunning={pressurizationFans[0].runStatus === 'RUNNING' || isEmergencyPressurizing}
                    fanCategory="Staircase Exit"
                  />

                  {/* Active Telemetry Parameters */}
                  <div className="acms-card-telemetry-grid mt-2 mb-2">
                    <div className="acms-telemetry-item">
                      <span className="label">SPF-01 Run Status:</span>
                      <span className={`value ${pressurizationFans[0].runStatus === 'RUNNING' ? 'text-success' : 'text-cyan'}`}>
                        {pressurizationFans[0].runStatus}
                      </span>
                    </div>
                    <div className="acms-telemetry-item">
                      <span className="label">Power Status:</span>
                      <span className="value text-success">{pressurizationFans[0].powerStatus}</span>
                    </div>
                    <div className="acms-telemetry-item">
                      <span className="label">Airflow Capacity:</span>
                      <span className="value text-white font-monospace">{pressurizationFans[0].flowRate}</span>
                    </div>
                    <div className="acms-telemetry-item">
                      <span className="label">Differential ΔP:</span>
                      <span className="value text-success font-monospace">{pressurizationFans[0].deltaP}</span>
                    </div>
                  </div>

                  {/* Staircase B (SPF-02) Telemetry */}
                  <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 mb-2">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <strong className="text-white small" style={{ fontSize: '11.5px' }}>
                        <Wind size={12} className="text-cyan me-1.5" />
                        Staircase B Fan (SPF-02)
                      </strong>
                      <span className={`badge ${pressurizationFans[1].runStatus === 'RUNNING' ? 'bg-success text-white' : 'bg-info bg-opacity-25 text-info'}`} style={{ fontSize: '9.5px' }}>
                        {pressurizationFans[1].runStatus}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '10.5px' }}>
                      <span>Flow: <strong className="text-white">25,000 CFM</strong></span>
                      <span>ΔP: <strong className="text-success">{pressurizationFans[1].deltaP}</strong></span>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-info py-0 px-1.5"
                        style={{ fontSize: '9px' }}
                        onClick={() => setPressurizationFans(prev => prev.map((item, i) => i === 1 ? { ...item, runStatus: item.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' } : item))}
                      >
                        Toggle SPF-02
                      </button>
                    </div>
                  </div>

                  {/* ΔP Gauge Progress Visual */}
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-baseline mb-1">
                      <span className="text-muted small">Stairwell Positive Pressure (Target: 50 Pa):</span>
                      <strong className="text-cyan font-monospace">50.2 Pa</strong>
                    </div>
                    <div className="acms-tank-bar-track" style={{ height: '7px', borderRadius: '4px' }}>
                      <div className="acms-tank-bar-fill" style={{ width: '84%', background: 'linear-gradient(90deg, #0284C7, #06C7F5)' }}></div>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-2">
                  <button
                    type="button"
                    className="acms-action-btn-dark flex-grow-1"
                    onClick={() => setPressurizationFans(prev => prev.map((item, i) => i === 0 ? { ...item, runStatus: item.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' } : item))}
                  >
                    <Power size={13} /> Toggle SPF-01 (Run / Stop)
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary px-2"
                    title="Toggle Power"
                    onClick={() => setPressurizationFans(prev => prev.map((item, i) => i === 0 ? { ...item, powerStatus: item.powerStatus === 'POWER ON' ? 'POWER OFF' : 'POWER ON' } : item))}
                  >
                    <Zap size={13} className="text-warning" />
                  </button>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  CENTER COLUMN: 2.5D Multi-Core Air Pressurization SCADA Building
                  ──────────────────────────────────────────────────────── */}
              <div className="acms-building-canvas-card border-cyan-glow d-flex flex-column justify-content-between">
                {/* Header Strip */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                  <div className="d-flex align-items-center gap-2">
                    <span className="acms-status-chip running" style={{ fontSize: '10.5px' }}>
                      <Check size={11} /> 5/5 Fans Supervised
                    </span>
                    <span className="text-white small fw-bold">2.5D Multi-Shaft Air Pressurization Architecture</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info d-flex align-items-center gap-1.5 py-0.5 px-2"
                      style={{ fontSize: '11px', borderRadius: '5px', backdropFilter: 'blur(4px)' }}
                      onClick={() => setExpandedTab('pressurization')}
                      title="Open Fullscreen SCADA Architecture & Diagnostics"
                    >
                      <Maximize2 size={12} />
                      <span className="fw-bold">Expand View</span>
                    </button>
                    <div className="text-muted small" style={{ fontSize: '11px' }}>
                      Stair: <strong className="text-cyan font-monospace">+50.2 Pa</strong> • Lobby: <strong className="text-info font-monospace">+28.5 Pa</strong>
                    </div>
                  </div>
                </div>

                {/* 2.5D Isometric Building SVG with Multi-Core Pressurization */}
                <svg viewBox="0 0 540 680" width="100%" height="auto" style={{ maxHeight: '580px', display: 'block' }} fill="none">
                  <defs>
                    <linearGradient id="pressWallGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1B263B" />
                      <stop offset="100%" stopColor="#0D1527" />
                    </linearGradient>
                    <linearGradient id="pressShaftGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0369A1" stopOpacity="0.45" />
                      <stop offset="50%" stopColor="#0284C7" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0C4A6E" stopOpacity="0.45" />
                    </linearGradient>
                    <linearGradient id="liftShaftGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#0F172A" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="smokeCloudGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F97316" stopOpacity="0.75" />
                      <stop offset="60%" stopColor="#475569" stopOpacity="0.65" />
                      <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Plant Room & Basement Foundation */}
                  <rect x="20" y="520" width="500" height="150" rx="4" fill="#0B1220" stroke="#1E293B" strokeWidth="1.5" />
                  <line x1="20" y1="520" x2="520" y2="520" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                  {/* 3D Isometric Wall Facade */}
                  <polygon points="50,90 90,68 90,520 50,542" fill="url(#pressWallGrad)" stroke="#334155" strokeWidth="1.2" />

                  {/* Main Interior Building Cutaway */}
                  <rect x="90" y="68" width="400" height="452" fill="#0A0F1D" stroke="#334155" strokeWidth="1.5" />

                  {/* ── SHAFT 1: STAIRCASE PRESSURIZATION SHAFT (Left Core) ── */}
                  <rect x="100" y="68" width="90" height="452" fill="url(#pressShaftGrad)" stroke="#06C7F5" strokeWidth="1.5" />
                  <text x="145" y="86" fill="#38BDF8" fontSize="8" fontWeight="bold" textAnchor="middle">STAIRCASE SHAFT (+50 Pa)</text>

                  {/* ── SHAFT 2: LIFT HOISTWAY SHAFT (Right Core) ── */}
                  <rect x="390" y="68" width="70" height="452" fill="url(#liftShaftGrad)" stroke="#3B82F6" strokeWidth="1.2" />
                  <text x="425" y="86" fill="#93C5FD" fontSize="7.5" fontWeight="bold" textAnchor="middle">HOISTWAY (+48 Pa)</text>

                  {/* Elevator Cab in Hoistway at 4F */}
                  <g transform="translate(396, 335)">
                    <rect x="0" y="0" width="58" height="42" rx="3" fill="#1E293B" stroke="#60A5FA" strokeWidth="1.2" />
                    <rect x="12" y="10" width="34" height="26" fill="#0B1220" stroke="#38BDF8" strokeWidth="0.8" />
                    <line x1="29" y1="10" x2="29" y2="36" stroke="#38BDF8" strokeWidth="0.8" />
                    <line x1="16" y1="-267" x2="16" y2="0" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="3 3" />
                    <line x1="42" y1="-267" x2="42" y2="0" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="3 3" />
                    <text x="29" y="4" fill="#38BDF8" fontSize="6" fontWeight="bold" textAnchor="middle">ELEVATOR CAR</text>
                  </g>

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
                  ].map((fl, idx) => (
                    <g key={fl.label}>
                      {/* Floor Slab */}
                      <line x1="90" y1={fl.y} x2="490" y2={fl.y} stroke="#334155" strokeWidth="1.5" />
                      <line x1="90" y1={fl.y + 1} x2="490" y2={fl.y + 1} stroke="#1E293B" strokeWidth="3" />

                      {/* Floor Label Tag on Left */}
                      <text x="75" y={fl.y + 24} fill="#64748B" fontSize="8" fontWeight="bold" textAnchor="middle">{fl.label}</text>

                      {/* Staircase Flights inside Stair Shaft */}
                      {idx < 11 && (
                        <g opacity="0.6">
                          <line x1="110" y1={fl.y + 36} x2="175" y2={fl.y + 10} stroke="#475569" strokeWidth="1.5" />
                          <line x1="110" y1={fl.y + 36} x2="125" y2={fl.y + 36} stroke="#38BDF8" strokeWidth="1" />
                          <line x1="160" y1={fl.y + 10} x2="175" y2={fl.y + 10} stroke="#38BDF8" strokeWidth="1" />
                        </g>
                      )}

                      {/* Fire Exit Self-Closing Fire Door with Panic Bar between Staircase & Corridor */}
                      <rect x="188" y={fl.y + 8} width="6" height="30" rx="1" fill="#DC2626" stroke="#EF4444" strokeWidth="0.8" />
                      {/* Positive Pressure Shield Icon on Door */}
                      <circle cx="191" cy={fl.y + 22} r="3" fill="#10B981" />

                      {/* Lift Lobby Zone between Corridor & Hoistway */}
                      <rect x="340" y={fl.y + 4} width="48" height="34" fill="rgba(6, 199, 245, 0.06)" rx="2" />
                      <line x1="339" y1={fl.y + 4} x2="339" y2={fl.y + 38} stroke="#0284C7" strokeWidth="1" strokeDasharray="2 2" />

                      {/* Differential Pressure Sensor Tag on Key Floors */}
                      {(fl.label === '8F' || fl.label === '4F' || fl.label === 'Ground') && (
                        <g transform={`translate(105, ${fl.y + 8})`}>
                          <rect x="0" y="0" width="38" height="12" rx="2" fill="#070D18" stroke="#06C7F5" strokeWidth="0.8" />
                          <text x="19" y="9" fill="#06C7F5" fontSize="6.5" fontWeight="bold" textAnchor="middle">+50.2 Pa</text>
                        </g>
                      )}

                      {/* Lift Lobby Pressure Tag on Key Floors */}
                      {(fl.label === '8F' || fl.label === '4F') && (
                        <g transform={`translate(345, ${fl.y + 8})`}>
                          <rect x="0" y="0" width="38" height="12" rx="2" fill="#38BDF8" stroke="#38BDF8" strokeWidth="0.8" />
                          <text x="19" y="9" fill="#38BDF8" fontSize="6.5" fontWeight="bold" textAnchor="middle">+28.5 Pa</text>
                        </g>
                      )}

                      {/* Barometric Counterweight Relief Damper on Exterior Wall */}
                      {(fl.label === '9F' || fl.label === '5F' || fl.label === '1F') && (
                        <g transform={`translate(478, ${fl.y + 12})`}>
                          <rect x="0" y="0" width="10" height="16" rx="1.5" fill="#1E293B" stroke="#06C7F5" strokeWidth="0.8" />
                          <line x1="2" y1="4" x2="8" y2="4" stroke="#38BDF8" strokeWidth="1" />
                          <line x1="2" y1="8" x2="8" y2="8" stroke="#38BDF8" strokeWidth="1" />
                          <line x1="2" y1="12" x2="8" y2="12" stroke="#38BDF8" strokeWidth="1" />
                        </g>
                      )}
                    </g>
                  ))}

                  {/* ── DYNAMIC AIRFLOW STREAMS (Animated Pulses down Shafts) ── */}
                  {(pressurizationFans[0].runStatus === 'RUNNING' || isEmergencyPressurizing) && (
                    <g>
                      {/* Staircase Shaft Airflow Streams */}
                      <path d="M125 70 L125 510" stroke="#06C7F5" strokeWidth="2.5" className="scada-airflow-flow" strokeDasharray="8 6" />
                      <path d="M145 70 L145 510" stroke="#38BDF8" strokeWidth="3" className="scada-airflow-flow" strokeDasharray="10 8" />
                      <path d="M165 70 L165 510" stroke="#06C7F5" strokeWidth="2.5" className="scada-airflow-flow" strokeDasharray="8 6" />

                      {/* Airflow jets through Relief Diffusers into Stairway */}
                      {[118, 198, 278, 358, 438].map(yPos => (
                        <g key={`jet-${yPos}`}>
                          <path d={`M145 ${yPos} Q 170 ${yPos + 8}, 185 ${yPos + 12}`} stroke="#38BDF8" strokeWidth="1.5" className="scada-airflow-flow" />
                          <polygon points={`185,${yPos + 10} 190,${yPos + 12} 185,${yPos + 14}`} fill="#38BDF8" />
                        </g>
                      ))}

                      {/* Lift Hoistway Airflow Streams */}
                      <path d="M415 70 L415 330" stroke="#60A5FA" strokeWidth="2" className="scada-airflow-flow" strokeDasharray="8 6" />
                      <path d="M435 70 L435 330" stroke="#3B82F6" strokeWidth="2" className="scada-airflow-flow" strokeDasharray="8 6" />

                      {/* Lift Lobby Riser Airflow Streams (Upward from Basement Fans) */}
                      <path d="M355 520 L355 110" stroke="#38BDF8" strokeWidth="2" className="scada-airflow-flow" strokeDasharray="8 6" />
                    </g>
                  )}

                  {/* ── FIRE FLOOR (5F) SIMULATION: SMOKE BLOCKED BY POSITIVE PRESSURE BARRIER ── */}
                  <g transform="translate(200, 310)">
                    {/* Simulated Smoke Plume in Corridor */}
                    <rect x="2" y="2" width="135" height="34" rx="2" fill="url(#smokeCloudGrad)" />
                    <text x="70" y="16" fill="#FDBA74" fontSize="7" fontWeight="bold" textAnchor="middle">CORRIDOR FIRE SMOKE LAYER</text>
                    <text x="70" y="26" fill="#CBD5E1" fontSize="6" textAnchor="middle">0 Pa Corridor vs +50 Pa Stairwell</text>
                    {/* Barrier Arrow showing air forcing smoke back */}
                    <path d="M-8 18 L12 18" stroke="#10B981" strokeWidth="2.5" strokeDasharray="3 2" className="scada-airflow-flow" />
                    <polygon points="12,15 18,18 12,21" fill="#10B981" />
                    <rect x="-14" y="24" width="46" height="10" rx="1.5" fill="#070D18" stroke="#10B981" strokeWidth="0.8" />
                    <text x="9" y="31" fill="#10B981" fontSize="5.5" fontWeight="bold" textAnchor="middle">AIR CURTAIN ACTIVE</text>
                  </g>

                  {/* ── ROOFTOP PLANT ROOM (Elevator Penthouse & Fan Deck) ── */}
                  <g transform="translate(60, 8)">
                    {/* Roof Slab */}
                    <rect x="0" y="52" width="440" height="8" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />

                    {/* Staircase Pressurization Fan SPF-01 */}
                    <g transform="translate(45, 10)">
                      <rect x="0" y="16" width="65" height="32" rx="3" fill="#0F172A" stroke="#06C7F5" strokeWidth="1.2" />
                      <circle cx="22" cy="32" r="14" fill="#082F49" stroke="#0284C7" strokeWidth="1" />
                      {/* Spinning Fan Blades */}
                      <g className={pressurizationFans[0].runStatus === 'RUNNING' || isEmergencyPressurizing ? "scada-spin" : ""} style={{ transformOrigin: '22px 32px', transformBox: 'view-box' }}>
                        <line x1="22" y1="20" x2="22" y2="44" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="10" y1="32" x2="34" y2="32" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                      </g>
                      <circle cx="22" cy="32" r="3" fill="#FFFFFF" />
                      {/* Weather Intake Hood */}
                      <path d="M42 20 L58 12 L58 44 L42 40 Z" fill="#1E293B" stroke="#64748B" strokeWidth="1" />
                      {/* Discharge Duct down to Shaft */}
                      <rect x="14" y="46" width="16" height="12" fill="#0284C7" stroke="#06C7F5" strokeWidth="0.8" />
                      <text x="32" y="8" fill="#38BDF8" fontSize="7" fontWeight="bold" textAnchor="middle">SPF-01 (25k CFM)</text>
                    </g>

                    {/* Hoistway Pressurization Fan HPF-01 */}
                    <g transform="translate(335, 10)">
                      <rect x="0" y="16" width="55" height="32" rx="3" fill="#0F172A" stroke="#3B82F6" strokeWidth="1.2" />
                      <circle cx="20" cy="32" r="12" fill="#1E3A8A" stroke="#2563EB" strokeWidth="1" />
                      <g className={pressurizationFans[4].runStatus === 'RUNNING' || isEmergencyPressurizing ? "scada-spin" : ""} style={{ transformOrigin: '20px 32px', transformBox: 'view-box' }}>
                        <line x1="20" y1="22" x2="20" y2="42" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                        <line x1="10" y1="32" x2="30" y2="32" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                      </g>
                      <circle cx="20" cy="32" r="2.5" fill="#FFFFFF" />
                      {/* Intake Louver */}
                      <path d="M38 20 L50 14 L50 42 L38 38 Z" fill="#1E293B" stroke="#64748B" strokeWidth="0.8" />
                      {/* Duct */}
                      <rect x="12" y="46" width="16" height="12" fill="#1D4ED8" stroke="#3B82F6" strokeWidth="0.8" />
                      <text x="27" y="8" fill="#93C5FD" fontSize="7" fontWeight="bold" textAnchor="middle">HPF-01 (15k CFM)</text>
                    </g>

                    {/* Overhead Fire Water Tank for Visual Consistency */}
                    <g transform="translate(190, 8)">
                      <rect x="0" y="14" width="70" height="34" rx="4" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.2" />
                      <text x="35" y="32" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">Overhead Tank</text>
                      <text x="35" y="42" fill="#E0F2FE" fontSize="6.5" textAnchor="middle">46.0 kL (92%)</text>
                    </g>
                  </g>

                  {/* ── BASEMENT PLANT ROOM (B1 & B2 Level) ── */}
                  <g transform="translate(60, 535)">
                    {/* B1 / B2 Basement Area */}
                    <rect x="0" y="0" width="440" height="125" rx="4" fill="#070D18" stroke="#1E293B" strokeWidth="1.2" />

                    {/* Lift Lobby Pressurization Fans LPF-01 & LPF-02 */}
                    <g transform="translate(260, 20)">
                      <rect x="0" y="0" width="135" height="48" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                      <text x="67" y="14" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">Lift Lobby Fans LPF-01 / LPF-02</text>
                      {/* Dual Impellers */}
                      <circle cx="35" cy="30" r="10" fill="#082F49" stroke="#0284C7" strokeWidth="0.8" />
                      <circle cx="95" cy="30" r="10" fill="#082F49" stroke="#0284C7" strokeWidth="0.8" />
                      <g className={pressurizationFans[2].runStatus === 'RUNNING' || isEmergencyPressurizing ? "scada-spin" : ""} style={{ transformOrigin: '35px 30px', transformBox: 'view-box' }}>
                        <line x1="35" y1="22" x2="35" y2="38" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
                        <line x1="27" y1="30" x2="43" y2="30" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
                      </g>
                      <g className={pressurizationFans[3].runStatus === 'RUNNING' || isEmergencyPressurizing ? "scada-spin" : ""} style={{ transformOrigin: '95px 30px', transformBox: 'view-box' }}>
                        <line x1="95" y1="22" x2="95" y2="38" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
                        <line x1="87" y1="30" x2="103" y2="30" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
                      </g>
                      <text x="67" y="44" fill="#38BDF8" fontSize="6.5" textAnchor="middle">18,500 CFM • +28.5 Pa Target</text>
                    </g>

                    {/* Fresh Air Intake Well with Sound Attenuators */}
                    <g transform="translate(30, 20)">
                      <rect x="0" y="0" width="105" height="48" rx="3" fill="#111A2B" stroke="#475569" strokeWidth="1" />
                      <text x="52" y="14" fill="#94A3B8" fontSize="7.5" fontWeight="bold" textAnchor="middle">Fresh Air Intake Well</text>
                      {/* Acoustic Baffles */}
                      <line x1="15" y1="22" x2="90" y2="22" stroke="#64748B" strokeWidth="1.5" />
                      <line x1="15" y1="28" x2="90" y2="28" stroke="#64748B" strokeWidth="1.5" />
                      <line x1="15" y1="34" x2="90" y2="34" stroke="#64748B" strokeWidth="1.5" />
                      <text x="52" y="44" fill="#10B981" fontSize="6.5" textAnchor="middle">● Free Air Passage OK</text>
                    </g>

                    {/* Staircase B Pressurization Fan SPF-02 */}
                    <g transform="translate(150, 75)">
                      <rect x="0" y="0" width="150" height="40" rx="3" fill="#0B1220" stroke="#06C7F5" strokeWidth="1" />
                      <text x="75" y="14" fill="#38BDF8" fontSize="7.5" fontWeight="bold" textAnchor="middle">Stair B Fan SPF-02 (25k CFM)</text>
                      <text x="75" y="28" fill="#10B981" fontSize="7" textAnchor="middle">● Auto Ready • +49.8 Pa Supervised</text>
                    </g>
                  </g>

                  {/* ── SCADA CALLOUT BADGES ── */}
                  {/* Callout 1: Rooftop Staircase Fan SPF-01 */}
                  <g transform="translate(35, 130)">
                    <rect x="0" y="0" width="140" height="34" rx="3" fill="#070D18" stroke="#06C7F5" strokeWidth="1" />
                    <circle cx="12" cy="12" r="3.5" fill="#10B981" />
                    <text x="22" y="12" fill="#FFFFFF" fontSize="7.5" fontWeight="bold">SPF-01 (Staircase A Core)</text>
                    <text x="22" y="22" fill="#38BDF8" fontSize="7">25,000 CFM • Run / Stop Supervised</text>
                    <text x="22" y="30" fill="#10B981" fontSize="6.5">ΔP Supervised: +50.2 Pa</text>
                  </g>

                  {/* Callout 2: Lift Hoistway Fan HPF-01 */}
                  <g transform="translate(365, 130)">
                    <rect x="0" y="0" width="140" height="34" rx="3" fill="#070D18" stroke="#3B82F6" strokeWidth="1" />
                    <circle cx="12" cy="12" r="3.5" fill="#10B981" />
                    <text x="22" y="12" fill="#FFFFFF" fontSize="7.5" fontWeight="bold">HPF-01 (Lift Hoistway)</text>
                    <text x="22" y="22" fill="#93C5FD" fontSize="7">15,000 CFM • Top Hoistway Plant</text>
                    <text x="22" y="30" fill="#10B981" fontSize="6.5">ΔP Supervised: +48.2 Pa</text>
                  </g>

                  {/* Callout 3: Lift Lobby Core */}
                  <g transform="translate(365, 270)">
                    <rect x="0" y="0" width="140" height="34" rx="3" fill="#070D18" stroke="#38BDF8" strokeWidth="1" />
                    <circle cx="12" cy="12" r="3.5" fill="#10B981" />
                    <text x="22" y="12" fill="#FFFFFF" fontSize="7.5" fontWeight="bold">LPF-01/02 (Lift Lobby)</text>
                    <text x="22" y="22" fill="#BAE6FD" fontSize="7">18,500 CFM • Protected Lobby Core</text>
                    <text x="22" y="30" fill="#10B981" fontSize="6.5">ΔP Supervised: +28.5 Pa</text>
                  </g>

                  {/* Callout 4: Central Positive Pressure Principle */}
                  <g transform="translate(195, 220)">
                    <rect x="0" y="0" width="150" height="38" rx="4" fill="#070D18" stroke="#10B981" strokeWidth="1.2" />
                    <text x="75" y="14" fill="#10B981" fontSize="7.5" fontWeight="bold" textAnchor="middle">POSITIVE AIR BARRIER</text>
                    <text x="75" y="24" fill="#FFFFFF" fontSize="7" textAnchor="middle">Stair (+50) &gt; Lobby (+28) &gt; Floor (0)</text>
                    <text x="75" y="33" fill="#94A3B8" fontSize="6" textAnchor="middle">Smoke Cannot Enter Escape Route</text>
                  </g>
                </svg>

                {/* Footer Info Pill */}
                <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25 text-muted small" style={{ fontSize: '11px' }}>
                  <span>Monitored Fans: <strong className="text-white">5 Units Active</strong></span>
                  <span>Pressure Cascade: <strong className="text-cyan">Staircase &gt; Lobby &gt; Floor</strong></span>
                  <span>Fire Alarm Interlock: <strong className="text-success">FACP SLC Armed</strong></span>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  RIGHT COLUMN: Air Pressurization Live Status Cards Grid
                  (Matching Hydrant System Live Status from Image 2!)
                  ──────────────────────────────────────────────────────── */}
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center justify-content-between px-2 py-1 border-bottom border-secondary border-opacity-25 mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <Activity size={16} className="text-cyan" />
                    <h6 className="fw-black text-white mb-0" style={{ fontSize: '13px', letterSpacing: '0.02em' }}>
                      Air Pressurization Live Status
                    </h6>
                  </div>
                  <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                    Active Telemetry Feed
                  </span>
                </div>

                {/* Card 2: Lift Lobby Pressurization Fans Run Status */}
                <div className="acms-compact-status-card">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="acms-hydrant-item-num" style={{ background: '#3B82F6', color: '#FFF' }}>2</span>
                      <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Lift Lobby Fans (LPF-01/02)</span>
                    </div>
                    <span className="acms-status-chip standby" style={{ fontSize: '9px', padding: '2px 7px' }}>
                      {pressurizationFans[2].runStatus}
                    </span>
                  </div>

                  <div className="acms-card-telemetry-grid">
                    <div className="acms-telemetry-item">
                      <span className="label">Run Status:</span>
                      <span className="value text-cyan">{pressurizationFans[2].runStatus}</span>
                    </div>
                    <div className="acms-telemetry-item">
                      <span className="label">Power Status:</span>
                      <span className="value text-success">{pressurizationFans[2].powerStatus}</span>
                    </div>
                    <div className="acms-telemetry-item">
                      <span className="label">Airflow Output:</span>
                      <span className="value text-white font-monospace">{pressurizationFans[2].flowRate}</span>
                    </div>
                    <div className="acms-telemetry-item">
                      <span className="label">Lobby ΔP:</span>
                      <span className="value text-success font-monospace">{pressurizationFans[2].deltaP}</span>
                    </div>
                  </div>

                  <div className="acms-card-action-bar">
                    <span className="text-muted" style={{ fontSize: '10px' }}>● Protected Core A & B</span>
                    <button
                      type="button"
                      className="acms-micro-toggle-btn info"
                      onClick={() => setPressurizationFans(prev => prev.map((item, i) => i === 2 ? { ...item, runStatus: item.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' } : item))}
                    >
                      {pressurizationFans[2].runStatus === 'RUNNING' ? 'Stop Lobby Fan' : 'Start Lobby Fan'}
                    </button>
                  </div>
                </div>

                {/* Card 3: Lift Hoistway Pressurization Fan Run Status */}
                <div className="acms-compact-status-card">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="acms-hydrant-item-num" style={{ background: '#8B5CF6', color: '#FFF' }}>3</span>
                      <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Hoistway Fan (HPF-01)</span>
                    </div>
                    <span className="acms-status-chip standby" style={{ fontSize: '9px', padding: '2px 7px' }}>
                      {pressurizationFans[4].runStatus}
                    </span>
                  </div>

                  <div className="acms-card-telemetry-grid">
                    <div className="acms-telemetry-item">
                      <span className="label">Run Status:</span>
                      <span className="value text-cyan">{pressurizationFans[4].runStatus}</span>
                    </div>
                    <div className="acms-telemetry-item">
                      <span className="label">Power Status:</span>
                      <span className="value text-success">{pressurizationFans[4].powerStatus}</span>
                    </div>
                    <div className="acms-telemetry-item">
                      <span className="label">Hoistway Flow:</span>
                      <span className="value text-white font-monospace">{pressurizationFans[4].flowRate}</span>
                    </div>
                    <div className="acms-telemetry-item">
                      <span className="label">Shaft ΔP:</span>
                      <span className="value text-success font-monospace">{pressurizationFans[4].deltaP}</span>
                    </div>
                  </div>

                  <div className="acms-card-action-bar">
                    <span className="text-muted" style={{ fontSize: '10px' }}>● Hoistway Top Plant</span>
                    <button
                      type="button"
                      className="acms-micro-toggle-btn purple"
                      onClick={() => setPressurizationFans(prev => prev.map((item, i) => i === 4 ? { ...item, runStatus: item.runStatus === 'RUNNING' ? 'STANDBY AUTO' : 'RUNNING' } : item))}
                    >
                      {pressurizationFans[4].runStatus === 'RUNNING' ? 'Stop Hoistway Fan' : 'Start Hoistway Fan'}
                    </button>
                  </div>
                </div>

                {/* Card 4: Pressure Cascade & Relief Damper Monitoring */}
                <div className="acms-compact-status-card">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="acms-hydrant-item-num" style={{ background: '#10B981', color: '#FFF' }}>4</span>
                      <span className="fw-bold text-white" style={{ fontSize: '11.5px' }}>Pressure Cascade & Dampers</span>
                    </div>
                    <span className="acms-status-chip running" style={{ fontSize: '9px', padding: '2px 7px' }}>
                      IN SPECIFICATION
                    </span>
                  </div>

                  {/* 3-Tier Visual Cascade Bar */}
                  <div className="p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 mt-2 mb-2">
                    <div className="d-flex align-items-center justify-content-between text-muted mb-1" style={{ fontSize: '10.5px' }}>
                      <span>Stair Shaft (+50 Pa):</span>
                      <strong className="text-cyan">100% Barrier</strong>
                    </div>
                    <div className="acms-tank-bar-track mb-1.5" style={{ height: '5px' }}>
                      <div className="acms-tank-bar-fill" style={{ width: '100%', background: '#06C7F5' }}></div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between text-muted mb-1" style={{ fontSize: '10.5px' }}>
                      <span>Lift Lobby (+28.5 Pa):</span>
                      <strong className="text-info">57% Buffer</strong>
                    </div>
                    <div className="acms-tank-bar-track mb-1.5" style={{ height: '5px' }}>
                      <div className="acms-tank-bar-fill" style={{ width: '57%', background: '#3B82F6' }}></div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '10.5px' }}>
                      <span>Floor Corridor (0 Pa):</span>
                      <span className="text-secondary font-monospace">Atmospheric Baseline</span>
                    </div>
                  </div>

                  <div className="acms-card-telemetry-grid">
                    <div className="acms-telemetry-item">
                      <span className="label">Door Opening Force:</span>
                      <span className="value text-success">&lt; 100 N (68 N Safe)</span>
                    </div>
                    <div className="acms-telemetry-item">
                      <span className="label">Relief Dampers:</span>
                      <span className="value text-white">15% Modulating</span>
                    </div>
                  </div>

                  <div className="acms-card-action-bar mt-2">
                    <button
                      type="button"
                      className={`btn btn-xs w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 py-1.5 ${isEmergencyPressurizing ? 'btn-warning text-dark' : 'btn-danger'}`}
                      style={{ borderRadius: '5px', fontSize: '11px' }}
                      onClick={() => {
                        const nextState = !isEmergencyPressurizing;
                        setIsEmergencyPressurizing(nextState);
                        setPressurizationFans(prev => prev.map(f => ({ ...f, runStatus: nextState ? 'RUNNING' : 'STANDBY AUTO' })));
                      }}
                    >
                      <Wind size={13} />
                      {isEmergencyPressurizing ? 'Active: Emergency Smoke Mode (All Fans Online)' : 'Simulate Emergency Smoke Mode'}
                    </button>
                  </div>
                </div>
              </div>
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
                    <h5 className="fw-black text-white mb-0" style={{ letterSpacing: '-0.01em' }}>
                      Clause 3 (h) Air Pressurization Subsystem — Fullscreen SCADA Architecture & Differential Diagnostics
                    </h5>
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
                      <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 pb-2">
                        <span className="fw-bold text-white small d-flex align-items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-success" /> Clause 3 (h) 5 Monitored Fans Status
                        </span>
                        <span className="text-muted small" style={{ fontSize: '10.5px' }}>
                          5 / 5 Supervised
                        </span>
                      </div>

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
