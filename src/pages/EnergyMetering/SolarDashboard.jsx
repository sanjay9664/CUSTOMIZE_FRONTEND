import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Container } from 'react-bootstrap';
import { Sun, Battery, BatteryCharging, UtilityPole, PlugZap, Zap, RefreshCw, Download, CloudRain, Wind, Droplets, Activity, Clock, History, Server, Building2, Lightbulb, MoreVertical, Thermometer } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from 'recharts';

// --- MOCK DATA GENERATORS ---
const generatePowerMetrics = () => {
  const data = [];
  let soc = 100;
  for (let i = 0; i < 24; i++) {
    const time = `${i.toString().padStart(2, '0')}:00`;
    const production = (i > 6 && i < 18) ? Math.max(0, Math.sin((i - 6) * Math.PI / 12) * 3500 + (Math.random() * 500)) : 0;
    const load = 500 + Math.random() * 1000 + (i > 18 && i < 22 ? 2000 : 0);
    let battery = 0;
    let grid = 0;
    if (production > load) {
       if (soc < 100) { battery = -(production - load); soc += 2; } 
       else { grid = -(production - load); }
    } else {
       if (soc > 20) { battery = (load - production); soc -= 3; } 
       else { grid = (load - production); }
    }
    data.push({ time, soc: Math.max(0, Math.min(100, soc)), production: parseFloat(production.toFixed(0)), battery: parseFloat(battery.toFixed(0)), grid: parseFloat(grid.toFixed(0)), load: parseFloat(load.toFixed(0)) });
  }
  return data;
};

const generateHistory = () => {
  const data = [];
  for (let i = 1; i <= 15; i++) {
    data.push({ date: `Jul ${i}`, pvYield: 15 + Math.random() * 10, load: 10 + Math.random() * 8, battCharge: 5 + Math.random() * 5, battDischarge: 4 + Math.random() * 5 });
  }
  return data;
};

const generateHourly = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const isDay = i > 6 && i < 18;
    const ampm = i < 12 ? 'am' : 'pm';
    const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
    data.push({ time: `${displayHour}${ampm}`, solar: isDay ? parseFloat((Math.random() * 1.5 + 0.5).toFixed(2)) : 0, fromBattery: (!isDay || Math.random() > 0.8) ? parseFloat((Math.random() * 1.0 + 0.2).toFixed(2)) : 0, fromGrid: (!isDay && Math.random() > 0.5) ? parseFloat((Math.random() * 0.5).toFixed(2)) : 0, toBattery: isDay ? -parseFloat((Math.random() * 1.5 + 0.5).toFixed(2)) : 0 });
  }
  return data;
};

const WEATHER_LOCATIONS = {
  'Delhi': { lat: 28.6139, lon: 77.2090, temp: '35°C', weather: 'Clear', hum: '42%', wind: '12 km/h' },
  'Noida': { lat: 28.5355, lon: 77.3910, temp: '36°C', weather: 'Sunny', hum: '40%', wind: '10 km/h' },
  'Ghaziabad': { lat: 28.6692, lon: 77.4538, temp: '35°C', weather: 'Clear', hum: '41%', wind: '11 km/h' },
  'Gurugram': { lat: 28.4595, lon: 77.0266, temp: '37°C', weather: 'Hot', hum: '38%', wind: '14 km/h' },
  'Mumbai': { lat: 19.0760, lon: 72.8777, temp: '31°C', weather: 'Humid', hum: '80%', wind: '18 km/h' }
};

// --- STYLED COMPONENTS & ICONS ---
const DashboardTheme = { bg: '#0a101d', panelBg: '#131b2c', cardBg: '#1b2436', border: '#2c3a50', text: '#e2e8f0', muted: '#94a3b8', accent: '#f97316', green: '#10b981', blue: '#0ea5e9', red: '#ef4444', purple: '#d946ef' };

