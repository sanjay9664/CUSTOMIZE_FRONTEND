import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Row, Col, Card, Badge, Form } from 'react-bootstrap';
import {
  Droplets, Activity, Zap, LayoutDashboard, Cpu, ShieldAlert,
  Bell, Wind, Gauge, Thermometer, Sliders, Box, Clock,
  Settings as SettingsIcon, FileText, ChevronRight, ChevronLeft, UserCheck, CreditCard,
  Filter, Radio, CheckCircle2, ShieldCheck, Flame, RadioReceiver, ArrowUpRight,
  Sun, BatteryCharging, AlertTriangle, Wrench, CheckCircle, TrendingUp, Leaf,
  Snowflake, Fan, BarChart3, RefreshCw, ThermometerSun, AlertCircle, Eye, Power
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './EnergyMetering/MFMMeter.css';

// ── CIRCULAR RADIAL GAUGE COMPONENT ──────────────────────────────────────────
const SCADARadialGauge = ({ value, label, color, percent = 75 }) => {
  const radius = 24;
  const stroke = 3.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center flex-shrink-0 ms-2" style={{ width: '68px' }}>
      <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
        <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="28"
            cy="28"
            r={radius}
            className="gauge-track-circle"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div className="position-absolute text-center w-100 px-1">
          <div className="gauge-value-text text-white fw-black font-monospace text-truncate lh-1" style={{ fontSize: '0.78rem' }}>
            {value}
          </div>
        </div>
      </div>
      <small className="gauge-label-text text-slate-400 fw-bold uppercase mt-1 text-center text-truncate w-100" style={{ fontSize: '0.58rem', letterSpacing: '0.01em' }}>
        {label}
      </small>
    </div>
  );
};

