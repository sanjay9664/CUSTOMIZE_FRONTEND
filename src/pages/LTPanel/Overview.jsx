import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Badge } from 'react-bootstrap';
import {
  Zap, Activity, Power, ShieldAlert, Thermometer,
  Gauge, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Radio
} from 'lucide-react';

const LTOverview = () => {
  const [time, setTime] = useState(new Date());

  // Simulated state for Overview
  const [data, setData] = useState({
    totalLoad: 124.5,
    powerFactor: 0.97,
    dailyEnergy: 1450,
    activeAlarms: 2,
    voltage: { vab: 415.0, vbc: 414.8, vca: 415.2 },
    current: { ia: 173.5, ib: 171.2, ic: 175.0 },
    freq: 50.0,
    temp: 38.4,
    rooms: [
      { id: 1, name: 'LT Room 1', load: 35.4, capacity: 100, pf: 0.98, status: 'Healthy' },
      { id: 2, name: 'LT Room 2', load: 45.1, capacity: 100, pf: 0.96, status: 'Warning' },
      { id: 3, name: 'LT Room 3', load: 44.0, capacity: 100, pf: 0.97, status: 'Healthy' }
    ]
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setData(prev => {
        const newRooms = prev.rooms.map(room => ({
          ...room,
          load: Math.max(10, room.load + (Math.random() * 2 - 1)),
          pf: Math.min(1.0, Math.max(0.85, room.pf + (Math.random() * 0.02 - 0.01)))
        }));
        const newTotalLoad = newRooms.reduce((acc, curr) => acc + curr.load, 0);
        return {
          ...prev,
          totalLoad: newTotalLoad,
          voltage: {
            vab: +(415.0 + (Math.random() * 1.0 - 0.5)).toFixed(1),
            vbc: +(414.8 + (Math.random() * 1.0 - 0.5)).toFixed(1),
            vca: +(415.2 + (Math.random() * 1.0 - 0.5)).toFixed(1)
          },
          current: {
            ia: +(173.5 + (Math.random() * 2.0 - 1.0)).toFixed(1),
            ib: +(171.2 + (Math.random() * 2.0 - 1.0)).toFixed(1),
            ic: +(175.0 + (Math.random() * 2.0 - 1.0)).toFixed(1)
          },
          rooms: newRooms
        };
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fade-in p-3 h-100 d-flex flex-column" style={{ background: 'var(--scada-bg)', color: 'var(--scada-text)', minHeight: '100vh' }}>
      {/* HEADER SECTION */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom border-secondary border-opacity-25">
        <div>
          <div className="d-flex align-items-center gap-3 mb-1">
            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="rounded-circle status-dot-pulse" style={{ width: '8px', height: '8px', background: '#10b981' }}></div>
              <span className="text-success fw-bold fs-9 uppercase tracking-widest">SCADA LIVE SYNC</span>
            </div>
            <div className="text-secondary fw-bold fs-9 uppercase px-3 py-1 rounded-pill" style={{ background: 'var(--scada-accent-bg)' }}>
              {time.toLocaleTimeString()}
            </div>
          </div>
          <h2 className="fw-black mb-0 d-flex align-items-center text-uppercase tracking-wide" style={{ color: 'var(--scada-text)' }}>
            <Activity className="me-2 text-primary" size={26} style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.8))' }} />
            LT Panel Master Overview
          </h2>
          <p className="text-secondary fs-8 mb-0 uppercase tracking-widest">Facility-Wide Low Tension Switchgear & Distribution Command</p>
        </div>

        <Badge bg="primary" className="px-3 py-2 font-monospace rounded-pill shadow-sm d-none d-md-block" style={{ fontSize: '0.74rem' }}>
          SYSTEM HEALTH: 99.6% EXCELLENT
        </Badge>
      </div>

      {/* ── UNIFIED SIDE-BY-SIDE SPLIT SECTION ────────────────────────── */}
      <Row className="g-4 mb-4">
        {/* LEFT COLUMN: LARGE FULL-WIDTH LT PANEL VISUAL EQUIPMENT & SPECS */}
        <Col xl={6} lg={6} md={12}>
          <Card className="border-0 overflow-hidden h-100 shadow-lg" style={{ background: 'var(--scada-card, #0f172a)', border: '1px solid var(--scada-border, rgba(255,255,255,0.1))', borderRadius: '18px' }}>
            {/* Image Container 100% Full Content-Fit Display (Zero Cropping on any side) */}
            <div className="position-relative overflow-hidden w-100 p-2.5 d-flex align-items-center justify-content-center" style={{ background: 'var(--scada-card, #0f172a)' }}>
              <img
                src="/images/lt_panel_card.jpg"
                alt="LT Panel Switchgear Equipment"
                className="w-100 rounded-3 shadow-md"
                style={{ objectFit: 'contain', width: '100%', height: 'auto', maxHeight: '440px', filter: 'brightness(1.05) contrast(1.08)' }}
              />
            </div>

            {/* Equipment Technical Specifications */}
            <Card.Body className="p-3 d-flex flex-column justify-content-between">
              <div className="mb-2">
                <span className="text-secondary font-monospace text-uppercase fw-bold d-block mb-2" style={{ fontSize: '0.68rem' }}>
                  Technical Specifications & Ratings
                </span>
                <div className="row g-2 font-monospace">
                  <div className="col-6">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-700/50" style={{ fontSize: '0.70rem' }}>
                      <span className="text-slate-400 d-block">Busbar Capacity</span>
                      <span className="fw-bold text-cyan-400">2,500 Amps</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-700/50" style={{ fontSize: '0.70rem' }}>
                      <span className="text-slate-400 d-block">Incomer ACB</span>
                      <span className="fw-bold text-emerald-400">3,200A (4-Pole)</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-700/50" style={{ fontSize: '0.70rem' }}>
                      <span className="text-slate-400 d-block">Operating Voltage</span>
                      <span className="fw-bold text-amber-300">415V AC ± 10%</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-700/50" style={{ fontSize: '0.70rem' }}>
                      <span className="text-slate-400 d-block">Short Circuit Rating</span>
                      <span className="fw-bold text-purple-300">50 kA for 1 sec</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Summary Pill Bar */}
              <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 bg-slate-900/80 border border-slate-700/60 font-monospace" style={{ fontSize: '0.70rem' }}>
                <span className="text-slate-300 d-flex align-items-center gap-1.5">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  Earth Fault Protection:
                </span>
                <span className="fw-bold text-emerald-400">ACTIVE & NORMAL</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT COLUMN: COMPREHENSIVE INFORMATION & TELEMETRY DASHBOARD */}
        <Col xl={6} lg={6} md={12}>
          <div className="d-flex flex-column gap-3 h-100 justify-content-between">
            {/* Top 4 KPI Metric Cards */}
            <Row className="g-3">
              {[
                { label: 'Total Active Load', val: data.totalLoad.toFixed(1), unit: 'kW', icon: <Zap size={20} />, color: '#3b82f6' },
                { label: 'Avg Power Factor', val: data.powerFactor.toFixed(2), unit: 'PF', icon: <Activity size={20} />, color: '#10b981' },
                { label: 'Daily Energy', val: data.dailyEnergy, unit: 'kWh', icon: <Power size={20} />, color: '#8b5cf6' },
                { label: 'Active Alarms', val: data.activeAlarms, unit: 'Alerts', icon: <ShieldAlert size={20} />, color: '#ef4444' }
              ].map((kpi, i) => (
                <Col sm={6} key={i}>
                  <Card className="border-0 overflow-hidden shadow-sm h-100" style={{ background: 'var(--scada-card, #0f172a)', borderRadius: '14px', border: '1px solid var(--scada-border, rgba(255,255,255,0.08))' }}>
                    <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                      <div>
                        <span className="text-secondary font-monospace fw-bold uppercase d-block mb-1" style={{ fontSize: '0.66rem' }}>{kpi.label}</span>
                        <h4 className="fw-black mb-0 font-monospace" style={{ color: 'var(--scada-text, #ffffff)' }}>
                          {kpi.val} <span className="fs-6 text-secondary fw-normal">{kpi.unit}</span>
                        </h4>
                      </div>
                      <div className="rounded-3 p-2.5 d-flex align-items-center justify-content-center" style={{ backgroundColor: `${kpi.color}20`, color: kpi.color, border: `1px solid ${kpi.color}40` }}>
                        {kpi.icon}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Live Operational Parameters Grid (6 Parameters) */}
            <Card className="border-0 shadow-sm p-3" style={{ background: 'var(--scada-card, #0f172a)', borderRadius: '16px', border: '1px solid var(--scada-border, rgba(255,255,255,0.08))' }}>
              <div className="d-flex justify-content-between align-items-center mb-2.5">
                <span className="font-monospace text-uppercase text-secondary fw-bold" style={{ fontSize: '0.70rem' }}>
                  Live System Telemetry & Voltages
                </span>
                <Badge bg="dark" className="text-cyan-400 font-monospace border border-cyan-500/30" style={{ fontSize: '0.64rem' }}>
                  MODBUS RTU / TCP (1.2s REFRESH)
                </Badge>
              </div>

              <Row className="g-2 font-monospace">
                <Col md={4} sm={6}>
                  <div className="p-2.5 rounded-3 border" style={{ backgroundColor: 'var(--scada-card-hover, rgba(30, 41, 59, 0.5))', borderColor: 'var(--scada-border, rgba(255,255,255,0.08))' }}>
                    <div className="text-slate-400 uppercase" style={{ fontSize: '0.62rem' }}>Line Voltage (Vab)</div>
                    <div className="fw-black text-cyan-400" style={{ fontSize: '0.92rem' }}>{data.voltage.vab} V</div>
                  </div>
                </Col>
                <Col md={4} sm={6}>
                  <div className="p-2.5 rounded-3 border" style={{ backgroundColor: 'var(--scada-card-hover, rgba(30, 41, 59, 0.5))', borderColor: 'var(--scada-border, rgba(255,255,255,0.08))' }}>
                    <div className="text-slate-400 uppercase" style={{ fontSize: '0.62rem' }}>Phase Current (Ia)</div>
                    <div className="fw-black text-emerald-400" style={{ fontSize: '0.92rem' }}>{data.current.ia} A</div>
                  </div>
                </Col>
                <Col md={4} sm={6}>
                  <div className="p-2.5 rounded-3 border" style={{ backgroundColor: 'var(--scada-card-hover, rgba(30, 41, 59, 0.5))', borderColor: 'var(--scada-border, rgba(255,255,255,0.08))' }}>
                    <div className="text-slate-400 uppercase" style={{ fontSize: '0.62rem' }}>Grid Frequency</div>
                    <div className="fw-black text-amber-300" style={{ fontSize: '0.92rem' }}>{data.freq} Hz</div>
                  </div>
                </Col>
                <Col md={4} sm={6}>
                  <div className="p-2.5 rounded-3 border" style={{ backgroundColor: 'var(--scada-card-hover, rgba(30, 41, 59, 0.5))', borderColor: 'var(--scada-border, rgba(255,255,255,0.08))' }}>
                    <div className="text-slate-400 uppercase" style={{ fontSize: '0.62rem' }}>Busbar Temp</div>
                    <div className="fw-black text-rose-400" style={{ fontSize: '0.92rem' }}>{data.temp} °C</div>
                  </div>
                </Col>
                <Col md={4} sm={6}>
                  <div className="p-2.5 rounded-3 border" style={{ backgroundColor: 'var(--scada-card-hover, rgba(30, 41, 59, 0.5))', borderColor: 'var(--scada-border, rgba(255,255,255,0.08))' }}>
                    <div className="text-slate-400 uppercase" style={{ fontSize: '0.62rem' }}>Main Incomer ACB</div>
                    <div className="fw-black text-emerald-400" style={{ fontSize: '0.92rem' }}>ON (CLOSED)</div>
                  </div>
                </Col>
                <Col md={4} sm={6}>
                  <div className="p-2.5 rounded-3 border" style={{ backgroundColor: 'var(--scada-card-hover, rgba(30, 41, 59, 0.5))', borderColor: 'var(--scada-border, rgba(255,255,255,0.08))' }}>
                    <div className="text-slate-400 uppercase" style={{ fontSize: '0.62rem' }}>Bus Coupler ACB</div>
                    <div className="fw-black text-slate-400" style={{ fontSize: '0.92rem' }}>OFF (OPEN)</div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Bottom System Summary Strip */}
            <div className="p-3 rounded-3 border d-flex justify-content-between align-items-center flex-wrap gap-2 font-monospace" style={{ background: 'var(--scada-card, #0f172a)', borderColor: 'var(--scada-border, rgba(255,255,255,0.08))', fontSize: '0.72rem' }}>
              <div className="d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>ACTIVE BREAKERS: <strong className="text-emerald-400">14 / 16 CLOSED</strong></span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <span>SYSTEM WARNINGS: <strong className="text-amber-400">2 (LT ROOM 2 LOAD &gt; 45kW)</strong></span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── ROOM COMPARISON & PERFORMANCE SECTION ────────────────────────── */}
      <h5 className="fw-bold text-uppercase fs-6 mb-3 d-flex align-items-center mt-2" style={{ color: 'var(--scada-text, #ffffff)' }}>
        <Power className="me-2 text-primary" size={20} />
        Sub-Station & Room-wise Performance Summary
      </h5>
      <Row className="g-4">
        {data.rooms.map(room => {
          const loadPercent = (room.load / room.capacity) * 100;
          const isWarning = room.status === 'Warning';
          const pColor = isWarning ? '#f59e0b' : '#10b981';

          return (
            <Col xl={4} lg={12} key={room.id}>
              <Card className={`border-0 h-100 ${isWarning ? 'animate-pulse' : ''}`} style={{ background: 'var(--scada-card, #0f172a)', borderRadius: '16px', border: `1.5px solid ${pColor}50`, boxShadow: isWarning ? `0 0 20px ${pColor}25` : 'none' }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold m-0 font-monospace" style={{ color: 'var(--scada-text, #ffffff)' }}>{room.name}</h5>
                    <div className="px-3 py-1 rounded-pill fs-9 fw-bold text-uppercase font-monospace" style={{ background: `${pColor}20`, color: pColor, border: `1px solid ${pColor}50` }}>
                      {room.status}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1.5 font-monospace">
                      <span className="text-secondary fs-9 uppercase tracking-widest">Current Active Load</span>
                      <span className="fw-bold" style={{ color: 'var(--scada-text, #ffffff)' }}>{room.load.toFixed(1)} kW / {room.capacity} kW</span>
                    </div>
                    <ProgressBar now={loadPercent} variant={isWarning ? 'warning' : 'success'} style={{ height: '8px', background: 'rgba(255,255,255,0.08)' }} />
                  </div>

                  <div className="d-flex justify-content-between align-items-center p-2.5 rounded-3 font-monospace" style={{ background: 'var(--scada-card-hover, rgba(30, 41, 59, 0.4))', border: '1px solid var(--scada-border, rgba(255,255,255,0.08))' }}>
                    <span className="text-secondary fw-bold fs-9 uppercase">Power Factor</span>
                    <span className="fw-bold" style={{ color: pColor }}>{room.pf.toFixed(3)}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default LTOverview;