const RealGridIcon = ({ size = 24, color = "#8b949e" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 22L11 2h2l5 22" />
    <path d="M4 8h16" />
    <path d="M2 14h20" />
    <path d="M12 2v20" />
    <path d="M6 14l6-6 6 6" />
    <path d="M8 22l4-8 4 8" />
  </svg>
);

const RealSolarIcon = ({ size = 24, color = "#facc15" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="4 14 20 14 22 6 2 6 4 14" fill="rgba(250, 204, 21, 0.1)" />
    <line x1="8" y1="14" x2="7" y2="6" /><line x1="12" y1="14" x2="12" y2="6" /><line x1="16" y1="14" x2="17" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M12 14v6" /><path d="M8 20h8" />
  </svg>
);

const RealBatteryIcon = ({ size = 24, color = "#10b981" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2" fill="rgba(16, 185, 129, 0.1)" />
    <path d="M21 10v4" />
    <rect x="5" y="8" width="10" height="8" rx="1" fill={color} stroke="none" />
    <path d="M11 10l-2 3h3l-2 3" stroke="#181a1f" strokeWidth="1.5" />
  </svg>
);

// --- NEW CUSTOM ICONS ---
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
    <circle cx="30" cy="20" r="12" fill="url(#sunGrad)" />
    <path d="M30 2 L30 5 M30 35 L30 38 M12 20 L15 20 M45 20 L48 20 M17 7 L19 9 M43 33 L41 31 M17 33 L19 31 M43 7 L41 9" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="sunGrad" x1="30" y1="8" x2="30" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fde047" />
        <stop offset="1" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="panelGrad" x1="30" y1="25" x2="30" y2="45" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#1e3a8a" />
      </linearGradient>
    </defs>
    <path d="M10 25 L50 25 L55 40 L5 40 Z" fill="url(#panelGrad)" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round"/>
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
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' }}>
    <path d="M6 28 V8 L16 4 V28 M16 12 H26 V28" />
    <path d="M2 28 H28" />
    <rect x="9" y="12" width="2" height="3" fill="#a855f7"/><rect x="9" y="18" width="2" height="3" fill="#a855f7"/><rect x="9" y="24" width="2" height="3" fill="#a855f7"/>
    <rect x="12" y="8" width="2" height="3" fill="#a855f7"/><rect x="12" y="14" width="2" height="3" fill="#a855f7"/><rect x="12" y="20" width="2" height="3" fill="#a855f7"/>
    <rect x="19" y="16" width="2" height="3" fill="#a855f7"/><rect x="19" y="22" width="2" height="3" fill="#a855f7"/>
    <rect x="23" y="16" width="2" height="3" fill="#a855f7"/><rect x="23" y="22" width="2" height="3" fill="#a855f7"/>
  </svg>
);

const ServerIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' }}>
    <rect x="4" y="4" width="22" height="6" rx="1" /><rect x="4" y="12" width="22" height="6" rx="1" /><rect x="4" y="20" width="22" height="6" rx="1" />
    <circle cx="8" cy="7" r="1" fill="#a855f7" /><circle cx="8" cy="15" r="1" fill="#a855f7" /><circle cx="8" cy="23" r="1" fill="#a855f7" />
    <path d="M22 7 H24 M22 15 H24 M22 23 H24" />
  </svg>
);

const DropIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="rgba(168,85,247,0.3)" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' }}>
    <path d="M15 3 C15 3 6 12 6 19 A 9 9 0 0 0 24 19 C24 12 15 3 15 3 Z" />
    <path d="M11 20 A 4 4 0 0 0 15 24" stroke="#fff" strokeWidth="1.5" fill="none" />
  </svg>
);

const LightningIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px rgba(168,85,247,1))' }}>
    <path d="M16 3 L6 16 H15 L14 27 L24 14 H15 L16 3 Z" fill="rgba(168,85,247,0.4)" strokeWidth="2" />
  </svg>
);

const LampIcon = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.8))' }}>
    <path d="M12 28 H22 M17 28 V12 C17 6 12 5 7 5 H3" />
    <path d="M3 3 L9 7 L8 9 H2 Z" fill="rgba(168,85,247,0.3)" />
    <circle cx="5" cy="9" r="2" fill="#fff" stroke="none" style={{ filter: 'drop-shadow(0 0 6px #fff)' }}/>
  </svg>
);

