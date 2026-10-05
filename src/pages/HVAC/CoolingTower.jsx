import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, ProgressBar, Modal } from 'react-bootstrap';
import {
  Activity, Wind, Droplets, Gauge, Zap, AlertTriangle, ShieldCheck,
  CheckCircle2, Clock, Calendar, RefreshCw, Download, Printer,
  Sliders, Power, ChevronRight, Check, FileText, Layers, Wrench,
  Info, Bell, Play, Pause, Flame, ThermometerSnowflake, Search,
  TrendingUp, Database, Compass, Server, Cpu, ArrowRight, Eye, Sparkles,
  Maximize2, Minimize2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, AreaChart, Area
} from 'recharts';
import './CoolingTower.css';

// --- MOCK HISTORICAL PERFORMANCE DATA ---
const PERFORMANCE_DATA = {
  '1H': [
    { time: '10:00', supplyTemp: 32.1, returnTemp: 37.9, ambientWbt: 21.1, efficiency: 86.2, approach: 2.6, waterFlow: 144, power: 12.1 },
    { time: '10:15', supplyTemp: 32.3, returnTemp: 38.0, ambientWbt: 21.2, efficiency: 86.8, approach: 2.5, waterFlow: 145, power: 12.3 },
    { time: '10:30', supplyTemp: 32.5, returnTemp: 38.2, ambientWbt: 21.3, efficiency: 87.4, approach: 2.5, waterFlow: 145, power: 12.4 },
    { time: '10:45', supplyTemp: 32.4, returnTemp: 38.1, ambientWbt: 21.2, efficiency: 87.1, approach: 2.4, waterFlow: 146, power: 12.2 },
    { time: '11:00', supplyTemp: 32.6, returnTemp: 38.3, ambientWbt: 21.4, efficiency: 87.5, approach: 2.5, waterFlow: 145, power: 12.5 },
  ],
  '6H': [
    { time: '05:00', supplyTemp: 30.5, returnTemp: 35.8, ambientWbt: 19.8, efficiency: 84.1, approach: 2.8, waterFlow: 138, power: 10.5 },
    { time: '06:00', supplyTemp: 31.0, returnTemp: 36.4, ambientWbt: 20.2, efficiency: 85.0, approach: 2.7, waterFlow: 140, power: 11.0 },
    { time: '07:00', supplyTemp: 31.8, returnTemp: 37.2, ambientWbt: 20.8, efficiency: 86.1, approach: 2.6, waterFlow: 143, power: 11.8 },
    { time: '08:00', supplyTemp: 32.2, returnTemp: 37.8, ambientWbt: 21.1, efficiency: 87.0, approach: 2.5, waterFlow: 145, power: 12.2 },
    { time: '09:00', supplyTemp: 32.5, returnTemp: 38.2, ambientWbt: 21.3, efficiency: 87.4, approach: 2.5, waterFlow: 145, power: 12.4 },
    { time: '10:00', supplyTemp: 32.6, returnTemp: 38.4, ambientWbt: 21.5, efficiency: 87.6, approach: 2.4, waterFlow: 146, power: 12.6 },
  ],
  '24H': [
    { time: '00:00', supplyTemp: 29.8, returnTemp: 34.6, ambientWbt: 19.2, efficiency: 83.5, approach: 3.0, waterFlow: 132, power: 9.8 },
    { time: '04:00', supplyTemp: 29.5, returnTemp: 34.2, ambientWbt: 18.9, efficiency: 83.2, approach: 3.1, waterFlow: 130, power: 9.4 },
    { time: '08:00', supplyTemp: 31.5, returnTemp: 36.8, ambientWbt: 20.5, efficiency: 85.8, approach: 2.7, waterFlow: 142, power: 11.5 },
    { time: '12:00', supplyTemp: 33.2, returnTemp: 39.1, ambientWbt: 22.0, efficiency: 88.2, approach: 2.4, waterFlow: 148, power: 13.2 },
    { time: '16:00', supplyTemp: 33.0, returnTemp: 38.8, ambientWbt: 21.8, efficiency: 87.9, approach: 2.5, waterFlow: 147, power: 12.9 },
    { time: '20:00', supplyTemp: 31.2, returnTemp: 36.5, ambientWbt: 20.3, efficiency: 85.4, approach: 2.8, waterFlow: 140, power: 11.2 },
  ],
  '7D': [
    { time: 'Mon', supplyTemp: 32.1, returnTemp: 37.8, ambientWbt: 21.0, efficiency: 86.5, approach: 2.6, waterFlow: 144, power: 12.0 },
    { time: 'Tue', supplyTemp: 32.4, returnTemp: 38.1, ambientWbt: 21.2, efficiency: 87.0, approach: 2.5, waterFlow: 145, power: 12.3 },
    { time: 'Wed', supplyTemp: 32.8, returnTemp: 38.5, ambientWbt: 21.6, efficiency: 87.8, approach: 2.4, waterFlow: 146, power: 12.7 },
    { time: 'Thu', supplyTemp: 32.5, returnTemp: 38.2, ambientWbt: 21.3, efficiency: 87.4, approach: 2.5, waterFlow: 145, power: 12.4 },
    { time: 'Fri', supplyTemp: 33.0, returnTemp: 38.9, ambientWbt: 21.8, efficiency: 88.0, approach: 2.4, waterFlow: 148, power: 13.0 },
    { time: 'Sat', supplyTemp: 31.5, returnTemp: 36.8, ambientWbt: 20.4, efficiency: 85.2, approach: 2.8, waterFlow: 138, power: 10.8 },
    { time: 'Sun', supplyTemp: 31.2, returnTemp: 36.4, ambientWbt: 20.1, efficiency: 84.8, approach: 2.9, waterFlow: 135, power: 10.4 },
  ],
  '30D': [
    { time: 'Week 1', supplyTemp: 31.8, returnTemp: 37.2, ambientWbt: 20.7, efficiency: 85.8, approach: 2.7, waterFlow: 141, power: 11.6 },
    { time: 'Week 2', supplyTemp: 32.2, returnTemp: 37.9, ambientWbt: 21.1, efficiency: 86.8, approach: 2.5, waterFlow: 144, power: 12.2 },
    { time: 'Week 3', supplyTemp: 32.7, returnTemp: 38.4, ambientWbt: 21.5, efficiency: 87.6, approach: 2.4, power: 12.6, waterFlow: 146 },
    { time: 'Week 4', supplyTemp: 32.5, returnTemp: 38.2, ambientWbt: 21.3, efficiency: 87.4, approach: 2.5, waterFlow: 145, power: 12.4 },
  ]
};

// --- COMPONENT INSPECTOR DESCRIPTIONS ---
const COMPONENT_DETAILS = {
  HOT_PIPE: {
    title: 'Hot Condenser Return (From Chiller)',
    icon: Flame,
    color: '#f97316',
    desc: 'Carries warm condenser water returning from the Chiller Condenser after absorbing building thermal load.',
    telemetry: [
      { label: 'Inlet Temperature', value: '38.2 °C' },
      { label: 'Flow Rate', value: '145.0 m³/h' },
      { label: 'Inlet Pressure', value: '1.82 bar' },
      { label: 'Source Unit', value: 'Chiller CH-01 Condenser' }
    ]
  },
  SPRAY_HEADER: {
    title: 'Hot Water Distribution & Spray Nozzles',
    icon: Droplets,
    color: '#0ea5e9',
    desc: 'Evenly atomizes hot condenser water through 6 full-cone brass atomizers to maximize surface area contact with rising air.',
    telemetry: [
      { label: 'Header Pressure', value: '1.75 bar' },
      { label: 'Nozzle Count', value: '6x Full-Cone Nozzles' },
      { label: 'Spray Pattern', value: '120° Atomized Cascade' },
      { label: 'Droplet Velocity', value: '2.4 m/s' }
    ]
  },
  FILL_PACK: {
    title: 'PVC Cross-Fluted Evaporative Fill Media',
    icon: Layers,
    color: '#06C7F5',
    desc: 'Forms a thin turbulent water film over cellular flutes. Counter-flowing ambient air extracts heat via evaporative heat exchange.',
    telemetry: [
      { label: 'Cooling Range (ΔT)', value: '5.7 °C (38.2 → 32.5)' },
      { label: 'Thermal Efficiency', value: '87.4 %' },
      { label: 'Heat Rejection', value: '1,745 kW (496 TR)' },
      { label: 'Approach to WBT', value: '2.5 °C' }
    ]
  },
  AIR_INTAKE: {
    title: 'Side Air Intake Louvers',
    icon: Wind,
    color: '#38bdf8',
    desc: 'Allows cool dry outdoor air to be pulled inward by the top fan, crossing the falling water droplets counter-currently.',
    telemetry: [
      { label: 'Ambient Dry Bulb', value: '26.8 °C' },
      { label: 'Ambient Wet Bulb', value: '21.3 °C' },
      { label: 'Relative Humidity', value: '61.1 % RH' },
      { label: 'Air Flow Rate', value: '112,000 m³/h' }
    ]
  },
  FAN_COWL: {
    title: 'Induced Draft VFD Fan & Cowl',
    icon: Wind,
    color: '#f43f5e',
    desc: 'Pulls air through the tower and discharges hot moist vapor plume upward away from building fresh-air intakes.',
    telemetry: [
      { label: 'Fan Speed Command', value: '82 % (VFD 41.0 Hz)' },
      { label: 'Rotational Speed', value: '590 RPM' },
      { label: 'Motor Power Draw', value: '12.4 kW' },
      { label: 'Vibration Level', value: '1.24 mm/s (Nominal)' }
    ]
  },
  BASIN: {
    title: 'Cold Water Sump Basin',
    icon: Droplets,
    color: '#0284c7',
    desc: 'Heavy-duty collection basin storing cooled water ready for immediate pumping back to the chiller condenser.',
    telemetry: [
      { label: 'Sump Temperature', value: '32.3 °C' },
      { label: 'Water Level', value: '85.0 % (Nominal)' },
      { label: 'Conductivity (TDS)', value: '1,180 µS/cm' },
      { label: 'Make-Up Valve', value: 'Auto Ready' }
    ]
  },
  PUMP: {
    title: 'Condenser Water Pump P-1 (To Chiller)',
    icon: Activity,
    color: '#16B978',
    desc: 'High-efficiency centrifugal pump recirculating 32.5°C cold water directly back to Chiller Condenser.',
    telemetry: [
      { label: 'Pump Status', value: 'ONLINE (Primary #1)' },
      { label: 'Supply Temp to Chiller', value: '32.5 °C' },
      { label: 'Discharge Pressure', value: '2.85 bar' },
      { label: 'Motor Power', value: '15.2 kW (22.4 A)' }
    ]
  }
};

