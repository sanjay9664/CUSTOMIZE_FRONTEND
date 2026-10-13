import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Row, Col, Card, Nav, Button } from 'react-bootstrap';
import {
  Thermometer, Wind, RefreshCw, Zap, TrendingUp, Power, Play, Pause,
  Droplets, Gauge, Activity, AlertTriangle, ShieldCheck, CheckCircle2,
  Sliders, Maximize2, Minimize2, ArrowRight, Compass, Info, Flame
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTheme } from '../../hooks/useTheme';
import './CoolingTower.css';

// --- MOCK HISTORICAL PERFORMANCE DATA ---
const GRAPH_DATA = {
  DAY: [
    { time: '00:00', approach: 2.1, effectiveness: 82.5, range: 4.5 },
    { time: '04:00', approach: 2.3, effectiveness: 84.0, range: 5.0 },
    { time: '08:00', approach: 2.6, effectiveness: 86.2, range: 5.4 },
    { time: '12:00', approach: 2.8, effectiveness: 88.5, range: 5.8 },
    { time: '16:00', approach: 2.5, effectiveness: 87.4, range: 5.7 },
    { time: '20:00', approach: 2.4, effectiveness: 85.0, range: 5.2 },
    { time: '23:59', approach: 2.2, effectiveness: 83.8, range: 4.8 },
  ],
  WEEK: [
    { time: 'Mon', approach: 2.5, effectiveness: 86.5, range: 5.4 },
    { time: 'Tue', approach: 2.4, effectiveness: 87.1, range: 5.6 },
    { time: 'Wed', approach: 2.6, effectiveness: 88.0, range: 5.9 },
    { time: 'Thu', approach: 2.5, effectiveness: 87.4, range: 5.7 },
    { time: 'Fri', approach: 2.4, effectiveness: 88.2, range: 5.8 },
    { time: 'Sat', approach: 2.7, effectiveness: 85.0, range: 5.1 },
    { time: 'Sun', approach: 2.8, effectiveness: 84.5, range: 4.9 },
  ],
  MONTH: [
    { time: 'Week 1', approach: 2.6, effectiveness: 85.8, range: 5.3 },
    { time: 'Week 2', approach: 2.5, effectiveness: 86.9, range: 5.6 },
    { time: 'Week 3', approach: 2.4, effectiveness: 87.8, range: 5.8 },
    { time: 'Week 4', approach: 2.5, effectiveness: 87.4, range: 5.7 },
  ],
  YEAR: [
    { time: 'Jan', approach: 2.9, effectiveness: 83.0, range: 4.8 },
    { time: 'Feb', approach: 2.8, effectiveness: 84.2, range: 5.0 },
    { time: 'Mar', approach: 2.6, effectiveness: 85.5, range: 5.3 },
    { time: 'Apr', approach: 2.5, effectiveness: 87.4, range: 5.7 },
    { time: 'May', approach: 2.4, effectiveness: 88.2, range: 6.0 },
    { time: 'Jun', approach: 2.3, effectiveness: 89.1, range: 6.2 },
    { time: 'Jul', approach: 2.4, effectiveness: 88.5, range: 6.1 },
    { time: 'Aug', approach: 2.5, effectiveness: 87.9, range: 5.8 },
    { time: 'Sep', approach: 2.5, effectiveness: 87.0, range: 5.6 },
    { time: 'Oct', approach: 2.6, effectiveness: 86.0, range: 5.4 },
    { time: 'Nov', approach: 2.7, effectiveness: 84.8, range: 5.1 },
    { time: 'Dec', approach: 2.8, effectiveness: 83.5, range: 4.9 },
  ],
  CUSTOM: [
    { time: 'Oct 08', approach: 2.5, effectiveness: 86.8, range: 5.5 },
    { time: 'Oct 09', approach: 2.6, effectiveness: 87.0, range: 5.6 },
    { time: 'Oct 10', approach: 2.5, effectiveness: 87.4, range: 5.7 },
    { time: 'Oct 11', approach: 2.4, effectiveness: 87.9, range: 5.8 },
    { time: 'Oct 12', approach: 2.5, effectiveness: 87.4, range: 5.7 },
  ]
};