const MiniWave = ({ color }) => (
  <svg width="100%" height="25" viewBox="0 0 200 25" preserveAspectRatio="none" className="mt-2" style={{ overflow: 'hidden' }}>
     <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
           <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
           <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
     </defs>
     <g style={{ animation: 'waveMove 5s linear infinite' }}>
       <path d="M0,15 Q10,5 20,15 T40,15 T60,15 T80,15 T100,15 T120,15 T140,15 T160,15 T180,15 T200,15 T220,15 T240,15 T260,15 L260,30 L0,30 Z" fill={`url(#grad-${color.replace('#','')})`} />
       <path d="M0,15 Q10,5 20,15 T40,15 T60,15 T80,15 T100,15 T120,15 T140,15 T160,15 T180,15 T200,15 T220,15 T240,15 T260,15" fill="none" stroke={color} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
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
     <path d={path} fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.3" markerEnd={`url(#${markerId})`} />
     {flowing && (
       <path d={path} fill="none" stroke={color} strokeWidth="3" strokeDasharray="8 8"
         style={{ filter: `drop-shadow(0 0 5px ${color})`, animation: `dashFlow ${reverse ? 'reverse' : 'normal'} 1.5s linear infinite` }} />
     )}
  </>
)};

const SolarDashboard = () => {
  const [topRightTab, setTopRightTab] = useState('Power Metrics');
  const [bottomRightTab, setBottomRightTab] = useState('BMS');
  const [powerData, setPowerData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2025-07-16');
  const [weatherCity, setWeatherCity] = useState('Delhi');
  
  const [liveNodes, setLiveNodes] = useState({
    grid: 925,
    solar: 925,
    total: 1850,
    loads: [650, 450, 300, 200, 150, 100],
    batterySoc: 62.0,
    batteryV: 53.2,
    batteryA: 28.3,
    gridV: 230.1,
    gridA: 4.02,
    gridHz: 50.0,
    solarV: 312.6,
    solarA: 2.96,
    invEff: 96.5,
    invTemp: 42.3
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveNodes(prev => {
        const fluct = (val, maxDelta) => Math.max(0, val + (Math.random() * maxDelta * 2 - maxDelta));
        const grid = Math.round(fluct(925, 30));
        const solar = Math.round(fluct(925, 30));
        const total = grid + solar;
        const baseLoads = [650, 450, 300, 200, 150, 100];
        const baseTotal = 1850;
        const loads = baseLoads.map(b => Math.round(b * (total / baseTotal)));
        const sum = loads.reduce((a,b)=>a+b, 0);
        loads[5] += (total - sum);

        return {
          grid,
          solar,
          total,
          loads,
          batterySoc: Math.min(100, Math.max(0, parseFloat((prev.batterySoc + (Math.random() * 0.2 - 0.1)).toFixed(1)))),
          batteryV: parseFloat(fluct(53.2, 0.2).toFixed(1)),
          batteryA: parseFloat(fluct(28.3, 0.5).toFixed(1)),
          gridV: parseFloat(fluct(230.1, 1).toFixed(1)),
          gridA: parseFloat(fluct(4.02, 0.1).toFixed(2)),
          gridHz: parseFloat(fluct(50.0, 0.05).toFixed(1)),
          solarV: parseFloat(fluct(312.6, 2).toFixed(1)),
          solarA: parseFloat(fluct(2.96, 0.1).toFixed(2)),
          invEff: parseFloat(fluct(96.5, 0.2).toFixed(1)),
          invTemp: parseFloat(fluct(42.3, 0.5).toFixed(1))
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  const currentCity = WEATHER_LOCATIONS[weatherCity];

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        if (width > 0) {
          const widthScale = width / 1150;
          const availableHeight = window.innerHeight - 120; // Accounts for header and padding
          const heightScale = availableHeight / 700;
          setScale(Math.min(widthScale, heightScale)); // Fits both width and height without scrolling
        }
      }
    };

    const observer = new ResizeObserver(handleResize);
    window.addEventListener('resize', handleResize);
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
      // Trigger once immediately
      handleResize();
    }
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    setPowerData(generatePowerMetrics());
    setHistoryData(generateHistory());
    setHourlyData(generateHourly());
  }, [selectedDate]);

  return (
    <div style={{ background: DashboardTheme.bg, minHeight: '100vh', color: DashboardTheme.text, fontFamily: "'Inter', sans-serif" }}>
       <style>{`
          @keyframes dashFlow { from { stroke-dashoffset: 16; } to { stroke-dashoffset: 0; } }
          @keyframes waveMove { from { transform: translateX(0); } to { transform: translateX(-40px); } }
          .action-hover:hover { opacity: 0.8; }
          ::-webkit-scrollbar { height: 8px; width: 8px; }
          ::-webkit-scrollbar-track { background: ${DashboardTheme.bg}; }
          ::-webkit-scrollbar-thumb { background: ${DashboardTheme.border}; border-radius: 4px; }
       `}</style>

       <Container fluid className="p-4">
          <Row className="g-4">
             {/* LEFT PARTITION: ENERGY METERING OVERVIEW */}
             <Col xl={12} lg={12}>
                <Card className="border-0 shadow-lg h-100" style={{ background: DashboardTheme.panelBg, overflow: 'hidden' }}>
                   <div ref={containerRef} style={{ width: '100%', height: `${700 * scale}px`, position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', top: 0, width: '1150px', height: '700px', transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                         
                         {/* SVG Connecting Lines */}
                         <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                            <FlowLine path="M 300 110 L 340 110 L 340 210 L 380 210" color="#0ea5e9" />
                            <FlowLine path="M 300 330 L 340 330 L 340 240 L 380 240" color="#facc15" />
                            <FlowLine path="M 300 550 L 340 550 L 340 270 L 380 270" color="#10b981" />
                            <FlowLine path="M 510 380 L 510 440" color="#a855f7" />
                            <FlowLine path="M 640 500 L 700 500" color="#d946ef" />
                            <FlowLine path="M 700 58 L 700 608" color="#d946ef" />
                            <FlowLine path="M 700 58 L 750 58" color="#d946ef" />
                            <FlowLine path="M 700 168 L 750 168" color="#d946ef" />
                            <FlowLine path="M 700 278 L 750 278" color="#d946ef" />
                            <FlowLine path="M 700 388 L 750 388" color="#d946ef" />
                            <FlowLine path="M 700 498 L 750 498" color="#d946ef" />
                            <FlowLine path="M 700 608 L 750 608" color="#d946ef" />
                         </svg>

                         {/* COL 1: INPUTS */}
                         <div style={{ position: 'absolute', left: '20px', top: '20px', background: DashboardTheme.cardBg, border: `1px solid ${DashboardTheme.border}`, borderRadius: '12px', padding: '20px', width: '280px', height: '180px', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div className="d-flex w-100">
                               <div className="me-3 d-flex align-items-start justify-content-center" style={{ width: '50px' }}>
                                  <GridIconBig />
                               </div>
                               <div>
                                  <div className="text-white fw-bold mb-1" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>GRID (UTILITY)</div>
                                  <div style={{ color: '#0ea5e9', fontSize: '30px', fontWeight: 'bold', lineHeight: '1.2', transition: 'color 0.3s ease' }}>{liveNodes.grid} W</div>
                                  <div className="text-white fw-bold mt-1" style={{ fontSize: '12px' }}>{liveNodes.gridV} V <span className="text-muted mx-1">|</span> {liveNodes.gridA} A <span className="text-muted mx-1">|</span> {liveNodes.gridHz} Hz</div>
                               </div>
                            </div>
                            <MiniWave color="#0ea5e9" />
                            <div className="d-flex flex-column mt-1">
                               <span className="text-muted" style={{ fontSize: '11px' }}>Today's Energy</span>
                               <span className="text-white fw-bold" style={{ fontSize: '13px' }}>6.35 kWh</span>
                            </div>
                         </div>

                         <div style={{ position: 'absolute', left: '20px', top: '240px', background: DashboardTheme.cardBg, border: `1px solid ${DashboardTheme.border}`, borderRadius: '12px', padding: '20px', width: '280px', height: '180px', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div className="d-flex w-100">
                               <div className="me-3 d-flex align-items-start justify-content-center" style={{ width: '50px' }}>
                                  <SolarIconBig />
                               </div>
                               <div>
                                  <div className="text-white fw-bold mb-1" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>SOLAR (PV)</div>
                                  <div style={{ color: '#facc15', fontSize: '30px', fontWeight: 'bold', lineHeight: '1.2', transition: 'color 0.3s ease' }}>{liveNodes.solar} W</div>
                                  <div className="text-white fw-bold mt-1" style={{ fontSize: '12px' }}>{liveNodes.solarV} V <span className="text-muted mx-1">|</span> {liveNodes.solarA} A</div>
                               </div>
                            </div>
                            <MiniWave color="#facc15" />
                            <div className="d-flex flex-column mt-1">
                               <span className="text-muted" style={{ fontSize: '11px' }}>Today's Energy</span>
                               <span className="text-warning fw-bold" style={{ fontSize: '13px' }}>12.70 kWh</span>
                            </div>
                         </div>

                         <div style={{ position: 'absolute', left: '20px', top: '460px', background: DashboardTheme.cardBg, border: `1px solid ${DashboardTheme.border}`, borderRadius: '12px', padding: '20px', width: '280px', height: '180px', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div className="d-flex w-100">
                               <div className="me-3 d-flex align-items-start justify-content-center" style={{ width: '50px' }}>
                                  <BatteryIconBig />
                               </div>
                               <div>
                                  <div className="text-white fw-bold mb-1" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>BATTERY</div>
                                  <div style={{ color: '#10b981', fontSize: '30px', fontWeight: 'bold', lineHeight: '1.2', transition: 'color 0.3s ease' }}>{liveNodes.batterySoc.toFixed(1)}%</div>
                                  <div className="text-white fw-bold mt-1" style={{ fontSize: '12px' }}>{liveNodes.batteryV} V <span className="text-muted mx-1">|</span> {liveNodes.batteryA} A</div>
                               </div>
                            </div>
                            <div className="w-100 mt-2">
                              <div style={{ background: '#2e3238', height: '8px', borderRadius: '4px', width: '100%', position: 'relative' }}>
                                 <div style={{ background: '#10b981', height: '100%', borderRadius: '4px', width: `${liveNodes.batterySoc}%`, boxShadow: '0 0 8px #10b981', transition: 'width 2s ease-in-out' }}></div>
                              </div>
                              <div className="d-flex justify-content-end text-success fw-bold mt-1" style={{ fontSize: '11px' }}>Charging</div>
                            </div>
                            <div className="d-flex justify-content-between align-items-end mt-1">
                               <span className="text-muted" style={{ fontSize: '11px' }}>Today's Charge</span>
                               <span className="text-white fw-bold" style={{ fontSize: '13px' }}>5.21 kWh</span>
                            </div>
                         </div>

                         {/* COL 2: INVERTER */}
                         <div style={{ position: 'absolute', left: '380px', top: '100px', background: DashboardTheme.cardBg, border: `1px solid ${DashboardTheme.border}`, borderRadius: '16px', padding: '24px 20px', width: '260px', height: '280px', zIndex: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="w-100 d-flex justify-content-center position-relative mb-2">
                               <span className="text-white fw-bold" style={{ fontSize: '16px', letterSpacing: '1px' }}>SOCHIOT</span>
                               <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                               </div>
                            </div>
                            
                            {/* Inverter 3D Image */}
                            <div className="mb-3">
                               <svg width="100" height="90" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }}>
                                 <defs>
                                   <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="100">
                                     <stop offset="0%" stopColor="#e2e8f0" />
                                     <stop offset="100%" stopColor="#cbd5e1" />
                                   </linearGradient>
                                   <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="100">
                                     <stop offset="0%" stopColor="#1e293b" />
                                     <stop offset="100%" stopColor="#0f172a" />
                                   </linearGradient>
                                 </defs>
                                 {/* Main Body */}
                                 <rect x="10" y="10" width="80" height="60" rx="6" fill="url(#bodyGrad)" />
                                 {/* Side bevels */}
                                 <path d="M10 16 L20 10 L80 10 L90 16 L90 70 L10 70 Z" fill="#f8fafc" opacity="0.5" />
                                 <path d="M10 16 L20 10 L20 70 L10 70 Z" fill="#94a3b8" opacity="0.3" />
                                 <path d="M90 16 L80 10 L80 70 L90 70 Z" fill="#475569" opacity="0.2" />
                                 {/* Screen Area */}
                                 <rect x="35" y="30" width="30" height="12" rx="3" fill="#0f172a" />
                                 <rect x="38" y="34" width="8" height="4" rx="1" fill="#10b981" />
                                 <circle cx="60" cy="36" r="1.5" fill="#10b981" />
                                 {/* Bottom Base */}
                                 <path d="M10 70 L90 70 L85 85 L15 85 Z" fill="url(#baseGrad)" />
                                 {/* Feet */}
                                 <rect x="25" y="85" width="8" height="4" rx="1" fill="#475569" />
                                 <rect x="67" y="85" width="8" height="4" rx="1" fill="#475569" />
                               </svg>
                            </div>

                            <div className="text-center w-100" style={{ color: '#10b981', fontSize: '38px', fontWeight: 'bold', textShadow: '0 0 15px rgba(16,185,129,0.4)', transition: 'color 0.3s ease', lineHeight: '1' }}>{liveNodes.total} W</div>
                            
                            <div className="d-flex justify-content-between w-100 mt-4 text-white px-2" style={{ fontSize: '13px' }}>
                               <div className="text-start">
                                  <div className="text-muted mb-1" style={{ fontSize: '11px' }}>Efficiency</div>
                                  <b style={{ fontSize: '15px' }}>{liveNodes.invEff.toFixed(1)} %</b>
                               </div>
                               <div style={{ width: '1px', background: '#2c3a50', height: '30px' }}></div>
                               <div className="text-start" style={{ width: '80px' }}>
                                  <div className="text-muted mb-1" style={{ fontSize: '11px' }}>Temperature</div>
                                  <b style={{ fontSize: '15px' }}>{liveNodes.invTemp.toFixed(1)} °C</b>
                               </div>
                            </div>

                            <svg width="100%" height="30" style={{ position: 'absolute', bottom: 10, left: 0, overflow: 'hidden' }}>
                               <g style={{ animation: 'waveMove 4s linear infinite' }}>
                                 <path d="M 0 15 Q 20 5 40 15 T 80 15 T 120 15 T 160 15 T 200 15 T 240 15 T 280 15 T 320 15 L 320 30 L 0 30 Z" fill="rgba(16,185,129,0.05)" />
                                 <path d="M 0 15 Q 20 5 40 15 T 80 15 T 120 15 T 160 15 T 200 15 T 240 15 T 280 15 T 320 15" fill="none" stroke="#10b981" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.6))' }} />
                               </g>
                            </svg>
                         </div>

                         <div style={{ position: 'absolute', left: '380px', top: '440px', background: DashboardTheme.cardBg, border: `1px solid ${DashboardTheme.border}`, borderRadius: '16px', padding: '24px 20px', width: '260px', height: '140px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="text-center text-white fw-bold mb-2" style={{ fontSize: '14px', letterSpacing: '0.5px' }}>TOTAL OUTPUT</div>
                            <div className="text-center mb-3" style={{ color: '#a855f7', fontSize: '42px', fontWeight: 'bold', textShadow: '0 0 15px rgba(168,85,247,0.4)', transition: 'color 0.3s ease', lineHeight: '1' }}>{liveNodes.total} W</div>
                            <div className="w-100" style={{ height: '1px', background: '#2c3a50', marginBottom: '15px' }}></div>
                            <div className="d-flex justify-content-between w-100 text-muted" style={{ fontSize: '12px' }}>
                               <span>Today's Consumption</span>
                               <span className="text-white fw-bold">14.86 kWh</span>
                            </div>
                         </div>

                         <div style={{ position: 'absolute', left: '655px', top: '465px', color: '#d946ef', fontSize: '10px', fontWeight: 'bold', zIndex: 10 }}>POWER<br/>FLOW</div>

                         {/* COL 3: LOADS */}
                         <div style={{ position: 'absolute', left: '750px', top: '5px', color: '#d946ef', fontSize: '13px', fontWeight: 'bold' }}>OUTGOING (DISTRIBUTION)</div>

                         {[
                            { y: 20, icon: BuildingIcon, title: "COMMERCIAL WING A INCOMER", value: `${liveNodes.loads[0]} W`, pct: ((liveNodes.loads[0]/liveNodes.total)*100).toFixed(1), kw: "5.21" },
                            { y: 130, icon: ServerIcon, title: "DATA CENTER MAIN UPS INPUT", value: `${liveNodes.loads[1]} W`, pct: ((liveNodes.loads[1]/liveNodes.total)*100).toFixed(1), kw: "3.45" },
                            { y: 240, icon: DropIcon, title: "WATER PLANT & UTILITY MOTORS ROOM", value: `${liveNodes.loads[2]} W`, pct: ((liveNodes.loads[2]/liveNodes.total)*100).toFixed(1), kw: "2.87" },
                            { y: 350, icon: LightningIcon, title: "PHASE-NEUTRAL VOLTAGE", value: `${liveNodes.loads[3]} W`, pct: ((liveNodes.loads[3]/liveNodes.total)*100).toFixed(1), kw: "1.52" },
                            { y: 460, icon: LightningIcon, title: "PHASE-NEUTRAL VOLTAGE", value: `${liveNodes.loads[4]} W`, pct: ((liveNodes.loads[4]/liveNodes.total)*100).toFixed(1), kw: "1.09" },
                            { y: 570, icon: LampIcon, title: "OUTDOOR STREET & PARKING LIGHTS", value: `${liveNodes.loads[5]} W`, pct: ((liveNodes.loads[5]/liveNodes.total)*100).toFixed(1), kw: "0.92" }
                         ].map((load, i) => (
                            <div key={i} style={{ position: 'absolute', left: '750px', top: `${load.y}px`, background: DashboardTheme.cardBg, border: `1px solid ${DashboardTheme.border}`, borderRadius: '12px', padding: '12px 15px', width: '380px', height: '75px', display: 'flex', alignItems: 'center', gap: '15px', zIndex: 10 }}>
                               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px' }}>
                                  <load.icon />
                               </div>
                               <div className="flex-grow-1">
                                  <div className="text-white fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>{load.title}</div>
                                  <div style={{ background: '#2e3238', height: '6px', borderRadius: '3px', width: '70%' }}>
                                     <div style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef)', height: '100%', borderRadius: '3px', width: `${load.pct}%`, boxShadow: '0 0 8px rgba(168,85,247,0.6)', transition: 'width 2s ease-in-out' }}></div>
                                  </div>
                               </div>
                               <div className="text-end" style={{ minWidth: '90px' }}>
                                  <div style={{ color: '#d946ef', fontSize: '18px', fontWeight: 'bold' }}>{load.value}</div>
                                  <div className="text-muted mt-1" style={{ fontSize: '11px' }}>{load.pct} %</div>
                                  <div className="text-muted" style={{ fontSize: '10px' }}>Today: {load.kw} kWh</div>
                               </div>
                            </div>
                         ))}

                          <div style={{ position: 'absolute', left: '750px', top: '655px', width: '380px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                             <div><b>Total Outgoing Load</b></div>
                             <div style={{ color: '#d946ef', transition: 'color 0.3s ease' }}><b>{liveNodes.total} W (100%)</b></div>
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
