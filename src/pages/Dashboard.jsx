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

const Dashboard = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

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

  // ── HERO CAROUSEL DATA ──────────────────────────────────────────────────
  const carouselSlides = [
    {
      image: '/cooling_tower.png',
      title: 'Cooling Tower System',
      subtitle: 'Real-time monitoring of cooling tower performance, fan speed & water temperature',
      color: '#06b6d4',
      icon: <Wind size={22} />,
      route: '/hvac/cooling-tower',
      stats: [
        { label: 'Fan Speed', value: '48 Hz' },
        { label: 'Return Temp', value: '28.0°C' },
        { label: 'Water Flow', value: '450 LPM' }
      ]
    },
    {
      image: '/dg_set.png',
      title: 'DG Power System',
      subtitle: 'Diesel generator monitoring with real-time load, fuel level & auto-start control',
      color: '#f59e0b',
      icon: <Zap size={22} />,
      route: '/dg-set/overview',
      stats: [
        { label: 'DG Status', value: 'ON (Auto)' },
        { label: 'Load', value: '68%' },
        { label: 'Fuel Level', value: '78%' }
      ]
    },
    {
      image: '/chiller.png',
      title: 'Chiller Plant System',
      subtitle: 'Central chiller plant with COP monitoring, chilled water supply & condenser control',
      color: '#38bdf8',
      icon: <Thermometer size={22} />,
      route: '/hvac/chiller',
      stats: [
        { label: 'Chillers', value: '2/2 ON' },
        { label: 'COP Rate', value: '5.8' },
        { label: 'Total Load', value: '486 kW' }
      ]
    },
    {
      image: '/ahu_v3.png',
      title: 'AHU System',
      subtitle: 'Air handling unit control with supply air temp, filter status & VFD drive monitoring',
      color: '#14b8a6',
      icon: <Wind size={22} />,
      route: '/hvac/ahu',
      stats: [
        { label: 'Supply Air', value: '16.0°C' },
        { label: 'Return Air', value: '24.2°C' },
        { label: 'Airflow', value: '12.5k CFM' }
      ]
    },
    {
      image: '/images/fire_pump_scada.png',
      title: 'Fire Safety System',
      subtitle: 'Fire pump status, header pressure monitoring & jockey pump auto control',
      color: '#ef4444',
      icon: <ShieldAlert size={22} />,
      route: '/fire-pumps/overview',
      stats: [
        { label: 'Fire Pump', value: 'ON' },
        { label: 'Jockey', value: 'ON' },
        { label: 'Pressure', value: '8.5 bar' }
      ]
    },
    {
      image: '/images/transformer_scada.png',
      title: 'Transformer Unit',
      subtitle: 'High voltage transformer with oil temperature, load percentage & winding analysis',
      color: '#a855f7',
      icon: <Cpu size={22} />,
      route: '/transformer/overview',
      stats: [
        { label: 'Primary', value: '11 kV' },
        { label: 'Oil Temp', value: '42.5°C' },
        { label: 'Load', value: '78%' }
      ]
    },
    {
      image: '/images/motor_pump_scada.png',
      title: 'Motors & Pumps',
      subtitle: 'Motor & pump control with VFD status, current draw & vibration analytics',
      color: '#38bdf8',
      icon: <Activity size={22} />,
      route: '/motors/overview',
      stats: [
        { label: 'Total', value: '4' },
        { label: 'Running', value: '3' },
        { label: 'Fault', value: '0' }
      ]
    },
    {
      image: '/images/bms_water_management_ui_1789023000792.png',
      title: 'Water Management',
      subtitle: 'Tank level monitoring, pump control & water flow rate analytics',
      color: '#06b6d4',
      icon: <Droplets size={22} />,
      route: '/water-management/overview',
      stats: [
        { label: 'UG Tank', value: '72%' },
        { label: 'OHT Tank', value: '64%' },
        { label: 'Flow Rate', value: '12.5 m³/h' }
      ]
    }
  ];

  // ── CAROUSEL STATE & HANDLERS ───────────────────────────────────────────
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [carouselTransitioning, setCarouselTransitioning] = useState(false);

  const goToSlide = useCallback((idx) => {
    setCarouselTransitioning(true);
    setTimeout(() => {
      setCarouselIndex(idx);
      setTimeout(() => setCarouselTransitioning(false), 50);
    }, 300);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((carouselIndex + 1) % carouselSlides.length);
  }, [carouselIndex, carouselSlides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(carouselIndex === 0 ? carouselSlides.length - 1 : carouselIndex - 1);
  }, [carouselIndex, carouselSlides.length, goToSlide]);

  // Auto-slide every 5s
  useEffect(() => {
    if (carouselPaused) return;
    const autoSlide = setInterval(() => {
      setCarouselTransitioning(true);
      setTimeout(() => {
        setCarouselIndex(prev => (prev + 1) % carouselSlides.length);
        setTimeout(() => setCarouselTransitioning(false), 50);
      }, 300);
    }, 5000);
    return () => clearInterval(autoSlide);
  }, [carouselPaused, carouselSlides.length]);

  const currentSlide = carouselSlides[carouselIndex];

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
        { label: 'Total Cons.', val: '1,245 kWh', icon: <Zap size={14} className="text-amber-400" /> },
        { label: 'Today', val: '320 kWh', icon: <BarChart3 size={14} className="text-amber-400" /> },
        { label: 'Cost', val: '₹ 1,980', icon: <CreditCard size={14} className="text-emerald-400" /> }
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
        { label: 'Fan Status', val: 'ON (48Hz)', icon: <Fan size={14} className="text-cyan-400" /> },
        { label: 'Return Temp', val: '28.0 °C', icon: <Thermometer size={14} className="text-sky-400" /> },
        { label: 'Water Flow', val: '450 LPM', icon: <Droplets size={14} className="text-cyan-400" /> }
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
        { label: 'DG-1', val: 'ON (Auto)', icon: <Power size={14} className="text-amber-400" /> },
        { label: 'Load', val: '68%', icon: <BarChart3 size={14} className="text-amber-400" /> },
        { label: 'Fuel Level', val: '78%', icon: <Zap size={14} className="text-amber-400" /> }
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
        { label: 'Total Lifts', val: '4', icon: <Activity size={14} className="text-sky-400" /> },
        { label: 'Running', val: '3', icon: <CheckCircle2 size={14} className="text-emerald-400" /> },
        { label: 'Fault', val: '0', icon: <AlertCircle size={14} className="text-emerald-400" /> }
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
        { label: 'Chiller', val: '2/2 ON', icon: <Fan size={14} className="text-cyan-400" /> },
        { label: 'COP Rate', val: '5.8', icon: <TrendingUp size={14} className="text-emerald-400" /> },
        { label: 'Total Load', val: '486 kW', icon: <BarChart3 size={14} className="text-cyan-400" /> }
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
        { label: 'Supply Air', val: '16.0 °C', icon: <Thermometer size={14} className="text-cyan-400" /> },
        { label: 'Return Air', val: '24.2 °C', icon: <ThermometerSun size={14} className="text-sky-400" /> },
        { label: 'Airflow', val: '12.5k CFM', icon: <Wind size={14} className="text-teal-400" /> }
      ]
    },
    {
      key: 'water',
      title: 'Water Management',
      icon: <Droplets size={18} />,
      color: '#06b6d4',
      status: 'Online',
      image: '/images/bms_water_management_ui_1789023000792.png',
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
        { label: 'UG Tank', val: '72%', icon: <Droplets size={14} className="text-cyan-400" /> },
        { label: 'OHT Tank', val: '64%', icon: <Droplets size={14} className="text-cyan-400" /> },
        { label: 'Flow Rate', val: '12.5 m³/h', icon: <RefreshCw size={14} className="text-teal-400" /> }
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
        { label: 'Primary', val: '11 kV', icon: <Zap size={14} className="text-purple-400" /> },
        { label: 'Oil Temp', val: '42.5°C', icon: <ThermometerSun size={14} className="text-amber-400" /> },
        { label: 'Load', val: '78%', icon: <BarChart3 size={14} className="text-purple-400" /> }
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
        { label: 'Fire Pump', val: 'ON', icon: <Flame size={14} className="text-red-400" /> },
        { label: 'Jockey Pump', val: 'ON', icon: <Activity size={14} className="text-red-400" /> },
        { label: 'Pressure', val: '8.5 bar', icon: <Gauge size={14} className="text-rose-400" /> }
      ]
    },
    {
      key: 'ltPanel',
      title: 'Electrical Distribution',
      icon: <LayoutDashboard size={18} />,
      color: '#10b981',
      status: 'Online',
      image: '/images/bms_power_grid_ui_1789023019864.png',
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
        { label: 'Main Incomer', val: 'ON', icon: <Power size={14} className="text-emerald-400" /> },
        { label: 'Total Load', val: '320 kW', icon: <BarChart3 size={14} className="text-emerald-400" /> },
        { label: 'PF', val: '0.96', icon: <Zap size={14} className="text-teal-400" /> }
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
        { label: 'CHW Temp', val: '6.5°C', icon: <Snowflake size={14} className="text-teal-400" /> },
        { label: 'RHW Temp', val: '11.8°C', icon: <ThermometerSun size={14} className="text-amber-400" /> },
        { label: 'Flow', val: '85 m³/h', icon: <Wind size={14} className="text-teal-400" /> }
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
        { label: 'Temperature', val: '24.5°C', icon: <Thermometer size={14} className="text-emerald-400" /> },
        { label: 'Humidity', val: '56%', icon: <Droplets size={14} className="text-cyan-400" /> },
        { label: 'CO₂', val: '620 ppm', icon: <Leaf size={14} className="text-emerald-400" /> }
      ]
    },
    {
      key: 'dailyDPR',
      title: 'Battery Backup (UPS)',
      icon: <BatteryCharging size={18} />,
      color: '#06b6d4',
      status: 'Online',
      image: '/images/bms_power_grid_ui_1789023019864.png',
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
        { label: 'Load', val: '35%', icon: <BarChart3 size={14} className="text-cyan-400" /> },
        { label: 'Battery', val: '92%', icon: <BatteryCharging size={14} className="text-emerald-400" /> },
        { label: 'Runtime', val: '1h 45m', icon: <Clock size={14} className="text-cyan-400" /> }
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
        { label: 'Critical', val: '0', icon: <AlertCircle size={14} className="text-emerald-400" /> },
        { label: 'Warnings', val: '2', icon: <AlertTriangle size={14} className="text-amber-400" /> },
        { label: 'Status', val: 'Normal', icon: <CheckCircle2 size={14} className="text-emerald-400" /> }
      ]
    }
  ];

  return (
    <div className="reference-scada-dashboard p-3">
      {/* ── HERO CAROUSEL BANNER ──────────────────────────────────────── */}
      <div
        className="hero-carousel-wrapper position-relative mb-3 rounded-4 overflow-hidden"
        onMouseEnter={() => setCarouselPaused(true)}
        onMouseLeave={() => setCarouselPaused(false)}
        style={{
          height: '390px',
          border: `1px solid ${currentSlide.color}40`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 24px ${currentSlide.color}20`,
          transition: 'border-color 0.5s ease, box-shadow 0.5s ease'
        }}
      >
        {/* Background Image with Crossfade */}
        <div
          className="position-absolute inset-0 hero-carousel-bg"
          style={{
            backgroundImage: `url(${currentSlide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'opacity 0.5s ease-in-out',
            opacity: carouselTransitioning ? 0 : 1
          }}
        />

        {/* Dark / Light Responsive Gradient Overlay */}
        <div
          className="position-absolute inset-0 hero-gradient-overlay"
          style={{
            zIndex: 1
          }}
        />

        {/* Accent Color Glow */}
        <div
          className="position-absolute"
          style={{
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${currentSlide.color}18 0%, transparent 70%)`,
            zIndex: 1,
            transition: 'background 0.5s ease'
          }}
        />

        {/* Top Accent Bar */}
        <div
          className="position-absolute top-0 start-0 w-100"
          style={{
            height: '3px',
            background: `linear-gradient(90deg, transparent 0%, ${currentSlide.color} 30%, ${currentSlide.color} 70%, transparent 100%)`,
            zIndex: 3,
            transition: 'background 0.5s ease'
          }}
        />

        {/* Progress Bar */}
        <div className="position-absolute bottom-0 start-0 w-100" style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', zIndex: 3 }}>
          <div
            style={{
              height: '100%',
              backgroundColor: currentSlide.color,
              width: carouselPaused ? `${((carouselIndex + 1) / carouselSlides.length) * 100}%` : '0%',
              animation: carouselPaused ? 'none' : 'carouselProgress 5s linear infinite',
              boxShadow: `0 0 8px ${currentSlide.color}`,
              transition: 'background-color 0.5s ease'
            }}
          />
        </div>

        {/* Content */}
        <div
          className="position-relative h-100 d-flex align-items-center"
          style={{
            zIndex: 2,
            paddingLeft: '68px',
            paddingRight: '68px',
            opacity: carouselTransitioning ? 0 : 1,
            transform: carouselTransitioning ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 0.35s ease, transform 0.35s ease'
          }}
        >
          <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between w-100 gap-3">
            {/* Left: Text Content */}
            <div className="flex-grow-1" style={{ maxWidth: '520px' }}>
              {/* Badge */}
              <div
                className="hero-live-badge d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2.5"
                style={{
                  backgroundColor: `${currentSlide.color}18`,
                  border: `1px solid ${currentSlide.color}50`
                }}
              >
                <span className="badge-icon flex-shrink-0" style={{ color: currentSlide.color }}>{currentSlide.icon}</span>
                <span className="badge-text fw-bold font-monospace text-uppercase" style={{ fontSize: '0.68rem', color: currentSlide.color, letterSpacing: '0.8px' }}>
                  Live System
                </span>
                <span className="status-dot-pulse flex-shrink-0" style={{ backgroundColor: '#0f766e', width: '6px', height: '6px' }}></span>
              </div>

              {/* Title */}
              <h2 className="hero-carousel-title fw-bold mb-2" style={{ fontSize: '26px', letterSpacing: '-0.4px', lineHeight: '1.25' }}>
                {currentSlide.title}
              </h2>

              {/* Subtitle */}
              <p className="hero-carousel-subtitle mb-3" style={{ fontSize: '14px', lineHeight: '1.5', maxWidth: '480px' }}>
                {currentSlide.subtitle}
              </p>

              {/* Stats Row */}
              <div className="d-flex gap-2 flex-wrap">
                {currentSlide.stats.map((stat, sIdx) => (
                  <div
                    key={sIdx}
                    className="px-3 py-1.5 rounded-3 d-flex flex-column hero-stat-card"
                    style={{
                      backgroundColor: 'rgba(10, 18, 38, 0.85)',
                      border: `1px solid ${currentSlide.color}30`,
                      minWidth: '100px'
                    }}
                  >
                    <small className="hero-stat-label fw-semibold text-uppercase" style={{ fontSize: '0.58rem', letterSpacing: '0.5px' }}>
                      {stat.label}
                    </small>
                    <span className="hero-stat-val fw-extrabold font-monospace" style={{ fontSize: '0.85rem' }}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: View Button & Counter */}
            <div className="d-flex flex-column align-items-end gap-2.5 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(currentSlide.route); }}
                className="hero-action-btn d-flex align-items-center gap-2 px-3.5 py-2.5 rounded-3 border-0 fw-bold cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${currentSlide.color} 0%, ${currentSlide.color}dd 100%)`,
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  transition: 'all 0.22s ease',
                  boxShadow: `0 2px 10px ${currentSlide.color}40`
                }}
              >
                <Eye size={15} />
                View System
                <ArrowUpRight size={14} />
              </button>

              {/* Slide Counter */}
              <span className="hero-carousel-counter font-monospace fw-medium" style={{ fontSize: '13px' }}>
                {String(carouselIndex + 1).padStart(2, '0')} / {String(carouselSlides.length).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          className="carousel-nav-btn position-absolute d-flex align-items-center justify-content-center border-0"
          style={{
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(10, 18, 38, 0.85)',
            color: '#e2e8f0',
            zIndex: 10,
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease'
          }}
        >
          <ChevronLeft size={17} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          className="carousel-nav-btn position-absolute d-flex align-items-center justify-content-center border-0"
          style={{
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(10, 18, 38, 0.85)',
            color: '#e2e8f0',
            zIndex: 10,
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease'
          }}
        >
          <ChevronRight size={17} />
        </button>

        {/* Dot Indicators */}
        <div
          className="position-absolute d-flex align-items-center gap-1.5"
          style={{ bottom: '14px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
        >
          {carouselSlides.map((_, dIdx) => (
            <button
              key={dIdx}
              onClick={(e) => { e.stopPropagation(); goToSlide(dIdx); }}
              className="border-0 p-0 d-block"
              style={{
                width: dIdx === carouselIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: dIdx === carouselIndex ? currentSlide.color : 'rgba(255,255,255,0.25)',
                cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: dIdx === carouselIndex ? `0 0 8px ${currentSlide.color}80` : 'none'
              }}
            />
          ))}
        </div>
      </div>

      {/* ── 3-COLUMN SCADA CARDS GRID (MATCHING REFERENCE MOCKUP EXACTLY) ───── */}
      <Row className="g-3">
        {servicesList.map((svc) => (
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
                ) : (
                  <img src={svc.image} alt={svc.title} className="card-banner-img" />
                )}

                {/* Animated Spinning Fan Overlay for Cooling Tower (Scaled to fit strictly inside the circular fan ring) */}
                {svc.isCoolingTower && (
                  <div style={{
                    position: 'absolute',
                    top: '24.2%',
                    left: '50.2%',
                    transform: 'translate(-50%, -50%) rotateX(60deg)',
                    width: '32.5%',
                    aspectRatio: '1/1',
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
                <div className="px-3 py-2 border-bottom card-submenu-bar d-flex align-items-center flex-wrap" style={{ gap: '6px' }}>
                  {svc.submenus.map((sub, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(sub.route);
                      }}
                      className="submenu-chip-btn rounded-2 transition-all border d-inline-flex align-items-center cursor-pointer"
                      style={{
                        borderColor: `${svc.color}45`,
                        fontSize: '0.67rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        lineHeight: 1.25,
                        margin: '2px 2px'
                      }}
                    >
                      <span className="dot-indicator flex-shrink-0" style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: svc.color, marginRight: '4px' }}></span>
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Card Bottom Strip: Left 3 Metric Pills with Colored Icons + Right Circular Radial Gauge */}
              <Card.Body className="p-3 pt-2.5 d-flex align-items-center justify-content-between flex-grow-1">
                {/* Left: 3 Metric Items Grid */}
                <div className="flex-grow-1 row g-1.5 align-items-center me-1">
                  {svc.metrics.map((m, idx) => (
                    <div key={idx} className="col-4">
                      <div
                        className="p-2 rounded-2 metric-box-glass border d-flex flex-column align-items-center justify-content-center text-center"
                        style={{ borderColor: `${svc.color}35` }}
                      >
                        <div className="d-flex align-items-center justify-content-center gap-1.5 text-truncate mb-1 w-100">
                          <span className="flex-shrink-0 d-inline-flex align-items-center justify-content-center" style={{ color: svc.color }}>{m.icon}</span>
                          <small className="metric-box-label text-truncate uppercase fw-bold mb-0">
                            {m.label}
                          </small>
                        </div>
                        <span className="metric-box-val fw-black font-monospace text-truncate d-block w-100">
                          {m.val}
                        </span>
                      </div>
                    </div>
                  ))}
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
        @keyframes dashboardSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
          min-height: 580px;
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
          height: 480px;
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