const CoolingTower = () => {
  const { isDark } = useTheme();

  // --- STATE FOR FAN CONTROL & SIMULATION ---
  const [isFanRunning, setIsFanRunning] = useState(true);
  const [fanSpeed, setFanSpeed] = useState(82); // 20% to 100%
  const [fanMode, setFanMode] = useState('AUTO'); // 'AUTO' | 'MANUAL'
  const [graphTimeRange, setGraphTimeRange] = useState('DAY');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState('14:48:12');

  // --- INERTIA ROTATION SIMULATION ---
  const fanRotationRef = useRef(0);
  const fanVelocityRef = useRef(15);
  const targetVelocityRef = useRef(15);
  const requestRef = useRef(null);

  // Synchronize target velocity with run state and fan speed
  useEffect(() => {
    if (isFanRunning) {
      targetVelocityRef.current = (fanSpeed / 100) * 18;
    } else {
      targetVelocityRef.current = 0;
    }
  }, [isFanRunning, fanSpeed]);

  // Physics animation frame loop for smooth inertia (accelerates/decelerates gracefully)
  useEffect(() => {
    const animate = () => {
      // Smoothly approach target velocity
      if (fanVelocityRef.current < targetVelocityRef.current) {
        fanVelocityRef.current += 0.12; // accelerate
        if (fanVelocityRef.current > targetVelocityRef.current) {
          fanVelocityRef.current = targetVelocityRef.current;
        }
      } else if (fanVelocityRef.current > targetVelocityRef.current) {
        fanVelocityRef.current -= 0.08; // decelerate with inertia
        if (fanVelocityRef.current < 0) fanVelocityRef.current = 0;
      }

      fanRotationRef.current += fanVelocityRef.current;

      // Apply rotation directly to DOM for 60fps buttery smoothness
      const fanEl = document.getElementById('cooling-tower-fan-impeller');
      if (fanEl) {
        fanEl.style.transform = `rotate(${fanRotationRef.current}deg)`;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate dynamic motor electrical parameters based on fan speed
  const fanRpm = useMemo(() => {
    return isFanRunning ? Math.round((fanSpeed / 100) * 720) : 0;
  }, [isFanRunning, fanSpeed]);

  const fanFreq = useMemo(() => {
    return isFanRunning ? ((fanSpeed / 100) * 50).toFixed(1) : '0.0';
  }, [isFanRunning, fanSpeed]);

  const fanPower = useMemo(() => {
    // Affinity law: Power proportional to cube of speed ratio
    if (!isFanRunning) return '0.0';
    const ratio = fanSpeed / 100;
    return (12.4 * Math.pow(ratio, 2.7)).toFixed(1);
  }, [isFanRunning, fanSpeed]);

  // Toggle Fan Running state
  const handleToggleFan = () => {
    setIsFanRunning(prev => !prev);
  };

  // Toggle Manual / Auto mode
  const handleToggleMode = () => {
    setFanMode(prev => (prev === 'AUTO' ? 'MANUAL' : 'AUTO'));
  };

  // Helper reusable component for floating telemetry cards on 3D canvas
  const CanvasTelemetryCard = ({ title, data, top, left, right, bottom }) => (
    <div
      className="ct-label-card"
      style={{ top, left, right, bottom }}
    >
      <div className="ct-label-card-header">
        <span>{title}</span>
      </div>
      {data.map((item, i) => (
        <div key={i} className="ct-label-card-row">
          <span className="label">{item.label}</span>
          <span className="val" style={item.color ? { color: item.color } : {}}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="cooling-tower-wrapper p-3 p-md-4">
      {/* ── TOP HEADER TOOLBAR ── */}
      <div className="ct-header-toolbar mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center p-2.5"
            style={{
              background: isDark ? 'rgba(6, 199, 245, 0.15)' : '#e0f2fe',
              border: `1px solid ${isDark ? 'rgba(6, 199, 245, 0.35)' : '#7dd3fc'}`,
              color: '#0284c7'
            }}
          >
            <Wind size={26} className={isFanRunning ? 'scada-spin' : ''} />
          </div>
          <div className="ct-title-group">
            <div className="d-flex align-items-center gap-2">
              <h4>Cooling Tower (CT-001)</h4>
              <span className={`ct-status-pill ${isFanRunning ? 'running' : 'stopped'}`}>
                <span className={`ct-pulse-dot ${isFanRunning ? 'green' : 'red'}`}></span>
                {isFanRunning ? 'RUNNING' : 'STOPPED'}
              </span>
              <span className="ct-status-pill mode">
                MODE: {fanMode}
              </span>
            </div>
            <div className="ct-subtitle mt-0.5">
              AHU Plant / Central Utility Roof Deck • Induced Draft Counterflow Tower • Live Telemetry
            </div>
          </div>
        </div>

        {/* Action Controls & Fan Start/Stop Button */}
        <div className="d-flex align-items-center flex-wrap gap-2.5">
          <button
            type="button"
            className={`btn-ct-power ${isFanRunning ? 'stop' : 'start'}`}
            onClick={handleToggleFan}
            title={isFanRunning ? "Click to stop cooling tower fan" : "Click to start cooling tower fan"}
          >
            {isFanRunning ? (
              <>
                <Power size={14} /> Stop Fan
              </>
            ) : (
              <>
                <Play size={14} /> Start Fan
              </>
            )}
          </button>

          <Button
            variant={isDark ? "outline-secondary" : "outline-dark"}
            size="sm"
            className="d-inline-flex align-items-center gap-1.5 py-1.5 px-3 fw-bold"
            style={{ fontSize: '11.5px', borderRadius: '8px' }}
            onClick={handleToggleMode}
          >
            <Sliders size={13} />
            {fanMode === 'AUTO' ? 'Switch to Manual' : 'Switch to Auto'}
          </Button>

          <div
            className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-3"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#dedede',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#bebebe'}`,
              fontSize: '11.5px'
            }}
          >
            <RefreshCw size={12} className="text-info scada-spin" style={{ animationDuration: '6s' }} />
            <span className="text-muted">SYNC:</span>
            <strong className="font-monospace text-primary">{currentTime}</strong>
          </div>
        </div>
      </div>

      {/* ── 3D VISUALIZATION VIEWPORT CONTAINER ── */}
      <Row className="g-4 mb-4">
        <Col xl={12}>
          <div className="cooling-diagram-container position-relative">
            {/* SVG Animated Flow Paths Overlay */}
            <svg
              className="flow-lines-overlay"
              viewBox="0 0 1000 600"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 3,
                pointerEvents: 'none'
              }}
            >
              <defs>
                {/* Circulation Flow Paths */}
                <path id="pathAmbient" d="M 220 250 L 350 250" />
                <path id="pathReturn" d="M 780 250 L 650 250" />
                <path id="pathSump" d="M 650 450 L 780 450" />
                <path id="pathExhaust" d="M 500 145 L 500 50" />
                <path id="pathExhaustLeft" d="M 460 145 L 410 50" />
                <path id="pathExhaustRight" d="M 540 145 L 590 50" />

                {/* Animated Flow Arrow Markers */}
                <marker id="arrowWhite" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                  <path d="M 0 0 L 6 3 L 0 6 z" fill="#e2e8f0" />
                </marker>
                <marker id="arrowOrange" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                  <path d="M 0 0 L 6 3 L 0 6 z" fill="#f97316" />
                </marker>
                <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                  <path d="M 0 0 L 6 3 L 0 6 z" fill="#0ea5e9" />
                </marker>
                <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                  <path d="M 0 0 L 6 3 L 0 6 z" fill="#ef4444" />
                </marker>
              </defs>

              {/* Ambient Air Inflow (Left) */}
              <use
                href="#pathAmbient"
                stroke="#e2e8f0"
                strokeWidth="3.5"
                fill="none"
                strokeDasharray="10 5"
                markerEnd="url(#arrowWhite)"
                opacity={isFanRunning ? "0.85" : "0.3"}
              >
                {isFanRunning && <animate attributeName="stroke-dashoffset" from="30" to="0" dur="1s" repeatCount="indefinite" />}
              </use>

              {/* Hot Return Water from Chiller Condenser (Right Top) */}
              <use
                href="#pathReturn"
                stroke="#f97316"
                strokeWidth="3.5"
                fill="none"
                strokeDasharray="10 5"
                markerEnd="url(#arrowOrange)"
                opacity="0.95"
              >
                <animate attributeName="stroke-dashoffset" from="30" to="0" dur="1s" repeatCount="indefinite" />
              </use>

              {/* Cooled Water to Chiller Condenser (Right Bottom) */}
              <use
                href="#pathSump"
                stroke="#0ea5e9"
                strokeWidth="3.5"
                fill="none"
                strokeDasharray="10 5"
                markerEnd="url(#arrowBlue)"
                opacity="0.95"
              >
                <animate attributeName="stroke-dashoffset" from="30" to="0" dur="1s" repeatCount="indefinite" />
              </use>

              {/* Hot Moist Exhaust Air Plume out of Fan Cowl (Only Active when Fan Running) */}
              {isFanRunning && (
                <>
                  <use href="#pathExhaust" stroke="#ef4444" strokeWidth="3.5" fill="none" strokeDasharray="10 5" markerEnd="url(#arrowRed)" opacity="0.9">
                    <animate attributeName="stroke-dashoffset" from="30" to="0" dur="0.9s" repeatCount="indefinite" />
                  </use>
                  <use href="#pathExhaustLeft" stroke="#ef4444" strokeWidth="3.5" fill="none" strokeDasharray="10 5" markerEnd="url(#arrowRed)" opacity="0.7">
                    <animate attributeName="stroke-dashoffset" from="30" to="0" dur="0.9s" repeatCount="indefinite" />
                  </use>
                  <use href="#pathExhaustRight" stroke="#ef4444" strokeWidth="3.5" fill="none" strokeDasharray="10 5" markerEnd="url(#arrowRed)" opacity="0.7">
                    <animate attributeName="stroke-dashoffset" from="30" to="0" dur="0.9s" repeatCount="indefinite" />
                  </use>
                </>
              )}

              {/* Text Labels for Circulation Flows with High-Contrast Dropshadows */}
              <text x="220" y="220" fill="#e2e8f0" fontSize="15" fontWeight="bold" style={{ textShadow: '2px 2px 5px #000, -1px -1px 3px #000' }}>
                AMBIENT AIR
              </text>
              <text x="220" y="240" fill="#94a3b8" fontSize="11" fontWeight="600" style={{ textShadow: '2px 2px 4px #000' }}>
                (Entering Tower Louvers)
              </text>

              <text x="780" y="220" fill="#f97316" fontSize="15" fontWeight="bold" textAnchor="end" style={{ textShadow: '2px 2px 5px #000, -1px -1px 3px #000' }}>
                HOT RETURN WATER
              </text>
              <text x="780" y="240" fill="#fdba74" fontSize="11" fontWeight="600" textAnchor="end" style={{ textShadow: '2px 2px 4px #000' }}>
                (From Chiller Condenser 38.2°C)
              </text>

              <text x="780" y="420" fill="#0ea5e9" fontSize="15" fontWeight="bold" textAnchor="end" style={{ textShadow: '2px 2px 5px #000, -1px -1px 3px #000' }}>
                COOLED WATER
              </text>
              <text x="780" y="440" fill="#7dd3fc" fontSize="11" fontWeight="600" textAnchor="end" style={{ textShadow: '2px 2px 4px #000' }}>
                (To Chiller Condenser 32.5°C)
              </text>

              <text x="500" y="30" fill={isFanRunning ? "#ef4444" : "#94a3b8"} fontSize="15" fontWeight="bold" textAnchor="middle" style={{ textShadow: '2px 2px 5px #000, -1px -1px 3px #000' }}>
                {isFanRunning ? "EXHAUST AIR (Hot Moist Vapor)" : "EXHAUST AIR (FAN STOPPED)"}
              </text>
              <text x="500" y="48" fill="#cbd5e1" fontSize="11" fontWeight="600" textAnchor="middle" style={{ textShadow: '2px 2px 4px #000' }}>
                {isFanRunning ? `Speed: ${fanRpm} RPM • ${fanSpeed}% VFD` : 'Static Air Column'}
              </text>
            </svg>

            {/* Center Realistic 3D Cooling Tower Graphic */}
            <div className="ct-center-graphic-wrap">
              <div className="ct-tower-stage">
                <img
                  src="/cooling_tower.png"
                  alt="Cooling Tower 3D View"
                  className="img-fluid ct-tower-img"
                  style={{ mixBlendMode: 'screen', filter: 'contrast(1.1) brightness(1.05)' }}
                  onLoad={() => setImageLoaded(true)}
                />

                {/* Pulsing Vapor Plume Ring when Fan Active */}
                {isFanRunning && <div className="ct-exhaust-vapor-ring"></div>}

                {/* Perspective-Tilted Rotating Top Fan Overlay - Strictly Contained Inside Cowl */}
                <div className="ct-fan-overlay-wrapper">
                  <svg
                    id="cooling-tower-fan-impeller"
                    className="ct-fan-svg"
                    viewBox="0 0 100 100"
                  >
                    <defs>
                      <clipPath id="innerCowlCircularClip">
                        <circle cx="50" cy="50" r="46.5" />
                      </clipPath>
                    </defs>
                    <g clipPath="url(#innerCowlCircularClip)">
                      {/* 6 Aerofoil Fan Blades - Properly proportioned inside cowl circle */}
                      {[0, 60, 120, 180, 240, 300].map(angle => (
                        <g key={angle} transform={`rotate(${angle} 50 50)`}>
                          <path
                            d="M 47 37 L 39 8 A 45 45 0 0 1 61 8 L 53 37 Z"
                            fill="rgba(14, 19, 30, 0.98)"
                            stroke="#334155"
                            strokeWidth="1.2"
                          />
                          <line x1="50" y1="36" x2="50" y2="7" stroke="#475569" strokeWidth="1.5" />
                        </g>
                      ))}
                      {/* Central Hub & Motor Spinner Cap */}
                      <circle cx="50" cy="50" r="14" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                      <circle cx="50" cy="50" r="8" fill="#1e293b" stroke={isFanRunning ? "#06C7F5" : "#64748b"} strokeWidth="1" />
                      <circle cx="50" cy="50" r="4" fill={isFanRunning ? "#06C7F5" : "#64748b"} />
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* ── 5 LEFT FLOATING TELEMETRY CARDS ── */}
            <CanvasTelemetryCard
              title="Pump (Condenser P-1)"
              data={[
                { label: 'Status', value: isFanRunning ? 'RUNNING' : 'STANDBY', color: isFanRunning ? '#10b981' : '#f59e0b' },
                { label: 'Power', value: isFanRunning ? '18.5 kW' : '0.0 kW' },
                { label: 'Flow', value: isFanRunning ? '145.0 m³/h' : '0.0 m³/h' }
              ]}
              top="7%"
              left="2%"
            />

            <CanvasTelemetryCard
              title="Ambient Atmosphere"
              data={[
                { label: 'WBT (Wet Bulb)', value: '21.28 °C' },
                { label: 'DBT (Dry Bulb)', value: '26.80 °C' },
                { label: 'Relative Hum.', value: '61.1 %' }
              ]}
              top="25%"
              left="2%"
            />

            <CanvasTelemetryCard
              title="Header Pressure"
              data={[
                { label: 'Inlet Pressure', value: '1.82 bar' },
                { label: 'Outlet Pressure', value: '1.75 bar' },
                { label: 'Pressure Drop', value: '0.07 bar' }
              ]}
              top="43%"
              left="2%"
            />

            <CanvasTelemetryCard
              title="Make-Up Water"
              data={[
                { label: 'Valve State', value: 'AUTO-READY', color: '#10b981' },
                { label: 'Supply Flow', value: '15.0 LPM' },
                { label: 'Totalizer', value: '12.4 m³' }
              ]}
              top="61%"
              left="2%"
            />

            <CanvasTelemetryCard
              title="Cooling Thermal Load"
              data={[
                { label: 'Capacity Rate', value: `${fanSpeed}%` },
                { label: 'Heat Rejection', value: '1,745 kW' },
                { label: 'Tonnage TR', value: '496 TR' }
              ]}
              top="79%"
              left="2%"
            />

            {/* ── 5 RIGHT FLOATING TELEMETRY CARDS ── */}
            <CanvasTelemetryCard
              title="Induced Draft Fan"
              data={[
                { label: 'Status', value: isFanRunning ? 'RUNNING' : 'STOPPED', color: isFanRunning ? '#10b981' : '#ef4444' },
                { label: 'Speed', value: `${fanRpm} RPM` },
                { label: 'Power', value: `${fanPower} kW` }
              ]}
              top="7%"
              right="2%"
            />

            <CanvasTelemetryCard
              title="Motor & VFD Diag."
              data={[
                { label: 'Vibration', value: isFanRunning ? '1.2 mm/s RMS' : '0.0 mm/s' },
                { label: 'VFD Frequency', value: `${fanFreq} Hz` },
                { label: 'Winding Temp', value: isFanRunning ? '42.5 °C' : '26.4 °C' }
              ]}
              top="25%"
              right="2%"
            />

            <CanvasTelemetryCard
              title="Return Water (Hot)"
              data={[
                { label: 'Temperature', value: '38.20 °C', color: '#f97316' },
                { label: 'Flow Rate', value: '145.0 m³/h' },
                { label: 'Inlet Delta-T', value: '+5.7 °C' }
              ]}
              top="43%"
              right="2%"
            />

            <CanvasTelemetryCard
              title="Basin / Sump Water"
              data={[
                { label: 'Temperature', value: '32.50 °C', color: '#0ea5e9' },
                { label: 'Basin Level', value: '85% (Nominal)' },
                { label: 'Sump Heater', value: 'STANDBY' }
              ]}
              top="61%"
              right="2%"
            />

            <CanvasTelemetryCard
              title="Blowdown & Quality"
              data={[
                { label: 'Auto Valve', value: 'CLOSED', color: '#10b981' },
                { label: 'Conductivity', value: '1,200 µS/cm' },
                { label: 'Basin Water pH', value: '7.8 (Optimal)' }
              ]}
              top="79%"
              right="2%"
            />
          </div>

          {/* ── KPI BOTTOM OVERLAY BAR ── */}
          <div className="ct-kpi-bottom-bar">
            <div className="pe-4 border-end border-secondary border-opacity-25 text-start">
              <div className="kpi-label">KEY PERFORMANCE INDEX</div>
              <div className="text-info small fw-bold text-uppercase d-flex align-items-center gap-1">
                <Activity size={12} /> SCADA Thermodynamic Loop
              </div>
            </div>

            <div className="ct-kpi-item">
              <div className="kpi-label">Cooling Range (ΔT)</div>
              <div className="kpi-val text-warning">5.7 °C</div>
            </div>

            <div className="ct-kpi-item">
              <div className="kpi-label">Approach to WBT</div>
              <div className="kpi-val text-success">2.5 °C</div>
            </div>

            <div className="ct-kpi-item">
              <div className="kpi-label">Effectiveness</div>
              <div className="kpi-val text-info">87.4%</div>
            </div>

            <div className="ct-kpi-item">
              <div className="kpi-label">Evaporation Rate</div>
              <div className="kpi-val text-primary">2.8 m³/h</div>
            </div>

            <div className="ct-kpi-item">
              <div className="kpi-label">Heat Rejection</div>
              <div className="kpi-val">1,745 kW</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── INTERACTIVE VFD FAN SPEED MODULATION STRIP ── */}
      <div className="ct-vfd-strip mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
          <div className="d-flex align-items-center gap-2">
            <Sliders size={18} className="text-info" />
            <span className="fw-bold fs-6">VFD Fan Speed Setpoint Modulation</span>
            <span className="badge bg-primary bg-opacity-25 text-primary fs-12 px-2.5 py-1">
              {fanSpeed}% ({fanRpm} RPM)
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small fw-semibold">Quick Presets:</span>
            {[
              { label: 'Eco 40%', val: 40 },
              { label: 'Std 60%', val: 60 },
              { label: 'Optimal 82%', val: 82 },
              { label: 'Max 100%', val: 100 }
            ].map(preset => (
              <button
                key={preset.val}
                type="button"
                className={`btn btn-sm ${fanSpeed === preset.val ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary'}`}
                style={{ fontSize: '11px', borderRadius: '6px', padding: '3px 9px' }}
                onClick={() => {
                  setFanSpeed(preset.val);
                  if (!isFanRunning) setIsFanRunning(true);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <input
          type="range"
          min="20"
          max="100"
          step="1"
          value={fanSpeed}
          onChange={(e) => {
            setFanSpeed(Number(e.target.value));
            if (!isFanRunning) setIsFanRunning(true);
          }}
          className="w-100 ct-slider"
        />

        <div className="d-flex justify-content-between text-muted small mt-1 font-monospace" style={{ fontSize: '11px' }}>
          <span>Min: 20% (144 RPM • 10.0 Hz)</span>
          <span className="text-info fw-bold">Current Speed: {fanSpeed}% ({fanRpm} RPM • {fanFreq} Hz • {fanPower} kW)</span>
          <span>Max: 100% (720 RPM • 50.0 Hz)</span>
        </div>
      </div>

      {/* ── INSTANTANEOUS TREND ANALYTICS SECTION ── */}
      <Row className="mb-4">
        <Col xl={12}>
          <div className="ct-analytics-card">
            <div className="ct-analytics-header">
              <div className="d-flex align-items-center gap-2">
                <TrendingUp size={18} className="text-info" />
                <h6 className="mb-0 fw-bold fs-6">Instantaneous Performance Analytics</h6>
                <span className="text-muted small ms-2 d-none d-md-inline">
                  Thermal Effectiveness (%), Approach (°C) & Range (°C)
                </span>
              </div>

              {/* Timeframe selector pills */}
              <div className="d-flex align-items-center gap-1">
                {['DAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM'].map(range => (
                  <button
                    key={range}
                    type="button"
                    className={`ct-time-pill-btn ${graphTimeRange === range ? 'active' : ''}`}
                    onClick={() => setGraphTimeRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4" style={{ height: '360px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={GRAPH_DATA[graphTimeRange]}
                  margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
                  barGap={4}
                  maxBarSize={42}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "rgba(255,255,255,0.06)" : "#d1d5db"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    stroke={isDark ? "rgba(255,255,255,0.4)" : "#4b5563"}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke={isDark ? "rgba(255,255,255,0.4)" : "#4b5563"}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                    domain={[60, 100]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={isDark ? "rgba(255,255,255,0.4)" : "#4b5563"}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    unit="°C"
                    domain={[0, 10]}
                  />
                  <ChartTooltip
                    contentStyle={{
                      background: isDark ? '#0f172a' : '#ffffff',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                      borderRadius: '8px',
                      color: isDark ? '#ffffff' : '#111827',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}
                    itemStyle={{ fontSize: '12.5px', fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px', fontWeight: 600 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="effectiveness"
                    name="Effectiveness (%)"
                    fill="#0284c7"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="approach"
                    name="Approach (°C)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="range"
                    name="Range (°C)"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CoolingTower;