const CoolingTower = () => {
  // Active Tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real-time controllable parameters
  const [towerStatus, setTowerStatus] = useState('RUNNING'); // RUNNING, STANDBY, OFF
  const [fanStatus, setFanStatus] = useState(true);
  const [fanSpeed, setFanSpeed] = useState(82); // percentage
  const [pumpStatus, setPumpStatus] = useState(true);
  const [controlMode, setControlMode] = useState('AUTO'); // AUTO / MANUAL
  const [perfTimeRange, setPerfTimeRange] = useState('24H');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParamCategory, setSelectedParamCategory] = useState('ALL');
  
  // Interactive Flow Storyboard & Inspector State
  const [flowStep, setFlowStep] = useState('ALL'); // 'ALL' | 'HOT' | 'SPRAY' | 'AIR' | 'COLD' | 'PUMP'
  const [isSimulatingCycle, setIsSimulatingCycle] = useState(false);
  const [inspectedKey, setInspectedKey] = useState('FILL_PACK');
  const [isExpanded, setIsExpanded] = useState(false); // Fullscreen Expand Modal state

  // Live timestamp clock
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  // Auto Flow Cycle Simulation
  useEffect(() => {
    if (!isSimulatingCycle) return;
    const steps = ['HOT', 'SPRAY', 'AIR', 'COLD', 'PUMP'];
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % steps.length;
      const step = steps[currentIdx];
      setFlowStep(step);
      if (step === 'HOT') setInspectedKey('HOT_PIPE');
      if (step === 'SPRAY') setInspectedKey('SPRAY_HEADER');
      if (step === 'AIR') setInspectedKey('FAN_COWL');
      if (step === 'COLD') setInspectedKey('BASIN');
      if (step === 'PUMP') setInspectedKey('PUMP');
    }, 2800);
    return () => clearInterval(interval);
  }, [isSimulatingCycle]);

  // Alarms State (interactive acknowledge)
  const [alarms, setAlarms] = useState([
    { id: 'ALM-101', name: 'High Return Water Temperature', category: 'Temperature', severity: 'WARNING', value: '38.8 °C', threshold: '38.5 °C', time: '10:32 AM', status: 'ACTIVE' },
    { id: 'ALM-102', name: 'Low Water Flow Rate', category: 'Water', severity: 'WARNING', value: '138 m³/h', threshold: '140 m³/h', time: '09:45 AM', status: 'ACKNOWLEDGED' },
    { id: 'ALM-103', name: 'Fan Motor Vibration Normal Range Check', category: 'Fan', severity: 'INFO', value: '1.24 mm/s', threshold: '3.50 mm/s', time: '08:15 AM', status: 'RESOLVED' },
    { id: 'ALM-104', name: 'Water Sump Basin Low Level Warning', category: 'Water', severity: 'CRITICAL', value: '62 %', threshold: '70 %', time: '07:20 AM', status: 'ACTIVE' },
    { id: 'ALM-105', name: 'Condenser Water Pump Over-Current Alarm', category: 'Pump', severity: 'CRITICAL', value: '28.4 A', threshold: '26.0 A', time: 'Yesterday', status: 'RESOLVED' },
  ]);

  const handleAcknowledgeAlarm = (id) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
  };

  // Periodic clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- PARAMETERS REGISTRY ---
  const allParameters = useMemo(() => [
    // Temperature Group
    { category: 'Temperature', name: 'Supply Water Temperature', value: '32.5', unit: '°C', status: 'NORMAL', range: '28.0 - 34.0', timestamp: lastUpdated },
    { category: 'Temperature', name: 'Return Water Temperature', value: '38.2', unit: '°C', status: 'NORMAL', range: '35.0 - 40.0', timestamp: lastUpdated },
    { category: 'Temperature', name: 'Ambient Dry Bulb Temp (DBT)', value: '26.8', unit: '°C', status: 'NORMAL', range: '15.0 - 45.0', timestamp: lastUpdated },
    { category: 'Temperature', name: 'Ambient Wet Bulb Temp (WBT)', value: '21.3', unit: '°C', status: 'OPTIMAL', range: '10.0 - 30.0', timestamp: lastUpdated },
    { category: 'Temperature', name: 'Approach Temperature', value: '2.5', unit: '°C', status: 'OPTIMAL', range: '2.0 - 4.5', timestamp: lastUpdated },
    { category: 'Temperature', name: 'Cooling Range (ΔT)', value: '5.7', unit: '°C', status: 'OPTIMAL', range: '4.5 - 7.0', timestamp: lastUpdated },
    { category: 'Temperature', name: 'Cold Water Sump Temperature', value: '32.3', unit: '°C', status: 'NORMAL', range: '28.0 - 34.0', timestamp: lastUpdated },
    { category: 'Temperature', name: 'Hot Water Spray Header Temp', value: '38.1', unit: '°C', status: 'NORMAL', range: '35.0 - 40.0', timestamp: lastUpdated },

    // Fan Group
    { category: 'Fan', name: 'Fan Operating Status', value: fanStatus ? 'RUNNING' : 'STOPPED', unit: '', status: fanStatus ? 'NORMAL' : 'STANDBY', range: 'AUTO / VFD', timestamp: lastUpdated },
    { category: 'Fan', name: 'Fan Speed Command', value: `${fanSpeed}`, unit: '%', status: 'NORMAL', range: '0 - 100 %', timestamp: lastUpdated },
    { category: 'Fan', name: 'Fan Motor Rotational Speed', value: `${Math.round((fanSpeed / 100) * 720)}`, unit: 'RPM', status: 'NORMAL', range: '0 - 720 RPM', timestamp: lastUpdated },
    { category: 'Fan', name: 'Fan Motor Current', value: '18.6', unit: 'A', status: 'NORMAL', range: '5.0 - 24.0 A', timestamp: lastUpdated },
    { category: 'Fan', name: 'Fan Motor Power Draw', value: '12.4', unit: 'kW', status: 'NORMAL', range: '0 - 18.5 kW', timestamp: lastUpdated },
    { category: 'Fan', name: 'Fan Bearing Vibration (X/Y/Z)', value: '1.24', unit: 'mm/s', status: 'OPTIMAL', range: '< 3.50 mm/s', timestamp: lastUpdated },
    { category: 'Fan', name: 'VFD Output Frequency', value: `${((fanSpeed / 100) * 50).toFixed(1)}`, unit: 'Hz', status: 'NORMAL', range: '15.0 - 50.0 Hz', timestamp: lastUpdated },

    // Water Group
    { category: 'Water', name: 'Condenser Water Flow Rate', value: '145.0', unit: 'm³/h', status: 'NORMAL', range: '120 - 220 m³/h', timestamp: lastUpdated },
    { category: 'Water', name: 'Water Inlet Pressure', value: '1.82', unit: 'bar', status: 'NORMAL', range: '1.2 - 2.5 bar', timestamp: lastUpdated },
    { category: 'Water', name: 'Water Outlet Pressure', value: '1.45', unit: 'bar', status: 'NORMAL', range: '1.0 - 2.0 bar', timestamp: lastUpdated },
    { category: 'Water', name: 'Sump Basin Water Level', value: '85.0', unit: '%', status: 'NORMAL', range: '70 - 95 %', timestamp: lastUpdated },
    { category: 'Water', name: 'Make-Up Water Solenoid Valve', value: 'OPEN', unit: '', status: 'NORMAL', range: 'AUTO LEVEL', timestamp: lastUpdated },
    { category: 'Water', name: 'Make-Up Water Flow Rate', value: '15.2', unit: 'LPM', status: 'NORMAL', range: '0 - 45 LPM', timestamp: lastUpdated },
    { category: 'Water', name: 'Blowdown Drain Valve', value: 'CLOSED', unit: '', status: 'NORMAL', range: 'TDS TRIGGERED', timestamp: lastUpdated },
    { category: 'Water', name: 'Water Electrical Conductivity (TDS)', value: '1,180', unit: 'µS/cm', status: 'OPTIMAL', range: '< 1,500 µS', timestamp: lastUpdated },

    // Pump Group
    { category: 'Pump', name: 'Condenser Pump Status', value: pumpStatus ? 'ONLINE' : 'OFFLINE', unit: '', status: pumpStatus ? 'NORMAL' : 'STANDBY', range: 'PRIMARY #1', timestamp: lastUpdated },
    { category: 'Pump', name: 'Pump Operating Speed', value: '100', unit: '%', status: 'NORMAL', range: '80 - 100 %', timestamp: lastUpdated },
    { category: 'Pump', name: 'Pump Shaft RPM', value: '1,450', unit: 'RPM', status: 'NORMAL', range: '1400 - 1500', timestamp: lastUpdated },
    { category: 'Pump', name: 'Pump Motor Current', value: '22.4', unit: 'A', status: 'NORMAL', range: '10.0 - 28.0 A', timestamp: lastUpdated },
    { category: 'Pump', name: 'Pump Motor Power', value: '15.2', unit: 'kW', status: 'NORMAL', range: '0 - 22.0 kW', timestamp: lastUpdated },
    { category: 'Pump', name: 'Pump Discharge Pressure', value: '2.85', unit: 'bar', status: 'NORMAL', range: '2.2 - 3.4 bar', timestamp: lastUpdated },

    // Performance Group
    { category: 'Performance', name: 'Cooling Capacity', value: '1,480', unit: 'kW', status: 'OPTIMAL', range: '0 - 1,758 kW', timestamp: lastUpdated },
    { category: 'Performance', name: 'Cooling Thermal Efficiency', value: '87.4', unit: '%', status: 'OPTIMAL', range: '> 80.0 %', timestamp: lastUpdated },
    { category: 'Performance', name: 'Total Heat Rejection Rate', value: '1,745', unit: 'kW', status: 'NORMAL', range: '0 - 2,100 kW', timestamp: lastUpdated },
    { category: 'Performance', name: 'Cumulative Energy Consumption', value: '184.2', unit: 'kWh/day', status: 'NORMAL', range: 'Daily metric', timestamp: lastUpdated },
    { category: 'Performance', name: 'Specific Power Intensity', value: '0.035', unit: 'kW/TR', status: 'OPTIMAL', range: '< 0.05 kW/TR', timestamp: lastUpdated },
    { category: 'Performance', name: 'Evaporation Water Loss', value: '1.85', unit: 'm³/h', status: 'NORMAL', range: '1.2 - 2.8 m³/h', timestamp: lastUpdated },
  ], [fanStatus, fanSpeed, pumpStatus, lastUpdated]);

  // Filtered parameters based on tab search & category
  const filteredParameters = useMemo(() => {
    return allParameters.filter(p => {
      const matchCategory = selectedParamCategory === 'ALL' || p.category === selectedParamCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [allParameters, selectedParamCategory, searchQuery]);

  const activeInspectData = COMPONENT_DETAILS[inspectedKey] || COMPONENT_DETAILS.FILL_PACK;
  const InspectIcon = activeInspectData.icon;

  // ── REUSABLE SVG SCHEMATIC COMPONENT ──
  const renderSvgSchematic = (isFull = false) => (
    <div className="position-relative w-100 text-center my-auto pt-3 pb-2" style={{ minHeight: isFull ? '540px' : '470px' }}>
      <svg viewBox="0 0 800 530" className="w-100 h-100" style={{ maxHeight: isFull ? '620px' : '490px', overflow: 'visible' }}>
        <defs>
          {/* Gradients */}
          <linearGradient id="ctSteelCasing" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="30%" stopColor="#334155" />
            <stop offset="70%" stopColor="#243044" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="ctSideExtrude" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#182234" />
            <stop offset="100%" stopColor="#0b1120" />
          </linearGradient>

          <linearGradient id="ctFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.55" />
            <stop offset="30%" stopColor="#0284c7" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="ctBasinWater" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06C7F5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.98" />
          </linearGradient>

          <linearGradient id="ctHotPipe" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          <linearGradient id="ctColdPipe" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#06C7F5" />
          </linearGradient>

          <linearGradient id="fanCowlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="vaporGlowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#fb7185" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fda4af" stopOpacity="0.0" />
          </linearGradient>

          {/* Patterns */}
          <pattern id="honeycombFill" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 0 7 L 7 0 L 14 7 L 7 14 Z" fill="none" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="1" />
          </pattern>

          {/* Arrow markers */}
          <marker id="arrRed" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#f97316" />
          </marker>
          <marker id="arrCyan" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#06C7F5" />
          </marker>
          <marker id="arrBlue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#38bdf8" />
          </marker>
        </defs>

        {/* ── TOP BADGE: WARM MOIST AIR EXHAUST (GENEROUS TOP SPACING) ── */}
        <g transform="translate(390, 24)" className="cursor-pointer ct-svg-interactive" onClick={() => { setFlowStep('AIR'); setInspectedKey('FAN_COWL'); }}>
          <rect x="-115" y="0" width="230" height="28" rx="14" fill="#1e1122" stroke="#ef4444" strokeWidth={flowStep === 'AIR' ? '2.5' : '1.5'} />
          <text x="0" y="19" textAnchor="middle" fill="#f43f5e" fontSize="11" fontWeight="800" letterSpacing="0.6">
            ♨️ WARM MOIST AIR EXHAUST
          </text>
        </g>

        {/* ── 1. WARM EXHAUST AIR VAPOR DISCHARGE (RISING TOP) ── */}
        {fanStatus && (
          <g opacity={flowStep === 'ALL' || flowStep === 'AIR' ? '0.95' : '0.25'}>
            {/* Volumetric Steam Cloud */}
            <path d="M 330 105 C 310 65, 330 46, 390 46 C 450 46, 470 65, 450 105 Z" fill="url(#vaporGlowGrad)" className="ct-steam-rise" />
            <path d="M 365 96 Q 330 62 300 48" fill="none" stroke="#fb7185" strokeWidth="2.5" className="ct-air-stream" markerEnd="url(#arrRed)" />
            <path d="M 390 92 Q 390 58 390 46" fill="none" stroke="#f43f5e" strokeWidth="3.5" className="ct-air-stream" markerEnd="url(#arrRed)" />
            <path d="M 415 96 Q 450 62 480 48" fill="none" stroke="#fb7185" strokeWidth="2.5" className="ct-air-stream" markerEnd="url(#arrRed)" />
          </g>
        )}

        {/* ── 2. FAN CYLINDER / COWL SHROUD (2.5D ISOMETRIC TOP STACK) ── */}
        <g className="cursor-pointer ct-svg-interactive" onClick={() => setInspectedKey('FAN_COWL')}>
          {/* Cowl Base Body */}
          <path d="M 320 155 L 345 105 L 435 105 L 460 155 Z" fill="url(#fanCowlGrad)" stroke="#475569" strokeWidth="2" />
          {/* 2.5D Extrusion Lip */}
          <path d="M 435 105 L 452 96 L 476 144 L 460 155 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Lower Ellipse */}
          <ellipse cx="390" cy="155" rx="70" ry="16" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          {/* Upper Rim Ellipse */}
          <ellipse cx="390" cy="105" rx="46" ry="12" fill="#0b1329" stroke="#64748b" strokeWidth="2" />
          {/* LED Ring Glow */}
          <ellipse cx="390" cy="105" rx="42" ry="10" fill="none" stroke={fanStatus ? 'rgba(6, 199, 245, 0.6)' : 'transparent'} strokeWidth="1.5" />

          {/* ROTATING MULTI-BLADE AERODYNAMIC FAN */}
          <g transform="translate(390, 105)">
            <g
              className={fanStatus && towerStatus === 'RUNNING' ? 'ct-fan-rotating' : ''}
              style={{
                animationDuration: `${Math.max(0.3, 2.0 - (fanSpeed / 100) * 1.6)}s`,
                animationPlayState: (fanStatus && towerStatus === 'RUNNING') ? 'running' : 'paused'
              }}
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                <g key={deg} transform={`rotate(${deg})`}>
                  <path d="M -3 -2 L -5 -24 A 5 5 0 0 1 5 -24 L 3 -2 Z" fill={fanStatus ? '#0ea5e9' : '#64748b'} stroke="#38bdf8" strokeWidth="0.8" opacity="0.95" />
                </g>
              ))}
              <circle cx="0" cy="0" r="9" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="0" cy="0" r="4" fill="#06C7F5" />
            </g>
          </g>
        </g>

        {/* Top Fan Status Chip */}
        <g transform="translate(470, 92)">
          <rect x="0" y="0" width="96" height="26" rx="13" fill="#0b192e" stroke="#06C7F5" strokeWidth="1.5" />
          <text x="14" y="17" fill="#06C7F5" fontSize="10.5" fontWeight="800">FAN: {fanSpeed}%</text>
        </g>

        {/* ── 3. MAIN TOWER HOUSING & CASING (2.5D DEPTH) ── */}
        {/* 3D Right Side Wall Extrusion */}
        <path d="M 515 155 L 535 138 L 535 378 L 515 395 Z" fill="url(#ctSideExtrude)" stroke="#334155" strokeWidth="1.5" />
        <line x1="515" y1="210" x2="535" y2="193" stroke="#243044" strokeWidth="1.5" />
        <line x1="515" y1="320" x2="535" y2="303" stroke="#243044" strokeWidth="1.5" />

        {/* Front Main Wall */}
        <rect x="265" y="155" width="250" height="240" rx="6" fill="url(#ctSteelCasing)" stroke="#475569" strokeWidth="2" />
        {/* Structural Framing Columns & Rivets */}
        <line x1="265" y1="210" x2="515" y2="210" stroke="#334155" strokeWidth="2" />
        <line x1="265" y1="320" x2="515" y2="320" stroke="#334155" strokeWidth="2" />
        <line x1="390" y1="155" x2="390" y2="395" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Diagonal Bracing Ribs */}
        <line x1="265" y1="155" x2="285" y2="210" stroke="#2b394e" strokeWidth="1" />
        <line x1="515" y1="155" x2="495" y2="210" stroke="#2b394e" strokeWidth="1" />

        {/* ── 4. DRIFT ELIMINATOR BAFFLE PACK ── */}
        <rect x="275" y="165" width="230" height="22" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" opacity="0.95" />
        <text x="390" y="180" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="800" letterSpacing="0.8">
          CHEVRON DRIFT ELIMINATORS (99.99%)
        </text>

        {/* ── 5. HOT WATER DISTRIBUTION SPRAY SYSTEM ── */}
        <g className="cursor-pointer ct-svg-interactive-orange" onClick={() => setInspectedKey('SPRAY_HEADER')}>
          <rect 
            x="270" y="192" width="240" height="13" rx="3" 
            fill="url(#ctHotPipe)" stroke="#ea580c" strokeWidth="1.2" 
            opacity={flowStep === 'ALL' || flowStep === 'HOT' || flowStep === 'SPRAY' ? '1' : '0.35'}
          />
          {/* 6 Brass Spray Nozzles with Water Mist Cascade */}
          {[295, 333, 371, 409, 447, 485].map((nx, i) => (
            <g key={i} opacity={flowStep === 'ALL' || flowStep === 'SPRAY' ? '1' : '0.35'}>
              <circle cx={nx} cy="205" r="4" fill="#fb923c" stroke="#ea580c" strokeWidth="1" />
              {/* Falling Droplets Layer */}
              <line x1={nx} y1="207" x2={nx - 8} y2="235" stroke="#f97316" strokeWidth="1.8" className="ct-water-stream" />
              <line x1={nx} y1="207" x2={nx} y2="238" stroke="#38bdf8" strokeWidth="1.8" className="ct-water-stream" />
              <line x1={nx} y1="207" x2={nx + 8} y2="235" stroke="#f97316" strokeWidth="1.8" className="ct-water-stream" />
            </g>
          ))}
        </g>

        {/* ── 6. PVC FILM FILL PACK (HEAT TRANSFER CORE) ── */}
        <g className="cursor-pointer ct-svg-interactive" onClick={() => setInspectedKey('FILL_PACK')}>
          {/* Fill Pack Window Frame */}
          <rect 
            x="275" y="235" width="230" height="100" rx="4" 
            fill="url(#ctFillGrad)" stroke={inspectedKey === 'FILL_PACK' ? '#06C7F5' : 'rgba(56, 189, 248, 0.4)'} strokeWidth={inspectedKey === 'FILL_PACK' ? '2.5' : '1.5'} 
            opacity={flowStep === 'ALL' || flowStep === 'SPRAY' ? '1' : '0.45'}
          />
          <rect x="275" y="235" width="230" height="100" fill="url(#honeycombFill)" opacity="0.85" />
          
          {/* Subtle Glass Reflection Sheen */}
          <path d="M 275 235 L 360 235 L 310 335 L 275 335 Z" fill="rgba(255, 255, 255, 0.08)" />

          <text x="390" y="285" textAnchor="middle" fill="#ffffff" fontSize="13.5" fontWeight="900" letterSpacing="1.2">
            PVC CROSS-FLUTED FILL
          </text>
          <text x="390" y="304" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="800">
            Counterflow Heat Exchange (ΔT 5.7°C)
          </text>
        </g>

        {/* ── 7. AIR INTAKE LOUVERS ON SIDES ── */}
        {/* Left Side Louvers */}
        <g className="cursor-pointer ct-svg-interactive" onClick={() => setInspectedKey('AIR_INTAKE')} opacity={flowStep === 'ALL' || flowStep === 'AIR' ? '1' : '0.35'}>
          {[342, 354, 366, 378, 390].map((ly, i) => (
            <line key={i} x1="250" y1={ly} x2="275" y2={ly - 6} stroke="#38bdf8" strokeWidth="2.5" />
          ))}
          {/* Left Streamlines */}
          <path d="M 180 366 L 250 366" fill="none" stroke="#38bdf8" strokeWidth="2.5" className="ct-air-stream" markerEnd="url(#arrBlue)" />
        </g>

        {/* Right Side Louvers */}
        <g className="cursor-pointer ct-svg-interactive" onClick={() => setInspectedKey('AIR_INTAKE')} opacity={flowStep === 'ALL' || flowStep === 'AIR' ? '1' : '0.35'}>
          {[342, 354, 366, 378, 390].map((ly, i) => (
            <line key={i} x1="530" y1={ly} x2="505" y2={ly - 6} stroke="#38bdf8" strokeWidth="2.5" />
          ))}
          {/* Right Streamlines */}
          <path d="M 600 366 L 530 366" fill="none" stroke="#38bdf8" strokeWidth="2.5" className="ct-air-stream" markerEnd="url(#arrBlue)" />
        </g>

        {/* ── 8. COLD WATER SUMP BASIN (2.5D BOTTOM) ── */}
        <g className="cursor-pointer ct-svg-interactive" onClick={() => setInspectedKey('BASIN')}>
          {/* 3D Sump Extrusion */}
          <path d="M 515 445 L 535 428 L 545 378 L 525 395 Z" fill="#0a0f1d" stroke="#334155" strokeWidth="1" />
          <path d="M 255 395 L 265 445 L 515 445 L 525 395 Z" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          
          {/* Water Mass */}
          <path 
            d="M 262 408 L 268 440 L 512 440 L 518 408 Z" 
            fill="url(#ctBasinWater)" 
            opacity={flowStep === 'ALL' || flowStep === 'COLD' ? '0.95' : '0.45'}
          />
          <line x1="262" y1="408" x2="518" y2="408" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="5 3" className="ct-basin-wave" />
          <text x="390" y="428" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800" letterSpacing="0.6">
            COLD WATER BASIN (85% LEVEL)
          </text>
        </g>

        {/* ── 9. HOT WATER INLET PIPING (RIGHT: FROM CHILLER) ── */}
        <g className="cursor-pointer ct-svg-interactive-orange" onClick={() => setInspectedKey('HOT_PIPE')}>
          {/* Pipe Outer Insulation */}
          <path 
            d="M 630 197 L 510 197" fill="none" stroke="url(#ctHotPipe)" strokeWidth="8.5" strokeLinecap="round" 
            opacity={flowStep === 'ALL' || flowStep === 'HOT' ? '1' : '0.35'}
          />
          {/* Flow Animation Stream */}
          <path 
            d="M 630 197 L 510 197" fill="none" stroke="#ffffff" strokeWidth="2" className="ct-water-stream" markerEnd="url(#arrRed)" 
            opacity={flowStep === 'ALL' || flowStep === 'HOT' ? '1' : '0.35'}
          />
          {/* Flange Fitting Ring */}
          <rect x="515" y="190" width="4" height="14" rx="1" fill="#ea580c" />
        </g>

        {/* ── 10. COLD WATER OUTLET PIPING & STATIONARY ROTATING IMPELLER PUMP P-1 ── */}
        <g className="cursor-pointer ct-svg-interactive" onClick={() => setInspectedKey('PUMP')}>
          {/* Cold Pipe Outflow */}
          <path 
            d="M 266 425 L 140 425 L 140 465 L 45 465" fill="none" stroke="url(#ctColdPipe)" strokeWidth="8.5" strokeLinecap="round" 
            opacity={flowStep === 'ALL' || flowStep === 'COLD' || flowStep === 'PUMP' ? '1' : '0.35'}
          />
          <path 
            d="M 266 425 L 140 425 L 140 465 L 45 465" fill="none" stroke="#ffffff" strokeWidth="2" className="ct-water-stream" markerEnd="url(#arrCyan)" 
            opacity={flowStep === 'ALL' || flowStep === 'COLD' || flowStep === 'PUMP' ? '1' : '0.35'}
          />
          {/* Basin Outlet Flange */}
          <rect x="260" y="418" width="4" height="14" rx="1" fill="#0284c7" />

          {/* Centrifugal Pump Assembly P-1 (Properly centered in-place rotation) */}
          <g transform="translate(140, 465)">
            {/* Pump Body Volute */}
            <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#16B978" strokeWidth="2.5" />
            
            {/* Spinning Impeller Blades (Rotates in place around 0,0) */}
            <g className={pumpStatus && towerStatus === 'RUNNING' ? 'ct-pump-rotating' : ''} style={{ transformOrigin: '0px 0px' }}>
              <line x1="-7" y1="0" x2="7" y2="0" stroke="#16B978" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="0" y1="-7" x2="0" y2="7" stroke="#16B978" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="0" cy="0" r="3" fill="#06C7F5" />
            </g>
            <text x="0" y="24" textAnchor="middle" fill="#16B978" fontSize="9.5" fontWeight="900" letterSpacing="0.5">PUMP P-1</text>
          </g>
        </g>

        {/* ── 11. NUMBERED STEP BADGES & TELEMETRY CALLOUT CHIPS (ZERO OVERLAP) ── */}
        {/* Step 1: Hot Return Water Badge (Right: From Chiller) */}
        <g transform="translate(630, 176)" className="cursor-pointer ct-svg-interactive-orange" onClick={() => { setFlowStep('HOT'); setInspectedKey('HOT_PIPE'); }}>
          <rect x="0" y="0" width="155" height="42" rx="8" fill="#111b33" stroke="#f97316" strokeWidth={flowStep === 'HOT' ? '2.5' : '1.5'} />
          <circle cx="16" cy="21" r="9" fill="#ea580c" />
          <text x="16" y="25" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="900">1</text>
          <text x="32" y="16" fill="#f97316" fontSize="10" fontWeight="800">HOT FROM CHILLER</text>
          <text x="32" y="32" fill="#ffffff" fontSize="11.5" fontWeight="700">38.2 °C <tspan fill="#94a3b8" fontSize="9.5">| 145 m³/h</tspan></text>
        </g>

        {/* Step 2: Clean Spray & Fill Cycle Badge (Positioned clearly below fill) */}
        <g transform="translate(390, 350)" className="cursor-pointer ct-svg-interactive" onClick={() => { setFlowStep('SPRAY'); setInspectedKey('FILL_PACK'); }}>
          <rect x="-105" y="0" width="210" height="26" rx="13" fill="rgba(6, 159, 240, 0.25)" stroke="#069FF0" strokeWidth="1.5" />
          <text x="0" y="17" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="800">② SPRAY & FILL (ΔT 5.7°C)</text>
        </g>

        {/* Step 3 Left: Left Ambient Air Intake */}
        <g transform="translate(35, 345)" className="cursor-pointer ct-svg-interactive" onClick={() => { setFlowStep('AIR'); setInspectedKey('AIR_INTAKE'); }}>
          <rect x="0" y="0" width="130" height="40" rx="8" fill="#0f172a" stroke="rgba(56, 189, 248, 0.4)" strokeWidth={flowStep === 'AIR' ? '2' : '1'} />
          <circle cx="16" cy="20" r="8" fill="#0284c7" />
          <text x="16" y="23" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900">3</text>
          <text x="30" y="16" fill="#38bdf8" fontSize="9.5" fontWeight="800">AMBIENT AIR IN</text>
          <text x="30" y="32" fill="#ffffff" fontSize="10.5" fontWeight="700">26.8°C <tspan fill="#94a3b8" fontSize="8.5">(WBT 21.3°)</tspan></text>
        </g>

        {/* Step 3 Right: Right Ambient Air Intake */}
        <g transform="translate(630, 345)" className="cursor-pointer ct-svg-interactive" onClick={() => { setFlowStep('AIR'); setInspectedKey('AIR_INTAKE'); }}>
          <rect x="0" y="0" width="130" height="40" rx="8" fill="#0f172a" stroke="rgba(56, 189, 248, 0.4)" strokeWidth={flowStep === 'AIR' ? '2' : '1'} />
          <circle cx="16" cy="20" r="8" fill="#0284c7" />
          <text x="16" y="23" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900">3</text>
          <text x="30" y="16" fill="#38bdf8" fontSize="9.5" fontWeight="800">AMBIENT AIR IN</text>
          <text x="30" y="32" fill="#ffffff" fontSize="10.5" fontWeight="700">RH: 61.1% (Dry Air)</text>
        </g>

        {/* Step 4: Cold Return Water Badge (Left: Clean leader offset above pipe) */}
        <g transform="translate(10, 400)" className="cursor-pointer ct-svg-interactive" onClick={() => { setFlowStep('PUMP'); setInspectedKey('PUMP'); }}>
          <rect x="0" y="0" width="135" height="42" rx="8" fill="#111b33" stroke="#16B978" strokeWidth={flowStep === 'PUMP' ? '2.5' : '1.5'} />
          <circle cx="16" cy="21" r="9" fill="#16B978" />
          <text x="16" y="25" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="900">4</text>
          <text x="30" y="16" fill="#16B978" fontSize="9.5" fontWeight="800">COLD ➔ TO CHILLER</text>
          <text x="30" y="32" fill="#ffffff" fontSize="11" fontWeight="700">32.5 °C <tspan fill="#38bdf8" fontSize="8.5">(Recirc)</tspan></text>
        </g>
      </svg>
    </div>
  );

  return (
    <div className="cooling-tower-main p-3 p-md-4">
      {/* ── TOP EQUIPMENT HEADER BAR ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="ct-header-bar p-3 p-md-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="ct-icon-box d-flex align-items-center justify-content-center">
              <ThermometerSnowflake size={26} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2.5 flex-wrap">
                <h4 className="fw-black mb-0" style={{ letterSpacing: '-0.02em' }}>Cooling Tower</h4>
                <span className="ct-status-pill-running d-inline-flex align-items-center gap-1.5">
                  <span className="ct-status-dot-pulse"></span>
                  {towerStatus}
                </span>
                <Badge bg={controlMode === 'AUTO' ? 'primary' : 'warning'} className="px-2 py-1 rounded-pill" style={{ fontSize: '10.5px' }}>
                  MODE: {controlMode}
                </Badge>
              </div>
              <div className="d-flex align-items-center gap-2 mt-1 text-muted small flex-wrap">
                <span className="fw-semibold text-primary">CT-001</span>
                <span>•</span>
                <span>AHU Plant / Central Utility Roof Deck</span>
                <span>•</span>
                <span className="d-inline-flex align-items-center gap-1">
                  <Clock size={12} className="text-info" />
                  Last Updated: <strong className="text-dark-emphasis font-monospace">{lastUpdated}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Equipment Operations */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Button
              variant={isExpanded ? 'secondary' : 'outline-info'}
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="fw-bold px-3 d-flex align-items-center gap-1.5 shadow-sm"
              title="Expand Schematic to Full View"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isExpanded ? 'Exit Fullscreen' : 'Expand View'}
            </Button>
            <Button
              variant={isSimulatingCycle ? 'success' : 'outline-primary'}
              size="sm"
              onClick={() => setIsSimulatingCycle(!isSimulatingCycle)}
              className="fw-bold px-3 d-flex align-items-center gap-1.5 shadow-sm"
            >
              {isSimulatingCycle ? <Pause size={14} /> : <Play size={14} />}
              {isSimulatingCycle ? 'Pause Flow Simulation' : '▶ Play Flow Simulation'}
            </Button>
            <Button
              variant={controlMode === 'AUTO' ? 'outline-primary' : 'outline-warning'}
              size="sm"
              onClick={() => setControlMode(m => m === 'AUTO' ? 'MANUAL' : 'AUTO')}
              className="fw-bold px-3 d-flex align-items-center gap-1.5"
            >
              <Sliders size={14} />
              {controlMode === 'AUTO' ? 'Switch to Manual' : 'Switch to Auto'}
            </Button>
            <Button
              variant={fanStatus ? 'outline-danger' : 'outline-success'}
              size="sm"
              onClick={() => setFanStatus(f => !f)}
              className="fw-bold px-3 d-flex align-items-center gap-1.5"
            >
              <Power size={14} />
              {fanStatus ? 'Stop Fan' : 'Start Fan'}
            </Button>
            <Button variant="info" size="sm" className="text-white fw-bold px-3 d-flex align-items-center gap-1.5" onClick={() => window.print()}>
              <Printer size={14} />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── SPLIT PANEL: 2.5D VISUALIZATION (LEFT) + LIVE KPI TELEMETRY (RIGHT) ── */}
      <Row className="g-4 mb-4">
        {/* LEFT COLUMN: 2.5D FLAT/ISOMETRIC INDUSTRIAL SVG SCHEMATIC */}
        <Col xl={7} lg={12}>
          <div className="ct-schematic-card p-3 p-md-4 h-100 d-flex flex-column justify-content-between">
            {/* Schematic Top Bar & Step Selector */}
            <div className="d-flex flex-column gap-2 mb-2">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <Compass size={16} className="text-info" />
                  <span className="fw-bold text-uppercase fs-12 tracking-wider text-muted">Complete Closed Water & Air Cycle</span>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'ALL', label: '⚡ Full Cycle', key: 'FILL_PACK' },
                      { id: 'HOT', label: '① Hot Return (38.2°)', key: 'HOT_PIPE' },
                      { id: 'SPRAY', label: '② Spray & Fill', key: 'SPRAY_HEADER' },
                      { id: 'AIR', label: '③ Air & Exhaust', key: 'FAN_COWL' },
                      { id: 'COLD', label: '④ Basin (32.5°)', key: 'BASIN' },
                      { id: 'PUMP', label: '⑤ Pump P-1 ➔ Chiller', key: 'PUMP' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        className={`ct-stage-pill ${flowStep === st.id ? 'active' : ''}`}
                        onClick={() => {
                          setFlowStep(st.id);
                          setInspectedKey(st.key);
                          setIsSimulatingCycle(false);
                        }}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                  {/* Quick Expand Icon Button */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary p-1.5 rounded-circle d-flex align-items-center justify-content-center"
                    onClick={() => setIsExpanded(true)}
                    title="Expand Fullscreen Schematic"
                    style={{ width: '30px', height: '30px' }}
                  >
                    <Maximize2 size={13} />
                  </button>
                </div>
              </div>

              {/* Dynamic Process Cycle Explanation Banner with Clear Margin */}
              <div 
                className="p-3 px-3.5 rounded-3 border d-flex align-items-center gap-3 transition-all mb-3 shadow-sm"
                style={{ 
                  background: flowStep === 'HOT' ? 'rgba(249, 115, 22, 0.14)' :
                              flowStep === 'SPRAY' ? 'rgba(6, 159, 240, 0.14)' :
                              flowStep === 'AIR' ? 'rgba(244, 63, 94, 0.14)' :
                              flowStep === 'COLD' ? 'rgba(2, 132, 199, 0.14)' :
                              flowStep === 'PUMP' ? 'rgba(22, 185, 120, 0.14)' :
                              'rgba(14, 165, 233, 0.10)',
                  borderColor: flowStep === 'HOT' ? 'rgba(249, 115, 22, 0.45)' :
                               flowStep === 'SPRAY' ? 'rgba(6, 159, 240, 0.45)' :
                               flowStep === 'AIR' ? 'rgba(244, 63, 94, 0.45)' :
                               flowStep === 'COLD' ? 'rgba(2, 132, 199, 0.45)' :
                               flowStep === 'PUMP' ? 'rgba(22, 185, 120, 0.45)' :
                               'rgba(14, 165, 233, 0.3)',
                  minHeight: '48px'
                }}
              >
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center p-1.5 flex-shrink-0 shadow-sm"
                  style={{ 
                    background: flowStep === 'HOT' ? '#f97316' :
                                flowStep === 'SPRAY' ? '#069FF0' :
                                flowStep === 'AIR' ? '#f43f5e' :
                                flowStep === 'COLD' ? '#0284c7' :
                                flowStep === 'PUMP' ? '#16B978' :
                                '#0ea5e9',
                    color: '#ffffff',
                    width: '28px',
                    height: '28px'
                  }}
                >
                  <Activity size={15} />
                </div>
                <div className="flex-grow-1" style={{ fontSize: '12px', lineHeight: '1.5', fontWeight: '500' }}>
                  {flowStep === 'HOT' && (
                    <span><strong className="text-warning">Step 1 (Hot Inflow):</strong> Hot condenser water (<strong className="text-white">38.2 °C</strong>) loaded with building heat returns from Chiller condenser through supply piping at <strong className="text-white">145.0 m³/h</strong>.</span>
                  )}
                  {flowStep === 'SPRAY' && (
                    <span><strong className="text-info">Step 2 & 3 (Spray & Film Fill):</strong> 6 brass nozzles atomize hot water over PVC cross-fluted fill pack (<strong className="text-white">ΔT 5.7 °C cooling range</strong>), maximizing evaporative heat rejection.</span>
                  )}
                  {flowStep === 'AIR' && (
                    <span><strong className="text-danger">Step 4 (Induced Draft Air & Exhaust):</strong> Top VFD fan (<strong className="text-white">{fanSpeed}% speed | {Math.round((fanSpeed / 100) * 720)} RPM</strong>) pulls ambient air through side louvers and discharges warm moist vapor plume.</span>
                  )}
                  {flowStep === 'COLD' && (
                    <span><strong className="text-primary">Step 5 (Cold Sump Basin):</strong> Cooled water (<strong className="text-white">32.5 °C</strong>) gravity-drains into the sump basin (<strong className="text-white">85% nominal level</strong>), ready for immediate return.</span>
                  )}
                  {flowStep === 'PUMP' && (
                    <span><strong className="text-success">Step 6 (Pump Recirculation):</strong> Condenser Pump <strong className="text-white">P-1 (1,450 RPM | 2.85 bar | 15.2 kW)</strong> pumps chilled <strong className="text-white">32.5 °C</strong> water back to the Chiller condenser.</span>
                  )}
                  {flowStep === 'ALL' && (
                    <span><strong className="text-info">Complete Closed Loop:</strong> Continuous thermodynamic cycle where hot water (<strong className="text-white">38.2°C</strong>) is evaporatively cooled to <strong className="text-white">32.5°C</strong> by ambient air and pumped back to the chiller condenser.</span>
                  )}
                </div>
              </div>
            </div>

            {/* SVG Visual Stage */}
            {renderSvgSchematic(false)}

            {/* Interactive Component Inspector HUD Bar */}
            <div className="p-3 rounded-3 mt-2 border" style={{ background: 'rgba(15, 23, 42, 0.05)', borderColor: activeInspectData.color }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-1.5 rounded-2 d-flex align-items-center justify-content-center" style={{ background: activeInspectData.color, color: '#fff' }}>
                    <InspectIcon size={14} />
                  </div>
                  <div>
                    <span className="fw-bold fs-12 text-uppercase text-muted">Component Live Telemetry: </span>
                    <strong className="fs-13" style={{ color: activeInspectData.color }}>{activeInspectData.title}</strong>
                  </div>
                </div>
                <Badge bg="dark" className="px-2 py-1 text-uppercase" style={{ fontSize: '10px' }}>
                  Click schematic to inspect component
                </Badge>
              </div>
              <p className="mb-2 text-muted small" style={{ fontSize: '11.5px', lineHeight: '1.4' }}>
                {activeInspectData.desc}
              </p>
              <div className="d-flex align-items-center gap-3 flex-wrap pt-1.5 border-top">
                {activeInspectData.telemetry.map((t, i) => (
                  <div key={i} className="d-flex align-items-center gap-1.5" style={{ fontSize: '11px' }}>
                    <span className="text-muted">{t.label}:</span>
                    <strong className="text-dark-emphasis">{t.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Schematic Legend Footer */}
            <div className="d-flex align-items-center justify-content-between pt-2 border-top flex-wrap gap-2 text-muted mt-2" style={{ fontSize: '11px' }}>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="d-flex align-items-center gap-1.5">
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }}></span>
                  Hot Return (38.2°C)
                </span>
                <span className="d-flex align-items-center gap-1.5">
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16B978' }}></span>
                  Cold Recirculation (32.5°C)
                </span>
                <span className="d-flex align-items-center gap-1.5">
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8' }}></span>
                  Airflow Intake (26.8°C)
                </span>
                <span className="d-flex align-items-center gap-1.5">
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }}></span>
                  Warm Moist Exhaust
                </span>
              </div>
              <span className="fw-semibold text-info">Real-time closed thermodynamic loop</span>
            </div>
          </div>
        </Col>

        {/* RIGHT COLUMN: REAL-TIME KEY PARAMETER CARDS */}
        <Col xl={5} lg={12}>
          <div className="d-flex flex-column justify-content-between h-100 gap-3">
            <Row className="g-3">
              {/* Card 1: Supply Temp */}
              <Col sm={6}>
                <div className="ct-kpi-card h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="ct-kpi-label">Supply Temp</span>
                    <ThermometerSnowflake size={16} className="text-info" />
                  </div>
                  <div className="ct-kpi-value text-info">
                    32.5<span className="ct-kpi-unit">°C</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-1 border-top" style={{ fontSize: '11px' }}>
                    <span className="text-muted">Target: 32.0 °C</span>
                    <span className="text-success fw-bold">🟢 Nominal</span>
                  </div>
                </div>
              </Col>

              {/* Card 2: Return Temp */}
              <Col sm={6}>
                <div className="ct-kpi-card h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="ct-kpi-label">Return Temp</span>
                    <Flame size={16} className="text-danger" />
                  </div>
                  <div className="ct-kpi-value text-danger">
                    38.2<span className="ct-kpi-unit">°C</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-1 border-top" style={{ fontSize: '11px' }}>
                    <span className="text-muted">ΔT (Range): 5.7 °C</span>
                    <span className="text-danger fw-bold">Active Load</span>
                  </div>
                </div>
              </Col>

              {/* Card 3: Water Flow */}
              <Col sm={6}>
                <div className="ct-kpi-card h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="ct-kpi-label">Water Flow</span>
                    <Droplets size={16} className="text-primary" />
                  </div>
                  <div className="ct-kpi-value">
                    145.0<span className="ct-kpi-unit">m³/h</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-1 border-top" style={{ fontSize: '11px' }}>
                    <span className="text-muted">Design: 220 m³/h</span>
                    <span className="text-primary fw-bold">66% Capacity</span>
                  </div>
                </div>
              </Col>

              {/* Card 4: Fan Speed */}
              <Col sm={6}>
                <div className="ct-kpi-card h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="ct-kpi-label">Fan Speed</span>
                    <Wind size={16} className="text-info" />
                  </div>
                  <div className="ct-kpi-value">
                    {fanSpeed}<span className="ct-kpi-unit">%</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-1 border-top" style={{ fontSize: '11px' }}>
                    <span className="text-muted">RPM: {Math.round((fanSpeed / 100) * 720)}</span>
                    <span className="text-success fw-bold">VFD 41.0 Hz</span>
                  </div>
                </div>
              </Col>

              {/* Card 5: Efficiency */}
              <Col sm={6}>
                <div className="ct-kpi-card h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="ct-kpi-label">Efficiency</span>
                    <Gauge size={16} className="text-success" />
                  </div>
                  <div className="ct-kpi-value text-success">
                    87.4<span className="ct-kpi-unit">%</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-1 border-top" style={{ fontSize: '11px' }}>
                    <span className="text-muted">Approach: 2.5 °C</span>
                    <span className="text-success fw-bold">Optimal</span>
                  </div>
                </div>
              </Col>

              {/* Card 6: Current Power */}
              <Col sm={6}>
                <div className="ct-kpi-card h-100">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="ct-kpi-label">Current Power</span>
                    <Zap size={16} className="text-warning" />
                  </div>
                  <div className="ct-kpi-value text-warning">
                    12.4<span className="ct-kpi-unit">kW</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mt-2 pt-1 border-top" style={{ fontSize: '11px' }}>
                    <span className="text-muted">Current: 18.6 A</span>
                    <span className="text-warning fw-bold">PF 0.92</span>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Quick Fan VFD Modulation Slider Card */}
            <div className="ct-kpi-card mt-2">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold fs-13 d-flex align-items-center gap-1.5">
                  <Wind size={15} className="text-info" />
                  VFD Fan Speed Setpoint Modulation
                </span>
                <span className="badge bg-primary px-2 py-1 fs-12">{fanSpeed} %</span>
              </div>
              <Form.Range
                min={20}
                max={100}
                value={fanSpeed}
                onChange={(e) => setFanSpeed(Number(e.target.value))}
                disabled={!fanStatus}
                className="my-2"
              />
              <div className="d-flex justify-content-between text-muted fs-11 mt-1">
                <span>Min: 20% (144 RPM)</span>
                <span>Current: {Math.round((fanSpeed / 100) * 720)} RPM</span>
                <span>Max: 100% (720 RPM)</span>
              </div>
            </div>

            {/* Sub-system Status Matrix */}
            <div className="ct-kpi-card">
              <div className="fw-bold fs-13 mb-2 d-flex align-items-center justify-content-between">
                <span>Core Sub-systems Health</span>
                <span className="text-success small fw-semibold">All Systems Normal</span>
              </div>
              <Row className="g-2">
                <Col xs={4}>
                  <div className="p-2 rounded-2 text-center border" style={{ background: 'rgba(22, 185, 120, 0.08)' }}>
                    <div className="small text-muted" style={{ fontSize: '10px' }}>CONDENSER PUMP</div>
                    <strong className="text-success" style={{ fontSize: '12px' }}>P-1 RUNNING</strong>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-2 rounded-2 text-center border" style={{ background: 'rgba(6, 159, 240, 0.08)' }}>
                    <div className="small text-muted" style={{ fontSize: '10px' }}>MAKE-UP VALVE</div>
                    <strong className="text-primary" style={{ fontSize: '12px' }}>AUTO READY</strong>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="p-2 rounded-2 text-center border" style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
                    <div className="small text-muted" style={{ fontSize: '10px' }}>WATER SUMP</div>
                    <strong className="text-warning" style={{ fontSize: '12px' }}>85% NOMINAL</strong>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── PERSISTENT 6-TAB EQUIPMENT NAVIGATION BAR ── */}
      <div className="ct-tabs-nav-wrapper mb-4">
        <div className="d-flex align-items-center gap-2 overflow-x-auto py-1">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'parameters', label: 'Live Parameters', icon: Activity, badge: allParameters.length },
            { id: 'performance', label: 'Performance Analytics', icon: TrendingUp },
            { id: 'alarms', label: 'Alarms & Events', icon: Bell, badge: alarms.filter(a => a.status === 'ACTIVE').length, badgeVariant: 'danger' },
            { id: 'maintenance', label: 'Maintenance & Service', icon: Wrench },
            { id: 'info', label: 'Equipment Information', icon: Info },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`ct-tab-btn d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <Badge bg={tab.badgeVariant || (isActive ? 'light' : 'secondary')} text={isActive && !tab.badgeVariant ? 'primary' : undefined} className="rounded-pill px-2">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB CONTENT CONTAINERS (SWITCHED INSTANTLY WITHOUT PAGE RELOAD) ── */}
      <div className="ct-tab-body">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Row className="g-4">
              <Col lg={8}>
                <div className="ct-card p-4 h-100">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <Activity size={18} className="text-primary" />
                    Thermodynamic & Heat Rejection Overview
                  </h6>
                  <p className="text-muted small mb-4">
                    Real-time energy and mass balance for counterflow evaporative heat rejection across cooling tower CT-001.
                  </p>

                  <Row className="g-3 mb-4">
                    <Col md={4} sm={6}>
                      <div className="ct-metric-tile">
                        <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Heat Rejection Rate</div>
                        <h4 className="fw-bold my-1 text-primary">1,745 <span className="fs-6 text-muted">kW</span></h4>
                        <div className="small text-success">▲ 496.2 Tons Refrig (TR)</div>
                      </div>
                    </Col>
                    <Col md={4} sm={6}>
                      <div className="ct-metric-tile">
                        <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Thermal Efficiency</div>
                        <h4 className="fw-bold my-1 text-success">87.4 <span className="fs-6 text-muted">%</span></h4>
                        <div className="small text-muted">Range / (Range + Approach)</div>
                      </div>
                    </Col>
                    <Col md={4} sm={6}>
                      <div className="ct-metric-tile">
                        <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Specific Energy</div>
                        <h4 className="fw-bold my-1 text-info">0.035 <span className="fs-6 text-muted">kW/TR</span></h4>
                        <div className="small text-success">🟢 ASHRAE 90.1 Compliant</div>
                      </div>
                    </Col>
                  </Row>

                  <h6 className="fw-bold mb-3 text-secondary fs-13 text-uppercase tracking-wider">Sub-assembly Health Index</h6>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <div className="d-flex justify-content-between small fw-bold mb-1">
                        <span>Induced Fan & VFD Motor Assembly</span>
                        <span className="text-success">96% (Excellent)</span>
                      </div>
                      <ProgressBar variant="success" now={96} style={{ height: '7px' }} />
                    </div>
                    <div>
                      <div className="d-flex justify-content-between small fw-bold mb-1">
                        <span>PVC Fill Media & Spray Nozzles</span>
                        <span className="text-info">92% (Clean / No Biofouling)</span>
                      </div>
                      <ProgressBar variant="info" now={92} style={{ height: '7px' }} />
                    </div>
                    <div>
                      <div className="d-flex justify-content-between small fw-bold mb-1">
                        <span>Water Sump Basin & Chemical Treatment</span>
                        <span className="text-warning">84% (TDS: 1,180 µS/cm)</span>
                      </div>
                      <ProgressBar variant="warning" now={84} style={{ height: '7px' }} />
                    </div>
                  </div>
                </div>
              </Col>

              <Col lg={4}>
                <div className="ct-card p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <ShieldCheck size={18} className="text-success" />
                      Equipment Metadata
                    </h6>
                    <div className="d-flex flex-column gap-2.5 small">
                      <div className="d-flex justify-content-between border-bottom pb-1.5">
                        <span className="text-muted">Asset Tag:</span>
                        <strong className="font-monospace">CT-AHU-ROOF-001</strong>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-1.5">
                        <span className="text-muted">Tower Model:</span>
                        <strong>BAC FXV-482 Closed Circuit</strong>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-1.5">
                        <span className="text-muted">Type:</span>
                        <strong>Induced Draft Crossflow</strong>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-1.5">
                        <span className="text-muted">Design Flow:</span>
                        <strong>220 m³/h (968 GPM)</strong>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-1.5">
                        <span className="text-muted">Design Supply / Return:</span>
                        <strong>32.0 °C / 37.0 °C</strong>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-1.5">
                        <span className="text-muted">Fan Motor Power:</span>
                        <strong>18.5 kW (VFD Driven)</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">BACnet Instance:</span>
                        <strong className="font-monospace">104201</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-3 border bg-primary-subtle mt-4 text-primary">
                    <div className="fw-bold small d-flex align-items-center gap-1.5">
                      <CheckCircle2 size={16} />
                      Connected to Building Chiller Loop
                    </div>
                    <div className="fs-11 mt-1 opacity-75">
                      Interlocked with Primary Chiller CH-01 & Condenser Pump P-1.
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </motion.div>
        )}

        {/* TAB 2: LIVE PARAMETERS */}
        {activeTab === 'parameters' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="ct-card p-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                  <h5 className="fw-bold mb-1">Live Sensor Telemetry Registry</h5>
                  <p className="text-muted small mb-0">Real-time BACnet/IP data points polled with sub-second latency.</p>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <div className="position-relative">
                    <Search size={15} className="position-absolute text-muted" style={{ top: '10px', left: '12px' }} />
                    <Form.Control
                      type="text"
                      placeholder="Search telemetry..."
                      size="sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '34px', width: '220px' }}
                    />
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    {['ALL', 'Temperature', 'Fan', 'Water', 'Pump', 'Performance'].map(cat => (
                      <Button
                        key={cat}
                        variant={selectedParamCategory === cat ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => setSelectedParamCategory(cat)}
                        className="rounded-pill px-2.5 py-1"
                        style={{ fontSize: '11px' }}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="py-2.5">Parameter Name</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Live Value</th>
                      <th className="py-2.5">Unit</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Design Nominal Range</th>
                      <th className="py-2.5 text-end">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParameters.map((param, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-dark-emphasis">{param.name}</td>
                        <td>
                          <Badge bg="secondary" className="px-2 py-1 rounded-pill" style={{ fontSize: '10.5px' }}>
                            {param.category}
                          </Badge>
                        </td>
                        <td>
                          <span className="fw-bold font-monospace fs-6 text-primary">{param.value}</span>
                        </td>
                        <td className="text-muted">{param.unit || '—'}</td>
                        <td>
                          <Badge bg={param.status === 'OPTIMAL' ? 'success' : param.status === 'NORMAL' ? 'primary' : 'warning'} className="px-2 py-1 rounded-pill" style={{ fontSize: '10.5px' }}>
                            {param.status}
                          </Badge>
                        </td>
                        <td className="small text-muted font-monospace">{param.range}</td>
                        <td className="small text-muted font-monospace text-end">{param.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: PERFORMANCE ANALYTICS */}
        {activeTab === 'performance' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="ct-card p-4 mb-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div>
                  <h5 className="fw-bold mb-1">Thermal Trends & Efficiency Profiling</h5>
                  <p className="text-muted small mb-0">Comparative historical trend of supply, return water and ambient wet bulb temperature.</p>
                </div>
                <div className="btn-group btn-group-sm">
                  {['1H', '6H', '24H', '7D', '30D'].map(range => (
                    <button
                      key={range}
                      type="button"
                      className={`btn ${perfTimeRange === range ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setPerfTimeRange(range)}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={PERFORMANCE_DATA[perfTimeRange]}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="time" stroke="#888888" fontSize={11} />
                    <YAxis domain={['auto', 'auto']} stroke="#888888" fontSize={11} unit="°C" />
                    <ChartTooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="returnTemp" name="Return Water (°C)" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="supplyTemp" name="Supply Water (°C)" stroke="#06C7F5" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ambientWbt" name="Ambient WBT (°C)" stroke="#10b981" strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <Row className="g-4">
              <Col md={6}>
                <div className="ct-card p-4 h-100">
                  <h6 className="fw-bold mb-3">Thermal Approach (°C) vs Wet Bulb</h6>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={PERFORMANCE_DATA[perfTimeRange]}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="time" stroke="#888888" fontSize={11} />
                        <YAxis domain={[0, 5]} stroke="#888888" fontSize={11} unit="°C" />
                        <ChartTooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="approach" name="Approach (°C)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="ct-card p-4 h-100">
                  <h6 className="fw-bold mb-3">Cooling Tower Thermal Efficiency (%)</h6>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={PERFORMANCE_DATA[perfTimeRange]}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="time" stroke="#888888" fontSize={11} />
                        <YAxis domain={[70, 100]} stroke="#888888" fontSize={11} unit="%" />
                        <ChartTooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                        <Bar dataKey="efficiency" name="Efficiency (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Col>
            </Row>
          </motion.div>
        )}

        {/* TAB 4: ALARMS & EVENTS */}
        {activeTab === 'alarms' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="ct-card p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h5 className="fw-bold mb-1">Alarm & Incident Log</h5>
                  <p className="text-muted small mb-0">Active safety limits, temperature alarms and maintenance threshold notifications.</p>
                </div>
                <Badge bg="danger" className="px-3 py-2 rounded-pill fs-12">
                  {alarms.filter(a => a.status === 'ACTIVE').length} Active Alarms
                </Badge>
              </div>

              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="py-2.5">Alarm ID</th>
                      <th className="py-2.5">Severity</th>
                      <th className="py-2.5">Alarm Name</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Trigger Value</th>
                      <th className="py-2.5">Threshold Limit</th>
                      <th className="py-2.5">Timestamp</th>
                      <th className="py-2.5">State</th>
                      <th className="py-2.5 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alarms.map((alm) => (
                      <tr key={alm.id} className={alm.status === 'ACTIVE' ? 'table-warning-subtle' : ''}>
                        <td className="font-monospace fw-bold text-muted">{alm.id}</td>
                        <td>
                          <Badge bg={alm.severity === 'CRITICAL' ? 'danger' : alm.severity === 'WARNING' ? 'warning' : 'info'} className="px-2 py-1 rounded-pill" style={{ fontSize: '10px' }}>
                            {alm.severity}
                          </Badge>
                        </td>
                        <td className="fw-semibold text-dark-emphasis">{alm.name}</td>
                        <td><Badge bg="secondary" className="px-2 py-1 rounded-pill" style={{ fontSize: '10px' }}>{alm.category}</Badge></td>
                        <td className="font-monospace fw-bold text-danger">{alm.value}</td>
                        <td className="font-monospace text-muted">{alm.threshold}</td>
                        <td className="small text-muted">{alm.time}</td>
                        <td>
                          <span className={`badge ${alm.status === 'ACTIVE' ? 'bg-danger' : alm.status === 'ACKNOWLEDGED' ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {alm.status}
                          </span>
                        </td>
                        <td className="text-end">
                          {alm.status === 'ACTIVE' ? (
                            <Button variant="outline-primary" size="sm" onClick={() => handleAcknowledgeAlarm(alm.id)} style={{ fontSize: '11px', padding: '2px 8px' }}>
                              Acknowledge
                            </Button>
                          ) : (
                            <span className="text-muted small">✓ Ok</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: MAINTENANCE & SERVICE */}
        {activeTab === 'maintenance' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Row className="g-4">
              <Col lg={8}>
                <div className="ct-card p-4 h-100">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <Wrench size={18} className="text-primary" />
                    Scheduled Preventative Maintenance Log
                  </h5>
                  <p className="text-muted small mb-4">
                    Track operating hours, chemical water treatment dosing, nozzle inspections and bearing lubrication cycles.
                  </p>

                  <div className="d-flex flex-column gap-3">
                    <div className="p-3 rounded-3 border d-flex justify-content-between align-items-center ct-metric-tile">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-2 bg-success-subtle text-success">
                          <Check size={18} />
                        </div>
                        <div>
                          <div className="fw-bold">Nozzle Inspection & Drift Eliminator Descaling</div>
                          <div className="small text-muted">Completed on 15 Sept 2026 by Technicians Team B</div>
                        </div>
                      </div>
                      <Badge bg="success">COMPLETED</Badge>
                    </div>

                    <div className="p-3 rounded-3 border d-flex justify-content-between align-items-center ct-metric-tile">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-2 bg-primary-subtle text-primary">
                          <Clock size={18} />
                        </div>
                        <div>
                          <div className="fw-bold">Fan Motor Bearings Regreasing (7,500 Hrs Interval)</div>
                          <div className="small text-muted">Due in 180 Operating Hours (Approx 12 Days)</div>
                        </div>
                      </div>
                      <Badge bg="primary">SCHEDULED</Badge>
                    </div>

                    <div className="p-3 rounded-3 border d-flex justify-content-between align-items-center ct-metric-tile">
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-2 bg-warning-subtle text-warning">
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <div className="fw-bold">Biocide Dosing & Legionella Water Quality Lab Test</div>
                          <div className="small text-muted">Mandatory Quarterly Compliance Audit</div>
                        </div>
                      </div>
                      <Badge bg="warning" text="dark">PENDING</Badge>
                    </div>
                  </div>
                </div>
              </Col>

              <Col lg={4}>
                <div className="ct-card p-4 h-100">
                  <h6 className="fw-bold mb-3">Operating Hours & Lifespan</h6>
                  <div className="p-3 rounded-3 border mb-3 text-center ct-metric-tile">
                    <div className="text-muted small text-uppercase">Cumulative Fan Run Hours</div>
                    <h3 className="fw-bold my-1 text-primary">6,420 <span className="fs-6 text-muted">Hrs</span></h3>
                    <div className="small text-muted">Next major overhaul: 7,500 Hrs</div>
                    <ProgressBar variant="primary" now={(6420 / 7500) * 100} className="mt-2" style={{ height: '6px' }} />
                  </div>

                  <div className="p-3 rounded-3 border text-center ct-metric-tile">
                    <div className="text-muted small text-uppercase">Condenser Pump P-1 Hours</div>
                    <h3 className="fw-bold my-1 text-success">8,190 <span className="fs-6 text-muted">Hrs</span></h3>
                    <div className="small text-muted">Seal replacement check: 10,000 Hrs</div>
                    <ProgressBar variant="success" now={(8190 / 10000) * 100} className="mt-2" style={{ height: '6px' }} />
                  </div>
                </div>
              </Col>
            </Row>
          </motion.div>
        )}

        {/* TAB 6: EQUIPMENT INFORMATION */}
        {activeTab === 'info' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="ct-card p-4">
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <FileText size={18} className="text-primary" />
                Technical Specification Sheet & Commissioning Data
              </h5>
              <Row className="g-4">
                <Col md={6}>
                  <h6 className="fw-bold text-secondary fs-13 text-uppercase mb-3">Mechanical & Thermodynamic Design</h6>
                  <div className="d-flex flex-column gap-2 small">
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">Equipment Name:</span>
                      <strong>Induced Draft Counterflow Cooling Tower</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">Manufacturer / Brand:</span>
                      <strong>Baltimore Aircoil Company (BAC)</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">Model Number:</span>
                      <strong className="font-monospace">FXV-482-P</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">Nominal Heat Rejection:</span>
                      <strong>1,758 kW (500 TR)</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">Design Water Flow:</span>
                      <strong>220 m³/h (968 GPM)</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">Design Entering / Leaving Water:</span>
                      <strong>37.0 °C / 32.0 °C (ΔT = 5.0 °C)</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Design Ambient Wet Bulb:</span>
                      <strong>21.0 °C</strong>
                    </div>
                  </div>
                </Col>

                <Col md={6}>
                  <h6 className="fw-bold text-secondary fs-13 text-uppercase mb-3">Electrical & Automation Network</h6>
                  <div className="d-flex flex-column gap-2 small">
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">Fan Motor Specs:</span>
                      <strong>18.5 kW, 415V 3-Phase 50Hz TEFC</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">VFD Controller:</span>
                      <strong>Danfoss VLT HVAC Drive FC-102</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">Communication Protocol:</span>
                      <strong>BACnet/IP & Modbus-TCP</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">IP Address / Gateway:</span>
                      <strong className="font-monospace">192.168.10.42 / 24</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">Installation Location:</span>
                      <strong>Plant Room Roof Deck #3</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                      <span className="text-muted">Commissioning Date:</span>
                      <strong>January 12, 2025</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Warranty & Service Contract:</span>
                      <strong className="text-success">Active through Jan 2028</strong>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── EXPANDED FULLSCREEN MODAL VIEW ── */}
      <Modal
        show={isExpanded}
        onHide={() => setIsExpanded(false)}
        fullscreen={true}
        className="ct-fullscreen-modal"
      >
        <Modal.Header closeButton className="border-bottom border-secondary bg-dark text-white px-4 py-3">
          <div className="d-flex align-items-center gap-3">
            <div className="ct-icon-box d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <ThermometerSnowflake size={20} />
            </div>
            <div>
              <Modal.Title className="fw-bold fs-5 mb-0">Cooling Tower CT-001 — Fullscreen Digital Twin SCADA</Modal.Title>
              <div className="small text-muted">Central Utility Plant • Chiller Interlock Online</div>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="bg-dark p-4 text-white d-flex flex-column justify-content-between" style={{ background: '#080d1a' }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <div className="d-flex align-items-center gap-2">
              <Compass size={18} className="text-info" />
              <span className="fw-bold text-uppercase fs-13 text-light">Interactive High-Definition Synoptic Flow</span>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {[
                { id: 'ALL', label: '⚡ Full Cycle', key: 'FILL_PACK' },
                { id: 'HOT', label: '① Hot Return (38.2°)', key: 'HOT_PIPE' },
                { id: 'SPRAY', label: '② Spray & Fill', key: 'SPRAY_HEADER' },
                { id: 'AIR', label: '③ Air & Exhaust', key: 'FAN_COWL' },
                { id: 'COLD', label: '④ Basin (32.5°)', key: 'BASIN' },
                { id: 'PUMP', label: '⑤ Pump P-1 ➔ Chiller', key: 'PUMP' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  className={`ct-stage-pill ${flowStep === st.id ? 'active' : ''}`}
                  onClick={() => {
                    setFlowStep(st.id);
                    setInspectedKey(st.key);
                    setIsSimulatingCycle(false);
                  }}
                >
                  {st.label}
                </button>
              ))}
              <Button
                variant={isSimulatingCycle ? 'success' : 'outline-primary'}
                size="sm"
                onClick={() => setIsSimulatingCycle(!isSimulatingCycle)}
                className="fw-bold px-3 ms-2"
              >
                {isSimulatingCycle ? <Pause size={14} className="me-1" /> : <Play size={14} className="me-1" />}
                {isSimulatingCycle ? 'Pause' : 'Play Tour'}
              </Button>
            </div>
          </div>

          {/* Dynamic Process Cycle Explanation Banner in Fullscreen Modal */}
          <div 
            className="p-3 px-3.5 rounded-3 border d-flex align-items-center gap-3 transition-all mb-3 shadow-sm"
            style={{ 
              background: flowStep === 'HOT' ? 'rgba(249, 115, 22, 0.14)' :
                          flowStep === 'SPRAY' ? 'rgba(6, 159, 240, 0.14)' :
                          flowStep === 'AIR' ? 'rgba(244, 63, 94, 0.14)' :
                          flowStep === 'COLD' ? 'rgba(2, 132, 199, 0.14)' :
                          flowStep === 'PUMP' ? 'rgba(22, 185, 120, 0.14)' :
                          'rgba(14, 165, 233, 0.10)',
              borderColor: flowStep === 'HOT' ? 'rgba(249, 115, 22, 0.45)' :
                           flowStep === 'SPRAY' ? 'rgba(6, 159, 240, 0.45)' :
                           flowStep === 'AIR' ? 'rgba(244, 63, 94, 0.45)' :
                           flowStep === 'COLD' ? 'rgba(2, 132, 199, 0.45)' :
                           flowStep === 'PUMP' ? 'rgba(22, 185, 120, 0.45)' :
                           'rgba(14, 165, 233, 0.3)',
              minHeight: '48px'
            }}
          >
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center p-1.5 flex-shrink-0 shadow-sm"
              style={{ 
                background: flowStep === 'HOT' ? '#f97316' :
                            flowStep === 'SPRAY' ? '#069FF0' :
                            flowStep === 'AIR' ? '#f43f5e' :
                            flowStep === 'COLD' ? '#0284c7' :
                            flowStep === 'PUMP' ? '#16B978' :
                            '#0ea5e9',
                color: '#ffffff',
                width: '28px',
                height: '28px'
              }}
            >
              <Activity size={15} />
            </div>
            <div className="flex-grow-1" style={{ fontSize: '12.5px', lineHeight: '1.5', fontWeight: '500' }}>
              {flowStep === 'HOT' && (
                <span><strong className="text-warning">Step 1 (Hot Inflow):</strong> Hot condenser water (<strong className="text-white">38.2 °C</strong>) loaded with building heat returns from Chiller condenser through supply piping at <strong className="text-white">145.0 m³/h</strong>.</span>
              )}
              {flowStep === 'SPRAY' && (
                <span><strong className="text-info">Step 2 & 3 (Spray & Film Fill):</strong> 6 brass nozzles atomize hot water over PVC cross-fluted fill pack (<strong className="text-white">ΔT 5.7 °C cooling range</strong>), maximizing evaporative heat rejection.</span>
              )}
              {flowStep === 'AIR' && (
                <span><strong className="text-danger">Step 4 (Induced Draft Air & Exhaust):</strong> Top VFD fan (<strong className="text-white">{fanSpeed}% speed | {Math.round((fanSpeed / 100) * 720)} RPM</strong>) pulls ambient air through side louvers and discharges warm moist vapor plume.</span>
              )}
              {flowStep === 'COLD' && (
                <span><strong className="text-primary">Step 5 (Cold Sump Basin):</strong> Cooled water (<strong className="text-white">32.5 °C</strong>) gravity-drains into the sump basin (<strong className="text-white">85% nominal level</strong>), ready for immediate return.</span>
              )}
              {flowStep === 'PUMP' && (
                <span><strong className="text-success">Step 6 (Pump Recirculation):</strong> Condenser Pump <strong className="text-white">P-1 (1,450 RPM | 2.85 bar | 15.2 kW)</strong> pumps chilled <strong className="text-white">32.5 °C</strong> water back to the Chiller condenser.</span>
              )}
              {flowStep === 'ALL' && (
                <span><strong className="text-info">Complete Closed Loop:</strong> Continuous thermodynamic cycle where hot water (<strong className="text-white">38.2°C</strong>) is evaporatively cooled to <strong className="text-white">32.5°C</strong> by ambient air and pumped back to the chiller condenser.</span>
              )}
            </div>
          </div>

          {/* Big Canvas SVG */}
          <div className="my-auto py-2">
            {renderSvgSchematic(true)}
          </div>

          {/* Fullscreen Telemetry Bottom Bar */}
          <div className="p-3 rounded-3 border border-secondary mt-3" style={{ background: 'rgba(15, 23, 42, 0.8)' }}>
            <Row className="g-3 align-items-center">
              <Col md={3}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-2" style={{ background: activeInspectData.color, color: '#fff' }}>
                    <InspectIcon size={16} />
                  </div>
                  <div>
                    <div className="small text-muted text-uppercase">Inspected Component</div>
                    <strong className="fs-14" style={{ color: activeInspectData.color }}>{activeInspectData.title}</strong>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="d-flex align-items-center justify-content-around flex-wrap gap-2 text-center">
                  {activeInspectData.telemetry.map((t, i) => (
                    <div key={i} className="px-2">
                      <div className="text-muted small" style={{ fontSize: '11px' }}>{t.label}</div>
                      <strong className="fs-13 text-white">{t.value}</strong>
                    </div>
                  ))}
                </div>
              </Col>
              <Col md={3} className="text-end">
                <Button variant="outline-light" size="sm" onClick={() => setIsExpanded(false)} className="px-3">
                  <Minimize2 size={14} className="me-1.5" /> Close Fullscreen
                </Button>
              </Col>
            </Row>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CoolingTower;