// ── HELPER FOR SCADA METRIC TILE STATUS STYLING (RED / GREEN / YELLOW / CYAN) ──
const getMetricTileStyle = (m, svcColor = '#38bdf8', isLightMode = false) => {
  let status = m?.status;

  if (!status) {
    const valStr = String(m?.val || '').trim();
    const labelStr = String(m?.label || '').toLowerCase();
    
    if (labelStr.includes('critical') || labelStr.includes('fault') || valStr.toLowerCase().includes('fault') || valStr.toLowerCase().includes('trip') || valStr.toLowerCase().includes('danger')) {
      status = (valStr === '0' || valStr === '0/0') ? 'green' : 'red';
    } else if (labelStr.includes('warning') || labelStr.includes('temp') || (valStr.includes('%') && parseInt(valStr) > 75)) {
      status = 'yellow';
    } else if (valStr.toLowerCase().includes('on') || valStr.toLowerCase().includes('normal') || valStr.toLowerCase().includes('good') || valStr.toLowerCase().includes('online')) {
      status = 'green';
    } else {
      status = 'green';
    }
  }

  if (isLightMode) {
    switch (status) {
      case 'red': case 'danger':
        return { bg: 'rgba(239, 68, 68, 0.08)', border: '1.5px solid rgba(220, 38, 38, 0.35)', text: '#dc2626', iconColor: '#dc2626', shadow: '0 2px 8px rgba(239, 68, 68, 0.1)', dotColor: '#dc2626', badgeBg: 'rgba(239, 68, 68, 0.12)' };
      case 'yellow': case 'warning':
        return { bg: 'rgba(217, 119, 6, 0.08)', border: '1.5px solid rgba(217, 119, 6, 0.35)', text: '#b45309', iconColor: '#d97706', shadow: '0 2px 8px rgba(245, 158, 11, 0.1)', dotColor: '#d97706', badgeBg: 'rgba(245, 158, 11, 0.12)' };
      case 'cyan': case 'info':
        return { bg: 'rgba(6, 182, 212, 0.08)', border: '1.5px solid rgba(8, 145, 178, 0.35)', text: '#0891b2', iconColor: '#0891b2', shadow: '0 2px 8px rgba(6, 182, 212, 0.1)', dotColor: '#0891b2', badgeBg: 'rgba(6, 182, 212, 0.12)' };
      case 'green': case 'success': default:
        return { bg: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid rgba(5, 150, 105, 0.35)', text: '#059669', iconColor: '#059669', shadow: '0 2px 8px rgba(16, 185, 129, 0.1)', dotColor: '#059669', badgeBg: 'rgba(16, 185, 129, 0.12)' };
    }
  }

  switch (status) {
    case 'red':
    case 'danger':
      return {
        bg: 'rgba(239, 68, 68, 0.16)',
        border: '1.5px solid rgba(239, 68, 68, 0.6)',
        text: '#f87171',
        iconColor: '#ef4444',
        shadow: '0 0 14px rgba(239, 68, 68, 0.3)',
        dotColor: '#ef4444',
        badgeBg: 'rgba(239, 68, 68, 0.25)'
      };
    case 'yellow':
    case 'warning':
      return {
        bg: 'rgba(245, 158, 11, 0.16)',
        border: '1.5px solid rgba(245, 158, 11, 0.6)',
        text: '#fbbf24',
        iconColor: '#f59e0b',
        shadow: '0 0 14px rgba(245, 158, 11, 0.3)',
        dotColor: '#f59e0b',
        badgeBg: 'rgba(245, 158, 11, 0.25)'
      };
    case 'cyan':
    case 'info':
      return {
        bg: 'rgba(6, 182, 212, 0.16)',
        border: '1.5px solid rgba(6, 182, 212, 0.6)',
        text: '#38bdf8',
        iconColor: '#06b6d4',
        shadow: '0 0 14px rgba(6, 182, 212, 0.3)',
        dotColor: '#06b6d4',
        badgeBg: 'rgba(6, 182, 212, 0.25)'
      };
    case 'green':
    case 'success':
    default:
      return {
        bg: 'rgba(16, 185, 129, 0.16)',
        border: '1.5px solid rgba(16, 185, 129, 0.6)',
        text: '#34d399',
        iconColor: '#10b981',
        shadow: '0 0 14px rgba(16, 185, 129, 0.3)',
        dotColor: '#10b981',
        badgeBg: 'rgba(16, 185, 129, 0.25)'
      };
  }
};

// ── SCADA CORE DESIGN VARIANTS ──────────────────────────────────────────────
const CORE_DESIGNS = [
  { id: 'cyber', label: '⬡ Cyber Reactor' },
  { id: 'neon', label: '◎ Neon Pulse' },
  { id: 'quantum', label: '⟐ Quantum Arc' },
  { id: 'holo', label: '⬢ Hologram Grid' },
];

// ── SCADA CORE HUB RENDERER (MULTIPLE DESIGNS) ─────────────────────────────
const ScadaCoreHub = ({ designId, cx, cy, onClick }) => {
  const hubSize = 210;
  const bodySize = 155;
  const bodyOffset = (hubSize - bodySize) / 2;

  // ─ Design: Cyber Reactor (default) ─
  if (designId === 'cyber') {
    return (
      <div
        className="position-absolute d-flex align-items-center justify-content-center cursor-pointer text-center scada-core-outer-wrap"
        onClick={onClick}
        title="Click to inspect active SCADA core detail"
        style={{ left: `${cx}px`, top: `${cy}px`, transform: 'translate(-50%, -50%)', width: `${hubSize}px`, height: `${hubSize}px`, zIndex: 10 }}
      >
        <svg className="position-absolute" width={hubSize} height={hubSize} viewBox="0 0 210 210" style={{ animation: 'dashboardSpin 25s linear infinite', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="arcGrad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" /><stop offset="100%" stopColor="#a855f7" stopOpacity="0.6" /></linearGradient>
            <linearGradient id="arcGrad2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#10b981" stopOpacity="0.8" /><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" /></linearGradient>
          </defs>
          <circle cx="105" cy="105" r="100" fill="none" stroke="url(#arcGrad1)" strokeWidth="2" strokeDasharray="80 77" strokeLinecap="round" opacity="0.85" />
          <circle cx="105" cy="105" r="100" fill="none" stroke="url(#arcGrad2)" strokeWidth="1.5" strokeDasharray="50 107" strokeLinecap="round" opacity="0.6" transform="rotate(45 105 105)" />
        </svg>
        <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '190px', height: '190px', top: '10px', left: '10px', border: '1.5px dashed rgba(56, 189, 248, 0.3)', animation: 'dashboardSpin 18s linear infinite reverse' }} />
        <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '175px', height: '175px', top: '17.5px', left: '17.5px', border: '1px solid rgba(168, 85, 247, 0.35)', boxShadow: '0 0 15px rgba(168, 85, 247, 0.15)', animation: 'dashboardSpin 14s linear infinite' }} />
        <div className="position-absolute rounded-circle d-flex flex-column align-items-center justify-content-center scada-core-reactor-hub" style={{ width: `${bodySize}px`, height: `${bodySize}px`, top: `${bodyOffset}px`, left: `${bodyOffset}px`, background: 'radial-gradient(circle at 40% 35%, rgba(20, 40, 80, 0.95) 0%, rgba(3, 7, 18, 0.98) 100%)', border: '1.5px solid rgba(56, 189, 248, 0.5)', boxShadow: '0 0 60px rgba(56, 189, 248, 0.3), 0 0 30px rgba(168, 85, 247, 0.15), inset 0 0 40px rgba(56, 189, 248, 0.12), inset 0 -20px 40px rgba(168, 85, 247, 0.08)', backdropFilter: 'blur(16px)' }}>
          <div className="position-absolute inset-0 rounded-circle pointer-events-none overflow-hidden" style={{ opacity: 0.06, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2338bdf8' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: '20px 34px' }} />
          <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '125px', height: '125px', top: '15px', left: '15px', border: '1px solid rgba(56, 189, 248, 0.12)', boxShadow: 'inset 0 0 20px rgba(56, 189, 248, 0.08)' }} />
          <div className="position-relative mb-1" style={{ zIndex: 2 }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto orbital-core-pulse" style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)', border: '1px solid rgba(56, 189, 248, 0.35)', boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)' }}>
              <Cpu size={22} style={{ color: '#38bdf8', filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.8))' }} />
            </div>
          </div>
          <span className="scada-core-title fw-black font-monospace tracking-wider uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.12em', zIndex: 2, position: 'relative' }}>SCADA CORE</span>
          <div className="d-flex align-items-center gap-1 mt-0.5" style={{ zIndex: 2, position: 'relative' }}>
            <span className="rounded-circle d-inline-block status-dot-pulse" style={{ width: '5px', height: '5px', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span className="scada-core-status font-monospace fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>99.8% ONLINE</span>
          </div>
          <span className="scada-core-load font-monospace" style={{ fontSize: '0.58rem', letterSpacing: '0.04em', zIndex: 2, position: 'relative', marginTop: '2px' }}>470 kW | CAD</span>
        </div>
        <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '220px', height: '220px', top: '-5px', left: '-5px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)', animation: 'orbitalCorePulse 4s ease-in-out infinite', zIndex: -1 }} />
      </div>
    );
  }

  // ─ Design: Neon Pulse ─
  if (designId === 'neon') {
    return (
      <div
        className="position-absolute d-flex align-items-center justify-content-center cursor-pointer text-center scada-core-outer-wrap"
        onClick={onClick}
        title="Click to inspect active SCADA core detail"
        style={{ left: `${cx}px`, top: `${cy}px`, transform: 'translate(-50%, -50%)', width: `${hubSize}px`, height: `${hubSize}px`, zIndex: 10 }}
      >
        {/* Neon triple ring pulsing */}
        <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '208px', height: '208px', top: '1px', left: '1px', border: '2px solid #ec4899', boxShadow: '0 0 20px rgba(236, 72, 153, 0.4), inset 0 0 20px rgba(236, 72, 153, 0.1)', animation: 'orbitalCorePulse 3s ease-in-out infinite' }} />
        <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '190px', height: '190px', top: '10px', left: '10px', border: '1.5px solid rgba(168, 85, 247, 0.6)', boxShadow: '0 0 16px rgba(168, 85, 247, 0.3)', animation: 'dashboardSpin 20s linear infinite' }} />
        <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '175px', height: '175px', top: '17.5px', left: '17.5px', border: '1px dashed rgba(236, 72, 153, 0.3)', animation: 'dashboardSpin 15s linear infinite reverse' }} />
        <div className="position-absolute rounded-circle d-flex flex-column align-items-center justify-content-center scada-core-reactor-hub" style={{ width: `${bodySize}px`, height: `${bodySize}px`, top: `${bodyOffset}px`, left: `${bodyOffset}px`, background: 'radial-gradient(circle at 50% 40%, rgba(60, 20, 60, 0.95) 0%, rgba(10, 2, 18, 0.98) 100%)', border: '2px solid rgba(236, 72, 153, 0.55)', boxShadow: '0 0 50px rgba(236, 72, 153, 0.25), 0 0 25px rgba(168, 85, 247, 0.2), inset 0 0 35px rgba(236, 72, 153, 0.1)', backdropFilter: 'blur(14px)' }}>
          <div className="position-relative mb-1" style={{ zIndex: 2 }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto orbital-core-pulse" style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)', border: '1.5px solid rgba(236, 72, 153, 0.5)', boxShadow: '0 0 25px rgba(236, 72, 153, 0.35)' }}>
              <Cpu size={22} style={{ color: '#f472b6', filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.9))' }} />
            </div>
          </div>
          <span className="scada-core-title fw-black font-monospace tracking-wider uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.12em', zIndex: 2, position: 'relative' }}>SCADA CORE</span>
          <div className="d-flex align-items-center gap-1 mt-0.5" style={{ zIndex: 2, position: 'relative' }}>
            <span className="rounded-circle d-inline-block status-dot-pulse" style={{ width: '5px', height: '5px', backgroundColor: '#f472b6', boxShadow: '0 0 8px #ec4899' }} />
            <span className="scada-core-status font-monospace fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>99.8% ONLINE</span>
          </div>
          <span className="scada-core-load font-monospace" style={{ fontSize: '0.58rem', letterSpacing: '0.04em', zIndex: 2, position: 'relative', marginTop: '2px' }}>470 kW | CAD</span>
        </div>
        <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '225px', height: '225px', top: '-7.5px', left: '-7.5px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 65%)', animation: 'orbitalCorePulse 3.5s ease-in-out infinite', zIndex: -1 }} />
      </div>
    );
  }

  // ─ Design: Quantum Arc ─
  if (designId === 'quantum') {
    return (
      <div
        className="position-absolute d-flex align-items-center justify-content-center cursor-pointer text-center scada-core-outer-wrap"
        onClick={onClick}
        title="Click to inspect active SCADA core detail"
        style={{ left: `${cx}px`, top: `${cy}px`, transform: 'translate(-50%, -50%)', width: `${hubSize}px`, height: `${hubSize}px`, zIndex: 10 }}
      >
        {/* Quantum rotating concentric arcs */}
        <svg className="position-absolute" width={hubSize} height={hubSize} viewBox="0 0 210 210" style={{ top: 0, left: 0 }}>
          <defs>
            <linearGradient id="qGrad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981" stopOpacity="0.9" /><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" /></linearGradient>
            <linearGradient id="qGrad2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" /><stop offset="100%" stopColor="#34d399" stopOpacity="0.5" /></linearGradient>
          </defs>
          <circle cx="105" cy="105" r="100" fill="none" stroke="url(#qGrad1)" strokeWidth="2.5" strokeDasharray="30 25 60 42" strokeLinecap="round" style={{ animation: 'dashboardSpin 20s linear infinite' }} />
          <circle cx="105" cy="105" r="92" fill="none" stroke="url(#qGrad2)" strokeWidth="1.5" strokeDasharray="45 35 20 57" strokeLinecap="round" style={{ animation: 'dashboardSpin 28s linear infinite reverse' }} />
          <circle cx="105" cy="105" r="83" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" strokeDasharray="8 8" />
          {/* Tick marks around outer ring */}
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i * 10 * Math.PI) / 180;
            const r1 = 100, r2 = i % 3 === 0 ? 96 : 98;
            return <line key={i} x1={105 + r1 * Math.cos(a)} y1={105 + r1 * Math.sin(a)} x2={105 + r2 * Math.cos(a)} y2={105 + r2 * Math.sin(a)} stroke="rgba(16, 185, 129, 0.4)" strokeWidth={i % 3 === 0 ? '1.5' : '0.8'} />;
          })}
        </svg>
        <div className="position-absolute rounded-circle d-flex flex-column align-items-center justify-content-center scada-core-reactor-hub" style={{ width: `${bodySize}px`, height: `${bodySize}px`, top: `${bodyOffset}px`, left: `${bodyOffset}px`, background: 'radial-gradient(circle at 45% 40%, rgba(10, 45, 40, 0.95) 0%, rgba(2, 10, 8, 0.98) 100%)', border: '1.5px solid rgba(16, 185, 129, 0.5)', boxShadow: '0 0 50px rgba(16, 185, 129, 0.25), 0 0 25px rgba(6, 182, 212, 0.15), inset 0 0 35px rgba(16, 185, 129, 0.1)', backdropFilter: 'blur(14px)' }}>
          <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '130px', height: '130px', top: '12.5px', left: '12.5px', border: '1px solid rgba(16, 185, 129, 0.15)', boxShadow: 'inset 0 0 18px rgba(16, 185, 129, 0.06)' }} />
          <div className="position-relative mb-1" style={{ zIndex: 2 }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto orbital-core-pulse" style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)', border: '1px solid rgba(16, 185, 129, 0.4)', boxShadow: '0 0 18px rgba(16, 185, 129, 0.3)' }}>
              <Cpu size={22} style={{ color: '#34d399', filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))' }} />
            </div>
          </div>
          <span className="scada-core-title fw-black font-monospace tracking-wider uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.12em', zIndex: 2, position: 'relative' }}>SCADA CORE</span>
          <div className="d-flex align-items-center gap-1 mt-0.5" style={{ zIndex: 2, position: 'relative' }}>
            <span className="rounded-circle d-inline-block status-dot-pulse" style={{ width: '5px', height: '5px', backgroundColor: '#34d399', boxShadow: '0 0 8px #10b981' }} />
            <span className="scada-core-status font-monospace fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>99.8% ONLINE</span>
          </div>
          <span className="scada-core-load font-monospace" style={{ fontSize: '0.58rem', letterSpacing: '0.04em', zIndex: 2, position: 'relative', marginTop: '2px' }}>470 kW | CAD</span>
        </div>
        <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '220px', height: '220px', top: '-5px', left: '-5px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)', animation: 'orbitalCorePulse 4s ease-in-out infinite', zIndex: -1 }} />
      </div>
    );
  }

  // ─ Design: Hologram Grid ─
  return (
    <div
      className="position-absolute d-flex align-items-center justify-content-center cursor-pointer text-center scada-core-outer-wrap"
      onClick={onClick}
      title="Click to inspect active SCADA core detail"
      style={{ left: `${cx}px`, top: `${cy}px`, transform: 'translate(-50%, -50%)', width: `${hubSize}px`, height: `${hubSize}px`, zIndex: 10 }}
    >
      {/* Hologram concentric dotted rings */}
      <svg className="position-absolute" width={hubSize} height={hubSize} viewBox="0 0 210 210" style={{ top: 0, left: 0, animation: 'dashboardSpin 30s linear infinite' }}>
        <circle cx="105" cy="105" r="100" fill="none" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="105" cy="105" r="95" fill="none" stroke="rgba(168, 85, 247, 0.25)" strokeWidth="0.8" strokeDasharray="2 6" />
        {/* Holographic crosshair lines */}
        <line x1="105" y1="2" x2="105" y2="30" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.8" />
        <line x1="105" y1="180" x2="105" y2="208" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.8" />
        <line x1="2" y1="105" x2="30" y2="105" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.8" />
        <line x1="180" y1="105" x2="208" y2="105" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.8" />
        {/* Small diamond markers at cardinal points */}
        {[0, 90, 180, 270].map(deg => {
          const rad = (deg * Math.PI) / 180;
          const x = 105 + 100 * Math.cos(rad);
          const y = 105 + 100 * Math.sin(rad);
          return <circle key={deg} cx={x} cy={y} r="3" fill="rgba(56, 189, 248, 0.6)" />;
        })}
      </svg>
      <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '185px', height: '185px', top: '12.5px', left: '12.5px', border: '1px solid rgba(56, 189, 248, 0.2)', animation: 'dashboardSpin 22s linear infinite reverse' }} />
      <div className="position-absolute rounded-circle d-flex flex-column align-items-center justify-content-center scada-core-reactor-hub" style={{ width: `${bodySize}px`, height: `${bodySize}px`, top: `${bodyOffset}px`, left: `${bodyOffset}px`, background: 'radial-gradient(circle at 50% 50%, rgba(15, 25, 50, 0.96) 0%, rgba(2, 6, 14, 0.98) 100%)', border: '1.5px solid rgba(56, 189, 248, 0.4)', boxShadow: '0 0 45px rgba(56, 189, 248, 0.2), 0 0 20px rgba(168, 85, 247, 0.1), inset 0 0 30px rgba(56, 189, 248, 0.08)', backdropFilter: 'blur(12px)' }}>
        {/* Grid overlay */}
        <div className="position-absolute inset-0 rounded-circle pointer-events-none overflow-hidden" style={{ opacity: 0.04, backgroundImage: 'linear-gradient(rgba(56,189,248,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.4) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="position-relative mb-1" style={{ zIndex: 2 }}>
          <div className="d-flex align-items-center justify-content-center mx-auto orbital-core-pulse" style={{ width: '44px', height: '44px', background: 'rgba(56, 189, 248, 0.08)', border: '1.5px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', transform: 'rotate(45deg)', boxShadow: '0 0 18px rgba(56, 189, 248, 0.2)' }}>
            <Cpu size={20} style={{ color: '#38bdf8', filter: 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.7))', transform: 'rotate(-45deg)' }} />
          </div>
        </div>
        <span className="scada-core-title fw-black font-monospace tracking-wider uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.12em', zIndex: 2, position: 'relative' }}>SCADA CORE</span>
        <div className="d-flex align-items-center gap-1 mt-0.5" style={{ zIndex: 2, position: 'relative' }}>
          <span className="rounded-circle d-inline-block status-dot-pulse" style={{ width: '5px', height: '5px', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span className="scada-core-status font-monospace fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>99.8% ONLINE</span>
        </div>
        <span className="scada-core-load font-monospace" style={{ fontSize: '0.58rem', letterSpacing: '0.04em', zIndex: 2, position: 'relative', marginTop: '2px' }}>470 kW | CAD</span>
      </div>
      <div className="position-absolute rounded-circle pointer-events-none" style={{ width: '220px', height: '220px', top: '-5px', left: '-5px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.06) 0%, transparent 65%)', animation: 'orbitalCorePulse 5s ease-in-out infinite', zIndex: -1 }} />
    </div>
  );
};

// ── FUTURISTIC ORBITAL SCADA RADAR WHEEL COMPONENT (GPU HARDWARE ACCELERATED) ──
const FuturisticOrbitalSCADA = ({ services = [], navigate, coreDesign = 'cyber' }) => {
  const [isRotating, setIsRotating] = useState(true);
  const [speedMode, setSpeedMode] = useState('normal'); // 'slow', 'normal', 'fast'
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [selectedSvcModal, setSelectedSvcModal] = useState(null);

  const count = services.length;
  const radius = 300;     // Compact 300px radius for zero top/bottom clipping
  const ringSize = radius * 2; // 600px diameter ring
  const stageW = 920;    // 920px Stage Width
  const stageH = 720;    // 720px Stage Height
  const cx = stageW / 2; // Exact Center X = 460
  const cy = stageH / 2; // Exact Center Y = 360

  // Speed duration: Normal (50s), Slow (80s), Fast (25s)
  const duration = speedMode === 'slow' ? '80s' : speedMode === 'fast' ? '25s' : '50s';

  // Auto-cycle backdrop image every 6s when not hovered
  useEffect(() => {
    if (!isRotating || hoveredIndex !== null || !services.length) return;
    const timer = setInterval(() => {
      setBgIndex(prev => (prev + 1) % services.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isRotating, hoveredIndex, services.length]);

  const activeSvc = hoveredIndex !== null ? services[hoveredIndex] : services[bgIndex % (services.length || 1)];
  const bgImage = activeSvc?.image || '/cooling_tower.png';
  const bgColor = activeSvc?.color || '#38bdf8';

  return (
    <div className={`futuristic-orbital-container mb-4 position-relative overflow-hidden rounded-4 p-4 text-center ${!isRotating || hoveredIndex !== null ? 'scada-orbital-paused' : ''}`}>
      {/* Background Cinematic Translucent Image Backdrop */}
      <div
        className="position-absolute inset-0 scada-cinematic-bg-layer pointer-events-none"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease'
        }}
      />

      {/* Cinematic Overlay Vignette Gradient */}
      <div className="position-absolute inset-0 scada-cinematic-overlay-gradient pointer-events-none" />

      {/* Dynamic Radial Accent Glow */}
      <div
        className="position-absolute pointer-events-none scada-radial-accent-glow"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${bgColor}25 0%, transparent 70%)`,
          transition: 'background 0.8s ease'
        }}
      />

      {/* Top Controls & Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3 px-2 z-10 position-relative">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Active System Cinematic Tag Badge */}
          {activeSvc && (
            <div
              className="d-none d-md-flex align-items-center gap-2 px-3 py-1 rounded-pill scada-cinematic-banner-tag"
              style={{ borderLeft: `3px solid ${bgColor}` }}
            >
              <span className="fw-bold font-monospace text-truncate" style={{ fontSize: '0.72rem', color: bgColor }}>
                FOCUS: {activeSvc.title}
              </span>
              <span className="text-slate-400 font-monospace" style={{ fontSize: '0.66rem' }}>
                ({activeSvc.metrics?.[0]?.label || 'Status'}: {activeSvc.metrics?.[0]?.val || activeSvc.gaugeVal || 'ONLINE'})
              </span>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => setSpeedMode(prev => prev === 'normal' ? 'fast' : prev === 'fast' ? 'slow' : 'normal')}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 font-monospace fs-11 fw-bold"
            title="Cycle Orbit Speed"
          >
            ⚡ SPEED: {speedMode.toUpperCase()}
          </button>
          <button
            onClick={() => setIsRotating(prev => !prev)}
            className={`btn btn-sm ${isRotating ? 'btn-outline-info' : 'btn-outline-warning'} rounded-pill px-3.5 d-flex align-items-center gap-1.5 font-monospace fs-11 fw-bold`}
            title="Toggle Rotation"
          >
            {isRotating ? <RefreshCw size={13} className="dashboard-fan-spin" /> : <Power size={13} />}
            {isRotating ? 'ORBITING (60 FPS)' : 'PAUSED'}
          </button>
        </div>
      </div>

      {/* Main Orbit Stage Area (1080x780 with Auto-Scaling for Laptops & Mobile) */}
      <div className="scada-radar-responsive-outer w-100 d-flex justify-content-center overflow-hidden">
        <div
          className="orbital-stage-wrapper position-relative my-2 mx-auto rounded-4"
          style={{ width: `${stageW}px`, height: `${stageH}px` }}
        >
          {/* SVG Concentric Radar Rings Centered at (cx, cy) */}
          <svg
            className="position-absolute inset-0 pointer-events-none scada-radar-ring-svg"
            width={stageW}
            height={stageH}
            viewBox={`0 0 ${stageW} ${stageH}`}
            style={{ zIndex: 1 }}
          >
            <circle cx={cx} cy={cy} r={radius} stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1.5" strokeDasharray="6 6" fill="none" />
            <circle cx={cx} cy={cy} r={radius * 0.65} stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" fill="none" />
            <circle cx={cx} cy={cy} r={radius * 0.35} stroke="rgba(56, 189, 248, 0.18)" strokeWidth="1.5" fill="none" />
          </svg>

          {/* CENTER REACTOR SCADA CORE HUB (DYNAMIC DESIGN) */}
          <ScadaCoreHub designId={coreDesign} cx={cx} cy={cy} onClick={() => setSelectedSvcModal(activeSvc)} />

          {/* GPU HARDWARE ACCELERATED ROTATING RING CONTAINER (ZER0 RE-RENDERS) */}
          <div
            className="position-absolute scada-orbital-ring-spinning"
            style={{
              left: `${cx}px`,
              top: `${cy}px`,
              width: `${ringSize}px`,
              height: `${ringSize}px`,
              zIndex: 5,
              animationDuration: duration,
              animationPlayState: (!isRotating || hoveredIndex !== null) ? 'paused' : 'running'
            }}
          >
            {/* ORBITING SERVICE IMAGE CARDS DISTRIBUTED AROUND THE 700PX RING */}
            {services.map((svc, idx) => {
              const angleDeg = idx * (360 / count);
              const angleRad = (angleDeg * Math.PI) / 180;
              const nodeW = 148; // Card width
              const nodeH = 80;  // Card height (sleek & compact)
              const ringR = radius; // 300px radius
              const nodeX = ringR + ringR * Math.cos(angleRad);
              const nodeY = ringR + ringR * Math.sin(angleRad);
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={svc.key || idx}
                  style={{
                    position: 'absolute',
                    left: `${nodeX}px`,
                    top: `${nodeY}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isHovered ? 50 : 5
                  }}
                >
                  {/* COUNTER-SPIN CONTAINER TO KEEP TEXT & IMAGES PERFECTLY UPRIGHT AT ALL TIMES */}
                  <div
                    className="scada-node-upright-spinning cursor-pointer transition-all rounded-3 overflow-hidden shadow-lg d-flex flex-column position-relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSvcModal(svc);
                    }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      width: `${nodeW}px`,
                      height: `${nodeH}px`,
                      animationDuration: duration,
                      animationPlayState: (!isRotating || hoveredIndex !== null) ? 'paused' : 'running',
                      background: 'var(--scada-card, rgba(15, 23, 42, 0.95))',
                      border: `1.5px solid ${isHovered ? svc.color : svc.color + '70'}`,
                      boxShadow: isHovered
                        ? `0 0 36px ${svc.color}90, 0 10px 28px rgba(0,0,0,0.85)`
                        : `0 4px 14px rgba(0, 0, 0, 0.5), 0 0 12px ${svc.color}25`,
                      transform: isHovered ? 'scale(1.22)' : 'scale(1)',
                      backdropFilter: 'blur(12px)',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease'
                    }}
                  >
                    {/* Top Half: Mini Equipment/SCADA Photo Thumbnail */}
                    <div className="position-relative w-100 overflow-hidden" style={{ height: '38px', backgroundColor: '#030712' }}>
                      {svc.isSmartMeter ? (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center p-1 smart-meter-mini-banner" style={{ background: 'linear-gradient(135deg, #030814 0%, #0c182e 100%)' }}>
                          <div className="font-monospace text-emerald-400 fw-bold text-center smart-meter-text" style={{ fontSize: '0.60rem', lineHeight: '1.2' }}>
                            ⚡ APM SMART METER<br />
                            <span className="text-amber-300 smart-meter-val">{svc.gaugeVal} kWh</span>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={svc.image}
                          alt={svc.title}
                          className="w-100 h-100"
                          style={{
                            objectFit: 'cover',
                            objectPosition: 'center',
                            filter: isHovered ? 'brightness(1.15)' : 'brightness(0.95)'
                          }}
                        />
                      )}

                      {/* Overlaid Neon Icon Badge */}
                      <div
                        className="position-absolute top-1 start-1 rounded-circle d-flex align-items-center justify-content-center shadow"
                        style={{
                          width: '22px',
                          height: '22px',
                          backgroundColor: 'rgba(3, 7, 18, 0.88)',
                          color: svc.color,
                          border: `1px solid ${svc.color}`,
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        {svc.icon}
                      </div>

                      {/* Live Status Pill Overlay */}
                      <div
                        className="position-absolute bottom-1 end-1 px-1.5 py-0.5 rounded-pill font-monospace fw-bold uppercase shadow-sm d-flex align-items-center gap-1"
                        style={{
                          backgroundColor: 'rgba(3, 7, 18, 0.88)',
                          color: svc.color,
                          fontSize: '0.50rem',
                          letterSpacing: '0.3px',
                          border: `1px solid ${svc.color}50`
                        }}
                      >
                        <span className="status-dot-pulse" style={{ width: '4px', height: '4px', backgroundColor: svc.color }}></span>
                        ● LIVE
                      </div>
                    </div>

                    {/* Bottom Half: Title & Dual Telemetry Metrics */}
                    <div className="px-2 py-1 d-flex flex-column justify-content-between flex-grow-1 text-start scada-card-bottom-info" style={{ background: 'var(--scada-card, rgba(15, 23, 42, 0.95))' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="fw-extrabold text-truncate scada-card-title me-1" style={{ fontSize: '0.64rem', color: 'var(--scada-text, #ffffff)' }}>
                          {svc.title}
                        </div>
                        <span className="text-secondary opacity-75" style={{ fontSize: '0.55rem' }}>➔</span>
                      </div>

                      {/* Dual Key Metrics Badges */}
                      <div className="d-flex align-items-center justify-content-between gap-1 mt-0.5">
                        <div className="px-1 py-0.5 rounded font-monospace text-truncate d-flex align-items-center gap-1 scada-mini-metric-pill w-100" style={{ background: 'rgba(3, 7, 18, 0.65)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.55rem' }}>
                          <span className="text-slate-400 opacity-80">{svc.metrics?.[0]?.label || 'State'}:</span>
                          <span className="fw-bold text-truncate ms-auto" style={{ color: svc.color }}>
                            {svc.metrics?.[0]?.val || svc.gaugeVal || 'ONLINE'}
                          </span>
                        </div>
                        {svc.metrics?.[1] && (
                          <div className="px-1 py-0.5 rounded font-monospace text-truncate d-flex align-items-center gap-1 scada-mini-metric-pill w-100" style={{ background: 'rgba(3, 7, 18, 0.65)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.55rem' }}>
                            <span className="text-slate-400 opacity-80">{svc.metrics[1].label}:</span>
                            <span className="fw-bold text-white text-truncate ms-auto scada-metric-val2">{svc.metrics[1].val}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* High-Tech Floating Popover Card on Hover */}
                    {isHovered && (
                      <div
                        className="position-absolute start-50 translate-middle-x scada-hover-popover p-2.5 rounded-3 shadow-2xl z-50 text-start pointer-events-none"
                        style={{
                          bottom: '112%',
                          width: '215px',
                          background: 'rgba(7, 14, 28, 0.96)',
                          border: `1.5px solid ${svc.color}`,
                          boxShadow: `0 0 35px ${svc.color}70, 0 10px 25px rgba(0,0,0,0.9)`,
                          backdropFilter: 'blur(16px)',
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1.5 pb-1 border-bottom border-secondary border-opacity-25">
                          <div className="d-flex align-items-center gap-1.5">
                            <div className="rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ backgroundColor: `${svc.color}25`, color: svc.color }}>
                              {svc.icon}
                            </div>
                            <span className="fw-extrabold font-monospace text-white text-truncate" style={{ fontSize: '0.72rem' }}>
                              {svc.title}
                            </span>
                          </div>
                          <Badge bg="success" className="px-1.5 py-0.5 rounded-pill font-monospace" style={{ fontSize: '0.52rem' }}>
                            ● LIVE
                          </Badge>
                        </div>

                        {/* All 3 Live Telemetry Parameters */}
                        <div className="d-flex flex-column gap-1 mb-2">
                          {svc.metrics?.map((m, mIdx) => (
                            <div key={mIdx} className="d-flex justify-content-between align-items-center px-2 py-1 rounded bg-slate-900/70" style={{ fontSize: '0.60rem' }}>
                              <span className="text-slate-400 d-flex align-items-center gap-1">
                                {m.icon}
                                {m.label}
                              </span>
                              <span className="font-monospace fw-bold text-white ms-2">{m.val}</span>
                            </div>
                          ))}
                        </div>

                        {/* Progress / Gauge Indicator Bar */}
                        {svc.gaugePercent && (
                          <div className="w-100 mb-1.5">
                            <div className="d-flex justify-content-between font-monospace text-slate-400 mb-0.5" style={{ fontSize: '0.54rem' }}>
                              <span>{svc.gaugeLabel || 'Efficiency'}</span>
                              <span style={{ color: svc.color }}>{svc.gaugeVal || `${svc.gaugePercent}%`}</span>
                            </div>
                            <div className="w-100 rounded-pill overflow-hidden" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.12)' }}>
                              <div className="h-100 rounded-pill" style={{ width: `${svc.gaugePercent}%`, backgroundColor: svc.color, boxShadow: `0 0 8px ${svc.color}` }} />
                            </div>
                          </div>
                        )}

                        <div className="text-center font-monospace fw-bold text-cyan-400 pt-0.5" style={{ fontSize: '0.58rem' }}>
                          Click to Launch UI ➔
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center font-monospace text-slate-400 mt-1" style={{ fontSize: '0.68rem' }}>
        ★ GPU-Accelerated SCADA Core — Click any card to inspect system telemetry
      </div>

      {/* ── SYSTEM INFORMATION DETAIL MODAL OVERLAY ── */}
      {selectedSvcModal && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3 scada-modal-overlay"
          style={{
            backgroundColor: 'rgba(3, 7, 18, 0.82)',
            backdropFilter: 'blur(12px)',
            zIndex: 99999
          }}
          onClick={() => setSelectedSvcModal(null)}
        >
          <div
            className="scada-system-modal-card rounded-4 border overflow-hidden shadow-2xl position-relative w-100"
            style={{
              maxWidth: '820px',
              backgroundColor: 'var(--scada-card, #0f172a)',
              borderColor: selectedSvcModal.color || '#38bdf8',
              boxShadow: `0 20px 50px rgba(0,0,0,0.85), 0 0 35px ${selectedSvcModal.color}45`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom"
              style={{
                background: `linear-gradient(90deg, ${selectedSvcModal.color}25 0%, rgba(15, 23, 42, 0.7) 100%)`,
                borderColor: 'var(--scada-border, rgba(255,255,255,0.12))'
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-sm"
                  style={{
                    backgroundColor: `${selectedSvcModal.color}25`,
                    color: selectedSvcModal.color,
                    border: `1.5px solid ${selectedSvcModal.color}60`
                  }}
                >
                  {selectedSvcModal.icon}
                </div>
                <div className="text-start">
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="fw-black mb-0 font-monospace text-truncate" style={{ color: 'var(--scada-text, #ffffff)' }}>
                      {selectedSvcModal.title}
                    </h5>
                    <Badge
                      className="rounded-pill px-2.5 py-1 font-monospace"
                      style={{
                        backgroundColor: `${selectedSvcModal.color}25`,
                        color: selectedSvcModal.color,
                        border: `1px solid ${selectedSvcModal.color}50`
                      }}
                    >
                      ● LIVE SCADA INSPECTOR
                    </Badge>
                  </div>
                  <div className="text-secondary font-monospace" style={{ fontSize: '0.72rem' }}>
                    SYSTEM ID: {selectedSvcModal.key?.toUpperCase()} • SCADA NODE #{services.findIndex(s => s.key === selectedSvcModal.key) + 1}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedSvcModal(null)}
                className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-0 text-white"
                style={{ width: '34px', height: '34px', fontSize: '1.1rem', backgroundColor: 'rgba(255,255,255,0.08)' }}
                title="Close System Inspector"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 130px)' }}>
              <Row className="g-4 text-start">
                {/* Left Column: Visual SCADA Equipment Banner & Submodules */}
                <Col lg={5} md={12}>
                  <div
                    className="rounded-3 overflow-hidden position-relative border shadow-sm mb-3"
                    style={{
                      height: '210px',
                      backgroundColor: '#030712',
                      borderColor: `${selectedSvcModal.color}40`
                    }}
                  >
                    {selectedSvcModal.isSmartMeter ? (
                      <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 text-center" style={{ background: 'linear-gradient(135deg, #030814 0%, #0c182e 100%)' }}>
                        <Zap size={40} className="text-amber-400 mb-2 orbital-core-pulse" />
                        <div className="fw-black font-monospace text-emerald-400" style={{ fontSize: '1.15rem' }}>
                          SOCHIOT APM METER
                        </div>
                        <div className="text-amber-300 font-monospace fw-bold" style={{ fontSize: '1.3rem' }}>
                          {selectedSvcModal.gaugeVal} kWh
                        </div>
                        <small className="text-slate-400 font-monospace mt-1">Real-time Power & Energy Counter</small>
                      </div>
                    ) : (
                      <img
                        src={selectedSvcModal.image || '/cooling_tower.png'}
                        alt={selectedSvcModal.title}
                        className="w-100 h-100 object-fit-cover"
                      />
                    )}

                    {/* Status Badge Tag */}
                    <div
                      className="position-absolute bottom-2 start-2 px-2.5 py-1 rounded-pill font-monospace fw-bold shadow-sm d-flex align-items-center gap-1.5"
                      style={{
                        backgroundColor: 'rgba(3, 7, 18, 0.88)',
                        color: selectedSvcModal.color,
                        fontSize: '0.68rem',
                        border: `1px solid ${selectedSvcModal.color}60`
                      }}
                    >
                      <span className="status-dot-pulse" style={{ width: '6px', height: '6px', backgroundColor: selectedSvcModal.color }} />
                      STATUS: {selectedSvcModal.status || 'OPERATIONAL'}
                    </div>
                  </div>

                  {/* Quick Module Views Navigation Buttons */}
                  {selectedSvcModal.submenus && selectedSvcModal.submenus.length > 0 && (
                    <div>
                      <label className="form-label font-monospace text-uppercase text-secondary fw-bold mb-2" style={{ fontSize: '0.70rem' }}>
                        Sub-Module Views
                      </label>
                      <div className="d-flex flex-wrap gap-1.5">
                        {selectedSvcModal.submenus.map((sub, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => {
                              setSelectedSvcModal(null);
                              navigate(sub.route);
                            }}
                            className="btn btn-sm btn-outline-secondary rounded-pill font-monospace d-flex align-items-center gap-1 py-1 px-2.5"
                            style={{ fontSize: '0.70rem' }}
                          >
                            <span>{sub.name}</span>
                            <ArrowUpRight size={11} className="opacity-75" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </Col>

                {/* Right Column: Live Telemetry Parameters & Efficiency Gauge */}
                <Col lg={7} md={12}>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="font-monospace text-uppercase text-secondary fw-bold" style={{ fontSize: '0.70rem' }}>
                        Live System Telemetry
                      </span>
                      <span className="badge bg-slate-800 text-cyan-400 font-monospace" style={{ fontSize: '0.66rem' }}>
                        REFRESH RATE: 1.2s
                      </span>
                    </div>

                    {/* Metrics Grid */}
                    <div className="row g-2 mb-3">
                      {selectedSvcModal.metrics?.map((m, mIdx) => {
                        const tileStyle = getMetricTileStyle(m, selectedSvcModal.color);
                        return (
                          <div key={mIdx} className="col-6">
                            <div
                              className="p-2.5 rounded-3 text-start d-flex align-items-center gap-2.5 position-relative overflow-hidden metric-scada-tile"
                              style={{
                                background: tileStyle.bg,
                                border: tileStyle.border,
                                boxShadow: tileStyle.shadow,
                                backdropFilter: 'blur(8px)',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                setSelectedSvcModal(null);
                                navigate(selectedSvcModal.route);
                              }}
                            >
                              <div className="p-2 rounded-2 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ backgroundColor: tileStyle.badgeBg, color: tileStyle.text }}>
                                {m.icon}
                              </div>
                              <div className="text-truncate flex-grow-1">
                                <div className="text-slate-300 font-monospace text-uppercase text-truncate" style={{ fontSize: '0.62rem' }}>
                                  {m.label}
                                </div>
                                <div className="fw-black font-monospace text-truncate" style={{ fontSize: '0.94rem', color: tileStyle.text, textShadow: `0 0 8px ${tileStyle.dotColor}40` }}>
                                  {m.val}
                                </div>
                              </div>
                              <div
                                className="rounded-circle status-dot-pulse ms-auto flex-shrink-0"
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  backgroundColor: tileStyle.dotColor,
                                  boxShadow: `0 0 10px ${tileStyle.dotColor}`
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Extra Diagnostic Parameters */}
                      <div className="col-6">
                        <div
                          className="p-2.5 rounded-3 border text-start d-flex align-items-center gap-2.5"
                          style={{
                            backgroundColor: 'var(--scada-card-hover, rgba(30, 41, 59, 0.5))',
                            borderColor: 'var(--scada-border, rgba(255,255,255,0.08))'
                          }}
                        >
                          <div className="p-2 rounded-2 text-emerald-400 flex-shrink-0" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                            <Activity size={14} />
                          </div>
                          <div className="text-truncate">
                            <div className="text-secondary font-monospace text-uppercase text-truncate" style={{ fontSize: '0.62rem' }}>
                              Health Index
                            </div>
                            <div className="fw-black font-monospace text-emerald-400 text-truncate" style={{ fontSize: '0.90rem' }}>
                              99.4% PERFECT
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-6">
                        <div
                          className="p-2.5 rounded-3 border text-start d-flex align-items-center gap-2.5"
                          style={{
                            backgroundColor: 'var(--scada-card-hover, rgba(30, 41, 59, 0.5))',
                            borderColor: 'var(--scada-border, rgba(255,255,255,0.08))'
                          }}
                        >
                          <div className="p-2 rounded-2 text-purple-400 flex-shrink-0" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
                            <ShieldCheck size={14} />
                          </div>
                          <div className="text-truncate">
                            <div className="text-secondary font-monospace text-uppercase text-truncate" style={{ fontSize: '0.62rem' }}>
                              PLC Protocol
                            </div>
                            <div className="fw-black font-monospace text-purple-300 text-truncate" style={{ fontSize: '0.90rem' }}>
                              MODBUS RTU / TCP
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress / Gauge Indicator */}
                    {selectedSvcModal.gaugePercent && (
                      <div
                        className="p-3 rounded-3 border"
                        style={{
                          backgroundColor: 'var(--scada-card-hover, rgba(30, 41, 59, 0.4))',
                          borderColor: `${selectedSvcModal.color}30`
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center font-monospace mb-1.5">
                          <span className="text-secondary fw-bold" style={{ fontSize: '0.72rem' }}>
                            {selectedSvcModal.gaugeLabel || 'Efficiency Loading Factor'}
                          </span>
                          <span className="fw-bold" style={{ color: selectedSvcModal.color, fontSize: '0.84rem' }}>
                            {selectedSvcModal.gaugeVal || `${selectedSvcModal.gaugePercent}%`} ({selectedSvcModal.gaugePercent}%)
                          </span>
                        </div>
                        <div className="w-100 rounded-pill overflow-hidden" style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                          <div
                            className="h-100 rounded-pill"
                            style={{
                              width: `${selectedSvcModal.gaugePercent}%`,
                              backgroundColor: selectedSvcModal.color,
                              boxShadow: `0 0 12px ${selectedSvcModal.color}`,
                              transition: 'width 0.8s ease'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Modal Action Footer */}
            <div
              className="px-4 py-3 border-top d-flex justify-content-between align-items-center"
              style={{
                backgroundColor: 'rgba(3, 7, 18, 0.4)',
                borderColor: 'var(--scada-border, rgba(255,255,255,0.12))'
              }}
            >
              <button
                onClick={() => setSelectedSvcModal(null)}
                className="btn btn-sm btn-outline-secondary rounded-pill px-4 font-monospace fw-bold"
              >
                Close Detail View
              </button>

              <button
                onClick={() => {
                  setSelectedSvcModal(null);
                  navigate(selectedSvcModal.route);
                }}
                className="btn btn-sm rounded-pill px-4 font-monospace fw-bold d-flex align-items-center gap-2 shadow"
                style={{
                  backgroundColor: selectedSvcModal.color,
                  color: '#000000',
                  border: 'none'
                }}
              >
                <span>Launch Full Module Page</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const isLightMode = document.body.classList.contains('light-mode');

  // ── ACTIVE ROLE & PERMISSIONS ────────────────────────────────────────────
  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('simulated_active_role') || 'SUPER_ADMIN';
  });

  // ── HIERARCHICAL STATES FROM LOCALSTORAGE ────────────────────────────────
  const [organizations, setOrganizations] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_organizations');
      return saved ? JSON.parse(saved) : [{ id: 'org-1', name: 'Tata Industrial Corp', code: 'TATA_IND' }];
    } catch { return []; }
  });

  const [hierarchyZones, setHierarchyZones] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_hierarchy_zones');
      return saved ? JSON.parse(saved) : [{ id: 'hzn-1', name: 'North Power Zone', orgId: 'org-1' }];
    } catch { return []; }
  });

  const [subscription, setSubscription] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_subscription_config');
      return saved ? JSON.parse(saved) : { planTier: 'ENTERPRISE', maxDevices: 100, status: 'ACTIVE' };
    } catch { return { planTier: 'ENTERPRISE', maxDevices: 100, status: 'ACTIVE' }; }
  });

  // ── FILTER STATES FOR HIERARCHY ─────────────────────────────────────────
  const [selectedOrgId, setSelectedOrgId] = useState('ALL');
  const [selectedHzoneId, setSelectedHzoneId] = useState('ALL');

  // ── CORE DESIGN SELECTOR (PERSISTED IN LOCALSTORAGE) ────────────────────
  const [coreDesign, setCoreDesign] = useState(() => {
    return localStorage.getItem('scada_core_design') || 'cyber';
  });
  const handleDesignChange = useCallback((designId) => {
    setCoreDesign(designId);
    localStorage.setItem('scada_core_design', designId);
  }, []);

  // ── LIVE AUTO-UPDATING SMART METER TELEMETRY & AUTO-CYCLE ────────────────
  const [meterPageIndex, setMeterPageIndex] = useState(1); // 0: Voltage, 1: Current, 2: Power, 3: Energy
  const [calBlink, setCalBlink] = useState(false);
  const [liveMeter, setLiveMeter] = useState({
    ia: 415.2,
    ib: 412.8,
    ic: 418.0,
    kw: 320.5,
    vab: 415.0,
    vbc: 414.8,
    vca: 415.2,
    pf: 0.98,
    kwh: 1245.8,
    freq: 50.0
  });

  // Clock & Auto-cycling timers
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Auto-cycle pages every 3.5 seconds
    const pageTimer = setInterval(() => {
      setMeterPageIndex(prev => (prev + 1) % 4);
    }, 3500);

    // Pulse telemetry values & CAL LED every 1.2 seconds
    const telemetryTimer = setInterval(() => {
      setCalBlink(prev => !prev);
      setLiveMeter(prev => ({
        ...prev,
        ia: +(415.0 + (Math.random() * 2.4 - 1.2)).toFixed(1),
        ib: +(412.5 + (Math.random() * 2.0 - 1.0)).toFixed(1),
        ic: +(418.0 + (Math.random() * 2.2 - 1.1)).toFixed(1),
        kw: +(320.0 + (Math.random() * 3.0 - 1.5)).toFixed(1),
        vab: +(415.0 + (Math.random() * 1.0 - 0.5)).toFixed(1),
        vbc: +(414.8 + (Math.random() * 1.0 - 0.5)).toFixed(1),
        vca: +(415.2 + (Math.random() * 1.0 - 0.5)).toFixed(1),
        kwh: +(prev.kwh + 0.1).toFixed(1)
      }));
    }, 1200);

    return () => {
      clearInterval(timer);
      clearInterval(pageTimer);
      clearInterval(telemetryTimer);
    };
  }, []);

  const mfmPages = useMemo(() => [
    {
      title: "LINE VOLTAGES",
      pageNum: "P01",
      lines: [
        { label: "Vab", val: liveMeter.vab, unit: "V" },
        { label: "Vbc", val: liveMeter.vbc, unit: "V" },
        { label: "Vca", val: liveMeter.vca, unit: "V" },
        { label: "Freq", val: liveMeter.freq.toFixed(1), unit: "Hz", isKw: true }
      ]
    },
    {
      title: "PHASE CURRENTS & LOAD",
      pageNum: "P02",
      lines: [
        { label: "Ia", val: liveMeter.ia, unit: "A" },
        { label: "Ib", val: liveMeter.ib, unit: "A" },
        { label: "Ic", val: liveMeter.ic, unit: "A" },
        { label: "kW", val: liveMeter.kw, unit: "kW", isKw: true }
      ]
    },
    {
      title: "POWER & POWER FACTOR",
      pageNum: "P03",
      lines: [
        { label: "Active", val: liveMeter.kw, unit: "kW" },
        { label: "Apparent", val: (liveMeter.kw * 1.02).toFixed(1), unit: "kVA" },
        { label: "Reactive", val: (liveMeter.kw * 0.2).toFixed(1), unit: "kVAR" },
        { label: "PF", val: liveMeter.pf, unit: "", isKw: true }
      ]
    },
    {
      title: "TOTAL ENERGY COUNTER",
      pageNum: "P04",
      lines: [
        { label: "Active", val: liveMeter.kwh, unit: "kWh" },
        { label: "Apparent", val: (liveMeter.kwh * 1.02).toFixed(1), unit: "kVAh" },
        { label: "Today", val: (320.5).toFixed(1), unit: "kWh" },
        { label: "Status", val: "NORMAL", unit: "", isKw: true }
      ]
    }
  ], [liveMeter]);

  const activeMfmPage = mfmPages[meterPageIndex];

  // Filtered Zones based on Org selection
  const filteredZones = useMemo(() => {
    if (selectedOrgId === 'ALL') return hierarchyZones;
    return hierarchyZones.filter(z => z.orgId === selectedOrgId);
  }, [hierarchyZones, selectedOrgId]);

  // ── TOP SUMMARY KPIS STRIP (MATCHING REFERENCE MOCKUP HEADER) ───────────
  const summaryKPIs = [
    { label: 'Total Systems', val: '18', icon: <LayoutDashboard size={18} />, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
    { label: 'Online', val: '16', icon: <RadioReceiver size={18} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    { label: 'Alarms', val: '2', icon: <AlertTriangle size={18} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
    { label: 'Maintenance', val: '0', icon: <Wrench size={18} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    { label: 'System Uptime', val: '98.6%', icon: <TrendingUp size={18} />, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
    { label: 'Current Consumption', val: '420 kW', icon: <Leaf size={18} />, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  ];

  // ── ALL SCADA SERVICES ──────────────────────────────────────────
  const servicesList = [
    {
      key: 'energy',
      title: 'Energy Monitoring',
      icon: <Zap size={18} />,
      color: '#eab308',
      status: 'Online',
      isSmartMeter: true,
      route: '/energy-metering/main',
      gaugeVal: '1,245',
      gaugeLabel: 'kWh Today',
      gaugePercent: 74,
      submenus: [
        { name: 'Main Meter', route: '/energy-metering/main' },
        { name: 'Overview', route: '/energy-metering/overview' },
        { name: 'Sub Meters', route: '/energy-metering/sub' },
        { name: 'Graphs', route: '/energy-metering/graphs' },
        { name: 'PDF Report', route: '/energy-metering/report' },
      ],
      metrics: [
        { label: 'Total Cons.', val: '1,245 kWh', icon: <Zap size={13} />, status: 'green' },
        { label: 'Today', val: '320 kWh', icon: <BarChart3 size={13} />, status: 'yellow' },
        { label: 'Cost', val: '₹ 1,980', icon: <CreditCard size={13} />, status: 'green' },
        { label: 'P. Factor', val: '0.98 PF', icon: <Activity size={13} />, status: 'cyan' }
      ]
    },
    {
      key: 'coolingTower',
      title: 'Cooling Tower System',
      icon: <Wind size={18} />,
      color: '#06b6d4',
      status: 'ON (48Hz)',
      image: '/cooling_tower.png',
      route: '/hvac/cooling-tower',
      gaugeVal: '28.0°C',
      gaugeLabel: 'Return Temp',
      gaugePercent: 78,
      hasFanAnimation: true,
      isCoolingTower: true,
      submenus: [
        { name: 'Cooling Tower', route: '/hvac/cooling-tower' },
        { name: 'Fan & VFD', route: '/hvac/cooling-tower' },
        { name: 'Chiller Link', route: '/hvac/chiller' },
        { name: 'PDF Report', route: '/hvac/report' },
      ],
      metrics: [
        { label: 'Fan Status', val: 'ON (48Hz)', icon: <Fan size={13} />, status: 'green' },
        { label: 'Return Temp', val: '28.0 °C', icon: <Thermometer size={13} />, status: 'green' },
        { label: 'Supply Temp', val: '22.5 °C', icon: <ThermometerSun size={13} />, status: 'cyan' },
        { label: 'Water Flow', val: '450 LPM', icon: <Droplets size={13} />, status: 'cyan' }
      ]
    },
    {
      key: 'dgSet',
      title: 'DG Power System',
      icon: <Zap size={18} />,
      color: '#f59e0b',
      status: 'Online',
      image: '/dg_set.png',
      route: '/dg-set/overview',
      gaugeVal: '320 kW',
      gaugeLabel: 'Load',
      gaugePercent: 68,
      submenus: [
        { name: 'Overview', route: '/dg-set/overview' },
        { name: 'DG Set-1', route: '/dg-set/dg1' },
        { name: 'DG Set-2', route: '/dg-set/dg2' },
        { name: 'DG Set-3', route: '/dg-set/dg3' },
      ],
      metrics: [
        { label: 'DG-1 Status', val: 'ON (Auto)', icon: <Power size={13} />, status: 'green' },
        { label: 'Active Load', val: '320 kW', icon: <BarChart3 size={13} />, status: 'yellow' },
        { label: 'Fuel Level', val: '78%', icon: <Zap size={13} />, status: 'green' },
        { label: 'Frequency', val: '50.1 Hz', icon: <Activity size={13} />, status: 'cyan' }
      ]
    },
    {
      key: 'motors',
      title: 'Motors & Pumps',
      icon: <Activity size={18} />,
      color: '#38bdf8',
      status: 'Online',
      image: '/images/motor_pump_scada.png',
      route: '/motors/overview',
      gaugeVal: '3',
      gaugeLabel: 'Running',
      gaugePercent: 75,
      submenus: [
        { name: 'Overview', route: '/motors/overview' },
        { name: 'Pump Room 1', route: '/motors/room1' },
        { name: 'Pump Room 2', route: '/motors/room2' },
        { name: 'VFD / DOL Status', route: '/motors/status' },
        { name: 'PDF Report', route: '/motors/report' },
      ],
      metrics: [
        { label: 'Pumps Run', val: '3 / 4', icon: <CheckCircle2 size={13} />, status: 'green' },
        { label: 'Pressure', val: '4.2 bar', icon: <Gauge size={13} />, status: 'cyan' },
        { label: 'Power Draw', val: '45 kW', icon: <Zap size={13} />, status: 'yellow' },
        { label: 'Fault Status', val: '0 Faults', icon: <AlertCircle size={13} />, status: 'green' }
      ]
    },
    {
      key: 'hvac',
      title: 'Chiller Plant System',
      icon: <Thermometer size={18} />,
      color: '#38bdf8',
      status: 'ON (Active)',
      image: '/chiller.png',
      route: '/hvac/chiller',
      gaugeVal: '6.5°C',
      gaugeLabel: 'Chilled Water',
      gaugePercent: 85,
      hasFanAnimation: true,
      submenus: [
        { name: 'Chiller', route: '/hvac/chiller' },
        { name: 'Cooling Tower', route: '/hvac/cooling-tower' },
        { name: 'AHU', route: '/hvac/ahu' },
        { name: 'PDF Report', route: '/hvac/report' },
      ],
      metrics: [
        { label: 'Chiller Unit', val: '2/2 ON', icon: <Fan size={13} />, status: 'green' },
        { label: 'CHW Temp', val: '6.5 °C', icon: <Thermometer size={13} />, status: 'green' },
        { label: 'COP Rating', val: '5.8 COP', icon: <TrendingUp size={13} />, status: 'green' },
        { label: 'Plant Load', val: '486 kW', icon: <BarChart3 size={13} />, status: 'yellow' }
      ]
    },
    {
      key: 'ahu',
      title: 'AHU System (Air Handling)',
      icon: <Wind size={18} />,
      color: '#38bdf8',
      status: 'ON (12.5k CFM)',
      image: '/ahu_v3.png',
      route: '/hvac/ahu',
      gaugeVal: '16.0°C',
      gaugeLabel: 'Supply Air',
      gaugePercent: 72,
      hasFanAnimation: true,
      submenus: [
        { name: 'AHU System', route: '/hvac/ahu' },
        { name: 'Filter Status', route: '/hvac/ahu' },
        { name: 'VFD Drive', route: '/hvac/ahu' },
        { name: 'PDF Report', route: '/hvac/report' },
      ],
      metrics: [
        { label: 'Supply Air', val: '16.0 °C', icon: <Thermometer size={13} />, status: 'green' },
        { label: 'Return Air', val: '24.2 °C', icon: <ThermometerSun size={13} />, status: 'yellow' },
        { label: 'Airflow', val: '12.5k CFM', icon: <Wind size={13} />, status: 'cyan' },
        { label: 'Duct Press.', val: '240 Pa', icon: <Gauge size={13} />, status: 'cyan' }
      ]
    },
    {
      key: 'water',
      title: 'Water Management',
      icon: <Droplets size={18} />,
      color: '#06b6d4',
      status: 'Online',
      image: '/images/water_management_card.png',
      route: '/water-management/overview',
      gaugeVal: '72%',
      gaugeLabel: 'Tank Level',
      gaugePercent: 72,
      submenus: [
        { name: 'Overview', route: '/water-management/overview' },
        { name: 'AG Tank', route: '/water-management/ag-pump' },
        { name: 'UG Tank', route: '/water-management/ug-pump' },
      ],
      metrics: [
        { label: 'UG Tank', val: '72%', icon: <Droplets size={13} />, status: 'green' },
        { label: 'OHT Tank', val: '64%', icon: <Droplets size={13} />, status: 'yellow' },
        { label: 'Flow Rate', val: '12.5 m³/h', icon: <RefreshCw size={13} />, status: 'cyan' },
        { label: 'Booster', val: 'ON', icon: <Power size={13} />, status: 'green' }
      ]
    },
    {
      key: 'transformer',
      title: 'Transformer Unit',
      icon: <Cpu size={18} />,
      color: '#a855f7',
      status: 'Online',
      image: '/images/transformer_scada.png',
      route: '/transformer/overview',
      gaugeVal: '78%',
      gaugeLabel: 'Load',
      gaugePercent: 78,
      submenus: [
        { name: 'Overview', route: '/transformer/overview' },
        { name: 'Transformer-1', route: '/transformer/t1' },
        { name: 'Transformer-2', route: '/transformer/t2' },
        { name: 'Load / Temp', route: '/transformer/load' },
        { name: 'PDF Report', route: '/transformer/report' },
      ],
      metrics: [
        { label: 'Primary', val: '11.0 kV', icon: <Zap size={13} />, status: 'green' },
        { label: 'Active Load', val: '78%', icon: <BarChart3 size={13} />, status: 'yellow' },
        { label: 'Oil Temp', val: '42.5 °C', icon: <ThermometerSun size={13} />, status: 'yellow' },
        { label: 'Oil Level', val: '95%', icon: <CheckCircle2 size={13} />, status: 'green' }
      ]
    },
    {
      key: 'fire',
      title: 'Fire Safety System',
      icon: <ShieldAlert size={18} />,
      color: '#ef4444',
      status: 'Online',
      image: '/images/fire_pump_scada.png',
      route: '/fire-pumps/overview',
      gaugeVal: 'Normal',
      gaugeLabel: 'Status',
      gaugePercent: 95,
      submenus: [
        { name: 'Overview', route: '/fire-pumps/overview' },
        { name: 'Pump Status', route: '/fire-pumps/status' },
        { name: 'Header Pressure', route: '/fire-pumps/pressure' },
        { name: 'Jockey / Main', route: '/fire-pumps/jockey' },
        { name: 'PDF Report', route: '/fire-pumps/report' },
      ],
      metrics: [
        { label: 'Fire Pump', val: 'AUTO', icon: <Flame size={13} />, status: 'green' },
        { label: 'Jockey Pump', val: 'ON', icon: <Activity size={13} />, status: 'green' },
        { label: 'Pressure', val: '8.5 bar', icon: <Gauge size={13} />, status: 'cyan' },
        { label: 'Panel Alarms', val: '0 Alarms', icon: <ShieldCheck size={13} />, status: 'green' }
      ]
    },
    {
      key: 'ltPanel',
      title: 'LT Panel System',
      icon: <LayoutDashboard size={18} />,
      color: '#10b981',
      status: 'Online',
      image: '/images/lt_panel_card.jpg',
      route: '/lt-panel/overview',
      gaugeVal: '320 kW',
      gaugeLabel: 'Load',
      gaugePercent: 70,
      submenus: [
        { name: 'Overview', route: '/lt-panel/overview' },
        { name: 'LT Room-1', route: '/lt-panel/room1' },
        { name: 'LT Room-2', route: '/lt-panel/room2' },
        { name: 'LT Room-3', route: '/lt-panel/room3' },
        { name: 'Incoming / Outgoing', route: '/lt-panel/io' },
        { name: 'Breaker Status', route: '/lt-panel/breaker' },
        { name: 'PDF Report', route: '/lt-panel/report' },
      ],
      metrics: [
        { label: 'Incomer ACB', val: 'CLOSED', icon: <Power size={13} />, status: 'green' },
        { label: 'Total Load', val: '320 kW', icon: <BarChart3 size={13} />, status: 'yellow' },
        { label: 'Power Factor', val: '0.96 PF', icon: <Zap size={13} />, status: 'green' },
        { label: 'Busbar Temp', val: '38.5 °C', icon: <Thermometer size={13} />, status: 'green' }
      ]
    },
    {
      key: 'vrv',
      title: 'VRV Air System',
      icon: <Wind size={18} />,
      color: '#14b8a6',
      status: 'Online',
      image: '/images/vrv_air_scada.png',
      route: '/VRV/overview',
      gaugeVal: '22°C',
      gaugeLabel: 'Room Temp',
      gaugePercent: 65,
      submenus: [
        { name: 'Overview', route: '/VRV/overview' },
      ],
      metrics: [
        { label: 'Room Temp', val: '22.0 °C', icon: <Thermometer size={13} />, status: 'green' },
        { label: 'CHW Temp', val: '6.5 °C', icon: <Snowflake size={13} />, status: 'green' },
        { label: 'RHW Temp', val: '11.8 °C', icon: <ThermometerSun size={13} />, status: 'yellow' },
        { label: 'Coolant Flow', val: '85 m³/h', icon: <Wind size={13} />, status: 'cyan' }
      ]
    },
    {
      key: 'aqi',
      title: 'Environment & AQI',
      icon: <Gauge size={18} />,
      color: '#22c55e',
      status: 'Online',
      image: '/images/aqi_sensor_scada.png',
      route: '/aqi-sensor/overview',
      gaugeVal: 'Good',
      gaugeLabel: 'Air Quality',
      gaugePercent: 90,
      submenus: [
        { name: 'Overview', route: '/aqi-sensor/overview' },
        { name: 'Temp & Humidity', route: '/aqi-sensor/temp-humidity' },
        { name: 'PDF Report', route: '/aqi-sensor/report' },
      ],
      metrics: [
        { label: 'Air Quality', val: 'AQI 24', icon: <Gauge size={13} />, status: 'green' },
        { label: 'Temperature', val: '24.5 °C', icon: <Thermometer size={13} />, status: 'green' },
        { label: 'Humidity', val: '56%', icon: <Droplets size={13} />, status: 'yellow' },
        { label: 'CO₂ Level', val: '620 ppm', icon: <Leaf size={13} />, status: 'green' }
      ]
    },
    {
      key: 'dailyDPR',
      title: 'Battery Backup (UPS)',
      icon: <BatteryCharging size={18} />,
      color: '#06b6d4',
      status: 'Online',
      image: '/images/ups_battery_backup_scada.png',
      route: '/daily-dpr/overview',
      gaugeVal: '92%',
      gaugeLabel: 'Battery',
      gaugePercent: 92,
      submenus: [
        { name: 'Data Aggregation', route: '/daily-dpr/overview' },
        { name: 'Daily Logs', route: '/daily-dpr/overview' },
        { name: 'PDF Report', route: '/daily-dpr/overview' },
      ],
      metrics: [
        { label: 'UPS Load', val: '35%', icon: <BarChart3 size={13} />, status: 'green' },
        { label: 'Battery', val: '92%', icon: <BatteryCharging size={13} />, status: 'green' },
        { label: 'Runtime', val: '1h 45m', icon: <Clock size={13} />, status: 'cyan' },
        { label: 'Grid Input', val: '230 V', icon: <Zap size={13} />, status: 'green' }
      ]
    },
    {
      key: 'alarm',
      title: 'Alarm Sentinel',
      icon: <Bell size={18} />,
      color: '#ec4899',
      status: 'Online',
      image: '/images/alarm_system_scada.png',
      route: '/alarm-system/overview',
      gaugeVal: '2',
      gaugeLabel: 'Warnings',
      gaugePercent: 40,
      submenus: [
        { name: 'Overview', route: '/alarm-system/overview' },
        { name: 'Active Alarms', route: '/alarm-system/active' },
        { name: 'Inactive Alarms', route: '/alarm-system/inactive' },
        { name: 'ACK (Acknowledge)', route: '/alarm-system/ack' },
        { name: 'Alarm History', route: '/alarm-system/history' },
        { name: 'PDF Report', route: '/alarm-system/report' },
      ],
      metrics: [
        { label: 'Critical', val: '0 Active', icon: <AlertCircle size={13} />, status: 'green' },
        { label: 'Warnings', val: '2 Active', icon: <AlertTriangle size={13} />, status: 'yellow' },
        { label: 'Health', val: '99.8%', icon: <TrendingUp size={13} />, status: 'green' },
        { label: 'Monitoring', val: 'ACTIVE', icon: <CheckCircle2 size={13} />, status: 'cyan' }
      ]
    }
  ];

  const [modulesConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('scada_modules_config');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const visibleServices = useMemo(() => {
    const keyMap = {
      energy: 'Energy Metering',
      coolingTower: 'HVAC',
      dgSet: 'DG Set',
      motors: 'Motors',
      hvac: 'HVAC',
      ahu: 'HVAC',
      water: 'Water Management',
      transformer: 'Transformer',
      fire: 'Fire',
      ltPanel: 'LT Panel',
      vrv: 'VRV',
      aqi: 'AQI Sensor',
      dailyDPR: 'Daily DPR',
      alarm: 'Alarm System'
    };

    return servicesList.filter(svc => {
      const configKey = keyMap[svc.key];
      if (!configKey) return true;
      return modulesConfig[configKey] !== false;
    });
  }, [servicesList, modulesConfig]);

  return (
    <div className="reference-scada-dashboard p-3">


      {/* ── CORE DESIGN SELECTOR ─────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-end mb-2 px-1 gap-2">
        <span className="font-monospace fw-bold text-secondary" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
          <Sliders size={12} className="me-1" />CORE DESIGN:
        </span>
        <div className="d-flex gap-1.5">
          {CORE_DESIGNS.map(d => (
            <button
              key={d.id}
              onClick={() => handleDesignChange(d.id)}
              className={`btn btn-sm rounded-pill px-2.5 py-1 font-monospace fw-bold d-flex align-items-center gap-1 core-design-select ${coreDesign === d.id ? 'active' : ''}`}
              style={{
                fontSize: '0.64rem',
                backgroundColor: coreDesign === d.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: coreDesign === d.id ? '#38bdf8' : '#94a3b8',
                border: coreDesign === d.id ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s ease',
                boxShadow: coreDesign === d.id ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── FUTURISTIC ORBITAL SCADA RADAR CORE WHEEL ─────────────── */}
      <FuturisticOrbitalSCADA services={visibleServices} navigate={navigate} coreDesign={coreDesign} />

      {/* ── 3-COLUMN SCADA CARDS GRID ───── */}
      <Row className="g-3">
        {visibleServices.map((svc) => (
          <Col xl={4} lg={6} md={12} key={svc.key}>
            <Card
              onClick={() => navigate(svc.route)}
              className="reference-scada-card h-100 border-0 overflow-hidden cursor-pointer position-relative d-flex flex-column"
            >
              {/* Dedicated Solid Header Bar Above Image Banner */}
              <div className="card-header-bar px-3 py-2.5 d-flex justify-content-between align-items-center border-bottom">
                <div className="d-flex align-items-center gap-3 text-truncate">
                  <div
                    className="card-icon-badge flex-shrink-0"
                    style={{ color: svc.color }}
                  >
                    {svc.icon}
                  </div>
                  <h6 className="card-title-text mb-0 text-truncate tracking-wide">{svc.title}</h6>
                </div>

                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <span className="live-status-pill">
                    <span className="status-dot-pulse"></span>
                    {svc.status} &gt;
                  </span>
                </div>
              </div>

              {/* Full-Width Panoramic Equipment Photo Banner */}
              <div
                className="card-photo-banner position-relative overflow-hidden"
                style={{ borderColor: `${svc.color}35` }}
              >
                {svc.isSmartMeter ? (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center position-relative py-3 px-2" style={{ background: 'linear-gradient(135deg, #030814 0%, #0c182e 100%)' }}>
                    {/* Background Grid Accent */}
                    <div className="position-absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#eab308 1px, transparent 1px)', backgroundSize: '14px 14px' }} />

                    {/* SOCHIOT APM Series Digital Twin Smart Meter Display */}
                    <div className="mfm-polycarbonate-case shadow-2xl mx-auto" style={{ maxWidth: '280px', width: '100%', padding: '12px 10px', borderWidth: '6px', borderRadius: '20px' }}>
                      <div className="screw top-left"></div>
                      <div className="screw top-right"></div>
                      <div className="screw bottom-left"></div>
                      <div className="screw bottom-right"></div>

                      <div className="mfm-metallic-bezel" style={{ padding: '10px 8px' }}>
                        <div className="mfm-brand-header d-flex justify-content-between align-items-center mb-1.5 px-1">
                          <span className="mfm-brand-logo" style={{ fontSize: '1rem', letterSpacing: '2px' }}>SOCHIOT</span>
                          <span className="mfm-model-no" style={{ fontSize: '0.65rem' }}>APM Series</span>
                        </div>

                        <div className="mfm-lcd-window mb-1.5" style={{ padding: '5px', borderWidth: '3px' }}>
                          <div className="mfm-lcd-glass" style={{ padding: '4px' }}>
                            <div className="mfm-lcd-screen" style={{ height: '160px', padding: '6px 8px' }}>
                              <div className="mfm-lcd-top-bar d-flex justify-content-between px-1" style={{ fontSize: '0.68rem', marginBottom: '4px' }}>
                                <span className="text-truncate me-1">{activeMfmPage.title}</span>
                                <span className="mfm-lcd-page-num">{activeMfmPage.pageNum}</span>
                              </div>

                              <div className="mfm-lcd-grid d-flex flex-column gap-1 flex-grow-1 justify-content-center">
                                {activeMfmPage.lines.map((l, i) => (
                                  <div 
                                    key={i} 
                                    className={`mfm-lcd-row d-flex align-items-center justify-content-between px-1 font-monospace text-nowrap ${l.isKw ? 'text-amber-400 pt-1 border-top border-emerald-900/50' : ''}`} 
                                    style={{ fontSize: '0.78rem', flexWrap: 'nowrap', lineHeight: '1.2' }}
                                  >
                                    <span className={`mfm-lcd-label me-2 text-nowrap ${l.isKw ? 'text-amber-400' : 'text-emerald-400'}`} style={{ whiteSpace: 'nowrap' }}>{l.label}</span>
                                    <div className="text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                                      <span className={`mfm-lcd-value fw-black ${l.isKw ? 'text-amber-300' : 'text-emerald-300'}`} style={{ fontSize: '0.82rem' }}>{l.val}</span>
                                      {l.unit && <span className={`mfm-lcd-unit ms-1 ${l.isKw ? 'text-amber-400' : 'text-emerald-400'}`} style={{ fontSize: '0.62rem' }}>{l.unit}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="mfm-lcd-bottom-bar d-flex justify-content-between px-1 font-monospace mt-1 text-emerald-400 opacity-75" style={{ fontSize: '0.55rem' }}>
                                <span>&lt;Up</span>
                                <span>&gt;Down</span>
                                <span>^Menu</span>
                                <span>vEvnt</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mfm-bezel-bottom px-1">
                          <div className="d-flex justify-content-between align-items-center mb-1.5">
                            <div className="mfm-leds-rack d-flex gap-2.5 align-items-center">
                              <div className="mfm-led-group">
                                <div 
                                  className={`mfm-led-bulb bulb-red ${calBlink ? 'glow-active' : ''}`} 
                                  style={{ width: '9px', height: '9px', boxShadow: calBlink ? '0 0 8px #ef4444' : 'none' }}
                                ></div>
                                <span className="mfm-led-label font-monospace" style={{ fontSize: '0.6rem' }}>CAL</span>
                              </div>
                              <div className="mfm-led-group">
                                <div className="mfm-led-bulb bulb-green glow-active" style={{ width: '9px', height: '9px', boxShadow: '0 0 8px #22c55e' }}></div>
                                <span className="mfm-led-label font-monospace" style={{ fontSize: '0.6rem' }}>COM</span>
                              </div>
                              <div className="mfm-led-group">
                                <div className="mfm-led-bulb bulb-orange" style={{ width: '9px', height: '9px' }}></div>
                                <span className="mfm-led-label font-monospace" style={{ fontSize: '0.6rem' }}>ALM</span>
                              </div>
                            </div>
                            <div className="mfm-spec-labels font-monospace text-secondary text-end" style={{ fontSize: '0.6rem' }}>
                              <div>Sr No: SOCH-8942</div>
                              <div>{liveMeter.freq.toFixed(1)}Hz · SOCHIOT</div>
                            </div>
                          </div>

                          <div className="mfm-button-deck d-flex justify-content-between gap-1.5 mt-2">
                            <button 
                              className="mfm-tactile-btn prev-btn" 
                              style={{ height: '26px', fontSize: '0.8rem' }}
                              onClick={(e) => { e.stopPropagation(); setMeterPageIndex(prev => (prev === 0 ? 3 : prev - 1)); }}
                              title="Previous LCD Page (<)"
                            >
                              &lt;
                            </button>
                            <button 
                              className="mfm-tactile-btn next-btn" 
                              style={{ height: '26px', fontSize: '0.8rem' }}
                              onClick={(e) => { e.stopPropagation(); setMeterPageIndex(prev => (prev + 1) % 4); }}
                              title="Next LCD Page (>)"
                            >
                              &gt;
                            </button>
                            <button 
                              className="mfm-tactile-btn menu-btn" 
                              style={{ height: '26px', fontSize: '0.8rem' }}
                              onClick={(e) => { e.stopPropagation(); setMeterPageIndex(0); }}
                              title="Voltage & Freq Page (⚙)"
                            >
                              ⚙
                            </button>
                            <button 
                              className="mfm-tactile-btn enter-btn" 
                              style={{ height: '26px', fontSize: '0.8rem' }}
                              onClick={(e) => { e.stopPropagation(); setMeterPageIndex(1); }}
                              title="Currents & Load Page (↵)"
                            >
                              ↵
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : svc.isCoolingTower ? (
                  <div className="position-relative w-100 h-100 d-flex align-items-center justify-content-center">
                    <div className="position-relative h-100" style={{ aspectRatio: '1/1' }}>
                      <img src={svc.image} alt={svc.title} className="w-100 h-100" style={{ objectFit: 'contain' }} />

                      {/* Animated Spinning Fan Overlay strictly locked onto the circular shroud ring */}
                      <div style={{
                        position: 'absolute',
                        top: '25.6%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotateX(58deg)',
                        width: '41%',
                        aspectRatio: '1/1',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        zIndex: 5,
                        pointerEvents: 'none'
                      }}>
                        <svg className="dashboard-fan-spin" viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                          <g stroke="#090d16" strokeWidth="1">
                            {[0, 60, 120, 180, 240, 300].map(angle => (
                              <g key={angle} transform={`rotate(${angle} 50 50)`}>
                                <path d="M 50 50 L 34 16 A 35 35 0 0 1 66 16 Z" fill="rgba(8, 12, 20, 0.96)" stroke="#1f2937" strokeWidth="0.8" />
                              </g>
                            ))}
                            <circle cx="50" cy="50" r="14" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                            <circle cx="50" cy="50" r="6" fill="#475569" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={svc.image} alt={svc.title} className="card-banner-img" />
                )}

                {/* Live Animated Fan Running Badge */}
                {svc.hasFanAnimation && (
                  <div className="position-absolute bottom-2 end-3 z-10 pointer-events-none d-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-slate-950/90 border border-cyan-400/60 backdrop-blur-md shadow-lg shadow-cyan-500/20">
                    <Fan size={14} className="text-cyan-300 dashboard-fan-spin" />
                    <span className="fs-10 fw-bold text-cyan-200 font-monospace tracking-wide">RUNNING (48Hz)</span>
                  </div>
                )}

                <div className="banner-bottom-fade position-absolute inset-0 pointer-events-none" />
              </div>

              {/* Interactive Sub-menu Navigation Pills Bar Under Image */}
              {svc.submenus && svc.submenus.length > 0 && (
                <div className="px-3 py-2 border-bottom card-submenu-bar d-flex align-items-center flex-wrap" style={{ gap: '6px', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                  {svc.submenus.map((sub, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(sub.route);
                      }}
                      className="submenu-chip-btn rounded-pill transition-all border d-inline-flex align-items-center cursor-pointer font-monospace"
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.6)',
                        borderColor: `${svc.color}50`,
                        color: '#e2e8f0',
                        fontSize: '0.67rem',
                        fontWeight: 600,
                        padding: '3px 10px',
                        lineHeight: 1.25,
                        margin: '2px 2px',
                        boxShadow: `0 0 6px ${svc.color}15`
                      }}
                    >
                      <span className="dot-indicator flex-shrink-0 status-dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: svc.color, marginRight: '6px' }}></span>
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Card Bottom Strip: Left 4 SCADA Telemetry Status Tiles in 2x2 Compact Grid + Right Circular Radial Gauge */}
              <Card.Body className="p-3 pt-2.5 d-flex align-items-center justify-content-between flex-grow-1">
                {/* Left: 4 Compact SCADA Status Tiles Grid */}
                <div className="flex-grow-1 row g-2 align-items-center me-2">
                  {svc.metrics.map((m, idx) => {
                    const tileStyle = getMetricTileStyle(m, svc.color, isLightMode);
                    return (
                      <div key={idx} className="col-6">
                        <div
                          className="px-2 py-1.5 rounded-2 transition-all d-flex align-items-center justify-content-between position-relative overflow-hidden metric-scada-tile"
                          style={{
                            background: tileStyle.bg,
                            border: tileStyle.border,
                            boxShadow: tileStyle.shadow,
                            backdropFilter: 'blur(8px)',
                            minHeight: '34px',
                            cursor: 'pointer'
                          }}
                          title={`${m.label}: ${m.val} (Click to open ${svc.title})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(svc.route);
                          }}
                        >
                          {/* Left: Icon & Label */}
                          <div className="d-flex align-items-center gap-1.5 text-truncate me-1" style={{ maxWidth: '62%' }}>
                            <span className="flex-shrink-0 d-inline-flex align-items-center justify-content-center" style={{ color: tileStyle.iconColor }}>
                              {m.icon}
                            </span>
                            <span className="metric-tile-label text-truncate uppercase fw-bold font-monospace" style={{ fontSize: '0.62rem', letterSpacing: '0.01em' }}>
                              {m.label}
                            </span>
                          </div>

                          {/* Right: Value & Pulsing Status LED */}
                          <div className="d-flex align-items-center gap-1 flex-shrink-0 ms-auto">
                            <span
                              className="metric-tile-value fw-black font-monospace text-truncate"
                              style={{
                                color: tileStyle.text,
                                fontSize: '0.78rem',
                                letterSpacing: '0.01em',
                                textShadow: isLightMode ? 'none' : `0 0 8px ${tileStyle.dotColor}40`
                              }}
                            >
                              {m.val}
                            </span>
                            <span
                              className="rounded-circle status-dot-pulse flex-shrink-0"
                              style={{
                                width: '5px',
                                height: '5px',
                                backgroundColor: tileStyle.dotColor,
                                boxShadow: isLightMode ? `0 0 3px ${tileStyle.dotColor}` : `0 0 6px ${tileStyle.dotColor}`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Circular Radial Gauge Dial */}
                <SCADARadialGauge
                  value={svc.gaugeVal}
                  label={svc.gaugeLabel}
                  color={svc.color}
                  percent={svc.gaugePercent}
                />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── HIGH-TECH INLINE STYLES (PREMIUM SCADA DESIGN) ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .metric-scada-tile {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .metric-scada-tile:hover {
          transform: translateY(-2.5px) scale(1.02) !important;
          filter: brightness(1.2) !important;
        }

        /* Metric Tile Text Defaults (Dark Mode) */
        .metric-tile-label {
          color: #cbd5e1;
        }
        .metric-tile-value {
          font-weight: 900 !important;
        }

        /* Metric Tile Light Mode Overrides */
        body.light-mode .metric-tile-label {
          color: #334155 !important;
          font-weight: 700 !important;
        }
        body.light-mode .metric-tile-value {
          text-shadow: none !important;
          font-weight: 900 !important;
        }
        body.light-mode .metric-scada-tile {
          backdrop-filter: none !important;
        }
        body.light-mode .metric-scada-tile:hover {
          filter: brightness(0.97) !important;
          transform: translateY(-2px) scale(1.01) !important;
        }

        /* Gauge Text Light Mode */
        body.light-mode .gauge-value-text {
          color: #0f172a !important;
          font-weight: 900 !important;
        }
        body.light-mode .gauge-label-text {
          color: #334155 !important;
          font-weight: 700 !important;
        }
        body.light-mode .gauge-track-circle {
          stroke: #cbd5e1 !important;
        }

        /* SCADA Core Text Dark Mode Defaults */
        .scada-core-title {
          color: #ffffff;
          text-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }
        .scada-core-status {
          color: #34d399;
        }
        .scada-core-load {
          color: #94a3b8;
        }

        /* Core Design Selector Buttons */
        .core-design-select {
          transition: all 0.2s ease !important;
          cursor: pointer !important;
          white-space: nowrap !important;
        }
        .core-design-select:hover {
          background-color: rgba(56, 189, 248, 0.12) !important;
          color: #38bdf8 !important;
          border-color: rgba(56, 189, 248, 0.35) !important;
        }
        body.light-mode .core-design-select {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #475569 !important;
        }
        body.light-mode .core-design-select.active {
          background-color: rgba(2, 132, 199, 0.12) !important;
          border-color: #0284c7 !important;
          color: #0284c7 !important;
          box-shadow: 0 0 10px rgba(2, 132, 199, 0.15) !important;
        }
        body.light-mode .core-design-select:hover {
          background-color: rgba(2, 132, 199, 0.08) !important;
          color: #0284c7 !important;
        }

        @keyframes dashboardSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes scadaOrbitalSpin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes scadaOrbitalCounterSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        .scada-orbital-ring-spinning {
          animation-name: scadaOrbitalSpin;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        .scada-node-upright-spinning {
          animation-name: scadaOrbitalCounterSpin;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        .scada-orbital-paused .scada-orbital-ring-spinning,
        .scada-orbital-paused .scada-node-upright-spinning {
          animation-play-state: paused !important;
        }

        @keyframes orbitalCorePulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.6)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 25px rgba(56, 189, 248, 0.95)); }
        }

        .orbital-core-pulse {
          animation: orbitalCorePulse 3s ease-in-out infinite;
        }

        .scada-radar-responsive-outer {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          overflow: hidden;
        }

        .orbital-stage-wrapper {
          width: 920px;
          height: 720px;
          transform-origin: center center;
          transition: transform 0.3s ease, margin 0.3s ease;
          flex-shrink: 0;
        }

        @media (max-width: 1599px) {
          .orbital-stage-wrapper {
            transform: scale(0.80);
            margin: -65px 0 !important;
          }
        }

        @media (max-width: 1399px) {
          .orbital-stage-wrapper {
            transform: scale(0.70);
            margin: -105px 0 !important;
          }
        }

        @media (max-width: 1199px) {
          .orbital-stage-wrapper {
            transform: scale(0.58);
            margin: -150px 0 !important;
          }
        }

        @media (max-width: 991px) {
          .orbital-stage-wrapper {
            transform: scale(0.46);
            margin: -195px 0 !important;
          }
        }

        @media (max-width: 767px) {
          .orbital-stage-wrapper {
            transform: scale(0.36);
            margin: -230px 0 !important;
          }
        }

        @media (max-width: 500px) {
          .orbital-stage-wrapper {
            transform: scale(0.28);
            margin: -260px 0 !important;
          }
        }

        .futuristic-orbital-container {
          background: linear-gradient(145deg, rgba(8, 15, 30, 0.95) 0%, rgba(2, 6, 16, 0.98) 100%);
          border: 1px solid rgba(56, 189, 248, 0.25);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(56, 189, 248, 0.05);
        }

        .scada-cinematic-bg-layer {
          opacity: 0.45;
          filter: brightness(0.9) contrast(1.1);
          mix-blend-mode: normal;
        }

        .scada-cinematic-overlay-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(6, 14, 30, 0.45) 0%, rgba(2, 6, 16, 0.78) 100%);
        }

        .scada-cinematic-banner-tag {
          background: rgba(12, 24, 48, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.4);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        }

        body.light-mode .futuristic-orbital-container {
          background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%) !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 12px 36px rgba(15, 23, 42, 0.10) !important;
        }

        body.light-mode .scada-cinematic-bg-layer {
          opacity: 0.65 !important;
          filter: brightness(0.92) contrast(1.18) saturate(1.15) !important;
          mix-blend-mode: multiply !important;
        }

        body.light-mode .scada-cinematic-overlay-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(248, 250, 252, 0.15) 0%, rgba(226, 232, 240, 0.60) 100%) !important;
        }

        body.light-mode .scada-cinematic-banner-tag {
          background: #ffffff !important;
          border: 1.5px solid #0284c7 !important;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.15) !important;
        }

        body.light-mode .scada-core-reactor-hub {
          background: radial-gradient(circle at 40% 35%, #ffffff 0%, #e8ecf2 100%) !important;
          border: 2px solid #0284c7 !important;
          box-shadow: 0 0 40px rgba(2, 132, 199, 0.3), 0 8px 24px rgba(15, 23, 42, 0.1), inset 0 0 20px rgba(2, 132, 199, 0.08) !important;
        }

        body.light-mode .scada-core-reactor-hub .text-white,
        body.light-mode .scada-core-title {
          color: #0f172a !important;
          text-shadow: none !important;
        }

        body.light-mode .scada-core-status {
          color: #059669 !important;
        }

        body.light-mode .scada-core-load {
          color: #475569 !important;
          font-weight: 600 !important;
        }

        body.light-mode .scada-core-reactor-hub .text-slate-400 {
          color: #334155 !important;
          font-weight: 700 !important;
        }

        body.light-mode .scada-core-outer-wrap svg circle,
        body.light-mode .scada-core-outer-wrap svg line {
          opacity: 0.9 !important;
        }

        body.light-mode .scada-core-outer-wrap .rounded-circle[style*="dashed"] {
          border-color: rgba(2, 132, 199, 0.35) !important;
        }

        body.light-mode .scada-core-outer-wrap .rounded-circle[style*="solid"] {
          border-color: rgba(2, 132, 199, 0.25) !important;
          box-shadow: 0 0 10px rgba(2, 132, 199, 0.1) !important;
        }

        /* Design Selector Dropdown in Light Mode */
        body.light-mode .core-design-select {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06) !important;
        }

        body.light-mode .scada-radar-ring-svg circle {
          stroke: #0284c7 !important;
          stroke-opacity: 0.75 !important;
          stroke-width: 2px !important;
          filter: drop-shadow(0 0 6px rgba(2, 132, 199, 0.3));
        }

        body.light-mode .futuristic-orbital-container .text-slate-400 {
          color: #334155 !important;
          font-weight: 600 !important;
        }

        body.light-mode .futuristic-orbital-container .btn-outline-secondary {
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
          background: #ffffff !important;
          font-weight: 700 !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05) !important;
        }

        body.light-mode .futuristic-orbital-container .btn-outline-info {
          border-color: #0284c7 !important;
          color: #0284c7 !important;
          background: #ffffff !important;
          font-weight: 700 !important;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.15) !important;
        }

        body.light-mode .scada-node-upright-spinning {
          background: #ffffff !important;
          border-width: 2px !important;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16), 0 0 15px rgba(2, 132, 199, 0.2) !important;
        }

        body.light-mode .scada-card-bottom-info {
          background: #ffffff !important;
        }

        body.light-mode .scada-card-title {
          color: #0f172a !important;
          font-weight: 800 !important;
        }

        body.light-mode .smart-meter-mini-banner {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
        }

        body.light-mode .smart-meter-text {
          color: #059669 !important;
        }

        body.light-mode .smart-meter-val {
          color: #d97706 !important;
        }

        body.light-mode .scada-mini-metric-pill {
          background: #f1f5f9 !important;
          border: 1px solid #cbd5e1 !important;
        }

        body.light-mode .scada-mini-metric-pill .text-slate-400 {
          color: #334155 !important;
          font-weight: 700 !important;
          opacity: 1 !important;
        }

        body.light-mode .scada-metric-val2 {
          color: #0f172a !important;
          font-weight: 800 !important;
        }

        body.light-mode .scada-hover-popover {
          background: rgba(255, 255, 255, 0.98) !important;
          border-color: #0284c7 !important;
          box-shadow: 0 12px 36px rgba(15, 23, 42, 0.22), 0 0 25px rgba(2, 132, 199, 0.3) !important;
        }

        body.light-mode .scada-hover-popover .text-white {
          color: #0f172a !important;
        }

        body.light-mode .scada-hover-popover .bg-slate-900\/70 {
          background: #f1f5f9 !important;
        }

        .orbital-bg-glow {
          background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 60%);
        }

        .orbital-node-item:hover {
          z-index: 100 !important;
        }

        .dashboard-fan-spin {
          animation: dashboardSpin 0.42s linear infinite;
          transform-origin: center center;
        }

        .reference-scada-dashboard {
          background: var(--scada-bg, #020612);
          min-height: 100vh;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--scada-text, #f8fafc);
        }

        body.light-mode .reference-scada-dashboard {
          background: var(--scada-bg, #f8fafc) !important;
          color: #0f172a !important;
        }

        .top-command-strip {
          background: linear-gradient(145deg, rgba(13, 22, 45, 0.95) 0%, rgba(2, 8, 22, 0.98) 100%);
          border: 1px solid rgba(0, 180, 255, 0.3);
          border-top: 2px solid #38bdf8;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.15);
        }

        .pulse-cyan-dot {
          width: 9px;
          height: 9px;
          background-color: #38bdf8;
          border-radius: 50%;
          box-shadow: 0 0 10px #38bdf8;
          animation: pulseGlow 1.8s infinite alternate;
        }

        @keyframes pulseGlow {
          0% { transform: scale(0.95); opacity: 0.7; box-shadow: 0 0 4px #38bdf8; }
          100% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 14px #38bdf8; }
        }

        .mini-select-cyber {
          background-color: rgba(10, 18, 38, 0.95) !important;
          border: 1px solid rgba(0, 180, 255, 0.4) !important;
          color: #ffffff !important;
          font-size: 0.80rem !important;
          border-radius: 6px !important;
          padding: 4px 28px 4px 10px !important;
          font-weight: 600;
        }

        .text-cyan-exact {
          color: #38bdf8 !important;
        }

        .top-kpi-card {
          transition: all 0.22s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
        }

        .top-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.6) !important;
        }

        .top-kpi-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* SCADA 3-Column Cards Matching Reference Mockup */
        .reference-scada-card {
          background: linear-gradient(150deg, rgba(11, 20, 42, 0.96) 0%, rgba(2, 7, 18, 0.98) 100%);
          border: 1px solid rgba(0, 180, 255, 0.32) !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65);
          transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          min-height: 440px;
        }

        body.light-mode .reference-scada-card {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 6px 20px -4px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04) !important;
        }

        body.light-mode .reference-scada-card:hover {
          box-shadow: 0 16px 36px -6px rgba(2, 132, 199, 0.16), 0 4px 12px rgba(0, 0, 0, 0.05) !important;
          border-color: #0284c7 !important;
        }

        .card-top-glow-bar {
          height: 3px;
          opacity: 0.85;
          box-shadow: 0 0 12px currentColor;
        }

        .reference-scada-card:hover {
          transform: translateY(-5px);
          border-color: rgba(56, 189, 248, 0.85) !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 180, 255, 0.35);
        }

        .card-header-bar {
          background-color: #0b1329;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 10px 14px !important;
          z-index: 5;
        }

        body.light-mode .card-header-bar {
          background-color: #ffffff !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }

        .card-title-text {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          font-weight: 700 !important;
          font-size: 0.90rem !important;
          letter-spacing: -0.01em !important;
          color: #f8fafc;
        }

        body.light-mode .card-title-text {
          color: #0f172a !important;
        }

        .card-icon-badge {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        body.light-mode .card-icon-badge {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07) !important;
        }

        .live-status-pill {
          padding: 3.5px 10px !important;
          font-size: 0.68rem !important;
          font-weight: 600 !important;
          border-radius: 9999px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 5px !important;
          letter-spacing: 0.01em !important;
          transition: all 0.2s ease !important;
          white-space: nowrap !important;
          background-color: rgba(6, 78, 59, 0.85);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.4);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        body.light-mode .live-status-pill {
          background-color: #f0fdf4 !important;
          color: #15803d !important;
          border: 1px solid #bbf7d0 !important;
          box-shadow: 0 1px 4px rgba(22, 163, 74, 0.12) !important;
        }

        .status-dot-pulse {
          width: 6px;
          height: 6px;
          background-color: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
          animation: pulseDot 1.5s infinite alternate;
        }

        body.light-mode .status-dot-pulse {
          background-color: #16a34a !important;
          box-shadow: 0 0 6px #16a34a !important;
        }

        @keyframes pulseDot {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        /* Panoramic Equipment Photo Banner */
        .card-photo-banner {
          width: 100%;
          height: 360px;
          background: radial-gradient(circle, rgba(10, 22, 46, 0.9) 0%, #01040d 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          position: relative;
        }

        body.light-mode .card-photo-banner {
          background: #f8fafc !important;
          border-bottom-color: #cbd5e1 !important;
        }

        .card-banner-img {
          width: 100%;
          height: 100%;
          object-fit: contain !important;
          object-position: center center;
          padding: 8px;
          display: block;
          filter: brightness(1.08) contrast(1.06) saturate(1.08);
          transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .reference-scada-card:hover .card-banner-img {
          transform: scale(1.03);
        }

        .banner-bottom-fade {
          background: linear-gradient(to bottom, transparent 80%, rgba(2, 7, 18, 0.35) 100%);
        }

        body.light-mode .banner-bottom-fade {
          background: linear-gradient(to bottom, transparent 80%, rgba(248, 250, 252, 0.4) 100%) !important;
        }

        /* Submenu Navigation Pills Bar */
        .card-submenu-bar {
          background-color: transparent;
          gap: 6px 8px !important;
          padding: 6px 12px !important;
        }

        body.light-mode .card-submenu-bar {
          background-color: #f8fafc !important;
          border-bottom-color: #e2e8f0 !important;
        }

        .submenu-chip-btn {
          font-size: 0.67rem !important;
          padding: 3px 8px !important;
          line-height: 1.25 !important;
          white-space: nowrap !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex !important;
          align-items: center !important;
          margin: 2px 2px !important;
        }

        body.light-mode .submenu-chip-btn {
          background: #ffffff !important;
          color: #334155 !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 6px !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
          font-weight: 600 !important;
        }

        body.light-mode .submenu-chip-btn:hover {
          background: #0284c7 !important;
          color: #ffffff !important;
          border-color: #0284c7 !important;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25) !important;
        }

        .submenu-chip-btn:hover {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.35) 0%, rgba(14, 165, 233, 0.55) 100%) !important;
          color: #ffffff !important;
          border-color: #38bdf8 !important;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.45);
          transform: translateY(-1.5px);
        }

        /* Metric Display Glass Boxes */
        .metric-box-glass {
          transition: all 0.22s ease;
          background: rgba(15, 23, 42, 0.85);
          border-radius: 8px !important;
          padding: 8px 6px !important;
          box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.4);
          text-align: center !important;
        }

        .metric-box-label {
          color: #cbd5e1 !important; /* Bright crisp light slate in Dark Mode */
          font-size: 0.62rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.02em !important;
        }

        .metric-box-val {
          color: #ffffff !important; /* Pure white in Dark Mode */
          font-size: 0.88rem !important;
          font-weight: 900 !important;
        }

        .gauge-label-text {
          color: #cbd5e1 !important; /* Bright crisp light slate in Dark Mode */
          font-weight: 700 !important;
          font-size: 0.60rem !important;
        }

        .gauge-value-text {
          color: #ffffff !important;
          font-weight: 900 !important;
        }

        body.light-mode .metric-box-glass {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
        }

        body.light-mode .metric-box-label {
          color: #334155 !important; /* Sharp dark slate-700 in Light Mode */
          font-weight: 700 !important;
        }

        body.light-mode .metric-box-val {
          color: #0f172a !important; /* Deep black-slate in Light Mode */
          font-weight: 900 !important;
        }

        body.light-mode .gauge-label-text {
          color: #334155 !important;
          font-weight: 700 !important;
        }

        body.light-mode .gauge-value-text {
          color: #0f172a !important;
          font-weight: 900 !important;
        }

        .reference-scada-card:hover .metric-box-glass {
          background-color: rgba(14, 26, 52, 0.95) !important;
          border-color: rgba(56, 189, 248, 0.4) !important;
        }

        body.light-mode .reference-scada-card:hover .metric-box-glass {
          background-color: #f8fafc !important;
          border-color: #cbd5e1 !important;
        }

        /* SCADA Radial Gauge Theme Overrides */
        .gauge-track-circle {
          stroke: rgba(255, 255, 255, 0.12);
        }

        body.light-mode .gauge-track-circle {
          stroke: #e2e8f0 !important;
        }

        body.light-mode .gauge-value-text {
          color: #0f172a !important;
          font-weight: 800 !important;
        }

        body.light-mode .gauge-label-text {
          color: #475569 !important;
          font-weight: 700 !important;
        }

        /* Smart Meter Tactile Buttons in Light Mode */
        body.light-mode .mfm-tactile-btn {
          background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%) !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
        }

        body.light-mode .mfm-tactile-btn:hover {
          background: #cbd5e1 !important;
          color: #0284c7 !important;
        }

        /* ── HERO CAROUSEL ENTERPRISE STYLES ── */
        .inset-0 {
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
        }

        @keyframes carouselProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        .hero-carousel-wrapper {
          background: linear-gradient(145deg, rgba(8, 14, 32, 0.98) 0%, rgba(2, 6, 18, 0.99) 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }

        .hero-carousel-bg {
          filter: brightness(0.88) contrast(1.08) saturate(1.15);
        }

        .hero-gradient-overlay {
          background: linear-gradient(90deg, rgba(2, 8, 22, 0.94) 0%, rgba(2, 8, 22, 0.65) 45%, rgba(2, 8, 22, 0.15) 75%, transparent 100%);
        }

        .hero-carousel-title {
          color: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }

        .hero-carousel-subtitle {
          color: #cbd5e1;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }

        .hero-stat-label {
          color: #94a3b8;
        }

        .hero-stat-val {
          color: #ffffff;
        }

        .hero-carousel-counter {
          color: #cbd5e1;
        }

        /* LIGHT MODE ENTERPRISE SPECIFICATION OVERRIDES */
        body.light-mode .hero-carousel-wrapper {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 16px !important;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08) !important;
        }

        body.light-mode .hero-carousel-bg {
          filter: brightness(0.96) contrast(1.06) saturate(1.1) !important;
        }

        body.light-mode .hero-carousel-wrapper > div:first-child {
          filter: brightness(0.96) contrast(1.06) saturate(1.1) !important;
        }

        body.light-mode .hero-gradient-overlay {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 255, 255, 0.72) 45%, rgba(255, 255, 255, 0.15) 75%, transparent 100%) !important;
        }

        body.light-mode .hero-carousel-title {
          color: #0f172a !important;
          font-weight: 700 !important;
        }

        body.light-mode .hero-carousel-subtitle {
          color: #334155 !important;
          font-weight: 450 !important;
        }

        body.light-mode .hero-live-badge {
          background: rgba(255, 255, 255, 0.92) !important;
          border: 1px solid rgba(20, 184, 166, 0.40) !important;
          border-radius: 999px !important;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04) !important;
        }

        body.light-mode .hero-live-badge .badge-text {
          color: #0f766e !important;
        }

        body.light-mode .hero-live-badge .badge-icon {
          color: #0f766e !important;
        }

        body.light-mode .hero-stat-card {
          background: rgba(255, 255, 255, 0.94) !important;
          border: 1px solid rgba(226, 232, 240, 0.95) !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08) !important;
        }

        body.light-mode .hero-stat-val {
          color: #0f172a !important;
          font-weight: 800 !important;
        }

        body.light-mode .hero-stat-label {
          color: #64748b !important;
          font-weight: 600 !important;
        }

        body.light-mode .hero-action-btn {
          background: #0f9f95 !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12) !important;
        }

        body.light-mode .hero-action-btn:hover {
          background: #0d9488 !important;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.28) !important;
          transform: translateY(-1px) !important;
        }

        body.light-mode .hero-carousel-counter {
          color: #334155 !important;
          font-weight: 500 !important;
        }

        body.light-mode .carousel-nav-btn {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.10) !important;
        }

        body.light-mode .carousel-nav-btn:hover {
          background-color: #f8fafc !important;
          color: #2563eb !important;
          border-color: #93c5fd !important;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.18) !important;
          transform: translateY(-50%) scale(1.06) !important;
        }

        .carousel-nav-btn:hover {
          background-color: rgba(56, 189, 248, 0.25) !important;
          border-color: rgba(56, 189, 248, 0.6) !important;
          color: #ffffff !important;
          transform: translateY(-50%) scale(1.06) !important;
        }

        .hero-carousel-wrapper:hover .carousel-nav-btn {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .hero-carousel-wrapper {
            height: 360px !important;
          }
        }
      `}} />
    </div>
  );
};

export default Dashboard;
