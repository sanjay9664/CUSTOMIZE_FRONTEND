import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Badge, Table, Form, InputGroup } from 'react-bootstrap';
import {
  Zap, Activity, Power, ShieldAlert, Thermometer,
  Gauge, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Radio, LayoutDashboard,
  Search, Filter, ArrowDownRight, ArrowUpRight, TrendingUp, Layers
} from 'lucide-react';
import HierarchySelector from '../../components/HierarchySelector';

const LTOverview = () => {
  const [time, setTime] = useState(new Date());
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'overview', 'breakers', 'feeders', 'rooms'
  const [searchBreaker, setSearchBreaker] = useState('');

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

  const [breakers, setBreakers] = useState([
    { id: 'BRK-001', location: 'LT Room 1', type: 'ACB', rating: '1200A', load: 85, spring: 'Charged', trips: 0, status: 'ON' },
    { id: 'BRK-002', location: 'LT Room 1', type: 'ACB', rating: '1200A', load: 45, spring: 'Charged', trips: 1, status: 'ON' },
    { id: 'BRK-003', location: 'LT Room 1', type: 'MCCB', rating: '400A', load: 0, spring: 'Discharged', trips: 3, status: 'TRIP' },
    { id: 'BRK-004', location: 'LT Room 2', type: 'MCCB', rating: '630A', load: 92, spring: 'Charged', trips: 0, status: 'ON' },
    { id: 'BRK-005', location: 'LT Room 2', type: 'MCCB', rating: '250A', load: 0, spring: 'Discharged', trips: 0, status: 'OFF' },
    { id: 'BRK-006', location: 'LT Room 3', type: 'ACB', rating: '2000A', load: 60, spring: 'Charged', trips: 0, status: 'ON' },
    { id: 'BRK-007', location: 'LT Room 3', type: 'MCCB', rating: '800A', load: 78, spring: 'Charged', trips: 2, status: 'ON' }
  ]);

  const [incomers, setIncomers] = useState([
    { id: 'INC-1', name: 'Main Transformer Incomer', voltage: 415, current: 850, kw: 600, pf: 0.99, status: 'Healthy' },
    { id: 'INC-2', name: 'DG Backup Incomer', voltage: 0, current: 0, kw: 0, pf: 0.0, status: 'Standby' }
  ]);

  const [outgoers, setOutgoers] = useState([
    { id: 'OUT-1', dest: 'HVAC Plant', current: 350, kw: 250, pf: 0.95, status: 'Active' },
    { id: 'OUT-2', dest: 'Lighting DBs', current: 120, kw: 85, pf: 0.98, status: 'Active' },
    { id: 'OUT-3', dest: 'Server Farm', current: 200, kw: 140, pf: 0.99, status: 'Active' },
    { id: 'OUT-4', dest: 'Pumps & Motors', current: 180, kw: 120, pf: 0.92, status: 'Active' }
  ]);

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
      setBreakers(prev => prev.map(b => b.status === 'ON' ? {
        ...b,
        load: Math.min(100, Math.max(0, b.load + (Math.random() * 4 - 2)))
      } : b));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const filteredBreakers = breakers.filter(b => 
    b.id.toLowerCase().includes(searchBreaker.toLowerCase()) || 
    b.location.toLowerCase().includes(searchBreaker.toLowerCase())
  );

  return (
    <div className="fade-in p-3 h-100 d-flex flex-column" style={{ background: 'var(--scada-bg)', color: 'var(--scada-text)', minHeight: '100vh' }}>
      <HierarchySelector
        moduleTitle="LT PANEL"
        accentColor="#fbbf24"
        deviceCategory="LT_PANEL"
        assetType="LT_ROOM"
        deviceLabel="LT PANEL"
        deviceBasePath="/lt-panel/device"
        icon={<LayoutDashboard size={13} />}
        onDeviceSelect={(dev) => setSelectedDevice(dev)}
      />
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
            <Activity className="me-2 text-warning" size={26} style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.8))' }} />
            LT Panel Master Command Page
          </h2>
          <p className="text-secondary fs-8 mb-0 uppercase tracking-widest">Unified Low Tension Switchgear, Breakers & Feeders Monitoring</p>
        </div>

        <Badge bg="warning" text="dark" className="px-3 py-2 font-monospace rounded-pill shadow-sm d-none d-md-block" style={{ fontSize: '0.74rem' }}>
          SYSTEM HEALTH: 99.6% EXCELLENT
        </Badge>
      </div>

      {/* VIEW TABS BAR */}
      <div className="d-flex align-items-center gap-2 mb-4 p-1 rounded-3" style={{ background: 'var(--scada-card, rgba(30, 41, 59, 0.5))', border: '1px solid var(--scada-border, rgba(255,255,255,0.08))' }}>
        {[
          { key: 'all', label: 'All Views Unified', icon: <Layers size={14} /> },
          { key: 'overview', label: 'Overview & Telemetry', icon: <LayoutDashboard size={14} /> },
          { key: 'breakers', label: 'Breaker Diagnostics', icon: <Power size={14} /> },
          { key: 'feeders', label: 'Incoming & Outgoing Feeders', icon: <TrendingUp size={14} /> },
          { key: 'rooms', label: 'LT Rooms Breakdown', icon: <Zap size={14} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-2 fw-bold font-monospace fs-9 uppercase transition-all ${
              activeTab === tab.key 
                ? 'btn-warning text-dark shadow-sm' 
                : 'text-secondary border-0 bg-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── UNIFIED SIDE-BY-SIDE SPLIT SECTION (OVERVIEW & TELEMETRY) ────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'overview') && (
        <Row className="g-4 mb-4">
          {/* LEFT COLUMN: LARGE FULL-WIDTH LT PANEL VISUAL EQUIPMENT & SPECS */}
          <Col xl={6} lg={6} md={12}>
            <Card className="border-0 overflow-hidden h-100 shadow-lg" style={{ background: 'var(--scada-card, #0f172a)', border: '1px solid var(--scada-border, rgba(255,255,255,0.1))', borderRadius: '18px' }}>
              <div className="position-relative overflow-hidden w-100 p-2.5 d-flex align-items-center justify-content-center" style={{ background: 'var(--scada-card, #0f172a)' }}>
                <img
                  src="/images/lt_panel_card.jpg"
                  alt="LT Panel Switchgear Equipment"
                  className="w-100 rounded-3 shadow-md"
                  style={{ objectFit: 'contain', width: '100%', height: 'auto', maxHeight: '440px', filter: 'brightness(1.05) contrast(1.08)' }}
                />
              </div>

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

          {/* RIGHT COLUMN: TELEMETRY DASHBOARD */}
          <Col xl={6} lg={6} md={12}>
            <div className="d-flex flex-column gap-3 h-100 justify-content-between">
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
      )}

      {/* ── BREAKER DIAGNOSTICS SECTION ────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'breakers') && (
        <div className="mb-5">
          <h5 className="fw-bold text-uppercase fs-6 mb-3 d-flex align-items-center" style={{ color: 'var(--scada-text, #ffffff)' }}>
            <Power className="me-2 text-danger" size={20} />
            Breaker Protection & Diagnostics Matrix
          </h5>
          <Card className="border-0 overflow-hidden shadow-lg" style={{ background: 'var(--scada-card, #0f172a)', borderRadius: '16px', border: '1px solid var(--scada-border, rgba(255,255,255,0.08))' }}>
            <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex justify-content-between align-items-center bg-black bg-opacity-30">
              <InputGroup style={{ maxWidth: '320px' }}>
                <InputGroup.Text className="bg-transparent border-secondary border-opacity-25 text-secondary">
                  <Search size={15} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search Breaker ID or Location..."
                  value={searchBreaker}
                  onChange={(e) => setSearchBreaker(e.target.value)}
                  className="bg-transparent border-secondary border-opacity-25 text-white shadow-none fs-8"
                />
              </InputGroup>
              <Badge bg="dark" className="border border-secondary border-opacity-25 font-monospace text-warning px-3 py-2">
                TOTAL BREAKERS: {breakers.length}
              </Badge>
            </div>
            <div className="table-responsive">
              <Table hover variant="dark" className="mb-0 align-middle" style={{ backgroundColor: 'transparent' }}>
                <thead style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <tr>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 px-4 border-bottom-0">Breaker ID</th>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 border-bottom-0">Location</th>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 border-bottom-0">Type & Rating</th>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 border-bottom-0">Current Load</th>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 border-bottom-0">Spring Charge</th>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 border-bottom-0 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBreakers.map(b => (
                    <tr key={b.id}>
                      <td className="px-4 py-3"><span className="fw-bold font-monospace text-info">{b.id}</span></td>
                      <td className="py-3 fw-bold text-white fs-9">{b.location}</td>
                      <td className="py-3 font-monospace text-secondary fs-9">{b.type} ({b.rating})</td>
                      <td className="py-3 font-monospace">
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar now={b.load} variant={b.load > 85 ? 'danger' : 'info'} style={{ width: '80px', height: '6px' }} />
                          <span className="fw-bold fs-9 text-white">{b.load}%</span>
                        </div>
                      </td>
                      <td className="py-3 font-monospace fs-9">
                        <Badge bg={b.spring === 'Charged' ? 'success' : 'secondary'} className="bg-opacity-25 text-white">
                          {b.spring}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <Badge bg={b.status === 'ON' ? 'success' : b.status === 'TRIP' ? 'danger' : 'secondary'} className="px-3 py-1 font-monospace">
                          {b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* ── INCOMING & OUTGOING FEEDERS SECTION ────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'feeders') && (
        <div className="mb-5">
          <h5 className="fw-bold text-uppercase fs-6 mb-3 d-flex align-items-center" style={{ color: 'var(--scada-text, #ffffff)' }}>
            <TrendingUp className="me-2 text-info" size={20} />
            Incoming & Outgoing Feeders Distribution
          </h5>

          {/* INCOMERS */}
          <Row className="g-4 mb-4">
            {incomers.map(inc => (
              <Col xl={6} key={inc.id}>
                <Card className="border-0 h-100 shadow-sm" style={{ background: 'var(--scada-card, #0f172a)', borderRadius: '16px', border: '1px solid var(--scada-border, rgba(255,255,255,0.08))' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom border-secondary border-opacity-25">
                      <div>
                        <h6 className="fw-bold text-uppercase m-0 text-white">{inc.name}</h6>
                        <small className="text-secondary font-monospace fw-bold fs-10 uppercase">{inc.id}</small>
                      </div>
                      <Badge bg={inc.status === 'Healthy' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill fs-9 text-uppercase">
                        {inc.status}
                      </Badge>
                    </div>
                    
                    <Row className="g-3 text-center font-monospace">
                      <Col xs={4}>
                        <div className="p-2.5 rounded-3 bg-black bg-opacity-30 border border-secondary border-opacity-25">
                          <span className="text-secondary fw-bold uppercase d-block mb-1 fs-11">Current</span>
                          <span className="fw-bold text-info fs-5">{inc.current.toFixed(1)} <small className="fs-9 text-muted">A</small></span>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-2.5 rounded-3 bg-black bg-opacity-30 border border-secondary border-opacity-25">
                          <span className="text-secondary fw-bold uppercase d-block mb-1 fs-11">Active Power</span>
                          <span className="fw-bold text-warning fs-5">{inc.kw.toFixed(1)} <small className="fs-9 text-muted">kW</small></span>
                        </div>
                      </Col>
                      <Col xs={4}>
                        <div className="p-2.5 rounded-3 bg-black bg-opacity-30 border border-secondary border-opacity-25">
                          <span className="text-secondary fw-bold uppercase d-block mb-1 fs-11">P. Factor</span>
                          <span className="fw-bold text-success fs-5">{inc.pf.toFixed(2)}</span>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* OUTGOING FEEDERS MATRIX */}
          <Card className="border-0 overflow-hidden shadow-sm" style={{ background: 'var(--scada-card, #0f172a)', borderRadius: '16px', border: '1px solid var(--scada-border, rgba(255,255,255,0.08))' }}>
            <div className="table-responsive">
              <Table hover variant="dark" className="mb-0 align-middle" style={{ backgroundColor: 'transparent' }}>
                <thead style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <tr>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 px-4 border-bottom-0">Feeder ID</th>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 border-bottom-0">Destination</th>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 text-end border-bottom-0">Current (A)</th>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 text-end border-bottom-0">Power (kW)</th>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 text-end border-bottom-0">Power Factor</th>
                    <th className="text-secondary text-uppercase fs-10 tracking-widest fw-bold py-3 text-center border-bottom-0">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoers.map(out => (
                    <tr key={out.id}>
                      <td className="px-4 py-3"><span className="fw-bold font-monospace text-info">{out.id}</span></td>
                      <td className="py-3 fw-bold text-white fs-9">{out.dest}</td>
                      <td className="py-3 text-end font-monospace text-info fw-bold">{out.current.toFixed(1)}</td>
                      <td className="py-3 text-end font-monospace text-warning fw-bold">{out.kw.toFixed(1)}</td>
                      <td className="py-3 text-end font-monospace text-success fw-bold">{out.pf.toFixed(2)}</td>
                      <td className="py-3 text-center">
                        <Badge bg="success" className="px-3 py-1 font-monospace">
                          {out.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* ── ROOM COMPARISON & PERFORMANCE SECTION ────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'rooms') && (
        <div>
          <h5 className="fw-bold text-uppercase fs-6 mb-3 d-flex align-items-center" style={{ color: 'var(--scada-text, #ffffff)' }}>
            <Zap className="me-2 text-warning" size={20} />
            Sub-Station & LT Rooms Performance Breakdown
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
      )}
    </div>
  );
};

export default LTOverview;
